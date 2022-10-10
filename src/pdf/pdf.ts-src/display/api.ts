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

/**
 * @module pdfjsLib
 */

import { _PDFDEV, GENERIC, PRODUCTION } from "../../../global.ts";
import { TypedArray } from "../../../lib/alias.ts";
import { isObjectLike } from "../../../lib/jslang.ts";
import { createPromiseCap, PromiseCap } from "../../../lib/promisecap.ts";
import { assert } from "../../../lib/util/trace.ts";
import { Stepper } from "../../pdf.ts-web/debugger.ts";
import { PageColors } from "../../pdf.ts-web/pdf_viewer.ts";
import { type AnnotationData, type FieldObject } from "../core/annotation.ts";
import { type ExplicitDest, SetOCGState } from "../core/catalog.ts";
import { type AnnotActions } from "../core/core_utils.ts";
import { DocumentInfo, type XFAData } from "../core/document.ts";
import { type ImgData } from "../core/evaluator.ts";
import { type Attachment } from "../core/file_spec.ts";
import { FontExpotDataEx } from "../core/fonts.ts";
import { type CmdArgs } from "../core/font_renderer.ts";
import { type IWorker } from "../core/iworker.ts";
import { type OpListIR } from "../core/operator_list.ts";
import { type ShadingPatternIR } from "../core/pattern.ts";
import { WorkerMessageHandler } from "../core/worker.ts";
import { type XFAElObj } from "../core/xfa/alias.ts";
import { type IPDFStream, type IPDFStreamReader } from "../interfaces.ts";
import {
  type ActionSinkchunk,
  MessageHandler,
  type PageInfo,
  type PDFInfo,
  type ReaderHeaders,
  Thread,
} from "../shared/message_handler.ts";
import {
  AbortException,
  AnnotationMode,
  FontType,
  getVerbosityLevel,
  info,
  InvalidPDFException,
  isArrayBuffer,
  type matrix_t,
  MissingPDFException,
  PasswordException,
  PasswordResponses,
  RenderingIntentFlag,
  setVerbosityLevel,
  shadow,
  StreamType,
  stringToBytes,
  UnexpectedResponseException,
  UnknownErrorException,
  UNSUPPORTED_FEATURES,
  VerbosityLevel,
  warn,
} from "../shared/util.ts";
import { AnnotStorageRecord } from "./annotation_layer.ts";
import {
  AnnotationStorage,
  PrintAnnotationStorage,
} from "./annotation_storage.ts";
import { BaseCanvasFactory, type CMapData } from "./base_factory.ts";
import { CanvasGraphics } from "./canvas.ts";
import {
  deprecated,
  DOMCanvasFactory,
  DOMCMapReaderFactory,
  DOMStandardFontDataFactory,
  isDataScheme,
  loadScript,
  PageViewport,
  RenderingCancelledException,
  StatTimer,
} from "./display_utils.ts";
import { FontFaceObject, FontLoader } from "./font_loader.ts";
import { Metadata } from "./metadata.ts";
import { OptionalContentConfig } from "./optional_content_config.ts";
import { PDFDataTransportStream } from "./transport_stream.ts";
import { GlobalWorkerOptions } from "./worker_options.ts";
import { XfaText } from "./xfa_text.ts";
/*80--------------------------------------------------------------------------*/

const DEFAULT_RANGE_CHUNK_SIZE = 65536; // 2^16 = 65536
const RENDERING_CANCELLED_TIMEOUT = 100; // ms

export const DefaultCanvasFactory = DOMCanvasFactory;
export const DefaultCMapReaderFactory = DOMCMapReaderFactory;
export const DefaultStandardFontDataFactory = DOMStandardFontDataFactory;

// if (typeof PDFJSDev !== "undefined" && PDFJSDev.test("GENERIC") && isNodeJS) {
//   const {
//     NodeCanvasFactory,
//     NodeCMapReaderFactory,
//     NodeStandardFontDataFactory,
//   } = require("./node_utils.js");

//   DefaultCanvasFactory = NodeCanvasFactory;
//   DefaultCMapReaderFactory = NodeCMapReaderFactory;
//   DefaultStandardFontDataFactory = NodeStandardFontDataFactory;
// }

/**
 * @param params The document initialization
 *   parameters. The "url" key is always present.
 * @return A promise, which is resolved with an instance of
 *   {IPDFStream}.
 * @ignore
 */
type IPDFStreamFactory = (params: DocumentInitP) => Promise<IPDFStream>;

/**
 * @private
 */
let createPDFNetworkStream: IPDFStreamFactory;

/**
 * Sets the function that instantiates an {IPDFStream} as an alternative PDF
 * data transport.
 *
 * @param pdfNetworkStreamFactory - The factory function
 *   that takes document initialization parameters (including a "url") and
 *   returns a promise which is resolved with an instance of {IPDFStream}.
 * @ignore
 */
export function setPDFNetworkStreamFactory(
  pdfNetworkStreamFactory: IPDFStreamFactory,
) {
  createPDFNetworkStream = pdfNetworkStreamFactory;
}

export type BinaryData = TypedArray | ArrayBuffer | number[] | string;

export interface RefProxy {
  num: number;
  gen: number;
}

/**
 * Document initialization / loading parameters object.
 */
export interface DocumentInitP {
  /**
   * The URL of the PDF.
   */
  url: string | URL | undefined;

  /**
   * Binary PDF data.
   * Use typed arrays (Uint8Array) to improve the memory usage. If PDF data is
   * BASE64-encoded, use `atob()` to convert it to a binary string first.
   */
  data?: BinaryData | undefined;

  /**
   * Basic authentication headers.
   */
  httpHeaders: Record<string, string> | undefined;

  /**
   * Indicates whether or not
   * cross-site Access-Control requests should be made using credentials such
   * as cookies or authorization headers. The default is `false`.
   */
  withCredentials: boolean | undefined;

  /**
   * For decrypting password-protected PDFs.
   */
  password?: string;

  /**
   * A typed array with the first portion
   * or all of the pdf data. Used by the extension since some data is already
   * loaded before the switch to range requests.
   */
  initialData?: TypedArray;

  /**
   * The PDF file length. It's used for progress
   * reports and range requests operations.
   */
  length: number | undefined;

  /**
   * Allows for using a custom range
   * transport implementation.
   */
  range?: PDFDataRangeTransport;

  /**
   * Specify maximum number of bytes fetched
   * per range request. The default value is {@link DEFAULT_RANGE_CHUNK_SIZE}.
   */
  rangeChunkSize: number | undefined;

  /**
   * The worker that will be used for loading and
   * parsing the PDF data.
   */
  worker?: PDFWorker;

  /**
   * Controls the logging level; the constants
   * from {@link VerbosityLevel} should be used.
   */
  verbosity?: VerbosityLevel;

  /**
   * The base URL of the document, used when
   * attempting to recover valid absolute URLs for annotations, and outline
   * items, that (incorrectly) only specify relative URLs.
   */
  docBaseUrl?: string | undefined;

  /**
   * The URL where the predefined Adobe CMaps are
   * located. Include the trailing slash.
   */
  cMapUrl?: string | undefined;

  /**
   * Specifies if the Adobe CMaps are binary
   * packed or not.
   */
  cMapPacked?: boolean;

  /**
   * The factory that will be used when
   * reading built-in CMap files. Providing a custom factory is useful for
   * environments without Fetch API or `XMLHttpRequest` support, such as
   * Node.js. The default value is {DOMCMapReaderFactory}.
   */
  CMapReaderFactory?: typeof DefaultCMapReaderFactory;

  /**
   * When `true`, fonts that aren't
   * embedded in the PDF document will fallback to a system font.
   * The default value is `true` in web environments and `false` in Node.js;
   * unless `disableFontFace === true` in which case this defaults to `false`
   * regardless of the environment (to prevent completely broken fonts).
   */
  useSystemFonts?: boolean;

  /**
   * The URL where the standard font
   * files are located. Include the trailing slash.
   */
  standardFontDataUrl?: string | undefined;

  /**
   * The factory that will be used
   * when reading the standard font files. Providing a custom factory is useful
   * for environments without Fetch API or `XMLHttpRequest` support, such as
   * Node.js. The default value is {DOMStandardFontDataFactory}.
   */
  StandardFontDataFactory?: typeof DOMStandardFontDataFactory;

  /**
   * Enable using the Fetch API in the
   * worker-thread when reading CMap and standard font files. When `true`,
   * the `CMapReaderFactory` and `StandardFontDataFactory` options are ignored.
   * The default value is `true` in web environments and `false` in Node.js.
   */
  useWorkerFetch?: boolean;

  /**
   * Reject certain promises, e.g.
   * `getOperatorList`, `getTextContent`, and `RenderTask`, when the associated
   * PDF data cannot be successfully parsed, instead of attempting to recover
   * whatever possible of the data. The default value is `false`.
   */
  stopAtErrors?: boolean;

  ignoreErrors?: boolean;

  /**
   * The maximum allowed image size in total
   * pixels, i.e. width * height. Images above this value will not be rendered.
   * Use -1 for no limit, which is also the default value.
   */
  maxImageSize?: number;

  /**
   * Determines if we can evaluate strings
   * as JavaScript. Primarily used to improve performance of font rendering, and
   * when parsing PDF functions. The default value is `true`.
   */
  isEvalSupported?: boolean;

  /**
   * By default fonts are converted to
   * OpenType fonts and loaded via the Font Loading API or `@font-face` rules.
   * If disabled, fonts will be rendered using a built-in font renderer that
   * constructs the glyphs with primitive path commands.
   * The default value is `false` in web environments and `true` in Node.js.
   */
  disableFontFace?: boolean;

  /**
   * Include additional properties,
   * which are unused during rendering of PDF documents, when exporting the
   * parsed font data from the worker-thread. This may be useful for debugging
   * purposes (and backwards compatibility), but note that it will lead to
   * increased memory usage. The default value is `false`.
   */
  fontExtraProperties?: boolean;

  /**
   * Render Xfa forms if any.
   * The default value is `false`.
   */
  enableXfa?: boolean;

  /**
   * Specify an explicit document
   * context to create elements with and to load resources, such as fonts,
   * into. Defaults to the current document.
   */
  ownerDocument?: Document | undefined;

  /** For testing only. */
  styleElement?: HTMLStyleElement;

  /**
   * Disable range request loading of PDF
   * files. When enabled, and if the server supports partial content requests,
   * then the PDF will be fetched in chunks. The default value is `false`.
   */
  disableRange: boolean | undefined;

  /**
   * Disable streaming of PDF file data.
   * By default PDF.js attempts to load PDF files in chunks. The default value
   * is `false`.
   */
  disableStream: boolean | undefined;

  /**
   * Disable pre-fetching of PDF file
   * data. When range requests are enabled PDF.js will automatically keep
   * fetching more data even if it isn't needed to display the current page.
   * The default value is `false`.
   *
   * NOTE: It is also necessary to disable streaming, see above, in order for
   * disabling of pre-fetching to work correctly.
   */
  disableAutoFetch?: boolean;

  /**
   * Enables special hooks for debugging PDF.js
   * (see `web/debugger.js`). The default value is `false`.
   */
  pdfBug?: boolean;

  progressiveDone?: boolean;

  contentDispositionFilename?: string | undefined;
}

type _GetDocumentP =
  | string
  | URL
  | TypedArray
  | ArrayBuffer
  | PDFDataRangeTransport
  | DocumentInitP;

/**
 * This is the main entry point for loading a PDF and interacting with it.
 *
 * NOTE: If a URL is used to fetch the PDF data a standard Fetch API call (or
 * XHR as fallback) is used, which means it must follow same origin rules,
 * e.g. no cross-domain requests without CORS.
 *
 * @param src Can be a URL where a PDF file is located, a typed array (Uint8Array)
 *  already populated with data, or a parameter object.
 */
