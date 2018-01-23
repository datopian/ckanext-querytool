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
        var chart_resource = vizForm.data('chartResource');
        var map_resource = vizForm.data('mapResource');
        var resourceData, records;

        get_resource_datа();

        var chartSnippet = $('#visualization-settings-items').length > 0;

        $('#save-visualization-btn').attr('disabled', chartSnippet);

        $('#create-visualization-btn').on('click', function() {

            $.proxyAll(this, /_on/);

            var visualization = $('#item_type').val();
            if (visualization === 'chart') {
                var charts = $('.chart_field');
                var total_items = charts.length + 1;
                var querytool = window.location.href.substr(window.location.href.lastIndexOf('/') +1).split("?")[0];
                ckan.sandbox().client.getTemplate('chart_fields.html', {
                        n: total_items,
                        querytool: querytool,
                        chart_resource: chart_resource,
                        map_resource: map_resource,
                    })
                    .done(function(data) {
                        visualizationItems.append(data);
                        $('#save-visualization-btn').attr('disabled', false);
                    });
            } else if (visualization === 'map') {
                alert('Not implemented yet.')
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
            var items = $('.chart_field');

            $.each(items, function(i, item) {
                item = $(item);

                var order = i + 1;
                var dropdownGraphType = item.find('[id*=chart_field_graph_]');
                var dropdownColorScheme = item.find('[id*=chart_field_color_]');
                var dropdownAxisY = item.find('[id*=chart_field_axis_y_]');
                var dropdownAxisX = item.find('[id*=chart_field_axis_x_]');

                item.attr('id', 'chart_field_' + order);

                dropdownGraphType.attr('id', 'chart_field_graph_' + order);
                dropdownGraphType.attr('name', 'chart_field_graph_' + order);

                dropdownColorScheme.attr('id', 'chart_field_color_' + order);
                dropdownColorScheme.attr('name', 'chart_field_color_' + order);

                dropdownAxisY.attr('id', 'chart_field_axis_y_' + order);
                dropdownAxisY.attr('name', 'chart_field_axis_y_' + order);

                dropdownAxisX.attr('id', 'chart_field_axis_x_' + order);
                dropdownAxisX.attr('name', 'chart_field_axis_x_' + order);
            });
        }

        function get_resource_datа() {
            api.get('querytool_get_resource_data', {
                group: true,
                sql_string: vizForm.data('sqlString')
            })
            .done(function(data) {
                console.log(data)
            });
        }

        function initCharts() {
            var items = $('.chart_field');

            $.each(items, function(i, item) {
                console.log(item)
            })
        }
    });

})($);
