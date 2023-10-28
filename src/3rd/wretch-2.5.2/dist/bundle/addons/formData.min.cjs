function e(t, n = 0, o, r = o.polyfill("FormData", 1, 1), c = []) {
  return Object.entries(t).forEach(([t, a]) => {
    let f = c.reduce((e, t) => e ? `${e}[${t}]` : t, null);
    if (f = f ? `${f}[${t}]` : t, a instanceof Array) {
      for (const e of a) r.append(f, e);
    } else {!n || "object" != typeof a || n instanceof Array && n.includes(t)
        ? r.append(f, a)
        : null !== a && e(a, n, o, r, [...c, t]);}
  }),
    r;
}
const t = {
  wretch: {
    formData(t, n = 0) {
      return this.body(e(t, n, this._config));
    },
  },
};
module.exports = t;
//# sourceMappingURL=formData.min.cjs.map