export function getDocument(src: _GetDocumentP): PDFDocumentLoadingTask {
  const task = new PDFDocumentLoadingTask();

  let source;
  if (typeof src === "string" || src instanceof URL) {
    source = { url: src };
  } else if (isArrayBuffer(src)) {
    source = { data: src };
  } else if (src instanceof PDFDataRangeTransport) {
    source = { range: src };
  } else {
    if (typeof src !== "object") {
      throw new Error(
        "Invalid parameter in getDocument, " +
          "need either string, URL, TypedArray, or parameter object.",
      );
    }
    if (!(<any> src).url && !(<any> src).data && !(<any> src).range) {
      throw new Error(
        "Invalid parameter object: need either .data, .range or .url",
      );
    }
    source = src;
  }
  const params: DocumentInitP = Object.create(null);
  let rangeTransport: PDFDataRangeTransport | undefined;
  let worker: PDFWorker | undefined;

  for (const key in source) {
    const value = (<any> source)[key];

    switch (key) {
      case "url":
        if (typeof window !== "undefined") {
          try {
            // The full path is required in the 'url' field.
            params[key] = new URL(value, <any> window.location).href;
            continue;
          } catch (ex) {
            warn(`Cannot create valid URL: "${ex}".`);
          }
        } else if (typeof value === "string" || value instanceof URL) {
          params[key] = value.toString(); // Support Node.js environments.
          continue;
        }
        throw new Error(
          "Invalid PDF url data: " +
            "either string or URL-object is expected in the url property.",
        );
      case "range":
        rangeTransport = value;
        continue;
      case "worker":
        worker = value;
        continue;
      case "data":
        // Converting string or array-like data to Uint8Array.
        // if (
        //   typeof PDFJSDev !== "undefined" &&
        //   PDFJSDev.test("GENERIC") &&
        //   isNodeJS &&
        //   typeof Buffer !== "undefined" && // eslint-disable-line no-undef
        //   value instanceof Buffer // eslint-disable-line no-undef
        // ) {
        //   params[key] = new Uint8Array(value);
        // }
        // else
        if (value instanceof Uint8Array) {
          break; // Use the data as-is when it's already a Uint8Array.
        } else if (typeof value === "string") {
          params[key] = stringToBytes(value);
        } else if (isObjectLike(value) && !isNaN((<any> value).length)) {
          params[key] = new Uint8Array(<any> value);
        } else if (isArrayBuffer(value)) {
          params[key] = new Uint8Array(value);
        } else {
          throw new Error(
            "Invalid PDF binary data: either TypedArray, " +
              "string, or array-like object is expected in the data property.",
          );
        }
        continue;
    }
    (params as any)[key] = value;
  }

  params.CMapReaderFactory = params.CMapReaderFactory ||
    DefaultCMapReaderFactory;
  params.StandardFontDataFactory = params.StandardFontDataFactory ||
    DefaultStandardFontDataFactory;
  params.ignoreErrors = params.stopAtErrors !== true;
  params.fontExtraProperties = params.fontExtraProperties === true;
  // params.pdfBug = params.pdfBug === true;
  params.enableXfa = params.enableXfa === true;

  if (!Number.isInteger(params.rangeChunkSize) || params.rangeChunkSize! < 1) {
    params.rangeChunkSize = DEFAULT_RANGE_CHUNK_SIZE;
  }
  if (
    typeof params.docBaseUrl !== "string" ||
    isDataScheme(params.docBaseUrl)
  ) {
    // Ignore "data:"-URLs, since they can't be used to recover valid absolute
    // URLs anyway. We want to avoid sending them to the worker-thread, since
    // they contain the *entire* PDF document and can thus be arbitrarily long.
    params.docBaseUrl = undefined;
  }
  if (!Number.isInteger(params.maxImageSize) || params.maxImageSize! < -1) {
    params.maxImageSize = -1;
  }
  if (typeof params.cMapUrl !== "string") {
    params.cMapUrl = undefined;
  }
  if (typeof params.standardFontDataUrl !== "string") {
    params.standardFontDataUrl = undefined;
  }
  if (typeof params.useWorkerFetch !== "boolean") {
    params.useWorkerFetch = params.CMapReaderFactory === DOMCMapReaderFactory &&
      params.StandardFontDataFactory === DOMStandardFontDataFactory;
  }
  if (typeof params.isEvalSupported !== "boolean") {
    params.isEvalSupported = true;
  }
  if (typeof params.disableFontFace !== "boolean") {
    // params.disableFontFace = isNodeJS;
    params.disableFontFace = false;
  }
  if (typeof params.useSystemFonts !== "boolean") {
    params.useSystemFonts = !params.disableFontFace;
  }
  if (
    typeof params.ownerDocument !== "object" ||
    params.ownerDocument === undefined
  ) {
    params.ownerDocument = globalThis.document;
  }

  if (typeof params.disableRange !== "boolean") {
    params.disableRange = false;
  }
  if (typeof params.disableStream !== "boolean") {
    params.disableStream = false;
  }
  if (typeof params.disableAutoFetch !== "boolean") {
    params.disableAutoFetch = false;
  }

  // Set the main-thread verbosity level.
  setVerbosityLevel(params.verbosity!);

  if (!worker) {
    const workerParams: _PDFWorkerP = {
      verbosity: params.verbosity,
      port: GlobalWorkerOptions.workerPort,
    };
    // Worker was not provided -- creating and owning our own. If message port
    // is specified in global worker options, using it.
    worker = workerParams.port
      ? PDFWorker.fromPort(workerParams)
      : new PDFWorker(workerParams);
    task._worker = worker!;
  }
  const docId = task.docId;
  worker!.promise
    .then(() => {
      if (task.destroyed) {
        throw new Error("Loading aborted");
      }

      const workerIdPromise = _fetchDocument(
        worker!,
        params,
        docId,
        rangeTransport,
      );
      const networkStreamPromise = new Promise<IPDFStream | undefined>(
        (resolve) => {
          let networkStream:
            | PDFDataTransportStream
            | Promise<IPDFStream>
            | undefined;
          if (rangeTransport) {
            networkStream = new PDFDataTransportStream(
              {
                length: params.length!,
                initialData: params.initialData,
                progressiveDone: params.progressiveDone,
                contentDispositionFilename: params.contentDispositionFilename,
                disableRange: params.disableRange,
                disableStream: params.disableStream,
              },
              rangeTransport,
            );
          } else if (!params.data) {
            networkStream = createPDFNetworkStream({
              url: params.url,
              length: params.length,
              httpHeaders: params.httpHeaders,
              withCredentials: params.withCredentials,
              rangeChunkSize: params.rangeChunkSize,
              disableRange: params.disableRange,
              disableStream: params.disableStream,
            });
          }
          resolve(networkStream);
        },
      );

      return Promise.all([workerIdPromise, networkStreamPromise]).then(
        ([workerId, networkStream]) => {
          if (task.destroyed) {
            throw new Error("Loading aborted");
          }

          const messageHandler = new MessageHandler<Thread.main>(
            docId,
            workerId,
            worker!.port,
          );
          const transport = new WorkerTransport(
            messageHandler,
            task,
            networkStream,
            params,
          );
          task._transport = transport;
          messageHandler.send("Ready", null);
        },
      );
    })
    .catch(task._capability.reject);

  return task;
}

/**
 * Starts fetching of specified PDF document/data.
 *
 * @param docId Unique document ID, used in `MessageHandler`.
 * @return A promise that is resolved when the worker ID of the
 *   `MessageHandler` is known.
 * @private
 */
async function _fetchDocument(
  worker: PDFWorker,
  source: DocumentInitP,
  docId: string,
  pdfDataRangeTransport?: PDFDataRangeTransport,
): Promise<string> {
  if (worker.destroyed) {
    throw new Error("Worker was destroyed");
  }

  if (pdfDataRangeTransport) {
    source.length = pdfDataRangeTransport.length;
    source.initialData = pdfDataRangeTransport.initialData;
    source.progressiveDone = pdfDataRangeTransport.progressiveDone;
    source.contentDispositionFilename =
      pdfDataRangeTransport.contentDispositionFilename;
  }
  const workerId = await worker.messageHandler.sendWithPromise(
    "GetDocRequest",
    {
      docId,
      apiVersion: 0,
      // typeof PDFJSDev !== "undefined" && !PDFJSDev.test("TESTING")
      //   ? PDFJSDev.eval("BUNDLE_VERSION")
      //   : null,
      // Only send the required properties, and *not* the entire object.
      source: {
        data: source.data,
        url: source.url,
        password: source.password,
        disableAutoFetch: source.disableAutoFetch,
        rangeChunkSize: source.rangeChunkSize,
        length: source.length,
      },
      maxImageSize: source.maxImageSize,
      disableFontFace: source.disableFontFace,
      docBaseUrl: source.docBaseUrl,
      ignoreErrors: source.ignoreErrors,
      isEvalSupported: source.isEvalSupported,
      fontExtraProperties: source.fontExtraProperties,
      enableXfa: source.enableXfa,
      useSystemFonts: source.useSystemFonts,
      cMapUrl: source.useWorkerFetch ? source.cMapUrl : undefined,
      standardFontDataUrl: source.useWorkerFetch
        ? source.standardFontDataUrl
        : undefined,
    },
  );

  // Release the TypedArray data, when it exists, since it's no longer needed
  // on the main-thread *after* it's been sent to the worker-thread.
  if (source.data) {
    source.data = undefined;
  }

  if (worker.destroyed) {
    throw new Error("Worker was destroyed");
  }
  return workerId;
}

/**
 * The loading task controls the operations required to load a PDF document
 * (such as network requests) and provides a way to listen for completion,
 * after which individual pages can be rendered.
 */
export class PDFDocumentLoadingTask {
  static #docId = 0;

  _capability = createPromiseCap<PDFDocumentProxy>();
  _transport: WorkerTransport | undefined;
  _worker: PDFWorker | undefined;

  /**
   * Unique identifier for the document loading task.
   */
  docId;

  /**
   * Whether the loading task is destroyed or not.
   */
  destroyed = false;

  /**
   * Callback to request a password if a wrong or no password was provided.
   * The callback receives two parameters: a function that should be called
   * with the new password, and a reason (see {@link PasswordResponses}).
   */
  onPassword?: (
    updateCallback: (password: string | Error) => void,
    reason: PasswordResponses,
  ) => void;

  /**
   * Callback to be able to monitor the loading progress of the PDF file
   * (necessary to implement e.g. a loading bar).
   * The callback receives an {@link OnProgressP} argument.
   */
  onProgress?: (_: OnProgressP) => void;

  /**
   * Callback for when an unsupported feature is used in the PDF document.
   * The callback receives an {@link UNSUPPORTED_FEATURES} argument.
   */
  onUnsupportedFeature?: (featureId?: UNSUPPORTED_FEATURES) => void;

  constructor() {
    this.docId = `d${PDFDocumentLoadingTask.#docId++}`;
  }

  /**
   * Promise for document loading task completion.
   */
  get promise(): Promise<PDFDocumentProxy> {
    return this._capability.promise;
  }

  /**
   * Abort all network requests and destroy the worker.
   * @return A promise that is resolved when destruction is completed.
   */
  async destroy() {
    this.destroyed = true;
    await this._transport?.destroy();

    this._transport = undefined;
    if (this._worker) {
      this._worker.destroy();
      this._worker = undefined;
    }
  }
}

type RangeListener = (begin: number, chunk: ArrayBufferLike) => void;
type ProgressListener = (loaded: number, total?: number) => void;
type ProgressiveReadListener = (chunk: ArrayBufferLike) => void;
type ProgressiveDoneListener = () => void;

/**
 * Abstract class to support range requests file loading.
 */
export class PDFDataRangeTransport {
  #rangeListeners: RangeListener[] = [];
  addRangeListener(listener: RangeListener) {
    this.#rangeListeners.push(listener);
  }

  #progressListeners: ProgressListener[] = [];
  addProgressListener(listener: ProgressListener) {
    this.#progressListeners.push(listener);
  }

  #progressiveReadListeners: ProgressiveReadListener[] = [];
  addProgressiveReadListener(listener: ProgressiveReadListener) {
    this.#progressiveReadListeners.push(listener);
  }

  #progressiveDoneListeners: ProgressiveDoneListener[] = [];
  addProgressiveDoneListener(listener: ProgressiveDoneListener) {
    this.#progressiveDoneListeners.push(listener);
  }

  #readyCapability = createPromiseCap();

  constructor(
    public length: number,
    public initialData: Uint8Array,
    public progressiveDone = false,
    public contentDispositionFilename?: string,
  ) {}

  onDataRange(begin: number, chunk: ArrayBufferLike) {
    for (const listener of this.#rangeListeners) {
      listener(begin, chunk);
    }
  }

  onDataProgress(loaded: number, total?: number) {
    this.#readyCapability.promise.then(() => {
      for (const listener of this.#progressListeners) {
        listener(loaded, total);
      }
    });
  }

  onDataProgressiveRead(chunk: ArrayBufferLike) {
    this.#readyCapability.promise.then(() => {
      for (const listener of this.#progressiveReadListeners) {
        listener(chunk);
      }
    });
  }

  onDataProgressiveDone() {
    this.#readyCapability.promise.then(() => {
      for (const listener of this.#progressiveDoneListeners) {
        listener();
      }
    });
  }

  transportReady() {
    this.#readyCapability.resolve();
  }

  requestDataRange(begin: number, end: number): void {
    assert(0, "Abstract method PDFDataRangeTransport.requestDataRange");
  }

  abort() {}
}

export interface OutlineNode {
  action: string | undefined;
  attachment: Attachment | undefined;
  bold: boolean;
  count: number | undefined;

  /**
   * The color in RGB format to use for display purposes.
   */
  color: Uint8ClampedArray;

  dest: ExplicitDest | string | undefined;
  italic: boolean;
  items: OutlineNode[];
  newWindow: boolean | undefined;
  setOCGState: SetOCGState | undefined;
  title: string;
  unsafeUrl: string | undefined;
  url: string | undefined;
}

export interface PDFDocumentStats {
  /**
   * Used stream types in the
   * document (an item is set to true if specific stream ID was used in the
   * document).
   */
  streamTypes: Record<StreamType, boolean>;

  /**
   * Used font types in the
   * document (an item is set to true if specific font ID was used in the
   * document).
   */
  fontTypes: Record<FontType, boolean>;
}

/**
 * Proxy to a `PDFDocument` in the worker thread.
 */
export class PDFDocumentProxy {
  #pdfInfo: PDFInfo;
  _transport: WorkerTransport;

  constructor(pdfInfo: PDFInfo, transport: WorkerTransport) {
    this.#pdfInfo = pdfInfo;
    this._transport = transport;
  }

  /**
   * @return Storage for annotation data in forms.
   */
  get annotationStorage() {
    return this._transport.annotationStorage;
  }

