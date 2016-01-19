/*global define*/
/*jslint white:true,browser:true*/
define([
    'kb/common/html'
], function (html) {
    'use strict';
    function getRef(params) {
        if (params.ref) {
            return params.ref;
        }
        if (params.workspaceId) {
            if (!params.objectId) {
                throw new Error('Object id required if workspaceId supplied');
            }
            var ref = [params.workspaceId, params.objectId];
            if (params.objectVersion) {
                ref.push(params.objectVersion);
            }
            return ref.join('/');
        }
        throw new Error('Either a ref property or workspaceId, objectId, and optionally objectVersion required to make a ref');
    }

    function getType(value) {
        var type = typeof value;
        switch (type) {
            case 'undefined':
            case 'string':
            case 'number':
            case 'boolen':
                return type;
            case 'object':
                if (value === null) {
                    return 'null';
                }
                if (value.pop) {
                    return 'array';
                }
                return type;
            default:
                return type;
        }
    }

    function formatValue(value) {
        var ul = html.tag('ul'),
            li = html.tag('li'),
            i = html.tag('i'),
            span = html.tag('span');
        switch (getType(value)) {
            case 'undefined':
                return i({style: {color: 'orange'}}, 'n/a');
            case 'string':
                return span({style: {color: 'green'}}, value);
            case 'number':
                return span({style: {color: 'green'}}, String(value));
            case 'array':
                if (value.length === 0) {
                    return i('empty');
                }
                return ul(
                    value.map(function (item) {
                        return li({style: {color: 'green'}}, item);
                    })
                    );
            case 'object':
                if (Object.keys(value).length === 0) {
                    return i('empty');
                }
                return ul(
                    Object.keys(value).map(function (key) {
                    return li([i(key), span({style: {padding: '0 4px 0 4px'}}, '-&gt;'),
                        span({style: {color: 'green'}}, value[key])]);
                }));
        }
        return '??';
    }

    return {
        getRef: getRef,
        getType: getType,
        formatValue: formatValue
    };
});