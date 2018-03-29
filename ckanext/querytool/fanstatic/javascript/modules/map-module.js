ckan.module('querytool_map', function ($, _) {
  'use strict';

  return {
    initialize: function() {

      ckan.querytool.map.init(this.el[0].id,
      this.options.map_resource

      );
    }
  }
});