  /**
   * @return Total number of pages in the PDF file.
   */
  get numPages() {
    return this.#pdfInfo.numPages;
  }

  /**
   * A (not guaranteed to be) unique ID to
   * identify the PDF document.
   * NOTE: The first element will always be defined for all PDF documents,
   * whereas the second element is only defined for *modified* PDF documents.
   */
  get fingerprints() {
    return this.#pdfInfo.fingerprints;
  }

  /**
   * The current statistics about document
   * structures, or `null` when no statistics exists.
   */
  get stats(): PDFDocumentStats | undefined {
    return this._transport.stats;
  }

  /**
   * @return True if only XFA form.
   */
  get isPureXfa() {
    return !!this._transport._htmlForXfa;
  }

  /**
   * NOTE: This is (mostly) intended to support printing of XFA forms.
   *
   * An object representing a HTML tree structure
   * to render the XFA, or `null` when no XFA form exists.
   */
  get allXfaHtml() {
    return this._transport._htmlForXfa;
  }

  /**
   * @param pageNumber The page number to get. The first page is 1.
   * @return A promise that is resolved with a {@link PDFPageProxy} object.
   */
  getPage(pageNumber: number): Promise<PDFPageProxy> {
    return this._transport.getPage(pageNumber);
  }

  /**
   * @param ref The page reference.
   * @return A promise that is resolved with the page index,
   *   starting from zero, that is associated with the reference.
   */
  getPageIndex(ref: RefProxy) {
    return this._transport.getPageIndex(ref);
  }

  /**
   * @return A promise that is resolved
   *   with a mapping from named destinations to references.
   *
   * This can be slow for large documents. Use `getDestination` instead.
   */
  getDestinations() {
    return this._transport.getDestinations();
  }

  /**
   * @param id The named destination to get.
   * @return A promise that is resolved with all
   *   information of the given named destination, or `null` when the named
   *   destination is not present in the PDF file.
   */
  getDestination(id: string) {
    return this._transport.getDestination(id);
  }

  /**
   * @return A promise that is resolved with
   *   an {Array} containing the page labels that correspond to the page
   *   indexes, or `null` when no page labels are present in the PDF file.
   */
  getPageLabels() {
    return this._transport.getPageLabels();
  }

  /**
   * @return A promise that is resolved with a {string}
   *   containing the page layout name.
   */
  getPageLayout() {
    return this._transport.getPageLayout();
  }

  /**
   * @return A promise that is resolved with a {string}
   *   containing the page mode name.
   */
  getPageMode() {
    return this._transport.getPageMode();
  }

  /**
   * @return A promise that is resolved with an
   *   {Object} containing the viewer preferences, or `null` when no viewer
   *   preferences are present in the PDF file.
   */
  getViewerPreferences() {
    return this._transport.getViewerPreferences();
  }

  /**
   * @return A promise that is resolved with an {Array}
   *   containing the destination, or `null` when no open action is present
   *   in the PDF.
   */
  getOpenAction() {
    return this._transport.getOpenAction();
  }

  /**
   * @return A promise that is resolved with a lookup table
   *   for mapping named attachments to their content.
   */
  getAttachments(): Promise<any> {
    return this._transport.getAttachments();
  }

  /**
   * @return A promise that is resolved with
   *   an {Array} of all the JavaScript strings in the name tree, or `null`
   *   if no JavaScript exists.
   */
  getJavaScript() {
    return this._transport.getJavaScript();
  }

  /**
   * @return A promise that is resolved with
   *   an {Object} with the JavaScript actions:
   *     - from the name tree (like getJavaScript);
   *     - from A or AA entries in the catalog dictionary.
   *   , or `null` if no JavaScript exists.
   */
  getJSActions() {
    return this._transport.getDocJSActions();
  }

  /**
   * @return A promise that is resolved with an
   *   {Array} that is a tree outline (if it has one) of the PDF file.
   */
  getOutline() {
    return this._transport.getOutline();
  }

  /**
   * @return A promise that is resolved with
   *   an {@link OptionalContentConfig} that contains all the optional content
   *   groups (assuming that the document has any).
   */
  getOptionalContentConfig() {
    return this._transport.getOptionalContentConfig();
  }

  /**
   * @return A promise that is resolved with
   *   an {Array} that contains the permission flags for the PDF document, or
   *   `null` when no permissions are present in the PDF file.
   */
  getPermissions() {
    return this._transport.getPermissions();
  }

  /**
   * @return A promise that is
   *   resolved with an {Object} that has `info` and `metadata` properties.
   *   `info` is an {Object} filled with anything available in the information
   *   dictionary and similarly `metadata` is a {Metadata} object with
   *   information from the metadata section of the PDF.
   */
  getMetadata() {
    return this._transport.getMetadata();
  }

  /**
   * @return A promise that is resolved with
   *   a {MarkInfo} object that contains the MarkInfo flags for the PDF
   *   document, or `null` when no MarkInfo values are present in the PDF file.
   */
  getMarkInfo() {
    return this._transport.getMarkInfo();
  }

  /**
   * @return A promise that is resolved with a
   *   {Uint8Array} containing the raw data of the PDF document.
   */
  getData(): Promise<Uint8Array> {
    return this._transport.getData();
  }

  /**
   * @return A promise that is resolved with a
   *   {Uint8Array} containing the full data of the saved document.
   */
  saveDocument() {
    return this._transport.saveDocument();
  }

  /**
   * @return A promise that is resolved when the
   *   document's data is loaded. It is resolved with an {Object} that contains
   *   the `length` property that indicates size of the PDF data in bytes.
   */
  getDownloadInfo(): Promise<{ length: number }> {
    return this._transport.downloadInfoCapability.promise;
  }

  /**
   * Cleans up resources allocated by the document on both the main and worker
   * threads.
   *
   * NOTE: Do not, under any circumstances, call this method when rendering is
   * currently ongoing since that may lead to rendering errors.
   *
   * @param keepLoadedFonts Let fonts remain attached to the DOM.
   *   NOTE: This will increase persistent memory usage, hence don't use this
   *   option unless absolutely necessary. The default value is `false`.
   * @return A promise that is resolved when clean-up has finished.
   */
  cleanup(keepLoadedFonts = false) {
    return this._transport.startCleanup();
  }

  /**
   * Destroys the current document instance and terminates the worker.
   */
  destroy() {
    return this.loadingTask.destroy();
  }

  /**
   * A subset of the current
   * {DocumentInitParameters}, which are needed in the viewer.
   */
  get loadingParams() {
    return this._transport.loadingParams;
  }

  /**
   * The loadingTask for the current document.
   */
  get loadingTask(): PDFDocumentLoadingTask {
    return this._transport.loadingTask;
  }

  /**
   * @return A promise that is
   *   resolved with an {Object} containing /AcroForm field data for the JS
   *   sandbox, or `null` when no field data is present in the PDF file.
   */
  getFieldObjects(): Promise<Record<string, FieldObject[]> | undefined> {
    return this._transport.getFieldObjects();
  }

  /**
   * @return A promise that is resolved with `true`
   *   if some /AcroForm fields have JavaScript actions.
   */
  hasJSActions() {
    return this._transport.hasJSActions();
  }

  /**
   * @return A promise that is resolved with an
   *   {Array<string>} containing IDs of annotations that have a calculation
   *   action, or `null` when no such annotations are present in the PDF file.
   */
  getCalculationOrderIds() {
    return this._transport.getCalculationOrderIds();
  }
}

/**
 * Page getViewport parameters.
 */
interface _GetViewportP {
  /**
   * The desired scale of the viewport.
   * In CSS unit.
   */
  scale: number;

  /**
   * The desired rotation, in degrees, of
   * the viewport. If omitted it defaults to the page rotation.
   */
  rotation?: number;

  /**
   * The horizontal, i.e. x-axis, offset.
   * The default value is `0`.
   */
  offsetX?: number;

  /**
   * The vertical, i.e. y-axis, offset.
   * The default value is `0`.
   */
  offsetY?: number;

  /**
   * If true, the y-axis will not be
   * flipped. The default value is `false`.
   */
  dontFlip?: boolean;
}

/**
 * Page getTextContent parameters.
 */
interface _GetTextContentP {
  /**
   * Do not attempt to combine
   * same line {@link TextItem}'s. The default value is `false`.
   */
  disableCombineTextItems?: boolean;

  /**
   * When true include marked
   * content items in the items array of TextContent. The default is `false`.
   */
  includeMarkedContent?: boolean;
}

/**
 * Page text content.
 */
export interface TextContent {
  /**
   * Array of
   * {@link TextItem} and {@link TextMarkedContent} objects. TextMarkedContent
   * items are included when includeMarkedContent is true.
   */
  items: (TextItem | TextMarkedContent)[];

  /**
   * {@link TextStyle} objects,
   * indexed by font name.
   */
  styles: Record<string, TextStyle>;
}

/**
 * Page text content part.
 */
export interface TextItem {
  /**
   * Text content.
   */
  str: string;

  /**
   * Text direction.
   */
  dir: "ttb" | "ltr" | "rtl";

  /**
   * Transformation matrix.
   */
  transform: matrix_t | undefined;

  /**
   * Width in device space.
   */
  width: number;

  /**
   * Height in device space.
   */
  height: number;

  /**
   * Font name used by PDF.js for converted font.
   */
  fontName: string | undefined;

  /**
   * Indicating if the text content is followed by a line-break.
   */
  hasEOL: boolean;
}

/**
 * Page text marked content part.
 */
export interface TextMarkedContent {
  type: "beginMarkedContent" | "beginMarkedContentProps" | "endMarkedContent";

  /**
   * The marked content identifier. Only used for type
   * 'beginMarkedContentProps'.
   */
  id?: string | undefined;

  tag?: string | undefined;
}

/**
 * Text style.
 */
export interface TextStyle {
  /**
   * Font ascent.
   */
  ascent: number;

  /**
   * Font descent.
   */
  descent: number;

  /**
   * Whether or not the text is in vertical mode.
   */
  vertical: boolean;

  /**
   * The possible font family.
   */
  fontFamily: string;
}

/**
 * Page annotation parameters.
 */
interface _GetAnnotationsP {
  /**
   * Determines the annotations that are fetched,
   * can be 'display' (viewable annotations), 'print' (printable annotations),
   * or 'any' (all annotations). The default value is 'display'.
   */
  intent: Intent | undefined;
}

export interface ImageLayer {
  beginLayout(): void;
  endLayout(): void;
  appendImage(_: {
    imgData: ImgData;
    left: number;
    top: number;
    width: number;
    height: number;
  }): void;
}

/**
 * Page render parameters.
 */
export interface RenderP {
  /**
   * A 2D context of a DOM Canvas object.
   */
  canvasContext: CanvasRenderingContext2D;

  /**
   * Rendering viewport obtained by calling
   * the `PDFPageProxy.getViewport` method.
   */
  viewport: PageViewport;

  /**
   * Rendering intent, can be 'display', 'print',
   * or 'any'. The default value is 'display'.
   */
  intent?: Intent;

  /**
   * Controls which annotations are rendered
   * onto the canvas, for annotations with appearance-data; the values from
   * {@link AnnotationMode} should be used. The following values are supported:
   *  - `AnnotationMode.DISABLE`, which disables all annotations.
   *  - `AnnotationMode.ENABLE`, which includes all possible annotations (thus
   *    it also depends on the `intent`-option, see above).
   *  - `AnnotationMode.ENABLE_FORMS`, which excludes annotations that contain
   *    interactive form elements (those will be rendered in the display layer).
   *  - `AnnotationMode.ENABLE_STORAGE`, which includes all possible annotations
   *    (as above) but where interactive form elements are updated with data
   *    from the {@link AnnotationStorage}-instance; useful e.g. for printing.
   * The default value is `AnnotationMode.ENABLE`.
   */
  annotationMode?: AnnotationMode;

  /**
   * Whether or not interactive
   * form elements are rendered in the display layer. If so, we do not render
   * them on the canvas as well. The default value is `false`.
   */
  renderInteractiveForms?: boolean;

  /**
   * Additional transform, applied just
   * before viewport transform.
   */
  transform?: matrix_t | undefined;

  /**
   * The factory instance that will be used
   * when creating canvases. The default value is {new DOMCanvasFactory()}.
   */
  canvasFactory?: BaseCanvasFactory;

  /**
   * Background to use for the canvas.
   * Any valid `canvas.fillStyle` can be used: a `DOMString` parsed as CSS
   * <color> value, a `CanvasGradient` object (a linear or radial gradient) or
   * a `CanvasPattern` object (a repetitive image). The default value is
   * 'rgb(255,255,255)'.
   *
   * NOTE: This option may be partially, or completely, ignored when the
   * `pageColors`-option is used.
   */
  background?: string | CanvasGradient | CanvasPattern;

  /**
   * Overwrites background and foreground colors
   * with user defined ones in order to improve readability in high contrast
   * mode.
   */
  pageColors?: PageColors | undefined;

  /**
   * A promise that should resolve with an {@link OptionalContentConfig}
   * created from `PDFDocumentProxy.getOptionalContentConfig`. If `null`,
   * the configuration will be fetched automatically with the default visibility
   * states set.
   */
  optionalContentConfigPromise?:
    | Promise<OptionalContentConfig | undefined>
    | undefined;

