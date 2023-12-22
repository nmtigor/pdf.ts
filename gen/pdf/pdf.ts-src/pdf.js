/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { AnnotationLayer } from "./display/annotation_layer.js";
import { build, getDocument, PDFDataRangeTransport, PDFWorker, version, } from "./display/api.js";
import { DOMSVGFactory, fetchData, getFilenameFromUrl, getPdfFilenameFromUrl, getXfaPageViewport, isDataScheme, isPdfFile, PDFDateString, PixelsPerInch, RenderingCancelledException, setLayerDimensions, } from "./display/display_utils.js";
import { DrawLayer } from "./display/draw_layer.js";
import { AnnotationEditorLayer } from "./display/editor/annotation_editor_layer.js";
import { Outliner } from "./display/editor/outliner.js";
import { AnnotationEditorUIManager } from "./display/editor/tools.js";
import { renderTextLayer, updateTextLayer } from "./display/text_layer.js";
import { GlobalWorkerOptions } from "./display/worker_options.js";
import { XfaLayer } from "./display/xfa_layer.js";
import { AbortException, AnnotationEditorParamsType, AnnotationEditorType, AnnotationMode, CMapCompressionType, createValidAbsoluteUrl, FeatureTest, ImageKind, InvalidPDFException, MissingPDFException, normalizeUnicode, OPS, PasswordResponses, PermissionFlag, shadow, UnexpectedResponseException, Util, VerbosityLevel, } from "./shared/util.js";
/*80--------------------------------------------------------------------------*/
// /* eslint-disable-next-line no-unused-vars */
// const pdfjsVersion =
//   typeof PDFJSDev !== "undefined" ? PDFJSDev.eval("BUNDLE_VERSION") : void 0;
// /* eslint-disable-next-line no-unused-vars */
// const pdfjsBuild =
//   typeof PDFJSDev !== "undefined" ? PDFJSDev.eval("BUNDLE_BUILD") : void 0;
/*80--------------------------------------------------------------------------*/
export { AbortException, AnnotationEditorLayer, AnnotationEditorParamsType, AnnotationEditorType, AnnotationEditorUIManager, AnnotationLayer, AnnotationMode, build, CMapCompressionType, createValidAbsoluteUrl, DOMSVGFactory, DrawLayer, FeatureTest, fetchData, getDocument, getFilenameFromUrl, getPdfFilenameFromUrl, getXfaPageViewport, GlobalWorkerOptions, ImageKind, InvalidPDFException, isDataScheme, isPdfFile, MissingPDFException, normalizeUnicode, OPS, Outliner, PasswordResponses, PDFDataRangeTransport, PDFDateString, PDFWorker, PermissionFlag, PixelsPerInch, RenderingCancelledException, renderTextLayer, setLayerDimensions, shadow, UnexpectedResponseException, updateTextLayer, Util, VerbosityLevel, version, XfaLayer, };
//# sourceMappingURL=pdf.js.map