/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'kb/common/html',
    'kb/common/dom',
    'kb/widget/widgetSet',
    'kb/service/client/Workspace',
    'kb/service/utils',
    'kb/data/taxon',
    'kb/data/assembly',
    'thrift'
], function (Promise, html, dom, WidgetSet, Workspace, serviceUtils, Taxon, Assembly, Thrift) {
    'use strict';
    function factory(config) {
        var parent, container, runtime = config.runtime,
            widgetSet = WidgetSet.make({runtime: runtime}),
            layout, places = {},
            
            div = html.tag('div'),
            h1 = html.tag('h1'), h2 = html.tag('h2'), h3 = html.tag('h3'),
            ul = html.tag('ul'), li = html.tag('li'),
            a = html.tag('a'), i = html.tag('i'),
            table = html.tag('table'), tr = html.tag('tr'),
            th = html.tag('th'), td = html.tag('td'), span = html.tag('span'), button = html.tag('button');

        function addPlace(name) {
            var id = html.genId();
            places[name] = id;
            return id;
        }
        function getPlace(name) {
            return places[name];
        }
        function setPlace(name, content) {
            var node = document.getElementById(getPlace(name));
            if (node) {
                node.innerHTML = content;
            }
        }

        function pause() {
            return i({class: 'fa fa-pause'});
        }

        function makeCollapsePanel(arg) {
            var klass = arg.class || 'default',
                headerId = html.genId(),
                collapseId = html.genId();

            return div({class: 'panel panel-' + klass}, [
                div({class: 'panel-heading', role: 'tab', id: headerId}, [
                    span({class: 'panel-title'}, [
                        a({role: 'button', dataToggle: 'collapse', href: '#' + collapseId, areaExpanded: 'true', ariaControls: collapseId}, arg.title)
                    ])
                ]),
                div({id: collapseId, class: 'panel-collapse collapse in', role: 'tabpanel', ariaLabelledby: headerId}, [
                    div({class: 'panel-body'}, [
                        arg.content
                    ])
                ])
            ]);
        }

        function renderLayout() {
            return div({class: 'container-fluid'}, [
                div({class: 'col-md-6'}, [
                    makeCollapsePanel({
                        title: 'Status',
                        content: div({
                            style: {height: '150px', overflowY: 'scroll', backgroundColor: '#000', color: 'green', fontSize: '80%'},
                            dataElement: 'messages'}, [
                            'a line of text<br>And some more<br>And more'
                        ])
                    }),
                    makeCollapsePanel({
                        title: 'Taxon Compatible Objects',
                        content: div({class: 'container-fluid'}, [
                            makeCollapsePanel({
                                title: 'KBaseGenomes.Genome',
                                content: div({id: addPlace('genomeBrowser')}, pause())
                            }),
                            makeCollapsePanel({
                                title: 'KBaseGenomeAnnotations.Taxon',
                                content: div({id: addPlace('taxonBrowser')}, pause())
                            })

                        ])
                    }),
                    makeCollapsePanel({
                        title: 'Assembly Compatible Objects',
                        content: div({class: 'container-fluid'}, [
                            makeCollapsePanel({
                                title: 'KBaseGenomes.ContigSet',
                                content: div({id: addPlace('contigsetBrowser')}, pause())
                            }),
                            makeCollapsePanel({
                                title: 'KBaseGenomeAnnotations.Assembly',
                                content: div({id: addPlace('assemblyBrowser')}, pause())
                            })

                        ])
                    }),
                    makeCollapsePanel({
                        title: 'Genome Annotation Compatible Objects',
                        content: div({class: 'container-fluid'}, [
                            makeCollapsePanel({
                                title: 'KBaseGenomes.Genome',
                                content: div({id: addPlace('genomeBrowser2')}, pause())
                            }),
                            makeCollapsePanel({
                                title: 'KBaseGenomeAnnotations.GenomeAnnotation',
                                content: div({id: addPlace('genomeAnnotationsBrowser')}, pause())
                            })

                        ])
                    })
                ]),
                div({class: 'col-md-6'}, [
                    makeCollapsePanel({
                        title: 'Object Viewer',
                        content: div({id: addPlace('output')})
                    })
                ])
            ]);
        }

        function formatValue(valueToFormat, options) {
            var limit = (options && options.limit) || 10;

            function formatter(value) {
                if (value === undefined) {
                    return '* undefined *';
                }
                if (value === null) {
                    return '* null * ';
                }
                if (value.pop) {
                    if (value.length === 0) {
                        return '* empty array *';
                    }
                    if (value.length > limit) {
                        value = value.slice(0, limit);
                        value.push('... <i>truncated at ' + limit + ' items</i>');
                    }
                    return '<ol>' + value.map(function (x) {
                        return '<li>' + formatter(x) + '</li>';
                    }).join('\n') + '</ol>';
                }
                if (value === '') {
                    return '* empty string *';
                }
                if (typeof value === 'object') {
                    var keys = Object.keys(value),
                        keyLen = keys.length;
                    if (keyLen === 0) {
                        return '* empty object *';
                    }
                    if (keyLen > limit) {
                        keys = keys.slice(0, limit);
                        keys.push('...');
                        value['...'] = '<i>truncated at ' + limit + ' items (' + (keyLen - keys.length - 1) +' more)</i>';
                    }
                    return '<ol>' + keys.map(function (key) {
                        return '<li><i>' + key + '</i> -> ' + formatter(value[key]) + '</li>';
                    }).join('\n') + '</ol>';
                }
                return value;
            }
            return formatter(valueToFormat);
        }
        function toArray(x) {
            return Array.prototype.slice.call(x);
        }
        function showField(field, value, time, options) {
            var displayValue = formatValue(value, options),
                output = document.getElementById(getPlace('output')),
                node = output.querySelector('[data-field="' + field + '"]');
            if (node) {
                toArray(node.querySelectorAll('[data-element="label"]')).forEach(function (el) {
                    el.innerHTML = field;
                });
                toArray(node.querySelectorAll('[data-element="value"]')).forEach(function (el) {
                    el.innerHTML = displayValue;
                });
                toArray(node.querySelectorAll('[data-element="type"]')).forEach(function (el) {
                    el.innerHTML = (typeof value);
                });
                toArray(node.querySelectorAll('[data-element="time"]')).forEach(function (el) {
                    el.innerHTML = String(time);
                });
            }
        }
        function addMessage(msg) {
            var node = container.querySelector('[data-element="messages"]'),
                messageNode = document.createElement('div');
            messageNode.innerHTML = div({class: 'messages-message'}, msg);
            node.appendChild(messageNode);
        }

        var errorId = 0;
        function nextErrorId() {
            errorId += 1;
            return errorId;
        }
        function showError(err) {
            addMessage('ERROR!');
            addMessage(err.message);
            console.error('ERROR!');
            console.error(err);
        }

        function clearMessages() {
            var node = container.querySelector('[data-element="messages"]');
            node.innerHTML = '';
        }
        function renderTaxon(type, ref) {
            var methods = [
                {
                    name: 'getParent',
                    type: 'string'
                },
                {
                    name: 'getChildren',
                    type: 'array of string'
                },
                {
                    name: 'getGenomeAnnotations',
                    type: 'array of string '
                },
                {
                    name: 'getScientificLineage',
                    type: 'array of string'
                },
                {
                    name: 'getScientificName',
                    type: 'array of string'
                },
                {
                    name: 'getTaxonomicId',
                    type: 'array of string'
                },
                {
                    name: 'getKingdom',
                    type: 'array of string'
                },
                {
                    name: 'getDomain',
                    type: 'array of string'
                },
                {
                    name: 'getGeneticCode',
                    type: 'array of string'
                },
                {
                    name: 'getAliases',
                    type: 'array of string'
                }
            ], workspace = new Workspace(runtime.getConfig('services.workspace.url'), {
                token: runtime.service('session').getAuthToken()
            }),
                results = {};
            
            return Promise.try(function () {
            
                var layout = div([
                    div({style: {fontWeight: 'bold'}}, 'Type'),
                    div(type),
                    div({style: {fontWeight: 'bold'}}, 'Ref'),
                    div(ref),
                    div({style: {fontWeight: 'bold'}}, 'Name'),
                    div({dataElement: 'name'}),
                    
                    table({class: 'table table-striped'}, [
                        tr([
                            th('Method'),
                            th('Result'),
                            th('Type'),
                            th('Time')
                        ])
                    ].concat(methods.map(function (method) {
                        return tr({dataField: method.name}, [
                            td({dataElement: 'method'}, method.name),
                            td({dataElement: 'value'}),
                            td({dataElement: 'type'}),
                            td({dataElement: 'time'})
                        ]);
                    })))
                ]);
                
                setPlace('output', layout);
                
                return workspace.get_object_info_new({
                    objects: [{ref: ref}],
                    includeMetadata: 1,
                    ignoreErrors: 1
                })
                .then(function (objectInfo) {
                    return serviceUtils.object_info_to_object(objectInfo[0]);
                })
                .then(function (objectInfo) {
                    var place = getPlace('output');
                        document.getElementById(place).querySelector('[data-element="name"]').innerHTML = objectInfo.name;
                    return Taxon.make({
                        ref: ref,
                        url: runtime.getConfig('services.taxon_api.url'),
                        token: runtime.service('session').getAuthToken(),
                        timeout: 30000
                    });
                })
                .then(function (taxon) {
                    addMessage('Starting method async loop');
                    var start = new Date().getTime();
                    return new Promise(function (resolve, reject) {
                        function next(nextMethods) {
                            if (nextMethods.length === 0) {
                                resolve();
                                return;
                            }
                            var method = nextMethods.shift();
                            if (!method.ignore) {
                                showField(method.name, 'Loading...');
                                var args = method.arguments && method.arguments.map(function (argument) {
                                    if (typeof argument === 'function') {
                                        return argument();
                                    }
                                    return argument;
                                });
                                taxon[method.name].apply(taxon, args)
                                    .then(function (value) {
                                        results[method.name] = value;
                                        var elapsed = (new Date()).getTime() - start;
                                        addMessage('showing field ' + method.name);
                                        showField(method.name, value, elapsed, {limit: method.limit});
                                        return next(nextMethods);
                                    })
                                    .catch(Taxon.AttributeException, function (err) {
                                        showField(method.name, '* n/a to this object *');
                                        return next(nextMethods);
                                    })
                                    .catch(function (err) {
                                        var id = nextErrorId();
                                        showField(method.name, 'ERROR - see log #' + id);
                                        console.log('ERROR #' + id + ' : ' + method);
                                        console.log(err);
                                        reject(err);
                                    });
                            } else {
                                next(nextMethods);
                            }
                            return null;
                        }
                        next(methods);
                    });
                })
                
                .then(function () {
                    addMessage('done');
                })
                .catch(function (err) {
                    addMessage('done, with error');
                    console.log('ERROR');
                    if (err instanceof Taxon.ClientException) {
                        showError(err);
                    } else if (err instanceof Thrift.TTransportError) {
                        showError(err);
                    } else if (err instanceof Thrift.TException) {
                        showError({
                            name: 'ThriftException',
                            reason: err.name,
                            message: err.getMessage()
                        });
                    } else if (err instanceof Taxon.AttributeException) {
                        showError({
                            name: 'AttributeException',
                            reason: err.name,
                            message: 'This attribute is not supported for this object'
                        });
                    } else {
                        console.log(err);
                        showError({
                            type: 'UnknownError',
                            message: 'Check the browser console'
                        });
                    }
                });
            });
        }
        
        
        function renderAssembly(type, ref) {
            var methods = [
                {
                    name: 'getAssemblyId',
                    type: 'string'
                },
                {
                    name: 'getGenomeAnnotation',
                    type: ''
                },
                {
                    name: 'getExternalSourceInfo',
                    type: ''
                },
                {
                    name: 'getStats',
                    type: ''
                },
                {
                    name: 'getNumberContigs',
                    type: ''
                },
                {
                    name: 'getGCContent',
                    type: ''
                },
                {
                    name: 'getDNASize',
                    type: ''
                },
                {
                    name: 'getContigIds',
                    type: ''
                },
                {
                    name: 'getContigLengths',
                    type: '',
                    arguments: [
                        function () {
                            if (results.contigIds) {
                                return results.contigIds.slice(0, 5);
                            }
                            return [];
                        }
                    ]
                },
                {
                    name: 'getContigGCContent',
                    type: '',
                    arguments: [
                        function () {
                            if (results.contigIds) {
                                return results.contigIds.slice(0, 5);
                            }
                            return [];
                        }
                    ]
                },
                {
                    name: 'getContigs',
                    type: '',
                    arguments: [
                        function () {
                            if (results.contigIds) {
                                return results.contigIds.slice(0, 5);
                            }
                            return [];
                        }
                    ]
                }
            ], workspace = new Workspace(runtime.getConfig('services.workspace.url'), {
                token: runtime.service('session').getAuthToken()
            }),
                results = {};
            
            return Promise.try(function () {
            
                var layout = div([
                    div({style: {fontWeight: 'bold'}}, 'Type'),
                    div(type),
                     div({style: {fontWeight: 'bold'}}, 'Ref'),
                    div(ref),
                    div({style: {fontWeight: 'bold'}}, 'Name'),
                    div({dataElement: 'name'}),
                    
                    table({class: 'table table-striped'}, [
                        tr([
                            th('Method'),
                            th('Result'),
                            th('Type'),
                            th('Time')
                        ])
                    ].concat(methods.map(function (method) {
                        return tr({dataField: method.name}, [
                            td({dataElement: 'method'}, method.name),
                            td({dataElement: 'value'}),
                            td({dataElement: 'type'}),
                            td({dataElement: 'time'})
                        ]);
                    })))
                ]);
                
                setPlace('output', layout);
                
                return workspace.get_object_info_new({
                    objects: [{ref: ref}],
                    includeMetadata: 1,
                    ignoreErrors: 1
                })
                .then(function (objectInfo) {
                    return serviceUtils.object_info_to_object(objectInfo[0]);
                })
                .then(function (objectInfo) {
                    var place = getPlace('output');
                        document.getElementById(place).querySelector('[data-element="name"]').innerHTML = objectInfo.name;
                    return Assembly.make({
                        ref: ref,
                        url: runtime.getConfig('services.assembly_api.url'),
                        token: runtime.service('session').getAuthToken(),
                        timeout: 30000
                    });
                })
                .then(function (api) {
                    addMessage('Starting method async loop');
                    var start = new Date().getTime();
                    return new Promise(function (resolve, reject) {
                        function next(nextMethods) {
                            if (nextMethods.length === 0) {
                                resolve();
                                return;
                            }
                            var method = nextMethods.shift();
                            if (!method.ignore) {
                                showField(method.name, 'Loading...');
                                var args = method.arguments && method.arguments.map(function (argument) {
                                    if (typeof argument === 'function') {
                                        return argument();
                                    }
                                    return argument;
                                });
                                api[method.name].apply(api, args)
                                    .then(function (value) {
                                        results[method.name] = value;
                                        var elapsed = (new Date()).getTime() - start;
                                        addMessage('showing field ' + method.name);
                                        showField(method.name, value, elapsed, {limit: method.limit});
                                        return next(nextMethods);
                                    })
                                    .catch(Assembly.AttributeException, function (err) {
                                        showField(method.name, '* n/a to this object *');
                                        return next(nextMethods);
                                    })
                                    .catch(function (err) {
                                        var id = nextErrorId();
                                        showField(method.name, 'ERROR - see log #' + id);
                                        console.log('ERROR #' + id + ' : ' + method);
                                        console.log(err);
                                        reject(err);
                                    });
                            } else {
                                next(nextMethods);
                            }
                            return null;
                        }
                        next(methods);
                    });
                })
                
                .then(function () {
                    addMessage('done');
                })
                .catch(function (err) {
                    addMessage('done, with error');
                    console.log('ERROR');
                    if (err instanceof Assembly.AssemblyException) {
                        showError(err);
                    } else if (err instanceof Thrift.TTransportError) {
                        showError(err);
                    } else if (err instanceof Thrift.TException) {
                        showError({
                            name: 'ThriftException',
                            reason: err.name,
                            message: err.getMessage()
                        });
                    } else if (err instanceof Assembly.AttributeException) {
                        showError({
                            name: 'AttributeException',
                            reason: err.name,
                            message: 'This attribute is not supported for this object'
                        });
                    } else {
                        console.log(err);
                        showError({
                            type: 'UnknownError',
                            message: 'Check the browser console'
                        });
                    }
                });
            });
        }

        function renderType(api, type, objects) {           
            return table({class: 'table', style: {maxHeight: '300px', overflowY: 'scroll'}}, [
                tr([
                    th('#'),
                    th('Name'),
                    th('Version'),
                    th('Workspace'),
                    th('Type Version')
                ])].concat(objects.map(function (object, index) {
                var objectInfo = serviceUtils.object_info_to_object(object);
                return tr([
                    td({style: {textAlign: 'right', fontStyle: 'italic', color: 'silver'}}, String(index)),
//                    td(span({dataAction: 'selectObject', dataObjectRef: objectInfo.ref, style: {cursor: 'pointer'}}, objectInfo.name)),
                    td(button({class: 'btn btn-default', dataAction: 'selectObject', dataObjectRef: objectInfo.ref, dataObjectType: type, dataApi: api}, objectInfo.name)),
                    td(objectInfo.version),
                    td(objectInfo.ws),
                    td(objectInfo.typeMajorVersion + '.' + objectInfo.typeMinorVersion)
                ]);
            })));
        }

        function loadType(workspace, api, id, type) {
            setPlace(id, html.loading());
            return workspace.get_type_info(type)
                .then(function (typeInfo) {
                    return [typeInfo, workspace.list_objects({
                            type: type,
                            includeMetadata: 1
                        })];
                })
                .spread(function (typeInfo, objects) {
                    return div({style: {maxHeight: '300px', overflowY: 'scroll'}}, [
                        renderType(api, type, objects)
                    ]);
                })
                .then(function (content) {
                    setPlace(id, content);
                });
        }

        function sync() {
            var workspace = new Workspace(runtime.getConfig('services.workspace.url'), {
                token: runtime.service('session').getAuthToken()
            });

            addMessage('loading genome type info ...');
            return loadType(workspace, 'taxon', 'genomeBrowser', 'KBaseGenomes.Genome')
                .then(function () {
                    addMessage('loaded genomes, now taxon...');
                    return loadType(workspace, 'taxon', 'taxonBrowser', 'KBaseGenomeAnnotations.Taxon');
                })
                .then(function () {
                    addMessage('taxon finished. Loading contigset ...');
                    return loadType(workspace, 'assembly', 'contigsetBrowser', 'KBaseGenomes.ContigSet');
                })
                .then(function () {
                    addMessage('contigset finished, Loading ');
                    return loadType(workspace, 'assembly', 'assemblyBrowser', 'KBaseGenomeAnnotations.Assembly');
                })
                .then(function () {
                    addMessage('assembly finished. Loading genomes again  ...');
                    return loadType(workspace, 'genomeAnnotation', 'genomeBrowser2', 'KBaseGenomes.Genome');
                })
                .then(function () {
                    addMessage('genome finished, Loading ');
                    return loadType(workspace, 'genomeAnnotation', 'genomeAnnotationsBrowser', 'KBaseGenomeAnnotations.GenomeAnnotation');
                })
                .catch(function (err) {
                    console.error('ERROR');
                    console.error(err);
                });
        }

        function syncParallel() {
            var workspace = new Workspace(runtime.getConfig('services.workspace.url'), {
                token: runtime.service('session').getAuthToken()
            });

            addMessage('loading genome type info ...');
            return Promise.all([
                loadType(workspace, 'taxon', 'genomeBrowser', 'KBaseGenomes.Genome'),
                loadType(workspace, 'taxon', 'taxonBrowser', 'KBaseGenomeAnnotations.Taxon'),
                loadType(workspace, 'assembly', 'contigsetBrowser', 'KBaseGenomes.ContigSet'),
                loadType(workspace, 'assembly', 'assemblyBrowser', 'KBaseGenomeAnnotations.Assembly'),
                loadType(workspace, 'genomeAnnotation', 'genomeBrowser2', 'KBaseGenomes.Genome'),
                loadType(workspace, 'genomeAnnotation', 'genomeAnnotationsBrowser', 'KBaseGenomeAnnotations.GenomeAnnotation')
            ]);
        }

       

        function init(config) {
            layout = renderLayout();
            return widgetSet.init(config);
        }

        function attach(node) {
            parent = node;
            container = node.appendChild(document.createElement('div'));
            container.innerHTML = layout;

            return widgetSet.attach(container);
        }

        function setupEvents() {
            container.addEventListener('click', function (e) {
                var action = e.target.getAttribute('data-action'),
                    objectRef = e.target.getAttribute('data-object-ref'),
                    objectType = e.target.getAttribute('data-object-type'),
                    api = e.target.getAttribute('data-api');
                if (action && action === 'selectObject') {
                    switch (api) {
                        case 'taxon': 
                            renderTaxon(objectType, objectRef);                               
                            break;
                        case 'assembly':
                            renderAssembly(objectType, objectRef);
                            break;
                    }
                    
                    
                    // alert('Selected ' + objectRef + ', of type ' + objectType);
                }
            });
        }

        function start(params) {
            clearMessages();
            addMessage('starting...');
            setupEvents();
            return widgetSet.start(params);
        }

        function run(params) {
            addMessage('Loading data...');
            return syncParallel()
                .then(function () {
                    return widgetSet.run(params);
                })
                .then(function () {
                    addMessage('Done.');
                });
        }

        function stop() {
            return widgetSet.stop();
        }

        function detach() {
            parent.removeChild(container);
            return widgetSet.detach();
        }

        function destroy() {
            return widgetSet.destroy();
        }

        return {
            init: init,
            attach: attach,
            start: start,
            run: run,
            stop: stop,
            detach: detach,
            destroy: destroy
        };
    }
    return {
        make: function (config) {
            return factory(config);
        }
    };
});