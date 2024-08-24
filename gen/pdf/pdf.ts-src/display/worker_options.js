/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/worker_options.ts
 * @license Apache-2.0
 ******************************************************************************/
import { AD_gh } from "../../alias.js";
/*80--------------------------------------------------------------------------*/
export class GlobalWorkerOptions {
    static #port = null;
    static get workerPort() {
        return this.#port;
    }
    /**
     * @param val Defines global port for worker process.
     *   Overrides the `workerSrc` option.
     */
    static set workerPort(val) {
        if (!(typeof Worker !== "undefined" && val instanceof Worker) &&
            val !== null) {
            // console.log(`%crun here: ${val}`, `color:${LOG_cssc.runhere}`);
            throw new Error("Invalid `workerPort` type.");
        }
        this.#port = val;
    }
    static #src = "";
    static get workerSrc() {
        return this.#src;
    }
    /**
     * @param val A string containing the path and filename of
     *   the worker file.
     *
     *   NOTE: The `workerSrc` option should always be set, in order to prevent
     *         any issues when using the PDF.js library.
     */
    static set workerSrc(val) {
        if (typeof val !== "string") {
            throw new Error("Invalid `workerSrc` type.");
        }
        this.#src = val;
    }
}
GlobalWorkerOptions.workerSrc = `${AD_gh}/gen/pdf/pdf.ts-src/pdf.worker.js`;
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=worker_options.js.map