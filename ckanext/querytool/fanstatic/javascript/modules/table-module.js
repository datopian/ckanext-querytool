/*

This modules handles displaying a table item

Options:

*/
"use strict";
ckan.module('querytool-table', function() {
    var api = {
        get: function(action, params) {
            $.ajaxSetup({
                async: false
            });
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
        url: function(action, params) {
            var api_ver = 3;
            var base_url = ckan.sandbox().client.endpoint;
            var url = base_url + '/api/' + api_ver + '/action/' + action + '?' + params;
            return url;
        }

    };

    return {
        initialize: function() {

            var sql_string = this.create_sql_string();
            var resource_id = this.options.resource_id;
            var y_axis = this.options.y_axis;
            var id = this.options.table_id;
            var main_value = this.options.main_value;
            var columns = api.get('querytool_get_table_columns', {
                res_id: resource_id
            }).done(function(response) {});

            $('#table-item-'+ id).DataTable({
                "processing": true,
                "ajax": {
                    "url": api.url('querytool_get_resource_data', 'sql_string=' + sql_string),
                    "dataSrc": "result.records"
                },
                "columns": [
                    {'data': main_value,
                    'title':main_value},
                    {'data':y_axis,
                    'title': y_axis}
                ]

            });
        },

         create_sql_string: function() {
            var parsedSqlString = this.options.sql_string.split('*');
            var sqlStringExceptSelect = parsedSqlString[1];


            return 'SELECT ' + '"' + this.options.main_value + '", SUM("' + this.options.y_axis + '") as ' + this.options.y_axis + sqlStringExceptSelect + ' GROUP BY "' + this.options.main_value + '"';
        },

        teardown: function() {
            // We must always unsubscribe on teardown to prevent memory leaks.
        }
    }
});