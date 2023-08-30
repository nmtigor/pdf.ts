import type { C2D, TypedArray } from "../../../lib/alias.js";
import { PromiseCap } from "../../../lib/util/PromiseCap.js";
import { Stepper } from "../../pdf.ts-web/debugger.js";
import type { PageColors } from "../../pdf.ts-web/pdf_viewer.js";
import type { FieldObject } from "../core/annotation.js";
import type { ExplicitDest, SetOCGState } from "../core/catalog.js";
import type { AnnotActions } from "../core/core_utils.js";
import type { DatasetReader } from "../core/dataset_reader.js";
import type { DocumentInfo } from "../core/document.js";
import type { ImgData } from "../core/evaluator.js";
import type { Attachment } from "../core/file_spec.js";
import type { FontExpotDataEx } from "../core/fonts.js";
import type { CmdArgs } from "../core/font_renderer.js";
import type { IWorker } from "../core/iworker.js";
import type { OpListIR } from "../core/operator_list.js";
import type { ShadingPatternIR } from "../core/pattern.js";
import type { XFAElObj } from "../core/xfa/alias.js";
import type { IPDFStream } from "../interfaces.js";
import type { GetDocRequestData, PageInfo, PDFInfo, Thread } from "../shared/message_handler.js";
import { MessageHandler } from "../shared/message_handler.js";
import type { matrix_t } from "../shared/util.js";
import { AnnotationMode, PasswordResponses, RenderingIntentFlag, VerbosityLevel } from "../shared/util.js";
import type { Serializable } from "./annotation_storage.js";
import { AnnotationStorage, PrintAnnotationStorage } from "./annotation_storage.js";
import type { BaseCanvasFactory } from "./base_factory.js";
import { CanvasGraphics } from "./canvas.js";
import { DOMCanvasFactory, DOMCMapReaderFactory, DOMFilterFactory, DOMStandardFontDataFactory, PageViewport, StatTimer } from "./display_utils.js";
import { FontFaceObject, FontLoader } from "./font_loader.js";
import { Metadata } from "./metadata.js";
import { OptionalContentConfig } from "./optional_content_config.js";
export type DefaultCanvasFactory = DOMCanvasFactory;
export declare const DefaultCanvasFactory: typeof DOMCanvasFactory;
export type DefaultCMapReaderFactory = DOMCMapReaderFactory;
export declare const DefaultCMapReaderFactory: typeof DOMCMapReaderFactory;
export type DefaultFilterFactory = DOMFilterFactory;
export declare const DefaultFilterFactory: typeof DOMFilterFactory;
export type DefaultStandardFontDataFactory = DOMStandardFontDataFactory;
export declare const DefaultStandardFontDataFactory: typeof DOMStandardFontDataFactory;
export type BinaryData = TypedArray | ArrayBuffer | number[] | string;
export interface RefProxy {
    num: number;
    gen: number;
}
/**
 * Document initialization / loading parameters object.
 */
