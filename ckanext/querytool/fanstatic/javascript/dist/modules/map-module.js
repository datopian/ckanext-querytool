!function(t){var e={};function n(r){if(e[r])return e[r].exports;var i=e[r]={i:r,l:!1,exports:{}};return t[r].call(i.exports,i,i.exports,n),i.l=!0,i.exports}n.m=t,n.c=e,n.d=function(t,e,r){n.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:r})},n.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},n.t=function(t,e){if(1&e&&(t=n(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var i in t)n.d(r,i,function(e){return t[e]}.bind(null,i));return r},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},n.p="",n(n.s=136)}([function(t,e,n){var r=n(22)("wks"),i=n(15),o=n(2).Symbol,a="function"==typeof o;(t.exports=function(t){return r[t]||(r[t]=a&&o[t]||(a?o:i)("Symbol."+t))}).store=r},function(t,e,n){var r=n(2),i=n(14),o=n(7),a=n(10),s=n(24),u=function(t,e,n){var c,l,f,p,h=t&u.F,d=t&u.G,v=t&u.S,y=t&u.P,m=t&u.B,g=d?r:v?r[e]||(r[e]={}):(r[e]||{}).prototype,b=d?i:i[e]||(i[e]={}),_=b.prototype||(b.prototype={});for(c in d&&(n=e),n)f=((l=!h&&g&&void 0!==g[c])?g:n)[c],p=m&&l?s(f,r):y&&"function"==typeof f?s(Function.call,f):f,g&&a(g,c,f,t&u.U),b[c]!=f&&o(b,c,p),y&&_[c]!=f&&(_[c]=f)};r.core=i,u.F=1,u.G=2,u.S=4,u.P=8,u.B=16,u.W=32,u.U=64,u.R=128,t.exports=u},function(t,e){var n=t.exports="undefined"!=typeof window&&window.Math==Math?window:"undefined"!=typeof self&&self.Math==Math?self:Function("return this")();"number"==typeof __g&&(__g=n)},function(t,e){t.exports=function(t){try{return!!t()}catch(t){return!0}}},function(t,e,n){t.exports=!n(3)((function(){return 7!=Object.defineProperty({},"a",{get:function(){return 7}}).a}))},function(t,e,n){var r=n(8);t.exports=function(t){if(!r(t))throw TypeError(t+" is not an object!");return t}},function(t,e,n){var r=n(5),i=n(42),o=n(25),a=Object.defineProperty;e.f=n(4)?Object.defineProperty:function(t,e,n){if(r(t),e=o(e,!0),r(n),i)try{return a(t,e,n)}catch(t){}if("get"in n||"set"in n)throw TypeError("Accessors not supported!");return"value"in n&&(t[e]=n.value),t}},function(t,e,n){var r=n(6),i=n(18);t.exports=n(4)?function(t,e,n){return r.f(t,e,i(1,n))}:function(t,e,n){return t[e]=n,t}},function(t,e){t.exports=function(t){return"object"==typeof t?null!==t:"function"==typeof t}},function(t,e,n){var r=n(17),i=Math.min;t.exports=function(t){return t>0?i(r(t),9007199254740991):0}},function(t,e,n){var r=n(2),i=n(7),o=n(11),a=n(15)("src"),s=n(56),u=(""+s).split("toString");n(14).inspectSource=function(t){return s.call(t)},(t.exports=function(t,e,n,s){var c="function"==typeof n;c&&(o(n,"name")||i(n,"name",e)),t[e]!==n&&(c&&(o(n,a)||i(n,a,t[e]?""+t[e]:u.join(String(e)))),t===r?t[e]=n:s?t[e]?t[e]=n:i(t,e,n):(delete t[e],i(t,e,n)))})(Function.prototype,"toString",(function(){return"function"==typeof this&&this[a]||s.call(this)}))},function(t,e){var n={}.hasOwnProperty;t.exports=function(t,e){return n.call(t,e)}},function(t,e,n){var r=n(19);t.exports=function(t){return Object(r(t))}},function(t,e,n){var r=n(41),i=n(19);t.exports=function(t){return r(i(t))}},function(t,e){var n=t.exports={version:"2.6.12"};"number"==typeof __e&&(__e=n)},function(t,e){var n=0,r=Math.random();t.exports=function(t){return"Symbol(".concat(void 0===t?"":t,")_",(++n+r).toString(36))}},function(t,e){var n={}.toString;t.exports=function(t){return n.call(t).slice(8,-1)}},function(t,e){var n=Math.ceil,r=Math.floor;t.exports=function(t){return isNaN(t=+t)?0:(t>0?r:n)(t)}},function(t,e){t.exports=function(t,e){return{enumerable:!(1&t),configurable:!(2&t),writable:!(4&t),value:e}}},function(t,e){t.exports=function(t){if(null==t)throw TypeError("Can't call method on  "+t);return t}},function(t,e){t.exports={}},function(t,e){t.exports=!1},function(t,e,n){var r=n(14),i=n(2),o=i["__core-js_shared__"]||(i["__core-js_shared__"]={});(t.exports=function(t,e){return o[t]||(o[t]=void 0!==e?e:{})})("versions",[]).push({version:r.version,mode:n(21)?"pure":"global",copyright:"© 2020 Denis Pushkarev (zloirock.ru)"})},function(t,e,n){var r=n(49),i=n(34);t.exports=Object.keys||function(t){return r(t,i)}},function(t,e,n){var r=n(26);t.exports=function(t,e,n){if(r(t),void 0===e)return t;switch(n){case 1:return function(n){return t.call(e,n)};case 2:return function(n,r){return t.call(e,n,r)};case 3:return function(n,r,i){return t.call(e,n,r,i)}}return function(){return t.apply(e,arguments)}}},function(t,e,n){var r=n(8);t.exports=function(t,e){if(!r(t))return t;var n,i;if(e&&"function"==typeof(n=t.toString)&&!r(i=n.call(t)))return i;if("function"==typeof(n=t.valueOf)&&!r(i=n.call(t)))return i;if(!e&&"function"==typeof(n=t.toString)&&!r(i=n.call(t)))return i;throw TypeError("Can't convert object to primitive value")}},function(t,e){t.exports=function(t){if("function"!=typeof t)throw TypeError(t+" is not a function!");return t}},function(t,e,n){var r=n(24),i=n(41),o=n(12),a=n(9),s=n(58);t.exports=function(t,e){var n=1==t,u=2==t,c=3==t,l=4==t,f=6==t,p=5==t||f,h=e||s;return function(e,s,d){for(var v,y,m=o(e),g=i(m),b=r(s,d,3),_=a(g.length),x=0,S=n?h(e,_):u?h(e,0):void 0;_>x;x++)if((p||x in g)&&(y=b(v=g[x],x,m),t))if(n)S[x]=y;else if(y)switch(t){case 3:return!0;case 5:return v;case 6:return x;case 2:S.push(v)}else if(l)return!1;return f?-1:c||l?l:S}}},function(t,e,n){var r=n(0)("unscopables"),i=Array.prototype;null==i[r]&&n(7)(i,r,{}),t.exports=function(t){i[r][t]=!0}},function(t,e,n){var r=n(16),i=n(0)("toStringTag"),o="Arguments"==r(function(){return arguments}());t.exports=function(t){var e,n,a;return void 0===t?"Undefined":null===t?"Null":"string"==typeof(n=function(t,e){try{return t[e]}catch(t){}}(e=Object(t),i))?n:o?r(e):"Object"==(a=r(e))&&"function"==typeof e.callee?"Arguments":a}},function(t,e,n){var r=n(6).f,i=n(11),o=n(0)("toStringTag");t.exports=function(t,e,n){t&&!i(t=n?t:t.prototype,o)&&r(t,o,{configurable:!0,value:e})}},function(t,e,n){"use strict";var r=n(3);t.exports=function(t,e){return!!t&&r((function(){e?t.call(null,(function(){}),1):t.call(null)}))}},function(t,e){e.f={}.propertyIsEnumerable},function(t,e,n){var r=n(22)("keys"),i=n(15);t.exports=function(t){return r[t]||(r[t]=i(t))}},function(t,e){t.exports="constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf".split(",")},function(t,e,n){var r=n(17),i=Math.max,o=Math.min;t.exports=function(t,e){return(t=r(t))<0?i(t+e,0):o(t,e)}},function(t,e,n){var r=n(16);t.exports=Array.isArray||function(t){return"Array"==r(t)}},function(t,e,n){var r=n(49),i=n(34).concat("length","prototype");e.f=Object.getOwnPropertyNames||function(t){return r(t,i)}},function(t,e,n){"use strict";var r,i,o=n(48),a=RegExp.prototype.exec,s=String.prototype.replace,u=a,c=(r=/a/,i=/b*/g,a.call(r,"a"),a.call(i,"a"),0!==r.lastIndex||0!==i.lastIndex),l=void 0!==/()??/.exec("")[1];(c||l)&&(u=function(t){var e,n,r,i,u=this;return l&&(n=new RegExp("^"+u.source+"$(?!\\s)",o.call(u))),c&&(e=u.lastIndex),r=a.call(u,t),c&&r&&(u.lastIndex=u.global?r.index+r[0].length:e),l&&r&&r.length>1&&s.call(r[0],n,(function(){for(i=1;i<arguments.length-2;i++)void 0===arguments[i]&&(r[i]=void 0)})),r}),t.exports=u},function(t,e,n){var r=n(5),i=n(67),o=n(34),a=n(33)("IE_PROTO"),s=function(){},u=function(){var t,e=n(43)("iframe"),r=o.length;for(e.style.display="none",n(53).appendChild(e),e.src="javascript:",(t=e.contentWindow.document).open(),t.write("<script>document.F=Object<\/script>"),t.close(),u=t.F;r--;)delete u.prototype[o[r]];return u()};t.exports=Object.create||function(t,e){var n;return null!==t?(s.prototype=r(t),n=new s,s.prototype=null,n[a]=t):n=u(),void 0===e?n:i(n,e)}},function(t,e,n){var r=n(13),i=n(9),o=n(35);t.exports=function(t){return function(e,n,a){var s,u=r(e),c=i(u.length),l=o(a,c);if(t&&n!=n){for(;c>l;)if((s=u[l++])!=s)return!0}else for(;c>l;l++)if((t||l in u)&&u[l]===n)return t||l||0;return!t&&-1}}},function(t,e,n){var r=n(16);t.exports=Object("z").propertyIsEnumerable(0)?Object:function(t){return"String"==r(t)?t.split(""):Object(t)}},function(t,e,n){t.exports=!n(4)&&!n(3)((function(){return 7!=Object.defineProperty(n(43)("div"),"a",{get:function(){return 7}}).a}))},function(t,e,n){var r=n(8),i=n(2).document,o=r(i)&&r(i.createElement);t.exports=function(t){return o?i.createElement(t):{}}},function(t,e,n){var r=n(32),i=n(18),o=n(13),a=n(25),s=n(11),u=n(42),c=Object.getOwnPropertyDescriptor;e.f=n(4)?c:function(t,e){if(t=o(t),e=a(e,!0),u)try{return c(t,e)}catch(t){}if(s(t,e))return i(!r.f.call(t,e),t[e])}},function(t,e,n){"use strict";var r=n(51)(!0);t.exports=function(t,e,n){return e+(n?r(t,e).length:1)}},function(t,e,n){"use strict";var r=n(29),i=RegExp.prototype.exec;t.exports=function(t,e){var n=t.exec;if("function"==typeof n){var o=n.call(t,e);if("object"!=typeof o)throw new TypeError("RegExp exec method returned something other than an Object or null");return o}if("RegExp"!==r(t))throw new TypeError("RegExp#exec called on incompatible receiver");return i.call(t,e)}},function(t,e,n){"use strict";n(65);var r=n(10),i=n(7),o=n(3),a=n(19),s=n(0),u=n(38),c=s("species"),l=!o((function(){var t=/./;return t.exec=function(){var t=[];return t.groups={a:"7"},t},"7"!=="".replace(t,"$<a>")})),f=function(){var t=/(?:)/,e=t.exec;t.exec=function(){return e.apply(this,arguments)};var n="ab".split(t);return 2===n.length&&"a"===n[0]&&"b"===n[1]}();t.exports=function(t,e,n){var p=s(t),h=!o((function(){var e={};return e[p]=function(){return 7},7!=""[t](e)})),d=h?!o((function(){var e=!1,n=/a/;return n.exec=function(){return e=!0,null},"split"===t&&(n.constructor={},n.constructor[c]=function(){return n}),n[p](""),!e})):void 0;if(!h||!d||"replace"===t&&!l||"split"===t&&!f){var v=/./[p],y=n(a,p,""[t],(function(t,e,n,r,i){return e.exec===u?h&&!i?{done:!0,value:v.call(e,n,r)}:{done:!0,value:t.call(n,e,r)}:{done:!1}})),m=y[0],g=y[1];r(String.prototype,t,m),i(RegExp.prototype,p,2==e?function(t,e){return g.call(t,this,e)}:function(t){return g.call(t,this)})}}},function(t,e,n){"use strict";var r=n(5);t.exports=function(){var t=r(this),e="";return t.global&&(e+="g"),t.ignoreCase&&(e+="i"),t.multiline&&(e+="m"),t.unicode&&(e+="u"),t.sticky&&(e+="y"),e}},function(t,e,n){var r=n(11),i=n(13),o=n(40)(!1),a=n(33)("IE_PROTO");t.exports=function(t,e){var n,s=i(t),u=0,c=[];for(n in s)n!=a&&r(s,n)&&c.push(n);for(;e.length>u;)r(s,n=e[u++])&&(~o(c,n)||c.push(n));return c}},function(t,e,n){"use strict";var r=n(28),i=n(70),o=n(20),a=n(13);t.exports=n(52)(Array,"Array",(function(t,e){this._t=a(t),this._i=0,this._k=e}),(function(){var t=this._t,e=this._k,n=this._i++;return!t||n>=t.length?(this._t=void 0,i(1)):i(0,"keys"==e?n:"values"==e?t[n]:[n,t[n]])}),"values"),o.Arguments=o.Array,r("keys"),r("values"),r("entries")},function(t,e,n){var r=n(17),i=n(19);t.exports=function(t){return function(e,n){var o,a,s=String(i(e)),u=r(n),c=s.length;return u<0||u>=c?t?"":void 0:(o=s.charCodeAt(u))<55296||o>56319||u+1===c||(a=s.charCodeAt(u+1))<56320||a>57343?t?s.charAt(u):o:t?s.slice(u,u+2):a-56320+(o-55296<<10)+65536}}},function(t,e,n){"use strict";var r=n(21),i=n(1),o=n(10),a=n(7),s=n(20),u=n(68),c=n(30),l=n(60),f=n(0)("iterator"),p=!([].keys&&"next"in[].keys()),h=function(){return this};t.exports=function(t,e,n,d,v,y,m){u(n,e,d);var g,b,_,x=function(t){if(!p&&t in F)return F[t];switch(t){case"keys":case"values":return function(){return new n(this,t)}}return function(){return new n(this,t)}},S=e+" Iterator",w="values"==v,O=!1,F=t.prototype,j=F[f]||F["@@iterator"]||v&&F[v],L=j||x(v),k=v?w?x("entries"):L:void 0,A="Array"==e&&F.entries||j;if(A&&(_=l(A.call(new t)))!==Object.prototype&&_.next&&(c(_,S,!0),r||"function"==typeof _[f]||a(_,f,h)),w&&j&&"values"!==j.name&&(O=!0,L=function(){return j.call(this)}),r&&!m||!p&&!O&&F[f]||a(F,f,L),s[e]=L,s[S]=h,v)if(g={values:w?L:x("values"),keys:y?L:x("keys"),entries:k},m)for(b in g)b in F||o(F,b,g[b]);else i(i.P+i.F*(p||O),e,g);return g}},function(t,e,n){var r=n(2).document;t.exports=r&&r.documentElement},function(t,e,n){e.f=n(0)},function(t,e){e.f=Object.getOwnPropertySymbols},function(t,e,n){t.exports=n(22)("native-function-to-string",Function.toString)},function(t,e,n){"use strict";var r=n(1),i=n(27)(5),o=!0;"find"in[]&&Array(1).find((function(){o=!1})),r(r.P+r.F*o,"Array",{find:function(t){return i(this,t,arguments.length>1?arguments[1]:void 0)}}),n(28)("find")},function(t,e,n){var r=n(59);t.exports=function(t,e){return new(r(t))(e)}},function(t,e,n){var r=n(8),i=n(36),o=n(0)("species");t.exports=function(t){var e;return i(t)&&("function"!=typeof(e=t.constructor)||e!==Array&&!i(e.prototype)||(e=void 0),r(e)&&null===(e=e[o])&&(e=void 0)),void 0===e?Array:e}},function(t,e,n){var r=n(11),i=n(12),o=n(33)("IE_PROTO"),a=Object.prototype;t.exports=Object.getPrototypeOf||function(t){return t=i(t),r(t,o)?t[o]:"function"==typeof t.constructor&&t instanceof t.constructor?t.constructor.prototype:t instanceof Object?a:null}},function(t,e,n){var r=n(20),i=n(0)("iterator"),o=Array.prototype;t.exports=function(t){return void 0!==t&&(r.Array===t||o[i]===t)}},function(t,e,n){var r=n(29),i=n(0)("iterator"),o=n(20);t.exports=n(14).getIteratorMethod=function(t){if(null!=t)return t[i]||t["@@iterator"]||o[r(t)]}},function(t,e,n){var r=n(0)("iterator"),i=!1;try{var o=[7][r]();o.return=function(){i=!0},Array.from(o,(function(){throw 2}))}catch(t){}t.exports=function(t,e){if(!e&&!i)return!1;var n=!1;try{var o=[7],a=o[r]();a.next=function(){return{done:n=!0}},o[r]=function(){return a},t(o)}catch(t){}return n}},function(t,e,n){"use strict";var r=n(5),i=n(12),o=n(9),a=n(17),s=n(45),u=n(46),c=Math.max,l=Math.min,f=Math.floor,p=/\$([$&`']|\d\d?|<[^>]*>)/g,h=/\$([$&`']|\d\d?)/g;n(47)("replace",2,(function(t,e,n,d){return[function(r,i){var o=t(this),a=null==r?void 0:r[e];return void 0!==a?a.call(r,o,i):n.call(String(o),r,i)},function(t,e){var i=d(n,t,this,e);if(i.done)return i.value;var f=r(t),p=String(this),h="function"==typeof e;h||(e=String(e));var y=f.global;if(y){var m=f.unicode;f.lastIndex=0}for(var g=[];;){var b=u(f,p);if(null===b)break;if(g.push(b),!y)break;""===String(b[0])&&(f.lastIndex=s(p,o(f.lastIndex),m))}for(var _,x="",S=0,w=0;w<g.length;w++){b=g[w];for(var O=String(b[0]),F=c(l(a(b.index),p.length),0),j=[],L=1;L<b.length;L++)j.push(void 0===(_=b[L])?_:String(_));var k=b.groups;if(h){var A=[O].concat(j,F,p);void 0!==k&&A.push(k);var P=String(e.apply(void 0,A))}else P=v(O,p,F,j,k,e);F>=S&&(x+=p.slice(S,F)+P,S=F+O.length)}return x+p.slice(S)}];function v(t,e,r,o,a,s){var u=r+t.length,c=o.length,l=h;return void 0!==a&&(a=i(a),l=p),n.call(s,l,(function(n,i){var s;switch(i.charAt(0)){case"$":return"$";case"&":return t;case"`":return e.slice(0,r);case"'":return e.slice(u);case"<":s=a[i.slice(1,-1)];break;default:var l=+i;if(0===l)return n;if(l>c){var p=f(l/10);return 0===p?n:p<=c?void 0===o[p-1]?i.charAt(1):o[p-1]+i.charAt(1):n}s=o[l-1]}return void 0===s?"":s}))}}))},function(t,e,n){"use strict";var r=n(38);n(1)({target:"RegExp",proto:!0,forced:r!==/./.exec},{exec:r})},function(t,e,n){var r=n(8),i=n(16),o=n(0)("match");t.exports=function(t){var e;return r(t)&&(void 0!==(e=t[o])?!!e:"RegExp"==i(t))}},function(t,e,n){var r=n(6),i=n(5),o=n(23);t.exports=n(4)?Object.defineProperties:function(t,e){i(t);for(var n,a=o(e),s=a.length,u=0;s>u;)r.f(t,n=a[u++],e[n]);return t}},function(t,e,n){"use strict";var r=n(39),i=n(18),o=n(30),a={};n(7)(a,n(0)("iterator"),(function(){return this})),t.exports=function(t,e,n){t.prototype=r(a,{next:i(1,n)}),o(t,e+" Iterator")}},function(t,e,n){"use strict";var r=n(29),i={};i[n(0)("toStringTag")]="z",i+""!="[object z]"&&n(10)(Object.prototype,"toString",(function(){return"[object "+r(this)+"]"}),!0)},function(t,e){t.exports=function(t,e){return{value:e,done:!!t}}},function(t,e,n){var r=n(5),i=n(26),o=n(0)("species");t.exports=function(t,e){var n,a=r(t).constructor;return void 0===a||null==(n=r(a)[o])?e:i(n)}},function(t,e,n){"use strict";var r=n(2),i=n(11),o=n(4),a=n(1),s=n(10),u=n(73).KEY,c=n(3),l=n(22),f=n(30),p=n(15),h=n(0),d=n(54),v=n(74),y=n(75),m=n(36),g=n(5),b=n(8),_=n(12),x=n(13),S=n(25),w=n(18),O=n(39),F=n(76),j=n(44),L=n(55),k=n(6),A=n(23),P=j.f,T=k.f,E=F.f,M=r.Symbol,C=r.JSON,I=C&&C.stringify,R=h("_hidden"),N=h("toPrimitive"),V={}.propertyIsEnumerable,D=l("symbol-registry"),K=l("symbols"),z=l("op-symbols"),q=Object.prototype,B="function"==typeof M&&!!L.f,U=r.QObject,G=!U||!U.prototype||!U.prototype.findChild,$=o&&c((function(){return 7!=O(T({},"a",{get:function(){return T(this,"a",{value:7}).a}})).a}))?function(t,e,n){var r=P(q,e);r&&delete q[e],T(t,e,n),r&&t!==q&&T(q,e,r)}:T,H=function(t){var e=K[t]=O(M.prototype);return e._k=t,e},J=B&&"symbol"==typeof M.iterator?function(t){return"symbol"==typeof t}:function(t){return t instanceof M},W=function(t,e,n){return t===q&&W(z,e,n),g(t),e=S(e,!0),g(n),i(K,e)?(n.enumerable?(i(t,R)&&t[R][e]&&(t[R][e]=!1),n=O(n,{enumerable:w(0,!1)})):(i(t,R)||T(t,R,w(1,{})),t[R][e]=!0),$(t,e,n)):T(t,e,n)},Z=function(t,e){g(t);for(var n,r=y(e=x(e)),i=0,o=r.length;o>i;)W(t,n=r[i++],e[n]);return t},Y=function(t){var e=V.call(this,t=S(t,!0));return!(this===q&&i(K,t)&&!i(z,t))&&(!(e||!i(this,t)||!i(K,t)||i(this,R)&&this[R][t])||e)},Q=function(t,e){if(t=x(t),e=S(e,!0),t!==q||!i(K,e)||i(z,e)){var n=P(t,e);return!n||!i(K,e)||i(t,R)&&t[R][e]||(n.enumerable=!0),n}},X=function(t){for(var e,n=E(x(t)),r=[],o=0;n.length>o;)i(K,e=n[o++])||e==R||e==u||r.push(e);return r},tt=function(t){for(var e,n=t===q,r=E(n?z:x(t)),o=[],a=0;r.length>a;)!i(K,e=r[a++])||n&&!i(q,e)||o.push(K[e]);return o};B||(s((M=function(){if(this instanceof M)throw TypeError("Symbol is not a constructor!");var t=p(arguments.length>0?arguments[0]:void 0),e=function(n){this===q&&e.call(z,n),i(this,R)&&i(this[R],t)&&(this[R][t]=!1),$(this,t,w(1,n))};return o&&G&&$(q,t,{configurable:!0,set:e}),H(t)}).prototype,"toString",(function(){return this._k})),j.f=Q,k.f=W,n(37).f=F.f=X,n(32).f=Y,L.f=tt,o&&!n(21)&&s(q,"propertyIsEnumerable",Y,!0),d.f=function(t){return H(h(t))}),a(a.G+a.W+a.F*!B,{Symbol:M});for(var et="hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables".split(","),nt=0;et.length>nt;)h(et[nt++]);for(var rt=A(h.store),it=0;rt.length>it;)v(rt[it++]);a(a.S+a.F*!B,"Symbol",{for:function(t){return i(D,t+="")?D[t]:D[t]=M(t)},keyFor:function(t){if(!J(t))throw TypeError(t+" is not a symbol!");for(var e in D)if(D[e]===t)return e},useSetter:function(){G=!0},useSimple:function(){G=!1}}),a(a.S+a.F*!B,"Object",{create:function(t,e){return void 0===e?O(t):Z(O(t),e)},defineProperty:W,defineProperties:Z,getOwnPropertyDescriptor:Q,getOwnPropertyNames:X,getOwnPropertySymbols:tt});var ot=c((function(){L.f(1)}));a(a.S+a.F*ot,"Object",{getOwnPropertySymbols:function(t){return L.f(_(t))}}),C&&a(a.S+a.F*(!B||c((function(){var t=M();return"[null]"!=I([t])||"{}"!=I({a:t})||"{}"!=I(Object(t))}))),"JSON",{stringify:function(t){for(var e,n,r=[t],i=1;arguments.length>i;)r.push(arguments[i++]);if(n=e=r[1],(b(e)||void 0!==t)&&!J(t))return m(e)||(e=function(t,e){if("function"==typeof n&&(e=n.call(this,t,e)),!J(e))return e}),r[1]=e,I.apply(C,r)}}),M.prototype[N]||n(7)(M.prototype,N,M.prototype.valueOf),f(M,"Symbol"),f(Math,"Math",!0),f(r.JSON,"JSON",!0)},function(t,e,n){var r=n(15)("meta"),i=n(8),o=n(11),a=n(6).f,s=0,u=Object.isExtensible||function(){return!0},c=!n(3)((function(){return u(Object.preventExtensions({}))})),l=function(t){a(t,r,{value:{i:"O"+ ++s,w:{}}})},f=t.exports={KEY:r,NEED:!1,fastKey:function(t,e){if(!i(t))return"symbol"==typeof t?t:("string"==typeof t?"S":"P")+t;if(!o(t,r)){if(!u(t))return"F";if(!e)return"E";l(t)}return t[r].i},getWeak:function(t,e){if(!o(t,r)){if(!u(t))return!0;if(!e)return!1;l(t)}return t[r].w},onFreeze:function(t){return c&&f.NEED&&u(t)&&!o(t,r)&&l(t),t}}},function(t,e,n){var r=n(2),i=n(14),o=n(21),a=n(54),s=n(6).f;t.exports=function(t){var e=i.Symbol||(i.Symbol=o?{}:r.Symbol||{});"_"==t.charAt(0)||t in e||s(e,t,{value:a.f(t)})}},function(t,e,n){var r=n(23),i=n(55),o=n(32);t.exports=function(t){var e=r(t),n=i.f;if(n)for(var a,s=n(t),u=o.f,c=0;s.length>c;)u.call(t,a=s[c++])&&e.push(a);return e}},function(t,e,n){var r=n(13),i=n(37).f,o={}.toString,a="object"==typeof window&&window&&Object.getOwnPropertyNames?Object.getOwnPropertyNames(window):[];t.exports.f=function(t){return a&&"[object Window]"==o.call(t)?function(t){try{return i(t)}catch(t){return a.slice()}}(t):i(r(t))}},function(t,e,n){"use strict";var r=n(24),i=n(1),o=n(12),a=n(78),s=n(61),u=n(9),c=n(79),l=n(62);i(i.S+i.F*!n(63)((function(t){Array.from(t)})),"Array",{from:function(t){var e,n,i,f,p=o(t),h="function"==typeof this?this:Array,d=arguments.length,v=d>1?arguments[1]:void 0,y=void 0!==v,m=0,g=l(p);if(y&&(v=r(v,d>2?arguments[2]:void 0,2)),null==g||h==Array&&s(g))for(n=new h(e=u(p.length));e>m;m++)c(n,m,y?v(p[m],m):p[m]);else for(f=g.call(p),n=new h;!(i=f.next()).done;m++)c(n,m,y?a(f,v,[i.value,m],!0):i.value);return n.length=m,n}})},function(t,e,n){var r=n(5);t.exports=function(t,e,n,i){try{return i?e(r(n)[0],n[1]):e(n)}catch(e){var o=t.return;throw void 0!==o&&r(o.call(t)),e}}},function(t,e,n){"use strict";var r=n(6),i=n(18);t.exports=function(t,e,n){e in t?r.f(t,e,i(0,n)):t[e]=n}},function(t,e,n){"use strict";var r=n(51)(!0);n(52)(String,"String",(function(t){this._t=String(t),this._i=0}),(function(){var t,e=this._t,n=this._i;return n>=e.length?{value:void 0,done:!0}:(t=r(e,n),this._i+=t.length,{value:t,done:!1})}))},function(t,e,n){for(var r=n(50),i=n(23),o=n(10),a=n(2),s=n(7),u=n(20),c=n(0),l=c("iterator"),f=c("toStringTag"),p=u.Array,h={CSSRuleList:!0,CSSStyleDeclaration:!1,CSSValueList:!1,ClientRectList:!1,DOMRectList:!1,DOMStringList:!1,DOMTokenList:!0,DataTransferItemList:!1,FileList:!1,HTMLAllCollection:!1,HTMLCollection:!1,HTMLFormElement:!1,HTMLSelectElement:!1,MediaList:!0,MimeTypeArray:!1,NamedNodeMap:!1,NodeList:!0,PaintRequestList:!1,Plugin:!1,PluginArray:!1,SVGLengthList:!1,SVGNumberList:!1,SVGPathSegList:!1,SVGPointList:!1,SVGStringList:!1,SVGTransformList:!1,SourceBufferList:!1,StyleSheetList:!0,TextTrackCueList:!1,TextTrackList:!1,TouchList:!1},d=i(h),v=0;v<d.length;v++){var y,m=d[v],g=h[m],b=a[m],_=b&&b.prototype;if(_&&(_[l]||s(_,l,p),_[f]||s(_,f,m),u[m]=p,g))for(y in r)_[y]||o(_,y,r[y],!0)}},,function(t,e,n){var r=n(6).f,i=Function.prototype,o=/^\s*function ([^ (]*)/;"name"in i||n(4)&&r(i,"name",{configurable:!0,get:function(){try{return(""+this).match(o)[1]}catch(t){return""}}})},,,function(t,e,n){"use strict";var r=n(1),i=n(53),o=n(16),a=n(35),s=n(9),u=[].slice;r(r.P+r.F*n(3)((function(){i&&u.call(i)})),"Array",{slice:function(t,e){var n=s(this.length),r=o(this);if(e=void 0===e?n:e,"Array"==r)return u.call(this,t,e);for(var i=a(t,n),c=a(e,n),l=s(c-i),f=new Array(l),p=0;p<l;p++)f[p]="String"==r?this.charAt(i+p):this[i+p];return f}})},function(t,e,n){"use strict";var r=n(66),i=n(5),o=n(71),a=n(45),s=n(9),u=n(46),c=n(38),l=n(3),f=Math.min,p=[].push,h="length",d=!l((function(){RegExp(4294967295,"y")}));n(47)("split",2,(function(t,e,n,l){var v;return v="c"=="abbc".split(/(b)*/)[1]||4!="test".split(/(?:)/,-1)[h]||2!="ab".split(/(?:ab)*/)[h]||4!=".".split(/(.?)(.?)/)[h]||".".split(/()()/)[h]>1||"".split(/.?/)[h]?function(t,e){var i=String(this);if(void 0===t&&0===e)return[];if(!r(t))return n.call(i,t,e);for(var o,a,s,u=[],l=(t.ignoreCase?"i":"")+(t.multiline?"m":"")+(t.unicode?"u":"")+(t.sticky?"y":""),f=0,d=void 0===e?4294967295:e>>>0,v=new RegExp(t.source,l+"g");(o=c.call(v,i))&&!((a=v.lastIndex)>f&&(u.push(i.slice(f,o.index)),o[h]>1&&o.index<i[h]&&p.apply(u,o.slice(1)),s=o[0][h],f=a,u[h]>=d));)v.lastIndex===o.index&&v.lastIndex++;return f===i[h]?!s&&v.test("")||u.push(""):u.push(i.slice(f)),u[h]>d?u.slice(0,d):u}:"0".split(void 0,0)[h]?function(t,e){return void 0===t&&0===e?[]:n.call(this,t,e)}:n,[function(n,r){var i=t(this),o=null==n?void 0:n[e];return void 0!==o?o.call(n,i,r):v.call(String(i),n,r)},function(t,e){var r=l(v,t,this,e,v!==n);if(r.done)return r.value;var c=i(t),p=String(this),h=o(c,RegExp),y=c.unicode,m=(c.ignoreCase?"i":"")+(c.multiline?"m":"")+(c.unicode?"u":"")+(d?"y":"g"),g=new h(d?c:"^(?:"+c.source+")",m),b=void 0===e?4294967295:e>>>0;if(0===b)return[];if(0===p.length)return null===u(g,p)?[p]:[];for(var _=0,x=0,S=[];x<p.length;){g.lastIndex=d?x:0;var w,O=u(g,d?p:p.slice(x));if(null===O||(w=f(s(g.lastIndex+(d?0:x)),p.length))===_)x=a(p,x,y);else{if(S.push(p.slice(_,x)),S.length===b)return S;for(var F=1;F<=O.length-1;F++)if(S.push(O[F]),S.length===b)return S;x=_=w}}return S.push(p.slice(_)),S}]}))},function(t,e,n){var r=n(1);r(r.S,"Array",{isArray:n(36)})},function(t,e,n){var r=n(1);r(r.P,"Function",{bind:n(90)})},function(t,e,n){"use strict";var r=n(26),i=n(8),o=n(91),a=[].slice,s={},u=function(t,e,n){if(!(e in s)){for(var r=[],i=0;i<e;i++)r[i]="a["+i+"]";s[e]=Function("F,a","return new F("+r.join(",")+")")}return s[e](t,n)};t.exports=Function.bind||function(t){var e=r(this),n=a.call(arguments,1),s=function(){var r=n.concat(a.call(arguments));return this instanceof s?u(e,r.length,r):o(e,r,t)};return i(e.prototype)&&(s.prototype=e.prototype),s}},function(t,e){t.exports=function(t,e,n){var r=void 0===n;switch(e.length){case 0:return r?t():t.call(n);case 1:return r?t(e[0]):t.call(n,e[0]);case 2:return r?t(e[0],e[1]):t.call(n,e[0],e[1]);case 3:return r?t(e[0],e[1],e[2]):t.call(n,e[0],e[1],e[2]);case 4:return r?t(e[0],e[1],e[2],e[3]):t.call(n,e[0],e[1],e[2],e[3])}return t.apply(n,e)}},,,,,,,,,,,function(t,e,n){var r=Date.prototype,i=r.toString,o=r.getTime;new Date(NaN)+""!="Invalid Date"&&n(10)(r,"toString",(function(){var t=o.call(this);return t==t?i.call(this):"Invalid Date"}))},function(t,e,n){"use strict";n(104);var r=n(5),i=n(48),o=n(4),a=/./.toString,s=function(t){n(10)(RegExp.prototype,"toString",t,!0)};n(3)((function(){return"/a/b"!=a.call({source:"a",flags:"b"})}))?s((function(){var t=r(this);return"/".concat(t.source,"/","flags"in t?t.flags:!o&&t instanceof RegExp?i.call(t):void 0)})):"toString"!=a.name&&s((function(){return a.call(this)}))},function(t,e,n){n(4)&&"g"!=/./g.flags&&n(6).f(RegExp.prototype,"flags",{configurable:!0,get:n(48)})},,,,function(t,e,n){"use strict";var r=n(1),i=n(27)(1);r(r.P+r.F*!n(31)([].map,!0),"Array",{map:function(t){return i(this,t,arguments[1])}})},function(t,e,n){"use strict";var r=n(1),i=n(26),o=n(12),a=n(3),s=[].sort,u=[1,2,3];r(r.P+r.F*(a((function(){u.sort(void 0)}))||!a((function(){u.sort(null)}))||!n(31)(s)),"Array",{sort:function(t){return void 0===t?s.call(o(this)):s.call(o(this),i(t))}})},function(t,e,n){var r=n(12),i=n(23);n(111)("keys",(function(){return function(t){return i(r(t))}}))},function(t,e,n){var r=n(1),i=n(14),o=n(3);t.exports=function(t,e){var n=(i.Object||{})[t]||Object[t],a={};a[t]=e(n),r(r.S+r.F*o((function(){n(1)})),"Object",a)}},,,,,,,,,,,,,,,,,,,,,,,,,function(t,e,n){"use strict";n.r(e);n(57),n(89),n(108),n(87),n(109),n(64),n(110),n(69),n(102),n(103),n(86),n(83),n(72),n(77),n(80),n(50),n(81),n(88);function r(t,e){var n="undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(!n){if(Array.isArray(t)||(n=function(t,e){if(!t)return;if("string"==typeof t)return i(t,e);var n=Object.prototype.toString.call(t).slice(8,-1);"Object"===n&&t.constructor&&(n=t.constructor.name);if("Map"===n||"Set"===n)return Array.from(t);if("Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return i(t,e)}(t))||e&&t&&"number"==typeof t.length){n&&(t=n);var r=0,o=function(){};return{s:o,n:function(){return r>=t.length?{done:!0}:{done:!1,value:t[r++]}},e:function(t){throw t},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var a,s=!0,u=!1;return{s:function(){n=n.call(t)},n:function(){var t=n.next();return s=t.done,t},e:function(t){u=!0,a=t},f:function(){try{s||null==n.return||n.return()}finally{if(u)throw a}}}}function i(t,e){(null==e||e>t.length)&&(e=t.length);for(var n=0,r=new Array(e);n<e;n++)r[n]=t[n];return r}ckan.module("querytool-map",(function(t){var e=function(e,n){var r=ckan.sandbox().client.endpoint+"/api/3/action/"+e+"?"+(n=t.param(n));return t.getJSON(r)},n=function(e,n){var r=ckan.sandbox().client.endpoint+"/api/3/action/"+e;return t.post(r,JSON.stringify(n),"json")};return{initialize:function(){this.initLeaflet.call(this),this.mapResource=this.el.parent().parent().find("[id*=map_resource_]"),this.mapTitleField=this.el.parent().parent().find("[id*=map_title_field_]"),this.mapKeyField=this.el.parent().parent().find("[id*=map_key_field_]"),this.dataKeyField=this.el.parent().parent().find("[id*=map_data_key_field_]"),this.mapColorScheme=this.el.parent().parent().find("[id*=map_color_scheme_]"),this.mapFilterName=this.el.parent().parent().find("[id*=map_field_filter_name_]"),this.mapFilterValue=this.el.parent().parent().find("[id*=map_field_filter_value_]"),this.valueField=t("#choose_y_axis_column"),this.mapResource.change(this.onResourceChange.bind(this)),this.mapTitleField.change(this.onPropertyChange.bind(this)),this.mapKeyField.change(this.onPropertyChange.bind(this)),this.dataKeyField.change(this.onPropertyChange.bind(this)),this.mapColorScheme.change(this.onPropertyChange.bind(this)),this.mapFilterName.change(this.onPropertyChange.bind(this)),this.mapFilterValue.change(this.onPropertyChange.bind(this)),t(".leaflet-control-zoom-in").css({color:"#121e87"}),t(".leaflet-control-zoom-out").css({color:"#121e87"}),this.sandbox.subscribe("querytool:updateMaps",this.onPropertyChange.bind(this))},resetMap:function(){this.options.map_resource=this.mapResource.val(),this.options.map_title_field=this.mapTitleField.val(),this.options.map_key_field=this.mapKeyField.val(),this.options.data_key_field=this.dataKeyField.val(),this.options.y_axis_column=this.valueField.val(),this.map.eachLayer(function(t){t!=this.osm&&this.map.removeLayer(t)}.bind(this)),this.legend&&this.map.removeControl(this.legend),this.info&&this.map.removeControl(this.info),this.map.setView([39,40],2)},onResourceChange:function(){this.options.map_title_field=this.mapTitleField.val(),this.options.map_key_field=this.mapKeyField.val(),this.options.data_key_field=this.dataKeyField.val(),this.options.y_axis_column=this.valueField.val(),this.options.map_resource!=this.mapResource.val()&&""!=this.mapResource.val()?(this.options.map_resource=this.mapResource.val(),e("querytool_get_geojson_properties",{map_resource:this.options.map_resource}).done(function(e){e.success?(this.mapTitleField.find("option").not(":first").remove(),this.mapKeyField.find("option").not(":first").remove(),t.each(e.result,function(t,e){this.mapTitleField.append(new Option(e.text,e.value))}.bind(this)),t.each(e.result,function(t,e){this.mapKeyField.append(new Option(e.text,e.value))}.bind(this)),this.resetMap.call(this)):this.resetMap.call(this)}.bind(this)).error(function(t){this.resetMap.call(this)}.bind(this))):this.resetMap.call(this)},onPropertyChange:function(){this.options.map_resource=this.mapResource.val(),this.options.map_title_field=this.mapTitleField.val(),this.options.map_key_field=this.mapKeyField.val(),this.options.data_key_field=this.dataKeyField.val(),this.options.y_axis_column=this.valueField.val(),this.options.measure_label=t("#choose_y_axis_column option:selected").text(),this.options.map_color_scheme=this.mapColorScheme.val(),this.options.filter_name=this.mapFilterName.val(),this.options.filter_value=this.mapFilterValue.val(),this.options.map_title_field&&this.options.map_key_field&&this.options.data_key_field&&this.options.map_resource&&this.options.y_axis_column?(this.legend&&this.map.removeControl(this.legend),this.map.eachLayer(function(t){t!=this.osm&&this.map.removeLayer(t)}.bind(this)),this.initializeMarkers.call(this,this.options.map_resource)):this.resetMap.call(this)},initLeaflet:function(){var t=!0===this.options.map_resource?"":this.options.map_resource,e=this.el[0].id;this.map=new L.Map(e,{scrollWheelZoom:!1,inertiaMaxSpeed:200,dragging:!L.Browser.mobile}).setView([39,40],2);var n=this.options.map_config.osm_url,r=this.options.map_config.osm_attribute;this.osm=new L.TileLayer(n,{minZoom:2,maxZoom:18,attribution:r}),this.map.addLayer(this.osm),t&&this.initializeMarkers.call(this,t)},createScale:function(e){var n=this.options.map_color_scheme.split(","),r=t.map(e,(function(t,e){return t.value})).sort((function(t,e){return t-e})),i=r[0],o=r[r.length-1];return d3.scale.quantize().domain([i,o]).range(n)},formatNumber:function(t){return t%1?t.toFixed(2):t},createLegend:function(){var e=this.createScale(this.featuresValues);this.legend=L.control({position:"bottomright"}),this.legend.onAdd=function(n){var r=L.DomUtil.create("div","info"),i=L.DomUtil.create("ul","legend"),o=e.domain(),a=e.range(),s=o[0]+1e-10,u=(o[o.length-1]-s)/a.length,c=t.map(a,(function(t,e){return s+u*e}));r.appendChild(i);for(var l=0,f=c.length;l<f;l++)i.innerHTML+='<li><span style="background:'+e(c[l])+'; opacity: 1"></span> '+this.formatNumber(c[l])+(c[l+1]?"&ndash;"+this.formatNumber(c[l+1])+"</li>":"+</li></ul>");return i.innerHTML+='<li><span style="background:#bdbdbd; opacity: 1"></span> No data</li>',r}.bind(this),this.legend.addTo(this.map)},createInfo:function(){var t=this.options;this.info=L.control(),this.info.onAdd=function(t){return this._div=L.DomUtil.create("div","map-info"),this.update(),this._div},this.info.update=function(e){this._div.innerHTML="<h4></h4>"+(e?t.map_title_field+": <b>"+e.title+"</b><br/>"+t.measure_label+": <b>"+e.measure+"</b>":"")},this.info.addTo(this.map)},initializeMarkers:function(t){var e=[];this.options.info_query_filters&&(e=!0===this.options.info_query_filters?[]:this.options.info_query_filters);var r=!0===this.options.filter_name?"":this.options.filter_name,i=!0===this.options.filter_slug?"":this.options.filter_slug,o=!0===this.options.filter_value?"":this.options.filter_value,a=r?{name:r,slug:i,value:o}:void 0;console.log(a);var s=this.renderChartTitle(this.options.map_custom_title_field,{measure:{name:this.options.y_axis,alias:this.options.measure_label},filters:e,optionalFilter:a}),u=this.el.context.parentElement.children[0].id;u&&1!=s&&(document.getElementById(u).innerHTML=s,document.getElementById(u).style.display="block");var c=L.icon({iconUrl:"/base/images/marker-icon.png",shadowUrl:"/base/images/marker-shadow.png",iconRetinaUrl:"/base/images/marker-icon-2x.png",iconSize:[25,41],iconAnchor:[12,41],popupAnchor:[1,-34],shadowSize:[41,41]}),l=this.options.sql_string.split("*")[1];l=l.replace("+","%2B");var f=!0===this.options.filter_name?"":this.options.filter_name,p=!0===this.options.filter_value?"":this.options.filter_value;f&&p&&(l+=' AND ("'+this.options.filter_name+"\" = '"+this.options.filter_value+"')");n("querytool_get_map_data",{geojson_url:t,map_key_field:this.options.map_key_field,data_key_field:this.options.data_key_field,data_value_field:this.options.y_axis_column,sql_string:l}).done(function(t){if(t.success){var e=t.result.geojson_data;this.featuresValues=t.result.features_values;var n,r=Object.keys(this.featuresValues),i=r.length;n=1===i?function(t){if(t==this.featuresValues[r[0]].value){var e=this.options.map_color_scheme.split(",");return e[e.length-1]}}.bind(this):this.createScale(this.featuresValues),this.createInfo.call(this),this.geoL=L.geoJSON(e,{style:function(t){var e=this.featuresValues[t.properties[this.options.map_key_field]],r=e&&e.value;return{fillColor:r?n(r):"#737373",weight:2,opacity:1,color:"white",dashArray:"3",fillOpacity:.7}}.bind(this),pointToLayer:function(t,e){return L.marker(e,{icon:c})},onEachFeature:function(t,e){var n=this.featuresValues[t.properties[this.options.map_key_field]];n&&e.on({mouseover:function(e){var r=e.target;r.setStyle({weight:3,color:"#737373",dashArray:"3",fillOpacity:.7}),L.Browser.ie||L.Browser.opera||L.Browser.edge||r.bringToFront();var i={title:t.properties[this.options.map_title_field],measure:this.formatNumber(parseFloat(n.value))};this.info.update(i)}.bind(this),mouseout:function(t){this.geoL.resetStyle(t.target),this.info.update()}.bind(this)})}.bind(this)}).addTo(this.map),this.createLegend.call(this),this.map.fitBounds(this.geoL.getBounds())}else this.resetMap.call(this)}.bind(this)).error(function(t){this.resetMap.call(this)}.bind(this))},teardown:function(){this.sandbox.unsubscribe("querytool:updateMaps",this.onPropertyChange.bind(this))},renderChartTitle:function(t,e){var n,i=nunjucks.configure({tags:{variableStart:"{",variableEnd:"}"}}),o={measure:e.measure.alias},a=r(e.filters);try{for(a.s();!(n=a.n()).done;){var s=n.value;o[s.slug]=s.value}}catch(t){a.e(t)}finally{a.f()}e.optionalFilter&&(o.optional_filter=e.optionalFilter.value.toString());try{return i.renderString(t,o)}catch(e){return t}}}}))}]);
//# sourceMappingURL=map-module.js.map