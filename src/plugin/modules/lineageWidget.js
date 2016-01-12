/*global define */
/*jslint white: true, browser: true */
define([
    'kb/widget/bases/dataWidget',
    'kb/common/html',
    'kb/data/taxon',
    './utils'
],
    function (dataWidget, html, Taxon, utils) {
        'use strict';
        function makeSymbol(s) {
            return s.trim(' ').replace(/ /, '_');
        }
        function myWidget(config) {
            return dataWidget.make({
                runtime: config.runtime,
                on: {
                    initialContent: function () {
                        this.send('ui', 'setTitle', 'Loading Lineage ...');
                        return {
                            title: 'Loading Lineage ...',
                            content: html.loading('Loading lineage...')
                        };
                    },
                    start: function (params) {
                        // Listen for a setTitle message sent to the ui.
                        // We use the widget convenience function in order to 
                        // get automatic event listener cleanup. We could almost
                        // as easily do this ourselves.                        
                        this.set('objectRef', utils.getRef(params));
                    },
                    fetch: function (params) {
                        var taxonClient = Taxon.make({
                            ref: utils.getRef(params),
                            token: config.runtime.getService('session').getAuthToken(),
                            url: config.runtime.getConfig('services.taxon_api.url')
                        }), 
                            widget = this;
                        
                        return taxonClient.getScientificName()
                            .then(function (name) {
                                widget.set('scientificName', name);
                                return taxonClient.getScientificLineage();
                            })
                            .then(function (lineage) {
                                widget.set('lineage', lineage);
                            });
                    },
                    render: function () {
                        // Render a simple title.
                        // NB:this is called whenver the widget thinks it needs 
                        // to re-render the title, which is essentially when the 
                        // state is dirty (has been changed) and a heartbeat
                        // event is captured.
                        // '811/Sbicolor.JGI-v2.1'
                        
                        console.log('want to render');
                        if (!this.get('scientificName') || !this.get('lineage')) {
                            return {
                                content: html.loading()
                            };
                        }
                        console.log('rendering...');
                        var ol = html.tag('ol'),
                            li = html.tag('li'),
                            a = html.tag('a'),
                            div = html.tag('div'),  
                            pre = html.tag('pre'),
                            pad = 0,
                            content = pre([
                                div(['Scientific name (again): ', this.get('scientificName')]),
                                ol(this.get('lineage').map(function (item) {
                                    var id = 'lineage_item_' + makeSymbol(item),
                                        url = 'http://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?name=' + item.trim(' ');
                                    pad += 10;
                                    return li({style: {paddingLeft: String(pad) + 'px'}, id: id}, [
                                        a({href: url, target: '_blank'}, item.trim(' '))]);
                                }))
                            ]);
                            
                        return {
                            title: 'Taxon Lineage Widget',
                            content: content
                        };
                        
                    }
                }
            });
        }
        return {
            make: function (config) {
                return myWidget(config);
            }
        };
    });