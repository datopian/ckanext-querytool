(function (_, jQuery) {
  'use strict';

  $(document).ready(function (e) {
    $('.btn-add-filter').on('click', function (e) {
      $('.filters').append('<span class="fa fa-arrow-right"></span><div class="filter-group"><select class="filter-item filter-item-column"><option>&mdash; Select filter &mdash;</option><option>Column</option></select><select class="filter-item filter-item-value"><option>&mdash; Select value &mdash;</option><option>Value</option></select></div>');
    });

    $('.filter-item-column').on('change', function (e) {
      console.log('changed');
      $(this).parent().find($('.filter-item-value')).show();
    });

    $('.btn-filter-toggle').click(function (e) {
      $(this).toggleClass('on');
      $('.public-query .controls').toggleClass('on');
    });

  })

})($);
