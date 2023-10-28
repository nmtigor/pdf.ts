function n(n, o) {
  return encodeURIComponent(n) + "=" +
    encodeURIComponent("object" == typeof o ? JSON.stringify(o) : "" + o);
}
const o = {
  wretch: {
    formUrl(o) {
      return this.body(
        "string" == typeof o ? o : (e = o,
          Object.keys(e).map((o) => {
            const t = e[o];
            return t instanceof Array
              ? t.map((e) => n(o, e)).join("&")
              : n(o, t);
          }).join("&")),
      ).content("application/x-www-form-urlencoded");
      var e;
    },
  },
};
module.exports = o;
//# sourceMappingURL=formUrl.min.cjs.map
