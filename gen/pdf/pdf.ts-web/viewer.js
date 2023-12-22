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
import { CHROME, GENERIC, MOZCENTRAL, PDFJSDev } from "../../global.js";
import { viewerApp } from "./app.js";
/* Ref. gulpfile.mjs of pdf.js */
/*#static*/  {
    /*#static*/  {
        await import("./genericcom.js");
        await import("./pdf_print_service.js");
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
const eltBy = (id_x) => document.getElementById(id_x);
const divBy = (id_x) => eltBy(id_x);
const spanBy = (id_x) => eltBy(id_x);
const buttonBy = (id_x) => eltBy(id_x);
const inputBy = (id_x) => eltBy(id_x);
const textAreaBy = (id_x) => eltBy(id_x);
const dialogBy = (id_x) => eltBy(id_x);
const paragraphBy = (id_x) => eltBy(id_x);
const selectBy = (id_x) => eltBy(id_x);
const optionBy = (id_x) => eltBy(id_x);
const anchorBy = (id_x) => eltBy(id_x);
function getViewerConfiguration() {
    return {
        appContainer: document.body,
        mainContainer: divBy("viewerContainer"),
        viewerContainer: divBy("viewer"),
        toolbar: {
            /**
             * Container for the secondary toolbar.
             */
            container: divBy("toolbarViewer"),
            /**
             * Label that contains number of pages.
             */
            numPages: spanBy("numPages"),
            /**
             * Control for display and user input of the current page number.
             */
            pageNumber: inputBy("pageNumber"),
            /**
             * Scale selection control.
             * Its width is adjusted, when necessary, on UI localization.
             */
            scaleSelect: selectBy("scaleSelect"),
            /**
             * The item used to display a non-predefined scale.
             */
            customScaleOption: optionBy("customScaleOption"),
            /**
             * Button to go to the previous page.
             */
            previous: buttonBy("previous"),
            /**
             * Button to go to the next page.
             */
            next: buttonBy("next"),
            /**
             * Button to zoom in the pages.
             */
            zoomIn: buttonBy("zoomIn"),
            /**
             * Button to zoom out the pages.
             */
            zoomOut: buttonBy("zoomOut"),
            /**
             * Button to open find bar.
             */
            viewFind: buttonBy("viewFind"),
            print: buttonBy("print"),
            /**
             * Button to switch to FreeText editing.
             */
            editorFreeTextButton: buttonBy("editorFreeText"),
            editorFreeTextParamsToolbar: divBy("editorFreeTextParamsToolbar"),
            editorInkButton: buttonBy("editorInk"),
            editorInkParamsToolbar: buttonBy("editorInkParamsToolbar"),
            editorStampButton: buttonBy("editorStamp"),
            editorStampParamsToolbar: divBy("editorStampParamsToolbar"),
            /**
             * Button to download the document.
             */
            download: buttonBy("download"),
        },
        secondaryToolbar: {
            /**
             * Container for the secondary toolbar.
             */
            toolbar: divBy("secondaryToolbar"),
            /**
             * Button to toggle the visibility of the secondary toolbar.
             */
            toggleButton: buttonBy("secondaryToolbarToggle"),
            /**
             * Button for entering presentation mode.
             */
            presentationModeButton: buttonBy("presentationMode"),
            /**
             * Button to open a file.
             */
            openFileButton: /*#static*/ buttonBy("secondaryOpenFile"),
            /**
             * Button to print the document.
             */
            printButton: buttonBy("secondaryPrint"),
            /**
             * Button to download the document.
             */
            downloadButton: buttonBy("secondaryDownload"),
            /**
             * Button to obtain a bookmark link to the current location in the document.
             */
            viewBookmarkButton: anchorBy("viewBookmark"),
            /**
             * Button to go to the first page in the document.
             */
            firstPageButton: buttonBy("firstPage"),
            /**
             * Button to go to the first page in the document.
             */
            lastPageButton: buttonBy("lastPage"),
            /**
             * Button to rotate the pages clockwise.
             */
            pageRotateCwButton: buttonBy("pageRotateCw"),
            /**
             * Button to rotate the pages counterclockwise.
             */
            pageRotateCcwButton: buttonBy("pageRotateCcw"),
            /**
             * Button to enable the select tool.
             */
            cursorSelectToolButton: buttonBy("cursorSelectTool"),
            /**
             * Button to enable the hand tool.
             */
            cursorHandToolButton: buttonBy("cursorHandTool"),
            scrollPageButton: buttonBy("scrollPage"),
            scrollVerticalButton: buttonBy("scrollVertical"),
            scrollHorizontalButton: buttonBy("scrollHorizontal"),
            scrollWrappedButton: buttonBy("scrollWrapped"),
            spreadNoneButton: buttonBy("spreadNone"),
            spreadOddButton: buttonBy("spreadOdd"),
            spreadEvenButton: buttonBy("spreadEven"),
            /**
             * Button for opening the document properties dialog.
             */
            documentPropertiesButton: buttonBy("documentProperties"),
        },
        sidebar: {
            // Divs (and sidebar button)
            /**
             * The outer container (encasing both the viewer and sidebar elements).
             */
            outerContainer: divBy("outerContainer"),
            /**
             * The sidebar container (in which the views are placed).
             */
            sidebarContainer: divBy("sidebarContainer"),
            /**
             * The button used for opening/closing the sidebar.
             */
            toggleButton: buttonBy("sidebarToggle"),
            /**
             * The DOM element that can be dragged in
             * order to adjust the width of the sidebar.
             */
            resizer: divBy("sidebarResizer"),
            // Buttons
            /**
             * The button used to show the thumbnail view.
             */
            thumbnailButton: buttonBy("viewThumbnail"),
            /**
             * The button used to show the outline view.
             */
            outlineButton: buttonBy("viewOutline"),
            /**
             * The button used to show the attachments view.
             */
            attachmentsButton: buttonBy("viewAttachments"),
            /**
             * The button used to show the layers view.
             */
            layersButton: buttonBy("viewLayers"),
            // Views
            /**
             * The container in which the thumbnails are placed.
             */
            thumbnailView: divBy("thumbnailView"),
            /**
             * The container in which the outline is placed.
             */
            outlineView: divBy("outlineView"),
            /**
             * The container in which the attachments are placed.
             */
            attachmentsView: divBy("attachmentsView"),
            /**
             * The container in which the layers are placed.
             */
            layersView: divBy("layersView"),
            // View-specific options
            outlineOptionsContainer: divBy("outlineOptionsContainer"),
            currentOutlineItemButton: buttonBy("currentOutlineItem"),
        },
        findBar: {
            bar: divBy("findbar"),
            toggleButton: buttonBy("viewFind"),
            findField: inputBy("findInput"),
            highlightAllCheckbox: inputBy("findHighlightAll"),
            caseSensitiveCheckbox: inputBy("findMatchCase"),
            matchDiacriticsCheckbox: inputBy("findMatchDiacritics"),
            entireWordCheckbox: inputBy("findEntireWord"),
            findMsg: spanBy("findMsg"),
            findResultsCount: spanBy("findResultsCount"),
            findPreviousButton: buttonBy("findPrevious"),
            findNextButton: buttonBy("findNext"),
        },
        passwordOverlay: {
            /**
             * The overlay's DOM element.
             */
            dialog: dialogBy("passwordDialog"),
            /**
             * Label containing instructions for entering the password.
             */
            label: paragraphBy("passwordText"),
            /**
             * Input field for entering the password.
             */
            input: inputBy("password"),
            /**
             * Button for submitting the password.
             */
            submitButton: buttonBy("passwordSubmit"),
            /**
             * Button for cancelling password entry.
             */
            cancelButton: buttonBy("passwordCancel"),
        },
        documentProperties: {
            /**
             * The overlay's DOM element.
             */
            dialog: dialogBy("documentPropertiesDialog"),
            /**
             * Button for closing the overlay.
             */
            closeButton: buttonBy("documentPropertiesClose"),
            /**
             * Names and elements of the overlay's fields.
             */
            fields: {
                fileName: paragraphBy("fileNameField"),
                fileSize: paragraphBy("fileSizeField"),
                title: paragraphBy("titleField"),
                author: paragraphBy("authorField"),
                subject: paragraphBy("subjectField"),
                keywords: paragraphBy("keywordsField"),
                creationDate: paragraphBy("creationDateField"),
                modificationDate: paragraphBy("modificationDateField"),
                creator: paragraphBy("creatorField"),
                producer: paragraphBy("producerField"),
                version: paragraphBy("versionField"),
                pageCount: paragraphBy("pageCountField"),
                pageSize: paragraphBy("pageSizeField"),
                linearized: paragraphBy("linearizedField"),
            },
        },
        altTextDialog: {
            dialog: dialogBy("altTextDialog"),
            optionDescription: inputBy("descriptionButton"),
            optionDecorative: inputBy("decorativeButton"),
            textarea: textAreaBy("descriptionTextarea"),
            cancelButton: buttonBy("altTextCancel"),
            saveButton: buttonBy("altTextSave"),
        },
        annotationEditorParams: {
            editorFreeTextFontSize: inputBy("editorFreeTextFontSize"),
            editorFreeTextColor: inputBy("editorFreeTextColor"),
            editorInkColor: inputBy("editorInkColor"),
            editorInkThickness: inputBy("editorInkThickness"),
            editorInkOpacity: inputBy("editorInkOpacity"),
            editorStampAddImage: buttonBy("editorStampAddImage"),
        },
        printContainer: divBy("printContainer"),
        openFileInput: /*#static*/ inputBy("fileInput"),
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
    document.on("DOMContentLoaded", webViewerLoad, true);
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=viewer.js.map