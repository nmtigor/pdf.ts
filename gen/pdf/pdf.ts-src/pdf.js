/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { Ref } from "./core/primitives.js";
import { WorkerMessageHandler } from "./core/worker.js";
import { AnnotationElement, AnnotationLayer, FileAttachmentAnnotationElement, } from "./display/annotation_layer.js";
import { AnnotationStorage, PrintAnnotationStorage, } from "./display/annotation_storage.js";
import { build, getDocument, PDFDataRangeTransport, PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy, PDFWorker, RenderTask, version, } from "./display/api.js";
import { getFilenameFromUrl, getPdfFilenameFromUrl, getXfaPageViewport, isDataScheme, isPdfFile, loadScript, PageViewport, PDFDateString, PixelsPerInch, RenderingCancelledException, setLayerDimensions, StatTimer, } from "./display/display_utils.js";
import { AnnotationEditorLayer } from "./display/editor/annotation_editor_layer.js";
import { AnnotationEditorUIManager } from "./display/editor/tools.js";
import { FontFaceObject } from "./display/font_loader.js";
import { Metadata } from "./display/metadata.js";
import { OptionalContentConfig } from "./display/optional_content_config.js";
import { SVGGraphics } from "./display/svg.js";
import { renderTextLayer, TextLayerRenderTask, updateTextLayer, } from "./display/text_layer.js";
import { GlobalWorkerOptions } from "./display/worker_options.js";
import { XfaLayer } from "./display/xfa_layer.js";
import { QuickJSSandbox } from "./pdf.sandbox.js";
import { AbortException, AnnotationEditorParamsType, AnnotationEditorType, AnnotationMode, CMapCompressionType, createValidAbsoluteUrl, FeatureTest, InvalidPDFException, MissingPDFException, normalizeUnicode, OPS, PasswordResponses, PermissionFlag, shadow, UnexpectedResponseException, Util, VerbosityLevel, } from "./shared/util.js";
/*80--------------------------------------------------------------------------*/
// /* eslint-disable-next-line no-unused-vars */
// const pdfjsVersion =
//   typeof PDFJSDev !== "undefined" ? PDFJSDev.eval("BUNDLE_VERSION") : void 0;
// /* eslint-disable-next-line no-unused-vars */
// const pdfjsBuild =
//   typeof PDFJSDev !== "undefined" ? PDFJSDev.eval("BUNDLE_BUILD") : void 0;
/*80--------------------------------------------------------------------------*/
export { AbortException, AnnotationEditorLayer, AnnotationEditorParamsType, AnnotationEditorType, AnnotationEditorUIManager, AnnotationElement, AnnotationLayer, AnnotationMode, AnnotationStorage, build, CMapCompressionType, createValidAbsoluteUrl, FeatureTest, FileAttachmentAnnotationElement, FontFaceObject, getDocument, getFilenameFromUrl, getPdfFilenameFromUrl, getXfaPageViewport, GlobalWorkerOptions, InvalidPDFException, isDataScheme, isPdfFile, loadScript, Metadata, MissingPDFException, normalizeUnicode, OPS, OptionalContentConfig, PageViewport, PasswordResponses, PDFDataRangeTransport, PDFDateString, PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy, PDFWorker, PermissionFlag, PixelsPerInch, PrintAnnotationStorage, QuickJSSandbox, Ref, RenderingCancelledException, RenderTask, renderTextLayer, setLayerDimensions, shadow, StatTimer, SVGGraphics, TextLayerRenderTask, UnexpectedResponseException, updateTextLayer, Util, VerbosityLevel, version, WorkerMessageHandler, XfaLayer, };
//# sourceMappingURL=pdf.js.map