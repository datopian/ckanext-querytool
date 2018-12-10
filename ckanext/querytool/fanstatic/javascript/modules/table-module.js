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

        createTable: function(yVal, xVal, fromUpdate) {

            var resource_id = this.options.resource_id;
            var y_axis = (yVal) ? yVal : this.options.y_axis;
            var id = this.options.table_id;
            var main_value = this.options.main_value;
            if (main_value === true) {
                var mainVal = $('[name*=table_main_value_]');
                main_value = mainVal.val();
            }
            //check if main value is updated
            if (fromUpdate) {
                main_value = xVal;
            }
            var locale = $('html').attr('lang');
            var languages = {
              'es' : {
                  "sProcessing":     "Procesando...",
                  "sLengthMenu":     "Mostrar _MENU_ registros",
                  "sZeroRecords":    "No se encontraron resultados",
                  "sEmptyTable":     "Ningún dato disponible en esta tabla",
                  "sInfo":           "Mostrando registros del _START_ al _END_ de un total de _TOTAL_ registros",
                  "sInfoEmpty":      "Mostrando registros del 0 al 0 de un total de 0 registros",
                  "sInfoFiltered":   "(filtrado de un total de _MAX_ registros)",
                  "sInfoPostFix":    "",
                  "sSearch":         "Buscar:",
                  "sUrl":            "",
                  "sInfoThousands":  ",",
                  "sLoadingRecords": "Cargando...",
                  "oPaginate": {
                      "sFirst":    "Primero",
                      "sLast":     "Último",
                      "sNext":     "Siguiente",
                      "sPrevious": "Anterior"
                  },
                  "oAria": {
                      "sSortAscending":  ": Activar para ordenar la columna de manera ascendente",
                      "sSortDescending": ": Activar para ordenar la columna de manera descendente"
                  }
              },
              'fr' : {
                "sProcessing":     "Traitement en cours...",
                "sSearch":         "Rechercher&nbsp;:",
                "sLengthMenu":     "Afficher _MENU_ &eacute;l&eacute;ments",
                "sInfo":           "Affichage de l'&eacute;l&eacute;ment _START_ &agrave; _END_ sur _TOTAL_ &eacute;l&eacute;ments",
                "sInfoEmpty":      "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
                "sInfoFiltered":   "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
                "sInfoPostFix":    "",
                "sLoadingRecords": "Chargement en cours...",
                "sZeroRecords":    "Aucun &eacute;l&eacute;ment &agrave; afficher",
                "sEmptyTable":     "Aucune donn&eacute;e disponible dans le tableau",
                "oPaginate": {
                  "sFirst":      "Premier",
                  "sPrevious":   "Pr&eacute;c&eacute;dent",
                  "sNext":       "Suivant",
                  "sLast":       "Dernier"
                },
                "oAria": {
                  "sSortAscending":  ": activer pour trier la colonne par ordre croissant",
                  "sSortDescending": ": activer pour trier la colonne par ordre d&eacute;croissant"
                },
                "select": {
                  "rows": {
                    _: "%d lignes séléctionnées",
                    0: "Aucune ligne séléctionnée",
                    1: "1 ligne séléctionnée"
                  }
                }
              },
              'pt_BR' : {
                  "sEmptyTable": "Nenhum registro encontrado",
                  "sInfo": "Mostrando de _START_ até _END_ de _TOTAL_ registros",
                  "sInfoEmpty": "Mostrando 0 até 0 de 0 registros",
                  "sInfoFiltered": "(Filtrados de _MAX_ registros)",
                  "sInfoPostFix": "",
                  "sInfoThousands": ".",
                  "sLengthMenu": "_MENU_ resultados por página",
                  "sLoadingRecords": "Carregando...",
                  "sProcessing": "Processando...",
                  "sZeroRecords": "Nenhum registro encontrado",
                  "sSearch": "Pesquisar",
                  "oPaginate": {
                      "sNext": "Próximo",
                      "sPrevious": "Anterior",
                      "sFirst": "Primeiro",
                      "sLast": "Último"
                  },
                  "oAria": {
                      "sSortAscending": ": Ordenar colunas de forma ascendente",
                      "sSortDescending": ": Ordenar colunas de forma descendente"
                  }
              },
              'zh_CN' : {
                "sProcessing":   "处理中...",
                "sLengthMenu":   "显示 _MENU_ 项结果",
                "sZeroRecords":  "没有匹配结果",
                "sInfo":         "显示第 _START_ 至 _END_ 项结果，共 _TOTAL_ 项",
                "sInfoEmpty":    "显示第 0 至 0 项结果，共 0 项",
                "sInfoFiltered": "(由 _MAX_ 项结果过滤)",
                "sInfoPostFix":  "",
                "sSearch":       "搜索:",
                "sUrl":          "",
                "sEmptyTable":     "表中数据为空",
                "sLoadingRecords": "载入中...",
                "sInfoThousands":  ",",
                "oPaginate": {
                    "sFirst":    "首页",
                    "sPrevious": "上页",
                    "sNext":     "下页",
                    "sLast":     "末页"
                },
                "oAria": {
                    "sSortAscending":  ": 以升序排列此列",
                    "sSortDescending": ": 以降序排列此列"
                }
              },
            };
            var sql_string = this.create_sql_string(main_value, y_axis);
            var dt_buttons_className = 'btn btn-default';
            var title = (this.options.table_title === true) ? '' : this.options.table_title;
            var dom_class = '<"dt-header' + id + '">';
            this.dataTable = $('#table-item-' + id).DataTable({
                "language": languages[locale],
                "processing": true,
                "ajax": {
                    "url": api.url('querytool_get_resource_data', 'sql_string=' + sql_string),
                    "dataSrc": "result"
                },
                "columns": [{
                        'data': main_value.toLowerCase(),
                        'title': main_value.charAt(0).toUpperCase() + main_value.slice(1),
                        //check for long decimal numbers and round to fixed 5 decimal points
                        render: function(val) {
                            if (!isNaN(val)) {
                                var data = '';
                                if ((val % 1) != 0) {
                                    var places = val.toString().split(".")[1].length;
                                    if (places > 5) {
                                        var data = parseFloat(val).toFixed(5);
                                        return data;
                                    }
                                    return val;
                                } else {
                                    return val;
                                }
                            }
                            return val;
                        }
                    },
                    {
                        'data': y_axis.toLowerCase(),
                        'title': y_axis.charAt(0).toUpperCase() + y_axis.slice(1),
                        //check for long decimal numbers and round to fixed 5 decimal points
                        render: function(val) {
                            if (!isNaN(val)) {
                                var data = '';
                                if ((val % 1) != 0) {
                                    var places = val.toString().split(".")[1].length;
                                    if (places > 5) {
                                        var data = parseFloat(val).toFixed(5);
                                        return data;
                                    }
                                    return val;
                                } else {
                                    return val;
                                }
                            }
                            return val;
                        }
                    }
                ],
                //download table data options
                dom: dom_class + 'r<lf>tip<"dtf-butons"B>',
                buttons: [{
                        'extend': 'csv',
                        'className': dt_buttons_className
                    },
                    {
                        'extend': 'excel',
                        'className': dt_buttons_className
                    },
                    {
                        'extend': 'pdf',
                        'className': dt_buttons_className
                    }
                ],
                "destroy": true /* <---- this setting reinitialize the table */
            });
            // Change table Title value
            $("div.dt-header" + id).html(title);
            //this.dataTable.buttons().container().insertAfter($('div.dataTables_paginate', this.dataTable.table().container() ));
        },

        updateTable: function() {
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
