/*

This modules handles displaying a visualization item

Options:
    - type (Type of the visualization item: chart)
    - colors (Pattern of colors)
    - x_axis (Column name of x axis)
    - y_axis (Column name of y axis)
    - sql_string (SQL string the contains filters)
    - chart_type (What type of chart needs to be rendered)
    - title (Chart title)
    - show_legend ( Display or hide charts legend)
    - x_text_rotate ( Display text horizontal or vertical)
    - x_text_multiline ( Display the x axis text in one line or multiline)
    - x_tick_culling_max (the number of tick texts will be adjusted to less than this value)
    - tooltip_name (Title of the tooltip)
    - data_format (Charts data format e.g 2k, $2000, 2000.0, 2000.00)
    - y_tick_format (Y axis data format e.g 2k, $2000, 2000.0, 2000.00)
    - chart_padding_top (Add chart padding from the outside)
    - chart_padding_bottom (Add chart padding from the outside)
    - padding_top (Add charts padding)
    - padding_bottom (Add charts padding)
    - show_labels (Display or hide charts labels)
    - y_label (Aditional label added in y axis)
    - filter_name (The name of the chart filter)
    - filter_value (The value of the chart filter)
    - category_name (The value of the chart category)
    - data_sort (Sort data, asc or desc)
    - show_labels_as_percentages (works with pie and donut charts)

*/
'use strict';
ckan.module("querytool-viz-preview", function() {
     var t = function(t, e) {
         var n = ckan.sandbox().client.endpoint + "/api/3/action/" + t;
         return $.post(n, JSON.stringify(e), "json")
     };
     return {
         initialize: function() {
             var t = this.create_sql();

             if (typeof this.options.x_axis !== 'boolean') {
               this.get_resource_datа(t);
             }

             var e = this.el.closest(".chart_field");
             if (e.length > 0) {
                 var n = e.find(".update-chart-btn"),
                     i = e.find(".delete-chart-btn");
                 n.click(this.updateChart.bind(this)), i.click(this.deleteChart.bind(this))
             }
             this.sandbox.subscribe("querytool:updateCharts", this.updateChart.bind(this))
         },
         create_sql: function() {
             var t = this.options.sql_string.split("*")[1];
             t = t.replace("+", "%2B");
             var e = !0 === this.options.filter_name ? "" : this.options.filter_name,
                 n = !0 === this.options.filter_value ? "" : this.options.filter_value,
                 i = !0 === this.options.y_axis ? "" : this.options.y_axis,
                 r = !0 === this.options.static_reference_columns ? [] : this.options.static_reference_columns,
                 o = this.getStaticReferenceColumn(r, i);
             !0 === this.options.category_name || this.options.category_name;

             var tmp_filter_value = n;
             var tmp_filter_name = e;

             if (tmp_filter_value && typeof tmp_filter_value == 'string') {
               if (tmp_filter_value.includes('\'')) {
                 tmp_filter_value = tmp_filter_value.replaceAll('\'', '\'\'')
               }
               if (tmp_filter_value.includes('&')) {
                 tmp_filter_value = tmp_filter_value.replaceAll('&', '\\0026')
               }
             }

             e && n && (t += ' AND ("' + tmp_filter_name + "\" = '" + tmp_filter_value + "')");
             var sql,
                 ub = this.options.upper_bounds,
                 lb = this.options.lower_bounds;
             if ([ub, lb].includes(i)) {
               ub = ''
               lb = ''
             }
             if (o) {
               if ((!['undefined', 'None', ''].includes(ub) && !['undefined', 'None', ''].includes(lb)) && (typeof ub !== 'boolean' && typeof lb !== 'boolean')) {
                 sql = 'SELECT AVG("' + o + '") as static_reference_column, "' + this.options.x_axis + '", SUM("' + ub + '") as "' + ub.toLowerCase() + '", SUM("' + lb + '") as "' + lb.toLowerCase() + '", SUM("' + this.options.y_axis + '") as "' + this.options.y_axis + '"' + t + ' GROUP BY "' + this.options.x_axis + '"';
               } else {
                 sql = 'SELECT AVG("' + o + '") as static_reference_column, "' + this.options.x_axis + '", SUM("' + this.options.y_axis + '") as "' + this.options.y_axis + '"' + t + ' GROUP BY "' + this.options.x_axis + '"';
               }
             } else {
               if ((!['undefined', 'None', ''].includes(ub) && !['undefined', 'None', ''].includes(lb)) && (typeof ub !== 'boolean' && typeof lb !== 'boolean')) {
                 sql = 'SELECT "' + this.options.x_axis + '", SUM("' + ub + '") as "' + ub.toLowerCase() + '", SUM("' + lb + '") as "' + lb.toLowerCase() + '", SUM("' + this.options.y_axis + '") as "' + this.options.y_axis + '"' + t + ' GROUP BY "' + this.options.x_axis + '"';
               } else {
                 sql = 'SELECT "' + this.options.x_axis + '", SUM("' + this.options.y_axis + '") as "' + this.options.y_axis + '"' + t + ' GROUP BY "' + this.options.x_axis + '"';
               }
             }
             return sql
         },
         "get_resource_datа": function(e) {
             var n = !0 === this.options.category_name ? "" : this.options.category_name,
                 i = !0 === this.options.x_axis ? "" : this.options.x_axis,
                 r = !0 === this.options.y_axis ? "" : this.options.y_axis,
                 ub = !0 === this.options.upper_bounds ? "" : this.options.upper_bounds,
                 lb = !0 === this.options.lower_bounds ? "" : this.options.lower_bounds,
                 o = e.split("FROM")[1].split("WHERE")[0].split('"')[1],
                 a = this.options.chart_type,
                 s = !0 === this.options.filter_name ? "" : this.options.filter_name,
                 c = !0 === this.options.filter_value ? "" : this.options.filter_value,
                 u = !0 === this.options.static_reference_columns ? [] : this.options.static_reference_columns,
                 l = this.getStaticReferenceColumn(u, r),
                 f = !0 === this.options.dynamic_reference_type ? "" : this.options.dynamic_reference_type,
                 p = !0 === this.options.dynamic_reference_factor ? "" : this.options.dynamic_reference_factor,
                 h = $("#visualizations-form").data("mainFilters"),
                 _ = !0 === this.options.query_filters ? h : this.options.query_filters,
                 d = {};
             s && c && (d = {
                 name: s,
                 value: typeof c === 'string' ? c.replaceAll('&', '\\0026') : c
             }), t("querytool_get_chart_data", {
                 category: n,
                 sql_string: e,
                 resource_id: o,
                 x_axis: i,
                 y_axis: r,
                 upper_bounds: ub,
                 lower_bounds: lb,
                 chart_type: a,
                 previous_filters: JSON.stringify(_),
                 chart_filter: JSON.stringify(d)
             }).done(function(t) {
                 if (t.success) {
                     if (this.fetched_data = t.result, this.y_axis_max = null, this.y_axis_avg = null, this.y_axis_min = null, this.static_reference_value = null, this.dynamic_reference_value = null, n) this.y_axis_max = this.fetched_data.y_axis_max, this.y_axis_avg = this.fetched_data.y_axis_avg, this.y_axis_min = this.fetched_data.y_axis_min, delete this.fetched_data.y_axis_max, delete this.fetched_data.y_axis_avg, delete this.fetched_data.y_axis_min;
                     else {
                         var e = [],
                             i = !0,
                             o = !1,
                             a = void 0;
                         try {
                             for (var s, c = this.fetched_data[Symbol.iterator](); !(i = (s = c.next()).done); i = !0) {
                                 var u = s.value;
                                 e.push(+u[r.toLowerCase()])
                             }
                         } catch (t) {
                             o = !0, a = t
                         } finally {
                             try {
                                 i || null == c.return || c.return()
                             } finally {
                                 if (o) throw a
                             }
                         }
                         this.y_axis_max = Math.max.apply(null, e), this.y_axis_avg = e.reduce(function(t, e) {
                             return t + e
                         }, 0) / e.length, this.y_axis_min = Math.min.apply(null, e)
                     }
                     if (l)
                         if (n) this.static_reference_value = this.fetched_data.static_reference_value, delete this.fetched_data.static_reference_value;
                         else {
                             var h = [],
                                 _ = !0,
                                 d = !1,
                                 v = void 0;
                             try {
                                 for (var y, m = this.fetched_data[Symbol.iterator](); !(_ = (y = m.next()).done); _ = !0) {
                                     u = y.value;
                                     h.push(+u.static_reference_column), delete u.static_reference_column
                                 }
                             } catch (t) {
                                 d = !0, v = t
                             } finally {
                                 try {
                                     _ || null == m.return || m.return()
                                 } finally {
                                     if (d) throw v
                                 }
                             }
                             this.static_reference_value = h.reduce(function(t, e) {
                                 return t + e
                             }, 0) / h.length
                         } f && ("Maximum" === f ? this.dynamic_reference_value = this.y_axis_max : "Average" === f ? this.dynamic_reference_value = this.y_axis_avg : "Minimum" === f && (this.dynamic_reference_value = this.y_axis_min), "" !== p && (this.dynamic_reference_value = this.dynamic_reference_value * p)), this.createChart(this.fetched_data)
                 } else this.el.text(this._("Chart could not be created."))
             }.bind(this)).error(function(t) {
                 this.el.text(this._("Chart could not be created."))
             }.bind(this))
         },
         createChart: function(t) {
             var e, n = this.options.x_axis.toLowerCase(),
                 i = this.options.y_axis.toLowerCase(),
                 r = t,
                 o = this.options.show_legend,
                 sa = this.options.show_annotations,
                 a = this.options.x_text_rotate,
                 s = this.options.x_text_multiline,
                 c = this.options.x_tick_culling_max,
                 u = this.options.tooltip_name,
                 l = this.options.data_format,
                 f = this.options.y_tick_format,
                 xf = this.options.x_tick_format,
                 p = (!0 === this.options.chart_padding_left || this.options.chart_padding_left, !0 === this.options.chart_padding_bottom || this.options.chart_padding_bottom, !0 === this.options.padding_top || this.options.padding_top, !0 === this.options.padding_bottom || this.options.padding_bottom, !0 === this.options.tick_count ? "" : this.options.tick_count),
                 h = this.options.show_labels,
                 _ = !0 === this.options.y_label ? null : this.options.y_label,
                 xl = !0 === this.options.x_label ? null : this.options.x_label,
                 d = this.options.y_label_hide,
                 xlh = this.options.x_label_hide,
                 v = this.options.y_from_zero,
                 yp = this.options.axis_range,
                 xfz = this.options.x_from_zero,
                 y = this.options.data_sort,
                 m = this.options.measure_label,
                 ub = !0 === this.options.upper_bounds ? "" : this.options.upper_bounds.toLowerCase(),
                 lb = !0 === this.options.lower_bounds ? "" : this.options.lower_bounds.toLowerCase(),
                 bnds = this.options.show_bounds,
                 g = !0 === this.options.category_name ? "" : this.options.category_name,
                 x = !0 === this.options.static_reference_label ? "" : this.options.static_reference_label,
                 b = !0 === this.options.dynamic_reference_label ? "" : this.options.dynamic_reference_label,
                 x_sort_labels = this.options.x_sort_labels,
                 S = this.options.show_labels_as_percentages || !1,
                 desc = !0 === this.options.description ? "" : this.options.description,
                 line_types = this.options.line_types,
                 line_widths = this.options.line_widths,
                 O = {
                     bindto: this.el[0],
                     /*color: {
                         pattern: this.options.colors.split(",")
                     },*/
                     padding: {
                         right: 50,
                         bottom: 16
                     }
                 },
                 w = !0 === this.options.title ? "" : this.options.title,
                 E = !0 === this.options.query_filters ? [] : this.options.query_filters,
                 plotly = !0 === this.options.plotly ? "" : this.options.plotly;
             E.length || (E = !0 === this.options.info_query_filters ? [] : this.options.info_query_filters);
             var k = !0 === this.options.filter_name ? "" : this.options.filter_name,
                 j = !0 === this.options.filter_slug ? "" : this.options.filter_slug,
                 N = !0 === this.options.filter_value ? "" : this.options.filter_value,
                 P = k ? {
                     name: k,
                     slug: j,
                     value: N.toString()
                 } : void 0;
             desc = this.renderChartTitle(desc, {
                 measure: {
                     name: i,
                     alias: m
                 },
                 filters: E,
                 optionalFilter: P
             });
             //console.log(desc)
             w = this.renderChartTitle(w, {
                 measure: {
                     name: i,
                     alias: m
                 },
                 filters: E,
                 optionalFilter: P
             }), O.title = {
                 text: w,
                 position: "upper-left",
                 padding: {
                     left: 0,
                     right: 0,
                     bottom: 18,
                     top: 0
                 }
             }, O.legend = {
                 show: o
             }, O.tooltip = {
                 format: {}
             };
             var F = d ? "" : _ || m || "",
                 M = y;

             
             
             if (("sbar" === this.options.chart_type || "shbar" === this.options.chart_type) && !this.options.category_name || g || this.sortData(y, r, i, n), O.legend = {
                     show: o
                 }, O.tooltip = {
                     format: {}
                 }, !0 !== u && "" !== u && (O.tooltip.format.title = function(t) {
                     return "donut" === O.data.type || "pie" === O.data.type ? u : u + " " + t
                 }), O.tooltip.format.value = function(t, e, n) {
                     return this.sortFormatData(l, t)
                 }.bind(this), "donut" === this.options.chart_type || "pie" === this.options.chart_type) e = r.map(function(t) {
                 return [t[n], t[i]]
             }), O.data = {
                 columns: e,
                 type: this.options.chart_type,
                 order: "default" === y ? "desc" : y
             }, 0 == S && (O[this.options.chart_type] = {
                 label: {
                     format: function(t, e, n) {
                         return t
                     }
                 }
             });
             else if (("sbar" === this.options.chart_type || "shbar" === this.options.chart_type) && !this.options.category_name) {
                 var I = "shbar" === this.options.chart_type,
                     A = 0;
                 I && (A = a), e = r.map(function(t) {
                     return [t[n], t[i]]
                 }), O.data = {
                     columns: e,
                     type: "bar",
                     order: M
                 };
                 var T = e.map(function(t) {
                     return t[0]
                 });
                 O.data.groups = [T], O.axis = {
                     rotated: I,
                     y: {
                         tick: {
                             count: p,
                             format: function(t) {
                                 return this.sortFormatData(f, t)
                             }.bind(this),
                             rotate: A
                         },
                         padding: {
                             top: 50,
                             bottom: 50
                         }
                     },
                     x: {
                         tick: {
                             rotate: a,
                             multiline: s,
                             multilineMax: 3
                         }
                     }
                 }
             } else {
                 var C = !1,
                     L = this.options.chart_type;
                 A = 0;
                 if ("hbar" === this.options.chart_type && (C = !0, L = "bar", A = a, 2 == r.length && (O.padding = {
                         left: 110
                     })), "bscatter" === this.options.chart_type) {
                     var R = d3.scale.log().base(10).domain([1, 1e3]).range([0, 10]);
                     L = "scatter", O.point = {
                         r: function(t) {
                             var e = t.value;
                             return R(e)
                         },
                         sensitivity: 100,
                         focus: {
                             expand: {
                                 enabled: !0
                             }
                         }
                     }
                 }
                 var D = [];
                 if (g) {
                     var q = {};
                     for (var G in Object.keys(r).sort().forEach(function(t) {
                             q[t] = r[t]
                         }), q) D.push(q[G]);
                     O.data = {
                         x: "x",
                         columns: D,
                         type: L,
                         labels: h
                     }
                 } else {
                     D = r.map(function(t) {
                         return Number(t[i])
                     });
                     var $ = r.map(function(t) {
                         return t[n]
                     });
                     D.unshift(this.options.x_axis), O.data = {
                         columns: [D],
                         type: L,
                         labels: h
                     }
                 }
                 h && (O.data.labels = {
                     format: function(t) {
                         return this.sortFormatData(l, t)
                     }.bind(this)
                 }), "line" === this.options.chart_type ? O.axis = {
                     y: {
                         tick: {
                             count: p,
                             format: function(t) {
                                 return this.sortFormatData(f, t)
                             }.bind(this),
                             rotate: A
                         },
                         padding: {
                             top: 50,
                             bottom: 50
                         },
                         label: {
                             text: F,
                             position: "outer-middle"
                         }
                     },
                     x: {
                         type: "category",
                         categories: $,
                         tick: {
                             culling: {
                                 max: c || 0
                             },
                             rotate: a,
                             multiline: s,
                             multilineMax: 3
                         }
                     },
                     rotated: C
                 } : O.axis = {
                     y: {
                         tick: {
                             count: p,
                             format: function(t) {
                                 return this.sortFormatData(f, t)
                             }.bind(this),
                             rotate: A
                         },
                         padding: {
                             top: 50,
                             bottom: 50
                         },
                         label: {
                             text: F,
                             position: "outer-middle"
                         }
                     },
                     x: {
                         type: "category",
                         categories: $,
                         tick: {
                             rotate: a,
                             multiline: s,
                             multilineMax: 3
                         }
                     },
                     rotated: C
                 }, O.point = {
                     r: 3
                 }
             }

             if (!["sbar", "shbar", "donut", "pie"].includes(this.options.chart_type)) {
                 if (O.grid = {
                         y: {
                             lines: []
                         }
                     }, this.static_reference_value) {
                     O.grid.y.lines.push({
                         value: this.static_reference_value,
                         text: x,
                         class: "base"
                     });
                     var z = this.sortFormatData(l, this.static_reference_value);
                     O.grid.y.lines.push({
                         value: this.static_reference_value,
                         text: x + " (" + z + ")",
                         class: "active html2canvas-ignore"
                     })
                 }
                 if (this.dynamic_reference_value) {
                     O.grid.y.lines.push({
                         value: this.dynamic_reference_value,
                         text: b,
                         class: "base"
                     });
                     var V = this.sortFormatData(l, this.dynamic_reference_value);
                     O.grid.y.lines.push({
                         value: this.dynamic_reference_value,
                         text: b + " (" + V + ")",
                         class: "active html2canvas-ignore"
                     })
                 }(this.static_reference_value || this.dynamic_reference_value) && (O.axis.y.min = Math.min.apply(null, [this.static_reference_value, this.dynamic_reference_value, this.y_axis_min].filter(function(t) {
                     return !isNaN(t) && null !== t
                 })), O.axis.y.max = Math.max.apply(null, [this.static_reference_value, this.dynamic_reference_value, this.y_axis_max].filter(function(t) {
                     return !isNaN(t) && null !== t
                 })), O.axis.y.padding = {
                     bottom: 50,
                     top: 50
                 }, ["bar", "hbar"].includes(this.options.chart_type) && (O.axis.y.padding.bottom = 0))
             } ["line", "area", "spline", "scatter", "bscatter", "bar", "hbar", "sbar", "shbar"].includes(this.options.chart_type) && v && (O.axis.y.min = 0, O.axis.y.padding = O.axis.y.padding || {}, O.axis.y.padding.bottom = 0);

             var plotly = this.options.plotly;
             var q = JSON.parse(JSON.stringify(plotly));

             var data = []
             var columns = O.data['columns'];
             var format = this.options.data_format;
             const dataLabelFormatter = d3.format(format);

             function reorderColumns(columns) {
               if (columns.length > 0) {
                 if (columns[0][0] === 'x') {
                   columns = columns.reverse()
                 }
                 for (i = 0; i < columns.length - 1; i++) {
                   if (columns[i][0] === 'x') {
                     columns.push(columns.splice(i, 1)[0]);
                   }
                 }
               }
               return columns
             }

             columns = reorderColumns(columns)

             // check if annotations are turned on or off
             if(sa==true){
                 var labelsMode = 'lines+markers+text';
                 var scatterLabelsMode = 'markers+text';
             } else {
                 var labelsMode = 'lines+markers';
                 var scatterLabelsMode = 'markers';
             }

             function convertTextTitles(textTitles){
               var convertedTextTitles = [];

               for(i = 0; i < textTitles.length; i++){
                   convertedTextTitles.push(dataLabelFormatter(textTitles[i]));
               }
               return convertedTextTitles;
             }

             //type of line
             var lineTypes = this.options.line_types
             var lineWidths = this.options.line_widths
             
             if (lineTypes.length > 0) {
               var lineTypesList = this.options.line_types.split(',')
             } else {
               var lineTypesList = this.options.line_types
             }

             if (lineWidths.length > 0) {
               var lineWidthsList = this.options.line_widths.split(',')
             } else {
               var lineWidthsList = String(this.options.line_widths)
             }

             if (typeof lineWidths == 'number') {
               lineWidths = String(lineWidths)
             }

             function setDefaultWidth(width) {
               if ([undefined, '0', ''].includes(width)) {
                 return '4'
               } else {
                 return width
               }
             }

             // if typeof plotly is string -> new chart
             // if typeof plotly is object -> existing chart (user view or admin preview)
             // if plotly value is true we may have some data in the database for the chart, but plotly is set to true
             if ( 'line' === this.options.chart_type) {
                 var categories = O.axis['x']['categories'];

                 if (categories === undefined){
                     if (Array.isArray(columns[columns.length - 1]) && O.axis['x']){
                       var x = columns[columns.length - 1].slice(1);
                     }else{
                       var x = columns[columns.length - 2].slice(1)
                     }
                     var tmp ;


                     for (tmp=0; tmp < columns.length - 1; tmp++){
                         var name = columns[tmp][0];

                         if (name !== undefined && name !== 'x' && Array.isArray(columns[tmp])) {
                           var textTitles = columns[tmp].slice(1);
                           var convertedTextTitles = convertTextTitles(textTitles);

                           var trace = {
                               x: x,
                               y: columns[tmp].slice(1),
                               type: 'scatter',
                               mode:labelsMode,
                               text: convertedTextTitles,
                               textposition: 'top right',
                               textfont: {
                                   size: 14,
                               },
                               name: name,
                               line: {width: setDefaultWidth(lineWidthsList[tmp]), dash: lineTypesList[tmp]},
                               hovertemplate: '%{y}<extra></extra>',
                               error_y: {},
                               error_x: {}
                           };
                           data.push(trace);
                         }
                     };
                 } else {
                     var textTitles = columns[0].slice(1);
                     var convertedTextTitles = convertTextTitles(textTitles);

                     var trace = {
                         x: categories,
                         y: columns[0].slice(1),
                         name: columns[0][0],
                         mode:labelsMode,
                         text: convertedTextTitles,
                         hovertemplate: '%{y}<extra></extra>',
                         textposition: 'top right',
                         textfont: {
                             size: 14,
                         },
                         type: 'scatter',
                         line: {width: setDefaultWidth(lineWidths), dash: lineTypes},
                         error_y: {},
                         error_x: {}
                     };
                     data.push(trace);
                 };
             }

             if ('pie' === this.options.chart_type) {
                 var x = [];
                 var y = [];

                 for (a=0; a < columns.length; a++){
                         x.push(columns[a][0]);
                         y.push(columns[a][1]);
                 };

                 var trace = {
                     labels: x,
                     values: y,
                     name: 'Color',
                     type: 'pie',
                 };
                 data = [];
                 data.push(trace);
             }

             if ( 'donut' === this.options.chart_type) {
                 var x = [];
                 var y = [];

                 for (a=0; a < columns.length; a++){
                     x.push(columns[a][0]);
                     y.push(columns[a][1]);
                 };

                 var trace = {
                     labels: x,
                     values: y,
                     hole: this.options.donut_hole || .4,
                     name: 'Color',
                     type: 'pie',
                 };

                 data = [];
                 data.push(trace);

             }

             if ( 'scatter' === this.options.chart_type) {
                 // var textTitles = columns[0].slice(1);
                 // var convertedTextTitles = convertTextTitles(textTitles);

                 // var trace = {
                 //     x: O.axis['x']['categories'],
                 //     y: columns[0].slice(1),
                 //     mode: scatterLabelsMode,
                 //     text: convertedTextTitles,
                 //     textposition: 'top right',
                 //     textfont: {
                 //         size: 14,
                 //     },
                 //     type: this.options.chart_type,
                 //     hovertemplate: '%{y}<extra></extra>',
                 // };
                 // data = [];
                 // data.push(trace);

                 var categories = O.axis['x']['categories'];

                 if (categories === undefined){
                     if (Array.isArray(columns[columns.length - 1]) && O.axis['x']){
                       var x = columns[columns.length - 1].slice(1);
                     }else{
                       var x = columns[columns.length - 2].slice(1)
                     }
                     var tmp ;

                     for (tmp=0; tmp < columns.length - 1; tmp++){
                         var name = columns[tmp][0];

                         if (name !== undefined && name !== 'x' && Array.isArray(columns[tmp])) {
                           var textTitles = columns[tmp].slice(1);
                           var convertedTextTitles = convertTextTitles(textTitles);

                           var trace = {
                               x: x,
                               y: columns[tmp].slice(1),
                               type: this.options.chart_type,
                               mode: scatterLabelsMode,
                               text: convertedTextTitles,
                               textposition: 'top right',
                               textfont: {
                                   size: 14,
                               },
                               name: name,
                               line: {width: 4},
                               hovertemplate: '%{y}<extra></extra>',
                               error_y: {},
                               error_x: {}
                           };
                           data.push(trace);
                         }
                     };
                 } else {
                     var textTitles = columns[0].slice(1);
                     var convertedTextTitles = convertTextTitles(textTitles);

                     var trace = {
                         x: categories,
                         y: columns[0].slice(1),
                         name: columns[0][0],
                         mode:scatterLabelsMode,
                         text: convertedTextTitles,
                         hovertemplate: '%{y}<extra></extra>',
                         textposition: 'top right',
                         textfont: {
                             size: 14,
                         },
                         type: this.options.chart_type,
                         line: {width: 4},
                         error_y: {},
                         error_x: {}
                     };
                     data.push(trace);
                 };
             }

             if ( 'spline' === this.options.chart_type) {
                 var categories = O.axis['x']['categories'];

                 if (categories === undefined){
                     if (Array.isArray(columns[columns.length - 1]) && O.axis['x']){
                       var x = columns[columns.length - 1].slice(1);
                     }else{
                       var x = columns[columns.length - 2].slice(1)
                     }
                     var tmp ;

                     for (tmp=0; tmp < columns.length - 1; tmp++){
                         var name = columns[tmp][0];

                         if (name !== undefined && name !== 'x' && Array.isArray(columns[tmp])) {
                           var textTitles = columns[tmp].slice(1);
                           var convertedTextTitles = convertTextTitles(textTitles);

                           var trace = {
                               x: x,
                               y: columns[tmp].slice(1),
                               type: 'scatter',
                               mode: labelsMode,
                               text: convertedTextTitles,
                               textposition: 'top right',
                               hovertemplate: '%{y}<extra></extra>',
                               textfont: {
                                   size: 14,
                               },
                               name: name,
                               width: 3,
                               line: {
                                 shape: 'spline',
                                 width: setDefaultWidth(lineWidthsList[tmp]),
                                 dash: lineTypesList[tmp]
                               }

                           };
                           data.push(trace);
                         }
                     }
                 } else {
                     var textTitles = columns[0].slice(1);
                     var convertedTextTitles = convertTextTitles(textTitles);

                     var trace = {
                         x: categories,
                         y: columns[0].slice(1),
                         name: columns[0][0],
                         mode: labelsMode,
                         text: convertedTextTitles,
                         textposition: 'top right',
                         hovertemplate: '%{y}<extra></extra>',
                         textfont: {
                             size: 14,
                         },
                         type: 'scatter',
                         name: 'Color',
                         line: {
                           shape: 'spline',
                           width: setDefaultWidth(lineWidths),
                           dash: lineTypes
                         }
                     };
                     data.push(trace);
                 };
             };
             
             if ( 'bar' === this.options.chart_type || 'sbar' === this.options.chart_type) {
                 var categories = O.axis['x']['categories'];

                 if (categories === undefined){
                     if (Array.isArray(columns[columns.length - 1]) && O.axis['x'] || 'sbar' === this.options.chart_type){
                       var x = columns[columns.length - 1].slice(1);
                     }else{
                       var x = columns[columns.length - 2].slice(1)
                     }
                     var tmp ;

                     if (columns.length == 1) {
                         var name = columns[0][0];

                         if (name !== undefined && name !== 'x' && Array.isArray(columns[0])){
                           var trace = {
                               x: [this.options.x_axis],
                               y: x,
                               type: 'bar',
                               name: name,
                               width: this.options.bar_width || 0.5,
                               error_y: {},
                               error_x: {}
                           };
                           data.push(trace);
                         }
                     } else if ('sbar' === this.options.chart_type && this.options.category_name === '') {
                         for (tmp=0; tmp < columns.length; tmp++){
                             var name = columns[tmp][0];

                             if (name !== undefined && name !== 'x' && Array.isArray(columns[tmp])) {
                               var trace = {
                                   x: [this.options.x_axis],
                                   y: [parseFloat(columns[tmp][1])],
                                   type: 'bar',
                                   name: name,
                                   width: this.options.bar_width || 0.5,
                                   error_y: {},
                                   error_x: {}
                               };
                               data.push(trace);
                             }
                         }
                     } else {
                         for (tmp=0; tmp < columns.length - 1; tmp++){
                             var name = columns[tmp][0];

                             if (name !== undefined && name !== 'x' && Array.isArray(columns[tmp])) {
                               var trace = {
                                   x: x,
                                   y: columns[tmp].slice(1),
                                   type: 'bar',
                                   name: name,
                                   width: this.options.bar_width || 0.5,
                                   error_y: {},
                                   error_x: {}
                               };
                               data.push(trace);
                             }
                         }
                     }
                 } else {
                     //console.log(categories)

                     var trace = {
                         x: categories,
                         y: columns[0].slice(1),
                         width: this.options.bar_width || 0.5,
                         type: 'bar',
                         name: 'Color',
                         error_y: {},
                         error_x: {}
                     };
                     data.push(trace);
                 };
             };

             if ( 'hbar' === this.options.chart_type || 'shbar' === this.options.chart_type) {
                 var categories = O.axis['x']['categories'];

                 if (categories === undefined){
                     if ((Array.isArray(columns[columns.length - 1]) && O.axis['x']) || 'shbar' === this.options.chart_type){
                       var x = columns[columns.length - 1].slice(1);
                     }else{
                       var x = columns[columns.length - 2].slice(1)
                     }
                     var tmp ;

                     if (columns.length == 1) {
                         var name = columns[0][0];

                         if (name !== undefined && name !== 'x' && Array.isArray(columns[0])){
                           var trace = {
                               x: x,
                               y: [this.options.x_axis],
                               type: 'bar',
                               name: name,
                               orientation: 'h',
                               width: this.options.bar_width || 0.5,
                           };
                           data.push(trace);
                         }
                     } else if ('shbar' === this.options.chart_type && this.options.category_name === '') {
                         for (tmp=0; tmp < columns.length; tmp++){
                             var name = columns[tmp][0];

                             if (name !== undefined && name !== 'x' && Array.isArray(columns[tmp])) {
                               var trace = {
                                   x: [parseFloat(columns[tmp][1])],
                                   y: [this.options.x_axis],
                                   type: 'bar',
                                   name: name,
                                   orientation: 'h',
                                   width: this.options.bar_width || 0.5,
                               };
                               data.push(trace);
                             }
                         }
                     } else {
                         for (tmp=0; tmp < columns.length - 1; tmp++){
                             var name = columns[tmp][0];
                             var x_values = [];

                             for (i=0; i < columns[tmp].length - 1; i++){
                               x_values.push(parseFloat(columns[tmp][i+1]));
                             }

                             if (name !== undefined && name !== 'x' && Array.isArray(columns[tmp])) {
                               var trace = {
                                   x: x_values,
                                   y: x,
                                   type: 'bar',
                                   name: name,
                                   orientation: 'h',
                                   width: this.options.bar_width || 0.5,
                               };
                               data.push(trace);
                             }
                         }
                     }
                 } else {
                     var trace = {
                         x: columns[0].slice(1),
                         y: categories,
                         type: 'bar',
                         name: 'Color',
                         orientation: 'h',
                         width: this.options.bar_width || 0.5,
                     };
                     data.push(trace);
                 };
             };

             if ( 'area' === this.options.chart_type) {
                 var categories = O.axis['x']['categories'];

                 if (categories === undefined){
                     if (Array.isArray(columns[columns.length - 1]) && O.axis['x']){
                       var x = columns[columns.length - 1].slice(1);
                     }else{
                       var x = columns[columns.length - 2].slice(1)
                     }
                     var tmp ;

                     for (tmp=0; tmp < columns.length - 1; tmp++){
                         var name = columns[tmp][0];

                         if (name !== undefined && name !== 'x' && Array.isArray(columns[tmp])) {
                           var textTitles = columns[tmp].slice(1);
                           var convertedTextTitles = convertTextTitles(textTitles);

                           var trace = {
                               x: x,
                               y: columns[tmp].slice(1),
                               mode: labelsMode,
                               text: convertedTextTitles,
                               textposition: 'top right',
                               hovertemplate: '%{y}<extra></extra>',
                               textfont: {
                                   size: 14,
                               },
                               line: {
                                 width: 4
                               },
                               type: 'scatter',
                               name: name,
                               fill: 'tozeroy'
                           };
                           data.push(trace);
                         }
                     };
                 } else {
                     var textTitles = columns[0].slice(1);
                     var convertedTextTitles = convertTextTitles(textTitles);

                     var trace = {
                         x: categories,
                         y: columns[0].slice(1),
                         mode: labelsMode,
                         text: convertedTextTitles,
                         textposition: 'top right',
                         hovertemplate: '%{y}<extra></extra>',
                         textfont: {
                             size: 14,
                         },
                         line: {
                           width: 4
                         },
                         name: columns[0][0],
                         type: 'scatter',
                         fill: 'tozeroy'
                     };
                     data.push(trace);
                 };
             }

             /**** Line TYpes [dotted,solid] *****/
             var item_exists = this.el.closest(".chart_field").attr('id');

             if (typeof item_exists !== 'undefined' && item_exists !== null){
                 var item_no = this.el.closest(".chart_field").attr('id').split("_").pop();
                 var chart_plotly = document.getElementById("chart_field_plotly_" + item_no);

                 var len_data = data.length;
                 var tmp ;
                 var data_tmp = data;
                 var len_count = 1;

                 for (tmp = len_data - 1; tmp >= 0; tmp--){
                     var color_count = 1;
                     var d = data_tmp[tmp];
                     //console.log(d);

                     var c = "chart_field_line_type_"+ item_no + "_" + (tmp+1)
                     var lw = "chart_field_line_width_"+ item_no + "_" + (tmp+1)
                     var chart_field_plotly_value = chart_plotly.value;

                     /*
                     if (chart_field_plotly_value) {
                         // there is a plotly value in the input field
                         var color_tmp = document.querySelectorAll('[data-target='+c+']');

                         if (color_tmp['length'] >= 1){
                             var color = color_tmp[0].style.cssText;
                             if (color){
                                 var new_color = color.split(": ")[1].slice(0, -1);
                                 if (new_color.includes('none')){
                                     new_color = new_color.substring(0, new_color.indexOf(" none"));
                                 }
                             }
                             d['marker'] = {'color': new_color};
                         } else {
                             d['marker'] = {'color': 'darkseagreen'};
                         }
                     } else {
                         var color_id = "chart_field_color_" + item_no;
                         var color_tmp = document.querySelectorAll('[data-target=' + color_id + ']');

                         if (color_tmp['length'] >= 1){
                             var color = color_tmp[0].style.cssText;
                             // check type and do the conditions according to that

                             if (typeof color === 'undefined' || color === ''){
                                     d['marker'] = {'color': 'darkseagreen'};
                             }  else {
                                 var new_color = color.split(": ")[1].slice(0, -1);
                                 if (new_color.includes('none')){
                                     new_color = new_color.substring(0, new_color.indexOf(" none"));
                                 }

                                 d['marker'] = {'color': new_color};
                         }
                         } else {
                             d['marker'] = {'color': 'darkseagreen'};
                         }
                     } */
                 

                     // delete elements
                     var p = document.querySelectorAll('[id^="chart_field_line_type_'+item_no+'"]');
                     var lwSel = document.querySelectorAll('[id^="chart_field_line_width_'+item_no+'"]');
                     var ltype_elements = 0;
                     var lwidth_elements = 0;

                     for (var a = 0; a < p.length; a++) {
                         var type = p[a].tagName;
                         if (type === 'SELECT') {
                             ltype_elements = ltype_elements + 1;
                         }
                     }
                     
                     if (ltype_elements > data.length) {
                         for (var a = 0; a < p.length; a++) {
                             var type = p[a].tagName;
                             if (type === 'SELECT') {
                                 p[a].parentElement.remove();
                             }
                         }
                     }

                     for (var a = 0; a < lwSel.length; a++) {
                         var type = lwSel[a].tagName;
                         if (type === 'SELECT') {
                             lwidth_elements = lwidth_elements + 1;
                         }
                     }

                     if (lwidth_elements > data.length) {
                         for (var a = 0; a < lwSel.length; a++) {
                             var type = lwSel[a].tagName;
                             if (type === 'SELECT') {
                                 lwSel[a].parentElement.remove();
                             }
                         }
                     }

                     // add new html element
                     var html_line_type = 'solid'
                     var html_line_width = '4'

                     if (d.line) {
                       if (d.line.dash) {
                         html_line_type = d.line.dash
                       }
                       if (d.line.width) {
                         html_line_width = String(d.line.width)
                       }
                     }
                     
                     var elementExists = document.getElementById(c);
                     if (elementExists) {
                         elementExists.parentElement.remove();

                         var newcontent = document.createElement('div');
                         var html = '';
                         html += '<div class="control-group control-select">'
                         html += '<label class="control-label line_type_label" for="chart_field_line_type_' + item_no + '_' + (tmp+1) +'">' + d['name'] + '</label>&nbsp;'
                         html += '<select class="custom_chart_select" style="width:120px;" id="chart_field_line_type_' + item_no + '_' + (tmp+1) +'" name="chart_field_line_type_' + item_no + '_' + (tmp+1) +'" >';

                         if (html_line_type == 'solid') {
                             html += '<option value="solid" selected>Solid</option>';
                         } else {
                             html += '<option value="solid">Solid</option>';
                         }

                         if (html_line_type == 'dash') {
                             html += '<option value="dash" selected>Dashed</option>';
                         } else {
                             html += '<option value="dash">Dashed</option>';
                         }

                         if (html_line_type == 'dashdot') {
                             html += '<option value="dashdot" selected>Dash Dot</option>';
                         } else {
                             html += '<option value="dashdot">Dash Dot</option>';
                         }

                         if (html_line_type == 'dot') {
                             html += '<option value="dot" selected>Dotted</option>';
                         } else {
                             html += '<option value="dot">Dotted</option>';
                         }

                         html += '</select>';
                         
                         //Line width
                         html += '<select class="custom_chart_select" style="width:120px;" id="chart_field_line_width_' + item_no + '_' + (tmp+1) +'" name="chart_field_line_width_' + item_no + '_' + (tmp+1) +'" >';

                         if (html_line_width == '2') {
                             html += '<option value="2" selected>Slim</option>';
                         } else {
                             html += '<option value="2">Slim</option>';
                         }

                         if (html_line_width == '4' || !['2', '6'].includes(html_line_width)) {
                             html += '<option value="4" selected>Regular</option>';
                         } else {
                             html += '<option value="4">Regular</option>';
                         }

                         if (html_line_width == '6') {
                             html += '<option value="6" selected>Wide</option>';
                         } else {
                             html += '<option value="6">Wide</option>';
                         }

                         html += '</select>';

                         html += '</div>'
                         newcontent.innerHTML = html

                         document.getElementById("chart_field_plotly_line_"+item_no).insertAdjacentHTML('afterend', html);
                         // remove Color element
                         //var elem = document.querySelector('#init_color');
                         //if (elem) {
                         //    elem.parentNode.removeChild(elem);
                         //}

                     } else {
                         var newcontent = document.createElement('div');
                         var html = '';
                         html += '<div class="control-group control-select">'
                         html += '<label class="control-label for="chart_field_line_type_' + item_no + '_' + (tmp+1) +'">' + d['name'] + '</label>'
                         html += '<select id="chart_field_line_type_' + item_no + '_' + (tmp+1) +'" name="chart_field_line_type_' + item_no + '_' + (tmp+1) +'" >';

                         if (html_line_type == 'solid') {
                             html += '<option value="solid" selected>Solid</option>';
                         } else {
                             html += '<option value="solid">Solid</option>';
                         }

                         if (html_line_type == 'dash') {
                             html += '<option value="dash" selected>Dashed</option>';
                         } else {
                             html += '<option value="dash">Dashed</option>';
                         }

                         if (html_line_type == 'dashdot') {
                             html += '<option value="dashdot" selected>Dash Dot</option>';
                         } else {
                             html += '<option value="dashdot">Dash Dot</option>';
                         }

                         if (html_line_type == 'dot') {
                             html += '<option value="dot" selected>Dotted</option>';
                         } else {
                             html += '<option value="dot">Dotted</option>';
                         }

                         html += '</select>';

                         //Line width
                         html += '<select class="custom_chart_select" id="chart_field_line_width_' + item_no + '_' + (tmp+1) +'" name="chart_field_line_width_' + item_no + '_' + (tmp+1) +'" >';

                         if (html_line_width == '2') {
                             html += '<option value="2" selected>Slim</option>';
                         } else {
                             html += '<option value="2">Slim</option>';
                         }

                         if (html_line_width == '4' || !['2', '6'].includes(html_line_width)) {
                             html += '<option value="4" selected>Regular</option>';
                         } else {
                             html += '<option value="4">Regular</option>';
                         }

                         if (html_line_width == '6') {
                             html += '<option value="6" selected>Wide</option>';
                         } else {
                             html += '<option value="6">Wide</option>';
                         }

                         html += '</select>';

                         html += '</div>'
                         newcontent.innerHTML = html;

                         document.getElementById("chart_field_plotly_line_"+item_no).insertAdjacentHTML('afterend', html);
                         // remove Color element
                         //var elem = document.querySelector('#init_color');
                         //if (elem) {
                         //    elem.parentNode.removeChild(elem);
                         //}
                     } 
                 }
             }

             if (typeof plotly === 'string' || plotly === true) {

                 var item_exists = this.el.closest(".chart_field").attr('id');

                 if (typeof item_exists !== 'undefined' && item_exists !== null){
                     var item_no = this.el.closest(".chart_field").attr('id').split("_").pop();
                     var chart_plotly = document.getElementById("chart_field_plotly_" + item_no);

                     var len_data = data.length;
                     var tmp ;
                     var data_tmp = data;
                     var len_count = 1;

                     for (tmp = 0; tmp < len_data; tmp++){
                         var color_count = 1;
                         var d = data_tmp[tmp];

                             var c = "chart_field_color_"+ item_no + "_" + (tmp+1)
                             var chart_field_plotly_value = chart_plotly.value;

                             if (chart_field_plotly_value) {
                                 // there is a plotly value in the input field
                                 var color_tmp = document.querySelectorAll('[data-target='+c+']');

                                 if (color_tmp['length'] >= 1){
                                     var color = color_tmp[0].style.cssText;
                                     if (color){
                                         var new_color = color.split(": ")[1].slice(0, -1);
                                         if (new_color.includes('none')){
                                             new_color = new_color.substring(0, new_color.indexOf(" none"));
                                         }
                                     }
                                     d['marker'] = {'color': new_color};
                                 } else {
                                     d['marker'] = {'color': 'darkseagreen'};
                                 }
                             } else {
                                 var color_id = "chart_field_color_" + item_no;
                                 var color_tmp = document.querySelectorAll('[data-target=' + color_id + ']');

                                 if (color_tmp['length'] >= 1){
                                     var color = color_tmp[0].style.cssText;
                                     // check type and do the conditions according to that

                                     if (typeof color === 'undefined' || color === ''){
                                             d['marker'] = {'color': 'darkseagreen'};
                                     }  else {
                                         var new_color = color.split(": ")[1].slice(0, -1);
                                         if (new_color.includes('none')){
                                             new_color = new_color.substring(0, new_color.indexOf(" none"));
                                         }

                                         d['marker'] = {'color': new_color};
                                 }
                                 } else {
                                     d['marker'] = {'color': 'darkseagreen'};
                                 }
                             }


                     // delete elements
                     var p = document.querySelectorAll('[id^="chart_field_color_'+item_no+'"]');
                     var color_elements = 0;

                     for (var a = 0; a < p.length; a++) {
                         var type = p[a].tagName;
                         if (type === 'INPUT') {
                             color_elements = color_elements + 1;
                         }
                     }

                     if (color_elements > data.length) {
                         for (var a = 0; a < p.length; a++) {
                             var type = p[a].tagName;
                             if (type === 'INPUT') {
                                 p[a].parentElement.remove();
                             }
                         }
                     }

                     // add new html element
                     var elementExists = document.getElementById(c);

                     if (elementExists) {
                         elementExists.parentElement.remove();

                         var newcontent = document.createElement('div');
                         var html = '';
                         html += '<div class="control-group control-select">'
                         html += '<label class="control-label" for="chart_field_color_' + item_no + '_' + (tmp+1) +'">' + d['name'] + '</label>'
                         html += '<input type="text" id="chart_field_color_' + item_no + '_' + (tmp+1) +'" name="chart_field_color_' + item_no + '_' + (tmp+1) +'" class="colorpicker" style="display:none;" value="' + d['marker']['color'] + '"/> '
                         html += '</div>'
                         newcontent.innerHTML = html

                         document.getElementById("chart_field_plotly_"+item_no).insertAdjacentHTML('afterend', html);
                         // remove Color element
                         var elem = document.querySelector('#init_color');
                         if (elem) {
                             elem.parentNode.removeChild(elem);
                         }

                     } else {

                         var newcontent = document.createElement('div');
                         var html = '';
                         html += '<div class="control-group control-select">'
                         html += '<label class="control-label" for="chart_field_color_' + item_no + '_' + (tmp+1) +'">' + d['name'] + '</label>'
                         html += '<input type="text" id="chart_field_color_' + item_no + '_' + (tmp+1) +'" name="chart_field_color_' + item_no + '_' + (tmp+1) +'" class="colorpicker" style="display:none;" value="' + d['marker']['color'] + '"/> '
                         html += '</div>'
                         newcontent.innerHTML = html;

                         document.getElementById("chart_field_plotly_"+item_no).insertAdjacentHTML('afterend', html);
                         // remove Color element
                         var elem = document.querySelector('#init_color');
                         if (elem) {
                             elem.parentNode.removeChild(elem);
                         }
                     }
                     generateColorPicker();

                 }

                data = data_tmp;

                var item_no = this.el.closest(".chart_field").attr('id').split("_").pop();
                var chart_plotly = document.getElementById("chart_field_plotly_"+item_no);

                 if (typeof(chart_plotly) != 'undefined' && chart_plotly != null) {
                    document.getElementById("chart_field_plotly_"+item_no).value = JSON.stringify(data);
                 }
                 }
             } else {
                 var item_exists = this.el.closest(".chart_field").attr('id');

                 if (typeof item_exists !== 'undefined' && item_exists !== null){
                    var item_no = this.el.closest(".chart_field").attr('id').split("_").pop();
                    var chart_plotly = document.getElementById("chart_field_plotly_"+item_no);
                    if (typeof(chart_plotly) != 'undefined' && chart_plotly != null){
                        document.getElementById("chart_field_plotly_"+item_no).value = JSON.stringify(plotly);
                    }
                }
             }

             var title_id = this.el.context.parentElement.children[0].id;

             if(this.el.context.parentElement.querySelector(".additional_desc")) {
                 var desc_id = this.el.context.parentElement.querySelector(".additional_desc").id;
                 if(desc_id){
                     var converter = new showdown.Converter();
                     var convertedDesc = converter.makeHtml(desc);
                     document.getElementById(desc_id).innerHTML = convertedDesc;
                     document.getElementById(desc_id).style.display = "block";
                 }
             }
             

             if(title_id){
                 document.getElementById(title_id).innerHTML =  w;
                 document.getElementById(title_id).style.display = "block";
             }   


             //Hide loading text
             if(document.getElementById("loading-"+this.options.chart_id)){
                 document.getElementById("loading-"+this.options.chart_id).style.display = "none";
             }
             

             var q = JSON.parse(JSON.stringify(plotly));

             if (typeof plotly === "object"){
                 for (const [key, value] of Object.entries(data)) {
                   if (q[key]){
                     value.marker = q[key].marker;
                   }
                 }
             }

             if(this.options.x_text_rotate == 30){
                 this.options.x_text_rotate = 45;
             }

             if(this.options.y_text_rotate == 30){
                 this.options.y_text_rotate = 45;
             }

             //Sort x-axis asc 
             //console.log(data);
             const sortX = x_sort_labels;
             let sortedArr = [];

             if(x_sort_labels === true) {
                 //Date format '2020-12-01'  YYYY-MM-DD
                 //var arr2 = ["01/22/2021", "16 March 2017", "2000-12-31"]

                 function dateComparison(a, b) {
                     const date1 = new Date(a)
                     const date2 = new Date(b)

                     return date1 - date2;
                 }

                 function stringComparison(a, b) {
                 if (a > b) {
                     return 1;
                 }
                 if (a < b) {
                     return -1;
                 }
                 return 0;
                 }

                 if (isNaN(Date.parse(data[0].x[0])) == true) {
                     sortedArr = data[0].x.slice(0).sort(stringComparison);
                 } else {
                     sortedArr = data[0].x.slice(0).sort(dateComparison);
                 }

             } else {
                 sortedArr = data[0].x
             }


             var base_info = {
                 margin: {
                     l: 20,
                     r: 20,
                     b: 20,
                     t: 30,
                     pad: 5
                   },
                 title: w,
                 showlegend: o, //show legend value
                 xaxis: {
                     tickformat: xf,
                     automargin: true,
                     title: '',
                     tickangle: this.options.x_text_rotate,
                     tickmode:"auto",
                     nticks:this.options.x_tick_culling_max,
                     tickfont: {
                         size: 14,
                     },
                     categoryorder: "array",
                     categoryarray: sortedArr
                 },
                 yaxis: {
                     tickformat: f,
                     automargin: true,
                     hoverformat: format,
                     tickangle: this.options.y_text_rotate,
                     tickfont: {
                         size: 14,
                     }
                 },
                 hovermode: 'closest'
             }

             if (["sbar", "shbar"].includes(this.options.chart_type)) {
                 base_info.barmode = 'stack'
             }

             if (!["donut", "pie"].includes(this.options.chart_type)) {
                 const formatter = d3.format(format)

                 if (!base_info.shapes) {
                     base_info.shapes = []
                 }
                 if (!base_info.annotations) {
                     base_info.annotations = []
                 }

                 var dynamic_ref_hovertext = (this.dynamic_reference_value !== null) ? formatter(this.dynamic_reference_value) : this.dynamic_reference_value
                 var static_ref_hovertext = (this.static_reference_value !== null) ? formatter(this.static_reference_value) : this.static_reference_value
                 var dynamic_ref_text = `<b>${(typeof this.options.dynamic_reference_label === 'boolean' ||
                                          this.options.dynamic_reference_label.length === 0 ?
                                          this.options.dynamic_reference_type : this.options.dynamic_reference_label)}</b>`
                 var static_ref_text = `<b>${(typeof this.options.static_reference_label === 'boolean' ||
                                         this.options.static_reference_label.length === 0 ?
                                         'Reference' : this.options.static_reference_label)}</b>`

                 if (['hbar', 'shbar'].includes(this.options.chart_type)) {
                     if (dynamic_ref_hovertext) {
                         base_info.annotations.push({
                             showarrow: false,
                             yref: 'paper',
                             text: dynamic_ref_text,
                             hovertext: dynamic_ref_hovertext,
                             bgcolor: "rgb(255,255,255)",
                             x: this.dynamic_reference_value,
                             xanchor: 'left',
                             y: 0
                         })
                         addShapes.call(this, 'dynamic')
                     }
                     if (static_ref_hovertext) {
                         base_info.annotations.push({
                             showarrow: false,
                             yref: 'paper',
                             text: static_ref_text,
                             hovertext: static_ref_hovertext,
                             bgcolor: "rgb(255,255,255)",
                             x: this.static_reference_value,
                             xanchor: 'left',
                             y: 0
                         })
                         addShapes.call(this, 'static')
                     }
                     function addShapes (reference_type) {
                         if (reference_type === 'dynamic') {
                             base_info.shapes.push({
                                 type: 'line',
                                 yref: 'paper',
                                 x0: this.dynamic_reference_value,
                                 y0: 1,
                                 x1: this.dynamic_reference_value,
                                 y1: 0,
                                 line: {
                                     color: 'black',
                                     width: 1
                                 }
                             })
                         } else {
                             base_info.shapes.push({
                                 type: 'line',
                                 yref: 'paper',
                                 x0: this.static_reference_value,
                                 y0: 1,
                                 x1: this.static_reference_value,
                                 y1: 0,
                                 line: {
                                     color: 'black',
                                     width: 1
                                 }
                             })
                         }
                     }
                 } else {
                     if (dynamic_ref_hovertext) {
                         base_info.annotations.push({
                             showarrow: false,
                             xref: 'paper',
                             text: dynamic_ref_text,
                             hovertext: dynamic_ref_hovertext,
                             bgcolor: "rgb(255,255,255)",
                             x: 0,
                             yanchor: 'bottom',
                             y: this.dynamic_reference_value
                         })
                         addShapes.call(this, 'dynamic')
                     }
                     if (static_ref_hovertext) {
                         base_info.annotations.push({
                             showarrow: false,
                             xref: 'paper',
                             text: static_ref_text,
                             hovertext: static_ref_hovertext,
                             bgcolor: "rgb(255,255,255)",
                             x: 0,
                             yanchor: 'bottom',
                             y: this.static_reference_value
                         })
                         addShapes.call(this, 'static')
                     }
                     function addShapes (reference_type) {
                         if (reference_type === 'dynamic') {
                             base_info.shapes.push({
                                 type: 'line',
                                 xref: 'paper',
                                 x0: 0,
                                 y0: this.dynamic_reference_value,
                                 x1: 1,
                                 y1: this.dynamic_reference_value,
                                 line: {
                                     color: 'black',
                                     width: 1
                                 }
                             })
                         } else {
                             base_info.shapes.push({
                                 type: 'line',
                                 xref: 'paper',
                                 x0: 0,
                                 y0: this.static_reference_value,
                                 x1: 1,
                                 y1: this.static_reference_value,
                                 line: {
                                     color: 'black',
                                     width: 1
                                 }
                             })
                         }
                     }
                 }
             }

             if (this.options.y_label_hide === false) {
                 base_info.yaxis.title = _ || this.options.y_axis;
             }

             if (this.options.x_label_hide === false) {
                 base_info.xaxis.title = xl || this.options.x_axis;
             }

             if (this.options.y_from_zero ===  true) {
                 base_info.yaxis.rangemode = "tozero"
             }

             if (this.options.x_from_zero ===  true) {
                 base_info.xaxis.rangemode = "tozero"
             }

             if (this.options.axis_range ===  true && !['sbar', 'shbar', 'pie', 'donut'].includes(this.options.chart_type)) {
               if ('hbar' == this.options.chart_type) {
                 if (['.0%', '.1%', '.2%'].includes(this.options.x_tick_format)) {
                   base_info.xaxis.range = [this.options.axis_min / 100, this.options.axis_max / 100]
                 } else {
                   base_info.xaxis.range = [this.options.axis_min, this.options.axis_max]
                 }
               } else {
                 if (['.0%', '.1%', '.2%'].includes(this.options.y_tick_format)) {
                   base_info.yaxis.range = [this.options.axis_min / 100, this.options.axis_max / 100]
                 } else {
                   base_info.yaxis.range = [this.options.axis_min, this.options.axis_max]
                 }
               }
             }

             //Experimental: Remove Numbers from the items 1. , 2. etc
             if(data){
               if('hbar' === this.options.chart_type){
                 data.forEach(function(record) {
                     var subData = record.y;

                     if(subData && subData.length > 0) {
                         subData.forEach(function(item, index){
                           if (typeof item !== 'number' && item !== null){
                               item = item.replace(/^\d{1,2}\./, '');
                               record.y[index] = item;
                           }
                         });
                     }

                 });
               }else{
                 data.forEach(function(record) {
                     var subData = record.x;

                     if(subData && subData.length > 0) {
                         subData.forEach(function(item, index){
                           if (typeof item !== 'number' && item !== null){
                               item = item.replace(/^\d{1,2}\./, '');
                               record.x[index] = item;
                           }
                         });
                     }

                 });
               }
             }

             
             /**** Sequential Colors ******/
             // Returns a single rgb color interpolation between given rgb color
             function interpolateColor(color1, color2, factor) {
                 if (arguments.length < 3) { 
                     factor = 0.5; 
                 }
                 var result = color1.slice();
                 for (var i = 0; i < 3; i++) {
                     result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
                 }
                 return result;
             };

             // My function to interpolate between two colors completely, returning an array
             function interpolateColors(color1, color2, steps) {
                 var stepFactor = 1 / (steps - 1),
                     interpolatedColorArray = [];

                 color1 = color1.match(/\d+/g).map(Number);
                 color2 = color2.match(/\d+/g).map(Number);

                 for(var i = 0; i < steps; i++) {
                     var color_ = interpolateColor(color1, color2, stepFactor * i);

                     var new_color_ = "rgba("+color_[0]+","+color_[1]+","+color_[2]+",1)";
                     interpolatedColorArray.push(new_color_);
                 }

                 return interpolatedColorArray;
             }

             function hexToRgb(hex) {
                 var arrBuff = new ArrayBuffer(4);
                 var vw = new DataView(arrBuff);
                 hex = hex.replace(/[^0-9A-F]/gi, '');
                 vw.setUint32(0,parseInt(hex, 16),false);
                 var arrByte = new Uint8Array(arrBuff);

                 return arrByte[1] + "," + arrByte[2] + "," + arrByte[3];
             }

             var colorpicker_selection = document.getElementById('color_type');

             if (this.options.color_type == 2 || (colorpicker_selection !== null && [null, '2'].includes(colorpicker_selection.value)) && !['donut', 'pie'].includes(this.options.chart_type)) {
                 var steps = 0;
                 var base_sequential_colors = this.options.seq_color.split(',');

                 for (i = 0; i < data.length; i++) {
                     if (['scatter'].includes(this.options.chart_type)) {
                         var steps = Math.max(steps, data[i].y.length);
                     } else {
                         var steps = Math.max(steps, data[i].x.length);
                     }
                 }

                 steps = steps * data.length

                 for (i = 0; i < data.length; i++) {
                     var sequential_colors = interpolateColors(hexToRgb(base_sequential_colors[0]), hexToRgb(base_sequential_colors[1]), steps);
                     var sequential_colors_section = [];

                     for (j = Math.round((sequential_colors.length / data.length) * i);
                          j < Math.round((sequential_colors.length / data.length) * (i + 1)) && sequential_colors.length; j++) {
                         sequential_colors_section.push(sequential_colors[j]);
                     }

                     if (!"rgba(NaN,NaN,NaN,1)".includes(sequential_colors_section[0])) {
                         data[i].marker = {'color': sequential_colors_section};
                     } else {
                         data[i].marker = {'color': interpolateColors(hexToRgb(base_sequential_colors[0]), hexToRgb(base_sequential_colors[1]), 2)};
                     }

                 }
             }


             //Showing Annotations on bars
             if('bar' === this.options.chart_type || 'sbar' === this.options.chart_type) {
                 
                 //Temporarily disabling annotations on bars with categories
                 if(data.length > 1) {
                     sa = false;
                 }
                 if(sa==true){
                     var stacked_total = 0

                     for(var i = 0; i < data.length; i++){
                         for(var j = 0; j < data[i].x.length; j++){
                             if('sbar' === this.options.chart_type){
                                 stacked_total = stacked_total + data[i].y[j]
                             }else{
                                 stacked_total = data[i].y[j]
                             }

                             var anoData = {
                                 x:data[i].x[j],
                                 y:stacked_total,
                                 text: dataLabelFormatter(data[i].y[j]),
                                 hovertemplate: '%{y}<extra></extra>',
                                 xanchor: 'center',
                                 yanchor: 'bottom',
                                 showarrow: false
                             };

                             base_info.annotations.push(anoData);
                         }
                     }
                 }

             }
             if('hbar' === this.options.chart_type || 'shbar' === this.options.chart_type) {
                  //Temporarily disabling annotations on bars with categories
                  if(data.length > 1) {
                     sa = false;
                 }
                 if(sa==true){
                     var stacked_total = 0

                     for(var i = 0; i < data.length; i++){
                         for(var j = 0; j < data[i].x.length; j++){
                             if('shbar' === this.options.chart_type){
                                 stacked_total = stacked_total + data[i].x[j]
                             }else{
                                 stacked_total = data[i].x[j]
                             }

                             var anoData = {
                                 x:stacked_total,
                                 y:data[i].y[j],
                                 text: dataLabelFormatter(data[i].x[j]),
                                 hovertemplate: '%{y}<extra></extra>',
                                 xanchor: 'left',
                                 yanchor: 'center',
                                 showarrow: false
                             };

                             base_info.annotations.push(anoData);
                         }
                     }
                 }
             }

             var isErrorIntervals = bnds

             if (isErrorIntervals === true && typeof ub !== 'boolean' && typeof lb !== 'boolean' && ub !== '' && lb !== '') {
               if (O.axis && O.axis['x']['categories']) {
                 const lower = t.map(x => {
                   return Math.round(Math.abs(x[this.options.y_axis.toLowerCase()] - x[lb]));
                 });
                 const upper = t.map(x => {
                   return Math.round(Math.abs(x[this.options.y_axis.toLowerCase()] - x[ub]));
                 });

                 var arrayplus = upper;
                 var arrayminus = lower;

                 if('scatter' === this.options.chart_type || 'line' === this.options.chart_type || 'spline' === this.options.chart_type || 'area' === this.options.chart_type){

                   //Add Error Intervals
                   var error = {
                       type: 'data',
                       symmetric: false,
                       array: arrayplus,
                       arrayminus: arrayminus,
                       color: '#000000'
                   }

                   data[0].error_y = error;
                 }

                 if('bar' === this.options.chart_type || 'sbar' === this.options.chart_type || 'hbar' === this.options.chart_type || 'shbar' === this.options.chart_type ){

                   //Add Error Intervals
                   var error = {
                       type: 'data',
                       symmetric: false,
                       array: arrayplus,
                       arrayminus: arrayminus,
                       color: '#000000'
                   }

                   if ('hbar' === this.options.chart_type || 'shbar' === this.options.chart_type) {
                     data[0].error_x = error;
                   } else {
                     data[0].error_y = error;
                   }
                 }

               }
               if (O.axis && !O.axis['x']['categories'] && t[ub] && t[lb]) {
                 //console.log(t[ub])
                 //console.log(typeof t[ub])
                 for (var i = 0; i < data.length; i++) {
                   if (t[ub][data[i].name] !== undefined){
                     var category_keys = [];
                     var upper = [];
                     var lower = [];

                     //console.log(data)
                     //console.log(t)
                     //console.log(t[data[i].name])
                     for (var j = 1; j < t[data[i].name].length; j++) {
                       upper.push(Math.round(Math.abs(t[data[i].name][j] - t[ub][data[i].name][j - 1])))
                       lower.push(Math.round(Math.abs(t[data[i].name][j] - t[lb][data[i].name][j - 1])))
                     }

                     category_keys.push(data[i].name)

                     //for (const [key, value] of Object.entries(t)) {
                     //  console.log(`${key}: ${value}`);
                     //}

                     var arrayplus = upper;
                     var arrayminus = lower;

                     if('scatter' === this.options.chart_type || 'line' === this.options.chart_type || 'spline' === this.options.chart_type || 'area' === this.options.chart_type){

                       //Add Error Intervals
                       var error = {
                           type: 'data',
                           symmetric: false,
                           array: arrayplus,
                           arrayminus: arrayminus,
                           color: '#000000',
                           visible: true
                       }

                       data[i].error_y = error;
                     }

                     if('bar' === this.options.chart_type || 'hbar' === this.options.chart_type){

                       //Add Error Intervals
                       var error = {
                           type: 'data',
                           symmetric: false,
                           array: arrayplus,
                           arrayminus: arrayminus,
                           color: '#000000',
                           visible: true
                       }

                       if ('hbar' === this.options.chart_type) {
                         data[i].error_x = error;
                       } else {
                         data[i].error_y = error;
                       }
                     }
                   }
                 }
               }
             }


             //console.log(data);
             //console.log(O);
             //console.log(base_info); 
             //console.log(data)
             //console.log(this.options)

             console.log('Generate plotly')


             function saveAs(uri, filename) {
                 var link = document.createElement('a');
                 if (typeof link.download === 'string') {
                     link.href = uri;
                     link.download = filename;
                     //Firefox requires the link to be in the body
                     document.body.appendChild(link);
                     //simulate click
                     link.click();
                     //remove the link when done
                     document.body.removeChild(link);
                 } else {
                     window.open(uri);
                 }
             }
             
             //Custom Modebar buttons
             var config = {
             modeBarButtonsToAdd: [
                 {
                 name: 'Screenshot',
                 icon: Plotly.Icons.camera,
                 direction: 'up',
                 id:'chart-'+this.options.chart_id,
                 click: function(gd) { 
                     //var xid = this.closest(".item")
                     //console.log(this.id);
                     var chartId = "."+this.id;
                     //console.log('hi'); console.log(gd); alert('button1')
                     setTimeout(function(){ 
                         html2canvas(document.querySelector(chartId)).then(function(canvas) {
                             saveAs(canvas.toDataURL(), 'report.png');
                         });
                     }, 100);
                 
                 }
                 }],
                 modeBarButtonsToRemove: ['toImage']
             }

             Plotly.newPlot(this.el[0], data, base_info, config);
         },
         updateChart: function() {
             var t = this.el.closest(".chart_field"),
                 e = t.find("[name*=chart_field_graph_]").val(),
                 n = t.find("[name*=chart_field_color_]").val(),
                 nn = t.find("[name*=chart_field_seq_color_]").val(),
                 nnn = t.find("[name*=chart_field_color_type_]").val(),
                 i = t.find("input[name*=chart_field_chart_padding_left_]").val(),
                 r = t.find("input[name*=chart_field_chart_padding_bottom_]").val(),
                 o = t.find("[name*=chart_field_axis_x_]").val(),
                 a = t.find("[name*=chart_field_axis_y_]").val(),
                 s = t.find("textarea[name*=chart_field_title_]").val(),
                 c = t.find("input[name*=chart_field_legend_]").is(":checked"),
                 sa = t.find("input[name*=chart_field_show_annotations_]").is(":checked"),
                 u = t.find("[name*=chart_field_x_text_rotate_]").val(),
                 l = t.find("[name*=chart_field_x_text_multiline_]").is(":checked"),
                 f = t.find("[name*=chart_field_x_tick_culling_max_]").val(),
                 p = t.find("input[name*=chart_field_tooltip_name_]").val(),
                 h = t.find("[name*=chart_field_data_format_]").val(),
                 _ = t.find("[name*=chart_field_y_ticks_format_]").val(),
                 xf = t.find("[name*=chart_field_x_ticks_format_]").val(),
                 d = t.find("input[name*=chart_field_padding_top_]").val(),
                 v = t.find("input[name*=chart_field_padding_bottom_]").val(),
                 y = t.find("input[name*=chart_field_tick_count_]").val(),
                 m = t.find("[name*=chart_field_filter_name_]").val(),
                 g = t.find("[name*=chart_field_filter_value_]").val(),
                 x = t.find("[name*=chart_field_category_name_]").val(),
                 b = t.find("select[name*=chart_field_sort_]").val(),
                 S = t.find("input[name*=chart_field_labels_]").is(":checked"),
                 O = t.find("input[name*=chart_field_y_label_]").val(),
                 w = t.find("input[name*=chart_field_y_label_hide_]").is(":checked"),
                 xl = t.find("input[name*=chart_field_x_label_]").val(),
                 xlh = t.find("input[name*=chart_field_x_label_hide_]").is(":checked"),
                 E = t.find("input[name*=chart_field_y_from_zero_]").is(":checked"),
                 yp = t.find("input[name*=chart_field_axis_range_]").is(":checked"),
                 xfz = t.find("input[name*=chart_field_x_from_zero_]").is(":checked"),
                 k = t.find("select[name*=chart_field_static_reference_columns_]").val(),
                 j = t.find("input[name*=chart_field_static_reference_label_]").val(),
                 ub = t.find("[name*=chart_field_upper_bounds_]").val(),
                 lb = t.find("[name*=chart_field_lower_bounds_]").val(),
                 amin = t.find("[name*=chart_field_axis_min_]").val(),
                 amax = t.find("[name*=chart_field_axis_max_]").val(),
                 bnds = t.find("input[name*=chart_field_show_bounds_]").is(":checked"),
                 N = t.find("select[name*=chart_field_dynamic_reference_type_]").val(),
                 P = t.find("input[name*=chart_field_dynamic_reference_factor_]").val(),
                 F = t.find("input[name*=chart_field_dynamic_reference_label_]").val(),
                 x_sort_labels = t.find("input[name*=chart_field_x_sort_labels_]").is(":checked"),
                 M = $("#choose_y_axis_column option:selected").text(),
                 I = t.find("[name*=chart_field_show_labels_as_percentages_]").is(":checked"),
                 plotly = t.find("input[name*=chart_field_plotly_]").val(),
                 lplotly = t.find("input[name*=chart_field_plotly_line_]").val(),
                 bar_width = t.find("input[name*=chart_field_bar_width_]").val(),
                 donut_hole = t.find("input[name*=chart_field_donut_hole_]").val(),
                 ltypes_list = t.find(`[name*=chart_field_line_type_]`),
                 lwidths_list = t.find(`[name*=chart_field_line_width_]`),
                 lwidths = [],
                 ltypes = [];

             for (let i = 0; i < ltypes_list.length; i++) {
               ltypes.push(t.find(`[name=${ltypes_list[i].id}]`).val())
             }

             try {
               var empty_text = document.querySelector("#line_type_empty_text")

               if (empty_text !== null) {
                 empty_text.remove()
               }

             } catch (error) {
               console.error(error)
             }

             for (let i = 0; i < lwidths_list.length; i++) {
               lwidths.push(String(t.find(`[name=${lwidths_list[i].id}]`).val()))
             }

             if (this.fetched_data && this.options.x_axis === o && this.options.y_axis === a && this.options.filter_name === m && this.options.filter_value === g && this.options.category_name === x && this.options.chart_type === e && this.options.static_reference_columns === k && this.options.dynamic_reference_type === N && this.options.dynamic_reference_factor === P && this.options.plotly === plotly && this.options.bar_width === bar_width && this.options.donut_hole === donut_hole) return this.options.colors = n, this.options.seq_color = nn, this.options.color_type = nnn, this.options.chart_type = e, this.options.title = s, this.options.show_legend = c, this.options.show_annotations = sa, this.options.show_bounds = bnds, this.options.x_text_rotate = u, this.options.x_text_multiline = l, this.options.x_tick_culling_max = f, this.options.tooltip_name = p, this.options.data_format = h, this.options.y_tick_format = _, this.options.x_tick_format = xf, this.options.chart_padding_left = i, this.options.chart_padding_bottom = r, this.options.padding_top = d, this.options.padding_bottom = v, this.options.show_labels = S, this.options.y_label = O, this.options.y_label_hide = w, this.options.x_label = xl, this.options.x_label_hide = xlh, this.options.y_from_zero = E, this.options.axis_range = yp, this.options.x_from_zero, this.options.tick_count = y, this.options.data_sort = b, this.options.upper_bounds = ub, this.options.lower_bounds = lb, this.options.axis_min = amin, this.options.axis_max = amax, this.options.static_reference_columns = k, this.options.static_reference_label = j, this.options.dynamic_reference_type = N, this.options.dynamic_reference_factor = P, this.options.dynamic_reference_label = F, this.options.measure_label = M, this.options.show_labels_as_percentages = I, this.options.plotly = plotly, this.options.bar_width = bar_width, this.options.x_sort_labels = x_sort_labels, this.options.donut_hole = donut_hole, this.options.line_types = ltypes.join(), this.options.line_widths = lwidths.join(), void this.createChart(this.fetched_data);
             this.options.colors = n, this.options.seq_color = nn, this.options.color_type = nnn, this.options.chart_type = e, this.options.x_axis = o, this.options.y_axis = a, this.options.title = s, this.options.show_legend = c, this.options.show_annotations = sa, this.options.show_bounds = bnds, this.options.x_text_rotate = u, this.options.x_text_multiline = l, this.options.x_tick_culling_max = f, this.options.tooltip_name = p, this.options.data_format = h, this.options.y_tick_format = _, this.options.x_tick_format = xf, this.options.chart_padding_left = i, this.options.chart_padding_bottom = r, this.options.padding_top = d, this.options.padding_bottom = v, this.options.show_labels = S, this.options.tick_count = y, this.options.y_label = O, this.options.y_label_hide = w, this.options.x_label = xl, this.options.x_label_hide = xlh, this.options.y_from_zero = E, this.options.axis_range = yp, this.options.x_from_zero, this.options.filter_name = m, this.options.filter_value = g, this.options.category_name = x, this.options.data_sort = b, this.options.upper_bounds = ub, this.options.lower_bounds = lb, this.options.axis_min = amin, this.options.axis_max = amax, this.options.static_reference_columns = k, this.options.static_reference_label = j, this.options.dynamic_reference_type = N, this.options.dynamic_reference_factor = P, this.options.dynamic_reference_label = F, this.options.measure_label = M, this.options.show_labels_as_percentages = I, this.options.plotly = plotly, this.options.bar_width = bar_width, this.options.donut_hole = donut_hole, this.options.x_sort_labels = x_sort_labels, this.options.line_types = ltypes.join(), this.options.line_widths = lwidths.join();

             if (bar_width != ''){
               this.options.bar_width = parseFloat(bar_width) / 10
             }

             if (donut_hole != ''){
               this.options.donut_hole = parseFloat(donut_hole) / 10
             }

             if (this.options.lplotly){
                 this.options.lplotly = lplotly
             }
             
             var A = this.create_sql();
             this.get_resource_datа(A)

             t.find("[name*=chart_field_graph_]").change();
         },
         deleteChart: function() {
             this.el.closest(".chart_field").remove()
         },
         teardown: function() {
             this.sandbox.unsubscribe("querytool:updateCharts", this.updateChart.bind(this))
         },
         sortData: function(t, e, n, i) {
             /*
             Disable sorting for data with numbers like 1.A 2.B*/
             if(t !== "default") {
                 e.forEach(function(t) {
                     isNaN(t[i]) && (t[i] = t[i].replace(/^\d{1,2}\./, ""))
                 })
             }
             
             "asc" === t ? e.sort(function(t, e) {
                 return t[n] - e[n]
             }) : "desc" === t ? (e.sort(function(t, e) {
                 return t[n] - e[n]
             }), e.reverse()) : (e.sort(function(t, e) {
                 var n = t[i],
                     r = e[i];
                 if (isNaN(n) || isNaN(r)) {
                     var o, a = n.match(/^\d{1,2}\./),
                         s = r.match(/^\d{1,2}\./);
                     return a && s ? 0 === (o = parseInt(a[0]) - parseInt(s[0])) ? 0 : o / Math.abs(o) : a && !s ? -1 : !a && s ? 1 : n < r ? -1 : n > r ? 1 : 0
                 }
                 return 0 === (o = Number(n) - Number(r)) ? 0 : o / Math.abs(o)
             }), e.forEach(function(t) {
                 isNaN(t[i]) && (t[i] = t[i].replace(/^\d{1,2}\./, ""))
             }))
         },
         sortFormatData: function(t, e) {
             var n = 0,
                 i = "";
             return "$" === t ? (n = this.countDecimals(e, 2), i = d3.format("$,." + n + "f")) : "s" === t ? (e = Math.round(10 * e) / 10, i = d3.format(t)) : i = d3.format(t), i(e)
             
         },
         countDecimals: function(t, e) {
             return Math.min(10 * t % 1 ? 2 : t % 1 ? 1 : 0, e)
         },
         renderChartTitle: function(t, e) {
             var n = nunjucks.configure({
                     tags: {
                         variableStart: "{",
                         variableEnd: "}"
                     }
                 }),
                 i = {
                     measure: e.measure.alias
                 },
                 r = !0,
                 o = !1,
                 a = void 0;
             try {
                 for (var s, c = e.filters[Symbol.iterator](); !(r = (s = c.next()).done); r = !0) {
                     var u = s.value;
                     i[u.slug] = u.value
                 }
             } catch (t) {
                 o = !0, a = t
             } finally {
                 try {
                     r || null == c.return || c.return()
                 } finally {
                     if (o) throw a
                 }
             }
             e.optionalFilter && (i.optional_filter = e.optionalFilter.value);
             try {
                 return n.renderString(t, i)
             } catch (e) {
                 return t
             }
         },
         getStaticReferenceColumn: function(t, e) {
             var n = !0,
                 i = !1,
                 r = void 0;
             try {
                 for (var o, a = (t || [])[Symbol.iterator](); !(n = (o = a.next()).done); n = !0) {
                     var s = o.value,
                         c = s.split("|")[0],
                         u = s.split("|")[1];
                     if (c === e) return u
                 }
             } catch (t) {
                 i = !0, r = t
             } finally {
                 try {
                     n || null == a.return || a.return()
                 } finally {
                     if (i) throw r
                 }
             }
         }
     }
});
