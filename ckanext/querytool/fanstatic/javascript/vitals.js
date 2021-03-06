/*! RowsGroup for DataTables v2.0.0
 * 2015-2016 Alexey Shildyakov ashl1future@gmail.com
 * 2016 Tibor Wekerle
 */

/**
 * @summary     RowsGroup
 * @description Group rows by specified columns
 * @version     2.0.0
 * @file        dataTables.rowsGroup.js
 * @author      Alexey Shildyakov (ashl1future@gmail.com)
 * @contact     ashl1future@gmail.com
 * @copyright   Alexey Shildyakov
 * 
 * License      MIT - http://datatables.net/license/mit
 *
 * This feature plug-in for DataTables automatically merges columns cells
 * based on it's values equality. It supports multi-column row grouping
 * in according to the requested order with dependency from each previous 
 * requested columns. Now it supports ordering and searching. 
 * Please see the example.html for details.
 * 
 * Rows grouping in DataTables can be enabled by using any one of the following
 * options:
 *
 * * Setting the `rowsGroup` parameter in the DataTables initialisation
 *   to array which containes columns selectors
 *   (https://datatables.net/reference/type/column-selector) used for grouping. i.e.
 *    rowsGroup = [1, 'columnName:name', ]
 * * Setting the `rowsGroup` parameter in the DataTables defaults
 *   (thus causing all tables to have this feature) - i.e.
 *   `$.fn.dataTable.defaults.RowsGroup = [0]`.
 * * Creating a new instance: `new $.fn.dataTable.RowsGroup( table, columnsForGrouping );`
 *   where `table` is a DataTable's API instance and `columnsForGrouping` is the array
 *   described above.
 *
 * For more detailed information please see:
 *     
 */

 (function($){

  ShowedDataSelectorModifier = {
    order: 'current',
    page: 'current',
    search: 'applied',
  }
  
  GroupedColumnsOrderDir = 'asc';
  
  
  /*
   * columnsForGrouping: array of DTAPI:cell-selector for columns for which rows grouping is applied
   */
  var RowsGroup = function ( dt, columnsForGrouping )
  {
    this.table = dt.table();
    this.columnsForGrouping = columnsForGrouping;
     // set to True when new reorder is applied by RowsGroup to prevent order() looping
    this.orderOverrideNow = false;
    this.mergeCellsNeeded = false; // merge after init
    this.order = []
    
    var self = this;
    dt.on('order.dt', function ( e, settings) {
      if (!self.orderOverrideNow) {
        self.orderOverrideNow = true;
        self._updateOrderAndDraw()
      } else {
        self.orderOverrideNow = false;
      }
    })
    
    dt.on('preDraw.dt', function ( e, settings) {
      if (self.mergeCellsNeeded) {
        self.mergeCellsNeeded = false;
        self._mergeCells()
      }
    })
    
    dt.on('column-visibility.dt', function ( e, settings) {
      self.mergeCellsNeeded = true;
    })
  
    dt.on('search.dt', function ( e, settings) {
      // This might to increase the time to redraw while searching on tables
      //   with huge shown columns
      self.mergeCellsNeeded = true;
    })
  
    dt.on('page.dt', function ( e, settings) {
      self.mergeCellsNeeded = true;
    })
  
    dt.on('length.dt', function ( e, settings) {
      self.mergeCellsNeeded = true;
    })
  
    dt.on('xhr.dt', function ( e, settings) {
      self.mergeCellsNeeded = true;
    })
  
    this._updateOrderAndDraw();
    
  /* Events sequence while Add row (also through Editor)
   * addRow() function
   *   draw() function
   *     preDraw() event
   *       mergeCells() - point 1
   *     Appended new row breaks visible elements because the mergeCells() on previous step doesn't apllied to already processing data
   *   order() event
   *     _updateOrderAndDraw()
   *       preDraw() event
   *         mergeCells()
   *       Appended new row now has properly visibility as on current level it has already applied changes from first mergeCells() call (point 1)
   *   draw() event
   */
  };
  
  
  RowsGroup.prototype = {
    setMergeCells: function(){
      this.mergeCellsNeeded = true;
    },
  
    mergeCells: function()
    {
      this.setMergeCells();
      this.table.draw();
    },
  
    _getOrderWithGroupColumns: function (order, groupedColumnsOrderDir)
    {
      if (groupedColumnsOrderDir === undefined)
        groupedColumnsOrderDir = GroupedColumnsOrderDir
        
      var self = this;
      var groupedColumnsIndexes = this.columnsForGrouping.map(function(columnSelector){
        return self.table.column(columnSelector).index()
      })
      var groupedColumnsKnownOrder = order.filter(function(columnOrder){
        return groupedColumnsIndexes.indexOf(columnOrder[0]) >= 0
      })
      var nongroupedColumnsOrder = order.filter(function(columnOrder){
        return groupedColumnsIndexes.indexOf(columnOrder[0]) < 0
      })
      var groupedColumnsKnownOrderIndexes = groupedColumnsKnownOrder.map(function(columnOrder){
        return columnOrder[0]
      })
      var groupedColumnsOrder = groupedColumnsIndexes.map(function(iColumn){
        var iInOrderIndexes = groupedColumnsKnownOrderIndexes.indexOf(iColumn)
        if (iInOrderIndexes >= 0)
          return [iColumn, groupedColumnsKnownOrder[iInOrderIndexes][1]]
        else
          return [iColumn, groupedColumnsOrderDir]
      })
      
      groupedColumnsOrder.push.apply(groupedColumnsOrder, nongroupedColumnsOrder)
      return groupedColumnsOrder;
    },
   
    // Workaround: the DT reset ordering to 'asc' from multi-ordering if user order on one column (without shift)
    //   but because we always has multi-ordering due to grouped rows this happens every time
    _getInjectedMonoSelectWorkaround: function(order)
    {
      if (order.length === 1) {
        // got mono order - workaround here
        var orderingColumn = order[0][0]
        var previousOrder = this.order.map(function(val){
          return val[0]
        })
        var iColumn = previousOrder.indexOf(orderingColumn);
        if (iColumn >= 0) {
          // assume change the direction, because we already has that in previos order
          return [[orderingColumn, this._toogleDirection(this.order[iColumn][1])]]
        } // else This is the new ordering column. Proceed as is.
      } // else got milti order - work normal
      return order;
    },
    
    _mergeCells: function()
    {
      var columnsIndexes = this.table.columns(this.columnsForGrouping, ShowedDataSelectorModifier).indexes().toArray()
      var showedRowsCount = this.table.rows(ShowedDataSelectorModifier)[0].length 
      this._mergeColumn(0, showedRowsCount - 1, columnsIndexes)
    },
    
    // the index is relative to the showed data
    //    (selector-modifier = {order: 'current', page: 'current', search: 'applied'}) index
    _mergeColumn: function(iStartRow, iFinishRow, columnsIndexes)
    {
      var columnsIndexesCopy = columnsIndexes.slice()
      currentColumn = columnsIndexesCopy.shift()
      currentColumn = this.table.column(currentColumn, ShowedDataSelectorModifier)
      
      var columnNodes = currentColumn.nodes()
      var columnValues = currentColumn.data()
      
      var newSequenceRow = iStartRow,
        iRow;
      for (iRow = iStartRow + 1; iRow <= iFinishRow; ++iRow) {
        
        if (columnValues[iRow] === columnValues[newSequenceRow]) {
          $(columnNodes[iRow]).hide()
        } else {
          $(columnNodes[newSequenceRow]).show()
          $(columnNodes[newSequenceRow]).attr('rowspan', (iRow-1) - newSequenceRow + 1)
          
          if (columnsIndexesCopy.length > 0)
            this._mergeColumn(newSequenceRow, (iRow-1), columnsIndexesCopy)
          
          newSequenceRow = iRow;
        }
        
      }
      $(columnNodes[newSequenceRow]).show()
      $(columnNodes[newSequenceRow]).attr('rowspan', (iRow-1)- newSequenceRow + 1)
      if (columnsIndexesCopy.length > 0)
        this._mergeColumn(newSequenceRow, (iRow-1), columnsIndexesCopy)
    },
    
    _toogleDirection: function(dir)
    {
      return dir == 'asc'? 'desc': 'asc';
    },
   
    _updateOrderAndDraw: function()
    {
      this.mergeCellsNeeded = true;
      
      var currentOrder = this.table.order();
      currentOrder = this._getInjectedMonoSelectWorkaround(currentOrder);
      this.order = this._getOrderWithGroupColumns(currentOrder)
      this.table.order($.extend(true, Array(), this.order))
      this.table.draw()
    },
  };
  
  try {
    $.fn.dataTable.RowsGroup = RowsGroup;
    $.fn.DataTable.RowsGroup = RowsGroup;

    // Automatic initialisation listener
    $(document).on( 'init.dt', function ( e, settings ) {
      if ( e.namespace !== 'dt' ) {
        return;
      }

      var api = new $.fn.dataTable.Api( settings );

      if ( settings.oInit.rowsGroup ||
         $.fn.dataTable.defaults.rowsGroup )
      {
        options = settings.oInit.rowsGroup?
          settings.oInit.rowsGroup:
          $.fn.dataTable.defaults.rowsGroup;
        var rowsGroup = new RowsGroup( api, options );
        $.fn.dataTable.Api.register( 'rowsgroup.update()', function () {
          rowsGroup.mergeCells();
          return this;
        } );
        $.fn.dataTable.Api.register( 'rowsgroup.updateNextDraw()', function () {
          rowsGroup.setMergeCells();
          return this;
        } );
      }
    } );
  } catch (error) {
    // This is catching '$.fn.dataTable is undefined' on pages that don't use visualizations (i.e. the home page)
    if (error.message != '$.fn.dataTable is undefined') {
      console.error(error)
    }
  }
  
  }(jQuery));
  
  /*
  
TODO: Provide function which determines the all <tr>s and <td>s with "rowspan" html-attribute is parent (groupped) for the specified <tr> or <td>. To use in selections, editing or hover styles.

TODO: Feature
Use saved order direction for grouped columns
  Split the columns into grouped and ungrouped.
  
  user = grouped+ungrouped
  grouped = grouped
  saved = grouped+ungrouped
  
  For grouped uses following order: user -> saved (because 'saved' include 'grouped' after first initialisation). This should be done with saving order like for 'groupedColumns'
  For ungrouped: uses only 'user' input ordering
*/

    
/*!
 * JQuery Palette Color Picker v1.13 by Carlos Cabo ( @putuko )
 * https://github.com/carloscabo/jquery-palette-color-picker
 */
