/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
/* Copyright 2012 Mozilla Foundation
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
/**
 * @module pdfjsLib
 */
import { CHROME, DENO, GENERIC, MOZCENTRAL, PDFJSDev, SKIP_BABEL, TESTING, } from "../../../global.js";
import { PromiseCap } from "../../../lib/util/PromiseCap.js";
import { assert } from "../../../lib/util/trace.js";
import { MessageHandler } from "../shared/message_handler.js";
import { AbortException, AnnotationMode, getVerbosityLevel, info, InvalidPDFException, isArrayBuffer, MAX_IMAGE_SIZE_TO_CACHE, MissingPDFException, PasswordException, RenderingIntentFlag, setVerbosityLevel, shadow, stringToBytes, UnexpectedResponseException, UnknownErrorException, warn, } from "../shared/util.js";
import { AnnotationStorage, PrintAnnotationStorage, SerializableEmpty, } from "./annotation_storage.js";
import { CanvasGraphics } from "./canvas.js";
import { deprecated, DOMCanvasFactory, DOMCMapReaderFactory, DOMFilterFactory, DOMStandardFontDataFactory, isDataScheme, isValidFetchUrl, loadScript, PageViewport, RenderingCancelledException, StatTimer, } from "./display_utils.js";
import { FontFaceObject, FontLoader } from "./font_loader.js";
import { Metadata } from "./metadata.js";
import { OptionalContentConfig } from "./optional_content_config.js";
import { PDFDataTransportStream } from "./transport_stream.js";
import { GlobalWorkerOptions } from "./worker_options.js";
import { XfaText } from "./xfa_text.js";
/*80--------------------------------------------------------------------------*/
const DEFAULT_RANGE_CHUNK_SIZE = 65536; // 2^16 = 65536
const RENDERING_CANCELLED_TIMEOUT = 100; // ms
const DELAYED_CLEANUP_TIMEOUT = 5000; // ms
export const DefaultCanvasFactory = DOMCanvasFactory;
export const DefaultCMapReaderFactory = DOMCMapReaderFactory;
export const DefaultFilterFactory = DOMFilterFactory;
export const DefaultStandardFontDataFactory = DOMStandardFontDataFactory;
// const DefaultCanvasFactory =
//   typeof PDFJSDev !== "undefined" && PDFJSDev.test("GENERIC") && isNodeJS
//     ? require("./node_utils.js").NodeCanvasFactory
//     : DOMCanvasFactory;
// const DefaultCMapReaderFactory =
//   typeof PDFJSDev !== "undefined" && PDFJSDev.test("GENERIC") && isNodeJS
//     ? require("./node_utils.js").NodeCMapReaderFactory
//     : DOMCMapReaderFactory;
// const DefaultFilterFactory =
//   typeof PDFJSDev !== "undefined" && PDFJSDev.test("GENERIC") && isNodeJS
//     ? require("./node_utils.js").NodeFilterFactory
//     : DOMFilterFactory;
// const DefaultStandardFontDataFactory =
//   typeof PDFJSDev !== "undefined" && PDFJSDev.test("GENERIC") && isNodeJS
//     ? require("./node_utils.js").NodeStandardFontDataFactory
//     : DOMStandardFontDataFactory;
const createPDFNetworkStream = /*#static*/ (() => {
    const streamsPromise = Promise.all([
        import("./network.js"),
        import("./fetch_stream.js"),
    ]);
    return async (params) => {
        const [{ PDFNetworkStream }, { PDFFetchStream }] = await streamsPromise;
        return isValidFetchUrl(params.url)
            ? new PDFFetchStream(params)
            : new PDFNetworkStream(params);
    };
})();
/**
 * This is the main entry point for loading a PDF and interacting with it.
 *
 * NOTE: If a URL is used to fetch the PDF data a standard Fetch API call (or
 * XHR as fallback) is used, which means it must follow same origin rules,
 * e.g. no cross-domain requests without CORS.
 *
 * @headconst @param src_x Can be a URL where a PDF file is located, a typed
 *    array (Uint8Array) already populated with data, or a parameter object.
 */
export function getDocument(src_x) {
    let src = src_x;
    /*#static*/  {
        if (typeof src_x === "string" || src_x instanceof URL) {
            src = { url: src_x };
        }
        else if (isArrayBuffer(src_x)) {
            src = { data: src_x };
        }
    }
    if (typeof src !== "object") {
        throw new Error("Invalid parameter in getDocument, need parameter object.");
    }
    if (!src.url && !src.data && !src.range) {
        throw new Error("Invalid parameter object: need either .data, .range or .url");
    }
    const task = new PDFDocumentLoadingTask();
    const { docId } = task;
    const url = src.url ? getUrlProp(src.url) : undefined;
    const data = src.data ? getDataProp(src.data) : undefined;
    const httpHeaders = src.httpHeaders || undefined;
    const withCredentials = src.withCredentials === true;
    const password = src.password ?? undefined;
    const rangeTransport = src.range instanceof PDFDataRangeTransport
        ? src.range
        : undefined;
    const rangeChunkSize = Number.isInteger(src.rangeChunkSize) && src.rangeChunkSize > 0
        ? src.rangeChunkSize
        : DEFAULT_RANGE_CHUNK_SIZE;
    let worker = src.worker instanceof PDFWorker ? src.worker : undefined;
    const verbosity = src.verbosity;
    // Ignore "data:"-URLs, since they can't be used to recover valid absolute
    // URLs anyway. We want to avoid sending them to the worker-thread, since
    // they contain the *entire* PDF document and can thus be arbitrarily long.
    const docBaseUrl = typeof src.docBaseUrl === "string" && !isDataScheme(src.docBaseUrl)
        ? src.docBaseUrl
        : undefined;
    const cMapUrl = typeof src.cMapUrl === "string" ? src.cMapUrl : undefined;
    const cMapPacked = src.cMapPacked !== false;
    const CMapReaderFactory = src.CMapReaderFactory || DefaultCMapReaderFactory;
    const standardFontDataUrl = typeof src.standardFontDataUrl === "string"
        ? src.standardFontDataUrl
        : undefined;
    const StandardFontDataFactory = src.StandardFontDataFactory ||
        DefaultStandardFontDataFactory;
    const ignoreErrors = src.stopAtErrors !== true;
    const maxImageSize = Number.isInteger(src.maxImageSize) && src.maxImageSize > -1
        ? src.maxImageSize
        : -1;
    const isEvalSupported = src.isEvalSupported !== false;
    const isOffscreenCanvasSupported = typeof src.isOffscreenCanvasSupported === "boolean"
        ? src.isOffscreenCanvasSupported
        : !DENO;
    const canvasMaxAreaInBytes = Number.isInteger(src.canvasMaxAreaInBytes)
        ? src.canvasMaxAreaInBytes
        : -1;
    const disableFontFace = typeof src.disableFontFace === "boolean"
        ? src.disableFontFace
        : DENO;
    const fontExtraProperties = src.fontExtraProperties === true;
    const enableXfa = src.enableXfa === true;
    const ownerDocument = src.ownerDocument || globalThis.document;
    const disableRange = src.disableRange === true;
    const disableStream = src.disableStream === true;
    const disableAutoFetch = src.disableAutoFetch === true;
    const pdfBug = src.pdfBug === true;
    // Parameters whose default values depend on other parameters.
    const length = rangeTransport ? rangeTransport.length : src.length ?? NaN;
    const useSystemFonts = typeof src.useSystemFonts === "boolean"
        ? src.useSystemFonts
        : !DENO && !disableFontFace;
    const useWorkerFetch = typeof src.useWorkerFetch === "boolean"
        ? src.useWorkerFetch
        : MOZCENTRAL ||
            (CMapReaderFactory === DOMCMapReaderFactory &&
                StandardFontDataFactory === DOMStandardFontDataFactory &&
                isValidFetchUrl(cMapUrl, globalThis.document?.baseURI) &&
                isValidFetchUrl(standardFontDataUrl, globalThis.document?.baseURI));
    const canvasFactory = src.canvasFactory ||
        new DefaultCanvasFactory({ ownerDocument });
    const filterFactory = src.filterFactory ||
        new DefaultFilterFactory({ docId, ownerDocument });
    // Parameters only intended for development/testing purposes.
    const styleElement = /*#static*/ src.styleElement;
    // Set the main-thread verbosity level.
    setVerbosityLevel(verbosity);
    // Ensure that the various factories can be initialized, when necessary,
    // since the user may provide *custom* ones.
    const transportFactory = {
        canvasFactory,
        filterFactory,
    };
    if (!useWorkerFetch) {
        transportFactory.cMapReaderFactory = new CMapReaderFactory({
            baseUrl: cMapUrl,
            isCompressed: cMapPacked,
        });
        transportFactory.standardFontDataFactory = new StandardFontDataFactory({
            baseUrl: standardFontDataUrl,
        });
    }
    if (!worker) {
        const workerParams = {
            verbosity,
            port: GlobalWorkerOptions.workerPort,
        };
        // Worker was not provided -- creating and owning our own. If message port
        // is specified in global worker options, using it.
        worker = workerParams.port
            ? PDFWorker.fromPort(workerParams)
            : new PDFWorker(workerParams);
        task._worker = worker;
    }
    const fetchDocParams = {
        docId,
        // typeof PDFJSDev !== "undefined" && !PDFJSDev.test("TESTING")
        //   ? PDFJSDev.eval("BUNDLE_VERSION")
        //   : null,
        apiVersion: /*#static*/ 0,
        data,
        password,
        disableAutoFetch,
        rangeChunkSize,
        length,
        docBaseUrl,
        enableXfa,
        evaluatorOptions: {
            maxImageSize,
            disableFontFace,
            ignoreErrors,
            isEvalSupported,
            isOffscreenCanvasSupported,
            canvasMaxAreaInBytes,
            fontExtraProperties,
            useSystemFonts,
            cMapUrl: useWorkerFetch ? cMapUrl : undefined,
            standardFontDataUrl: useWorkerFetch ? standardFontDataUrl : undefined,
        },
    };
    const transportParams = {
        ignoreErrors,
        isEvalSupported,
        disableFontFace,
        fontExtraProperties,
        enableXfa,
        ownerDocument,
        disableAutoFetch,
        pdfBug,
        styleElement,
    };
    worker.promise
        .then(() => {
        if (task.destroyed) {
            throw new Error("Loading aborted");
        }
        const workerIdPromise = _fetchDocument(worker, fetchDocParams);
        const networkStreamPromise = new Promise((resolve) => {
            let networkStream;
            if (rangeTransport) {
                networkStream = new PDFDataTransportStream({
                    length,
                    initialData: rangeTransport.initialData,
                    progressiveDone: rangeTransport.progressiveDone,
                    contentDispositionFilename: rangeTransport.contentDispositionFilename,
                    disableRange,
                    disableStream,
                }, rangeTransport);
            }
            else if (!data) {
                /*#static*/ 
                networkStream = createPDFNetworkStream({
                    url,
                    length,
                    httpHeaders,
                    withCredentials,
                    rangeChunkSize,
                    disableRange,
                    disableStream,
                });
            }
            resolve(networkStream);
        });
        return Promise.all([workerIdPromise, networkStreamPromise]).then(([workerId, networkStream]) => {
            if (task.destroyed) {
                throw new Error("Loading aborted");
            }
            const messageHandler = new MessageHandler(docId, workerId, worker.port);
            const transport = new WorkerTransport(messageHandler, task, networkStream, transportParams, transportFactory);
            task._transport = transport;
            messageHandler.send("Ready", null);
        });
    })
        .catch(task._capability.reject);
    return task;
}
/**
 * Starts fetching of specified PDF document/data.
 *
 * @param docId Unique document ID, used in `MessageHandler`.
 * @return A promise that is resolved when the worker ID of the
 *   `MessageHandler` is known.
 * @private
 */
