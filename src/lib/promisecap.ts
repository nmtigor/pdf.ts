/*80****************************************************************************
 * promisecap
** ---------- */

/*
Ref. `createPromiseCapability()` in
https://github.com/mozilla/pdf.js/blob/master/src/shared/util.js
**/
/*80--------------------------------------------------------------------------*/

/**
 * Promise Capability object.
 */
export interface PromiseCap<T = void> {
  id: number;

  /**
   * A Promise object.
   */
  promise: Promise<T>;

  /**
   * If the Promise has been fulfilled/rejected.
   */
  settled: boolean;

  /**
   * Fulfills the Promise.
   */
  resolve: (data: T) => void;

  /**
   * Rejects the Promise.
   */
  reject: (reason: any) => void;
}
let PromiseCap_ID = 0;

/**
 * Creates a promise capability object.
 *
 * ! Notice, this could be called in worker thread, where there is no e.g.
 * ! `Node` as in mv.ts.
 */
export function createPromiseCap<T = void>(): PromiseCap<T> {
  const cap: PromiseCap<T> = Object.create(null);
  cap.id = ++PromiseCap_ID;
  let isSettled = false;

  Object.defineProperty(cap, "settled", {
    get() {
      return isSettled;
    },
  });
  cap.promise = new Promise<T>((resolve, reject) => {
    cap.resolve = (data: T) => {
      isSettled = true;
      resolve(data);
    };
    cap.reject = (reason: any) => {
      isSettled = true;
      reject(reason);
    };
  });
  return cap;
}
/*80--------------------------------------------------------------------------*/
