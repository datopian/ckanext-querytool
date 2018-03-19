(function() {
    'use strict';

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

    $(document).ready(function() {
        var visualizationItems = $('#visualization-settings-items');
        var vizForm = $('#visualizations-form');
        var sqlString = vizForm.data('sqlString');
        var chart_resource = vizForm.data('chartResource');
        var map_resource = vizForm.data('mapResource');
        var chooseYAxisColumn = $('#choose_y_axis_column');

        var charts = $('.chart_field');

        // Only disable Save button if there aren't visualizations
        if (charts.length === 0) {
            $('#save-visualization-btn').attr('disabled', 'true');
        }

        chooseYAxisColumn.change(function(event) {
            // Update the hidden inputs for the y axis
            var axisY = $('[name*=chart_field_axis_y_]');
            axisY.val(event.target.value);

            // Send a message to update charts when a new column is selected.
            // The JavaScript module "querytool-viz-preview" subscribes to this
            // event to update the chart.
            ckan.sandbox().publish('querytool:updateCharts');
        });

        var createVisualization = $('#create-visualization-btn');
        createVisualization.on('click', function() {
            $.proxyAll(this, /_on/);

            var visualization = $('#item_type').val();
            var item =  $('.item');
            var items = item.length + 1;
            if (visualization === 'chart') {
                var axisYValue = chooseYAxisColumn.val();

                if (axisYValue === '$none$') {
                    alert('Please choose a column for y axis.');
                    return;
                }
                console.log('CHART' + items)
                //TODO: parse query params simple
                var querytool = window.location.href.substr(window.location.href.lastIndexOf('/') +1).split("?")[0];
                ckan.sandbox().client.getTemplate('chart_fields.html', {
                        n: items,
                        querytool: querytool,
                        chart_resource: chart_resource,
                        map_resource: map_resource,
                        sql_string: sqlString
                    })
                    .done(function(data) {
                        var item = visualizationItems.prepend(data);
                        $('#save-visualization-btn').attr('disabled', false);
                        ckan.module.initializeElement(item.find('div[data-module=querytool-viz-preview]')[0]);
                        handleItemsOrder();

                        var axisY = $('[name*=chart_field_axis_y_]');
                        axisY.val(axisYValue);
                    });
            } else if (visualization === 'map') {
                alert('Not implemented yet.');
            } else if (visualization == 'text-box'){
                console.log('tex' + items)

                ckan.sandbox().client.getTemplate('text_box.html', {
                        number: items
                    })
                    .done(function(data) {
                           var item = visualizationItems.prepend(data);
                                                handleItemsOrder();

                    });
            }

        });

        // Initialize drag and drop functionality for visualization items
        dragula([visualizationItems[0]], {
            moves: function(el, container, handle) {
                return handle.classList.contains('grippy');
            }
        }).on('drag', function(el, container, handle) {
            el.querySelector('.grippy').classList.add('cursor-grabbing');
        }).on('dragend', function(el) {
            el.querySelector('.grippy').classList.remove('cursor-grabbing');

            handleItemsOrder();
        });

        // This function updates the order numbers for the form elements.
        function handleItemsOrder() {
           // var items = $('.chart_field');
                        var items = $('.item');
            $.each(items, function(i, item) {

                item = $(item);
                console.log('aaaa ', item.context.id);
                console.log(i)
                var order = i + 1;
                if(item.context.id.indexOf('chart_field') >= 0){
                console.log(order)
                    var dropdownGraphType = item.find('[id*=chart_field_graph_]');
                    var dropdownColorScheme = item.find('[id*=chart_field_color_]');
                    var dropdownAxisY = item.find('[id*=chart_field_axis_y_]');
                    var dropdownAxisX = item.find('[id*=chart_field_axis_x_]');

                    var inputGraphTitle = item.find('[id*=chart_field_title_]');
                    var selectTextRotationAxisX = item.find('[id*=chart_field_x_text_rotate_]');
                    var checkboxShowDataLabels = item.find('[id*=chart_field_labels_]');
                    var checkboxShowLegend = item.find('[id*=chart_field_legend_]');
                    var inputTooltipName = item.find('[id*=chart_field_tooltip_name_]');
                    var selectDataFormat = item.find('[id*=chart_field_data_format_]');
                    var selectTickFormatAxisY = item.find('[id*=chart_field_y_ticks_format_]');
                    var inputLabelAxisY = item.find('[id*=chart_field_y_label_]');
                    var inputPaddingTop = item.find('[id*=chart_field_padding_top_]');
                    var inputPaddingBottom = item.find('[id*=chart_field_padding_bottom_]');
                    var inputChartSize = item.find('[id*=chart_field_size_]');


                    item.attr('id', 'chart_field_' + order);

                    dropdownGraphType.attr('id', 'chart_field_graph_' + order);
                    dropdownGraphType.attr('name', 'chart_field_graph_' + order);

                    dropdownColorScheme.attr('id', 'chart_field_color_' + order);
                    dropdownColorScheme.attr('name', 'chart_field_color_' + order);

                    dropdownAxisY.attr('id', 'chart_field_axis_y_' + order);
                    dropdownAxisY.attr('name', 'chart_field_axis_y_' + order);

                    dropdownAxisX.attr('id', 'chart_field_axis_x_' + order);
                    dropdownAxisX.attr('name', 'chart_field_axis_x_' + order);

                    inputGraphTitle.attr('id', 'chart_field_title_' + order);
                    inputGraphTitle.attr('name', 'chart_field_title_' + order);

                    selectTextRotationAxisX.attr('id', 'chart_field_x_text_rotate_' + order);
                    selectTextRotationAxisX.attr('name', 'chart_field_x_text_rotate_' + order);

                    checkboxShowDataLabels.attr('id', 'chart_field_labels_' + order);
                    checkboxShowDataLabels.attr('name', 'chart_field_labels_' + order);

                    checkboxShowLegend.attr('id', 'chart_field_legend_' + order);
                    checkboxShowLegend.attr('name', 'chart_field_legend_' + order);

                    inputTooltipName.attr('id', 'chart_field_tooltip_name_' + order);
                    inputTooltipName.attr('name', 'chart_field_tooltip_name_' + order);

                    selectDataFormat.attr('id', 'chart_field_data_format_' + order);
                    selectDataFormat.attr('name', 'chart_field_data_format_' + order);

                    selectTickFormatAxisY.attr('id', 'chart_field_y_ticks_format_' + order);
                    selectTickFormatAxisY.attr('name', 'chart_field_y_ticks_format_' + order);

                    inputLabelAxisY.attr('id', 'chart_field_y_label_' + order);
                    inputLabelAxisY.attr('name', 'chart_field_y_label_' + order);

                    inputPaddingTop.attr('id', 'chart_field_padding_top_' + order);
                    inputPaddingTop.attr('name', 'chart_field_padding_top_' + order);

                    inputPaddingBottom.attr('id', 'chart_field_padding_bottom_' + order);
                    inputPaddingBottom.attr('name', 'chart_field_padding_bottom_' + order);

                    inputChartSize.attr('id', 'chart_field_size_' + order);
                    inputChartSize.attr('name', 'chart_field_size_' + order);
                 } else if(item.context.id.indexOf('text_box') >= 0){
                                     console.log('in')
                console.log(order)

                    var description = item.find('[id*=text_box_description_]');

                    item.attr('id', 'text_box_' + order);

                    description.attr('id', 'text_box_description_' + order);
                    description.attr('name', 'text_box_description_' + order);
                 }
            });
        }

        // Expose this function on window to be accessible in other files
        window.handleItemsOrder = handleItemsOrder;
    });

})($);
