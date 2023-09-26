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

import { CHROME, GENERIC, MOZCENTRAL, PDFJSDev } from "@fe-src/global.ts";
import { viewerApp } from "./app.ts";

// Ref. gulpfile.mjs of pdf.js
/*#static*/ if (CHROME) {
  await import("./chromecom.ts");
  await import("./pdf_print_service.ts");
} else {
  /*#static*/ if (GENERIC) {
    await import("./genericcom.ts");
    await import("./pdf_print_service.ts");
  } else {
    /*#static*/ if (MOZCENTRAL) {
      await import("./firefoxcom.ts");
      await import("./firefox_print_service.ts");
    }
  }
}
/*80--------------------------------------------------------------------------*/

// /* eslint-disable-next-line no-unused-vars */
// const pdfjsVersion =
//   typeof PDFJSDev !== "undefined" ? PDFJSDev.eval("BUNDLE_VERSION") : void 0;
// /* eslint-disable-next-line no-unused-vars */
// const pdfjsBuild =
//   typeof PDFJSDev !== "undefined" ? PDFJSDev.eval("BUNDLE_BUILD") : void 0;

// const AppConstants =
//   typeof PDFJSDev === "undefined" || PDFJSDev.test("GENERIC")
//     ? { LinkTarget, RenderingStates, ScrollMode, SpreadMode }
//     : null;

// window.PDFViewerApplication = PDFViewerApplication;
// window.PDFViewerApplicationConstants = AppConstants;
// window.PDFViewerApplicationOptions = AppOptions;

