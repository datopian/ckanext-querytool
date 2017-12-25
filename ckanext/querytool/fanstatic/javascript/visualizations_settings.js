(function () {
  'use strict';

      $(document).ready(function () {
        $('#create-visualization-btn').on('click', function(){

              $.proxyAll(this, /_on/);

              var visualization = $('#item_type').val();
              if (visualization === 'chart') {

                ckan.sandbox().client.getTemplate('chart_fields.html', {})
                   .done(function (data) {

                     $('#visualization-settings-items').append(data);



                     //handleChartItems(name, totalItems);

                   });
              } else if (visualization === 'map') {
                console.log('MAPP')
              }

          });
        });

})($);