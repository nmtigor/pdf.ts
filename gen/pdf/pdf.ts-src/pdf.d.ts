/** @typedef {import("./display/api").OnProgressParameters} OnProgressParameters */
/** @typedef {import("./display/api").PDFDocumentLoadingTask} PDFDocumentLoadingTask */
/** @typedef {import("./display/api").PDFDocumentProxy} PDFDocumentProxy */
/** @typedef {import("./display/api").PDFPageProxy} PDFPageProxy */
/** @typedef {import("./display/api").RenderTask} RenderTask */
/** @typedef {import("./display/display_utils").PageViewport} PageViewport */
/** @typedef {import("./display/text_layer").TextLayerRenderTask} TextLayerRenderTask */
import { type FieldObject } from "./core/annotation.js";
import { type Destination, type ExplicitDest, type OpenAction, type Order, type SetOCGState } from "./core/catalog.js";
import { type AnnotActions } from "./core/core_utils.js";
import { type DocumentInfo, type XFAData } from "./core/document.js";
import { type Attachment } from "./core/file_spec.js";
import { type OpListIR } from "./core/operator_list.js";
import { Ref } from "./core/primitives.js";
import { WorkerMessageHandler } from "./core/worker.js";
import { type XFAElData, type XFAElObj } from "./core/xfa/alias.js";
import { AnnotationElement, AnnotationLayer, FileAttachmentAnnotationElement } from "./display/annotation_layer.js";
import { AnnotationStorage, PrintAnnotationStorage } from "./display/annotation_storage.js";
import { type AnnotIntent, build, type DocumentInitP, getDocument, type Intent, type OutlineNode, PDFDataRangeTransport, PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy, PDFWorker, type RefProxy, type RenderP, RenderTask, type TextContent, type TextItem, version } from "./display/api.js";
import { getFilenameFromUrl, getPdfFilenameFromUrl, getXfaPageViewport, isDataScheme, isPdfFile, loadScript, PageViewport, PDFDateString, PixelsPerInch, RenderingCancelledException, setLayerDimensions, StatTimer } from "./display/display_utils.js";
import { AnnotationEditorLayer } from "./display/editor/annotation_editor_layer.js";
import { type PropertyToUpdate } from "./display/editor/editor.js";
import { AnnotationEditorUIManager, type DispatchUpdateStatesP } from "./display/editor/tools.js";
import { FontFaceObject } from "./display/font_loader.js";
import { Metadata } from "./display/metadata.js";
import { OptionalContentConfig } from "./display/optional_content_config.js";
import { SVGGraphics } from "./display/svg.js";
import { renderTextLayer, TextLayerRenderTask, updateTextLayer } from "./display/text_layer.js";
import { GlobalWorkerOptions } from "./display/worker_options.js";
import { XfaLayer } from "./display/xfa_layer.js";
import { QuickJSSandbox } from "./pdf.sandbox.js";
import { type AppInfo } from "./scripting_api/app.js";
import { type ScriptingActionName } from "./scripting_api/common.js";
import { type DocInfo } from "./scripting_api/doc.js";
import { AbortException, AnnotationEditorParamsType, AnnotationEditorType, AnnotationMode, CMapCompressionType, createPromiseCapability, createValidAbsoluteUrl, FeatureTest, InvalidPDFException, type matrix_t, MissingPDFException, OPS, type OPSName, PasswordResponses, PermissionFlag, type PromiseCapability, shadow, UnexpectedResponseException, UNSUPPORTED_FEATURES, Util, VerbosityLevel } from "./shared/util.js";
export { AbortException, type AnnotActions, AnnotationEditorLayer, AnnotationEditorParamsType, AnnotationEditorType, AnnotationEditorUIManager, AnnotationElement, AnnotationLayer, AnnotationMode, AnnotationStorage, type AnnotIntent, type AppInfo, type Attachment, build, CMapCompressionType, createPromiseCapability, createValidAbsoluteUrl, type Destination, type DispatchUpdateStatesP, type DocInfo, type DocumentInfo, type DocumentInitP, type ExplicitDest, FeatureTest, type FieldObject, FileAttachmentAnnotationElement, FontFaceObject, getDocument, getFilenameFromUrl, getPdfFilenameFromUrl, getXfaPageViewport, GlobalWorkerOptions, type Intent, InvalidPDFException, isDataScheme, isPdfFile, loadScript, type matrix_t, Metadata, MissingPDFException, type OpenAction, type OpListIR, OPS, type OPSName, OptionalContentConfig, type Order, type OutlineNode, PageViewport, PasswordResponses, PDFDataRangeTransport, PDFDateString, PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy, PDFWorker, PermissionFlag, PixelsPerInch, PrintAnnotationStorage, type PromiseCapability, type PropertyToUpdate, QuickJSSandbox, Ref, type RefProxy, RenderingCancelledException, type RenderP, RenderTask, renderTextLayer, type ScriptingActionName, setLayerDimensions, type SetOCGState, shadow, StatTimer, SVGGraphics, type TextContent, type TextItem, TextLayerRenderTask, UnexpectedResponseException, UNSUPPORTED_FEATURES, updateTextLayer, Util, VerbosityLevel, version, WorkerMessageHandler, type XFAData, type XFAElData, type XFAElObj, XfaLayer, };
//# sourceMappingURL=pdf.d.ts.map