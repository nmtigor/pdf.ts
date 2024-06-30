/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/fetch_stream_test.ts
 * @license Apache-2.0
 ******************************************************************************/

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

import { assertEquals } from "@std/assert";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd.ts";
import type { TestServer } from "@fe-pdf.ts-test/test_utils.ts";
import { createTemporaryDenoServer } from "@fe-pdf.ts-test/test_utils.ts";
import { AbortException } from "../shared/util.ts";
import { DocumentInitP } from "./api.ts";
import { PDFFetchStream, PDFFetchStreamRangeReader } from "./fetch_stream.ts";
import { D_rp_pdfs } from "@fe-src/alias.ts";
/*80--------------------------------------------------------------------------*/

describe("fetch_stream", () => {
  let tempServer: TestServer;

  function getPdfUrl() {
    // return isNodeJS
    //   ? `http://127.0.0.1:${tempServer.port}/tracemonkey.pdf`
    //   : new URL("../pdfs/tracemonkey.pdf", window.location).href;
    return `http://${tempServer.hostname}:${tempServer.port}/${D_rp_pdfs}/tracemonkey.pdf`;
  }
  const pdfLength = 1016315;

  beforeAll(() => {
    // if (isNodeJS) {
    tempServer = createTemporaryDenoServer();
    // }
  });

  afterAll(async () => {
    // if (isNodeJS) {
    /* Close the server from accepting new connections after all test
    finishes. */
    const { server } = tempServer;
    await server.shutdown();
    tempServer = undefined as any;
    // }
  });

  it("read with streaming", async () => {
    const stream = new PDFFetchStream({
      url: getPdfUrl(),
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
      return fullReader.read().then((result) => {
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
      url: getPdfUrl(),
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
    assertEquals(isRangeSupported, true);
    assertEquals(fullReaderCancelled, true);
    assertEquals(result1.value, rangeSize);
    assertEquals(result2.value, tailSize);
  });
});
/*80--------------------------------------------------------------------------*/
