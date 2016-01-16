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
                h1 = html.tag('h1'), h2 = html.tag('h2'),
                ul = html.tag('ul'), li = html.tag('li'),
                a = html.tag('a');
            return div({class: 'container'},[
                h1('Hi, I am the data api demo page'),
                h2('Taxon'),
                ul([
                    li(a({href: '#dataapidemo/taxon/1255/3/1'}, 'Demo 1')),
                    li(a({href: '#dataapidemo/taxon/834/1/1'}, 'Demo 2'))
                ]),
                h2('Assembly'),
                ul([
                    li(a({href: '#dataapidemo/assembly/1255/3/1'}, 'Demo 1')),
                    li(a({href: '#dataapidemo/assembly/834/1/1'}, 'Demo 2'))
                ])
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