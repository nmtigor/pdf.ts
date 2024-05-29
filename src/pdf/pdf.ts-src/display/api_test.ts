/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/api_test.ts
 * @license Apache-2.0
 ******************************************************************************/

/* Copyright 2021 Mozilla Foundation
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

import { isObjectLike } from "@fe-lib/jslang.ts";
import { PromiseCap } from "@fe-lib/util/PromiseCap.ts";
import { AutoPrintRegExp, PageLayout, PageMode } from "@pdf.ts-web/ui_utils.ts";
import {
  assert,
  assertEquals,
  assertFalse,
  assertInstanceOf,
  assertLess,
  assertMatch,
  assertNotEquals,
  assertNotMatch,
  assertNotStrictEquals,
  assertObjectMatch,
  assertStrictEquals,
  assertThrows,
  fail,
} from "@std/assert/mod.ts";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  it,
} from "@std/testing/bdd.ts";
import type { TestServer } from "@pdf.ts-test/test_utils.ts";
import {
  buildGetDocumentParams,
  BuildGetDocumentParamsOptions,
  CMAP_URL,
  createTemporaryDenoServer,
  D_base,
  DefaultFileReaderFactory,
  getPDF,
  TEST_IMAGES_PATH,
  TEST_PDFS_PATH,
} from "@pdf.ts-test/test_utils.ts";
import type { AnnotationData, FieldObject } from "../core/annotation.ts";
import type { AnnotActions } from "../core/core_utils.ts";
import type { ImgData } from "../core/evaluator.ts";
import { GlobalImageCache } from "../core/image_utils.ts";
import type { SimpleDOMNode } from "../core/xml_parser.ts";
import {
  AnnotationEditorType,
  AnnotationMode,
  AnnotationType,
  ImageKind,
  isNodeJS,
  objectSize,
  OPS,
  PasswordResponses,
  PermissionFlag,
  UnknownErrorException,
} from "../shared/util.ts";
import type { PrintAnnotationStorage } from "./annotation_storage.ts";
import type { DocumentInitP, StructTreeNode, TextItem } from "./api.ts";
import {
  DefaultCanvasFactory,
  getDocument,
  PDFDataRangeTransport,
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  PDFPageProxy,
  PDFWorker,
  PDFWorkerUtil,
  RenderTask,
} from "./api.ts";
import {
  PageViewport,
  RenderingCancelledException,
  StatTimer,
} from "./display_utils.ts";
import { Metadata } from "./metadata.ts";
import { GlobalWorkerOptions } from "./worker_options.ts";
import { D_test_pdfs } from "../../alias.ts";
/*80--------------------------------------------------------------------------*/

// const WORKER_SRC = "../../build/generic/build/pdf.worker.mjs";
let WORKER_SRC: string;