(function($) {
  // La magia aquí
  'use strict';

  // Public core
  $.paletteColorPicker = function( el, options ) {
    var
      ns = 'palette-color-picker', // Base attr / class
      $el = $(el),
      plugin = this,
      timer = null,
      current_value = $el.val(),
      target = $el.attr('name'),
      $button = $('<div>')
                  .addClass(ns+'-button')
                  .attr('data-target', target),
      $bubble = $('<div>')
                  .addClass(ns+'-bubble'),

      // Final settings will be stored here
      settings = {},

      // Default settings
      defaults = {
        custom_class: null,
        colors: null,
        position: 'upside',   // upside | downside
        insert: 'before',     // default
        clear_btn: 'first',   // default
        timeout: 2000,        // default
        set_background: false, // default
        close_all_but_this: false // default
      },

      click_handler = ('ontouchstart' in document.documentElement ? 'touchstart click' : 'click');

    // Init
    plugin.init = function() {
      // Extand settings with user options
      plugin.settings = $.extend({}, defaults, options);

      // If input has not value add it
      var
        val = $el.attr('value');
      if (typeof val === typeof undefined || val === false) {
        val = '';
        $el.attr('value', val);
      }

      // Backup initial value
      $el.attr('data-initialvalue', $el.attr('value') );

      // If color were not passed as options get them from data-palette attribute
      if (plugin.settings.colors === null) {
        plugin.settings.colors = $el.data('palette');
      }

      // If color is array of string, convert to obj
      if (typeof plugin.settings.colors[0] === 'string') {
        plugin.settings.colors = $.map(plugin.settings.colors, function(el, idx) {
          var b = {}; b[el] = el; return b;
        });
      }

      // Capitalize position
      plugin.settings.insert = plugin.settings.insert.charAt(0).toUpperCase() + plugin.settings.insert.slice(1);

      // Add custom_class
      if (plugin.settings.custom_class) {
        $bubble.addClass(plugin.settings.custom_class);
      }

      // Create color swatches
      $.each( plugin.settings.colors, function( idx, obj ) {
        var
          key = Object.keys( obj )[0],
          col = obj[key],
          $sw = $('<span>').addClass('swatch')
            .attr({
              'title': key,
              'data-color': col,
              'data-name': key
            }).css({background:col});

        if ( key === current_value ) {
          $sw.addClass('active');
          $button.css('background', col);
        }

        $sw.appendTo( $bubble );
      });

      // Create clear button if not null
      if (plugin.settings.clear_btn !== null) {
        var
        $clear_btn = $('<span>').addClass('swatch clear').attr('title', 'Clear selection');
        if (plugin.settings.clear_btn === 'last') {
          $clear_btn.addClass('last').appendTo( $bubble );
        } else {
          $clear_btn.prependTo( $bubble );
        }
      }

      // Public
      plugin.destroy = function() {
        $button.remove();
        $.removeData( $el[0] );
      };

      // Clears all
      plugin.clear = function() {
        $bubble.find('.active').removeClass('active');
        $button.removeAttr('style');
        $el.val('');
      };

      // Reset to initial value
      plugin.reset = function() {
        // Dont had initial value
        if ( $el.attr('data-initialvalue') === '' ) {
          plugin.clear();
        } else {
          // Had initial value
          var iv = $el.attr('data-initialvalue');
          $bubble.find('[data-name="'+iv+'"]').trigger('click');
        }
      };

      // reload value after it has been changed programatically
      plugin.reload = function() {

        var newVal = $el.val();
        if (  newVal === '' || typeof newVal === typeof undefined || newVal === false ) {
          // Doesn't have the value to load so loading initial value
          plugin.reset();
        } else {
          // setting the value to new value
          if($bubble.find('[data-name="'+newVal+'"]').length) {
            // value will only be set if the color exists in options
            $bubble.find('[data-name="'+newVal+'"]').trigger('click');
          } else {
            // setting to the initial value if color does not exists
            plugin.reset();
          }
        }
      };

      // Events
      // Simple click
      $button.append( $bubble ).on( click_handler, function(e){
        e.preventDefault();
        e.stopPropagation();
        var $b = $( this );

        // don't close on clicking the bubble
        if (!$(e.target).hasClass(ns+'-bubble')) {

          // Call the callback, if set
          if (typeof plugin.settings.onbeforeshow_callback === 'function') {
            plugin.settings.onbeforeshow_callback(this);
          }

          $b.toggleClass('active');
          var $current_bubble = $b.find('.'+ns+'-bubble');
          // Forces hiding other bubbles
          if (plugin.settings.close_all_but_this) {
            $('.'+ns+'-bubble').not($current_bubble).fadeOut();
          }
          $current_bubble.fadeToggle();

          if ($b.hasClass('active')) {
            clearTimeout(plugin.timer);
            plugin.timer = setTimeout(function(){
              $b.trigger('pcp.fadeout');
            }, plugin.settings.timeout);
          }
        }
      })
      // Fade timer
      .on('pcp.fadeout', function() {
        $( this ).removeClass('active').find('.'+ns+'-bubble').fadeOut();
      })
      // Enter bubble
      .on('mouseenter', '.'+ns+'-bubble', function() {
        clearTimeout(plugin.timer);
      })
      // Leave bubble
      .on('mouseleave', '.'+ns+'-bubble', function() {
        plugin.timer = setTimeout(function(){
          $button.trigger('pcp.fadeout');
        }, plugin.settings.timeout);
      })
      // Click on swatches
      .on(click_handler, '.'+ns+'-bubble span.swatch', function(e){
        e.preventDefault();
        e.stopPropagation();
        var
          col = $( this ).attr('data-color'),
          name = $( this ).attr('data-name'),
          // Select all button in document with same data target to keep them synconized
          $button = $('.'+ns+'-button[data-target="' + $( this ).closest( '.'+ns+'-button' ).attr('data-target') + '"]'),
          $bubble = $( this ).closest( '.'+ns+'-bubble' );

        // console.log('.'+ns+'-button [data-target="' + $( this ).closest( '.'+ns+'-button' ).attr('data-target') + '"]');
        $bubble.find('.active').removeClass('active');

        // Set background on color
        // User clicked in the clear swatch
        if ( $(e.target).is('.clear') ) {
          $button.removeAttr('style');
          col = '';
        } else {
          $(this).addClass('active');
          $button.css('background', col);
        }

        // Call the callback, if set
        if (typeof plugin.settings.onchange_callback === "function") {
          plugin.settings.onchange_callback(col);
        }

        if( plugin.settings.set_background === false ) {
          $('[name="' + $button.attr('data-target') + '"]').val(name);
        } else {
          $('[name="' + $button.attr('data-target') + '"]').css({'background-color' : col});
        }
      })['insert'+plugin.settings.insert]( $el );

      // Upside / downside, default is upside
      if ( plugin.settings.position === 'downside' || ($el.offset().top) + 20 < $bubble.outerHeight() ) {
        $bubble.addClass('downside');
      }

    };

    // Close on clicking outside the palette
    $('body').on(click_handler,function(event) {
      if (!$(event.target).hasClass(ns+'-button')) {
        $( $button ).removeClass('active').find('.'+ns+'-bubble').fadeOut();
      }
    });

    // Start
    plugin.init();
  };

  // add the plugin to the jQuery.fn object
  $.fn.paletteColorPicker = function(options) {
    return this.each(function() {
      if (typeof $(this).data('paletteColorPickerPlugin') === 'undefined') {
        $(this).data('paletteColorPickerPlugin', new $.paletteColorPicker(this, options));
      }
    });
  };

})(jQuery);