  /**
   * Map some annotation ids with canvases used to render them.
   */
  annotationCanvasMap?: Map<string, HTMLCanvasElement> | undefined;

  printAnnotationStorage?: PrintAnnotationStorage | undefined;
}

/**
 * Page getOperatorList parameters.
 */
interface _GetOperatorListP {
  /**
   * Rendering intent, can be 'display', 'print',
   * or 'any'. The default value is 'display'.
   */
  intent?: Intent;

  /**
   * Controls which annotations are included
   * in the operatorList, for annotations with appearance-data; the values from
   * {@link AnnotationMode} should be used. The following values are supported:
   *  - `AnnotationMode.DISABLE`, which disables all annotations.
   *  - `AnnotationMode.ENABLE`, which includes all possible annotations (thus
   *    it also depends on the `intent`-option, see above).
   *  - `AnnotationMode.ENABLE_FORMS`, which excludes annotations that contain
   *    interactive form elements (those will be rendered in the display layer).
   *  - `AnnotationMode.ENABLE_STORAGE`, which includes all possible annotations
   *    (as above) but where interactive form elements are updated with data
   *    from the {@link AnnotationStorage}-instance; useful e.g. for printing.
   * The default value is `AnnotationMode.ENABLE`.
   */
  annotationMode?: AnnotationMode;

  printAnnotationStorage?: PrintAnnotationStorage;
}

/**
 * Structure tree node. The root node will have a role "Root".
 */
export interface StructTreeNode {
  /**
   * Array of {@link StructTreeNode} and {@link StructTreeContent} objects.
   */
  children: (StructTreeNode | StructTreeContent)[];

  /**
   * element's role, already mapped if a role map exists in the PDF.
   */
  role: string;

  alt?: string;
  lang?: string;
}

/**
 * Structure tree content.
 */
export interface StructTreeContent {
  /**
   * either "content" for page and stream structure
   * elements or "object" for object references.
   */
  type: "content" | "object";

  /**
   * unique id that will map to the text layer.
   */
  id?: string;
}

interface IntentState {
  streamReaderCancelTimeout: number | undefined;
  displayReadyCapability?: PromiseCap<boolean>;
  opListReadCapability?: PromiseCap<OpListIR>;
  operatorList?: OpListIR;
  streamReader:
    | ReadableStreamDefaultReader<
      ActionSinkchunk<Thread.main>
    >
    | undefined;
  renderTasks?: Set<InternalRenderTask>;
}

export type AnnotIntent = "display" | "print" | "richText";
export type Intent = AnnotIntent | "any";

interface _AbortOperatorListP {
  intentState: IntentState;
  reason: unknown;
  force?: boolean;
}

export type PDFObjs =
  | ImgData
  | ShadingPatternIR;

interface _IntentArgs {
  renderingIntent: RenderingIntentFlag;
  cacheKey: string;
  annotationStorageMap: AnnotStorageRecord | undefined;
  isOpList?: boolean;
}

/**
 * Proxy to a `PDFPage` in the worker thread.
 */
export class PDFPageProxy {
  _pageIndex: number;
  _pageInfo: PageInfo;
  _ownerDocument: Document | undefined;
  _transport: WorkerTransport;

  _stats: StatTimer | null;

  /**
   * @return Returns page stats, if enabled; returns `null` otherwise.
   */
  get stats() {
    return this._stats;
  }

  _pdfBug: boolean;
  commonObjs: PDFObjects<PDFCommonObjs>;
  objs = new PDFObjects<PDFObjs | undefined>();

  _bitmaps = new Set<ImageBitmap>();

  cleanupAfterRender = false;
  _structTreePromise: Promise<StructTreeNode | undefined> | undefined;
  pendingCleanup = false;
  #intentStates = new Map<string, IntentState>();
  _annotationPromises = new Map<string, Promise<AnnotationData[]>>();
  destroyed = false;

  _annotationsPromise: Promise<AnnotationData[]> | undefined;
  _annotationsIntent: AnnotIntent | undefined;

  _jsActionsPromise: Promise<AnnotActions | undefined> | undefined;

  _xfaPromise: Promise<XFAData | undefined> | undefined;

  constructor(
    pageIndex: number,
    pageInfo: PageInfo,
    transport: WorkerTransport,
    ownerDocument?: Document,
    pdfBug = false,
  ) {
    this._pageIndex = pageIndex;
    this._pageInfo = pageInfo;
    this._ownerDocument = ownerDocument;
    this._transport = transport;
    this._stats = pdfBug ? new StatTimer() : null;
    this._pdfBug = pdfBug;
    this.commonObjs = transport.commonObjs;
  }

  /**
   * @return Page number of the page. First page is 1.
   */
  get pageNumber(): number {
    return this._pageIndex + 1;
  }

  /**
   * The number of degrees the page is rotated clockwise.
   */
  get rotate() {
    return this._pageInfo.rotate;
  }

  /**
   * The reference that points to this page.
   */
  get ref() {
    return this._pageInfo.ref;
  }

  /**
   * The default size of units in 1/72nds of an inch.
   */
  get userUnit() {
    return this._pageInfo.userUnit;
  }

  /**
   * An array of the visible portion of the PDF page in
   * user space units [x1, y1, x2, y2].
   */
  get view() {
    return this._pageInfo.view;
  }

  /**
   * @param params Viewport parameters.
   * @return Contains 'width' and 'height' properties
   *   along with transforms required for rendering.
   */
  getViewport({
    scale,
    rotation = this.rotate,
    offsetX = 0,
    offsetY = 0,
    dontFlip = false,
  }: _GetViewportP) {
    return new PageViewport({
      viewBox: this.view,
      scale,
      rotation,
      offsetX,
      offsetY,
      dontFlip,
    });
  }

  /**
   * @param params Annotation parameters.
   * @return A promise that is resolved with an
   *   {Array} of the annotation objects.
   */
  getAnnotations({ intent = "display" } = <_GetAnnotationsP> {}) {
    const intentArgs = this._transport.getRenderingIntent(intent);

    let promise = this._annotationPromises.get(intentArgs.cacheKey);
    if (!promise) {
      promise = this._transport.getAnnotations(
        this._pageIndex,
        intentArgs.renderingIntent,
      );
      this._annotationPromises.set(intentArgs.cacheKey, promise);
    }
    return promise;
  }

  /**
   * @return A promise that is resolved with an
   *   {Object} with JS actions.
   */
  getJSActions() {
    return (this._jsActionsPromise ||= this._transport.getPageJSActions(
      this._pageIndex,
    ));
  }

  /**
   * A promise that is resolved with
   * an {Object} with a fake DOM object (a tree structure where elements
   * are {Object} with a name, attributes (class, style, ...), value and
   * children, very similar to a HTML DOM tree), or `null` if no XFA exists.
   */
  async getXfa() {
    return this._transport._htmlForXfa?.children![this._pageIndex] || undefined;
  }

  /**
   * Begins the process of rendering a page to the desired context.
   *
   * @param params Page render parameters.
   * @return An object that contains a promise that is
   *   resolved when the page finishes rendering.
   */
  render({
    canvasContext,
    viewport,
    intent = "display",
    annotationMode = AnnotationMode.ENABLE,
    transform = undefined,
    canvasFactory,
    background,
    optionalContentConfigPromise,
    annotationCanvasMap = undefined,
    pageColors = undefined,
    printAnnotationStorage = undefined,
  }: RenderP): RenderTask {
    this._stats?.time("Overall");

    const intentArgs = this._transport.getRenderingIntent(
      intent,
      annotationMode,
      printAnnotationStorage,
    );
    // If there was a pending destroy, cancel it so no cleanup happens during
    // this call to render.
    this.pendingCleanup = false;

    if (!optionalContentConfigPromise) {
      optionalContentConfigPromise = this._transport.getOptionalContentConfig();
    }

    let intentState = this.#intentStates.get(intentArgs.cacheKey);
    if (!intentState) {
      intentState = <IntentState> Object.create(null);
      this.#intentStates.set(intentArgs.cacheKey, intentState);
    }

    // Ensure that a pending `streamReader` cancel timeout is always aborted.
    if (intentState.streamReaderCancelTimeout) {
      clearTimeout(intentState.streamReaderCancelTimeout);
      intentState.streamReaderCancelTimeout = undefined;
    }

    const canvasFactoryInstance = canvasFactory ||
      new DefaultCanvasFactory({ ownerDocument: this._ownerDocument });
    const intentPrint = !!(
      intentArgs.renderingIntent & RenderingIntentFlag.PRINT
    );

    // If there's no displayReadyCapability yet, then the operatorList
    // was never requested before. Make the request and create the promise.
    if (!intentState.displayReadyCapability) {
      intentState.displayReadyCapability = createPromiseCap<boolean>();
      intentState.operatorList = {
        fnArray: [],
        argsArray: [],
        lastChunk: false,
        separateAnnots: undefined,
      };

      this._stats?.time("Page Request");
      this.#pumpOperatorList(intentArgs);
    }

    const complete = (error?: unknown) => {
      intentState!.renderTasks!.delete(internalRenderTask);

      // Attempt to reduce memory usage during *printing*, by always running
      // cleanup once rendering has finished (regardless of cleanupAfterRender).
      if (this.cleanupAfterRender || intentPrint) {
        this.pendingCleanup = true;
      }
      this.#tryCleanup();

      if (error) {
        internalRenderTask.capability.reject(error);

        this.#abortOperatorList({
          intentState: intentState!,
          reason: error instanceof Error ? error : new Error(<any> error),
        });
      } else {
        internalRenderTask.capability.resolve();
      }

