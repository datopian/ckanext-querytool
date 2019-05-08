/*

This modules handles displaying a table item

Options:

*/
"use strict";
ckan.module('querytool-table', function() {

    // Languages for datables
    var LANGUAGES = {
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

    // CKAN API gateway
    var api = {
        get: function(action, params, callback) {
            var api_ver = 3;
            var base_url = ckan.sandbox().client.endpoint;
            params = $.param(params);
            var url = base_url + '/api/' + api_ver + '/action/' + action + '?' + params;
            $.getJSON(url, callback);
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

    // Create module
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
            var module = this;

            // Prepare settings
            var id = this.options.table_id;
            var locale = $('html').attr('lang');
            var resource_id = this.options.resource_id;
            var y_axis = (yVal) ? yVal : this.options.y_axis;
            var measure_label = (this.options.measure_label === true) ? '' : this.options.measure_label;
            var main_value = this.options.main_value;
            if (main_value === true) main_value = $('[name*=table_main_value_]').val();
            if (fromUpdate) main_value = xVal;
            var category_name = (this.options.category_name === true) ? '' : this.options.category_name;
            var title = (this.options.table_title === true) ? '' : this.options.table_title;

            // Get data and create table
            var sql_string = this.create_sql_string(main_value, y_axis, category_name);
            api.get('querytool_get_resource_data', {sql_string: sql_string}, function (response) {
              var rows = response.result;
              module.sortData(rows, y_axis.toLowerCase(), main_value.toLowerCase());

              // Render table HTML
              var html = !category_name
                ? module.render_data_table(rows, main_value, y_axis, measure_label)
                : module.render_data_table_with_category(rows, category_name, main_value, y_axis, measure_label)

              // Enable jquery.datatable
              var table = $('#table-item-' + id);
              if ($.fn.DataTable.isDataTable(table)) table.DataTable().destroy();
              table.html(html);
              table.DataTable({
                  "language": LANGUAGES[locale],
                  //download table data options
                  dom: '<"dt-header' + id + '">' + 'r<lf>tip<"dtf-butons"B>',
                  buttons: [
                    {'extend': 'csv', 'className': 'btn btn-default'},
                    {'extend': 'excel', 'className': 'btn btn-default'},
                    {'extend': 'pdf', 'className': 'btn btn-default'},
                  ],
                  "processing": true,
              });

              // Set title value
              $("div.dt-header" + id).text(title);

            });
        },

        create_sql_string: function(main_value, y_axis, category_name) {

            // Get settings
            var parsedSqlString = this.options.sql_string.split('*');
            var sqlStringExceptSelect = parsedSqlString[1];
            var filter_name = (this.options.filter_name === true) ? '' : this.options.filter_name;
            var filter_value = (this.options.filter_value === true) ? '' : this.options.filter_value;

            // If additional table filter is set extend the current sql with the new filter
            if (filter_name && filter_value) {
                var filterSql = ' AND ("' + this.options.filter_name + '"' + " = '" + this.options.filter_value + "')"
                sqlStringExceptSelect = sqlStringExceptSelect + filterSql;
            }

            // If category is set
            // we need the first column as a pivot column
            // see comments inside this.render_data_table_with_category
            if (!category_name) {
              return 'SELECT ' + '"' + main_value + '", SUM("' + y_axis + '") as ' + '"' + y_axis + '"' + sqlStringExceptSelect + ' GROUP BY "' + main_value + '"';
            } else {
              return 'SELECT ' + '"' + category_name + '", "' + main_value + '", SUM("' + y_axis + '") as ' + '"' + y_axis + '"' + sqlStringExceptSelect + ' GROUP BY "' + category_name + '", "' + main_value + '"';
            }

        },

        // default tables
        render_data_table: function(rows, main_value, y_axis, measure_label) {
          main_value = main_value.toLowerCase();
          y_axis = y_axis.toLowerCase();

          // Prepare data
          var data = {
            main_value: main_value,
            measure_label: measure_label,
            y_axis: y_axis,
            rows: rows,
          }

          // Prepare template
          var template = `
          <table>
            <thead>
              <tr>
                <th>{main_value|capitalize}</th>
                <th>{measure_label|capitalize}</th>
              </tr>
            </thead>
            <tbody>
              {% for row in rows %}
                <tr>
                  <td>{row[main_value]|process_table_value}</td>
                  <td>{row[y_axis]|process_table_value}</td>
                </tr>
              {% endfor %}
            </tbody>
          </table>
          `;

          // Render
          return this.render_template(template, data);

        },

        // table for the two-way columns feature
        render_data_table_with_category: function(rows, category_name, main_value, y_axis, measure_label) {
          category_name = category_name.toLowerCase();
          main_value = main_value.toLowerCase();
          y_axis = y_axis.toLowerCase();

          // Prepare data
          // Pivot table when category is set
          // Source:
          //   category_name, main_value, y_axis
          //   cat1, string, number
          //   cat2, string, number
          // Target:
          //   main_value, y_axis for cat1, y_axis for cat2
          //   string, number, number
          //   string, number, number
          var rows_mapping = {};
          var y_axis_groups = {};
          for (let row of rows) {

            // Get ma
            if (!rows_mapping[row[main_value]]) rows_mapping[row[main_value]] = {};
            var mapping_item = rows_mapping[row[main_value]];

            // Pivot table
            mapping_item[main_value] = row[main_value];
            mapping_item[row[category_name]] = row[y_axis];

            // Sub headers
            y_axis_groups[row[category_name]] = true;

          };
          var data = {
            main_value: main_value,
            measure_label: measure_label,
            y_axis: y_axis,
            y_axis_groups: Object.keys(y_axis_groups).sort(),
            rows: Object.values(rows_mapping),
          };

          // Prepare template
          var template = `
          <table>
            <thead>
              <tr>
                <th rowspan="2">{main_value|capitalize}</th>
                <th colspan="{y_axis_groups.length}">{measure_label|capitalize}</th>
              </tr>
              <tr>
                {% for y_axis_group in y_axis_groups %}
                  <th>{y_axis_group}</th>
                {% endfor %}
              </tr>
            </thead>
            <tbody>
              {% for row in rows %}
                <tr>
                  <td>{row[main_value]|process_table_value}</td>
                  {% for y_axis_group in y_axis_groups %}
                    <td>{row[y_axis_group]|process_table_value}</td>
                  {% endfor %}
                </tr>
              {% endfor %}
            </tbody>
          </table>
          `;

          // Render
          return this.render_template(template, data);

        },

        // render template unsing nunjucks
        render_template: function(template, data) {
          try {
            var env = nunjucks.configure({tags: {variableStart: '{', variableEnd: '}'}});
            env.addFilter('process_table_value', this.process_table_value.bind(this))
            return env.renderString(template, data);
          } catch (error) {
            return '';
          }
        },

        //check for long decimal numbers and round to fixed 5 decimal points
        process_table_value: function(val) {
          if (isNaN(val)) {
            return val;
          };
          var dataf = (this.options.data_format === true) ? '' : this.options.data_format;
          var digits = 0;
          var format = '';
          // Currency
          if (dataf === '$') {
              // Add a coma for the thousands and limit the number of decimals to two:
              // $ 2,512.34 instead of $2512.3456
              digits = this.countDecimals(val, 2);
              format = d3.format('$,.' + digits + 'f');
          // Rounded
          } else if (dataf === 's') {
              // Limit the number of decimals to one: 2.5K instead of 2.5123456K
              val = Math.round(val*10) / 10;
              format = d3.format(dataf);
          // Others
          } else {
              format = d3.format(dataf);
          }
          return format(val);
        },

        // count format decimals limited by "max"
        countDecimals: function (val, max) {
          return Math.min(val*10 % 1 ? 2 : val % 1 ? 1 : 0, max);
        },

        updateTable: function() {
            var yVal = $('[name=choose_y_axis_column]').val();
            var xVal = this.el.parent().parent().find('[id*=table_main_value_]').val();
            var measureLabelVal = $('#choose_y_axis_column option:selected').text();
            this.options.category_name = this.el.parent().parent().find('[id*=table_category_name_]').val();
            this.options.data_format = this.el.parent().parent().find('[id*=table_data_format_]').val();
            this.options.filter_name = this.el.parent().parent().find('[id*=table_field_filter_name_]').val();
            this.options.filter_value = this.el.parent().parent().find('[id*=table_field_filter_value_]').val();
            this.options.table_title = this.el.parent().parent().find('[id*=table_field_title_]').val();
            this.options.measure_label = measureLabelVal;
            this.createTable(yVal, xVal, true);
        },

        sortData: function(records, y_axis, x_axis) {
            records.sort(function(a, b) {
                var x = a[x_axis];
                var y = b[x_axis];
                if (!isNaN(x) && !isNaN(y)) {
                    var difference = Number(x) - Number(y);
                    if (difference === 0) {
                      return 0
                    }
                    return difference / Math.abs(difference);
                } else {
                    // Check if value contains '1.' which indicates about
                    // custom order:
                    var match1 = x.match(/^\d{1,2}\./);
                    var match2 = y.match(/^\d{1,2}\./);
                    // If both values have custom order indicators, then
                    // we want to compare two values:
                    if (match1 && match2) {
                        var difference = parseInt(match1[0]) - parseInt(match2[0]);
                        if (difference === 0) {
                          return 0
                        }
                        return difference / Math.abs(difference);
                    } else if (match1 && !match2) {
                        // if second value doesn't contain it, then it comes
                        // after the first one:
                        return -1
                    } else if (!match1 && match2) {
                        // Ditto here:
                        return 1
                    }
                    if (x < y) //sort string ascending
                        return -1;
                    if (x > y)
                        return 1;
                    return 0; //default return value (no sorting)
                }
            });
            // Remove '1.' from the content:
            records.forEach(function(record) {
              if (isNaN(record[x_axis])) {
                record[x_axis] = record[x_axis].replace(/^\d{1,2}\./, '');
              }
            });
        },

        teardown: function() {
            // We must always unsubscribe on teardown to prevent memory leaks.
            this.sandbox.unsubscribe('querytool:updateTables', this.updateTable.bind(this));
        }
    }
});
