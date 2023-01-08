/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2017 Mozilla Foundation
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

import { assertEquals } from "https://deno.land/std@0.165.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.165.0/testing/bdd.ts";
import { D_base } from "../../pdf.ts-web/app_options.ts";
import { AbortException } from "../shared/util.ts";
import { type DocumentInitP } from "./api.ts";
import {
  PDFNetworkStream,
  PDFNetworkStreamRangeRequestReader,
} from "./network.ts";
/*80--------------------------------------------------------------------------*/

describe("network", () => {
  // const pdf1 = new URL("../pdfs/tracemonkey.pdf", window.location).href;
  const pdf1 = new URL("tracemonkey.pdf", `${D_base}/res/pdf/test/pdfs/`).href;
  const pdf1Length = 1016315;

  it("read without stream and range", async () => {
    const stream = new PDFNetworkStream({
      url: pdf1,
      rangeChunkSize: 65536,
      disableStream: true,
      disableRange: true,
    } as DocumentInitP);

    //kkkk "XMLHttpRequest is not defined"
    // const fullReader = stream.getFullReader();

    // let isStreamingSupported, isRangeSupported;
    // const promise = fullReader.headersReady.then(() => {
    //   isStreamingSupported = fullReader.isStreamingSupported;
    //   isRangeSupported = fullReader.isRangeSupported;
    // });

    // let len = 0,
    //   count = 0;
    // const read = (): Promise<undefined> => {
    //   return fullReader.read().then(function (result) {
    //     if (result.done) {
    //       return undefined;
    //     }
    //     count++;
    //     len += result.value.byteLength;
    //     return read();
    //   });
    // };

    // await Promise.all([read(), promise]);

    // assertEquals(len, pdf1Length);
    // assertEquals(count, 1);
    // assertEquals(isStreamingSupported, false);
    // assertEquals(isRangeSupported, false);
  });

  it("read custom ranges", async () => {
    // We don't test on browsers that don't support range request, so
    // requiring this test to pass.
    const rangeSize = 32768;
    const stream = new PDFNetworkStream({
      url: pdf1,
      length: pdf1Length,
      rangeChunkSize: rangeSize,
      disableStream: true,
      disableRange: false,
    } as DocumentInitP);

    //kkkk "XMLHttpRequest is not defined"
    // const fullReader = stream.getFullReader();

    // let isStreamingSupported, isRangeSupported, fullReaderCancelled;
    // const promise = fullReader.headersReady.then(() => {
    //   isStreamingSupported = fullReader.isStreamingSupported;
    //   isRangeSupported = fullReader.isRangeSupported;
    //   // we shall be able to close the full reader without issues
    //   fullReader.cancel(new AbortException("Don't need fullReader."));
    //   fullReaderCancelled = true;
    // });

    // // Skipping fullReader results, requesting something from the PDF end.
    // const tailSize = pdf1Length % rangeSize || rangeSize;

    // const range1Reader = stream.getRangeReader(
    //   pdf1Length - tailSize - rangeSize,
    //   pdf1Length - tailSize,
    // );
    // const range2Reader = stream.getRangeReader(
    //   pdf1Length - tailSize,
    //   pdf1Length,
    // );

    // const result1 = { value: 0 },
    //   result2 = { value: 0 };
    // const read = (
    //   reader: PDFNetworkStreamRangeRequestReader,
    //   lenResult: { value: number },
    // ): Promise<undefined> => {
    //   return reader.read().then((result) => {
    //     if (result.done) {
    //       return undefined;
    //     }
    //     lenResult.value += result.value.byteLength;
    //     return read(reader, lenResult);
    //   });
    // };

    // await Promise.all([
    //   read(range1Reader, result1),
    //   read(range2Reader, result2),
    //   promise,
    // ]);

    // assertEquals(result1.value, rangeSize);
    // assertEquals(result2.value, tailSize);
    // assertEquals(isStreamingSupported, false);
    // assertEquals(isRangeSupported, true);
    // assertEquals(fullReaderCancelled, true);
  });
});
/*80--------------------------------------------------------------------------*/
