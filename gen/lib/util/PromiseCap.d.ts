/** 80**************************************************************************
 * Ref. [[pdf.js]/src/shared/util.js](https://github.com/mozilla/pdf.js/blob/master/src/shared/util.js)
 *
 * @module lib/util/PromiseCap
 * @license Apache-2.0
 ******************************************************************************/
export declare class PromiseCap<T = void> {
    #private;
    /**
     * The Promise object.
     */
    readonly promise: Promise<T>;
    /**
     * If the Promise has been fulfilled/rejected.
     */
    get settled(): boolean;
    /**
     * Fulfills the Promise.
     */
    resolve: (data: T) => void;
    /**
     * Rejects the Promise.
     */
    reject: (reason: any) => void;
    constructor();
}
//# sourceMappingURL=PromiseCap.d.ts.map