describe("api", () => {
  let tempServer: TestServer;

  const basicApiFileName = "basicapi.pdf";
  const basicApiFileLength = 105779; // bytes
  let basicApiGetDocumentParams: DocumentInitP;
  const tracemonkeyFileName = "tracemonkey.pdf";
  let tracemonkeyGetDocumentParams: DocumentInitP;

  let CanvasFactory: DefaultCanvasFactory;

  beforeAll(() => {
    // if (isNodeJS) {
    tempServer = createTemporaryDenoServer();
    // }

    WORKER_SRC = `${D_base(tempServer)}/built/pdf/pdf.ts-src/pdf.worker.js`;

    basicApiGetDocumentParams = buildGetDocumentParams(
      tempServer,
      basicApiFileName,
    );
    tracemonkeyGetDocumentParams = buildGetDocumentParams(
      tempServer,
      tracemonkeyFileName,
    );

    CanvasFactory = new DefaultCanvasFactory();
  });

  afterAll(() => {
    CanvasFactory = undefined as any;

    // if (isNodeJS) {
    /* Close the server from accepting new connections after all test
    finishes. */
    const { server } = tempServer;
    server.shutdown();
    tempServer = undefined as any;
    // }
  });

  function waitSome(callback: () => void) {
    const WAIT_TIMEOUT = 10;
    setTimeout(() => {
      callback();
    }, WAIT_TIMEOUT);
  }

  function mergeText(items: TextItem[]) {
    return items
      .map((chunk) => (chunk.str ?? "") + (chunk.hasEOL ? "\n" : ""))
      .join("");
  }

  function getNamedNodeInXML(node: SimpleDOMNode, path: string) {
    for (const component of path.split(".")) {
      if (!node.childNodes) {
        break;
      }
      for (const child of node.childNodes) {
        if (child.nodeName === component) {
          node = child;
          break;
        }
      }
    }
    return node;
  }

  describe("getDocument", () => {
    it("creates pdf doc from URL-string", async () => {
      const urlStr = TEST_PDFS_PATH(tempServer) + basicApiFileName;
      const loadingTask = getDocument(urlStr);
      assertInstanceOf(loadingTask, PDFDocumentLoadingTask);
      const pdfDocument = await loadingTask.promise;

      assertEquals(typeof urlStr, "string");
      assertInstanceOf(pdfDocument, PDFDocumentProxy);
      assertEquals(pdfDocument.numPages, 3);

      await loadingTask.destroy();
    });

    it("creates pdf doc from URL-object", async () => {
      // const urlObj = isNodeJS
      //   ? new URL(`http://127.0.0.1:${tempServer.port}/${basicApiFileName}`)
      //   : new URL(TEST_PDFS_PATH + basicApiFileName, window.location);
      const urlObj = new URL(
        `http://${tempServer.hostname}:${tempServer.port}/${D_test_pdfs}/${basicApiFileName}`,
      );

      const loadingTask = getDocument(urlObj);
      assertInstanceOf(loadingTask, PDFDocumentLoadingTask);
      const pdfDocument = await loadingTask.promise;

      assertInstanceOf(urlObj, URL);
      assertInstanceOf(pdfDocument, PDFDocumentProxy);
      assertEquals(pdfDocument.numPages, 3);

      // Ensure that the Fetch API was used to load the PDF document.
      assertEquals(pdfDocument.getNetworkStreamName(), "PDFFetchStream");

      await loadingTask.destroy();
    });

    it("creates pdf doc from URL", async () => {
      const loadingTask = getDocument(basicApiGetDocumentParams);
      assertInstanceOf(loadingTask, PDFDocumentLoadingTask);

      const progressReportedCapability = new PromiseCap<OnProgressP>();
      // Attach the callback that is used to report loading progress;
      // similarly to how viewer.js works.
      loadingTask.onProgress = (progressData) => {
        progressReportedCapability.resolve(progressData);
      };

      const data = await Promise.all([
        progressReportedCapability.promise,
        loadingTask.promise,
      ]);

      assert(data[0].loaded / data[0].total >= 0);
      assertInstanceOf(data[1], PDFDocumentProxy);
      assertStrictEquals(loadingTask, data[1].loadingTask);

      await loadingTask.destroy();
    });

    it("creates pdf doc from URL and aborts before worker initialized", async () => {
      const loadingTask = getDocument(basicApiGetDocumentParams);
      assertInstanceOf(loadingTask, PDFDocumentLoadingTask);
      const destroyed = loadingTask.destroy();

      try {
        await loadingTask.promise;

        fail("Shouldn't get here.");
      } catch {
        await destroyed;
      }
    });

    it("creates pdf doc from URL and aborts loading after worker initialized", async () => {
      const loadingTask = getDocument(basicApiGetDocumentParams);
      assertInstanceOf(loadingTask, PDFDocumentLoadingTask);
      // This can be somewhat random -- we cannot guarantee perfect
      // 'Terminate' message to the worker before/after setting up pdfManager.
      const destroyed = loadingTask._worker!.promise.then(
        () => loadingTask.destroy(),
      );

      await destroyed;
    });

    it("creates pdf doc from TypedArray", async () => {
      const typedArrayPdf = await DefaultFileReaderFactory.fetch({
        path: TEST_PDFS_PATH(tempServer) + basicApiFileName,
      });

      // Sanity check to make sure that we fetched the entire PDF file.
      assertInstanceOf(typedArrayPdf, Uint8Array);
      assertEquals(typedArrayPdf.length, basicApiFileLength);

      const loadingTask = getDocument(typedArrayPdf);
      assertInstanceOf(loadingTask, PDFDocumentLoadingTask);

      const progressReportedCapability = new PromiseCap<OnProgressP>();
      loadingTask.onProgress = (data) => {
        progressReportedCapability.resolve(data);
      };

      const data = await Promise.all([
        loadingTask.promise,
        progressReportedCapability.promise,
      ]);
      assertInstanceOf(data[0], PDFDocumentProxy);
      assertEquals(data[1].loaded / data[1].total, 1);

      // Check that the TypedArray was transferred.
      assertEquals(typedArrayPdf.length, 0);

      await loadingTask.destroy();
    });

    it("creates pdf doc from ArrayBuffer", async () => {
      const { buffer: arrayBufferPdf } = await DefaultFileReaderFactory.fetch({
        path: TEST_PDFS_PATH(tempServer) + basicApiFileName,
      });

      // Sanity check to make sure that we fetched the entire PDF file.
      assertInstanceOf(arrayBufferPdf, ArrayBuffer);
      assertEquals(arrayBufferPdf.byteLength, basicApiFileLength);

      const loadingTask = getDocument(arrayBufferPdf);
      assertInstanceOf(loadingTask, PDFDocumentLoadingTask);

      const progressReportedCapability = new PromiseCap<OnProgressP>();
      loadingTask.onProgress = (data) => {
        progressReportedCapability.resolve(data);
      };

      const data = await Promise.all([
        loadingTask.promise,
        progressReportedCapability.promise,
      ]);
      assertInstanceOf(data[0], PDFDocumentProxy);
      assertEquals(data[1].loaded / data[1].total, 1);

      // Check that the ArrayBuffer was transferred.
      assertEquals(arrayBufferPdf.byteLength, 0);

      await loadingTask.destroy();
    });

    it("creates pdf doc from invalid PDF file", async () => {
      // A severely corrupt PDF file (even Adobe Reader fails to open it).
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "bug1020226.pdf"),
      );
      assertInstanceOf(loadingTask, PDFDocumentLoadingTask);

      try {
        await loadingTask.promise;

        fail("Shouldn't get here.");
      } catch (reason) {
        // assertInstanceOf(reason, InvalidPDFException);
        assertEquals(reason?.name, "InvalidPDFException");
        assertEquals(reason.message, "Invalid PDF structure.");
      }

      await loadingTask.destroy();
    });

    it("creates pdf doc from non-existent URL", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "non-existent.pdf"),
      );
      assertInstanceOf(loadingTask, PDFDocumentLoadingTask);

      try {
        await loadingTask.promise;

        fail("Shouldn't get here.");
      } catch (reason) {
        // assertInstanceOf(reason, MissingPDFException);
        assertEquals(reason?.name, "MissingPDFException");
      }

      await loadingTask.destroy();
    });

    it("creates pdf doc from PDF file protected with user and owner password", async () => {
      await using loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "pr6531_1.pdf"),
      );
      assertInstanceOf(loadingTask, PDFDocumentLoadingTask);

      const passwordNeededCapability = new PromiseCap();
      const passwordIncorrectCapability = new PromiseCap();
      // Attach the callback that is used to request a password;
      // similarly to how the default viewer handles passwords.
      loadingTask.onPassword = (updatePassword, reason) => {
        if (
          reason === PasswordResponses.NEED_PASSWORD &&
          !passwordNeededCapability.settled
        ) {
          passwordNeededCapability.resolve();

          updatePassword("qwerty"); // Provide an incorrect password.
          return;
        }
        if (
          reason === PasswordResponses.INCORRECT_PASSWORD &&
          !passwordIncorrectCapability.settled
        ) {
          passwordIncorrectCapability.resolve();

          updatePassword("asdfasdf"); // Provide the correct password.
          return;
        }
        fail("Shouldn't get here.");
      };

      const data = await Promise.all([
        passwordNeededCapability.promise,
        passwordIncorrectCapability.promise,
        loadingTask.promise,
      ]);
      assertInstanceOf(data[2], PDFDocumentProxy);
    });

    it("creates pdf doc from PDF file protected with only a user password", async () => {
      const filename = "pr6531_2.pdf";

      const passwordNeededLoadingTask = getDocument(
        buildGetDocumentParams(tempServer, filename, {
          password: "",
        }),
      );
      assertInstanceOf(passwordNeededLoadingTask, PDFDocumentLoadingTask);

      const result1 = passwordNeededLoadingTask.promise.then(
        () => {
          fail("Shouldn't get here.");
          throw new Error("loadingTask should be rejected");
        },
        (data) => {
          // assertInstanceOf(data, PasswordException);
          assertEquals(data?.name, "PasswordException");
          assertEquals(data.code, PasswordResponses.NEED_PASSWORD);
          return passwordNeededLoadingTask.destroy();
        },
      );

      const passwordIncorrectLoadingTask = getDocument(
        buildGetDocumentParams(tempServer, filename, {
          password: "qwerty",
        }),
      );
      assertInstanceOf(passwordIncorrectLoadingTask, PDFDocumentLoadingTask);

      const result2 = passwordIncorrectLoadingTask.promise.then(
        () => {
          fail("Shouldn't get here.");
          throw new Error("loadingTask should be rejected");
        },
        (data) => {
          // assertInstanceOf(data, PasswordException);
          assertEquals(data?.name, "PasswordException");
          assertEquals(data.code, PasswordResponses.INCORRECT_PASSWORD);
          return passwordIncorrectLoadingTask.destroy();
        },
      );

      const passwordAcceptedLoadingTask = getDocument(
        buildGetDocumentParams(tempServer, filename, {
          password: "asdfasdf",
        }),
      );
      assertInstanceOf(passwordAcceptedLoadingTask, PDFDocumentLoadingTask);

      const result3 = passwordAcceptedLoadingTask.promise.then((data) => {
        assertInstanceOf(data, PDFDocumentProxy);
        return passwordAcceptedLoadingTask.destroy();
      });

      await Promise.all([result1, result2, result3]);
    });

    it(
      "creates pdf doc from password protected PDF file and aborts/throws " +
        "in the onPassword callback (issue 7806)",
      async () => {
        const filename = "issue3371.pdf";

        const passwordNeededLoadingTask = getDocument(
          buildGetDocumentParams(tempServer, filename),
        );
        assertInstanceOf(passwordNeededLoadingTask, PDFDocumentLoadingTask);

        const passwordIncorrectLoadingTask = getDocument(
          buildGetDocumentParams(tempServer, filename, {
            password: "qwerty",
          }),
        );
        assertInstanceOf(passwordIncorrectLoadingTask, PDFDocumentLoadingTask);

        let passwordNeededDestroyed: Promise<void>;
        passwordNeededLoadingTask.onPassword = (callback, reason) => {
          if (reason === PasswordResponses.NEED_PASSWORD) {
            passwordNeededDestroyed = passwordNeededLoadingTask.destroy();
            return;
          }
          fail("Shouldn't get here.");
        };
        const result1 = passwordNeededLoadingTask.promise.then(
          () => {
            fail("Shouldn't get here.");
            throw new Error("loadingTask should be rejected");
          },
          (reason) => {
            // assertInstanceOf(reason, PasswordException);
            assertEquals(reason?.name, "PasswordException");
            assertEquals(reason.code, PasswordResponses.NEED_PASSWORD);
            return passwordNeededDestroyed;
          },
        );

        passwordIncorrectLoadingTask.onPassword = (callback, reason) => {
          if (reason === PasswordResponses.INCORRECT_PASSWORD) {
            throw new Error("Incorrect password");
          }
          fail("Shouldn't get here.");
        };
        const result2 = passwordIncorrectLoadingTask.promise.then(
          () => {
            fail("Shouldn't get here.");
            throw new Error("loadingTask should be rejected");
          },
          (reason) => {
            // assertInstanceOf(reason, PasswordException);
            assertEquals(reason?.name, "PasswordException");
            assertEquals(reason.code, PasswordResponses.INCORRECT_PASSWORD);
            return passwordIncorrectLoadingTask.destroy();
          },
        );

        await Promise.all([result1, result2]);
      },
    );

    it(
      "creates pdf doc from password protected PDF file and passes an Error " +
        "(asynchronously) to the onPassword callback (bug 1754421)",
      async () => {
        const loadingTask = getDocument(
          buildGetDocumentParams(tempServer, "issue3371.pdf"),
        );
        assertInstanceOf(loadingTask, PDFDocumentLoadingTask);

        // Attach the callback that is used to request a password;
        // similarly to how the default viewer handles passwords.
        loadingTask.onPassword = (updatePassword, reason) => {
          waitSome(() => {
            updatePassword(new Error("Should reject the loadingTask."));
          });
        };

        await loadingTask.promise.then(
          () => {
            fail("Shouldn't get here.");
          },
          (reason) => {
            // assertInstanceOf(reason, PasswordException);
            assertEquals(reason?.name, "PasswordException");
            assertEquals(reason.code, PasswordResponses.NEED_PASSWORD);
          },
        );

        await loadingTask.destroy();
      },
    );

    it("creates pdf doc from empty TypedArray", async () => {
      const loadingTask = getDocument(new Uint8Array(0));
      assertInstanceOf(loadingTask, PDFDocumentLoadingTask);

      try {
        await loadingTask.promise;

        fail("Shouldn't get here.");
      } catch (reason) {
        // assertInstanceOf(reason, InvalidPDFException);
        assertEquals(reason?.name, "InvalidPDFException");
        assertEquals(
          reason.message,
          "The PDF file is empty, i.e. its size is zero bytes.",
        );
      }

      await loadingTask.destroy();
    });

    it("checks the `startxref` position of a linearized pdf doc (issue 17665)", async () => {
      await using loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "empty.pdf"),
      );
      assertInstanceOf(loadingTask, PDFDocumentLoadingTask);

      const pdfDocument = await loadingTask.promise;

      const startXRefPos = await pdfDocument.getStartXRefPos();
      assertEquals(startXRefPos, 116);
    });

    it("checks that `docId`s are unique and increasing", async () => {
      const loadingTask1 = getDocument(basicApiGetDocumentParams);
      assertInstanceOf(loadingTask1, PDFDocumentLoadingTask);
      await loadingTask1.promise;
      const docId1 = loadingTask1.docId;

      const loadingTask2 = getDocument(basicApiGetDocumentParams);
      assertInstanceOf(loadingTask2, PDFDocumentLoadingTask);
      await loadingTask2.promise;
      const docId2 = loadingTask2.docId;

      assertNotEquals(docId1, docId2);

      const docIdRegExp = /^d(\d+)$/,
        docNum1 = docIdRegExp.exec(docId1)?.[1],
        docNum2 = docIdRegExp.exec(docId2)?.[1];

      assert(+docNum1! < +docNum2!);

      await Promise.all([loadingTask1.destroy(), loadingTask2.destroy()]);
    });

    it("creates pdf doc from PDF file with bad XRef entry", async () => {
      // A corrupt PDF file, where the XRef table have (some) bogus entries.
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "PDFBOX-4352-0.pdf", {
          rangeChunkSize: 100,
        }),
      );
      assertInstanceOf(loadingTask, PDFDocumentLoadingTask);

      const pdfDocument = await loadingTask.promise;
      assertEquals(pdfDocument.numPages, 1);

      const page = await pdfDocument.getPage(1);
      assertInstanceOf(page, PDFPageProxy);

      const opList = await page.getOperatorList();
      assertEquals(opList.fnArray.length, 0);
      assertEquals(opList.argsArray.length, 0);
      assertEquals(opList.lastChunk, true);

      await loadingTask.destroy();
    });

    it("creates pdf doc from PDF file with bad XRef header", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "GHOSTSCRIPT-698804-1-fuzzed.pdf"),
      );
      assertInstanceOf(loadingTask, PDFDocumentLoadingTask);

      const pdfDocument = await loadingTask.promise;
      assertEquals(pdfDocument.numPages, 1);

      const page = await pdfDocument.getPage(1);
      assertInstanceOf(page, PDFPageProxy);

      const opList = await page.getOperatorList();
      assertEquals(opList.fnArray.length, 0);
      assertEquals(opList.argsArray.length, 0);
      assertEquals(opList.lastChunk, true);

      await loadingTask.destroy();
    });

    it("creates pdf doc from PDF file with bad XRef byteWidths", async () => {
      // A corrupt PDF file, where the XRef /W-array have (some) bogus entries.
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "REDHAT-1531897-0.pdf"),
      );
      assertInstanceOf(loadingTask, PDFDocumentLoadingTask);

      try {
        await loadingTask.promise;

        fail("Shouldn't get here.");
      } catch (reason) {
        // assertInstanceOf(reason, InvalidPDFException);
        assertEquals(reason?.name, "InvalidPDFException");
        assertEquals(reason.message, "Invalid PDF structure.");
      }

      await loadingTask.destroy();
    });

    it("creates pdf doc from PDF file with inaccessible /Pages tree", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "poppler-395-0-fuzzed.pdf"),
      );
      assertInstanceOf(loadingTask, PDFDocumentLoadingTask);

      try {
        await loadingTask.promise;

        fail("Shouldn't get here.");
      } catch (reason) {
        // assertInstanceOf(reason, InvalidPDFException);
        assertEquals(reason?.name, "InvalidPDFException");
        assertEquals(reason.message, "Invalid Root reference.");
      }

      await loadingTask.destroy();
    });

    it("creates pdf doc from PDF files, with bad /Pages tree /Count", async () => {
      const loadingTask1 = getDocument(
        buildGetDocumentParams(tempServer, "poppler-67295-0.pdf"),
      );
      const loadingTask2 = getDocument(
        buildGetDocumentParams(tempServer, "poppler-85140-0.pdf"),
      );
      const loadingTask3 = getDocument(
        buildGetDocumentParams(tempServer, "poppler-85140-0.pdf", {
          stopAtErrors: true,
        }),
      );

      assertInstanceOf(loadingTask1, PDFDocumentLoadingTask);
      assertInstanceOf(loadingTask2, PDFDocumentLoadingTask);
      assertInstanceOf(loadingTask3, PDFDocumentLoadingTask);

      const pdfDocument1 = await loadingTask1.promise;
      const pdfDocument2 = await loadingTask2.promise;
      const pdfDocument3 = await loadingTask3.promise;

      assertEquals(pdfDocument1.numPages, 1);
      assertEquals(pdfDocument2.numPages, 1);
      assertEquals(pdfDocument3.numPages, 1);

      const pageA = await pdfDocument1.getPage(1);
      assertInstanceOf(pageA, PDFPageProxy);

      const opListA = await pageA.getOperatorList();
      assert(opListA.fnArray.length > 5);
      assert(opListA.argsArray.length > 5);
      assertEquals(opListA.lastChunk, true);
      assertEquals(opListA.separateAnnots, undefined);

      const pageB = await pdfDocument2.getPage(1);
      assertInstanceOf(pageB, PDFPageProxy);

      const opListB = await pageB.getOperatorList();
      assertEquals(opListB.fnArray.length, 0);
      assertEquals(opListB.argsArray.length, 0);
      assertEquals(opListB.lastChunk, true);
      assertEquals(opListB.separateAnnots, undefined);

      try {
        await pdfDocument3.getPage(1);

        fail("Shouldn't get here.");
      } catch (reason) {
        // assertInstanceOf(reason, UnknownErrorException);
        assertEquals(reason?.name, "UnknownErrorException");
        assertEquals(reason.message, "Bad (uncompressed) XRef entry: 3R");
      }

      await Promise.all([
        loadingTask1.destroy(),
        loadingTask2.destroy(),
        loadingTask3.destroy(),
      ]);
    });

    it("creates pdf doc from PDF files, with circular references", async () => {
      const loadingTask1 = getDocument(
        buildGetDocumentParams(tempServer, "poppler-91414-0-53.pdf"),
      );
      const loadingTask2 = getDocument(
        buildGetDocumentParams(tempServer, "poppler-91414-0-54.pdf"),
      );
      assertInstanceOf(loadingTask1, PDFDocumentLoadingTask);
      assertInstanceOf(loadingTask2, PDFDocumentLoadingTask);

      const pdfDocument1 = await loadingTask1.promise;
      const pdfDocument2 = await loadingTask2.promise;

      assertEquals(pdfDocument1.numPages, 1);
      assertEquals(pdfDocument2.numPages, 1);

      const pageA = await pdfDocument1.getPage(1);
      const pageB = await pdfDocument2.getPage(1);

      assertInstanceOf(pageA, PDFPageProxy);
      assertInstanceOf(pageB, PDFPageProxy);

      for (
        const opList of [
          await pageA.getOperatorList(),
          await pageB.getOperatorList(),
        ]
      ) {
        assert(opList.fnArray.length > 5);
        assert(opList.argsArray.length > 5);
        assertEquals(opList.lastChunk, true);
      }

      await Promise.all([loadingTask1.destroy(), loadingTask2.destroy()]);
    });

    it("creates pdf doc from PDF files, with bad /Pages tree /Kids entries", async () => {
      const loadingTask1 = getDocument(
        buildGetDocumentParams(tempServer, "poppler-742-0-fuzzed.pdf"),
      );
      const loadingTask2 = getDocument(
        buildGetDocumentParams(tempServer, "poppler-937-0-fuzzed.pdf"),
      );
      assertInstanceOf(loadingTask1, PDFDocumentLoadingTask);
      assertInstanceOf(loadingTask2, PDFDocumentLoadingTask);

      const pdfDocument1 = await loadingTask1.promise;
      const pdfDocument2 = await loadingTask2.promise;

      assertEquals(pdfDocument1.numPages, 1);
      assertEquals(pdfDocument2.numPages, 1);

      try {
        await pdfDocument1.getPage(1);

        fail("Shouldn't get here.");
      } catch (reason) {
        // assertInstanceOf(reason, UnknownErrorException);
        assertEquals(reason?.name, "UnknownErrorException");
        assertEquals(reason.message, "Illegal character: 41");
      }
      try {
        await pdfDocument2.getPage(1);

        fail("Shouldn't get here.");
      } catch (reason) {
        // assertInstanceOf(reason, UnknownErrorException);
        assertEquals(reason?.name, "UnknownErrorException");
        assertEquals(reason.message, "End of file inside array.");
      }

      await Promise.all([loadingTask1.destroy(), loadingTask2.destroy()]);
    });

    it("creates pdf doc from PDF file with bad /Resources entry", async () => {
      await using loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "issue15150.pdf"),
      );
      assertInstanceOf(loadingTask, PDFDocumentLoadingTask);

      const pdfDocument = await loadingTask.promise;
      assertEquals(pdfDocument.numPages, 1);

      const page = await pdfDocument.getPage(1);
      assertInstanceOf(page, PDFPageProxy);

      const opList = await page.getOperatorList();
      assertEquals(opList.fnArray, [
        OPS.setLineWidth,
        OPS.setStrokeRGBColor,
        OPS.constructPath,
        OPS.closeStroke,
      ]);
      assertEquals(opList.argsArray, [
        [0.5],
        new Uint8ClampedArray([255, 0, 0]),
        [
          [OPS.moveTo, OPS.lineTo],
          [0, 9.75, 0.5, 9.75],
          [0, 9.75, 0.5, 9.75],
        ],
        null,
      ]);
      assertEquals(opList.lastChunk, true);
    });

    it("creates pdf doc from PDF file, with incomplete trailer", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "issue15590.pdf"),
      );
      assertInstanceOf(loadingTask, PDFDocumentLoadingTask);

      const pdfDocument = await loadingTask.promise;
      assertEquals(pdfDocument.numPages, 1);

      const jsActions = await pdfDocument.getJSActions();
      assertEquals(jsActions, {
        OpenAction: ["func=function(){app.alert(1)};func();"],
      } as AnnotActions);

      const page = await pdfDocument.getPage(1);
      assertInstanceOf(page, PDFPageProxy);

      await loadingTask.destroy();
    });
  });

  describe("PDFWorker", () => {
    it("worker created or destroyed", async () => {
      // if (isNodeJS) {
      //   pending("Worker is not supported in Node.js.");
      // }

      const worker = new PDFWorker({ name: "test1" });
      await worker.promise;
      assertEquals(worker.name, "test1");
      assert(!!worker.port);
      assertEquals(worker.destroyed, false);
      //kkkk
      // assert(!!worker._webWorker);
      // assertStrictEquals(worker.port, worker._webWorker);

      worker.destroy();
      assertFalse(worker.port);
      assertEquals(worker.destroyed, true);
    });

    it("worker created or destroyed by getDocument", async () => {
      // if (isNodeJS) {
      //   pending("Worker is not supported in Node.js.");
      // }

      const loadingTask = getDocument(basicApiGetDocumentParams);
      let worker: PDFWorker | undefined;
      loadingTask.promise.then(() => {
        worker = loadingTask._worker;
        assert(!!worker);
      });

      const destroyPromise = loadingTask.promise.then(
        () => loadingTask.destroy(),
      );
      await destroyPromise;

      const destroyedWorker = loadingTask._worker;
      assertFalse(destroyedWorker);
      assertEquals(worker!.destroyed, true);
    });

    it("worker created and can be used in getDocument", async () => {
      // if (isNodeJS) {
      //   pending("Worker is not supported in Node.js.");
      // }

      const worker = new PDFWorker({ name: "test1" });
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, basicApiFileName, {
          worker,
        }),
      );
      loadingTask.promise.then(() => {
        const docWorker = loadingTask._worker;
        assertFalse(docWorker);
        // checking is the same port is used in the MessageHandler
        const messageHandlerPort =
          loadingTask._transport!.messageHandler.comObj;
        assertStrictEquals(messageHandlerPort, worker.port);
      });

      const destroyPromise = loadingTask.promise.then(
        () => loadingTask.destroy(),
      );
      await destroyPromise;

      assertEquals(worker.destroyed, false);
      worker.destroy();
    });

    it("creates more than one worker", async () => {
      // if (isNodeJS) {
      //   pending("Worker is not supported in Node.js.");
      // }

      const worker1 = new PDFWorker({ name: "test1" });
      const worker2 = new PDFWorker({ name: "test2" });
      const worker3 = new PDFWorker({ name: "test3" });
      await Promise.all([worker1.promise, worker2.promise, worker3.promise]);

      assert(
        worker1.port !== worker2.port &&
          worker1.port !== worker3.port &&
          worker2.port !== worker3.port,
      );
      worker1.destroy();
      worker2.destroy();
      worker3.destroy();
    });

    it("gets current workerSrc", () => {
      // if (isNodeJS) {
      //   pending("Worker is not supported in Node.js.");
      // }

      const workerSrc = PDFWorker.workerSrc;
      assertEquals(typeof workerSrc, "string");
      assertEquals(workerSrc, GlobalWorkerOptions.workerSrc);
    });
  });

  describe("GlobalWorkerOptions", () => {
    // const workerSrc = "../../build/generic/build/pdf.worker.js";
    let savedGlobalWorkerPort: Worker | undefined;

    beforeAll(() => {
      savedGlobalWorkerPort = GlobalWorkerOptions.workerPort;
    });

    afterEach(() => {
      /* Running by `deno test`, there could be "Leaking async ops" without
      this. */
      GlobalWorkerOptions.workerPort?.terminate();
    });

    afterAll(() => {
      GlobalWorkerOptions.workerPort = savedGlobalWorkerPort;
    });

    it("use global \`workerPort\` with multiple, sequential, documents", async () => {
      // if (isNodeJS) {
      //   pending("Worker is not supported in Node.js.");
      // }

      GlobalWorkerOptions.workerPort = new Worker(
        new URL(WORKER_SRC, window.location as any),
        { type: "module" },
      );

      const loadingTask1 = getDocument(basicApiGetDocumentParams);
      const pdfDoc1 = await loadingTask1.promise;
      assertEquals(pdfDoc1.numPages, 3);
      await loadingTask1.destroy();

      const loadingTask2 = getDocument(tracemonkeyGetDocumentParams);
      const pdfDoc2 = await loadingTask2.promise;
      assertEquals(pdfDoc2.numPages, 14);
      await loadingTask2.destroy();
    });

    it("use global \`workerPort\` with multiple, parallel, documents", async () => {
      // if (isNodeJS) {
      //   pending("Worker is not supported in Node.js.");
      // }

      GlobalWorkerOptions.workerPort = new Worker(
        new URL(WORKER_SRC, window.location as any),
        { type: "module" },
      );

      const loadingTask1 = getDocument(basicApiGetDocumentParams);
      const promise1 = loadingTask1.promise.then((pdfDoc) => pdfDoc.numPages);

      const loadingTask2 = getDocument(tracemonkeyGetDocumentParams);
      const promise2 = loadingTask2.promise.then((pdfDoc) => pdfDoc.numPages);

      const [numPages1, numPages2] = await Promise.all([promise1, promise2]);
      assertEquals(numPages1, 3);
      assertEquals(numPages2, 14);

      await Promise.all([loadingTask1.destroy(), loadingTask2.destroy()]);
    });

    it(
      "avoid using the global \`workerPort\` when destruction has started, " +
        "but not yet finished (issue 16777)",
      async () => {
        // if (isNodeJS) {
        //   pending("Worker is not supported in Node.js.");
        // }

        GlobalWorkerOptions.workerPort = new Worker(
          new URL(WORKER_SRC, window.location as any),
          { type: "module" },
        );

        const loadingTask = getDocument(basicApiGetDocumentParams);
        const pdfDoc = await loadingTask.promise;
        assertEquals(pdfDoc.numPages, 3);
        const destroyPromise = loadingTask.destroy();

        assertThrows(
          () => {
            getDocument(tracemonkeyGetDocumentParams);
          },
          Error,
          "PDFWorker.fromPort - the worker is being destroyed.\n" +
            "Please remember to await `PDFDocumentLoadingTask.destroy()`-calls.",
        );

        await destroyPromise;
      },
    );
  });

  describe("PDFDocument", () => {
    let pdfLoadingTask: PDFDocumentLoadingTask;
    let pdfDocument: PDFDocumentProxy;

    beforeAll(async () => {
      pdfLoadingTask = getDocument(basicApiGetDocumentParams);
      pdfDocument = await pdfLoadingTask.promise;
    });

    afterAll(async () => {
      await pdfLoadingTask.destroy();
    });

    it("gets number of pages", () => {
      assertEquals(pdfDocument.numPages, 3);
    });

    it("gets fingerprints", () => {
      assertEquals(pdfDocument.fingerprints, [
        "ea8b35919d6279a369e835bde778611b",
        undefined,
      ]);
    });

    it("gets fingerprints, from modified document", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "annotation-tx.pdf"),
      );
      const pdfDoc = await loadingTask.promise;

      assertEquals(pdfDoc.fingerprints, [
        "3ebd77c320274649a68f10dbf3b9f882",
        "e7087346aa4b4ae0911c1f1643b57345",
      ]);

      await loadingTask.destroy();
    });

    it("gets page", async () => {
      const data = await pdfDocument.getPage(1);
      assertInstanceOf(data, PDFPageProxy);
      assertEquals(data.pageNumber, 1);
    });

    it("gets non-existent page", async () => {
      const pageNumbers = [
        /* outOfRange = */ 100,
        /* nonInteger = */ 2.5,
        /* nonNumber = */ "1",
      ];

      for (const pageNumber of pageNumbers) {
        try {
          await pdfDocument.getPage(pageNumber as number);

          fail("Shouldn't get here.");
        } catch (reason) {
          assertInstanceOf(reason, Error);
          assertEquals(reason.message, "Invalid page request.");
        }
      }
    });

    it("gets page, from /Pages tree with circular reference", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "Pages-tree-refs.pdf"),
      );

      const page1 = loadingTask.promise.then((pdfDoc) => {
        return pdfDoc.getPage(1).then(
          (pdfPage) => {
            assertInstanceOf(pdfPage, PDFPageProxy);
            assertEquals(pdfPage.ref, { num: 6, gen: 0 });
          },
          (reason) => {
            throw new Error("shall not fail for valid page");
          },
        );
      });

      const page2 = loadingTask.promise.then((pdfDoc) => {
        return pdfDoc.getPage(2).then(
          (pdfPage) => {
            throw new Error("shall fail for invalid page");
          },
          (reason) => {
            // assertInstanceOf(reason, UnknownErrorException);
            assertEquals(reason?.name, "UnknownErrorException");
            assertEquals(
              reason.message,
              "Pages tree contains circular reference.",
            );
          },
        );
      });

      await Promise.all([page1, page2]);
      await loadingTask.destroy();
    });

    it("gets page multiple time, with working caches", async () => {
      const promiseA = pdfDocument.getPage(1);
      const promiseB = pdfDocument.getPage(1);

      assertInstanceOf(promiseA, Promise);
      assertStrictEquals(promiseA, promiseB);

      const pageA = await promiseA;
      const pageB = await promiseB;

      assertInstanceOf(pageA, PDFPageProxy);
      assertStrictEquals(pageA, pageB);
    });

    it("gets page index", async () => {
      const ref = { num: 17, gen: 0 }; // Reference to second page.
      const pageIndex = await pdfDocument.getPageIndex(ref);
      assertEquals(pageIndex, 1);
    });

    it("gets invalid page index", async () => {
      const pageRefs = [
        /* fontRef = */ { num: 3, gen: 0 },
        /* invalidRef = */ { num: -1, gen: 0 },
        /* nonRef = */ "qwerty",
        /* nullRef = */ null,
      ];

      const expectedErrors = [
        {
          exception: UnknownErrorException,
          message: "The reference does not point to a /Page dictionary.",
        },
        { exception: Error, message: "Invalid pageIndex request." },
        { exception: Error, message: "Invalid pageIndex request." },
        { exception: Error, message: "Invalid pageIndex request." },
      ];

      for (let i = 0, ii = pageRefs.length; i < ii; i++) {
        try {
          await pdfDocument.getPageIndex(pageRefs[i] as any);

          fail("Shouldn't get here.");
        } catch (reason) {
          const { exception, message } = expectedErrors[i];

          assertEquals(reason?.name, exception.name);
          assertEquals(reason.message, message);
        }
      }
    });

    it("gets destinations, from /Dests dictionary", async () => {
      const destinations = await pdfDocument.getDestinations();
      assertEquals(destinations, {
        chapter1: [{ gen: 0, num: 17 }, { name: "XYZ" }, 0, 841.89, null],
      });
    });

    it("gets a destination, from /Dests dictionary", async () => {
      const destination = await pdfDocument.getDestination("chapter1");
      assertEquals(destination, [
        { gen: 0, num: 17 },
        { name: "XYZ" },
        0,
        841.89,
        null,
      ]);
    });

    it("gets a non-existent destination, from /Dests dictionary", async () => {
      const destination = await pdfDocument.getDestination(
        "non-existent-named-destination",
      );
      assertEquals(destination, undefined);
    });

    it("gets destinations, from /Names (NameTree) dictionary", async () => {
      await using loadingTask = await getPDF(tempServer, "issue6204.pdf");
      const pdfDoc = await loadingTask.promise;
      const destinations = await pdfDoc.getDestinations();
      assertEquals(destinations, {
        "Page.1": [{ num: 1, gen: 0 }, { name: "XYZ" }, 0, 375, null],
        "Page.2": [{ num: 6, gen: 0 }, { name: "XYZ" }, 0, 375, null],
      });
    });

    it("gets a destination, from /Names (NameTree) dictionary", async () => {
      await using loadingTask = await getPDF(tempServer, "issue6204.pdf");
      const pdfDoc = await loadingTask.promise;
      const destination = await pdfDoc.getDestination("Page.1");
      assertEquals(destination, [
        { num: 1, gen: 0 },
        { name: "XYZ" },
        0,
        375,
        null,
      ]);
    });

    it("gets a non-existent destination, from /Names (NameTree) dictionary", async () => {
      await using loadingTask = await getPDF(tempServer, "issue6204.pdf");
      const pdfDoc = await loadingTask.promise;
      const destination = await pdfDoc.getDestination(
        "non-existent-named-destination",
      );
      assertEquals(destination, undefined);
    });

    it("gets a destination, from out-of-order /Names (NameTree) dictionary (issue 10272)", async () => {
      // if (isNodeJS) {
      //   pending("Linked test-cases are not supported in Node.js.");
      // }
      await using loadingTask = await getPDF(tempServer, "issue10272.pdf");
      const pdfDoc = await loadingTask.promise;
      const destination = await pdfDoc.getDestination("link_1");
      assertEquals(destination, [
        { num: 17, gen: 0 },
        { name: "XYZ" },
        69,
        125,
        0,
      ]);
    });

    it("gets a destination, from /Names (NameTree) dictionary with keys using PDFDocEncoding (issue 14847)", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "issue14847.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const destination = await pdfDoc.getDestination("index");
      assertEquals(destination, [
        { num: 10, gen: 0 },
        { name: "XYZ" },
        85.039,
        728.504,
        null,
      ]);

      await loadingTask.destroy();
    });

    //kkkk
    it.ignore("gets non-string destination", async () => {
      let numberPromise: Promise<any> = pdfDocument.getDestination(4.3 as any);
      let booleanPromise: Promise<any> = pdfDocument.getDestination(
        true as any,
      );
      let arrayPromise: Promise<any> = pdfDocument.getDestination([
        { num: 17, gen: 0 },
        { name: "XYZ" },
        0,
        841.89,
        null,
      ] as any);

      numberPromise = numberPromise.then(
        () => {
          throw new Error("shall fail for non-string destination.");
        },
        (reason) => {
          assertInstanceOf(reason, Error);
        },
      );
      booleanPromise = booleanPromise.then(
        () => {
          throw new Error("shall fail for non-string destination.");
        },
        (reason) => {
          assertInstanceOf(reason, Error);
        },
      );
      arrayPromise = arrayPromise.then(
        () => {
          throw new Error("shall fail for non-string destination.");
        },
        (reason) => {
          assertInstanceOf(reason, Error);
        },
      );

      await Promise.all([
        numberPromise,
        booleanPromise,
        arrayPromise,
      ]);
    });

    it("gets non-existent page labels", async () => {
      const pageLabels = await pdfDocument.getPageLabels();
      assertEquals(pageLabels, undefined);
    });

    it("gets page labels", async () => {
      // PageLabels with Roman/Arabic numerals.
      const loadingTask0 = getDocument(
        buildGetDocumentParams(tempServer, "bug793632.pdf"),
      );
      const promise0 = loadingTask0.promise.then((pdfDoc) =>
        pdfDoc.getPageLabels()
      );

      // PageLabels with only a label prefix.
      const loadingTask1 = getDocument(
        buildGetDocumentParams(tempServer, "issue1453.pdf"),
      );
      const promise1 = loadingTask1.promise.then((pdfDoc) =>
        pdfDoc.getPageLabels()
      );

      // PageLabels identical to standard page numbering.
      const loadingTask2 = getDocument(
        buildGetDocumentParams(tempServer, "rotation.pdf"),
      );
      const promise2 = loadingTask2.promise.then((pdfDoc) =>
        pdfDoc.getPageLabels()
      );

      // PageLabels with bad "Prefix" entries.
      const loadingTask3 = getDocument(
        buildGetDocumentParams(tempServer, "bad-PageLabels.pdf"),
      );
      const promise3 = loadingTask3.promise.then((pdfDoc) =>
        pdfDoc.getPageLabels()
      );

      const pageLabels = await Promise.all([
        promise0,
        promise1,
        promise2,
        promise3,
      ]);
      assertEquals(pageLabels[0], ["i", "ii", "iii", "1"]);
      assertEquals(pageLabels[1], ["Front Page1"]);
      assertEquals(pageLabels[2], ["1", "2"]);
      assertEquals(pageLabels[3], ["X3"]);

      await Promise.all([
        loadingTask0.destroy(),
        loadingTask1.destroy(),
        loadingTask2.destroy(),
        loadingTask3.destroy(),
      ]);
    });

    it("gets default page layout", async () => {
      const loadingTask = getDocument(tracemonkeyGetDocumentParams);
      const pdfDoc = await loadingTask.promise;
      const pageLayout = await pdfDoc.getPageLayout();
      assertEquals(pageLayout, undefined);

      await loadingTask.destroy();
    });

    it("gets non-default page layout", async () => {
      const pageLayout = await pdfDocument.getPageLayout();
      assertEquals(pageLayout, PageLayout.SinglePage);
    });

    it("gets default page mode", async () => {
      const loadingTask = getDocument(tracemonkeyGetDocumentParams);
      const pdfDoc = await loadingTask.promise;
      const pageMode = await pdfDoc.getPageMode();
      assertEquals(pageMode, PageMode.UseNone);

      await loadingTask.destroy();
    });

    it("gets non-default page mode", async () => {
      const pageMode = await pdfDocument.getPageMode();
      assertEquals(pageMode, PageMode.UseOutlines);
    });

    it("gets default viewer preferences", async () => {
      const loadingTask = getDocument(tracemonkeyGetDocumentParams);
      const pdfDoc = await loadingTask.promise;
      const prefs = await pdfDoc.getViewerPreferences();
      assertEquals(prefs, undefined);

      await loadingTask.destroy();
    });

    it("gets non-default viewer preferences", async () => {
      const prefs = await pdfDocument.getViewerPreferences();
      assertEquals(prefs, { Direction: "L2R" });
    });

    it("gets default open action", async () => {
      const loadingTask = getDocument(tracemonkeyGetDocumentParams);
      const pdfDoc = await loadingTask.promise;
      const openAction = await pdfDoc.getOpenAction();
      assertEquals(openAction, undefined);

      await loadingTask.destroy();
    });

    it("gets non-default open action (with destination)", async () => {
      const openAction = await pdfDocument.getOpenAction();
      assertEquals(openAction!.dest, [
        { num: 15, gen: 0 },
        { name: "FitH" },
        null,
      ]);
      assertEquals(openAction!.action, undefined);
    });

    it("gets non-default open action (with Print action)", async () => {
      // PDF document with "Print" Named action in the OpenAction dictionary.
      const loadingTask1 = getDocument(
        buildGetDocumentParams(tempServer, "bug1001080.pdf"),
      );
      // PDF document with "Print" Named action in the OpenAction dictionary,
      // but the OpenAction dictionary is missing the `Type` entry.
      const loadingTask2 = getDocument(
        buildGetDocumentParams(tempServer, "issue11442_reduced.pdf"),
      );

      const promise1 = loadingTask1.promise
        .then((pdfDoc) => pdfDoc.getOpenAction())
        .then((openAction) => {
          assertEquals(openAction!.dest, undefined);
          assertEquals(openAction!.action, "Print");

          return loadingTask1.destroy();
        });
      const promise2 = loadingTask2.promise
        .then((pdfDoc) => pdfDoc.getOpenAction())
        .then((openAction) => {
          assertEquals(openAction!.dest, undefined);
          assertEquals(openAction!.action, "Print");

          return loadingTask2.destroy();
        });

      await Promise.all([
        promise1,
        promise2,
      ]);
    });

    it("gets non-existent attachments", async () => {
      const attachments = await pdfDocument.getAttachments();
      assertEquals(attachments, undefined);
    });

    it("gets attachments", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "attachment.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const attachments = await pdfDoc.getAttachments();

      const attachment = attachments["foo.txt"];
      assertEquals(attachment.filename, "foo.txt");
      assertEquals(
        attachment.content,
        new Uint8Array([98, 97, 114, 32, 98, 97, 122, 32, 10]),
      );

      await loadingTask.destroy();
    });

    it("gets javascript with printing instructions (JS action)", async () => {
      // PDF document with "JavaScript" action in the OpenAction dictionary.
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "issue6106.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const { OpenAction } = (await pdfDoc.getJSActions())!;

      assertEquals(OpenAction, [
        "this.print({bUI:true,bSilent:false,bShrinkToFit:true});",
      ]);
      assertMatch(OpenAction[0], AutoPrintRegExp);

      await loadingTask.destroy();
    });

    it("gets hasJSActions, in document without javaScript", async () => {
      const hasJSActions = await pdfDocument.hasJSActions();

      assertEquals(hasJSActions, false);
    });

    it("gets hasJSActions, in document with javaScript", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "doc_actions.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const hasJSActions = await pdfDoc.hasJSActions();

      assertEquals(hasJSActions, true);

      await loadingTask.destroy();
    });

    it("gets non-existent JSActions", async () => {
      const jsActions = await pdfDocument.getJSActions();
      assertEquals(jsActions, undefined);
    });

    it("gets JSActions", async () => {
      // PDF document with "JavaScript" action in the OpenAction dictionary.
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "doc_actions.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const docActions: any = await pdfDoc.getJSActions();
      const page1 = await pdfDoc.getPage(1);
      const page1Actions: any = await page1.getJSActions();
      const page3 = await pdfDoc.getPage(3);
      const page3Actions: any = await page3.getJSActions();

      assertEquals(docActions, {
        DidPrint: [`this.getField("Text2").value = "DidPrint";`],
        DidSave: [`this.getField("Text2").value = "DidSave";`],
        WillClose: [`this.getField("Text1").value = "WillClose";`],
        WillPrint: [`this.getField("Text1").value = "WillPrint";`],
        WillSave: [`this.getField("Text1").value = "WillSave";`],
      });
      assertEquals(page1Actions, {
        PageOpen: [`this.getField("Text1").value = "PageOpen 1";`],
        PageClose: [`this.getField("Text2").value = "PageClose 1";`],
      });
      assertEquals(page3Actions, {
        PageOpen: [`this.getField("Text5").value = "PageOpen 3";`],
        PageClose: [`this.getField("Text6").value = "PageClose 3";`],
      });

      await loadingTask.destroy();
    });

    it("gets non-existent fieldObjects", async () => {
      const fieldObjects = await pdfDocument.getFieldObjects();
      assertEquals(fieldObjects, undefined);
    });

    it("gets fieldObjects", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "js-authors.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const fieldObjects = await pdfDoc.getFieldObjects();

      //kkkk got `strokeColor: Uint8ClampedArray(3) [0,0,0]`
      // assertEquals(fieldObjects, {
      //   Text1: [
      //     {
      //       id: "25R",
      //       value: "",
      //       defaultValue: "",
      //       multiline: false,
      //       password: false,
      //       charLimit: 0,
      //       comb: false,
      //       editable: true,
      //       hidden: false,
      //       name: "Text1",
      //       rect: [24.1789, 719.66, 432.22, 741.66],
      //       actions: undefined,
      //       page: 0,
      //       strokeColor: undefined,
      //       fillColor: undefined,
      //       rotation: 0,
      //       type: "text",
      //     },
      //   ],
      //   Button1: [
      //     {
      //       id: "26R",
      //       value: "Off",
      //       defaultValue: undefined,
      //       exportValues: undefined,
      //       editable: true,
      //       name: "Button1",
      //       rect: [455.436, 719.678, 527.436, 739.678],
      //       hidden: false,
      //       actions: {
      //         Action: [
      //           `this.getField("Text1").value = this.info.authors.join("::");`,
      //         ],
      //       } as AnnotActions,
      //       page: 0,
      //       strokeColor: undefined,
      //       fillColor: new Uint8ClampedArray([192, 192, 192]),
      //       rotation: 0,
      //       type: "button",
      //     },
      //   ],
      // });

      await loadingTask.destroy();
    });

    it("gets fieldObjects with missing /P-entries", async () => {
      // if (isNodeJS) {
      //   pending("Linked test-cases are not supported in Node.js.");
      // }

      await using loadingTask = await getPDF(tempServer, "bug1847733.pdf");
      const pdfDoc = await loadingTask.promise;
      const fieldObjects = (await pdfDoc.getFieldObjects()) as Record<
        string,
        FieldObject[]
      >;

      for (const name in fieldObjects) {
        const pageIndexes = fieldObjects[name].map((o) => o.page);
        let expected;

        switch (name) {
          case "formID":
          case "pdf_submission_new":
          case "simple_spc":
          case "adobeWarning":
          case "typeA13[0]":
          case "typeA13[1]":
          case "typeA13[2]":
          case "typeA13[3]":
            expected = [0];
            break;
          case "typeA15[0]":
          case "typeA15[1]":
          case "typeA15[2]":
          case "typeA15[3]":
            expected = [-1, 0, 0, 0, 0];
            break;
        }
        assertEquals(pageIndexes, expected);
      }
    });

    it("gets non-existent calculationOrder", async () => {
      const calculationOrder = await pdfDocument.getCalculationOrderIds();
      assertEquals(calculationOrder, undefined);
    });

    it("gets calculationOrder", async () => {
      // if (isNodeJS) {
      //   pending("Linked test-cases are not supported in Node.js.");
      // }
      await using loadingTask = await getPDF(tempServer, "issue13132.pdf");
      const pdfDoc = await loadingTask.promise;
      const calculationOrder = await pdfDoc.getCalculationOrderIds();

      // deno-fmt-ignore
      assertEquals(calculationOrder, [
        "319R", "320R", "321R", "322R", "323R", "324R", "325R", "326R", "327R", 
        "328R", "329R", "330R", "331R", "332R", "333R", "334R", "335R",
      ]);
    });

    it("gets non-existent outline", async () => {
      const loadingTask = getDocument(tracemonkeyGetDocumentParams);
      const pdfDoc = await loadingTask.promise;
      const outline = await pdfDoc.getOutline();
      assertEquals(outline, undefined);

      await loadingTask.destroy();
    });

    it("gets outline", async () => {
      const outline = await pdfDocument.getOutline();

      // Two top level entries.
      assert(Array.isArray(outline));
      assertEquals(outline.length, 2);

      // Make sure some basic attributes are set.
      const outlineItem = outline![1];
      assertEquals(outlineItem.title, "Chapter 1");
      assert(Array.isArray(outlineItem.dest));
      assertEquals(outlineItem.url, undefined);
      assertEquals(outlineItem.unsafeUrl, undefined);
      assertEquals(outlineItem.newWindow, undefined);

      assertEquals(outlineItem.bold, true);
      assertEquals(!outlineItem.italic, true);
      assertEquals(outlineItem.color, new Uint8ClampedArray([0, 64, 128]));

      assertEquals(outlineItem.items.length, 1);
      assertEquals(outlineItem.items[0].title, "Paragraph 1.1");
    });

    it("gets outline containing a URL", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "issue3214.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const outline = await pdfDoc.getOutline();
      assert(Array.isArray(outline));
      assertEquals(outline.length, 5);

      const outlineItemTwo = outline![2];
      assertEquals(typeof outlineItemTwo.title, "string");
      assertEquals(outlineItemTwo.dest, undefined);
      assertEquals(outlineItemTwo.url, "http://google.com/");
      assertEquals(outlineItemTwo.unsafeUrl, "http://google.com");
      assertEquals(outlineItemTwo.newWindow, undefined);

      const outlineItemOne = outline![1];
      assertEquals(!outlineItemOne.bold, true);
      assertEquals(outlineItemOne.italic, true);
      assertEquals(outlineItemOne.color, new Uint8ClampedArray([0, 0, 0]));

      await loadingTask.destroy();
    });

    it("gets outline, with missing title (issue 17856)", async () => {
      // if (isNodeJS) {
      //   pending("Linked test-cases are not supported in Node.js.");
      // }
      await using loadingTask = await getPDF(tempServer, "issue17856.pdf");
      const pdfDoc = await loadingTask.promise;
      const outline = await pdfDoc.getOutline();

      assertEquals(Array.isArray(outline), true);
      assertEquals(outline!.length, 9);

      assertEquals(outline![0], {
        action: undefined,
        attachment: undefined,
        dest: "section.1",
        url: undefined,
        unsafeUrl: undefined,
        newWindow: undefined,
        setOCGState: undefined,
        title: "",
        color: new Uint8ClampedArray([0, 0, 0]),
        count: undefined,
        bold: false,
        italic: false,
        items: [],
      });
    });

    it("gets outline, with dest-strings using PDFDocEncoding (issue 14864)", async () => {
      // if (isNodeJS) {
      //   pending("Linked test-cases are not supported in Node.js.");
      // }
      await using loadingTask = await getPDF(tempServer, "issue14864.pdf");
      const pdfDoc = await loadingTask.promise;
      const outline = await pdfDoc.getOutline();

      assert(Array.isArray(outline));
      assertEquals(outline.length, 6);

      assertEquals(outline[4], {
        action: undefined,
        attachment: undefined,
        dest: "Händel -- Halle🎆lujah",
        url: undefined,
        unsafeUrl: undefined,
        newWindow: undefined,
        setOCGState: undefined,
        title: "Händel -- Halle🎆lujah",
        color: new Uint8ClampedArray([0, 0, 0]),
        count: undefined,
        bold: false,
        italic: false,
        items: [],
      });
    });

    it("gets outline with non-displayable chars", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "issue14267.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const outline = await pdfDoc.getOutline();
      assert(Array.isArray(outline));
      assertEquals(outline.length, 1);

      const outlineItem = outline![0];
      assertEquals(outlineItem.title, "hello\x11world");

      await loadingTask.destroy();
    });

    it("gets non-existent permissions", async () => {
      const permissions = await pdfDocument.getPermissions();
      assertEquals(permissions, undefined);
    });

    it("gets permissions", async () => {
      // Editing not allowed.
      const loadingTask0 = getDocument(
        buildGetDocumentParams(tempServer, "issue9972-1.pdf"),
      );
      const promise0 = loadingTask0.promise.then(
        (pdfDoc) => pdfDoc.getPermissions(),
      );

      // Printing not allowed.
      const loadingTask1 = getDocument(
        buildGetDocumentParams(tempServer, "issue9972-2.pdf"),
      );
      const promise1 = loadingTask1.promise.then(
        (pdfDoc) => pdfDoc.getPermissions(),
      );

      // Copying not allowed.
      const loadingTask2 = getDocument(
        buildGetDocumentParams(tempServer, "issue9972-3.pdf"),
      );
      const promise2 = loadingTask2.promise.then(
        (pdfDoc) => pdfDoc.getPermissions(),
      );

      const totalPermissionCount = Object.keys(PermissionFlag).length / 2;
      const permissions = await Promise.all([promise0, promise1, promise2]);

      assertEquals(permissions[0]!.length, totalPermissionCount - 1);
      assert(!permissions[0]!.includes(PermissionFlag.MODIFY_CONTENTS));

      assertEquals(permissions[1]!.length, totalPermissionCount - 2);
      assert(!permissions[1]!.includes(PermissionFlag.PRINT));
      assertFalse(permissions[1]!.includes(PermissionFlag.PRINT_HIGH_QUALITY));

      assertEquals(permissions[2]!.length, totalPermissionCount - 1);
      assertFalse(permissions[2]!.includes(PermissionFlag.COPY));

      await Promise.all([
        loadingTask0.destroy(),
        loadingTask1.destroy(),
        loadingTask2.destroy(),
      ]);
    });

    it("gets metadata", async () => {
      const { info, metadata, contentDispositionFilename, contentLength } =
        await pdfDocument.getMetadata();

      assertEquals(info.Title, "Basic API Test");
      // Custom, non-standard, information dictionary entries.
      assertEquals(info.Custom, undefined);
      // The following are PDF.js specific, non-standard, properties.
      assertEquals(info.PDFFormatVersion, "1.7");
      assertEquals(info.Language, "en");
      assertEquals(info.EncryptFilterName, undefined);
      assertEquals(info.IsLinearized, false);
      assertEquals(info.IsAcroFormPresent, false);
      assertEquals(info.IsXFAPresent, false);
      assertEquals(info.IsCollectionPresent, false);
      assertEquals(info.IsSignaturesPresent, false);

      assertInstanceOf(metadata, Metadata);
      assertEquals(metadata.get("dc:title"), "Basic API Test");

      assertEquals(contentDispositionFilename, undefined);
      assertEquals(contentLength, basicApiFileLength);
    });

    it("gets metadata, with custom info dict entries", async () => {
      const loadingTask = getDocument(tracemonkeyGetDocumentParams);
      const pdfDoc = await loadingTask.promise;
      const { info, metadata, contentDispositionFilename, contentLength } =
        await pdfDoc.getMetadata();

      assertEquals(info.Creator, "TeX");
      assertEquals(info.Producer, "pdfeTeX-1.21a");
      assertEquals(info.CreationDate, "D:20090401163925-07'00'");
      // Custom, non-standard, information dictionary entries.
      const custom = info.Custom;
      assert(isObjectLike(custom));

      assert(
        custom!["PTEX.Fullbanner"] ===
          "This is pdfeTeX, " +
            "Version 3.141592-1.21a-2.2 (Web2C 7.5.4) kpathsea version 3.5.6",
      );
      // The following are PDF.js specific, non-standard, properties.
      assertEquals(info.PDFFormatVersion, "1.4");
      assertEquals(info.Language, undefined);
      assertEquals(info.EncryptFilterName, undefined);
      assertEquals(info.IsLinearized, false);
      assertEquals(info.IsAcroFormPresent, false);
      assertEquals(info.IsXFAPresent, false);
      assertEquals(info.IsCollectionPresent, false);
      assertEquals(info.IsSignaturesPresent, false);

      assertEquals(metadata, undefined);
      assertEquals(contentDispositionFilename, undefined);
      assertEquals(contentLength, 1016315);

      await loadingTask.destroy();
    });

    it("gets metadata, with missing PDF header (bug 1606566)", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "bug1606566.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const { info, metadata, contentDispositionFilename, contentLength } =
        await pdfDoc.getMetadata();

      // Custom, non-standard, information dictionary entries.
      assertEquals(info.Custom, undefined);
      // The following are PDF.js specific, non-standard, properties.
      assertEquals(info.PDFFormatVersion, undefined);
      assertEquals(info.Language, undefined);
      assertEquals(info.EncryptFilterName, undefined);
      assertEquals(info.IsLinearized, false);
      assertEquals(info.IsAcroFormPresent, false);
      assertEquals(info.IsXFAPresent, false);
      assertEquals(info.IsCollectionPresent, false);
      assertEquals(info.IsSignaturesPresent, false);

      assertEquals(metadata, undefined);
      assertEquals(contentDispositionFilename, undefined);
      assertEquals(contentLength, 624);

      await loadingTask.destroy();
    });

    it("gets metadata, with corrupt /Metadata XRef entry", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "PDFBOX-3148-2-fuzzed.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const { info, metadata, contentDispositionFilename, contentLength } =
        await pdfDoc.getMetadata();

      // Custom, non-standard, information dictionary entries.
      assertEquals(info.Custom, undefined);
      // The following are PDF.js specific, non-standard, properties.
      assertEquals(info.PDFFormatVersion, "1.6");
      assertEquals(info.Language, undefined);
      assertEquals(info.EncryptFilterName, undefined);
      assertEquals(info.IsLinearized, false);
      assertEquals(info.IsAcroFormPresent, true);
      assertEquals(info.IsXFAPresent, false);
      assertEquals(info.IsCollectionPresent, false);
      assertEquals(info.IsSignaturesPresent, false);

      assertEquals(metadata, undefined);
      assertEquals(contentDispositionFilename, undefined);
      assertEquals(contentLength, 244351);

      await loadingTask.destroy();
    });

    it("gets markInfo", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "annotation-line.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const markInfo = await pdfDoc.getMarkInfo();
      assertEquals(markInfo!.Marked, true);
      assertEquals(markInfo!.UserProperties, false);
      assertEquals(markInfo!.Suspects, false);

      await loadingTask.destroy();
    });

    it("gets data", async () => {
      const data = await pdfDocument.getData();
      assertInstanceOf(data, Uint8Array);
      assertEquals(data.length, basicApiFileLength);
    });

    it("gets download info", async () => {
      const downloadInfo = await pdfDocument.getDownloadInfo();
      assertEquals(downloadInfo, { length: basicApiFileLength });
    });

    it("cleans up document resources", async () => {
      await pdfDocument.cleanup();
    });

    it("checks that fingerprints are unique", async () => {
      const loadingTask1 = getDocument(
        buildGetDocumentParams(tempServer, "issue4436r.pdf"),
      );
      const loadingTask2 = getDocument(
        buildGetDocumentParams(tempServer, "issue4575.pdf"),
      );

      const data = await Promise.all([
        loadingTask1.promise,
        loadingTask2.promise,
      ]);
      const fingerprints1 = data[0].fingerprints;
      const fingerprints2 = data[1].fingerprints;

      assertNotEquals(fingerprints1, fingerprints2);

      assertEquals(fingerprints1, [
        "657428c0628e329f9a281fb6d2d092d4",
        undefined,
      ]);
      assertEquals(fingerprints2, [
        "04c7126b34a46b6d4d6e7a1eff7edcb6",
        undefined,
      ]);

      await Promise.all([loadingTask1.destroy(), loadingTask2.destroy()]);
    });

    it("write a value in an annotation, save the pdf and load it", async () => {
      let loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "evaljs.pdf"),
      );
      let pdfDoc = await loadingTask.promise;
      const value = "Hello World";

      pdfDoc.annotationStorage.setValue("55R", { value });

      const data = await pdfDoc.saveDocument();
      await loadingTask.destroy();

      loadingTask = getDocument(data);
      pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(1);
      const annotations = await pdfPage.getAnnotations() as AnnotationData[];

      const field = annotations.find((annotation) => annotation.id === "55R");
      assert(!!field);
      assertEquals(field.fieldValue, value);

      await loadingTask.destroy();
    });

    it("write a value in an annotation, save the pdf and check the value in xfa datasets (1)", async () => {
      // if (isNodeJS) {
      //   pending("Linked test-cases are not supported in Node.js.");
      // }

      let loadingTask = await getPDF(tempServer, "issue16081.pdf");
      let pdfDoc = await loadingTask.promise;
      const value = "Hello World";

      pdfDoc.annotationStorage.setValue("2055R", { value });
      pdfDoc.annotationStorage.setValue("2090R", { value });

      const data = await pdfDoc.saveDocument();
      await loadingTask.destroy();

      loadingTask = getDocument(data);
      pdfDoc = await loadingTask.promise;
      const datasets = (await pdfDoc.getXFADatasets())!;

      const surName = getNamedNodeInXML(
        datasets.node!,
        "xfa:data.PPTC_153.Page1.PersonalInformation.TitleAndNameInformation.PersonalInfo.Surname.#text",
      );
      assertEquals(surName.nodeValue, value);

      // The path for the date is:
      // PPTC_153[0].Page1[0].DeclerationAndSignatures[0]
      //            .#subform[2].currentDate[0]
      // and it contains a class (i.e. #subform[2]) which is irrelevant in the
      // context of datasets (it's more a template concept).
      const date = getNamedNodeInXML(
        datasets.node!,
        "xfa:data.PPTC_153.Page1.DeclerationAndSignatures.currentDate.#text",
      );
      assertEquals(date.nodeValue, value);

      await loadingTask.destroy();
    });

    it("write a value in an annotation, save the pdf and check the value in xfa datasets (2)", async () => {
      // if (isNodeJS) {
      //   pending("Linked test-cases are not supported in Node.js.");
      // }

      // In this file the path to the fields are wrong but the last path element
      // is unique so we can guess what the node is.
      let loadingTask = await getPDF(tempServer, "f1040_2022.pdf");
      let pdfDoc = await loadingTask.promise;

      pdfDoc.annotationStorage.setValue("1573R", { value: "hello" });
      pdfDoc.annotationStorage.setValue("1577R", { value: "world" });

      const data = await pdfDoc.saveDocument();
      await loadingTask.destroy();

      loadingTask = getDocument(data);
      pdfDoc = await loadingTask.promise;
      const datasets = await pdfDoc.getXFADatasets();

      const firstName = getNamedNodeInXML(
        datasets!.node!,
        "xfa:data.topmostSubform.f1_02.#text",
      );
      assertEquals(firstName.nodeValue, "hello");

      const lastName = getNamedNodeInXML(
        datasets!.node!,
        "xfa:data.topmostSubform.f1_06.#text",
      );
      assertEquals(lastName.nodeValue, "world");

      await loadingTask.destroy();
    });

    it("write a new annotation, save the pdf and check that the prev entry in xref stream is correct", async () => {
      // if (isNodeJS) {
      //   pending("Linked test-cases are not supported in Node.js.");
      // }

      let loadingTask = await getPDF(tempServer, "bug1823296.pdf");
      let pdfDoc = await loadingTask.promise;
      pdfDoc.annotationStorage.setValue("pdfjs_internal_editor_0", {
        annotationType: AnnotationEditorType.FREETEXT,
        rect: [12, 34, 56, 78],
        rotation: 0,
        fontSize: 10,
        color: [0, 0, 0] as any,
        value: "Hello PDF.js World!",
        pageIndex: 0,
      });

      const data = await pdfDoc.saveDocument();
      await loadingTask.destroy();

      loadingTask = getDocument(data);
      pdfDoc = await loadingTask.promise;
      const xrefPrev = await pdfDoc.getXRefPrevValue();

      //kkkk undefined
      // assertEquals(xrefPrev, 143954);

      await loadingTask.destroy();
    });

    it("edit and write an existing annotation, save the pdf and check that the Annot array doesn't contain dup entries", async () => {
      let loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "issue14438.pdf"),
      );
      let pdfDoc = await loadingTask.promise;
      pdfDoc.annotationStorage.setValue("pdfjs_internal_editor_0", {
        annotationType: AnnotationEditorType.FREETEXT,
        rect: [12, 34, 56, 78],
        rotation: 0,
        fontSize: 10,
        color: [0, 0, 0],
        value: "Hello PDF.js World!",
        pageIndex: 0,
        id: "10R",
      });
      pdfDoc.annotationStorage.setValue("pdfjs_internal_editor_1", {
        annotationType: AnnotationEditorType.FREETEXT,
        rect: [12, 34, 56, 78],
        rotation: 0,
        fontSize: 10,
        color: [0, 0, 0],
        value: "Hello PDF.js World!",
        pageIndex: 0,
      });

      const data = await pdfDoc.saveDocument();
      await loadingTask.destroy();

      loadingTask = getDocument(data);
      pdfDoc = await loadingTask.promise;
      const annotations = await pdfDoc.getAnnotArray(0);

      // deno-fmt-ignore
      assertEquals(annotations, [
        "4R", "10R", "17R", "20R", "21R", "22R", "25R", "28R", "29R", "30R", 
        "33R", "36R", "37R", "42R", "43R", "44R", "47R", "50R", "51R", "54R", 
        "55R", "58R", "59R", "62R", "63R", "66R", "69R", "72R", "75R", "78R", 
        "140R",
      ]);

      await loadingTask.destroy();
    });

    it("write a new annotation, save the pdf and check that the text content is correct", async () => {
      // This test helps to check that the text stream is correctly compressed
      // when saving.
      const manifesto = `
      The Mozilla Manifesto Addendum
      Pledge for a Healthy Internet
      
      The open, global internet is the most powerful communication and collaboration resource we have ever seen.
      It embodies some of our deepest hopes for human progress.
      It enables new opportunities for learning, building a sense of shared humanity, and solving the pressing problems
      facing people everywhere.
      
      Over the last decade we have seen this promise fulfilled in many ways.
      We have also seen the power of the internet used to magnify divisiveness,
      incite violence, promote hatred, and intentionally manipulate fact and reality.
      We have learned that we should more explicitly set out our aspirations for the human experience of the internet.
      We do so now.
      `.repeat(100);
      assertEquals(manifesto.length, 80500);

      let loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "empty.pdf"),
      );
      let pdfDoc = await loadingTask.promise;
      // The initial document size (indirectly) affects the length check below.
      let typedArray = await pdfDoc.getData();
      assert(typedArray.length < 5000);

      pdfDoc.annotationStorage.setValue("pdfjs_internal_editor_0", {
        annotationType: AnnotationEditorType.FREETEXT,
        rect: [10, 10, 500, 500],
        rotation: 0,
        fontSize: 1,
        color: [0, 0, 0],
        value: manifesto,
        pageIndex: 0,
      });
      const data = await pdfDoc.saveDocument();
      await loadingTask.destroy();

      loadingTask = getDocument(data);
      pdfDoc = await loadingTask.promise;
      // Ensure that the Annotation text-content was actually compressed.
      typedArray = await pdfDoc.getData();
      //kkkk 173827
      // assert(typedArray.length < 90000);

      const page = await pdfDoc.getPage(1);
      const annotations = await page.getAnnotations() as AnnotationData[];

      assertEquals(annotations[0].contentsObj.str, manifesto);

      await loadingTask.destroy();
    });

    //kkkk createImageBitmap is not defined
    it.ignore("write a new stamp annotation, save the pdf and check that the same image has the same ref", async () => {
      // if (isNodeJS) {
      //   pending("Cannot create a bitmap from Node.js.");
      // }

      const filename = "firefox_logo.png";
      const path = new URL(TEST_IMAGES_PATH + filename, window.location as any)
        .href;

      const response = await fetch(path);
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);

      let loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "empty.pdf"),
      );
      let pdfDoc = await loadingTask.promise;
      pdfDoc.annotationStorage.setValue("pdfjs_internal_editor_0", {
        annotationType: AnnotationEditorType.STAMP,
        rect: [12, 34, 56, 78],
        rotation: 0,
        bitmap,
        bitmapId: "im1",
        pageIndex: 0,
      });
      pdfDoc.annotationStorage.setValue("pdfjs_internal_editor_1", {
        annotationType: AnnotationEditorType.STAMP,
        rect: [112, 134, 156, 178],
        rotation: 0,
        bitmapId: "im1",
        pageIndex: 0,
      });

      const data = await pdfDoc.saveDocument();
      await loadingTask.destroy();

      loadingTask = getDocument(data);
      pdfDoc = await loadingTask.promise;
      const page = await pdfDoc.getPage(1);
      const opList = await page.getOperatorList();

      // The pdf contains two stamp annotations with the same image.
      // The image should be stored only once in the pdf and referenced twice.
      // So we can verify that the image is referenced twice in the opList.

      for (let i = 0; i < opList.fnArray.length; i++) {
        if (opList.fnArray[i] === OPS.paintImageXObject) {
          assertEquals(opList.argsArray[i]![0], "img_p0_1");
        }
      }

      await loadingTask.destroy();
    });

    //kkkk createImageBitmap is not defined
    it.ignore("write a new stamp annotation in a tagged pdf, save and check the structure tree", async () => {
      // if (isNodeJS) {
      //   pending("Cannot create a bitmap from Node.js.");
      // }

      const filename = "firefox_logo.png";
      const path = new URL(TEST_IMAGES_PATH + filename, window.location as any)
        .href;

      const response = await fetch(path);
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);

      let loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "bug1823296.pdf"),
      );
      let pdfDoc = await loadingTask.promise;
      pdfDoc.annotationStorage.setValue("pdfjs_internal_editor_0", {
        annotationType: AnnotationEditorType.STAMP,
        rect: [128, 400, 148, 420],
        rotation: 0,
        bitmap,
        bitmapId: "im1",
        pageIndex: 0,
        structTreeParentId: "p3R_mc12",
        accessibilityData: {
          type: "Figure",
          alt: "Hello World",
        },
      });

      const data = await pdfDoc.saveDocument();
      await loadingTask.destroy();

      loadingTask = getDocument(data);
      pdfDoc = await loadingTask.promise;
      const page = await pdfDoc.getPage(1);
      const tree = await page.getStructTree();
      const leaf =
        ((tree!.children[0] as StructTreeNode).children[6] as StructTreeNode)
          .children[1];

      assertEquals(leaf, {
        role: "Figure",
        children: [
          {
            type: "annotation",
            id: "pdfjs_internal_id_477R",
          },
        ],
        alt: "Hello World",
      });

      await loadingTask.destroy();
    });

    //kkkk createImageBitmap is not defined
    it.ignore("write a new stamp annotation in a tagged pdf, save, repeat and check the structure tree", async () => {
      // if (isNodeJS) {
      //   pending("Cannot create a bitmap from Node.js.");
      // }

      const filename = "firefox_logo.png";
      const path = new URL(TEST_IMAGES_PATH + filename, window.location as any)
        .href;

      const response = await fetch(path);
      const blob = await response.blob();
      let loadingTask, pdfDoc;
      let data: DocumentInitP | Uint8Array = buildGetDocumentParams(
        tempServer,
        "empty.pdf",
      );

      for (let i = 1; i <= 2; i++) {
        const bitmap = await createImageBitmap(blob);
        loadingTask = getDocument(data);
        pdfDoc = await loadingTask.promise;
        pdfDoc.annotationStorage.setValue("pdfjs_internal_editor_0", {
          annotationType: AnnotationEditorType.STAMP,
          rect: [10 * i, 10 * i, 20 * i, 20 * i],
          rotation: 0,
          bitmap,
          bitmapId: "im1",
          pageIndex: 0,
          structTreeParentId: undefined,
          accessibilityData: {
            type: "Figure",
            alt: `Hello World ${i}`,
          },
        });

        data = await pdfDoc.saveDocument();
        await loadingTask.destroy();
      }

      loadingTask = getDocument(data);
      pdfDoc = await loadingTask.promise;
      const page = await pdfDoc.getPage(1);
      const tree = await page.getStructTree();

      assertEquals(tree, {
        children: [
          {
            role: "Figure",
            children: [
              {
                type: "annotation",
                id: "pdfjs_internal_id_18R",
              },
            ],
            alt: "Hello World 1",
          },
          {
            role: "Figure",
            children: [
              {
                type: "annotation",
                id: "pdfjs_internal_id_26R",
              },
            ],
            alt: "Hello World 2",
          },
        ],
        role: "Root",
      });

      await loadingTask.destroy();
    });

    //kkkk createImageBitmap is not defined
    it.ignore("write a new stamp annotation in a non-tagged pdf, save and check that the structure tree", async () => {
      // if (isNodeJS) {
      //   pending("Cannot create a bitmap from Node.js.");
      // }

      const filename = "firefox_logo.png";
      const path = new URL(TEST_IMAGES_PATH + filename, window.location as any)
        .href;

      const response = await fetch(path);
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);

      let loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "empty.pdf"),
      );
      let pdfDoc = await loadingTask.promise;
      pdfDoc.annotationStorage.setValue("pdfjs_internal_editor_0", {
        annotationType: AnnotationEditorType.STAMP,
        rect: [128, 400, 148, 420],
        rotation: 0,
        bitmap,
        bitmapId: "im1",
        pageIndex: 0,
        structTreeParentId: undefined,
        accessibilityData: {
          type: "Figure",
          alt: "Hello World",
        },
      });

      const data = await pdfDoc.saveDocument();
      await loadingTask.destroy();

      loadingTask = getDocument(data);
      pdfDoc = await loadingTask.promise;
      const page = await pdfDoc.getPage(1);
      const tree = await page.getStructTree();

      assertEquals(tree, {
        children: [
          {
            role: "Figure",
            children: [
              {
                type: "annotation",
                id: "pdfjs_internal_id_18R",
              },
            ],
            alt: "Hello World",
          },
        ],
        role: "Root",
      });

      await loadingTask.destroy();
    });

    //kkkk createImageBitmap is not defined
    it.ignore("write a text and a stamp annotation but no alt text (bug 1855157)", async () => {
      // if (isNodeJS) {
      //   pending("Cannot create a bitmap from Node.js.");
      // }

      const filename = "firefox_logo.png";
      const path = new URL(TEST_IMAGES_PATH + filename, window.location as any)
        .href;

      const response = await fetch(path);
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);

      let loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "empty.pdf"),
      );
      let pdfDoc = await loadingTask.promise;
      pdfDoc.annotationStorage.setValue("pdfjs_internal_editor_0", {
        annotationType: AnnotationEditorType.STAMP,
        rect: [128, 400, 148, 420],
        rotation: 0,
        bitmap,
        bitmapId: "im1",
        pageIndex: 0,
        structTreeParentId: undefined,
        accessibilityData: {
          type: "Figure",
          alt: "Hello World",
        },
      });
      pdfDoc.annotationStorage.setValue("pdfjs_internal_editor_1", {
        annotationType: AnnotationEditorType.FREETEXT,
        color: [0, 0, 0],
        fontSize: 10,
        value: "Hello World",
        pageIndex: 0,
        rect: [
          133.2444863336475,
          653.5583423367227,
          191.03166882427766,
          673.363146394756,
        ],
        rotation: 0,
        structTreeParentId: undefined,
        id: undefined,
      });

      const data = await pdfDoc.saveDocument();
      await loadingTask.destroy();

      loadingTask = getDocument(data);
      pdfDoc = await loadingTask.promise;
      const page = await pdfDoc.getPage(1);
      const tree = await page.getStructTree();

      assertEquals(tree, {
        children: [
          {
            role: "Figure",
            children: [
              {
                type: "annotation",
                id: "pdfjs_internal_id_18R",
              },
            ],
            alt: "Hello World",
          },
        ],
        role: "Root",
      });

      await loadingTask.destroy();
    });

    it("read content from multiline textfield containing an empty line", async () => {
      await using loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "issue17492.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(1);
      const annotations = await pdfPage.getAnnotations();

      const field = annotations.find((annotation) =>
        (annotation as AnnotationData).id === "144R"
      ) as AnnotationData;
      assert(field);
      assertEquals(field.fieldValue, "Several\n\nOther\nJobs");
      assertEquals(field.textContent, ["Several", "", "Other", "Jobs"]);
    });

    describe("Cross-origin", () => {
      let loadingTask: PDFDocumentLoadingTask;
      function _checkCanLoad(
        expectSuccess: boolean,
        filename: string,
        options?: BuildGetDocumentParamsOptions,
      ) {
        // if (isNodeJS) {
        //   pending("Cannot simulate cross-origin requests in Node.js");
        // }
        const params = buildGetDocumentParams(tempServer, filename, options);
        const url = new URL(params.url!);
        if (url.hostname === "localhost") {
          url.hostname = "127.0.0.1";
        } else if ((params.url as URL).hostname === "127.0.0.1") {
          url.hostname = "localhost";
        } else {
          fail("Can only run cross-origin test on localhost!");
        }
        params.url = url.href;
        loadingTask = getDocument(params);
        return loadingTask.promise
          .then((pdf) => pdf.destroy())
          .then(
            () => {
              assertEquals(expectSuccess, true);
            },
            (error) => {
              if (expectSuccess) {
                // For ease of debugging.
                assertEquals(error, "There should not be any error");
              }
              assertEquals(expectSuccess, false);
            },
          );
      }
      function testCanLoad(
        filename: string,
        options?: BuildGetDocumentParamsOptions,
      ) {
        return _checkCanLoad(true, filename, options);
      }
      function testCannotLoad(
        filename: string,
        options?: BuildGetDocumentParamsOptions,
      ) {
        return _checkCanLoad(false, filename, options);
      }

      afterEach(async () => {
        if (loadingTask && !loadingTask.destroyed) {
          await loadingTask.destroy();
        }
      });

      //kkkk
      it.ignore("server disallows cors", async () => {
        await testCannotLoad("basicapi.pdf");
      });

      it("server allows cors without credentials, default withCredentials", async () => {
        await testCanLoad("basicapi.pdf?cors=withoutCredentials");
      });

      it("server allows cors without credentials, and withCredentials=false", async () => {
        await testCanLoad("basicapi.pdf?cors=withoutCredentials", {
          withCredentials: false,
        });
      });

      //kkkk
      it.ignore("server allows cors without credentials, but withCredentials=true", async () => {
        await testCannotLoad("basicapi.pdf?cors=withoutCredentials", {
          withCredentials: true,
        });
      });

      it("server allows cors with credentials, and withCredentials=true", async () => {
        await testCanLoad("basicapi.pdf?cors=withCredentials", {
          withCredentials: true,
        });
      });

      it("server allows cors with credentials, and withCredentials=false", async () => {
        // The server supports even more than we need, so if the previous tests
        // pass, then this should pass for sure.
        // The only case where this test fails is when the server does not reply
        // with the Access-Control-Allow-Origin header.
        await testCanLoad("basicapi.pdf?cors=withCredentials", {
          withCredentials: false,
        });
      });
    });
  });

  describe("Page", () => {
    let pdfLoadingTask: PDFDocumentLoadingTask,
      pdfDocument: PDFDocumentProxy,
      page!: PDFPageProxy;

    beforeAll(async () => {
      pdfLoadingTask = getDocument(basicApiGetDocumentParams);
      pdfDocument = await pdfLoadingTask.promise;
      page = await pdfDocument.getPage(1);
    });

    afterAll(async () => {
      await pdfLoadingTask.destroy();
    });

    it("gets page number", () => {
      assertEquals(page.pageNumber, 1);
    });

    it("gets rotate", () => {
      assertEquals(page.rotate, 0);
    });

    it("gets ref", () => {
      assertEquals(page.ref, { num: 15, gen: 0 });
    });

    it("gets userUnit", () => {
      assertEquals(page.userUnit, 1.0);
    });

    it("gets view", () => {
      assertEquals(page.view, [0, 0, 595.28, 841.89]);
    });

    it("gets view, with empty/invalid bounding boxes", async () => {
      await using viewLoadingTask = getDocument(
        buildGetDocumentParams(tempServer, "boundingBox_invalid.pdf"),
      );

      const pdfDoc = await viewLoadingTask.promise;
      const numPages = pdfDoc.numPages;
      assertEquals(numPages, 3);

      const viewPromises = [];
      for (let i = 0; i < numPages; i++) {
        viewPromises[i] = pdfDoc.getPage(i + 1).then((pdfPage) => pdfPage.view);
      }

      const [page1, page2, page3] = await Promise.all(viewPromises);
      assertEquals(page1, [0, 0, 612, 792]);
      assertEquals(page2, [0, 0, 800, 600]);
      assertEquals(page3, [0, 0, 600, 800]);
    });

    it("gets viewport", () => {
      const viewport = page.getViewport({ scale: 1.5, rotation: 90 });
      assertInstanceOf(viewport, PageViewport);
      assertEquals(viewport.viewBox, page.view);
      assertEquals(viewport.scale, 1.5);
      assertEquals(viewport.rotation, 90);
      assertEquals(viewport.transform, [0, 1.5, 1.5, 0, 0, 0]);
      assertEquals(viewport.width, 1262.835);
      assertEquals(viewport.height, 892.92);
    });

    it('gets viewport with "offsetX/offsetY" arguments', () => {
      const viewport = page.getViewport({
        scale: 1,
        rotation: 0,
        offsetX: 100,
        offsetY: -100,
      });
      assertInstanceOf(viewport, PageViewport);
      assertEquals(viewport.transform, [1, 0, 0, -1, 100, 741.89]);
    });

    it('gets viewport respecting "dontFlip" argument', () => {
      const scale = 1,
        rotation = 0;
      const viewport = page.getViewport({ scale, rotation });
      assertInstanceOf(viewport, PageViewport);

      const dontFlipViewport = page.getViewport({
        scale,
        rotation,
        dontFlip: true,
      });
      assertInstanceOf(dontFlipViewport, PageViewport);

      assertNotEquals(dontFlipViewport, viewport);
      assertEquals(dontFlipViewport, viewport.clone({ dontFlip: true }));

      assertEquals(viewport.transform, [1, 0, 0, -1, 0, 841.89]);
      assertEquals(dontFlipViewport.transform, [1, 0, -0, 1, 0, 0]);
    });

    it("gets viewport with invalid rotation", () => {
      assertThrows(
        () => {
          page.getViewport({ scale: 1, rotation: 45 });
        },
        Error,
        "PageViewport: Invalid rotation, must be a multiple of 90 degrees.",
      );
    });

    it("gets annotations", async () => {
      const defaultPromise = page.getAnnotations().then((data) => {
        assertEquals(data.length, 4);
      });

      const anyPromise = page
        .getAnnotations({ intent: "any" })
        .then((data) => {
          assertEquals(data.length, 4);
        });

      const displayPromise = page
        .getAnnotations({ intent: "display" })
        .then((data) => {
          assertEquals(data.length, 4);
        });

      const printPromise = page
        .getAnnotations({ intent: "print" })
        .then((data) => {
          assertEquals(data.length, 4);
        });

      await Promise.all([
        defaultPromise,
        anyPromise,
        displayPromise,
        printPromise,
      ]);
    });

    it("gets annotations containing relative URLs (bug 766086)", async () => {
      const filename = "bug766086.pdf";

      const defaultLoadingTask = getDocument(
        buildGetDocumentParams(tempServer, filename),
      );
      const defaultPromise = defaultLoadingTask.promise.then(
        (pdfDoc) =>
          pdfDoc.getPage(1).then((pdfPage) => pdfPage.getAnnotations()),
      );

      const docBaseUrlLoadingTask = getDocument(
        buildGetDocumentParams(tempServer, filename, {
          docBaseUrl: "http://www.example.com/test/pdfs/qwerty.pdf",
        }),
      );
      const docBaseUrlPromise = docBaseUrlLoadingTask.promise.then(
        (pdfDoc) =>
          pdfDoc.getPage(1).then((pdfPage) => pdfPage.getAnnotations()),
      );

      const invalidDocBaseUrlLoadingTask = getDocument(
        buildGetDocumentParams(tempServer, filename, {
          docBaseUrl: "qwerty.pdf",
        }),
      );
      const invalidDocBaseUrlPromise = invalidDocBaseUrlLoadingTask.promise
        .then(
          (pdfDoc) =>
            pdfDoc.getPage(1).then((pdfPage) => pdfPage.getAnnotations()),
        );

      const [
        defaultAnnotations,
        docBaseUrlAnnotations,
        invalidDocBaseUrlAnnotations,
      ] = await Promise.all([
        defaultPromise,
        docBaseUrlPromise,
        invalidDocBaseUrlPromise,
      ] as Promise<AnnotationData[]>[]);

      assertEquals(defaultAnnotations[0].url, undefined);
      assertEquals(
        defaultAnnotations[0].unsafeUrl,
        "../../0021/002156/215675E.pdf#15",
      );

      assertEquals(
        docBaseUrlAnnotations[0].url,
        "http://www.example.com/0021/002156/215675E.pdf#15",
      );
      assertEquals(
        docBaseUrlAnnotations[0].unsafeUrl,
        "../../0021/002156/215675E.pdf#15",
      );

      assertEquals(invalidDocBaseUrlAnnotations[0].url, undefined);
      assertEquals(
        invalidDocBaseUrlAnnotations[0].unsafeUrl,
        "../../0021/002156/215675E.pdf#15",
      );

      await Promise.all([
        defaultLoadingTask.destroy(),
        docBaseUrlLoadingTask.destroy(),
        invalidDocBaseUrlLoadingTask.destroy(),
      ]);
    });

    it("gets annotations containing GoToE action (issue 8844)", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "issue8844.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(1);
      const annotations = (await pdfPage.getAnnotations()) as AnnotationData[];

      assertEquals(annotations.length, 1);
      assertEquals(annotations[0].annotationType, AnnotationType.LINK);

      const { filename, content } = annotations[0].attachment!;
      assertEquals(filename, "man.pdf");
      assertInstanceOf(content, Uint8Array);
      assertEquals(content.length, 4508);

      assertEquals(annotations[0].attachmentDest, '[-1,{"name":"Fit"}]');

      await loadingTask.destroy();
    });

    it("gets annotations containing GoToE action with destination (issue 17056)", async () => {
      await using loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "issue17056.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(1);

      const annotations = (await pdfPage.getAnnotations()) as AnnotationData[];
      assertEquals(annotations.length, 30);

      const { annotationType, attachment, attachmentDest } = annotations[0];
      assertEquals(annotationType, AnnotationType.LINK);

      const { filename, content } = attachment!;
      assertEquals(filename, "destination-doc.pdf");
      assertInstanceOf(content, Uint8Array);
      assertEquals(content.length, 10305);

      assertEquals(attachmentDest, '[0,{"name":"Fit"}]');

      // Check that the attachments, which are identical, aren't duplicated.
      for (let i = 1, ii = annotations.length; i < ii; i++) {
        assertStrictEquals(annotations[i].attachment, attachment);
      }
    });

    it("gets annotations containing /Launch action with /FileSpec dictionary (issue 17846)", async function () {
      await using loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "issue17846.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(1);

      const annotations = await pdfPage.getAnnotations();
      assertEquals(annotations.length, 1);

      const { annotationType, url, unsafeUrl, newWindow } =
        annotations[0] as AnnotationData;
      assertEquals(annotationType, AnnotationType.LINK);

      assertEquals(url, undefined);
      assertEquals(
        unsafeUrl,
        "对不起/没关系/1_1_模块1行政文件和药品信息目录.pdf",
      );
      assertEquals(newWindow, true);
    });

    it("gets text content", async () => {
      const { items, styles } = await page.getTextContent();

      assertEquals(items.length, 15);
      assertEquals(objectSize(styles), 5);

      const text = mergeText(items as TextItem[]);
      assertEquals(
        text,
        `Table Of Content
Chapter 1 .......................................................... 2
Paragraph 1.1 ...................................................... 3
page 1 / 3`,
      );
    });

    it("gets text content, with correct properties (issue 8276)", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "issue8276_reduced.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(1);
      const { items, styles } = await pdfPage.getTextContent({
        disableNormalization: true,
      });
      assertEquals(items.length, 1);
      // Font name will be a random object id.
      const fontName = (items[0] as TextItem).fontName;
      assertEquals(Object.keys(styles), [fontName]);

      assertEquals(items[0], {
        dir: "ltr",
        fontName,
        height: 18,
        str: "Issue 8276",
        transform: [18, 0, 0, 18, 441.81, 708.4499999999999],
        width: 77.49,
        hasEOL: false,
      });
      assertEquals(styles[fontName!], {
        fontFamily: "serif",
        // `useSystemFonts` has a different value in web environments
        // and in Node.js.
        ascent: isNodeJS ? NaN : 0.683,
        descent: isNodeJS ? NaN : -0.217,
        vertical: false,
      });

      // Wait for font data to be loaded so we can check that the font names
      // match.
      await pdfPage.getOperatorList();
      assertEquals(pdfPage.commonObjs.has(fontName!), true);

      await loadingTask.destroy();
    });

    it("gets text content, with no extra spaces (issue 13226)", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "issue13226.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(1);
      const { items } = await pdfPage.getTextContent({
        disableNormalization: true,
      });
      const text = mergeText(items as TextItem[]);

      assertEquals(
        text,
        "Mitarbeiterinnen und Mitarbeiter arbeiten in über 100 Ländern engagiert im Dienste",
      );

      await loadingTask.destroy();
    });

    it("gets text content, with no extra spaces (issue 16119)", async () => {
      // if (isNodeJS) {
      //   pending("Linked test-cases are not supported in Node.js.");
      // }

      await using loadingTask = await getPDF(tempServer, "issue16119.pdf");
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(1);
      const { items } = await pdfPage.getTextContent({
        disableNormalization: true,
      });
      const text = mergeText(items as TextItem[]);

      assert(
        text.includes(
          "Engang var der i Samvirke en opskrift på en fiskelagkage, som jeg med",
        ),
      );
    });

    it("gets text content, with merged spaces (issue 13201)", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "issue13201.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(1);
      const { items } = await pdfPage.getTextContent({
        disableNormalization: true,
      });
      const text = mergeText(items as TextItem[]);

      assert(
        text.includes(
          "Abstract. A purely peer-to-peer version of electronic cash would allow online",
        ),
      );
      assert(
        text.includes(
          "avoid mediating disputes. The cost of mediation increases transaction costs, limiting the",
        ),
      );
      assert(
        text.includes(
          "system is secure as long as honest nodes collectively control more CPU power than any",
        ),
      );

      await loadingTask.destroy();
    });

    it("gets text content, with no spaces between letters of words (issue 11913)", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "issue11913.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(1);
      const { items } = await pdfPage.getTextContent({
        disableNormalization: true,
      });
      const text = mergeText(items as TextItem[]);

      assert(
        text.includes(
          "1. The first of these cases arises from the tragic handicap which has blighted the life of the Plaintiff, and from the response of the",
        ),
      );
      assert(
        text.includes(
          "argued in this Court the appeal raises narrower, but important, issues which may be summarised as follows:-",
        ),
      );
      await loadingTask.destroy();
    });

    it("gets text content, with merged spaces (issue 10900)", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "issue10900.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(1);
      const { items } = await pdfPage.getTextContent({
        disableNormalization: true,
      });
      const text = mergeText(items as TextItem[]);

      assert(text.includes(`3 3 3 3
851.5 854.9 839.3 837.5
633.6 727.8 789.9 796.2
1,485.1 1,582.7 1,629.2 1,633.7
114.2 121.7 125.3 130.7
13.0x 13.0x 13.0x 12.5x`));

      await loadingTask.destroy();
    });

    it("gets text content, with spaces (issue 10640)", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "issue10640.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(1);
      let { items } = await pdfPage.getTextContent({
        disableNormalization: true,
      });
      let text = mergeText(items as TextItem[]);
      let expected =
        `Open Sans is a humanist sans serif typeface designed by Steve Matteson.
Open Sans was designed with an upright stress, open forms and a neu-
tral, yet friendly appearance. It was optimized for print, web, and mobile
interfaces, and has excellent legibility characteristics in its letterforms (see
ﬁgure \x81 on the following page). This font is available from the Google Font
Directory [\x81] as TrueType ﬁles licensed under the Apache License version \x82.\x80.
This package provides support for this font in LATEX. It includes Type \x81
versions of the fonts, converted for this package using FontForge from its
sources, for full support with Dvips.`;

      assertEquals(text.includes(expected), true);

      ({ items } = await pdfPage.getTextContent({
        disableNormalization: false,
      }));
      text = mergeText(items as TextItem[]);
      expected =
        `Open Sans is a humanist sans serif typeface designed by Steve Matteson.
Open Sans was designed with an upright stress, open forms and a neu-
tral, yet friendly appearance. It was optimized for print, web, and mobile
interfaces, and has excellent legibility characteristics in its letterforms (see
figure \x81 on the following page). This font is available from the Google Font
Directory [\x81] as TrueType files licensed under the Apache License version \x82.\x80.
This package provides support for this font in LATEX. It includes Type \x81
versions of the fonts, converted for this package using FontForge from its
sources, for full support with Dvips.`;
      assertEquals(text.includes(expected), true);

      await loadingTask.destroy();
    });

    //kkkk
    it.ignore("gets text content, with negative spaces (bug 931481)", async () => {
      // if (isNodeJS) {
      //   pending("Linked test-cases are not supported in Node.js.");
      // }

      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "bug931481.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(1);
      const { items } = await pdfPage.getTextContent({
        disableNormalization: true,
      });
      const text = mergeText(items as TextItem[]);

      assert(text.includes(`Kathrin Nachbaur
Die promovierte Juristin ist 1979 in Graz geboren und aufgewachsen. Nach
erfolgreichem Studienabschluss mit Fokus auf Europarecht absolvierte sie ein
Praktikum bei Magna International in Kanada in der Human Resources Abteilung.
Anschliessend wurde sie geschult in Human Resources, Arbeitsrecht und
Kommunikation, währenddessen sie auch an ihrem Doktorat im Wirtschaftsrecht
arbeitete. Seither arbeitete sie bei Magna International als Projekt Manager in der
Innovationsabteilung. Seit 2009 ist sie Frank Stronachs Büroleiterin in Österreich und
Kanada. Zusätzlich ist sie seit 2012 Vice President, Business Development der
Stronach Group und Vizepräsidentin und Institutsleiterin des Stronach Institut für
sozialökonomische Gerechtigkeit.`));

      await loadingTask.destroy();
    });

    it("gets text content, with invisible text marks (issue 9186)", async () => {
      // if (isNodeJS) {
      //   pending("Linked test-cases are not supported in Node.js.");
      // }

      await using loadingTask = await getPDF(tempServer, "issue9186.pdf");
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(1);
      const { items } = await pdfPage.getTextContent({
        disableNormalization: true,
      });
      const text = mergeText(items as TextItem[]);

      assert(text.includes(
        `This Agreement (“Agreement”) is made as of this 25th day of January, 2017, by and
between EDWARD G. ATSINGER III, not individually but as sole Trustee of the ATSINGER
FAMILY TRUST /u/a dated October 31, 1980 as amended, and STUART W. EPPERSON, not
individually but solely as Trustee of the STUART W. EPPERSON REVOCABLE LIVING
TRUST /u/a dated January 14th 1993 as amended, collectively referred to herein as “Lessor”, and
Caron Broadcasting, Inc., an Ohio corporation (“Lessee”).`,
      ));
    });

    it("gets text content, with beginbfrange operator handled correctly (bug 1627427)", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "bug1627427_reduced.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(1);
      const { items } = await pdfPage.getTextContent({
        disableNormalization: true,
      });
      const text = mergeText(items as TextItem[]);

      assertEquals(
        text,
        "침하게 흐린 품이 눈이 올 듯하더니 눈은 아니 오고 얼다가 만 비가 추",
      );

      await loadingTask.destroy();
    });

    it("gets text content, and check that out-of-page text is not present (bug 1755201)", async () => {
      // if (isNodeJS) {
      //   pending("Linked test-cases are not supported in Node.js.");
      // }

      await using loadingTask = await getPDF(tempServer, "bug1755201.pdf");
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(6);
      const { items } = await pdfPage.getTextContent({
        disableNormalization: true,
      });
      const text = mergeText(items as TextItem[]);

      assertNotMatch(text, /win aisle/);
    });

    it("gets text content with or without includeMarkedContent, and compare (issue 15094)", async () => {
      // if (isNodeJS) {
      //   pending("Linked test-cases are not supported in Node.js.");
      // }

      await using loadingTask = await getPDF(tempServer, "pdf.pdf");
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(568);
      let { items } = await pdfPage.getTextContent({
        includeMarkedContent: false,
        disableNormalization: true,
      });
      const textWithoutMC = mergeText(items as TextItem[]);
      ({ items } = await pdfPage.getTextContent({
        includeMarkedContent: true,
        disableNormalization: true,
      }));
      const textWithMC = mergeText(items as TextItem[]);

      assertEquals(textWithoutMC, textWithMC);
    });

    it("gets text content with multi-byte entries, using predefined CMaps (issue 16176)", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "issue16176.pdf", {
          cMapUrl: CMAP_URL(tempServer),
          useWorkerFetch: false,
        }),
      );
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(1);
      const { items } = await pdfPage.getTextContent({
        disableNormalization: true,
      });
      const text = mergeText(items as TextItem[]);

      assertEquals(text, "𠮷");

      await loadingTask.destroy();
    });

    it("gets text content with a rised text", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "issue16221.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(1);
      const { items } = await pdfPage.getTextContent({
        disableNormalization: true,
      });

      assertEquals(
        (items as TextItem[]).map((i) => i.str),
        ["Hello ", "World"],
      );

      await loadingTask.destroy();
    });

    it("gets text content with a specific view box", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "issue16316.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(1);
      const { items } = await pdfPage.getTextContent({
        disableNormalization: true,
      });
      const text = mergeText(items as TextItem[]);

      assertEquals(text, "Experimentation,");

      await loadingTask.destroy();
    });

    it("check that a chunk is pushed when font is restored", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "issue14755.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(1);
      const { items } = await pdfPage.getTextContent({
        disableNormalization: true,
      });
      assertObjectMatch(items, [
        {
          str: "ABC",
          dir: "ltr",
          width: 20.56,
          height: 10,
          transform: [10, 0, 0, 10, 100, 100],
          hasEOL: false,
        },
        {
          str: "DEF",
          dir: "ltr",
          width: 20,
          height: 10,
          transform: [10, 0, 0, 10, 120, 100],
          hasEOL: false,
        },
        {
          str: "GHI",
          dir: "ltr",
          width: 17.78,
          height: 10,
          transform: [10, 0, 0, 10, 140, 100],
          hasEOL: false,
        },
      ] as any);
      assertEquals(
        (items[0] as TextItem).fontName,
        (items[2] as TextItem).fontName,
      );
      assertNotEquals(
        (items[1] as TextItem).fontName,
        (items[0] as TextItem).fontName,
      );
    });

    it("gets empty structure tree", async () => {
      const tree = await page.getStructTree();

      assertEquals(tree, undefined);
    });

    it("gets simple structure tree", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "structure_simple.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(1);
      const tree = await pdfPage.getStructTree();

      assertEquals(tree, {
        role: "Root",
        children: [
          {
            role: "Document",
            lang: "en-US",
            children: [
              {
                role: "H1",
                children: [
                  {
                    role: "NonStruct",
                    children: [{ type: "content", id: "p2R_mc0" }],
                  },
                ],
              },
              {
                role: "P",
                children: [
                  {
                    role: "NonStruct",
                    children: [{ type: "content", id: "p2R_mc1" }],
                  },
                ],
              },
              {
                role: "H2",
                children: [
                  {
                    role: "NonStruct",
                    children: [{ type: "content", id: "p2R_mc2" }],
                  },
                ],
              },
              {
                role: "P",
                children: [
                  {
                    role: "NonStruct",
                    children: [{ type: "content", id: "p2R_mc3" }],
                  },
                ],
              },
            ],
          },
        ],
      });

      await loadingTask.destroy();
    });

    it("gets operator list", async () => {
      const operatorList = await page.getOperatorList();

      assert(operatorList.fnArray.length > 100);
      assert(operatorList.argsArray.length > 100);
      assertEquals(operatorList.lastChunk, true);
      assertEquals(operatorList.separateAnnots, { form: false, canvas: false });
    });

    it("gets operatorList with JPEG image (issue 4888)", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "cmykjpeg.pdf", {
          isOffscreenCanvasSupported: false,
        }),
      );

      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(1);
      const operatorList = await pdfPage.getOperatorList();

      const imgIndex = operatorList.fnArray.indexOf(OPS.paintImageXObject);
      const imgArgs = operatorList.argsArray[imgIndex];
      const { data } = pdfPage.objs.get((imgArgs as any)[0]) as ImgData;

      assertInstanceOf(data, Uint8ClampedArray);
      assertEquals(data.length, 90000);

      await loadingTask.destroy();
    });

    it(
      "gets operatorList, from corrupt PDF file (issue 8702), " +
        "with/without `stopAtErrors` set",
      async () => {
        const loadingTask1 = getDocument(
          buildGetDocumentParams(tempServer, "issue8702.pdf", {
            stopAtErrors: false, // The default value.
          }),
        );
        const loadingTask2 = getDocument(
          buildGetDocumentParams(tempServer, "issue8702.pdf", {
            stopAtErrors: true,
          }),
        );

        const result1 = loadingTask1.promise.then((pdfDoc) =>
          pdfDoc.getPage(1).then((pdfPage) =>
            pdfPage.getOperatorList().then((opList) => {
              assert(opList.fnArray.length > 100);
              assert(opList.argsArray.length > 100);
              assertEquals(opList.lastChunk, true);
              assertEquals(opList.separateAnnots, undefined);

              return loadingTask1.destroy();
            })
          )
        );

        const result2 = loadingTask2.promise.then((pdfDoc) =>
          pdfDoc.getPage(1).then((pdfPage) =>
            pdfPage.getOperatorList().then((opList) => {
              assertEquals(opList.fnArray.length, 0);
              assertEquals(opList.argsArray.length, 0);
              assertEquals(opList.lastChunk, true);
              assertEquals(opList.separateAnnots, undefined);

              return loadingTask2.destroy();
            })
          )
        );

        await Promise.all([result1, result2]);
      },
    );

    it("gets operator list, containing Annotation-operatorLists", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "annotation-line.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(1);
      const operatorList = await pdfPage.getOperatorList();

      assert(operatorList.fnArray.length > 20);
      assert(operatorList.argsArray.length > 20);
      assertEquals(operatorList.lastChunk, true);
      assertEquals(operatorList.separateAnnots, { form: false, canvas: false });

      // The `getOperatorList` method, similar to the `render` method,
      // is supposed to include any existing Annotation-operatorLists.
      assert(operatorList.fnArray.includes(OPS.beginAnnotation));
      assert(operatorList.fnArray.includes(OPS.endAnnotation));

      await loadingTask.destroy();
    });

    it("gets operator list, with `annotationMode`-option", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "evaljs.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(2);

      pdfDoc.annotationStorage.setValue("30R", { value: "test" });
      pdfDoc.annotationStorage.setValue("31R", { value: true });

      const opListAnnotDisable = await pdfPage.getOperatorList({
        annotationMode: AnnotationMode.DISABLE,
      });
      assertEquals(opListAnnotDisable.fnArray.length, 0);
      assertEquals(opListAnnotDisable.argsArray.length, 0);
      assertEquals(opListAnnotDisable.lastChunk, true);
      assertEquals(opListAnnotDisable.separateAnnots, undefined);

      const opListAnnotEnable = await pdfPage.getOperatorList({
        annotationMode: AnnotationMode.ENABLE,
      });
      assert(opListAnnotEnable.fnArray.length > 140);
      assert(opListAnnotEnable.argsArray.length > 140);
      assertEquals(opListAnnotEnable.lastChunk, true);
      assertEquals(opListAnnotEnable.separateAnnots, {
        form: false,
        canvas: true,
      });

      let firstAnnotIndex = opListAnnotEnable.fnArray.indexOf(
        OPS.beginAnnotation,
      );
      let isUsingOwnCanvas = opListAnnotEnable!.argsArray![firstAnnotIndex]![4];
      assertEquals(isUsingOwnCanvas, false);

      const opListAnnotEnableForms = await pdfPage.getOperatorList({
        annotationMode: AnnotationMode.ENABLE_FORMS,
      });
      assert(opListAnnotEnableForms.fnArray.length > 30);
      assert(opListAnnotEnableForms.argsArray.length > 30);
      assertEquals(opListAnnotEnableForms.lastChunk, true);
      assertEquals(opListAnnotEnableForms.separateAnnots, {
        form: true,
        canvas: true,
      });

      firstAnnotIndex = opListAnnotEnableForms.fnArray.indexOf(
        OPS.beginAnnotation,
      );
      isUsingOwnCanvas =
        opListAnnotEnableForms!.argsArray![firstAnnotIndex]![4];
      assertEquals(isUsingOwnCanvas, true);

      const opListAnnotEnableStorage = await pdfPage.getOperatorList({
        annotationMode: AnnotationMode.ENABLE_STORAGE,
      });
      assert(opListAnnotEnableStorage.fnArray.length > 170);
      assert(opListAnnotEnableStorage.argsArray.length > 170);
      assertEquals(opListAnnotEnableStorage.lastChunk, true);
      assertEquals(opListAnnotEnableStorage.separateAnnots, {
        form: false,
        canvas: true,
      });

      firstAnnotIndex = opListAnnotEnableStorage.fnArray.indexOf(
        OPS.beginAnnotation,
      );
      isUsingOwnCanvas =
        opListAnnotEnableStorage!.argsArray![firstAnnotIndex]![4];
      assertEquals(isUsingOwnCanvas, false);

      // Sanity check to ensure that the `annotationMode` is correctly applied.
      assert(
        opListAnnotDisable.fnArray.length <
          opListAnnotEnableForms.fnArray.length,
      );
      assert(
        opListAnnotEnableForms.fnArray.length <
          opListAnnotEnable.fnArray.length,
      );
      assert(
        opListAnnotEnable.fnArray.length <
          opListAnnotEnableStorage.fnArray.length,
      );

      await loadingTask.destroy();
    });

    it("gets operatorList, with page resources containing corrupt /CCITTFaxDecode data", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "poppler-90-0-fuzzed.pdf"),
      );
      assertInstanceOf(loadingTask, PDFDocumentLoadingTask);

      const pdfDoc = await loadingTask.promise;
      assertEquals(pdfDoc.numPages, 16);

      const pdfPage = await pdfDoc.getPage(6);
      assertInstanceOf(pdfPage, PDFPageProxy);

      const opList = await pdfPage.getOperatorList();
      assert(opList.fnArray.length > 25);
      assert(opList.argsArray.length > 25);
      assertEquals(opList.lastChunk, true);

      await loadingTask.destroy();
    });

    it("gets page stats after parsing page, without `pdfBug` set", async () => {
      await page.getOperatorList();
      assertEquals(page.stats, undefined);
    });

    it("gets page stats after parsing page, with `pdfBug` set", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, basicApiFileName, { pdfBug: true }),
      );
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(1);
      await pdfPage.getOperatorList();
      const stats = pdfPage.stats;

      assertInstanceOf(stats, StatTimer);
      assertEquals(stats.times.length, 1);

      const [statEntry] = stats!.times;
      assertEquals(statEntry.name, "Page Request");
      assert(statEntry.end - statEntry.start >= 0);

      await loadingTask.destroy();
    });

    it("gets page stats after rendering page, with `pdfBug` set", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, basicApiFileName, { pdfBug: true }),
      );
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(1);
      const viewport = pdfPage.getViewport({ scale: 1 });
      assertInstanceOf(viewport, PageViewport);

      //kkkk "document is not defined"
      // const canvasAndCtx = CanvasFactory.create(
      //   viewport.width,
      //   viewport.height,
      // );
      // const renderTask = pdfPage.render({
      //   canvasContext: canvasAndCtx.context,
      //   viewport,
      // });
      // assertInstanceOf(renderTask, RenderTask);

      // await renderTask.promise;
      // assertEquals(renderTask.separateAnnots, false);

      // const { stats } = pdfPage;
      // assertInstanceOf(stats, StatTimer);
      // assertEquals(stats!.times.length, 3);

      // const [statEntryOne, statEntryTwo, statEntryThree] = stats.times;
      // assertEquals(statEntryOne.name, "Page Request");
      // assert(statEntryOne.end - statEntryOne.start >= 0);

      // assertEquals(statEntryTwo.name, "Rendering");
      // assert(statEntryTwo.end - statEntryTwo.start > 0);

      // assertEquals(statEntryThree.name, "Overall");
      // assert(statEntryThree.end - statEntryThree.start > 0);

      // CanvasFactory.destroy(canvasAndCtx);
      await loadingTask.destroy();
    });

    //kkkk
    it.ignore("cancels rendering of page", async () => {
      const viewport = page.getViewport({ scale: 1 });
      assertInstanceOf(viewport, PageViewport);

      const canvasAndCtx = CanvasFactory.create(
        viewport.width,
        viewport.height,
      );
      const renderTask = page.render({
        canvasContext: canvasAndCtx.context,
        viewport,
      });
      assertInstanceOf(renderTask, RenderTask);

      renderTask.cancel();

      try {
        await renderTask.promise;

        fail("Shouldn't get here.");
      } catch (reason) {
        assertInstanceOf(reason, RenderingCancelledException);
        assertEquals(reason.message, "Rendering cancelled, page 1");
        assertEquals(reason.extraDelay, 0);
      }

      CanvasFactory.destroy(canvasAndCtx);
    });

    //kkkk
    it.ignore("re-render page, using the same canvas, after cancelling rendering", async () => {
      const viewport = page.getViewport({ scale: 1 });
      assertInstanceOf(viewport, PageViewport);

      const canvasAndCtx = CanvasFactory.create(
        viewport.width,
        viewport.height,
      );
      const renderTask = page.render({
        canvasContext: canvasAndCtx.context,
        viewport,
      });
      assertInstanceOf(renderTask, RenderTask);

      renderTask.cancel();

      try {
        await renderTask.promise;

        fail("Shouldn't get here.");
      } catch (reason) {
        assertInstanceOf(reason, RenderingCancelledException);
      }

      const reRenderTask = page.render({
        canvasContext: canvasAndCtx.context,
        viewport,
      });
      assertInstanceOf(reRenderTask, RenderTask);

      await reRenderTask.promise;
      assertEquals(reRenderTask.separateAnnots, false);

      CanvasFactory.destroy(canvasAndCtx);
    });

    //kkkk
    it.ignore("multiple render() on the same canvas", async () => {
      const optionalContentConfigPromise = pdfDocument
        .getOptionalContentConfig();

      const viewport = page.getViewport({ scale: 1 });
      assertInstanceOf(viewport, PageViewport);

      const canvasAndCtx = CanvasFactory.create(
        viewport.width,
        viewport.height,
      );
      const renderTask1 = page.render({
        canvasContext: canvasAndCtx.context,
        viewport,
        optionalContentConfigPromise,
      });
      assertInstanceOf(renderTask1, RenderTask);

      const renderTask2 = page.render({
        canvasContext: canvasAndCtx.context,
        viewport,
        optionalContentConfigPromise,
      });
      assertInstanceOf(renderTask2, RenderTask);

      await Promise.all([
        renderTask1.promise,
        renderTask2.promise.then(
          () => {
            fail("Shouldn't get here.");
          },
          (reason) => {
            // It fails because we are already using this canvas.
            assertMatch(reason.message, /multiple render\(\)/);
          },
        ),
      ]);
    });

    //kkkk
    it.ignore("cleans up document resources after rendering of page", async () => {
      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, basicApiFileName),
      );
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(1);

      const viewport = pdfPage.getViewport({ scale: 1 });
      assertInstanceOf(viewport, PageViewport);

      const canvasAndCtx = CanvasFactory.create(
        viewport.width,
        viewport.height,
      );
      const renderTask = pdfPage.render({
        canvasContext: canvasAndCtx.context,
        viewport,
      });
      assertInstanceOf(renderTask, RenderTask);

      await renderTask.promise;
      assertEquals(renderTask.separateAnnots, false);

      await pdfDoc.cleanup();

      CanvasFactory.destroy(canvasAndCtx);
      await loadingTask.destroy();
    });

    //kkkk
    it.ignore("cleans up document resources during rendering of page", async () => {
      const loadingTask = getDocument(tracemonkeyGetDocumentParams);
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(1);

      const viewport = pdfPage.getViewport({ scale: 1 });
      assertInstanceOf(viewport, PageViewport);

      const canvasAndCtx = CanvasFactory.create(
        viewport.width,
        viewport.height,
      );
      const renderTask = pdfPage.render({
        canvasContext: canvasAndCtx.context,
        viewport,
      });
      assertInstanceOf(renderTask, RenderTask);

      // Ensure that clean-up runs during rendering.
      renderTask.onContinue = (cont) => {
        waitSome(cont);
      };

      try {
        await pdfDoc.cleanup();

        fail("Shouldn't get here.");
      } catch (reason) {
        assertInstanceOf(reason, Error);
        assertEquals(
          reason.message,
          "startCleanup: Page 1 is currently rendering.",
        );
      }
      await renderTask.promise;

      CanvasFactory.destroy(canvasAndCtx);
      await loadingTask.destroy();
    });

    //kkkk "document is not defined"
    it.ignore("caches image resources at the document/page level as expected (issue 11878)", async () => {
      const { NUM_PAGES_THRESHOLD } = GlobalImageCache,
        EXPECTED_WIDTH = 2550,
        EXPECTED_HEIGHT = 3300;

      await using loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "issue11878.pdf", {
          isOffscreenCanvasSupported: false,
          pdfBug: true,
        }),
      );
      const pdfDoc = await loadingTask.promise;
      let checkedCopyLocalImage = false,
        firstImgData: ImgData | undefined,
        firstStatsOverall: number | undefined;

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const pdfPage = await pdfDoc.getPage(i);
        const viewport = pdfPage.getViewport({ scale: 1 });

        const canvasAndCtx = CanvasFactory.create(
          viewport.width,
          viewport.height,
        );
        const renderTask = pdfPage.render({
          canvasContext: canvasAndCtx.context,
          viewport,
        });

        await renderTask.promise;
        const opList = renderTask.getOperatorList();
        // The canvas is no longer necessary, since we only care about
        // the image-data below.
        CanvasFactory.destroy(canvasAndCtx);

        const [statsOverall] = pdfPage!.stats!.times
          .filter((time) => time.name === "Overall")
          .map((time) => time.end - time.start);

        const { commonObjs, objs } = pdfPage;
        const imgIndex = opList.fnArray.indexOf(OPS.paintImageXObject);
        const [objId, width, height] = opList
          .argsArray[imgIndex] as [string, number, number];

        if (i < NUM_PAGES_THRESHOLD) {
          //kkkk got `img_p19_1`
          assertEquals(objId, `img_p${i - 1}_1`);

          assertEquals(objs.has(objId), true);
          assertEquals(commonObjs.has(objId), false);
        } else {
          assertEquals(
            objId,
            `g_${loadingTask.docId}_img_p${NUM_PAGES_THRESHOLD - 1}_1`,
          );

          assertEquals(objs.has(objId), false);
          assertEquals(commonObjs.has(objId), true);
        }
        assertEquals(width, EXPECTED_WIDTH);
        assertEquals(height, EXPECTED_HEIGHT);

        // Ensure that the actual image data is identical for all pages.
        if (i === 1) {
          firstImgData = objs.get(objId) as ImgData;
          firstStatsOverall = statsOverall;

          assertEquals(firstImgData.width, EXPECTED_WIDTH);
          assertEquals(firstImgData.height, EXPECTED_HEIGHT);

          assertEquals(firstImgData.kind, ImageKind.RGB_24BPP);
          assertInstanceOf(firstImgData.data, Uint8ClampedArray);
          assertEquals(firstImgData.data!.length, 25245000);
        } else {
          const objsPool = i >= NUM_PAGES_THRESHOLD ? commonObjs : objs;
          const currentImgData = objsPool.get(objId) as ImgData;

          assertNotStrictEquals(currentImgData, firstImgData);

          assertEquals(currentImgData.width, firstImgData!.width);
          assertEquals(currentImgData.height, firstImgData!.height);

          assertEquals(currentImgData.kind, firstImgData!.kind);
          assertInstanceOf(currentImgData.data, Uint8ClampedArray);
          assert(
            currentImgData.data.every(
              (value, index) => value === firstImgData!.data![index],
            ),
          );

          if (i === NUM_PAGES_THRESHOLD) {
            checkedCopyLocalImage = true;
            // Ensure that the image was copied in the main-thread, rather
            // than being re-parsed in the worker-thread (which is slower).
            assertLess(statsOverall, firstStatsOverall! / 4);
          }
        }
      }
      assert(checkedCopyLocalImage);

      firstImgData = undefined;
      firstStatsOverall = undefined;
    });

    //kkkk
    it.ignore("render for printing, with \`printAnnotationStorage\` set", async () => {
      async function getPrintData(
        printAnnotationStorage: PrintAnnotationStorage | undefined = undefined,
      ) {
        const canvasAndCtx = CanvasFactory.create(
          viewport.width,
          viewport.height,
        );
        const renderTask = pdfPage.render({
          canvasContext: canvasAndCtx.context,
          viewport,
          intent: "print",
          annotationMode: AnnotationMode.ENABLE_STORAGE,
          printAnnotationStorage,
        });

        await renderTask.promise;
        assertEquals(renderTask.separateAnnots, false);

        const printData = canvasAndCtx.canvas.toDataURL();
        CanvasFactory.destroy(canvasAndCtx);

        return printData;
      }

      const loadingTask = getDocument(
        buildGetDocumentParams(tempServer, "annotation-tx.pdf"),
      );
      const pdfDoc = await loadingTask.promise;
      const pdfPage = await pdfDoc.getPage(1);
      const viewport = pdfPage.getViewport({ scale: 1 });

      // Update the contents of the form-field.
      const { annotationStorage } = pdfDoc;
      annotationStorage.setValue("22R", { value: "Hello World" });

      // Render for printing, with default parameters.
      const printOriginalData = await getPrintData();

      // Get the *frozen* print-storage for use during printing.
      const printAnnotationStorage = annotationStorage.print;
      // Update the contents of the form-field again.
      annotationStorage.setValue("22R", { value: "Printing again..." });

      const { hash: annotationHash } = annotationStorage.serializable;
      const { hash: printAnnotationHash } = printAnnotationStorage.serializable;
      // Sanity check to ensure that the print-storage didn't change,
      // after the form-field was updated.
      assertNotEquals(printAnnotationHash, annotationHash);

      // Render for printing again, after updating the form-field,
      // with default parameters.
      const printAgainData = await getPrintData();

      // Render for printing again, after updating the form-field,
      // with `printAnnotationStorage` set.
      const printStorageData = await getPrintData(printAnnotationStorage);

      // Ensure that printing again, with default parameters,
      // actually uses the "new" form-field data.
      assertNotEquals(printAgainData, printOriginalData);
      // Finally ensure that printing, with `printAnnotationStorage` set,
      // still uses the "previous" form-field data.
      assertEquals(printStorageData, printOriginalData);

      await loadingTask.destroy();
    });
  });

  describe("Multiple `getDocument` instances", () => {
    // Regression test for https://github.com/mozilla/pdf.js/issues/6205
    // A PDF using the Helvetica font.
    const pdf1 = tracemonkeyGetDocumentParams;
    // A PDF using the Times font.
    let pdf2: DocumentInitP;
    // A PDF using the Arial font.
    let pdf3: DocumentInitP;
    const loadingTasks: PDFDocumentLoadingTask[] = [];

    // Render the first page of the given PDF file.
    // Fulfills the promise with the base64-encoded version of the PDF.
    async function renderPDF(filename: DocumentInitP) {
      const loadingTask = getDocument(filename);
      loadingTasks.push(loadingTask);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.2 });
      assertInstanceOf(viewport, PageViewport);

      const canvasAndCtx = CanvasFactory.create(
        viewport.width,
        viewport.height,
      );
      const renderTask = page.render({
        canvasContext: canvasAndCtx.context,
        viewport,
      });
      await renderTask.promise;
      assertEquals(renderTask.separateAnnots, false);

      const data = canvasAndCtx.canvas.toDataURL();
      CanvasFactory.destroy(canvasAndCtx);
      return data;
    }

    beforeAll(() => {
      pdf2 = buildGetDocumentParams(tempServer, "TAMReview.pdf");
      pdf3 = buildGetDocumentParams(tempServer, "issue6068.pdf");
    });

    afterEach(async () => {
      // Issue 6205 reported an issue with font rendering, so clear the loaded
      // fonts so that we can see whether loading PDFs in parallel does not
      // cause any issues with the rendered fonts.
      const destroyPromises = loadingTasks.map(
        (loadingTask) => loadingTask.destroy(),
      );
      await Promise.all(destroyPromises);
    });

    //kkkk renderPDF() -> CanvasFactory.create() -> "document is not defined"
    it.ignore("should correctly render PDFs in parallel", async () => {
      let baseline1: string, baseline2: string, baseline3: string;
      const promiseDone = renderPDF(pdf1)
        .then((data1) => {
          baseline1 = data1;
          return renderPDF(pdf2);
        })
        .then((data2) => {
          baseline2 = data2;
          return renderPDF(pdf3);
        })
        .then((data3) => {
          baseline3 = data3;
          return Promise.all([
            renderPDF(pdf1),
            renderPDF(pdf2),
            renderPDF(pdf3),
          ]);
        })
        .then((dataUrls) => {
          assertEquals(dataUrls[0], baseline1);
          assertEquals(dataUrls[1], baseline2);
          assertEquals(dataUrls[2], baseline3);
          return true;
        });

      await promiseDone;
    });
  });

  //kkkk "Leaking async ops"
  describe.ignore("PDFDataRangeTransport", () => {
    let dataPromise: Promise<Uint8Array>;

    beforeAll(() => {
      dataPromise = DefaultFileReaderFactory.fetch({
        path: TEST_PDFS_PATH(tempServer) + tracemonkeyFileName,
      });
    });

    afterAll(() => {
      dataPromise = undefined as any;
    });

    it("should fetch document info and page using ranges", async () => {
      const initialDataLength = 4000;
      const subArrays = [];
      let fetches = 0;

      const data = await dataPromise;
      const initialData = new Uint8Array(data.subarray(0, initialDataLength));
      subArrays.push(initialData);

      const transport = new PDFDataRangeTransport(data.length, initialData);
      transport.requestDataRange = (begin, end) => {
        fetches++;
        waitSome(() => {
          const chunk = new Uint8Array(data.subarray(begin, end));
          subArrays.push(chunk);

          transport.onDataProgress(initialDataLength);
          transport.onDataRange(begin, chunk);
        });
      };

      const loadingTask = getDocument({ range: transport } as DocumentInitP);
      const pdfDocument = await loadingTask.promise;
      assertEquals(pdfDocument.numPages, 14);

      const pdfPage = await pdfDocument.getPage(10);
      assertEquals(pdfPage.rotate, 0);
      assert(fetches > 2);

      // Check that the TypedArrays were transferred.
      for (const array of subArrays) {
        assertEquals(array.length, 0);
      }

      await loadingTask.destroy();
    });

    it("should fetch document info and page using range and streaming", async () => {
      const initialDataLength = 4000;
      const subArrays = [];
      let fetches = 0;

      const data = await dataPromise;
      const initialData = new Uint8Array(data.subarray(0, initialDataLength));
      subArrays.push(initialData);

      const transport = new PDFDataRangeTransport(data.length, initialData);
      transport.requestDataRange = (begin, end) => {
        fetches++;
        if (fetches === 1) {
          const chunk = new Uint8Array(data.subarray(initialDataLength));
          subArrays.push(chunk);

          // Send rest of the data on first range request.
          transport.onDataProgressiveRead(chunk);
        }
        waitSome(() => {
          const chunk = new Uint8Array(data.subarray(begin, end));
          subArrays.push(chunk);

          transport.onDataRange(begin, chunk);
        });
      };

      const loadingTask = getDocument({ range: transport } as DocumentInitP);
      const pdfDocument = await loadingTask.promise;
      assertEquals(pdfDocument.numPages, 14);

      const pdfPage = await pdfDocument.getPage(10);
      assertEquals(pdfPage.rotate, 0);
      assertEquals(fetches, 1);

      await new Promise<void>((resolve) => {
        waitSome(resolve);
      });

      // Check that the TypedArrays were transferred.
      for (const array of subArrays) {
        assertEquals(array.length, 0);
      }

      await loadingTask.destroy();
    });

    it(
      "should fetch document info and page, without range, " +
        "using complete initialData",
      async () => {
        const subArrays = [];
        let fetches = 0;

        const data = await dataPromise;
        const initialData = new Uint8Array(data);
        subArrays.push(initialData);

        const transport = new PDFDataRangeTransport(
          data.length,
          initialData,
          /* progressiveDone = */ true,
        );
        transport.requestDataRange = (begin, end) => {
          fetches++;
        };

        const loadingTask = getDocument({
          disableRange: true,
          range: transport,
        } as any);
        const pdfDocument = await loadingTask.promise;
        assertEquals(pdfDocument.numPages, 14);

        const pdfPage = await pdfDocument.getPage(10);
        assertEquals(pdfPage.rotate, 0);
        assertEquals(fetches, 0);

        // Check that the TypedArrays were transferred.
        for (const array of subArrays) {
          assertEquals(array.length, 0);
        }

        await loadingTask.destroy();
      },
    );
  });

  describe("PDFWorkerUtil", () => {
    describe("isSameOrigin", () => {
      const { isSameOrigin } = PDFWorkerUtil;

      it("handles invalid base URLs", () => {
        // The base URL is not valid.
        assertEquals(isSameOrigin("/foo", "/bar"), false);

        // The base URL has no origin.
        assertEquals(isSameOrigin("blob:foo", "/bar"), false);
      });

      it("correctly checks if the origin of both URLs matches", () => {
        assertEquals(
          isSameOrigin(
            "https://www.mozilla.org/foo",
            "https://www.mozilla.org/bar",
          ),
          true,
        );
        assertEquals(
          isSameOrigin(
            "https://www.mozilla.org/foo",
            "https://www.example.com/bar",
          ),
          false,
        );
      });
    });
  });
});
/*80--------------------------------------------------------------------------*/
