const e = Symbol();
function t(e = {}) {
  var t;
  return null ===
        (t = Object.entries(e).find(([e]) =>
          e.toLowerCase() === "Content-Type".toLowerCase()
        )) || void 0 === t
    ? void 0
    : t[1];
}
function r(e) {
  return /^application\/.*json.*/.test(e);
}
const o = function (e, t, r = 0) {
    return Object.entries(t).reduce((t, [n, s]) => {
      const i = e[n];
      return Array.isArray(i) && Array.isArray(s)
        ? t[n] = r ? [...i, ...s] : s
        : t[n] = "object" == typeof i && "object" == typeof s ? o(i, s, r) : s,
        t;
    }, { ...e });
  },
  n = {
    options: {},
    errorType: "text",
    polyfills: {},
    polyfill(e, t = 1, r = 0, ...o) {
      const n = this.polyfills[e] ||
        ("undefined" != typeof self ? self[e] : null) ||
        ("undefined" != typeof global ? global[e] : null);
      if (t && !n) throw new Error(e + " is not defined");
      return r && n ? new n(...o) : n;
    },
  };
class s extends Error {}
const i = (t) => {
    const r = Object.create(null);
    t = t._addons.reduce(
      (e, o) => o.beforeRequest && o.beforeRequest(e, t._options, r) || e,
      t,
    );
    const {
        _url: n,
        _options: i,
        _config: c,
        _catchers: l,
        _resolvers: a,
        _middlewares: u,
        _addons: h,
      } = t,
      f = new Map(l),
      d = o(c.options, i);
    let p = n;
    const _ = ((e) => (t) => e.reduceRight((e, t) => t(e), t) || t)(u)(
        (e, t) => (p = e, c.polyfill("fetch")(e, t)),
      )(n, d),
      y = new Error(),
      g = _.catch((e) => {
        throw { __wrap: e };
      }).then((e) => {
        if (!e.ok) {
          const t = new s();
          if (
            t.cause = y,
              t.stack = t.stack + "\nCAUSE: " + y.stack,
              t.response = e,
              t.url = p,
              "opaque" === e.type
          ) throw t;
          return e.text().then((r) => {
            var o;
            if (
              t.message = r,
                "json" === c.errorType ||
                "application/json" ===
                  (null === (o = e.headers.get("Content-Type")) || void 0 === o
                    ? void 0
                    : o.split(";")[0])
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
      b = (r) => (o) =>
        (r
          ? g.then((e) => e && e[r]()).then((e) => o ? o(e) : e)
          : g.then((e) => o ? o(e) : e)).catch((r) => {
            const o = r.__wrap || r,
              n = o.status && f.get(o.status) || f.get(o.name) ||
                r.__wrap && f.has(e) && f.get(e);
            if (n) return n(o, t);
            throw o;
          }),
      m = {
        _wretchReq: t,
        _fetchReq: _,
        _sharedState: r,
        res: b(null),
        json: b("json"),
        blob: b("blob"),
        formData: b("formData"),
        arrayBuffer: b("arrayBuffer"),
        text: b("text"),
        error(e, t) {
          return f.set(e, t), this;
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
        fetchError(t) {
          return this.error(e, t);
        },
      },
      w = h.reduce((e, t) => ({ ...e, ...t.resolver }), m);
    return a.reduce((e, r) => r(e, t), w);
  },
  c = {
    _url: "",
    _options: {},
    _config: n,
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
          polyfills: t ? e : o(this._config.polyfills, e),
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
      return { ...this, _options: t ? e : o(this._options, e) };
    },
    headers(e) {
      return { ...this, _options: o(this._options, { headers: e || {} }) };
    },
    accept(e) {
      return this.headers({ Accept: e });
    },
    content(e) {
      return this.headers({ "Content-Type": e });
    },
    auth(e) {
      return this.headers({ Authorization: e });
    },
    catcher(e, t) {
      const r = new Map(this._catchers);
      return r.set(e, t), { ...this, _catchers: r };
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
    fetch(e = this._options.method, o = "", n = null) {
      let s = this.url(o).options({ method: e });
      const c = t(s._options.headers),
        l = "object" == typeof n && (!s._options.headers || !c || r(c));
      return s = n ? l ? s.json(n, c) : s.body(n) : s,
        i(s._deferred.reduce((e, t) => t(e, e._url, e._options), s));
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
    json(e, o) {
      const n = t(this._options.headers);
      return this.content(o || r(n) && n || "application/json").body(
        JSON.stringify(e),
      );
    },
  },
  l = () => ({
    beforeRequest(e, t, r) {
      const o = e._config.polyfill("AbortController", 0, 1);
      !t.signal && o && (t.signal = o.signal);
      const n = {
        ref: null,
        clear() {
          n.ref && (clearTimeout(n.ref), n.ref = null);
        },
      };
      return r.abort = { timeout: n, fetchController: o }, e;
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
function a(e, t = 0, r, o = r.polyfill("FormData", 1, 1), n = []) {
  return Object.entries(e).forEach(([e, s]) => {
    let i = n.reduce((e, t) => e ? `${e}[${t}]` : t, null);
    if (i = i ? `${i}[${e}]` : e, s instanceof Array) {
      for (const e of s) o.append(i, e);
    } else {!t || "object" != typeof s || t instanceof Array && t.includes(e)
        ? o.append(i, s)
        : null !== s && a(s, t, r, o, [...n, e]);}
  }),
    o;
}
const u = {
  wretch: {
    formData(e, t = 0) {
      return this.body(a(e, t, this._config));
    },
  },
};
function h(e, t) {
  return encodeURIComponent(e) + "=" +
    encodeURIComponent("object" == typeof t ? JSON.stringify(t) : "" + t);
}
const f = {
    wretch: {
      formUrl(e) {
        return this.body(
          "string" == typeof e ? e : (t = e,
            Object.keys(t).map((e) => {
              const r = t[e];
              return r instanceof Array
                ? r.map((t) => h(e, t)).join("&")
                : h(e, r);
            }).join("&")),
        ).content("application/x-www-form-urlencoded");
        var t;
      },
    },
  },
  d = () => {
    const e = new Map();
    let t = null;
    const r = (r, o, n, s) => {
      if (!r.getEntriesByName) return 0;
      const i = r.getEntriesByName(o);
      return i && i.length > 0
        ? (n(i.reverse()[0]),
          s.clearMeasures && s.clearMeasures(o),
          e.delete(o),
          e.size < 1 &&
          (t.disconnect(), s.clearResourceTimings && s.clearResourceTimings()),
          1)
        : 0;
    };
    return {
      resolver: {
        perfs(o) {
          return this._fetchReq.then((n) =>
            ((o, n, s) => {
              if (!o || !n) return;
              const i = s.polyfill("performance", 0);
              ((o, n) => (!t && o && n && (t = new n((t) => {
                e.forEach((e, n) => {
                  r(t, n, e, o);
                });
              }),
                o.clearResourceTimings && o.clearResourceTimings()),
                t))(i, s.polyfill("PerformanceObserver", 0)) &&
                (r(i, o, n, i) ||
                  (e.size < 1 &&
                    t.observe({ entryTypes: ["resource", "measure"] }),
                    e.set(o, n)));
            })(this._wretchReq._url, o, this._wretchReq._config)
          ).catch(
            () => {},
          ),
            this;
        },
      },
    };
  };
function p(e) {
  return void 0 !== e ? e : "";
}
const _ = (e, t, r, o) => {
    let n;
    if ("string" == typeof t) n = t;
    else {
      const e = o.polyfill("URLSearchParams", 1, 1);
      for (const r in t) {
        const o = t[r];
        if (t[r] instanceof Array) for (const t of o) e.append(r, p(t));
        else e.append(r, p(o));
      }
      n = e.toString();
    }
    const s = e.split("?");
    return n ? r || s.length < 2 ? s[0] + "?" + n : e + "&" + n : r ? s[0] : e;
  },
  y = {
    wretch: {
      query(e, t = 0) {
        return { ...this, _url: _(this._url, e, t, this._config) };
      },
    },
  },
  g = () => {
    function e(e) {
      return (t) => (r, o) => {
        let n = 0, s = 0;
        return t(r, o).then((t) => {
          try {
            const r = t.headers.get("content-length");
            s = r ? +r : null;
            const o = new TransformStream({
              transform(t, r) {
                n += t.length,
                  s < n && (s = n),
                  e.progress && e.progress(n, s),
                  r.enqueue(t);
              },
            });
            return new Response(t.body.pipeThrough(o), t);
          } catch (e) {
            return t;
          }
        });
      };
    }
    return {
      beforeRequest: (t, r, o) => t.middlewares([e(o)]),
      resolver: {
        progress(e) {
          return this._sharedState.progress = e, this;
        },
      },
    };
  };
function b(e = "", t = {}) {
  return { ...c, _url: e, _options: t }.addon(l()).addon(u).addon(f).addon(d())
    .addon(y).addon(g());
}
b.default = b,
  b.options = function (e, t = 0) {
    n.options = t ? e : o(n.options, e);
  },
  b.errorType = function (e) {
    n.errorType = e;
  },
  b.polyfills = function (e, t = 0) {
    n.polyfills = t ? e : o(n.polyfills, e);
  },
  b.WretchError = s;
export { b as default };
//# sourceMappingURL=wretch.all.min.mjs.map