      this._stats?.timeEnd("Rendering");
      this._stats?.timeEnd("Overall");
    };

    const internalRenderTask = new InternalRenderTask({
      callback: complete,
      // Only include the required properties, and *not* the entire object.
      params: {
        canvasContext,
        viewport,
        transform,
        background,
      },
      objs: this.objs,
      commonObjs: this.commonObjs,
      annotationCanvasMap,
      operatorList: intentState.operatorList!,
      pageIndex: this._pageIndex,
      canvasFactory: canvasFactoryInstance,
      useRequestAnimationFrame: !intentPrint,
      pdfBug: this._pdfBug,
      pageColors,
    });

    (intentState.renderTasks ||= new Set()).add(internalRenderTask);
    const renderTask = internalRenderTask.task;

    Promise.all([
      intentState.displayReadyCapability.promise,
      optionalContentConfigPromise,
    ])
      .then(([transparency, optionalContentConfig]) => {
        if (this.pendingCleanup) {
          complete();
          return;
        }
        this._stats?.time("Rendering");

        internalRenderTask.initializeGraphics({
          transparency,
          optionalContentConfig,
        });
        internalRenderTask.operatorListChanged();
      })
      .catch(complete);

    return renderTask;
  }

  /**
   * @param params Page getOperatorList parameters.
   * @return A promise resolved with an
   *   {@link PDFOperatorList} object that represents the page's operator list.
   */
  getOperatorList({
    intent = "display",
    annotationMode = AnnotationMode.ENABLE,
    printAnnotationStorage = undefined,
  }: _GetOperatorListP = {}): Promise<OpListIR> {
    function operatorListChanged() {
      if (intentState!.operatorList!.lastChunk) {
        intentState!.opListReadCapability!.resolve(intentState!.operatorList!);

        intentState!.renderTasks!.delete(opListTask);
      }
    }

    const intentArgs = this._transport.getRenderingIntent(
      intent,
      annotationMode,
      printAnnotationStorage,
      /* isOpList = */ true,
    );
    let intentState = this.#intentStates.get(intentArgs.cacheKey);
    if (!intentState) {
      intentState = Object.create(null);
      this.#intentStates.set(intentArgs.cacheKey, intentState!);
    }
    let opListTask: InternalRenderTask;

    if (!intentState!.opListReadCapability) {
      opListTask = Object.create(null);
      opListTask.operatorListChanged = operatorListChanged;
      intentState!.opListReadCapability = createPromiseCap();
      (intentState!.renderTasks ||= new Set()).add(opListTask);
      intentState!.operatorList = {
        fnArray: [],
        argsArray: [],
        lastChunk: false,
        separateAnnots: undefined,
      };

      this._stats?.time("Page Request");
      this.#pumpOperatorList(intentArgs);
    }
    return intentState!.opListReadCapability.promise;
  }

  /**
   * NOTE: All occurrences of whitespace will be replaced by
   * standard spaces (0x20).
   *
   * @param params getTextContent parameters.
   * @return Stream for reading text content chunks.
   */
  streamTextContent({
    disableCombineTextItems = false,
    includeMarkedContent = false,
  } = <_GetTextContentP> {}): ReadableStream {
    const TEXT_CONTENT_CHUNK_SIZE = 100;

    return this._transport.messageHandler.sendWithStream(
      "GetTextContent",
      {
        pageIndex: this._pageIndex,
        combineTextItems: disableCombineTextItems !== true,
        includeMarkedContent: includeMarkedContent === true,
      },
      {
        highWaterMark: TEXT_CONTENT_CHUNK_SIZE,
        size(
          textContent:
            | ActionSinkchunk<Thread.main, "GetTextContent">
            | undefined,
        ) {
          return textContent!.items.length;
        },
      },
    );
  }

  /**
   * NOTE: All occurrences of whitespace will be replaced by
   * standard spaces (0x20).
   *
   * @param params - getTextContent parameters.
   * @return A promise that is resolved with a
   *   {@link TextContent} object that represents the page's text content.
   */
  getTextContent(params = <_GetTextContentP> {}): Promise<TextContent> {
    if (this._transport._htmlForXfa) {
      // TODO: We need to revisit this once the XFA foreground patch lands and
      // only do this for non-foreground XFA.
      return this.getXfa().then((xfa) => {
        return XfaText.textContent(<XFAElObj | undefined> xfa);
      });
    }
    const readableStream = this.streamTextContent(params);

    return new Promise((resolve, reject) => {
      function pump() {
        reader.read().then(({ value, done }) => {
          if (done) {
            resolve(textContent);
            return;
          }
          Object.assign(textContent.styles, value.styles);
          textContent.items.push(...value.items);
          pump();
        }, reject);
      }

      const reader = readableStream.getReader();
      const textContent: TextContent = {
        items: [],
        styles: Object.create(null),
      };
      pump();
    });
  }

  /**
   * @return A promise that is resolved with a
   *   {@link StructTreeNode} object that represents the page's structure tree,
   *   or `null` when no structure tree is present for the current page.
   */
  getStructTree(): Promise<StructTreeNode | undefined> {
    return (this._structTreePromise ||= this._transport.getStructTree(
      this._pageIndex,
    ));
  }

  /**
   * Destroys the page object.
   * @private
   */
  _destroy() {
    this.destroyed = true;

    const waitOn = [];
    for (const intentState of this.#intentStates.values()) {
      this.#abortOperatorList({
        intentState,
        reason: new Error("Page was destroyed."),
        force: true,
      });

      if (intentState.opListReadCapability) {
        // Avoid errors below, since the renderTasks are just stubs.
        continue;
      }
      for (const internalRenderTask of intentState.renderTasks!) {
        waitOn.push(internalRenderTask.completed);
        internalRenderTask.cancel();
      }
    }
    this.objs.clear();
    for (const bitmap of this._bitmaps) {
      bitmap.close();
    }
    this._bitmaps.clear();
    this._annotationPromises.clear();
    this._jsActionsPromise = undefined;
    this._structTreePromise = undefined;
    this.pendingCleanup = false;
    return Promise.all(waitOn);
  }

  /**
   * Cleans up resources allocated by the page.
   *
   * @param resetStats - Reset page stats, if enabled.
   *   The default value is `false`.
   * @return Indicates if clean-up was successfully run.
   */
  cleanup(resetStats = false): boolean {
    this.pendingCleanup = true;
    return this.#tryCleanup(resetStats);
  }

  /**
   * Attempts to clean up if rendering is in a state where that's possible.
   */
  #tryCleanup(resetStats = false) {
    if (!this.pendingCleanup) return false;

    for (const { renderTasks, operatorList } of this.#intentStates.values()) {
      if (renderTasks!.size > 0 || !operatorList!.lastChunk) {
        return false;
      }
    }

    this.#intentStates.clear();
    this.objs.clear();
    this._annotationPromises.clear();
    this._jsActionsPromise = undefined;
    this._structTreePromise = undefined;
    if (resetStats && this._stats) {
      this._stats = new StatTimer();
    }
    this.pendingCleanup = false;
    for (const bitmap of this._bitmaps) {
      bitmap.close();
    }
    this._bitmaps.clear();
    return true;
  }

  _startRenderPage(transparency: boolean, cacheKey: string) {
    const intentState = this.#intentStates.get(cacheKey);
    if (!intentState) {
      return; // Rendering was cancelled.
    }
    this._stats?.timeEnd("Page Request");

    // TODO Refactor RenderPageRequest to separate rendering
    // and operator list logic
    intentState.displayReadyCapability?.resolve(transparency);
  }

  #renderPageChunk(
    operatorListChunk: ActionSinkchunk<Thread.main, "GetOperatorList">,
    intentState: IntentState,
  ) {
    // Add the new chunk to the current operator list.
    for (let i = 0, ii = operatorListChunk.length!; i < ii; i++) {
      intentState.operatorList!.fnArray.push(operatorListChunk.fnArray[i]);
      intentState.operatorList!.argsArray.push(operatorListChunk.argsArray[i]);
    }
    intentState.operatorList!.lastChunk = operatorListChunk.lastChunk;
    intentState.operatorList!.separateAnnots = operatorListChunk.separateAnnots;

    // Notify all the rendering tasks there are more operators to be consumed.
    for (const internalRenderTask of intentState.renderTasks!) {
      internalRenderTask.operatorListChanged();
    }

    if (operatorListChunk.lastChunk) {
      this.#tryCleanup();
    }
  }

  #pumpOperatorList(
    { renderingIntent, cacheKey, annotationStorageMap }: _IntentArgs,
  ) {
    /*#static*/ if (_PDFDEV) {
      assert(
        Number.isInteger(renderingIntent) && renderingIntent > 0,
        '_pumpOperatorList: Expected valid "renderingIntent" argument.',
      );
    }

    const readableStream = this._transport.messageHandler.sendWithStream(
      "GetOperatorList",
      {
        pageIndex: this._pageIndex,
        intent: renderingIntent,
        cacheKey,
        annotationStorage: annotationStorageMap,
      },
    );
    const reader = readableStream.getReader();

    const intentState = this.#intentStates.get(cacheKey)!;
    intentState.streamReader = reader;

    const pump = () => {
      reader.read().then(
        ({ value, done }) => {
          if (done) {
            intentState.streamReader = undefined;
            return;
          }
          if (this._transport.destroyed) {
            // Ignore any pending requests if the worker was terminated.
            return;
          }
          this.#renderPageChunk(value!, intentState);
          pump();
        },
        (reason) => {
          intentState.streamReader = undefined;

          if (this._transport.destroyed) {
            // Ignore any pending requests if the worker was terminated.
            return;
          }
          if (intentState.operatorList) {
            // Mark operator list as complete.
            intentState.operatorList.lastChunk = true;

            for (const internalRenderTask of intentState.renderTasks!) {
              internalRenderTask.operatorListChanged();
            }
            this.#tryCleanup();
          }

          if (intentState.displayReadyCapability) {
            intentState.displayReadyCapability.reject(reason);
          } else if (intentState.opListReadCapability) {
            intentState.opListReadCapability.reject(reason);
          } else {
            throw reason;
          }
        },
      );
    };
    pump();
  }

  #abortOperatorList(
    { intentState, reason, force = false }: _AbortOperatorListP,
  ) {
    /*#static*/ if (_PDFDEV) {
      assert(
        reason instanceof Error,
        '_abortOperatorList: Expected valid "reason" argument.',
      );
    }

    if (!intentState.streamReader) {
      return;
    }
    if (!force) {
      // Ensure that an Error occurring in *only* one `InternalRenderTask`, e.g.
      // multiple render() calls on the same canvas, won't break all rendering.
      if (intentState.renderTasks!.size > 0) {
        return;
      }
      // Don't immediately abort parsing on the worker-thread when rendering is
      // cancelled, since that will unnecessarily delay re-rendering when (for
      // partially parsed pages) e.g. zooming/rotation occurs in the viewer.
      if (reason instanceof RenderingCancelledException) {
        intentState.streamReaderCancelTimeout = setTimeout(() => {
          this.#abortOperatorList({ intentState, reason, force: true });
          intentState.streamReaderCancelTimeout = undefined;
        }, RENDERING_CANCELLED_TIMEOUT);
        return;
      }
    }
    intentState.streamReader
      .cancel(new AbortException((<any> reason).message))
      .catch(() => {
        // Avoid "Uncaught promise" messages in the console.
      });
    intentState.streamReader = undefined;

    if (this._transport.destroyed) {
      // Ignore any pending requests if the worker was terminated.
      return;
    }
    // Remove the current `intentState`, since a cancelled `getOperatorList`
    // call on the worker-thread cannot be re-started...
    for (const [curCacheKey, curIntentState] of this.#intentStates) {
      if (curIntentState === intentState) {
        this.#intentStates.delete(curCacheKey);
        break;
      }
    }
    // ... and force clean-up to ensure that any old state is always removed.
    this.cleanup();
  }
}

export class LoopbackPort {
  #listeners: EventListener[] = [];

  #deferred = Promise.resolve();

  postMessage(
    obj: any,
    transfers?: Transferable[] | StructuredSerializeOptions,
  ) {
    const event: any = {
      data: structuredClone(obj, <StructuredSerializeOptions> transfers),
    };

    this.#deferred.then(() => {
      for (const listener of this.#listeners) {
        listener.call(this, event);
      }
    });
  }

  addEventListener(name: string, listener: EventListener) {
    this.#listeners.push(listener);
  }

  removeEventListener(name: string, listener: EventListener) {
    const i = this.#listeners.indexOf(listener);
    this.#listeners.splice(i, 1);
  }

  terminate() {
    this.#listeners.length = 0;
  }
}

interface _PDFWorkerP {
  /**
   * The name of the worker.
   */
  name?: string;

  /**
   * The `workerPort` object.
   */
  port?: Worker | undefined;

  /**
   * Controls the logging level;
   * the constants from {@link VerbosityLevel} should be used.
   */
  verbosity?: VerbosityLevel | undefined;
}

export const PDFWorkerUtil = <{
  isWorkerDisabled: boolean;
  fallbackWorkerSrc: string | undefined;
  fakeWorkerId: number;
  isSameOrigin: (baseUrl: string | URL, otherUrl: string | URL) => boolean;
  createCDNWrapper: (url: string) => string;
}> {
  isWorkerDisabled: false,
  fallbackWorkerSrc: undefined,
  fakeWorkerId: 0,
};
/*#static*/ if (GENERIC) {
  // eslint-disable-next-line no-undef
  // if (isNodeJS && typeof __non_webpack_require__ === "function") {
  //   // Workers aren't supported in Node.js, force-disabling them there.
  //   PDFWorkerUtil.isWorkerDisabled = true;

  //   PDFWorkerUtil.fallbackWorkerSrc = PDFJSDev.test("LIB")
  //     ? "../pdf.worker.js"
  //     : "./pdf.worker";
  // }
  // else
  if (typeof document === "object") {
    const pdfjsFilePath = (<HTMLScriptElement> document?.currentScript)?.src;
    if (pdfjsFilePath) {
      PDFWorkerUtil.fallbackWorkerSrc = pdfjsFilePath.replace(
        /(\.(?:min\.)?js)(\?.*)?$/i,
        ".worker$1$2",
      );
    }
  }

  // Check if URLs have the same origin. For non-HTTP based URLs, returns false.
  PDFWorkerUtil.isSameOrigin = (baseUrl, otherUrl) => {
    let base;
    try {
      base = new URL(baseUrl);
      if (!base.origin || base.origin === "null") {
        return false; // non-HTTP url
      }
    } catch (e) {
      return false;
    }

    const other = new URL(otherUrl, base);
    return base.origin === other.origin;
  };

  PDFWorkerUtil.createCDNWrapper = (url) => {
    // We will rely on blob URL's property to specify origin.
    // We want this function to fail in case if createObjectURL or Blob do not
    // exist or fail for some reason -- our Worker creation will fail anyway.
    const wrapper = `importScripts("${url}");`;
    return URL.createObjectURL(new Blob([wrapper]));
  };
}

/**
 * PDF.js web worker abstraction that controls the instantiation of PDF
 * documents. Message handlers are used to pass information from the main
 * thread to the worker thread and vice versa. If the creation of a web
 * worker is not possible, a "fake" worker will be used instead.
 */
export class PDFWorker {
  static #workerPorts = new WeakMap<IWorker, PDFWorker>();

  name: string | undefined;
  destroyed = false;
  verbosity: VerbosityLevel;

  #readyCapability = createPromiseCap();
  /**
   * Promise for worker initialization completion.
   */
  get promise() {
    return this.#readyCapability.promise;
  }

  #port!: IWorker;
  /**
   * The current `workerPort`, when it exists.
   */
  get port() {
    return this.#port;
  }

  #webWorker: Worker | undefined;
  get _webWorker() {
    return this.#webWorker;
  }

  #messageHandler!: MessageHandler<Thread.main>;
  /**
   * The current MessageHandler-instance.
   */
  get messageHandler() {
    return this.#messageHandler;
  }

  constructor({
    name,
    port,
    verbosity = getVerbosityLevel(),
  }: _PDFWorkerP = {}) {
    if (port && PDFWorker.#workerPorts.has(port)) {
      throw new Error("Cannot use more than one PDFWorker per port.");
    }

    this.name = name;
    this.verbosity = verbosity;

    if (port) {
      PDFWorker.#workerPorts.set(port, this);
      this.#initializeFromPort(port);
      return;
    }
    this.#initialize();
  }

