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
        $('#create-visualization-btn').on('click', function() {

            $.proxyAll(this, /_on/);

            var visualization = $('#item_type').val();
            if (visualization === 'chart') {
                var charts = $('.chart_field');
                var total_items = charts.length + 1;
                var querytool = window.location.href.substr(window.location.href.lastIndexOf('/') +1).split("?")[0];
                ckan.sandbox().client.getTemplate('chart_fields.html', {
                        n: total_items,
                        querytool: querytool
                    })
                    .done(function(data) {
                        $('#visualization-settings-items').append(data);

                    });
            } else if (visualization === 'map') {
                alert('Not implemented yet.')
            }

        });
    });

})($);