export interface DocumentInitP {
    /**
     * The URL of the PDF.
     */
    url: string | URL | undefined;
    /**
     * Binary PDF data.
     * Use TypedArrays (Uint8Array) to improve the memory usage. If PDF data is
     * BASE64-encoded, use `atob()` to convert it to a binary string first.
     *
     * NOTE: If TypedArrays are used they will generally be transferred to the
     * worker-thread. This will help reduce main-thread memory usage, however
     * it will take ownership of the TypedArrays.
     */
    data?: BinaryData | undefined;
    /**
     * Basic authentication headers.
     */
    httpHeaders: Record<string, string> | undefined;
    /**
     * Indicates whether or not
     * cross-site Access-Control requests should be made using credentials such
     * as cookies or authorization headers. The default is `false`.
     */
    withCredentials: boolean | undefined;
    /**
     * For decrypting password-protected PDFs.
     */
    password?: string;
    /**
     * A typed array with the first portion
     * or all of the pdf data. Used by the extension since some data is already
     * loaded before the switch to range requests.
     */
    initialData?: TypedArray;
    /**
     * The PDF file length. It's used for progress
     * reports and range requests operations.
     */
    length: number | undefined;
    /**
     * Allows for using a custom range
     * transport implementation.
     */
    range?: PDFDataRangeTransport;
    /**
     * Specify maximum number of bytes fetched
     * per range request. The default value is {@link DEFAULT_RANGE_CHUNK_SIZE}.
     */
    rangeChunkSize: number | undefined;
    /**
     * The worker that will be used for loading and
     * parsing the PDF data.
     */
    worker?: PDFWorker;
    /**
     * Controls the logging level; the constants
     * from {@link VerbosityLevel} should be used.
     */
    verbosity?: VerbosityLevel;
    /**
     * The base URL of the document, used when
     * attempting to recover valid absolute URLs for annotations, and outline
     * items, that (incorrectly) only specify relative URLs.
     */
    docBaseUrl?: string | undefined;
    /**
     * The URL where the predefined Adobe CMaps are
     * located. Include the trailing slash.
     */
    cMapUrl?: string | undefined;
    /**
     * Specifies if the Adobe CMaps are binary
     * packed or not. The default value is `true`.
     */
    cMapPacked?: boolean;
    /**
     * The factory that will be used when
     * reading built-in CMap files. Providing a custom factory is useful for
     * environments without Fetch API or `XMLHttpRequest` support, such as
     * Node.js. The default value is {DOMCMapReaderFactory}.
     */
    CMapReaderFactory?: typeof DefaultCMapReaderFactory;
    /**
     * When `true`, fonts that aren't
     * embedded in the PDF document will fallback to a system font.
     * The default value is `true` in web environments and `false` in Node.js;
     * unless `disableFontFace === true` in which case this defaults to `false`
     * regardless of the environment (to prevent completely broken fonts).
     */
    useSystemFonts?: boolean;
    /**
     * The URL where the standard font
     * files are located. Include the trailing slash.
     */
    standardFontDataUrl?: string | undefined;
    /**
     * The factory that will be used
     * when reading the standard font files. Providing a custom factory is useful
     * for environments without Fetch API or `XMLHttpRequest` support, such as
     * Node.js. The default value is {DOMStandardFontDataFactory}.
     */
    StandardFontDataFactory?: typeof DOMStandardFontDataFactory;
    /**
     * Enable using the Fetch API in the
     * worker-thread when reading CMap and standard font files. When `true`,
     * the `CMapReaderFactory` and `StandardFontDataFactory` options are ignored.
     * The default value is `true` in web environments and `false` in Node.js.
     */
    useWorkerFetch?: boolean;
    /**
     * Reject certain promises, e.g.
     * `getOperatorList`, `getTextContent`, and `RenderTask`, when the associated
     * PDF data cannot be successfully parsed, instead of attempting to recover
     * whatever possible of the data. The default value is `false`.
     */
    stopAtErrors?: boolean;
    ignoreErrors?: boolean;
    /**
     * The maximum allowed image size in total
     * pixels, i.e. width * height. Images above this value will not be rendered.
     * Use -1 for no limit, which is also the default value.
     */
    maxImageSize?: number;
    /**
     * Determines if we can evaluate strings
     * as JavaScript. Primarily used to improve performance of font rendering, and
     * when parsing PDF functions. The default value is `true`.
     */
    isEvalSupported?: boolean;
    /**
     * Determines if we can use
     * `OffscreenCanvas` in the worker. Primarily used to improve performance of
     * image conversion/rendering.
     * The default value is `true` in web environments and `false` in Node.js.
     */
    isOffscreenCanvasSupported?: boolean;
    /**
     * The integer value is used to
     * know when an image must be resized (uses `OffscreenCanvas` in the worker).
     * If it's -1 then a possibly slow algorithm is used to guess the max value.
     */
    canvasMaxAreaInBytes?: number;
    /**
     * By default fonts are converted to
     * OpenType fonts and loaded via the Font Loading API or `@font-face` rules.
     * If disabled, fonts will be rendered using a built-in font renderer that
     * constructs the glyphs with primitive path commands.
     * The default value is `false` in web environments and `true` in Node.js.
     */
    disableFontFace?: boolean;
    /**
     * Include additional properties,
     * which are unused during rendering of PDF documents, when exporting the
     * parsed font data from the worker-thread. This may be useful for debugging
     * purposes (and backwards compatibility), but note that it will lead to
     * increased memory usage. The default value is `false`.
     */
    fontExtraProperties?: boolean;
    /**
     * Render Xfa forms if any.
     * The default value is `false`.
     */
    enableXfa?: boolean;
    /**
     * Specify an explicit document
     * context to create elements with and to load resources, such as fonts,
     * into. Defaults to the current document.
     */
    ownerDocument?: Document | undefined;
    /** For testing only */
    styleElement?: HTMLStyleElement;
    /**
     * Disable range request loading of PDF
     * files. When enabled, and if the server supports partial content requests,
     * then the PDF will be fetched in chunks. The default value is `false`.
     */
    disableRange: boolean | undefined;
    /**
     * Disable streaming of PDF file data.
     * By default PDF.js attempts to load PDF files in chunks. The default value
     * is `false`.
     */
    disableStream: boolean | undefined;
    /**
     * Disable pre-fetching of PDF file
     * data. When range requests are enabled PDF.js will automatically keep
     * fetching more data even if it isn't needed to display the current page.
     * The default value is `false`.
     *
     * NOTE: It is also necessary to disable streaming, see above, in order for
     * disabling of pre-fetching to work correctly.
     */
    disableAutoFetch?: boolean;
    /**
     * Enables special hooks for debugging PDF.js
     * (see `web/debugger.js`). The default value is `false`.
     */
    pdfBug?: boolean;
    /**
     * The factory instance that will be used
     * when creating canvases. The default value is {new DOMCanvasFactory()}.
     */
    canvasFactory?: DefaultCanvasFactory;
    /**
     * A factory instance that will be used
     * to create SVG filters when rendering some images on the main canvas.
     */
    filterFactory?: DefaultFilterFactory;
    progressiveDone?: boolean;
    contentDispositionFilename?: string | undefined;
}
type GetDocumentP_ = string | URL | TypedArray | ArrayBuffer | PDFDataRangeTransport | DocumentInitP;
type TransportParams_ = {
    ignoreErrors: boolean;
    isEvalSupported: boolean;
    disableFontFace: boolean;
    fontExtraProperties: boolean;
    enableXfa: boolean;
    ownerDocument: Document;
    disableAutoFetch: boolean;
    pdfBug: boolean;
    styleElement: HTMLStyleElement | undefined;
};
type TransportFactory_ = {
    canvasFactory: DefaultCanvasFactory;
    filterFactory: DefaultFilterFactory;
    cMapReaderFactory: DOMCMapReaderFactory;
    standardFontDataFactory: DOMStandardFontDataFactory;
};
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
export declare function getDocument(src_x: GetDocumentP_): PDFDocumentLoadingTask;
/**
 * The loading task controls the operations required to load a PDF document
 * (such as network requests) and provides a way to listen for completion,
 * after which individual pages can be rendered.
 */
