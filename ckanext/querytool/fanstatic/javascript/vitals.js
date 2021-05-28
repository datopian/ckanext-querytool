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
        {"#00429d":"#00429d"},
        {"#4771b2":"#4771b2"},
        {"#73a2c6":"#73a2c6"},
        {"#a5d5d8":"#a5d5d8"},
        {"#ffffe0":"#ffffe0"},
        {"#007386":"#007386"},
        {"#3e98a0":"#3e98a0"},
        {"#6dbdba":"#6dbdba"},
        {"#a4e2d3":"#a4e2d3"},
        {"#f46a00":"#f46a00"},
        {"#fa8a30":"#fa8a30"},
        {"#fea951":"#fea951"},
        {"#ffc671":"#ffc671"},
        {"#fee391":"#fee391"},
        {"#c77a44":"#c77a44"},
        {"#d59566":"#d59566"},
        {"#e2b187":"#e2b187"},
        {"#eccdaa":"#eccdaa"},
        {"#f5e9ce":"#f5e9ce"}
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

// Upper/lower bounds functions

$('body').on('change','[id^=chart_field_graph_]',function(){
  var selected = $(this).val();
  var chart_number = this.id.split('_').slice(-1)[0];

  hideBounds(selected,chart_number);
});

$(document).ready(function(){
  $('[id^=chart_field_graph_]').serializeArray().forEach((item, i) => {
    var selected = item.value;
    var chart_number = i + 1;

    hideBounds(selected,chart_number);
  })
});

function hideBounds(selected,chart_number) {
  if(['line', 'spline', 'area', 'scatter', 'bar', 'hbar', 'sbar', 'shbar'].includes(selected)){
    //$(`#chart_field_show_bounds_${chart_number}`).attr('checked', true);
    $(`#chart_field_show_bounds_${chart_number}`).attr('disabled', false);
    $(`#chart_field_upper_bounds_${chart_number}`).attr('disabled', false);
    $(`#chart_field_lower_bounds_${chart_number}`).attr('disabled', false);
  } else {
    //$(`#chart_field_show_bounds_${chart_number}`).attr('checked', false);
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
