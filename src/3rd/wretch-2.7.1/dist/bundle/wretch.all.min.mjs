const e = "Content-Type", t = Symbol(), r = Symbol();
function n(t = {}) {
  var r;
  return null ===
        (r = Object.entries(t).find(([t]) =>
          t.toLowerCase() === e.toLowerCase()
        )) || void 0 === r
    ? void 0
    : r[1];
}
function o(e) {
  return /^application\/.*json.*/.test(e);
}
const s = function (e, t, r = 0) {
    return Object.entries(t).reduce((t, [n, o]) => {
      const i = e[n];
      return Array.isArray(i) && Array.isArray(o)
        ? t[n] = r ? [...i, ...o] : o
        : t[n] = "object" == typeof i && "object" == typeof o ? s(i, o, r) : o,
        t;
    }, { ...e });
  },
  i = {
    options: {},
    errorType: "text",
    polyfills: {},
    polyfill(e, t = 1, r = 0, ...n) {
      const o = this.polyfills[e] ||
        ("undefined" != typeof self ? self[e] : null) ||
        ("undefined" != typeof global ? global[e] : null);
      if (t && !o) throw new Error(e + " is not defined");
      return r && o ? new o(...n) : o;
    },
  };
class c extends Error {}
const l = (e) => {
    const n = Object.create(null);
    e = e._addons.reduce(
      (t, r) => r.beforeRequest && r.beforeRequest(t, e._options, n) || t,
      e,
    );
    const {
        _url: o,
        _options: i,
        _config: l,
        _catchers: a,
        _resolvers: u,
        _middlewares: h,
        _addons: f,
      } = e,
      d = new Map(a),
      p = s(l.options, i);
    let _ = o;
    const y = ((e) => (t) => e.reduceRight((e, t) => t(e), t) || t)(h)(
        (e, t) => (_ = e, l.polyfill("fetch")(e, t)),
      )(o, p),
      g = new Error(),
      b = y.catch((e) => {
        throw { [t]: e };
      }).then((e) => {
        if (!e.ok) {
          const t = new c();
          if (
            t.cause = g,
              t.stack = t.stack + "\nCAUSE: " + g.stack,
              t.response = e,
              t.url = _,
              "opaque" === e.type
          ) throw t;
          return e.text().then((r) => {
            var n;
            if (
              t.message = r,
                "json" === l.errorType ||
                "application/json" ===
                  (null === (n = e.headers.get("Content-Type")) || void 0 === n
                    ? void 0
                    : n.split(";")[0])
            ) {
              try {
                t.json = JSON.parse(r);
              } catch (e) {}
            }
            throw t.text = r, t.status = e.status, t;
          });
        }
        return e;
      }),
      m = (n) => (o) =>
        (n
          ? b.then((e) => e && e[n]()).then((e) => o ? o(e) : e)
          : b.then((e) => o ? o(e) : e)).catch((n) => {
            const o = n.hasOwnProperty(t),
              s = o ? n[t] : n,
              i = (null == s ? void 0 : s.status) && d.get(s.status) ||
                d.get(null == s ? void 0 : s.name) || o && d.has(t) && d.get(t);
            if (i) return i(s, e);
            const c = d.get(r);
            if (c) return c(s, e);
            throw s;
          }),
      w = {
        _wretchReq: e,
        _fetchReq: y,
        _sharedState: n,
        res: m(null),
        json: m("json"),
        blob: m("blob"),
        formData: m("formData"),
        arrayBuffer: m("arrayBuffer"),
        text: m("text"),
        error(e, t) {
          return d.set(e, t), this;
        },
        badRequest(e) {
          return this.error(400, e);
        },
        unauthorized(e) {
          return this.error(401, e);
        },
        forbidden(e) {
          return this.error(403, e);
        },
        notFound(e) {
          return this.error(404, e);
        },
        timeout(e) {
          return this.error(408, e);
        },
        internalError(e) {
          return this.error(500, e);
        },
        fetchError(e) {
          return this.error(t, e);
        },
      },
      T = f.reduce((e, t) => ({ ...e, ...t.resolver }), w);
    return u.reduce((t, r) => r(t, e), T);
  },
  a = {
    _url: "",
    _options: {},
    _config: i,
    _catchers: new Map(),
    _resolvers: [],
    _deferred: [],
    _middlewares: [],
    _addons: [],
    addon(e) {
      return { ...this, _addons: [...this._addons, e], ...e.wretch };
    },
    errorType(e) {
      return { ...this, _config: { ...this._config, errorType: e } };
    },
    polyfills(e, t = 0) {
      return {
        ...this,
        _config: {
          ...this._config,
          polyfills: t ? e : s(this._config.polyfills, e),
        },
      };
    },
    url(e, t = 0) {
      if (t) return { ...this, _url: e };
      const r = this._url.split("?");
      return {
        ...this,
        _url: r.length > 1 ? r[0] + e + "?" + r[1] : this._url + e,
      };
    },
    options(e, t = 0) {
      return { ...this, _options: t ? e : s(this._options, e) };
    },
    headers(e) {
      const t = e
        ? Array.isArray(e)
          ? Object.fromEntries(e)
          : "entries" in e
          ? Object.fromEntries(e.entries())
          : e
        : {};
      return { ...this, _options: s(this._options, { headers: t }) };
    },
    accept(e) {
      return this.headers({ Accept: e });
    },
    content(t) {
      return this.headers({ [e]: t });
    },
    auth(e) {
      return this.headers({ Authorization: e });
    },
    catcher(e, t) {
      const r = new Map(this._catchers);
      return r.set(e, t), { ...this, _catchers: r };
    },
    catcherFallback(e) {
      return this.catcher(r, e);
    },
    resolve(e, t = 0) {
      return { ...this, _resolvers: t ? [e] : [...this._resolvers, e] };
    },
    defer(e, t = 0) {
      return { ...this, _deferred: t ? [e] : [...this._deferred, e] };
    },
    middlewares(e, t = 0) {
      return { ...this, _middlewares: t ? e : [...this._middlewares, ...e] };
    },
    fetch(e = this._options.method, t = "", r = null) {
      let s = this.url(t).options({ method: e });
      const i = n(s._options.headers),
        c = "object" == typeof r && (!s._options.headers || !i || o(i));
      return s = r ? c ? s.json(r, i) : s.body(r) : s,
        l(s._deferred.reduce((e, t) => t(e, e._url, e._options), s));
    },
    get(e = "") {
      return this.fetch("GET", e);
    },
    delete(e = "") {
      return this.fetch("DELETE", e);
    },
    put(e, t = "") {
      return this.fetch("PUT", t, e);
    },
    post(e, t = "") {
      return this.fetch("POST", t, e);
    },
    patch(e, t = "") {
      return this.fetch("PATCH", t, e);
    },
    head(e = "") {
      return this.fetch("HEAD", e);
    },
    opts(e = "") {
      return this.fetch("OPTIONS", e);
    },
    body(e) {
      return { ...this, _options: { ...this._options, body: e } };
    },
    json(e, t) {
      const r = n(this._options.headers);
      return this.content(t || o(r) && r || "application/json").body(
        JSON.stringify(e),
      );
    },
  },
  u = () => ({
    beforeRequest(e, t, r) {
      const n = e._config.polyfill("AbortController", 0, 1);
      !t.signal && n && (t.signal = n.signal);
      const o = {
        ref: null,
        clear() {
          o.ref && (clearTimeout(o.ref), o.ref = null);
        },
      };
      return r.abort = { timeout: o, fetchController: n }, e;
    },
    wretch: {
      signal(e) {
        return { ...this, _options: { ...this._options, signal: e.signal } };
      },
    },
    resolver: {
      setTimeout(e, t = this._sharedState.abort.fetchController) {
        const { timeout: r } = this._sharedState.abort;
        return r.clear(), r.ref = setTimeout(() => t.abort(), e), this;
      },
      controller() {
        return [this._sharedState.abort.fetchController, this];
      },
      onAbort(e) {
        return this.error("AbortError", e);
      },
    },
  });
