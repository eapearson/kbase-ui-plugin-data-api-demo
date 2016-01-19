/*global define */
/*jslint white: true, browser: true */
define([
    'kb/common/html',
    'kb/data/taxon',
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
                    td = html.tag('td'), th = html.tag('th');
                return tr([th(method), td({id: addMount(method)})]);
            }

            function render() {
                var div = html.tag('div'),
                    table = html.tag('table'), 
                    tr = html.tag('tr'), 
                    td = html.tag('td'), th = html.tag('th');
                return div([
                    div({class: 'well', id: addMount('status')}),
                    table({class: 'table table-striped', style: {width: '100%'}}, [
                        tr([th('Method'), th('Widget')]),
                        genRow('getParent'), genRow('getChildren'),
                        genRow('getScientificName'), genRow('getTaxonomicId'), genRow('getKingdom'),
                        genRow('getDomain'), genRow('getGeneticCode'), genRow('getAliases')
                    ])
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
                        url: runtime.getConfig('services.taxon_api.url'),
                        token: runtime.service('session').getAuthToken(),
                        timeout: 10000
                    });
                setHtml('status', 'Starting client run...');
                // you need to start the promises sequence with a promise-returning
                // function
                client.getParent()
                    // the first few of these handle the call and return value 
                    // within the main sequence...
                    .then(function (parentRef) {
                        setHtml('getParent', utils.formatValue(parentRef));                    
                    })
                    
                    .then(function () {
                        setHtml('getChildren', html.loading());
                        return client.getChildren();
                    })
                    .then(function (children) {
                        setHtml('getChildren', utils.formatValue(children));
                    })
                    
                    .then(function () {
                        setHtml('getScientificName', html.loading());
                        return client.getScientificName()                        
                    })
                    .then(function (value) {
                        setHtml('getScientificName', utils.formatValue(value));
                    })
                    
                    .then(function () {
                        setHtml('getTaxonomicId', html.loading());
                        return client.getTaxonomicId()       
                    })
                    .then(function (value) {
                        setHtml('getTaxonomicId', utils.formatValue(value));
                    })
                    
                    // but we can "modularize" by creating self-contained
                    // sub-sequences...
                    .then(function () {
                        setHtml('getKingdom', html.loading());
                        return client.getKingdom()
                            .then(function (value) {
                                setHtml('getKingdom', utils.formatValue(value));
                            });
                        
                    })
                    .then(function () {
                        setHtml('getDomain', html.loading());
                        return client.getDomain()
                            .then(function (value) {
                                setHtml('getDomain', utils.formatValue(value));                            
                            });
                    })
                    .then(function () {
                        setHtml('getGeneticCode', html.loading());
                        return client.getGeneticCode() 
                            .then(function (value) {
                                setHtml('getGeneticCode', utils.formatValue(value));
                            });
                    })
                    .then(function () {
                        setHtml('getAliases', html.loading());
                        return client.getAliases()
                            .then(function (value) {
                                setHtml('getAliases', utils.formatValue(value));
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