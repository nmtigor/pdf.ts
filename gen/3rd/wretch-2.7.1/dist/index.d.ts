export default factory;
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
declare function factory(_url?: string, _options?: {}): {
    _url: string;
    _options: {};
    _config: import("./types.js").Config;
    _catchers: Map<string | number | symbol, (error: import("./types.js").WretchError, originalRequest: import("./types.js").Wretch<unknown, unknown, undefined>) => void>;
    _resolvers: ((resolver: import("./types.js").WretchResponseChain<unknown, unknown, undefined>, originalRequest: import("./types.js").Wretch<unknown, unknown, undefined>) => any)[];
    _deferred: import("./types.js").WretchDeferredCallback<unknown, unknown, undefined>[];
    _middlewares: import("./types.js").ConfiguredMiddleware[];
    _addons: import("./types.js").WretchAddon<unknown, unknown>[];
    addon<W, R>(addon: import("./types.js").WretchAddon<W, R>): W & import("./types.js").Wretch<W, R, undefined>;
    errorType(this: import("./types.js").Wretch<unknown, unknown, undefined>, method: string): import("./types.js").Wretch<unknown, unknown, undefined>;
    polyfills(this: import("./types.js").Wretch<unknown, unknown, undefined>, polyfills: Partial<{}>, replace?: boolean | undefined): import("./types.js").Wretch<unknown, unknown, undefined>;
    url(this: import("./types.js").Wretch<unknown, unknown, undefined>, url: string, replace?: boolean | undefined): import("./types.js").Wretch<unknown, unknown, undefined>;
    options(this: import("./types.js").Wretch<unknown, unknown, undefined>, options: import("./types.js").WretchOptions, replace?: boolean | undefined): import("./types.js").Wretch<unknown, unknown, undefined>;
    headers(this: import("./types.js").Wretch<unknown, unknown, undefined>, headerValues: HeadersInit): import("./types.js").Wretch<unknown, unknown, undefined>;
    accept(this: import("./types.js").Wretch<unknown, unknown, undefined>, headerValue: string): import("./types.js").Wretch<unknown, unknown, undefined>;
    content(this: import("./types.js").Wretch<unknown, unknown, undefined>, headerValue: string): import("./types.js").Wretch<unknown, unknown, undefined>;
    auth(this: import("./types.js").Wretch<unknown, unknown, undefined>, headerValue: string): import("./types.js").Wretch<unknown, unknown, undefined>;
    catcher(this: import("./types.js").Wretch<unknown, unknown, undefined>, errorId: string | number | symbol, catcher: (error: import("./types.js").WretchError, originalRequest: import("./types.js").Wretch<unknown, unknown, undefined>) => any): import("./types.js").Wretch<unknown, unknown, undefined>;
    catcherFallback(this: import("./types.js").Wretch<unknown, unknown, undefined>, catcher: (error: import("./types.js").WretchError, originalRequest: import("./types.js").Wretch<unknown, unknown, undefined>) => any): import("./types.js").Wretch<unknown, unknown, undefined>;
    defer<Clear extends boolean = false>(this: import("./types.js").Wretch<unknown, unknown, undefined>, callback: import("./types.js").WretchDeferredCallback<unknown, unknown, undefined>, clear?: Clear | undefined): import("./types.js").Wretch<unknown, unknown, undefined>;
    resolve<ResolverReturn, Clear_1 extends boolean = false>(this: import("./types.js").Wretch<unknown, unknown, undefined>, resolver: (chain: import("./types.js").WretchResponseChain<unknown, unknown, undefined>, originalRequest: import("./types.js").Wretch<unknown, unknown, Clear_1 extends true ? undefined : undefined>) => ResolverReturn, clear?: Clear_1 | undefined): import("./types.js").Wretch<unknown, unknown, ResolverReturn>;
    middlewares(this: import("./types.js").Wretch<unknown, unknown, undefined>, middlewares: import("./types.js").ConfiguredMiddleware[], clear?: boolean | undefined): import("./types.js").Wretch<unknown, unknown, undefined>;
    body(this: import("./types.js").Wretch<unknown, unknown, undefined>, contents: any): import("./types.js").Wretch<unknown, unknown, undefined>;
    json(this: import("./types.js").Wretch<unknown, unknown, undefined>, jsObject: object, contentType?: string | undefined): import("./types.js").Wretch<unknown, unknown, undefined>;
    fetch(this: import("./types.js").Wretch<unknown, unknown, undefined>, method?: string | undefined, url?: string | undefined, body?: any): import("./types.js").WretchResponseChain<unknown, unknown, undefined>;
    get(this: import("./types.js").Wretch<unknown, unknown, undefined>, url?: string | undefined): import("./types.js").WretchResponseChain<unknown, unknown, undefined>;
    delete(this: import("./types.js").Wretch<unknown, unknown, undefined>, url?: string | undefined): import("./types.js").WretchResponseChain<unknown, unknown, undefined>;
    put(this: import("./types.js").Wretch<unknown, unknown, undefined>, body?: any, url?: string | undefined): import("./types.js").WretchResponseChain<unknown, unknown, undefined>;
    post(this: import("./types.js").Wretch<unknown, unknown, undefined>, body?: any, url?: string | undefined): import("./types.js").WretchResponseChain<unknown, unknown, undefined>;
    patch(this: import("./types.js").Wretch<unknown, unknown, undefined>, body?: any, url?: string | undefined): import("./types.js").WretchResponseChain<unknown, unknown, undefined>;
    head(this: import("./types.js").Wretch<unknown, unknown, undefined>, url?: string | undefined): import("./types.js").WretchResponseChain<unknown, unknown, undefined>;
    opts(this: import("./types.js").Wretch<unknown, unknown, undefined>, url?: string | undefined): import("./types.js").WretchResponseChain<unknown, unknown, undefined>;
};
declare namespace factory {
    export { factory as default };
    export { setOptions as options };
    export { setErrorType as errorType };
    export { setPolyfills as polyfills };
    export { WretchError };
}
import { setOptions } from "./config.js";
import { setErrorType } from "./config.js";
import { setPolyfills } from "./config.js";
import { WretchError } from "./resolver.js";
//# sourceMappingURL=index.d.ts.map