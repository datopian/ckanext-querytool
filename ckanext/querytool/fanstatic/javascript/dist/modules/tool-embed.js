!function(e){var t={};function n(o){if(t[o])return t[o].exports;var i=t[o]={i:o,l:!1,exports:{}};return e[o].call(i.exports,i,i.exports,n),i.l=!0,i.exports}n.m=e,n.c=t,n.d=function(e,t,o){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:o})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var o=Object.create(null);if(n.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e)n.d(o,i,function(t){return e[t]}.bind(null,i));return o},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=143)}({143:function(e,t){ckan.module("tool-embed",(function(e){"use strict";var t,n;function o(e){e.preventDefault(),t.modal("show")}function i(){e("textarea",t).select()}function r(){n.options.width=e('[name="width"]',t).val(),n.options.height=e('[name="height"]',t).val(),u()}function u(){e('[name="code"]',t).val('<iframe width="'+n.options.width+'" height="'+n.options.height+'" src="'+window.location.href+'" frameBorder="0"></iframe>')}function a(e){e.preventDefault()}return{initialize:function(){n=this,t=e("#embed-"+this.options.id),this.el.on("click",o),e("textarea",t).on("focus",i).on("mouseup",a),e("input",t).on("keyup change",r),u()},options:{id:0,width:700,height:400}}}))}});
//# sourceMappingURL=tool-embed.js.map