// Sample usage
// $(function() {
//   $('[data-palette-color-picker]').paletteColorPicker();
// });

/*!
 * @preserve
 *
 * Readmore.js jQuery plugin
 * Author: @jed_foster
 * Project home: http://jedfoster.github.io/Readmore.js
 * Licensed under the MIT license
 *
 * Debounce function from http://davidwalsh.name/javascript-debounce-function
 */
!function(t){"function"==typeof define&&define.amd?define(["jquery"],t):"object"==typeof exports?module.exports=t(require("jquery")):t(jQuery)}(function(t){"use strict";function e(t,e,i){var o;return function(){var n=this,a=arguments,s=function(){o=null,i||t.apply(n,a)},r=i&&!o;clearTimeout(o),o=setTimeout(s,e),r&&t.apply(n,a)}}function i(t){var e=++h;return String(null==t?"rmjs-":t)+e}function o(t){var e=t.clone().css({height:"auto",width:t.width(),maxHeight:"none",overflow:"hidden"}).insertAfter(t),i=e.outerHeight(),o=parseInt(e.css({maxHeight:""}).css("max-height").replace(/[^-\d\.]/g,""),10),n=t.data("defaultHeight");e.remove();var a=o||t.data("collapsedHeight")||n;t.data({expandedHeight:i,maxHeight:o,collapsedHeight:a}).css({maxHeight:"none"})}function n(t){if(!d[t.selector]){var e=" ";t.embedCSS&&""!==t.blockCSS&&(e+=t.selector+" + [data-readmore-toggle], "+t.selector+"[data-readmore]{"+t.blockCSS+"}"),e+=t.selector+"[data-readmore]{transition: height "+t.speed+"ms;overflow: hidden;}",function(t,e){var i=t.createElement("style");i.type="text/css",i.styleSheet?i.styleSheet.cssText=e:i.appendChild(t.createTextNode(e)),t.getElementsByTagName("head")[0].appendChild(i)}(document,e),d[t.selector]=!0}}function a(e,i){this.element=e,this.options=t.extend({},r,i),n(this.options),this._defaults=r,this._name=s,this.init(),window.addEventListener?(window.addEventListener("load",c),window.addEventListener("resize",c)):(window.attachEvent("load",c),window.attachEvent("resize",c))}var s="readmore",r={speed:100,collapsedHeight:200,heightMargin:16,moreLink:'<a href="#">Read More</a>',lessLink:'<a href="#">Close</a>',embedCSS:!0,blockCSS:"display: block; width: 100%;",startOpen:!1,blockProcessed:function(){},beforeToggle:function(){},afterToggle:function(){}},d={},h=0,c=e(function(){t("[data-readmore]").each(function(){var e=t(this),i="true"===e.attr("aria-expanded");o(e),e.css({height:e.data(i?"expandedHeight":"collapsedHeight")})})},100);a.prototype={init:function(){var e=t(this.element);e.data({defaultHeight:this.options.collapsedHeight,heightMargin:this.options.heightMargin}),o(e);var n=e.data("collapsedHeight"),a=e.data("heightMargin");if(e.outerHeight(!0)<=n+a)return this.options.blockProcessed&&"function"==typeof this.options.blockProcessed&&this.options.blockProcessed(e,!1),!0;var s=e.attr("id")||i(),r=this.options.startOpen?this.options.lessLink:this.options.moreLink;e.attr({"data-readmore":"","aria-expanded":this.options.startOpen,id:s}),e.after(t(r).on("click",function(t){return function(i){t.toggle(this,e[0],i)}}(this)).attr({"data-readmore-toggle":s,"aria-controls":s})),this.options.startOpen||e.css({height:n}),this.options.blockProcessed&&"function"==typeof this.options.blockProcessed&&this.options.blockProcessed(e,!0)},toggle:function(e,i,o){o&&o.preventDefault(),e||(e=t('[aria-controls="'+this.element.id+'"]')[0]),i||(i=this.element);var n=t(i),a="",s="",r=!1,d=n.data("collapsedHeight");n.height()<=d?(a=n.data("expandedHeight")+"px",s="lessLink",r=!0):(a=d,s="moreLink"),this.options.beforeToggle&&"function"==typeof this.options.beforeToggle&&this.options.beforeToggle(e,n,!r),n.css({height:a}),n.on("transitionend",function(i){return function(){i.options.afterToggle&&"function"==typeof i.options.afterToggle&&i.options.afterToggle(e,n,r),t(this).attr({"aria-expanded":r}).off("transitionend")}}(this)),t(e).replaceWith(t(this.options[s]).on("click",function(t){return function(e){t.toggle(this,i,e)}}(this)).attr({"data-readmore-toggle":n.attr("id"),"aria-controls":n.attr("id")}))},destroy:function(){t(this.element).each(function(){var e=t(this);e.attr({"data-readmore":null,"aria-expanded":null}).css({maxHeight:"",height:""}).next("[data-readmore-toggle]").remove(),e.removeData()})}},t.fn.readmore=function(e){var i=arguments,o=this.selector;return e=e||{},"object"==typeof e?this.each(function(){if(t.data(this,"plugin_"+s)){var i=t.data(this,"plugin_"+s);i.destroy.apply(i)}e.selector=o,t.data(this,"plugin_"+s,new a(this,e))}):"string"==typeof e&&"_"!==e[0]&&"init"!==e?this.each(function(){var o=t.data(this,"plugin_"+s);o instanceof a&&"function"==typeof o[e]&&o[e].apply(o,Array.prototype.slice.call(i,1))}):void 0}});

