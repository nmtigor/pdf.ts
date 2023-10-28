const e = (e, t) => t.skipDedupe || "GET" !== t.method,
  t = (e, t) => t.method + "@" + e,
  r = (e) => e.clone();
exports.dedupe = ({ skip: o = e, key: n = t, resolver: s = r } = {}) => {
  const c = new Map();
  return (e) => (t, r) => {
    if (o(t, r)) return e(t, r);
    const h = n(t, r);
    if (c.has(h)) {
      return new Promise((e, t) => {
        c.get(h).push([e, t]);
      });
    }
    c.set(h, []);
    try {
      return e(t, r).then(
        (e) => (c.get(h).forEach(([t]) => t(s(e))), c.delete(h), e),
      ).catch((e) => {
        throw c.get(h).forEach(([t, r]) => r(e)), c.delete(h), e;
      });
    } catch (e) {
      return c.delete(h), Promise.reject(e);
    }
  };
};
//# sourceMappingURL=dedupe.min.cjs.map
