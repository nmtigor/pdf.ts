/** @typedef {import("./display/api").PDFDocumentLoadingTask} PDFDocumentLoadingTask */
/** @typedef {import("./display/api").PDFDocumentProxy} PDFDocumentProxy */
/** @typedef {import("./display/api").PDFPageProxy} PDFPageProxy */
/** @typedef {import("./display/api").RenderTask} RenderTask */
import { createPromiseCap } from "../../lib/promisecap.js";
import { addLinkAttributes, getFilenameFromUrl, LinkTarget, loadScript, PDFDateString, PixelsPerInch, RenderingCancelledException } from "./display/display_utils.js";
import { build, getDocument, LoopbackPort, PDFDataRangeTransport, PDFWorker, version } from "./display/api.js";
import { AnnotationMode, CMapCompressionType, createObjectURL, createValidAbsoluteUrl, InvalidPDFException, MissingPDFException, OPS, PasswordResponses, PermissionFlag, removeNullCharacters, shadow, UnexpectedResponseException, UNSUPPORTED_FEATURES, Util, VerbosityLevel } from "./shared/util.js";
import { AnnotationLayer } from "./display/annotation_layer.js";
import { GlobalWorkerOptions } from "./display/worker_options.js";
import { renderTextLayer } from "./display/text_layer.js";
import { SVGGraphics } from "./display/svg.js";
import { XfaLayer } from "./display/xfa_layer.js";
export { addLinkAttributes, getFilenameFromUrl, LinkTarget, loadScript, PDFDateString, PixelsPerInch, RenderingCancelledException, AnnotationMode, CMapCompressionType, createObjectURL, createPromiseCap, createValidAbsoluteUrl, InvalidPDFException, MissingPDFException, OPS, PasswordResponses, PermissionFlag, removeNullCharacters, shadow, UnexpectedResponseException, UNSUPPORTED_FEATURES, Util, VerbosityLevel, build, getDocument, LoopbackPort, PDFDataRangeTransport, PDFWorker, version, AnnotationLayer, GlobalWorkerOptions, renderTextLayer, SVGGraphics, XfaLayer, };
//# sourceMappingURL=pdf.d.ts.map