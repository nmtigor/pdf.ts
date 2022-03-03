/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
/* Copyright 2013 Mozilla Foundation
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
/** @typedef {import("./interfaces").IDownloadManager} IDownloadManager */
import { html } from "../../lib/dom.js";
import { isPdfFile } from "../pdf.ts-src/display/display_utils.js";
import { createValidAbsoluteUrl } from "../pdf.ts-src/pdf.js";
/*81---------------------------------------------------------------------------*/
// if (typeof PDFJSDev !== "undefined" && !PDFJSDev.test("CHROME || GENERIC")) {
function download(blobUrl, filename) {
    const a = html("a");
    if (!a.click) {
        throw new Error('DownloadManager: "a.click()" is not supported.');
    }
    a.href = blobUrl;
    a.target = "_parent";
    // Use a.download if available. This increases the likelihood that
    // the file is downloaded instead of opened by another PDF plugin.
    if ("download" in a) {
        a.download = filename;
    }
    // <a> must be in the document for recent Firefox versions,
    // otherwise .click() is ignored.
    (document.body || document.documentElement).appendChild(a);
    a.click();
    a.remove();
}
export class DownloadManager {
    _openBlobUrls = new WeakMap();
    onerror;
    downloadUrl(url, filename) {
        if (!createValidAbsoluteUrl(url, "http://example.com")) {
            console.error(`downloadUrl - not a valid URL: ${url}`);
            return; // restricted/invalid URL
        }
        download(url + "#pdfjs.action=download", filename);
    }
    downloadData(data, filename, contentType) {
        const blobUrl = URL.createObjectURL(new Blob([data], { type: contentType }));
        download(blobUrl, filename);
    }
    /**
     * @return Indicating if the data was opened.
     */
    openOrDownloadData(element, data, filename) {
        const isPdfData = isPdfFile(filename);
        const contentType = isPdfData ? "application/pdf" : "";
        if (isPdfData) {
            let blobUrl = this._openBlobUrls.get(element);
            if (!blobUrl) {
                blobUrl = URL.createObjectURL(new Blob([data], { type: contentType }));
                this._openBlobUrls.set(element, blobUrl);
            }
            let viewerUrl;
            // The current URL is the viewer, let's use it and append the file.
            viewerUrl = "?file=" + encodeURIComponent(blobUrl + "#" + filename);
            // In the Chrome extension, the URL is rewritten using the history API
            // in viewer.js, so an absolute URL must be generated.
            try {
                window.open(viewerUrl);
                return true;
            }
            catch (ex) {
                console.error(`openOrDownloadData: ${ex}`);
                // Release the `blobUrl`, since opening it failed, and fallback to
                // downloading the PDF file.
                URL.revokeObjectURL(blobUrl);
                this._openBlobUrls.delete(element);
            }
        }
        this.downloadData(data, filename, contentType);
        return false;
    }
    /**
     * @param sourceEventType Used to signal what triggered the download.
     *   The version of PDF.js integrated with Firefox uses this to to determine
     *   which dialog to show. "save" triggers "save as" and "download" triggers
     *   the "open with" dialog.
     */
    download(blob, url, filename, sourceEventType = "download") {
        const blobUrl = URL.createObjectURL(blob);
        download(blobUrl, filename);
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=download_manager.js.map