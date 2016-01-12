/*global define*/
/*jslint white:true,browser:true*/
define([
    'kb/data/taxon',
    'kb/common/html',
    './utils'
], function (Taxon, html, utils) {
   'use strict';
   function factory(config) {
        var parent, container, runtime = config.runtime;
        
        function attach(node) {
            parent = node;
            container = node.appendChild(document.createElement('div'));
            container.innerHTML = html.loading('Loading scientific name...');
        }
        
        function run(params) {
            var ref = utils.getRef(params);
            if (ref) {
                var taxonClient = Taxon.make({
                    ref: ref,
                    token: runtime.service('session').getAuthToken(),
                    url: runtime.getConfig('services.taxon_api.url')
                });
                return taxonClient.getScientificName()
                    .then(function (name) {
                        runtime.send('ui', 'setTitle', 'Taxon test page for ' + name);
                        container.innerHTML = 'Hello ' + name;
                    });
            }
            container.innerHTML = 'Give me a ref query param and I will give you a scientific name.';
        }
        
        function detach() {
            parent.removeChild(container);
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