async function _fetchDocument(worker, source) {
    if (worker.destroyed) {
        throw new Error("Worker was destroyed");
    }
    const workerId = await worker.messageHandler.sendWithPromise("GetDocRequest", source, source.data ? [source.data.buffer] : undefined);
    if (worker.destroyed) {
        throw new Error("Worker was destroyed");
    }
    return workerId;
}
function getUrlProp(val) {
    /*#static*/ 
    if (val instanceof URL) {
        return val.href;
    }
    try {
        // The full path is required in the 'url' field.
        return new URL(val, window.location).href;
    }
    catch {
        /*#static*/ 
    }
    throw new Error("Invalid PDF url data: " +
        "either string or URL-object is expected in the url property.");
}
function getDataProp(val) {
    // Converting string or array-like data to Uint8Array.
    /*#static*/ 
    if (val instanceof Uint8Array && val.byteLength === val.buffer.byteLength) {
        // Use the data as-is when it's already a Uint8Array that completely
        // "utilizes" its underlying ArrayBuffer, to prevent any possible
        // issues when transferring it to the worker-thread.
        return val;
    }
    if (typeof val === "string") {
        return stringToBytes(val);
    }
    if ((typeof val === "object" && !isNaN(val?.length)) ||
        isArrayBuffer(val)) {
        return new Uint8Array(val);
    }
    throw new Error("Invalid PDF binary data: either TypedArray, " +
        "string, or array-like object is expected in the data property.");
}
/**
 * The loading task controls the operations required to load a PDF document
 * (such as network requests) and provides a way to listen for completion,
 * after which individual pages can be rendered.
 */
export class PDFDocumentLoadingTask {
    static #docId = 0;
    _capability = new PromiseCap();
    _transport;
    _worker;
    /**
     * Unique identifier for the document loading task.
     */
    docId;
    /**
     * Whether the loading task is destroyed or not.
     */
    destroyed = false;
    /**
     * Callback to request a password if a wrong or no password was provided.
     * The callback receives two parameters: a function that should be called
     * with the new password, and a reason (see {@link PasswordResponses}).
     */
    onPassword;
    /**
     * Callback to be able to monitor the loading progress of the PDF file
     * (necessary to implement e.g. a loading bar).
     * The callback receives an {@link OnProgressP} argument.
     */
    onProgress;
    constructor() {
        this.docId = `d${PDFDocumentLoadingTask.#docId++}`;
    }
    /**
     * Promise for document loading task completion.
     */
    get promise() {
        return this._capability.promise;
    }
    /**
     * Abort all network requests and destroy the worker.
     * @return A promise that is resolved when destruction is completed.
     */
    async destroy() {
        this.destroyed = true;
        await this._transport?.destroy();
        this._transport = undefined;
        if (this._worker) {
            this._worker.destroy();
            this._worker = undefined;
        }
    }
}
/**
 * Abstract class to support range requests file loading.
 *
 * NOTE: The TypedArrays passed to the constructor and relevant methods below
 * will generally be transferred to the worker-thread. This will help reduce
 * main-thread memory usage, however it will take ownership of the TypedArrays.
 */
export class PDFDataRangeTransport {
    length;
    initialData;
    progressiveDone;
    contentDispositionFilename;
    #rangeListeners = [];
    addRangeListener(listener) {
        this.#rangeListeners.push(listener);
    }
    #progressListeners = [];
    addProgressListener(listener) {
        this.#progressListeners.push(listener);
    }
    #progressiveReadListeners = [];
    addProgressiveReadListener(listener) {
        this.#progressiveReadListeners.push(listener);
    }
    #progressiveDoneListeners = [];
    addProgressiveDoneListener(listener) {
        this.#progressiveDoneListeners.push(listener);
    }
    #readyCapability = new PromiseCap();
    constructor(length, initialData, progressiveDone = false, contentDispositionFilename) {
        this.length = length;
        this.initialData = initialData;
        this.progressiveDone = progressiveDone;
        this.contentDispositionFilename = contentDispositionFilename;
    }
    onDataRange(begin, chunk) {
        for (const listener of this.#rangeListeners) {
            listener(begin, chunk);
        }
    }
    onDataProgress(loaded, total) {
        this.#readyCapability.promise.then(() => {
            for (const listener of this.#progressListeners) {
                listener(loaded, total);
            }
        });
    }
    onDataProgressiveRead(chunk) {
        this.#readyCapability.promise.then(() => {
            for (const listener of this.#progressiveReadListeners) {
                listener(chunk);
            }
        });
    }
    onDataProgressiveDone() {
        this.#readyCapability.promise.then(() => {
            for (const listener of this.#progressiveDoneListeners) {
                listener();
            }
        });
    }
    transportReady() {
        this.#readyCapability.resolve();
    }
    requestDataRange(begin, end) {
        assert(0, "Abstract method PDFDataRangeTransport.requestDataRange");
    }
    abort() { }
}
/**
 * Proxy to a `PDFDocument` in the worker thread.
 */
export class PDFDocumentProxy {
    #pdfInfo;
    _transport;
    constructor(pdfInfo, transport) {
        this.#pdfInfo = pdfInfo;
        this._transport = transport;
        /*#static*/  {
            // For testing purposes.
            Object.defineProperty(this, "getXFADatasets", {
                value: () => {
                    return this._transport.getXFADatasets();
                },
            });
            Object.defineProperty(this, "getXRefPrevValue", {
                value: () => {
                    return this._transport.getXRefPrevValue();
                },
            });
            Object.defineProperty(this, "getAnnotArray", {
                value: (pageIndex) => {
                    return this._transport.getAnnotArray(pageIndex);
                },
            });
        }
    }
    /**
     * @return Storage for annotation data in forms.
     */
    get annotationStorage() {
        return this._transport.annotationStorage;
    }
    /**
     * @return The filter factory instance.
     */
    get filterFactory() {
        return this._transport.filterFactory;
    }
    /**
     * @return Total number of pages in the PDF file.
     */
    get numPages() {
        return this.#pdfInfo.numPages;
    }
    /**
     * A (not guaranteed to be) unique ID to
     * identify the PDF document.
     * NOTE: The first element will always be defined for all PDF documents,
     * whereas the second element is only defined for *modified* PDF documents.
     */
    get fingerprints() {
        return this.#pdfInfo.fingerprints;
    }
    /**
     * @return True if only XFA form.
     */
    get isPureXfa() {
        return shadow(this, "isPureXfa", !!this._transport._htmlForXfa);
    }
    /**
     * NOTE: This is (mostly) intended to support printing of XFA forms.
     *
     * An object representing a HTML tree structure
     * to render the XFA, or `null` when no XFA form exists.
     */
    get allXfaHtml() {
        return this._transport._htmlForXfa;
    }
    /**
     * @param pageNumber The page number to get. The first page is 1.
     * @return A promise that is resolved with a {@link PDFPageProxy} object.
     */
    getPage(pageNumber) {
        return this._transport.getPage(pageNumber);
    }
    /**
     * @param ref The page reference.
     * @return A promise that is resolved with the page index,
     *   starting from zero, that is associated with the reference.
     */
    getPageIndex(ref) {
        return this._transport.getPageIndex(ref);
    }
    /**
     * @return A promise that is resolved
     *   with a mapping from named destinations to references.
     *
     * This can be slow for large documents. Use `getDestination` instead.
     */
    getDestinations() {
        return this._transport.getDestinations();
    }
    /**
     * @param id The named destination to get.
     * @return A promise that is resolved with all
     *   information of the given named destination, or `null` when the named
     *   destination is not present in the PDF file.
     */
    getDestination(id) {
        return this._transport.getDestination(id);
    }
    /**
     * @return A promise that is resolved with
     *   an {Array} containing the page labels that correspond to the page
     *   indexes, or `null` when no page labels are present in the PDF file.
     */
    getPageLabels() {
        return this._transport.getPageLabels();
    }
    /**
     * @return A promise that is resolved with a {string}
     *   containing the page layout name.
     */
    getPageLayout() {
        return this._transport.getPageLayout();
    }
    /**
     * @return A promise that is resolved with a {string}
     *   containing the page mode name.
     */
    getPageMode() {
        return this._transport.getPageMode();
    }
    /**
     * @return A promise that is resolved with an
     *   {Object} containing the viewer preferences, or `null` when no viewer
     *   preferences are present in the PDF file.
     */
    getViewerPreferences() {
        return this._transport.getViewerPreferences();
    }
    /**
     * @return A promise that is resolved with an {Array}
     *   containing the destination, or `null` when no open action is present
     *   in the PDF.
     */
    getOpenAction() {
        return this._transport.getOpenAction();
    }
    /**
     * @return A promise that is resolved with a lookup table
     *   for mapping named attachments to their content.
     */
    getAttachments() {
        return this._transport.getAttachments();
    }
    /**
     * @return A promise that is resolved with
     *   an {Array} of all the JavaScript strings in the name tree, or `null`
     *   if no JavaScript exists.
     */
    getJavaScript() {
        return this._transport.getJavaScript();
    }
    /**
     * @return A promise that is resolved with
     *   an {Object} with the JavaScript actions:
     *     - from the name tree (like getJavaScript);
     *     - from A or AA entries in the catalog dictionary.
     *   , or `null` if no JavaScript exists.
     */
    getJSActions() {
        return this._transport.getDocJSActions();
    }
    /**
     * @return A promise that is resolved with an
     *   {Array} that is a tree outline (if it has one) of the PDF file.
     */
    getOutline() {
        return this._transport.getOutline();
    }
    /**
     * @return A promise that is resolved with
     *   an {@link OptionalContentConfig} that contains all the optional content
     *   groups (assuming that the document has any).
     */
    getOptionalContentConfig() {
        return this._transport.getOptionalContentConfig();
    }
    /**
     * @return A promise that is resolved with
     *   an {Array} that contains the permission flags for the PDF document, or
     *   `null` when no permissions are present in the PDF file.
     */
    getPermissions() {
        return this._transport.getPermissions();
    }
    /**
     * @return A promise that is
     *   resolved with an {Object} that has `info` and `metadata` properties.
     *   `info` is an {Object} filled with anything available in the information
     *   dictionary and similarly `metadata` is a {Metadata} object with
     *   information from the metadata section of the PDF.
     */
    getMetadata() {
        return this._transport.getMetadata();
    }
    /**
     * @return A promise that is resolved with
     *   a {MarkInfo} object that contains the MarkInfo flags for the PDF
     *   document, or `null` when no MarkInfo values are present in the PDF file.
     */
    getMarkInfo() {
        return this._transport.getMarkInfo();
    }
    /**
     * @return A promise that is resolved with a
     *   {Uint8Array} containing the raw data of the PDF document.
     */
    getData() {
        return this._transport.getData();
    }
    /**
     * @return A promise that is resolved with a
     *   {Uint8Array} containing the full data of the saved document.
     */
    saveDocument() {
        return this._transport.saveDocument();
    }
    /**
     * @return A promise that is resolved when the
     *   document's data is loaded. It is resolved with an {Object} that contains
     *   the `length` property that indicates size of the PDF data in bytes.
     */
    getDownloadInfo() {
        return this._transport.downloadInfoCapability.promise;
    }
    /**
     * Cleans up resources allocated by the document on both the main and worker
     * threads.
     *
     * NOTE: Do not, under any circumstances, call this method when rendering is
     * currently ongoing since that may lead to rendering errors.
     *
     * @param keepLoadedFonts Let fonts remain attached to the DOM.
     *   NOTE: This will increase persistent memory usage, hence don't use this
     *   option unless absolutely necessary. The default value is `false`.
     * @return A promise that is resolved when clean-up has finished.
     */
    cleanup(keepLoadedFonts = false) {
        return this._transport.startCleanup();
    }
    /**
     * Destroys the current document instance and terminates the worker.
     */
    destroy() {
        return this.loadingTask.destroy();
    }
    /**
     * A subset of the current
     * {DocumentInitParameters}, which are needed in the viewer.
     */
    get loadingParams() {
        return this._transport.loadingParams;
    }
    /**
     * The loadingTask for the current document.
     */
    get loadingTask() {
        return this._transport.loadingTask;
    }
    /**
     * @return A promise that is
     *   resolved with an {Object} containing /AcroForm field data for the JS
     *   sandbox, or `null` when no field data is present in the PDF file.
     */
    getFieldObjects() {
        return this._transport.getFieldObjects();
    }
    /**
     * @return A promise that is resolved with `true`
     *   if some /AcroForm fields have JavaScript actions.
     */
    hasJSActions() {
        return this._transport.hasJSActions();
    }
    /**
     * @return A promise that is resolved with an
     *   {Array<string>} containing IDs of annotations that have a calculation
     *   action, or `null` when no such annotations are present in the PDF file.
     */
    getCalculationOrderIds() {
        return this._transport.getCalculationOrderIds();
    }
    getXFADatasets;
    getXRefPrevValue;
    getAnnotArray;
}
/**
 * Proxy to a `PDFPage` in the worker thread.
 */
