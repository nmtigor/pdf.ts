"use strict";
const t = "Content-Type", e = Symbol(), r = Symbol();
function o(e = {}) {
  var r;
  return null ===
        (r = Object.entries(e).find(([e]) =>
          e.toLowerCase() === t.toLowerCase()
        )) || void 0 === r
    ? void 0
    : r[1];
}
function s(t) {
  return /^application\/.*json.*/.test(t);
}
const n = function (t, e, r = 0) {
    return Object.entries(e).reduce((e, [o, s]) => {
      const i = t[o];
      return Array.isArray(i) && Array.isArray(s)
        ? e[o] = r ? [...i, ...s] : s
        : e[o] = "object" == typeof i && "object" == typeof s ? n(i, s, r) : s,
        e;
    }, { ...t });
  },
  i = {
    options: {},
    errorType: "text",
    polyfills: {},
    polyfill(t, e = 1, r = 0, ...o) {
      const s = this.polyfills[t] ||
        ("undefined" != typeof self ? self[t] : null) ||
        ("undefined" != typeof global ? global[t] : null);
      if (e && !s) throw new Error(t + " is not defined");
      return r && s ? new s(...o) : s;
    },
  };
class h extends Error {}
const u = (t) => {
    const o = Object.create(null);
    t = t._addons.reduce(
      (e, r) => r.beforeRequest && r.beforeRequest(e, t._options, o) || e,
      t,
    );
    const {
        _url: s,
        _options: i,
        _config: u,
        _catchers: l,
        _resolvers: c,
        _middlewares: a,
        _addons: d,
      } = t,
      f = new Map(l),
      p = n(u.options, i);
    let _ = s;
    const y = ((t) => (e) => t.reduceRight((t, e) => e(t), e) || e)(a)(
        (t, e) => (_ = t, u.polyfill("fetch")(t, e)),
      )(s, p),
      b = new Error(),
      w = y.catch((t) => {
        throw { [e]: t };
      }).then((t) => {
        if (!t.ok) {
          const e = new h();
          if (
            e.cause = b,
              e.stack = e.stack + "\nCAUSE: " + b.stack,
              e.response = t,
              e.url = _,
              "opaque" === t.type
          ) throw e;
          return t.text().then((r) => {
            var o;
            if (
              e.message = r,
                "json" === u.errorType ||
                "application/json" ===
                  (null === (o = t.headers.get("Content-Type")) || void 0 === o
                    ? void 0
                    : o.split(";")[0])
            ) {
              try {
                e.json = JSON.parse(r);
              } catch (t) {}
            }
            throw e.text = r, e.status = t.status, e;
          });
        }
        return t;
      }),
      g = (o) => (s) =>
        (o
          ? w.then((t) => t && t[o]()).then((t) => s ? s(t) : t)
          : w.then((t) => s ? s(t) : t)).catch((o) => {
            const s = o.hasOwnProperty(e),
              n = s ? o[e] : o,
              i = (null == n ? void 0 : n.status) && f.get(n.status) ||
                f.get(null == n ? void 0 : n.name) || s && f.has(e) && f.get(e);
            if (i) return i(n, t);
            const h = f.get(r);
            if (h) return h(n, t);
            throw n;
          }),
      m = {
        _wretchReq: t,
        _fetchReq: y,
        _sharedState: o,
        res: g(null),
        json: g("json"),
        blob: g("blob"),
        formData: g("formData"),
        arrayBuffer: g("arrayBuffer"),
        text: g("text"),
        error(t, e) {
          return f.set(t, e), this;
        },
        badRequest(t) {
          return this.error(400, t);
        },
        unauthorized(t) {
          return this.error(401, t);
        },
        forbidden(t) {
          return this.error(403, t);
        },
        notFound(t) {
          return this.error(404, t);
        },
        timeout(t) {
          return this.error(408, t);
        },
        internalError(t) {
          return this.error(500, t);
        },
        fetchError(t) {
          return this.error(e, t);
        },
      },
      j = d.reduce(
        (t, e) => ({
          ...t,
          ..."function" == typeof e.resolver ? e.resolver(t) : e.resolver,
        }),
        m,
      );
    return c.reduce((e, r) => r(e, t), j);
  },
  l = {
    _url: "",
    _options: {},
    _config: i,
    _catchers: new Map(),
    _resolvers: [],
    _deferred: [],
    _middlewares: [],
    _addons: [],
    addon(t) {
      return { ...this, _addons: [...this._addons, t], ...t.wretch };
    },
    errorType(t) {
      return { ...this, _config: { ...this._config, errorType: t } };
    },
    polyfills(t, e = 0) {
      return {
        ...this,
        _config: {
          ...this._config,
          polyfills: e ? t : n(this._config.polyfills, t),
        },
      };
    },
    url(t, e = 0) {
      if (e) return { ...this, _url: t };
      const r = this._url.split("?");
      return {
        ...this,
        _url: r.length > 1 ? r[0] + t + "?" + r[1] : this._url + t,
      };
    },
    options(t, e = 0) {
      return { ...this, _options: e ? t : n(this._options, t) };
    },
    headers(t) {
      const e = t
        ? Array.isArray(t)
          ? Object.fromEntries(t)
          : "entries" in t
          ? Object.fromEntries(t.entries())
          : t
        : {};
      return { ...this, _options: n(this._options, { headers: e }) };
    },
    accept(t) {
      return this.headers({ Accept: t });
    },
    content(e) {
      return this.headers({ [t]: e });
    },
    auth(t) {
      return this.headers({ Authorization: t });
    },
    catcher(t, e) {
      const r = new Map(this._catchers);
      return r.set(t, e), { ...this, _catchers: r };
    },
    catcherFallback(t) {
      return this.catcher(r, t);
    },
    resolve(t, e = 0) {
      return { ...this, _resolvers: e ? [t] : [...this._resolvers, t] };
    },
    defer(t, e = 0) {
      return { ...this, _deferred: e ? [t] : [...this._deferred, t] };
    },
    middlewares(t, e = 0) {
      return { ...this, _middlewares: e ? t : [...this._middlewares, ...t] };
    },
    fetch(t = this._options.method, e = "", r = null) {
      let n = this.url(e).options({ method: t });
      const i = o(n._options.headers),
        h = this._config.polyfill("FormData", 0),
        l = "object" == typeof r && !(h && r instanceof h) &&
          (!n._options.headers || !i || s(i));
      return n = r ? l ? n.json(r, i) : n.body(r) : n,
        u(n._deferred.reduce((t, e) => e(t, t._url, t._options), n));
    },
    get(t = "") {
      return this.fetch("GET", t);
    },
    delete(t = "") {
      return this.fetch("DELETE", t);
    },
    put(t, e = "") {
      return this.fetch("PUT", e, t);
    },
    post(t, e = "") {
      return this.fetch("POST", e, t);
    },
    patch(t, e = "") {
      return this.fetch("PATCH", e, t);
    },
    head(t = "") {
      return this.fetch("HEAD", t);
    },
    opts(t = "") {
      return this.fetch("OPTIONS", t);
    },
    body(t) {
      return { ...this, _options: { ...this._options, body: t } };
    },
    json(t, e) {
      const r = o(this._options.headers);
      return this.content(e || s(r) && r || "application/json").body(
        JSON.stringify(t),
      );
    },
  };
function c(t = "", e = {}) {
  return { ...l, _url: t, _options: e };
}
c.default = c,
  c.options = function (t, e = 0) {
    i.options = e ? t : n(i.options, t);
  },
  c.errorType = function (t) {
    i.errorType = t;
  },
  c.polyfills = function (t, e = 0) {
    i.polyfills = e ? t : n(i.polyfills, t);
  },
  c.WretchError = h,
  module.exports = c;
//# sourceMappingURL=wretch.min.cjs.map