function h(e, t = 0, r, n = r.polyfill("FormData", 1, 1), o = []) {
  return Object.entries(e).forEach(([e, s]) => {
    let i = o.reduce((e, t) => e ? `${e}[${t}]` : t, null);
    if (
      i = i ? `${i}[${e}]` : e,
        s instanceof Array || globalThis.FileList && s instanceof FileList
    ) {
      for (const e of s) n.append(i, e);
    } else {!t || "object" != typeof s || t instanceof Array && t.includes(e)
        ? n.append(i, s)
        : null !== s && h(s, t, r, n, [...o, e]);}
  }),
    n;
}
const f = {
  wretch: {
    formData(e, t = 0) {
      return this.body(h(e, t, this._config));
    },
  },
};
function d(e, t) {
  return encodeURIComponent(e) + "=" +
    encodeURIComponent("object" == typeof t ? JSON.stringify(t) : "" + t);
}
const p = {
    wretch: {
      formUrl(e) {
        return this.body(
          "string" == typeof e ? e : (t = e,
            Object.keys(t).map((e) => {
              const r = t[e];
              return r instanceof Array
                ? r.map((t) => d(e, t)).join("&")
                : d(e, r);
            }).join("&")),
        ).content("application/x-www-form-urlencoded");
        var t;
      },
    },
  },
  _ = () => {
    const e = new Map();
    let t = null;
    const r = (r, n, o, s) => {
      if (!r.getEntriesByName) return 0;
      const i = r.getEntriesByName(n);
      return i && i.length > 0
        ? (o(i.reverse()[0]),
          s.clearMeasures && s.clearMeasures(n),
          e.delete(n),
          e.size < 1 &&
          (t.disconnect(), s.clearResourceTimings && s.clearResourceTimings()),
          1)
        : 0;
    };
    return {
      resolver: {
        perfs(n) {
          return this._fetchReq.then((o) =>
            ((n, o, s) => {
              if (!n || !o) return;
              const i = s.polyfill("performance", 0);
              ((n, o) => (!t && n && o && (t = new o((t) => {
                e.forEach((e, o) => {
                  r(t, o, e, n);
                });
              }),
                n.clearResourceTimings && n.clearResourceTimings()),
                t))(i, s.polyfill("PerformanceObserver", 0)) &&
                (r(i, n, o, i) ||
                  (e.size < 1 &&
                    t.observe({ entryTypes: ["resource", "measure"] }),
                    e.set(n, o)));
            })(this._wretchReq._url, n, this._wretchReq._config)
          ).catch(
            () => {},
          ),
            this;
        },
      },
    };
  };
