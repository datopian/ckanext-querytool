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
// @ts-ignore
ckan.module('querytool-viz-preview', function() {
    var api = {
        get: function(action, params) {
            var api_ver = 3;
            // @ts-ignore
            var base_url = ckan.sandbox().client.endpoint;
            // @ts-ignore
            params = $.param(params);
            var url = base_url + '/api/' + api_ver + '/action/' + action + '?' + params;
            // @ts-ignore
            return $.getJSON(url);
        },
        post: function(action, data) {
            var api_ver = 3;
            // @ts-ignore
            var base_url = ckan.sandbox().client.endpoint;
            var url = base_url + '/api/' + api_ver + '/action/' + action;
            // @ts-ignore
            return $.post(url, JSON.stringify(data), 'json');
        }
    };

    return {
        initialize: function() {
            var newSql = this.create_sql();

            if (typeof this.options.x_axis !== "boolean") {
                this.get_resource_datа(newSql);
            }

            var chartField = this.el.closest('.chart_field');

            // The Update chart button is only in the admin area. In the public
            // updating of viz items will be applied with a reload of the page.
            if (chartField.length > 0) {
                var updateBtn = chartField.find('.update-chart-btn');
                var deleteBtn = chartField.find('.delete-chart-btn');

                updateBtn.click(this.updateChart.bind(this));
                deleteBtn.click(this.deleteChart.bind(this));
            }

            this.sandbox.subscribe('querytool:updateCharts', this.updateChart.bind(this));
        },
        // Enhance the SQL query with grouping and only select 2 columns.
        create_sql: function() {
            var parsedSqlString = this.options.sql_string.split('*');
            var sqlStringExceptSelect = parsedSqlString[1];
            // We need to encode some characters, eg, '+' sign:
            sqlStringExceptSelect = sqlStringExceptSelect.replace('+', '%2B');  //  NOTE: mapped to t
            var chart_filter_name = (this.options.filter_name === true) ? '' : this.options.filter_name; //  NOTE: mapped to e
            var chart_filter_value = (this.options.filter_value === true) ? '' : this.options.filter_value; //  NOTE: mapped to n
            var y_axis = (this.options.y_axis === true) ? '' : this.options.y_axis; //  NOTE: mapped to i
            var static_reference_columns = (this.options.static_reference_columns === true) ? [] : this.options.static_reference_columns;
            var static_reference_column = this.getStaticReferenceColumn(static_reference_columns, y_axis);  //  NOTE: mapped to o
            var category = (this.options.category_name === true) ? '' : this.options.category_name; //  TODO: remove this line, `category` ins't used anywhere

            var tmp_filter_value = chart_filter_value;
            var tmp_filter_name = chart_filter_name;

            if (tmp_filter_value && typeof tmp_filter_value == "string") {
                if (tmp_filter_value.includes("'")) {
                    // @ts-ignore
                    tmp_filter_value = tmp_filter_value.replaceAll("'", "''");
                }

                if (tmp_filter_value.includes("&")) {
                    tmp_filter_value = tmp_filter_value.replaceAll("&", "\\0026");
                }
            }

            // If additional chart filter is set extend the current sql with the new filter
            if (chart_filter_name && chart_filter_value) {
                sqlStringExceptSelect += ' AND ("' + tmp_filter_name + '"' + " = '" + tmp_filter_value + "')";  //  NOTE: mapped to t
            }

            var sql;
            var upper_bounds = this.options.upper_bounds;
            var lower_bounds = this.options.lower_bounds;

            if([upper_bounds, lower_bounds].includes(y_axis)) {
                upper_bounds = lower_bounds = "";
            }

            if(static_reference_column) {
                //  TODO: refactor this query with template string
                //  using `...stuff ${variable} stuff...` so  that
                //  it becomes more readable
                if(
                    !["undefined", "None", ""].includes(lower_bounds)
                    && !["undefined", "None", ""].includes(upper_bounds)
                    && typeof lower_bounds !== "boolean"
                    && typeof upper_bounds !== "boolean"
                ) {
                    sql = 'SELECT AVG("' + static_reference_column + '") as static_reference_column, "' 
                        + this.options.x_axis + '", SUM("' + upper_bounds + '") as "' 
                        + upper_bounds.toLowerCase() + '", SUM("' + lower_bounds + '") as "' 
                        + lower_bounds.toLowerCase() + '", SUM("' + this.options.y_axis 
                        + '") as "' + this.options.y_axis +'"' + sqlStringExceptSelect + ' GROUP BY "' 
                        + this.options.x_axis + '"';
                } else {
                    sql = 'SELECT AVG("' + static_reference_column + '") as static_reference_column, "' 
                        + this.options.x_axis + '", SUM("' + this.options.y_axis 
                        + '") as "' + this.options.y_axis + '"' + sqlStringExceptSelect + ' GROUP BY "' 
                        + this.options.x_axis + '"';
                }
            }
            else {
                if(
                    !["undefined", "None", ""].includes(lower_bounds)
                    && !["undefined", "None", ""].includes(upper_bounds)
                    && typeof lower_bounds !== "boolean"
                    && typeof upper_bounds !== "boolean"
                ) {
                    sql = 'SELECT "' + this.options.x_axis + '", SUM("' 
                        + upper_bounds + '") as "' + upper_bounds.toLowerCase() + '", SUM("' 
                        + lower_bounds + '") as "' + lower_bounds.toLowerCase() + '", SUM("' 
                        + this.options.y_axis + '") as "' + this.options.y_axis 
                        + '"' + sqlStringExceptSelect + ' GROUP BY "' + this.options.x_axis + '"';
                } else {
                    sql = 'SELECT "' + this.options.x_axis + '", SUM("' 
                        + this.options.y_axis + '") as "' + this.options.y_axis 
                        + '"' + sqlStringExceptSelect + ' GROUP BY "' + this.options.x_axis + '"';
                }
            }

            return sql;
        },
        // Get the data from Datastore.
        get_resource_datа: function(sql) {

            var category = (this.options.category_name === true) ? '' : this.options.category_name; // NOTE: mapped to n
            var x_axis = (this.options.x_axis === true) ? '' : this.options.x_axis; // NOTE: mapped to i
            var y_axis = (this.options.y_axis === true) ? '' : this.options.y_axis; // NOTE: mapped to r
            var upper_bounds = this.options.upper_bounds === true ? "" : this.options.upper_bounds;  
            var lower_bounds = this.options.lower_bounds === true ? "" : this.options.lower_bounds;  
            var resource_id = sql.split('FROM')[1].split('WHERE')[0].split('"')[1]; // NOTE: mapped to o
            var chart_type = this.options.chart_type; // NOTE: mapped to a

            var chart_filter_name = (this.options.filter_name === true) ? '' : this.options.filter_name;  // NOTE: mapped to s
            var chart_filter_value = (this.options.filter_value === true) ? '' : this.options.filter_value; // NOTE: mapped to c
            var static_reference_columns = (this.options.static_reference_columns === true) ? [] : this.options.static_reference_columns;  // NOTE: mapped to u
            var static_reference_column = this.getStaticReferenceColumn(static_reference_columns, y_axis); // NOTE: mapped to l
            var dynamic_reference_type = (this.options.dynamic_reference_type === true) ? '' : this.options.dynamic_reference_type; // NOTE: mapped to f
            var dynamic_reference_factor = (this.options.dynamic_reference_factor === true) ? '' : this.options.dynamic_reference_factor; // NOTE: mapped to p

            // @ts-ignore
            var viz_form = $('#visualizations-form');
            var f = viz_form.data('mainFilters'); // NOTE: mapped to h
            var previous_filters = (this.options.query_filters === true) ? f : this.options.query_filters; // NOTE: mapped to _

            var chart_filter = {}; // NOTE: mapped to d

            if (chart_filter_name && chart_filter_value) {
                chart_filter = {
                    name: chart_filter_name,
                    value: typeof chart_filter_value === "string" ? 
                        // @ts-ignore
                        chart_filter_value.replaceAll('&', '\\0026') 
                        : 
                        chart_filter_value
                }
            }

            api.post('querytool_get_chart_data', { // NOTE: mapped to t
                    category: category,
                    sql_string: sql,
                    resource_id: resource_id,
                    x_axis: x_axis,
                    y_axis: y_axis,
                    upper_bounds: upper_bounds,
                    lower_bounds: lower_bounds,
                    chart_type: chart_type,
                    previous_filters: JSON.stringify(previous_filters),
                    chart_filter: JSON.stringify(chart_filter)
                })
                .done(function(data) {
                    if (data.success) {
                        this.fetched_data = data.result;

                        // Reset all metrics
                        this.y_axis_max = null;
                        this.y_axis_avg = null;
                        this.y_axis_min = null;
                        this.static_reference_value = null;
                        this.dynamic_reference_value = null;

                        // Get max/avg/min
                        if (category) {
                          this.y_axis_max = this.fetched_data.y_axis_max;
                          this.y_axis_avg = this.fetched_data.y_axis_avg;
                          this.y_axis_min = this.fetched_data.y_axis_min;
                          delete this.fetched_data.y_axis_max;
                          delete this.fetched_data.y_axis_avg;
                          delete this.fetched_data.y_axis_min;
                        } else {
                          var values = [];
                          for (var row of this.fetched_data) {
                            // Values from server are strings..
                            values.push(+row[y_axis.toLowerCase()]);
                          }
                          this.y_axis_max = Math.max.apply(null, values);
                          this.y_axis_avg = values.reduce(function (a, b) {return a+b;}, 0) / values.length;
                          this.y_axis_min = Math.min.apply(null, values);
                        }

                        // Static reference
                        if (static_reference_column) {
                          if (category) {
                            this.static_reference_value = this.fetched_data.static_reference_value;
                            delete this.fetched_data.static_reference_value;
                          } else {
                            var static_reference_values = [];
                            for (var row of this.fetched_data) {
                              // Values from server are strings..
                              static_reference_values.push(+row.static_reference_column)
                              delete row.static_reference_column;
                            }
                            this.static_reference_value = static_reference_values.reduce(function (a, b) {return a+b;}, 0) / static_reference_values.length;
                          }
                        }

                        // Dynamic reference
                        if (dynamic_reference_type) {
                          if (dynamic_reference_type === 'Maximum') {
                            this.dynamic_reference_value = this.y_axis_max;
                          } else if (dynamic_reference_type === 'Average') {
                            this.dynamic_reference_value = this.y_axis_avg;
                          } else if (dynamic_reference_type === 'Minimum') {
                            this.dynamic_reference_value = this.y_axis_min;
                          }
                          if (dynamic_reference_factor !== '') {
                            this.dynamic_reference_value = this.dynamic_reference_value * dynamic_reference_factor;
                          }
                        }
                        this.createChart(this.fetched_data);
                    } else {
                       this.el.text(this._('Chart could not be created.'));
                    }
                }.bind(this))
                .error(function(error) {
                    this.el.text(this._('Chart could not be created.'));
                }.bind(this));
        },
        createChart: function(data) {
            var x_axis = this.options.x_axis.toLowerCase();
            var y_axis = this.options.y_axis.toLowerCase(); //  NOTE: mapped to i
            var records = data;
            var show_legend = this.options.show_legend; //  NOTE: mapped to o
            var show_legend_title = this.options.show_legend_title;
            var custom_legend_title = this.options.custom_legend_title;
            var show_annotations = this.options.show_annotations;   //  NOTE: mapped to sa
            var x_text_rotate = this.options.x_text_rotate;
            var x_text_multiline = this.options.x_text_multiline;
            var x_tick_culling_max = this.options.x_tick_culling_max;
            var tooltip_name = this.options.tooltip_name;
            var data_format = this.options.data_format;
            var y_tick_format = this.options.y_tick_format;
            y_tick_format = typeof y_tick_format == 'string' ? y_tick_format : ''
            var x_tick_format = this.options.x_tick_format;   //   NOTE: mapped to xf
            x_tick_format = typeof x_tick_format == 'string' ? x_tick_format : ''
            var chart_padding_left = (this.options.chart_padding_left === true) ? null : this.options.chart_padding_left;
            var chart_padding_bottom = (this.options.chart_padding_bottom === true) ? null : this.options.chart_padding_bottom;
            var padding_top = (this.options.padding_top === true) ? null : this.options.padding_top;
            var padding_bottom = (this.options.padding_bottom === true) ? null : this.options.padding_bottom;
            var tick_count = (this.options.tick_count === true) ? '' : this.options.tick_count;
            var show_labels = this.options.show_labels;
            var y_label = (this.options.y_label === true) ? null : this.options.y_label;    //  NOTE: mapped to _
            var x_label = (this.options.x_label === true) ? null : this.options.x_label;    //  NOTE: mapped to xl
            var y_label_hide = this.options.y_label_hide;   //  NOTE: mapped to d
            var x_label_hide = this.options.x_label_hide; //  NOTE: mapped to xlh
            var y_from_zero = this.options.y_from_zero;
            var x_from_zero = this.options.x_from_zero; ;//  NOTE: mapped to xfz
            var axis_range = this.options.axis_range; ; //  NOTE: mapped to yp
            var data_sort = this.options.data_sort;
            var measure_label = this.options.measure_label; //  NOTE: mapped to m
            var upper_bounds = this.options.upper_bounds === true ? '' : this.options.upper_bounds.toLowerCase();
            var lower_bounds = this.options.lower_bounds === true ? '' : this.options.lower_bounds.toLowerCase();
            var show_bounds = this.options.show_bounds;  //  NOTE: mapped to bnds
            var additionalCategory = (this.options.category_name === true) ? '' : this.options.category_name;   //  NOTE: mapped to g
            var static_reference_label = (this.options.static_reference_label === true) ? '' : this.options.static_reference_label;
            var dynamic_reference_label = (this.options.dynamic_reference_label === true) ? '' : this.options.dynamic_reference_label;
            var x_sort_labels = this.options.x_sort_labels;
            var values;
            var show_labels_as_percentages = this.options.show_labels_as_percentages || false;
            var desc = this.options.description === true ? '' : this.options.description;   //  NOTE: mapped to desc
            var line_types = this.options.line_types;
            var line_widths = this.options.line_widths;   

            // Base options
            var options = {
                bindto: this.el[0],
                color: {
                    pattern: this.options.colors.split(',')
                },
                padding: {
                    right: 50,
                    bottom:16
                }
            };


            // Title
            var titleVal = (this.options.title === true) ? '' : this.options.title; //  NOTE: mapped to w
            var queryFilters = (this.options.query_filters === true) ? [] : this.options.query_filters; //  NOTE: mapped to E
            var plotly = this.options.plotly === true ? '' : this.options.plotly;
            if (!queryFilters.length) queryFilters = (this.options.info_query_filters === true) ? [] : this.options.info_query_filters;
            var optionalFilterName = (this.options.filter_name === true) ? '' : this.options.filter_name;
            var optionalFilterSlug = (this.options.filter_slug === true) ? '' : this.options.filter_slug;
            var optionalFilterValue = (this.options.filter_value === true) ? '' : this.options.filter_value;    //  NOTE: mapped to N
            var optionalFilter = optionalFilterName ? //    NOTE: mapped to P
                {
                    name: optionalFilterName, 
                    slug: optionalFilterSlug, 
                    value: optionalFilterValue.toString()
                } 
                : 
                undefined;

            if (y_label !== '') {
              y_label = this.renderChartTitle(y_label, {
                measure: {name: y_axis, alias: measure_label},
                filters: queryFilters,
                optionalFilter: optionalFilter,
              });
            }

            if (x_label !== '') {
              x_label = this.renderChartTitle(x_label, {
                measure: {name: x_axis, alias: measure_label},
                filters: queryFilters,
                optionalFilter: optionalFilter,
              });
            }
            
            desc = this.renderChartTitle(
                desc,
                {
                    measure: {
                        name: y_axis,
                        alias: measure_label,
                    },
                    filters: queryFilters,
                    optionalFilter: optionalFilter,
                }
            );

            titleVal = this.renderChartTitle(titleVal, {
              measure: {name: y_axis, alias: measure_label},
              filters: queryFilters,
              optionalFilter: optionalFilter,
            });
            options.title = {
                text: titleVal,
                position: "upper-left",
                padding: {
                    left: 0,
                    right: 0,
                    bottom: 18,
                    top:0
                }
            }
            options.legend = {
                show: show_legend
            }
            options.tooltip = {
                format: {}
            }

            // Y-label
            var y_label_text = !y_label_hide ? (y_label || measure_label || '') : '';

            // Sort data
            var sBarOrder = data_sort;
            if (
              (this.options.chart_type !== 'sbar' && this.options.chart_type !== 'shbar')
              && !additionalCategory
            ) {
                this.sortData(data_sort, records, y_axis, x_axis);
            }

            // Legend/tooltip
            options.legend = {show: show_legend}
            options.tooltip = {format: {}}
            if (tooltip_name !== true && tooltip_name !== '') {
                options.tooltip.format['title'] = function(d) {
                    if (options.data.type === 'donut' || options.data.type === 'pie') {
                        return tooltip_name;
                    }
                    return tooltip_name + ' ' + d;
                }
            }
            options.tooltip.format['value'] = function(value, ratio, id) {
                var dataf = this.sortFormatData(data_format, value);
                return dataf;
            }.bind(this);

            // Chart types
            if (this.options.chart_type === 'donut' ||
                this.options.chart_type === 'pie') {
                values = records.map(function(item) {
                    return [item[x_axis], item[y_axis]]
                });
                options.data = {
                    columns: values,
                    type: this.options.chart_type,
                    order: data_sort === 'default' ? 'desc' : data_sort
                };
                if (show_labels_as_percentages == false) {
                  options[this.options.chart_type] = {
                    label: {
                      format: function (value, ratio, id) {
                        return value;
                      }
                    }
                  };
                }
            } else if (
                (this.options.chart_type === 'sbar' || this.options.chart_type === 'shbar')
                && (this.options.category_name === '' || typeof this.options.category_name === 'boolean') 
            ) {
                var horizontal = (this.options.chart_type === 'shbar') ? true : false

                var yrotate = 0;
                if (horizontal) {
                    // On horizontal bar the x axis is now actually the y axis
                    yrotate = x_text_rotate;
                }
                values = records.map(function(item) {
                    return [item[x_axis], item[y_axis]]
                });
                options.data = {
                    columns: values,
                    type: 'bar',
                    order: sBarOrder
                };
                var groups = values.map(function(item) {
                    return item[0];
                });
                options.data.groups = [groups];

                options.axis = {
                    rotated: horizontal,
                    y: {
                        tick: {
                            count: tick_count,
                            format: function(value) {
                                var dataf = this.sortFormatData(y_tick_format, value);
                                return dataf;
                            }.bind(this),
                            rotate: yrotate
                        },
                        padding: {
                            top: 50,
                            bottom: 50,
                        }
                    },
                    x: {
                        tick: {
                            rotate: x_text_rotate,
                            multiline: x_text_multiline,
                            multilineMax: 3,
                        }
                    }
                }
            } else {
                var rotate = false;
                var ctype = this.options.chart_type;
                var yrotate = 0;
                if (this.options.chart_type === 'hbar') {
                    rotate = true;
                    ctype = 'bar';
                    // On horizontal bar the x axis is now actually the y axis
                    yrotate = x_text_rotate;

                    //Resolving bug of bars with 2 columns
                    if(records.length==2){
                        options.padding = {
                        left:110
                      }
                    }
                }
                // We're hiding bubble charts for now but leaving this workaround
                // so that it won't be lost in the future. To put back bubble
                // charts add an object in 'helpers.py:get_chart_types' method.
                if (this.options.chart_type === 'bscatter') {
                    //workaround for bubble charts, scale log base 10 because of large values
                    var rs = d3.scale.log().base(10).domain([1, 1000]).range([0, 10]);
                    ctype = 'scatter';
                    options.point = {
                        r: function(d) {
                            var num = d.value;
                            return rs(num)
                        },
                        sensitivity: 100,
                        focus: {
                            expand: {
                                enabled: true
                            }
                        }
                    };
                }

                var columns = [];

                if (additionalCategory) {

                    var orderedRecords = {};
                    Object.keys(records).sort().forEach(function(key) {
                        orderedRecords[key] = records[key];
                    });

                    for (var key in orderedRecords) {
                        columns.push(orderedRecords[key]);;
                    }

                    options.data = {
                        x: 'x',
                        columns: columns,
                        type: ctype,
                        labels: show_labels
                    };
                } else {
                    columns = records.map(function(item) {
                        return Number(item[y_axis]);
                    });

                    var categories = records.map(function(item) {
                        return item[x_axis];
                    });

                    columns.unshift(this.options.x_axis);

                    options.data = {
                        columns: [columns],
                        type: ctype,
                        labels: show_labels
                    };

                }

                if (show_labels) {
                    options.data['labels'] = {
                        format: function(value) {
                            var dataf = this.sortFormatData(data_format, value);
                            return dataf;
                        }.bind(this),
                    }
                }

                //Tick count on x-axis for line charts
                if (this.options.chart_type === 'line') {
                    options.axis = {
                        y: {
                            tick: {
                                count: tick_count,
                                format: function(value) {
                                    var dataf = this.sortFormatData(y_tick_format, value);
                                    return dataf;
                                }.bind(this),
                                rotate: yrotate
                            },
                            padding: {
                                top: 50,
                                bottom: 50,
                            },
                            label: {
                              text: y_label_text,
                              position: 'outer-middle',
                            }
                        },
                        x: {
                            type: 'category',
                            categories: categories,
                            tick: {
                                culling: {
                                  max: x_tick_culling_max || 0
                                },
                                rotate: x_text_rotate,
                                multiline: x_text_multiline,
                                multilineMax: 3
                            }
                        },
                        rotated: rotate,
                    };
                } else {
                  //no Tick count on x-axis for bar
                  options.axis = {
                      y: {
                          tick: {
                              count: tick_count,
                              format: function(value) {
                                  var dataf = this.sortFormatData(y_tick_format, value);
                                  return dataf;
                              }.bind(this),
                              rotate: yrotate
                          },
                          padding: {
                              top: 50,
                              bottom: 50,
                          },
                          label: {
                            text: y_label_text,
                            position: 'outer-middle',
                          }
                      },
                      x: {
                          type: 'category',
                          categories: categories,
                          tick: {
                              rotate: x_text_rotate,
                              multiline: x_text_multiline,
                              multilineMax: 3
                          }
                      },
                      rotated: rotate,
                  };

                }
                options.point = {
                  r: 3,
                }
            }

            // Reference lines
            if (!['sbar', 'shbar', 'donut', 'pie'].includes(this.options.chart_type)) {
              options.grid = {y: {lines: []}};

              // Static
              if (this.static_reference_value) {
                // Base
                options.grid.y.lines.push({
                  value: this.static_reference_value,
                  text: static_reference_label,
                  class: 'base',
                })
                // Active (to show on hover)
                let value = this.sortFormatData(data_format, this.static_reference_value)
                options.grid.y.lines.push({
                  value: this.static_reference_value,
                  text: static_reference_label + ' (' + value + ')',
                  class: 'active html2canvas-ignore',
                })
              }

              // Dynamic
              if (this.dynamic_reference_value) {
                // Base
                options.grid.y.lines.push({
                  value: this.dynamic_reference_value,
                  text: dynamic_reference_label,
                  class: 'base',
                })
                // Active (to show on hover)
                let value = this.sortFormatData(data_format, this.dynamic_reference_value)
                options.grid.y.lines.push({
                  value: this.dynamic_reference_value,
                  text: dynamic_reference_label + ' (' + value + ')',
                  class: 'active html2canvas-ignore',
                })
              }

              // Y axis range
              if (this.static_reference_value || this.dynamic_reference_value) {
                options.axis.y.min = Math.min.apply(null, [this.static_reference_value, this.dynamic_reference_value, this.y_axis_min].filter(function (value) {return !isNaN(value) && value !== null;}));
                options.axis.y.max = Math.max.apply(null, [this.static_reference_value, this.dynamic_reference_value, this.y_axis_max].filter(function (value) {return !isNaN(value) && value !== null;}));
                options.axis.y.padding = {bottom: 50, top: 50};
                if (['bar', 'hbar'].includes(this.options.chart_type)) {
                  options.axis.y.padding.bottom = 0;
                }
              }

            }

            // Y-axis from zero
            if (['line', 'area', 'spline', 'scatter', 'bscatter', 'bar', 'hbar', 'sbar', 'shbar'].includes(this.options.chart_type)) {
              if (y_from_zero) {
                options.axis.y.min = 0;
                options.axis.y.padding = options.axis.y.padding || {};
                options.axis.y.padding.bottom = 0;
              }
            }

            var plotly = this.options.plotly;
            var q = JSON.parse(JSON.stringify(plotly));
  
            var data = [];
            var columns = options.data["columns"];
            var format = this.options.data_format;
            const dataLabelFormatter = d3.format(format);
  
            function reorderColumns(columns) {
              if (columns.length > 0) {
                if (columns[0][0] === "x") {
                  columns = columns.reverse();
                }
                for (i = 0; i < columns.length - 1; i++) {
                  if (columns[i][0] === "x") {
                    columns.push(columns.splice(i, 1)[0]);
                  }
                }
              }
              return columns;
            }
  
            columns = reorderColumns(columns);
  
            // check if annotations are turned on or off
            if (show_annotations == true) {
              var labelsMode = "lines+markers+text";
              var scatterLabelsMode = "markers+text";
            } else {
              var labelsMode = "lines+markers";
              var scatterLabelsMode = "markers";
            }
  
            function convertTextTitles(textTitles) {
              var convertedTextTitles = [];
  
              for (i = 0; i < textTitles.length; i++) {
                convertedTextTitles.push(dataLabelFormatter(textTitles[i]));
              }
              return convertedTextTitles;
            }
  
            //type of line
            var lineTypes = this.options.line_types;
            var lineWidths = this.options.line_widths;
  
            if (lineTypes.length > 0) {
              var lineTypesList = this.options.line_types.split(",");
            } else {
              var lineTypesList = this.options.line_types;
            }
  
            if (lineWidths.length > 0) {
              var lineWidthsList = this.options.line_widths.split(",");
            } else {
              var lineWidthsList = String(this.options.line_widths);
            }
  
            if (typeof lineWidths == "number") {
              lineWidths = String(lineWidths);
            }
  
            function setDefaultWidth(width) {
              if ([undefined, "0", ""].includes(width)) {
                return "4";
              } else {
                return width;
              }
            }
  
            // if typeof plotly is string -> new chart
            // if typeof plotly is object -> existing chart (user view or admin preview)
            // if plotly value is true we may have some data in the database for the chart, but plotly is set to true
            if ("line" === this.options.chart_type) {
              var categories = options.axis["x"]["categories"];
  
              if (categories === undefined) {
                if (Array.isArray(columns[columns.length - 1]) && options.axis["x"]) {
                  var x = columns[columns.length - 1].slice(1);
                } else {
                  var x = columns[columns.length - 2].slice(1);
                }
                var tmp;
  
                for (tmp = 0; tmp < columns.length - 1; tmp++) {
                  var name = columns[tmp][0];
  
                  if (
                    name !== undefined &&
                    name !== "x" &&
                    Array.isArray(columns[tmp])
                  ) {
                    var textTitles = columns[tmp].slice(1);
                    var convertedTextTitles = convertTextTitles(textTitles);
  
                    var trace = {
                      x: x,
                      y: columns[tmp].slice(1),
                      type: "scatter",
                      mode: labelsMode,
                      text: convertedTextTitles,
                      textposition: "top right",
                      textfont: {
                        size: 14,
                      },
                      name: name,
                      line: {
                        width: setDefaultWidth(lineWidthsList[tmp]),
                        dash: lineTypesList[tmp],
                      },
                      hovertemplate: "%{y}<extra></extra>",
                      error_y: {},
                      error_x: {},
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
                  hovertemplate: "%{y}<extra></extra>",
                  textposition: "top right",
                  textfont: {
                    size: 14,
                  },
                  type: "scatter",
                  line: {
                    width: setDefaultWidth(lineWidths),
                    dash: lineTypes,
                  },
                  error_y: {},
                  error_x: {},
                };
                data.push(trace);
              }
            }
  
            if ("pie" === this.options.chart_type) {
              var x = [];
              var y = [];
  
              for (a = 0; a < columns.length; a++) {
                x.push(columns[a][0]);
                y.push(columns[a][1]);
              }
  
              var trace = {
                labels: x,
                values: y,
                name: "Color",
                type: "pie",
              };
              data = [];
              data.push(trace);
            }
  
            if ("donut" === this.options.chart_type) {
              var x = [];
              var y = [];
  
              for (a = 0; a < columns.length; a++) {
                x.push(columns[a][0]);
                y.push(columns[a][1]);
              }
  
              var trace = {
                labels: x,
                values: y,
                hole: this.options.donut_hole || 0.4,
                name: "Color",
                type: "pie",
              };
  
              data = [];
              data.push(trace);
            }
  
            if ("scatter" === this.options.chart_type) {  
              var categories = options.axis["x"]["categories"];
  
              if (categories === undefined) {
                if (Array.isArray(columns[columns.length - 1]) && options.axis["x"]) {
                  var x = columns[columns.length - 1].slice(1);
                } else {
                  var x = columns[columns.length - 2].slice(1);
                }
                var tmp;
  
                for (tmp = 0; tmp < columns.length - 1; tmp++) {
                  var name = columns[tmp][0];
  
                  if (
                    name !== undefined &&
                    name !== "x" &&
                    Array.isArray(columns[tmp])
                  ) {
                    var textTitles = columns[tmp].slice(1);
                    var convertedTextTitles = convertTextTitles(textTitles);
  
                    var trace = {
                      x: x,
                      y: columns[tmp].slice(1),
                      type: this.options.chart_type,
                      mode: scatterLabelsMode,
                      text: convertedTextTitles,
                      textposition: "top right",
                      textfont: {
                        size: 14,
                      },
                      name: name,
                      line: {
                        width: 4,
                      },
                      hovertemplate: "%{y}<extra></extra>",
                      error_y: {},
                      error_x: {},
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
                  mode: scatterLabelsMode,
                  text: convertedTextTitles,
                  hovertemplate: "%{y}<extra></extra>",
                  textposition: "top right",
                  textfont: {
                    size: 14,
                  },
                  type: this.options.chart_type,
                  line: {
                    width: 4,
                  },
                  error_y: {},
                  error_x: {},
                };
                data.push(trace);
              }
            }
  
            if ("spline" === this.options.chart_type) {
              var categories = options.axis["x"]["categories"];
  
              if (categories === undefined) {
                if (Array.isArray(columns[columns.length - 1]) && options.axis["x"]) {
                  var x = columns[columns.length - 1].slice(1);
                } else {
                  var x = columns[columns.length - 2].slice(1);
                }
                var tmp;
  
                for (tmp = 0; tmp < columns.length - 1; tmp++) {
                  var name = columns[tmp][0];
  
                  if (
                    name !== undefined &&
                    name !== "x" &&
                    Array.isArray(columns[tmp])
                  ) {
                    var textTitles = columns[tmp].slice(1);
                    var convertedTextTitles = convertTextTitles(textTitles);
  
                    var trace = {
                      x: x,
                      y: columns[tmp].slice(1),
                      type: "scatter",
                      mode: labelsMode,
                      text: convertedTextTitles,
                      textposition: "top right",
                      hovertemplate: "%{y}<extra></extra>",
                      textfont: {
                        size: 14,
                      },
                      name: name,
                      width: 3,
                      line: {
                        shape: "spline",
                        width: setDefaultWidth(lineWidthsList[tmp]),
                        dash: lineTypesList[tmp],
                      },
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
                  textposition: "top right",
                  hovertemplate: "%{y}<extra></extra>",
                  textfont: {
                    size: 14,
                  },
                  type: "scatter",
                  //  TODO: this object currently has two properties
                  //  `name`. Check which one is the right one.
                  name: "Color",
                  line: {
                    shape: "spline",
                    width: setDefaultWidth(lineWidths),
                    dash: lineTypes,
                  },
                };
                data.push(trace);
              }
            }
  
            function dateWidthConvert(xValues, barWidth) {
              if (Array.from(xValues).every(i => (new Date(i) !== "Invalid Date") && !isNaN(new Date(i)))) {
                  // date bar widths must be in milliseconds
                  barWidth = (((barWidth || 0.5)*1000)*1000*3600*24);
              }
              return barWidth;
            }

            if (
              "bar" === this.options.chart_type ||
              "sbar" === this.options.chart_type
            ) {
              var categories = options.axis["x"]["categories"];
  
              if (categories === undefined) {
                if (
                  (Array.isArray(columns[columns.length - 1]) && options.axis["x"]) ||
                  "sbar" === this.options.chart_type
                ) {
                  var x = columns[columns.length - 1].slice(1);
                } else {
                  var x = columns[columns.length - 2].slice(1);
                }
                var tmp;
  
                if (columns.length == 1) {
                  var name = columns[0][0];
  
                  if (
                    name !== undefined &&
                    name !== "x" &&
                    Array.isArray(columns[0])
                  ) {
                    var trace = {
                      x: [this.options.x_axis],
                      y: x,
                      type: "bar",
                      name: name,
                      width: dateWidthConvert([this.options.x_axis], this.options.bar_width),
                      error_y: {},
                      error_x: {},
                    };
                    data.push(trace);
                  }
                } else if (
                  "sbar" === this.options.chart_type
                  && (this.options.category_name === '' || typeof this.options.category_name === 'boolean') 
                ) {
                  for (tmp = 0; tmp < columns.length; tmp++) {
                    var name = columns[tmp][0];
  
                    if (
                      name !== undefined &&
                      name !== "x" &&
                      Array.isArray(columns[tmp])
                    ) {
                      var trace = {
                        x: [this.options.x_axis],
                        y: [parseFloat(columns[tmp][1])],
                        type: "bar",
                        name: name,
                        width: dateWidthConvert([this.options.x_axis], this.options.bar_width),
                        error_y: {},
                        error_x: {},
                      };
                      data.push(trace);
                    }
                  }
                } else {
                  for (tmp = 0; tmp < columns.length - 1; tmp++) {
                    var name = columns[tmp][0];
  
                    if (
                      name !== undefined &&
                      name !== "x" &&
                      Array.isArray(columns[tmp])
                    ) {
                      var trace = {
                        x: x,
                        y: columns[tmp].slice(1),
                        type: "bar",
                        name: name,
                        width: dateWidthConvert(x, this.options.bar_width),
                        error_y: {},
                        error_x: {},
                      };
                      data.push(trace);
                    }
                  }
                }
              } else {
  
                var trace = {
                  x: categories,
                  y: columns[0].slice(1),
                  width: dateWidthConvert(categories, this.options.bar_width),
                  type: "bar",
                  name: "Color",
                  error_y: {},
                  error_x: {},
                };
                data.push(trace);
              }
            }
  
            if (
              "hbar" === this.options.chart_type ||
              "shbar" === this.options.chart_type
            ) {
              var categories = options.axis["x"]["categories"];
  
              if (categories === undefined) {
                if (
                  (Array.isArray(columns[columns.length - 1]) && options.axis["x"]) ||
                  "shbar" === this.options.chart_type
                ) {
                  var x = columns[columns.length - 1].slice(1);
                } else {
                  var x = columns[columns.length - 2].slice(1);
                }
                var tmp;
  
                if (columns.length == 1) {
                  var name = columns[0][0];
  
                  if (
                    name !== undefined &&
                    name !== "x" &&
                    Array.isArray(columns[0])
                  ) {
                    var trace = {
                      x: x,
                      y: [this.options.x_axis],
                      type: "bar",
                      name: name,
                      orientation: "h",
                      width: dateWidthConvert([this.options.x_axis], this.options.bar_width),
                    };
                    data.push(trace);
                  }
                } else if (
                  "shbar" === this.options.chart_type &&
                  this.options.category_name === ""
                ) {
                  for (tmp = 0; tmp < columns.length; tmp++) {
                    var name = columns[tmp][0];
  
                    if (
                      name !== undefined &&
                      name !== "x" &&
                      Array.isArray(columns[tmp])
                    ) {
                      var trace = {
                        x: [parseFloat(columns[tmp][1])],
                        y: [this.options.x_axis],
                        type: "bar",
                        name: name,
                        orientation: "h",
                        width: dateWidthConvert([this.options.x_axis], this.options.bar_width),
                      };
                      data.push(trace);
                    }
                  }
                } else {
                  for (tmp = 0; tmp < columns.length - 1; tmp++) {
                    var name = columns[tmp][0];
                    var x_values = [];
  
                    for (i = 0; i < columns[tmp].length - 1; i++) {
                      x_values.push(parseFloat(columns[tmp][i + 1]));
                    }
  
                    if (
                      name !== undefined &&
                      name !== "x" &&
                      Array.isArray(columns[tmp])
                    ) {
                      var trace = {
                        x: x_values,
                        y: x,
                        type: "bar",
                        name: name,
                        orientation: "h",
                        width: dateWidthConvert(x, this.options.bar_width),
                      };
                      data.push(trace);
                    }
                  }
                }
              } else {
                var trace = {
                  x: columns[0].slice(1),
                  y: categories,
                  type: "bar",
                  name: "Color",
                  orientation: "h",
                  width: dateWidthConvert(categories, this.options.bar_width),
                };
                data.push(trace);
              }
            }
  
            if ("area" === this.options.chart_type) {
              var categories = options.axis["x"]["categories"];
  
              if (categories === undefined) {
                if (Array.isArray(columns[columns.length - 1]) && options.axis["x"]) {
                  var x = columns[columns.length - 1].slice(1);
                } else {
                  var x = columns[columns.length - 2].slice(1);
                }
                var tmp;
  
                for (tmp = 0; tmp < columns.length - 1; tmp++) {
                  var name = columns[tmp][0];
  
                  if (
                    name !== undefined &&
                    name !== "x" &&
                    Array.isArray(columns[tmp])
                  ) {
                    var textTitles = columns[tmp].slice(1);
                    var convertedTextTitles = convertTextTitles(textTitles);
  
                    var trace = {
                      x: x,
                      y: columns[tmp].slice(1),
                      mode: labelsMode,
                      text: convertedTextTitles,
                      textposition: "top right",
                      hovertemplate: "%{y}<extra></extra>",
                      textfont: {
                        size: 14,
                      },
                      line: {
                        width: 4,
                      },
                      type: "scatter",
                      name: name,
                      fill: "tozeroy",
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
                  mode: labelsMode,
                  text: convertedTextTitles,
                  textposition: "top right",
                  hovertemplate: "%{y}<extra></extra>",
                  textfont: {
                    size: 14,
                  },
                  line: {
                    width: 4,
                  },
                  name: columns[0][0],
                  type: "scatter",
                  fill: "tozeroy",
                };
                data.push(trace);
              }
            }

            // Workaround for translations
            var lang = document.documentElement.getAttribute('lang');

            var i18n = {
                'en': {
                    'Solid': 'Solid',
                    'Dotted': 'Dotted',
                    'Dashed': 'Dashed',
                    'Dash Dot': 'Dash Dot',
                    'Regular': 'Regular',
                    'Slim': 'Slim',
                    'Wide': 'Wide'
                },
                'fr': {
                    'Solid': 'Solide',
                    'Dotted': 'Pointé',
                    'Dashed': 'Trait',
                    'Dash Dot': 'Trait et point',
                    'Regular': 'Réguliere',
                    'Slim': 'Mince',
                    'Wide': 'Large'
                },
                'es': {
                    'Solid': 'Sólido',
                    'Dotted': 'Punteado',
                    'Dashed': 'Rayado',
                    'Dash Dot': 'Rayado punto',
                    'Regular': 'Regular',
                    'Slim': 'Delgado',
                    'Wide': 'Ancho'
                },
                'km': {
                    'Solid': 'រឹង',
                    'Dotted': 'ចំនុចោះ',
                    'Dashed': 'ដាច់ៗ',
                    'Dash Dot': 'ដាច់ៗ ចំនុច',
                    'Regular': 'ទៀង​ទា​ត',
                    'Slim': 'ស្ដើង',
                    'Wide': 'ធំទូលាយ'
                },
                'pt_BR': {
                    'Solid': 'Sólida',
                    'Dotted': 'Pontilhada',
                    'Dashed': 'Hífen',
                    'Dash Dot': 'Linha e ponto',
                    'Regular': 'Regular',
                    'Slim': 'Fina',
                    'Wide': 'Larga'
                },
                'zh_CN': {
                    'Solid': '坚硬的',
                    'Dotted': '点缀',
                    'Dashed': '虚线',
                    'Dash Dot': '破折号',
                    'Regular': '常规的',
                    'Slim': '苗条的',
                    'Wide': '宽的'
                }
            };
  
            /**** Line TYpes [dotted,solid] *****/
            var item_exists = this.el.closest(".chart_field").attr("id");
  
            if (typeof item_exists !== "undefined" && item_exists !== null) {
              var item_no = this.el
                .closest(".chart_field")
                .attr("id")
                .split("_")
                .pop();
              var chart_plotly = document.getElementById(
                "chart_field_plotly_" + item_no
              );
  
              var len_data = data.length;
              var tmp;
              var data_tmp = data;
              var len_count = 1;
  
              for (tmp = len_data - 1; tmp >= 0; tmp--) {
                var color_count = 1;
                var d = data_tmp[tmp];
  
                var c = "chart_field_line_type_" + item_no + "_" + (tmp + 1);
                var lw = "chart_field_line_width_" + item_no + "_" + (tmp + 1);
                var chart_field_plotly_value = chart_plotly.value;
  
                // delete elements
                var p = document.querySelectorAll(
                  '[id^="chart_field_line_type_' + item_no + '"]'
                );
                var lwSel = document.querySelectorAll(
                  '[id^="chart_field_line_width_' + item_no + '"]'
                );
                var ltype_elements = 0;
                var lwidth_elements = 0;
  
                for (var a = 0; a < p.length; a++) {
                  var type = p[a].tagName;
                  if (type === "SELECT") {
                    ltype_elements = ltype_elements + 1;
                  }
                }
  
                if (ltype_elements > data.length) {
                  for (var a = 0; a < p.length; a++) {
                    var type = p[a].tagName;
                    if (type === "SELECT") {
                      p[a].parentElement.remove();
                    }
                  }
                }
  
                for (var a = 0; a < lwSel.length; a++) {
                  var type = lwSel[a].tagName;
                  if (type === "SELECT") {
                    lwidth_elements = lwidth_elements + 1;
                  }
                }
  
                if (lwidth_elements > data.length) {
                  for (var a = 0; a < lwSel.length; a++) {
                    var type = lwSel[a].tagName;
                    if (type === "SELECT") {
                      lwSel[a].parentElement.remove();
                    }
                  }
                }
  
                // add new html element
                var html_line_type = "solid";
                var html_line_width = "4";
  
                if (d.line) {
                  if (d.line.dash) {
                    html_line_type = d.line.dash;
                  }
                  if (d.line.width) {
                    html_line_width = String(d.line.width);
                  }
                }
  
                var elementExists = document.getElementById(c);
                if (elementExists) {
                  elementExists.parentElement.remove();
  
                  var newcontent = document.createElement("div");
                  var html = "";
                  html += '<div class="control-group control-select">';
                  html +=
                    '<label class="control-label line_type_label" for="chart_field_line_type_' +
                    item_no +
                    "_" +
                    (tmp + 1) +
                    '">' +
                    d["name"] +
                    "</label>&nbsp;";
                  html +=
                    '<select class="custom_chart_select" style="width:120px;" id="chart_field_line_type_' +
                    item_no +
                    "_" +
                    (tmp + 1) +
                    '" name="chart_field_line_type_' +
                    item_no +
                    "_" +
                    (tmp + 1) +
                    '" >';
  
                  if (html_line_type == "solid") {
                    html += '<option value="solid" selected>' + i18n[lang]['Solid'] + '</option>';
                  } else {
                    html += '<option value="solid">' + i18n[lang]['Solid'] + '</option>';
                  }
  
                  if (html_line_type == "dash") {
                    html += '<option value="dash" selected>' + i18n[lang]['Dashed'] + '</option>';
                  } else {
                    html += '<option value="dash">' + i18n[lang]['Dashed'] + '</option>';
                  }
  
                  if (html_line_type == "dashdot") {
                    html += '<option value="dashdot" selected>' + i18n[lang]['Dash Dot'] + '</option>';
                  } else {
                    html += '<option value="dashdot">' + i18n[lang]['Dash Dot'] + '</option>';
                  }
  
                  if (html_line_type == "dot") {
                    html += '<option value="dot" selected>' + i18n[lang]['Dotted'] + '</option>';
                  } else {
                    html += '<option value="dot">' + i18n[lang]['Dotted'] + '</option>';
                  }
  
                  html += "</select>";
  
                  //Line width
                  html +=
                    '<select class="custom_chart_select" style="width:120px;" id="chart_field_line_width_' +
                    item_no +
                    "_" +
                    (tmp + 1) +
                    '" name="chart_field_line_width_' +
                    item_no +
                    "_" +
                    (tmp + 1) +
                    '" >';
  
                  if (html_line_width == "2") {
                    html += '<option value="2" selected>' + i18n[lang]['Slim'] + '</option>';
                  } else {
                    html += '<option value="2">' + i18n[lang]['Slim'] + '</option>';
                  }
  
                  if (
                    html_line_width == "4" ||
                    !["2", "6"].includes(html_line_width)
                  ) {
                    html += '<option value="4" selected>' + i18n[lang]['Regular'] + '</option>';
                  } else {
                    html += '<option value="4">' + i18n[lang]['Regular'] + '</option>';
                  }
  
                  if (html_line_width == "6") {
                    html += '<option value="6" selected>' + i18n[lang]['Wide'] + '</option>';
                  } else {
                    html += '<option value="6">' + i18n[lang]['Wide'] + '</option>';
                  }
  
                  html += "</select>";
  
                  html += "</div>";
                  newcontent.innerHTML = html;
  
                  document
                    .getElementById("chart_field_plotly_line_" + item_no)
                    .insertAdjacentHTML("afterend", html);
      
                } else {
                  var newcontent = document.createElement("div");
                  var html = "";
                  html += '<div class="control-group control-select">';
                  html +=
                    '<label class="control-label" for=chart_field_line_type_' +
                    item_no +
                    "_" +
                    (tmp + 1) +
                    '">' +
                    d["name"] +
                    "</label>";
                  html +=
                    '<select id="chart_field_line_type_' +
                    item_no +
                    "_" +
                    (tmp + 1) +
                    '" name="chart_field_line_type_' +
                    item_no +
                    "_" +
                    (tmp + 1) +
                    '" >';
  
                  if (html_line_type == "solid") {
                    html += '<option value="solid" selected>' + i18n[lang]['Solid'] + '</option>';
                  } else {
                    html += '<option value="solid">' + i18n[lang]['Solid'] + '</option>';
                  }
  
                  if (html_line_type == "dash") {
                    html += '<option value="dash" selected>' + i18n[lang]['Dashed'] + '</option>';
                  } else {
                    html += '<option value="dash">' + i18n[lang]['Dashed'] + '</option>';
                  }
  
                  if (html_line_type == "dashdot") {
                    html += '<option value="dashdot" selected>' + i18n[lang]['Dash Dot'] + '</option>';
                  } else {
                    html += '<option value="dashdot">' + i18n[lang]['Dash Dot'] + '</option>';
                  }
  
                  if (html_line_type == "dot") {
                    html += '<option value="dot" selected>' + i18n[lang]['Dotted'] + '</option>';
                  } else {
                    html += '<option value="dot">' + i18n[lang]['Dotted'] + '</option>';
                  }
  
                  html += "</select>";
  
                  //Line width
                  html +=
                    '<select class="custom_chart_select" id="chart_field_line_width_' +
                    item_no +
                    "_" +
                    (tmp + 1) +
                    '" name="chart_field_line_width_' +
                    item_no +
                    "_" +
                    (tmp + 1) +
                    '" >';
  
                  if (html_line_width == "2") {
                    html += '<option value="2" selected>' + i18n[lang]['Slim'] + '</option>';
                  } else {
                    html += '<option value="2">' + i18n[lang]['Slim'] + '</option>';
                  }
  
                  if (
                    html_line_width == "4" ||
                    !["2", "6"].includes(html_line_width)
                  ) {
                    html += '<option value="4" selected>' + i18n[lang]['Regular'] + '</option>';
                  } else {
                    html += '<option value="4">' + i18n[lang]['Regular'] + '</option>';
                  }
  
                  if (html_line_width == "6") {
                    html += '<option value="6" selected>' + i18n[lang]['Wide'] + '</option>';
                  } else {
                    html += '<option value="6">' + i18n[lang]['Wide'] + '</option>';
                  }
  
                  html += "</select>";
  
                  html += "</div>";
                  newcontent.innerHTML = html;
  
                  document
                    .getElementById("chart_field_plotly_line_" + item_no)
                    .insertAdjacentHTML("afterend", html);
 
                }
              }
            }
  
            if (typeof plotly === "string" || plotly === true) {
              var item_exists = this.el.closest(".chart_field").attr("id");
  
              if (typeof item_exists !== "undefined" && item_exists !== null) {
                var item_no = this.el
                  .closest(".chart_field")
                  .attr("id")
                  .split("_")
                  .pop();

                var chart_plotly = document.getElementById(
                  "chart_field_plotly_" + item_no
                );

                const chartType = this.options.chart_type;

                var len_data;
                var tmp, i;
                var data_tmp = data;

                if(['pie', 'donut'].includes(chartType)) {
                  len_data = data[0].labels.length;
                } else {
                  len_data = data.length;
                }

                const chart_field_plotly_value = chart_plotly.value;

                const colors = [];
                const defaultColor = "#8fbc8f";

                //  Get current colors
                for (i = 0; i < len_data; i++) {
                  //  If Plotly object exists, get the value of the color input
                  if (chart_field_plotly_value) {
                    const colorInputName =
                      "chart_field_color_" + item_no + "_" + (i + 1);
                    const colorInput = document.querySelectorAll(
                      "[name=" + colorInputName + "]"
                    );

                    let color;

                    if (colorInput.length > 0) {
                      color = colorInput[0].value;
                    } else {
                      color = defaultColor;
                    }

                    colors.push(color);
                  } else {
                    colors.push(defaultColor);
                  }
                }

                //  Delete color inputs
                //  Keep previous inputs if current amount of
                //  colors is greater than the previous one
                var colorInputs = $(
                  `input[id^="chart_field_color_${item_no}"]`
                );

                if (colorInputs.length > len_data) {
                  colorInputs.parent().remove();
                }

                for (tmp = 0; tmp < len_data; tmp++) {
                  let label;
                  
                  if (["pie", "donut"].includes(chartType)) {
                    label = data[0].labels[tmp];
                    
                    //  Not an issue but this could run only once
                    //  Actually apply colors
                    data[0].marker = { colors };

                  } else {
                    var d = data_tmp[tmp];
                    label = d["name"];

                    //  Actually apply colors
                    d.marker = {
                      color: colors[tmp],
                    };
                  }

                  //  Get color input
                  var colorInputSelector = "#chart_field_color_" + item_no + "_" + (tmp + 1);
                  var colorInput = $(colorInputSelector);

                  //  If given color input already exists, delete it
                  if (colorInput) {
                    colorInput.parent().remove();
                  }

                  //  Create new color input
                  var newColorInputEl = document.createElement("div");

                  //  Create HTML for the new color input
                  var html = 
                    `
                    <div class="control-group control-select">
                      <label 
                        class="control-label" 
                        for="chart_field_color_${item_no}_${tmp + 1}"
                      >
                        ${label}
                      </label>
                      <input 
                        type="color" 
                        id="chart_field_color_${item_no}_${tmp + 1}"
                        name="chart_field_color_${item_no}_${tmp + 1}"
                        class="colorpicker" 
                        value="${colors[tmp]}"
                      />
                    </div>
                    `
                  newColorInputEl.innerHTML = html;

                  //  Add new color input to settings
                  document
                    .getElementById("chart_field_plotly_" + item_no)
                    .insertAdjacentHTML("afterend", html);

                  //  Remove color element
                  //  Possibly not necessary
                  var elem = document.querySelector("#init_color");
                  if (elem) {
                    elem.parentNode.removeChild(elem);
                  }
                  
                }

                data = data_tmp;

                var item_no = this.el
                  .closest(".chart_field")
                  .attr("id")
                  .split("_")
                  .pop();
                var chart_plotly = document.getElementById(
                  "chart_field_plotly_" + item_no
                );

                if (
                  typeof chart_plotly != "undefined" &&
                  chart_plotly != null
                ) {
                  document.getElementById(
                    "chart_field_plotly_" + item_no
                  ).value = JSON.stringify(data);
                }
              }
            } else {
              var item_exists = this.el.closest(".chart_field").attr("id");
  
              if (typeof item_exists !== "undefined" && item_exists !== null) {
                var item_no = this.el
                  .closest(".chart_field")
                  .attr("id")
                  .split("_")
                  .pop();
                var chart_plotly = document.getElementById(
                  "chart_field_plotly_" + item_no
                );
                if (typeof chart_plotly != "undefined" && chart_plotly != null) {
                  document.getElementById("chart_field_plotly_" + item_no).value =
                    JSON.stringify(plotly);
                }
              }
            }
  
            var title_id = this.el.context.parentElement.children[0].id;
  
            if (this.el.context.parentElement.querySelector(".additional_desc")) {
              var desc_id =
                this.el.context.parentElement.querySelector(
                  ".additional_desc"
                ).id;
              if (desc_id) {
                var converter = new showdown.Converter();
                var convertedDesc = converter.makeHtml(desc);
                document.getElementById(desc_id).innerHTML = convertedDesc;
                document.getElementById(desc_id).style.display = "block";
              }
            }
  
            if (title_id) {
              document.getElementById(title_id).innerHTML = titleVal;
              document.getElementById(title_id).style.display = "block";
            }
  
            //Hide loading text
            if (document.getElementById("loading-" + this.options.chart_id)) {
              document.getElementById(
                "loading-" + this.options.chart_id
              ).style.display = "none";
            }
  
            var q = JSON.parse(JSON.stringify(plotly));
  
            if (typeof plotly === "object") {
              for (const [key, value] of Object.entries(data)) {
                if (q[key]) {
                  value.marker = q[key].marker;
                }
              }
            }
  
            if (this.options.x_text_rotate == 30) {
              this.options.x_text_rotate = 45;
            }
  
            if (this.options.y_text_rotate == 30) {
              this.options.y_text_rotate = 45;
            }

            let sortedArr = [];

            if(
                x_sort_labels === true 
                //  Does not work for `donut` and `pie`
                //  charts
                && !['donut', 'pie'].includes(this.options.chart_type)
            ) {
                //  If an index is found at the start
                //  of the string, replace it.
                let sliceIfIndex = (label) => {
                    return label.replace(/^\d+\./, '');
                }

                let dateSortFn = (a, b) => {
                    //  Not sure if it should slice
                    //  dates too
                    a = sliceIfIndex(a.label).trim();
                    b = sliceIfIndex(b.label).trim();

                    return new Date(a) - new Date(b);
                }

                let stringSortFn = (a, b) => {
                    a = sliceIfIndex(a.label).trim();
                    b = sliceIfIndex(b.label).trim();

                    return a.localeCompare(b);
                }

                //  Must sort for all data entries, otherwise
                //  line charts with multiple lines  won't be
                //  correctly sorted
                data.forEach((data_el, idx) => {
                    //  x and y are switched for horizontal bar
                    //  and stacked horizontal bar
                    let labeled_data = [];

                    let tmp_x, tmp_y;

                    if(!['hbar', 'shbar'].includes((this.options.chart_type))) {
                        tmp_x = data[idx].x;
                        tmp_y = data[idx].y;
                    } else {
                        tmp_x = data[idx].y;
                        tmp_y = data[idx].x;
                    }

                    //  Populates `labeled_data`
                    data[idx].x.forEach((_, i) => {
                        labeled_data.push({
                            //  Slice to get rid of the index at the
                            //  start of the string
                            label: tmp_x[i],
                            value: tmp_y[i]
                        })
                    })

                    let sortFn = isNaN(Date.parse(data[idx].x[0])) ? stringSortFn : dateSortFn;
                    labeled_data.sort(sortFn)

                    let sorted_labels = labeled_data.map(val => val.label);
                    let sorted_data = labeled_data.map(val => val.value);


                    sortedArr = sorted_labels;

                    if(!['hbar', 'shbar'].includes((this.options.chart_type))) {
                        data[idx].x = sorted_labels;
                        data[idx].y = sorted_data;
                    }
                    else {
                        data[idx].y = sorted_labels;
                        data[idx].x = sorted_data;
                    }

                })

            } else {
                sortedArr = data[0].x
            }

            let legend_title_text = '';
            if(show_legend_title && show_legend) {
              let default_title = this.options.x_axis;
              if(custom_legend_title && typeof custom_legend_title === 'string') 
                legend_title_text = custom_legend_title 
              else 
                legend_title_text = default_title;
            }

            const chartType = this.options.chart_type;
            if(!['donut', 'pie'].includes(chartType)) {
              const dateSymbols = ['%Y', '%d', '%m', '%y', '%b', '%d'];

              //  Check if format is a date
              if(dateSymbols.some(f => x_tick_format.includes(f))) {
                //  If horizontal chart, swap axis
                //  TODO: check if this makes sense
                let tmpData = !['hbar', 'shbar'].includes(chartType) ? data[0].x : data[0].y;
                let sample = tmpData[0];

                const is4DigitN = (val) => {
                  return typeof val === 'number' 
                    && val >= 1000 
                    && val <= 9999;
                }

                //  In case the data is being passed
                //  as `yyyy`, which means it's just
                //  the same as an 4 digit integer
                if(is4DigitN(sample) || is4DigitN(parseInt(sample))) {
                  //  Transforms string to Date and then back to
                  //  `yyyy-mm-dd` date string
                  const strToDateStr = (str) => {
                    return new Date(`${str}`).toISOString().split('T')[0];
                  }

                  tmpData.forEach((val, i) => tmpData[i] = strToDateStr(val));
                }
              }
            }

            var base_info = {
              margin: {
                l: 20,
                r: 20,
                b: 20,
                t: 30,
                pad: 5,
              },
              title: titleVal,
              showlegend: show_legend, //show legend value
              legend: { 
                xanchor: "left", 
                x: -0.02, 
                y: -0.27, 
                orientation: "h", 
                title: { 
                  text: legend_title_text, 
                  side: "top", 
                  //  Reference: https://plotly.com/javascript/reference/layout/#layout-legend
                  font: {
                    size: 15
                  }
                } 
              },
              xaxis: {
                tickformat: x_tick_format,
                automargin: true,
                title: "",
                tickangle: this.options.x_text_rotate,
                tickmode: "auto",
                nticks: this.options.x_tick_culling_max,
                tickfont: {
                  size: 14,
                },
                categoryorder: "array",
                categoryarray: sortedArr
              },
              yaxis: {
                tickformat: y_tick_format,
                automargin: true,
                hoverformat: format,
                tickangle: this.options.y_text_rotate,
                tickfont: {
                  size: 14,
                },
              },
              hovermode: "closest",
            };
  
            if (["sbar", "shbar"].includes(this.options.chart_type)) {
              base_info.barmode = "stack";
            }
  
            if (!["donut", "pie"].includes(this.options.chart_type)) {
              const formatter = d3.format(format);
  
              if (!base_info.shapes) {
                base_info.shapes = [];
              }
              if (!base_info.annotations) {
                base_info.annotations = [];
              }
  
              var dynamic_ref_hovertext =
                this.dynamic_reference_value !== null
                  ? formatter(this.dynamic_reference_value)
                  : this.dynamic_reference_value;
              var static_ref_hovertext =
                this.static_reference_value !== null
                  ? formatter(this.static_reference_value)
                  : this.static_reference_value;
              var dynamic_ref_text = `<b>${
                typeof this.options.dynamic_reference_label === "boolean" ||
                this.options.dynamic_reference_label.length === 0
                  ? this.options.dynamic_reference_type
                  : this.options.dynamic_reference_label
              }</b>`;
              var static_ref_text = `<b>${
                typeof this.options.static_reference_label === "boolean" ||
                this.options.static_reference_label.length === 0
                  ? "Reference"
                  : this.options.static_reference_label
              }</b>`;
  
              if (["hbar", "shbar"].includes(this.options.chart_type)) {
                if (dynamic_ref_hovertext) {
                  base_info.annotations.push({
                    showarrow: false,
                    yref: "paper",
                    text: dynamic_ref_text,
                    hovertext: dynamic_ref_hovertext,
                    bgcolor: "rgb(255,255,255)",
                    x: this.dynamic_reference_value,
                    xanchor: "left",
                    y: 0,
                  });
                  addShapes.call(this, "dynamic");
                }
                if (static_ref_hovertext) {
                  base_info.annotations.push({
                    showarrow: false,
                    yref: "paper",
                    text: static_ref_text,
                    hovertext: static_ref_hovertext,
                    bgcolor: "rgb(255,255,255)",
                    x: this.static_reference_value,
                    xanchor: "left",
                    y: 0,
                  });
                  addShapes.call(this, "static");
                }
                function addShapes(reference_type) {
                  if (reference_type === "dynamic") {
                    base_info.shapes.push({
                      type: "line",
                      yref: "paper",
                      x0: this.dynamic_reference_value,
                      y0: 1,
                      x1: this.dynamic_reference_value,
                      y1: 0,
                      line: {
                        color: "black",
                        width: 1,
                      },
                    });
                  } else {
                    base_info.shapes.push({
                      type: "line",
                      yref: "paper",
                      x0: this.static_reference_value,
                      y0: 1,
                      x1: this.static_reference_value,
                      y1: 0,
                      line: {
                        color: "black",
                        width: 1,
                      },
                    });
                  }
                }
              } else {
                if (dynamic_ref_hovertext) {
                  base_info.annotations.push({
                    showarrow: false,
                    xref: "paper",
                    text: dynamic_ref_text,
                    hovertext: dynamic_ref_hovertext,
                    bgcolor: "rgb(255,255,255)",
                    x: 0,
                    yanchor: "bottom",
                    y: this.dynamic_reference_value,
                  });
                  addShapes.call(this, "dynamic");
                }
                if (static_ref_hovertext) {
                  base_info.annotations.push({
                    showarrow: false,
                    xref: "paper",
                    text: static_ref_text,
                    hovertext: static_ref_hovertext,
                    bgcolor: "rgb(255,255,255)",
                    x: 0,
                    yanchor: "bottom",
                    y: this.static_reference_value,
                  });
                  addShapes.call(this, "static");
                }
                function addShapes(reference_type) {
                  if (reference_type === "dynamic") {
                    base_info.shapes.push({
                      type: "line",
                      xref: "paper",
                      x0: 0,
                      y0: this.dynamic_reference_value,
                      x1: 1,
                      y1: this.dynamic_reference_value,
                      line: {
                        color: "black",
                        width: 1,
                      },
                    });
                  } else {
                    base_info.shapes.push({
                      type: "line",
                      xref: "paper",
                      x0: 0,
                      y0: this.static_reference_value,
                      x1: 1,
                      y1: this.static_reference_value,
                      line: {
                        color: "black",
                        width: 1,
                      },
                    });
                  }
                }
              }
            }
  
            if (this.options.y_label_hide === false) {
              base_info.yaxis.title = y_label || this.options.y_axis;
            }
  
            if (this.options.x_label_hide === false) {
              base_info.xaxis.title = x_label || this.options.x_axis;
            }
  
            if (this.options.y_from_zero === true) {
              base_info.yaxis.rangemode = "tozero";
            }
  
            if (this.options.x_from_zero === true) {
              base_info.xaxis.rangemode = "tozero";
            }
  
            if (
              this.options.axis_range === true &&
              !["sbar", "shbar", "pie", "donut"].includes(this.options.chart_type)
            ) {
              if ("hbar" == this.options.chart_type) {
                if ([".0%", ".1%", ".2%"].includes(this.options.x_tick_format)) {
                  base_info.xaxis.range = [
                    this.options.axis_min / 100,
                    this.options.axis_max / 100,
                  ];
                } else {
                  base_info.xaxis.range = [
                    this.options.axis_min,
                    this.options.axis_max,
                  ];
                }
              } else {
                if ([".0%", ".1%", ".2%"].includes(this.options.y_tick_format)) {
                  base_info.yaxis.range = [
                    this.options.axis_min / 100,
                    this.options.axis_max / 100,
                  ];
                } else {
                  base_info.yaxis.range = [
                    this.options.axis_min,
                    this.options.axis_max,
                  ];
                }
              }
            }
  
            //Experimental: Remove Numbers from the items 1. , 2. etc
            if (data) {
              if ("hbar" === this.options.chart_type) {
                data.forEach(function (record) {
                  var subData = record.y;
  
                  if (subData && subData.length > 0) {
                    subData.forEach(function (item, index) {
                      if (typeof item !== "number" && item !== null) {
                        item = item.replace(/^\d{1,2}\./, "");
                        record.y[index] = item;
                      }
                    });
                  }
                });
              } else {
                data.forEach(function (record) {
                  var subData = record.x;
  
                  if (subData && subData.length > 0) {
                    subData.forEach(function (item, index) {
                      if (typeof item !== "number" && item !== null) {
                        item = item.replace(/^\d{1,2}\./, "");
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
                result[i] = Math.round(
                  result[i] + factor * (color2[i] - color1[i])
                );
              }
              return result;
            }
  
            // My function to interpolate between two colors completely, returning an array
            function interpolateColors(color1, color2, steps) {
              var stepFactor = 1 / (steps - 1),
                interpolatedColorArray = [];
  
              color1 = color1.match(/\d+/g).map(Number);
              color2 = color2.match(/\d+/g).map(Number);
  
              for (var i = 0; i < steps; i++) {
                var color_ = interpolateColor(color1, color2, stepFactor * i);
  
                var new_color_ =
                  "rgba(" + color_[0] + "," + color_[1] + "," + color_[2] + ",1)";
                interpolatedColorArray.push(new_color_);
              }
  
              return interpolatedColorArray;
            }
  
            function hexToRgb(hex) {
              var arrBuff = new ArrayBuffer(4);
              var vw = new DataView(arrBuff);
              hex = hex.replace(/[^0-9A-F]/gi, "");
              vw.setUint32(0, parseInt(hex, 16), false);
              var arrByte = new Uint8Array(arrBuff);
  
              return arrByte[1] + "," + arrByte[2] + "," + arrByte[3];
            }
  
            var colorpicker_selection = document.getElementById("color_type");
  
            if (
              this.options.color_type == 2 || //  Is sequential
              (colorpicker_selection !== null &&
                [null, "2"].includes(colorpicker_selection.value)) 
            ) {
              var steps = 0;
              var base_sequential_colors = this.options.seq_color.split(",");

              //  Find the max amount of data points
              for (i = 0; i < data.length; i++) {
                if (["scatter"].includes(this.options.chart_type)) {
                  steps = Math.max(steps, data[i].y.length);
                } else {
                  if (["donut", "pie"].includes(this.options.chart_type)) {
                    steps = Math.max(steps, data[i].labels.length);
                  } else {
                    steps = Math.max(steps, data[i].x.length);
                  }
                }
              }

              //  Mutiply it by the length of the data array
              if (!["donut", "pie"].includes(this.options.chart_type)) {
                steps = steps * data.length;
              }

              //  If data is `grouped` (category is set)
              if (
                data.length > 1 ||
                ["donut", "pie"].includes(this.options.chart_type)
              ) {

                let dataLength;
                if (["donut", "pie"].includes(this.options.chart_type)) {
                  dataLength = data[0].labels.length;

                  //  So that steps is at least 2
                  if (dataLength < 2) dataLength = 2;
                } else {
                  dataLength = data.length;
                }

                var sequential_colors = interpolateColors(
                  hexToRgb(base_sequential_colors[0]),
                  hexToRgb(base_sequential_colors[1]),
                  dataLength
                );

                if (["donut", "pie"].includes(this.options.chart_type)) {

                  //  Values and labels have to be manually  sorted
                  //  so that we can ensure the order of the colors
                  //  is right
                  //  Without this, sections with equal values  may
                  //  end up with colors swapped
                  data[0].sort = false;

                  const values = data[0].values.map((v, i) => ({
                    value: v,
                    label: data[0].labels[i],
                  }));

                  values.sort((a, b) => {
                    return b.value - a.value
                  });


                  data[0].values = values.map(i => i.value);
                  data[0].labels = values.map(i => i.label);

                  data[0].marker = {
                    colors: sequential_colors.reverse(),
                  };

                } else {
                  for (i = 0; i < dataLength; i++) {
                    data[i].marker = {
                      color: sequential_colors[i],
                    };
                  }
                }
              } else {
                //  Generate color steps between the two colors
                var sequential_colors = interpolateColors(
                  hexToRgb(base_sequential_colors[0]),
                  hexToRgb(base_sequential_colors[1]),
                  steps
                );
                var sequential_colors_section = [];

                for (
                  j = 0;
                  j < sequential_colors.length;
                  j++
                ) {
                  sequential_colors_section.push(sequential_colors[j]);
                }

                if (
                  !"rgba(NaN,NaN,NaN,1)".includes(sequential_colors_section[0])
                ) {
                  data[0].marker = {
                    color: sequential_colors_section,
                  };
                } else {
                  data[0].marker = {
                    color: interpolateColors(
                      hexToRgb(base_sequential_colors[0]),
                      hexToRgb(base_sequential_colors[1]),
                      2
                    ),
                  };
                }
              }
            }
  
            //Showing Annotations on bars
            if (
              "bar" === this.options.chart_type ||
              "sbar" === this.options.chart_type
            ) {
              //Temporarily disabling annotations on bars with categories
              if (data.length > 1) {
                show_annotations = false;
              }
              if (show_annotations == true) {
                var stacked_total = 0;
  
                for (var i = 0; i < data.length; i++) {
                  for (var j = 0; j < data[i].x.length; j++) {
                    if ("sbar" === this.options.chart_type) {
                      stacked_total = stacked_total + data[i].y[j];
                    } else {
                      stacked_total = data[i].y[j];
                    }
  
                    var anoData = {
                      x: data[i].x[j],
                      y: stacked_total,
                      text: dataLabelFormatter(data[i].y[j]),
                      hovertemplate: "%{y}<extra></extra>",
                      xanchor: "center",
                      yanchor: "bottom",
                      showarrow: false,
                    };
  
                    base_info.annotations.push(anoData);
                  }
                }
              }
            }
            if (
              "hbar" === this.options.chart_type ||
              "shbar" === this.options.chart_type
            ) {
              //Temporarily disabling annotations on bars with categories
              if (data.length > 1) {
                show_annotations = false;
              }
              if (show_annotations == true) {
                var stacked_total = 0;
  
                for (var i = 0; i < data.length; i++) {
                  for (var j = 0; j < data[i].x.length; j++) {
                    if ("shbar" === this.options.chart_type) {
                      stacked_total = stacked_total + data[i].x[j];
                    } else {
                      stacked_total = data[i].x[j];
                    }
  
                    var anoData = {
                      x: stacked_total,
                      y: data[i].y[j],
                      text: dataLabelFormatter(data[i].x[j]),
                      hovertemplate: "%{y}<extra></extra>",
                      xanchor: "left",
                      yanchor: "center",
                      showarrow: false,
                    };
  
                    base_info.annotations.push(anoData);
                  }
                }
              }
            }
  
            var isErrorIntervals = show_bounds;
  
            if (
              isErrorIntervals === true &&
              typeof upper_bounds !== "boolean" &&
              typeof lower_bounds !== "boolean" &&
              upper_bounds !== "" &&
              lower_bounds !== ""
            ) {
              if (options.axis && options.axis["x"]["categories"]) {
                const lower = data.map((x) => {
                  return Math.round(
                    //  TODO: check if this x is defined
                    Math.abs(x[this.options.y_axis.toLowerCase()] - x[lower_bounds])
                  );
                });
                const upper = data.map((x) => {
                  return Math.round(
                    Math.abs(x[this.options.y_axis.toLowerCase()] - x[upper_bounds])
                  );
                });
  
                var arrayplus = upper;
                var arrayminus = lower;
  
                if (
                  "scatter" === this.options.chart_type ||
                  "line" === this.options.chart_type ||
                  "spline" === this.options.chart_type ||
                  "area" === this.options.chart_type
                ) {
                  //Add Error Intervals
                  var error = {
                    type: "data",
                    symmetric: false,
                    array: arrayplus,
                    arrayminus: arrayminus,
                    color: "#000000",
                  };
  
                  data[0].error_y = error;
                }
  
                if (
                  "bar" === this.options.chart_type ||
                  "sbar" === this.options.chart_type ||
                  "hbar" === this.options.chart_type ||
                  "shbar" === this.options.chart_type
                ) {
                  //Add Error Intervals
                  var error = {
                    type: "data",
                    symmetric: false,
                    array: arrayplus,
                    arrayminus: arrayminus,
                    color: "#000000",
                  };
  
                  if (
                    "hbar" === this.options.chart_type ||
                    "shbar" === this.options.chart_type
                  ) {
                    data[0].error_x = error;
                  } else {
                    data[0].error_y = error;
                  }
                }
              }
              if (options.axis && !options.axis["x"]["categories"] && data[upper_bounds] && data[lower_bounds]) {
                for (var i = 0; i < data.length; i++) {
                  if (data[upper_bounds][data[i].name] !== undefined) {
                    var category_keys = [];
                    var upper = [];
                    var lower = [];
  
                    for (var j = 1; j < data[data[i].name].length; j++) {
                      upper.push(
                        Math.round(
                          Math.abs(
                            data[data[i].name][j] - data[upper_bounds][data[i].name][j - 1]
                          )
                        )
                      );
                      lower.push(
                        Math.round(
                          Math.abs(
                            data[data[i].name][j] - data[lower_bounds][data[i].name][j - 1]
                          )
                        )
                      );
                    }
  
                    category_keys.push(data[i].name);
  
                    var arrayplus = upper;
                    var arrayminus = lower;
  
                    if (
                      "scatter" === this.options.chart_type ||
                      "line" === this.options.chart_type ||
                      "spline" === this.options.chart_type ||
                      "area" === this.options.chart_type
                    ) {
                      //Add Error Intervals
                      var error = {
                        type: "data",
                        symmetric: false,
                        array: arrayplus,
                        arrayminus: arrayminus,
                        color: "#000000",
                        visible: true,
                      };
  
                      data[i].error_y = error;
                    }
  
                    if (
                      "bar" === this.options.chart_type ||
                      "hbar" === this.options.chart_type
                    ) {
                      //Add Error Intervals
                      var error = {
                        type: "data",
                        symmetric: false,
                        array: arrayplus,
                        arrayminus: arrayminus,
                        color: "#000000",
                        visible: true,
                      };
  
                      if ("hbar" === this.options.chart_type) {
                        data[i].error_x = error;
                      } else {
                        data[i].error_y = error;
                      }
                    }
                  }
                }
              }
            }
  
            //console.log("Generate plotly");
            //console.log(data)
  
            function saveAs(uri, filename) {
              var link = document.createElement("a");
              if (typeof link.download === "string") {
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
                  name: "Screenshot",
                  icon: Plotly.Icons.camera,
                  direction: "up",
                  id: "chart-" + this.options.chart_id,
                  click: function (gd) {
                    //var xid = this.closest(".item")
                    //console.log(this.id);
                    var chartId = "." + this.id;
                    //console.log('hi'); console.log(gd); alert('button1')
                    setTimeout(function () {
                      html2canvas(document.querySelector(chartId)).then(function (
                        canvas
                      ) {
                        saveAs(canvas.toDataURL(), "report.png");
                      });
                    }, 100);
                  },
                },
              ],
              modeBarButtonsToRemove: ["toImage"],
            };
  
            //  Use Prism color palette
            //  See: https://plotly.com/python/discrete-color/#color-sequences-in-plotly-express
            base_info.colorway = [
              "rgb(95, 70, 144)",
              "rgb(29, 105, 150)",
              "rgb(56, 166, 165)",
              "rgb(15, 133, 84)",
              "rgb(115, 175, 72)",
              "rgb(237, 173, 8)",
              "rgb(225, 124, 5)",
              "rgb(204, 80, 62)",
              "rgb(148, 52, 110)",
              "rgb(111, 64, 112)",
              "rgb(102, 102, 102)",
            ]

            Plotly.newPlot(this.el[0], data, base_info, config);

        },
        // Get the values from dropdowns and rerender the chart.
        updateChart: function() {
            var chartField = this.el.closest('.chart_field');

            var chartTypeSelect = chartField.find('[name*=chart_field_graph_]');
            var chartTypeValue = chartTypeSelect.val();

            var chartFieldSeqColor = chartField.find("[name*=chart_field_seq_color_]").val();    //  NOTE: mapped to nn
            var chartFieldColorType = chartField.find("[name*=chart_field_color_type_]").val();  //  NOTE: mapped to nnn

            var colorSelect = chartField.find('[name*=chart_field_color_]');
            var colorValue = colorSelect.val();

            var chartPaddingLeft = chartField.find('input[name*=chart_field_chart_padding_left_]');
            var chartPaddingLeftVal = chartPaddingLeft.val();

            var chartPaddingBottom = chartField.find('input[name*=chart_field_chart_padding_bottom_]');
            var chartPaddingBottomVal = chartPaddingBottom.val();

            var axisXSelect = chartField.find('[name*=chart_field_axis_x_]');
            var axisXValue = axisXSelect.val();

            var axisYSelect = chartField.find('[name*=chart_field_axis_y_]');
            var axisYValue = axisYSelect.val();

            var chartTitle = chartField.find('textarea[name*=chart_field_title_]');
            var chartTitleVal = chartTitle.val();

            var legend = chartField.find('input[name*=chart_field_legend_]');
            var legendVal = legend.is(':checked');

            var legendTitleCkb = chartField.find('input[name*=chart_field_leg_title_]');
            var legendTitleCkbVal = legendTitleCkb.is(':checked');

            var legendTitle = chartField.find('input[name*=custom_legend_title_]');
            var legendTitleVal = legendTitle.val();

            var xTextRotate = chartField.find('[name*=chart_field_x_text_rotate_]');
            var xTextRotateVal = xTextRotate.val();

            var xTextMultiline = chartField.find('[name*=chart_field_x_text_multiline_]');
            var xTextMultilineVal = xTextMultiline.is(':checked');

            var chartFieldShowAnnotations = chartField.find("input[name*=chart_field_show_annotations_]").is(":checked");  //  NOTE: mapped to sa

            var xTickCullingMax = chartField.find('[name*=chart_field_x_tick_culling_max_]');
            var xTickCullingMaxVal = xTickCullingMax.val();

            var tooltipName = chartField.find('input[name*=chart_field_tooltip_name_]');
            var tooltipNameVal = tooltipName.val();

            var dataFormat = chartField.find('[name*=chart_field_data_format_]');
            var dataFormatVal = dataFormat.val();

            var yTickFormat = chartField.find('[name*=chart_field_y_ticks_format_]');
            var yTickFormatVal = yTickFormat.val();

            var xTickFormatVal = chartField.find("[name*=chart_field_x_ticks_format_]").val();   //  NOTE: mapped to xf

            var paddingTop = chartField.find('input[name*=chart_field_padding_top_]');
            var paddingTopVal = paddingTop.val();

            var paddingBottom = chartField.find('input[name*=chart_field_padding_bottom_]');
            var paddingBottomVal = paddingBottom.val();

            var tickCount = chartField.find('input[name*=chart_field_tick_count_]');
            var tickCountVal = tickCount.val();

            var filterName = chartField.find('[name*=chart_field_filter_name_]');
            var filterNameVal = filterName.val();

            var filterValue = chartField.find('[name*=chart_field_filter_value_]');
            var filterValueVal = filterValue.val();

            var categoryName = chartField.find('[name*=chart_field_category_name_]');
            var categoryNameVal = categoryName.val();

            var sortOpt = chartField.find('select[name*=chart_field_sort_]');
            var sortVal = sortOpt.val();

            var dataLabels = chartField.find('input[name*=chart_field_labels_]');
            var dataLabelsVal = dataLabels.is(':checked');

            var yLabbel = chartField.find('textarea[name*=chart_field_y_label_]');
            var yLabbelVal = yLabbel.val();

            var yLabelHide = chartField.find('input[name*=chart_field_y_label_hide_]');
            var yLabelHideVal = yLabelHide.is(':checked');

            var xLabelVal = chartField.find("textarea[name*=chart_field_x_label_]").val(); //  NOTE: mapped to xl
            var xLabelHideVal = chartField.find("input[name*=chart_field_x_label_hide_]").is(":checked");  //  NOTE: mapped to xlh

            var yFromZero = chartField.find('input[name*=chart_field_y_from_zero_]');
            var yFromZeroVal = yFromZero.is(':checked');

            var axisRange = chartField.find("input[name*=chart_field_axis_range_]").is(":checked"); //  NOTE: mapped to yp
            var xFromZeroVal = chartField.find("input[name*=chart_field_x_from_zero_]").is(":checked");   //  NOTE: mapped to xfz

            var staticReferenceColumns = chartField.find('select[name*=chart_field_static_reference_columns_]');
            var staticReferenceColumnsVal = staticReferenceColumns.val();

            var staticReferenceLabel = chartField.find('input[name*=chart_field_static_reference_label_]');
            var staticReferenceLabelVal = staticReferenceLabel.val();

            var upperBounds = chartField.find("[name*=chart_field_upper_bounds_]").val(); //  NOTE: mapped to ub
            var lowerBounds = chartField.find("[name*=chart_field_lower_bounds_]").val(); //  NOTE: mapped to lb
            var axisMin = chartField.find("[name*=chart_field_axis_min_]").val(); //    NOTE: mapped to amin
            var axisMax = chartField.find("[name*=chart_field_axis_max_]").val(); //    NOTE: mapped to amax
            var showBounds = chartField.find("input[name*=chart_field_show_bounds_]").is(":checked");  //  NOTE: mapped to bnds

            var dynamicReferenceType = chartField.find('select[name*=chart_field_dynamic_reference_type_]');
            var dynamicReferenceTypeVal = dynamicReferenceType.val();

            var dynamicReferenceFactor = chartField.find('input[name*=chart_field_dynamic_reference_factor_]');
            var dynamicReferenceFactorVal = dynamicReferenceFactor.val();

            var dynamicReferenceLabel = chartField.find('input[name*=chart_field_dynamic_reference_label_]');
            var dynamicReferenceLabelVal = dynamicReferenceLabel.val();

            var x_sort_labels = chartField.find("input[name*=chart_field_x_sort_labels_]").is(":checked");

            var measureLabelVal = $('#choose_y_axis_column option:selected').text();

            var showLabelsAsPercentages = chartField.find('[name*=chart_field_show_labels_as_percentages_]');
            var showLabelsAsPercentagesVal = showLabelsAsPercentages.is(':checked');

            var plotly = chartField.find("input[name*=chart_field_plotly_]").val();
            var lplotly = chartField.find("input[name*=chart_field_plotly_line_]").val();
            var bar_width = chartField.find("input[name*=chart_field_bar_width_]").val();
            var donut_hole = chartField.find("input[name*=chart_field_donut_hole_]").val();
            var ltypes_list = chartField.find(`[name*=chart_field_line_type_]`);
            var lwidths_list = chartField.find(`[name*=chart_field_line_width_]`);
            var lwidths = [];
            var ltypes = [];

            for (let i = 0; i < ltypes_list.length; i++) {
                ltypes.push(chartField.find(`[name=${ltypes_list[i].id}]`).val());
            }

            try {
                var empty_text = document.querySelector("#line_type_empty_text");

                if (empty_text !== null) {
                    empty_text.remove();
                }
            } catch (error) {
                console.error(error);
            }

            for (let i = 0; i < lwidths_list.length; i++) {
                lwidths.push(String(chartField.find(`[name=${lwidths_list[i].id}]`).val()));
            }

            // If the changed values from the dropdowns are not from x_axis or y_axis
            // then just update the chart without fetching new data. This leads
            // to a better UX.
            if (
                this.fetched_data 
                && 
                (
                    this.options.x_axis === axisXValue &&
                    this.options.y_axis === axisYValue
                ) 
                && 
                (
                    this.options.filter_name === filterNameVal &&
                    this.options.filter_value === filterValueVal
                ) 
                && this.options.category_name === categoryNameVal 
                && this.options.chart_type === chartTypeValue 
                && this.options.static_reference_columns === staticReferenceColumnsVal 
                && this.options.dynamic_reference_type === dynamicReferenceTypeVal 
                && this.options.dynamic_reference_factor === dynamicReferenceFactorVal 
                && this.options.plotly === plotly 
                && this.options.bar_width === bar_width 
                && this.options.donut_hole === donut_hole
            ) {
                this.options.x_sort_labels = x_sort_labels
                this.options.seq_color = chartFieldSeqColor;
                this.options.color_type = chartFieldColorType;
                this.options.show_annotations = chartFieldShowAnnotations;
                this.options.show_bounds = showBounds;
                this.options.x_tick_format = xTickFormatVal;
                this.options.x_label = xLabelVal;
                this.options.x_label_hide = xLabelHideVal;
                this.options.axis_range = axisRange;
                this.options.x_from_zero;   //  TODO: check if this line can be deleted
                this.options.upper_bounds = upperBounds;
                this.options.lower_bounds = lowerBounds;
                this.options.axis_min = axisMin;
                this.options.axis_max = axisMax;
                this.options.plotly = plotly;
                this.options.bar_width = bar_width;
                this.options.donut_hole = donut_hole;
                this.options.line_types = ltypes.join();
                this.options.line_widths = lwidths.join();
                this.options.colors = colorValue;
                this.options.chart_type = chartTypeValue;
                this.options.title = chartTitleVal;
                this.options.show_legend = legendVal;
                this.options.show_legend_title = legendTitleCkbVal;
                this.options.custom_legend_title = legendTitleVal;
                this.options.x_text_rotate = xTextRotateVal;
                this.options.x_text_multiline = xTextMultilineVal;
                this.options.x_tick_culling_max = xTickCullingMaxVal;
                this.options.tooltip_name = tooltipNameVal;
                this.options.data_format = dataFormatVal;
                this.options.y_tick_format = yTickFormatVal;
                this.options.chart_padding_left = chartPaddingLeftVal;
                this.options.chart_padding_bottom = chartPaddingBottomVal;
                this.options.padding_top = paddingTopVal;
                this.options.padding_bottom = paddingBottomVal;
                this.options.show_labels = dataLabelsVal;
                this.options.y_label = yLabbelVal;
                this.options.y_label_hide = yLabelHideVal;
                this.options.y_from_zero = yFromZeroVal;
                this.options.tick_count = tickCountVal;
                this.options.data_sort = sortVal;
                this.options.static_reference_columns = staticReferenceColumnsVal;
                this.options.static_reference_label = staticReferenceLabelVal;
                this.options.dynamic_reference_type = dynamicReferenceTypeVal;
                this.options.dynamic_reference_factor = dynamicReferenceFactorVal;
                this.options.dynamic_reference_label = dynamicReferenceLabelVal;
                this.options.measure_label = measureLabelVal;
                this.options.show_labels_as_percentages = showLabelsAsPercentagesVal;
                this.createChart(this.fetched_data);

                return;
            }

            this.options.seq_color = chartFieldSeqColor;
            this.options.color_type = chartFieldColorType;
            this.options.show_annotations = chartFieldShowAnnotations;
            this.options.show_bounds = showBounds;
            this.options.x_tick_format = xTickFormatVal;
            this.options.x_label = xLabelVal;
            this.options.x_label_hide = xLabelHideVal;
            this.options.axis_range = axisRange;
            this.options.x_from_zero;    //  TODO: check if this line can be deleted
            this.options.upper_bounds = upperBounds;
            this.options.lower_bounds = lowerBounds;
            this.options.axis_min = axisMin;
            this.options.axis_max = axisMax;
            this.options.plotly = plotly;
            this.options.bar_width = bar_width;
            this.options.donut_hole = donut_hole;
            this.options.line_types = ltypes.join();
            this.options.line_widths = lwidths.join();
            this.options.x_sort_labels = x_sort_labels;
            this.options.colors = colorValue;
            this.options.chart_type = chartTypeValue;
            this.options.x_axis = axisXValue;
            this.options.y_axis = axisYValue;
            this.options.title = chartTitleVal;
            this.options.show_legend = legendVal;
            this.options.show_legend_title = legendTitleCkbVal;
            this.options.custom_legend_title = legendTitleVal;
            this.options.x_text_rotate = xTextRotateVal;
            this.options.x_text_multiline = xTextMultilineVal;
            this.options.x_tick_culling_max = xTickCullingMaxVal;
            this.options.tooltip_name = tooltipNameVal;
            this.options.data_format = dataFormatVal;
            this.options.y_tick_format = yTickFormatVal;
            this.options.chart_padding_left = chartPaddingLeftVal;
            this.options.chart_padding_bottom = chartPaddingBottomVal;
            this.options.padding_top = paddingTopVal;
            this.options.padding_bottom = paddingBottomVal;
            this.options.show_labels = dataLabelsVal;
            this.options.tick_count = tickCountVal;
            this.options.y_label = yLabbelVal;
            this.options.y_label_hide = yLabelHideVal;
            this.options.y_from_zero = yFromZeroVal;
            this.options.filter_name = filterNameVal;
            this.options.filter_value = filterValueVal;
            this.options.category_name = categoryNameVal;
            this.options.data_sort = sortVal;
            this.options.static_reference_columns = staticReferenceColumnsVal;
            this.options.static_reference_label = staticReferenceLabelVal;
            this.options.dynamic_reference_type = dynamicReferenceTypeVal;
            this.options.dynamic_reference_factor = dynamicReferenceFactorVal;
            this.options.dynamic_reference_label = dynamicReferenceLabelVal;
            this.options.measure_label = measureLabelVal;
            this.options.show_labels_as_percentages = showLabelsAsPercentagesVal;

            if (bar_width != "") {
                this.options.bar_width = parseFloat(bar_width) / 10;
            }
    
            if (donut_hole != "") {
                this.options.donut_hole = parseFloat(donut_hole) / 10;
            }
    
            if (this.options.lplotly) {
                this.options.lplotly = lplotly;
            }

            var newSql = this.create_sql();
            this.get_resource_datа(newSql);

            chartField.find("[name*=chart_field_graph_]").change();
        },

        

        // Delete the current chart
        deleteChart: function() {
            this.el.closest('.chart_field').remove();
        },

        teardown: function() {
            // We must always unsubscribe on teardown to prevent memory leaks.
            this.sandbox.unsubscribe('querytool:updateCharts', this.updateChart.bind(this));
        },

        sortData: function(data_sort, records, y_axis, x_axis) {
            //  Disable sorting for data with numbers like 1.A 2.B
            if (data_sort !== "default") {
                records.forEach(function (data_sort) {
                    isNaN(data_sort[x_axis]) && (data_sort[x_axis] = data_sort[x_axis].replace(/^\d{1,2}\./, ""));
                });
            } 

            if (data_sort === 'asc') {
                records.sort(function(a, b) {
                    return a[y_axis] - b[y_axis]
                });
            } else if (data_sort === 'desc') {
                records.sort(function(a, b) {
                    return a[y_axis] - b[y_axis]
                });
                records.reverse();
            } else {
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
            }
        },

        // Format number
        sortFormatData: function(dataf, val) {
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

        // Count format decimals limited by "max"
        countDecimals: function (val, max) {
          return Math.min(val*10 % 1 ? 2 : val % 1 ? 1 : 0, max);
        },

        // Render dynamic chart titles
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

        },

        // Get static reference column
        getStaticReferenceColumn: function (static_reference_columns, y_axis) {
          for (const value of static_reference_columns || []) {
            const measure = value.split('|')[0];
            const column = value.split('|')[1];
            if (measure === y_axis) return column;
          }
        },

    }
});
