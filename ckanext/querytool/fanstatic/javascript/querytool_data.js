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
              $.ajaxSetup({async:false});
            }
            return $.post(url, JSON.stringify(data), 'json');
        }
    };

    function _getPreviousFilters (element_id) {

     var filter_items = $('#' + element_id ).prevAll();
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
      return filters
    };

    function _clearDependentFilters (element_id) {

      var filter_items = $('#' + element_id ).nextAll();

      $.each(filter_items, function(idx, elem) {

        $(elem).find('[id*=data_filter_value_]').find('option').not(':first').remove();

      });
    };

    function _handleFilterItemsOrder () {
      // TODO implement
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
            });
          }
        });

        filter_value_select.change(function(event) {

           var elem = $(this);
           var filter_value_select_id = elem.attr('id');
           var filter_item_id = filter_value_select_id.replace('data_filter_value', 'filter_item')

           _clearDependentFilters(filter_item_id);

        });
    }

    $(document).ready(function() {

        handleRenderedFilters();

        var datasetField = $('#field-datasets');
        var chartResourceSelect = $('#chart_resource');
        var mapResourceSelect = $('#map_resource');

        var defaultDataset = datasetField.find("option:first")[0].value;
        var defaultResource = chartResourceSelect.find("option:first")[0];

        if(!defaultResource){
            get_dataset_resources(defaultDataset);
        }

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
            $(e.target).closest('.filter_item').remove();
            // TODO requires implementation
            _handleFilterItemsOrder();
        });

        add_filter_button.click(function(event) {
            event.preventDefault();
            console.log('na')
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
                                // TODO requires implementation
                                _handleFilterItemsOrder();
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
                        var name = res.name || 'Unnamed resource';
                        chartResourceSelect.append($('<option></option>')
                         .attr('value', res.id).text(name));
                         mapResourceSelect.append($('<option></option>')
                         .attr('value', res.id).text(name));
                    });
                });
        }

    });
})($);
