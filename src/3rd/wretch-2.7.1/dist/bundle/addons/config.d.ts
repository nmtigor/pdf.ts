import type { Config } from "./types.js";
declare const config: Config;
/**
 * Sets the default fetch options that will be stored internally when instantiating wretch objects.
 *
 * ```js
 * import wretch from "wretch"
 *
 * wretch.options({ headers: { "Accept": "application/json" } });
 *
 * // The fetch request is sent with both headers.
 * wretch("...", { headers: { "X-Custom": "Header" } }).get().res();
 * ```
 *
 * @param options Default options
 * @param replace If true, completely replaces the existing options instead of mixing in
 */
export declare function setOptions(options: object, replace?: boolean): void;
/**
 * Sets the default polyfills that will be stored internally when instantiating wretch objects.
 * Useful for browserless environments like `node.js`.
 *
 * Needed for libraries like [fetch-ponyfill](https://github.com/qubyte/fetch-ponyfill).
 *
 * ```js
 * import wretch from "wretch"
 *
 * wretch.polyfills({
 *   fetch: require("node-fetch"),
 *   FormData: require("form-data"),
 *   URLSearchParams: require("url").URLSearchParams,
 * });
 *
 * // Uses the above polyfills.
 * wretch("...").get().res();
 * ```
 *
 * @param polyfills An object containing the polyfills
 * @param replace If true, replaces the current polyfills instead of mixing in
 */
export declare function setPolyfills(polyfills: object, replace?: boolean): void;
/**
 * Sets the default method (text, json, …) used to parse the data contained in the response body in case of an HTTP error.
 * As with other static methods, it will affect wretch instances created after calling this function.
 *
 * _Note: if the response Content-Type header is set to "application/json", the body will be parsed as json regardless of the errorType._
 *
 * ```js
 * import wretch from "wretch"
 *
 * wretch.errorType("json")
 *
 * wretch("http://server/which/returns/an/error/with/a/json/body")
 *   .get()
 *   .res()
 *   .catch(error => {
 *     // error[errorType] (here, json) contains the parsed body
 *     console.log(error.json)
 *   })
 * ```
 *
 * If null, defaults to "text".
 */
export declare function setErrorType(errorType: string): void;
export default config;