export declare class PDFDocumentLoadingTask {
    #private;
    _capability: PromiseCap<PDFDocumentProxy>;
    _transport: WorkerTransport | undefined;
    _worker: PDFWorker | undefined;
    /**
     * Unique identifier for the document loading task.
     */
    docId: string;
    /**
     * Whether the loading task is destroyed or not.
     */
    destroyed: boolean;
    /**
     * Callback to request a password if a wrong or no password was provided.
     * The callback receives two parameters: a function that should be called
     * with the new password, and a reason (see {@link PasswordResponses}).
     */
    onPassword?: (updateCallback: (password: string | Error) => void, reason: PasswordResponses) => void;
    /**
     * Callback to be able to monitor the loading progress of the PDF file
     * (necessary to implement e.g. a loading bar).
     * The callback receives an {@link OnProgressP} argument.
     */
    onProgress?: (_: OnProgressP) => void;
    constructor();
    /**
     * Promise for document loading task completion.
     */
    get promise(): Promise<PDFDocumentProxy>;
    /**
     * Abort all network requests and destroy the worker.
     * @return A promise that is resolved when destruction is completed.
     */
    destroy(): Promise<void>;
}
type RangeListener = (begin: number, chunk: ArrayBufferLike) => void;
type ProgressListener = (loaded: number, total?: number) => void;
type ProgressiveReadListener = (chunk: ArrayBufferLike) => void;
type ProgressiveDoneListener = () => void;
/**
 * Abstract class to support range requests file loading.
 *
 * NOTE: The TypedArrays passed to the constructor and relevant methods below
 * will generally be transferred to the worker-thread. This will help reduce
 * main-thread memory usage, however it will take ownership of the TypedArrays.
 */
export declare class PDFDataRangeTransport {
    #private;
    length: number;
    initialData: Uint8Array;
    progressiveDone: boolean;
    contentDispositionFilename?: string | undefined;
    addRangeListener(listener: RangeListener): void;
    addProgressListener(listener: ProgressListener): void;
    addProgressiveReadListener(listener: ProgressiveReadListener): void;
    addProgressiveDoneListener(listener: ProgressiveDoneListener): void;
    constructor(length: number, initialData: Uint8Array, progressiveDone?: boolean, contentDispositionFilename?: string | undefined);
    onDataRange(begin: number, chunk: ArrayBufferLike): void;
    onDataProgress(loaded: number, total?: number): void;
    onDataProgressiveRead(chunk: ArrayBufferLike): void;
    onDataProgressiveDone(): void;
    transportReady(): void;
    requestDataRange(begin: number, end: number): void;
    abort(): void;
}
export interface OutlineNode {
    action: string | undefined;
    attachment: Attachment | undefined;
    bold: boolean;
    count: number | undefined;
    /**
     * The color in RGB format to use for display purposes.
     */
    color: Uint8ClampedArray;
    dest: ExplicitDest | string | undefined;
    italic: boolean;
    items: OutlineNode[];
    newWindow: boolean | undefined;
    setOCGState: SetOCGState | undefined;
    title: string;
    unsafeUrl: string | undefined;
    url: string | undefined;
}
export type MetadataEx = {
    info: DocumentInfo;
    metadata: Metadata | undefined;
    contentDispositionFilename: string | undefined;
    contentLength: number | undefined;
};
/**
 * Proxy to a `PDFDocument` in the worker thread.
 */
