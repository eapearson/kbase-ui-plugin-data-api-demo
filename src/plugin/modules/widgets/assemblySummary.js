/*global define */
/*jslint white: true, browser: true */
define([
    'bluebird',
    'kb/common/html',
    'kb/data/assembly',
    '../utils'
],
    function (Promise, html, Taxon, utils) {
        'use strict';
        function factory(config) {
            var parent, container, runtime = config.runtime, layout,
                mounts = {};

            function addMount(name) {
                var id = html.genId();
                mounts[name] = id;
                return id;
            }
            function getMount(name) {
                return mounts[name];
            }
            function setHtml(name, html) {
                document.getElementById(getMount(name)).innerHTML = html;
            }

            function genRow(method) {
                var tr = html.tag('tr'),
                    td = html.tag('td'),
                    th = html.tag('th');

                return tr([th(method.name), td({id: addMount(method.name)}), td(method.type)]);
            }

            var methods = [
                {
                    name: 'getAssemblyId',
                    type: 'string'
                },
                {
                    name: 'getGenomeAnnotation',
                    type: 'array (list of ref)'
                },
                {
                    name: 'getExternalSourceInfo',
                    type: 'object (AssemblyExternalSourceInfo) '
                },
                {
                    name: 'getStats',
                    type: 'object'
                },
                {
                    name: 'getNumberContigs',
                    type: 'number'
                },
                {
                    name: 'getGCContent',
                    type: 'number'
                },
                {
                    name: 'getDNASize',
                    type: 'number'
                },
                {
                    name: 'getContigIds',
                    type: 'array (list of refs)'
                },
                {
                    name: 'getContigLengths',
                    type: 'object (map of string -> number)',
                    arguments: [
                        ['51847']
                    ]
                },
                {
                    name: 'getContigGCContent',
                    type: 'object (map of string -> number)',
                    arguments: [
                        ['51847']
                    ]
                },
                {
                    name: 'getContigs',
                    type: 'object (map of string -> AssemblyContig)',
                    arguments: [
                        ['51847']
                    ]
                }
            ];

            var types = [
                {
                    name: 'AssemblyExternalSourceInfo',
                    fields: [
                        {
                            name: 'external_source',
                            type: 'string'
                        },
                        {
                            name: 'external_source_id',
                            type: 'string'
                        },
                        {
                            name: 'external_source_origination_date',
                            type: 'string'
                        }
                    ]
                }
            ];

            function render() {
                var div = html.tag('div'),
                    table = html.tag('table'),
                    tr = html.tag('tr'), th = html.tag('th');
                return div([
                    div({class: 'well', id: addMount('status')}),
                    table({class: 'table table-striped', style: {width: '100%'}}, [
                        tr([th('Method'), th('Widget'), th('Type')])
                    ].concat(methods.map(function (method) {
                        return genRow(method);
                    })))
                ]);
            }
            layout = render();

            function attach(node) {
                parent = node;
                container = node.appendChild(document.createElement('div'));
                container.innerHTML = layout;
            }

            function run(params) {
                var ref = utils.getRef(params),
                    client = Taxon.make({
                        ref: ref,
                        url: runtime.getConfig('services.assembly_api.url'),
                        token: runtime.service('session').getAuthToken(),
                        timeout: 10000
                    });
                // you need to start the promises sequence with a promise-returning
                // function
                // Make this symmetric by starting off with a dummy promise...
                return Promise.try(function () {
                    setHtml('status', 'Starting client run...');
                })
                    .then(function () {
                        return Promise.all(methods.map(function (method) {
                            return Promise.try(function () {
                                try {
                                    return client[method.name].apply(client, method.arguments)
                                        .then(function (value) {
                                            console.log(utils);
                                            setHtml(method.name, utils.formatValue(value));
                                        });
                                } catch (ex) {
                                    setHtml(method.name, 'ERROR');
                                    console.log(ex);
                                }
                            });
                        }));
                    })
                    .then(function () {
                        setHtml('status', 'Successfully finished');
                    })
                    .catch(function (err) {
                        setHtml('status', 'ERROR! Check the console');
                        console.log(err);
                    });
            }

            function detach(params) {
                parent.removeChild(container);
                return null;
            }

            return {
                attach: attach,
                run: run,
                detach: detach
            };
        }

        return {
            make: function (config) {
                return factory(config);
            }
        };
    });