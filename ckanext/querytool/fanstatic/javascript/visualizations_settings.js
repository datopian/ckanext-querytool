(function(_, jQuery) {
    'use strict';

    var api = {
        get: function(action, params) {
            var api_ver = 3;
            var base_url = ckan.sandbox().client.endpoint;
            params = $.param(params);
            var url = base_url + '/api/' + api_ver + '/action/' + action + '?' + params;
            return $.getJSON(url);
        },
        post: function(action, data, async) {
            var api_ver = 3;
            var base_url = ckan.sandbox().client.endpoint;
            var url = base_url + '/api/' + api_ver + '/action/' + action;
            if (!async) {
                $.ajaxSetup({
                    async: false
                });
            }
            return $.post(url, JSON.stringify(data), 'json');
        }
    };

    function handleRenderedChartFilters(item_id) {

        var chart_filter_name_select;

        if (item_id) {
            chart_filter_name_select = $('[id=chart_field_filter_name_' + item_id + ']');
        } else {
            chart_filter_name_select = $('[id*=chart_field_filter_name_]');
        }

        chart_filter_name_select.change(function(event) {
            var elem = $(this);
            var chart_filter_name = elem.find(":selected").val();
            var filter_name_select_id = elem.attr('id');

            var chart_filter_value_select_id = filter_name_select_id.replace('name', 'value');
            var chart_filter_visibility_id = chart_filter_value_select_id.replace('value', 'visibility');

            var chart_filter_value_div_id = chart_filter_value_select_id.replace('field', 'div');
            var chart_filter_visibility_div_id = chart_filter_visibility_id.replace('field', 'div');

            var resource_input_id = filter_name_select_id.replace('chart_field_filter_name', 'resource_id');
            var resource_id = $('#' + resource_input_id).val();


            if (chart_filter_name === '') {
                // Empty filter value select
                if ($('#' + chart_filter_value_select_id + ' option').length > 0) {
                    $('#' + chart_filter_value_select_id).find('option').not(':first').remove();
                }
                $('#' + chart_filter_value_div_id).addClass('hidden');
                $('#' + chart_filter_value_select_id).prop('required', false);
                $('#' + chart_filter_visibility_div_id).addClass('hidden');

            } else {
                // Reinitialize filter value select
                if ($('#' + chart_filter_value_select_id + ' option').length > 0) {
                    $('#' + chart_filter_value_select_id).find('option').not(':first').remove();
                }

                api.post('get_filter_values', {
                    'resource_id': resource_id,
                    'filter_name': chart_filter_name,
                    'previous_filters': []
                }).done(function(data) {

                    $.each(data.result, function(idx, elem) {

                        $('#' + chart_filter_value_select_id).append(new Option(elem, elem));
                    });

                    $('#' + chart_filter_value_div_id).removeClass('hidden');
                    $('#' + chart_filter_value_select_id).prop('required', true);
                    $('#' + chart_filter_visibility_div_id).removeClass('hidden');
                });

            }
        });
    };

    $(document).ready(function() {
        handleRenderedChartFilters();
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

        //delete dynamicly created textbox section
        $(document).on('click', '.delete-textbox-btn', function(el) {
            el.target.closest('.item').remove();
        });

        var createVisualization = $('#add-visualization-btn');
        createVisualization.on('click', function() {
            $.proxyAll(this, /_on/);

            var visualization = $('#item_type').val();
            var item = $('.item');
            var items = item.length + 1;
            if (visualization === 'chart') {
                var axisYValue = chooseYAxisColumn.val();

                if (axisYValue === '$none$') {
                    alert('Please choose a column for y axis.');
                    return;
                }
                //TODO: parse query params simple
                var querytool = window.location.href.substr(window.location.href.lastIndexOf('/') + 1).split("?")[0];
                ckan.sandbox().client.getTemplate('chart_fields.html', {
                        n: items,
                        querytool: querytool,
                        chart_resource: chart_resource,
                        map_resource: map_resource,
                        sql_string: sqlString,
                        class: 'hidden'
                    })
                    .done(function(data) {
                        var item = visualizationItems.prepend(data);
                        $('#save-visualization-btn').attr('disabled', false);
                        ckan.module.initializeElement(item.find('div[data-module=querytool-viz-preview]')[0]);
                        handleRenderedChartFilters(items);
                        handleItemsOrder();

                        var axisY = $('[name*=chart_field_axis_y_]');
                        axisY.val(axisYValue);
                    });
            } else if (visualization === 'map') {
                alert('Not implemented yet.');
            } else if (visualization == 'text-box') {
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
                var order = i + 1;
                if (item.context.id.indexOf('chart_field') >= 0) {
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
                    var selectFilterName = item.find('[id*=chart_field_filter_name_]');
                    var selectFilterValue = item.find('[id*=chart_field_filter_value_]');
                    var selectFilterValueDiv = item.find('[id*=chart_div_filter_value_]');
                    var selectFilterVisibility = item.find('[id*=chart_field_filter_visibility_]');
                    var selectFilterVisibilityDiv = item.find('[id*=chart_div_filter_visibility_]');
                    var resource_id = item.find('[id*=resource_id_]');


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

                    selectFilterName.attr('id', 'chart_field_filter_name_' + order);
                    selectFilterName.attr('name', 'chart_field_filter_name_' + order);

                    selectFilterValue.attr('id', 'chart_field_filter_value_' + order);
                    selectFilterValue.attr('name', 'chart_field_filter_value_' + order);
                    selectFilterValueDiv.attr('id', 'chart_div_filter_value_' + order);

                    selectFilterVisibility.attr('id', 'chart_field_filter_visibility_' + order);
                    selectFilterVisibility.attr('name', 'chart_field_filter_visibility_' + order);
                    selectFilterVisibilityDiv.attr('id', 'chart_div_filter_visibility_' + order);

                    resource_id.attr('id', 'resource_id_' + order);
                    resource_id.attr('name', 'resource_id_' + order);


                } else if (item.context.id.indexOf('text_box') >= 0) {

                    var description = item.find('[id*=text_box_description_]');
                    var size = item.find('[id*=text_box_size_]');

                    item.attr('id', 'text_box_' + order);

                    description.attr('id', 'text_box_description_' + order);
                    description.attr('name', 'text_box_description_' + order);

                    size.attr('id', 'text_box_size_' + order);
                    size.attr('name', 'text_box_size_' + order);

                }
            });
        }

        // Expose this function on window to be accessible in other files
        window.handleItemsOrder = handleItemsOrder;
    });

})($);