export declare class PDFDocumentProxy {
    #private;
    _transport: WorkerTransport;
    constructor(pdfInfo: PDFInfo, transport: WorkerTransport);
    /**
     * @return Storage for annotation data in forms.
     */
    get annotationStorage(): AnnotationStorage;
    /**
     * @return The filter factory instance.
     */
    get filterFactory(): DOMFilterFactory;
    /**
     * @return Total number of pages in the PDF file.
     */
    get numPages(): number;
    /**
     * A (not guaranteed to be) unique ID to
     * identify the PDF document.
     * NOTE: The first element will always be defined for all PDF documents,
     * whereas the second element is only defined for *modified* PDF documents.
     */
    get fingerprints(): [string, string | undefined];
    /**
     * @return True if only XFA form.
     */
    get isPureXfa(): boolean;
    /**
     * NOTE: This is (mostly) intended to support printing of XFA forms.
     *
     * An object representing a HTML tree structure
     * to render the XFA, or `null` when no XFA form exists.
     */
    get allXfaHtml(): XFAElObj | undefined;
    /**
     * @param pageNumber The page number to get. The first page is 1.
     * @return A promise that is resolved with a {@link PDFPageProxy} object.
     */
    getPage(pageNumber: number): Promise<PDFPageProxy>;
    /**
     * @param ref The page reference.
     * @return A promise that is resolved with the page index,
     *   starting from zero, that is associated with the reference.
     */
    getPageIndex(ref: RefProxy): Promise<number>;
    /**
     * @return A promise that is resolved
     *   with a mapping from named destinations to references.
     *
     * This can be slow for large documents. Use `getDestination` instead.
     */
    getDestinations(): Promise<Record<string, ExplicitDest>>;
    /**
     * @param id The named destination to get.
     * @return A promise that is resolved with all
     *   information of the given named destination, or `null` when the named
     *   destination is not present in the PDF file.
     */
    getDestination(id: string): Promise<ExplicitDest | undefined>;
    /**
     * @return A promise that is resolved with
     *   an {Array} containing the page labels that correspond to the page
     *   indexes, or `null` when no page labels are present in the PDF file.
     */
    getPageLabels(): Promise<string[] | undefined>;
    /**
     * @return A promise that is resolved with a {string}
     *   containing the page layout name.
     */
    getPageLayout(): Promise<import("../../pdf.ts-web/ui_utils.js").PageLayout | undefined>;
    /**
     * @return A promise that is resolved with a {string}
     *   containing the page mode name.
     */
    getPageMode(): Promise<import("../../pdf.ts-web/ui_utils.js").PageMode>;
    /**
     * @return A promise that is resolved with an
     *   {Object} containing the viewer preferences, or `null` when no viewer
     *   preferences are present in the PDF file.
     */
    getViewerPreferences(): Promise<import("../core/catalog.js").ViewerPref | undefined>;
    /**
     * @return A promise that is resolved with an {Array}
     *   containing the destination, or `null` when no open action is present
     *   in the PDF.
     */
    getOpenAction(): Promise<import("../core/catalog.js").OpenAction | undefined>;
    /**
     * @return A promise that is resolved with a lookup table
     *   for mapping named attachments to their content.
     */
    getAttachments(): Promise<any>;
    /**
     * @return A promise that is resolved with
     *   an {Array} of all the JavaScript strings in the name tree, or `null`
     *   if no JavaScript exists.
     */
    getJavaScript(): Promise<string[] | undefined>;
    /**
     * @return A promise that is resolved with
     *   an {Object} with the JavaScript actions:
     *     - from the name tree (like getJavaScript);
     *     - from A or AA entries in the catalog dictionary.
     *   , or `null` if no JavaScript exists.
     */
    getJSActions(): Promise<AnnotActions | undefined>;
    /**
     * @return A promise that is resolved with an
     *   {Array} that is a tree outline (if it has one) of the PDF file.
     */
    getOutline(): Promise<OutlineNode[] | undefined>;
    /**
     * @return A promise that is resolved with
     *   an {@link OptionalContentConfig} that contains all the optional content
     *   groups (assuming that the document has any).
     */
    getOptionalContentConfig(): Promise<OptionalContentConfig>;
    /**
     * @return A promise that is resolved with
     *   an {Array} that contains the permission flags for the PDF document, or
     *   `null` when no permissions are present in the PDF file.
     */
    getPermissions(): Promise<import("../shared/util.js").PermissionFlag[] | undefined>;
    /**
     * @return A promise that is
     *   resolved with an {Object} that has `info` and `metadata` properties.
     *   `info` is an {Object} filled with anything available in the information
     *   dictionary and similarly `metadata` is a {Metadata} object with
     *   information from the metadata section of the PDF.
     */
    getMetadata(): Promise<MetadataEx>;
    /**
     * @return A promise that is resolved with
     *   a {MarkInfo} object that contains the MarkInfo flags for the PDF
     *   document, or `null` when no MarkInfo values are present in the PDF file.
     */
    getMarkInfo(): Promise<import("../core/catalog.js").MarkInfo | undefined>;
    /**
     * @return A promise that is resolved with a
     *   {Uint8Array} containing the raw data of the PDF document.
     */
    getData(): Promise<Uint8Array>;
    /**
     * @return A promise that is resolved with a
     *   {Uint8Array} containing the full data of the saved document.
     */
    saveDocument(): Promise<Uint8Array>;
    /**
     * @return A promise that is resolved when the
     *   document's data is loaded. It is resolved with an {Object} that contains
     *   the `length` property that indicates size of the PDF data in bytes.
     */
    getDownloadInfo(): Promise<{
        length: number;
    }>;
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
    cleanup(keepLoadedFonts?: boolean): Promise<void>;
    /**
     * Destroys the current document instance and terminates the worker.
     */
    destroy(): Promise<void>;
    /**
     * A subset of the current
     * {DocumentInitParameters}, which are needed in the viewer.
     */
    get loadingParams(): {
        disableAutoFetch: boolean;
        enableXfa: boolean;
    };
    /**
     * The loadingTask for the current document.
     */
    get loadingTask(): PDFDocumentLoadingTask;
    /**
     * @return A promise that is
     *   resolved with an {Object} containing /AcroForm field data for the JS
     *   sandbox, or `null` when no field data is present in the PDF file.
     */
    getFieldObjects(): Promise<boolean | Record<string, FieldObject[]> | MetadataEx | undefined>;
    /**
     * @return A promise that is resolved with `true`
     *   if some /AcroForm fields have JavaScript actions.
     */
    hasJSActions(): Promise<boolean>;
    /**
     * @return A promise that is resolved with an
     *   {Array<string>} containing IDs of annotations that have a calculation
     *   action, or `null` when no such annotations are present in the PDF file.
     */
    getCalculationOrderIds(): Promise<string[] | undefined>;
    getXFADatasets: () => Promise<DatasetReader | undefined>;
    getXRefPrevValue: () => Promise<number | undefined>;
    getAnnotArray: (pageIndex: number) => Promise<unknown>;
}
/**
 * Page getViewport parameters.
 */
interface _GetViewportP {
    /**
     * The desired scale of the viewport.
     * In CSS unit.
     */
    scale: number;
    /**
     * The desired rotation, in degrees, of
     * the viewport. If omitted it defaults to the page rotation.
     */
    rotation?: number;
    /**
     * The horizontal, i.e. x-axis, offset.
     * The default value is `0`.
     */
    offsetX?: number;
    /**
     * The vertical, i.e. y-axis, offset.
     * The default value is `0`.
     */
    offsetY?: number;
    /**
     * If true, the y-axis will not be
     * flipped. The default value is `false`.
     */
    dontFlip?: boolean;
}
/**
 * Page getTextContent parameters.
 */
