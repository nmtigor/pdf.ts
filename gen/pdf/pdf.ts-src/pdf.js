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
import { TESTING } from "../../global.js";
import { AnnotationLayer } from "./display/annotation_layer.js";
import { build, getDocument, PDFDataRangeTransport, PDFWorker, version, } from "./display/api.js";
import { DOMSVGFactory, fetchData, getFilenameFromUrl, getPdfFilenameFromUrl, getXfaPageViewport, isDataScheme, isPdfFile, PDFDateString, PixelsPerInch, RenderingCancelledException, setLayerDimensions, } from "./display/display_utils.js";
import { DrawLayer } from "./display/draw_layer.js";
import { AnnotationEditorLayer } from "./display/editor/annotation_editor_layer.js";
import { ColorPicker } from "./display/editor/color_picker.js";
import { Outliner } from "./display/editor/outliner.js";
import { AnnotationEditorUIManager } from "./display/editor/tools.js";
import { TextLayer } from "./display/text_layer.js";
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
/*#static*/ 
/*80--------------------------------------------------------------------------*/
export { AbortException, AnnotationEditorLayer, AnnotationEditorParamsType, AnnotationEditorType, AnnotationEditorUIManager, AnnotationLayer, AnnotationMode, build, CMapCompressionType, ColorPicker, createValidAbsoluteUrl, DOMSVGFactory, DrawLayer, FeatureTest, fetchData, getDocument, getFilenameFromUrl, getPdfFilenameFromUrl, getXfaPageViewport, GlobalWorkerOptions, ImageKind, InvalidPDFException, isDataScheme, isPdfFile, MissingPDFException, normalizeUnicode, OPS, PasswordResponses, PDFDataRangeTransport, PDFDateString, PDFWorker, PermissionFlag, PixelsPerInch, RenderingCancelledException, setLayerDimensions, shadow, TextLayer, UnexpectedResponseException, Util, VerbosityLevel, version, XfaLayer, };
//# sourceMappingURL=pdf.js.map