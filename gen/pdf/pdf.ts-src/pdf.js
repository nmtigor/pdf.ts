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
/** @typedef {import("./display/api").PDFDocumentLoadingTask} PDFDocumentLoadingTask */
/** @typedef {import("./display/api").PDFDocumentProxy} PDFDocumentProxy */
/** @typedef {import("./display/api").PDFPageProxy} PDFPageProxy */
/** @typedef {import("./display/api").RenderTask} RenderTask */
/** @typedef {import("./display/display_utils").PageViewport} PageViewport */
// eslint-disable-next-line max-len
/** @typedef {import("./display/text_layer").TextLayerRenderTask} TextLayerRenderTask */
import { CHROME, GENERIC, PRODUCTION } from "../../global.js";
import { Ref } from "./core/primitives.js";
import { WorkerMessageHandler } from "./core/worker.js";
import { AnnotationElement, AnnotationLayer, FileAttachmentAnnotationElement, } from "./display/annotation_layer.js";
import { AnnotationStorage, PrintAnnotationStorage, } from "./display/annotation_storage.js";
import { build, getDocument, LoopbackPort, PDFDataRangeTransport, PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy, PDFWorker, RenderTask, setPDFNetworkStreamFactory, version, } from "./display/api.js";
import { binarySearchFirstItem, getFilenameFromUrl, getPdfFilenameFromUrl, getXfaPageViewport, isPdfFile, isValidFetchUrl, loadScript, PageViewport, PDFDateString, PixelsPerInch, RenderingCancelledException, StatTimer, } from "./display/display_utils.js";
import { AnnotationEditorLayer } from "./display/editor/annotation_editor_layer.js";
import { AnnotationEditorUIManager, } from "./display/editor/tools.js";
import { FontFaceObject } from "./display/font_loader.js";
import { Metadata } from "./display/metadata.js";
import { OptionalContentConfig } from "./display/optional_content_config.js";
import { SVGGraphics } from "./display/svg.js";
import { renderTextLayer, TextLayerRenderTask } from "./display/text_layer.js";
import { GlobalWorkerOptions } from "./display/worker_options.js";
import { XfaLayer } from "./display/xfa_layer.js";
import { QuickJSSandbox } from "./pdf.sandbox.js";
import { AnnotationEditorParamsType, AnnotationEditorType, AnnotationMode, CMapCompressionType, createValidAbsoluteUrl, InvalidPDFException, MissingPDFException, OPS, PasswordResponses, PermissionFlag, shadow, UnexpectedResponseException, UNSUPPORTED_FEATURES, Util, VerbosityLevel, } from "./shared/util.js";
/*80--------------------------------------------------------------------------*/
// /* eslint-disable-next-line no-unused-vars */
// const pdfjsVersion =
//   typeof PDFJSDev !== "undefined" ? PDFJSDev.eval("BUNDLE_VERSION") : void 0;
// /* eslint-disable-next-line no-unused-vars */
// const pdfjsBuild =
//   typeof PDFJSDev !== "undefined" ? PDFJSDev.eval("BUNDLE_BUILD") : void 0;
/*#static*/  {
    const streamsPromise = Promise.all([
        import("./display/network.js"),
        import("./display/fetch_stream.js"),
    ]);
    setPDFNetworkStreamFactory(async (params) => {
        const [{ PDFNetworkStream }, { PDFFetchStream }] = await streamsPromise;
        if (isValidFetchUrl(params.url)) {
            return new PDFFetchStream(params);
        }
        return new PDFNetworkStream(params);
    });
}
/*80--------------------------------------------------------------------------*/
export { AnnotationEditorLayer, AnnotationEditorParamsType, AnnotationEditorType, AnnotationEditorUIManager, AnnotationElement, AnnotationLayer, AnnotationMode, AnnotationStorage, binarySearchFirstItem, build, CMapCompressionType, createValidAbsoluteUrl, FileAttachmentAnnotationElement, FontFaceObject, getDocument, getFilenameFromUrl, getPdfFilenameFromUrl, getXfaPageViewport, GlobalWorkerOptions, InvalidPDFException, isPdfFile, loadScript, LoopbackPort, Metadata, MissingPDFException, OPS, OptionalContentConfig, PageViewport, PasswordResponses, PDFDataRangeTransport, PDFDateString, PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy, PDFWorker, PermissionFlag, PixelsPerInch, PrintAnnotationStorage, QuickJSSandbox, Ref, RenderingCancelledException, RenderTask, renderTextLayer, shadow, StatTimer, SVGGraphics, TextLayerRenderTask, UnexpectedResponseException, UNSUPPORTED_FEATURES, Util, VerbosityLevel, version, WorkerMessageHandler, XfaLayer, };
//# sourceMappingURL=pdf.js.map