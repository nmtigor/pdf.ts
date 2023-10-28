/** 80**************************************************************************
 * Ref. [[pdf.js]/src/shared/util.js](https://github.com/mozilla/pdf.js/blob/master/src/shared/util.js)
 *
 * @module lib/util/PromiseCap
 * @license Apache-2.0
 ******************************************************************************/
import { TESTING } from "../../global.js";
import { assert } from "./trace.js";
/*80--------------------------------------------------------------------------*/
export class PromiseCap {
    /**
     * The Promise object.
     */
    promise;
    #settled = false;
    /**
     * If the Promise has been fulfilled/rejected.
     */
    get settled() {
        return this.#settled;
    }
    /**
     * Fulfills the Promise.
     */
    resolve;
    /**
     * Rejects the Promise.
     */
    reject;
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = (data) => {
                this.#settled = true;
                resolve(data);
            };
            this.reject = (reason) => {
                /*#static*/ 
                this.#settled = true;
                reject(reason);
            };
        });
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=PromiseCap.js.map