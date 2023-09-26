/** @typedef {import("./display/api").OnProgressParameters} OnProgressParameters */
/** @typedef {import("./display/api").PDFDocumentLoadingTask} PDFDocumentLoadingTask */
/** @typedef {import("./display/api").PDFDocumentProxy} PDFDocumentProxy */
/** @typedef {import("./display/api").PDFPageProxy} PDFPageProxy */
/** @typedef {import("./display/api").RenderTask} RenderTask */
/** @typedef {import("./display/display_utils").PageViewport} PageViewport */
/** @typedef {import("./display/text_layer").TextLayerRenderTask} TextLayerRenderTask */
import type { FieldObject } from "./core/annotation.js";
import type { Destination, ExplicitDest, OpenAction, Order, SetOCGState } from "./core/catalog.js";
import type { AnnotActions } from "./core/core_utils.js";
import type { DocumentInfo, XFAData } from "./core/document.js";
import type { Attachment } from "./core/file_spec.js";
import type { OpListIR } from "./core/operator_list.js";
import { Ref } from "./core/primitives.js";
import { WorkerMessageHandler } from "./core/worker.js";
import type { XFAElData, XFAElObj } from "./core/xfa/alias.js";
import { AnnotationElement, AnnotationLayer, FileAttachmentAnnotationElement } from "./display/annotation_layer.js";
import type { AnnotationStorage } from "./display/annotation_storage.js";
import { PrintAnnotationStorage } from "./display/annotation_storage.js";
import type { AnnotIntent, DocumentInitP, Intent, OutlineNode, PDFDocumentProxy, PDFPageProxy, RefProxy, RenderP, TextContent, TextItem } from "./display/api.js";
import { build, getDocument, PDFDataRangeTransport, PDFDocumentLoadingTask, PDFWorker, RenderTask, SVGGraphics, version } from "./display/api.js";
import { getFilenameFromUrl, getPdfFilenameFromUrl, getXfaPageViewport, isDataScheme, isPdfFile, loadScript, type PageViewport, PDFDateString, PixelsPerInch, RenderingCancelledException, setLayerDimensions, StatTimer } from "./display/display_utils.js";
import { AnnotationEditorLayer } from "./display/editor/annotation_editor_layer.js";
import type { PropertyToUpdate } from "./display/editor/editor.js";
import type { DispatchUpdateStatesP } from "./display/editor/tools.js";
import { AnnotationEditorUIManager } from "./display/editor/tools.js";
import { FontFaceObject } from "./display/font_loader.js";
import { Metadata } from "./display/metadata.js";
import { OptionalContentConfig } from "./display/optional_content_config.js";
import { renderTextLayer, TextLayerRenderTask, updateTextLayer } from "./display/text_layer.js";
import { GlobalWorkerOptions } from "./display/worker_options.js";
import { XfaLayer } from "./display/xfa_layer.js";
import { QuickJSSandbox } from "./pdf.sandbox.js";
import type { AppInfo } from "./scripting_api/app.js";
import type { ScriptingActionName } from "./scripting_api/common.js";
import type { DocInfo } from "./scripting_api/doc.js";
import type { matrix_t, OPSName } from "./shared/util.js";
import { AbortException, AnnotationEditorParamsType, AnnotationEditorType, AnnotationMode, CMapCompressionType, createValidAbsoluteUrl, FeatureTest, ImageKind, InvalidPDFException, MissingPDFException, normalizeUnicode, OPS, PasswordResponses, PermissionFlag, shadow, UnexpectedResponseException, Util, VerbosityLevel } from "./shared/util.js";
export { AbortException, type AnnotActions, AnnotationEditorLayer, AnnotationEditorParamsType, AnnotationEditorType, AnnotationEditorUIManager, AnnotationElement, AnnotationLayer, AnnotationMode, type AnnotationStorage, type AnnotIntent, type AppInfo, type Attachment, build, CMapCompressionType, createValidAbsoluteUrl, type Destination, type DispatchUpdateStatesP, type DocInfo, type DocumentInfo, type DocumentInitP, type ExplicitDest, FeatureTest, type FieldObject, FileAttachmentAnnotationElement, FontFaceObject, getDocument, getFilenameFromUrl, getPdfFilenameFromUrl, getXfaPageViewport, GlobalWorkerOptions, ImageKind, type Intent, InvalidPDFException, isDataScheme, isPdfFile, loadScript, type matrix_t, Metadata, MissingPDFException, normalizeUnicode, type OpenAction, type OpListIR, OPS, type OPSName, OptionalContentConfig, type Order, type OutlineNode, type PageViewport, PasswordResponses, PDFDataRangeTransport, PDFDateString, PDFDocumentLoadingTask, type PDFDocumentProxy, type PDFPageProxy, PDFWorker, PermissionFlag, PixelsPerInch, PrintAnnotationStorage, type PropertyToUpdate, QuickJSSandbox, Ref, type RefProxy, RenderingCancelledException, type RenderP, RenderTask, renderTextLayer, type ScriptingActionName, setLayerDimensions, type SetOCGState, shadow, StatTimer, SVGGraphics, type TextContent, type TextItem, TextLayerRenderTask, UnexpectedResponseException, updateTextLayer, Util, VerbosityLevel, version, WorkerMessageHandler, type XFAData, type XFAElData, type XFAElObj, XfaLayer, };
//# sourceMappingURL=pdf.d.ts.map