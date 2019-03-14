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
ckan.module('querytool-viz-preview', function() {
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
        initialize: function() {
            var newSql = this.create_sql();

            this.get_resource_datа(newSql);

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
            sqlStringExceptSelect = sqlStringExceptSelect.replace('+', '%2B');
            var chart_filter_name = (this.options.filter_name === true) ? '' : this.options.filter_name;
            var chart_filter_value = (this.options.filter_value === true) ? '' : this.options.filter_value;
            var y_axis = (this.options.y_axis === true) ? '' : this.options.y_axis;
            var static_reference_columns = (this.options.static_reference_columns === true) ? [] : this.options.static_reference_columns;
            var static_reference_column = this.getStaticReferenceColumn(static_reference_columns, y_axis);
            var category = (this.options.category_name === true) ? '' : this.options.category_name;

            // If additional chart filter is set extend the current sql with the new filter
            if (chart_filter_name && chart_filter_value) {
                var filterSql = ' AND ("' + this.options.filter_name + '"' + " = '" + this.options.filter_value + "')"
                sqlStringExceptSelect = sqlStringExceptSelect + filterSql;
            }

            var sql;
            if (static_reference_column) {
              sql = 'SELECT AVG("' + static_reference_column + '") as static_reference_column, "' + this.options.x_axis + '", SUM("' + this.options.y_axis + '") as ' + '"' + this.options.y_axis + '"' + sqlStringExceptSelect + ' GROUP BY "' + this.options.x_axis + '"';
            } else {
              sql = 'SELECT ' + '"' + this.options.x_axis + '", SUM("' + this.options.y_axis + '") as ' + '"' + this.options.y_axis + '"' + sqlStringExceptSelect + ' GROUP BY "' + this.options.x_axis + '"';
            }

            return sql;
        },
        // Get the data from Datastore.
        get_resource_datа: function(sql) {

            var category = (this.options.category_name === true) ? '' : this.options.category_name;
            var x_axis = (this.options.x_axis === true) ? '' : this.options.x_axis;
            var y_axis = (this.options.y_axis === true) ? '' : this.options.y_axis;
            var resource_id = sql.split('FROM')[1].split('WHERE')[0].split('"')[1];
            var chart_type = this.options.chart_type;

            var chart_filter_name = (this.options.filter_name === true) ? '' : this.options.filter_name;
            var chart_filter_value = (this.options.filter_value === true) ? '' : this.options.filter_value;
            var static_reference_columns = (this.options.static_reference_columns === true) ? [] : this.options.static_reference_columns;
            var static_reference_column = this.getStaticReferenceColumn(static_reference_columns, y_axis);
            var dynamic_reference_type = (this.options.dynamic_reference_type === true) ? '' : this.options.dynamic_reference_type;
            var dynamic_reference_factor = (this.options.dynamic_reference_factor === true) ? '' : this.options.dynamic_reference_factor;

            var viz_form = $('#visualizations-form');
            var f = viz_form.data('mainFilters');
            var previous_filters = (this.options.query_filters === true) ? f : this.options.query_filters;

            var chart_filter = {};

            if (chart_filter_name && chart_filter_value) {
                chart_filter = {
                    name: chart_filter_name,
                    value: chart_filter_value
                }
            }

            api.post('querytool_get_chart_data', {
                    category: category,
                    sql_string: sql,
                    resource_id: resource_id,
                    x_axis: x_axis,
                    y_axis: y_axis,
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
            var y_axis = this.options.y_axis.toLowerCase();
            var records = data;
            var show_legend = this.options.show_legend;
            var x_text_rotate = this.options.x_text_rotate;
            var x_text_multiline = this.options.x_text_multiline;
            var x_tick_culling_max = this.options.x_tick_culling_max;
            var tooltip_name = this.options.tooltip_name;
            var data_format = this.options.data_format;
            var y_tick_format = this.options.y_tick_format;
            var chart_padding_left = (this.options.chart_padding_left === true) ? null : this.options.chart_padding_left;
            var chart_padding_bottom = (this.options.chart_padding_bottom === true) ? null : this.options.chart_padding_bottom;
            var padding_top = (this.options.padding_top === true) ? null : this.options.padding_top;
            var padding_bottom = (this.options.padding_bottom === true) ? null : this.options.padding_bottom;
            var tick_count = (this.options.tick_count === true) ? '' : this.options.tick_count;
            var show_labels = this.options.show_labels;
            var y_label = (this.options.y_label === true) ? null : this.options.y_label;
            var y_label_hide = this.options.y_label_hide;
            var y_from_zero = this.options.y_from_zero;
            var data_sort = this.options.data_sort;
            var measure_label = this.options.measure_label;
            var additionalCategory = (this.options.category_name === true) ? '' : this.options.category_name;
            var static_reference_label = (this.options.static_reference_label === true) ? '' : this.options.static_reference_label;
            var dynamic_reference_label = (this.options.dynamic_reference_label === true) ? '' : this.options.dynamic_reference_label;
            var values;
            var show_labels_as_percentages = this.options.show_labels_as_percentages || false;

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
            var titleVal = (this.options.title === true) ? '' : this.options.title;
            var queryFilters = (this.options.query_filters === true) ? [] : this.options.query_filters;
            if (!queryFilters.length) queryFilters = (this.options.info_query_filters === true) ? [] : this.options.info_query_filters;
            var optionalFilterName = (this.options.filter_name === true) ? '' : this.options.filter_name;
            var optionalFilterSlug = (this.options.filter_slug === true) ? '' : this.options.filter_slug;
            var optionalFilterValue = (this.options.filter_value === true) ? '' : this.options.filter_value;
            var optionalFilter = optionalFilterName ? {name: optionalFilterName, slug: optionalFilterSlug, value: optionalFilterValue} : undefined;
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
            if((this.options.chart_type !== 'sbar' ||
              this.options.chart_type !== 'shbar') && !additionalCategory){
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
            } else if (this.options.chart_type === 'sbar' ||
                this.options.chart_type === 'shbar') {
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

            // Generate chart
            var chart = c3.generate(options);

        },
        // Get the values from dropdowns and rerender the chart.
        updateChart: function() {
            var chartField = this.el.closest('.chart_field');

            var chartTypeSelect = chartField.find('[name*=chart_field_graph_]');
            var chartTypeValue = chartTypeSelect.val();

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

            var xTextRotate = chartField.find('[name*=chart_field_x_text_rotate_]');
            var xTextRotateVal = xTextRotate.val();

            var xTextMultiline = chartField.find('[name*=chart_field_x_text_multiline_]');
            var xTextMultilineVal = xTextMultiline.is(':checked');

            var xTickCullingMax = chartField.find('[name*=chart_field_x_tick_culling_max_]');
            var xTickCullingMaxVal = xTickCullingMax.val();

            var tooltipName = chartField.find('input[name*=chart_field_tooltip_name_]');
            var tooltipNameVal = tooltipName.val();

            var dataFormat = chartField.find('[name*=chart_field_data_format_]');
            var dataFormatVal = dataFormat.val();

            var yTickFormat = chartField.find('[name*=chart_field_y_ticks_format_]');
            var yTickFormatVal = yTickFormat.val();

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

            var yLabbel = chartField.find('input[name*=chart_field_y_label_]');
            var yLabbelVal = yLabbel.val();

            var yLabelHide = chartField.find('input[name*=chart_field_y_label_hide_]');
            var yLabelHideVal = yLabelHide.is(':checked');

            var yFromZero = chartField.find('input[name*=chart_field_y_from_zero_]');
            var yFromZeroVal = yFromZero.is(':checked');

            var staticReferenceColumns = chartField.find('select[name*=chart_field_static_reference_columns_]');
            var staticReferenceColumnsVal = staticReferenceColumns.val();

            var staticReferenceLabel = chartField.find('input[name*=chart_field_static_reference_label_]');
            var staticReferenceLabelVal = staticReferenceLabel.val();

            var dynamicReferenceType = chartField.find('select[name*=chart_field_dynamic_reference_type_]');
            var dynamicReferenceTypeVal = dynamicReferenceType.val();

            var dynamicReferenceFactor = chartField.find('input[name*=chart_field_dynamic_reference_factor_]');
            var dynamicReferenceFactorVal = dynamicReferenceFactor.val();

            var dynamicReferenceLabel = chartField.find('input[name*=chart_field_dynamic_reference_label_]');
            var dynamicReferenceLabelVal = dynamicReferenceLabel.val();

            var measureLabelVal = $('#choose_y_axis_column option:selected').text();

            var showLabelsAsPercentages = chartField.find('[name*=chart_field_show_labels_as_percentages_]');
            var showLabelsAsPercentagesVal = showLabelsAsPercentages.is(':checked');

            // If the changed values from the dropdowns are not from x_axis or y_axis
            // then just update the chart without fetching new data. This leads
            // to a better UX.
            if (this.fetched_data && (this.options.x_axis === axisXValue &&
                    this.options.y_axis === axisYValue) && (this.options.filter_name === filterNameVal &&
                    this.options.filter_value === filterValueVal) &&
                    this.options.category_name === categoryNameVal &&
                    this.options.chart_type === chartTypeValue &&
                    this.options.static_reference_columns === staticReferenceColumnsVal &&
                    this.options.dynamic_reference_type === dynamicReferenceTypeVal &&
                    this.options.dynamic_reference_factor === dynamicReferenceFactorVal) {
                this.options.colors = colorValue;
                this.options.chart_type = chartTypeValue;
                this.options.title = chartTitleVal;
                this.options.show_legend = legendVal;
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

            this.options.colors = colorValue;
            this.options.chart_type = chartTypeValue;
            this.options.x_axis = axisXValue;
            this.options.y_axis = axisYValue;
            this.options.title = chartTitleVal;
            this.options.show_legend = legendVal;
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
            var newSql = this.create_sql();

            this.get_resource_datа(newSql);
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
