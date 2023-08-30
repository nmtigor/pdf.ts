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
import { CHROME, GENERIC, MOZCENTRAL, PDFJSDev } from "../../global.js";
import { viewerApp } from "./app.js";
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
/*#static*/  {
    /*#static*/  {
        await import("./genericcom.js");
        await import("./pdf_print_service.js");
    }
}
function getViewerConfiguration() {
    return {
        appContainer: document.body,
        mainContainer: document.getElementById("viewerContainer"),
        viewerContainer: document.getElementById("viewer"),
        toolbar: {
            /**
             * Container for the secondary toolbar.
             */
            container: document.getElementById("toolbarViewer"),
            /**
             * Label that contains number of pages.
             */
            numPages: document.getElementById("numPages"),
            /**
             * Control for display and user input of the current page number.
             */
            pageNumber: document.getElementById("pageNumber"),
            /**
             * Scale selection control.
             * Its width is adjusted, when necessary, on UI localization.
             */
            scaleSelect: document.getElementById("scaleSelect"),
            /**
             * The item used to display a non-predefined scale.
             */
            customScaleOption: document.getElementById("customScaleOption"),
            /**
             * Button to go to the previous page.
             */
            previous: document.getElementById("previous"),
            /**
             * Button to go to the next page.
             */
            next: document.getElementById("next"),
            /**
             * Button to zoom in the pages.
             */
            zoomIn: document.getElementById("zoomIn"),
            /**
             * Button to zoom out the pages.
             */
            zoomOut: document.getElementById("zoomOut"),
            /**
             * Button to open find bar.
             */
            viewFind: document.getElementById("viewFind"),
            /**
             * Button to open a new document.
             */
            openFile: /*#static*/ document.getElementById("openFile"),
            print: document.getElementById("print"),
            /**
             * Button to switch to FreeText editing.
             */
            editorFreeTextButton: document.getElementById("editorFreeText"),
            editorFreeTextParamsToolbar: document.getElementById("editorFreeTextParamsToolbar"),
            editorInkButton: document.getElementById("editorInk"),
            editorInkParamsToolbar: document.getElementById("editorInkParamsToolbar"),
            /**
             * Button to download the document.
             */
            download: document.getElementById("download"),
        },
        secondaryToolbar: {
            /**
             * Container for the secondary toolbar.
             */
            toolbar: document.getElementById("secondaryToolbar"),
            /**
             * Button to toggle the visibility of the secondary toolbar.
             */
            toggleButton: document.getElementById("secondaryToolbarToggle"),
            /**
             * Button for entering presentation mode.
             */
            presentationModeButton: document.getElementById("presentationMode"),
            /**
             * Button to open a file.
             */
            openFileButton: /*#static*/ document.getElementById("secondaryOpenFile"),
            /**
             * Button to print the document.
             */
            printButton: document.getElementById("secondaryPrint"),
            /**
             * Button to download the document.
             */
            downloadButton: document.getElementById("secondaryDownload"),
            /**
             * Button to obtain a bookmark link to the current location in the document.
             */
            viewBookmarkButton: document.getElementById("viewBookmark"),
            /**
             * Button to go to the first page in the document.
             */
            firstPageButton: document.getElementById("firstPage"),
            /**
             * Button to go to the first page in the document.
             */
            lastPageButton: document.getElementById("lastPage"),
            /**
             * Button to rotate the pages clockwise.
             */
            pageRotateCwButton: document.getElementById("pageRotateCw"),
            /**
             * Button to rotate the pages counterclockwise.
             */
            pageRotateCcwButton: document.getElementById("pageRotateCcw"),
            /**
             * Button to enable the select tool.
             */
            cursorSelectToolButton: document.getElementById("cursorSelectTool"),
            /**
             * Button to enable the hand tool.
             */
            cursorHandToolButton: document.getElementById("cursorHandTool"),
            scrollPageButton: document.getElementById("scrollPage"),
            scrollVerticalButton: document.getElementById("scrollVertical"),
            scrollHorizontalButton: document.getElementById("scrollHorizontal"),
            scrollWrappedButton: document.getElementById("scrollWrapped"),
            spreadNoneButton: document.getElementById("spreadNone"),
            spreadOddButton: document.getElementById("spreadOdd"),
            spreadEvenButton: document.getElementById("spreadEven"),
            /**
             * Button for opening the document properties dialog.
             */
            documentPropertiesButton: document.getElementById("documentProperties"),
        },
        sidebar: {
            // Divs (and sidebar button)
            /**
             * The outer container (encasing both the viewer and sidebar elements).
             */
            outerContainer: document.getElementById("outerContainer"),
            /**
             * The sidebar container (in which the views are placed).
             */
            sidebarContainer: document.getElementById("sidebarContainer"),
            /**
             * The button used for opening/closing the sidebar.
             */
            toggleButton: document.getElementById("sidebarToggle"),
            /**
             * The DOM element that can be dragged in
             * order to adjust the width of the sidebar.
             */
            resizer: document.getElementById("sidebarResizer"),
            // Buttons
            /**
             * The button used to show the thumbnail view.
             */
            thumbnailButton: document.getElementById("viewThumbnail"),
            /**
             * The button used to show the outline view.
             */
            outlineButton: document.getElementById("viewOutline"),
            /**
             * The button used to show the attachments view.
             */
            attachmentsButton: document.getElementById("viewAttachments"),
            /**
             * The button used to show the layers view.
             */
            layersButton: document.getElementById("viewLayers"),
            // Views
            /**
             * The container in which the thumbnails are placed.
             */
            thumbnailView: document.getElementById("thumbnailView"),
            /**
             * The container in which the outline is placed.
             */
            outlineView: document.getElementById("outlineView"),
            /**
             * The container in which the attachments are placed.
             */
            attachmentsView: document.getElementById("attachmentsView"),
            /**
             * The container in which the layers are placed.
             */
            layersView: document.getElementById("layersView"),
            // View-specific options
            outlineOptionsContainer: document.getElementById("outlineOptionsContainer"),
            currentOutlineItemButton: document.getElementById("currentOutlineItem"),
        },
        findBar: {
            bar: document.getElementById("findbar"),
            toggleButton: document.getElementById("viewFind"),
            findField: document.getElementById("findInput"),
            highlightAllCheckbox: document.getElementById("findHighlightAll"),
            caseSensitiveCheckbox: document.getElementById("findMatchCase"),
            matchDiacriticsCheckbox: document.getElementById("findMatchDiacritics"),
            entireWordCheckbox: document.getElementById("findEntireWord"),
            findMsg: document.getElementById("findMsg"),
            findResultsCount: document.getElementById("findResultsCount"),
            findPreviousButton: document.getElementById("findPrevious"),
            findNextButton: document.getElementById("findNext"),
        },
        passwordOverlay: {
            /**
             * The overlay's DOM element.
             */
            dialog: document.getElementById("passwordDialog"),
            /**
             * Label containing instructions for entering the password.
             */
            label: document.getElementById("passwordText"),
            /**
             * Input field for entering the password.
             */
            input: document.getElementById("password"),
            /**
             * Button for submitting the password.
             */
            submitButton: document.getElementById("passwordSubmit"),
            /**
             * Button for cancelling password entry.
             */
            cancelButton: document.getElementById("passwordCancel"),
        },
        documentProperties: {
            /**
             * The overlay's DOM element.
             */
            dialog: document.getElementById("documentPropertiesDialog"),
            /**
             * Button for closing the overlay.
             */
            closeButton: document.getElementById("documentPropertiesClose"),
            /**
             * Names and elements of the overlay's fields.
             */
            fields: {
                fileName: document.getElementById("fileNameField"),
                fileSize: document.getElementById("fileSizeField"),
                title: document.getElementById("titleField"),
                author: document.getElementById("authorField"),
                subject: document.getElementById("subjectField"),
                keywords: document.getElementById("keywordsField"),
                creationDate: document.getElementById("creationDateField"),
                modificationDate: document.getElementById("modificationDateField"),
                creator: document.getElementById("creatorField"),
                producer: document.getElementById("producerField"),
                version: document.getElementById("versionField"),
                pageCount: document.getElementById("pageCountField"),
                pageSize: document.getElementById("pageSizeField"),
                linearized: document.getElementById("linearizedField"),
            },
        },
        annotationEditorParams: {
            editorFreeTextFontSize: document.getElementById("editorFreeTextFontSize"),
            editorFreeTextColor: document.getElementById("editorFreeTextColor"),
            editorInkColor: document.getElementById("editorInkColor"),
            editorInkThickness: document.getElementById("editorInkThickness"),
            editorInkOpacity: document.getElementById("editorInkOpacity"),
        },
        printContainer: document.getElementById("printContainer"),
        openFileInput: /*#static*/ document.getElementById("fileInput"),
        debuggerScriptPath: "./debugger.js",
    };
}
function webViewerLoad() {
    const config = getViewerConfiguration();
    /*#static*/  {
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
        }
        catch (ex) {
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
document.blockUnblockOnload?.(true);
if (document.readyState === "interactive" ||
    document.readyState === "complete") {
    webViewerLoad();
}
else {
    document.addEventListener("DOMContentLoaded", webViewerLoad, true);
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=viewer.js.map