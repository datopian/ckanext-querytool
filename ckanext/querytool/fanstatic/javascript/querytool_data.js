(function (_, jQuery) {
  'use strict';

  var api = {
    get: function (action, params) {
      var api_ver = 3;
      var base_url = ckan.sandbox().client.endpoint;
      params = $.param(params);
      var url = base_url + '/api/' + api_ver + '/action/' + action + '?' + params;
      return $.getJSON(url);
    },
    post: function (action, data) {
      var api_ver = 3;
      var base_url = ckan.sandbox().client.endpoint;
      var url = base_url + '/api/' + api_ver + '/action/' + action;
      return $.post(url, JSON.stringify(data), 'json');
    }
  };

  function handleRenderedFilters (item_id, resource_id) {

    var filter_name_select;
    var filter_value_select_id;

    if (item_id) {
      filter_name_select = $('[id=data_filter_name_'+ item_id +']');
    } else {
      filter_name_select = $('[id*=data_filter_name_]');
    }

    filter_name_select.change(function (event) {
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

      api.post('get_filter_values', {'resource_id': id, 'filter_name': filter_name}).done(function (data) {

        $.each(data.result, function (idx, elem) {
          $('#' + filter_value_select_id).append(new Option(elem, elem));
        });
        $('.' + filter_value_select_id).removeClass('hidden');
        $('.' + filter_alias_input_id).removeClass('hidden');

      });

    });

  }

  $(document).ready(function () {

    handleRenderedFilters();

    $('#field-datasets').change(function (event) {
      $('#main-filters').html('');
    });

    var add_filter_button = $('#add-filter-button');
    var remove_filter_button = $('.remove-filter-item-btn');

    remove_filter_button.on('click', function (e) {
      $(e.target).parent().remove();
    });

    add_filter_button.click(function (event) {
      event.preventDefault();
      var package_name  = $('#field-datasets').find(':selected').val();
      api.get('package_show', {'id': package_name}).done(function (data) {

        var num_resources = data.result.num_resources;
        if (num_resources == 1) {

          var resource = data.result.resources[0];

          api.post('get_resource_fields', {'resource': resource}).done(function (data) {

            var active_filters = data.result.toString();
            var filter_items = $('.filter_item');
            var total_items = filter_items.length + 1;

            ckan.sandbox().client.getTemplate('filter_item.html', {active_filters: active_filters, n: total_items,
                                                    resource_id: resource.id, class:'hidden'})
            .done(function (data) {

              $('#main-filters').append(data);

              // Remove item event handler
              var removeMediaItemBtn = $('.remove-filter-item-btn');
              removeMediaItemBtn.on('click', function (e) {
                $(e.target).parent().remove();
              });

              handleRenderedFilters (total_items, resource.id);

            });
          });

        } else {
          alert('Choosen dataset contains more than one resource');
        }

      });

  });

  });



})($);