export class PDFPageProxy {
    _pageIndex;
    _pageInfo;
    _transport;
    _stats;
    /**
     * @return Returns page stats, if enabled; returns `undefined` otherwise.
     */
    get stats() {
        return this._stats;
    }
    _pdfBug;
    commonObjs;
    objs = new PDFObjects();
    // _structTreePromise: Promise<StructTreeNode | undefined> | undefined;
    _maybeCleanupAfterRender = false;
    #intentStates = new Map();
    destroyed = false;
    // _annotationsPromise: Promise<AnnotationData[]> | undefined;
    // _annotationsIntent: AnnotIntent | undefined;
    // _jsActionsPromise: Promise<AnnotActions | undefined> | undefined;
    // _xfaPromise: Promise<XFAData | undefined> | undefined;
    #delayedCleanupTimeout;
    #pendingCleanup = false;
    constructor(pageIndex, pageInfo, transport, pdfBug = false) {
        this._pageIndex = pageIndex;
        this._pageInfo = pageInfo;
        this._transport = transport;
        this._stats = pdfBug ? new StatTimer() : undefined;
        this._pdfBug = pdfBug;
        this.commonObjs = transport.commonObjs;
    }
    /**
     * @return Page number of the page. First page is 1.
     */
    get pageNumber() {
        return this._pageIndex + 1;
    }
    /**
     * The number of degrees the page is rotated clockwise.
     */
    get rotate() {
        return this._pageInfo.rotate;
    }
    /**
     * The reference that points to this page.
     */
    get ref() {
        return this._pageInfo.ref;
    }
    /**
     * The default size of units in 1/72nds of an inch.
     */
    get userUnit() {
        return this._pageInfo.userUnit;
    }
    /**
     * An array of the visible portion of the PDF page in
     * user space units [x1, y1, x2, y2].
     */
    get view() {
        return this._pageInfo.view;
    }
    /**
     * @param params Viewport parameters.
     * @return Contains 'width' and 'height' properties
     *   along with transforms required for rendering.
     */
    getViewport({ scale, rotation = this.rotate, offsetX = 0, offsetY = 0, dontFlip = false, }) {
        return new PageViewport({
            viewBox: this.view,
            scale,
            rotation,
            offsetX,
            offsetY,
            dontFlip,
        });
    }
    /**
     * @param params Annotation parameters.
     * @return A promise that is resolved with an
     *   {Array} of the annotation objects.
     */
    getAnnotations({ intent = "display" } = {}) {
        const intentArgs = this._transport.getRenderingIntent(intent);
        return this._transport.getAnnotations(this._pageIndex, intentArgs.renderingIntent);
    }
    /**
     * @return A promise that is resolved with an
     *   {Object} with JS actions.
     */
    getJSActions() {
        return this._transport.getPageJSActions(this._pageIndex);
    }
    /**
     * @return The filter factory instance.
     */
    get filterFactory() {
        return this._transport.filterFactory;
    }
    /**
     * @return True if only XFA form.
     */
    get isPureXfa() {
        return shadow(this, "isPureXfa", !!this._transport._htmlForXfa);
    }
    /**
     * A promise that is resolved with
     * an {Object} with a fake DOM object (a tree structure where elements
     * are {Object} with a name, attributes (class, style, ...), value and
     * children, very similar to a HTML DOM tree), or `null` if no XFA exists.
     */
    async getXfa() {
        return this._transport._htmlForXfa?.children[this._pageIndex] || undefined;
    }
    /**
     * Begins the process of rendering a page to the desired context.
     *
     * @param params Page render parameters.
     * @return An object that contains a promise that is
     *   resolved when the page finishes rendering.
     */
    render({ canvasContext, viewport, intent = "display", annotationMode = AnnotationMode.ENABLE, transform = undefined, background, optionalContentConfigPromise, annotationCanvasMap = undefined, pageColors = undefined, printAnnotationStorage = undefined, }) {
        this._stats?.time("Overall");
        const intentArgs = this._transport.getRenderingIntent(intent, annotationMode, printAnnotationStorage);
        // If there was a pending destroy, cancel it so no cleanup happens during
        // this call to render...
        this.#pendingCleanup = false;
        // ... and ensure that a delayed cleanup is always aborted.
        this.#abortDelayedCleanup();
        if (!optionalContentConfigPromise) {
            optionalContentConfigPromise = this._transport.getOptionalContentConfig();
        }
        let intentState = this.#intentStates.get(intentArgs.cacheKey);
        if (!intentState) {
            intentState = Object.create(null);
            this.#intentStates.set(intentArgs.cacheKey, intentState);
        }
        // Ensure that a pending `streamReader` cancel timeout is always aborted.
        if (intentState.streamReaderCancelTimeout) {
            clearTimeout(intentState.streamReaderCancelTimeout);
            intentState.streamReaderCancelTimeout = undefined;
        }
        const intentPrint = !!(intentArgs.renderingIntent & RenderingIntentFlag.PRINT);
        // If there's no displayReadyCapability yet, then the operatorList
        // was never requested before. Make the request and create the promise.
        if (!intentState.displayReadyCapability) {
            intentState.displayReadyCapability = new PromiseCap();
            intentState.operatorList = {
                fnArray: [],
                argsArray: [],
                lastChunk: false,
                separateAnnots: undefined,
            };
            this._stats?.time("Page Request");
            this.#pumpOperatorList(intentArgs);
        }
        const complete = (error) => {
            intentState.renderTasks.delete(internalRenderTask);
            // Attempt to reduce memory usage during *printing*, by always running
            // cleanup immediately once rendering has finished.
            if (this._maybeCleanupAfterRender || intentPrint) {
                this.#pendingCleanup = true;
            }
            this.#tryCleanup(/* delayed = */ !intentPrint);
            if (error) {
                internalRenderTask.capability.reject(error);
                this.#abortOperatorList({
                    intentState: intentState,
                    reason: error instanceof Error ? error : new Error(error),
                });
            }
            else {
                internalRenderTask.capability.resolve();
            }
            this._stats?.timeEnd("Rendering");
            this._stats?.timeEnd("Overall");
        };
        const internalRenderTask = new InternalRenderTask({
            callback: complete,
            // Only include the required properties, and *not* the entire object.
            params: {
                canvasContext,
                viewport,
                transform,
                background,
            },
            objs: this.objs,
            commonObjs: this.commonObjs,
            annotationCanvasMap,
            operatorList: intentState.operatorList,
            pageIndex: this._pageIndex,
            canvasFactory: this._transport.canvasFactory,
            filterFactory: this._transport.filterFactory,
            useRequestAnimationFrame: !intentPrint,
            pdfBug: this._pdfBug,
            pageColors,
        });
        (intentState.renderTasks ||= new Set()).add(internalRenderTask);
        const renderTask = internalRenderTask.task;
        Promise.all([
            intentState.displayReadyCapability.promise,
            optionalContentConfigPromise,
        ])
            .then(([transparency, optionalContentConfig]) => {
            if (this.destroyed) {
                complete();
                return;
            }
            this._stats?.time("Rendering");
            internalRenderTask.initializeGraphics({
                transparency,
                optionalContentConfig,
            });
            internalRenderTask.operatorListChanged();
        })
            .catch(complete);
        return renderTask;
    }
    /**
     * @param params Page getOperatorList parameters.
     * @return A promise resolved with an
     *   {@link PDFOperatorList} object that represents the page's operator list.
     */
    getOperatorList({ intent = "display", annotationMode = AnnotationMode.ENABLE, printAnnotationStorage = undefined, } = {}) {
        /*#static*/ 
        function operatorListChanged() {
            if (intentState.operatorList.lastChunk) {
                intentState.opListReadCapability.resolve(intentState.operatorList);
                intentState.renderTasks.delete(opListTask);
            }
        }
        const intentArgs = this._transport.getRenderingIntent(intent, annotationMode, printAnnotationStorage, 
        /* isOpList = */ true);
        let intentState = this.#intentStates.get(intentArgs.cacheKey);
        if (!intentState) {
            intentState = Object.create(null);
            this.#intentStates.set(intentArgs.cacheKey, intentState);
        }
        let opListTask;
        if (!intentState.opListReadCapability) {
            opListTask = Object.create(null);
            opListTask.operatorListChanged = operatorListChanged;
            intentState.opListReadCapability = new PromiseCap();
            (intentState.renderTasks ||= new Set()).add(opListTask);
            intentState.operatorList = {
                fnArray: [],
                argsArray: [],
                lastChunk: false,
                separateAnnots: undefined,
            };
            this._stats?.time("Page Request");
            this.#pumpOperatorList(intentArgs);
        }
        return intentState.opListReadCapability.promise;
    }
    /**
     * NOTE: All occurrences of whitespace will be replaced by
     * standard spaces (0x20).
     *
     * @param params getTextContent parameters.
     * @return Stream for reading text content chunks.
     */
    streamTextContent({ includeMarkedContent = false, disableNormalization = false, } = {}) {
        const TEXT_CONTENT_CHUNK_SIZE = 100;
        return this._transport.messageHandler.sendWithStream("GetTextContent", {
            pageIndex: this._pageIndex,
            includeMarkedContent: includeMarkedContent === true,
            disableNormalization: disableNormalization === true,
        }, {
            highWaterMark: TEXT_CONTENT_CHUNK_SIZE,
            size(textContent) {
                return textContent.items.length;
            },
        });
    }
    /**
     * NOTE: All occurrences of whitespace will be replaced by
     * standard spaces (0x20).
     *
     * @param params - getTextContent parameters.
     * @return A promise that is resolved with a
     *   {@link TextContent} object that represents the page's text content.
     */
    getTextContent(params = {}) {
        if (this._transport._htmlForXfa) {
            // TODO: We need to revisit this once the XFA foreground patch lands and
            // only do this for non-foreground XFA.
            return this.getXfa().then((xfa) => {
                return XfaText.textContent(xfa);
            });
        }
        const readableStream = this.streamTextContent(params);
        return new Promise((resolve, reject) => {
            function pump() {
                reader.read().then(({ value, done }) => {
                    if (done) {
                        resolve(textContent);
                        return;
                    }
                    Object.assign(textContent.styles, value.styles);
                    textContent.items.push(...value.items);
                    pump();
                }, reject);
            }
            const reader = readableStream.getReader();
            const textContent = {
                items: [],
                styles: Object.create(null),
            };
            pump();
        });
    }
    /**
     * @return A promise that is resolved with a
     *   {@link StructTreeNode} object that represents the page's structure tree,
     *   or `null` when no structure tree is present for the current page.
     */
    getStructTree() {
        return this._transport.getStructTree(this._pageIndex);
    }
    /**
     * Destroys the page object.
     * @private
     */
    _destroy() {
        this.destroyed = true;
        const waitOn = [];
        for (const intentState of this.#intentStates.values()) {
            this.#abortOperatorList({
                intentState,
                reason: new Error("Page was destroyed."),
                force: true,
            });
            if (intentState.opListReadCapability) {
                // Avoid errors below, since the renderTasks are just stubs.
                continue;
            }
            for (const internalRenderTask of intentState.renderTasks) {
                waitOn.push(internalRenderTask.completed);
                internalRenderTask.cancel();
            }
        }
        this.objs.clear();
        this.#pendingCleanup = false;
        this.#abortDelayedCleanup();
        return Promise.all(waitOn);
    }
    /**
     * Cleans up resources allocated by the page.
     *
     * @param resetStats - Reset page stats, if enabled.
     *   The default value is `false`.
     * @return Indicates if clean-up was successfully run.
     */
    cleanup(resetStats = false) {
        this.#pendingCleanup = true;
        const success = this.#tryCleanup(/* delayed = */ false);
        if (resetStats && success) {
            this._stats &&= new StatTimer();
        }
        return success;
    }
    /**
     * Attempts to clean up if rendering is in a state where that's possible.
     * @param delayed Delay the cleanup, to e.g. improve zooming
     *   performance in documents with large images.
     *   The default value is `false`.
     * @return Indicates if clean-up was successfully run.
     */
    #tryCleanup(delayed = false) {
        this.#abortDelayedCleanup();
        if (!this.#pendingCleanup || this.destroyed) {
            return false;
        }
        if (delayed) {
            this.#delayedCleanupTimeout = setTimeout(() => {
                this.#delayedCleanupTimeout = undefined;
                this.#tryCleanup(/* delayed = */ false);
            }, DELAYED_CLEANUP_TIMEOUT);
            return false;
        }
        for (const { renderTasks, operatorList } of this.#intentStates.values()) {
            if (renderTasks.size > 0 || !operatorList.lastChunk) {
                return false;
            }
        }
        this.#intentStates.clear();
        this.objs.clear();
        this.#pendingCleanup = false;
        return true;
    }
    #abortDelayedCleanup() {
        if (this.#delayedCleanupTimeout) {
            clearTimeout(this.#delayedCleanupTimeout);
            this.#delayedCleanupTimeout = undefined;
        }
    }
    _startRenderPage(transparency, cacheKey) {
        const intentState = this.#intentStates.get(cacheKey);
        if (!intentState) {
            return; // Rendering was cancelled.
        }
        this._stats?.timeEnd("Page Request");
        // TODO Refactor RenderPageRequest to separate rendering
        // and operator list logic
        intentState.displayReadyCapability?.resolve(transparency);
    }
    #renderPageChunk(operatorListChunk, intentState) {
        // Add the new chunk to the current operator list.
        for (let i = 0, ii = operatorListChunk.length; i < ii; i++) {
            intentState.operatorList.fnArray.push(operatorListChunk.fnArray[i]);
            intentState.operatorList.argsArray.push(operatorListChunk.argsArray[i]);
        }
        intentState.operatorList.lastChunk = operatorListChunk.lastChunk;
        intentState.operatorList.separateAnnots = operatorListChunk.separateAnnots;
        // Notify all the rendering tasks there are more operators to be consumed.
        for (const internalRenderTask of intentState.renderTasks) {
            internalRenderTask.operatorListChanged();
        }
        if (operatorListChunk.lastChunk) {
            this.#tryCleanup(/* delayed = */ true);
        }
    }
    #pumpOperatorList({ renderingIntent, cacheKey, annotationStorageSerializable }) {
        /*#static*/  {
            assert(Number.isInteger(renderingIntent) && renderingIntent > 0, '#pumpOperatorList: Expected valid "renderingIntent" argument.');
        }
        const { map, transfers } = annotationStorageSerializable;
        const readableStream = this._transport.messageHandler.sendWithStream("GetOperatorList", {
            pageIndex: this._pageIndex,
            intent: renderingIntent,
            cacheKey,
            annotationStorage: map,
        }, undefined, transfers);
        const reader = readableStream.getReader();
        const intentState = this.#intentStates.get(cacheKey);
        intentState.streamReader = reader;
        const pump = () => {
            reader.read().then(({ value, done }) => {
                if (done) {
                    intentState.streamReader = undefined;
                    return;
                }
                if (this._transport.destroyed) {
                    // Ignore any pending requests if the worker was terminated.
                    return;
                }
                this.#renderPageChunk(value, intentState);
                pump();
            }, (reason) => {
                intentState.streamReader = undefined;
                if (this._transport.destroyed) {
                    // Ignore any pending requests if the worker was terminated.
                    return;
                }
                if (intentState.operatorList) {
                    // Mark operator list as complete.
                    intentState.operatorList.lastChunk = true;
                    for (const internalRenderTask of intentState.renderTasks) {
                        internalRenderTask.operatorListChanged();
                    }
                    this.#tryCleanup(/* delayed = */ true);
                }
                if (intentState.displayReadyCapability) {
                    intentState.displayReadyCapability.reject(reason);
                }
                else if (intentState.opListReadCapability) {
                    intentState.opListReadCapability.reject(reason);
                }
                else {
                    throw reason;
                }
            });
        };
        pump();
    }
    #abortOperatorList({ intentState, reason, force = false }) {
        /*#static*/  {
            assert(reason instanceof Error, '_abortOperatorList: Expected valid "reason" argument.');
        }
        if (!intentState.streamReader) {
            return;
        }
        // Ensure that a pending `streamReader` cancel timeout is always aborted.
        if (intentState.streamReaderCancelTimeout) {
            clearTimeout(intentState.streamReaderCancelTimeout);
            intentState.streamReaderCancelTimeout = undefined;
        }
        if (!force) {
            // Ensure that an Error occurring in *only* one `InternalRenderTask`, e.g.
            // multiple render() calls on the same canvas, won't break all rendering.
            if (intentState.renderTasks.size > 0) {
                return;
            }
            // Don't immediately abort parsing on the worker-thread when rendering is
            // cancelled, since that will unnecessarily delay re-rendering when (for
            // partially parsed pages) e.g. zooming/rotation occurs in the viewer.
            if (reason instanceof RenderingCancelledException) {
                let delay = RENDERING_CANCELLED_TIMEOUT;
                if (reason.extraDelay > 0 && reason.extraDelay < /* ms = */ 1000) {
                    // Above, we prevent the total delay from becoming arbitrarily large.
                    delay += reason.extraDelay;
                }
                intentState.streamReaderCancelTimeout = setTimeout(() => {
                    intentState.streamReaderCancelTimeout = undefined;
                    this.#abortOperatorList({ intentState, reason, force: true });
                }, delay);
                return;
            }
        }
        intentState.streamReader
            .cancel(new AbortException(reason.message))
            .catch(() => {
            // Avoid "Uncaught promise" messages in the console.
        });
        intentState.streamReader = undefined;
        if (this._transport.destroyed) {
            // Ignore any pending requests if the worker was terminated.
            return;
        }
        // Remove the current `intentState`, since a cancelled `getOperatorList`
        // call on the worker-thread cannot be re-started...
        for (const [curCacheKey, curIntentState] of this.#intentStates) {
            if (curIntentState === intentState) {
                this.#intentStates.delete(curCacheKey);
                break;
            }
        }
        // ... and force clean-up to ensure that any old state is always removed.
        this.cleanup();
    }
}
export class LoopbackPort {
    #listeners = new Set();
    #deferred = Promise.resolve();
    postMessage(message, transfer) {
        const event = {
            data: structuredClone(message, 
            /*#static*/ transfer ? { transfer } : undefined),
        };
        this.#deferred.then(() => {
            for (const listener of this.#listeners) {
                listener.call(this, event);
            }
        });
    }
    addEventListener(name, listener) {
        this.#listeners.add(listener);
    }
    removeEventListener(name, listener) {
        this.#listeners.delete(listener);
    }
    terminate() {
        this.#listeners.clear();
    }
}
export const PDFWorkerUtil = {
    isWorkerDisabled: false,
    fallbackWorkerSrc: undefined,
    fakeWorkerId: 0,
};
/*#static*/  {
    // eslint-disable-next-line no-undef
    // if (isNodeJS && typeof __non_webpack_require__ === "function") {
    //   // Workers aren't supported in Node.js, force-disabling them there.
    //   PDFWorkerUtil.isWorkerDisabled = true;
    //   PDFWorkerUtil.fallbackWorkerSrc = PDFJSDev.test("LIB")
    //     ? "../pdf.worker.js"
    //     : "./pdf.worker";
    // }
    // else
    if (typeof document === "object") {
        const pdfjsFilePath = document?.currentScript?.src;
        if (pdfjsFilePath) {
            PDFWorkerUtil.fallbackWorkerSrc = pdfjsFilePath.replace(/(\.(?:min\.)?js)(\?.*)?$/i, ".worker$1$2");
        }
    }
    // Check if URLs have the same origin. For non-HTTP based URLs, returns false.
    PDFWorkerUtil.isSameOrigin = (baseUrl, otherUrl) => {
        let base;
        try {
            base = new URL(baseUrl);
            if (!base.origin || base.origin === "null") {
                return false; // non-HTTP url
            }
        }
        catch {
            return false;
        }
        const other = new URL(otherUrl, base);
        return base.origin === other.origin;
    };
    PDFWorkerUtil.createCDNWrapper = (url) => {
        // We will rely on blob URL's property to specify origin.
        // We want this function to fail in case if createObjectURL or Blob do not
        // exist or fail for some reason -- our Worker creation will fail anyway.
        const wrapper = `importScripts("${url}");`;
        return URL.createObjectURL(new Blob([wrapper]));
    };
}
/**
 * PDF.js web worker abstraction that controls the instantiation of PDF
 * documents. Message handlers are used to pass information from the main
 * thread to the worker thread and vice versa. If the creation of a web
 * worker is not possible, a "fake" worker will be used instead.
 */