  #initializeFromPort(port: Worker) {
    this.#port = port;
    this.#messageHandler = new MessageHandler<Thread.main>(
      "main",
      "worker",
      port,
    );
    this.#messageHandler.on("ready", () => {
      // Ignoring "ready" event -- MessageHandler should already be initialized
      // and ready to accept messages.
    });
    this.#readyCapability.resolve();
    // Send global setting, e.g. verbosity level.
    this.#messageHandler.send("configure", {
      verbosity: this.verbosity,
    });
  }

  #initialize() {
    // If worker support isn't disabled explicit and the browser has worker
    // support, create a new web worker and test if it/the browser fulfills
    // all requirements to run parts of pdf.js in a web worker.
    // Right now, the requirement is, that an Uint8Array is still an
    // Uint8Array as it arrives on the worker. (Chrome added this with v.15.)
    if (
      !PDFWorkerUtil.isWorkerDisabled &&
      !PDFWorker._mainThreadWorkerMessageHandler
    ) {
      let { workerSrc } = PDFWorker;

      try {
        // Wraps workerSrc path into blob URL, if the former does not belong
        // to the same origin.
        /*#static*/ if (GENERIC) {
          if (!PDFWorkerUtil.isSameOrigin(window.location.href, workerSrc)) {
            workerSrc = PDFWorkerUtil.createCDNWrapper(
              new URL(workerSrc, <any> window.location).href,
            );
          }
        }

        // Some versions of FF can't create a worker on localhost, see:
        // https://bugzilla.mozilla.org/show_bug.cgi?id=683280
        const worker = new Worker(workerSrc, { type: "module" });
        const messageHandler = new MessageHandler<Thread.main>(
          "main",
          "worker",
          worker,
        );
        const terminateEarly = () => {
          worker.removeEventListener("error", onWorkerError);
          messageHandler.destroy();
          worker.terminate();
          if (this.destroyed) {
            this.#readyCapability.reject(new Error("Worker was destroyed"));
          } else {
            // Fall back to fake worker if the termination is caused by an
            // error (e.g. NetworkError / SecurityError).
            this.#setupFakeWorker();
          }
        };

        const onWorkerError = (evt: Event) => {
          console.error(evt);
          if (!this.#webWorker) {
            // Worker failed to initialize due to an error. Clean up and fall
            // back to the fake worker.
            terminateEarly();
          }
        };
        worker.addEventListener("error", onWorkerError);

        messageHandler.on("test", (data) => {
          worker.removeEventListener("error", onWorkerError);
          if (this.destroyed) {
            terminateEarly();
            return; // worker was destroyed
          }
          if (data) {
            this.#messageHandler = messageHandler;
            this.#port = worker;
            this.#webWorker = worker;

            this.#readyCapability.resolve();
            // Send global setting, e.g. verbosity level.
            messageHandler.send("configure", {
              verbosity: this.verbosity,
            });
          } else {
            this.#setupFakeWorker();
            messageHandler.destroy();
            worker.terminate();
          }
        });

        messageHandler.on("ready", () => {
          worker.removeEventListener("error", onWorkerError);
          if (this.destroyed) {
            terminateEarly();
            return; // worker was destroyed
          }
          try {
            sendTest();
          } catch (e) {
            // We need fallback to a faked worker.
            this.#setupFakeWorker();
          }
        });

        const sendTest = () => {
          const testObj = new Uint8Array();
          // Ensure that we can use `postMessage` transfers.
          messageHandler.send("test", testObj, [testObj.buffer]);
        };

        // It might take time for the worker to initialize. We will try to send
        // the "test" message immediately, and once the "ready" message arrives.
        // The worker shall process only the first received "test" message.
        sendTest();
        return;
      } catch (e) {
        info("The worker has been disabled.");
      }
    }
    // Either workers are disabled, not supported or have thrown an exception.
    // Thus, we fallback to a faked worker.
    this.#setupFakeWorker();
  }

  #setupFakeWorker() {
    if (!PDFWorkerUtil.isWorkerDisabled) {
      warn("Setting up fake worker.");
      PDFWorkerUtil.isWorkerDisabled = true;
    }

    PDFWorker._setupFakeWorkerGlobal
      .then((WorkerMessageHandler) => {
        if (this.destroyed) {
          this.#readyCapability.reject(new Error("Worker was destroyed"));
          return;
        }
        const port = new LoopbackPort();
        this.#port = port;

        // All fake workers use the same port, making id unique.
        const id = `fake${PDFWorkerUtil.fakeWorkerId++}`;

        // If the main thread is our worker, setup the handling for the
        // messages -- the main thread sends to it self.
        const workerHandler = new MessageHandler<Thread.worker>(
          id + "_worker",
          id,
          port,
        );
        WorkerMessageHandler.setup(workerHandler, port);

        const messageHandler = new MessageHandler<Thread.main>(
          id,
          id + "_worker",
          port,
        );
        this.#messageHandler = messageHandler;
        this.#readyCapability.resolve();
        // Send global setting, e.g. verbosity level.
        messageHandler.send("configure", {
          verbosity: this.verbosity,
        });
      })
      .catch((reason) => {
        this.#readyCapability.reject(
          new Error(`Setting up fake worker failed: "${reason.message}".`),
        );
      });
  }

  /**
   * Destroys the worker instance.
   */
  destroy() {
    this.destroyed = true;
    if (this.#webWorker) {
      // We need to terminate only web worker created resource.
      this.#webWorker.terminate();
      this.#webWorker = undefined;
    }
    PDFWorker.#workerPorts.delete(this.#port);
    this.#port = <any> undefined;
    if (this.#messageHandler) {
      this.#messageHandler.destroy();
      this.#messageHandler = <any> undefined;
    }
  }

  /**
   * @param params The worker initialization parameters.
   */
  static fromPort(params: _PDFWorkerP) {
    if (!params?.port) {
      throw new Error("PDFWorker.fromPort - invalid method signature.");
    }
    if (this.#workerPorts.has(params.port)) {
      return this.#workerPorts.get(params.port);
    }
    return new PDFWorker(params);
  }

  /**
   * The current `workerSrc`, when it exists.
   */
  static get workerSrc(): string {
    if (GlobalWorkerOptions.workerSrc) {
      return GlobalWorkerOptions.workerSrc;
    }
    /*#static*/ if (GENERIC) {
      if (PDFWorkerUtil.fallbackWorkerSrc !== undefined) {
        // if (!isNodeJS)
        // {
        deprecated('No "GlobalWorkerOptions.workerSrc" specified.');
        // }
        return PDFWorkerUtil.fallbackWorkerSrc;
      }
    }
    throw new Error('No "GlobalWorkerOptions.workerSrc" specified.');
  }

  static get _mainThreadWorkerMessageHandler() {
    try {
      return (<any> globalThis).pdfjsWorker?.WorkerMessageHandler || undefined;
    } catch (ex) {
      return undefined;
    }
  }

  // Loads worker code into the main-thread.
  static get _setupFakeWorkerGlobal() {
    const loader = async (): Promise<typeof WorkerMessageHandler> => {
      const mainWorkerMessageHandler = this._mainThreadWorkerMessageHandler;

      if (mainWorkerMessageHandler) {
        // The worker was already loaded using e.g. a `<script>` tag.
        return mainWorkerMessageHandler;
      }
      /*#static*/ if (!PRODUCTION) {
        const worker = await import("../core/worker.ts");
        return worker.WorkerMessageHandler;
      } else {
        // if (
        //   PDFJSDev.test("GENERIC") &&
        //   isNodeJS &&
        //   // eslint-disable-next-line no-undef
        //   typeof __non_webpack_require__ === "function"
        // ) {
        //   // Since bundlers, such as Webpack, cannot be told to leave `require`
        //   // statements alone we are thus forced to jump through hoops in order
        //   // to prevent `Critical dependency: ...` warnings in third-party
        //   // deployments of the built `pdf.js`/`pdf.worker.js` files; see
        //   // https://github.com/webpack/webpack/issues/8826
        //   //
        //   // The following hack is based on the assumption that code running in
        //   // Node.js won't ever be affected by e.g. Content Security Policies that
        //   // prevent the use of `eval`. If that ever occurs, we should revert this
        //   // to a normal `__non_webpack_require__` statement and simply document
        //   // the Webpack warnings instead (telling users to ignore them).
        //   //
        //   // eslint-disable-next-line no-eval
        //   const worker = eval("require")(this.workerSrc);
        //   return worker.WorkerMessageHandler;
        // }
        await loadScript(this.workerSrc);
        return window.pdfjsWorker!.WorkerMessageHandler;
      }
    };

    return shadow(this, "_setupFakeWorkerGlobal", loader());
  }
}

export type PDFCommonObjs =
  | string
  | FontFaceObject
  | FontExpotDataEx
  | { error: string }
  | CmdArgs[]
  | ImgData;

interface PDFMetadata {
  info: DocumentInfo;
  metadata: Metadata | undefined;
  contentDispositionFilename: string | undefined;
  contentLength: number | undefined;
}

/**
 * For internal use only.
 * @ignore
 * @final
 */
class WorkerTransport {
  messageHandler;
  loadingTask;
  commonObjs = new PDFObjects<PDFCommonObjs>();
  fontLoader;
  #metadataPromise?: Promise<PDFMetadata> | undefined;
  _getFieldObjectsPromise:
    | Promise<Record<string, FieldObject[]> | undefined>
    | undefined;
  _hasJSActionsPromise: Promise<boolean> | undefined;
  _params;
  CMapReaderFactory;
  StandardFontDataFactory;

  destroyed = false;
  destroyCapability?: PromiseCap;
  _passwordCapability?: PromiseCap<{ password: string }>;

  #networkStream: IPDFStream | undefined;
  #fullReader?: IPDFStreamReader;
  #lastProgress?: OnProgressP;

  #docStats?: PDFDocumentStats;
  get stats() {
    return this.#docStats;
  }

  #pageCache = new Map<number, PDFPageProxy>();
  #pagePromises = new Map<number, Promise<PDFPageProxy>>();
  downloadInfoCapability = createPromiseCap<{ length: number }>();

  #numPages?: number;

  _htmlForXfa: XFAElObj | undefined;

  constructor(
    messageHandler: MessageHandler<Thread.main>,
    loadingTask: PDFDocumentLoadingTask,
    networkStream: IPDFStream | undefined,
    params: DocumentInitP,
  ) {
    this.messageHandler = messageHandler;
    this.loadingTask = loadingTask;
    this.fontLoader = new FontLoader({
      onUnsupportedFeature: this.#onUnsupportedFeature,
      ownerDocument: params.ownerDocument,
      styleElement: params.styleElement,
    });
    this._params = params;

    if (!params.useWorkerFetch) {
      this.CMapReaderFactory = new params.CMapReaderFactory!({
        baseUrl: params.cMapUrl,
        isCompressed: params.cMapPacked,
      });
      this.StandardFontDataFactory = new params.StandardFontDataFactory!({
        baseUrl: params.standardFontDataUrl,
      });
    }

    this.#networkStream = networkStream;

    this.setupMessageHandler();
  }

  get annotationStorage() {
    return shadow(this, "annotationStorage", new AnnotationStorage());
  }

  getRenderingIntent(
    intent: Intent,
    annotationMode = AnnotationMode.ENABLE,
    printAnnotationStorage: PrintAnnotationStorage | undefined = undefined,
    isOpList = false,
  ): _IntentArgs {
    let renderingIntent = RenderingIntentFlag.DISPLAY; // Default value.
    let annotationMap: AnnotStorageRecord | undefined;

    switch (intent) {
      case "any":
        renderingIntent = RenderingIntentFlag.ANY;
        break;
      case "display":
        break;
      case "print":
        renderingIntent = RenderingIntentFlag.PRINT;
        break;
      default:
        warn(`getRenderingIntent - invalid intent: ${intent}`);
    }

    switch (annotationMode) {
      case AnnotationMode.DISABLE:
        renderingIntent += RenderingIntentFlag.ANNOTATIONS_DISABLE;
        break;
      case AnnotationMode.ENABLE:
        break;
      case AnnotationMode.ENABLE_FORMS:
        renderingIntent += RenderingIntentFlag.ANNOTATIONS_FORMS;
        break;
      case AnnotationMode.ENABLE_STORAGE:
        renderingIntent += RenderingIntentFlag.ANNOTATIONS_STORAGE;

        const annotationStorage = renderingIntent & RenderingIntentFlag.PRINT &&
            printAnnotationStorage instanceof PrintAnnotationStorage
          ? printAnnotationStorage
          : this.annotationStorage;

        annotationMap = annotationStorage.serializable;
        break;
      default:
        warn(`getRenderingIntent - invalid annotationMode: ${annotationMode}`);
    }

    if (isOpList) {
      renderingIntent += RenderingIntentFlag.OPLIST;
    }

    return {
      renderingIntent,
      cacheKey: `${renderingIntent}_${
        AnnotationStorage.getHash(
          annotationMap,
        )
      }`,
      annotationStorageMap: annotationMap,
    };
  }

