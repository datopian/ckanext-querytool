/*

This modules handles displaying a visualization item, which can be a chart or
a map.

Options:
    - type (Type of the visualization item: chart or map)
    - colors (Pattern of colors)
    - x_axis (Column name of x axis)
    - y_axis (Column name of y axis)
    - sql_string (SQL string the contains filters)
    - chart_type (What type of chart needs to be rendered)

*/

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
            var newSqlString = this.create_sql_string();

            this.get_resource_datа(newSqlString);

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
        create_sql_string: function() {
            var parsedSqlString = this.options.sql_string.split('*');
            var sqlStringExceptSelect = parsedSqlString[1];

            return 'SELECT ' + '"' + this.options.x_axis + '", SUM("' + this.options.y_axis + '") as ' + this.options.y_axis + sqlStringExceptSelect + ' GROUP BY "' + this.options.x_axis + '"';
        },
        // Get the data from Datastore.
        get_resource_datа: function(sqlString) {
            api.get('querytool_get_resource_data', {
                sql_string: sqlString
            })
            .done(function(data) {
                if (data.success) {
                    this.fetched_data = data.result;
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
            var records = data.records;
            var show_legend = this.options.show_legend;
            var x_text_rotate = this.options.x_text_rotate;
            var tooltip_name = this.options.tooltip_name;
            var tooltip_format = this.options.tooltip_format;
            var options = {
                bindto: this.el[0],
                color: {
                    pattern: this.options.colors.split(',')
                }
            };
            var values;
            var titleVal = this.options.title;

            if(titleVal === true){
                titleVal = '';
            }
            options.title = {
                text: titleVal
            }
            options.legend = {
                show: show_legend
            }
            if(tooltip_name !== true && tooltip_name !== ''){
                options.tooltip = {
                format: {
                    title: function (d) { return tooltip_name + ' ' +  d; },
                    value: function (value, ratio, id) {
                        var format =  d3.format(tooltip_format);
                        return format(value);
                        }
                    }
                }
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
                    this.options.chart_type == 'shbar')
            {
                var horizontal = (this.options.chart_type === 'shbar');

                values = records.map(function(item) {
                    return [item[x_axis], item[y_axis]]
                });
                options.data = {
                    columns: values,
                    type : 'bar'
                };
                var groups = values.map(function(item){
                    return item[0];
                });
                options.data.groups = [groups];
                if(horizontal){
                    options.axis = {
                        rotated: true
                    }
                }
            }
            else
            {
                var rotate = false;
                var ctype = this.options.chart_type;
                if (this.options.chart_type === 'hbar')
                {
                    rotate = true;
                    ctype = 'bar';
                }

                if(this.options.chart_type === 'bscatter'){
                    var rs = d3.scale.linear()
                          .domain([0.01, 100000])
                          .range([5, 50]);
                    ctype = 'scatter';
                    options.point = {
                         r: function(d) {
                                //workaround for bubble charts, divide by 10 because of large values
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
                values.unshift(this.options.y_axis);
                options.data = {
                    columns: [values],
                    type: ctype
                };
                options.axis = {
                    x: {
                        type: 'category',
                        categories: categories,
                        tick: {
                            rotate: x_text_rotate,
                            multiline: false
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
            var legendVal = legend.is(':checked')

            var xTextRotate = chartField.find('[name*=chart_field_x_text_rotate_]');
            var xTextRotateVal = xTextRotate.val();

            var tooltipName = chartField.find('input[name*=chart_field_tooltip_name_]');
            var tooltipNameVal = tooltipName.val();

            var tooltipFormat = chartField.find('[name*=chart_field_tooltip_format_]');
            var tooltipFormatVal = tooltipFormat.val();

            // If the changed values from the dropdowns are from color, chart type or text rotate
            // then just update the chart without fetching new data. This leads
            // to a better UX.
            if (this.fetched_data && (this.options.x_axis === axisXValue &&
                this.options.y_axis === axisYValue
            ) && (this.options.colors !== colorValue || this.options.chart_type !== chartTypeValue ||
                  this.options.x_text_rotate !== xTextRotateVal ||
                  this.options.tooltip_name !== tooltipNameVal || this.options.show_legend !== legendVal)) {
                this.options.colors = colorValue;
                this.options.chart_type = chartTypeValue;
                this.options.title = chartTitleVal;
                this.options.show_legend = legendVal;
                this.options.x_text_rotate = xTextRotateVal;
                this.options.tooltip_name = tooltipNameVal;
                this.options.tooltip_format = tooltipFormatVal;
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
            this.options.tooltip_format = tooltipFormatVal;
            var newSqlString = this.create_sql_string();

            this.get_resource_datа(newSqlString);
        },

        // Delete the current chart
        deleteChart: function(){
             this.el.closest('.chart_field').remove();
        }
    }
})