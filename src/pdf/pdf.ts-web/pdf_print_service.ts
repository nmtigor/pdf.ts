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

import { PDFJSDev } from "@fe-src/global.ts";
import { html } from "@fe-lib/dom.ts";
import type {
  Intent,
  matrix_t,
  OptionalContentConfig,
  PDFDocumentProxy,
  PrintAnnotationStorage,
} from "../pdf.ts-src/pdf.ts";
import { AnnotationMode, PixelsPerInch } from "../pdf.ts-src/pdf.ts";
import { PDFPrintServiceFactory, viewerApp } from "./app.ts";
import type { OverlayManager } from "./overlay_manager.ts";
import type { PageOverview } from "./pdf_viewer.ts";
import { getXfaHtmlForPrinting } from "./print_utils.ts";
/*80--------------------------------------------------------------------------*/

let activeService: PDFPrintService | undefined;
let dialog: HTMLDialogElement;
let overlayManager: OverlayManager;

// Renders the page to the canvas of the given print service, and returns
// the suggested dimensions of the output page.
function renderPage(
  activeServiceOnEntry: PDFPrintService,
  pdfDocument: PDFDocumentProxy,
  pageNumber: number,
  size: PageOverview,
  printResolution: number,
  optionalContentConfigPromise: Promise<OptionalContentConfig | undefined>,
  printAnnotationStoragePromise: Promise<PrintAnnotationStorage | undefined>,
) {
  const scratchCanvas = activeService!.scratchCanvas!;

  // The size of the canvas in pixels for printing.
  const PRINT_UNITS = printResolution / PixelsPerInch.PDF;
  scratchCanvas.width = Math.floor(size.width * PRINT_UNITS);
  scratchCanvas.height = Math.floor(size.height * PRINT_UNITS);

  const ctx = scratchCanvas.getContext("2d")!;
  ctx.save();
  ctx.fillStyle = "rgb(255, 255, 255)";
  ctx.fillRect(0, 0, scratchCanvas.width, scratchCanvas.height);
  ctx.restore();

  return Promise.all([
    pdfDocument.getPage(pageNumber),
    printAnnotationStoragePromise,
  ]).then(([pdfPage, printAnnotationStorage]) => {
    const renderContext = {
      canvasContext: ctx,
      transform: <matrix_t> [PRINT_UNITS, 0, 0, PRINT_UNITS, 0, 0],
      viewport: pdfPage.getViewport({ scale: 1, rotation: size.rotation }),
      intent: <Intent> "print",
      annotationMode: AnnotationMode.ENABLE_STORAGE,
      optionalContentConfigPromise,
      printAnnotationStorage,
    };
    return pdfPage.render(renderContext).promise;
  });
}

export class PDFPrintService {
  pdfDocument;
  pagesOverview;
  printContainer;
  _printResolution;
  _optionalContentConfigPromise;
  _printAnnotationStoragePromise;
  currentPage = -1;

  pageStyleSheet: HTMLStyleElement | undefined;

  /**
   * The temporary canvas where renderPage paints one page at a time.
   */
  scratchCanvas: HTMLCanvasElement | undefined = html("canvas");

  constructor(
    pdfDocument: PDFDocumentProxy,
    pagesOverview: PageOverview[],
    printContainer: HTMLDivElement,
    printResolution: number | undefined,
    optionalContentConfigPromise:
      | Promise<OptionalContentConfig | undefined>
      | undefined,
    printAnnotationStoragePromise?: Promise<PrintAnnotationStorage | undefined>,
  ) {
    this.pdfDocument = pdfDocument;
    this.pagesOverview = pagesOverview;
    this.printContainer = printContainer;
    this._printResolution = printResolution || 150;
    this._optionalContentConfigPromise = optionalContentConfigPromise ||
      pdfDocument.getOptionalContentConfig();
    this._printAnnotationStoragePromise = printAnnotationStoragePromise ||
      Promise.resolve(undefined);
  }

