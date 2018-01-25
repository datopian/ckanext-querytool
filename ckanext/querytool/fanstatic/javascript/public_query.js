(function (_, jQuery) {
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

  $(document).ready(function (e) {

    var add_filter_button = $('.btn-add-filter');

    add_filter_button.click(function(event) {

      var active_filters = $('#query_init_filters').val();
      console.log(typeof active_filters);
      console.log(active_filters);

      ckan.sandbox().client.getTemplate('public_filter_item.html', {
            class: 'hidden',
            active_filters: JSON.parse(active_filters)
        })
        .done(function(data) {

          $('.filters').append(data);

        });

    });

//    $('.btn-add-filter').on('click', function (e) {
//      $('.filters').append('<span class="fa fa-arrow-right"></span><div class="filter-group"><select class="filter-item filter-item-column"><option>&mdash; Select filter &mdash;</option><option>Column</option></select><select class="filter-item filter-item-value hidden"><option>&mdash; Select value &mdash;</option><option>Value</option></select></div>');
//    });

    $('.filter-item-column').on('change', function (e) {
      $(this).closest('.filter-group').children('.filter-item-value').removeClass('hidden');
    });

  })

})($);
