const t = Symbol();
function e(t = {}) {
  var e;
  return null ===
        (e = Object.entries(t).find(([t]) =>
          t.toLowerCase() === "Content-Type".toLowerCase()
        )) || void 0 === e
    ? void 0
    : e[1];
}
function r(t) {
  return /^application\/.*json.*/.test(t);
}
const o = function (t, e, r = 0) {
    return Object.entries(e).reduce((e, [s, n]) => {
      const i = t[s];
      return Array.isArray(i) && Array.isArray(n)
        ? e[s] = r ? [...i, ...n] : n
        : e[s] = "object" == typeof i && "object" == typeof n ? o(i, n, r) : n,
        e;
    }, { ...t });
  },
  s = {
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
class n extends Error {}
const i = (e) => {
    const r = Object.create(null);
    e = e._addons.reduce(
      (t, o) => o.beforeRequest && o.beforeRequest(t, e._options, r) || t,
      e,
    );
    const {
        _url: s,
        _options: i,
        _config: h,
        _catchers: u,
        _resolvers: l,
        _middlewares: a,
        _addons: c,
      } = e,
      d = new Map(u),
      p = o(h.options, i);
    let f = s;
    const _ = ((t) => (e) => t.reduceRight((t, e) => e(t), e) || e)(a)(
        (t, e) => (f = t, h.polyfill("fetch")(t, e)),
      )(s, p),
      y = new Error(),
      w = _.catch((t) => {
        throw { __wrap: t };
      }).then((t) => {
        if (!t.ok) {
          const e = new n();
          if (
            e.cause = y,
              e.stack = e.stack + "\nCAUSE: " + y.stack,
              e.response = t,
              e.url = f,
              "opaque" === t.type
          ) throw e;
          return t.text().then((r) => {
            var o;
            if (
              e.message = r,
                "json" === h.errorType ||
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
      b = (r) => (o) =>
        (r
          ? w.then((t) => t && t[r]()).then((t) => o ? o(t) : t)
          : w.then((t) => o ? o(t) : t)).catch((r) => {
            const o = r.__wrap || r,
              s = o.status && d.get(o.status) || d.get(o.name) ||
                r.__wrap && d.has(t) && d.get(t);
            if (s) return s(o, e);
            throw o;
          }),
      g = {
        _wretchReq: e,
        _fetchReq: _,
        _sharedState: r,
        res: b(null),
        json: b("json"),
        blob: b("blob"),
        formData: b("formData"),
        arrayBuffer: b("arrayBuffer"),
        text: b("text"),
        error(t, e) {
          return d.set(t, e), this;
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
        fetchError(e) {
          return this.error(t, e);
        },
      },
      j = c.reduce((t, e) => ({ ...t, ...e.resolver }), g);
    return l.reduce((t, r) => r(t, e), j);
  },
  h = {
    _url: "",
    _options: {},
    _config: s,
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
          polyfills: e ? t : o(this._config.polyfills, t),
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
      return { ...this, _options: e ? t : o(this._options, t) };
    },
    headers(t) {
      return { ...this, _options: o(this._options, { headers: t || {} }) };
    },
    accept(t) {
      return this.headers({ Accept: t });
    },
    content(t) {
      return this.headers({ "Content-Type": t });
    },
    auth(t) {
      return this.headers({ Authorization: t });
    },
    catcher(t, e) {
      const r = new Map(this._catchers);
      return r.set(t, e), { ...this, _catchers: r };
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
    fetch(t = this._options.method, o = "", s = null) {
      let n = this.url(o).options({ method: t });
      const h = e(n._options.headers),
        u = "object" == typeof s && (!n._options.headers || !h || r(h));
      return n = s ? u ? n.json(s, h) : n.body(s) : n,
        i(n._deferred.reduce((t, e) => e(t, t._url, t._options), n));
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
    json(t, o) {
      const s = e(this._options.headers);
      return this.content(o || r(s) && s || "application/json").body(
        JSON.stringify(t),
      );
    },
  };
function u(t = "", e = {}) {
  return { ...h, _url: t, _options: e };
}
u.default = u,
  u.options = function (t, e = 0) {
    s.options = e ? t : o(s.options, t);
  },
  u.errorType = function (t) {
    s.errorType = t;
  },
  u.polyfills = function (t, e = 0) {
    s.polyfills = e ? t : o(s.polyfills, t);
  },
  u.WretchError = n;
export { u as default };
//# sourceMappingURL=wretch.min.mjs.map
