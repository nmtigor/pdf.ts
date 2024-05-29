/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/download_manager.ts
 * @license Apache-2.0
 ******************************************************************************/

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

import { html } from "@fe-lib/dom.ts";
import { CHROME, COMPONENTS, GENERIC, PDFJSDev } from "../../global.ts";
import { createValidAbsoluteUrl, isPdfFile } from "../pdf.ts-src/pdf.ts";
import type { IDownloadManager } from "./interfaces.ts";
/*80--------------------------------------------------------------------------*/

/*#static*/ if (!(CHROME || GENERIC)) {
  throw new Error(
    'Module "pdfjs-web/download_manager" shall not be used ' +
      "outside CHROME and GENERIC builds.",
  );
}

function download(blobUrl: string, filename: string) {
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

export class DownloadManager implements IDownloadManager {
  #openBlobUrls = new WeakMap<Uint8Array | Uint8ClampedArray, string>();

  onerror?: (err: any) => void;

  /** @implement */
  downloadUrl(url: string, filename: string, _options?: object) {
    if (!createValidAbsoluteUrl(url, "http://example.com")) {
      console.error(`downloadUrl - not a valid URL: ${url}`);
      return; // restricted/invalid URL
    }
    download(url + "#pdfjs.action=download", filename);
  }

  /** @implement */
  downloadData(
    data: Uint8Array | Uint8ClampedArray,
    filename: string,
    contentType: string,
  ) {
    const blobUrl = URL.createObjectURL(
      new Blob([data], { type: contentType }),
    );
    download(blobUrl, filename);
  }

  /**
   * @implement
   * @return Indicating if the data was opened.
   */
  openOrDownloadData(
    data: Uint8Array | Uint8ClampedArray,
    filename: string,
    dest?: string,
  ) {
    const isPdfData = isPdfFile(filename);
    const contentType = isPdfData ? "application/pdf" : "";

    /*#static*/ if (PDFJSDev || !COMPONENTS) {
      if (isPdfData) {
        let blobUrl = this.#openBlobUrls.get(data);
        if (!blobUrl) {
          blobUrl = URL.createObjectURL(
            new Blob([data], { type: contentType }),
          );
          this.#openBlobUrls.set(data, blobUrl);
        }
        let viewerUrl = /*#static*/ PDFJSDev || GENERIC
          // The current URL is the viewer, let's use it and append the file.
          ? "?file=" + encodeURIComponent(blobUrl + "#" + filename)
          : /*#static*/ CHROME
          // In the Chrome extension, the URL is rewritten using the history API
          // in viewer.js, so an absolute URL must be generated.
          ? (globalThis as any).chrome.runtime.getURL(
            "/content/web/viewer.html",
          ) + "?file=" +
            encodeURIComponent(blobUrl + "#" + filename)
          : undefined;
        if (dest) {
          viewerUrl += `#${escape(dest)}`;
        }

        try {
          window.open(viewerUrl);
          return true;
        } catch (ex) {
          console.error(`openOrDownloadData: ${ex}`);
          // Release the `blobUrl`, since opening it failed, and fallback to
          // downloading the PDF file.
          URL.revokeObjectURL(blobUrl);
          this.#openBlobUrls.delete(data);
        }
      }
    }

    this.downloadData(data, filename, contentType);
    return false;
  }

  /** @implement */
  download(blob: Blob, url: string, filename: string, _options?: object) {
    const blobUrl = URL.createObjectURL(blob);
    download(blobUrl, filename);
  }
}
/*80--------------------------------------------------------------------------*/
