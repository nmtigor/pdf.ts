function e(t, n = 0, o, r = o.polyfill("FormData", 1, 1), a = []) {
  return Object.entries(t).forEach(([t, c]) => {
    let f = a.reduce((e, t) => e ? `${e}[${t}]` : t, null);
    if (f = f ? `${f}[${t}]` : t, c instanceof Array) {
      for (const e of c) r.append(f, e);
    } else {!n || "object" != typeof c || n instanceof Array && n.includes(t)
        ? r.append(f, c)
        : null !== c && e(c, n, o, r, [...a, t]);}
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
export { t as default };
//# sourceMappingURL=formData.min.mjs.map
