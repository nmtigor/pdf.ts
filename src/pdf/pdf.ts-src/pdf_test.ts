/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2023
 *
 * @module pdf/pdf.ts-src/pdf_test.ts
 * @license Apache-2.0
 ******************************************************************************/

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
import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd.ts";
import { AnnotationLayer } from "./display/annotation_layer.ts";
import {
  build,
  getDocument,
  PDFDataRangeTransport,
  PDFWorker,
  version,
} from "./display/api.ts";
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
import { ColorPicker } from "./display/editor/color_picker.ts";
import { Outliner } from "./display/editor/outliner.ts";
import { AnnotationEditorUIManager } from "./display/editor/tools.ts";
import {
  renderTextLayer,
  TextLayer,
  updateTextLayer,
} from "./display/text_layer.ts";
import { GlobalWorkerOptions } from "./display/worker_options.ts";
import { XfaLayer } from "./display/xfa_layer.ts";
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

const expectedAPI = Object.freeze({
  AbortException,
  AnnotationEditorLayer,
  AnnotationEditorParamsType,
  AnnotationEditorType,
  AnnotationEditorUIManager,
  AnnotationLayer,
  AnnotationMode,
  build,
  CMapCompressionType,
  ColorPicker,
  createValidAbsoluteUrl,
  DOMSVGFactory,
  DrawLayer,
  FeatureTest,
  fetchData,
  getDocument,
  getFilenameFromUrl,
  getPdfFilenameFromUrl,
  getXfaPageViewport,
  GlobalWorkerOptions,
  ImageKind,
  InvalidPDFException,
  isDataScheme,
  isPdfFile,
  MissingPDFException,
  // noContextMenu,
  normalizeUnicode,
  OPS,
  Outliner,
  PasswordResponses,
  PDFDataRangeTransport,
  PDFDateString,
  PDFWorker,
  PermissionFlag,
  PixelsPerInch,
  RenderingCancelledException,
  renderTextLayer,
  setLayerDimensions,
  shadow,
  TextLayer,
  UnexpectedResponseException,
  updateTextLayer,
  Util,
  VerbosityLevel,
  version,
  XfaLayer,
});

describe("pdfjs_api", () => {
  it("checks that the *official* PDF.js API exposes the expected functionality", async () => {
    // eslint-disable-next-line no-unsanitized/method
    const pdfjsAPI = await import(
      /*#static*/ LIB ? "./pdf.ts" : "./pdf.ts"
    );

    // The imported Object contains an (automatically) inserted Symbol,
    // hence we copy the data to allow using a simple comparison below.
    assertEquals({ ...pdfjsAPI }, expectedAPI);
  });
});

describe("web_pdfjsLib", () => {
  //kkkk
  // it("checks that the viewer re-exports the expected API functionality", async () => {
  //   if (isNodeJS) {
  //     pending("loadScript is not supported in Node.js.");
  //   }
  //   const apiPath = "../../build/generic/build/pdf.mjs";
  //   await import(apiPath);

  //   const webPdfjsLib = await import("../pdf.ts-web/pdfjs.ts");

  //   assertEquals(
  //     Object.keys(webPdfjsLib).sort(),
  //     Object.keys(expectedAPI).sort(),
  //   );
  // });
});
/*80--------------------------------------------------------------------------*/
