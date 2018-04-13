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
        },
    };

    function handleTickFormat(item_id) {

        var tick_count_name;
        var tick_format_name;

        if (item_id) {
            tick_count_name = $('[id=chart_field_tick_count_' + item_id + ']');
            tick_format_name = $('[id=chart_field_y_ticks_format_' + item_id + ']');
        } else {
            tick_count_name = $('[id*=chart_field_tick_count_]');
            tick_format_name = $('[id*=chart_field_y_ticks_format_]');
        }

        tick_count_name.change(function(event) {
            var selectValues = [{
                    'text': 'Decimal (1 digit) e.g 2.5',
                    'value': '.1f' },
                {
                    'text': 'Decimal (2 digit) e.g 2.50',
                    'value': '.2f'
                },
                {
                    'text': 'Decimal (3 digit) e.g 2.501',
                    'value': '.3f'
                },
                {
                    'text': 'Decimal (4 digit) e.g 2.5012',
                    'value': '.4f'
                },
                {
                    'text': 'Dolar e.g 2000$',
                    'value': '$'
                },
                {
                    'text': 'Rounded e.g 2k',
                    'value': 's'
                },
                {
                    'text': 'Percentage (multiply by 100) e.g 200000%',
                    'value': 'p'
                },
                {
                    'text': 'Comma (thousands separator) e.g 2,000',
                    'value': ','
                },
                {
                    'text': 'Binary e.g 11111010000',
                    'value': 'b'
                }
            ]

            var elem = $(this);

            if (elem.val() !== '') {
                populateOptionValues(tick_format_name, selectValues.slice(0, 3));
            } else {
                populateOptionValues(tick_format_name, selectValues);
            }
        })
    }

    function populateOptionValues(elem, values){
        elem.children('option:not(:first)').remove();

                $.each(values, function(key, v) {
                    elem
                        .append($("<option></option>")
                            .attr("value", v.value)
                            .text(v.text));
                });
    }

    function handleRenderedChartFilters(item_id) {

        var chart_filter_name_select;
        var chart_filter_value_select;

        if (item_id) {
            chart_filter_name_select = $('[id=chart_field_filter_name_' + item_id + ']');
        } else {
            chart_filter_name_select = $('[id*=chart_field_filter_name_]');
        }

        if (item_id) {
            chart_filter_value_select = $('[id=chart_field_filter_value_' + item_id + ']');
        } else {
            chart_filter_value_select = $('[id*=chart_field_filter_value_]');
        }

        chart_filter_name_select.change(function(event) {
            var elem = $(this);
            var chart_filter_name = elem.find(":selected").val();
            var filter_name_select_id = elem.attr('id');

            var chart_filter_value_select_id = filter_name_select_id.replace('name', 'value');
            var chart_filter_alias_input_id = filter_name_select_id.replace('name', 'alias');
            var chart_filter_visibility_id = chart_filter_value_select_id.replace('value', 'visibility');

            var chart_filter_value_div_id = chart_filter_value_select_id.replace('field', 'div');
            var chart_filter_alias_div_id = chart_filter_alias_input_id.replace('field', 'div');
            var chart_filter_visibility_div_id = chart_filter_visibility_id.replace('field', 'div');

            // Empty filter value select
            if ($('#' + chart_filter_value_select_id + ' option').length > 0) {
                $('#' + chart_filter_value_select_id).find('option').not(':first').remove();
            }

            if (chart_filter_name === '') {
                $('#' + chart_filter_value_select_id).prop('required', false);
                $('#' + chart_filter_alias_input_id).prop('required', false);
                $('#' + chart_filter_value_div_id).addClass('hidden');
                $('#' + chart_filter_alias_div_id).addClass('hidden');
                $('#' + chart_filter_visibility_div_id).addClass('hidden');
            } else {
                $('#' + chart_filter_value_select_id).prop('required', true);
                $('#' + chart_filter_alias_input_id).prop('required', true);
                $('#' + chart_filter_value_div_id).removeClass('hidden');
                $('#' + chart_filter_alias_div_id).removeClass('hidden');
                $('#' + chart_filter_visibility_div_id).removeClass('hidden');
            }
        });

        chart_filter_value_select.mousedown(function(event) {

            var elem = $(this);
            var chart_filter_value_select_id = elem.attr('id');
            var chart_filter_value = elem.find(":selected").val();
            var chart_filter_name_select_id = chart_filter_value_select_id.replace('value', 'name');
            var chart_filter_name = $('#' + chart_filter_name_select_id).find(":selected").val();
            var resource_input_id = chart_filter_value_select_id.replace('chart_field_filter_value', 'resource_id');
            var resource_id = $('#' + resource_input_id).val();
            var select_size = $(this).find("option").size();

            if (select_size <= 2) {

                api.post('get_filter_values', {
                    'resource_id': resource_id,
                    'filter_name': chart_filter_name,
                    'previous_filters': []
                }, false).done(function(data) {

                    $.each(data.result, function(idx, elem) {

                        if (chart_filter_value != elem) {
                            $('#' + chart_filter_value_select_id).append(new Option(elem, elem));
                        }
                    });
                });
            }

        });

    };

    $(document).ready(function() {
        handleRenderedChartFilters();
        handleImageItems();
        var visualizationItems = $('#visualization-settings-items');
        var vizForm = $('#visualizations-form');
        var sqlString = vizForm.data('sqlString');
        var chart_resource = vizForm.data('chartResource');
        var map_resource = vizForm.data('mapResource');
        var chooseYAxisColumn = $('#choose_y_axis_column');
        handleTickFormat();

        var viz_item = $('.item');
        // Only disable Save button if there aren't visualizations
        if (viz_item.length === 0) {
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
            // Send a message to update map when a new column is selected.
            // The JavaScript module "querytool-map" subscribes to this
            // event to update the map.
            ckan.sandbox().publish('querytool:updateMaps');
        });

        //delete dynamicly created textbox section
        $(document).on('click', '.delete-item-btn', function(el) {
            el.target.closest('.item').remove();
            handleItemsOrder();
            enableSave();
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
                ckan.sandbox().client.getTemplate('chart_item.html', {
                        n: items,
                        querytool: querytool,
                        chart_resource: chart_resource,
                        map_resource: map_resource,
                        sql_string: sqlString,
                        class: 'hidden'
                    })
                    .done(function(data) {
                        var item = visualizationItems.prepend(data);
                        ckan.module.initializeElement(item.find('div[data-module=querytool-viz-preview]')[0]);
                        handleRenderedChartFilters(items);
                        handleItemsOrder();
                        var axisY = $('[name*=chart_field_axis_y_]');
                        axisY.val(axisYValue);
                        enableSave();
                        handleTickFormat(items);
                    });
            } else if (visualization === 'map') {
                var axisYValue = chooseYAxisColumn.val();

                if (axisYValue === '$none$') {
                    alert('Please choose a value for y axis.');
                    return;
                }
                ckan.sandbox().client.getTemplate('map_item.html', {
                        n: items,
                        chart_resource: chart_resource,
                        sql_string: sqlString,
                        y_axis_column: axisYValue
                    })
                    .done(function(data) {
                        var item = visualizationItems.prepend(data);
                        ckan.module.initializeElement(item.find('div[data-module=querytool-map]')[0]);
                        handleItemsOrder();
                        enableSave();
                    });
            } else if (visualization == 'text-box') {
                ckan.sandbox().client.getTemplate('text_box_item.html', {
                        number: items
                    })
                    .done(function(data) {
                        var item = visualizationItems.prepend(data);
                        handleItemsOrder();
                        enableSave();
                    });
            } else if (visualization === 'image') {
                ckan.sandbox().client.getTemplate('image_item.html', {
                        n: items
                    })
                    .done(function(data) {
                        var item = visualizationItems.prepend(data);
                        handleImageItems(items);
                        handleItemsOrder();
                        enableSave();
                    });
            } else if (visualization === 'table') {
                var axisYValue = chooseYAxisColumn.val();

                if (axisYValue === '$none$') {
                    alert('Please choose a column for y axis.');
                    return;
                }
                ckan.sandbox().client.getTemplate('table_item.html', {
                        n: items,
                        sql_string : sqlString,
                        resource_id : chart_resource
                    })
                    .done(function(data) {
                        var item = visualizationItems.prepend(data);
                        ckan.module.initializeElement(item.find('div[data-module=querytool-table]')[0]);
                        handleItemsOrder();
                        enableSave();
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
            window.location.hash = el.id;
            window.scrollTo(0, el.offsetTop);
        });

        //enable or disable save button
        function enableSave() {
            var isEmpty = $('#visualization-settings-items').find('.item');
            var isDisabled = (isEmpty.length >= 1);
            $('#save-visualization-btn').attr('disabled', !isDisabled);
        }



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
                    var selectTickCount = item.find('[id*=chart_field_tick_count_]');
                    var inputChartSize = item.find('[id*=chart_field_size_]');
                    var selectFilterName = item.find('[id*=chart_field_filter_name_]');
                    var selectFilterValue = item.find('[id*=chart_field_filter_value_]');
                    var selectFilterValueDiv = item.find('[id*=chart_div_filter_value_]');
                    var selectFilterAlias = item.find('[id*=chart_field_filter_alias_]');
                    var selectFilterVAliasDiv = item.find('[id*=chart_div_filter_alias_]');
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

                    selectTickCount.attr('id', 'chart_field_tick_count_' + order);
                    selectTickCount.attr('name', 'chart_field_tick_count_' + order);

                    selectFilterValue.attr('id', 'chart_field_filter_value_' + order);
                    selectFilterValue.attr('name', 'chart_field_filter_value_' + order);
                    selectFilterValueDiv.attr('id', 'chart_div_filter_value_' + order);

                    selectFilterAlias.attr('id', 'chart_field_filter_alias_' + order);
                    selectFilterAlias.attr('name', 'chart_field_filter_alias_' + order);
                    selectFilterVAliasDiv.attr('id', 'chart_div_filter_alias_' + order);

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

                } else if (item.context.id.indexOf('image_item') >= 0) {
                    var url = item.find('[name*=media_image_url_]');
                    var size = item.find('[id*=image_field_size_]');
                    var upload = item.find('[name*=media_image_upload_]');
                    var clear = item.find('[name*=media_clear_upload_]');

                    item.attr('id', 'image_item_' + order);
                    url.attr('name', 'media_image_url_' + order);
                    size.attr('id', 'image_field_size_' + order);
                    size.attr('name', 'image_field_size_' + order);
                    upload.attr('name', 'media_image_upload_' + order);
                    clear.attr('name', 'media_clear_upload_' + order);

                } else if (item.context.id.indexOf('map_item') >= 0) {
                    var map_resource_url = item.find('[id*=map_resource_]');
                    var map_key_field = item.find('[id*=map_key_field_]');
                    var data_key_field = item.find('[id*=map_data_key_field_]');
                    var map_size = item.find('[id*=map_size_]');
                    var map_module = item.find('[id*=map_module_]');

                    item.attr('id', 'map_item_' + order);
                    map_resource_url.attr('id', 'map_resource_' + order);
                    map_resource_url.attr('name', 'map_resource_' + order);
                    map_key_field.attr('id', 'map_key_field_' + order);
                    map_key_field.attr('name', 'map_key_field_' + order);
                    data_key_field.attr('id', 'map_data_key_field_' + order);
                    data_key_field.attr('name', 'map_data_key_field_' + order);
                    map_size.attr('id', 'map_size_' + order);
                    map_size.attr('name', 'map_size_' + order);
                    map_module.attr('id', 'map_module_' + order);

                } else if (item.context.id.indexOf('table_item') >= 0) {
                    var table_size = item.find('[id*=table_size_]');
                    var table_main_value = item.find('[id*=table_main_value_]');


                    item.attr('id', 'map_item_' + order);

                    table_size.attr('id', 'table_size_' + order);
                    table_size.attr('name', 'table_size_' + order);

                    table_main_value.attr('id', 'table_main_value_' + order);
                    table_main_value.attr('name', 'table_main_value_' + order);
                }
            });
        }

        // Expose this function on window to be accessible in other files
        window.handleItemsOrder = handleItemsOrder;
    });

    function handleImageItems(item_id) {
        var contentContainer = $('#content-settings-items');
        var contentContainerChildren = contentContainer.children();
        //TODO:set uploadsEnabled from helper
        var uploadsEnabled = 'True';
        var fieldImageUrl;
        var fieldImageUpload;
        var imageUploadModule;
        var mediaImage;
        var mediaUpload;
        var image_url_inputs;
        var image_upload_inputs;
        var item = $('.image_item');

        if (item_id) {
            mediaImage = item.find('#field-image-url');
            mediaUpload = item.find('#field-image-upload');
            fieldImageUrl = 'media_image_url_' + item_id;
            fieldImageUpload = 'media_image_upload_' + item_id;


            if (uploadsEnabled == 'True') {

                imageUploadModule = item.find('[data-module="custom-image-upload"]');
                imageUploadModule.attr('data-module', 'image-upload');
                imageUploadModule.attr('data-module-field_upload', fieldImageUpload);
                imageUploadModule.attr('data-module-field_url', fieldImageUrl);

                mediaUpload.attr('name', fieldImageUpload);
            }

            mediaImage.attr('name', fieldImageUrl);

            ckan.module.initializeElement(imageUploadModule[0]);
        }

        if (item_id) {
            image_url_inputs = $('[name*=media_image_url_' + item_id + ']');
            image_upload_inputs = $('[name*=media_image_upload_' + item_id + ']');
        } else {
            image_url_inputs = $('[name*=media_image_url_]');
            image_upload_inputs = $('[name*=media_image_upload_]');
        }


        image_upload_inputs.on('change', function onMediaImageChange() {
            var elem = $(this);
            var image_upload_id = elem.attr('name');
            var image_id = image_upload_id.substr(image_upload_id.lastIndexOf('_') + 1);
            var imageUpload = $('#image_upload_' + image_id);

            imageUpload.val(elem.val());
        });

    }

})($);