  destroy() {
    if (this.destroyCapability) {
      return this.destroyCapability.promise;
    }

    this.destroyed = true;
    this.destroyCapability = createPromiseCap();

    if (this._passwordCapability) {
      this._passwordCapability.reject(
        new Error("Worker was destroyed during onPassword callback"),
      );
    }

    const waitOn: Promise<any>[] = [];
    // We need to wait for all renderings to be completed, e.g.
    // timeout/rAF can take a long time.
    for (const page of this.#pageCache.values()) {
      waitOn.push(page._destroy());
    }
    this.#pageCache.clear();
    this.#pagePromises.clear();
    // Allow `AnnotationStorage`-related clean-up when destroying the document.
    if (Object.hasOwn(this, "annotationStorage")) {
      this.annotationStorage.resetModified();
    }
    // We also need to wait for the worker to finish its long running tasks.
    const terminated = this.messageHandler.sendWithPromise("Terminate", null);
    waitOn.push(terminated);

    Promise.all(waitOn).then(() => {
      this.commonObjs.clear();
      this.fontLoader.clear();
      this.#metadataPromise = undefined;
      this._getFieldObjectsPromise = undefined;
      this._hasJSActionsPromise = undefined;

      if (this.#networkStream) {
        this.#networkStream.cancelAllRequests(
          new AbortException("Worker was terminated."),
        );
      }

      if (this.messageHandler) {
        this.messageHandler.destroy();
        this.messageHandler = <any> null;
      }
      this.destroyCapability!.resolve();
    }, this.destroyCapability.reject);
    return this.destroyCapability.promise;
  }

  setupMessageHandler() {
    const { messageHandler, loadingTask } = this;

    messageHandler.on("GetReader", (data, sink) => {
      assert(
        this.#networkStream,
        "GetReader - no `IPDFStream` instance available.",
      );
      this.#fullReader = this.#networkStream!.getFullReader();
      this.#fullReader.onProgress = (evt) => {
        this.#lastProgress = {
          loaded: evt.loaded,
          total: evt.total,
        };
      };

      sink.onPull = () => {
        this.#fullReader!
          .read()
          .then(({ value, done }) => {
            if (done) {
              sink.close!();
              return;
            }
            assert(
              isArrayBuffer(value),
              "GetReader - expected an ArrayBuffer.",
            );
            // Enqueue data chunk into sink, and transfer it
            // to other side as `Transferable` object.
            sink.enqueue(new Uint8Array(value!), 1, [value!]);
          })
          .catch((reason) => {
            sink.error!(reason);
          });
      };

      sink.onCancel = (reason) => {
        this.#fullReader!.cancel(reason);

        sink.ready.catch((readyReason) => {
          if (this.destroyed) {
            // Ignore any pending requests if the worker was terminated.
            return;
          }
          throw readyReason;
        });
      };
    });

    messageHandler.on("ReaderHeadersReady", () => {
      const headersCapability = createPromiseCap<ReaderHeaders>();
      const fullReader = this.#fullReader!;
      fullReader.headersReady.then(() => {
        // If stream or range are disabled, it's our only way to report
        // loading progress.
        if (!fullReader.isStreamingSupported || !fullReader.isRangeSupported) {
          if (this.#lastProgress) {
            loadingTask.onProgress?.(this.#lastProgress);
          }
          fullReader.onProgress = (evt) => {
            loadingTask.onProgress?.({
              loaded: evt.loaded,
              total: evt.total,
            });
          };
        }

        headersCapability.resolve({
          isStreamingSupported: fullReader.isStreamingSupported,
          isRangeSupported: fullReader.isRangeSupported,
          contentLength: fullReader.contentLength,
        });
      }, headersCapability.reject);

      return headersCapability.promise;
    });

    messageHandler.on("GetRangeReader", (data, sink) => {
      assert(
        this.#networkStream,
        "GetRangeReader - no `IPDFStream` instance available.",
      );
      const rangeReader = this.#networkStream!.getRangeReader(
        data.begin,
        data.end,
      );

      // When streaming is enabled, it's possible that the data requested here
      // has already been fetched via the `_fullRequestReader` implementation.
      // However, given that the PDF data is loaded asynchronously on the
      // main-thread and then sent via `postMessage` to the worker-thread,
      // it may not have been available during parsing (hence the attempt to
      // use range requests here).
      //
      // To avoid wasting time and resources here, we'll thus *not* dispatch
      // range requests if the data was already loaded but has not been sent to
      // the worker-thread yet (which will happen via the `_fullRequestReader`).
      if (!rangeReader) {
        sink.close!();
        return;
      }

      sink.onPull = () => {
        rangeReader
          .read()
          .then(({ value, done }) => {
            if (done) {
              sink.close!();
              return;
            }
            assert(
              isArrayBuffer(value),
              "GetRangeReader - expected an ArrayBuffer.",
            );
            sink.enqueue(new Uint8Array(value!), 1, [value!]);
          })
          .catch((reason) => {
            sink.error!(reason);
          });
      };

      sink.onCancel = (reason) => {
        rangeReader.cancel(reason);

        sink.ready.catch((readyReason) => {
          if (this.destroyed) {
            // Ignore any pending requests if the worker was terminated.
            return;
          }
          throw readyReason;
        });
      };
    });

    messageHandler.on("GetDoc", ({ pdfInfo }) => {
      this.#numPages = pdfInfo.numPages;
      this._htmlForXfa = pdfInfo.htmlForXfa;
      delete (<any> pdfInfo).htmlForXfa;
      loadingTask._capability.resolve(new PDFDocumentProxy(pdfInfo, this));
    });

    messageHandler.on("DocException", (ex) => {
      let reason;
      switch (ex.name) {
        case "PasswordException":
          reason = new PasswordException(
            ex.message,
            (<PasswordException> ex).code,
          );
          break;
        case "InvalidPDFException":
          reason = new InvalidPDFException(ex.message);
          break;
        case "MissingPDFException":
          reason = new MissingPDFException(ex.message);
          break;
        case "UnexpectedResponseException":
          reason = new UnexpectedResponseException(
            ex.message,
            (<UnexpectedResponseException> ex).status,
          );
          break;
        case "UnknownErrorException":
          reason = new UnknownErrorException(
            ex.message,
            (<UnknownErrorException> ex).details,
          );
          break;
        default:
          assert(0, "DocException - expected a valid Error.");
      }
      loadingTask._capability.reject(reason);
    });

    messageHandler.on("PasswordRequest", (exception) => {
      this._passwordCapability = createPromiseCap<{ password: string }>();

      if (loadingTask.onPassword) {
        const updatePassword = (password: string | Error) => {
          if (password instanceof Error) {
            this._passwordCapability!.reject(password);
          } else {
            this._passwordCapability!.resolve({ password });
          }
        };
        try {
          loadingTask.onPassword(updatePassword, exception.code);
        } catch (ex) {
          this._passwordCapability.reject(ex);
        }
      } else {
        this._passwordCapability.reject(
          new PasswordException(exception.message, exception.code),
        );
      }
      return this._passwordCapability.promise;
    });

    messageHandler.on("DataLoaded", (data) => {
      // For consistency: Ensure that progress is always reported when the
      // entire PDF file has been loaded, regardless of how it was fetched.
      loadingTask.onProgress?.({
        loaded: data.length,
        total: data.length,
      });

      this.downloadInfoCapability.resolve(data);
    });

    messageHandler.on("StartRenderPage", (data) => {
      if (this.destroyed) {
        // Ignore any pending requests if the worker was terminated.
        return;
      }

      const page = this.#pageCache.get(data.pageIndex)!;
      page._startRenderPage(data.transparency, data.cacheKey);
    });

    messageHandler.on("commonobj", ([id, type, exportedData]) => {
      if (this.destroyed) {
        // Ignore any pending requests if the worker was terminated.
        return;
      }

      if (this.commonObjs.has(id)) {
        return;
      }

      switch (type) {
        case "Font":
          const params = this._params;

          if ("error" in exportedData!) {
            const exportedError = exportedData.error;
            warn(`Error during font loading: ${exportedError}`);
            this.commonObjs.resolve(id, exportedError);
            break;
          }

          let fontRegistry;
          if (params.pdfBug && globalThis.FontInspector?.enabled) {
            fontRegistry = {
              registerFont(font: FontFaceObject, url?: string) {
                (<any> globalThis).FontInspector.fontAdded(font, url);
              },
            };
          }
          const font = new FontFaceObject(<FontExpotDataEx> exportedData, {
            isEvalSupported: params.isEvalSupported,
            disableFontFace: params.disableFontFace,
            ignoreErrors: params.ignoreErrors,
            onUnsupportedFeature: this.#onUnsupportedFeature,
            fontRegistry,
          });

          this.fontLoader
            .bind(font)
            .catch((reason) => {
              return messageHandler.sendWithPromise("FontFallback", { id });
            })
            .finally(() => {
              if (!params.fontExtraProperties && font.data) {
                // Immediately release the `font.data` property once the font
                // has been attached to the DOM, since it's no longer needed,
                // rather than waiting for a `PDFDocumentProxy.cleanup` call.
                // Since `font.data` could be very large, e.g. in some cases
                // multiple megabytes, this will help reduce memory usage.
                font.data = undefined;
              }
              this.commonObjs.resolve(id, font);
            });
          break;
        case "FontPath":
        case "Image":
          this.commonObjs.resolve(id, <CmdArgs[] | ImgData> exportedData);
          break;
        default:
          throw new Error(`Got unknown common object type ${type}`);
      }
    });

    messageHandler.on("obj", ([id, pageIndex, type, imageData]) => {
      if (this.destroyed) {
        // Ignore any pending requests if the worker was terminated.
        return;
      }

      const pageProxy = this.#pageCache.get(pageIndex)!;
      if (pageProxy.objs.has(id)) {
        return;
      }

      switch (type) {
        case "Image":
          pageProxy.objs.resolve(id, imageData);

          // Heuristic that will allow us not to store large data.
          const MAX_IMAGE_SIZE_TO_STORE = 8000000;
          if (imageData) {
            let length;
            if (imageData.bitmap) {
              const { bitmap, width, height } = imageData;
              length = width! * height! * 4;
              pageProxy._bitmaps.add(bitmap);
            } else {
              length = imageData.data?.length || 0;
            }

            if (length > MAX_IMAGE_SIZE_TO_STORE) {
              pageProxy.cleanupAfterRender = true;
            }
          }
          break;
        case "Pattern":
          pageProxy.objs.resolve(id, imageData);
          break;
        default:
          throw new Error(`Got unknown object type ${type}`);
      }
    });

    messageHandler.on("DocProgress", (data) => {
      if (this.destroyed) {
        // Ignore any pending requests if the worker was terminated.
        return;
      }

      loadingTask.onProgress?.({
        loaded: data.loaded,
        total: data.total,
      });
    });

    messageHandler.on("DocStats", (data) => {
      if (this.destroyed) {
        // Ignore any pending requests if the worker was terminated.
        return;
      }
      // Ensure that a `PDFDocumentProxy.stats` call-site cannot accidentally
      // modify this internal data.
      this.#docStats = Object.freeze({
        streamTypes: Object.freeze(data.streamTypes),
        fontTypes: Object.freeze(data.fontTypes),
      });
    });

    messageHandler.on("UnsupportedFeature", this.#onUnsupportedFeature);

    messageHandler.on("FetchBuiltInCMap", (data) => {
      if (this.destroyed) {
        return Promise.reject<CMapData>(new Error("Worker was destroyed."));
      }
      if (!this.CMapReaderFactory) {
        return Promise.reject<CMapData>(
          new Error(
            "CMapReaderFactory not initialized, see the `useWorkerFetch` parameter.",
          ),
        );
      }
      return this.CMapReaderFactory.fetch(data);
    });

    messageHandler.on("FetchStandardFontData", (data) => {
      if (this.destroyed) {
        return Promise.reject<Uint8Array>(new Error("Worker was destroyed."));
      }
      if (!this.StandardFontDataFactory) {
        return Promise.reject<Uint8Array>(
          new Error(
            "StandardFontDataFactory not initialized, see the `useWorkerFetch` parameter.",
          ),
        );
      }
      return this.StandardFontDataFactory.fetch(data);
    });
  }

  #onUnsupportedFeature = (
    { featureId }: { featureId: UNSUPPORTED_FEATURES },
  ) => {
    if (this.destroyed) {
      // Ignore any pending requests if the worker was terminated.
      return;
    }
    this.loadingTask.onUnsupportedFeature?.(featureId);
  };

  getData() {
    return this.messageHandler.sendWithPromise("GetData", null);
  }

  saveDocument() {
    if (this.annotationStorage.size <= 0) {
      warn(
        "saveDocument called while `annotationStorage` is empty, " +
          "please use the getData-method instead.",
      );
    }
    return this.messageHandler
      .sendWithPromise("SaveDocument", {
        isPureXfa: !!this._htmlForXfa,
        numPages: this.#numPages!,
        annotationStorage: this.annotationStorage.serializable,
        filename: this.#fullReader?.filename ?? undefined,
      })
      .finally(() => {
        this.annotationStorage.resetModified();
      });
  }

  getPage(pageNumber: unknown) {
    if (
      !Number.isInteger(pageNumber) ||
      <number> pageNumber <= 0 ||
      <number> pageNumber > this.#numPages!
    ) {
      return Promise.reject(new Error("Invalid page request."));
    }

    const pageIndex = <number> pageNumber - 1,
      cachedPromise = this.#pagePromises.get(pageIndex);
    if (cachedPromise) return cachedPromise;

    const promise = this.messageHandler
      .sendWithPromise("GetPage", {
        pageIndex,
      })
      .then((pageInfo) => {
        if (this.destroyed) {
          throw new Error("Transport destroyed");
        }
        const page = new PDFPageProxy(
          pageIndex,
          pageInfo,
          this,
          this._params.ownerDocument,
          this._params.pdfBug,
        );
        this.#pageCache.set(pageIndex, page);
        return page;
      });
    this.#pagePromises.set(pageIndex, promise);
    return promise;
  }

  getPageIndex(ref: RefProxy) {
    if (
      typeof ref !== "object" ||
      ref === null ||
      !Number.isInteger(ref.num) ||
      ref.num < 0 ||
      !Number.isInteger(ref.gen) ||
      ref.gen < 0
    ) {
      return Promise.reject(new Error("Invalid pageIndex request."));
    }
    return this.messageHandler.sendWithPromise("GetPageIndex", {
      num: ref.num,
      gen: ref.gen,
    });
  }

  getAnnotations(pageIndex: number, intent: RenderingIntentFlag) {
    return this.messageHandler.sendWithPromise("GetAnnotations", {
      pageIndex,
      intent,
    });
  }

  getFieldObjects() {
    return (this._getFieldObjectsPromise ||= this.messageHandler
      .sendWithPromise("GetFieldObjects", null));
  }

  hasJSActions() {
    return (this._hasJSActionsPromise ||= this.messageHandler.sendWithPromise(
      "HasJSActions",
      null,
    ));
  }

  getCalculationOrderIds() {
    return this.messageHandler.sendWithPromise("GetCalculationOrderIds", null);
  }

  getDestinations() {
    return this.messageHandler.sendWithPromise("GetDestinations", null);
  }

  getDestination(id: string) {
    return this.messageHandler.sendWithPromise("GetDestination", { id });
  }

  getPageLabels() {
    return this.messageHandler.sendWithPromise("GetPageLabels", null);
  }

  getPageLayout() {
    return this.messageHandler.sendWithPromise("GetPageLayout", null);
  }

  getPageMode() {
    return this.messageHandler.sendWithPromise("GetPageMode", null);
  }

  getViewerPreferences() {
    return this.messageHandler.sendWithPromise("GetViewerPreferences", null);
  }

  getOpenAction() {
    return this.messageHandler.sendWithPromise("GetOpenAction", null);
  }

  getAttachments() {
    return this.messageHandler.sendWithPromise("GetAttachments", null);
  }

  getJavaScript() {
    return this.messageHandler.sendWithPromise("GetJavaScript", null);
  }

  getDocJSActions() {
    return this.messageHandler.sendWithPromise("GetDocJSActions", null);
  }

  getPageJSActions(pageIndex: number) {
    return this.messageHandler.sendWithPromise("GetPageJSActions", {
      pageIndex,
    });
  }

  getStructTree(pageIndex: number) {
    return this.messageHandler.sendWithPromise("GetStructTree", {
      pageIndex,
    });
  }

  getOutline() {
    return this.messageHandler.sendWithPromise("GetOutline", null);
  }

  getOptionalContentConfig() {
    return this.messageHandler
      .sendWithPromise("GetOptionalContentConfig", null)
      .then((results) => {
        return new OptionalContentConfig(results);
      });
  }

  getPermissions() {
    return this.messageHandler.sendWithPromise("GetPermissions", null);
  }

  getMetadata() {
    return (this.#metadataPromise ||= this.messageHandler
      .sendWithPromise("GetMetadata", null)
      .then((results) => {
        return {
          info: results[0],
          metadata: results[1] ? new Metadata(results[1]) : undefined,
          contentDispositionFilename: this.#fullReader?.filename ?? undefined,
          contentLength: this.#fullReader?.contentLength ?? undefined,
        };
      }));
  }

  getMarkInfo() {
    return this.messageHandler.sendWithPromise("GetMarkInfo", null);
  }

  async startCleanup(keepLoadedFonts = false) {
    await this.messageHandler.sendWithPromise("Cleanup", null);

    // No need to manually clean-up when destruction has started.
    if (this.destroyed) return;

    for (const page of this.#pageCache.values()) {
      const cleanupSuccessful = page.cleanup();

      if (!cleanupSuccessful) {
        throw new Error(
          `startCleanup: Page ${page.pageNumber} is currently rendering.`,
        );
      }
    }
    this.commonObjs.clear();
    if (!keepLoadedFonts) {
      this.fontLoader.clear();
    }
    this.#metadataPromise = undefined;
    this._getFieldObjectsPromise = undefined;
    this._hasJSActionsPromise = undefined;
  }

  get loadingParams() {
    const params = this._params;
    return shadow(this, "loadingParams", {
      disableAutoFetch: params.disableAutoFetch,
      enableXfa: params.enableXfa,
    });
  }
}