  layout() {
    this.throwIfInactive();

    const body = document.querySelector("body")!;
    body.setAttribute("data-pdfjsprinting", true as any);

    const { width, height } = this.pagesOverview[0];
    const hasEqualPageSizes = this.pagesOverview.every(
      (size) => size.width === width && size.height === height,
    );
    if (!hasEqualPageSizes) {
      console.warn(
        "Not all pages have the same size. The printed result may be incorrect!",
      );
    }

    // Insert a @page + size rule to make sure that the page size is correctly
    // set. Note that we assume that all pages have the same size, because
    // variable-size pages are not supported yet (e.g. in Chrome & Firefox).
    // TODO(robwu): Use named pages when size calculation bugs get resolved
    // (e.g. https://crbug.com/355116) AND when support for named pages is
    // added (http://www.w3.org/TR/css3-page/#using-named-pages).
    // In browsers where @page + size is not supported, the next stylesheet
    // will be ignored and the user has to select the correct paper size in
    // the UI if wanted.
    this.pageStyleSheet = html("style");
    this.pageStyleSheet.textContent = `@page { size: ${width}pt ${height}pt;}`;
    body.append(this.pageStyleSheet);
  }

  destroy() {
    if (activeService !== this) {
      // |activeService| cannot be replaced without calling destroy() first,
      // so if it differs then an external consumer has a stale reference to us.
      return;
    }
    this.printContainer.textContent = "";

    const body = document.querySelector("body")!;
    body.removeAttribute("data-pdfjsprinting");

    if (this.pageStyleSheet) {
      this.pageStyleSheet.remove();
      this.pageStyleSheet = undefined;
    }
    this.scratchCanvas!.width = this.scratchCanvas!.height = 0;
    this.scratchCanvas = undefined;
    activeService = undefined;
    ensureOverlay().then(() => {
      if (overlayManager.active === dialog) {
        overlayManager.close(dialog);
      }
    });
  }

  renderPages() {
    if (this.pdfDocument.isPureXfa) {
      getXfaHtmlForPrinting(this.printContainer, this.pdfDocument);
      return Promise.resolve();
    }

    const pageCount = this.pagesOverview.length;
    const renderNextPage = (
      resolve: () => void,
      reject: (reason?: any) => void,
    ) => {
      this.throwIfInactive();
      if (++this.currentPage >= pageCount) {
        renderProgress(pageCount, pageCount);
        resolve();
        return;
      }
      const index = this.currentPage;
      renderProgress(index, pageCount);
      renderPage(
        this,
        this.pdfDocument,
        /* pageNumber = */ index + 1,
        this.pagesOverview[index],
        this._printResolution,
        this._optionalContentConfigPromise,
        this._printAnnotationStoragePromise,
      )
        .then(this.#useRenderedPage)
        .then(() => {
          renderNextPage(resolve, reject);
        }, reject);
    };
    return new Promise<void>(renderNextPage);
  }

  #useRenderedPage = () => {
    this.throwIfInactive();
    const img = html("img");
    const scratchCanvas = this.scratchCanvas!;
    if ("toBlob" in scratchCanvas) {
      scratchCanvas.toBlob((blob) => {
        img.src = URL.createObjectURL(blob!);
      });
    } else {
      img.src = (scratchCanvas as any).toDataURL();
    }

    const wrapper = html("div");
    wrapper.className = "printedPage";
    wrapper.append(img);
    this.printContainer.append(wrapper);

    return new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
  };

  performPrint() {
    this.throwIfInactive();
    return new Promise<void>((resolve) => {
      // Push window.print in the macrotask queue to avoid being affected by
      // the deprecation of running print() code in a microtask, see
      // https://github.com/mozilla/pdf.js/issues/7547.
      setTimeout(() => {
        if (!this.active) {
          resolve();
          return;
        }
        print.call(window);
        // Delay promise resolution in case print() was not synchronous.
        setTimeout(resolve, 20); // Tidy-up.
      }, 0);
    });
  }

  get active() {
    return this === activeService;
  }

  throwIfInactive() {
    if (!this.active) {
      throw new Error("This print request was cancelled or completed.");
    }
  }
}

