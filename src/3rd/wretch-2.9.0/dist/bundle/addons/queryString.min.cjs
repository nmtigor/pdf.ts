"use strict";
function t(t) {
  return void 0 !== t ? t : "";
}
const n = (n, r, e, o, s) => {
    let i;
    if ("string" == typeof r) i = r;
    else {
      const n = s.polyfill("URLSearchParams", 1, 1);
      for (const e in r) {
        const s = r[e];
        if (!o || null != s) {
          if (r[e] instanceof Array) { for (const r of s) n.append(e, t(r)); }
          else n.append(e, t(s));
        }
      }
      i = n.toString();
    }
    const l = n.split("?");
    return i ? e || l.length < 2 ? l[0] + "?" + i : n + "&" + i : e ? l[0] : n;
  },
  r = {
    wretch: {
      query(t, r = 0, e = 0) {
        return { ...this, _url: n(this._url, t, r, e, this._config) };
      },
    },
  };
module.exports = r;
//# sourceMappingURL=queryString.min.cjs.map
