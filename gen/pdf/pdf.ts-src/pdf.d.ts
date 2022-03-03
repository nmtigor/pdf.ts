/** @typedef {import("./display/api").PDFDocumentLoadingTask} PDFDocumentLoadingTask */
/** @typedef {import("./display/api").PDFDocumentProxy} PDFDocumentProxy */
/** @typedef {import("./display/api").PDFPageProxy} PDFPageProxy */
/** @typedef {import("./display/api").RenderTask} RenderTask */
/** @typedef {import("./display/display_utils").PageViewport} PageViewport */
import { createPromiseCap } from "../../lib/promisecap.js";
import { build, getDocument, LoopbackPort, PDFDataRangeTransport, PDFWorker, version } from "./display/api.js";
import { AnnotationMode, CMapCompressionType, createValidAbsoluteUrl, InvalidPDFException, MissingPDFException, OPS, PasswordResponses, PermissionFlag, shadow, UnexpectedResponseException, UNSUPPORTED_FEATURES, Util, VerbosityLevel } from "./shared/util.js";
import { getFilenameFromUrl, getPdfFilenameFromUrl, getXfaPageViewport, isPdfFile, loadScript, PDFDateString, PixelsPerInch, RenderingCancelledException } from "./display/display_utils.js";
import { AnnotationLayer } from "./display/annotation_layer.js";
import { GlobalWorkerOptions } from "./display/worker_options.js";
import { renderTextLayer } from "./display/text_layer.js";
import { SVGGraphics } from "./display/svg.js";
import { XfaLayer } from "./display/xfa_layer.js";
export { AnnotationLayer, AnnotationMode, build, CMapCompressionType, createPromiseCap, createValidAbsoluteUrl, getDocument, getFilenameFromUrl, getPdfFilenameFromUrl, getXfaPageViewport, GlobalWorkerOptions, InvalidPDFException, isPdfFile, loadScript, LoopbackPort, MissingPDFException, OPS, PasswordResponses, PDFDataRangeTransport, PDFDateString, PDFWorker, PermissionFlag, PixelsPerInch, RenderingCancelledException, renderTextLayer, shadow, SVGGraphics, UnexpectedResponseException, UNSUPPORTED_FEATURES, Util, VerbosityLevel, version, XfaLayer, };
//# sourceMappingURL=pdf.d.ts.map