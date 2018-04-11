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
        },
        url: function(action, params){
            var api_ver = 3;
            var base_url = ckan.sandbox().client.endpoint;
            var url = base_url + '/api/' + api_ver + '/action/' + action + '?' + params;
            return url;
        }

    };

    return {
        initialize: function() {

            var sql_string = this.options.sql_string;
            console.log('SQL STRING ' + sql_string)
            $('#example').DataTable({
                "ajax": {
                    "url": api.url('querytool_get_resource_data', 'sql_string='+sql_string),
                    "dataSrc": "result.records"
                },
                "columns": [{
                        "data": "death"
                    },
                    {
                        "data": "area"
                    },
                    {
                        "data": "gender"
                    },
                    {
                        "data": "region"
                    }

                ]
            });
        },

        teardown: function() {
            // We must always unsubscribe on teardown to prevent memory leaks.
        }
    }
});