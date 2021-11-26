/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
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
/* eslint-disable sort-exports/sort-exports */
// eslint-disable-next-line max-len
/** @typedef {import("./display/api").PDFDocumentLoadingTask} PDFDocumentLoadingTask */
/** @typedef {import("./display/api").PDFDocumentProxy} PDFDocumentProxy */
/** @typedef {import("./display/api").PDFPageProxy} PDFPageProxy */
/** @typedef {import("./display/api").RenderTask} RenderTask */
import { addLinkAttributes, getFilenameFromUrl, isValidFetchUrl, LinkTarget, loadScript, PDFDateString, PixelsPerInch, RenderingCancelledException, } from "./display/display_utils.js";
import { build, getDocument, LoopbackPort, PDFDataRangeTransport, PDFWorker, setPDFNetworkStreamFactory, version } from "./display/api.js";
import { AnnotationMode, CMapCompressionType, createObjectURL, createPromiseCapability, createValidAbsoluteUrl, InvalidPDFException, MissingPDFException, OPS, PasswordResponses, PermissionFlag, removeNullCharacters, shadow, UnexpectedResponseException, UNSUPPORTED_FEATURES, Util, VerbosityLevel, } from "./shared/util.js";
import { AnnotationLayer } from "./display/annotation_layer.js";
import { GlobalWorkerOptions } from "./display/worker_options.js";
import { renderTextLayer } from "./display/text_layer.js";
import { SVGGraphics } from "./display/svg.js";
import { XfaLayer } from "./display/xfa_layer.js";
/*81---------------------------------------------------------------------------*/
// /* eslint-disable-next-line no-unused-vars */
// const pdfjsVersion =
//   typeof PDFJSDev !== "undefined" ? PDFJSDev.eval("BUNDLE_VERSION") : void 0;
// /* eslint-disable-next-line no-unused-vars */
// const pdfjsBuild =
//   typeof PDFJSDev !== "undefined" ? PDFJSDev.eval("BUNDLE_BUILD") : void 0;
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
export { 
// From "./display/display_utils.js":
addLinkAttributes, getFilenameFromUrl, LinkTarget, loadScript, PDFDateString, PixelsPerInch, RenderingCancelledException, 
// From "./shared/util.js":
AnnotationMode, CMapCompressionType, createObjectURL, createPromiseCapability, createValidAbsoluteUrl, InvalidPDFException, MissingPDFException, OPS, PasswordResponses, PermissionFlag, removeNullCharacters, shadow, UnexpectedResponseException, UNSUPPORTED_FEATURES, Util, VerbosityLevel, 
// From "./display/api.js":
build, getDocument, LoopbackPort, PDFDataRangeTransport, PDFWorker, version, 
// From "./display/annotation_layer.js":
AnnotationLayer, 
// From "./display/worker_options.js":
GlobalWorkerOptions, 
// From "./display/text_layer.js":
renderTextLayer, 
// From "./display/svg.js":
SVGGraphics, 
// From "./display/xfa_layer.js":
XfaLayer, };
//# sourceMappingURL=pdf.js.map