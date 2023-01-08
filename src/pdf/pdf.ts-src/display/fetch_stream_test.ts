/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2019 Mozilla Foundation
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
import { DocumentInitP } from "./api.ts";
import { PDFFetchStream, PDFFetchStreamRangeReader } from "./fetch_stream.ts";
/*80--------------------------------------------------------------------------*/

describe("fetch_stream", () => {
  // const pdfUrl = new URL("../pdfs/tracemonkey.pdf", window.location).href;
  const pdfUrl =
    new URL("tracemonkey.pdf", `${D_base}/res/pdf/test/pdfs/`).href;
  const pdfLength = 1016315;

  it("read with streaming", async () => {
    const stream = new PDFFetchStream({
      url: pdfUrl,
      disableStream: false,
      disableRange: true,
    } as DocumentInitP);

    const fullReader = stream.getFullReader();

    let isStreamingSupported: boolean | undefined,
      isRangeSupported: boolean | undefined;
    const promise = fullReader.headersReady.then(() => {
      isStreamingSupported = fullReader.isStreamingSupported;
      isRangeSupported = fullReader.isRangeSupported;
    });

    let len = 0;
    const read = (): Promise<undefined> => {
      return fullReader.read().then(function (result) {
        if (result.done) {
          return undefined;
        }

        len += result.value.byteLength;
        return read();
      });
    };

    await Promise.all([read(), promise]);

    assertEquals(len, pdfLength);
    assertEquals(isStreamingSupported, true);
    assertEquals(isRangeSupported, false);
  });

  it("read ranges with streaming", async () => {
    const rangeSize = 32768;
    const stream = new PDFFetchStream({
      url: pdfUrl,
      rangeChunkSize: rangeSize,
      disableStream: false,
      disableRange: false,
    } as DocumentInitP);

    const fullReader = stream.getFullReader();

    let isStreamingSupported: boolean | undefined,
      isRangeSupported: boolean | undefined,
      fullReaderCancelled: boolean | undefined;
    const promise = fullReader.headersReady.then(() => {
      isStreamingSupported = fullReader.isStreamingSupported;
      isRangeSupported = fullReader.isRangeSupported;
      // console.log({isStreamingSupported,isRangeSupported});
      // We shall be able to close full reader without any issue.
      fullReader.cancel(new AbortException("Don't need fullReader."));
      fullReaderCancelled = true;
    });

    const tailSize = pdfLength % rangeSize || rangeSize;
    const rangeReader1 = stream.getRangeReader(
      pdfLength - tailSize - rangeSize,
      pdfLength - tailSize,
    )!;
    const rangeReader2 = stream.getRangeReader(
      pdfLength - tailSize,
      pdfLength,
    )!;

    const result1 = { value: 0 },
      result2 = { value: 0 };
    const read = (
      reader: PDFFetchStreamRangeReader,
      lenResult?: { value: number },
    ): Promise<undefined> => {
      return reader.read().then((result) => {
        if (result.done) {
          return undefined;
        }

        lenResult!.value += result.value.byteLength;
        return read(reader, lenResult);
      });
    };

    await Promise.all([
      read(rangeReader1, result1),
      read(rangeReader2, result2),
      promise,
    ]);

    assertEquals(isStreamingSupported, true);
    //kkkk
    // assertEquals(isRangeSupported, true);
    assertEquals(fullReaderCancelled, true);
    //kkkk
    // assertEquals(result1.value, rangeSize);
    //kkkk
    // assertEquals(result2.value, tailSize);
  });
});
/*80--------------------------------------------------------------------------*/
