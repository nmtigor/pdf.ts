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
import { CHROME, GENERIC } from "../../global.js";
import { html } from "../../lib/dom.js";
import { createValidAbsoluteUrl, isPdfFile } from "../pdf.ts-src/pdf.js";
/*80--------------------------------------------------------------------------*/
/*#static*/ 
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
    (document.body || document.documentElement).append(a);
    a.click();
    a.remove();
}
export class DownloadManager {
    #openBlobUrls = new WeakMap();
    onerror;
    /** @implement */
    downloadUrl(url, filename) {
        if (!createValidAbsoluteUrl(url, "http://example.com")) {
            console.error(`downloadUrl - not a valid URL: ${url}`);
            return; // restricted/invalid URL
        }
        download(url + "#pdfjs.action=download", filename);
    }
    /** @implement */
    downloadData(data, filename, contentType) {
        const blobUrl = URL.createObjectURL(new Blob([data], { type: contentType }));
        download(blobUrl, filename);
    }
    /**
     * @implement
     * @return Indicating if the data was opened.
     */
    openOrDownloadData(element, data, filename) {
        const isPdfData = isPdfFile(filename);
        const contentType = isPdfData ? "application/pdf" : "";
        if (isPdfData) {
            let blobUrl = this.#openBlobUrls.get(element);
            if (!blobUrl) {
                blobUrl = URL.createObjectURL(new Blob([data], { type: contentType }));
                this.#openBlobUrls.set(element, blobUrl);
            }
            const viewerUrl = /*#static*/ "?file=" + encodeURIComponent(blobUrl + "#" + filename);
            try {
                window.open(viewerUrl);
                return true;
            }
            catch (ex) {
                console.error(`openOrDownloadData: ${ex}`);
                // Release the `blobUrl`, since opening it failed, and fallback to
                // downloading the PDF file.
                URL.revokeObjectURL(blobUrl);
                this.#openBlobUrls.delete(element);
            }
        }
        this.downloadData(data, filename, contentType);
        return false;
    }
    /** @implement */
    download(blob, url, filename) {
        const blobUrl = URL.createObjectURL(blob);
        download(blobUrl, filename);
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=download_manager.js.map