export class PDFWorker {
    static #workerPorts = new WeakMap();
    name;
    destroyed = false;
    verbosity;
    #readyCapability = new PromiseCap();
    /**
     * Promise for worker initialization completion.
     */
    get promise() {
        return this.#readyCapability.promise;
    }
    #port;
    /**
     * The current `workerPort`, when it exists.
     */
    get port() {
        return this.#port;
    }
    #webWorker;
    get _webWorker() {
        return this.#webWorker;
    }
    #messageHandler;
    /**
     * The current MessageHandler-instance.
     */
    get messageHandler() {
        return this.#messageHandler;
    }
    constructor({ name, port, verbosity = getVerbosityLevel(), } = {}) {
        if (port && PDFWorker.#workerPorts.has(port)) {
            throw new Error("Cannot use more than one PDFWorker per port.");
        }
        this.name = name;
        this.verbosity = verbosity;
        if (port) {
            PDFWorker.#workerPorts.set(port, this);
            this.#initializeFromPort(port);
            return;
        }
        this.#initialize();
    }
    #initializeFromPort(port) {
        this.#port = port;
        this.#messageHandler = new MessageHandler("main", "worker", port);
        this.#messageHandler.on("ready", () => {
            // Ignoring "ready" event -- MessageHandler should already be initialized
            // and ready to accept messages.
        });
        this.#readyCapability.resolve();
        // Send global setting, e.g. verbosity level.
        this.#messageHandler.send("configure", {
            verbosity: this.verbosity,
        });
    }
    #initialize() {
        // If worker support isn't disabled explicit and the browser has worker
        // support, create a new web worker and test if it/the browser fulfills
        // all requirements to run parts of pdf.js in a web worker.
        // Right now, the requirement is, that an Uint8Array is still an
        // Uint8Array as it arrives on the worker. (Chrome added this with v.15.)
        if (!PDFWorkerUtil.isWorkerDisabled &&
            !PDFWorker._mainThreadWorkerMessageHandler) {
            let { workerSrc } = PDFWorker;
            try {
                // Wraps workerSrc path into blob URL, if the former does not belong
                // to the same origin.
                /*#static*/  {
                    if (!PDFWorkerUtil.isSameOrigin(window.location.href, workerSrc)) {
                        workerSrc = PDFWorkerUtil.createCDNWrapper(new URL(workerSrc, window.location).href);
                    }
                }
                // const worker =
                //   typeof PDFJSDev === "undefined" &&
                //   !workerSrc.endsWith("/build/pdf.worker.js")
                //     ? new Worker(workerSrc, { type: "module" })
                //     : new Worker(workerSrc);
                const worker = new Worker(workerSrc, { type: "module" });
                const messageHandler = new MessageHandler("main", "worker", worker);
                const terminateEarly = () => {
                    worker.removeEventListener("error", onWorkerError);
                    messageHandler.destroy();
                    worker.terminate();
                    if (this.destroyed) {
                        this.#readyCapability.reject(new Error("Worker was destroyed"));
                    }
                    else {
                        // Fall back to fake worker if the termination is caused by an
                        // error (e.g. NetworkError / SecurityError).
                        this.#setupFakeWorker();
                    }
                };
                const onWorkerError = (evt) => {
                    console.error(evt);
                    if (!this.#webWorker) {
                        // Worker failed to initialize due to an error. Clean up and fall
                        // back to the fake worker.
                        terminateEarly();
                    }
                };
                worker.addEventListener("error", onWorkerError);
                messageHandler.on("test", (data) => {
                    worker.removeEventListener("error", onWorkerError);
                    if (this.destroyed) {
                        terminateEarly();
                        return; // worker was destroyed
                    }
                    if (data) {
                        this.#messageHandler = messageHandler;
                        this.#port = worker;
                        this.#webWorker = worker;
                        this.#readyCapability.resolve();
                        // Send global setting, e.g. verbosity level.
                        messageHandler.send("configure", {
                            verbosity: this.verbosity,
                        });
                    }
                    else {
                        this.#setupFakeWorker();
                        messageHandler.destroy();
                        worker.terminate();
                    }
                });
                messageHandler.on("ready", () => {
                    worker.removeEventListener("error", onWorkerError);
                    if (this.destroyed) {
                        terminateEarly();
                        return; // worker was destroyed
                    }
                    try {
                        sendTest();
                    }
                    catch {
                        // We need fallback to a faked worker.
                        this.#setupFakeWorker();
                    }
                });
                const sendTest = () => {
                    const testObj = new Uint8Array();
                    // Ensure that we can use `postMessage` transfers.
                    messageHandler.send("test", testObj, [testObj.buffer]);
                };
                // It might take time for the worker to initialize. We will try to send
                // the "test" message immediately, and once the "ready" message arrives.
                // The worker shall process only the first received "test" message.
                sendTest();
                return;
            }
            catch {
                info("The worker has been disabled.");
            }
        }
        // Either workers are disabled, not supported or have thrown an exception.
        // Thus, we fallback to a faked worker.
        this.#setupFakeWorker();
    }
    #setupFakeWorker() {
        if (!PDFWorkerUtil.isWorkerDisabled) {
            warn("Setting up fake worker.");
            PDFWorkerUtil.isWorkerDisabled = true;
        }
        PDFWorker._setupFakeWorkerGlobal
            .then((workerMessageHandler) => {
            if (this.destroyed) {
                this.#readyCapability.reject(new Error("Worker was destroyed"));
                return;
            }
            const port = new LoopbackPort();
            this.#port = port;
            // All fake workers use the same port, making id unique.
            const id = `fake${PDFWorkerUtil.fakeWorkerId++}`;
            // If the main thread is our worker, setup the handling for the
            // messages -- the main thread sends to it self.
            const workerHandler = new MessageHandler(id + "_worker", id, port);
            workerMessageHandler.setup(workerHandler, port);
            const messageHandler = new MessageHandler(id, id + "_worker", port);
            this.#messageHandler = messageHandler;
            this.#readyCapability.resolve();
            // Send global setting, e.g. verbosity level.
            messageHandler.send("configure", {
                verbosity: this.verbosity,
            });
        })
            .catch((reason) => {
            this.#readyCapability.reject(new Error(`Setting up fake worker failed: "${reason.message}".`));
        });
    }
    /**
     * Destroys the worker instance.
     */
    destroy() {
        this.destroyed = true;
        if (this.#webWorker) {
            // We need to terminate only web worker created resource.
            this.#webWorker.terminate();
            this.#webWorker = undefined;
        }
        PDFWorker.#workerPorts.delete(this.#port);
        this.#port = undefined;
        if (this.#messageHandler) {
            this.#messageHandler.destroy();
            this.#messageHandler = undefined;
        }
    }
    /**
     * @param params The worker initialization parameters.
     */
    static fromPort(params) {
        if (!params?.port) {
            throw new Error("PDFWorker.fromPort - invalid method signature.");
        }
        if (this.#workerPorts.has(params.port)) {
            return this.#workerPorts.get(params.port);
        }
        return new PDFWorker(params);
    }
    /**
     * The current `workerSrc`, when it exists.
     */
    static get workerSrc() {
        if (GlobalWorkerOptions.workerSrc) {
            return GlobalWorkerOptions.workerSrc;
        }
        /*#static*/  {
            if (PDFWorkerUtil.fallbackWorkerSrc !== undefined) {
                /*#static*/  {
                    deprecated('No "GlobalWorkerOptions.workerSrc" specified.');
                }
                return PDFWorkerUtil.fallbackWorkerSrc;
            }
        }
        throw new Error('No "GlobalWorkerOptions.workerSrc" specified.');
    }
    static get _mainThreadWorkerMessageHandler() {
        try {
            return globalThis.pdfjsWorker?.WorkerMessageHandler || undefined;
        }
        catch {
            return undefined;
        }
    }
    // Loads worker code into the main-thread.
    static get _setupFakeWorkerGlobal() {
        const loader = async () => {
            const mainWorkerMessageHandler = this._mainThreadWorkerMessageHandler;
            if (mainWorkerMessageHandler) {
                // The worker was already loaded using e.g. a `<script>` tag.
                return mainWorkerMessageHandler;
            }
            /*#static*/  {
                // const worker = await import("../core/worker.ts");
                const worker = await import("../pdf.worker.js");
                return worker.WorkerMessageHandler;
            }
            // if (
            //   PDFJSDev.test("GENERIC") &&
            //   isNodeJS &&
            //   // eslint-disable-next-line no-undef
            //   typeof __non_webpack_require__ === "function"
            // ) {
            //   // Since bundlers, such as Webpack, cannot be told to leave `require`
            //   // statements alone we are thus forced to jump through hoops in order
            //   // to prevent `Critical dependency: ...` warnings in third-party
            //   // deployments of the built `pdf.js`/`pdf.worker.js` files; see
            //   // https://github.com/webpack/webpack/issues/8826
            //   //
            //   // The following hack is based on the assumption that code running in
            //   // Node.js won't ever be affected by e.g. Content Security Policies that
            //   // prevent the use of `eval`. If that ever occurs, we should revert this
            //   // to a normal `__non_webpack_require__` statement and simply document
            //   // the Webpack warnings instead (telling users to ignore them).
            //   //
            //   // eslint-disable-next-line no-eval
            //   const worker = eval("require")(this.workerSrc);
            //   return worker.WorkerMessageHandler;
            // }
            await loadScript(this.workerSrc);
            return window.pdfjsWorker.WorkerMessageHandler;
        };
        return shadow(this, "_setupFakeWorkerGlobal", loader());
    }
}
/**
 * For internal use only.
 * @ignore
 * @final
 */
