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

import { createPromiseCap } from "../../lib/promisecap.js";
import {
  build,
  type DocumentInitParms,
  getDocument,
  LoopbackPort,
  PDFDataRangeTransport,
  PDFWorker,
  setPDFNetworkStreamFactory,
  version
} from "./display/api.js";
import {
  AnnotationMode,
  CMapCompressionType,
  createValidAbsoluteUrl,
  InvalidPDFException,
  MissingPDFException,
  OPS,
  PasswordResponses,
  PermissionFlag,
  shadow,
  UnexpectedResponseException,
  UNSUPPORTED_FEATURES,
  Util,
  VerbosityLevel,
} from "./shared/util.js";
import {
  getFilenameFromUrl,
  getPdfFilenameFromUrl,
  getXfaPageViewport,
  isPdfFile,
  isValidFetchUrl,
  loadScript,
  PDFDateString,
  PixelsPerInch,
  RenderingCancelledException,
} from "./display/display_utils.js";
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

// #if !PRODUCTION
  const streamsPromise = Promise.all([
    import("./display/network.js"),
    import("./display/fetch_stream.js"),
  ]);

  setPDFNetworkStreamFactory( async( params:DocumentInitParms ) => {
    const [{ PDFNetworkStream }, { PDFFetchStream }] = await streamsPromise;
    if( isValidFetchUrl(params.url) )
    {
      return new PDFFetchStream(params);
    }
    return new PDFNetworkStream(params);
  });
/* #else */ /* #if GENERIC || CHROME */
  const { PDFNetworkStream } = require("./display/network.js");
  const { PDFFetchStream } = require("./display/fetch_stream.js");

  setPDFNetworkStreamFactory(params => {
    if( isValidFetchUrl(params.url) )
    {
      return new PDFFetchStream(params);
    }
    return new PDFNetworkStream(params);
  });
// #endif
// #endif

export {
  AnnotationLayer,
  AnnotationMode,
  build,
  CMapCompressionType,
  createPromiseCap,
  createValidAbsoluteUrl,
  getDocument,
  getFilenameFromUrl,
  getPdfFilenameFromUrl,
  getXfaPageViewport,
  GlobalWorkerOptions,
  InvalidPDFException,
  isPdfFile,
  loadScript,
  LoopbackPort,
  MissingPDFException,
  OPS,
  PasswordResponses,
  PDFDataRangeTransport,
  PDFDateString,
  PDFWorker,
  PermissionFlag,
  PixelsPerInch,
  RenderingCancelledException,
  renderTextLayer,
  shadow,
  SVGGraphics,
  UnexpectedResponseException,
  UNSUPPORTED_FEATURES,
  Util,
  VerbosityLevel,
  version,
  XfaLayer,
};