interface Objs_<T> {
  capability: PromiseCap<T | undefined>;
  data: T | undefined;
  // resolved:boolean;
}

/**
 * A PDF document and page is built of many objects. E.g. there are objects for
 * fonts, images, rendering code, etc. These objects may get processed inside of
 * a worker. This class implements some basic methods to manage these objects.
 */
export class PDFObjects<T> {
  #objs: Record<string, Objs_<T>> = Object.create(null);

  /**
   * Ensures there is an object defined for `objId`.
   */
  #ensureObj(objId: string) {
    const obj = this.#objs[objId];
    if (obj) return obj;

    return (this.#objs[objId] = {
      capability: createPromiseCap(),
      data: undefined,
    });
  }

  /**
   * If called *without* callback, this returns the data of `objId` but the
   * object needs to be resolved. If it isn't, this method throws.
   *
   * If called *with* a callback, the callback is called with the data of the
   * object once the object is resolved. That means, if you call this method
   * and the object is already resolved, the callback gets called right away.
   */
  get(objId: string, callback?: (value?: unknown) => void) {
    // If there is a callback, then the get can be async and the object is
    // not required to be resolved right now.
    if (callback) {
      const obj = this.#ensureObj(objId);
      obj.capability.promise.then(() => callback(obj.data));
      return undefined;
    }
    // If there isn't a callback, the user expects to get the resolved data
    // directly.
    const obj = this.#objs[objId];
    // If there isn't an object yet or the object isn't resolved, then the
    // data isn't ready yet!
    if (!obj?.capability.settled) {
      throw new Error(`Requesting object that isn't resolved yet ${objId}.`);
    }
    return obj.data;
  }

  has(objId: string) {
    const obj = this.#objs[objId];
    return obj?.capability.settled || false;
  }

  /**
   * Resolves the object `objId` with optional `data`.
   */
  resolve(objId: string, data: T | undefined = undefined) {
    const obj = this.#ensureObj(objId);

    obj.data = data;
    obj.capability.resolve(undefined);
  }

  clear() {
    this.#objs = Object.create(null);
  }
}

/**
 * Allows controlling of the rendering tasks.
 */
export class RenderTask {
  #internalRenderTask;

  /**
   * Callback for incremental rendering -- a function that will be called
   * each time the rendering is paused.  To continue rendering call the
   * function that is the first argument to the callback.
   */
  onContinue?: (cont: () => void) => void;

  constructor(internalRenderTask: InternalRenderTask) {
    this.#internalRenderTask = internalRenderTask;
  }

  /**
   * Promise for rendering task completion.
   */
  get promise(): Promise<void> {
    return this.#internalRenderTask.capability.promise;
  }

  /**
   * Cancels the rendering task. If the task is currently rendering it will
   * not be cancelled until graphics pauses with a timeout. The promise that
   * this object extends will be rejected when cancelled.
   */
  cancel() {
    this.#internalRenderTask.cancel();
  }

  /**
   * Whether form fields are rendered separately from the main operatorList.
   */
  get separateAnnots(): boolean {
    const { separateAnnots } = this.#internalRenderTask.operatorList;
    if (!separateAnnots) {
      return false;
    }
    const { annotationCanvasMap } = this.#internalRenderTask;
    return (
      separateAnnots.form ||
      (separateAnnots.canvas && (<any> annotationCanvasMap?.size) > 0)
    );
  }
}

interface _IRTCtorP_paraams {
  canvasContext: CanvasRenderingContext2D;
  viewport: PageViewport;
  transform: matrix_t | undefined;
  background: string | CanvasGradient | CanvasPattern | undefined;
}

interface _InternalRenderTaskCtorP {
  callback: (error?: unknown) => void;
  params: _IRTCtorP_paraams;
  objs: PDFObjects<PDFObjs | undefined>;
  commonObjs: PDFObjects<PDFCommonObjs>;
  annotationCanvasMap: Map<string, HTMLCanvasElement> | undefined;
  operatorList: OpListIR;
  pageIndex: number;
  canvasFactory: BaseCanvasFactory;
  useRequestAnimationFrame?: boolean;
  pdfBug?: boolean;
  pageColors: PageColors | undefined;
}

interface _InitializeGraphicsP {
  transparency?: boolean;
  optionalContentConfig: OptionalContentConfig | undefined;
}

/**
 * For internal use only.
 * @ignore
 */
export class InternalRenderTask {
  static #canvasInUse = new WeakSet<HTMLCanvasElement>();

  callback;
  params;
  objs;
  commonObjs;
  annotationCanvasMap;
  operatorListIdx?: number;
  operatorList: OpListIR;
  _pageIndex;
  canvasFactory;
  _pdfBug;
  pageColors;

  running = false;
  graphicsReadyCallback?: () => void;
  graphicsReady = false;
  _useRequestAnimationFrame;
  cancelled = false;
  capability = createPromiseCap();
  task;
  _canvas;

  stepper?: Stepper;

  gfx?: CanvasGraphics;

  constructor({
    callback,
    params,
    objs,
    commonObjs,
    annotationCanvasMap,
    operatorList,
    pageIndex,
    canvasFactory,
    useRequestAnimationFrame = false,
    pdfBug = false,
    pageColors = undefined,
  }: _InternalRenderTaskCtorP) {
    this.callback = callback;
    this.params = params;
    this.objs = objs;
    this.commonObjs = commonObjs;
    this.annotationCanvasMap = annotationCanvasMap;
    this.operatorList = operatorList;
    this._pageIndex = pageIndex;
    this.canvasFactory = canvasFactory;
    this._pdfBug = pdfBug;
    this.pageColors = pageColors;

    this._useRequestAnimationFrame = useRequestAnimationFrame === true &&
      typeof window !== "undefined";
    this.task = new RenderTask(this);
    this._canvas = params.canvasContext.canvas;
  }

  get completed() {
    return this.capability.promise.catch(() => {
      // Ignoring errors, since we only want to know when rendering is
      // no longer pending.
    });
  }

  initializeGraphics(
    { transparency = false, optionalContentConfig }: _InitializeGraphicsP,
  ) {
    if (this.cancelled) {
      return;
    }
    if (this._canvas) {
      if (InternalRenderTask.#canvasInUse.has(this._canvas)) {
        throw new Error(
          "Cannot use the same canvas during multiple render() operations. " +
            "Use different canvas or ensure previous operations were " +
            "cancelled or completed.",
        );
      }
      InternalRenderTask.#canvasInUse.add(this._canvas);
    }

    if (this._pdfBug && globalThis.StepperManager?.enabled) {
      this.stepper = globalThis.StepperManager.create(this._pageIndex);
      this.stepper.init(this.operatorList);
      this.stepper.nextBreakPoint = this.stepper.getNextBreakPoint();
    }
    const { canvasContext, viewport, transform, background } = this.params;

    this.gfx = new CanvasGraphics(
      canvasContext,
      this.commonObjs,
      this.objs,
      this.canvasFactory,
      optionalContentConfig,
      this.annotationCanvasMap,
      this.pageColors,
    );
    this.gfx.beginDrawing({
      transform,
      viewport,
      transparency,
      background,
    });
    this.operatorListIdx = 0;
    this.graphicsReady = true;
    this.graphicsReadyCallback?.();
  }

  cancel = (error: any = null) => {
    this.running = false;
    this.cancelled = true;
    this.gfx?.endDrawing();

    if (this._canvas) {
      InternalRenderTask.#canvasInUse.delete(this._canvas);
    }
    this.callback(
      error ||
        new RenderingCancelledException(
          `Rendering cancelled, page ${this._pageIndex + 1}`,
          "canvas",
        ),
    );
  };

  operatorListChanged() {
    if (!this.graphicsReady) {
      if (!this.graphicsReadyCallback) {
        this.graphicsReadyCallback = this._continue;
      }
      return;
    }
    this.stepper?.updateOperatorList(this.operatorList);

    if (this.running) {
      return;
    }
    this._continue();
  }

  _continue = () => {
    this.running = true;
    if (this.cancelled) {
      return;
    }
    if (this.task.onContinue) {
      this.task.onContinue(this._scheduleNext);
    } else {
      this._scheduleNext();
    }
  };

  _scheduleNext = () => {
    if (this._useRequestAnimationFrame) {
      globalThis.requestAnimationFrame(() => {
        this._next().catch(this.cancel);
      });
    } else {
      Promise.resolve().then(this._next).catch(this.cancel);
    }
  };

  _next = async () => {
    if (this.cancelled) {
      return;
    }
    this.operatorListIdx = this.gfx!.executeOperatorList(
      this.operatorList,
      this.operatorListIdx,
      this._continue,
      this.stepper,
    );
    if (this.operatorListIdx === this.operatorList.argsArray.length) {
      this.running = false;
      if (this.operatorList.lastChunk) {
        this.gfx!.endDrawing();
        if (this._canvas) {
          InternalRenderTask.#canvasInUse.delete(this._canvas);
        }
        this.callback();
      }
    }
  };
}

export const version = 0;
export const build = 0;

// export const version:string =
//   typeof PDFJSDev !== "undefined" ? PDFJSDev.eval("BUNDLE_VERSION") : null;
// export const build:string =
//   typeof PDFJSDev !== "undefined" ? PDFJSDev.eval("BUNDLE_BUILD") : null;
/*80--------------------------------------------------------------------------*/
