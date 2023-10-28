/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { Ref } from "./core/primitives.js";
import { WorkerMessageHandler } from "./core/worker.js";
import { AnnotationElement, AnnotationLayer, FileAttachmentAnnotationElement, } from "./display/annotation_layer.js";
import { PrintAnnotationStorage } from "./display/annotation_storage.js";
import { build, getDocument, PDFDataRangeTransport, PDFDocumentLoadingTask, PDFWorker, RenderTask, SVGGraphics, version, } from "./display/api.js";
import { DOMSVGFactory, getFilenameFromUrl, getPdfFilenameFromUrl, getXfaPageViewport, isDataScheme, isPdfFile, loadScript, PDFDateString, PixelsPerInch, RenderingCancelledException, setLayerDimensions, StatTimer, } from "./display/display_utils.js";
import { AnnotationEditorLayer } from "./display/editor/annotation_editor_layer.js";
import { AnnotationEditorUIManager } from "./display/editor/tools.js";
import { FontFaceObject } from "./display/font_loader.js";
import { Metadata } from "./display/metadata.js";
import { OptionalContentConfig } from "./display/optional_content_config.js";
import { renderTextLayer, TextLayerRenderTask, updateTextLayer, } from "./display/text_layer.js";
import { GlobalWorkerOptions } from "./display/worker_options.js";
import { XfaLayer } from "./display/xfa_layer.js";
import { QuickJSSandbox } from "./pdf.sandbox.js";
import { AbortException, AnnotationEditorParamsType, AnnotationEditorType, AnnotationMode, CMapCompressionType, createValidAbsoluteUrl, FeatureTest, ImageKind, InvalidPDFException, MissingPDFException, normalizeUnicode, OPS, PasswordResponses, PermissionFlag, shadow, UnexpectedResponseException, Util, VerbosityLevel, } from "./shared/util.js";
/*80--------------------------------------------------------------------------*/
// /* eslint-disable-next-line no-unused-vars */
// const pdfjsVersion =
//   typeof PDFJSDev !== "undefined" ? PDFJSDev.eval("BUNDLE_VERSION") : void 0;
// /* eslint-disable-next-line no-unused-vars */
// const pdfjsBuild =
//   typeof PDFJSDev !== "undefined" ? PDFJSDev.eval("BUNDLE_BUILD") : void 0;
/*80--------------------------------------------------------------------------*/
export { AbortException, AnnotationEditorLayer, AnnotationEditorParamsType, AnnotationEditorType, AnnotationEditorUIManager, AnnotationElement, AnnotationLayer, AnnotationMode, build, CMapCompressionType, createValidAbsoluteUrl, DOMSVGFactory, FeatureTest, FileAttachmentAnnotationElement, FontFaceObject, getDocument, getFilenameFromUrl, getPdfFilenameFromUrl, getXfaPageViewport, GlobalWorkerOptions, ImageKind, InvalidPDFException, isDataScheme, isPdfFile, loadScript, Metadata, MissingPDFException, normalizeUnicode, OPS, OptionalContentConfig, PasswordResponses, PDFDataRangeTransport, PDFDateString, PDFDocumentLoadingTask, PDFWorker, PermissionFlag, PixelsPerInch, PrintAnnotationStorage, QuickJSSandbox, Ref, RenderingCancelledException, RenderTask, renderTextLayer, setLayerDimensions, shadow, StatTimer, SVGGraphics, TextLayerRenderTask, UnexpectedResponseException, updateTextLayer, Util, VerbosityLevel, version, WorkerMessageHandler, XfaLayer, };
//# sourceMappingURL=pdf.js.map