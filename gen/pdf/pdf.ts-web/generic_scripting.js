/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
/* Copyright 2020 Mozilla Foundation
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
import { getPdfFilenameFromUrl, loadScript, QuickJSSandbox, } from "../pdf.ts-src/pdf.js";
/*80--------------------------------------------------------------------------*/
export async function docPropertiesLookup(pdfDocument) {
    const url = "", baseUrl = url.split("#")[0];
    // eslint-disable-next-line prefer-const
    let { info, metadata, contentDispositionFilename, contentLength } = await pdfDocument.getMetadata();
    if (!contentLength) {
        const { length } = await pdfDocument.getDownloadInfo();
        contentLength = length;
    }
    return {
        ...info,
        baseURL: baseUrl,
        filesize: contentLength,
        filename: contentDispositionFilename || getPdfFilenameFromUrl(url),
        metadata: metadata?.getRaw(),
        authors: metadata?.get("dc:creator"),
        numPages: pdfDocument.numPages,
        URL: url,
    };
}
export class GenericScripting {
    _ready;
    constructor(sandboxBundleSrc) {
        this._ready = loadScript(sandboxBundleSrc, 
        /* removeScriptElement = */ true).then(() => {
            // return window.pdfjsSandbox.QuickJSSandbox();
            return QuickJSSandbox();
        });
    }
    /** @implement */
    async createSandbox(data) {
        const sandbox = await this._ready;
        sandbox.create(data);
    }
    /** @implement */
    async dispatchEventInSandbox(event) {
        const sandbox = await this._ready;
        setTimeout(() => sandbox.dispatchEvent(event), 0);
    }
    /** @implement */
    async destroySandbox() {
        const sandbox = await this._ready;
        sandbox.nukeSandbox();
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=generic_scripting.js.map