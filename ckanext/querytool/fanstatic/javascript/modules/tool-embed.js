this.ckan.module('tool-embed', function ($) {
  var modal;
  var self;

  function initialize() {
  console.log(this.options.id)
    self = this;
    modal = $('#embed-'+this.options.id)
    this.el.on('click', _onClick);
    $('textarea', modal).on('focus', _selectAllCode).on('mouseup', _preventClick);
    $('input', modal).on('keyup change', _updateValues);
    _updateEmbedCode();
  }

  function _onClick (event) {
    event.preventDefault();
    modal.modal('show');
  }

  function _selectAllCode () {
    $('textarea', modal).select();
  }

  function _updateValues () {
    self.options.width = $('[name="width"]', modal).val();
    self.options.height = $('[name="height"]', modal).val();
    _updateEmbedCode();
  }

  function _updateEmbedCode () {
    $('[name="code"]', modal).val(_embedCode());
  }

  function _preventClick (event) {
    event.preventDefault();
  }

  function _embedCode () {
    return '<iframe width="' + self.options.width + '" height="' + self.options.height + '" src="' + window.location.href + '" frameBorder="0"></iframe>';
  }

  return {
    initialize: initialize,
    options: {
      id: 0,
      width: 700,
      height: 400
    }
  }
});