$('.short-desc').readmore({
    collapsedHeight: 55,
    lessLink: '<a href="#">Read Less</a>'
});

$('.medium-desc').readmore({
    collapsedHeight: 100,
    lessLink: '<a href="#">Read Less</a>'
});

$('.long-desc').readmore({
    collapsedHeight: 120,
    lessLink: '<a href="#">Read Less</a>'
});

$(document).ready(function(){
    generateColorPicker();
    generateColorPicker2();

    $("#add-visualization-btn").on('click',function(){
        setTimeout(function() { generateColorPicker(); generateColorPicker2(); }, 1000);
    })

    //get page height and display scroll button
    var pgHeight = document.body.scrollHeight;
    if(pgHeight >= 1450) {
      $("#scrollBtn").show();
    }
    
    $(window).scroll(function () { 
      var scrollPos = $(window).scrollTop();
      //You've scrolled this much:
        if(scrollPos >= 520) {
          $("#scrollBtn").hide();
        }
    });

    //Scroll btn
    $("#scrollBtn").click(function() {
        $('html, body').animate({
            scrollTop: $("#chart_2").offset().top
        }, 1000);
        $(this).hide()
    });


    function saveAs(uri, filename) {
      var link = document.createElement('a');
      if (typeof link.download === 'string') {
          link.href = uri;
          link.download = filename;
          //Firefox requires the link to be in the body
          document.body.appendChild(link);
          //simulate click
          link.click();
          //remove the link when done
          document.body.removeChild(link);
      } else {
          window.open(uri);
      }
    }


    //Take screenshot
    $(".scrBtn").click(function(){ 
      var chartId= $(this).attr("data-chartId")
      setTimeout(function(){ 
        html2canvas(document.querySelector(chartId)).then(function(canvas) {
          saveAs(canvas.toDataURL(), 'report.png');
        });
      }, 100);

    });
    

    
});


  $(document).ready(function(){
    $('[id^=chart_field_color_type_]').serializeArray().forEach((item, i) => {
      var color_type = item.value;
      if([1, '1'].includes(color_type)){
          $(`.diver-colors-${i+1}`).removeClass('hidden')
          $(`.seq-colors-${i+1}`).addClass('hidden')
      } else {
          $(`.diver-colors-${i+1}`).addClass('hidden')
          $(`.seq-colors-${i+1}`).removeClass('hidden')
      }
    })
  });

  $(document).on('change', '[id^=chart_field_color_type_]', function() {
    var selection = $(this).val();
    var chart_number = this.id.split('_').slice(-1)[0];
    if(selection == 1){
        $(`.diver-colors-${chart_number}`).removeClass('hidden')
        $(`.seq-colors-${chart_number}`).addClass('hidden')
    } else {
        $(`.diver-colors-${chart_number}`).addClass('hidden')
        $(`.seq-colors-${chart_number}`).removeClass('hidden')
    }
  });

  function generateColorPicker(){
    $('.colorpicker').paletteColorPicker({
        colors: [
        {"green": "green"},
        {"blue": "blue"},
        {"teal": "teal"},
        {"goldenrod": "goldenrod"},
        {"yellow": "yellow"},
        {"orange": "orange"},
        {"brown": "brown"},
        {"purple": "purple"},
        {"red": "red"},
        {"burlywood": "burlywood"},
        {"coral": "coral"},
        {"black": "black"},
        {"darkblue": "darkblue"},
        {"darkgray": "darkgray"},
        {"darkolivegreen": "darkolivegreen"},
        {"darkseagreen": "darkseagreen"},
        {"darkslateblue": "darkslateblue"},
        {"darkturquoise": "darkturquoise"},
        {"deeppink": "deeppink"},
        {"deepskyblue": "deepskyblue"},
        {"lightgreen": "lightgreen"},
        {"mediumvioletred": "mediumvioletred"},
        {"midnightblue":"midnightblue"},
        {"lightsteelblue":"lightsteelblue"},
        {"powderblue":"powderblue"},
        {"lightyellow":"lightyellow"},
        {"teal":"teal"},
        {"darkcyan":"darkcyan"},
        {"cadetblue":"cadetblue"},
        {"mediumaquamarine":"mediumaquamarine"},
        {"coral":"coral"},
        {"darkorange":"darkorange"},
        {"sandybrown":"sandybrown"},
        {"navajowhite":"navajowhite"},
        {"peru":"peru"},
        {"burlywood":"burlywood"},
        {"tan":"tan"},
        {"wheat":"wheat"},
        {"papayawhip":"papayawhip"}
        ],
        position: 'downside',
        clear_btn: null // default -> 'upside'
    });
  }

  function generateColorPicker2(){
    console.log('generate Color picker called')
    $('.colorpicker_sequential').paletteColorPicker({
      custom_class: 'wide',
      colors: [
      {"#348F50,#56B4D3": "linear-gradient(90deg, rgba(52,143,80,1) 0%, rgba(86,180,211,1) 100%"},
      {"#ff6e7f,#bfe9ff": "linear-gradient(90deg, rgba(255,110,127,1) 0%, rgba(191,233,255,1) 100%"},
      {"#2b5876,#4e4376": "linear-gradient(90deg, rgba(49,71,85,1) 0%, rgba(38,160,218,1) 100%"},
      {"#e65c00,#F9D423": "linear-gradient(90deg, rgba(230,92,0,1) 0%, rgba(249,212,35,1) 100%"},
      ],
      position: 'downside',
      clear_btn: null // default -> 'upside'
    });
  }

  $('body').on('change','[id^=chart_field_graph_]',function(){
    var selected = $(this).val();
    var chart_number = this.id.split('_').slice(-1)[0];

    //Hide color options if pie or donut
    if(selected=='pie' || selected=='donut') {
      $(this).closest('.accordion').find(".color-accordion").addClass('hidden')
    } else {
      $(this).closest('.accordion').find(".color-accordion").removeClass('hidden')
    }

    //Hide seqeuntial if not bar chart
    if(selected=='line' || selected=='area' || selected=='spline' || selected=='donut' || selected=='pie' || selected=='scatter'){
      $(`#chart_field_color_type_${chart_number}`).val("1");
      $(`#chart_field_color_type_${chart_number}`).change();

      $(`.chart_field_color_wrap_${chart_number}`).addClass('hidden');
      $(`.diver-colors-${chart_number}`).removeClass('hidden');
      $(`.seq-colors-${chart_number}`).addClass('hidden');
    } else {
      $(`.chart_field_color_wrap_${chart_number}`).removeClass('hidden');
    }


    //Hide and show x-axis options
    if(selected=='pie' || selected=='donut'){
      $(`#chart_field_x_label_${chart_number}`).attr("disabled");
      $(`#chart_field_x_label_hide_${chart_number}`).attr("disabled");
      $(`#chart_field_sort_${chart_number}`).attr('disabled', 'true');
      $(`#chart_field_x_ticks_format_${chart_number}`).attr('disabled', 'true');
    } else {
      $(`#chart_field_x_label_${chart_number}`).removeAttr("disabled");
      $(`#chart_field_x_label_hide_${chart_number}`).removeAttr("disabled");
      $(`#chart_field_sort_${chart_number}`).removeAttr('disabled');
      $(`#chart_field_x_ticks_format_${chart_number}`).removeAttr('disabled');
    }
  })


