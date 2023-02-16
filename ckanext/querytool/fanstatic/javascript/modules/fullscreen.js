/*

This modules handles fullscreen mode on click

*/

ckan.module("fullscreen", function($) {
    "use strict";

    var modal;
    var self;

    function initialize() {
        self = this;
        this.el.on("click", _onClick);
    }

    function _onClick(event) {
        event.preventDefault();
        goFullScreen();
    }

    function _preventClick(event) {
        event.preventDefault();
    }

    function goFullScreen() {

        var element = document.documentElement;
      
        if (element.requestFullScreen) {
          element.requestFullScreen();
        } else if (element.mozRequestFullScreen) {
          element.mozRequestFullScreen();
        } else if (element.webkitRequestFullScreen) {
          element.webkitRequestFullScreen();
        }
      
      }

    return {
        initialize: initialize,
        options: {
            id: 0,
            width: 700,
            height: 400
        }
    };
});