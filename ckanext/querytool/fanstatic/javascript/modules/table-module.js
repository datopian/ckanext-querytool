/*

This modules handles displaying a table item

Options:

*/

"use strict";
ckan.module('querytool-table', function() {
     var api = {
        get: function(action, params) {
            var api_ver = 3;
            var base_url = ckan.sandbox().client.endpoint;
            params = $.param(params);
            var url = base_url + '/api/' + api_ver + '/action/' + action + '?' + params;
            return $.getJSON(url);
        },
        post: function(action, data) {
            var api_ver = 3;
            var base_url = ckan.sandbox().client.endpoint;
            var url = base_url + '/api/' + api_ver + '/action/' + action;
            return $.post(url, JSON.stringify(data), 'json');
        }
    };

    return {
        initialize: function(){

        },

        teardown: function () {
            // We must always unsubscribe on teardown to prevent memory leaks.
        }
    }

});