interface GetTextContentP_ {
    /**
     * When true include marked
     * content items in the items array of TextContent. The default is `false`.
     */
    includeMarkedContent?: boolean;
    /**
     * When true the text is *not*
     * normalized in the worker-thread. The default is `false`.
     */
    disableNormalization?: boolean;
}
/**
 * Page text content.
 */
export type TextContent = {
    /**
     * Array of
     * {@link TextItem} and {@link TextMarkedContent} objects. TextMarkedContent
     * items are included when includeMarkedContent is true.
     */
    items: (TextItem | TextMarkedContent)[];
    /**
     * {@link TextStyle} objects,
     * indexed by font name.
     */
    styles: Record<string, TextStyle>;
};
/**
 * Page text content part.
 */
export type TextItem = {
    /**
     * Text content.
     */
    str: string;
    /**
     * Text direction.
     */
    dir: "ttb" | "ltr" | "rtl";
    /**
     * Transformation matrix.
     */
    transform: matrix_t;
    /**
     * Width in device space.
     */
    width: number;
    /**
     * Height in device space.
     */
    height: number;
    /**
     * Font name used by PDF.js for converted font.
     */
    fontName: string | undefined;
    /**
     * Indicating if the text content is followed by a line-break.
     */
    hasEOL: boolean;
};
/**
 * Page text marked content part.
 */
export type TextMarkedContent = {
    type: "beginMarkedContent" | "beginMarkedContentProps" | "endMarkedContent";
    /**
     * The marked content identifier. Only used for type
     * 'beginMarkedContentProps'.
     */
    id?: string | undefined;
    tag?: string | undefined;
};
/**
 * Text style.
 */
export interface TextStyle {
    /**
     * Font ascent.
     */
    ascent: number;
    /**
     * Font descent.
     */
    descent: number;
    /**
     * Whether or not the text is in vertical mode.
     */
    vertical: boolean | undefined;
    /**
     * The possible font family.
     */
    fontFamily: string;
}
/**
 * Page annotation parameters.
 */
interface _GetAnnotationsP {
    /**
     * Determines the annotations that are fetched,
     * can be 'display' (viewable annotations), 'print' (printable annotations),
     * or 'any' (all annotations). The default value is 'display'.
     */
    intent: Intent | undefined;
}
export interface ImageLayer {
    beginLayout(): void;
    endLayout(): void;
    appendImage(_: {
        imgData: ImgData;
        left: number;
        top: number;
        width: number;
        height: number;
    }): void;
}
/**
 * Page render parameters.
 */
export interface RenderP {
    /**
     * A 2D context of a DOM Canvas object.
     */
    canvasContext: C2D;
    /**
     * Rendering viewport obtained by calling
     * the `PDFPageProxy.getViewport` method.
     */
    viewport: PageViewport;
    /**
     * Rendering intent, can be 'display', 'print',
     * or 'any'. The default value is 'display'.
     */
    intent?: Intent;
    /**
     * Controls which annotations are rendered
     * onto the canvas, for annotations with appearance-data; the values from
     * {@link AnnotationMode} should be used. The following values are supported:
     *  - `AnnotationMode.DISABLE`, which disables all annotations.
     *  - `AnnotationMode.ENABLE`, which includes all possible annotations (thus
     *    it also depends on the `intent`-option, see above).
     *  - `AnnotationMode.ENABLE_FORMS`, which excludes annotations that contain
     *    interactive form elements (those will be rendered in the display layer).
     *  - `AnnotationMode.ENABLE_STORAGE`, which includes all possible annotations
     *    (as above) but where interactive form elements are updated with data
     *    from the {@link AnnotationStorage}-instance; useful e.g. for printing.
     * The default value is `AnnotationMode.ENABLE`.
     */
    annotationMode?: AnnotationMode;
    /**
     * Whether or not interactive
     * form elements are rendered in the display layer. If so, we do not render
     * them on the canvas as well. The default value is `false`.
     */
    renderInteractiveForms?: boolean;
    /**
     * Additional transform, applied just
     * before viewport transform.
     */
    transform?: matrix_t | undefined;
    /**
     * Background to use for the canvas.
     * Any valid `canvas.fillStyle` can be used: a `DOMString` parsed as CSS
     * <color> value, a `CanvasGradient` object (a linear or radial gradient) or
     * a `CanvasPattern` object (a repetitive image). The default value is
     * 'rgb(255,255,255)'.
     *
     * NOTE: This option may be partially, or completely, ignored when the
     * `pageColors`-option is used.
     */
    background?: string | CanvasGradient | CanvasPattern;
    /**
     * Overwrites background and foreground colors
     * with user defined ones in order to improve readability in high contrast
     * mode.
     */
    pageColors?: PageColors | undefined;
    /**
     * A promise that should resolve with an {@link OptionalContentConfig}
     * created from `PDFDocumentProxy.getOptionalContentConfig`. If `null`,
     * the configuration will be fetched automatically with the default visibility
     * states set.
     */
    optionalContentConfigPromise?: Promise<OptionalContentConfig | undefined> | undefined;
    /**
     * Map some annotation ids with canvases used to render them.
     */
    annotationCanvasMap?: Map<string, HTMLCanvasElement> | undefined;
    printAnnotationStorage?: PrintAnnotationStorage | undefined;
}
/**
 * Page getOperatorList parameters.
 */