// Hide annotation on bars with categories
$('body').on('change','[id^=chart_field_graph_]',function(){
  var selected = $(this).val();
  var chart_number = this.id.split('_').slice(-1)[0];
  hideAnnotationCheckbox(selected,chart_number);
});

$('body').on('change','[id^=chart_field_category_name_]',function(){
  var chart_number = this.id.split('_').slice(-1)[0];
  var selected = $(`#chart_field_graph_${chart_number}`).val();
  hideAnnotationCheckbox(selected,chart_number);
});

function hideAnnotationCheckbox(selected,chart_number){
  
  var category = $(`#chart_field_category_name_${chart_number}`).val();
  if((selected=='bar' || selected=='hbar') && category.length != 0) {
    $(`#chart_field_show_annotations_${chart_number}`).attr('checked', false);
    $(`#chart_field_show_annotations_${chart_number}`).attr('disabled', 'true');
  } else {
    $(`#chart_field_show_annotations_${chart_number}`).removeAttr('disabled');
  }

}; 


// On Tables, category and subcategory must not be same 
$('body').on('change','[id^=table_main_value_]',function(){
  var selected = $(this).val();
  var chart_number = this.id.split('_').slice(-1)[0];

  checkTableCat(selected,chart_number)
});

$('body').on('focus','[id^=table_main_value_]',function(){
  var selected = $(this).val();
  var chart_number = this.id.split('_').slice(-1)[0];

  checkTableCat(selected,chart_number)
});


