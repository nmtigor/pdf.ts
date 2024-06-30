/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/worker_options.ts
 * @license Apache-2.0
 ******************************************************************************/

/* Copyright 2018 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { AD_gh } from "@fe-src/pdf/alias.ts";
/*80--------------------------------------------------------------------------*/

export class GlobalWorkerOptions {
  static #port: Worker | undefined;
  static get workerPort(): Worker | undefined {
    return this.#port;
  }
  /**
   * @param val Defines global port for worker process.
   *   Overrides the `workerSrc` option.
   */
  static set workerPort(val: Worker | undefined) {
    if (
      !(typeof Worker !== "undefined" && val instanceof Worker) &&
      val !== undefined
    ) {
      throw new Error("Invalid `workerPort` type.");
    }
    this.#port = val;
  }

  static #src = "";
  static get workerSrc(): string {
    return this.#src;
  }

  /**
   * @param val A string containing the path and filename of
   *   the worker file.
   *
   *   NOTE: The `workerSrc` option should always be set, in order to prevent
   *         any issues when using the PDF.js library.
   */
  static set workerSrc(val: string) {
    if (typeof val !== "string") {
      throw new Error("Invalid `workerSrc` type.");
    }
    this.#src = val;
  }
}

GlobalWorkerOptions.workerSrc = `${AD_gh}/gen/pdf/pdf.ts-src/pdf.worker.js`;
/*80--------------------------------------------------------------------------*/
