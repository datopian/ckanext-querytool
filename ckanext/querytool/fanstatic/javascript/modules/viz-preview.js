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
    - tooltip_name (Title of the tooltip)
    - data_format (Charts data format e.g 2k, $2000, 2000.0, 2000.00)
    - y_tick_format (Y axis data format e.g 2k, $2000, 2000.0, 2000.00)
    - padding_top (Add charts padding)
    - padding_bottom (Add charts padding)
    - show_labels (Display or hide charts labels)
    - y_label (Aditional label added in y axis)
    - filter_name (The name of the chart filter)
    - filter_value (The value of the chart filter)
    - category_name (Additional category on the x axis)
    - category_value (Additional category on the x axis)
    - data_sort (Sort data, asc or desc)

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
            var newSqlData = this.create_sql();

            this.get_resource_datа(newSqlData);

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
            var chart_filter_name = (this.options.filter_name === true) ? '' : this.options.filter_name;
            var chart_filter_value = (this.options.filter_value === true) ? '' : this.options.filter_value;

            var chart_category_name = (this.options.category_name === true) ? '' : this.options.category_name;
            var chart_category_value = (this.options.category_value === true) ? '' : this.options.category_value;

            // If additional chart filter is set extend the current sql with the new filter
            if (chart_filter_name && chart_filter_value) {
                var filterSql = ' AND ("' + this.options.filter_name + '"' + " = '" + this.options.filter_value + "')"
                sqlStringExceptSelect = sqlStringExceptSelect + filterSql;
            }
            var mainSql = 'SELECT ' + '"' + this.options.x_axis + '", SUM("' + this.options.y_axis + '") as ' + '"' + this.options.y_axis + '"' + sqlStringExceptSelect + ' GROUP BY "' + this.options.x_axis + '"';

            // If additional chart category is set create new sql for the new category
            var categorySql = '';
            if (chart_category_name && chart_category_value) {
                var sqlFromWhereClause = parsedSqlString[1];
                var filterSql = ' AND ("' + this.options.category_name + '"' + " = '" + this.options.category_value + "')"
                sqlFromWhereClause = sqlFromWhereClause + filterSql;
                categorySql = 'SELECT ' + '"' + this.options.x_axis + '", SUM("' + this.options.y_axis + '") as ' + '"' + this.options.y_axis + '"' + sqlFromWhereClause + ' GROUP BY "' + this.options.x_axis + '"';
            }

            var sqlData = {
                'mainSql': mainSql,
                'categorySql': categorySql
            }
            console.log('SQL ', sqlData)
            return sqlData
        },
        // Get the data from Datastore.
        get_resource_datа: function(sqlData) {
            api.get('querytool_get_chart_data', {
                mainSql: sqlData.mainSql,
                categorySql: sqlData.categorySql
            })
            .done(function(data) {
                if (data.success) {
                    this.fetched_data = data.result;
//                    TODO now we have two data sets, one is the main and the other is the category data which is not not required
                    this.createChart(this.fetched_data);
                } else {
                    this.el.text('Chart could not be created.');
                }
            }.bind(this))
            .error(function(error) {
                this.el.text('Chart could not be created.');
            }.bind(this));
        },
        createChart: function(data) {
            var x_axis = this.options.x_axis.toLowerCase();
            var y_axis = this.options.y_axis.toLowerCase();
            var records = data.main_data.records;
            var recordsCategory = data.category_data.records;
            var show_legend = this.options.show_legend;
            var x_text_rotate = this.options.x_text_rotate;
            var tooltip_name = this.options.tooltip_name;
            var data_format = this.options.data_format;
            var y_tick_format = this.options.y_tick_format;
            var padding_top = (this.options.padding_top === true) ? '' : this.options.padding_top;
            var padding_bottom = (this.options.padding_bottom === true) ? '' : this.options.padding_bottom;
            var tick_count = (this.options.tick_count === true) ? '' : this.options.tick_count;
            var show_labels = this.options.show_labels;
            var y_label = this.options.y_label;
            var data_sort = this.options.data_sort;
            var options = {
                bindto: this.el[0],
                color: {
                    pattern: this.options.colors.split(',')
                }
            };
            var values;
            var titleVal = (this.options.title === true) ? '' : this.options.title;

            options.title = {
                text: titleVal
            }
            options.legend = {
                show: show_legend
            }
            options.tooltip = {
                format: {}
            }

            var sBarOrder = data_sort;

            if(this.options.chart_type !== 'sbar' ||
               this.options.chart_type !== 'shbar'){
                    this.sortData(data_sort, records, y_axis, x_axis);
                    if(recordsCategory){
                       this.sortData(data_sort, recordsCategory, y_axis, x_axis);
                    }
            }


            if(tooltip_name !== true && tooltip_name !== ''){
                options.tooltip.format['title'] =  function (d) {
                    if(options.data.type === 'donut' || options.data.type === 'pie'){
                        return tooltip_name;
                    }
                        return tooltip_name + ' ' +  d;
                    }
            }
            options.tooltip.format['value'] = function (value, ratio, id) {
                var format =  d3.format(data_format);
                return format(value);
            }

            if (this.options.chart_type === 'donut' ||
                this.options.chart_type === 'pie') {
                    values = records.map(function(item) {
                        return [item[x_axis], item[y_axis]]
                    });
                    options.data = {
                        columns: values,
                        type : this.options.chart_type
                    };
            }
            else if(this.options.chart_type === 'sbar' ||
                    this.options.chart_type === 'shbar')
            {
                var horizontal = (this.options.chart_type === 'shbar') ? true : false

                var yrotate = 0;
                if(horizontal){
                     // On horizontal bar the x axis is now actually the y axis
                    yrotate = x_text_rotate;
                }
                values = records.map(function(item) {
                    return [item[x_axis], item[y_axis]]
                });
                options.data = {
                    columns: values,
                    type : 'bar',
                    order: sBarOrder
                };
                var groups = values.map(function(item){
                    return item[0];
                });
                options.data.groups = [groups];

                options.axis = {
                    rotated : horizontal,
                    y: {
                        tick: {
                          count: tick_count,
                          format: d3.format(y_tick_format),
                          rotate: yrotate
                         },
                         padding: {
                            top: padding_top,
                            bottom: padding_bottom
                         }
                    },
                    x: {
                        tick:{
                            rotate: x_text_rotate,
                            multiline: true
                        }
                    }
                }
            }
            else
            {
                var rotate = false;
                var ctype = this.options.chart_type;
                var yrotate = 0;
                if (this.options.chart_type === 'hbar')
                {
                    rotate = true;
                    ctype = 'bar';
                    // On horizontal bar the x axis is now actually the y axis
                    yrotate = x_text_rotate;
                }
                if(this.options.chart_type === 'bscatter'){
                    //workaround for bubble charts, scale log base 10 because of large values
                    var rs = d3.scale.log().base(10).domain([1,1000]).range([0,10]);
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

                values = records.map(function(item) {
                    return Number(item[y_axis]);
                });

                var categories = records.map(function(item) {
                    return item[x_axis];
                });

                var dataValues = [];
                values.unshift(this.options.y_axis);
                dataValues.push(values);

                if(recordsCategory){
                    var valuesCategory = recordsCategory.map(function(item) {
                        return Number(item[y_axis]);
                    });
                    var categories2 = recordsCategory.map(function(item) {
                        return item[x_axis];
                    });
                    //TODO: Add new name e.g Death by Year
                    valuesCategory.unshift(this.options.y_axis + '2');
                    dataValues.push(valuesCategory);
                }
                var xCategories = (categories.length > categories2.length) ? categories : categories2;
                options.data = {
                    columns: dataValues,
                    type: ctype,
                    labels: show_labels
                };
                if(show_labels){
                    options.data['labels'] =  {
                        format:  d3.format(data_format)
                    }
                }
                options.axis = {
                    y: {
                        tick: {
                          count: tick_count,
                          format: d3.format(y_tick_format),
                          rotate: yrotate
                        },
                    padding: {
                         top: padding_top,
                         bottom: padding_bottom
                    },
                    label: y_label
                    },
                    x: {
                        type: 'category',
                        categories: xCategories,
                        tick: {
                            rotate: x_text_rotate,
                            multiline: true,
                            fit: true
                        }
                    },
                    rotated: rotate
                };
            }
            var chart = c3.generate(options);
        },
        // Get the values from dropdowns and rerender the chart.
        updateChart: function() {
            var chartField = this.el.closest('.chart_field');

            var chartTypeSelect = chartField.find('[name*=chart_field_graph_]');
            var chartTypeValue = chartTypeSelect.val();

            var colorSelect = chartField.find('[name*=chart_field_color_]');
            var colorValue = colorSelect.val();

            var axisXSelect = chartField.find('[name*=chart_field_axis_x_]');
            var axisXValue = axisXSelect.val();

            var axisYSelect = chartField.find('[name*=chart_field_axis_y_]');
            var axisYValue = axisYSelect.val();

            var chartTitle = chartField.find('input[name*=chart_field_title_]');
            var chartTitleVal = chartTitle.val();

            var legend =  chartField.find('input[name*=chart_field_legend_]');
            var legendVal = legend.is(':checked');

            var xTextRotate = chartField.find('[name*=chart_field_x_text_rotate_]');
            var xTextRotateVal = xTextRotate.val();

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

            var filterName =  chartField.find('[name*=chart_field_filter_name_]');
            var filterNameVal = filterName.val();

            var filterValue = chartField.find('[name*=chart_field_filter_value_]');
            var filterValueVal = filterValue.val();

            var categoryName =  chartField.find('[name*=chart_field_category_name_]');
            var categoryNameVal = categoryName.val();

            var categoryValue = chartField.find('[name*=chart_field_category_value_]');
            var categoryValueVal = categoryValue.val();

            var sortOpt = chartField.find('[name*=chart_field_sort_]');
            var sortVal = sortOpt.val();

            var dataLabels =  chartField.find('input[name*=chart_field_labels_]');
            var dataLabelsVal = dataLabels.is(':checked');

            var yLabbel = chartField.find('input[name*=chart_field_y_label_]');
            var yLabbelVal = yLabbel.val();

            // If the changed values from the dropdowns are not from x_axis or y_axis
            // then just update the chart without fetching new data. This leads
            // to a better UX.
            if (this.fetched_data && (this.options.x_axis === axisXValue &&
                this.options.y_axis === axisYValue) && (this.options.filter_name === filterNameVal &&
                this.options.filter_value === filterValueVal) && (this.options.category_name === categoryNameVal &&
                this.options.category_value === categoryValueVal))
            {
                this.options.colors = colorValue;
                this.options.chart_type = chartTypeValue;
                this.options.title = chartTitleVal;
                this.options.show_legend = legendVal;
                this.options.x_text_rotate = xTextRotateVal;
                this.options.tooltip_name = tooltipNameVal;
                this.options.data_format = dataFormatVal;
                this.options.y_tick_format = yTickFormatVal;
                this.options.padding_top = paddingTopVal;
                this.options.padding_bottom = paddingBottomVal;
                this.options.show_labels = dataLabelsVal;
                this.options.y_label = yLabbelVal;
                this.options.tick_count = tickCountVal;
                this.options.data_sort = sortVal;
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
            this.options.tooltip_name = tooltipNameVal;
            this.options.data_format = dataFormatVal;
            this.options.y_tick_format = yTickFormatVal;
            this.options.padding_top = paddingTopVal;
            this.options.padding_bottom = paddingBottomVal;
            this.options.show_labels = dataLabelsVal;
            this.options.tick_count = tickCountVal;
            this.options.y_label = yLabbelVal;
            this.options.filter_name = filterNameVal;
            this.options.filter_value = filterValueVal;
            this.options.category_name = categoryNameVal;
            this.options.category_value = categoryValueVal;
            this.options.data_sort = sortVal;
            var newSqlData = this.create_sql();

            this.get_resource_datа(newSqlData);
        },

        // Delete the current chart
        deleteChart: function(){
             this.el.closest('.chart_field').remove();
        },

        teardown: function () {
            // We must always unsubscribe on teardown to prevent memory leaks.
            this.sandbox.unsubscribe('querytool:updateCharts', this.updateChart.bind(this));
        },

        sortData: function(data_sort, records, y_axis, x_axis){
            if(data_sort === 'asc'){
                    records.sort(function(a, b){return a[y_axis] - b[y_axis]});
                }else if(data_sort === 'desc'){
                    records.sort(function(a, b){return a[y_axis] - b[y_axis]});
                    records.reverse();
                }else{
                    records.sort(function(a, b){
                        var x = a[x_axis];
                        var y = b[x_axis];
                        if(!isNaN(x)){
                            return Number(x) - Number(y);
                        }else{
                            if (x < y) //sort string ascending
                                return -1;
                            if (x > y)
                                return 1;
                            return 0; //default return value (no sorting)
                        }
                    });
                }
        }
    }
});