class WorkerTransport {
    messageHandler;
    loadingTask;
    commonObjs = new PDFObjects();
    fontLoader;
    // #metadataPromise?: Promise<PDFMetadata> | undefined;
    // _getFieldObjectsPromise:
    //   | Promise<Record<string, FieldObject[]> | undefined>
    //   | undefined;
    // _hasJSActionsPromise: Promise<boolean> | undefined;
    _params;
    canvasFactory;
    filterFactory;
    cMapReaderFactory;
    standardFontDataFactory;
    destroyed = false;
    destroyCapability;
    _passwordCapability;
    #networkStream;
    #fullReader;
    #lastProgress;
    #methodPromises = new Map();
    #pageCache = new Map();
    #pagePromises = new Map();
    downloadInfoCapability = new PromiseCap();
    #numPages;
    _htmlForXfa;
    constructor(messageHandler, loadingTask, networkStream, params, factory) {
        this.messageHandler = messageHandler;
        this.loadingTask = loadingTask;
        this.fontLoader = new FontLoader({
            ownerDocument: params.ownerDocument,
            styleElement: params.styleElement,
        });
        this._params = params;
        this.canvasFactory = factory.canvasFactory;
        this.filterFactory = factory.filterFactory;
        this.cMapReaderFactory = factory.cMapReaderFactory;
        this.standardFontDataFactory = factory.standardFontDataFactory;
        this.#networkStream = networkStream;
        this.setupMessageHandler();
        /*#static*/  {
            // For testing purposes.
            Object.defineProperty(this, "getXFADatasets", {
                value: () => {
                    return this.messageHandler.sendWithPromise("GetXFADatasets", null);
                },
            });
            Object.defineProperty(this, "getXRefPrevValue", {
                value: () => {
                    return this.messageHandler.sendWithPromise("GetXRefPrevValue", null);
                },
            });
            Object.defineProperty(this, "getAnnotArray", {
                value: (pageIndex) => {
                    return this.messageHandler.sendWithPromise("GetAnnotArray", {
                        pageIndex,
                    });
                },
            });
        }
    }
    #cacheSimpleMethod(name, data = null) {
        const cachedPromise = this.#methodPromises.get(name);
        if (cachedPromise) {
            return cachedPromise;
        }
        const promise = this.messageHandler.sendWithPromise(name, data);
        this.#methodPromises.set(name, promise);
        return promise;
    }
    get annotationStorage() {
        return shadow(this, "annotationStorage", new AnnotationStorage());
    }
    getRenderingIntent(intent, annotationMode = AnnotationMode.ENABLE, printAnnotationStorage = undefined, isOpList = false) {
        let renderingIntent = RenderingIntentFlag.DISPLAY; // Default value.
        let annotationStorageSerializable = SerializableEmpty;
        switch (intent) {
            case "any":
                renderingIntent = RenderingIntentFlag.ANY;
                break;
            case "display":
                break;
            case "print":
                renderingIntent = RenderingIntentFlag.PRINT;
                break;
            default:
                warn(`getRenderingIntent - invalid intent: ${intent}`);
        }
        switch (annotationMode) {
            case AnnotationMode.DISABLE:
                renderingIntent += RenderingIntentFlag.ANNOTATIONS_DISABLE;
                break;
            case AnnotationMode.ENABLE:
                break;
            case AnnotationMode.ENABLE_FORMS:
                renderingIntent += RenderingIntentFlag.ANNOTATIONS_FORMS;
                break;
            case AnnotationMode.ENABLE_STORAGE:
                renderingIntent += RenderingIntentFlag.ANNOTATIONS_STORAGE;
                const annotationStorage = renderingIntent & RenderingIntentFlag.PRINT &&
                    printAnnotationStorage instanceof PrintAnnotationStorage
                    ? printAnnotationStorage
                    : this.annotationStorage;
                annotationStorageSerializable = annotationStorage.serializable;
                break;
            default:
                warn(`getRenderingIntent - invalid annotationMode: ${annotationMode}`);
        }
        if (isOpList) {
            renderingIntent += RenderingIntentFlag.OPLIST;
        }
        return {
            renderingIntent,
            cacheKey: `${renderingIntent}_${annotationStorageSerializable.hash}`,
            annotationStorageSerializable,
        };
    }
    destroy() {
        if (this.destroyCapability) {
            return this.destroyCapability.promise;
        }
        this.destroyed = true;
        this.destroyCapability = new PromiseCap();
        if (this._passwordCapability) {
            this._passwordCapability.reject(new Error("Worker was destroyed during onPassword callback"));
        }
        const waitOn = [];
        // We need to wait for all renderings to be completed, e.g.
        // timeout/rAF can take a long time.
        for (const page of this.#pageCache.values()) {
            waitOn.push(page._destroy());
        }
        this.#pageCache.clear();
        this.#pagePromises.clear();
        // Allow `AnnotationStorage`-related clean-up when destroying the document.
        if (Object.hasOwn(this, "annotationStorage")) {
            this.annotationStorage.resetModified();
        }
        // We also need to wait for the worker to finish its long running tasks.
        const terminated = this.messageHandler.sendWithPromise("Terminate", null);
        waitOn.push(terminated);
        Promise.all(waitOn).then(() => {
            this.commonObjs.clear();
            this.fontLoader.clear();
            this.#methodPromises.clear();
            this.filterFactory.destroy();
            if (this.#networkStream) {
                this.#networkStream.cancelAllRequests(new AbortException("Worker was terminated."));
            }
            if (this.messageHandler) {
                this.messageHandler.destroy();
                this.messageHandler = null;
            }
            this.destroyCapability.resolve();
        }, this.destroyCapability.reject);
        return this.destroyCapability.promise;
    }
    setupMessageHandler() {
        const { messageHandler, loadingTask } = this;
        messageHandler.on("GetReader", (data, sink) => {
            assert(this.#networkStream, "GetReader - no `IPDFStream` instance available.");
            this.#fullReader = this.#networkStream.getFullReader();
            this.#fullReader.onProgress = (evt) => {
                this.#lastProgress = {
                    loaded: evt.loaded,
                    total: evt.total,
                };
            };
            sink.onPull = () => {
                this.#fullReader
                    .read()
                    .then(({ value, done }) => {
                    if (done) {
                        sink.close();
                        return;
                    }
                    assert(value instanceof ArrayBuffer, "GetReader - expected an ArrayBuffer.");
                    // Enqueue data chunk into sink, and transfer it
                    // to other side as `Transferable` object.
                    sink.enqueue(new Uint8Array(value), 1, [value]);
                })
                    .catch((reason) => {
                    sink.error(reason);
                });
            };
            sink.onCancel = (reason) => {
                this.#fullReader.cancel(reason);
                sink.ready.catch((readyReason) => {
                    if (this.destroyed) {
                        // Ignore any pending requests if the worker was terminated.
                        return;
                    }
                    throw readyReason;
                });
            };
        });
        messageHandler.on("ReaderHeadersReady", () => {
            const headersCapability = new PromiseCap();
            const fullReader = this.#fullReader;
            fullReader.headersReady.then(() => {
                // If stream or range are disabled, it's our only way to report
                // loading progress.
                if (!fullReader.isStreamingSupported || !fullReader.isRangeSupported) {
                    if (this.#lastProgress) {
                        loadingTask.onProgress?.(this.#lastProgress);
                    }
                    fullReader.onProgress = (evt) => {
                        loadingTask.onProgress?.({
                            loaded: evt.loaded,
                            total: evt.total,
                        });
                    };
                }
                headersCapability.resolve({
                    isStreamingSupported: fullReader.isStreamingSupported,
                    isRangeSupported: fullReader.isRangeSupported,
                    contentLength: fullReader.contentLength,
                });
            }, headersCapability.reject);
            return headersCapability.promise;
        });
        messageHandler.on("GetRangeReader", (data, sink) => {
            assert(this.#networkStream, "GetRangeReader - no `IPDFStream` instance available.");
            const rangeReader = this.#networkStream.getRangeReader(data.begin, data.end);
            // When streaming is enabled, it's possible that the data requested here
            // has already been fetched via the `_fullRequestReader` implementation.
            // However, given that the PDF data is loaded asynchronously on the
            // main-thread and then sent via `postMessage` to the worker-thread,
            // it may not have been available during parsing (hence the attempt to
            // use range requests here).
            //
            // To avoid wasting time and resources here, we'll thus *not* dispatch
            // range requests if the data was already loaded but has not been sent to
            // the worker-thread yet (which will happen via the `_fullRequestReader`).
            if (!rangeReader) {
                sink.close();
                return;
            }
            sink.onPull = () => {
                rangeReader
                    .read()
                    .then(({ value, done }) => {
                    if (done) {
                        sink.close();
                        return;
                    }
                    assert(value instanceof ArrayBuffer, "GetRangeReader - expected an ArrayBuffer.");
                    sink.enqueue(new Uint8Array(value), 1, [value]);
                })
                    .catch((reason) => {
                    sink.error(reason);
                });
            };
            sink.onCancel = (reason) => {
                rangeReader.cancel(reason);
                sink.ready.catch((readyReason) => {
                    if (this.destroyed) {
                        // Ignore any pending requests if the worker was terminated.
                        return;
                    }
                    throw readyReason;
                });
            };
        });
        messageHandler.on("GetDoc", ({ pdfInfo }) => {
            this.#numPages = pdfInfo.numPages;
            this._htmlForXfa = pdfInfo.htmlForXfa;
            delete pdfInfo.htmlForXfa;
            loadingTask._capability.resolve(new PDFDocumentProxy(pdfInfo, this));
        });
        messageHandler.on("DocException", (ex_y) => {
            // console.log(ex_y.name);
            // console.log(ex_y);
            let reason;
            switch (ex_y.name) {
                case "PasswordException":
                    reason = new PasswordException(ex_y.message, ex_y.code);
                    break;
                case "InvalidPDFException":
                    reason = new InvalidPDFException(ex_y.message);
                    break;
                case "MissingPDFException":
                    reason = new MissingPDFException(ex_y.message);
                    break;
                case "UnexpectedResponseException":
                    reason = new UnexpectedResponseException(ex_y.message, ex_y.status);
                    break;
                case "UnknownErrorException":
                    reason = new UnknownErrorException(ex_y.message, ex_y.details);
                    break;
                default:
                    assert(0, "DocException - expected a valid Error.");
            }
            loadingTask._capability.reject(reason);
        });
        messageHandler.on("PasswordRequest", (exception) => {
            this._passwordCapability = new PromiseCap();
            if (loadingTask.onPassword) {
                const updatePassword = (password) => {
                    if (password instanceof Error) {
                        this._passwordCapability.reject(password);
                    }
                    else {
                        this._passwordCapability.resolve({ password });
                    }
                };
                try {
                    loadingTask.onPassword(updatePassword, exception.code);
                }
                catch (ex) {
                    this._passwordCapability.reject(ex);
                }
            }
            else {
                this._passwordCapability.reject(new PasswordException(exception.message, exception.code));
            }
            return this._passwordCapability.promise;
        });
        messageHandler.on("DataLoaded", (data) => {
            // For consistency: Ensure that progress is always reported when the
            // entire PDF file has been loaded, regardless of how it was fetched.
            loadingTask.onProgress?.({
                loaded: data.length,
                total: data.length,
            });
            this.downloadInfoCapability.resolve(data);
        });
        messageHandler.on("StartRenderPage", (data) => {
            if (this.destroyed) {
                // Ignore any pending requests if the worker was terminated.
                return;
            }
            const page = this.#pageCache.get(data.pageIndex);
            page._startRenderPage(data.transparency, data.cacheKey);
        });
        messageHandler.on("commonobj", ([id, type, exportedData]) => {
            if (this.destroyed) {
                // Ignore any pending requests if the worker was terminated.
                return;
            }
            if (this.commonObjs.has(id)) {
                return;
            }
            switch (type) {
                case "Font":
                    const params = this._params;
                    if ("error" in exportedData) {
                        const exportedError = exportedData.error;
                        warn(`Error during font loading: ${exportedError}`);
                        this.commonObjs.resolve(id, exportedError);
                        break;
                    }
                    const inspectFont = params.pdfBug && globalThis.FontInspector?.enabled
                        ? (font, url) => globalThis.FontInspector.fontAdded(font, url)
                        : undefined;
                    const font = new FontFaceObject(exportedData, {
                        isEvalSupported: params.isEvalSupported,
                        disableFontFace: params.disableFontFace,
                        ignoreErrors: params.ignoreErrors,
                        inspectFont,
                    });
                    this.fontLoader
                        .bind(font)
                        .catch((reason) => {
                        return messageHandler.sendWithPromise("FontFallback", { id });
                    })
                        .finally(() => {
                        if (!params.fontExtraProperties && font.data) {
                            // Immediately release the `font.data` property once the font
                            // has been attached to the DOM, since it's no longer needed,
                            // rather than waiting for a `PDFDocumentProxy.cleanup` call.
                            // Since `font.data` could be very large, e.g. in some cases
                            // multiple megabytes, this will help reduce memory usage.
                            font.data = undefined;
                        }
                        this.commonObjs.resolve(id, font);
                    });
                    break;
                case "FontPath":
                case "Image":
                case "Pattern":
                    this.commonObjs.resolve(id, exportedData);
                    break;
                default:
                    throw new Error(`Got unknown common object type ${type}`);
            }
        });
        messageHandler.on("obj", ([id, pageIndex, type, imageData]) => {
            if (this.destroyed) {
                // Ignore any pending requests if the worker was terminated.
                return;
            }
            const pageProxy = this.#pageCache.get(pageIndex);
            if (pageProxy.objs.has(id)) {
                return;
            }
            switch (type) {
                case "Image":
                    pageProxy.objs.resolve(id, imageData);
                    // Heuristic that will allow us not to store large data.
                    if (imageData) {
                        let length;
                        if (imageData.bitmap) {
                            const { width, height } = imageData;
                            length = width * height * 4;
                        }
                        else {
                            length = imageData.data?.length || 0;
                        }
                        if (length > MAX_IMAGE_SIZE_TO_CACHE) {
                            pageProxy._maybeCleanupAfterRender = true;
                        }
                    }
                    break;
                case "Pattern":
                    pageProxy.objs.resolve(id, imageData);
                    break;
                default:
                    throw new Error(`Got unknown object type ${type}`);
            }
        });
        messageHandler.on("DocProgress", (data) => {
            if (this.destroyed) {
                return; // Ignore any pending requests if the worker was terminated.
            }
            loadingTask.onProgress?.({
                loaded: data.loaded,
                total: data.total,
            });
        });
        messageHandler.on("FetchBuiltInCMap", (data) => {
            if (this.destroyed) {
                return Promise.reject(new Error("Worker was destroyed."));
            }
            if (!this.cMapReaderFactory) {
                return Promise.reject(new Error("CMapReaderFactory not initialized, see the `useWorkerFetch` parameter."));
            }
            return this.cMapReaderFactory.fetch(data);
        });
        messageHandler.on("FetchStandardFontData", (data) => {
            if (this.destroyed) {
                return Promise.reject(new Error("Worker was destroyed."));
            }
            if (!this.standardFontDataFactory) {
                return Promise.reject(new Error("StandardFontDataFactory not initialized, see the `useWorkerFetch` parameter."));
            }
            return this.standardFontDataFactory.fetch(data);
        });
    }
    getData() {
        return this.messageHandler.sendWithPromise("GetData", null);
    }
    saveDocument() {
        if (this.annotationStorage.size <= 0) {
            warn("saveDocument called while `annotationStorage` is empty, " +
                "please use the getData-method instead.");
        }
        const { map, transfers } = this.annotationStorage.serializable;
        return this.messageHandler
            .sendWithPromise("SaveDocument", {
            isPureXfa: !!this._htmlForXfa,
            numPages: this.#numPages,
            annotationStorage: map,
            filename: this.#fullReader?.filename,
        }, transfers)
            .finally(() => {
            this.annotationStorage.resetModified();
        });
    }
    getPage(pageNumber) {
        if (!Number.isInteger(pageNumber) ||
            pageNumber <= 0 ||
            pageNumber > this.#numPages) {
            return Promise.reject(new Error("Invalid page request."));
        }
        const pageIndex = pageNumber - 1, cachedPromise = this.#pagePromises.get(pageIndex);
        if (cachedPromise)
            return cachedPromise;
        const promise = this.messageHandler
            .sendWithPromise("GetPage", {
            pageIndex,
        })
            .then((pageInfo) => {
            if (this.destroyed) {
                throw new Error("Transport destroyed");
            }
            const page = new PDFPageProxy(pageIndex, pageInfo, this, this._params.pdfBug);
            this.#pageCache.set(pageIndex, page);
            return page;
        });
        this.#pagePromises.set(pageIndex, promise);
        return promise;
    }
    getPageIndex(ref) {
        if (typeof ref !== "object" ||
            ref === null ||
            !Number.isInteger(ref.num) ||
            ref.num < 0 ||
            !Number.isInteger(ref.gen) ||
            ref.gen < 0) {
            return Promise.reject(new Error("Invalid pageIndex request."));
        }
        return this.messageHandler.sendWithPromise("GetPageIndex", {
            num: ref.num,
            gen: ref.gen,
        });
    }
    getAnnotations(pageIndex, intent) {
        return this.messageHandler.sendWithPromise("GetAnnotations", {
            pageIndex,
            intent,
        });
    }
    getFieldObjects() {
        return this.#cacheSimpleMethod("GetFieldObjects");
    }
    hasJSActions() {
        return this.#cacheSimpleMethod("HasJSActions");
    }
    getCalculationOrderIds() {
        return this.messageHandler.sendWithPromise("GetCalculationOrderIds", null);
    }
    getDestinations() {
        return this.messageHandler.sendWithPromise("GetDestinations", null);
    }
    getDestination(id) {
        return this.messageHandler.sendWithPromise("GetDestination", { id });
    }
    getPageLabels() {
        return this.messageHandler.sendWithPromise("GetPageLabels", null);
    }
    getPageLayout() {
        return this.messageHandler.sendWithPromise("GetPageLayout", null);
    }
    getPageMode() {
        return this.messageHandler.sendWithPromise("GetPageMode", null);
    }
    getViewerPreferences() {
        return this.messageHandler.sendWithPromise("GetViewerPreferences", null);
    }
    getOpenAction() {
        return this.messageHandler.sendWithPromise("GetOpenAction", null);
    }
    getAttachments() {
        return this.messageHandler.sendWithPromise("GetAttachments", null);
    }
    getJavaScript() {
        return this.messageHandler.sendWithPromise("GetJavaScript", null);
    }
    getDocJSActions() {
        return this.messageHandler.sendWithPromise("GetDocJSActions", null);
    }
    getPageJSActions(pageIndex) {
        return this.messageHandler.sendWithPromise("GetPageJSActions", {
            pageIndex,
        });
    }
    getStructTree(pageIndex) {
        return this.messageHandler.sendWithPromise("GetStructTree", {
            pageIndex,
        });
    }
    getOutline() {
        return this.messageHandler.sendWithPromise("GetOutline", null);
    }
    getOptionalContentConfig() {
        return this.messageHandler
            .sendWithPromise("GetOptionalContentConfig", null)
            .then((results) => {
            return new OptionalContentConfig(results);
        });
    }
    getPermissions() {
        return this.messageHandler.sendWithPromise("GetPermissions", null);
    }
    getMetadata() {
        const name = "GetMetadata", cachedPromise = this.#methodPromises.get(name);
        if (cachedPromise) {
            return cachedPromise;
        }
        const promise = this.messageHandler
            .sendWithPromise(name, null)
            .then((results) => {
            return {
                info: results[0],
                metadata: results[1] ? new Metadata(results[1]) : undefined,
                contentDispositionFilename: this.#fullReader?.filename ?? undefined,
                contentLength: this.#fullReader?.contentLength ?? undefined,
            };
        });
        this.#methodPromises.set(name, promise);
        return promise;
    }
    getMarkInfo() {
        return this.messageHandler.sendWithPromise("GetMarkInfo", null);
    }
    async startCleanup(keepLoadedFonts = false) {
        if (this.destroyed) {
            return; // No need to manually clean-up when destruction has started.
        }
        await this.messageHandler.sendWithPromise("Cleanup", null);
        for (const page of this.#pageCache.values()) {
            const cleanupSuccessful = page.cleanup();
            if (!cleanupSuccessful) {
                throw new Error(`startCleanup: Page ${page.pageNumber} is currently rendering.`);
            }
        }
        this.commonObjs.clear();
        if (!keepLoadedFonts) {
            this.fontLoader.clear();
        }
        this.#methodPromises.clear();
        this.filterFactory.destroy(/* keepHCM = */ true);
    }
    get loadingParams() {
        const { disableAutoFetch, enableXfa } = this._params;
        return shadow(this, "loadingParams", {
            disableAutoFetch,
            enableXfa,
        });
    }
    getXFADatasets;
    getXRefPrevValue;
    getAnnotArray;
}
/**
 * A PDF document and page is built of many objects. E.g. there are objects for
 * fonts, images, rendering code, etc. These objects may get processed inside of
 * a worker. This class implements some basic methods to manage these objects.
 */
