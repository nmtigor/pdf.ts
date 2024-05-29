/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/text_layer_test.ts
 * @license Apache-2.0
 ******************************************************************************/

/* Copyright 2022 Mozilla Foundation
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

import { assertEquals, assertInstanceOf } from "@std/assert/mod.ts";
import { afterAll, beforeAll, describe, it } from "@std/testing/bdd.ts";
import type { TestServer } from "@pdf.ts-test/test_utils.ts";
import {
  buildGetDocumentParams,
  createTemporaryDenoServer,
} from "@pdf.ts-test/test_utils.ts";
import { getDocument } from "../display/api.ts";
import { renderTextLayer, TextLayerRenderTask } from "./text_layer.ts";
/*80--------------------------------------------------------------------------*/

describe("textLayer", () => {
  let tempServer: TestServer;

  beforeAll(() => {
    tempServer = createTemporaryDenoServer();
  });

  afterAll(() => {
    const { server } = tempServer;
    server.shutdown();
    tempServer = undefined as any;
  });

  // kkkk "document is not defined"
  it.ignore("creates textLayer from ReadableStream", async () => {
    // if (isNodeJS) {
    //   pending("document.createElement is not supported in Node.js.");
    // }
    const loadingTask = getDocument(
      buildGetDocumentParams(tempServer, "basicapi.pdf"),
    );
    const pdfDocument = await loadingTask.promise;
    const page = await pdfDocument.getPage(1);

    const textContentItemsStr: string[] = [];

    const textLayerRenderTask = renderTextLayer({
      textContentSource: page.streamTextContent(),
      container: document.createElement("div"),
      viewport: page.getViewport({ scale: 1 }),
      textContentItemsStr,
    });
    assertInstanceOf(textLayerRenderTask, TextLayerRenderTask);

    await textLayerRenderTask.promise;
    assertEquals(textContentItemsStr, [
      "Table Of Content",
      "",
      "Chapter 1",
      " ",
      "..........................................................",
      " ",
      "2",
      "",
      "Paragraph 1.1",
      " ",
      "......................................................",
      " ",
      "3",
      "",
      "page 1 / 3",
    ]);
  });
});
/*80--------------------------------------------------------------------------*/
