function e(e) {
  const n = (new TextEncoder()).encode(e);
  return btoa(String.fromCharCode(...n));
}
const n = {
  beforeRequest(n) {
    return n.middlewares([
      (o = n._config, (n) => (r, t) => {
        const s = o.polyfill("URL"), a = s.canParse(r) ? new s(r) : null;
        if (
          (null == a ? void 0 : a.username) ||
          (null == a ? void 0 : a.password)
        ) {
          const n = e(
            `${decodeURIComponent(a.username)}:${
              decodeURIComponent(a.password)
            }`,
          );
          t.headers = { ...t.headers, Authorization: `Basic ${n}` },
            a.username = "",
            a.password = "",
            r = a.toString();
        }
        return n(r, t);
      }),
    ]);
    var o;
  },
  wretch: {
    basicAuth(n, o) {
      const r = e(`${n}:${o}`);
      return this.auth(`Basic ${r}`);
    },
  },
};
export { n as default };
//# sourceMappingURL=basicAuth.min.mjs.map
