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

/**
 * @module pdfjsLib
 */

import { isObjectLike } from "../../../lib/jslang.js";
import { TypedArray } from "../../../lib/alias.js";
import { assert } from "../../../lib/util/trace.js";
import {
  AbortException,
  AnnotationMode,
  createPromiseCapability,
  FontType,
  getVerbosityLevel,
  info,
  InvalidPDFException,
  isArrayBuffer,
  isSameOrigin,
  matrix_t,
  MissingPDFException,
  PasswordException,
  PasswordResponses,
  PromiseCapability,
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
} from "../shared/util.js";
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
} from "./display_utils.js";
import { FontFaceObject, FontLoader } from "./font_loader.js";
import { AnnotationStorage } from "./annotation_storage.js";
import { CanvasGraphics } from "./canvas.js";
import { GlobalWorkerOptions } from "./worker_options.js";
import { 
  Thread, 
  ActionSinkchunk, 
  MessageHandler, 
  PageInfo, 
  PDFInfo, 
  ReaderHeaders 
} from "../shared/message_handler.js";
import { Metadata } from "./metadata.js";
import { OptionalContentConfig } from "./optional_content_config.js";
import { PDFDataTransportStream } from "./transport_stream.js";
import { IPDFStream, IPDFStreamReader } from "../interfaces.js";
import { Ref } from "../core/primitives.js";
import { ImgData } from "../core/evaluator.js";
import { FontExpotDataEx } from "../core/fonts.js";
import { CmdArgs } from "../core/font_renderer.js";
import { OpListIR } from "../core/operator_list.js";
import { ExplicitDest } from "../core/catalog.js";
import { IWorker, WorkerMessageHandler } from "../core/worker.js";
import { AnnotationData, FieldObject } from "../core/annotation.js";
import { StructTree } from "../core/struct_tree.js";
import { XFAData } from "../core/document.js"
import { AnnotActions } from "../core/core_utils.js";
import { BaseCanvasFactory, CMapData } from "./base_factory.js";
import { XFAElObj } from "../core/xfa/alias.js";
import { ShadingPatternIR } from "../core/pattern.js";
import { XfaText } from "./xfa_text.js";
/*81---------------------------------------------------------------------------*/

const DEFAULT_RANGE_CHUNK_SIZE = 65536; // 2^16 = 65536
const RENDERING_CANCELLED_TIMEOUT = 100; // ms

/* #if TESTING */export /* #endif */const DefaultCanvasFactory = 
  DOMCanvasFactory;
  // (typeof PDFJSDev === "undefined" || PDFJSDev.test("GENERIC")) && isNodeJS
  //   ? NodeCanvasFactory
  //   : DOMCanvasFactory;
/* #if TESTING */export /* #endif */const DefaultCMapReaderFactory =
  DOMCMapReaderFactory;
  // (typeof PDFJSDev === "undefined" || PDFJSDev.test("GENERIC")) && isNodeJS
  //   ? NodeCMapReaderFactory
  //   : DOMCMapReaderFactory;
/* #if TESTING */export /* #endif */const DefaultStandardFontDataFactory =
  DOMStandardFontDataFactory;
  // (typeof PDFJSDev === "undefined" || PDFJSDev.test("GENERIC")) && isNodeJS
  //   ? NodeStandardFontDataFactory
  //   : DOMStandardFontDataFactory;

/**
 * @param params - The document initialization
 *   parameters. The "url" key is always present.
 * @return A promise, which is resolved with an instance of
 *   {IPDFStream}.
 * @ignore
 */
type IPDFStreamFactory = ( params:DocumentInitParms ) => Promise< IPDFStream >;

/**
 * @private
 */
let createPDFNetworkStream:IPDFStreamFactory;

/**
 * Sets the function that instantiates an {IPDFStream} as an alternative PDF
 * data transport.
 *
 * @param pdfNetworkStreamFactory - The factory function
 *   that takes document initialization parameters (including a "url") and
 *   returns a promise which is resolved with an instance of {IPDFStream}.
 * @ignore
 */
export function setPDFNetworkStreamFactory( pdfNetworkStreamFactory:IPDFStreamFactory ) 
{
  createPDFNetworkStream = pdfNetworkStreamFactory;
}

export interface RefProxy
{
  num:number;
  gen:number;
}

/**
 * Document initialization / loading parameters object.
 */
export interface DocumentInitParms {
  /**
   * The URL of the PDF.
   */
  url:string | URL | undefined;

  /** 
   * Binary PDF data. Use
   * typed arrays (Uint8Array) to improve the memory usage. If PDF data is
   * BASE64-encoded, use `atob()` to convert it to a binary string first.
   */
  data?:Uint8Array | number[];

  /**
   * Basic authentication headers.
   */
  httpHeaders:Record< string, string > | undefined;

  /**
   * Indicates whether or not
   * cross-site Access-Control requests should be made using credentials such
   * as cookies or authorization headers. The default is `false`.
   */
  withCredentials:boolean | undefined;

  /**
   * For decrypting password-protected PDFs.
   */
  password?:string;

  /**
   * A typed array with the first portion
   * or all of the pdf data. Used by the extension since some data is already
   * loaded before the switch to range requests.
   */
  initialData?:TypedArray;

  /**
   * The PDF file length. It's used for progress
   * reports and range requests operations.
   */
  length:number | undefined;
  
  /**
   * Allows for using a custom range
   * transport implementation.
   */
  range?:PDFDataRangeTransport;

  /**
   * Specify maximum number of bytes fetched
   * per range request. The default value is {@link DEFAULT_RANGE_CHUNK_SIZE}.
   */
  rangeChunkSize:number | undefined;

  /**
   * The worker that will be used for loading and
   * parsing the PDF data.
   */
  worker?:PDFWorker;

  /**
   * Controls the logging level; the constants
   * from {@link VerbosityLevel} should be used.
   */
  verbosity?:VerbosityLevel;

  /**
   * The base URL of the document, used when
   * attempting to recover valid absolute URLs for annotations, and outline
   * items, that (incorrectly) only specify relative URLs.
   */
  docBaseUrl?:string | undefined;

  /**
   * The URL where the predefined Adobe CMaps are
   * located. Include the trailing slash.
   */
  cMapUrl?:string;

  /**
   * Specifies if the Adobe CMaps are binary
   * packed or not.
   */
  cMapPacked?:boolean;

  /**
   * The factory that will be used when
   * reading built-in CMap files. Providing a custom factory is useful for
   * environments without Fetch API or `XMLHttpRequest` support, such as
   * Node.js. The default value is {DOMCMapReaderFactory}.
   */
  CMapReaderFactory?:typeof DefaultCMapReaderFactory;

  /**
   * When `true`, fonts that aren't
   * embedded in the PDF document will fallback to a system font.
   * The default value is `true` in web environments and `false` in Node.js;
   * unless `disableFontFace === true` in which case this defaults to `false`
   * regardless of the environment (to prevent completely broken fonts).
   */
  useSystemFonts?:boolean;

  /**
   * The URL where the standard font
   * files are located. Include the trailing slash.
   */
  standardFontDataUrl?:string;

  /**
   * The factory that will be used
   * when reading the standard font files. Providing a custom factory is useful
   * for environments without Fetch API or `XMLHttpRequest` support, such as
   * Node.js. The default value is {DOMStandardFontDataFactory}.
   */
  StandardFontDataFactory?:typeof DOMStandardFontDataFactory;

  /**
   * Enable using the Fetch API in the
   * worker-thread when reading CMap and standard font files. When `true`,
   * the `CMapReaderFactory` and `StandardFontDataFactory` options are ignored.
   * The default value is `true` in web environments and `false` in Node.js.
   */
  useWorkerFetch?:boolean;

  /**
   * Reject certain promises, e.g.
   * `getOperatorList`, `getTextContent`, and `RenderTask`, when the associated
   * PDF data cannot be successfully parsed, instead of attempting to recover
   * whatever possible of the data. The default value is `false`.
   */
  stopAtErrors?:boolean;

  ignoreErrors?:boolean;

  /**
   * The maximum allowed image size in total
   * pixels, i.e. width * height. Images above this value will not be rendered.
   * Use -1 for no limit, which is also the default value.
   */
  maxImageSize?:number;

  /**
   * Determines if we can evaluate strings
   * as JavaScript. Primarily used to improve performance of font rendering, and
   * when parsing PDF functions. The default value is `true`.
   */
  isEvalSupported?:boolean;

  /**
   * By default fonts are converted to
   * OpenType fonts and loaded via the Font Loading API or `@font-face` rules.
   * If disabled, fonts will be rendered using a built-in font renderer that
   * constructs the glyphs with primitive path commands.
   * The default value is `false` in web environments and `true` in Node.js.
   */
  disableFontFace?:boolean;

  /**
   * Include additional properties,
   * which are unused during rendering of PDF documents, when exporting the
   * parsed font data from the worker-thread. This may be useful for debugging
   * purposes (and backwards compatibility), but note that it will lead to
   * increased memory usage. The default value is `false`.
   */
  fontExtraProperties?:boolean;

  /**
   * Render Xfa forms if any.
   * The default value is `false`.
   */
  enableXfa?:boolean;

  /**
   * Specify an explicit document
   * context to create elements with and to load resources, such as fonts,
   * into. Defaults to the current document.
   */
  ownerDocument?:Document;

  /**
   * For testing only.
   */
  styleElement?:HTMLStyleElement;

  /**
   * Disable range request loading of PDF
   * files. When enabled, and if the server supports partial content requests,
   * then the PDF will be fetched in chunks. The default value is `false`.
   */
  disableRange:boolean | undefined;

  /**
   * Disable streaming of PDF file data.
   * By default PDF.js attempts to load PDF files in chunks. The default value
   * is `false`.
   */
  disableStream:boolean | undefined;

  /**
   * Disable pre-fetching of PDF file
   * data. When range requests are enabled PDF.js will automatically keep
   * fetching more data even if it isn't needed to display the current page.
   * The default value is `false`.
   *
   * NOTE: It is also necessary to disable streaming, see above, in order for
   * disabling of pre-fetching to work correctly.
   */
  disableAutoFetch?:boolean;

  // /**
  //  * Enables special hooks for debugging PDF.js
  //  * (see `web/debugger.js`). The default value is `false`.
  //  */
  // pdfBug?:boolean;

  progressiveDone?:boolean;

  contentDispositionFilename?:string | undefined;
}

/**
 * This is the main entry point for loading a PDF and interacting with it.
 *
 * NOTE: If a URL is used to fetch the PDF data a standard Fetch API call (or
 * XHR as fallback) is used, which means it must follow same origin rules,
 * e.g. no cross-domain requests without CORS.
 *
 * @param src
 *   src - Can be a URL where a PDF file is located, a typed array (Uint8Array)
 *         already populated with data, or a parameter object.
 */
