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
      return $.post(url, JSON.stringify(data), "json");
    }
  };

  $(document).ready(function () {

  console.log(ckan);
  $( "#field-datasets" ).change(function() {
    var elem = $(this);
    var package_name  = elem.find(":selected").val();
    api.get('package_show', {'id': package_name}).done(function (data) {

      var num_resources = data.result.num_resources;

      if (num_resources == 1) {
        var resource = data.result.resources[0];

        api.post('resource_view_get_fields', {'resource': resource}).done(function (data) {



          console.log(data.result);






        });

      }

    });
  });

  });



})($);