interface GetOperatorListP_ {
    /**
     * Rendering intent, can be 'display', 'print',
     * or 'any'. The default value is 'display'.
     */
    intent?: Intent;
    /**
     * Controls which annotations are included
     * in the operatorList, for annotations with appearance-data; the values from
     * {@link AnnotationMode} should be used. The following values are supported:
     *  - `AnnotationMode.DISABLE`, which disables all annotations.
     *  - `AnnotationMode.ENABLE`, which includes all possible annotations (thus
     *    it also depends on the `intent`-option, see above).
     *  - `AnnotationMode.ENABLE_FORMS`, which excludes annotations that contain
     *    interactive form elements (those will be rendered in the display layer).
     *  - `AnnotationMode.ENABLE_STORAGE`, which includes all possible annotations
     *    (as above) but where interactive form elements are updated with data
     *    from the {@link AnnotationStorage}-instance; useful e.g. for printing.
     * The default value is `AnnotationMode.ENABLE`.
     */
    annotationMode?: AnnotationMode;
    printAnnotationStorage?: PrintAnnotationStorage;
}
/**
 * Structure tree node. The root node will have a role "Root".
 */
export interface StructTreeNode {
    /**
     * Array of {@link StructTreeNode} and {@link StructTreeContent} objects.
     */
    children: (StructTreeNode | StructTreeContent)[];
    /**
     * element's role, already mapped if a role map exists in the PDF.
     */
    role: string;
    alt?: string;
    lang?: string;
}
/**
 * Structure tree content.
 */
export interface StructTreeContent {
    /**
     * either "content" for page and stream structure
     * elements or "object" for object references.
     */
    type: "content" | "object";
    /**
     * unique id that will map to the text layer.
     */
    id?: string;
}
export type AnnotIntent = "display" | "print" | "richText";
export type Intent = AnnotIntent | "any";
export type PDFObjs = ImgData | ShadingPatternIR;
interface IntentArgs_ {
    renderingIntent: RenderingIntentFlag;
    cacheKey: string;
    annotationStorageSerializable: Serializable;
    isOpList?: boolean;
}
/**
 * Proxy to a `PDFPage` in the worker thread.
 */
export declare class PDFPageProxy {
    #private;
    _pageIndex: number;
    _pageInfo: PageInfo;
    _transport: WorkerTransport;
    _stats: StatTimer | undefined;
    /**
     * @return Returns page stats, if enabled; returns `undefined` otherwise.
     */
    get stats(): StatTimer | undefined;
    _pdfBug: boolean;
    commonObjs: PDFObjects<PDFCommonObjs>;
    objs: PDFObjects<PDFObjs | undefined>;
    _maybeCleanupAfterRender: boolean;
    destroyed: boolean;
    constructor(pageIndex: number, pageInfo: PageInfo, transport: WorkerTransport, pdfBug?: boolean);
    /**
     * @return Page number of the page. First page is 1.
     */
    get pageNumber(): number;
    /**
     * The number of degrees the page is rotated clockwise.
     */
    get rotate(): number;
    /**
     * The reference that points to this page.
     */
    get ref(): RefProxy | undefined;
    /**
     * The default size of units in 1/72nds of an inch.
     */
    get userUnit(): number;
    /**
     * An array of the visible portion of the PDF page in
     * user space units [x1, y1, x2, y2].
     */
    get view(): [number, number, number, number];
    /**
     * @param params Viewport parameters.
     * @return Contains 'width' and 'height' properties
     *   along with transforms required for rendering.
     */
    getViewport({ scale, rotation, offsetX, offsetY, dontFlip, }: _GetViewportP): PageViewport;
    /**
     * @param params Annotation parameters.
     * @return A promise that is resolved with an
     *   {Array} of the annotation objects.
     */
    getAnnotations({ intent }?: _GetAnnotationsP): Promise<import("../core/annotation.js").AnnotationData[]>;
    /**
     * @return A promise that is resolved with an
     *   {Object} with JS actions.
     */
    getJSActions(): Promise<AnnotActions | undefined>;
    /**
     * @return The filter factory instance.
     */
    get filterFactory(): DefaultFilterFactory;
    /**
     * @return True if only XFA form.
     */
    get isPureXfa(): boolean;
    /**
     * A promise that is resolved with
     * an {Object} with a fake DOM object (a tree structure where elements
     * are {Object} with a name, attributes (class, style, ...), value and
     * children, very similar to a HTML DOM tree), or `null` if no XFA exists.
     */
    getXfa(): Promise<string | true | import("../core/xfa/alias.js").XFAHTMLObj | import("../core/xfa/alias.js").XFASVGObj | undefined>;
    /**
     * Begins the process of rendering a page to the desired context.
     *
     * @param params Page render parameters.
     * @return An object that contains a promise that is
     *   resolved when the page finishes rendering.
     */
    render({ canvasContext, viewport, intent, annotationMode, transform, background, optionalContentConfigPromise, annotationCanvasMap, pageColors, printAnnotationStorage, }: RenderP): RenderTask;
    /**
     * @param params Page getOperatorList parameters.
     * @return A promise resolved with an
     *   {@link PDFOperatorList} object that represents the page's operator list.
     */
    getOperatorList({ intent, annotationMode, printAnnotationStorage, }?: GetOperatorListP_): Promise<OpListIR>;
    /**
     * NOTE: All occurrences of whitespace will be replaced by
     * standard spaces (0x20).
     *
     * @param params getTextContent parameters.
     * @return Stream for reading text content chunks.
     */
    streamTextContent({ includeMarkedContent, disableNormalization, }?: GetTextContentP_): ReadableStream<TextContent>;
    /**
     * NOTE: All occurrences of whitespace will be replaced by
     * standard spaces (0x20).
     *
     * @param params - getTextContent parameters.
     * @return A promise that is resolved with a
     *   {@link TextContent} object that represents the page's text content.
     */
    getTextContent(params?: GetTextContentP_): Promise<TextContent>;
    /**
     * @return A promise that is resolved with a
     *   {@link StructTreeNode} object that represents the page's structure tree,
     *   or `null` when no structure tree is present for the current page.
     */
    getStructTree(): Promise<StructTreeNode | undefined>;
    /**
     * Destroys the page object.
     * @private
     */
    _destroy(): Promise<void[]>;
    /**
     * Cleans up resources allocated by the page.
     *
     * @param resetStats - Reset page stats, if enabled.
     *   The default value is `false`.
     * @return Indicates if clean-up was successfully run.
     */
    cleanup(resetStats?: boolean): boolean;
    _startRenderPage(transparency: boolean, cacheKey: string): void;
}
export declare class LoopbackPort {
    #private;
    postMessage(message: any, transfer?: Transferable[]): void;
    addEventListener(name: string, listener: EventListener): void;
    removeEventListener(name: string, listener: EventListener): void;
    terminate(): void;
}
interface PDFWorkerP_ {
    /**
     * The name of the worker.
     */
    name?: string;
    /**
     * The `workerPort` object.
     */
    port?: Worker | undefined;
    /**
     * Controls the logging level;
     * the constants from {@link VerbosityLevel} should be used.
     */
    verbosity?: VerbosityLevel | undefined;
}
export declare const PDFWorkerUtil: {
    isWorkerDisabled: boolean;
    fallbackWorkerSrc: string | undefined;
    fakeWorkerId: number;
    isSameOrigin: (baseUrl: string | URL, otherUrl: string | URL) => boolean;
    createCDNWrapper: (url: string) => string;
};
/**
 * PDF.js web worker abstraction that controls the instantiation of PDF
 * documents. Message handlers are used to pass information from the main
 * thread to the worker thread and vice versa. If the creation of a web
 * worker is not possible, a "fake" worker will be used instead.
 */
