/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

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

import {
  assertEquals,
  assertInstanceOf,
} from "https://deno.land/std@0.195.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.195.0/testing/bdd.ts";
import { getDocument } from "../display/api.ts";
import { buildGetDocumentParams } from "../shared/test_utils.ts";
import { renderTextLayer, TextLayerRenderTask } from "./text_layer.ts";
/*80--------------------------------------------------------------------------*/

describe("textLayer", () => {
  // kkkk "ReferenceError: document is not defined"
  it.ignore("creates textLayer from ReadableStream", async () => {
    // if (isNodeJS) {
    //   pending("document.createElement is not supported in Node.js.");
    // }
    const loadingTask = getDocument(buildGetDocumentParams("basicapi.pdf"));
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
