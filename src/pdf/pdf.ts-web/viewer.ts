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

// import "web-com";
// import "web-print_service";
import { CHROME, GENERIC, MOZCENTRAL } from "../../global.ts";
import { viewerApp } from "./app.ts";
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

// Ref. gulpfile.js of pdf.js
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

function getViewerConfiguration() {
  return {
    appContainer: document.body,
    mainContainer: <HTMLDivElement> document.getElementById("viewerContainer"),
    viewerContainer: <HTMLDivElement> document.getElementById("viewer"),
    toolbar: {
      /**
       * Container for the secondary toolbar.
       */
      container: <HTMLDivElement> document.getElementById("toolbarViewer"),
      /**
       * Label that contains number of pages.
       */
      numPages: <HTMLSpanElement> document.getElementById("numPages"),
      /**
       * Control for display and user input of the current page number.
       */
      pageNumber: <HTMLInputElement> document.getElementById("pageNumber"),
      /**
       * Scale selection control.
       * Its width is adjusted, when necessary, on UI localization.
       */
      scaleSelect: <HTMLSelectElement> document.getElementById("scaleSelect"),
      /**
       * The item used to display a non-predefined scale.
       */
      customScaleOption: <HTMLOptionElement> document.getElementById(
        "customScaleOption",
      ),
      /**
       * Button to go to the previous page.
       */
      previous: <HTMLButtonElement> document.getElementById("previous"),
      /**
       * Button to go to the next page.
       */
      next: <HTMLButtonElement> document.getElementById("next"),
      /**
       * Button to zoom in the pages.
       */
      zoomIn: <HTMLButtonElement> document.getElementById("zoomIn"),
      /**
       * Button to zoom out the pages.
       */
      zoomOut: <HTMLButtonElement> document.getElementById("zoomOut"),
      /**
       * Button to open find bar.
       */
      viewFind: <HTMLButtonElement> document.getElementById("viewFind"),
      /**
       * Button to open a new document.
       */
      openFile: /*#static*/ GENERIC
        ? <HTMLButtonElement> document.getElementById("openFile")
        : undefined,
      print: <HTMLButtonElement> document.getElementById("print"),
      /**
       * Button to switch to FreeText editing.
       */
      editorFreeTextButton: <HTMLButtonElement> document.getElementById(
        "editorFreeText",
      ),
      editorFreeTextParamsToolbar: <HTMLDivElement> document.getElementById(
        "editorFreeTextParamsToolbar",
      ),
      editorInkButton: <HTMLButtonElement> document.getElementById("editorInk"),
      editorInkParamsToolbar: <HTMLButtonElement> document.getElementById(
        "editorInkParamsToolbar",
      ),
      /**
       * Button to download the document.
       */
      download: <HTMLButtonElement> document.getElementById("download"),
    },
    secondaryToolbar: {
      /**
       * Container for the secondary toolbar.
       */
      toolbar: <HTMLDivElement> document.getElementById("secondaryToolbar"),
      /**
       * Button to toggle the visibility of the secondary toolbar.
       */
      toggleButton: <HTMLButtonElement> document.getElementById(
        "secondaryToolbarToggle",
      ),
      /**
       * Button for entering presentation mode.
       */
      presentationModeButton: <HTMLButtonElement> document.getElementById(
        "presentationMode",
      ),
      /**
       * Button to open a file.
       */
      openFileButton: /*#static*/ GENERIC
        ? <HTMLButtonElement> document.getElementById("secondaryOpenFile")
        : undefined,
      /**
       * Button to print the document.
       */
      printButton: <HTMLButtonElement> document.getElementById(
        "secondaryPrint",
      ),
      /**
       * Button to download the document.
       */
      downloadButton: <HTMLButtonElement> document.getElementById(
        "secondaryDownload",
      ),
      /**
       * Button to obtain a bookmark link to the current location in the document.
       */
      viewBookmarkButton: <HTMLAnchorElement> document.getElementById(
        "viewBookmark",
      ),
      /**
       * Button to go to the first page in the document.
       */
      firstPageButton: <HTMLButtonElement> document.getElementById("firstPage"),
      /**
       * Button to go to the first page in the document.
       */
      lastPageButton: <HTMLButtonElement> document.getElementById("lastPage"),
      /**
       * Button to rotate the pages clockwise.
       */
      pageRotateCwButton: <HTMLButtonElement> document.getElementById(
        "pageRotateCw",
      ),
      /**
       * Button to rotate the pages counterclockwise.
       */
      pageRotateCcwButton: <HTMLButtonElement> document.getElementById(
        "pageRotateCcw",
      ),
      /**
       * Button to enable the select tool.
       */
      cursorSelectToolButton: <HTMLButtonElement> document.getElementById(
        "cursorSelectTool",
      ),
      /**
       * Button to enable the hand tool.
       */
      cursorHandToolButton: <HTMLButtonElement> document.getElementById(
        "cursorHandTool",
      ),
      scrollPageButton: <HTMLButtonElement> document.getElementById(
        "scrollPage",
      ),
      scrollVerticalButton: <HTMLButtonElement> document.getElementById(
        "scrollVertical",
      ),
      scrollHorizontalButton: <HTMLButtonElement> document.getElementById(
        "scrollHorizontal",
      ),
      scrollWrappedButton: <HTMLButtonElement> document.getElementById(
        "scrollWrapped",
      ),
      spreadNoneButton: <HTMLButtonElement> document.getElementById(
        "spreadNone",
      ),
      spreadOddButton: <HTMLButtonElement> document.getElementById("spreadOdd"),
      spreadEvenButton: <HTMLButtonElement> document.getElementById(
        "spreadEven",
      ),
      /**
       * Button for opening the document properties dialog.
       */
      documentPropertiesButton: <HTMLButtonElement> document.getElementById(
        "documentProperties",
      ),
    },
    sidebar: {
      // Divs (and sidebar button)
      /**
       * The outer container (encasing both the viewer and sidebar elements).
       */
      outerContainer: <HTMLDivElement> document.getElementById(
        "outerContainer",
      ),
      /**
       * The sidebar container (in which the views are placed).
       */
      sidebarContainer: <HTMLDivElement> document.getElementById(
        "sidebarContainer",
      ),
      /**
       * The button used for opening/closing the sidebar.
       */
      toggleButton: <HTMLButtonElement> document.getElementById(
        "sidebarToggle",
      ),

      // Buttons
      /**
       * The button used to show the thumbnail view.
       */
      thumbnailButton: <HTMLButtonElement> document.getElementById(
        "viewThumbnail",
      ),
      /**
       * The button used to show the outline view.
       */
      outlineButton: <HTMLButtonElement> document.getElementById("viewOutline"),
      /**
       * The button used to show the attachments view.
       */
      attachmentsButton: <HTMLButtonElement> document.getElementById(
        "viewAttachments",
      ),
      /**
       * The button used to show the layers view.
       */
      layersButton: <HTMLButtonElement> document.getElementById("viewLayers"),

      // Views
      /**
       * The container in which the thumbnails are placed.
       */
      thumbnailView: <HTMLDivElement> document.getElementById("thumbnailView"),
      /**
       * The container in which the outline is placed.
       */
      outlineView: <HTMLDivElement> document.getElementById("outlineView"),
      /**
       * The container in which the attachments are placed.
       */
      attachmentsView: <HTMLDivElement> document.getElementById(
        "attachmentsView",
      ),
      /**
       * The container in which the layers are placed.
       */
      layersView: <HTMLDivElement> document.getElementById("layersView"),
      // View-specific options
      outlineOptionsContainer: <HTMLDivElement> document.getElementById(
        "outlineOptionsContainer",
      ),
      currentOutlineItemButton: <HTMLButtonElement> document.getElementById(
        "currentOutlineItem",
      ),
    },
    sidebarResizer: {
      /**
       * The outer container (encasing both the viewer and sidebar elements).
       */
      outerContainer: <HTMLDivElement> document.getElementById(
        "outerContainer",
      ),
      /**
       * The DOM element that can be dragged in
       * order to adjust the width of the sidebar.
       */
      resizer: <HTMLDivElement> document.getElementById("sidebarResizer"),
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
      submitButton: <HTMLButtonElement> document.getElementById(
        "passwordSubmit",
      ),
      /**
       * Button for cancelling password entry.
       */
      cancelButton: <HTMLButtonElement> document.getElementById(
        "passwordCancel",
      ),
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
        fileName: <HTMLParagraphElement> document.getElementById(
          "fileNameField",
        ),
        fileSize: <HTMLParagraphElement> document.getElementById(
          "fileSizeField",
        ),
        title: <HTMLParagraphElement> document.getElementById("titleField"),
        author: <HTMLParagraphElement> document.getElementById("authorField"),
        subject: <HTMLParagraphElement> document.getElementById("subjectField"),
        keywords: <HTMLParagraphElement> document.getElementById(
          "keywordsField",
        ),
        creationDate: <HTMLParagraphElement> document.getElementById(
          "creationDateField",
        ),
        modificationDate: <HTMLParagraphElement> document.getElementById(
          "modificationDateField",
        ),
        creator: <HTMLParagraphElement> document.getElementById("creatorField"),
        producer: <HTMLParagraphElement> document.getElementById(
          "producerField",
        ),
        version: <HTMLParagraphElement> document.getElementById("versionField"),
        pageCount: <HTMLParagraphElement> document.getElementById(
          "pageCountField",
        ),
        pageSize: <HTMLParagraphElement> document.getElementById(
          "pageSizeField",
        ),
        linearized: <HTMLParagraphElement> document.getElementById(
          "linearizedField",
        ),
      },
    },
    annotationEditorParams: {
      editorFreeTextFontSize: <HTMLInputElement> document.getElementById(
        "editorFreeTextFontSize",
      ),
      editorFreeTextColor: <HTMLInputElement> document.getElementById(
        "editorFreeTextColor",
      ),
      editorInkColor: <HTMLInputElement> document.getElementById(
        "editorInkColor",
      ),
      editorInkThickness: <HTMLInputElement> document.getElementById(
        "editorInkThickness",
      ),
      editorInkOpacity: <HTMLInputElement> document.getElementById(
        "editorInkOpacity",
      ),
    },
    printContainer: <HTMLDivElement> document.getElementById("printContainer"),
    openFileInput: /*#static*/ GENERIC
      ? <HTMLInputElement> document.getElementById("fileInput")
      : undefined,
    debuggerScriptPath: "./debugger.js",
  };
}
export type ViewerConfiguration = ReturnType<typeof getViewerConfiguration>;

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
(<any> document).blockUnblockOnload?.(true);

if (
  document.readyState === "interactive" ||
  document.readyState === "complete"
) {
  webViewerLoad();
} else {
  document.addEventListener("DOMContentLoaded", webViewerLoad, true);
}
/*80--------------------------------------------------------------------------*/
