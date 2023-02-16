/*

    This module handles the events related to 
    sequential color pickers

*/

ckan.module("sequential-color-picker", function ($) {
  "use strict";

  var self;

  function initialize() {
    self = this;

    //  Elements that must  be  children  of  the
    //  element which has this module applied to
    self.hiddenInput = this.el.find(".seq-color-picker--hidden-input");
    self.startingColorInput = this.el.find(".seq-color-picker--starting-color");
    self.endingColorInput = this.el.find(".seq-color-picker--ending-color");
    self.previewEl = this.el.find(".seq-color-picker--preview");

    //  When starting or ending color is changed,
    //  update the value of the hidden input
    self.startingColorInput.change((e) => _updateHiddenInput(e, "starting"));
    self.endingColorInput.change((e) => _updateHiddenInput(e, "ending"));

    //  When  the  value  of the hidden input is
    //  changed, update the preview
    self.hiddenInput.change(_updateGradient);
  }

  function _updateHiddenInput(e, position) {
    const incomingValue = e.target.value;
    const oldVal = self.hiddenInput.val().split(",");

    let newVal = "";
    if (position === "starting") {
      newVal = `${incomingValue},${oldVal[1]}`;
    } else {
      newVal = `${oldVal[0]},${incomingValue}`;
    }

    self.hiddenInput.val(newVal).trigger("change");
  }

  function _updateGradient(e) {
    const incomingVaue = e.target.value;

    const colors = incomingVaue.split(",");
    const startingColor = colors[0];
    const endingColor = colors[1];

    self.previewEl.css(
      "background-image",
      `linear-gradient(to right, ${startingColor}, ${endingColor})`
    );
  }

  return {
    initialize,
  };
});
