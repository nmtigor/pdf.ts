export default progress;
/**
 * Adds the ability to monitor progress when downloading a response.
 *
 * _Compatible with all platforms implementing the [TransformStream WebAPI](https://developer.mozilla.org/en-US/docs/Web/API/TransformStream#browser_compatibility)._
 *
 * ```js
 * import ProgressAddon from "wretch/addons/progress"
 *
 * wretch("some_url")
 *   // Register the addon
 *   .addon(ProgressAddon())
 *   .get()
 *   // Log the progress as a percentage of completion
 *   .progress((loaded, total) => console.log(`${(loaded / total * 100).toFixed(0)}%`))
 * ```
 */
declare function progress(): {
    beforeRequest(wretch: any, _: any, state: any): any;
    resolver: {
        progress(onProgress: any): {
            progress(onProgress: any): any;
        };
    };
};
//# sourceMappingURL=progress.d.ts.map