/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'kb/common/html',
    'kb/common/dom',
    'kb/widget/widgetSet',
    'kb/service/client/workspace',
    'kb/service/utils',
    'kb_sdk_clients/TaxonAPI/dev/TaxonAPIClient',
    'kb_sdk_clients/AssemblyAPI/dev/AssemblyAPIClient',
    'kb_sdk_clients/GenomeAnnotationAPI/dev/GenomeAnnotationAPIClient',
    'kb_sdk_clients/exceptions'
], function (Promise, html, dom, WidgetSet, Workspace, serviceUtils, TaxonAPI, AssemblyAPI, GenomeAnnotationAPI, exceptions) {
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
            th = html.tag('th'), td = html.tag('td'), span = html.tag('span'), button = html.tag('button'),
            colgroup = html.tag('colgroup'), col = html.tag('col');

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
                    var arrayLen = value.length;
                    if (arrayLen === 0) {
                        return '* empty array *';
                    }
                    if (value.length > limit) {
                        value = value.slice(0, limit);
                        value.push('... <i>truncated at ' + limit + ' items(' + (arrayLen - value.length - 1) + ' more)</i>');
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
                        value['...'] = '<i>truncated at ' + limit + ' items (' + (keyLen - keys.length - 1) + ' more)</i>';
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
        function addError(msg) {
            var node = container.querySelector('[data-element="messages"]'),
                messageNode = document.createElement('div');
            messageNode.innerHTML = div({class: 'messages-error', style: {color: 'red'}}, msg);
            node.appendChild(messageNode);
        }
        var errorId = 0;
        function nextErrorId() {
            errorId += 1;
            return errorId;
        }
        function showError(err) {
            addError('ERROR!');
            addError(err.message);
            console.error('ERROR!');
            console.error(err);
        }

        function clearMessages() {
            var node = container.querySelector('[data-element="messages"]');
            node.innerHTML = '';
        }

        function objectLayout(type, ref, methods) {
            return div([
                div({style: {fontWeight: 'bold'}}, 'Type'),
                div(type),
                div({style: {fontWeight: 'bold'}}, 'Ref'),
                div(ref),
                div({style: {fontWeight: 'bold'}}, 'Name'),
                div({dataElement: 'name'}),
                table({class: 'table table-striped', style: {tableLayout: 'fixed'}}, [
                    colgroup([
                        col({style: {width: '20%', overflow: 'scroll'}}),
                        col({style: {width: '50%', overflow: 'scroll'}}),
                        col({style: {width: '20%', overflow: 'scroll'}}),
                        col({style: {width: '10%', overflow: 'scroll'}})
                    ]),
                    tr([
                        th('Method'),
                        th('Result'),
                        th('Type'),
                        th('Time')
                    ])
                ].concat(methods.map(function (method) {
                    return tr({dataField: method.name}, [
                        td(div({dataElement: 'method', style: {overflowX: 'auto'}}, method.name)),
                        td(div({dataElement: 'value', style: {overflowX: 'auto'}})),
                        td({dataElement: 'type'}),
                        td({dataElement: 'time'})
                    ]);
                })))
            ]);
        }

        function renderTaxon(type, ref) {
            var getRef = function (context) {
                return context.ref;
            };
            var methods = [
                {
                    name: 'get_parent',
                    type: 'string',
                    args: [getRef]
                },
                {
                    name: 'get_children',
                    type: 'array of string',
                    args: [getRef]
                },
                {
                    name: 'get_genome_annotations',
                    type: 'array of string ',
                    args: [getRef]
                },
                {
                    name: 'get_scientific_lineage',
                    type: 'array of string',
                    args: [getRef]
                },
                {
                    name: 'get_scientific_name',
                    type: 'array of string',
                    args: [getRef]
                },
                {
                    name: 'get_taxonomic_id',
                    type: 'array of string',
                    args: [getRef]
                },
                {
                    name: 'get_kingdom',
                    type: 'array of string',
                    args: [getRef]
                },
                {
                    name: 'get_domain',
                    type: 'array of string',
                    args: [getRef]
                },
                {
                    name: 'get_genetic_code',
                    type: 'array of string',
                    args: [getRef]
                },
                {
                    name: 'get_aliases',
                    type: 'array of string',
                    args: [getRef]
                },
                {
                    name: 'get_all_data',
                    type: 'array of string',
                    args: [
                        function (context) {
                            return {
                                ref: context.ref
                            };
                        }
                    ]
                },
                {
                    name: 'get_decorated_scientific_lineage',
                    type: 'array of string',
                    args: [
                        function (context) {
                            return {
                                ref: context.ref,
                                include_decorated_scientific_lineage: true
                            };
                        }
                    ]
                }
            ], workspace = new Workspace(runtime.getConfig('services.workspace.url'), {
                token: runtime.service('session').getAuthToken()
            }),
                results = {};

            return Promise.try(function () {

                var layout = objectLayout(type, ref, methods);

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
                        var taxon = new TaxonAPI({
                            url: runtime.getConfig('services.service_wizard.url'),
                            version: 'dev',
                            auth: {
                                token: runtime.service('session').getAuthToken()
                            }
                        });
                        addMessage('Starting method async loop');
                        var start = new Date().getTime();
                        var context = {
                            ref: ref,
                            objectInfo: objectInfo
                        };
                        return new Promise(function (resolve, reject) {
                            function next(nextMethods) {
                                if (nextMethods.length === 0) {
                                    resolve();
                                    return;
                                }
                                var method = nextMethods.shift();
                                if (!method.ignore) {
                                    showField(method.name, 'Loading...');
                                    var args = method.args && method.args.map(function (argument) {
                                        if (typeof argument === 'function') {
                                            return argument(context);
                                        }
                                        return argument;
                                    });
                                    var methodFun = taxon[method.name];
                                    if (!methodFun) {
                                        console.error('ERROR no method', method.name, method, taxon);
                                    } else {
                                        taxon[method.name].apply(taxon, args)
                                            .then(function (value) {
                                                results[method.name] = value;
                                                var elapsed = (new Date()).getTime() - start;
                                                addMessage('showing field ' + method.name);
                                                showField(method.name, value, elapsed, {limit: method.limit});
                                                return next(nextMethods);
                                            })
                                            .catch(exceptions.AttributeError, function (err) {
                                                showField(method.name, 'AttributeError: In module ' + err.module + ', function ' + err.func + ' is not supported for this object');
                                                return next(nextMethods);
                                            })
                                            .catch(exceptions.JsonRpcError, function (err) {
                                                var id = nextErrorId();
                                                showField(method.name, 'JSON RPC ERROR - see log #' + id);
                                                console.error('ERROR #' + id + ' : ' + method.name + ' : ' + err.message);
                                                console.error(err);
                                                // reject(err);
                                                return next(nextMethods);
                                            })
                                            .catch(function (err) {
                                                var id = nextErrorId();
                                                showField(method.name, 'ERROR - see log #' + id);
                                                console.error('ERROR #' + id + ' : ' + method.name);
                                                console.error(err);
                                                // reject(err);
                                                return next(nextMethods);
                                            });
                                    }
                                } else {
                                    return next(nextMethods);
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
                        console.log('ERROR', err);
                        showError({
                            type: 'UnknownError',
                            message: 'Check the browser console'
                        });
                    });
            });
        }


        function renderAssembly(type, ref) {
            var getRef = function (context) {
                return context.ref;
            }
            var methods = [
                {
                    name: 'get_assembly_id',
                    type: 'string',
                    args: [getRef]
                },
                {
                    name: 'get_genome_annotations',
                    type: '',
                    args: [getRef]
                },
                {
                    name: 'get_external_source_info',
                    type: '',
                    args: [getRef]
                },
                {
                    name: 'get_stats',
                    type: '',
                    args: [getRef]
                },
                {
                    name: 'get_number_contigs',
                    type: '',
                    args: [getRef]
                },
                {
                    name: 'get_gc_content',
                    type: '',
                    args: [getRef]
                },
                {
                    name: 'get_dna_size',
                    type: '',
                    args: [getRef]
                },
                {
                    name: 'get_contig_ids',
                    type: '',
                    args: [getRef]
                },
                {
                    name: 'get_contig_lengths',
                    type: '',
                    args: [
                        getRef,
                        function () {
                            if (results.contig_ids) {
                                return results.contig_ids.slice(0, 5);
                            }
                            return [];
                        }
                    ]
                },
                {
                    name: 'get_contig_gc_content',
                    type: '',
                    args: [
                        getRef,
                        function () {
                            if (results.contig_ids) {
                                return results.contig_ids.slice(0, 5);
                            }
                            return [];
                        }
                    ]
                },
                {
                    name: 'get_contigs',
                    type: '',
                    args: [
                        getRef,
                        function () {
                            if (results.contig_ids) {
                                return results.contig_ids.slice(0, 5);
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

                var layout = objectLayout(type, ref, methods);

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
                        var api = new AssemblyAPI({
                            url: runtime.getConfig('services.service_wizard.url'),
                            version: 'dev',
                            auth: {
                                token: runtime.service('session').getAuthToken()
                            }
                        });
                        var context = {
                            ref: ref,
                            objectInfo: objectInfo
                        };
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
                                    var args = method.args && method.args.map(function (argument) {
                                        if (typeof argument === 'function') {
                                            return argument(context);
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
                                        .catch(exceptions.AttributeError, function (err) {
                                            showField(method.name, 'AttributeError: In module ' + err.module + ', function ' + err.func + ' is not supported for this object');
                                            return next(nextMethods);
                                        })
                                        .catch(exceptions.JsonRpcError, function (err) {
                                            var id = nextErrorId();
                                            showField(method.name, err.message + ' : JSON RPC ERROR - see log #' + id);
                                            console.error('ERROR #' + id + ' : ' + method.name + ' : ' + err.message);
                                            console.error(err);
                                            // reject(err);
                                            return next(nextMethods);
                                        })
                                } else {
                                    return next(nextMethods);
                                }
                                return null;
                            }
                            return next(methods);
                        });
                    })

                    .then(function () {
                        addMessage('done');
                    })
                    .catch(function (err) {
                        addMessage('done, with error');
                        console.log('ERROR', err);
                        showError({
                            type: 'UnknownError',
                            message: 'Check the browser console'
                        });
                    });
            });
        }

        function renderGenomeAnnotation(type, ref) {
            var getRef = function (context) {
                return context.ref;
            };
            var methods = [
                {
                    name: 'get_taxon',
                    type: 'string',
                    use: true,
                    args: [function (ctx) {
                            return {
                                ref: ctx.ref
                            };
                        }]
                },
                {
                    name: 'get_assembly',
                    type: 'string',
                    use: true,
                    args: [function (ctx) {
                            return {
                                ref: ctx.ref
                            };
                        }]
                },
                {
                    name: 'get_feature_types',
                    type: 'array of string ',
                    use: true,
                    args: [function (ctx) {
                            return {
                                ref: ctx.ref
                            };
                        }]
                },
                {
                    name: 'get_feature_type_descriptions',
                    type: 'object (string -> number)',
                    limit: 100,
                    use: true,
                    args: [function (ctx) {
                            return {
                                ref: ctx.ref
                            };
                        }]
                },
                {
                    name: 'get_feature_type_counts',
                    type: 'object (string -> number)',
                    limit: 100,
                    args: [function (ctx) {
                            return {
                                ref: ctx.ref,
                                feature_type_list: ['crs', 'gene', 'loci', 'trm', 'pbs', 'opr', 'sRNA', 'rna', 'crispr', 'pseudo', 'pp', 'bs', 'locus', 'prm', 'att', 'rsw', 'mRNA', 'CDS', 'pi', 'PEG', 'trnspn']
                            };
                        }],
                    use: true
                },
                {
                    name: 'get_feature_ids',
                    type: 'object (FeatureIdMapping)',
                    args: [function (ctx) {
                            return {
                                ref: ctx.ref,
                                filters: {},
                                group_by: 'type'
                            };
                        }],
                    xargs: [
                        getRef,
                        {
//                    type_list: [],
//                    region_list: [],
//                    function_list: [],
//                    alias_list: []
                        },
                        // type, region, function, alias
                        'type'
                    ],
                    use: true
                },
                {
                    name: 'get_features',
                    type: 'object (string - > FeatureData)',
                    args: [function (arg) {
                            var featureIdList = [];
                            if (arg.results && arg.results.get_feature_ids && results.get_feature_ids.by_type.CDS) {
                                featureIdList = arg.results.get_feature_ids.by_type.CDS.slice(0, 5);
                            }
                            return {
                                ref: arg.ref,
                                feature_id_list: featureIdList,
                                exclude_sequence: false
                            };
                        }],
                    use: true

                },
                {
                    name: 'get_proteins',
                    type: 'array (of ProteinData)',
                    use: true,
                    args: [function (ctx) {
                            return {
                                ref: ctx.ref
                            };
                        }]
                },
                {
                    name: 'get_feature_locations',
                    type: 'object (string -> (list of Region)',
                    args: [function (arg) {
                            var featureIdList = [];
                            if (arg.results && arg.results.get_feature_ids && results.get_feature_ids.by_type.CDS) {
                                featureIdList = arg.results.get_feature_ids.by_type.CDS.slice(0, 5);
                            }
                            return {
                                ref: arg.ref,
                                feature_id_list: featureIdList
                            };
                        }],
                    use: true
                },
                {
                    name: 'get_feature_publications',
                    type: 'object (string -> (list of string)',
                    args: [function (arg) {
                            var featureIdList = [];
                            if (arg.results && arg.results.get_feature_ids && results.get_feature_ids.by_type.CDS) {
                                featureIdList = arg.results.get_feature_ids.by_type.CDS.slice(0, 5);
                            }
                            return {
                                ref: arg.ref,
                                feature_id_list: featureIdList
                            };
                        }],
                    use: true
                },
                {
                    name: 'get_feature_dna',
                    type: 'object (string -> string)',
                    args: [function (arg) {
                            var featureIdList = [];
                            if (arg.results && arg.results.get_feature_ids && results.get_feature_ids.by_type.CDS) {
                                featureIdList = arg.results.get_feature_ids.by_type.CDS.slice(0, 5);
                            }
                            return {
                                ref: arg.ref,
                                feature_id_list: featureIdList
                            };
                        }],
                    use: true
                },
                {
                    name: 'get_feature_functions',
                    type: 'object (string -> string)',
                    args: [function (arg) {
                            var featureIdList = [];
                            if (arg.results && arg.results.get_feature_ids && results.get_feature_ids.by_type.CDS) {
                                featureIdList = arg.results.get_feature_ids.by_type.CDS.slice(0, 5);
                            }
                            return {
                                ref: arg.ref,
                                feature_id_list: featureIdList
                            };
                        }],
                    use: true
                },
                // does not load, check out spec and impl.
                {
                    name: 'get_feature_aliases',
                    type: 'object (string -> array of string)',
                    args: [function (arg) {
                            var featureIdList = [];
                            if (arg.results && arg.results.get_feature_ids && results.get_feature_ids.by_type.CDS) {
                                featureIdList = arg.results.get_feature_ids.by_type.CDS.slice(0, 5);
                            }
                            return {
                                ref: arg.ref,
                                feature_id_list: featureIdList
                            };
                        }],
                    use: true
                },
                {
                    name: 'get_cds_by_gene',
                    type: 'array of string',
                    args: [function (arg) {
                            var featureIdList = [];
                            if (arg.results && arg.results.get_feature_ids && results.get_feature_ids.by_type.gene) {
                                featureIdList = arg.results.get_feature_ids.by_type.gene.slice(0, 5);
                            }
                            return {
                                ref: arg.ref,
                                gene_id_list: featureIdList
                            };
                        }],
                    filter: function (featureList) {
                        if (featureList === undefined || featureList.length === 0) {
                            return false;
                        }
                        return true;
                    },
                    use: true
                },
                {
                    name: 'get_cds_by_mrna',
                    type: 'array of string',
                    args: [function (arg) {
                            var featureIdList = [];
                            if (arg.results && arg.results.get_feature_ids && results.get_feature_ids.by_type.mRNA) {
                                featureIdList = arg.results.get_feature_ids.by_type.mRNA.slice(0, 5);
                            }
                            return {
                                ref: arg.ref,
                                mrna_id_list: featureIdList
                            };
                        }],
                    use: true
                },
                {
                    name: 'get_gene_by_cds',
                    type: 'object(-> string)',
                    args: [function (arg) {
                            var featureIdList = [];
                            if (arg.results && arg.results.get_feature_ids && results.get_feature_ids.by_type.CDS) {
                                featureIdList = arg.results.get_feature_ids.by_type.CDS.slice(0, 5);
                            }
                            return {
                                ref: arg.ref,
                                cds_id_list: featureIdList
                            };
                        }],
                    use: true
                }
            ], workspace = new Workspace(runtime.getConfig('services.workspace.url'), {
                token: runtime.service('session').getAuthToken()
            }),
                results = {};

            return Promise.try(function () {

                var layout = objectLayout(type, ref, methods);

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
                        var context = {
                            ref: ref,
                            objectInfo: objectInfo,
                            results: results
                        };
                        document.getElementById(place).querySelector('[data-element="name"]').innerHTML = objectInfo.name;
                        var api = new GenomeAnnotationAPI({
                            url: runtime.getConfig('services.service_wizard.url'),
                            version: 'dev',
                            auth: {
                                token: runtime.service('session').getAuthToken()
                            }
                        });

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
                                    var args = method.args && method.args.map(function (argument) {
                                        if (typeof argument === 'function') {
                                            return argument(context);
                                        }
                                        return argument;
                                    });
                                    var run;
                                    if (method.filter) {
                                        run = method.filter.apply(args);
                                    } else {
                                        run = true;
                                    }
                                    if (run) {
                                        console.log('RUNNING', method.name, args);
                                        api[method.name].apply(api, args)
                                            .then(function (value) {
                                                results[method.name] = value;
                                                var elapsed = (new Date()).getTime() - start;
                                                addMessage('showing field ' + method.name);
                                                showField(method.name, value, elapsed, {limit: method.limit});
                                                return next(nextMethods);
                                            })
                                            .catch(exceptions.AttributeError, function (err) {
                                                showField(method.name, 'AttributeError: In module ' + err.module + ', function ' + err.func + ' is not supported for this object');
                                                return next(nextMethods);
                                            })
                                            .catch(exceptions.JsonRpcError, function (err) {
                                                var id = nextErrorId();
                                                showField(method.name, err.message + ' : JSON RPC ERROR - see log #' + id);
                                                console.error('ERROR #' + id + ' : ' + method.name + ' : ' + err.message);
                                                console.error(err);
                                                // reject(err);
                                                return next(nextMethods);
                                            })
                                    } else {
                                        showField(method.name, '* skipped *');
                                        return next(nextMethods);
                                    }
                                } else {
                                    return next(nextMethods);
                                }
                                return null;
                            }
                            return next(methods);
                        });
                    })

                    .then(function () {
                        addMessage('done');
                    })
                    .catch(function (err) {
                        addMessage('done, with error');
                        console.log('ERROR', err);
                        console.log(err);
                        showError({
                            type: 'UnknownError',
                            message: 'Check the browser console'
                        });
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
                        case 'genomeAnnotation':
                            renderGenomeAnnotation(objectType, objectRef);
                            break;
                    }


                    // alert('Selected ' + objectRef + ', of type ' + objectType);
                }
            });
        }

        function start(params) {
            clearMessages();
            addMessage('starting...');
            runtime.send('ui', 'setTitle', 'Data API Demo')
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