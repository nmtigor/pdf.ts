/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/worker_options.ts
 * @license Apache-2.0
 ******************************************************************************/
export declare class GlobalWorkerOptions {
    #private;
    static get workerPort(): Worker | undefined;
    /**
     * @param val Defines global port for worker process.
     *   Overrides the `workerSrc` option.
     */
    static set workerPort(val: Worker | undefined);
    static get workerSrc(): string;
    /**
     * @param val A string containing the path and filename of
     *   the worker file.
     *
     *   NOTE: The `workerSrc` option should always be set, in order to prevent
     *         any issues when using the PDF.js library.
     */
    static set workerSrc(val: string);
}
//# sourceMappingURL=worker_options.d.ts.map