export class PDFObjects {
    #objs = Object.create(null);
    /**
     * Ensures there is an object defined for `objId`.
     */
    #ensureObj(objId) {
        const obj = this.#objs[objId];
        if (obj)
            return obj;
        return (this.#objs[objId] = {
            capability: new PromiseCap(),
            data: undefined,
        });
    }
    /**
     * If called *without* callback, this returns the data of `objId` but the
     * object needs to be resolved. If it isn't, this method throws.
     *
     * If called *with* a callback, the callback is called with the data of the
     * object once the object is resolved. That means, if you call this method
     * and the object is already resolved, the callback gets called right away.
     */
    get(objId, callback) {
        // If there is a callback, then the get can be async and the object is
        // not required to be resolved right now.
        if (callback) {
            const obj = this.#ensureObj(objId);
            obj.capability.promise.then(() => callback(obj.data));
            return undefined;
        }
        // If there isn't a callback, the user expects to get the resolved data
        // directly.
        const obj = this.#objs[objId];
        // If there isn't an object yet or the object isn't resolved, then the
        // data isn't ready yet!
        if (!obj?.capability.settled) {
            throw new Error(`Requesting object that isn't resolved yet ${objId}.`);
        }
        return obj.data;
    }
    has(objId) {
        const obj = this.#objs[objId];
        return obj?.capability.settled || false;
    }
    /**
     * Resolves the object `objId` with optional `data`.
     */
    resolve(objId, data = undefined) {
        const obj = this.#ensureObj(objId);
        obj.data = data;
        obj.capability.resolve(undefined);
    }
    clear() {
        for (const objId in this.#objs) {
            const { data } = this.#objs[objId];
            data?.bitmap?.close(); // Release any `ImageBitmap` data.
        }
        this.#objs = Object.create(null);
    }
}
/**
 * Allows controlling of the rendering tasks.
 */
