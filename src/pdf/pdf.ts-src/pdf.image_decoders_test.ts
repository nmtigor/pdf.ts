/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2024
 *
 * @module pdf/pdf.ts-src/pdf.image_decoders_test.ts
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

import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { Jbig2Error, Jbig2Image } from "./core/jbig2.ts";
import { JpegError, JpegImage } from "./core/jpg.ts";
import { JpxError, JpxImage } from "./core/jpx.ts";
import {
  getVerbosityLevel,
  setVerbosityLevel,
  VerbosityLevel,
} from "./shared/util.ts";
import { LIB } from "@fe-src/global.ts";
/*80--------------------------------------------------------------------------*/

describe("pdfimage_api", () => {
  it("checks that the *official* PDF.js-image decoders API exposes the expected functionality", async () => {
    // eslint-disable-next-line no-unsanitized/method
    const pdfimageAPI = await import(
      // LIB ? "../../pdf.image_decoders.js" : "../../src/pdf.image_decoders.js"
      LIB ? "./pdf.image_decoders.ts" : "./pdf.image_decoders.ts"
    );

    // The imported Object contains an (automatically) inserted Symbol,
    // hence we copy the data to allow using a simple comparison below.
    assertEquals({ ...pdfimageAPI }, {
      getVerbosityLevel,
      Jbig2Error,
      Jbig2Image,
      JpegError,
      JpegImage,
      JpxError,
      JpxImage,
      setVerbosityLevel,
      VerbosityLevel,
    });
  });
});
/*80--------------------------------------------------------------------------*/