function getViewerConfiguration() {
  return {
    appContainer: document.body,
    mainContainer: document.getElementById("viewerContainer") as HTMLDivElement,
    viewerContainer: document.getElementById("viewer") as HTMLDivElement,
    toolbar: {
      /**
       * Container for the secondary toolbar.
       */
      container: document.getElementById("toolbarViewer") as HTMLDivElement,
      /**
       * Label that contains number of pages.
       */
      numPages: document.getElementById("numPages") as HTMLSpanElement,
      /**
       * Control for display and user input of the current page number.
       */
      pageNumber: document.getElementById("pageNumber") as HTMLInputElement,
      /**
       * Scale selection control.
       * Its width is adjusted, when necessary, on UI localization.
       */
      scaleSelect: document.getElementById("scaleSelect") as HTMLSelectElement,
      /**
       * The item used to display a non-predefined scale.
       */
      customScaleOption: document.getElementById(
        "customScaleOption",
      ) as HTMLOptionElement,
      /**
       * Button to go to the previous page.
       */
      previous: document.getElementById("previous") as HTMLButtonElement,
      /**
       * Button to go to the next page.
       */
      next: document.getElementById("next") as HTMLButtonElement,
      /**
       * Button to zoom in the pages.
       */
      zoomIn: document.getElementById("zoomIn") as HTMLButtonElement,
      /**
       * Button to zoom out the pages.
       */
      zoomOut: document.getElementById("zoomOut") as HTMLButtonElement,
      /**
       * Button to open find bar.
       */
      viewFind: document.getElementById("viewFind") as HTMLButtonElement,
      /**
       * Button to open a new document.
       */
      openFile: /*#static*/ PDFJSDev || GENERIC
        ? document.getElementById("openFile") as HTMLButtonElement
        : undefined,
      print: document.getElementById("print") as HTMLButtonElement,
      /**
       * Button to switch to FreeText editing.
       */
      editorFreeTextButton: document.getElementById(
        "editorFreeText",
      ) as HTMLButtonElement,
      editorFreeTextParamsToolbar: document.getElementById(
        "editorFreeTextParamsToolbar",
      ) as HTMLDivElement,
      editorInkButton: document.getElementById(
        "editorInk",
      ) as HTMLButtonElement,
      editorInkParamsToolbar: document.getElementById(
        "editorInkParamsToolbar",
      ) as HTMLButtonElement,
      editorStampButton: document.getElementById(
        "editorStamp",
      ) as HTMLButtonElement,
      editorStampParamsToolbar: document.getElementById(
        "editorStampParamsToolbar",
      ) as HTMLDivElement,
      /**
       * Button to download the document.
       */
      download: document.getElementById("download") as HTMLButtonElement,
    },
    secondaryToolbar: {
      /**
       * Container for the secondary toolbar.
       */
      toolbar: document.getElementById("secondaryToolbar") as HTMLDivElement,
      /**
       * Button to toggle the visibility of the secondary toolbar.
       */
      toggleButton: document.getElementById(
        "secondaryToolbarToggle",
      ) as HTMLButtonElement,
      /**
       * Button for entering presentation mode.
       */
      presentationModeButton: document.getElementById(
        "presentationMode",
      ) as HTMLButtonElement,
      /**
       * Button to open a file.
       */
      openFileButton: /*#static*/ PDFJSDev || GENERIC
        ? document.getElementById("secondaryOpenFile") as HTMLButtonElement
        : undefined,
      /**
       * Button to print the document.
       */
      printButton: document.getElementById(
        "secondaryPrint",
      ) as HTMLButtonElement,
      /**
       * Button to download the document.
       */
      downloadButton: document.getElementById(
        "secondaryDownload",
      ) as HTMLButtonElement,
      /**
       * Button to obtain a bookmark link to the current location in the document.
       */
      viewBookmarkButton: document.getElementById(
        "viewBookmark",
      ) as HTMLAnchorElement,
      /**
       * Button to go to the first page in the document.
       */
      firstPageButton: document.getElementById(
        "firstPage",
      ) as HTMLButtonElement,
      /**
       * Button to go to the first page in the document.
       */
      lastPageButton: document.getElementById("lastPage") as HTMLButtonElement,
      /**
       * Button to rotate the pages clockwise.
       */
      pageRotateCwButton: document.getElementById(
        "pageRotateCw",
      ) as HTMLButtonElement,
      /**
       * Button to rotate the pages counterclockwise.
       */
      pageRotateCcwButton: document.getElementById(
        "pageRotateCcw",
      ) as HTMLButtonElement,
      /**
       * Button to enable the select tool.
       */
      cursorSelectToolButton: document.getElementById(
        "cursorSelectTool",
      ) as HTMLButtonElement,
      /**
       * Button to enable the hand tool.
       */
      cursorHandToolButton: document.getElementById(
        "cursorHandTool",
      ) as HTMLButtonElement,
      scrollPageButton: document.getElementById(
        "scrollPage",
      ) as HTMLButtonElement,
      scrollVerticalButton: document.getElementById(
        "scrollVertical",
      ) as HTMLButtonElement,
      scrollHorizontalButton: document.getElementById(
        "scrollHorizontal",
      ) as HTMLButtonElement,
      scrollWrappedButton: document.getElementById(
        "scrollWrapped",
      ) as HTMLButtonElement,
      spreadNoneButton: document.getElementById(
        "spreadNone",
      ) as HTMLButtonElement,
      spreadOddButton: document.getElementById(
        "spreadOdd",
      ) as HTMLButtonElement,
      spreadEvenButton: document.getElementById(
        "spreadEven",
      ) as HTMLButtonElement,
      /**
       * Button for opening the document properties dialog.
       */
      documentPropertiesButton: document.getElementById(
        "documentProperties",
      ) as HTMLButtonElement,
    },
    sidebar: {
      // Divs (and sidebar button)
      /**
       * The outer container (encasing both the viewer and sidebar elements).
       */
      outerContainer: document.getElementById(
        "outerContainer",
      ) as HTMLDivElement,
      /**
       * The sidebar container (in which the views are placed).
       */
      sidebarContainer: document.getElementById(
        "sidebarContainer",
      ) as HTMLDivElement,
      /**
       * The button used for opening/closing the sidebar.
       */
      toggleButton: document.getElementById(
        "sidebarToggle",
      ) as HTMLButtonElement,
      /**
       * The DOM element that can be dragged in
       * order to adjust the width of the sidebar.
       */
      resizer: document.getElementById("sidebarResizer") as HTMLDivElement,

      // Buttons
      /**
       * The button used to show the thumbnail view.
       */
      thumbnailButton: document.getElementById(
        "viewThumbnail",
      ) as HTMLButtonElement,
      /**
       * The button used to show the outline view.
       */
      outlineButton: document.getElementById(
        "viewOutline",
      ) as HTMLButtonElement,
      /**
       * The button used to show the attachments view.
       */
      attachmentsButton: document.getElementById(
        "viewAttachments",
      ) as HTMLButtonElement,
      /**
       * The button used to show the layers view.
       */
      layersButton: document.getElementById("viewLayers") as HTMLButtonElement,

      // Views
      /**
       * The container in which the thumbnails are placed.
       */
      thumbnailView: document.getElementById("thumbnailView") as HTMLDivElement,
      /**
       * The container in which the outline is placed.
       */
      outlineView: document.getElementById("outlineView") as HTMLDivElement,
      /**
       * The container in which the attachments are placed.
       */
      attachmentsView: document.getElementById(
        "attachmentsView",
      ) as HTMLDivElement,
      /**
       * The container in which the layers are placed.
       */
      layersView: document.getElementById("layersView") as HTMLDivElement,
      // View-specific options
      outlineOptionsContainer: document.getElementById(
        "outlineOptionsContainer",
      ) as HTMLDivElement,
      currentOutlineItemButton: document.getElementById(
        "currentOutlineItem",
      ) as HTMLButtonElement,
    },
    findBar: {
      bar: <HTMLDivElement> document.getElementById("findbar"),
      toggleButton: <HTMLButtonElement> document.getElementById("viewFind"),
      findField: <HTMLInputElement> document.getElementById("findInput"),
      highlightAllCheckbox: <HTMLInputElement> document.getElementById(
        "findHighlightAll",
      ),
      caseSensitiveCheckbox: <HTMLInputElement> document.getElementById(
        "findMatchCase",
      ),
      matchDiacriticsCheckbox: <HTMLInputElement> document.getElementById(
        "findMatchDiacritics",
      ),
      entireWordCheckbox: <HTMLInputElement> document.getElementById(
        "findEntireWord",
      ),
      findMsg: <HTMLSpanElement> document.getElementById("findMsg"),
      findResultsCount: <HTMLSpanElement> document.getElementById(
        "findResultsCount",
      ),
      findPreviousButton: <HTMLButtonElement> document.getElementById(
        "findPrevious",
      ),
      findNextButton: <HTMLButtonElement> document.getElementById("findNext"),
    },
    passwordOverlay: {
      /**
       * The overlay's DOM element.
       */
      dialog: <HTMLDialogElement> document.getElementById("passwordDialog"),
      /**
       * Label containing instructions for entering the password.
       */
      label: <HTMLParagraphElement> document.getElementById("passwordText"),
      /**
       * Input field for entering the password.
       */
      input: <HTMLInputElement> document.getElementById("password"),
      /**
       * Button for submitting the password.
       */
      submitButton: document.getElementById(
        "passwordSubmit",
      ) as HTMLButtonElement,
      /**
       * Button for cancelling password entry.
       */
      cancelButton: document.getElementById(
        "passwordCancel",
      ) as HTMLButtonElement,
    },
    documentProperties: {
      /**
       * The overlay's DOM element.
       */
      dialog: <HTMLDialogElement> document.getElementById(
        "documentPropertiesDialog",
      ),
      /**
       * Button for closing the overlay.
       */
      closeButton: <HTMLButtonElement> document.getElementById(
        "documentPropertiesClose",
      ),
      /**
       * Names and elements of the overlay's fields.
       */
      fields: {
        fileName: document.getElementById(
          "fileNameField",
        ) as HTMLParagraphElement,
        fileSize: document.getElementById(
          "fileSizeField",
        ) as HTMLParagraphElement,
        title: document.getElementById("titleField") as HTMLParagraphElement,
        author: document.getElementById("authorField") as HTMLParagraphElement,
        subject: document.getElementById(
          "subjectField",
        ) as HTMLParagraphElement,
        keywords: document.getElementById(
          "keywordsField",
        ) as HTMLParagraphElement,
        creationDate: document.getElementById(
          "creationDateField",
        ) as HTMLParagraphElement,
        modificationDate: document.getElementById(
          "modificationDateField",
        ) as HTMLParagraphElement,
        creator: document.getElementById(
          "creatorField",
        ) as HTMLParagraphElement,
        producer: document.getElementById(
          "producerField",
        ) as HTMLParagraphElement,
        version: document.getElementById(
          "versionField",
        ) as HTMLParagraphElement,
        pageCount: document.getElementById(
          "pageCountField",
        ) as HTMLParagraphElement,
        pageSize: document.getElementById(
          "pageSizeField",
        ) as HTMLParagraphElement,
        linearized: document.getElementById(
          "linearizedField",
        ) as HTMLParagraphElement,
      },
    },
    annotationEditorParams: {
      editorFreeTextFontSize: document.getElementById(
        "editorFreeTextFontSize",
      ) as HTMLInputElement,
      editorFreeTextColor: document.getElementById(
        "editorFreeTextColor",
      ) as HTMLInputElement,
      editorInkColor: document.getElementById(
        "editorInkColor",
      ) as HTMLInputElement,
      editorInkThickness: document.getElementById(
        "editorInkThickness",
      ) as HTMLInputElement,
      editorInkOpacity: document.getElementById(
        "editorInkOpacity",
      ) as HTMLInputElement,
      editorStampAddImage: document.getElementById(
        "editorStampAddImage",
      ) as HTMLButtonElement,
    },
    printContainer: document.getElementById("printContainer") as HTMLDivElement,
    openFileInput: /*#static*/ PDFJSDev || GENERIC
      ? document.getElementById("fileInput") as HTMLInputElement
      : undefined,
    debuggerScriptPath: "./debugger.js",
  };
}
export type ViewerConfiguration = ReturnType<typeof getViewerConfiguration>;
export type ToolbarOptions = ViewerConfiguration["toolbar"];

