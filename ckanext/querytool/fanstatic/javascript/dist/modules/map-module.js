!(function (t) {
  var e = {};
  function n(i) {
    if (e[i]) return e[i].exports;
    var r = (e[i] = { i: i, l: !1, exports: {} });
    return t[i].call(r.exports, r, r.exports, n), (r.l = !0), r.exports;
  }
  (n.m = t),
    (n.c = e),
    (n.d = function (t, e, i) {
      n.o(t, e) || Object.defineProperty(t, e, { enumerable: !0, get: i });
    }),
    (n.r = function (t) {
      "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(t, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(t, "__esModule", { value: !0 });
    }),
    (n.t = function (t, e) {
      if ((1 & e && (t = n(t)), 8 & e)) return t;
      if (4 & e && "object" == typeof t && t && t.__esModule) return t;
      var i = Object.create(null);
      if ((n.r(i), Object.defineProperty(i, "default", { enumerable: !0, value: t }), 2 & e && "string" != typeof t))
        for (var r in t)
          n.d(
            i,
            r,
            function (e) {
              return t[e];
            }.bind(null, r)
          );
      return i;
    }),
    (n.n = function (t) {
      var e =
        t && t.__esModule
          ? function () {
              return t.default;
            }
          : function () {
              return t;
            };
      return n.d(e, "a", e), e;
    }),
    (n.o = function (t, e) {
      return Object.prototype.hasOwnProperty.call(t, e);
    }),
    (n.p = ""),
    n((n.s = 131));
})([
  function (t, e, n) {
    var i = n(20)("wks"),
      r = n(17),
      o = n(1).Symbol,
      a = "function" == typeof o;
    (t.exports = function (t) {
      return i[t] || (i[t] = (a && o[t]) || (a ? o : r)("Symbol." + t));
    }).store = i;
  },
  function (t, e) {
    var n = (t.exports = "undefined" != typeof window && window.Math == Math ? window : "undefined" != typeof self && self.Math == Math ? self : Function("return this")());
    "number" == typeof __g && (__g = n);
  },
  function (t, e, n) {
    var i = n(1),
      r = n(14),
      o = n(5),
      a = n(10),
      s = n(24),
      u = function (t, e, n) {
        var c,
          l,
          f,
          p,
          h = t & u.F,
          d = t & u.G,
          v = t & u.S,
          m = t & u.P,
          g = t & u.B,
          y = d ? i : v ? i[e] || (i[e] = {}) : (i[e] || {}).prototype,
          _ = d ? r : r[e] || (r[e] = {}),
          x = _.prototype || (_.prototype = {});
        for (c in (d && (n = e), n))
          (f = ((l = !h && y && void 0 !== y[c]) ? y : n)[c]), (p = g && l ? s(f, i) : m && "function" == typeof f ? s(Function.call, f) : f), y && a(y, c, f, t & u.U), _[c] != f && o(_, c, p), m && x[c] != f && (x[c] = f);
      };
    (i.core = r), (u.F = 1), (u.G = 2), (u.S = 4), (u.P = 8), (u.B = 16), (u.W = 32), (u.U = 64), (u.R = 128), (t.exports = u);
  },
  function (t, e) {
    t.exports = function (t) {
      try {
        return !!t();
      } catch (t) {
        return !0;
      }
    };
  },
  function (t, e, n) {
    var i = n(6);
    t.exports = function (t) {
      if (!i(t)) throw TypeError(t + " is not an object!");
      return t;
    };
  },
  function (t, e, n) {
    var i = n(9),
      r = n(19);
    t.exports = n(7)
      ? function (t, e, n) {
          return i.f(t, e, r(1, n));
        }
      : function (t, e, n) {
          return (t[e] = n), t;
        };
  },
  function (t, e) {
    t.exports = function (t) {
      return "object" == typeof t ? null !== t : "function" == typeof t;
    };
  },
  function (t, e, n) {
    t.exports = !n(3)(function () {
      return (
        7 !=
        Object.defineProperty({}, "a", {
          get: function () {
            return 7;
          },
        }).a
      );
    });
  },
  function (t, e) {
    var n = {}.hasOwnProperty;
    t.exports = function (t, e) {
      return n.call(t, e);
    };
  },
  function (t, e, n) {
    var i = n(4),
      r = n(36),
      o = n(23),
      a = Object.defineProperty;
    e.f = n(7)
      ? Object.defineProperty
      : function (t, e, n) {
          if ((i(t), (e = o(e, !0)), i(n), r))
            try {
              return a(t, e, n);
            } catch (t) {}
          if ("get" in n || "set" in n) throw TypeError("Accessors not supported!");
          return "value" in n && (t[e] = n.value), t;
        };
  },
  function (t, e, n) {
    var i = n(1),
      r = n(5),
      o = n(8),
      a = n(17)("src"),
      s = n(49),
      u = ("" + s).split("toString");
    (n(14).inspectSource = function (t) {
      return s.call(t);
    }),
      (t.exports = function (t, e, n, s) {
        var c = "function" == typeof n;
        c && (o(n, "name") || r(n, "name", e)), t[e] !== n && (c && (o(n, a) || r(n, a, t[e] ? "" + t[e] : u.join(String(e)))), t === i ? (t[e] = n) : s ? (t[e] ? (t[e] = n) : r(t, e, n)) : (delete t[e], r(t, e, n)));
      })(Function.prototype, "toString", function () {
        return ("function" == typeof this && this[a]) || s.call(this);
      });
  },
  function (t, e, n) {
    var i = n(15),
      r = Math.min;
    t.exports = function (t) {
      return t > 0 ? r(i(t), 9007199254740991) : 0;
    };
  },
  function (t, e, n) {
    var i = n(13);
    t.exports = function (t) {
      return Object(i(t));
    };
  },
  function (t, e) {
    t.exports = function (t) {
      if (null == t) throw TypeError("Can't call method on  " + t);
      return t;
    };
  },
  function (t, e) {
    var n = (t.exports = { version: "2.6.5" });
    "number" == typeof __e && (__e = n);
  },
  function (t, e) {
    var n = Math.ceil,
      i = Math.floor;
    t.exports = function (t) {
      return isNaN((t = +t)) ? 0 : (t > 0 ? i : n)(t);
    };
  },
  function (t, e, n) {
    var i = n(34),
      r = n(13);
    t.exports = function (t) {
      return i(r(t));
    };
  },
  function (t, e) {
    var n = 0,
      i = Math.random();
    t.exports = function (t) {
      return "Symbol(".concat(void 0 === t ? "" : t, ")_", (++n + i).toString(36));
    };
  },
  function (t, e) {
    var n = {}.toString;
    t.exports = function (t) {
      return n.call(t).slice(8, -1);
    };
  },
  function (t, e) {
    t.exports = function (t, e) {
      return { enumerable: !(1 & t), configurable: !(2 & t), writable: !(4 & t), value: e };
    };
  },
  function (t, e, n) {
    var i = n(14),
      r = n(1),
      o = r["__core-js_shared__"] || (r["__core-js_shared__"] = {});
    (t.exports = function (t, e) {
      return o[t] || (o[t] = void 0 !== e ? e : {});
    })("versions", []).push({ version: i.version, mode: n(21) ? "pure" : "global", copyright: "© 2019 Denis Pushkarev (zloirock.ru)" });
  },
  function (t, e) {
    t.exports = !1;
  },
  function (t, e) {
    t.exports = function (t) {
      if ("function" != typeof t) throw TypeError(t + " is not a function!");
      return t;
    };
  },
  function (t, e, n) {
    var i = n(6);
    t.exports = function (t, e) {
      if (!i(t)) return t;
      var n, r;
      if (e && "function" == typeof (n = t.toString) && !i((r = n.call(t)))) return r;
      if ("function" == typeof (n = t.valueOf) && !i((r = n.call(t)))) return r;
      if (!e && "function" == typeof (n = t.toString) && !i((r = n.call(t)))) return r;
      throw TypeError("Can't convert object to primitive value");
    };
  },
  function (t, e, n) {
    var i = n(22);
    t.exports = function (t, e, n) {
      if ((i(t), void 0 === e)) return t;
      switch (n) {
        case 1:
          return function (n) {
            return t.call(e, n);
          };
        case 2:
          return function (n, i) {
            return t.call(e, n, i);
          };
        case 3:
          return function (n, i, r) {
            return t.call(e, n, i, r);
          };
      }
      return function () {
        return t.apply(e, arguments);
      };
    };
  },
  function (t, e) {
    t.exports = {};
  },
  function (t, e, n) {
    var i = n(43),
      r = n(30);
    t.exports =
      Object.keys ||
      function (t) {
        return i(t, r);
      };
  },
  function (t, e, n) {
    var i = n(24),
      r = n(34),
      o = n(12),
      a = n(11),
      s = n(50);
    t.exports = function (t, e) {
      var n = 1 == t,
        u = 2 == t,
        c = 3 == t,
        l = 4 == t,
        f = 6 == t,
        p = 5 == t || f,
        h = e || s;
      return function (e, s, d) {
        for (var v, m, g = o(e), y = r(g), _ = i(s, d, 3), x = a(y.length), b = 0, S = n ? h(e, x) : u ? h(e, 0) : void 0; x > b; b++)
          if ((p || b in y) && ((m = _((v = y[b]), b, g)), t))
            if (n) S[b] = m;
            else if (m)
              switch (t) {
                case 3:
                  return !0;
                case 5:
                  return v;
                case 6:
                  return b;
                case 2:
                  S.push(v);
              }
            else if (l) return !1;
        return f ? -1 : c || l ? l : S;
      };
    };
  },
  function (t, e, n) {
    var i = n(20)("keys"),
      r = n(17);
    t.exports = function (t) {
      return i[t] || (i[t] = r(t));
    };
  },
  function (t, e, n) {
    "use strict";
    var i = n(3);
    t.exports = function (t, e) {
      return (
        !!t &&
        i(function () {
          e ? t.call(null, function () {}, 1) : t.call(null);
        })
      );
    };
  },
  function (t, e) {
    t.exports = "constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf".split(",");
  },
  function (t, e, n) {
    var i = n(0)("unscopables"),
      r = Array.prototype;
    null == r[i] && n(5)(r, i, {}),
      (t.exports = function (t) {
        r[i][t] = !0;
      });
  },
  function (t, e, n) {
    var i = n(9).f,
      r = n(8),
      o = n(0)("toStringTag");
    t.exports = function (t, e, n) {
      t && !r((t = n ? t : t.prototype), o) && i(t, o, { configurable: !0, value: e });
    };
  },
  function (t, e, n) {
    "use strict";
    var i,
      r,
      o = n(52),
      a = RegExp.prototype.exec,
      s = String.prototype.replace,
      u = a,
      c = ((i = /a/), (r = /b*/g), a.call(i, "a"), a.call(r, "a"), 0 !== i.lastIndex || 0 !== r.lastIndex),
      l = void 0 !== /()??/.exec("")[1];
    (c || l) &&
      (u = function (t) {
        var e,
          n,
          i,
          r,
          u = this;
        return (
          l && (n = new RegExp("^" + u.source + "$(?!\\s)", o.call(u))),
          c && (e = u.lastIndex),
          (i = a.call(u, t)),
          c && i && (u.lastIndex = u.global ? i.index + i[0].length : e),
          l &&
            i &&
            i.length > 1 &&
            s.call(i[0], n, function () {
              for (r = 1; r < arguments.length - 2; r++) void 0 === arguments[r] && (i[r] = void 0);
            }),
          i
        );
      }),
      (t.exports = u);
  },
  function (t, e, n) {
    var i = n(18);
    t.exports = Object("z").propertyIsEnumerable(0)
      ? Object
      : function (t) {
          return "String" == i(t) ? t.split("") : Object(t);
        };
  },
  function (t, e, n) {
    var i = n(6),
      r = n(1).document,
      o = i(r) && i(r.createElement);
    t.exports = function (t) {
      return o ? r.createElement(t) : {};
    };
  },
  function (t, e, n) {
    t.exports =
      !n(7) &&
      !n(3)(function () {
        return (
          7 !=
          Object.defineProperty(n(35)("div"), "a", {
            get: function () {
              return 7;
            },
          }).a
        );
      });
  },
  function (t, e, n) {
    var i = n(4),
      r = n(59),
      o = n(30),
      a = n(28)("IE_PROTO"),
      s = function () {},
      u = function () {
        var t,
          e = n(35)("iframe"),
          i = o.length;
        for (e.style.display = "none", n(60).appendChild(e), e.src = "javascript:", (t = e.contentWindow.document).open(), t.write("<script>document.F=Object</script>"), t.close(), u = t.F; i--; ) delete u.prototype[o[i]];
        return u();
      };
    t.exports =
      Object.create ||
      function (t, e) {
        var n;
        return null !== t ? ((s.prototype = i(t)), (n = new s()), (s.prototype = null), (n[a] = t)) : (n = u()), void 0 === e ? n : r(n, e);
      };
  },
  function (t, e, n) {
    var i = n(18),
      r = n(0)("toStringTag"),
      o =
        "Arguments" ==
        i(
          (function () {
            return arguments;
          })()
        );
    t.exports = function (t) {
      var e, n, a;
      return void 0 === t
        ? "Undefined"
        : null === t
        ? "Null"
        : "string" ==
          typeof (n = (function (t, e) {
            try {
              return t[e];
            } catch (t) {}
          })((e = Object(t)), r))
        ? n
        : o
        ? i(e)
        : "Object" == (a = i(e)) && "function" == typeof e.callee
        ? "Arguments"
        : a;
    };
  },
  function (t, e, n) {
    "use strict";
    var i = n(54)(!0);
    t.exports = function (t, e, n) {
      return e + (n ? i(t, e).length : 1);
    };
  },
  function (t, e, n) {
    "use strict";
    var i = n(38),
      r = RegExp.prototype.exec;
    t.exports = function (t, e) {
      var n = t.exec;
      if ("function" == typeof n) {
        var o = n.call(t, e);
        if ("object" != typeof o) throw new TypeError("RegExp exec method returned something other than an Object or null");
        return o;
      }
      if ("RegExp" !== i(t)) throw new TypeError("RegExp#exec called on incompatible receiver");
      return r.call(t, e);
    };
  },
  function (t, e, n) {
    "use strict";
    n(62);
    var i = n(10),
      r = n(5),
      o = n(3),
      a = n(13),
      s = n(0),
      u = n(33),
      c = s("species"),
      l = !o(function () {
        var t = /./;
        return (
          (t.exec = function () {
            var t = [];
            return (t.groups = { a: "7" }), t;
          }),
          "7" !== "".replace(t, "$<a>")
        );
      }),
      f = (function () {
        var t = /(?:)/,
          e = t.exec;
        t.exec = function () {
          return e.apply(this, arguments);
        };
        var n = "ab".split(t);
        return 2 === n.length && "a" === n[0] && "b" === n[1];
      })();
    t.exports = function (t, e, n) {
      var p = s(t),
        h = !o(function () {
          var e = {};
          return (
            (e[p] = function () {
              return 7;
            }),
            7 != ""[t](e)
          );
        }),
        d = h
          ? !o(function () {
              var e = !1,
                n = /a/;
              return (
                (n.exec = function () {
                  return (e = !0), null;
                }),
                "split" === t &&
                  ((n.constructor = {}),
                  (n.constructor[c] = function () {
                    return n;
                  })),
                n[p](""),
                !e
              );
            })
          : void 0;
      if (!h || !d || ("replace" === t && !l) || ("split" === t && !f)) {
        var v = /./[p],
          m = n(a, p, ""[t], function (t, e, n, i, r) {
            return e.exec === u ? (h && !r ? { done: !0, value: v.call(e, n, i) } : { done: !0, value: t.call(n, e, i) }) : { done: !1 };
          }),
          g = m[0],
          y = m[1];
        i(String.prototype, t, g),
          r(
            RegExp.prototype,
            p,
            2 == e
              ? function (t, e) {
                  return y.call(t, this, e);
                }
              : function (t) {
                  return y.call(t, this);
                }
          );
      }
    };
  },
  function (t, e, n) {
    var i = n(18);
    t.exports =
      Array.isArray ||
      function (t) {
        return "Array" == i(t);
      };
  },
  function (t, e, n) {
    var i = n(8),
      r = n(16),
      o = n(44)(!1),
      a = n(28)("IE_PROTO");
    t.exports = function (t, e) {
      var n,
        s = r(t),
        u = 0,
        c = [];
      for (n in s) n != a && i(s, n) && c.push(n);
      for (; e.length > u; ) i(s, (n = e[u++])) && (~o(c, n) || c.push(n));
      return c;
    };
  },
  function (t, e, n) {
    var i = n(16),
      r = n(11),
      o = n(46);
    t.exports = function (t) {
      return function (e, n, a) {
        var s,
          u = i(e),
          c = r(u.length),
          l = o(a, c);
        if (t && n != n) {
          for (; c > l; ) if ((s = u[l++]) != s) return !0;
        } else for (; c > l; l++) if ((t || l in u) && u[l] === n) return t || l || 0;
        return !t && -1;
      };
    };
  },
  ,
  function (t, e, n) {
    var i = n(15),
      r = Math.max,
      o = Math.min;
    t.exports = function (t, e) {
      return (t = i(t)) < 0 ? r(t + e, 0) : o(t, e);
    };
  },
  ,
  ,
  function (t, e, n) {
    t.exports = n(20)("native-function-to-string", Function.toString);
  },
  function (t, e, n) {
    var i = n(51);
    t.exports = function (t, e) {
      return new (i(t))(e);
    };
  },
  function (t, e, n) {
    var i = n(6),
      r = n(42),
      o = n(0)("species");
    t.exports = function (t) {
      var e;
      return r(t) && ("function" != typeof (e = t.constructor) || (e !== Array && !r(e.prototype)) || (e = void 0), i(e) && null === (e = e[o]) && (e = void 0)), void 0 === e ? Array : e;
    };
  },
  function (t, e, n) {
    "use strict";
    var i = n(4);
    t.exports = function () {
      var t = i(this),
        e = "";
      return t.global && (e += "g"), t.ignoreCase && (e += "i"), t.multiline && (e += "m"), t.unicode && (e += "u"), t.sticky && (e += "y"), e;
    };
  },
  function (t, e, n) {
    "use strict";
    var i = n(2),
      r = n(27)(5),
      o = !0;
    "find" in [] &&
      Array(1).find(function () {
        o = !1;
      }),
      i(i.P + i.F * o, "Array", {
        find: function (t) {
          return r(this, t, arguments.length > 1 ? arguments[1] : void 0);
        },
      }),
      n(31)("find");
  },
  function (t, e, n) {
    var i = n(15),
      r = n(13);
    t.exports = function (t) {
      return function (e, n) {
        var o,
          a,
          s = String(r(e)),
          u = i(n),
          c = s.length;
        return u < 0 || u >= c
          ? t
            ? ""
            : void 0
          : (o = s.charCodeAt(u)) < 55296 || o > 56319 || u + 1 === c || (a = s.charCodeAt(u + 1)) < 56320 || a > 57343
          ? t
            ? s.charAt(u)
            : o
          : t
          ? s.slice(u, u + 2)
          : a - 56320 + ((o - 55296) << 10) + 65536;
      };
    };
  },
  function (t, e, n) {
    var i = n(8),
      r = n(12),
      o = n(28)("IE_PROTO"),
      a = Object.prototype;
    t.exports =
      Object.getPrototypeOf ||
      function (t) {
        return (t = r(t)), i(t, o) ? t[o] : "function" == typeof t.constructor && t instanceof t.constructor ? t.constructor.prototype : t instanceof Object ? a : null;
      };
  },
  function (t, e, n) {
    "use strict";
    var i = n(31),
      r = n(66),
      o = n(25),
      a = n(16);
    (t.exports = n(57)(
      Array,
      "Array",
      function (t, e) {
        (this._t = a(t)), (this._i = 0), (this._k = e);
      },
      function () {
        var t = this._t,
          e = this._k,
          n = this._i++;
        return !t || n >= t.length ? ((this._t = void 0), r(1)) : r(0, "keys" == e ? n : "values" == e ? t[n] : [n, t[n]]);
      },
      "values"
    )),
      (o.Arguments = o.Array),
      i("keys"),
      i("values"),
      i("entries");
  },
  function (t, e, n) {
    "use strict";
    var i = n(21),
      r = n(2),
      o = n(10),
      a = n(5),
      s = n(25),
      u = n(58),
      c = n(32),
      l = n(55),
      f = n(0)("iterator"),
      p = !([].keys && "next" in [].keys()),
      h = function () {
        return this;
      };
    t.exports = function (t, e, n, d, v, m, g) {
      u(n, e, d);
      var y,
        _,
        x,
        b = function (t) {
          if (!p && t in F) return F[t];
          switch (t) {
            case "keys":
            case "values":
              return function () {
                return new n(this, t);
              };
          }
          return function () {
            return new n(this, t);
          };
        },
        S = e + " Iterator",
        L = "values" == v,
        w = !1,
        F = t.prototype,
        O = F[f] || F["@@iterator"] || (v && F[v]),
        k = O || b(v),
        j = v ? (L ? b("entries") : k) : void 0,
        M = ("Array" == e && F.entries) || O;
      if (
        (M && (x = l(M.call(new t()))) !== Object.prototype && x.next && (c(x, S, !0), i || "function" == typeof x[f] || a(x, f, h)),
        L &&
          O &&
          "values" !== O.name &&
          ((w = !0),
          (k = function () {
            return O.call(this);
          })),
        (i && !g) || (!p && !w && F[f]) || a(F, f, k),
        (s[e] = k),
        (s[S] = h),
        v)
      )
        if (((y = { values: L ? k : b("values"), keys: m ? k : b("keys"), entries: j }), g)) for (_ in y) _ in F || o(F, _, y[_]);
        else r(r.P + r.F * (p || w), e, y);
      return y;
    };
  },
  function (t, e, n) {
    "use strict";
    var i = n(37),
      r = n(19),
      o = n(32),
      a = {};
    n(5)(a, n(0)("iterator"), function () {
      return this;
    }),
      (t.exports = function (t, e, n) {
        (t.prototype = i(a, { next: r(1, n) })), o(t, e + " Iterator");
      });
  },
  function (t, e, n) {
    var i = n(9),
      r = n(4),
      o = n(26);
    t.exports = n(7)
      ? Object.defineProperties
      : function (t, e) {
          r(t);
          for (var n, a = o(e), s = a.length, u = 0; s > u; ) i.f(t, (n = a[u++]), e[n]);
          return t;
        };
  },
  function (t, e, n) {
    var i = n(1).document;
    t.exports = i && i.documentElement;
  },
  function (t, e, n) {
    "use strict";
    var i = n(4),
      r = n(12),
      o = n(11),
      a = n(15),
      s = n(39),
      u = n(40),
      c = Math.max,
      l = Math.min,
      f = Math.floor,
      p = /\$([$&`']|\d\d?|<[^>]*>)/g,
      h = /\$([$&`']|\d\d?)/g;
    n(41)("replace", 2, function (t, e, n, d) {
      return [
        function (i, r) {
          var o = t(this),
            a = null == i ? void 0 : i[e];
          return void 0 !== a ? a.call(i, o, r) : n.call(String(o), i, r);
        },
        function (t, e) {
          var r = d(n, t, this, e);
          if (r.done) return r.value;
          var f = i(t),
            p = String(this),
            h = "function" == typeof e;
          h || (e = String(e));
          var m = f.global;
          if (m) {
            var g = f.unicode;
            f.lastIndex = 0;
          }
          for (var y = []; ; ) {
            var _ = u(f, p);
            if (null === _) break;
            if ((y.push(_), !m)) break;
            "" === String(_[0]) && (f.lastIndex = s(p, o(f.lastIndex), g));
          }
          for (var x, b = "", S = 0, L = 0; L < y.length; L++) {
            _ = y[L];
            for (var w = String(_[0]), F = c(l(a(_.index), p.length), 0), O = [], k = 1; k < _.length; k++) O.push(void 0 === (x = _[k]) ? x : String(x));
            var j = _.groups;
            if (h) {
              var M = [w].concat(O, F, p);
              void 0 !== j && M.push(j);
              var T = String(e.apply(void 0, M));
            } else T = v(w, p, F, O, j, e);
            F >= S && ((b += p.slice(S, F) + T), (S = F + w.length));
          }
          return b + p.slice(S);
        },
      ];
      function v(t, e, i, o, a, s) {
        var u = i + t.length,
          c = o.length,
          l = h;
        return (
          void 0 !== a && ((a = r(a)), (l = p)),
          n.call(s, l, function (n, r) {
            var s;
            switch (r.charAt(0)) {
              case "$":
                return "$";
              case "&":
                return t;
              case "`":
                return e.slice(0, i);
              case "'":
                return e.slice(u);
              case "<":
                s = a[r.slice(1, -1)];
                break;
              default:
                var l = +r;
                if (0 === l) return n;
                if (l > c) {
                  var p = f(l / 10);
                  return 0 === p ? n : p <= c ? (void 0 === o[p - 1] ? r.charAt(1) : o[p - 1] + r.charAt(1)) : n;
                }
                s = o[l - 1];
            }
            return void 0 === s ? "" : s;
          })
        );
      }
    });
  },
  function (t, e, n) {
    "use strict";
    var i = n(33);
    n(2)({ target: "RegExp", proto: !0, forced: i !== /./.exec }, { exec: i });
  },
  ,
  function (t, e, n) {
    var i = n(6),
      r = n(18),
      o = n(0)("match");
    t.exports = function (t) {
      var e;
      return i(t) && (void 0 !== (e = t[o]) ? !!e : "RegExp" == r(t));
    };
  },
  function (t, e, n) {
    var i = n(4),
      r = n(22),
      o = n(0)("species");
    t.exports = function (t, e) {
      var n,
        a = i(t).constructor;
      return void 0 === a || null == (n = i(a)[o]) ? e : r(n);
    };
  },
  function (t, e) {
    t.exports = function (t, e) {
      return { value: e, done: !!t };
    };
  },
  ,
  ,
  ,
  function (t, e, n) {
    "use strict";
    var i = n(64),
      r = n(4),
      o = n(65),
      a = n(39),
      s = n(11),
      u = n(40),
      c = n(33),
      l = n(3),
      f = Math.min,
      p = [].push,
      h = !l(function () {
        RegExp(4294967295, "y");
      });
    n(41)("split", 2, function (t, e, n, l) {
      var d;
      return (
        (d =
          "c" == "abbc".split(/(b)*/)[1] || 4 != "test".split(/(?:)/, -1).length || 2 != "ab".split(/(?:ab)*/).length || 4 != ".".split(/(.?)(.?)/).length || ".".split(/()()/).length > 1 || "".split(/.?/).length
            ? function (t, e) {
                var r = String(this);
                if (void 0 === t && 0 === e) return [];
                if (!i(t)) return n.call(r, t, e);
                for (
                  var o, a, s, u = [], l = (t.ignoreCase ? "i" : "") + (t.multiline ? "m" : "") + (t.unicode ? "u" : "") + (t.sticky ? "y" : ""), f = 0, h = void 0 === e ? 4294967295 : e >>> 0, d = new RegExp(t.source, l + "g");
                  (o = c.call(d, r)) && !((a = d.lastIndex) > f && (u.push(r.slice(f, o.index)), o.length > 1 && o.index < r.length && p.apply(u, o.slice(1)), (s = o[0].length), (f = a), u.length >= h));

                )
                  d.lastIndex === o.index && d.lastIndex++;
                return f === r.length ? (!s && d.test("")) || u.push("") : u.push(r.slice(f)), u.length > h ? u.slice(0, h) : u;
              }
            : "0".split(void 0, 0).length
            ? function (t, e) {
                return void 0 === t && 0 === e ? [] : n.call(this, t, e);
              }
            : n),
        [
          function (n, i) {
            var r = t(this),
              o = null == n ? void 0 : n[e];
            return void 0 !== o ? o.call(n, r, i) : d.call(String(r), n, i);
          },
          function (t, e) {
            var i = l(d, t, this, e, d !== n);
            if (i.done) return i.value;
            var c = r(t),
              p = String(this),
              v = o(c, RegExp),
              m = c.unicode,
              g = (c.ignoreCase ? "i" : "") + (c.multiline ? "m" : "") + (c.unicode ? "u" : "") + (h ? "y" : "g"),
              y = new v(h ? c : "^(?:" + c.source + ")", g),
              _ = void 0 === e ? 4294967295 : e >>> 0;
            if (0 === _) return [];
            if (0 === p.length) return null === u(y, p) ? [p] : [];
            for (var x = 0, b = 0, S = []; b < p.length; ) {
              y.lastIndex = h ? b : 0;
              var L,
                w = u(y, h ? p : p.slice(b));
              if (null === w || (L = f(s(y.lastIndex + (h ? 0 : b)), p.length)) === x) b = a(p, b, m);
              else {
                if ((S.push(p.slice(x, b)), S.length === _)) return S;
                for (var F = 1; F <= w.length - 1; F++) if ((S.push(w[F]), S.length === _)) return S;
                b = x = L;
              }
            }
            return S.push(p.slice(x)), S;
          },
        ]
      );
    });
  },
  function (t, e, n) {
    for (
      var i = n(56),
        r = n(26),
        o = n(10),
        a = n(1),
        s = n(5),
        u = n(25),
        c = n(0),
        l = c("iterator"),
        f = c("toStringTag"),
        p = u.Array,
        h = {
          CSSRuleList: !0,
          CSSStyleDeclaration: !1,
          CSSValueList: !1,
          ClientRectList: !1,
          DOMRectList: !1,
          DOMStringList: !1,
          DOMTokenList: !0,
          DataTransferItemList: !1,
          FileList: !1,
          HTMLAllCollection: !1,
          HTMLCollection: !1,
          HTMLFormElement: !1,
          HTMLSelectElement: !1,
          MediaList: !0,
          MimeTypeArray: !1,
          NamedNodeMap: !1,
          NodeList: !0,
          PaintRequestList: !1,
          Plugin: !1,
          PluginArray: !1,
          SVGLengthList: !1,
          SVGNumberList: !1,
          SVGPathSegList: !1,
          SVGPointList: !1,
          SVGStringList: !1,
          SVGTransformList: !1,
          SourceBufferList: !1,
          StyleSheetList: !0,
          TextTrackCueList: !1,
          TextTrackList: !1,
          TouchList: !1,
        },
        d = r(h),
        v = 0;
      v < d.length;
      v++
    ) {
      var m,
        g = d[v],
        y = h[g],
        _ = a[g],
        x = _ && _.prototype;
      if (x && (x[l] || s(x, l, p), x[f] || s(x, f, g), (u[g] = p), y)) for (m in i) x[m] || o(x, m, i[m], !0);
    }
  },
  function (t, e, n) {
    "use strict";
    var i = n(38),
      r = {};
    (r[n(0)("toStringTag")] = "z"),
      r + "" != "[object z]" &&
        n(10)(
          Object.prototype,
          "toString",
          function () {
            return "[object " + i(this) + "]";
          },
          !0
        );
  },
  function (t, e, n) {
    var i = n(2);
    i(i.P, "Function", { bind: n(74) });
  },
  function (t, e, n) {
    "use strict";
    var i = n(22),
      r = n(6),
      o = n(75),
      a = [].slice,
      s = {};
    t.exports =
      Function.bind ||
      function (t) {
        var e = i(this),
          n = a.call(arguments, 1),
          u = function () {
            var i = n.concat(a.call(arguments));
            return this instanceof u
              ? (function (t, e, n) {
                  if (!(e in s)) {
                    for (var i = [], r = 0; r < e; r++) i[r] = "a[" + r + "]";
                    s[e] = Function("F,a", "return new F(" + i.join(",") + ")");
                  }
                  return s[e](t, n);
                })(e, i.length, i)
              : o(e, i, t);
          };
        return r(e.prototype) && (u.prototype = e.prototype), u;
      };
  },
  function (t, e) {
    t.exports = function (t, e, n) {
      var i = void 0 === n;
      switch (e.length) {
        case 0:
          return i ? t() : t.call(n);
        case 1:
          return i ? t(e[0]) : t.call(n, e[0]);
        case 2:
          return i ? t(e[0], e[1]) : t.call(n, e[0], e[1]);
        case 3:
          return i ? t(e[0], e[1], e[2]) : t.call(n, e[0], e[1], e[2]);
        case 4:
          return i ? t(e[0], e[1], e[2], e[3]) : t.call(n, e[0], e[1], e[2], e[3]);
      }
      return t.apply(n, e);
    };
  },
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  function (t, e, n) {
    "use strict";
    var i = n(2),
      r = n(27)(1);
    i(i.P + i.F * !n(29)([].map, !0), "Array", {
      map: function (t) {
        return r(this, t, arguments[1]);
      },
    });
  },
  function (t, e, n) {
    var i = n(12),
      r = n(26);
    n(88)("keys", function () {
      return function (t) {
        return r(i(t));
      };
    });
  },
  function (t, e, n) {
    var i = n(2),
      r = n(14),
      o = n(3);
    t.exports = function (t, e) {
      var n = (r.Object || {})[t] || Object[t],
        a = {};
      (a[t] = e(n)),
        i(
          i.S +
            i.F *
              o(function () {
                n(1);
              }),
          "Object",
          a
        );
    };
  },
  function (t, e, n) {
    "use strict";
    var i = n(2),
      r = n(22),
      o = n(12),
      a = n(3),
      s = [].sort,
      u = [1, 2, 3];
    i(
      i.P +
        i.F *
          (a(function () {
            u.sort(void 0);
          }) ||
            !a(function () {
              u.sort(null);
            }) ||
            !n(29)(s)),
      "Array",
      {
        sort: function (t) {
          return void 0 === t ? s.call(o(this)) : s.call(o(this), r(t));
        },
      }
    );
  },
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  function (t, e, n) {
    "use strict";
    n.r(e);
    n(71), n(56), n(72), n(87), n(61), n(89), n(70), n(86), n(73), n(53);
    ckan.module("querytool-map", function (t) {
      var e = function (e, n) {
          var i = ckan.sandbox().client.endpoint + "/api/3/action/" + e + "?" + (n = t.param(n));
          return t.getJSON(i);
        },
        n = function (e, n) {
          var i = ckan.sandbox().client.endpoint + "/api/3/action/" + e;
          return t.post(i, JSON.stringify(n), "json");
        };
      return {
        initialize: function () {
          this.initLeaflet.call(this),
            (this.mapResource = this.el.parent().parent().find("[id*=map_resource_]")),
            (this.mapTitleField = this.el.parent().parent().find("[id*=map_title_field_]")),
            (this.mapCustomTitleField = this.el.parent().parent().find("[id*=map_custom_title_field_]")),
            (this.mapKeyField = this.el.parent().parent().find("[id*=map_key_field_]")),
            (this.dataKeyField = this.el.parent().parent().find("[id*=map_data_key_field_]")),
            (this.mapColorScheme = this.el.parent().parent().find("[id*=map_color_scheme_]")),
            (this.mapFilterName = this.el.parent().parent().find("[id*=map_field_filter_name_]")),
            (this.mapFilterValue = this.el.parent().parent().find("[id*=map_field_filter_value_]")),
            (this.valueField = t("#choose_y_axis_column")),
            this.mapResource.change(this.onResourceChange.bind(this)),
            this.mapTitleField.change(this.onPropertyChange.bind(this)),
            this.mapCustomTitleField.change(this.onPropertyChange.bind(this)),
            this.mapKeyField.change(this.onPropertyChange.bind(this)),
            this.dataKeyField.change(this.onPropertyChange.bind(this)),
            this.mapColorScheme.change(this.onPropertyChange.bind(this)),
            this.mapFilterName.change(this.onPropertyChange.bind(this)),
            this.mapFilterValue.change(this.onPropertyChange.bind(this)),
            t(".leaflet-control-zoom-in").css({ color: "#121e87" }),
            t(".leaflet-control-zoom-out").css({ color: "#121e87" }),
            this.sandbox.subscribe("querytool:updateMaps", this.onPropertyChange.bind(this));
        },
        resetMap: function () {
          (this.options.map_resource = this.mapResource.val()),
            (this.options.map_title_field = this.mapTitleField.val()),
            (this.options.map_custom_title_field = this.mapCustomTitleField.val()),
            (this.options.map_key_field = this.mapKeyField.val()),
            (this.options.data_key_field = this.dataKeyField.val()),
            (this.options.y_axis_column = this.valueField.val()),
            this.map.eachLayer(
              function (t) {
                t != this.osm && this.map.removeLayer(t);
              }.bind(this)
            ),
            this.legend && this.map.removeControl(this.legend),
            this.info && this.map.removeControl(this.info),
            this.map.setView([39, 40], 2);
        },
        onResourceChange: function () {
          (this.options.map_title_field = this.mapTitleField.val()),
          (this.options.map_custom_title_field = this.mapCustomTitleField.val()),
            (this.options.map_key_field = this.mapKeyField.val()),
            (this.options.data_key_field = this.dataKeyField.val()),
            (this.options.y_axis_column = this.valueField.val()),
            this.options.map_resource != this.mapResource.val() && "" != this.mapResource.val()
              ? ((this.options.map_resource = this.mapResource.val()),
                e("querytool_get_geojson_properties", { map_resource: this.options.map_resource })
                  .done(
                    function (e) {
                      e.success
                        ? (this.mapTitleField.find("option").not(":first").remove(),
                          this.mapKeyField.find("option").not(":first").remove(),
                          t.each(
                            e.result,
                            function (t, e) {
                              this.mapTitleField.append(new Option(e.text, e.value));
                            }.bind(this)
                          ),
                          t.each(
                            e.result,
                            function (t, e) {
                              this.mapKeyField.append(new Option(e.text, e.value));
                            }.bind(this)
                          ),
                          this.resetMap.call(this))
                        : this.resetMap.call(this);
                    }.bind(this)
                  )
                  .error(
                    function (t) {
                      this.resetMap.call(this);
                    }.bind(this)
                  ))
              : this.resetMap.call(this);
        },
        onPropertyChange: function () {
          (this.options.map_resource = this.mapResource.val()),
            (this.options.map_title_field = this.mapTitleField.val()),
            (this.options.map_custom_title_field = this.mapCustomTitleField.val()),
            (this.options.map_key_field = this.mapKeyField.val()),
            (this.options.data_key_field = this.dataKeyField.val()),
            (this.options.y_axis_column = this.valueField.val()),
            (this.options.measure_label = t("#choose_y_axis_column option:selected").text()),
            (this.options.map_color_scheme = this.mapColorScheme.val()),
            (this.options.filter_name = this.mapFilterName.val()),
            (this.options.filter_value = this.mapFilterValue.val()),
            this.options.map_title_field && this.options.map_custom_title_field && this.options.map_key_field && this.options.data_key_field && this.options.map_resource && this.options.y_axis_column
              ? (this.legend && this.map.removeControl(this.legend),
                this.map.eachLayer(
                  function (t) {
                    t != this.osm && this.map.removeLayer(t);
                  }.bind(this)
                ),
                this.initializeMarkers.call(this, this.options.map_resource))
              : this.resetMap.call(this);
        },
        initLeaflet: function () {
          var t = !0 === this.options.map_resource ? "" : this.options.map_resource,
            e = this.el[0].id;
          this.map = new L.Map(e, { scrollWheelZoom: !1, inertiaMaxSpeed: 200, dragging: !L.Browser.mobile }).setView([39, 40], 2);
          var n = this.options.map_config.osm_url,
            i = this.options.map_config.osm_attribute;
          (this.osm = new L.TileLayer(n, { minZoom: 2, maxZoom: 18, attribution: i })), this.map.addLayer(this.osm), t && this.initializeMarkers.call(this, t);
        },
        createScale: function (e) {
          var n = this.options.map_color_scheme.split(","),
            i = t
              .map(e, function (t, e) {
                return t.value;
              })
              .sort(function (t, e) {
                return t - e;
              }),
            r = i[0],
            o = i[i.length - 1];
          return d3.scale.quantize().domain([r, o]).range(n);
        },
        formatNumber: function (t) {
          return t % 1 ? t.toFixed(2) : t;
        },
        createLegend: function () {
          var e = this.createScale(this.featuresValues);
          (this.legend = L.control({ position: "bottomright" })),
            (this.legend.onAdd = function (n) {
              var i = L.DomUtil.create("div", "info"),
                r = L.DomUtil.create("ul", "legend"),
                o = e.domain(),
                a = e.range(),
                s = o[0] + 1e-10,
                u = (o[o.length - 1] - s) / a.length,
                c = t.map(a, function (t, e) {
                  return s + u * e;
                });
              i.appendChild(r);
              for (var l = 0, f = c.length; l < f; l++)
                r.innerHTML += '<li><span style="background:' + e(c[l]) + '; opacity: 1"></span> ' + this.formatNumber(c[l]) + (c[l + 1] ? "&ndash;" + this.formatNumber(c[l + 1]) + "</li>" : "+</li></ul>");
              return (r.innerHTML += '<li><span style="background:#bdbdbd; opacity: 1"></span> No data</li>'), i;
            }.bind(this)),
            this.legend.addTo(this.map);
        },
        createInfo: function () {
          var t = this.options;
          (this.info = L.control()),
            (this.info.onAdd = function (t) {
              return (this._div = L.DomUtil.create("div", "map-info")), this.update(), this._div;
            }),
            (this.info.update = function (e) {
              this._div.innerHTML = "<h4></h4>" + (e ? t.map_title_field + ": <b>" + e.title + "</b><br/>" + t.measure_label + ": <b>" + e.measure + "</b>" : "");
            }),
            this.info.addTo(this.map);
        },
        initializeMarkers: function (t) {
          //Custom solution 
          var queryFilters = [];
          if (this.options.info_query_filters) {
              if(this.options.info_query_filters === true) {
                  queryFilters = [];
              } else {
                  queryFilters = this.options.info_query_filters;
              }
          }

          var optionalFilterName = (this.options.filter_name === true) ? '' : this.options.filter_name;
          var optionalFilterSlug = (this.options.filter_slug === true) ? '' : this.options.filter_slug;
          var optionalFilterValue = (this.options.filter_value === true) ? '' : this.options.filter_value;
          var optionalFilter = optionalFilterName ? {name: optionalFilterName, slug: optionalFilterSlug, value: optionalFilterValue} : undefined;
          
          console.log(optionalFilter)

          //var dynamicTitle = this.options.map_custom_title_field;
          var dynamicTitle = this.renderChartTitle(this.options.map_custom_title_field,{
            measure: {name: this.options.y_axis, alias: this.options.measure_label},
            filters: queryFilters,
            optionalFilter: optionalFilter,
          })
          var title_id = this.el.context.parentElement.children[0].id;
          if(title_id && dynamicTitle != true){
            document.getElementById(title_id).innerHTML =  dynamicTitle;
          }

          var e = L.icon({
              iconUrl: "/base/images/marker-icon.png",
              shadowUrl: "/base/images/marker-shadow.png",
              iconRetinaUrl: "/base/images/marker-icon-2x.png",
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
            }),
            i = this.options.sql_string.split("*")[1];
          i = i.replace("+", "%2B");
          var r = !0 === this.options.filter_name ? "" : this.options.filter_name,
            o = !0 === this.options.filter_value ? "" : this.options.filter_value;
          r && o && (i += ' AND ("' + this.options.filter_name + "\" = '" + this.options.filter_value + "')");
          n("querytool_get_map_data", { geojson_url: t, map_key_field: this.options.map_key_field, data_key_field: this.options.data_key_field, data_value_field: this.options.y_axis_column, sql_string: i })
            .done(
              function (t) {
                if (t.success) {
                  var n = t.result.geojson_data;
                  this.featuresValues = t.result.features_values;
                  var i,
                    r = Object.keys(this.featuresValues),
                    o = r.length;
                  (i =
                    1 === o
                      ? function (t) {
                          if (t == this.featuresValues[r[0]].value) {
                            var e = this.options.map_color_scheme.split(",");
                            return e[e.length - 1];
                          }
                        }.bind(this)
                      : this.createScale(this.featuresValues)),
                    this.createInfo.call(this),
                    (this.geoL = L.geoJSON(n, {
                      style: function (t) {
                        var e = this.featuresValues[t.properties[this.options.map_key_field]],
                          n = e && e.value;
                        return { fillColor: n ? i(n) : "#737373", weight: 2, opacity: 1, color: "white", dashArray: "3", fillOpacity: 0.7 };
                      }.bind(this),
                      pointToLayer: function (t, n) {
                        return L.marker(n, { icon: e });
                      },
                      onEachFeature: function (t, e) {
                        var n = this.featuresValues[t.properties[this.options.map_key_field]];
                        n &&
                          e.on({
                            mouseover: function (e) {
                              var i = e.target;
                              i.setStyle({ weight: 3, color: "#737373", dashArray: "3", fillOpacity: 0.7 }), L.Browser.ie || L.Browser.opera || L.Browser.edge || i.bringToFront();
                              var r = { title: t.properties[this.options.map_title_field], measure: this.formatNumber(parseFloat(n.value)) };
                              this.info.update(r);
                            }.bind(this),
                            mouseout: function (t) {
                              this.geoL.resetStyle(t.target), this.info.update();
                            }.bind(this),
                          });
                      }.bind(this),
                    }).addTo(this.map)),
                    this.createLegend.call(this),
                    this.map.fitBounds(this.geoL.getBounds());
                } else this.resetMap.call(this);
              }.bind(this)
            )
            .error(
              function (t) {
                this.resetMap.call(this);
              }.bind(this)
            );
        },
        teardown: function () {
          this.sandbox.unsubscribe("querytool:updateMaps", this.onPropertyChange.bind(this));
        },
        renderChartTitle: function (title, options) {

          // Configure nunjucks
          var env = nunjucks.configure({tags: {variableStart: '{', variableEnd: '}'}});

          // Prepare data
          var data = {measure: options.measure.alias};
          for (let filter of options.filters) data[filter.slug] = filter.value;
          if (options.optionalFilter) data.optional_filter = options.optionalFilter.value.toString();

          // Render and return
          try {
              return env.renderString(title, data);
          } catch (error) {
              return title;
          }
        }
      };
    });
  },
]);

//# sourceMappingURL=map-module.js.map