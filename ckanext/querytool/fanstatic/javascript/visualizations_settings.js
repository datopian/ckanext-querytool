(function(_, jQuery) {
    'use strict';

    var api = {
        get: function(action, params, async) {
            var api_ver = 3;
            var base_url = ckan.sandbox().client.endpoint;
            params = $.param(params);
            var url = base_url + '/api/' + api_ver + '/action/' + action + '?' + params;
            if (!async) {
                $.ajaxSetup({
                    async: false
                });
            }
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
        getTemplate: function(filename, params, success, error) {

            var locale = $('html').attr('lang');
            var url = ckan.url(locale + '/api/1/util/snippet/' + encodeURIComponent(filename));

            // Allow function to be called without params argument.
            if (typeof params === 'function') {
                error = success;
                success = params;
                params = {};
            }

            return $.get(url, params || {}).then(success, error);
        }
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
            // TODO: what doesn this code do and when; bad duplication?
            var selectValues = [{
                    'text': _('Decimal (1 digit) e.g 2.5'),
                    'value': '.1f'
                },
                {
                    'text': _('Decimal (2 digit) e.g 2.50'),
                    'value': '.2f'
                },
                {
                    'text': _('Decimal (3 digit) e.g 2.501'),
                    'value': '.3f'
                },
                {
                    'text': _('Decimal (4 digit) e.g 2.5012'),
                    'value': '.4f'
                },
                {
                    'text': _('Currency e.g. $2,000'),
                    'value': '$'
                },
                {
                    'text': _('Rounded e.g 2k'),
                    'value': 's'
                },
                {
                    'text': _('Percentage (0 digit) e.g 25% for 0.25'),
                    'value': '.0%'
                },
                {
                    'text': _('Percentage (1 digit) e.g 25.1% for 0.251'),
                    'value': '.1%'
                },
                {
                    'text': _('Percentage (2 digit) e.g 25.12% for 0.2512'),
                    'value': '.2%'
                },
                {
                    'text': _('Comma thousands separator (0 digit) e.g 2,512'),
                    'value': ',.0f'
                },
                {
                    'text': _('Comma thousands separator (1 digit) e.g 2,512.3'),
                    'value': ',.1f'
                },
                {
                    'text': _('Comma thousands separator (2 digit) e.g 2,512.34'),
                    'value': ',.2f'
                },
            ]

            var elem = $(this);

            if (elem.val() !== '') {
                populateOptionValues(tick_format_name, selectValues.slice(0, 3));
            } else {
                populateOptionValues(tick_format_name, selectValues);
            }
        })
    }

    function populateOptionValues(elem, values) {
        elem.children('option:not(:first)').remove();

        $.each(values, function(key, v) {
            elem
                .append($("<option></option>")
                    .attr("value", v.value)
                    .text(v.text));
        });
    }

    function handleRenderedVizFilters(type, item_id) {

        var filter_name_select;
        var filter_value_select;

        if (item_id) {
            filter_name_select = $('[id=' + type + '_field_filter_name_' + item_id + ']');
        } else {
            filter_name_select = $('[id*=' + type + '_field_filter_name_]');
        }

        if (item_id) {
            filter_value_select = $('[id=' + type + '_field_filter_value_' + item_id + ']');
        } else {
            filter_value_select = $('[id*=' + type + '_field_filter_value_]');
        }

        filter_name_select.change(function(event) {
            var elem = $(this);
            var filter_name = elem.find(":selected").val();
            var filter_name_select_id = elem.attr('id');

            var filter_value_select_id = filter_name_select_id.replace('name', 'value');
            var filter_alias_input_id = filter_name_select_id.replace('name', 'alias');
            var filter_visibility_id = filter_value_select_id.replace('value', 'visibility');

            var filter_value_div_id = filter_value_select_id.replace('field', 'div');
            var filter_alias_div_id = filter_alias_input_id.replace('field', 'div');
            var filter_visibility_div_id = filter_visibility_id.replace('field', 'div');

            // Empty filter value select
            if ($('#' + filter_value_select_id + ' option').length > 0) {
                $('#' + filter_value_select_id).find('option').not(':first').remove();
            }

            if (filter_name === '') {
                $('#' + filter_value_select_id).prop('required', false);
                $('#' + filter_alias_input_id).prop('required', false);
                $('#' + filter_value_div_id).addClass('hidden');
                $('#' + filter_alias_div_id).addClass('hidden');
                $('#' + filter_visibility_div_id).addClass('hidden');
            } else {
                $('#' + filter_value_select_id).prop('required', true);
                $('#' + filter_alias_input_id).prop('required', true);
                $('#' + filter_value_div_id).removeClass('hidden');
                $('#' + filter_alias_div_id).removeClass('hidden');
                $('#' + filter_visibility_div_id).removeClass('hidden');
            }
        });

        filter_value_select.mousedown(function(event) {

            var elem = $(this);
            var filter_value_select_id = elem.attr('id');
            var filter_value = elem.find(":selected").val();
            var filter_name_select_id = filter_value_select_id.replace('value', 'name');
            var filter_name = $('#' + filter_name_select_id).find(":selected").val();
            var vizForm = $('#visualizations-form');
            var resource_id = vizForm.data('chartResource');
            var select_size = $(this).find("option").size();
            var vizForm = $('#visualizations-form');
            var mainFilters = vizForm.data('mainFilters');

            if (select_size <= 2) {

                api.get('get_filter_values', {
                    'resource_id': resource_id,
                    'filter_name': filter_name,
                    'previous_filters': JSON.stringify(mainFilters)
                }, false).done(function(data) {

                    $.each(data.result, function(idx, elem) {

                        if (filter_value != elem) {
                            $('#' + filter_value_select_id).append(new Option(elem, elem));
                        }
                    });
                });
            }

        });

    };

    function handleChartSortingField () {

        var category_name_select = $('[id*=chart_field_category_name_]');

        category_name_select.change(function(event) {
            var elem = $(this);
            var category_name = elem.find(":selected").val();
            var category_name_select_id = elem.attr('id');

            var sorting_select_div_id = category_name_select_id.replace('category_name', 'sort_div');

            if (category_name === '') {
                $('#' + sorting_select_div_id).removeClass('hidden');
            } else {
                $('#' + sorting_select_div_id).addClass('hidden');
            }

        });
    };

    function handleChartTitles () {
      // Provide variables support for titles
      $('.title textarea').change(function (ev) {
        var env = nunjucks.configure({tags: {variableStart: '{', variableEnd: '}'}});
        try {
          env.renderString($(ev.target).val(), {});
          ev.target.setCustomValidity('');
        } catch (error) {
          ev.target.setCustomValidity(_('Template is invalid'));
        }
      });
      $('.title-vars select').change(function (ev) {
        var select = $(ev.target);
        var textarea = select.closest('.item-wrapper').find('.control-group.title textarea');
        textarea.val(textarea.val() + select.val());
        select.val('');
      })
    };

    function handleMultipleSelect () {
      $('[id*=chart_field_static_reference_columns_]')
        // Skip already initialized
        .not('.select2-container')
        .not('.select2-offscreen')
        // Enable multiple select vidget
        .select2({
          placeholder: _('Click to select one or more'),
        })
        // Validate on changes
        .change(function (ev) {
          var measures = [];
          var static_reference_columns = $(this).val();
          for (const value of static_reference_columns || []) {
            const measure = value.split('|')[0];
            const column = value.split('|')[1];
            if (measures.includes(measure)) {
              ev.target.setCustomValidity(
                _('Static Reference Columns: maximum one column per measure'));
              return;
            }
            measures.push(measure);
          }
          ev.target.setCustomValidity('');
        })
    };

    $(document).ready(function() {
        handleChartSortingField();
        handleRenderedVizFilters('chart');
        handleRenderedVizFilters('map');
        handleRenderedVizFilters('table');
        handleImageItems();
        handleChartTitles();
        handleMultipleSelect();
        var visualizationItems = $('#visualization-settings-items');
        var vizForm = $('#visualizations-form');
        var sqlString = vizForm.data('sqlString');
        var chart_resource = vizForm.data('chartResource');
        var map_resource = vizForm.data('mapResource');
        var yAxisValues = vizForm.data('yAxisValues');
        var mainFiltersNames = vizForm.data('mainFiltersNames');
        var infoQueryFilters = vizForm.data('mainFilters');

        var chooseYAxisColumn = $('#choose_y_axis_column');
        handleTickFormat();

        $('#save-edit-data-btn').removeAttr('disabled');
        $('#save-visualization-btn').removeAttr('disabled');

        $('.save-visualization-btn').click(function(e) {
            var viz_items = $('.item');
            if (viz_items.length === 0) {
                e.preventDefault();
                alert(_('Please create at least one visualization.'));
            }
        });

        chooseYAxisColumn.change(function(event) {
            // Update the hidden inputs for the y axis
            var axisY = $('[name*=chart_field_axis_y_]');
            axisY.val(event.target.value);

            // Send a message to update charts,tables and maps when a new column is selected.
            // The JavaScript modules "querytool-viz-preview","table-module" and "map-module" subscribes to this
            // event to update the visualizations.
            ckan.sandbox().publish('querytool:updateCharts');
            ckan.sandbox().publish('querytool:updateMaps');
            ckan.sandbox().publish('querytool:updateTables');

        });

        //delete dynamicly created textbox section
        $(document).on('click', '.delete-item-btn', function(el) {
            el.target.closest('.item').remove();
            handleItemsOrder();
        });

        var createVisualization = $('#add-visualization-btn');
        createVisualization.on('click', function() {
            $.proxyAll(this, /_on/);

            var visualization = $('#item_type').val();
            var item = $('.item');
            var items = item.length + 1;
            var axisYValue = chooseYAxisColumn.val();
            var measureLabel = $('#choose_y_axis_column option:selected').text();

            if (visualization === 'chart') {

                //TODO: parse query params simple
                var querytool = window.location.href.substr(window.location.href.lastIndexOf('/') + 1).split("?")[0];
                api.getTemplate('chart_item.html', {
                        n: items,
                        querytool: querytool,
                        chart_resource: chart_resource,
                        map_resource: map_resource,
                        sql_string: sqlString,
                        y_axis_values: yAxisValues,
                        main_filters: mainFiltersNames,
                        info_query_filters: JSON.stringify(infoQueryFilters),
                        measure_label: measureLabel,
                    })
                    .done(function(data) {
                        var item = visualizationItems.prepend(data);
                        ckan.module.initializeElement(item.find('div[data-module=querytool-viz-preview]')[0]);
                        handleRenderedVizFilters('chart', items);
                        handleItemsOrder();
                        handleChartSortingField();
                        handleChartTitles();
                        handleMultipleSelect();
                        var axisY = $('[name*=chart_field_axis_y_]');
                        axisY.val(axisYValue);
                        handleTickFormat(items);
                        handleChartOptions();
                    });
            } else if (visualization === 'map') {

                api.getTemplate('map_item.html', {
                        n: items,
                        chart_resource: chart_resource,
                        sql_string: sqlString,
                        y_axis_column: axisYValue,
                        y_axis_values: yAxisValues,
                        main_filters: mainFiltersNames
                    })
                    .done(function(data) {
                        var item = visualizationItems.prepend(data);
                        ckan.module.initializeElement(item.find('div[data-module=querytool-map]')[0]);
                        handleRenderedVizFilters('map', items);
                        handleItemsOrder();
                    });
            } else if (visualization == 'text-box') {
                api.getTemplate('text_box_item.html', {
                        number: items
                    })
                    .done(function(data) {
                        var item = visualizationItems.prepend(data);
                        handleItemsOrder();
                    });
            } else if (visualization === 'image') {
                api.getTemplate('image_item.html', {
                        n: items
                    })
                    .done(function(data) {
                        var item = visualizationItems.prepend(data);
                        handleImageItems(items);
                        handleItemsOrder();
                    });
            } else if (visualization === 'table') {

                api.getTemplate('table_item.html', {
                        n: items,
                        sql_string: sqlString,
                        resource_id: chart_resource,
                        y_axis: axisYValue,
                        y_axis_values: yAxisValues,
                        main_filters: mainFiltersNames

                    })
                    .done(function(data) {
                        var item = visualizationItems.prepend(data);
                        ckan.module.initializeElement(item.find('div[data-module=querytool-table]')[0]);
                        handleRenderedVizFilters('table', items);
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
            window.location.hash = el.id;
            window.scrollTo(0, el.offsetTop);
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
                    var checkboxShowValuesAsPercentages = item.find('[id*=chart_field_show_labels_as_percentages_]');
                    var inputTooltipName = item.find('[id*=chart_field_tooltip_name_]');
                    var selectDataFormat = item.find('[id*=chart_field_data_format_]');
                    var selectTickFormatAxisY = item.find('[id*=chart_field_y_ticks_format_]');
                    var inputLabelAxisY = item.find('[id*=chart_field_y_label_]');
                    var inputYLabelHide = item.find('[id*=chart_field_y_label_hide_]');
                    var inputYFromZero = item.find('[id*=chart_field_y_from_zero_]');
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
                    var selectStaticReferenceColumns = item.find('[id*=chart_field_static_reference_columns_]');
                    var inputStaticReferenceLabel = item.find('[id*=chart_field_static_reference_label_]');
                    var selectDynamicReferenceType = item.find('[id*=chart_field_dynamic_reference_type_]');
                    var inputDynamicReferenceFactor = item.find('[id*=chart_field_dynamic_reference_factor_]');
                    var inputDynamicReferenceLabel = item.find('[id*=chart_field_dynamic_reference_label_]');

                    var inputChartPaddingLeft = item.find('[id*=chart_field_chart_padding_left_]');
                    var inputChartPaddingBottom = item.find('[id*=chart_field_chart_padding_bottom_]');
                    var checkboxXLabelMultiline = item.find('[id*=chart_field_x_text_multiline_]');
                    var inputXTickCullingMax = item.find('[id*=chart_field_x_tick_culling_max_]');

                    var selectCategoryName = item.find('[id*=chart_field_category_name_]');

                    var resourceId = item.find('[id*=resource_id_]');
                    var dataSort = item.find('[id*=chart_field_sort_]');
                    var dataSortDiv = item.find('[id*=chart_field_sort_div_]');

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

                    checkboxShowValuesAsPercentages.attr('id', 'chart_field_show_labels_as_percentages_' + order);
                    checkboxShowValuesAsPercentages.attr('name', 'chart_field_show_labels_as_percentages_' + order);

                    inputTooltipName.attr('id', 'chart_field_tooltip_name_' + order);
                    inputTooltipName.attr('name', 'chart_field_tooltip_name_' + order);

                    selectDataFormat.attr('id', 'chart_field_data_format_' + order);
                    selectDataFormat.attr('name', 'chart_field_data_format_' + order);

                    selectTickFormatAxisY.attr('id', 'chart_field_y_ticks_format_' + order);
                    selectTickFormatAxisY.attr('name', 'chart_field_y_ticks_format_' + order);

                    inputLabelAxisY.attr('id', 'chart_field_y_label_' + order);
                    inputLabelAxisY.attr('name', 'chart_field_y_label_' + order);

                    inputYLabelHide.attr('id', 'chart_field_y_label_hide_' + order);
                    inputYLabelHide.attr('name', 'chart_field_y_label_hide_' + order);

                    inputYFromZero.attr('id', 'chart_field_y_from_zero_' + order);
                    inputYFromZero.attr('name', 'chart_field_y_from_zero_' + order);

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

                    selectStaticReferenceColumns.attr('id', 'chart_field_static_reference_columns_' + order);
                    selectStaticReferenceColumns.attr('name', 'chart_field_static_reference_columns_' + order);

                    inputStaticReferenceLabel.attr('id', 'chart_field_static_reference_label_' + order);
                    inputStaticReferenceLabel.attr('name', 'chart_field_static_reference_label_' + order);

                    selectDynamicReferenceType.attr('id', 'chart_field_dynamic_reference_type_' + order);
                    selectDynamicReferenceType.attr('name', 'chart_field_dynamic_reference_type_' + order);

                    inputDynamicReferenceFactor.attr('id', 'chart_field_dynamic_reference_factor_' + order);
                    inputDynamicReferenceFactor.attr('name', 'chart_field_dynamic_reference_factor_' + order);

                    inputDynamicReferenceLabel.attr('id', 'chart_field_dynamic_reference_label_' + order);
                    inputDynamicReferenceLabel.attr('name', 'chart_field_dynamic_reference_label_' + order);

                    resourceId.attr('id', 'resource_id_' + order);
                    resourceId.attr('name', 'resource_id_' + order);

                    selectCategoryName.attr('id', 'chart_field_category_name_' + order);
                    selectCategoryName.attr('name', 'chart_field_category_name_' + order);

                    dataSort.attr('id', 'chart_field_sort_' + order);
                    dataSort.attr('name', 'chart_field_sort_' + order);
                    dataSortDiv.attr('id', 'chart_field_sort_div_' + order);

                    inputChartPaddingLeft.attr('id', 'chart_field_chart_padding_left_' + order);
                    inputChartPaddingLeft.attr('name', 'chart_field_chart_padding_left_' + order);

                    inputChartPaddingBottom.attr('id', 'chart_field_chart_padding_bottom_' + order);
                    inputChartPaddingBottom.attr('name', 'chart_field_chart_padding_bottom_' + order);

                    checkboxXLabelMultiline.attr('id', 'chart_field_x_text_multiline_' + order);
                    checkboxXLabelMultiline.attr('name', 'chart_field_x_text_multiline_' + order);

                    inputXTickCullingMax.attr('id', 'chart_field_x_tick_culling_max_' + order);
                    inputXTickCullingMax.attr('name', 'chart_field_x_tick_culling_max_' + order);


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
                    var map_title_field = item.find('[id*=map_title_field_]');
                    var map_key_field = item.find('[id*=map_key_field_]');
                    var data_key_field = item.find('[id*=map_data_key_field_]');
                    var map_color_scheme = item.find('[id*=map_color_scheme_]');
                    var map_size = item.find('[id*=map_size_]');
                    var map_module = item.find('[id*=map_module_]');

                    var selectMapFilterName = item.find('[id*=map_field_filter_name_]');
                    var selectMapFilterValue = item.find('[id*=map_field_filter_value_]');
                    var selectMapFilterValueDiv = item.find('[id*=map_div_filter_value_]');
                    var selectMapFilterAlias = item.find('[id*=map_field_filter_alias_]');
                    var selectMapFilterVAliasDiv = item.find('[id*=map_div_filter_alias_]');
                    var selectMapFilterVisibility = item.find('[id*=map_field_filter_visibility_]');
                    var selectMapFilterVisibilityDiv = item.find('[id*=map_div_filter_visibility_]');

                    item.attr('id', 'map_item_' + order);
                    map_resource_url.attr('id', 'map_resource_' + order);
                    map_resource_url.attr('name', 'map_resource_' + order);
                    map_title_field.attr('id', 'map_title_field_' + order);
                    map_title_field.attr('name', 'map_title_field_' + order);
                    map_key_field.attr('id', 'map_key_field_' + order);
                    map_key_field.attr('name', 'map_key_field_' + order);
                    data_key_field.attr('id', 'map_data_key_field_' + order);
                    data_key_field.attr('name', 'map_data_key_field_' + order);
                    map_color_scheme.attr('id', 'map_color_scheme_' + order);
                    map_color_scheme.attr('name', 'map_color_scheme_' + order);
                    map_size.attr('id', 'map_size_' + order);
                    map_size.attr('name', 'map_size_' + order);
                    map_module.attr('id', 'map_module_' + order);

                    selectMapFilterName.attr('id', 'map_field_filter_name_' + order);
                    selectMapFilterName.attr('name', 'map_field_filter_name_' + order);

                    selectMapFilterValue.attr('id', 'map_field_filter_value_' + order);
                    selectMapFilterValue.attr('name', 'map_field_filter_value_' + order);
                    selectMapFilterValueDiv.attr('id', 'map_div_filter_value_' + order);

                    selectMapFilterAlias.attr('id', 'map_field_filter_alias_' + order);
                    selectMapFilterAlias.attr('name', 'map_field_filter_alias_' + order);
                    selectMapFilterVAliasDiv.attr('id', 'map_div_filter_alias_' + order);

                    selectMapFilterVisibility.attr('id', 'map_field_filter_visibility_' + order);
                    selectMapFilterVisibility.attr('name', 'map_field_filter_visibility_' + order);
                    selectMapFilterVisibilityDiv.attr('id', 'map_div_filter_visibility_' + order);

                } else if (item.context.id.indexOf('table_item') >= 0) {
                    var table_size = item.find('[id*=table_size_]');
                    var table_data_format = item.find('[id*=table_data_format_]');
                    var table_main_value = item.find('[id*=table_main_value_]');
                    var table_category_name = item.find('[id*=table_category_name_]');
                    var table_title = item.find('[id*=table_field_title_]');

                    var selectTableFilterName = item.find('[id*=table_field_filter_name_]');
                    var selectTableFilterValue = item.find('[id*=table_field_filter_value_]');
                    var selectTableFilterValueDiv = item.find('[id*=table_div_filter_value_]');
                    var selectTableFilterAlias = item.find('[id*=table_field_filter_alias_]');
                    var selectTableFilterVAliasDiv = item.find('[id*=table_div_filter_alias_]');
                    var selectTableFilterVisibility = item.find('[id*=table_field_filter_visibility_]');
                    var selectTableFilterVisibilityDiv = item.find('[id*=table_div_filter_visibility_]');

                    item.attr('id', 'table_item_' + order);

                    table_size.attr('id', 'table_size_' + order);
                    table_size.attr('name', 'table_size_' + order);

                    table_data_format.attr('id', 'table_data_format_' + order);
                    table_data_format.attr('name', 'table_data_format_' + order);

                    table_main_value.attr('id', 'table_main_value_' + order);
                    table_main_value.attr('name', 'table_main_value_' + order);

                    table_category_name.attr('id', 'table_category_name_' + order);
                    table_category_name.attr('name', 'table_category_name_' + order);

                    table_title.attr('id', 'table_field_title_' + order);
                    table_title.attr('name', 'table_field_title_' + order);

                    selectTableFilterName.attr('id', 'table_field_filter_name_' + order);
                    selectTableFilterName.attr('name', 'table_field_filter_name_' + order);

                    selectTableFilterValue.attr('id', 'table_field_filter_value_' + order);
                    selectTableFilterValue.attr('name', 'table_field_filter_value_' + order);
                    selectTableFilterValueDiv.attr('id', 'table_div_filter_value_' + order);

                    selectTableFilterAlias.attr('id', 'table_field_filter_alias_' + order);
                    selectTableFilterAlias.attr('name', 'table_field_filter_alias_' + order);
                    selectTableFilterVAliasDiv.attr('id', 'table_div_filter_alias_' + order);

                    selectTableFilterVisibility.attr('id', 'table_field_filter_visibility_' + order);
                    selectTableFilterVisibility.attr('name', 'table_field_filter_visibility_' + order);
                    selectTableFilterVisibilityDiv.attr('id', 'table_div_filter_visibility_' + order);
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

})(ckan.i18n.ngettext, $);

$(document).on('show','.accordion', function (e) {
    //$('.accordion-heading i').toggleClass(' ');
    $(e.target).prev('.accordion-heading').addClass('accordion-opened');
});

$(document).on('hide','.accordion', function (e) {
   $(this).find('.accordion-heading').not($(e.target)).removeClass('accordion-opened');
   //$('.accordion-heading i').toggleClass('fa-chevron-right fa-chevron-down');
});

// Locate all chart type select elements and add change event listener:
function handleChartOptions() {
  $('select[id^=chart_field_graph_]').each(function() {
    $(this).change(function() {
      var id = $(this).attr('id');
      // Handle 'category' option:
      var categoryField = $('#chart_field_category_name_' + id[id.length - 1]);
      if (['sbar', 'shbar', 'donut', 'pie'].includes($(this).val())) {
        categoryField.prop('value', '');
        categoryField.prop('disabled', true);
      } else {
        categoryField.prop('disabled', false);
      }

      // Handle 'Max number of text labels' option:
      var xTickCullingMaxField = $('#chart_field_x_tick_culling_max_' + id[id.length - 1]);
      if (['bar', 'hbar', 'sbar', 'shbar', 'pie', 'donut'].includes($(this).val())) {
        xTickCullingMaxField.prop('disabled', true);
      } else {
        xTickCullingMaxField.prop('disabled', false);
      }

      // Handle 'Show labels as percentages' option:
      // Handle chart options for pie and donut charts:
      var showLabelsAsPercentagesField = $('#chart_field_show_labels_as_percentages_' + id[id.length - 1]);
      var xTextRotateField = $('#chart_field_x_text_rotate_' + id[id.length - 1]);
      var xTextMultilineField = $('#chart_field_x_text_multiline_' + id[id.length - 1]);
      var yLabelField = $('#chart_field_y_label_' + id[id.length - 1]);
      var yLabelHideField = $('#chart_field_y_label_hide_' + id[id.length - 1]);
      var yFromZeroField = $('#chart_field_y_from_zero_' + id[id.length - 1]);
      var yTicksFormatField = $('#chart_field_y_ticks_format_' + id[id.length - 1]);
      var dataFormatField = $('#chart_field_data_format_' + id[id.length - 1]);
      var labelsField = $('#chart_field_labels_' + id[id.length - 1]);
      var staticReferenceColumnsField = $('#chart_field_static_reference_columns_' + id[id.length - 1]);
      var staticReferenceLabelField = $('#chart_field_static_reference_label_' + id[id.length - 1]);
      var dynamicReferenceTypeField = $('#chart_field_dynamic_reference_type_' + id[id.length - 1]);
      var dynamicReferenceFactor = $('#chart_field_dynamic_reference_factor_' + id[id.length - 1]);
      var dynamicReferenceLabel = $('#chart_field_dynamic_reference_label_' + id[id.length - 1]);
      if (['pie', 'donut'].includes($(this).val())) {
        showLabelsAsPercentagesField.prop('disabled', false);
        xTextRotateField.prop('disabled', true);
        xTextMultilineField.prop('disabled', true);
        yLabelField.prop('disabled', true);
        yLabelHideField.prop('disabled', true);
        yFromZeroField.prop('disabled', true);
        yTicksFormatField.prop('disabled', true);
        dataFormatField.prop('disabled', true);
        labelsField.prop('disabled', true);
        staticReferenceColumnsField.prop('disabled', true);
        staticReferenceLabelField.prop('disabled', true);
        dynamicReferenceTypeField.prop('disabled', true);
        dynamicReferenceFactor.prop('disabled', true);
        dynamicReferenceLabel.prop('disabled', true);
      } else {
        showLabelsAsPercentagesField.prop('disabled', true);
        showLabelsAsPercentagesField.prop('checked', false);
        xTextRotateField.prop('disabled', false);
        xTextMultilineField.prop('disabled', false);
        yLabelField.prop('disabled', false);
        yLabelHideField.prop('disabled', false);
        yFromZeroField.prop('disabled', false);
        yTicksFormatField.prop('disabled', false);
        dataFormatField.prop('disabled', false);
        labelsField.prop('disabled', false);
        staticReferenceColumnsField.prop('disabled', false);
        staticReferenceLabelField.prop('disabled', false);
        dynamicReferenceTypeField.prop('disabled', false);
        dynamicReferenceFactor.prop('disabled', false);
        dynamicReferenceLabel.prop('disabled', false);
      }
    });
  });
};

$(document).ready(function() {
  handleChartOptions();
});
