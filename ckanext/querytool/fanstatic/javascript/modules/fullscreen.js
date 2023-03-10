/*

This modules handles fullscreen mode on click

*/

ckan.module("fullscreen", function ($) {
  "use strict";

  var self;

  function initialize() {
    self = this;
    this.el.on("click", _onClick);
  }

  function _onClick(event) {
    event.preventDefault();
    toggleFullscreen();
  }

  function toggleFullscreen() {
    if (document.fullscreenElement !== null) {
      exitFullscreen();
    } else {
      goFullScreen();
    }
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

  function exitFullscreen() {
    document.exitFullscreen();
  }

  return {
    initialize: initialize,
  };
});
