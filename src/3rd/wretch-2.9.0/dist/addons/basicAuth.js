function utf8ToBase64(input) {
  const utf8Bytes = new TextEncoder().encode(input);
  return btoa(String.fromCharCode(...utf8Bytes));
}
const makeBasicAuthMiddleware = (config) => (next) => (url, opts) => {
  const _URL = config.polyfill("URL");
  const parsedUrl = _URL.canParse(url) ? new _URL(url) : null;
  if (
    (parsedUrl === null || parsedUrl === void 0
      ? void 0
      : parsedUrl.username) ||
    (parsedUrl === null || parsedUrl === void 0 ? void 0 : parsedUrl.password)
  ) {
    const basicAuthBase64 = utf8ToBase64(
      `${decodeURIComponent(parsedUrl.username)}:${
        decodeURIComponent(parsedUrl.password)
      }`,
    );
    opts.headers = {
      ...opts.headers,
      Authorization: `Basic ${basicAuthBase64}`,
    };
    parsedUrl.username = "";
    parsedUrl.password = "";
    url = parsedUrl.toString();
  }
  return next(url, opts);
};
/**
 * Adds the ability to use basic auth with the `Authorization` header.
 *
 * ```js
 * import BasicAuthAddon from "wretch/addons/basicAuth"
 *
 * wretch().addon(BasicAuthAddon)
 * ```
 */
const basicAuth = {
  beforeRequest(wretch) {
    return wretch.middlewares([makeBasicAuthMiddleware(wretch._config)]);
  },
  wretch: {
    basicAuth(username, password) {
      const basicAuthBase64 = utf8ToBase64(`${username}:${password}`);
      return this.auth(`Basic ${basicAuthBase64}`);
    },
  },
};
export default basicAuth;
//# sourceMappingURL=basicAuth.js.map
