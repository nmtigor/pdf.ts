/*80****************************************************************************
 * promisecap
** ---------- */
let PromiseCap_ID = 0;
/**
 * Creates a promise capability object.
 *
 * ! Notice, this could be called in worker thread, where there is no e.g.
 * ! `Node` as in mv.ts.
 */
export function createPromiseCap() {
    const cap = Object.create(null);
    cap.id = ++PromiseCap_ID;
    let isSettled = false;
    Object.defineProperty(cap, "settled", {
        get() {
            return isSettled;
        },
    });
    cap.promise = new Promise((resolve, reject) => {
        cap.resolve = (data) => {
            isSettled = true;
            resolve(data);
        };
        cap.reject = (reason) => {
            isSettled = true;
            reject(reason);
        };
    });
    return cap;
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=promisecap.js.map