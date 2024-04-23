"use strict";

(function () {
  var out$ = typeof exports != 'undefined' && exports || typeof define != 'undefined' && {} || this || window;
  if (typeof define !== 'undefined') define(function () {
    return out$;
  });
  var xmlns = 'http://www.w3.org/2000/xmlns/';
  var doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" [<!ENTITY nbsp "&#160;">]>';
  var urlRegex = /url\(["']?(.+?)["']?\)/;
  var fontFormats = {
    woff2: 'font/woff2',
    woff: 'font/woff',
    otf: 'application/x-font-opentype',
    ttf: 'application/x-font-ttf',
    eot: 'application/vnd.ms-fontobject',
    sfnt: 'application/font-sfnt',
    svg: 'image/svg+xml'
  };

  var isElement = function isElement(obj) {
    return obj instanceof HTMLElement || obj instanceof SVGElement;
  };

  var requireDomNode = function requireDomNode(el) {
    if (!isElement(el)) throw new Error("an HTMLElement or SVGElement is required; got ".concat(el));
  };

  var isExternal = function isExternal(url) {
    return url && url.lastIndexOf('http', 0) === 0 && url.lastIndexOf(window.location.host) === -1;
  };

  var getFontMimeTypeFromUrl = function getFontMimeTypeFromUrl(fontUrl) {
    var formats = Object.keys(fontFormats).filter(function (extension) {
      return fontUrl.indexOf(".".concat(extension)) > 0;
    }).map(function (extension) {
      return fontFormats[extension];
    });
    if (formats) return formats[0];
    console.error("Unknown font format for ".concat(fontUrl, ". Fonts may not be working correctly."));
    return 'application/octet-stream';
  };

  var arrayBufferToBase64 = function arrayBufferToBase64(buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);

    for (var i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return window.btoa(binary);
  };

  var getDimension = function getDimension(el, clone, dim) {
    var v = el.viewBox && el.viewBox.baseVal && el.viewBox.baseVal[dim] || clone.getAttribute(dim) !== null && !clone.getAttribute(dim).match(/%$/) && parseInt(clone.getAttribute(dim)) || el.getBoundingClientRect()[dim] || parseInt(clone.style[dim]) || parseInt(window.getComputedStyle(el).getPropertyValue(dim));
    return typeof v === 'undefined' || v === null || isNaN(parseFloat(v)) ? 0 : v;
  };

  var getDimensions = function getDimensions(el, clone, width, height) {
    if (el.tagName === 'svg') return {
      width: width || getDimension(el, clone, 'width'),
      height: height || getDimension(el, clone, 'height')
    };else if (el.getBBox) {
      var _el$getBBox = el.getBBox(),
          x = _el$getBBox.x,
          y = _el$getBBox.y,
          _width = _el$getBBox.width,
          _height = _el$getBBox.height;

      return {
        width: x + _width,
        height: y + _height
      };
    }
  };

  var reEncode = function reEncode(data) {
    return decodeURIComponent(encodeURIComponent(data).replace(/%([0-9A-F]{2})/g, function (match, p1) {
      var c = String.fromCharCode("0x".concat(p1));
      return c === '%' ? '%25' : c;
    }));
  };

  var uriToBlob = function uriToBlob(uri) {
    var byteString = window.atob(uri.split(',')[1]);
    var mimeString = uri.split(',')[0].split(':')[1].split(';')[0];
    var buffer = new ArrayBuffer(byteString.length);
    var intArray = new Uint8Array(buffer);

    for (var i = 0; i < byteString.length; i++) {
      intArray[i] = byteString.charCodeAt(i);
    }

    return new Blob([buffer], {
      type: mimeString
    });
  };

  var query = function query(el, selector) {
    if (!selector) return;

    try {
      return el.querySelector(selector) || el.parentNode && el.parentNode.querySelector(selector);
    } catch (err) {
      console.warn("Invalid CSS selector \"".concat(selector, "\""), err);
    }
  };

  var detectCssFont = function detectCssFont(rule, href) {
    // Match CSS font-face rules to external links.
    // @font-face {
    //   src: local('Abel'), url(https://fonts.gstatic.com/s/abel/v6/UzN-iejR1VoXU2Oc-7LsbvesZW2xOQ-xsNqO47m55DA.woff2);
    // }
    var match = rule.cssText.match(urlRegex);
    var url = match && match[1] || '';
    if (!url || url.match(/^data:/) || url === 'about:blank') return;
    var fullUrl = url.startsWith('../') ? "".concat(href, "/../").concat(url) : url.startsWith('./') ? "".concat(href, "/.").concat(url) : url;
    return {
      text: rule.cssText,
      format: getFontMimeTypeFromUrl(fullUrl),
      url: fullUrl
    };
  };

  var inlineImages = function inlineImages(el) {
    return Promise.all(Array.from(el.querySelectorAll('image')).map(function (image) {
      var href = image.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || image.getAttribute('href');
      if (!href) return Promise.resolve(null);

      if (isExternal(href)) {
        href += (href.indexOf('?') === -1 ? '?' : '&') + 't=' + new Date().valueOf();
      }

      return new Promise(function (resolve, reject) {
        var canvas = document.createElement('canvas');
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = href;

        img.onerror = function () {
          return reject(new Error("Could not load ".concat(href)));
        };

        img.onload = function () {
          canvas.width = img.width;
          canvas.height = img.height;
          canvas.getContext('2d').drawImage(img, 0, 0);
          image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', canvas.toDataURL('image/png'));
          resolve(true);
        };
      });
    }));
  };

  var cachedFonts = {};

  var inlineFonts = function inlineFonts(fonts) {
    return Promise.all(fonts.map(function (font) {
      return new Promise(function (resolve, reject) {
        if (cachedFonts[font.url]) return resolve(cachedFonts[font.url]);
        var req = new XMLHttpRequest();
        req.addEventListener('load', function () {
          // TODO: it may also be worth it to wait until fonts are fully loaded before
          // attempting to rasterize them. (e.g. use https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet)
          var fontInBase64 = arrayBufferToBase64(req.response);
          var fontUri = font.text.replace(urlRegex, "url(\"data:".concat(font.format, ";base64,").concat(fontInBase64, "\")")) + '\n';
          cachedFonts[font.url] = fontUri;
          resolve(fontUri);
        });
        req.addEventListener('error', function (e) {
          console.warn("Failed to load font from: ".concat(font.url), e);
          cachedFonts[font.url] = null;
          resolve(null);
        });
        req.addEventListener('abort', function (e) {
          console.warn("Aborted loading font from: ".concat(font.url), e);
          resolve(null);
        });
        req.open('GET', font.url);
        req.responseType = 'arraybuffer';
        req.send();
      });
    })).then(function (fontCss) {
      return fontCss.filter(function (x) {
        return x;
      }).join('');
    });
  };

  var cachedRules = null;

  var styleSheetRules = function styleSheetRules() {
    if (cachedRules) return cachedRules;
    return cachedRules = Array.from(document.styleSheets).map(function (sheet) {
      try {
        return {
          rules: sheet.cssRules,
          href: sheet.href
        };
      } catch (e) {
        console.warn("Stylesheet could not be loaded: ".concat(sheet.href), e);
        return {};
      }
    });
  };

  var inlineCss = function inlineCss(el, options) {
    var _ref = options || {},
        selectorRemap = _ref.selectorRemap,
        modifyStyle = _ref.modifyStyle,
        modifyCss = _ref.modifyCss,
        fonts = _ref.fonts;

    var generateCss = modifyCss || function (selector, properties) {
      var sel = selectorRemap ? selectorRemap(selector) : selector;
      var props = modifyStyle ? modifyStyle(properties) : properties;
      return "".concat(sel, "{").concat(props, "}\n");
    };

    var css = [];
    var detectFonts = typeof fonts === 'undefined';
    var fontList = fonts || [];
    styleSheetRules().forEach(function (_ref2) {
      var rules = _ref2.rules,
          href = _ref2.href;
      if (!rules) return;
      Array.from(rules).forEach(function (rule) {
        if (typeof rule.style != 'undefined') {
          if (query(el, rule.selectorText)) css.push(generateCss(rule.selectorText, rule.style.cssText));else if (detectFonts && rule.cssText.match(/^@font-face/)) {
            var font = detectCssFont(rule, href);
            if (font) fontList.push(font);
          } else css.push(rule.cssText);
        }
      });
    });
    return inlineFonts(fontList).then(function (fontCss) {
      return css.join('\n') + fontCss;
    });
  };

  out$.prepareSvg = function (el, options, done) {
    requireDomNode(el);

    var _ref3 = options || {},
        _ref3$left = _ref3.left,
        left = _ref3$left === void 0 ? 0 : _ref3$left,
        _ref3$top = _ref3.top,
        top = _ref3$top === void 0 ? 0 : _ref3$top,
        w = _ref3.width,
        h = _ref3.height,
        _ref3$scale = _ref3.scale,
        scale = _ref3$scale === void 0 ? 1 : _ref3$scale,
        _ref3$responsive = _ref3.responsive,
        responsive = _ref3$responsive === void 0 ? false : _ref3$responsive;

    return inlineImages(el).then(function () {
      var clone = el.cloneNode(true);

      var _getDimensions = getDimensions(el, clone, w, h),
          width = _getDimensions.width,
          height = _getDimensions.height;

      if (el.tagName !== 'svg') {
        if (el.getBBox) {
          clone.setAttribute('transform', clone.getAttribute('transform').replace(/translate\(.*?\)/, ''));
          var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.appendChild(clone);
          clone = svg;
        } else {
          console.error('Attempted to render non-SVG element', el);
          return;
        }
      }

      clone.setAttribute('version', '1.1');
      clone.setAttribute('viewBox', [left, top, width, height].join(' '));
      if (!clone.getAttribute('xmlns')) clone.setAttributeNS(xmlns, 'xmlns', 'http://www.w3.org/2000/svg');
      if (!clone.getAttribute('xmlns:xlink')) clone.setAttributeNS(xmlns, 'xmlns:xlink', 'http://www.w3.org/1999/xlink');

      if (responsive) {
        clone.removeAttribute('width');
        clone.removeAttribute('height');
        clone.setAttribute('preserveAspectRatio', 'xMinYMin meet');
      } else {
        clone.setAttribute('width', width * scale);
        clone.setAttribute('height', height * scale);
      }

      Array.from(clone.querySelectorAll('foreignObject > *')).forEach(function (foreignObject) {
        if (!foreignObject.getAttribute('xmlns')) foreignObject.setAttributeNS(xmlns, 'xmlns', 'http://www.w3.org/1999/xhtml');
      });
      return inlineCss(el, options).then(function (css) {
        var style = document.createElement('style');
        style.setAttribute('type', 'text/css');
        style.innerHTML = "<![CDATA[\n".concat(css, "\n]]>");
        var defs = document.createElement('defs');
        defs.appendChild(style);
        clone.insertBefore(defs, clone.firstChild);
        var outer = document.createElement('div');
        outer.appendChild(clone);
        var src = outer.innerHTML.replace(/NS\d+:href/gi, 'xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href');
        if (typeof done === 'function') done(src, width, height);else return {
          src: src,
          width: width,
          height: height
        };
      });
    });
  };

  out$.svgAsDataUri = function (el, options, done) {
    requireDomNode(el);
    var result = out$.prepareSvg(el, options).then(function (_ref4) {
      var src = _ref4.src;
      return "data:image/svg+xml;base64,".concat(window.btoa(reEncode(doctype + src)));
    });
    if (typeof done === 'function') return result.then(done);
    return result;
  };

  out$.svgAsPngUri = function (el, options, done) {
    requireDomNode(el);

    var _ref5 = options || {},
        _ref5$encoderType = _ref5.encoderType,
        encoderType = _ref5$encoderType === void 0 ? 'image/png' : _ref5$encoderType,
        _ref5$encoderOptions = _ref5.encoderOptions,
        encoderOptions = _ref5$encoderOptions === void 0 ? 0.8 : _ref5$encoderOptions,
        backgroundColor = _ref5.backgroundColor,
        canvg = _ref5.canvg;

    var convertToPng = function convertToPng(_ref6) {
      var src = _ref6.src,
          width = _ref6.width,
          height = _ref6.height;
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      var pixelRatio = window.devicePixelRatio || 1;
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      canvas.style.width = "".concat(canvas.width, "px");
      canvas.style.height = "".concat(canvas.height, "px");
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      if (canvg) canvg(canvas, src);else context.drawImage(src, 0, 0);

      if (backgroundColor) {
        context.globalCompositeOperation = 'destination-over';
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      var png;

      try {
        png = canvas.toDataURL(encoderType, encoderOptions);
      } catch (e) {
        if (typeof SecurityError !== 'undefined' && e instanceof SecurityError || e.name === 'SecurityError') {
          console.error('Rendered SVG images cannot be downloaded in this browser.');
          return;
        } else throw e;
      }

      if (typeof done === 'function') done(png);
      return Promise.resolve(png);
    };

    if (canvg) return out$.prepareSvg(el, options).then(convertToPng);else return out$.svgAsDataUri(el, options).then(function (uri) {
      return new Promise(function (resolve, reject) {
        var image = new Image();

        image.onload = function () {
          return resolve(convertToPng({
            src: image,
            width: image.width,
            height: image.height
          }));
        };

        image.onerror = function () {
          reject("There was an error loading the data URI as an image on the following SVG\n".concat(window.atob(uri.slice(26)), "Open the following link to see browser's diagnosis\n").concat(uri));
        };

        image.src = uri;
      });
    });
  };

  out$.download = function (name, uri) {
    if (navigator.msSaveOrOpenBlob) navigator.msSaveOrOpenBlob(uriToBlob(uri), name);else {
      var saveLink = document.createElement('a');

      if ('download' in saveLink) {
        saveLink.download = name;
        saveLink.style.display = 'none';
        document.body.appendChild(saveLink);

        try {
          var blob = uriToBlob(uri);
          var url = URL.createObjectURL(blob);
          saveLink.href = url;

          saveLink.onclick = function () {
            return requestAnimationFrame(function () {
              return URL.revokeObjectURL(url);
            });
          };
        } catch (e) {
          console.warn('This browser does not support object URLs. Falling back to string URL.');
          saveLink.href = uri;
        }

        saveLink.click();
        document.body.removeChild(saveLink);
      } else {
        window.open(uri, '_temp', 'menubar=no,toolbar=no,status=no');
      }
    }
  };

  out$.saveSvg = function (el, name, options) {
    requireDomNode(el);
    out$.svgAsDataUri(el, options || {}, function (uri) {
      return out$.download(name, uri);
    });
  };

  out$.saveSvgAsPng = function (el, name, options) {
    requireDomNode(el);
    out$.svgAsPngUri(el, options || {}, function (uri) {
      return out$.download(name, uri);
    });
  };
})();