function checkTableCat(selected,chart_number){ 

  $(`#table_second_value_${chart_number} option[value='`+ selected +`']`).attr('disabled','disabled').siblings().removeAttr('disabled');
  $(`#table_category_name_${chart_number} option[value='`+ selected +`']`).attr('disabled','disabled').siblings().removeAttr('disabled');

  if($(`#table_second_value_${chart_number} option`).filter(":selected").val() == selected && selected != ''){
    $($(`#table_second_value_${chart_number}`)).val("")
  } 

  if($(`#table_category_name_${chart_number} option`).filter(":selected").val() == selected && selected != ''){
    $($(`#table_category_name_${chart_number}`)).val("")
  }

}


$('body').on('change','[id^=table_second_value_]',function(e){
  var selected = $(this).val();
  var chart_number = this.id.split('_').slice(-1)[0];

  if($(`#table_main_value_${chart_number} option`).filter(":selected").val() == selected && selected != ''){
    $($(`#table_second_value_${chart_number}`)).val("")
    alert('Value cannot be same as main dimension')
  } 

  if($(`#table_category_name_${chart_number} option`).filter(":selected").val() == selected && selected != ''){
    $($(`#table_second_value_${chart_number}`)).val("")
    alert('Value cannot be same as category')
  }
});


$('body').on('change','[id^=table_category_name_]',function(e){
  var selected = $(this).val();
  var chart_number = this.id.split('_').slice(-1)[0];

  if($(`#table_main_value_${chart_number} option`).filter(":selected").val() == selected && selected != ''){
    $($(`#table_category_name_${chart_number}`)).val("")
    alert('Value cannot be same as main dimension')
  } 

  if($(`#table_second_value_${chart_number} option`).filter(":selected").val() == selected && selected != ''){
    $($(`#table_category_name_${chart_number}`)).val("")
    alert('Value cannot be same as sub dimension')
  }
});

