/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2023
 *
 * @module pdf/pdf.ts-src/pdf.worker_test.ts
 * @license Apache-2.0
 ******************************************************************************/

/* Copyright 2023 Mozilla Foundation
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

import { assertEquals } from "@std/assert/mod.ts";
import { describe, it } from "@std/testing/bdd.ts";
import { LIB } from "../../global.ts";
import { WorkerMessageHandler } from "./core/worker.ts";
/*80--------------------------------------------------------------------------*/

describe("pdfworker_api", () => {
  it("checks that the *official* PDF.js-worker API exposes the expected functionality", async () => {
    // eslint-disable-next-line no-unsanitized/method
    const pdfworkerAPI = await import(
      /*#static*/ LIB ? "./pdf.worker.ts" : "./pdf.worker.ts"
    );

    // The imported Object contains an (automatically) inserted Symbol,
    // hence we copy the data to allow using a simple comparison below.
    assertEquals({ ...pdfworkerAPI }, { WorkerMessageHandler });
  });
});
/*80--------------------------------------------------------------------------*/