export function getDocument( 
  src:string | URL | TypedArray | DocumentInitParms | PDFDataRangeTransport 
):PDFDocumentLoadingTask {
  const task = new PDFDocumentLoadingTask();

  let source;
  if( typeof src === "string" || src instanceof URL )
  {
    source = { url: src };
  } 
  else if( isArrayBuffer(src) )
  {
    source = { data: src };
  } 
  else if( src instanceof PDFDataRangeTransport )
  {
    source = { range: src };
  } 
  else {
    if (typeof src !== "object") {
      throw new Error(
        "Invalid parameter in getDocument, " +
          "need either string, URL, Uint8Array, or parameter object."
      );
    }
    if( !(<any>src).url && !(<any>src).data && !(<any>src).range ) 
    {
      throw new Error(
        "Invalid parameter object: need either .data, .range or .url"
      );
    }
    source = src;
  }
  const params:DocumentInitParms = Object.create(null);
  let rangeTransport:PDFDataRangeTransport | undefined;
  let worker:PDFWorker | undefined;

  for( const key in source )
  {
    const value = (<any>source)[key];

    switch( key )
    {
      case "url":
        if (typeof window !== "undefined") 
        {
          try {
            // The full path is required in the 'url' field.
            params[key] = new URL( value, window.location.toString() ).href;
            continue;
          } catch (ex) {
            warn(`Cannot create valid URL: "${ex}".`);
          }
        }
        else if (typeof value === "string" || value instanceof URL)
        {
          params[key] = value.toString(); // Support Node.js environments.
          continue;
        }
        throw new Error(
          "Invalid PDF url data: " +
          "either string or URL-object is expected in the url property."
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
        if (value instanceof Uint8Array) 
        {
          break; // Use the data as-is when it's already a Uint8Array.
        }
        else if(typeof value === "string") 
        {
          params[key] = stringToBytes(value);
        }
        else if( isObjectLike(value) && !isNaN((<any>value).length) )
        {
          params[key] = new Uint8Array( <any>value );
        }
        else if (isArrayBuffer(value)) 
        {
          params[key] = new Uint8Array(value);
        }
        else {
          throw new Error(
            "Invalid PDF binary data: either typed array, " +
              "string, or array-like object is expected in the data property."
          );
        }
        continue;
    }
    (<any>params)[key] = value;
  }

  params.rangeChunkSize = params.rangeChunkSize || DEFAULT_RANGE_CHUNK_SIZE;
  params.CMapReaderFactory =
    params.CMapReaderFactory || DefaultCMapReaderFactory;
  params.StandardFontDataFactory =
    params.StandardFontDataFactory || DefaultStandardFontDataFactory;
  params.ignoreErrors = params.stopAtErrors !== true;
  params.fontExtraProperties = params.fontExtraProperties === true;
  // params.pdfBug = params.pdfBug === true;
  params.enableXfa = params.enableXfa === true;

  if( typeof params.docBaseUrl !== "string"
   || isDataScheme(params.docBaseUrl)
  ) {
    // Ignore "data:"-URLs, since they can't be used to recover valid absolute
    // URLs anyway. We want to avoid sending them to the worker-thread, since
    // they contain the *entire* PDF document and can thus be arbitrarily long.
    params.docBaseUrl = undefined;
  }
  if (!Number.isInteger(params.maxImageSize)) 
  {
    params.maxImageSize = -1;
  }
  if( typeof params.useWorkerFetch !== "boolean" )
  {
    params.useWorkerFetch =
      params.CMapReaderFactory === DOMCMapReaderFactory &&
      params.StandardFontDataFactory === DOMStandardFontDataFactory;
  }
  if (typeof params.isEvalSupported !== "boolean") 
  {
    params.isEvalSupported = true;
  }
  if( typeof params.disableFontFace !== "boolean" )
  {
    params.disableFontFace =
      false;
      // (typeof PDFJSDev === "undefined" || PDFJSDev.test("GENERIC")) && isNodeJS;
  }
  if( typeof params.useSystemFonts !== "boolean" )
  {
    params.useSystemFonts =
      !params.disableFontFace;
      // !(
      //   (typeof PDFJSDev === "undefined" || PDFJSDev.test("GENERIC")) &&
      //   isNodeJS
      // ) && !params.disableFontFace;
  }
  if (typeof params.ownerDocument === "undefined") 
  {
    params.ownerDocument = globalThis.document;
  }

  if (typeof params.disableRange !== "boolean") 
  {
    params.disableRange = false;
  }
  if (typeof params.disableStream !== "boolean") 
  {
    params.disableStream = false;
  }
  if (typeof params.disableAutoFetch !== "boolean") 
  {
    params.disableAutoFetch = false;
  }

  // Set the main-thread verbosity level.
  setVerbosityLevel( params.verbosity! );

  if( !worker ) 
  {
    const workerParms:PDFWorkerParms = {
      verbosity: params.verbosity,
      port: GlobalWorkerOptions.workerPort,
    };
    // Worker was not provided -- creating and owning our own. If message port
    // is specified in global worker options, using it.
    worker = workerParms.port
      ? PDFWorker.fromPort( workerParms )
      : new PDFWorker( workerParms );
    task._worker = worker!;
  }
  const docId = task.docId;
  worker.promise
    .then( () => {
      if (task.destroyed) 
      {
        throw new Error("Loading aborted");
      }

      const workerIdPromise = _fetchDocument(
        worker!,
        params,
        docId,
        rangeTransport,
      );
      const networkStreamPromise = new Promise<IPDFStream | undefined>( 
        resolve => {
          let networkStream:PDFDataTransportStream | Promise<IPDFStream> | undefined;
          if( rangeTransport ) 
          {
            networkStream = new PDFDataTransportStream(
              {
                length: params.length!,
                initialData: params.initialData,
                progressiveDone: params.progressiveDone,
                contentDispositionFilename: params.contentDispositionFilename,
                disableRange: params.disableRange,
                disableStream: params.disableStream,
              },
              rangeTransport
            );
          } 
          else if ( !params.data )
          {
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
          resolve( networkStream );
        }
      );

      return Promise.all([ workerIdPromise, networkStreamPromise ]).then(
        ([workerId, networkStream]) => {
          if (task.destroyed) 
          {
            throw new Error("Loading aborted");
          }

          const messageHandler = new MessageHandler<Thread.main>(
            docId,
            workerId,
            worker!.port
          );
          messageHandler.postMessageTransfers = worker!.postMessageTransfers;
          const transport = new WorkerTransport(
            messageHandler,
            task,
            networkStream,
            params
          );
          task._transport = transport;
          messageHandler.send("Ready", null);
        }
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
async function _fetchDocument( worker:PDFWorker, source:DocumentInitParms, 
  docId:string, pdfDataRangeTransport?:PDFDataRangeTransport 
):Promise<string> {
  if( worker.destroyed ) throw new Error("Worker was destroyed");

  if (pdfDataRangeTransport) 
  {
    source.length = pdfDataRangeTransport.length;
    source.initialData = pdfDataRangeTransport.initialData;
    source.progressiveDone = pdfDataRangeTransport.progressiveDone;
    source.contentDispositionFilename =
      pdfDataRangeTransport.contentDispositionFilename;
  }
  const workerId = await worker.messageHandler!.sendWithPromise(
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
      postMessageTransfers: worker.postMessageTransfers,
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
    }
  )

  if (worker.destroyed) 
  {
    throw new Error("Worker was destroyed");
  }
  return workerId;
}

/**
 * The loading task controls the operations required to load a PDF document
 * (such as network requests) and provides a way to listen for completion,
 * after which individual pages can be rendered.
 */
export class PDFDocumentLoadingTask 
{
  static get idCounters() 
  {
    return shadow(this, "idCounters", { doc: 0 });
  }

  _capability = createPromiseCapability<PDFDocumentProxy>();
  _transport:WorkerTransport | undefined;
  _worker:PDFWorker | undefined;

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
  onPassword?:(
    updateCallback:( password:string ) => void, 
    reason:PasswordResponses
  ) => void;

  /**
   * Callback to be able to monitor the loading progress of the PDF file
   * (necessary to implement e.g. a loading bar).
   * The callback receives an {@link OnProgressParms} argument.
   */
  onProgress?:( _:OnProgressParms ) => void;

  /**
   * Callback for when an unsupported feature is used in the PDF document.
   * The callback receives an {@link UNSUPPORTED_FEATURES} argument.
   */
  onUnsupportedFeature?:( featureId?:UNSUPPORTED_FEATURES ) => void

  constructor() 
  {
    this.docId = `d${PDFDocumentLoadingTask.idCounters.doc++}`;
  }

  /**
   * Promise for document loading task completion.
   */
  get promise():Promise< PDFDocumentProxy >
  {
    return this._capability.promise;
  }

  /**
   * Abort all network requests and destroy the worker.
   * @return A promise that is resolved when destruction is completed.
   */
  async destroy()
  {
    this.destroyed = true;
    await this._transport?.destroy();

    this._transport = undefined;
    if (this._worker) 
    {
      this._worker.destroy();
      this._worker = undefined;
    }
  }
}

type RangeListener = ( begin:number, chunk:ArrayBufferLike ) => void;
type ProgressListener = ( loaded:number, total:number ) => void;
type ProgressiveReadListener = ( chunk:ArrayBufferLike ) => void;
type ProgressiveDoneListener = () => void;

/**
 * Abstract class to support range requests file loading.
 */
export abstract class PDFDataRangeTransport 
{
  #rangeListeners:RangeListener[] = [];
  addRangeListener( listener:RangeListener ) { this.#rangeListeners.push(listener); }

  #progressListeners:ProgressListener[] = [];
  addProgressListener( listener:ProgressListener ) { this.#progressListeners.push(listener); }

  #progressiveReadListeners:ProgressiveReadListener[] = [];
  addProgressiveReadListener( listener:ProgressiveReadListener ) { this.#progressiveReadListeners.push(listener); }

  #progressiveDoneListeners:ProgressiveDoneListener[] = [];
  addProgressiveDoneListener( listener:ProgressiveDoneListener ) { this.#progressiveDoneListeners.push(listener); }

  #readyCapability = createPromiseCapability();

  constructor( 
    public length:number, 
    public initialData:Uint8Array, 
    public progressiveDone=false,
    public contentDispositionFilename?:string
  ) {}

  onDataRange( begin:number, chunk:ArrayBufferLike )
  {
    for (const listener of this.#rangeListeners) {
      listener(begin, chunk);
    }
  }

  onDataProgress( loaded:number, total:number ) 
  {
    this.#readyCapability.promise.then(() => {
      for (const listener of this.#progressListeners) 
      {
        listener(loaded, total);
      }
    });
  }

  onDataProgressiveRead( chunk:ArrayBufferLike ) 
  {
    this.#readyCapability.promise.then(() => {
      for (const listener of this.#progressiveReadListeners) {
        listener(chunk);
      }
    });
  }

  onDataProgressiveDone() {
    this.#readyCapability.promise.then(() => {
      for (const listener of this.#progressiveDoneListeners) 
      {
        listener();
      }
    });
  }

  transportReady() 
  {
    this.#readyCapability.resolve();
  }

  abstract requestDataRange( begin:number, end:number ):void;

  abort() {}
}

export interface OutlineNode 
{
  title:string;

  bold:boolean;

  italic:boolean;

  /**
   * The color in RGB format to use for display purposes.
   */
  color:Uint8ClampedArray;

  dest:ExplicitDest | string | undefined;

  url:string | undefined;

  unsafeUrl:string | undefined;

  newWindow:boolean | undefined;

  count:number | undefined;

  items:OutlineNode[];
}

export interface PDFDocumentStats
{
  /**
   * Used stream types in the
   * document (an item is set to true if specific stream ID was used in the
   * document).
   */
  streamTypes:Record< StreamType, boolean >;

  /**
   * Used font types in the
   * document (an item is set to true if specific font ID was used in the
   * document).
   */
  fontTypes:Record<FontType, boolean>;
}

/**
 * Proxy to a `PDFDocument` in the worker thread.
 */
export class PDFDocumentProxy 
{
  #pdfInfo:PDFInfo;
  _transport:WorkerTransport;
  
  constructor( pdfInfo:PDFInfo, transport:WorkerTransport ) 
  {
    this.#pdfInfo = pdfInfo;
    this._transport = transport;
  }

  /**
   * @return Storage for annotation data in forms.
   */
  get annotationStorage()
  {
    return this._transport.annotationStorage;
  }

  /**
   * @return Total number of pages in the PDF file.
   */
  get numPages() 
  {
    return this.#pdfInfo.numPages;
  }

  /**
   * A (not guaranteed to be) unique ID to
   * identify the PDF document.
   * NOTE: The first element will always be defined for all PDF documents,
   * whereas the second element is only defined for *modified* PDF documents.
   */
  get fingerprints() { return this.#pdfInfo.fingerprints; }

  /**
   * @return True if only XFA form.
   */
  get isPureXfa() { return !!this._transport._htmlForXfa; }

  /**
   * NOTE: This is (mostly) intended to support printing of XFA forms.
   *
   * An object representing a HTML tree structure
   * to render the XFA, or `null` when no XFA form exists.
   */
  get allXfaHtml() { return this._transport._htmlForXfa; }

  /**
   * @param pageNumber The page number to get. The first page is 1.
   * @return A promise that is resolved with a {@link PDFPageProxy} object.
   */
  getPage( pageNumber:number )
  {
    return this._transport.getPage(pageNumber);
  }

  /**
   * @param ref The page reference.
   * @return A promise that is resolved with the page index,
   *   starting from zero, that is associated with the reference.
   */
  getPageIndex( ref:RefProxy )
  {
    return this._transport.getPageIndex(ref);
  }

  /**
   * @return A promise that is resolved
   *   with a mapping from named destinations to references.
   *
   * This can be slow for large documents. Use `getDestination` instead.
   */
  getDestinations()
  {
    return this._transport.getDestinations();
  }

  /**
   * @param id The named destination to get.
   * @return A promise that is resolved with all
   *   information of the given named destination, or `null` when the named
   *   destination is not present in the PDF file.
   */
  getDestination( id:string )
  {
    return this._transport.getDestination(id);
  }

  /**
   * @return A promise that is resolved with
   *   an {Array} containing the page labels that correspond to the page
   *   indexes, or `null` when no page labels are present in the PDF file.
   */
  getPageLabels()
  {
    return this._transport.getPageLabels();
  }

  /**
   * @return A promise that is resolved with a {string}
   *   containing the page layout name.
   */
  getPageLayout()
  {
    return this._transport.getPageLayout();
  }

  /**
   * @return A promise that is resolved with a {string}
   *   containing the page mode name.
   */
  getPageMode()
  {
    return this._transport.getPageMode();
  }

  /**
   * @return A promise that is resolved with an
   *   {Object} containing the viewer preferences, or `null` when no viewer
   *   preferences are present in the PDF file.
   */
  getViewerPreferences()
  {
    return this._transport.getViewerPreferences();
  }

  /**
   * @return A promise that is resolved with an {Array}
   *   containing the destination, or `null` when no open action is present
   *   in the PDF.
   */
  getOpenAction()
  {
    return this._transport.getOpenAction();
  }

  /**
   * @return A promise that is resolved with a lookup table
   *   for mapping named attachments to their content.
   */
  getAttachments():Promise<any> 
  {
    return this._transport.getAttachments();
  }

  /**
   * @return A promise that is resolved with
   *   an {Array} of all the JavaScript strings in the name tree, or `null`
   *   if no JavaScript exists.
   */
  getJavaScript()
  {
    return this._transport.getJavaScript();
  }

  /**
   * @return A promise that is resolved with
   *   an {Object} with the JavaScript actions:
   *     - from the name tree (like getJavaScript);
   *     - from A or AA entries in the catalog dictionary.
   *   , or `null` if no JavaScript exists.
   */
  getJSActions()
  {
    return this._transport.getDocJSActions();
  }

  /**
   * @return A promise that is resolved with an
   *   {Array} that is a tree outline (if it has one) of the PDF file.
   */
  getOutline():Promise< OutlineNode[] | null >
  {
    return this._transport.getOutline();
  }

  /**
   * @return A promise that is resolved with
   *   an {@link OptionalContentConfig} that contains all the optional content
   *   groups (assuming that the document has any).
   */
  getOptionalContentConfig()
  {
    return this._transport.getOptionalContentConfig();
  }

  /**
   * @return A promise that is resolved with
   *   an {Array} that contains the permission flags for the PDF document, or
   *   `null` when no permissions are present in the PDF file.
   */
  getPermissions()
  {
    return this._transport.getPermissions();
  }

  /**
   * @return A promise that is
   *   resolved with an {Object} that has `info` and `metadata` properties.
   *   `info` is an {Object} filled with anything available in the information
   *   dictionary and similarly `metadata` is a {Metadata} object with
   *   information from the metadata section of the PDF.
   */
  getMetadata()
  {
    return this._transport.getMetadata();
  }

  /**
   * @return A promise that is resolved with
   *   a {MarkInfo} object that contains the MarkInfo flags for the PDF
   *   document, or `null` when no MarkInfo values are present in the PDF file.
   */
  getMarkInfo()
  {
    return this._transport.getMarkInfo();
  }

  /**
   * @return A promise that is resolved with a
   *   {TypedArray} that has the raw data from the PDF.
   */
  getData():Promise< TypedArray > 
  {
    return this._transport.getData();
  }

  /**
   * @return A promise that is resolved when the
   *   document's data is loaded. It is resolved with an {Object} that contains
   *   the `length` property that indicates size of the PDF data in bytes.
   */
  getDownloadInfo():Promise<{ length: number }> 
  {
    return this._transport.downloadInfoCapability.promise;
  }
  
  /**
   * @return A promise this is resolved with
   *   current statistics about document structures (see
   *   {@link PDFDocumentStats}).
   */
  getStats()
  {
    return this._transport.getStats();
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
  cleanup( keepLoadedFonts=false )
  {
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
  get loadingParams()
  {
    return this._transport.loadingParams;
  }

  /**
   * The loadingTask for the current document.
   */
  get loadingTask():PDFDocumentLoadingTask {
    return this._transport.loadingTask;
  }

  /**
   * @return A promise that is resolved with a
   *   {Uint8Array} containing the full data of the saved document.
   */
  saveDocument()
  {
    // #if GENERIC
      // if (
      //   (typeof PDFJSDev === "undefined" || PDFJSDev.test("GENERIC")) &&
      //   this._transport.annotationStorage.size <= 0
      // ) {
      deprecated(
        "saveDocument called while `annotationStorage` is empty, " +
          "please use the getData-method instead."
      );
      // }
    // #endif
    return this._transport.saveDocument();
  }

  /**
   * @return A promise that is
   *   resolved with an {Object} containing /AcroForm field data for the JS
   *   sandbox, or `null` when no field data is present in the PDF file.
   */
  getFieldObjects():Promise< Record<string, FieldObject[]> | undefined >
  {
    return this._transport.getFieldObjects();
  }

  /**
   * @return A promise that is resolved with `true`
   *   if some /AcroForm fields have JavaScript actions.
   */
  hasJSActions()
  {
    return this._transport.hasJSActions();
  }

  /**
   * @return A promise that is resolved with an
   *   {Array<string>} containing IDs of annotations that have a calculation
   *   action, or `null` when no such annotations are present in the PDF file.
   */
  getCalculationOrderIds()
  {
    return this._transport.getCalculationOrderIds();
  }
}

/**
 * Page getViewport parameters.
 */
interface GetViewportParms
{
  /**
   * The desired scale of the viewport.
   */
  scale:number;

  /**
   * The desired rotation, in degrees, of
   * the viewport. If omitted it defaults to the page rotation.
   */
  rotation?:number;

  /**
   * The horizontal, i.e. x-axis, offset.
   * The default value is `0`.
   */
  offsetX?:number;

  /**
   * The vertical, i.e. y-axis, offset.
   * The default value is `0`.
   */
  offsetY?:number;

  /**
   * If true, the y-axis will not be
   * flipped. The default value is `false`.
   */
  dontFlip?:boolean;
}

/**
 * Page getTextContent parameters.
 */
interface GetTextContentParms {
  /**
   * Replaces all occurrences of
   * whitespace with standard spaces (0x20). The default value is `false`.
   */
  normalizeWhitespace:boolean;

  /**
   * Do not attempt to combine
   * same line {@link TextItem}'s. The default value is `false`.
   */
  disableCombineTextItems?:boolean;

  /**
   * When true include marked
   * content items in the items array of TextContent. The default is `false`.
   */
  includeMarkedContent?:boolean;
}

/**
 * Page text content.
 */
export interface TextContent 
{
  /**
   * Array of
   * {@link TextItem} and {@link TextMarkedContent} objects. TextMarkedContent
   * items are included when includeMarkedContent is true.
   */
  items:(TextItem | TextMarkedContent)[];

  /**
   * {@link TextStyle} objects,
   * indexed by font name.
   */
  styles:Record<string, TextStyle>;
}

/**
 * Page text content part.
 */
export interface TextItem 
{
  /**
   * Text content.
   */
  str:string;

  /**
   * Text direction: 'ttb', 'ltr' or 'rtl'.
   */
  dir:string;

  /**
   * Transformation matrix.
   */
  transform:matrix_t;

  /**
   * Width in device space.
   */
  width:number;

  /**
   * Height in device space.
   */
  height:number;

  /**
   * Font name used by PDF.js for converted font.
   */
  fontName:string;

  /**
   * Indicating if the text content is followed by a line-break.
   */
  hasEOL:boolean;
}

/**
 * Page text marked content part.
 */
export interface TextMarkedContent
{
  /**
   * Either 'beginMarkedContent',
   * 'beginMarkedContentProps', or 'endMarkedContent'.
   */
  type:string;

  /**
   * The marked content identifier. Only used for type
   * 'beginMarkedContentProps'.
   */
  id:string;
}

/**
 * Text style.
 */
export interface TextStyle 
{
  /**
   * Font ascent.
   */
  ascent:number;

  /**
   * Font descent.
   */
  descent:number;

  /**
   * Whether or not the text is in vertical mode.
   */
  vertical:boolean;

  /**
   * The possible font family.
   */
  fontFamily:string;
}

/**
 * Page annotation parameters.
 */
interface GetAnnotationsParms 
{
  /**
   * Determines the annotations that are fetched,
   * can be 'display' (viewable annotations), 'print' (printable annotations),
   * or 'any' (all annotations). The default value is 'display'.
   */
  intent:AnnotIntent | undefined;
}

export interface ImageLayer
{
  beginLayout():void;
  endLayout():void;
  appendImage(_:{
    imgData:ImgData;
    left:number;
    top:number;
    width:number;
    height:number;
  }):void;
}

/**
 * Page render parameters.
 */
export interface RenderParms 
{
  /**
   * A 2D context of a DOM Canvas object.
   */
  canvasContext:CanvasRenderingContext2D;

  /**
   * Rendering viewport obtained by calling
   * the `PDFPageProxy.getViewport` method.
   */
  viewport:PageViewport;

  /**
   * Rendering intent, can be 'display', 'print',
   * or 'any'. The default value is 'display'.
   */
  intent?:Intent;

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
  annotationMode?:AnnotationMode;

  /**
   * Whether or not interactive
   * form elements are rendered in the display layer. If so, we do not render
   * them on the canvas as well. The default value is `false`.
   */
  renderInteractiveForms?:boolean,

  /**
   * Additional transform, applied just
   * before viewport transform.
   */
  transform?:matrix_t | undefined;

  /**
   * An object that has `beginLayout`,
   * `endLayout` and `appendImage` functions.
   */
  imageLayer?:ImageLayer;

  /**
   * The factory instance that will be used
   * when creating canvases. The default value is {new DOMCanvasFactory()}.
   */
  canvasFactory?:BaseCanvasFactory;

  /**
   * Background to use for the canvas.
   * Any valid `canvas.fillStyle` can be used: a `DOMString` parsed as CSS
   * <color> value, a `CanvasGradient` object (a linear or radial gradient) or
   * a `CanvasPattern` object (a repetitive image). The default value is
   * 'rgb(255,255,255)'.
   */
  background?:string | CanvasGradient | CanvasPattern;

  /**
   * A promise that should resolve with an {@link OptionalContentConfig}
   * created from `PDFDocumentProxy.getOptionalContentConfig`. If `null`,
   * the configuration will be fetched automatically with the default visibility
   * states set.
   */
  optionalContentConfigPromise?:Promise<OptionalContentConfig | undefined> | undefined;
}

/**
 * Page getOperatorList parameters.
 */
interface GetOperatorListParms
{
  /**
   * Rendering intent, can be 'display', 'print',
   * or 'any'. The default value is 'display'.
   */
  intent?:Intent;

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
  annotationMode?:AnnotationMode
}

/**
 * Structure tree node. The root node will have a role "Root".
 */
interface StructTreeNode
{
  /**
   * Array of {@link StructTreeNode} and {@link StructTreeContent} objects.
   */
  children:(StructTreeNode | StructTreeContent)[];

  /**
   * element's role, already mapped if a role map exists in the PDF.
   */
  role:string;
}

/**
 * Structure tree content.
 */
interface StructTreeContent
{
  /**
   * either "content" for page and stream structure
   * elements or "object" for object references.
   */
  type:"content" | "object";

  /**
   * unique id that will map to the text layer.
   */
  id:string;
}

interface IntentState
{
  streamReaderCancelTimeout:number | undefined;
  displayReadyCapability?:PromiseCapability<boolean>;
  opListReadCapability?:PromiseCapability<OpListIR>;
  operatorList?:OpListIR;
  streamReader:ReadableStreamDefaultReader< 
    ActionSinkchunk<Thread.main> 
  > | undefined;
  renderTasks?:Set<InternalRenderTask>;
}

export type AnnotIntent = "display" | "print" | "richText";
export type Intent = AnnotIntent | "any";

interface AbortOperatorListParms
{
  intentState:IntentState;
  reason:unknown;
  force?:boolean;
}

export type PDFObjs =
 | ImgData
 | ShadingPatternIR
 | undefined
;

interface IntentArgs
{
  renderingIntent:RenderingIntentFlag;
  cacheKey:string;
}

/**
 * Proxy to a `PDFPage` in the worker thread.
 */
export class PDFPageProxy 
{
  _pageIndex:number;
  _pageInfo:PageInfo;
  _ownerDocument:Document | undefined;
  _transport:WorkerTransport;

  _stats:StatTimer | null;
  
  /**
   * @return Returns page stats, if enabled; returns `null` otherwise.
   */
  get stats() { return this._stats; }

  _pdfBug:boolean;
  commonObjs:PDFObjects<PDFCommonObjs>;
  objs = new PDFObjects<PDFObjs>();

  cleanupAfterRender = false;
  _structTreePromise:Promise< StructTree | undefined > | undefined;
  pendingCleanup = false;
  #intentStates = new Map<string, IntentState>();
  _annotationPromises = new Map<string, Promise<AnnotationData[]>>();
  destroyed = false;

  _annotationsPromise:Promise<AnnotationData[]> | undefined;
  _annotationsIntent:AnnotIntent | undefined;

  _jsActionsPromise:Promise<AnnotActions | undefined> | undefined;

  _xfaPromise:Promise< XFAData | undefined > | undefined;

  constructor( pageIndex:number, pageInfo:PageInfo, transport:WorkerTransport, 
    ownerDocument?:Document, pdfBug=false 
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
  get pageNumber():number 
  {
    return this._pageIndex + 1;
  }

  /**
   * The number of degrees the page is rotated clockwise.
   */
  get rotate() { return this._pageInfo.rotate; }

  /**
   * The reference that points to this page.
   */
  get ref() { return this._pageInfo.ref; }

  /**
   * The default size of units in 1/72nds of an inch.
   */
  get userUnit() { return this._pageInfo.userUnit; }

  /**
   * An array of the visible portion of the PDF page in
   * user space units [x1, y1, x2, y2].
   */
  get view() { return this._pageInfo.view; }

  /**
   * @param params Viewport parameters.
   * @return Contains 'width' and 'height' properties
   *   along with transforms required for rendering.
   */
  getViewport({
    scale,
    rotation=this.rotate,
    offsetX=0,
    offsetY=0,
    dontFlip=false,
  }:GetViewportParms )
  {
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
   * @param params - Annotation parameters.
   * @return A promise that is resolved with an
   *   {Array} of the annotation objects.
   */
  getAnnotations({ intent="display" }=<GetAnnotationsParms>{} )
  {
    const intentArgs = this._transport.getRenderingIntent(intent);

    let promise = this._annotationPromises.get(intentArgs.cacheKey);
    if (!promise) 
    {
      promise = this._transport.getAnnotations(
        this._pageIndex,
        intentArgs.renderingIntent
      );
      this._annotationPromises.set(intentArgs.cacheKey, promise);

      // #if GENERIC
        promise = promise.then(annotations => {
          for (const annotation of annotations) 
          {
            if (annotation.titleObj !== undefined) 
            {
              Object.defineProperty(annotation, "title", {
                get() {
                  deprecated(
                    "`title`-property on annotation, please use `titleObj` instead."
                  );
                  return annotation.titleObj!.str;
                },
              });
            }
            if (annotation.contentsObj !== undefined) 
            {
              Object.defineProperty(annotation, "contents", {
                get() {
                  deprecated(
                    "`contents`-property on annotation, please use `contentsObj` instead."
                  );
                  return annotation.contentsObj.str;
                },
              });
            }
          }
          return annotations;
        });
      // #endif
    }
    return promise;
  }

  /**
   * @return A promise that is resolved with an
   *   {Object} with JS actions.
   */
  getJSActions()
  {
    return (this._jsActionsPromise ||= this._transport.getPageJSActions(
      this._pageIndex
    ));
  }

  /**
   * A promise that is resolved with
   * an {Object} with a fake DOM object (a tree structure where elements
   * are {Object} with a name, attributes (class, style, ...), value and
   * children, very similar to a HTML DOM tree), or `null` if no XFA exists.
   */
  async getXfa()
  {
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
    intent="display",
    annotationMode=AnnotationMode.ENABLE,
    transform=undefined,
    imageLayer,
    canvasFactory,
    background,
    optionalContentConfigPromise,
  }:RenderParms 
  ) {
    if( this._stats ) this._stats.time("Overall");

    const intentArgs = this._transport.getRenderingIntent(
      intent,
      annotationMode
    );
    // If there was a pending destroy, cancel it so no cleanup happens during
    // this call to render.
    this.pendingCleanup = false;

    if( !optionalContentConfigPromise )
    {
      optionalContentConfigPromise = this._transport.getOptionalContentConfig();
    }

    let intentState = this.#intentStates.get( intentArgs.cacheKey );
    if( !intentState )
    {
      intentState = <IntentState>Object.create(null);
      this.#intentStates.set( intentArgs.cacheKey, intentState );
    }

    // Ensure that a pending `streamReader` cancel timeout is always aborted.
    if( intentState.streamReaderCancelTimeout )
    {
      clearTimeout( intentState.streamReaderCancelTimeout );
      intentState.streamReaderCancelTimeout = undefined;
    }

    const canvasFactoryInstance =
      canvasFactory ||
      new DefaultCanvasFactory({ ownerDocument: this._ownerDocument });
    const intentPrint = !!(
      intentArgs.renderingIntent & RenderingIntentFlag.PRINT
    );

    // If there's no displayReadyCapability yet, then the operatorList
    // was never requested before. Make the request and create the promise.
    if( !intentState.displayReadyCapability )
    {
      intentState.displayReadyCapability = createPromiseCapability<boolean>();
      intentState.operatorList = {
        fnArray: [],
        argsArray: [],
        lastChunk: false,
      };

      if( this._stats )
      {
        this._stats.time("Page Request");
      }
      this.#pumpOperatorList( intentArgs );
    }

    const complete = ( error?:unknown ) => {
      intentState!.renderTasks!.delete( internalRenderTask );

      // Attempt to reduce memory usage during *printing*, by always running
      // cleanup once rendering has finished (regardless of cleanupAfterRender).
      if (this.cleanupAfterRender || intentPrint) 
      {
        this.pendingCleanup = true;
      }
      this.#tryCleanup();

      if( error )
      {
        internalRenderTask.capability.reject(error);

        this.#abortOperatorList({
          intentState: intentState!,
          reason: error instanceof Error ? error : new Error( <any>error ),
        });
      } 
      else {
        internalRenderTask.capability.resolve();
      }
      if (this._stats) 
      {
        this._stats.timeEnd("Rendering");
        this._stats.timeEnd("Overall");
      }
    };

    const internalRenderTask = new InternalRenderTask({
      callback: complete,
      // Only include the required properties, and *not* the entire object.
      params: {
        canvasContext,
        viewport,
        transform,
        imageLayer,
        background,
      },
      objs: this.objs,
      commonObjs: this.commonObjs,
      operatorList: intentState.operatorList!,
      pageIndex: this._pageIndex,
      canvasFactory: canvasFactoryInstance,
      useRequestAnimationFrame: !intentPrint,
      pdfBug: this._pdfBug,
    });

    (intentState.renderTasks ||= new Set()).add(internalRenderTask);
    const renderTask = internalRenderTask.task;

    Promise.all([
      intentState.displayReadyCapability.promise,
      optionalContentConfigPromise,
    ])
      .then(([transparency, optionalContentConfig]) => {
        if( this.pendingCleanup )
        {
          complete();
          return;
        }
        if( this._stats )
        {
          this._stats.time("Rendering");
        }
        internalRenderTask.initializeGraphics({
          transparency,
          optionalContentConfig,
        });
        internalRenderTask.operatorListChanged();
      })
      .catch( complete );

    return renderTask;
  }

  /**
   * @param params Page getOperatorList parameters.
   * @return A promise resolved with an
   *   {@link PDFOperatorList} object that represents the page's operator list.
   */
  getOperatorList({ 
    intent="display",
    annotationMode = AnnotationMode.ENABLE,
  }:GetOperatorListParms={}) {
    function operatorListChanged() {
      if( intentState!.operatorList!.lastChunk )
      {
        intentState!.opListReadCapability!.resolve( intentState!.operatorList! );

        intentState!.renderTasks!.delete(opListTask);
      }
    }

    const intentArgs = this._transport.getRenderingIntent(
      intent,
      annotationMode,
      /* isOpList = */ true
    );
    let intentState = this.#intentStates.get( intentArgs.cacheKey );
    if (!intentState) 
    {
      intentState = Object.create(null);
      this.#intentStates.set( intentArgs.cacheKey, intentState! );
    }
    let opListTask:InternalRenderTask;

    if( !intentState!.opListReadCapability ) 
    {
      opListTask = Object.create(null);
      opListTask.operatorListChanged = operatorListChanged;
      intentState!.opListReadCapability = createPromiseCapability();
      (intentState!.renderTasks ||= new Set()).add(opListTask);
      intentState!.operatorList = {
        fnArray: [],
        argsArray: [],
        lastChunk: false,
      };

      if (this._stats) 
      {
        this._stats.time("Page Request");
      }
      this.#pumpOperatorList( intentArgs );
    }
    return intentState!.opListReadCapability.promise;
  }

  /**
   * @param params getTextContent parameters.
   * @return Stream for reading text content chunks.
   */
  streamTextContent({
    normalizeWhitespace=false,
    disableCombineTextItems=false,
    includeMarkedContent= false,
  }=<GetTextContentParms>{} ):ReadableStream 
  {
    const TEXT_CONTENT_CHUNK_SIZE = 100;

    return this._transport.messageHandler.sendWithStream(
      "GetTextContent",
      {
        pageIndex: this._pageIndex,
        normalizeWhitespace: normalizeWhitespace === true,
        combineTextItems: disableCombineTextItems !== true,
        includeMarkedContent: includeMarkedContent === true,
      },
      {
        highWaterMark: TEXT_CONTENT_CHUNK_SIZE,
        size( textContent:ActionSinkchunk<Thread.main,"GetTextContent"> | undefined ) 
        {
          return textContent!.items.length;
        },
      }
    );
  }

  /**
   * @param params - getTextContent parameters.
   * @return A promise that is resolved with a
   *   {@link TextContent} object that represents the page's text content.
   */
  getTextContent( params=<GetTextContentParms>{} ):Promise<TextContent>
  {
    if (this._transport._htmlForXfa) 
    {
      // TODO: We need to revisit this once the XFA foreground patch lands and
      // only do this for non-foreground XFA.
      return this.getXfa().then( xfa => {
        return XfaText.textContent( <XFAElObj | undefined>xfa );
      });
    }
    const readableStream = this.streamTextContent(params);

    return new Promise( (resolve, reject) => {
      function pump() {
        reader.read().then( ({ value, done }) => {
          if (done) {
            resolve(textContent);
            return;
          }
          Object.assign(textContent.styles, value.styles);
          textContent.items.push( ...value.items );
          pump();
        }, reject);
      }

      const reader = readableStream.getReader();
      const textContent:TextContent = {
        items: [],
        styles: Object.create(null),
      };
      pump();
    });
  }

  /**
   * @return {Promise<StructTreeNode>} A promise that is resolved with a
   *   {@link StructTreeNode} object that represents the page's structure tree,
   *   or `null` when no structure tree is present for the current page.
   */
   getStructTree() {
    return (this._structTreePromise ||= this._transport.getStructTree(
      this._pageIndex
    ));
  }

  /**
   * Destroys the page object.
   * @private
   */
  _destroy()
  {
    this.destroyed = true;
    this._transport.pageCache[this._pageIndex] = undefined;

    const waitOn = [];
    for( const intentState of this.#intentStates.values() )
    {
      this.#abortOperatorList({
        intentState,
        reason: new Error("Page was destroyed."),
        force: true,
      });

      if( intentState.opListReadCapability )
      {
        // Avoid errors below, since the renderTasks are just stubs.
        continue;
      }
      for( const internalRenderTask of intentState.renderTasks! )
      {
        waitOn.push(internalRenderTask.completed);
        internalRenderTask.cancel();
      }
    }
    this.objs.clear();
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
  cleanup( resetStats=false ):boolean
  {
    this.pendingCleanup = true;
    return this.#tryCleanup(resetStats);
  }

  /**
   * Attempts to clean up if rendering is in a state where that's possible.
   */
  #tryCleanup( resetStats=false )
  {
    if( !this.pendingCleanup ) return false;

    for( const { renderTasks, operatorList } of this.#intentStates.values() )
    {
      if( renderTasks!.size > 0 || !operatorList!.lastChunk )
      {
        return false;
      }
    }

    this.#intentStates.clear();
    this.objs.clear();
    this._annotationPromises.clear();
    this._jsActionsPromise = undefined;
    this._structTreePromise = undefined;
    if( resetStats && this._stats )
    {
      this._stats = new StatTimer();
    }
    this.pendingCleanup = false;
    return true;
  }

  _startRenderPage( transparency:boolean, cacheKey:string )
  {
    const intentState = this.#intentStates.get(cacheKey);
    if( !intentState ) return; // Rendering was cancelled.

    if (this._stats) 
    {
      this._stats.timeEnd("Page Request");
    }
    // TODO Refactor RenderPageRequest to separate rendering
    // and operator list logic
    if (intentState.displayReadyCapability) 
    {
      intentState.displayReadyCapability.resolve(transparency);
    }
  }

  #renderPageChunk( 
    operatorListChunk:ActionSinkchunk<Thread.main, "GetOperatorList">, 
    intentState:IntentState 
  ) {
    // Add the new chunk to the current operator list.
    for( let i = 0, ii = operatorListChunk.length!; i < ii; i++ )
    {
      intentState.operatorList!.fnArray.push(operatorListChunk.fnArray[i]);
      intentState.operatorList!.argsArray.push(operatorListChunk.argsArray[i]);
    }
    intentState.operatorList!.lastChunk = operatorListChunk.lastChunk;

    // Notify all the rendering tasks there are more operators to be consumed.
    for( const internalRenderTask of intentState.renderTasks! )
    {
      internalRenderTask.operatorListChanged();
    }

    if( operatorListChunk.lastChunk )
    {
      this.#tryCleanup();
    }
  }

  #pumpOperatorList({ renderingIntent, cacheKey }:IntentArgs )
  {
    // #if !PRODUCTION || TESTING
      assert(
        Number.isInteger(renderingIntent) && renderingIntent > 0,
        '_pumpOperatorList: Expected valid "renderingIntent" argument.'
      );
    // #endif

    const readableStream = this._transport.messageHandler.sendWithStream(
      "GetOperatorList",
      {
        pageIndex: this._pageIndex,
        intent: renderingIntent,
        cacheKey,
        annotationStorage:
          renderingIntent & RenderingIntentFlag.ANNOTATIONS_STORAGE
            ? this._transport.annotationStorage.serializable
            : undefined,
      }
    );
    const reader = readableStream.getReader();

    const intentState = this.#intentStates.get(cacheKey)!;
    intentState.streamReader = reader;

    const pump = () => {
      reader.read().then(
        ({ value, done }) => {
          if( done )
          {
            intentState.streamReader = undefined;
            return;
          }

          // Ignore any pending requests if the worker was terminated.
          if( this._transport.destroyed ) return; 

          this.#renderPageChunk( value!, intentState );
          pump();
        },
        reason => {
          intentState.streamReader = undefined;

          if (this._transport.destroyed) 
          {
            return; // Ignore any pending requests if the worker was terminated.
          }
          if( intentState.operatorList )
          {
            // Mark operator list as complete.
            intentState.operatorList.lastChunk = true;

            for( const internalRenderTask of intentState.renderTasks! )
            {
              internalRenderTask.operatorListChanged();
            }
            this.#tryCleanup();
          }

          if (intentState.displayReadyCapability) 
          {
            intentState.displayReadyCapability.reject(reason);
          }
          else if (intentState.opListReadCapability) 
          {
            intentState.opListReadCapability.reject(reason);
          }
          else {
            throw reason;
          }
        }
      );
    };
    pump();
  }

  #abortOperatorList({ intentState, reason, force=false }:AbortOperatorListParms ) 
  {
    // #if !PRODUCTION || TESTING
      assert(
        reason instanceof Error,
        '_abortOperatorList: Expected valid "reason" argument.'
      );
    // #endif

    if (!intentState.streamReader) return;

    if( !force )
    {
      // Ensure that an Error occurring in *only* one `InternalRenderTask`, e.g.
      // multiple render() calls on the same canvas, won't break all rendering.
      if( intentState.renderTasks!.size > 0 ) return;

      // Don't immediately abort parsing on the worker-thread when rendering is
      // cancelled, since that will unnecessarily delay re-rendering when (for
      // partially parsed pages) e.g. zooming/rotation occurs in the viewer.
      if (reason instanceof RenderingCancelledException) 
      {
        intentState.streamReaderCancelTimeout = setTimeout(() => {
          this.#abortOperatorList({ intentState, reason, force: true });
          intentState.streamReaderCancelTimeout = undefined;
        }, RENDERING_CANCELLED_TIMEOUT);
        return;
      }
    }
    intentState.streamReader
      .cancel( new AbortException((<any>reason).message) )
      .catch(() => {
        // Avoid "Uncaught promise" messages in the console.
      });
    intentState.streamReader = undefined;

    if (this._transport.destroyed) 
    {
      return; // Ignore any pending requests if the worker was terminated.
    }
    // Remove the current `intentState`, since a cancelled `getOperatorList`
    // call on the worker-thread cannot be re-started...
    for (const [curCacheKey, curIntentState] of this.#intentStates) 
    {
      if (curIntentState === intentState) 
      {
        this.#intentStates.delete(curCacheKey);
        break;
      }
    }
    // ... and force clean-up to ensure that any old state is always removed.
    this.cleanup();
  }
}

export class LoopbackPort
{
  #listeners:EventListener[] = [];
  #deferred = Promise.resolve();

  postMessage( obj:any, transfers?:Transferable[] | PostMessageOptions ) 
  {
    function cloneValue( object:any ) 
    {
      const rn_ = () => (<any>globalThis).structuredClone(object, transfers);
      // #if MOZCENTRAL
        return rn_();
      // #endif
      if( (<any>globalThis).structuredClone ) return rn_();

      // Trying to perform a structured clone close to the spec, including
      // transfers.
      function fallbackCloneValue( value:unknown ) 
      {
        if( typeof value === "function" 
         || typeof value === "symbol" 
         || value instanceof URL
        ) {
          throw new Error(
            `LoopbackPort.postMessage - cannot clone: ${value?.toString()}`
          );
        }

        if( !isObjectLike(value) ) return value;

        if( cloned.has(value) )
        {
          // already cloned the object
          return cloned.get( value );
        }
        let buffer;
        if( (buffer = (<DataView>value).buffer) && isArrayBuffer(buffer) )
        {
          // We found object with ArrayBuffer (typed array).
          let result:DataView;
          if( (<Transferable[]>transfers)?.includes(buffer) )
          {
            result = new (<DataViewConstructor>(<DataView>value).constructor)(
              buffer,
              (<DataView>value).byteOffset,
              (<DataView>value).byteLength
            );
          } 
          else {
            result = new (<DataViewConstructor>(<DataView>value).constructor)(
              <ArrayBufferLike>value
            );
          }
          cloned.set( <DataView>value, result );
          return result;
        }
        if( value instanceof Map )
        {
          const result = new Map<string, unknown>();
          cloned.set( value, result ); // Adding to cache now for cyclic references.
          for( const [key, val] of value )
          {
            result.set(key, fallbackCloneValue(val));
          }
          return result;
        }
        if( value instanceof Set )
        {
          const result = new Set<unknown>();
          cloned.set(value, result); // Adding to cache now for cyclic references.
          for (const val of value) 
          {
            result.add( fallbackCloneValue(val) );
          }
          return result;
        }
        const result = Array.isArray(value) ? [] : Object.create(null);
        cloned.set( <object>value, result ); // Adding to cache now for cyclic references.
        // Cloning all value and object properties, however ignoring properties
        // defined via getter.
        for( const i in <object>value )
        {
          let desc,
            p = <object>value;
          while( !(desc = Object.getOwnPropertyDescriptor(p, i)) )
          {
            p = Object.getPrototypeOf(p);
          }
          if( typeof desc.value === "undefined" ) continue;

          if (typeof desc.value === "function" && !(<object>value).hasOwnProperty?.(i)) 
          {
            continue;
          }
          result[i] = fallbackCloneValue( desc.value );
        }
        return result;
      }

      const cloned = new WeakMap<object, object>();
      return fallbackCloneValue(object);
    }

    const event:any = { data: cloneValue(obj) };

    this.#deferred.then(() => {
      for( const listener of this.#listeners )
      {
        listener.call( this, event );
      }
    });
  }

  addEventListener( name:string, listener:EventListener ) 
  {
    this.#listeners.push(listener);
  }

  removeEventListener( name:string, listener:EventListener ) 
  {
    const i = this.#listeners.indexOf(listener);
    this.#listeners.splice(i, 1);
  }

  terminate() 
  {
    this.#listeners.length = 0;
  }
}

interface PDFWorkerParms 
{
  /**
   * The name of the worker.
   */
  name?:string;

  /**
   * The `workerPort` object.
   */
  port?:Worker | undefined,

  /**
   * Controls the logging level;
   * the constants from {@link VerbosityLevel} should be used.
   */
  verbosity?:VerbosityLevel | undefined,
}

const PDFWorkerUtil:{
  isWorkerDisabled:boolean;
  fallbackWorkerSrc:string | undefined;
  fakeWorkerId:number;
  createCDNWrapper?:( url:string ) => string;
} = {
  isWorkerDisabled: false,
  fallbackWorkerSrc: undefined,
  fakeWorkerId: 0,
};
// #if GENERIC
  // eslint-disable-next-line no-undef
  // if (isNodeJS && typeof __non_webpack_require__ === "function") {
  //   // Workers aren't supported in Node.js, force-disabling them there.
  //   PDFWorkerUtil.isWorkerDisabled = true;

  //   PDFWorkerUtil.fallbackWorkerSrc = PDFJSDev.test("LIB")
  //     ? "../pdf.worker.js"
  //     : "./pdf.worker.js";
  // } 
  // else 
  if( typeof document === "object" )
  {
    const pdfjsFilePath = (<HTMLScriptElement>document?.currentScript)?.src;
    if( pdfjsFilePath )
    {
      PDFWorkerUtil.fallbackWorkerSrc = pdfjsFilePath.replace(
        /(\.(?:min\.)?js)(\?.*)?$/i,
        ".worker$1$2"
      );
    }
  }

  PDFWorkerUtil.createCDNWrapper = url =>
  {
    // We will rely on blob URL's property to specify origin.
    // We want this function to fail in case if createObjectURL or Blob do not
    // exist or fail for some reason -- our Worker creation will fail anyway.
    const wrapper = `importScripts("${url}");`;
    return URL.createObjectURL( new Blob([wrapper]) );
  }
// #endif

/**
 * PDF.js web worker abstraction that controls the instantiation of PDF
 * documents. Message handlers are used to pass information from the main
 * thread to the worker thread and vice versa. If the creation of a web
 * worker is not possible, a "fake" worker will be used instead.
 */
export class PDFWorker 
{
  static get _workerPorts() 
  {
    return shadow(this, "_workerPorts", new WeakMap<IWorker, PDFWorker>());
  }

  name:string | undefined;
  destroyed = false;
  postMessageTransfers = true;
  verbosity:VerbosityLevel;

  #readyCapability = createPromiseCapability();
  /**
   * Promise for worker initialization completion.
   */
  get promise() { return this.#readyCapability.promise; }

  #port!:IWorker;
  /**
   * The current `workerPort`, when it exists.
   */
  get port() { return this.#port; }

  #webWorker:Worker | undefined;

  #messageHandler!:MessageHandler<Thread.main>;
  /**
   * The current MessageHandler-instance.
   */
  get messageHandler() { return this.#messageHandler; }

  constructor({
    name,
    port,
    verbosity=getVerbosityLevel(),
  }:PDFWorkerParms={} ) {
    if (port && PDFWorker._workerPorts.has(port)) 
    {
      throw new Error("Cannot use more than one PDFWorker per port.");
    }

    this.name = name;
    this.verbosity = verbosity;

    if( port ) 
    {
      PDFWorker._workerPorts.set(port, this);
      this.#initializeFromPort(port);
      return;
    }
    this.#initialize();
  }

  #initializeFromPort( port:Worker )
  {
    this.#port = port;
    this.#messageHandler = new MessageHandler<Thread.main>( "main", "worker", port );
    this.#messageHandler.on("ready", () => {
      // Ignoring "ready" event -- MessageHandler should already be initialized
      // and ready to accept messages.
    });
    this.#readyCapability.resolve();
  }

  #initialize()
  {
    // If worker support isn't disabled explicit and the browser has worker
    // support, create a new web worker and test if it/the browser fulfills
    // all requirements to run parts of pdf.js in a web worker.
    // Right now, the requirement is, that an Uint8Array is still an
    // Uint8Array as it arrives on the worker. (Chrome added this with v.15.)
    if( typeof Worker !== "undefined"
      && !PDFWorkerUtil.isWorkerDisabled
      && !PDFWorker._mainThreadWorkerMessageHandler
    ) {
      let workerSrc = PDFWorker.workerSrc;

      try {
        // Wraps workerSrc path into blob URL, if the former does not belong
        // to the same origin.
        // #if GENERIC
          if( !isSameOrigin(window.location.href, workerSrc) )
          {
            workerSrc = PDFWorkerUtil.createCDNWrapper!(
              new URL( workerSrc, window.location.toString() ).href
            );
          }
        // #endif

        // Some versions of FF can't create a worker on localhost, see:
        // https://bugzilla.mozilla.org/show_bug.cgi?id=683280
        const worker = new Worker( workerSrc, { type: "module" });
        const messageHandler = new MessageHandler<Thread.main>("main", "worker", worker);
        const terminateEarly = () => {
          worker.removeEventListener("error", onWorkerError);
          messageHandler.destroy();
          worker.terminate();
          if (this.destroyed) 
          {
            this.#readyCapability.reject(new Error("Worker was destroyed"));
          } 
          else {
            // Fall back to fake worker if the termination is caused by an
            // error (e.g. NetworkError / SecurityError).
            this.#setupFakeWorker();
          }
        };

        const onWorkerError = ( evt:Event ) => {
          console.log(evt);
          if( !this.#webWorker )
          {
            // Worker failed to initialize due to an error. Clean up and fall
            // back to the fake worker.
            terminateEarly();
          }
        };
        worker.addEventListener("error", onWorkerError);

        messageHandler.on("test", data => 
        {
          worker.removeEventListener("error", onWorkerError);
          if (this.destroyed) 
          {
            terminateEarly();
            return; // worker was destroyed
          }
          if (data) 
          {
            // supportTypedArray
            this.#messageHandler = messageHandler;
            this.#port = worker;
            this.#webWorker = worker;
            if (!data.supportTransfers) 
            {
              this.postMessageTransfers = false;
            }
            this.#readyCapability.resolve();
            // Send global setting, e.g. verbosity level.
            messageHandler.send("configure", {
              verbosity: this.verbosity,
            });
          } 
          else {
            this.#setupFakeWorker();
            messageHandler.destroy();
            worker.terminate();
          }
        });

        messageHandler.on("ready", () => 
        {
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
          const testObj = new Uint8Array([this.postMessageTransfers ? 255 : 0]);
          // Some versions of Opera throw a DATA_CLONE_ERR on serializing the
          // typed array. Also, checking if we can use transfers.
          try {
            messageHandler.send("test", testObj, [testObj.buffer]);
          } catch (ex) {
            warn("Cannot use postMessage transfers.");
            testObj[0] = 0;
            messageHandler.send("test", testObj);
          }
        };

        // It might take time for the worker to initialize. We will try to send
        // the "test" message immediately, and once the "ready" message arrives.
        // The worker shall process only the first received "test" message.
        sendTest();
        return;
      } 
      catch (e) {
        info("The worker has been disabled.");
      }
    }
    // Either workers are disabled, not supported or have thrown an exception.
    // Thus, we fallback to a faked worker.
    this.#setupFakeWorker();
  }

  #setupFakeWorker()
  {
    if( !PDFWorkerUtil.isWorkerDisabled ) 
    {
      warn("Setting up fake worker.");
      PDFWorkerUtil.isWorkerDisabled = true;
    }

    PDFWorker._setupFakeWorkerGlobal
      .then( WorkerMessageHandler => {
        if( this.destroyed )
        {
          this.#readyCapability.reject(new Error("Worker was destroyed"));
          return;
        }
        const port = new LoopbackPort();
        this.#port = port;

        // All fake workers use the same port, making id unique.
        const id = `fake${PDFWorkerUtil.fakeWorkerId++}`;

        // If the main thread is our worker, setup the handling for the
        // messages -- the main thread sends to it self.
        const workerHandler = new MessageHandler< Thread.worker >(id + "_worker", id, port);
        WorkerMessageHandler.setup(workerHandler, port);

        const messageHandler = new MessageHandler< Thread.main >(id, id + "_worker", port);
        this.#messageHandler = messageHandler;
        this.#readyCapability.resolve();
        // Send global setting, e.g. verbosity level.
        messageHandler.send("configure", {
          verbosity: this.verbosity,
        });
      })
      .catch(reason => {
        this.#readyCapability.reject(
          new Error(`Setting up fake worker failed: "${reason.message}".`)
        );
      });
  }

  /**
   * Destroys the worker instance.
   */
  destroy() 
  {
    this.destroyed = true;
    if (this.#webWorker) 
    {
      // We need to terminate only web worker created resource.
      this.#webWorker.terminate();
      this.#webWorker = undefined;
    }
    PDFWorker._workerPorts.delete( this.#port );
    this.#port = <any>undefined;
    if( this.#messageHandler )
    {
      this.#messageHandler.destroy();
      this.#messageHandler = <any>undefined;
    }
  }

  /**
   * @param params The worker initialization parameters.
   */
  static fromPort( params:PDFWorkerParms )
  {
    if( !params?.port )
    {
      throw new Error("PDFWorker.fromPort - invalid method signature.");
    }
    if( this._workerPorts.has(params.port) )
    {
      return this._workerPorts.get( params.port )!;
    }
    return new PDFWorker(params);
  }

  /**
   * The current `workerSrc`, when it exists.
   */
  static get workerSrc():string
  {
    if( GlobalWorkerOptions.workerSrc )
    {
      return GlobalWorkerOptions.workerSrc;
    }
    if( PDFWorkerUtil.fallbackWorkerSrc !== undefined ) 
    {
      // if (!isNodeJS) 
      // {
        deprecated('No "GlobalWorkerOptions.workerSrc" specified.');
      // }
      return PDFWorkerUtil.fallbackWorkerSrc;
    }
    throw new Error('No "GlobalWorkerOptions.workerSrc" specified.');
  }

  static get _mainThreadWorkerMessageHandler() 
  {
    try {
      return (<any>globalThis).pdfjsWorker?.WorkerMessageHandler || undefined;
    } catch (ex) {
      return undefined;
    }
  }

  // Loads worker code into the main-thread.
  static get _setupFakeWorkerGlobal() 
  {
    const loader = async ():Promise<typeof WorkerMessageHandler> => {
      const mainWorkerMessageHandler = this._mainThreadWorkerMessageHandler;

      if (mainWorkerMessageHandler) 
      {
        // The worker was already loaded using e.g. a `<script>` tag.
        return mainWorkerMessageHandler;
      }
      // #if !PRODUCTION
        const worker = await import("../core/worker.js");
        return worker.WorkerMessageHandler;
      // #endif
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
      await loadScript( this.workerSrc );
      return window.pdfjsWorker!.WorkerMessageHandler;
    };

    return shadow(this, "_setupFakeWorkerGlobal", loader());
  }
}

export type PDFCommonObjs =
  | string
  | FontFaceObject
  | FontExpotDataEx
  | { error:string; }
  | CmdArgs[]
  | ImgData
;

/**
 * For internal use only.
 * @ignore
 * @final
 */
class WorkerTransport
{
  messageHandler;
  loadingTask;
  commonObjs = new PDFObjects<PDFCommonObjs>();
  fontLoader;
  _getFieldObjectsPromise:Promise< Record<string, FieldObject[]> | undefined > | undefined;
  _hasJSActionsPromise:Promise<boolean> | undefined;
  _params;
  CMapReaderFactory;
  StandardFontDataFactory;

  destroyed = false;
  destroyCapability?:PromiseCapability;
  _passwordCapability?:PromiseCapability<{password:string}>;

  #networkStream:IPDFStream | undefined;
  #fullReader?:IPDFStreamReader;
  #lastProgress?:OnProgressParms;

  pageCache:(PDFPageProxy | undefined)[] = [];
  pagePromises:Promise<PDFPageProxy>[] = [];
  downloadInfoCapability = createPromiseCapability<{length:number}>();

  #numPages?:number;

  _htmlForXfa:XFAElObj | undefined;

  constructor(
    messageHandler:MessageHandler<Thread.main>,
    loadingTask:PDFDocumentLoadingTask, 
    networkStream:IPDFStream | undefined, params:DocumentInitParms
  ) {
    this.messageHandler = messageHandler;
    this.loadingTask = loadingTask;
    this.fontLoader = new FontLoader({
      docId: loadingTask.docId,
      onUnsupportedFeature: this.#onUnsupportedFeature,
      ownerDocument: params.ownerDocument,
      styleElement: params.styleElement,
    });
    this._params = params;

    if( !params.useWorkerFetch )
    {
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

  get annotationStorage() 
  {
    return shadow(this, "annotationStorage", new AnnotationStorage());
  }

  getRenderingIntent(
    intent:Intent,
    annotationMode=AnnotationMode.ENABLE,
    isOpList=false
  ):IntentArgs {
    let renderingIntent = RenderingIntentFlag.DISPLAY; // Default value.
    let lastModified = "";

    switch (intent) 
    {
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

    switch (annotationMode) 
    {
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

        lastModified = this.annotationStorage.lastModified;
        break;
      default:
        warn(`getRenderingIntent - invalid annotationMode: ${annotationMode}`);
    }

    if (isOpList) 
    {
      renderingIntent += RenderingIntentFlag.OPLIST;
    }

    return {
      renderingIntent,
      cacheKey: `${renderingIntent}_${lastModified}`,
    };
  }

  destroy() 
  {
    if (this.destroyCapability) 
    {
      return this.destroyCapability.promise;
    }

    this.destroyed = true;
    this.destroyCapability = createPromiseCapability();

    if (this._passwordCapability) 
    {
      this._passwordCapability.reject(
        new Error("Worker was destroyed during onPassword callback")
      );
    }

    const waitOn:Promise<any>[] = [];
    // We need to wait for all renderings to be completed, e.g.
    // timeout/rAF can take a long time.
    for (const page of this.pageCache) 
    {
      if (page) 
      {
        waitOn.push( page._destroy() );
      }
    }
    this.pageCache.length = 0;
    this.pagePromises.length = 0;
    // Allow `AnnotationStorage`-related clean-up when destroying the document.
    if (this.hasOwnProperty("annotationStorage")) 
    {
      this.annotationStorage.resetModified();
    }
    // We also need to wait for the worker to finish its long running tasks.
    const terminated = this.messageHandler.sendWithPromise("Terminate", null);
    waitOn.push( terminated );

    Promise.all( waitOn ).then( () => {
      this.commonObjs.clear();
      this.fontLoader.clear();
      this._getFieldObjectsPromise = undefined;
      this._hasJSActionsPromise = undefined;

      if (this.#networkStream) {
        this.#networkStream.cancelAllRequests(
          new AbortException("Worker was terminated.")
        );
      }

      if (this.messageHandler) {
        this.messageHandler.destroy();
        this.messageHandler = <any>null;
      }
      this.destroyCapability!.resolve();
    }, this.destroyCapability.reject );
    return this.destroyCapability.promise;
  }

  setupMessageHandler() 
  {
    const { messageHandler, loadingTask } = this;

    messageHandler.on("GetReader", (data, sink) => {
      assert( this.#networkStream,
        "GetReader - no `IPDFStream` instance available."
      );
      this.#fullReader = this.#networkStream!.getFullReader();
      this.#fullReader.onProgress = evt => {
        this.#lastProgress = {
          loaded: evt.loaded,
          total: evt.total,
        };
      };

      sink.onPull = () => {
        this.#fullReader!
          .read()
          .then( ({ value, done }) => {
            if( done )
            {
              sink.close!();
              return;
            }
            assert( isArrayBuffer(value),
              "GetReader - expected an ArrayBuffer."
            );
            // Enqueue data chunk into sink, and transfer it
            // to other side as `Transferable` object.
            sink.enqueue( new Uint8Array(value!), 1, [value!] );
          })
          .catch( reason => {
            sink.error!(reason);
          });
      };

      sink.onCancel = reason => {
        this.#fullReader!.cancel(reason);

        sink.ready.catch( readyReason => {
          if (this.destroyed) 
          {
            return; // Ignore any pending requests if the worker was terminated.
          }
          throw readyReason;
        });
      };
    });

    messageHandler.on("ReaderHeadersReady", () => {
      const headersCapability = createPromiseCapability<ReaderHeaders>();
      const fullReader = this.#fullReader!;
      fullReader.headersReady.then(() => {
        // If stream or range are disabled, it's our only way to report
        // loading progress.
        if( !fullReader.isStreamingSupported || !fullReader.isRangeSupported )
        {
          if (this.#lastProgress) 
          {
            loadingTask.onProgress?.(this.#lastProgress);
          }
          fullReader.onProgress = evt => {
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
        "GetRangeReader - no `IPDFStream` instance available."
      );
      const rangeReader = this.#networkStream!.getRangeReader(
        data.begin,
        data.end
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
          .then(function ({ value, done }) {
            if (done) {
              sink.close!();
              return;
            }
            assert(
              isArrayBuffer(value),
              "GetRangeReader - expected an ArrayBuffer."
            );
            sink.enqueue(new Uint8Array(value!), 1, [value!]);
          })
          .catch(reason => {
            sink.error!(reason);
          });
      };

      sink.onCancel = reason => {
        rangeReader.cancel(reason);

        sink.ready.catch(readyReason => {
          if (this.destroyed) {
            return; // Ignore any pending requests if the worker was terminated.
          }
          throw readyReason;
        });
      };
    });

    messageHandler.on("GetDoc", ({ pdfInfo }) => {
      this.#numPages = pdfInfo.numPages;
      this._htmlForXfa = pdfInfo.htmlForXfa;
      delete (<any>pdfInfo).htmlForXfa;
      loadingTask._capability.resolve( new PDFDocumentProxy(pdfInfo, this) );
    });

    messageHandler.on("DocException", ex => {
      let reason;
      switch (ex.name) {
        case "PasswordException":
          reason = new PasswordException(ex.message, (<PasswordException>ex).code);
          break;
        case "InvalidPDFException":
          reason = new InvalidPDFException(ex.message);
          break;
        case "MissingPDFException":
          reason = new MissingPDFException(ex.message);
          break;
        case "UnexpectedResponseException":
          reason = new UnexpectedResponseException(ex.message, (<UnexpectedResponseException>ex).status);
          break;
        case "UnknownErrorException":
          reason = new UnknownErrorException(ex.message, (<UnknownErrorException>ex).details);
          break;
        default:
          assert( 0, "DocException - expected a valid Error." );
      }
      loadingTask._capability.reject(reason);
    });

    messageHandler.on("PasswordRequest", exception => {
      this._passwordCapability = createPromiseCapability<{password:string}>();

      if (loadingTask.onPassword) {
        const updatePassword = ( password:string ) => {
          this._passwordCapability!.resolve({
            password,
          });
        };
        try {
          loadingTask.onPassword( updatePassword, exception.code );
        } catch (ex) {
          this._passwordCapability.reject(ex);
        }
      } 
      else {
        this._passwordCapability.reject(
          new PasswordException(exception.message, exception.code)
        );
      }
      return this._passwordCapability.promise;
    });

    messageHandler.on("DataLoaded", data => {
      // For consistency: Ensure that progress is always reported when the
      // entire PDF file has been loaded, regardless of how it was fetched.
      loadingTask.onProgress?.({
        loaded: data.length,
        total: data.length,
      });

      this.downloadInfoCapability.resolve(data);
    });

    messageHandler.on("StartRenderPage", data => {
      // Ignore any pending requests if the worker was terminated.
      if( this.destroyed ) return; 

      const page = this.pageCache[ data.pageIndex ]!;
      page._startRenderPage(data.transparency, data.cacheKey);
    });

    messageHandler.on("commonobj", data => {
      // Ignore any pending requests if the worker was terminated.
      if( this.destroyed ) return; 

      const [id, type, exportedData] = data;
      if( this.commonObjs.has(id) ) return;

      switch( type )
      {
        case "Font":
          const params = this._params;

          if( "error" in exportedData! )
          {
            const exportedError = exportedData.error;
            warn(`Error during font loading: ${exportedError}`);
            this.commonObjs.resolve(id, exportedError);
            break;
          }

          let fontRegistry;
          // if( params.pdfBug && (<any>globalThis).FontInspector?.enabled )
          // {
          //   fontRegistry = {
          //     registerFont( font:FontFaceObject, url?:string )
          //     {
          //       (<any>globalThis).FontInspector.fontAdded(font, url);
          //     },
          //   };
          // }
          const font = new FontFaceObject( <FontExpotDataEx>exportedData, {
            isEvalSupported: params.isEvalSupported,
            disableFontFace: params.disableFontFace,
            ignoreErrors: params.ignoreErrors,
            onUnsupportedFeature: this.#onUnsupportedFeature,
            fontRegistry,
          });

          this.fontLoader
            .bind( font )
            .catch(reason => {
              return messageHandler.sendWithPromise("FontFallback", { id });
            })
            .finally(() => {
              if( !params.fontExtraProperties && font.data )
              {
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
          this.commonObjs.resolve( id, <CmdArgs[] | ImgData>exportedData );
          break;
        default:
          throw new Error(`Got unknown common object type ${type}`);
      }
    });

    messageHandler.on("obj", data => {
      // Ignore any pending requests if the worker was terminated.
      if( this.destroyed ) return;

      const [id, pageIndex, type, imageData] = data;
      const pageProxy = this.pageCache[pageIndex]!;
      if( pageProxy.objs.has(id) ) return;

      switch( type )
      {
        case "Image":
          pageProxy.objs.resolve( id, imageData );

          // Heuristic that will allow us not to store large data.
          const MAX_IMAGE_SIZE_TO_STORE = 8000000;
          if( (<ImgData>imageData)?.data?.length! > MAX_IMAGE_SIZE_TO_STORE )
          {
            pageProxy.cleanupAfterRender = true;
          }
          break;
        case "Pattern":
          pageProxy.objs.resolve(id, imageData);
          break;
        default:
          throw new Error(`Got unknown object type ${type}`);
      }
    });

    messageHandler.on("DocProgress", data => {
      // Ignore any pending requests if the worker was terminated.
      if( this.destroyed ) return; 

      loadingTask.onProgress?.({
        loaded: data.loaded,
        total: data.total,
      });
    });

    messageHandler.on("UnsupportedFeature", this.#onUnsupportedFeature );

    messageHandler.on("FetchBuiltInCMap", data => {
      if (this.destroyed) {
        return Promise.reject<CMapData>(new Error("Worker was destroyed."));
      }
      if (!this.CMapReaderFactory) {
        return Promise.reject<CMapData>(
          new Error(
            "CMapReaderFactory not initialized, see the `useWorkerFetch` parameter."
          )
        );
      }
      return this.CMapReaderFactory.fetch(data);
    });

    messageHandler.on("FetchStandardFontData", data => {
      if (this.destroyed) 
      {
        return Promise.reject<Uint8Array>( new Error("Worker was destroyed.") );
      }
      if (!this.StandardFontDataFactory) 
      {
        return Promise.reject<Uint8Array>(
          new Error(
            "StandardFontDataFactory not initialized, see the `useWorkerFetch` parameter."
          )
        );
      }
      return this.StandardFontDataFactory.fetch( data );
    });
  }

  #onUnsupportedFeature = ({ featureId }:{featureId:UNSUPPORTED_FEATURES} ) => 
  {
    // Ignore any pending requests if the worker was terminated.
    if( this.destroyed ) return; 

    this.loadingTask.onUnsupportedFeature?.(featureId);
  }

  getData() 
  {
    return this.messageHandler.sendWithPromise("GetData", null);
  }

  getPage( pageNumber:number ) 
  {
    if( !Number.isInteger(pageNumber)
     || pageNumber <= 0
     || pageNumber > this.#numPages!
    ) {
      return Promise.reject(new Error("Invalid page request"));
    }

    const pageIndex = pageNumber - 1;
    if( pageIndex in this.pagePromises  ) return this.pagePromises[pageIndex];

    const promise = this.messageHandler
      .sendWithPromise("GetPage", {
        pageIndex,
      })
      .then(pageInfo => {
        if (this.destroyed) {
          throw new Error("Transport destroyed");
        }
        const page = new PDFPageProxy(
          pageIndex,
          pageInfo,
          this,
          this._params.ownerDocument,
          // this._params.pdfBug
        );
        this.pageCache[pageIndex] = page;
        return page;
      });
    this.pagePromises[pageIndex] = promise;
    return promise;
  }

  getPageIndex( ref:Ref ) 
  {
    return this.messageHandler.sendWithPromise("GetPageIndex", {
      ref,
    });
  }

  getAnnotations( pageIndex:number, intent:RenderingIntentFlag )
  {
    return this.messageHandler.sendWithPromise("GetAnnotations", {
      pageIndex,
      intent,
    });
  }

  saveDocument()
  {
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

  getFieldObjects() 
  {
    return (this._getFieldObjectsPromise ||=
      this.messageHandler.sendWithPromise("GetFieldObjects", null));
  }

  hasJSActions()
  {
    return (this._hasJSActionsPromise ||= this.messageHandler.sendWithPromise(
      "HasJSActions",
      null
    ));
  }

  getCalculationOrderIds() 
  {
    return this.messageHandler.sendWithPromise("GetCalculationOrderIds", null);
  }

  getDestinations() 
  {
    return this.messageHandler.sendWithPromise("GetDestinations", null);
  }

  getDestination( id:string ) 
  {
    return this.messageHandler.sendWithPromise("GetDestination", { id });
  }

  getPageLabels() 
  {
    return this.messageHandler.sendWithPromise("GetPageLabels", null);
  }

  getPageLayout() 
  {
    return this.messageHandler.sendWithPromise("GetPageLayout", null);
  }

  getPageMode() 
  {
    return this.messageHandler.sendWithPromise("GetPageMode", null);
  }

  getViewerPreferences() 
  {
    return this.messageHandler.sendWithPromise("GetViewerPreferences", null);
  }

  getOpenAction() 
  {
    return this.messageHandler.sendWithPromise("GetOpenAction", null);
  }

  getAttachments() 
  {
    return this.messageHandler.sendWithPromise("GetAttachments", null);
  }

  getJavaScript() 
  {
    return this.messageHandler.sendWithPromise("GetJavaScript", null);
  }

  getDocJSActions() 
  {
    return this.messageHandler.sendWithPromise("GetDocJSActions", null);
  }

  getPageJSActions( pageIndex:number )
  {
    return this.messageHandler.sendWithPromise("GetPageJSActions", {
      pageIndex,
    });
  }

  getStructTree( pageIndex:number )
  {
    return this.messageHandler.sendWithPromise("GetStructTree", {
      pageIndex,
    });
  }

  getOutline()
  {
    return this.messageHandler.sendWithPromise("GetOutline", null);
  }

  getOptionalContentConfig() 
  {
    return this.messageHandler
      .sendWithPromise("GetOptionalContentConfig", null)
      .then(results => {
        return new OptionalContentConfig(results);
      });
  }

  getPermissions() 
  {
    return this.messageHandler.sendWithPromise("GetPermissions", null);
  }

  getMetadata() 
  {
    return this.messageHandler
      .sendWithPromise("GetMetadata", null)
      .then(results => {
        return {
          info: results[0],
          metadata: results[1] ? new Metadata(results[1]) : undefined,
          contentDispositionFilename: this.#fullReader?.filename ?? undefined,
          contentLength: this.#fullReader?.contentLength ?? undefined,
        };
      });
  }

  getMarkInfo() 
  {
    return this.messageHandler.sendWithPromise("GetMarkInfo", null);
  }

  getStats()
  {
    return this.messageHandler.sendWithPromise("GetStats", null);
  }

  async startCleanup( keepLoadedFonts=false )
  {
    await this.messageHandler.sendWithPromise("Cleanup", null);

    // No need to manually clean-up when destruction has started.
    if( this.destroyed ) return; 

    for( let i = 0, ii = this.pageCache.length; i < ii; i++ )
    {
      const page = this.pageCache[i];
      if( !page ) continue;

      const cleanupSuccessful = page.cleanup();

      if (!cleanupSuccessful) 
      {
        throw new Error(`startCleanup: Page ${i + 1} is currently rendering.`);
      }
    }
    this.commonObjs.clear();
    if (!keepLoadedFonts) 
    {
      this.fontLoader.clear();
    }
    this._getFieldObjectsPromise = undefined;
    this._hasJSActionsPromise = undefined;
  }

  get loadingParams() 
  {
    const params = this._params;
    return shadow(this, "loadingParams", {
      disableAutoFetch: params.disableAutoFetch,
      enableXfa: params.enableXfa,
    });
  }
}

interface Objs_<T>
{
  capability:PromiseCapability<T>;
  data?:T;
  resolved:boolean;
}

/**
 * A PDF document and page is built of many objects. E.g. there are objects for
 * fonts, images, rendering code, etc. These objects may get processed inside of
 * a worker. This class implements some basic methods to manage these objects.
 * @ignore
 */
export class PDFObjects<T>
{
  #objs:Record<string, Objs_<T>> = Object.create(null);

  /**
   * Ensures there is an object defined for `objId`.
   */
  #ensureObj( objId:string )
  {
    if( this.#objs[objId] )
    {
      return this.#objs[objId];
    }
    return (this.#objs[objId] = {
      capability: createPromiseCapability(),
      // data: null,
      resolved: false,
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
  get( objId:string, callback?:( value?:unknown ) => void )
  {
    // If there is a callback, then the get can be async and the object is
    // not required to be resolved right now.
    if (callback) 
    {
      this.#ensureObj(objId).capability.promise.then(callback);
      return undefined;
    }
    // If there isn't a callback, the user expects to get the resolved data
    // directly.
    const obj = this.#objs[objId];
    // If there isn't an object yet or the object isn't resolved, then the
    // data isn't ready yet!
    if (!obj || !obj.resolved) 
    {
      throw new Error(`Requesting object that isn't resolved yet ${objId}.`);
    }
    return obj.data;
  }

  has( objId:string )
  {
    const obj = this.#objs[objId];
    return obj?.resolved || false;
  }

  /**
   * Resolves the object `objId` with optional `data`.
   */
  resolve( objId:string, data:T )
  {
    const obj = this.#ensureObj(objId);

    obj.resolved = true;
    obj.data = data;
    obj.capability.resolve(data);
  }

  clear() 
  {
    this.#objs = Object.create(null);
  }
}

/**
 * Allows controlling of the rendering tasks.
 */
export class RenderTask 
{
  #internalRenderTask;

  /**
   * Callback for incremental rendering -- a function that will be called
   * each time the rendering is paused.  To continue rendering call the
   * function that is the first argument to the callback.
   */
  onContinue?:(( cont:()=>void )=>void);

  constructor( internalRenderTask:InternalRenderTask ) 
  {
    this.#internalRenderTask = internalRenderTask;
  }

  /**
   * Promise for rendering task completion.
   */
  get promise():Promise<void>
  {
    return this.#internalRenderTask.capability.promise;
  }

  /**
   * Cancels the rendering task. If the task is currently rendering it will
   * not be cancelled until graphics pauses with a timeout. The promise that
   * this object extends will be rejected when cancelled.
   */
  cancel() 
  {
    this.#internalRenderTask.cancel();
  }
}

interface Params_IRTCtorParms
{
  canvasContext:CanvasRenderingContext2D;
  viewport:PageViewport;
  transform:matrix_t | undefined;
  imageLayer:ImageLayer | undefined;
  background:string | CanvasGradient | CanvasPattern | undefined;
}

interface InternalRenderTaskCtorParms
{
  callback:( error?:unknown ) => void;
  params:Params_IRTCtorParms;
  objs:PDFObjects<PDFObjs>;
  commonObjs:PDFObjects< PDFCommonObjs >;
  operatorList:OpListIR;
  pageIndex:number;
  canvasFactory:BaseCanvasFactory;
  useRequestAnimationFrame?:boolean;
  pdfBug?:boolean;
}

interface InitializeGraphicsParms
{
  transparency?:boolean;
  optionalContentConfig:OptionalContentConfig | undefined;
}

/**
 * For internal use only.
 * @ignore
 */
export class InternalRenderTask 
{
  static get canvasInUse() 
  {
    return shadow(this, "canvasInUse", new WeakSet());
  }

  callback;
  params;
  objs;
  commonObjs;
  operatorListIdx?:number;
  operatorList;
  _pageIndex;
  canvasFactory;
  _pdfBug;

  running = false;
  graphicsReadyCallback?:() => void;
  graphicsReady = false;
  _useRequestAnimationFrame;
  cancelled = false;
  capability = createPromiseCapability();
  task;
  _canvas;

  // stepper?;

  gfx?:CanvasGraphics;

  constructor({
    callback,
    params,
    objs,
    commonObjs,
    operatorList,
    pageIndex,
    canvasFactory,
    useRequestAnimationFrame=false,
    pdfBug=false,
  }:InternalRenderTaskCtorParms ) 
  {
    this.callback = callback;
    this.params = params;
    this.objs = objs;
    this.commonObjs = commonObjs;
    // this.operatorListIdx = null;
    this.operatorList = operatorList;
    this._pageIndex = pageIndex;
    this.canvasFactory = canvasFactory;
    this._pdfBug = pdfBug;

    // this.running = false;
    // this.graphicsReadyCallback = null;
    // this.graphicsReady = false;
    this._useRequestAnimationFrame =
      useRequestAnimationFrame === true && typeof window !== "undefined";
    // this.cancelled = false;
    // this.capability = createPromiseCapability();
    this.task = new RenderTask(this);
    this._canvas = params.canvasContext.canvas;
  }

  get completed() 
  {
    return this.capability.promise.catch(() => {
      // Ignoring errors, since we only want to know when rendering is
      // no longer pending.
    });
  }

  initializeGraphics({ transparency=false, optionalContentConfig }:InitializeGraphicsParms 
  ) {
    if (this.cancelled) return;

    if( this._canvas )
    {
      if( InternalRenderTask.canvasInUse.has(this._canvas) )
      {
        throw new Error(
          "Cannot use the same canvas during multiple render() operations. " +
          "Use different canvas or ensure previous operations were " +
          "cancelled or completed."
        );
      }
      InternalRenderTask.canvasInUse.add( this._canvas );
    }

    // if( this._pdfBug && globalThis.StepperManager?.enabled )
    // {
    //   this.stepper = globalThis.StepperManager.create(this._pageIndex);
    //   this.stepper.init(this.operatorList);
    //   this.stepper.nextBreakPoint = this.stepper.getNextBreakPoint();
    // }
    const { canvasContext, viewport, transform, imageLayer, background } =
      this.params;

    this.gfx = new CanvasGraphics(
      canvasContext,
      this.commonObjs,
      this.objs,
      this.canvasFactory,
      imageLayer,
      optionalContentConfig
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

  cancel = ( error:any=null ) => {
    this.running = false;
    this.cancelled = true;
    if (this.gfx) 
    {
      this.gfx.endDrawing();
    }
    if (this._canvas) 
    {
      InternalRenderTask.canvasInUse.delete(this._canvas);
    }
    this.callback(
      error ||
        new RenderingCancelledException(
          `Rendering cancelled, page ${this._pageIndex + 1}`,
          "canvas"
        )
    );
  }

  operatorListChanged()
  {
    if( !this.graphicsReady )
    {
      if (!this.graphicsReadyCallback) 
      {
        this.graphicsReadyCallback = this._continue;
      }
      return;
    }

    // if (this.stepper) {
    //   this.stepper.updateOperatorList(this.operatorList);
    // }

    if( this.running ) return;

    this._continue();
  }

  _continue = () =>
  {
    this.running = true;
    if( this.cancelled ) return;

    if( this.task.onContinue )
    {
      this.task.onContinue( this._scheduleNext );
    } 
    else {
      this._scheduleNext();
    }
  }

  _scheduleNext = () =>
  {
    if( this._useRequestAnimationFrame )
    {
      window.requestAnimationFrame(() => {
        this._next().catch( this.cancel );
      });
    } 
    else {
      Promise.resolve().then(this._next).catch( this.cancel );
    }
  }

  _next = async () =>
  {
    if( this.cancelled ) return;

    this.operatorListIdx = this.gfx!.executeOperatorList(
      this.operatorList,
      this.operatorListIdx,
      this._continue,
      // this.stepper
    );
    if( this.operatorListIdx === this.operatorList.argsArray.length )
    {
      this.running = false;
      if( this.operatorList.lastChunk )
      {
        this.gfx!.endDrawing();
        if( this._canvas )
        {
          InternalRenderTask.canvasInUse.delete(this._canvas);
        }
        this.callback();
      }
    }
  }
}

export const version = 0;
export const build = 0;
// export const version:string =
//   typeof PDFJSDev !== "undefined" ? PDFJSDev.eval("BUNDLE_VERSION") : null;
// export const build:string =
//   typeof PDFJSDev !== "undefined" ? PDFJSDev.eval("BUNDLE_BUILD") : null;
/*81---------------------------------------------------------------------------*/