// Upper/lower bounds functions

$('body').on('change','[id^=chart_field_category_name_]',function(){
  var categories = $(this).val();
  var chart_number = this.id.split('_').slice(-1)[0];
  var selected = $(`#chart_field_graph_${chart_number}`).val();

  hideBounds(selected,chart_number,categories);
});

$('body').on('change','[id^=chart_field_graph_]',function(){
  var selected = $(this).val();
  var chart_number = this.id.split('_').slice(-1)[0];
  var categories = $(`#chart_field_category_name_${chart_number}`).val();

  hideBounds(selected,chart_number,categories);
});

$(document).ready(function(){
  $('[id^=chart_field_graph_]').serializeArray().forEach((item, i) => {
    var selected = item.value;
    var chart_number = i + 1;
    var categories = $(`#chart_field_category_name_${chart_number}`).val();

    hideBounds(selected,chart_number,categories);
  })
});

function hideBounds(selected,chart_number,categories) {
  if(['line', 'spline', 'area', 'bar', 'hbar', 'scatter'].includes(selected)){
    //$(`#chart_field_show_bounds_${chart_number}`).attr('checked', true);
    $(`#chart_field_show_bounds_${chart_number}`).attr('disabled', false);
    $(`#chart_field_upper_bounds_${chart_number}`).attr('disabled', false);
    $(`#chart_field_lower_bounds_${chart_number}`).attr('disabled', false);
  } else {
    $(`#chart_field_show_bounds_${chart_number}`).attr('checked', false);
    $(`#chart_field_show_bounds_${chart_number}`).attr('disabled', true);
    $(`#chart_field_upper_bounds_${chart_number}`).attr('disabled', true);
    $(`#chart_field_lower_bounds_${chart_number}`).attr('disabled', true);
  }
};

