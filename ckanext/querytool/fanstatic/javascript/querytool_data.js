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

    function _getPreviousFilters(element_id) {

        var filter_items = $('#' + element_id).prevAll();
        var filters = [];
        var name = '';
        var value = '';

        $.each(filter_items, function(idx, elem) {

            name = $(elem).find('[id*=data_filter_name_]').find(":selected").val();
            value = $(elem).find('[id*=data_filter_value_]').find(":selected").val();
            filters.push({
                'name': name,
                'value': value
            });
        });
        return filters;
    };

    function _clearDependentFilters(element_id) {

        var filter_items = $('#' + element_id).nextAll();

        $.each(filter_items, function(idx, elem) {

            $(elem).find('[id*=data_filter_value_]').find('option').not(':first').remove();

        });
    };

    function _handleFilterItemsOrder() {

        var filter_items = $('.filter_item');

        $.each(filter_items, function(i, item) {
            item = $(item);

            var order = i + 1;
            var selectFilterName = item.find('[id*=data_filter_name_]');
            var selectFilterValue = item.find('[id*=data_filter_value_]');
            var inputFilterAlias = item.find('[id*=data_filter_alias_]');
            var selectFilterVisibility = item.find('[id*=data_filter_visibility_]');

            item.attr('id', 'filter_item_' + order);

            selectFilterName.attr('id', 'data_filter_name_' + order);
            selectFilterName.attr('name', 'data_filter_name_' + order);

            selectFilterValue.attr('id', 'data_filter_value_' + order);
            selectFilterValue.attr('name', 'data_filter_value_' + order);

            inputFilterAlias.attr('id', 'data_filter_alias_' + order);
            inputFilterAlias.attr('name', 'data_filter_alias_' + order);

            selectFilterVisibility.attr('id', 'data_filter_visibility_' + order);
            selectFilterVisibility.attr('name', 'data_filter_visibility_' + order);

        });
    };


    function handleRenderedFilters(item_id, resource_id) {

        var filter_name_select;
        var filter_value_select;
        var filter_value_select_id;

        if (item_id) {
            filter_name_select = $('[id=data_filter_name_' + item_id + ']');
        } else {
            filter_name_select = $('[id*=data_filter_name_]');
        }

        if (item_id) {
            filter_value_select = $('[id=data_filter_value_' + item_id + ']');
        } else {
            filter_value_select = $('[id*=data_filter_value_]');
        }

        filter_name_select.change(function(event) {
            var elem = $(this);
            var filter_name = elem.find(":selected").val();
            var filter_name_select_id = elem.attr('id');

            filter_value_select_id = filter_name_select_id.replace('name', 'value');
            var filter_alias_input_id = filter_value_select_id.replace('value', 'alias');
            var resource_input_id = filter_name_select_id.replace('data_filter_name', 'resource_id');

            // Empty child fields
            if ($('#' + filter_value_select_id + ' option').length > 0)
                $('#' + filter_value_select_id).find('option').not(':first').remove();
            $('#' + filter_alias_input_id).val('');

            $('.' + filter_value_select_id).removeClass('hidden');
            $('.' + filter_alias_input_id).removeClass('hidden');

        });

        filter_value_select.mousedown(function(event) {

            var elem = $(this);
            var filter_value_select_id = elem.attr('id');
            var filter_value = elem.find(":selected").val();

            var filter_item_id = filter_value_select_id.replace('data_filter_value', 'filter_item')

            var previous_filters = _getPreviousFilters(filter_item_id);

            var filter_name_select_id = filter_value_select_id.replace('value', 'name');
            var filter_name = $('#' + filter_name_select_id).find(":selected").val();

            var resource_input_id = filter_name_select_id.replace('data_filter_name', 'resource_id');
            var select_size = $(this).find("option").size();

            var id;
            if (resource_id) {
                id = resource_id;
            } else {
                id = $('#' + resource_input_id).val();
            }

            if (select_size <= 2) {

                api.post('get_filter_values', {
                    'resource_id': id,
                    'filter_name': filter_name,
                    'previous_filters': previous_filters
                }, false).done(function(data) {

                    $.each(data.result, function(idx, elem) {

                        if (filter_value != elem) {
                            $('#' + filter_value_select_id).append(new Option(elem, elem));
                        }
                    });
                }).error(function(err){
                    console.log("Error " + err);
                });
            }
        });

        filter_value_select.change(function(event) {

            var elem = $(this);
            var filter_value_select_id = elem.attr('id');
            var filter_item_id = filter_value_select_id.replace('data_filter_value', 'filter_item')

            _clearDependentFilters(filter_item_id);

        });
    };

    function _handleQuerytoolItemsOrder() {

        var querytool_items = $('.related-query-item');

        $.each(querytool_items, function(i, item) {
            item = $(item);

            var order = i + 1;
            var selectQuerytoolName = item.find('[id*=field-related-querytool_]');

            item.attr('id', 'querytool_item_' + order);
            selectQuerytoolName.attr('id', 'field-related-querytool_' + order);
            selectQuerytoolName.attr('name', 'related_querytool_' + order);

        });
    };

    function handleRenderedQuerytools(item_id) {

        var querytool_name_select;

        if (item_id) {
            querytool_name_select = $('[id=field-related-querytool_' + item_id + ']');
        } else {
            querytool_name_select = $('[id*=field-related-querytool_]');
        }

        querytool_name_select.mousedown(function(event) {

            var elem = $(this);
            var querytool_name_select_id = elem.attr('id');
            var selected = elem.find(":selected").val();

            var querytool_item_id = querytool_name_select_id.replace('field-related-querytool', 'related-query-item')
            var selected_querytools = _getSelectedQuerytools(querytool_item_id);
            var select_size = $(this).find("option").size();

            if (select_size <= 2) {

                api.post('get_available_querytools', {
                    'exclude': selected_querytools
                }, false).done(function(data) {

                    $.each(data.result, function(idx, elem) {

                        if (selected != elem.name) {
                            $('#' + querytool_name_select_id).append(new Option(elem.name, elem.name));
                        }

                    });
                });
            }
        });

        querytool_name_select.change(function(event) {
            var elem = $(this);
            var querytool_name_select_id = elem.attr('id');
            var edit_querytool_btn_id = querytool_name_select_id.replace('field-related-querytool', 'edit-querytool-item-btn');
            $('#' + edit_querytool_btn_id).addClass('hidden')
        });

        // Remove item event handler
        var removeRenderedQuerytool = $('.remove-querytool-item-btn');
        removeRenderedQuerytool.on('click', function(e) {
            $(e.target).closest('.related-query-item').remove();
            _handleQuerytoolItemsOrder();
        });
    };


    function handlePrivacyForType(element) {

        var type = element.find(":selected").val();
        if (type == 'related') {
            $('#field-private').val('True').change().prop('disabled', 'disabled');
            $('#related_querytools').html('');
            $('#add-querytool-button').addClass('hidden');
        } else {
            $('#field-private').prop('disabled', false);
            $('#add-querytool-button').removeClass('hidden');
        }
    }

    function _getSelectedQuerytools(querytool_item_id) {

        var querytool_items = $('.related-query-item');
        var querytools = [];

        $.each(querytool_items, function(idx, elem) {
            if ($(elem).attr('id') != querytool_item_id) {
                var querytool = $(elem).find('[id*=field-related-querytool_]').find(":selected").val();
                querytools.push(querytool);
            }
        });
        return querytools
    };

    $(document).ready(function() {

        handleRenderedFilters();
        handleRenderedQuerytools();
        var typeField = $('#field-type');
        handlePrivacyForType(typeField);

        var datasetField = $('#field-datasets');
        var chartResourceSelect = $('#chart_resource');
        var yAxisColumnsResults = $('#y-axis-columns-results');
        var yAxisColumnsNotice = $('#y-axis-columns-notice');
        var yAxisColumnsContainer = $('#y-axis-columns-container');

        var defaultDataset = datasetField.find("option:first")[0].value;
        var defaultResource = chartResourceSelect.find("option:first")[0];

        typeField.change(function(event) {
            var elem = $(this);
            handlePrivacyForType(elem);
        });

        if (!defaultResource) {
            get_dataset_resources(defaultDataset);
        }

        datasetField.change(function(event) {
            $('#main-filters').html('');
            get_dataset_resources(this.value);
            yAxisColumnsResults.html('');
            yAxisColumnsNotice.text('Please choose a chart resource to see available columns.');
            yAxisColumnsNotice.css('display', 'block');
            yAxisColumnsContainer.css('display', 'none');
        });

        chartResourceSelect.change(function(event) {
            $('#main-filters').html('');

            yAxisColumnsResults.html('');
            yAxisColumnsNotice.text('');
            yAxisColumnsContainer.css('display', 'none');
            populateYAxisColumns(event.target.value);
        });

        var add_filter_button = $('#add-filter-button');
        var remove_filter_button = $('.remove-filter-item-btn');

        remove_filter_button.on('click', function(e) {
            $(e.target).closest('.filter_item').remove();
            _handleFilterItemsOrder();
        });

        add_filter_button.click(function(event) {
            event.preventDefault();
            var resource_id = chartResourceSelect.val();
            api.get('resource_show', {
                'id': resource_id
            }).done(function(data) {
                var resource = data.result;

                api.post('get_resource_fields', {
                    'resource': resource
                }, true).done(function(data) {

                    var active_filters = data.result.toString();
                    var filter_items = $('.filter_item');
                    var total_items = filter_items.length + 1;

                    ckan.sandbox().client.getTemplate('filter_item.html', {
                            active_filters: active_filters,
                            n: total_items,
                            resource_id: resource.id,
                            class: 'hidden'
                        })
                        .done(function(data) {

                            $('#main-filters').append(data);

                            // Remove item event handler
                            var removeMediaItemBtn = $('.remove-filter-item-btn');
                            removeMediaItemBtn.on('click', function(e) {
                                $(e.target).closest('.filter_item').remove();
                                _handleFilterItemsOrder();
                            });

                            handleRenderedFilters(total_items, resource.id);

                        });
                });
            });

        });

        var add_querytool_button = $('#add-querytool-button');
        add_querytool_button.click(function(event) {

            event.preventDefault();
            var querytool_items = $('.related-query-item');

            if (querytool_items.length < 3) {
                var total_querytools = querytool_items.length + 1;

                ckan.sandbox().client.getTemplate('related_querytool_item.html', {
                        n: total_querytools
                    })
                    .done(function(data) {

                        $('#related_querytools').append(data);
                        handleRenderedQuerytools(total_querytools);
                    });
            } else {
                alert('Maximum number of allowed related queries reached.');
            }

        });

        function get_dataset_resources(dataset_name) {

            chartResourceSelect.attr('disabled', 'true');
            chartResourceSelect.empty();

            api.get('package_show', {
                    id: dataset_name
                })
                .done(function(data) {
                    var resources = data.result.resources;
                    var dataset_resources = resources.map(function(res) {
                        return {
                            id: res.id,
                            name: res.name
                        }
                    });

                    chartResourceSelect.removeAttr('disabled');
                    chartResourceSelect.append($('<option></option>').attr('value', '').text('-- Choose resource --'));

                    $.each(dataset_resources, function(i, res) {
                        var name = res.name || 'Unnamed resource';
                        chartResourceSelect.append($('<option></option>')
                            .attr('value', res.id).text(name));
                    });
                });
        }

        function populateYAxisColumns(value) {
            api.get('querytool_get_resource_columns', {
                    res_id: value
                })
                .done(function(response) {
                    if (response.success) {
                        if (response.result.length > 0) {
                            yAxisColumnsContainer.css('display', 'block');
                            response.result.forEach(function(item, i) {
                                var element = [
                                    '<li class="checkbox-marked">',
                                    '<input name="y_axis_column_' + item + '" id="y_axis_column_' + item + '" type="checkbox" value="' + item + '" />',
                                    '<label for="y_axis_column_' + item + '">' + item + '</label>',
                                    '</li>'
                                ].join('');

                                yAxisColumnsResults.append(element);
                            });
                        } else {
                            yAxisColumnsNotice.css('display', 'block');
                            yAxisColumnsNotice.text('No columns retrieved.');
                        }
                    } else {
                        yAxisColumnsNotice.css('display', 'block');
                        yAxisColumnsNotice.text('An error occured while getting columns.');
                    }
                })
                .error(function(error) {
                    yAxisColumnsNotice.css('display', 'block');
                    yAxisColumnsNotice.text('An error occured while getting columns.');
                });
        }

    });
})($);