const print = window.print;
window.print = () => {
  if (activeService) {
    console.warn("Ignored window.print() because of a pending print job.");
    return;
  }
  ensureOverlay().then(() => {
    if (activeService) {
      overlayManager.open(dialog);
    }
  });

  try {
    dispatchEvent("beforeprint");
  } finally {
    if (!activeService) {
      console.error("Expected print service to be initialized.");
      ensureOverlay().then(() => {
        if (overlayManager.active === dialog) {
          overlayManager.close(dialog);
        }
      });
      return; // eslint-disable-line no-unsafe-finally
    }
    const activeServiceOnEntry = <PDFPrintService> activeService;
    (<PDFPrintService> activeService)
      .renderPages()
      .then(() => {
        return activeServiceOnEntry.performPrint();
      })
      .catch(() => {
        // Ignore any error messages.
      })
      .then(() => {
        // aborts acts on the "active" print request, so we need to check
        // whether the print request (activeServiceOnEntry) is still active.
        // Without the check, an unrelated print request (created after aborting
        // this print request while the pages were being generated) would be
        // aborted.
        if (activeServiceOnEntry.active) {
          abort();
        }
      });
  }
};

function dispatchEvent(eventType: string) {
  const event = new CustomEvent(eventType, {
    bubbles: false,
    cancelable: false,
    detail: "custom",
  });
  window.dispatchEvent(event);
}

function abort() {
  if (activeService) {
    activeService.destroy();
    dispatchEvent("afterprint");
  }
}

function renderProgress(index: number, total: number) {
  if (PDFJSDev && (window as any).isGECKOVIEW) {
    return;
  }
  dialog ||= document.getElementById("printServiceDialog") as HTMLDialogElement;
  const progress = Math.round((100 * index) / total);
  const progressBar = dialog.querySelector("progress")!;
  const progressPerc = dialog.querySelector(".relative-progress")!;
  progressBar.value = progress;
  progressPerc.setAttribute("data-l10n-args", JSON.stringify({ progress }));
}

window.on(
  "keydown",
  (event) => {
    // Intercept Cmd/Ctrl + P in all browsers.
    // Also intercept Cmd/Ctrl + Shift + P in Chrome and Opera
    if (
      event.keyCode === /* P= */ 80 &&
      (event.ctrlKey || event.metaKey) &&
      !event.altKey &&
      (!event.shiftKey || (<any> window).chrome || (<any> window).opera)
    ) {
      window.print();

      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },
  true,
);

if ("onbeforeprint" in window) {
  // Do not propagate before/afterprint events when they are not triggered
  // from within this polyfill. (FF / Chrome 63+).
  const stopPropagationIfNeeded = (event: Event) => {
    if ((event as any).detail !== "custom") {
      event.stopImmediatePropagation();
    }
  };
  window.on("beforeprint", stopPropagationIfNeeded);
  window.on("afterprint", stopPropagationIfNeeded);
}

let overlayPromise: Promise<void>;
function ensureOverlay() {
  if (PDFJSDev && (window as any).isGECKOVIEW) {
    return Promise.reject(
      new Error("ensureOverlay not implemented in GECKOVIEW development mode."),
    );
  }
  if (!overlayPromise) {
    overlayManager = viewerApp.overlayManager;
    if (!overlayManager) {
      throw new Error("The overlay manager has not yet been initialized.");
    }
    dialog ||= <HTMLDialogElement> document.getElementById(
      "printServiceDialog",
    );

    overlayPromise = overlayManager.register(
      dialog,
      /* canForceClose = */ true,
    );

    document.getElementById("printCancel")!.onclick = abort;
    dialog.on("close", abort);
  }
  return overlayPromise;
}

PDFPrintServiceFactory.instance = {
  supportsPrinting: true,

  createPrintService(
    pdfDocument,
    pagesOverview,
    printContainer,
    printResolution,
    optionalContentConfigPromise,
    printAnnotationStoragePromise,
  ) {
    if (activeService) {
      throw new Error("The print service is created and active.");
    }
    activeService = new PDFPrintService(
      pdfDocument,
      pagesOverview,
      printContainer,
      printResolution,
      optionalContentConfigPromise,
      printAnnotationStoragePromise,
    );
    return activeService;
  },
};
/*80--------------------------------------------------------------------------*/
