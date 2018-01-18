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
        post: function(action, data) {
            var api_ver = 3;
            var base_url = ckan.sandbox().client.endpoint;
            var url = base_url + '/api/' + api_ver + '/action/' + action;
            return $.post(url, JSON.stringify(data), 'json');
        }
    };

    function handleRenderedFilters(item_id, resource_id) {

        var filter_name_select;
        var filter_value_select_id;

        if (item_id) {
            filter_name_select = $('[id=data_filter_name_' + item_id + ']');
        } else {
            filter_name_select = $('[id*=data_filter_name_]');
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


            var id;
            if (resource_id) {
                id = resource_id;
            } else {
                id = $('#' + resource_input_id).val();
            }

            api.post('get_filter_values', {
                'resource_id': id,
                'filter_name': filter_name
            }).done(function(data) {

                $.each(data.result, function(idx, elem) {
                    $('#' + filter_value_select_id).append(new Option(elem, elem));
                });
                $('.' + filter_value_select_id).removeClass('hidden');
                $('.' + filter_alias_input_id).removeClass('hidden');

            });

        });

    }

    $(document).ready(function() {

        handleRenderedFilters();

        var datasetField = $('#field-datasets');
        var chartResourceSelect = $('#chart_resource');
        var mapResourceSelect = $('#map_resource');

        datasetField.change(function(event) {
            $('#main-filters').html('');
            get_dataset_resources(this.value);
        });

        chartResourceSelect.change(function(event) {
            $('#main-filters').html('');
        });

        var add_filter_button = $('#add-filter-button');
        var remove_filter_button = $('.remove-filter-item-btn');

        remove_filter_button.on('click', function(e) {
            $(e.target).parent().remove();
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
                }).done(function(data) {

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
                                $(e.target).parent().remove();
                            });

                            handleRenderedFilters(total_items, resource.id);

                        });
                });
            });

        });

        function get_dataset_resources(dataset_name) {
            chartResourceSelect.attr('disabled', 'true');
            mapResourceSelect.attr('disabled', 'true');

            chartResourceSelect.empty();
            mapResourceSelect.empty();

            api.get('package_show', {id: dataset_name})
                .done(function(data) {
                    var resources = data.result.resources;
                    var dataset_resources = resources.map(function(res) {
                        return {
                            id: res.id,
                            name: res.name
                        }
                    });

                    chartResourceSelect.removeAttr('disabled');
                    mapResourceSelect.removeAttr('disabled');

                    $.each(dataset_resources, function(i, res) {
                        chartResourceSelect.append($('<option></option>')
                         .attr('value', res.id).text(res.name));
                         mapResourceSelect.append($('<option></option>')
                         .attr('value', res.id).text(res.name));
                    });
                });
        }

    });
})($);