export declare class PDFWorker {
    #private;
    name: string | undefined;
    destroyed: boolean;
    verbosity: VerbosityLevel;
    /**
     * Promise for worker initialization completion.
     */
    get promise(): Promise<void>;
    /**
     * The current `workerPort`, when it exists.
     */
    get port(): IWorker;
    get _webWorker(): Worker | undefined;
    /**
     * The current MessageHandler-instance.
     */
    get messageHandler(): MessageHandler<Thread.main, Thread.worker>;
    constructor({ name, port, verbosity, }?: PDFWorkerP_);
    /**
     * Destroys the worker instance.
     */
    destroy(): void;
    /**
     * @param params The worker initialization parameters.
     */
    static fromPort(params: PDFWorkerP_): PDFWorker | undefined;
    /**
     * The current `workerSrc`, when it exists.
     */
    static get workerSrc(): string;
    static get _mainThreadWorkerMessageHandler(): any;
    static get _setupFakeWorkerGlobal(): Promise<{
        setup(handler: MessageHandler<Thread.worker, Thread.main>, port: IWorker): void;
        createDocumentHandler(docParams: GetDocRequestData, port: IWorker): string;
        initializeFromPort(port: IWorker): void;
    }>;
}
export type PDFCommonObjs = string | FontFaceObject | FontExpotDataEx | {
    error: string;
} | CmdArgs[] | ImgData;
/**
 * For internal use only.
 * @ignore
 * @final
 */
declare class WorkerTransport {
    #private;
    messageHandler: MessageHandler<Thread.main, Thread.worker>;
    loadingTask: PDFDocumentLoadingTask;
    commonObjs: PDFObjects<PDFCommonObjs>;
    fontLoader: FontLoader;
    _params: TransportParams_;
    canvasFactory: DOMCanvasFactory;
    filterFactory: DOMFilterFactory;
    cMapReaderFactory: DOMCMapReaderFactory;
    standardFontDataFactory: DOMStandardFontDataFactory;
    destroyed: boolean;
    destroyCapability?: PromiseCap;
    _passwordCapability?: PromiseCap<{
        password: string;
    }>;
    downloadInfoCapability: PromiseCap<{
        length: number;
    }>;
    _htmlForXfa: XFAElObj | undefined;
    constructor(messageHandler: MessageHandler<Thread.main>, loadingTask: PDFDocumentLoadingTask, networkStream: IPDFStream | undefined, params: TransportParams_, factory: TransportFactory_);
    get annotationStorage(): AnnotationStorage;
    getRenderingIntent(intent: Intent, annotationMode?: AnnotationMode, printAnnotationStorage?: PrintAnnotationStorage | undefined, isOpList?: boolean): IntentArgs_;
    destroy(): Promise<void>;
    setupMessageHandler(): void;
    getData(): Promise<Uint8Array>;
    saveDocument(): Promise<Uint8Array>;
    getPage(pageNumber: unknown): Promise<PDFPageProxy>;
    getPageIndex(ref: RefProxy): Promise<number>;
    getAnnotations(pageIndex: number, intent: RenderingIntentFlag): Promise<import("../core/annotation.js").AnnotationData[]>;
    getFieldObjects(): Promise<boolean | Record<string, FieldObject[]> | MetadataEx | undefined>;
    hasJSActions(): Promise<boolean>;
    getCalculationOrderIds(): Promise<string[] | undefined>;
    getDestinations(): Promise<Record<string, ExplicitDest>>;
    getDestination(id: string): Promise<ExplicitDest | undefined>;
    getPageLabels(): Promise<string[] | undefined>;
    getPageLayout(): Promise<import("../../pdf.ts-web/ui_utils.js").PageLayout | undefined>;
    getPageMode(): Promise<import("../../pdf.ts-web/ui_utils.js").PageMode>;
    getViewerPreferences(): Promise<import("../core/catalog.js").ViewerPref | undefined>;
    getOpenAction(): Promise<import("../core/catalog.js").OpenAction | undefined>;
    getAttachments(): Promise<unknown>;
    getJavaScript(): Promise<string[] | undefined>;
    getDocJSActions(): Promise<AnnotActions | undefined>;
    getPageJSActions(pageIndex: number): Promise<AnnotActions | undefined>;
    getStructTree(pageIndex: number): Promise<StructTreeNode | undefined>;
    getOutline(): Promise<OutlineNode[] | undefined>;
    getOptionalContentConfig(): Promise<OptionalContentConfig>;
    getPermissions(): Promise<import("../shared/util.js").PermissionFlag[] | undefined>;
    getMetadata(): Promise<MetadataEx>;
    getMarkInfo(): Promise<import("../core/catalog.js").MarkInfo | undefined>;
    startCleanup(keepLoadedFonts?: boolean): Promise<void>;
    get loadingParams(): {
        disableAutoFetch: boolean;
        enableXfa: boolean;
    };
    getXFADatasets: () => Promise<DatasetReader | undefined>;
    getXRefPrevValue: () => Promise<number | undefined>;
    getAnnotArray: (pageIndex: number) => Promise<unknown>;
}
/**
 * A PDF document and page is built of many objects. E.g. there are objects for
 * fonts, images, rendering code, etc. These objects may get processed inside of
 * a worker. This class implements some basic methods to manage these objects.
 */
