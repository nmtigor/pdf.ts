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
/* globals __non_webpack_require__ */

import {
  assert,
  assertEquals,
  assertMatch,
  assertThrows,
} from "https://deno.land/std@0.190.0/testing/asserts.ts";
import {
  afterAll,
  beforeAll,
  describe,
  it,
} from "https://deno.land/std@0.190.0/testing/bdd.ts";
import { ImgData } from "../core/evaluator.ts";
import { buildGetDocumentParams } from "../shared/test_utils.ts";
import { getDocument, PDFDocumentLoadingTask, PDFPageProxy } from "./api.ts";
import { SVGGraphics } from "./svg.ts";
/*80--------------------------------------------------------------------------*/

const XLINK_NS = "http://www.w3.org/1999/xlink";

// withZlib(true, callback); = run test with require('zlib') if possible.
// withZlib(false, callback); = run test without require('zlib').deflateSync.
// The return value of callback is returned as-is.
function withZlib(isZlibRequired: boolean, callback: () => Promise<Element>) {
  if (isZlibRequired) {
    // We could try to polyfill zlib in the browser, e.g. using pako.
    // For now, only support zlib functionality on Node.js
    // if (!isNodeJS) {
    throw new Error("zlib test can only be run in Node.js");
    // }

    return callback();
  }

  // if (!isNodeJS) {
  // Assume that require('zlib') is unavailable in non-Node.
  return callback();
  // }

  // const zlib = __non_webpack_require__("zlib");
  // const deflateSync = zlib.deflateSync;
  // zlib.deflateSync = disabledDeflateSync;
  // function disabledDeflateSync() {
  //   throw new Error("zlib.deflateSync is explicitly disabled for testing.");
  // }
  // function restoreDeflateSync() {
  //   if (zlib.deflateSync === disabledDeflateSync) {
  //     zlib.deflateSync = deflateSync;
  //   }
  // }
  // const promise = callback();
  // promise.then(restoreDeflateSync, restoreDeflateSync);
  // return promise;
}

describe("SVGGraphics", () => {
  let loadingTask: PDFDocumentLoadingTask;
  let page: PDFPageProxy;

  beforeAll(async () => {
    loadingTask = getDocument(
      buildGetDocumentParams("xobject-image.pdf", {
        isOffscreenCanvasSupported: false,
      }),
    );
    const doc = await loadingTask.promise;
    page = await doc.getPage(1);
  });

  afterAll(async () => {
    await loadingTask.destroy();
  });

  describe("paintImageXObject", () => {
    function getSVGImage() {
      let svgGfx: SVGGraphics;
      return page
        .getOperatorList()
        .then((opList) => {
          const forceDataSchema = true;
          svgGfx = new SVGGraphics(page.commonObjs, page.objs, forceDataSchema);
          return svgGfx.loadDependencies(opList);
        })
        .then(() => {
          let svgImg!: Element;
          // A mock to steal the svg:image element from paintInlineImageXObject.
          const elementContainer = {
            append(...elements) {
              svgImg = elements.at(-1) as Element;
            },
          } as SVGMaskElement;

          // This points to the XObject image in xobject-image.pdf.
          const xobjectObjId = "img_p0_1";
          // if (isNodeJS) {
          //   const { setStubs } = __non_webpack_require__(
          //     "../../examples/node/domstubs.js",
          //   );
          //   setStubs(global);
          // }
          try {
            const imgData = svgGfx.objs.get(xobjectObjId) as ImgData;
            //kkkk "ReferenceError: document is not defined"
            // svgGfx[OPS.paintInlineImageXObject](imgData, elementContainer);
          } finally {
            // if (isNodeJS) {
            //   const { unsetStubs } = __non_webpack_require__(
            //     "../../examples/node/domstubs.js",
            //   );
            //   unsetStubs(global);
            // }
          }
          return svgImg;
        });
    }

    it('should fail require("zlib") unless in Node.js', () => {
      function testFunc() {
        // __non_webpack_require__("zlib");
        throw undefined;
      }
      // if (isNodeJS) {
      //   // Verifies that the script loader replaces __non_webpack_require__ with
      //   // require.
      //   assertMatch(testFunc.toString(), /\srequire\(["']zlib["']\)/);
      //   // expect(testFunc).not.toThrow();
      // } else {
      // require not defined, require('zlib') not a module, etc.
      assertThrows(testFunc);
      // }
    });

    //kkkk "Error: zlib test can only be run in Node.js"
    it.ignore("should produce a reasonably small svg:image", async () => {
      // if (!isNodeJS) {
      //   pending("zlib.deflateSync is not supported in non-Node environments.");
      // }
      const svgImg = await withZlib(true, getSVGImage);
      assertEquals(svgImg.nodeName, "svg:image");
      assertEquals(svgImg.getAttributeNS(null, "width"), "200px");
      assertEquals(svgImg.getAttributeNS(null, "height"), "100px");
      const imgUrl = svgImg.getAttributeNS(XLINK_NS, "href")!;
      // forceDataSchema = true, so the generated URL should be a data:-URL.
      assertMatch(imgUrl, /^data:image\/png;base64,/);
      // Test whether the generated image has a reasonable file size.
      // I obtained a data URL of size 366 with Node 8.1.3 and zlib 1.2.11.
      // Without zlib (uncompressed), the size of the data URL was excessive
      // (80246).
      assert(imgUrl.length < 367);
    });

    //kkkk "TypeError: Cannot read properties of undefined (reading 'nodeName')"
    it.ignore("should be able to produce a svg:image without zlib", async () => {
      const svgImg = await withZlib(false, getSVGImage);
      assertEquals(svgImg.nodeName, "svg:image");
      assertEquals(svgImg.getAttributeNS(null, "width"), "200px");
      assertEquals(svgImg.getAttributeNS(null, "height"), "100px");
      const imgUrl = svgImg.getAttributeNS(XLINK_NS, "href")!;
      assertMatch(imgUrl, /^data:image\/png;base64,/);
      // The size of our naively generated PNG file is excessive :(
      assertEquals(imgUrl.length, 80246);
    });
  });
});
/*80--------------------------------------------------------------------------*/
