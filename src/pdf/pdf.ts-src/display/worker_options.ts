/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

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

import { D_base } from "../../alias.ts";
/*80--------------------------------------------------------------------------*/

interface GlobalWorkerOptionsType {
  /**
   * Defines global port for worker process. Overrides the `workerSrc` option.
   */
  workerPort?: Worker | undefined;

  /**
   * A string containing the path and filename of the worker file.
   *
   *   NOTE: The `workerSrc` option should always be set, in order to prevent any
   *         issues when using the PDF.js library.
   */
  workerSrc: string;
}

export const GlobalWorkerOptions: GlobalWorkerOptionsType = Object.create(null);

GlobalWorkerOptions.workerSrc = `${D_base}/gen/pdf/pdf.ts-src/pdf.worker.js`;
/*80--------------------------------------------------------------------------*/
