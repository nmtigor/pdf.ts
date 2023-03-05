/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { createValidAbsoluteUrl, shadow, warn, } from "../shared/util.js";
import { ChunkedStreamManager } from "./chunked_stream.js";
import { MissingDataException } from "./core_utils.js";
import { PDFDocument } from "./document.js";
import { Stream } from "./stream.js";
/*80--------------------------------------------------------------------------*/
function parseDocBaseUrl(url) {
    if (url) {
        const absoluteUrl = createValidAbsoluteUrl(url);
        if (absoluteUrl) {
            return absoluteUrl.href;
        }
        warn(`Invalid absolute docBaseUrl: "${url}".`);
    }
    return undefined;
}
export class BasePdfManager {
    _docBaseUrl;
    get docBaseUrl() {
        const catalog = this.pdfDocument.catalog;
        return shadow(this, "docBaseUrl", catalog.baseUrl || this._docBaseUrl);
    }
    _docId;
    /** @final */
    get docId() {
        return this._docId;
    }
    _password;
    /** @final */
    get password() {
        return this._password;
    }
    msgHandler;
    enableXfa;
    evaluatorOptions;
    pdfDocument;
    constructor(args) {
        this._docBaseUrl = parseDocBaseUrl(args.docBaseUrl);
        this._docId = args.docId;
        this._password = args.password;
        this.enableXfa = args.enableXfa;
        this.evaluatorOptions = args.evaluatorOptions;
    }
    /** @fianl */
    ensureDoc(prop, args) {
        return this.ensure(this.pdfDocument, prop, args);
    }
    /** @fianl */
    ensureXRef(prop, args) {
        return this.ensure(this.pdfDocument.xref, prop, args);
    }
    /** @fianl */
    ensureCatalog(prop, args) {
        return this.ensure(this.pdfDocument.catalog, prop, args);
    }
    getPage(pageIndex) {
        return this.pdfDocument.getPage(pageIndex);
    }
    fontFallback(id, handler) {
        return this.pdfDocument.fontFallback(id, handler);
    }
    loadXfaFonts(handler, task) {
        return this.pdfDocument.loadXfaFonts(handler, task);
    }
    loadXfaImages() {
        return this.pdfDocument.loadXfaImages();
    }
    serializeXfaData(annotationStorage) {
        return this.pdfDocument.serializeXfaData(annotationStorage);
    }
    cleanup(manuallyTriggered = false) {
        return this.pdfDocument.cleanup(manuallyTriggered);
    }
    updatePassword(password) {
        this._password = password;
    }
}
export class LocalPdfManager extends BasePdfManager {
    #loadedStreamPromise;
    constructor(args) {
        super(args);
        const stream = new Stream(args.source);
        this.pdfDocument = new PDFDocument(this, stream);
        this.#loadedStreamPromise = Promise.resolve(stream);
    }
    /** @implement */
    async ensure(obj, prop, args) {
        const value = obj[prop];
        if (typeof value === "function") {
            return value.apply(obj, args);
        }
        return value;
    }
    /** @implement */
    requestRange(begin, end) {
        return Promise.resolve();
    }
    /** @implement */
    requestLoadedStream(noFetch = false) {
        return this.#loadedStreamPromise;
    }
    /** @implement */
    terminate(reason) { }
}
export class NetworkPdfManager extends BasePdfManager {
    streamManager;
    constructor(args) {
        super(args);
        this.streamManager = new ChunkedStreamManager(args.source, {
            msgHandler: args.handler,
            length: args.length,
            disableAutoFetch: args.disableAutoFetch,
            rangeChunkSize: args.rangeChunkSize,
        });
        this.pdfDocument = new PDFDocument(this, this.streamManager.getStream());
    }
    /** @implement */
    async ensure(obj, prop, args) {
        try {
            const value = obj[prop];
            if (typeof value === "function") {
                return value.apply(obj, args);
            }
            return value;
        }
        catch (ex) {
            if (!(ex instanceof MissingDataException)) {
                throw ex;
            }
            await this.requestRange(ex.begin, ex.end);
            return this.ensure(obj, prop, args);
        }
    }
    /** @implement */
    requestRange(begin, end) {
        return this.streamManager.requestRange(begin, end);
    }
    /** @implement */
    requestLoadedStream(noFetch = false) {
        return this.streamManager.requestAllChunks(noFetch);
    }
    sendProgressiveData(chunk) {
        this.streamManager.onReceiveData({ chunk });
    }
    /** @implement */
    terminate(reason) {
        this.streamManager.abort(reason);
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=pdf_manager.js.map