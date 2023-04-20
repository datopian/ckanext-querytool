/*

This modules handles fullscreen mode on click

*/

ckan.module("fullscreen", function ($) {
  "use strict";

  var self;

  function initialize() {
    self = this;
    self.el.on("click", _onClick);
    self.iconEl = this.el.find("._icon");

    //  Set the initial state accordingly
    //  e.g after route change
    if (_detectFullscreen()) {
      _changeIcon("exit-fullscreen");
    }
  }

  function _onClick(event) {
    event.preventDefault();
    toggleFullscreen();
  }

  function toggleFullscreen() {
    if (_detectFullscreen()) {
      //  goFullScreen to ensure document.fullscreenElement is not
      //  undefined since it becomes undefined on route changes
      goFullScreen().then(() => {
        exitFullscreen();
        _changeIcon("fullscreen");
      });

    } else {
      goFullScreen();
      _changeIcon("exit-fullscreen");
    }
  }

  async function goFullScreen() {
    var element = document.documentElement;

    if (element.requestFullScreen) {
      return element.requestFullScreen();
    } else if (element.mozRequestFullScreen) {
      return element.mozRequestFullScreen();
    } else if (element.webkitRequestFullScreen) {
      return element.webkitRequestFullScreen();
    } else if (element.mdRequestFullScreen) {
      return element.msRequestFullScreen();
    }
  }

  function exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozExitFullscreen) {
      document.mozExitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }

  function _detectFullscreen() {
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullScreenElement ||
      (window.innerHeight == screen.height && window.innerWidth == screen.width)
    );
  }

  function _changeIcon(icon = "fullscreen") {
    if (icon === "fullscreen") {
      self.iconEl.attr("src", "/base/images/fullscreen.png");
    } else if (icon === "exit-fullscreen") {
      self.iconEl.attr("src", "/base/images/exit-fullscreen.png");
    }
  }

  return {
    initialize: initialize,
  };
});