export class RenderTask {
    #internalRenderTask;
    /**
     * Callback for incremental rendering -- a function that will be called
     * each time the rendering is paused.  To continue rendering call the
     * function that is the first argument to the callback.
     */
    onContinue;
    constructor(internalRenderTask) {
        this.#internalRenderTask = internalRenderTask;
    }
    /**
     * Promise for rendering task completion.
     */
    get promise() {
        return this.#internalRenderTask.capability.promise;
    }
    /**
     * Cancels the rendering task. If the task is currently rendering it will
     * not be cancelled until graphics pauses with a timeout. The promise that
     * this object extends will be rejected when cancelled.
     */
    cancel(extraDelay = 0) {
        this.#internalRenderTask.cancel(/* error = */ undefined, extraDelay);
    }
    /**
     * Whether form fields are rendered separately from the main operatorList.
     */
    get separateAnnots() {
        const { separateAnnots } = this.#internalRenderTask.operatorList;
        if (!separateAnnots) {
            return false;
        }
        const { annotationCanvasMap } = this.#internalRenderTask;
        return (separateAnnots.form ||
            (separateAnnots.canvas && annotationCanvasMap?.size > 0));
    }
}
/**
 * For internal use only.
 * @ignore
 */
export class InternalRenderTask {
    static #canvasInUse = new WeakSet();
    callback;
    params;
    objs;
    commonObjs;
    annotationCanvasMap;
    operatorListIdx;
    operatorList;
    _pageIndex;
    canvasFactory;
    filterFactory;
    _pdfBug;
    pageColors;
    running = false;
    graphicsReadyCallback;
    graphicsReady = false;
    _useRequestAnimationFrame;
    cancelled = false;
    capability = new PromiseCap();
    task;
    _canvas;
    stepper;
    gfx;
    constructor({ callback, params, objs, commonObjs, annotationCanvasMap, operatorList, pageIndex, canvasFactory, filterFactory, useRequestAnimationFrame = false, pdfBug = false, pageColors = undefined, }) {
        this.callback = callback;
        this.params = params;
        this.objs = objs;
        this.commonObjs = commonObjs;
        this.annotationCanvasMap = annotationCanvasMap;
        this.operatorList = operatorList;
        this._pageIndex = pageIndex;
        this.canvasFactory = canvasFactory;
        this.filterFactory = filterFactory;
        this._pdfBug = pdfBug;
        this.pageColors = pageColors;
        this._useRequestAnimationFrame = useRequestAnimationFrame === true &&
            typeof window !== "undefined";
        this.task = new RenderTask(this);
        this._canvas = params.canvasContext.canvas;
    }
    get completed() {
        return this.capability.promise.catch(() => {
            // Ignoring errors, since we only want to know when rendering is
            // no longer pending.
        });
    }
    initializeGraphics({ transparency = false, optionalContentConfig }) {
        if (this.cancelled) {
            return;
        }
        if (this._canvas) {
            if (InternalRenderTask.#canvasInUse.has(this._canvas)) {
                throw new Error("Cannot use the same canvas during multiple render() operations. " +
                    "Use different canvas or ensure previous operations were " +
                    "cancelled or completed.");
            }
            InternalRenderTask.#canvasInUse.add(this._canvas);
        }
        if (this._pdfBug && globalThis.StepperManager?.enabled) {
            this.stepper = globalThis.StepperManager.create(this._pageIndex);
            this.stepper.init(this.operatorList);
            this.stepper.nextBreakPoint = this.stepper.getNextBreakPoint();
        }
        const { canvasContext, viewport, transform, background } = this.params;
        this.gfx = new CanvasGraphics(canvasContext, this.commonObjs, this.objs, this.canvasFactory, this.filterFactory, { optionalContentConfig }, this.annotationCanvasMap, this.pageColors);
        this.gfx.beginDrawing({
            transform,
            viewport,
            transparency,
            background,
        });
        this.operatorListIdx = 0;
        this.graphicsReady = true;
        this.graphicsReadyCallback?.();
    }
    cancel = (error = undefined, extraDelay = 0) => {
        this.running = false;
        this.cancelled = true;
        this.gfx?.endDrawing();
        if (this._canvas) {
            InternalRenderTask.#canvasInUse.delete(this._canvas);
        }
        this.callback(error ||
            new RenderingCancelledException(`Rendering cancelled, page ${this._pageIndex + 1}`, extraDelay));
    };
    operatorListChanged() {
        if (!this.graphicsReady) {
            this.graphicsReadyCallback ||= this._continue;
            return;
        }
        this.stepper?.updateOperatorList(this.operatorList);
        if (this.running) {
            return;
        }
        this._continue();
    }
    _continue = () => {
        this.running = true;
        if (this.cancelled) {
            return;
        }
        if (this.task.onContinue) {
            this.task.onContinue(this._scheduleNext);
        }
        else {
            this._scheduleNext();
        }
    };
    _scheduleNext = () => {
        if (this._useRequestAnimationFrame) {
            globalThis.requestAnimationFrame(() => {
                this._next().catch(this.cancel);
            });
        }
        else {
            Promise.resolve().then(this._next).catch(this.cancel);
        }
    };
    _next = async () => {
        if (this.cancelled) {
            return;
        }
        this.operatorListIdx = this.gfx.executeOperatorList(this.operatorList, this.operatorListIdx, this._continue, this.stepper);
        if (this.operatorListIdx === this.operatorList.argsArray.length) {
            this.running = false;
            if (this.operatorList.lastChunk) {
                // this.gfx!.endDrawing(this.pageColors); //kkkk bug? ✅
                this.gfx.endDrawing();
                if (this._canvas) {
                    InternalRenderTask.#canvasInUse.delete(this._canvas);
                }
                this.callback();
            }
        }
    };
}
export const version = 0;
export const build = 0;
// export const version:string =
//   typeof PDFJSDev !== "undefined" ? PDFJSDev.eval("BUNDLE_VERSION") : null;
// export const build:string =
//   typeof PDFJSDev !== "undefined" ? PDFJSDev.eval("BUNDLE_BUILD") : null;
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=api.js.map