$('body').on('change','[id^=chart_field_upper_bounds_]',function(){
  var selected = $(this).val();
  var chart_number = this.id.split('_').slice(-1)[0];

  disableBounds('lower', selected, chart_number);
});

$('body').on('change','[id^=chart_field_lower_bounds_]',function(){
  var selected = $(this).val();
  var chart_number = this.id.split('_').slice(-1)[0];

  disableBounds('upper', selected, chart_number);
});

$('body').on('load','[id^=chart_field_upper_bounds_]',function(){
  var selected = $(this).val();
  var chart_number = this.id.split('_').slice(-1)[0];

  disableBounds('lower', selected, chart_number);
})

$('body').on('load','[id^=chart_field_upper_bounds_]',function(){
  var selected = $(this).val();
  var chart_number = this.id.split('_').slice(-1)[0];

  disableBounds('lower', selected, chart_number);
})

function disableBounds(bound, selected, chart_number){
  try {
    var options = $(`#chart_field_${bound}_bounds_${chart_number}`)[0].options;

    var disabledOption;

    for (let i = 0; i < options.length; i++) {
      var disabled = options[i].disabled

      if (disabled) {
        disabledOption = options[i].value
      }
    }

    if (selected !== '') {
      $(`#chart_field_${bound}_bounds_${chart_number} option[value='${disabledOption}']`).removeAttr('disabled')
      $(`#chart_field_${bound}_bounds_${chart_number} option[value='${selected}']`).attr('disabled', 'disabled')
    } else {
      $(`#chart_field_${bound}_bounds_${chart_number} option[value='${disabledOption}']`).removeAttr('disabled')
    }
  } catch(error) {
    return null;
  }
};

$(document).ready(function(){
  $('[id^=chart_field_lower_bounds_]').serializeArray().forEach((item, i) => {
    var selected = item.value;
    var chart_number = i + 1;

    disableBounds('upper', selected, chart_number);
  })
});

$(document).ready(function(){
  $('[id^=chart_field_upper_bounds_]').serializeArray().forEach((item, i) => {
    var selected = item.value;
    var chart_number = i + 1;

    disableBounds('lower', selected, chart_number);
  })
});
