export default abort;
/**
 * Adds the ability to abort requests using AbortController and signals under the hood.
 *
 * _Only compatible with browsers that support
 * [AbortControllers](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).
 * Otherwise, you could use a (partial)
 * [polyfill](https://www.npmjs.com/package/abortcontroller-polyfill)._
 *
 * ```js
 * import AbortAddon from "wretch/addons/abort"
 *
 * const [c, w] = wretch("...")
 *   .addon(AbortAddon())
 *   .get()
 *   .onAbort((_) => console.log("Aborted !"))
 *   .controller();
 *
 * w.text((_) => console.log("should never be called"));
 * c.abort();
 *
 * // Or :
 *
 * const controller = new AbortController();
 *
 * wretch("...")
 *   .addon(AbortAddon())
 *   .signal(controller)
 *   .get()
 *   .onAbort((_) => console.log("Aborted !"))
 *   .text((_) => console.log("should never be called"));
 *
 * controller.abort();
 * ```
 */
declare function abort(): {
    beforeRequest(wretch: any, options: any, state: any): any;
    wretch: {
        signal(controller: any): any;
    };
    resolver: {
        setTimeout(time: any, controller?: any): {
            setTimeout(time: any, controller?: any): any;
            controller(): any;
            onAbort(cb: any): any;
        };
        controller(): any;
        onAbort(cb: any): any;
    };
};
//# sourceMappingURL=abort.d.ts.map