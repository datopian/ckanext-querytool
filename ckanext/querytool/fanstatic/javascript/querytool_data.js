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

  $(document).ready(function () {

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

          ckan.sandbox().client.getTemplate('filter_item.html', {active_filters: active_filters, n: total_items, class:'hidden'})
          .done(function (data) {

            $('#main-filters').append(data);

            // Remove item event handler
            var removeMediaItemBtn = $('.remove-filter-item-btn');
            removeMediaItemBtn.on('click', function (e) {
              $(e.target).parent().remove();
            });

            var filter_name_select = $('[id=data_filter_name_'+ total_items +']');
            var filter_values_select = $('[id=data_filter_value_'+ total_items +']');
            var filter_alias_input = $('[id=data_filter_alias_'+ total_items +']');

            filter_name_select.change(function (event) {

              // Empty child select and input
              if ($('#data_filter_value_' + total_items + ' option').length > 0)
              filter_values_select.find('option').not(':first').remove();
              filter_alias_input.val('');

              var filter_name = filter_name_select.val();
              api.post('get_filter_values', {'resource_id': resource.id, 'filter_name': filter_name}).done(function (data) {

                $.each(data.result, function (idx, elem) {
                  filter_values_select.append(new Option(elem, elem));
                });
                $('.data_filter_value_' + total_items).removeClass('hidden');

              });

            });

            filter_values_select.change(function (event) {

                $('.data_filter_alias_' + total_items).removeClass('hidden');

            });

          });

        });
      } else {
        alert('Choosen dataset contains more than one resource');
      }

    });



  });

  });



})($);