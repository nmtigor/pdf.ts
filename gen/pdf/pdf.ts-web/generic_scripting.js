/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { getPdfFilenameFromUrl, loadScript, QuickJSSandbox, } from "../pdf.ts-src/pdf.js";
/*80--------------------------------------------------------------------------*/
export async function docProperties(pdfDocument) {
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