function y(e) {
  return void 0 !== e ? e : "";
}
const g = (e, t, r, n) => {
    let o;
    if ("string" == typeof t) o = t;
    else {
      const e = n.polyfill("URLSearchParams", 1, 1);
      for (const r in t) {
        const n = t[r];
        if (t[r] instanceof Array) { for (const t of n) e.append(r, y(t)); }
        else e.append(r, y(n));
      }
      o = e.toString();
    }
    const s = e.split("?");
    return o ? r || s.length < 2 ? s[0] + "?" + o : e + "&" + o : r ? s[0] : e;
  },
  b = {
    wretch: {
      query(e, t = 0) {
        return { ...this, _url: g(this._url, e, t, this._config) };
      },
    },
  },
  m = () => {
    function e(e) {
      return (t) => (r, n) => {
        let o = 0, s = 0;
        return t(r, n).then((t) => {
          try {
            const r = t.headers.get("content-length");
            s = r ? +r : null;
            const n = new TransformStream({
              transform(t, r) {
                o += t.length,
                  s < o && (s = o),
                  e.progress && e.progress(o, s),
                  r.enqueue(t);
              },
            });
            return new Response(t.body.pipeThrough(n), t);
          } catch (e) {
            return t;
          }
        });
      };
    }
    return {
      beforeRequest: (t, r, n) => t.middlewares([e(n)]),
      resolver: {
        progress(e) {
          return this._sharedState.progress = e, this;
        },
      },
    };
  };
function w(e = "", t = {}) {
  return { ...a, _url: e, _options: t }.addon(u()).addon(f).addon(p).addon(_())
    .addon(b).addon(m());
}
w.default = w,
  w.options = function (e, t = 0) {
    i.options = t ? e : s(i.options, e);
  },
  w.errorType = function (e) {
    i.errorType = e;
  },
  w.polyfills = function (e, t = 0) {
    i.polyfills = t ? e : s(i.polyfills, e);
  },
  w.WretchError = c;
export { w as default };
//# sourceMappingURL=wretch.all.min.mjs.map