export declare class PDFObjects<T> {
    #private;
    /**
     * If called *without* callback, this returns the data of `objId` but the
     * object needs to be resolved. If it isn't, this method throws.
     *
     * If called *with* a callback, the callback is called with the data of the
     * object once the object is resolved. That means, if you call this method
     * and the object is already resolved, the callback gets called right away.
     */
    get(objId: string, callback?: (value?: unknown) => void): T | undefined;
    has(objId: string): boolean;
    /**
     * Resolves the object `objId` with optional `data`.
     */
    resolve(objId: string, data?: T | undefined): void;
    clear(): void;
}
/**
 * Allows controlling of the rendering tasks.
 */
export declare class RenderTask {
    #private;
    /**
     * Callback for incremental rendering -- a function that will be called
     * each time the rendering is paused.  To continue rendering call the
     * function that is the first argument to the callback.
     */
    onContinue?: (cont: () => void) => void;
    constructor(internalRenderTask: InternalRenderTask);
    /**
     * Promise for rendering task completion.
     */
    get promise(): Promise<void>;
    /**
     * Cancels the rendering task. If the task is currently rendering it will
     * not be cancelled until graphics pauses with a timeout. The promise that
     * this object extends will be rejected when cancelled.
     */
    cancel(extraDelay?: number): void;
    /**
     * Whether form fields are rendered separately from the main operatorList.
     */
    get separateAnnots(): boolean;
}
interface IRTCtorP_Paraams_ {
    canvasContext: C2D;
    viewport: PageViewport;
    transform: matrix_t | undefined;
    background: string | CanvasGradient | CanvasPattern | undefined;
}
interface InternalRenderTaskCtorP_ {
    callback: (error?: unknown) => void;
    params: IRTCtorP_Paraams_;
    objs: PDFObjects<PDFObjs | undefined>;
    commonObjs: PDFObjects<PDFCommonObjs>;
    annotationCanvasMap: Map<string, HTMLCanvasElement> | undefined;
    operatorList: OpListIR;
    pageIndex: number;
    canvasFactory: BaseCanvasFactory;
    filterFactory: DefaultFilterFactory;
    useRequestAnimationFrame?: boolean;
    pdfBug?: boolean;
    pageColors: PageColors | undefined;
}
interface InitializeGraphicsP_ {
    transparency?: boolean;
    optionalContentConfig: OptionalContentConfig | undefined;
}
/**
 * For internal use only.
 * @ignore
 */
export declare class InternalRenderTask {
    #private;
    callback: (error?: unknown) => void;
    params: IRTCtorP_Paraams_;
    objs: PDFObjects<PDFObjs | undefined>;
    commonObjs: PDFObjects<PDFCommonObjs>;
    annotationCanvasMap: Map<string, HTMLCanvasElement> | undefined;
    operatorListIdx?: number;
    operatorList: OpListIR;
    _pageIndex: number;
    canvasFactory: BaseCanvasFactory;
    filterFactory: DOMFilterFactory;
    _pdfBug: boolean;
    pageColors: PageColors | undefined;
    running: boolean;
    graphicsReadyCallback?: () => void;
    graphicsReady: boolean;
    _useRequestAnimationFrame: boolean;
    cancelled: boolean;
    capability: PromiseCap<void>;
    task: RenderTask;
    _canvas: HTMLCanvasElement;
    stepper?: Stepper;
    gfx?: CanvasGraphics;
    constructor({ callback, params, objs, commonObjs, annotationCanvasMap, operatorList, pageIndex, canvasFactory, filterFactory, useRequestAnimationFrame, pdfBug, pageColors, }: InternalRenderTaskCtorP_);
    get completed(): Promise<void>;
    initializeGraphics({ transparency, optionalContentConfig }: InitializeGraphicsP_): void;
    cancel: (error?: any, extraDelay?: number) => void;
    operatorListChanged(): void;
    _continue: () => void;
    _scheduleNext: () => void;
    _next: () => Promise<void>;
}
export declare const version = 0;
export declare const build = 0;
export {};
//# sourceMappingURL=api.d.ts.map