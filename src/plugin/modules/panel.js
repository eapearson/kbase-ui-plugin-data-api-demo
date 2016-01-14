/*global define*/
/*jslint white:true,browser:true*/
define([
    'kb/common/html',
    'kb/widget/widgetSet'
], function (html, WidgetSet) {
   'use strict';
   function factory(config) {
        var parent, container, runtime = config.runtime,
            widgetSet = WidgetSet.make({runtime: runtime}),
            layout;
        
        function render() {
            var div = html.tag('div'),
                h1 = html.tag('h1'),
                p = html.tag('p');
            return div({class: 'container'},[
                h1('Hi, I am the data api demo page'),
                p('These are test widgets, meant to demonstrate the raw data capabilities of the data api client.'),
                //div({id: widgetSet.addWidget('kb_dataapidemo_scientificName'), class: 'col-md-6'}),
                //div({id: widgetSet.addWidget('kb_dataapidemo_lineage'), class: 'col-md-6'}),
                div({id: widgetSet.addWidget('kb_dataapidemo_summary'), class: 'col-md-8'})
            ]);
        }
        
        function init(config) {
            layout = render();
            return widgetSet.init(config);
        }
        
        function attach(node) {
            parent = node;
            container = node.appendChild(document.createElement('div'));            
            container.innerHTML = layout;
            
            return widgetSet.attach(container);
        }
        
        function start(params) {
            return widgetSet.start(params);
        }
        
        function run(params) {
            return widgetSet.run(params);
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