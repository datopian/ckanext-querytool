/*

This modules handles displaying a table item

Options:

*/
"use strict";
ckan.module("querytool-table", function () {
  var t = {
      es: {
          sProcessing: "Procesando...",
          sLengthMenu: "Mostrar _MENU_ registros",
          sZeroRecords: "No se encontraron resultados",
          sEmptyTable: "Ningún dato disponible en esta tabla",
          sInfo: "Mostrando registros del _START_ al _END_ de un total de _TOTAL_ registros",
          sInfoEmpty: "Mostrando registros del 0 al 0 de un total de 0 registros",
          sInfoFiltered: "(filtrado de un total de _MAX_ registros)",
          sInfoPostFix: "",
          sSearch: "Buscar:",
          sUrl: "",
          sInfoThousands: ",",
          sLoadingRecords: "Cargando...",
          oPaginate: { sFirst: "Primero", sLast: "Último", sNext: "Siguiente", sPrevious: "Anterior" },
          oAria: { sSortAscending: ": Activar para ordenar la columna de manera ascendente", sSortDescending: ": Activar para ordenar la columna de manera descendente" },
      },
      fr: {
          sProcessing: "Traitement en cours...",
          sSearch: "Rechercher&nbsp;:",
          sLengthMenu: "Afficher _MENU_ &eacute;l&eacute;ments",
          sInfo: "Affichage de l'&eacute;l&eacute;ment _START_ &agrave; _END_ sur _TOTAL_ &eacute;l&eacute;ments",
          sInfoEmpty: "Affichage de l'&eacute;l&eacute;ment 0 &agrave; 0 sur 0 &eacute;l&eacute;ment",
          sInfoFiltered: "(filtr&eacute; de _MAX_ &eacute;l&eacute;ments au total)",
          sInfoPostFix: "",
          sLoadingRecords: "Chargement en cours...",
          sZeroRecords: "Aucun &eacute;l&eacute;ment &agrave; afficher",
          sEmptyTable: "Aucune donn&eacute;e disponible dans le tableau",
          oPaginate: { sFirst: "Premier", sPrevious: "Pr&eacute;c&eacute;dent", sNext: "Suivant", sLast: "Dernier" },
          oAria: { sSortAscending: ": activer pour trier la colonne par ordre croissant", sSortDescending: ": activer pour trier la colonne par ordre d&eacute;croissant" },
          select: { rows: { _: "%d lignes séléctionnées", 0: "Aucune ligne séléctionnée", 1: "1 ligne séléctionnée" } },
      },
      pt_BR: {
          sEmptyTable: "Nenhum registro encontrado",
          sInfo: "Mostrando de _START_ até _END_ de _TOTAL_ registros",
          sInfoEmpty: "Mostrando 0 até 0 de 0 registros",
          sInfoFiltered: "(Filtrados de _MAX_ registros)",
          sInfoPostFix: "",
          sInfoThousands: ".",
          sLengthMenu: "_MENU_ resultados por página",
          sLoadingRecords: "Carregando...",
          sProcessing: "Processando...",
          sZeroRecords: "Nenhum registro encontrado",
          sSearch: "Pesquisar",
          oPaginate: { sNext: "Próximo", sPrevious: "Anterior", sFirst: "Primeiro", sLast: "Último" },
          oAria: { sSortAscending: ": Ordenar colunas de forma ascendente", sSortDescending: ": Ordenar colunas de forma descendente" },
      },
      zh_CN: {
          sProcessing: "处理中...",
          sLengthMenu: "显示 _MENU_ 项结果",
          sZeroRecords: "没有匹配结果",
          sInfo: "显示第 _START_ 至 _END_ 项结果，共 _TOTAL_ 项",
          sInfoEmpty: "显示第 0 至 0 项结果，共 0 项",
          sInfoFiltered: "(由 _MAX_ 项结果过滤)",
          sInfoPostFix: "",
          sSearch: "搜索:",
          sUrl: "",
          sEmptyTable: "表中数据为空",
          sLoadingRecords: "载入中...",
          sInfoThousands: ",",
          oPaginate: { sFirst: "首页", sPrevious: "上页", sNext: "下页", sLast: "末页" },
          oAria: { sSortAscending: ": 以升序排列此列", sSortDescending: ": 以降序排列此列" },
      },
  },
  e = function (t, e, n) {
      var r = ckan.sandbox().client.endpoint + "/api/3/action/" + t + "?" + (e = $.param(e));
      $.getJSON(r, n);
  };
  var updateCount = 0;
  return {
      initialize: function () {
          this.createTable();
          var t = this.el.closest(".table_item");
          t.length > 0 && t.find(".update-table-btn").click(this.updateTable.bind(this));
          this.sandbox.subscribe("querytool:updateTables", this.updateTable.bind(this));
      },
      createTable: function (n, r, o, sv_= "", isUpdated = false) {
          var i = this,
              a = this.options.table_id,
              u = $("html").attr("lang"),
              s = (this.options.resource_id, n || this.options.y_axis),
              c = !0 === this.options.measure_label ? "" : this.options.measure_label,
              l = this.options.main_value;
          !0 === l && (l = $("[name*=table_main_value_]").val()), o && (l = r);


          if(sv_ !== "") {
              var sv = sv_
          } else {
              var sv = !0 === this.options.second_value ? "" : this.options.second_value
          }


          if(sv_ == "empty") {
              var sv = ""
          }

          //console.log(sv_)
          //console.log(sv)
          //console.log("TABLE");
          //console.log(this.options);

          //var queryFilters = "";
          //var queryFilters = (this.options.query_filters === true) ? [] : this.options.query_filters;
          //if (queryFilters.length) queryFilters = (this.options.info_query_filters === true) ? [] : this.options.info_query_filters;
          //queryFilters = this.options.info_query_filters;
          //console.log(queryFilters)


          //Custom solution 
          var queryFilters = [];
          if (this.options.info_query_filters.length > 0) {
              if(this.options.info_query_filters === true) {
                  queryFilters = [];
              } else {
                  queryFilters = this.options.info_query_filters;
              }
          }

          var optionalFilterName = (this.options.filter_name === true) ? '' : this.options.filter_name;
          var optionalFilterSlug = (this.options.filter_slug === true) ? '' : this.options.filter_slug;
          var optionalFilterValue = (this.options.filter_value === true) ? '' : this.options.filter_value;
          var optionalFilter = optionalFilterName ? {name: optionalFilterName, slug: optionalFilterSlug, value: optionalFilterValue} : undefined;
          
          var f = !0 === this.options.category_name ? "" : this.options.category_name,
              p = this.renderChartTitle(this.options.table_title,{
                  measure: {name: this.options.y_axis, alias: this.options.measure_label},
                  filters: queryFilters,
                  optionalFilter: optionalFilter,
              }),
              d = this.create_sql_string(l, sv, s, f);
          p = p.replaceAll('&#39;', '\'')
          e("querytool_get_resource_data", { sql_string: d }, function (e) {
              var n = e.result;
              console.log(e.result);
              i.sortData(n, s.toLowerCase(), l.toLowerCase());

              if(sv == ''){
                  s = s+"_";
              }
              var r = f ? i.render_data_table_with_category(n, f, l, sv, s, c) : i.render_data_table(n, l, sv, s, c),
                  o = $("#table-item-" + a);
              
              var dtConfig = {
                  language: t[u],
                  dom: '<"dt-header' + a + '">r<lf>tip<"dtf-butons"B>',
                  buttons: [
                      { extend: "csv", className: "btn btn-default" },
                      { extend: "excel", className: "btn btn-default" },
                      { extend: "pdf", className: "btn btn-default" },
                  ],
                  processing: !0,
                  rowsGroup: [
                      0
                  ],
                  "pageLength": 25,
                  order: [[ 1, 'asc' ], [ 0, 'asc' ]]
              }
              
              //Initialise Datatable if its not update
              if(!isUpdated) {
                  o.html(r)
                  o.DataTable(dtConfig)
                  $("div.dt-header" + a).text(p);
              } else {

                  //Hide the previous DT
                  $("#table-item-"+a+"_wrapper").parents('.preview-wrapper').hide()
                  if(updateCount >= 1) {
                      $('#new-table-'+updateCount+' table').parents('.preview-wrapper').hide()
                  }

                  updateCount = updateCount + 1
                  $("<div class='preview-wrapper' id='new-table-"+updateCount+"'>"+r+"</div>").insertAfter( $("#table-item-"+ a +"_wrapper").closest('.preview-wrapper'));
                  $('#new-table-'+updateCount+' table').addClass('row-border table-bordered stripe')
                  $('#new-table-'+updateCount+' table').DataTable(dtConfig)
                  $("div.dt-header" + a).text(p);
              }

              
          });
      },
      create_sql_string: function (t, sv, e, n) {
          var r = this.options.sql_string.split("*")[1],
              o = !0 === this.options.filter_name ? "" : this.options.filter_name,
              i = !0 === this.options.filter_value ? "" : this.options.filter_value,
              sql = '';
          if (typeof i === 'string') {
              if (i.includes('\'')) {
                  this.options.filter_value = this.options.filter_value.replaceAll('\'', '\'\'')
              }
          }
          o && i && (r += ' AND ("' + this.options.filter_name + "\" = '" + this.options.filter_value + "')");
          if (sv !== '') {
            var second_value_sql = `, "${sv}"`
          } else {
            var second_value_sql = ""
          }
          if (n) {
            if (sv != '') {
              sql = 'SELECT "' + n + '", "' + t + '"'+ second_value_sql +', SUM("' + e + '") as "' + e + '"' + r + ' GROUP BY "' + n + '", "' + t + '"'+ second_value_sql +'';
            } else {
              sql = 'SELECT "' + n + '", "' + t + '", SUM("' + e + '") as "' + e + '_"' + r + ' GROUP BY "' + n + '", "' + t + '"'
            }
          } else {
            if (sv != '') {
              sql = 'SELECT "' + t + '"'+ second_value_sql +', SUM("' + e + '") as "' + e + '"' + r + ' GROUP BY "' + t + '"'+ second_value_sql +'';
            } else {
              sql = 'SELECT "' + t + '", SUM("' + e + '") as "' + e + '_"' + r + ' GROUP BY "' + t + '"';
            }
          }

          return sql;

      },
      render_data_table: function (t, e, sv, n, r) {
          
          var o = { main_value: (e = e.toLowerCase()), second_value: (sv = sv.toLowerCase()), measure_label: r, y_axis: (n = n.toLowerCase()), rows: t };
          if (sv != '') {
            return this.render_template(
                "\n          <table>\n            <thead>\n              <tr>\n                <th>{main_value|capitalize}</th>\n                <th>{second_value|capitalize}</th>\n                <th>{measure_label|capitalize}</th>\n              </tr>\n            </thead>\n            <tbody>\n              {% for row in rows %}\n                <tr>\n                  <td>{row[main_value]|process_table_value}</td>\n                  <td>{row[second_value]|process_table_value}</td>\n                  <td>{row[y_axis]|process_table_value}</td>\n                </tr>\n              {% endfor   %}\n            </tbody>\n          </table>\n          ",
                o
            );
          } else {
            return this.render_template(
                "\n          <table>\n            <thead>\n              <tr>\n                <th>{main_value|capitalize}</th>\n                <th>{measure_label|capitalize}</th>\n              </tr>\n            </thead>\n            <tbody>\n              {% for row in rows %}\n                <tr>\n                  <td>{row[main_value]|process_table_value}</td>\n                  <td>{row[y_axis]|process_table_value}</td>\n                </tr>\n              {% endfor   %}\n            </tbody>\n          </table>\n          ",
                o
            );
        }
      },
      render_data_table_with_category: function (rows, category_name, main_value, second_value, y_axis, measure_label) {
          category_name = category_name.toLowerCase();
          main_value = main_value.toLowerCase();
          second_value = second_value.toLowerCase();
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
          var sub_dimen_map = [];
          var i = 0;

          if(second_value.length > 0) {
              for (let row of rows) {
                  var index = sub_dimen_map.findIndex(function(item, index) {
                      return (item[main_value] === row[main_value]) && (item[second_value] === row[second_value]) ? true : false;
                  });

                  if(index !== -1) {
                      sub_dimen_map[index][row[category_name]] = row[y_axis];
                  } else {
                      //Preparing Keys
                      var obj = {};
                      obj[main_value] = row[main_value];
                      obj[second_value] = row[second_value];
                      obj[row[category_name]] = row[y_axis];

                      //Preparing values 
                      sub_dimen_map.push(obj);
                  }
                  
                  i++;
                  y_axis_groups[row[category_name]] = true;
              };
              rows_mapping = sub_dimen_map;
          } else {
              for (let row of rows) {
                  // Get ma
                  if (!rows_mapping[row[main_value]]) rows_mapping[row[main_value]] = {};
                  var mapping_item = rows_mapping[row[main_value]];

                  // Pivot table
                  mapping_item[main_value] = row[main_value];
                  mapping_item[second_value] = row[second_value];
                  mapping_item[row[category_name]] = row[y_axis];

                  // Sub headers
                  y_axis_groups[row[category_name]] = true;
              };
          }

          var data = {
              main_value: main_value,
              second_value: second_value,
              measure_label: measure_label,
              y_axis: y_axis,
              y_axis_groups: Object.keys(y_axis_groups).sort(),
              rows: Object.values(rows_mapping),
          };

          // Prepare template
          var template = '';
          if(second_value) {
              template = `
              <table>
                  <thead>
                  <tr>
                      <th rowspan="2">{main_value|capitalize}</th>
                      <th rowspan="2">{second_value|capitalize}</th>
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
                      <td>{row[second_value]|process_table_value}</td>
                      {% for y_axis_group in y_axis_groups %}
                          <td>{row[y_axis_group]|process_table_value}</td>
                      {% endfor %}
                      </tr>
                  {% endfor %}
                  </tbody>
              </table>
              `;
          } else {
                  template = `
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
          }
          
          // Render
          return this.render_template(template, data);
      },
      render_template: function (t, e) {
          try {
              var n = nunjucks.configure({ tags: { variableStart: "{", variableEnd: "}" } });
              return n.addFilter("process_table_value", this.process_table_value.bind(this)), n.renderString(t, e);
          } catch (t) {
              return "";
          }
      },
      process_table_value: function (t) {
          if (isNaN(t)) return t;
          var e = !0 === this.options.data_format ? "" : this.options.data_format,
              n = 0,
              r = "";
          return "$" === e ? ((n = this.countDecimals(t, 2)), (r = d3.format("$,." + n + "f"))) : "s" === e ? ((t = Math.round(10 * t) / 10), (r = d3.format(e))) : (r = d3.format(e)), r(t);
      },
      countDecimals: function (t, e) {
          return Math.min((10 * t) % 1 ? 2 : t % 1 ? 1 : 0, e);
      },
      updateTable: function () {
          var t = $("[name=choose_y_axis_column]").val(),
              e = this.el.parent().parent().find("[id*=table_main_value_]").val(),
              sv = this.el.parent().parent().find("[id*=table_second_value_]").val(),
              n = $("#choose_y_axis_column option:selected").text();

              if(sv.length==0) {
                  sv="empty"
              }
          (this.options.category_name = this.el.parent().parent().find("[id*=table_category_name_]").val()),
              (this.options.data_format = this.el.parent().parent().find("[id*=table_data_format_]").val()),
              (this.options.filter_name = this.el.parent().parent().find("[id*=table_field_filter_name_]").val()),
              (this.options.filter_value = this.el.parent().parent().find("[id*=table_field_filter_value_]").val()),
              (this.options.table_title = this.el.parent().parent().find("[id*=table_field_title_]").val()),
              (this.options.measure_label = n),
              this.createTable(t, e, !0, sv, true);
      },
      sortData: function (t, e, n) {
          t.sort(function (t, e) {
              var r = t[n],
                  o = e[n];
              if (isNaN(r) || isNaN(o)) {
                  var i,
                      a = r.match(/^\d{1,2}\./),
                      u = o.match(/^\d{1,2}\./);
                  return a && u ? (0 === (i = parseInt(a[0]) - parseInt(u[0])) ? 0 : i / Math.abs(i)) : a && !u ? -1 : !a && u ? 1 : r < o ? -1 : r > o ? 1 : 0;
              }
              return 0 === (i = Number(r) - Number(o)) ? 0 : i / Math.abs(i);
          })

          t.forEach(function(record) {

              if (isNaN(record[n])) {
                  //Custom Sorting Solution 
                  record[Object.keys(record)[0]] = record[Object.keys(record)[0]].replace(/^\d{1,2}\./, '');
             
                  record[n] = record[n].replace(/^\d{1,2}\./, '');
              }
          });
          //console.log(t)
      },
      teardown: function () {
          this.sandbox.unsubscribe("querytool:updateTables", this.updateTable.bind(this));
      },
      renderChartTitle: function (title, options) {

          // Configure nunjucks
          var env = nunjucks.configure({tags: {variableStart: '{', variableEnd: '}'}});

          // Prepare data
          var data = {measure: options.measure.alias};
          for (let filter of options.filters) data[filter.slug] = filter.value;
          if (options.optionalFilter) data.optional_filter = options.optionalFilter.value;

          // Render and return
          try {
              return env.renderString(title, data);
          } catch (error) {
              return title;
          }

      }
  };
});
