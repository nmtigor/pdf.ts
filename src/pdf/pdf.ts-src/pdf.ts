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

// eslint-disable-next-line max-len
/** @typedef {import("./display/api").OnProgressParameters} OnProgressParameters */
// eslint-disable-next-line max-len
/** @typedef {import("./display/api").PDFDocumentLoadingTask} PDFDocumentLoadingTask */
/** @typedef {import("./display/api").PDFDocumentProxy} PDFDocumentProxy */
/** @typedef {import("./display/api").PDFPageProxy} PDFPageProxy */
/** @typedef {import("./display/api").RenderTask} RenderTask */
/** @typedef {import("./display/display_utils").PageViewport} PageViewport */
// eslint-disable-next-line max-len
/** @typedef {import("./display/text_layer").TextLayerRenderTask} TextLayerRenderTask */

import { GENERIC } from "../../global.ts";
import type { FieldObject } from "./core/annotation.ts";
import type {
  Destination,
  ExplicitDest,
  OpenAction,
  Order,
  SetOCGState,
} from "./core/catalog.ts";
import { type AnnotActions } from "./core/core_utils.ts";
import { type DocumentInfo, type XFAData } from "./core/document.ts";
import { type Attachment } from "./core/file_spec.ts";
import { type OpListIR } from "./core/operator_list.ts";
import { Ref } from "./core/primitives.ts";
import { WorkerMessageHandler } from "./core/worker.ts";
import type { XFAElData, XFAElObj } from "./core/xfa/alias.ts";
import {
  AnnotationElement,
  AnnotationLayer,
  FileAttachmentAnnotationElement,
} from "./display/annotation_layer.ts";
import {
  type AnnotationStorage,
  PrintAnnotationStorage,
} from "./display/annotation_storage.ts";
import type {
  AnnotIntent,
  DocumentInitP,
  Intent,
  OutlineNode,
  RefProxy,
  RenderP,
  TextContent,
  TextItem,
} from "./display/api.ts";
import {
  build,
  getDocument,
  PDFDataRangeTransport,
  PDFDocumentLoadingTask,
  type PDFDocumentProxy,
  type PDFPageProxy,
  PDFWorker,
  RenderTask,
  version,
} from "./display/api.ts";
import {
  getFilenameFromUrl,
  getPdfFilenameFromUrl,
  getXfaPageViewport,
  isDataScheme,
  isPdfFile,
  loadScript,
  type PageViewport,
  PDFDateString,
  PixelsPerInch,
  RenderingCancelledException,
  setLayerDimensions,
  StatTimer,
} from "./display/display_utils.ts";
import { AnnotationEditorLayer } from "./display/editor/annotation_editor_layer.ts";
import type { PropertyToUpdate } from "./display/editor/editor.ts";
import type { DispatchUpdateStatesP } from "./display/editor/tools.ts";
import { AnnotationEditorUIManager } from "./display/editor/tools.ts";
import { FontFaceObject } from "./display/font_loader.ts";
import { Metadata } from "./display/metadata.ts";
import { OptionalContentConfig } from "./display/optional_content_config.ts";
import {
  renderTextLayer,
  TextLayerRenderTask,
  updateTextLayer,
} from "./display/text_layer.ts";
import { GlobalWorkerOptions } from "./display/worker_options.ts";
import { XfaLayer } from "./display/xfa_layer.ts";
import { QuickJSSandbox } from "./pdf.sandbox.ts";
import type { AppInfo } from "./scripting_api/app.ts";
import type { ScriptingActionName } from "./scripting_api/common.ts";
import type { DocInfo } from "./scripting_api/doc.ts";
import type { matrix_t, OPSName } from "./shared/util.ts";
import {
  AbortException,
  AnnotationEditorParamsType,
  AnnotationEditorType,
  AnnotationMode,
  CMapCompressionType,
  createValidAbsoluteUrl,
  FeatureTest,
  ImageKind,
  InvalidPDFException,
  MissingPDFException,
  normalizeUnicode,
  OPS,
  PasswordResponses,
  PermissionFlag,
  shadow,
  UnexpectedResponseException,
  Util,
  VerbosityLevel,
} from "./shared/util.ts";
/*80--------------------------------------------------------------------------*/

// /* eslint-disable-next-line no-unused-vars */
// const pdfjsVersion =
//   typeof PDFJSDev !== "undefined" ? PDFJSDev.eval("BUNDLE_VERSION") : void 0;
// /* eslint-disable-next-line no-unused-vars */
// const pdfjsBuild =
//   typeof PDFJSDev !== "undefined" ? PDFJSDev.eval("BUNDLE_BUILD") : void 0;

const SVGGraphics = /*#static*/ GENERIC
  ? (await import("./display/svg.ts")).SVGGraphics
  : undefined;
/*80--------------------------------------------------------------------------*/

export {
  AbortException,
  type AnnotActions,
  AnnotationEditorLayer,
  AnnotationEditorParamsType,
  AnnotationEditorType,
  AnnotationEditorUIManager,
  AnnotationElement,
  AnnotationLayer,
  AnnotationMode,
  type AnnotationStorage,
  type AnnotIntent,
  type AppInfo,
  type Attachment,
  build,
  CMapCompressionType,
  createValidAbsoluteUrl,
  type Destination,
  type DispatchUpdateStatesP,
  type DocInfo,
  type DocumentInfo,
  type DocumentInitP,
  type ExplicitDest,
  FeatureTest,
  type FieldObject,
  FileAttachmentAnnotationElement,
  FontFaceObject,
  getDocument,
  getFilenameFromUrl,
  getPdfFilenameFromUrl,
  getXfaPageViewport,
  GlobalWorkerOptions,
  ImageKind,
  type Intent,
  InvalidPDFException,
  isDataScheme,
  isPdfFile,
  loadScript,
  type matrix_t,
  Metadata,
  MissingPDFException,
  normalizeUnicode,
  type OpenAction,
  type OpListIR,
  OPS,
  type OPSName,
  OptionalContentConfig,
  type Order,
  type OutlineNode,
  type PageViewport,
  PasswordResponses,
  PDFDataRangeTransport,
  PDFDateString,
  PDFDocumentLoadingTask,
  type PDFDocumentProxy,
  type PDFPageProxy,
  PDFWorker,
  PermissionFlag,
  PixelsPerInch,
  PrintAnnotationStorage,
  type PropertyToUpdate,
  QuickJSSandbox,
  Ref,
  type RefProxy,
  RenderingCancelledException,
  type RenderP,
  RenderTask,
  renderTextLayer,
  type ScriptingActionName,
  setLayerDimensions,
  type SetOCGState,
  shadow,
  StatTimer,
  SVGGraphics,
  type TextContent,
  type TextItem,
  TextLayerRenderTask,
  UnexpectedResponseException,
  updateTextLayer,
  Util,
  VerbosityLevel,
  version,
  WorkerMessageHandler,
  type XFAData,
  type XFAElData,
  type XFAElObj,
  XfaLayer,
};
