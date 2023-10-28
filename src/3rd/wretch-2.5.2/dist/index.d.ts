import { setErrorType, setOptions, setPolyfills } from "./config.js";
import type { Wretch } from "./types.js";
export type {
  Config,
  ConfiguredMiddleware,
  FetchLike,
  Middleware,
  Wretch,
  WretchAddon,
  WretchDeferredCallback,
  WretchError,
  WretchErrorCallback,
  WretchOptions,
  WretchResponse,
  WretchResponseChain,
} from "./types.js";
/**
 * Creates a new wretch instance with a base url and base
 * [fetch options](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch).
 *
 * ```ts
 * import wretch from "wretch"
 *
 * // Reusable instance
 * const w = wretch("https://domain.com", { mode: "cors" })
 * ```
 *
 * @param _url The base url
 * @param _options The base fetch options
 * @returns A fresh wretch instance
 */
declare function factory(_url?: string, _options?: {}): Wretch;
declare namespace factory {
  var options: typeof setOptions;
  var errorType: typeof setErrorType;
  var polyfills: typeof setPolyfills;
  var WretchError: typeof import("./resolver.js").WretchError;
}
export default factory;