function webViewerLoad() {
  const config = getViewerConfiguration();
  /*#static*/ if (GENERIC) {
    // Give custom implementations of the default viewer a simpler way to
    // set various `AppOptions`, by dispatching an event once all viewer
    // files are loaded but *before* the viewer initialization has run.
    const event = new CustomEvent("webviewerloaded", {
      bubbles: true,
      cancelable: true,
      detail: {
        source: window,
      },
    });
    try {
      // Attempt to dispatch the event at the embedding `document`,
      // in order to support cases where the viewer is embedded in
      // a *dynamically* created <iframe> element.
      parent.document.dispatchEvent(event);
    } catch (ex) {
      // The viewer could be in e.g. a cross-origin <iframe> element,
      // fallback to dispatching the event at the current `document`.
      console.error(`webviewerloaded: ${ex}`);
      document.dispatchEvent(event);
    }
  }
  viewerApp.run(config);
}

// Block the "load" event until all pages are loaded, to ensure that printing
// works in Firefox; see https://bugzilla.mozilla.org/show_bug.cgi?id=1618553
(document as any).blockUnblockOnload?.(true);

if (
  document.readyState === "interactive" ||
  document.readyState === "complete"
) {
  webViewerLoad();
} else {
  document.on("DOMContentLoaded", webViewerLoad, true);
}
/*80--------------------------------------------------------------------------*/
