(function (_, jQuery) {
  'use strict';

  $(document).ready(function (e) {

    $('.btn-add-filter').on('click', function (e) {
      $('.filters').append('<span class="fa fa-arrow-right"></span><div class="filter-group"><select class="filter-item filter-item-column"><option>&mdash; Select filter &mdash;</option><option>Column</option></select><select class="filter-item filter-item-value hidden"><option>&mdash; Select value &mdash;</option><option>Value</option></select></div>');
    });

    $('.filter-item-column').on('change', function (e) {
      $(this).closest('.filter-group').children('.filter-item-value').removeClass('hidden');
    });

  })

})($);
