/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2016 Mozilla Foundation
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

import { div, html } from "../../lib/dom.ts";
import {
  AnnotationMode,
  Intent,
  matrix_t,
  OptionalContentConfig,
  PDFDocumentProxy,
  PixelsPerInch,
  PrintAnnotationStorage,
  RenderingCancelledException,
  RenderTask,
  shadow,
} from "../pdf.ts-src/pdf.ts";
import { PDFPrintServiceFactory } from "./app.ts";
import { PageOverview } from "./base_viewer.ts";
import { PDFPrintService } from "./pdf_print_service.ts";
import { getXfaHtmlForPrinting } from "./print_utils.ts";
/*80--------------------------------------------------------------------------*/

// Creates a placeholder with div and canvas with right size for the page.
function composePage(
  pdfDocument: PDFDocumentProxy,
  pageNumber: number,
  size: PageOverview,
  printContainer: HTMLDivElement,
  printResolution: number,
  optionalContentConfigPromise: Promise<OptionalContentConfig | undefined>,
  printAnnotationStoragePromise: Promise<PrintAnnotationStorage | undefined>,
) {
  const canvas = html("canvas");

  // The size of the canvas in pixels for printing.
  const PRINT_UNITS = printResolution / PixelsPerInch.PDF;
  canvas.width = Math.floor(size.width * PRINT_UNITS);
  canvas.height = Math.floor(size.height * PRINT_UNITS);

  const canvasWrapper = div();
  canvasWrapper.className = "printedPage";
  canvasWrapper.append(canvas);
  printContainer.append(canvasWrapper);

  // A callback for a given page may be executed multiple times for different
  // print operations (think of changing the print settings in the browser).
  //
  // Since we don't support queueing multiple render tasks for the same page
  // (and it'd be racy anyways if painting the page is not done in one go) we
  // keep track of the last scheduled task in order to properly cancel it before
  // starting the next one.
  let currentRenderTask: RenderTask | undefined;
  (<any> canvas).mozPrintCallback = (obj: {
    context: CanvasRenderingContext2D;
    done(): void;
    abort?(): void;
  }) => {
    // Printing/rendering the page.
    const ctx = obj.context;

    ctx.save();
    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    let thisRenderTask: RenderTask | undefined;

    Promise.all([
      pdfDocument.getPage(pageNumber),
      printAnnotationStoragePromise,
    ])
      .then(([pdfPage, printAnnotationStorage]) => {
        if (currentRenderTask) {
          currentRenderTask.cancel();
          currentRenderTask = undefined;
        }
        const renderContext = {
          canvasContext: ctx,
          transform: [PRINT_UNITS, 0, 0, PRINT_UNITS, 0, 0] as matrix_t,
          viewport: pdfPage.getViewport({ scale: 1, rotation: size.rotation }),
          intent: "print" as Intent,
          annotationMode: AnnotationMode.ENABLE_STORAGE,
          optionalContentConfigPromise,
          printAnnotationStorage,
        };
        currentRenderTask = thisRenderTask = pdfPage.render(renderContext);
        return thisRenderTask.promise;
      })
      .then(() => {
        // Tell the printEngine that rendering this canvas/page has finished.
        if (currentRenderTask === thisRenderTask) {
          currentRenderTask = undefined;
        }
        obj.done();
      }, (reason) => {
        if (!(reason instanceof RenderingCancelledException)) {
          console.error(reason);
        }

        if (currentRenderTask === thisRenderTask) {
          currentRenderTask!.cancel();
          currentRenderTask = undefined;
        }

        // Tell the printEngine that rendering this canvas/page has failed.
        // This will make the print process stop.
        if ("abort" in obj) {
          obj.abort!();
        } else {
          obj.done();
        }
      });
  };
}

export class FirefoxPrintService extends PDFPrintService {
  override layout() {
    const {
      pdfDocument,
      pagesOverview,
      printContainer,
      _printResolution,
      _optionalContentConfigPromise,
      _printAnnotationStoragePromise,
    } = this;

    const body = document.querySelector("body")!;
    body.setAttribute("data-pdfjsprinting", <any> true);

    if (pdfDocument.isPureXfa) {
      getXfaHtmlForPrinting(printContainer, pdfDocument);
      return;
    }

    for (let i = 0, ii = pagesOverview.length; i < ii; ++i) {
      composePage(
        pdfDocument,
        /* pageNumber = */ i + 1,
        pagesOverview[i],
        printContainer,
        _printResolution,
        _optionalContentConfigPromise,
        _printAnnotationStoragePromise,
      );
    }
  }

  override destroy() {
    this.printContainer.textContent = "";

    const body = document.querySelector("body")!;
    body.removeAttribute("data-pdfjsprinting");
  }
}

PDFPrintServiceFactory.instance = {
  get supportsPrinting() {
    const canvas = html("canvas");
    const value = "mozPrintCallback" in canvas;

    return shadow(this, "supportsPrinting", value);
  },

  createPrintService(
    pdfDocument,
    pagesOverview,
    printContainer,
    printResolution,
    optionalContentConfigPromise,
    printAnnotationStoragePromise,
  ) {
    return new FirefoxPrintService(
      pdfDocument,
      pagesOverview,
      printContainer,
      printResolution,
      optionalContentConfigPromise,
      printAnnotationStoragePromise,
    );
  },
};
/*80--------------------------------------------------------------------------*/