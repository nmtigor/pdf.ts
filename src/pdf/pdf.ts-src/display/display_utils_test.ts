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

import {
  assert,
  assertEquals,
  assertFalse,
  assertInstanceOf,
  assertMatch,
  assertNotEquals,
  assertNotMatch,
  assertStrictEquals,
  assertThrows,
  fail,
} from "https://deno.land/std@0.170.0/testing/asserts.ts";
import {
  afterAll,
  beforeAll,
  describe,
  it,
} from "https://deno.land/std@0.170.0/testing/bdd.ts";
import { DENO } from "../../../global.ts";
import { bytesToString } from "../shared/util.ts";
import {
  DOMCanvasFactory,
  DOMSVGFactory,
  getFilenameFromUrl,
  getPdfFilenameFromUrl,
  isValidFetchUrl,
  PDFDateString,
} from "./display_utils.ts";
/*80--------------------------------------------------------------------------*/

describe("display_utils", () => {
  describe("DOMCanvasFactory", () => {
    let canvasFactory: DOMCanvasFactory;

    beforeAll(() => {
      canvasFactory = new DOMCanvasFactory();
    });

    afterAll(() => {
      canvasFactory = undefined as any;
    });

    it("`create` should throw an error if the dimensions are invalid", () => {
      // Invalid width.
      assertThrows(
        () => {
          return canvasFactory.create(-1, 1);
        },
        Error,
        "Invalid canvas size",
      );

      // Invalid height.
      assertThrows(
        () => {
          return canvasFactory.create(1, -1);
        },
        Error,
        "Invalid canvas size",
      );
    });

    //kkkk "ReferenceError: document is not defined"
    it.ignore("`create` should return a canvas if the dimensions are valid", () => {
      // if (isNodeJS) {
      //   pending("Document is not supported in Node.js.");
      // }

      const { canvas, context } = canvasFactory.create(20, 40);
      assertInstanceOf(canvas, HTMLCanvasElement);
      assertInstanceOf(context, CanvasRenderingContext2D);
      assertEquals(canvas.width, 20);
      assertEquals(canvas.height, 40);
    });

    it("`reset` should throw an error if no canvas is provided", () => {
      const canvasAndContext = { canvas: null, context: null };

      assertThrows(
        () => {
          return canvasFactory.reset(canvasAndContext as any, 20, 40);
        },
        Error,
        "Canvas is not specified",
      );
    });

    it("`reset` should throw an error if the dimensions are invalid", () => {
      const canvasAndContext = { canvas: "foo", context: "bar" };

      // Invalid width.
      assertThrows(
        () => {
          return canvasFactory.reset(canvasAndContext as any, -1, 1);
        },
        Error,
        "Invalid canvas size",
      );

      // Invalid height.
      assertThrows(
        () => {
          return canvasFactory.reset(canvasAndContext as any, 1, -1);
        },
        Error,
        "Invalid canvas size",
      );
    });

    //kkkk "ReferenceError: document is not defined"
    it.ignore("`reset` should alter the canvas/context if the dimensions are valid", () => {
      // if (isNodeJS) {
      //   pending("Document is not supported in Node.js.");
      // }

      const canvasAndContext = canvasFactory.create(20, 40);
      canvasFactory.reset(canvasAndContext, 60, 80);

      const { canvas, context } = canvasAndContext;
      assertInstanceOf(canvas, HTMLCanvasElement);
      assertInstanceOf(context, CanvasRenderingContext2D);
      assertEquals(canvas.width, 60);
      assertEquals(canvas.height, 80);
    });

    it("`destroy` should throw an error if no canvas is provided", () => {
      assertThrows(
        () => {
          return canvasFactory.destroy({} as any);
        },
        Error,
        "Canvas is not specified",
      );
    });

    //kkkk "ReferenceError: document is not defined"
    it.ignore("`destroy` should clear the canvas/context", () => {
      // if (isNodeJS) {
      //   pending("Document is not supported in Node.js.");
      // }

      const canvasAndContext = canvasFactory.create(20, 40);
      canvasFactory.destroy(canvasAndContext);

      const { canvas, context } = canvasAndContext;
      assertEquals(canvas, undefined);
      assertEquals(context, undefined);
    });
  });

  describe("DOMSVGFactory", () => {
    let svgFactory: DOMSVGFactory;

    beforeAll(() => {
      svgFactory = new DOMSVGFactory();
    });

    afterAll(() => {
      svgFactory = undefined as any;
    });

    it("`create` should throw an error if the dimensions are invalid", () => {
      // Invalid width.
      assertThrows(
        () => {
          return svgFactory.create(-1, 0);
        },
        Error,
        "Invalid SVG dimensions",
      );

      // Invalid height.
      assertThrows(
        () => {
          return svgFactory.create(0, -1);
        },
        Error,
        "Invalid SVG dimensions",
      );
    });

    //kkkk "ReferenceError: document is not defined"
    it.ignore("`create` should return an SVG element if the dimensions are valid", () => {
      // if (isNodeJS) {
      //   pending("Document is not supported in Node.js.");
      // }

      const svg = svgFactory.create(20, 40);
      assertInstanceOf(svg, SVGSVGElement);
      assertEquals(svg.getAttribute("version"), "1.1");
      assertEquals(svg.getAttribute("width"), "20px");
      assertEquals(svg.getAttribute("height"), "40px");
      assertEquals(svg.getAttribute("preserveAspectRatio"), "none");
      assertEquals(svg.getAttribute("viewBox"), "0 0 20 40");
    });

    it("`createElement` should throw an error if the type is not a string", () => {
      assertThrows(
        () => {
          return svgFactory.createElement(true as any);
        },
        Error,
        "Invalid SVG element type",
      );
    });

    //kkkk "ReferenceError: document is not defined"
    it.ignore("`createElement` should return an SVG element if the type is valid", () => {
      // if (isNodeJS) {
      //   pending("Document is not supported in Node.js.");
      // }

      const svg = svgFactory.createElement("svg:rect");
      assertInstanceOf(svg, SVGRectElement);
    });
  });

  describe("getFilenameFromUrl", () => {
    it("should get the filename from an absolute URL", () => {
      const url = "https://server.org/filename.pdf";
      assertEquals(getFilenameFromUrl(url), "filename.pdf");
    });

    it("should get the filename from a relative URL", () => {
      const url = "../../filename.pdf";
      assertEquals(getFilenameFromUrl(url), "filename.pdf");
    });

    it("should get the filename from a URL with an anchor", () => {
      const url = "https://server.org/filename.pdf#foo";
      assertEquals(getFilenameFromUrl(url), "filename.pdf");
    });

    it("should get the filename from a URL with query parameters", () => {
      const url = "https://server.org/filename.pdf?foo=bar";
      assertEquals(getFilenameFromUrl(url), "filename.pdf");
    });

    it("should get the filename from a relative URL, keeping the anchor", () => {
      const url = "../../part1#part2.pdf";
      assertEquals(
        getFilenameFromUrl(url, /* onlyStripPath = */ true),
        "part1#part2.pdf",
      );
    });
  });

  describe("getPdfFilenameFromUrl", () => {
    it("gets PDF filename", () => {
      // Relative URL
      assertEquals(getPdfFilenameFromUrl("/pdfs/file1.pdf"), "file1.pdf");
      // Absolute URL
      assertEquals(
        getPdfFilenameFromUrl("http://www.example.com/pdfs/file2.pdf"),
        "file2.pdf",
      );
    });

    it("gets fallback filename", () => {
      // Relative URL
      assertEquals(getPdfFilenameFromUrl("/pdfs/file1.txt"), "document.pdf");
      // Absolute URL
      assertEquals(
        getPdfFilenameFromUrl("http://www.example.com/pdfs/file2.txt"),
        "document.pdf",
      );
    });

    it("gets custom fallback filename", () => {
      // Relative URL
      assertEquals(
        getPdfFilenameFromUrl("/pdfs/file1.txt", "qwerty1.pdf"),
        "qwerty1.pdf",
      );
      // Absolute URL
      assertEquals(
        getPdfFilenameFromUrl(
          "http://www.example.com/pdfs/file2.txt",
          "qwerty2.pdf",
        ),
        "qwerty2.pdf",
      );

      // An empty string should be a valid custom fallback filename.
      assertEquals(getPdfFilenameFromUrl("/pdfs/file3.txt", ""), "");
    });

    it("gets fallback filename when url is not a string", () => {
      assertEquals(getPdfFilenameFromUrl(null), "document.pdf");

      assertEquals(getPdfFilenameFromUrl(null, "file.pdf"), "file.pdf");
    });

    it("gets PDF filename from URL containing leading/trailing whitespace", () => {
      // Relative URL
      assertEquals(getPdfFilenameFromUrl("   /pdfs/file1.pdf   "), "file1.pdf");
      // Absolute URL
      assertEquals(
        getPdfFilenameFromUrl("   http://www.example.com/pdfs/file2.pdf   "),
        "file2.pdf",
      );
    });

    it("gets PDF filename from query string", () => {
      // Relative URL
      assertEquals(
        getPdfFilenameFromUrl("/pdfs/pdfs.html?name=file1.pdf"),
        "file1.pdf",
      );
      // Absolute URL
      assertEquals(
        getPdfFilenameFromUrl("http://www.example.com/pdfs/pdf.html?file2.pdf"),
        "file2.pdf",
      );
    });

    it("gets PDF filename from hash string", () => {
      // Relative URL
      assertEquals(
        getPdfFilenameFromUrl("/pdfs/pdfs.html#name=file1.pdf"),
        "file1.pdf",
      );
      // Absolute URL
      assertEquals(
        getPdfFilenameFromUrl("http://www.example.com/pdfs/pdf.html#file2.pdf"),
        "file2.pdf",
      );
    });

    it("gets correct PDF filename when multiple ones are present", () => {
      // Relative URL
      assertEquals(
        getPdfFilenameFromUrl("/pdfs/file1.pdf?name=file.pdf"),
        "file1.pdf",
      );
      // Absolute URL
      assertEquals(
        getPdfFilenameFromUrl("http://www.example.com/pdfs/file2.pdf#file.pdf"),
        "file2.pdf",
      );
    });

    it("gets PDF filename from URI-encoded data", () => {
      const encodedUrl = encodeURIComponent(
        "http://www.example.com/pdfs/file1.pdf",
      );
      assertEquals(getPdfFilenameFromUrl(encodedUrl), "file1.pdf");

      const encodedUrlWithQuery = encodeURIComponent(
        "http://www.example.com/pdfs/file.txt?file2.pdf",
      );
      assertEquals(getPdfFilenameFromUrl(encodedUrlWithQuery), "file2.pdf");
    });

    it("gets PDF filename from data mistaken for URI-encoded", () => {
      assertEquals(getPdfFilenameFromUrl("/pdfs/%AA.pdf"), "%AA.pdf");

      assertEquals(getPdfFilenameFromUrl("/pdfs/%2F.pdf"), "%2F.pdf");
    });

    it("gets PDF filename from (some) standard protocols", () => {
      // HTTP
      assertEquals(
        getPdfFilenameFromUrl("http://www.example.com/file1.pdf"),
        "file1.pdf",
      );
      // HTTPS
      assertEquals(
        getPdfFilenameFromUrl("https://www.example.com/file2.pdf"),
        "file2.pdf",
      );
      // File
      assertEquals(
        getPdfFilenameFromUrl("file:///path/to/files/file3.pdf"),
        "file3.pdf",
      );
      // FTP
      assertEquals(
        getPdfFilenameFromUrl("ftp://www.example.com/file4.pdf"),
        "file4.pdf",
      );
    });

    it('gets PDF filename from query string appended to "blob:" URL', () => {
      // if (isNodeJS) {
      //   pending("Blob in not supported in Node.js.");
      // }
      const typedArray = new Uint8Array([1, 2, 3, 4, 5]);
      const blobUrl = URL.createObjectURL(
        new Blob([typedArray], { type: "application/pdf" }),
      );
      // Sanity check to ensure that a "blob:" URL was returned.
      assert(blobUrl.startsWith("blob:"));

      assertEquals(getPdfFilenameFromUrl(blobUrl + "?file.pdf"), "file.pdf");
    });

    it('gets fallback filename from query string appended to "data:" URL', () => {
      const typedArray = new Uint8Array([1, 2, 3, 4, 5]),
        str = bytesToString(typedArray);
      const dataUrl = `data:application/pdf;base64,${btoa(str)}`;
      // Sanity check to ensure that a "data:" URL was returned.
      assert(dataUrl.startsWith("data:"));

      assertEquals(
        getPdfFilenameFromUrl(dataUrl + "?file1.pdf"),
        "document.pdf",
      );

      // Should correctly detect a "data:" URL with leading whitespace.
      assertEquals(
        getPdfFilenameFromUrl("     " + dataUrl + "?file2.pdf"),
        "document.pdf",
      );
    });
  });

  describe("isValidFetchUrl", () => {
    it("handles invalid Fetch URLs", () => {
      assertEquals(isValidFetchUrl(null as any), false);
      assertEquals(isValidFetchUrl(100 as any), false);
      assertEquals(isValidFetchUrl("foo"), false);
      assertEquals(isValidFetchUrl("/foo", 100 as any), false);
    });

    it("handles relative Fetch URLs", () => {
      assertEquals(isValidFetchUrl("/foo", "file://www.example.com"), false);
      assertEquals(isValidFetchUrl("/foo", "http://www.example.com"), true);
    });

    it("handles unsupported Fetch protocols", () => {
      assertEquals(isValidFetchUrl("file://www.example.com"), false);
      assertEquals(isValidFetchUrl("ftp://www.example.com"), false);
    });

    it("handles supported Fetch protocols", () => {
      assertEquals(isValidFetchUrl("http://www.example.com"), true);
      assertEquals(isValidFetchUrl("https://www.example.com"), true);
    });
  });

  describe("PDFDateString", () => {
    describe("toDateObject", () => {
      it("converts PDF date strings to JavaScript `Date` objects", () => {
        const expectations = {
          undefined: null,
          null: null,
          42: null,
          2019: null,
          D2019: null,
          "D:": null,
          "D:201": null,
          "D:2019": new Date(Date.UTC(2019, 0, 1, 0, 0, 0)),
          "D:20190": new Date(Date.UTC(2019, 0, 1, 0, 0, 0)),
          "D:201900": new Date(Date.UTC(2019, 0, 1, 0, 0, 0)),
          "D:201913": new Date(Date.UTC(2019, 0, 1, 0, 0, 0)),
          "D:201902": new Date(Date.UTC(2019, 1, 1, 0, 0, 0)),
          "D:2019020": new Date(Date.UTC(2019, 1, 1, 0, 0, 0)),
          "D:20190200": new Date(Date.UTC(2019, 1, 1, 0, 0, 0)),
          "D:20190232": new Date(Date.UTC(2019, 1, 1, 0, 0, 0)),
          "D:20190203": new Date(Date.UTC(2019, 1, 3, 0, 0, 0)),
          // Invalid dates like the 31th of April are handled by JavaScript:
          "D:20190431": new Date(Date.UTC(2019, 4, 1, 0, 0, 0)),
          "D:201902030": new Date(Date.UTC(2019, 1, 3, 0, 0, 0)),
          "D:2019020300": new Date(Date.UTC(2019, 1, 3, 0, 0, 0)),
          "D:2019020324": new Date(Date.UTC(2019, 1, 3, 0, 0, 0)),
          "D:2019020304": new Date(Date.UTC(2019, 1, 3, 4, 0, 0)),
          "D:20190203040": new Date(Date.UTC(2019, 1, 3, 4, 0, 0)),
          "D:201902030400": new Date(Date.UTC(2019, 1, 3, 4, 0, 0)),
          "D:201902030460": new Date(Date.UTC(2019, 1, 3, 4, 0, 0)),
          "D:201902030405": new Date(Date.UTC(2019, 1, 3, 4, 5, 0)),
          "D:2019020304050": new Date(Date.UTC(2019, 1, 3, 4, 5, 0)),
          "D:20190203040500": new Date(Date.UTC(2019, 1, 3, 4, 5, 0)),
          "D:20190203040560": new Date(Date.UTC(2019, 1, 3, 4, 5, 0)),
          "D:20190203040506": new Date(Date.UTC(2019, 1, 3, 4, 5, 6)),
          "D:20190203040506F": new Date(Date.UTC(2019, 1, 3, 4, 5, 6)),
          "D:20190203040506Z": new Date(Date.UTC(2019, 1, 3, 4, 5, 6)),
          "D:20190203040506-": new Date(Date.UTC(2019, 1, 3, 4, 5, 6)),
          "D:20190203040506+": new Date(Date.UTC(2019, 1, 3, 4, 5, 6)),
          "D:20190203040506+'": new Date(Date.UTC(2019, 1, 3, 4, 5, 6)),
          "D:20190203040506+0": new Date(Date.UTC(2019, 1, 3, 4, 5, 6)),
          "D:20190203040506+01": new Date(Date.UTC(2019, 1, 3, 3, 5, 6)),
          "D:20190203040506+00'": new Date(Date.UTC(2019, 1, 3, 4, 5, 6)),
          "D:20190203040506+24'": new Date(Date.UTC(2019, 1, 3, 4, 5, 6)),
          "D:20190203040506+01'": new Date(Date.UTC(2019, 1, 3, 3, 5, 6)),
          "D:20190203040506+01'0": new Date(Date.UTC(2019, 1, 3, 3, 5, 6)),
          "D:20190203040506+01'00": new Date(Date.UTC(2019, 1, 3, 3, 5, 6)),
          "D:20190203040506+01'60": new Date(Date.UTC(2019, 1, 3, 3, 5, 6)),
          "D:20190203040506+0102": new Date(Date.UTC(2019, 1, 3, 3, 3, 6)),
          "D:20190203040506+01'02": new Date(Date.UTC(2019, 1, 3, 3, 3, 6)),
          "D:20190203040506+01'02'": new Date(Date.UTC(2019, 1, 3, 3, 3, 6)),
          // Offset hour and minute that result in a day change:
          "D:20190203040506+05'07": new Date(Date.UTC(2019, 1, 2, 22, 58, 6)),
        };

        for (const [input, expectation] of Object.entries(expectations)) {
          const result = PDFDateString.toDateObject(input);
          if (result) {
            assertEquals(result.getTime(), expectation!.getTime());
          } else {
            assertEquals(result, expectation);
          }
        }
      });
    });
  });
});
/*80--------------------------------------------------------------------------*/
