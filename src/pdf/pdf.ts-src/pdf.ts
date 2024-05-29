/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/pdf.ts
 * @license Apache-2.0
 ******************************************************************************/

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

import { ColorPicker } from "./display/editor/color_picker.ts";
import type { FieldObject } from "./core/annotation.ts";
import type {
  Destination,
  ExplicitDest,
  OpenAction,
  Order,
  SetOCGState,
} from "./core/catalog.ts";
import type { AnnotActions } from "./core/core_utils.ts";
import type { DocumentInfo, XFAData } from "./core/document.ts";
import type { Attachment } from "./core/file_spec.ts";
import type { OpListIR } from "./core/operator_list.ts";
import type { Ref } from "./core/primitives.ts";
import type { XFAElData, XFAElObj } from "./core/xfa/alias.ts";
import type {
  AnnotationElement,
  FileAttachmentAnnotationElement,
} from "./display/annotation_layer.ts";
import { AnnotationLayer } from "./display/annotation_layer.ts";
import type {
  AnnotationStorage,
  PrintAnnotationStorage,
} from "./display/annotation_storage.ts";
import type {
  AnnotIntent,
  DocumentInitP,
  Intent,
  OutlineNode,
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  PDFPageProxy,
  RefProxy,
  RenderP,
  RenderTask,
  TextContent,
  TextItem,
} from "./display/api.ts";
import {
  build,
  getDocument,
  PDFDataRangeTransport,
  PDFWorker,
  version,
} from "./display/api.ts";
import type { PageViewport, StatTimer } from "./display/display_utils.ts";
import {
  DOMSVGFactory,
  fetchData,
  getFilenameFromUrl,
  getPdfFilenameFromUrl,
  getXfaPageViewport,
  isDataScheme,
  isPdfFile,
  PDFDateString,
  PixelsPerInch,
  RenderingCancelledException,
  setLayerDimensions,
} from "./display/display_utils.ts";
import { DrawLayer } from "./display/draw_layer.ts";
import { AnnotationEditorLayer } from "./display/editor/annotation_editor_layer.ts";
import type { PropertyToUpdate } from "./display/editor/editor.ts";
import { Outliner } from "./display/editor/outliner.ts";
import type { DispatchUpdateStatesP } from "./display/editor/tools.ts";
import { AnnotationEditorUIManager } from "./display/editor/tools.ts";
import type { FontFaceObject } from "./display/font_loader.ts";
import type { Metadata } from "./display/metadata.ts";
import type { OptionalContentConfig } from "./display/optional_content_config.ts";
import type { TextLayerRenderTask } from "./display/text_layer.ts";
import { renderTextLayer, updateTextLayer } from "./display/text_layer.ts";
import { GlobalWorkerOptions } from "./display/worker_options.ts";
import { XfaLayer } from "./display/xfa_layer.ts";
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
/*80--------------------------------------------------------------------------*/

export {
  AbortException,
  type AnnotActions,
  AnnotationEditorLayer,
  AnnotationEditorParamsType,
  AnnotationEditorType,
  AnnotationEditorUIManager,
  type AnnotationElement,
  AnnotationLayer,
  AnnotationMode,
  type AnnotationStorage,
  type AnnotIntent,
  type AppInfo,
  type Attachment,
  build,
  CMapCompressionType,
  ColorPicker,
  createValidAbsoluteUrl,
  type Destination,
  type DispatchUpdateStatesP,
  type DocInfo,
  type DocumentInfo,
  type DocumentInitP,
  DOMSVGFactory,
  DrawLayer,
  type ExplicitDest,
  FeatureTest,
  fetchData,
  type FieldObject,
  type FileAttachmentAnnotationElement,
  type FontFaceObject,
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
  type matrix_t,
  type Metadata,
  MissingPDFException,
  normalizeUnicode,
  type OpenAction,
  type OpListIR,
  OPS,
  type OPSName,
  type OptionalContentConfig,
  type Order,
  type OutlineNode,
  Outliner,
  type PageViewport,
  PasswordResponses,
  PDFDataRangeTransport,
  PDFDateString,
  type PDFDocumentLoadingTask,
  type PDFDocumentProxy,
  type PDFPageProxy,
  PDFWorker,
  PermissionFlag,
  PixelsPerInch,
  type PrintAnnotationStorage,
  type PropertyToUpdate,
  type Ref,
  type RefProxy,
  RenderingCancelledException,
  type RenderP,
  type RenderTask,
  renderTextLayer,
  type ScriptingActionName,
  setLayerDimensions,
  type SetOCGState,
  shadow,
  type StatTimer,
  type TextContent,
  type TextItem,
  type TextLayerRenderTask,
  UnexpectedResponseException,
  updateTextLayer,
  Util,
  VerbosityLevel,
  version,
  type XFAData,
  type XFAElData,
  type XFAElObj,
  XfaLayer,
};
