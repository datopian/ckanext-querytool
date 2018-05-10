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


            this.createTable();

             var tableField = this.el.closest('.table_item');

            // The Update table button is only in the admin area. In the public
            // updating of tables will be applied with a reload of the page.
            if (tableField.length > 0) {
                var updateBtn = tableField.find('.update-table-btn');

                updateBtn.click(this.updateTable.bind(this));
            }

            this.sandbox.subscribe('querytool:updateTables', this.updateTable.bind(this));
        },

        createTable: function(yVal, xVal, fromUpdate){

            var resource_id = this.options.resource_id;
            var y_axis = (yVal) ? yVal : this.options.y_axis;
            var id = this.options.table_id;
            var main_value = this.options.main_value;
            if(main_value === true){
                var mainVal = $('[name*=table_main_value_]');
                main_value = mainVal.val();
            }
            //check if main value is updated
            if(fromUpdate){
                main_value = xVal;
            }
            var sql_string = this.create_sql_string(main_value, y_axis);
            var dt_buttons_className = 'btn btn-default';
            var title = this.options.table_title;

            this.dataTable = $('#table-item-'+ id).DataTable({
                "processing": true,
                "ajax": {
                    "url": api.url('querytool_get_resource_data', 'sql_string=' + sql_string),
                    "dataSrc": "result.records"
                },
                "columns": [
                    {'data': main_value.toLowerCase(),
                    'title': main_value.charAt(0).toUpperCase() + main_value.slice(1)},
                    {'data': y_axis.toLowerCase(),
                    'title': y_axis.charAt(0).toUpperCase() + y_axis.slice(1)}
                ],
                //download table data options
                dom: '<"dt-header">lBfrtip',
                buttons: [
                    {
                    'extend': 'csv',
                    'className' : dt_buttons_className
                    },
                       {
                    'extend': 'excel',
                    'className' : dt_buttons_className
                    },
                     {
                    'extend': 'pdf',
                    'className' : dt_buttons_className
                    }
                ],
                "destroy" : true /* <---- this setting reinitialize the table */
            });
            $("div.dt-header").html(title);
            this.dataTable.buttons().container().insertAfter($('div.dataTables_paginate', this.dataTable.table().container() ));
        },

        updateTable : function(){
            var yVal = $('[name=choose_y_axis_column]').val();
            var xVal = this.el.parent().parent().find('[id*=table_main_value_]').val();
            this.options.filter_name = this.el.parent().parent().find('[id*=table_field_filter_name_]').val();
            this.options.filter_value = this.el.parent().parent().find('[id*=table_field_filter_value_]').val();
            this.options.table_title = this.el.parent().parent().find('[id*=table_field_title_]').val();
            this.createTable(yVal, xVal, true);
        },

        create_sql_string: function(main_value, y_axis) {
            var parsedSqlString = this.options.sql_string.split('*');
            var sqlStringExceptSelect = parsedSqlString[1];

            var filter_name = (this.options.filter_name === true) ? '' : this.options.filter_name;
            var filter_value = (this.options.filter_value === true) ? '' : this.options.filter_value;

            // If additional table filter is set extend the current sql with the new filter
            if (filter_name && filter_value) {
                var filterSql = ' AND ("' + this.options.filter_name + '"' + " = '" + this.options.filter_value + "')"
                sqlStringExceptSelect = sqlStringExceptSelect + filterSql;
            }

            return 'SELECT ' + '"' + main_value + '", SUM("' + y_axis + '") as ' + '"' + y_axis + '"' + sqlStringExceptSelect + ' GROUP BY "' + main_value + '"';
        },

        teardown: function() {
            // We must always unsubscribe on teardown to prevent memory leaks.
            this.sandbox.unsubscribe('querytool:updateTables', this.updateTable.bind(this));
        }
    }
});
