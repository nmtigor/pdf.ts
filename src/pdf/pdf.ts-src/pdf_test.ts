/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2023
 */

/* Copyright 2023 Mozilla Foundation
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

import { LIB } from "@fe-src/global.ts";
import { assertObjectMatch } from "@std/assert/mod.ts";
import { describe, it } from "@std/testing/bdd.ts";
import { AnnotationLayer } from "./display/annotation_layer.ts";
import {
  build,
  getDocument,
  PDFDataRangeTransport,
  PDFWorker,
  SVGGraphics,
  version,
} from "./display/api.ts";
import {
  DOMSVGFactory,
  getFilenameFromUrl,
  getPdfFilenameFromUrl,
  getXfaPageViewport,
  isDataScheme,
  isPdfFile,
  loadScript,
  PDFDateString,
  PixelsPerInch,
  RenderingCancelledException,
  setLayerDimensions,
} from "./display/display_utils.ts";
import { AnnotationEditorLayer } from "./display/editor/annotation_editor_layer.ts";
import { AnnotationEditorUIManager } from "./display/editor/tools.ts";
import { renderTextLayer, updateTextLayer } from "./display/text_layer.ts";
import { GlobalWorkerOptions } from "./display/worker_options.ts";
import { XfaLayer } from "./display/xfa_layer.ts";
import {
  AbortException,
  AnnotationEditorType,
  createValidAbsoluteUrl,
  FeatureTest,
  InvalidPDFException,
  MissingPDFException,
  normalizeUnicode,
  OPS,
  PermissionFlag,
  shadow,
  UnexpectedResponseException,
  Util,
} from "./shared/util.ts";
/*80--------------------------------------------------------------------------*/

describe("pdfjs_api", () => {
  it("checks that the *official* PDF.js API exposes the expected functionality", async () => {
    // eslint-disable-next-line no-unsanitized/method
    const pdfjsAPI = await import(/*#static*/ LIB ? "./pdf.ts" : "./pdf.ts");

    // The imported Object contains an (automatically) inserted Symbol,
    // hence we copy the data to allow using a simple comparison below.
    assertObjectMatch({ ...pdfjsAPI }, {
      AbortException,
      AnnotationEditorLayer,
      // AnnotationEditorParamsType,
      AnnotationEditorType,
      AnnotationEditorUIManager,
      AnnotationLayer,
      // AnnotationMode,
      build,
      // CMapCompressionType,
      createValidAbsoluteUrl,
      DOMSVGFactory,

      FeatureTest,
      getDocument,
      getFilenameFromUrl,
      getPdfFilenameFromUrl,
      getXfaPageViewport,
      GlobalWorkerOptions,
      // ImageKind,
      InvalidPDFException,
      isDataScheme,
      isPdfFile,
      loadScript,
      MissingPDFException,
      // noContextMenu,
      normalizeUnicode,
      OPS,
      // PasswordResponses,
      PDFDataRangeTransport,
      PDFDateString,
      PDFWorker,
      PermissionFlag,
      PixelsPerInch,
      // PromiseCapability,
      RenderingCancelledException,
      renderTextLayer,
      setLayerDimensions,
      shadow,
      SVGGraphics,
      UnexpectedResponseException,
      updateTextLayer,
      Util,
      // VerbosityLevel,
      version,
      XfaLayer,
    });
  });
});
/*80--------------------------------------------------------------------------*/
