/** 80**************************************************************************
 * Ref. [pdf.js]/src/shared/util.js
 *
 * @module lib/util/PromiseCap
 * @license Apache-2.0
 ******************************************************************************/

import { PDFJSDev, TESTING } from "../../global.ts";
import { assert } from "./trace.ts";
/*80--------------------------------------------------------------------------*/

export class PromiseCap<T = void> {
  /**
   * The Promise object.
   */
  readonly promise: Promise<T>;

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
  resolve!: (data: T) => void;

  /**
   * Rejects the Promise.
   */
  reject!: (reason: any) => void;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = (data) => {
        this.#settled = true;
        resolve(data);
      };

      this.reject = (reason) => {
        /*#static*/ if (PDFJSDev || TESTING) {
          assert(reason instanceof Error, 'Expected valid "reason" argument.');
        }
        this.#settled = true;
        reject(reason);
      };
    });
  }
}
/*80--------------------------------------------------------------------------*/
