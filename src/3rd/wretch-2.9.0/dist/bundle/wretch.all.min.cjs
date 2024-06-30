"use strict";
const e = "Content-Type", t = Symbol(), r = Symbol();
function o(t = {}) {
  var r;
  return null ===
        (r = Object.entries(t).find(([t]) =>
          t.toLowerCase() === e.toLowerCase()
        )) || void 0 === r
    ? void 0
    : r[1];
}
function n(e) {
  return /^application\/.*json.*/.test(e);
}
const s = function (e, t, r = 0) {
    return Object.entries(t).reduce((t, [o, n]) => {
      const i = e[o];
      return Array.isArray(i) && Array.isArray(n)
        ? t[o] = r ? [...i, ...n] : n
        : t[o] = "object" == typeof i && "object" == typeof n ? s(i, n, r) : n,
        t;
    }, { ...e });
  },
  i = {
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
class c extends Error {}
const l = (e) => {
    const o = Object.create(null);
    e = e._addons.reduce(
      (t, r) => r.beforeRequest && r.beforeRequest(t, e._options, o) || t,
      e,
    );
    const {
        _url: n,
        _options: i,
        _config: l,
        _catchers: a,
        _resolvers: u,
        _middlewares: h,
        _addons: f,
      } = e,
      d = new Map(a),
      p = s(l.options, i);
    let _ = n;
    const y = ((e) => (t) => e.reduceRight((e, t) => t(e), t) || t)(h)(
        (e, t) => (_ = e, l.polyfill("fetch")(e, t)),
      )(n, p),
      g = new Error(),
      m = y.catch((e) => {
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
            var o;
            if (
              t.message = r,
                "json" === l.errorType ||
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
      b = (o) => (n) =>
        (o
          ? m.then((e) => e && e[o]()).then((e) => n ? n(e) : e)
          : m.then((e) => n ? n(e) : e)).catch((o) => {
            const n = o.hasOwnProperty(t),
              s = n ? o[t] : o,
              i = (null == s ? void 0 : s.status) && d.get(s.status) ||
                d.get(null == s ? void 0 : s.name) || n && d.has(t) && d.get(t);
            if (i) return i(s, e);
            const c = d.get(r);
            if (c) return c(s, e);
            throw s;
          }),
      w = {
        _wretchReq: e,
        _fetchReq: y,
        _sharedState: o,
        res: b(null),
        json: b("json"),
        blob: b("blob"),
        formData: b("formData"),
        arrayBuffer: b("arrayBuffer"),
        text: b("text"),
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
      v = f.reduce(
        (e, t) => ({
          ...e,
          ..."function" == typeof t.resolver ? t.resolver(e) : t.resolver,
        }),
        w,
      );
    return u.reduce((t, r) => r(t, e), v);
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
      const i = o(s._options.headers),
        c = this._config.polyfill("FormData", 0),
        a = "object" == typeof r && !(c && r instanceof c) &&
          (!s._options.headers || !i || n(i));
      return s = r ? a ? s.json(r, i) : s.body(r) : s,
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
      const r = o(this._options.headers);
      return this.content(t || n(r) && r || "application/json").body(
        JSON.stringify(e),
      );
    },
  },
  u = () => ({
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
function h(e) {
  const t = (new TextEncoder()).encode(e);
  return btoa(String.fromCharCode(...t));
}
const f = (e) => (t) => (r, o) => {
    const n = e.polyfill("URL"), s = n.canParse(r) ? new n(r) : null;
    if (
      (null == s ? void 0 : s.username) || (null == s ? void 0 : s.password)
    ) {
      const e = h(
        `${decodeURIComponent(s.username)}:${decodeURIComponent(s.password)}`,
      );
      o.headers = { ...o.headers, Authorization: `Basic ${e}` },
        s.username = "",
        s.password = "",
        r = s.toString();
    }
    return t(r, o);
  },
  d = {
    beforeRequest: (e) => e.middlewares([f(e._config)]),
    wretch: {
      basicAuth(e, t) {
        const r = h(`${e}:${t}`);
        return this.auth(`Basic ${r}`);
      },
    },
  };
function p(e, t = 0, r, o = r.polyfill("FormData", 1, 1), n = []) {
  return Object.entries(e).forEach(([e, s]) => {
    let i = n.reduce((e, t) => e ? `${e}[${t}]` : t, null);
    if (
      i = i ? `${i}[${e}]` : e,
        s instanceof Array || globalThis.FileList && s instanceof FileList
    ) {
      for (const e of s) o.append(i, e);
    } else {!t || "object" != typeof s || t instanceof Array && t.includes(e)
        ? o.append(i, s)
        : null !== s && p(s, t, r, o, [...n, e]);}
  }),
    o;
}
const _ = {
  wretch: {
    formData(e, t = 0) {
      return this.body(p(e, t, this._config));
    },
  },
};
function y(e, t) {
  return encodeURIComponent(e) + "=" +
    encodeURIComponent("object" == typeof t ? JSON.stringify(t) : "" + t);
}
const g = {
    wretch: {
      formUrl(e) {
        return this.body(
          "string" == typeof e ? e : (t = e,
            Object.keys(t).map((e) => {
              const r = t[e];
              return r instanceof Array
                ? r.map((t) => y(e, t)).join("&")
                : y(e, r);
            }).join("&")),
        ).content("application/x-www-form-urlencoded");
        var t;
      },
    },
  },
  m = () => {
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
function b(e) {
  return void 0 !== e ? e : "";
}
const w = (e, t, r, o, n) => {
    let s;
    if ("string" == typeof t) s = t;
    else {
      const e = n.polyfill("URLSearchParams", 1, 1);
      for (const r in t) {
        const n = t[r];
        if (!o || null != n) {
          if (t[r] instanceof Array) { for (const t of n) e.append(r, b(t)); }
          else e.append(r, b(n));
        }
      }
      s = e.toString();
    }
    const i = e.split("?");
    return s ? r || i.length < 2 ? i[0] + "?" + s : e + "&" + s : r ? i[0] : e;
  },
  v = {
    wretch: {
      query(e, t = 0, r = 0) {
        return { ...this, _url: w(this._url, e, t, r, this._config) };
      },
    },
  },
  T = () => {
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
function j(e = "", t = {}) {
  return { ...a, _url: e, _options: t }.addon(u()).addon(d).addon(_).addon(g)
    .addon(m()).addon(v).addon(T());
}
j.default = j,
  j.options = function (e, t = 0) {
    i.options = t ? e : s(i.options, e);
  },
  j.errorType = function (e) {
    i.errorType = e;
  },
  j.polyfills = function (e, t = 0) {
    i.polyfills = t ? e : s(i.polyfills, e);
  },
  j.WretchError = c,
  module.exports = j;
//# sourceMappingURL=wretch.all.min.cjs.map
