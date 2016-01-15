/*global define */
/*jslint white: true, browser: true */
define([
    'kb/common/html',
    'kb/data/assembly',
    '../utils',
    './utils'
],
    function (html, Taxon, utils, utils2) {
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
                    th = html.tag('th'),
                    methodName;
                if (typeof method === 'string') {
                    methodName = method;
                } else {
                    methodName = method[0];
                }
                return tr([th(method), td({id: addMount(method)})]);
            }

            var methods = [
                'getAssemblyId', 'getGenomeAnnotation', 'getExternalSourceInfo', 'getStats',
                'getNumberContigs', 'getGCContent', 'getDNASize', 'getContigIds',
                ['getContigLengths', ['NODE_48_length_21448_cov_4.91263_ID_95']],
                ['getContigGCContent', ['NODE_48_length_21448_cov_4.91263_ID_95']],
                ['getContigs', ['NODE_48_length_21448_cov_4.91263_ID_95']]
            ];

            function render() {
                var div = html.tag('div'),
                    table = html.tag('table'),
                    tr = html.tag('tr'),
                    td = html.tag('td'), th = html.tag('th');
                return div([
                    div({class: 'well', id: addMount('status')}),
                    table({class: 'table table-striped', style: {width: '100%'}}, [
                        tr([th('Method'), th('Widget')]),
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
                setHtml('status', 'Starting client run...');
                // you need to start the promises sequence with a promise-returning
                // function
                client.getParent()
                    // the first few of these handle the call and return value 
                    // within the main sequence...
                    .then(function () {
                        setHtml('getAssemblyId', html.loading());
                        return client.getAssemblyId()
                            .then(function (value) {
                                setHtml('getAssemblyId', value || 'n/a');
                            });

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