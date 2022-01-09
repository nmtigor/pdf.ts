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

import { type AnnotStorageRecord } from "../display/annotation_layer.js";
import { Thread, MessageHandler } from "../shared/message_handler.js";
import {
  AbortException,
  createValidAbsoluteUrl,
  warn,
} from "../shared/util.js";
import { AnnotationFactory } from "./annotation.js";
import { Catalog } from "./catalog.js";
import { ChunkedStreamManager } from "./chunked_stream.js";
import { MissingDataException } from "./core_utils.js";
import { Page, PDFDocument } from "./document.js";
import { Stream } from "./stream.js";
import { WorkerTask } from "./worker.js";
import { PDFWorkerStream } from "./worker_stream.js";
import { XRef } from "./xref.js";
/*81---------------------------------------------------------------------------*/

function parseDocBaseUrl( url?:string )
{
  if( url )
  {
    const absoluteUrl = createValidAbsoluteUrl(url);
    if (absoluteUrl) 
    {
      return absoluteUrl.href;
    }
    warn(`Invalid absolute docBaseUrl: "${url}".`);
  }
  return undefined;
}

export interface EvaluatorOptions 
{
  maxImageSize:number;
  disableFontFace:boolean | undefined;
  ignoreErrors:boolean | undefined;
  isEvalSupported:boolean | undefined;
  fontExtraProperties:boolean | undefined;
  useSystemFonts:boolean | undefined;
  cMapUrl?:string | undefined;
  standardFontDataUrl:string | undefined;
}

export abstract class BasePdfManager 
{
  protected _docId:string;
  /** @final */
  get docId() { return this._docId; }

  protected _password?:string | undefined;
  /** @final */
  get password() { return this._password; }

  msgHandler!:MessageHandler<Thread.worker>;

  protected _docBaseUrl:URL | string | undefined;
  get docBaseUrl() 
  {
    return this._docBaseUrl;
  }

  evaluatorOptions!:EvaluatorOptions;
  enableXfa?:boolean | undefined;

  pdfDocument!:PDFDocument;

  constructor( docId:string, docBaseUrl?:string )
  {
    this._docId = docId;
    this._docBaseUrl = parseDocBaseUrl(docBaseUrl);
  }

  abstract onLoadedStream():Promise<Stream>;

  /** @fianl */
  ensureDoc<
    P extends keyof PDFDocument,
    A=PDFDocument[P] extends (...args: any) => any ? Parameters< PDFDocument[P] > : undefined,
  >( prop:P, args?:A ) 
  {
    return this.ensure(this.pdfDocument, prop, args);
  }

  /** @fianl */
  ensureXRef<
    P extends keyof XRef,
    A=XRef[P] extends (...args: any) => any ? Parameters< XRef[P] > : undefined,
  >( prop:P, args?:A ) 
  {
    return this.ensure(this.pdfDocument.xref, prop, args);
  }

  /** @fianl */
  ensureCatalog<
    P extends keyof Catalog,
    A=Catalog[P] extends (...args: any) => any ? Parameters< Catalog[P] > : undefined
  >( prop:P, args?:A ) 
  {
    return this.ensure( this.pdfDocument.catalog!, prop, args );
  }

  getPage( pageIndex:number ) 
  {
    return this.pdfDocument.getPage(pageIndex);
  }

  fontFallback( id:string, handler:MessageHandler<Thread.worker> ) 
  {
    return this.pdfDocument.fontFallback(id, handler);
  }

  loadXfaFonts( handler:MessageHandler<Thread.worker>, task:WorkerTask )
  {
    return this.pdfDocument.loadXfaFonts(handler, task);
  }

  loadXfaImages() {
    return this.pdfDocument.loadXfaImages();
  }

  serializeXfaData( annotationStorage:AnnotStorageRecord | undefined )
  {
    return this.pdfDocument.serializeXfaData( annotationStorage );
  }

  cleanup( manuallyTriggered=false )
  {
    return this.pdfDocument.cleanup(manuallyTriggered);
  }

  abstract ensure<
    O extends PDFDocument | Page | XRef | Catalog | AnnotationFactory,
    P extends keyof O,
    A=O[P] extends (...args:any) => any ? Parameters< O[P] > : undefined,
    R=O[P] extends (...args:any) => any ? ReturnType< O[P] > : O[P]
  >( obj:O, prop:P, args?:A ):Promise< Awaited<R> >;

  abstract requestRange( begin:number, end:number ):Promise<void>;

  abstract requestLoadedStream():void;

  sendProgressiveData?(chunk:ArrayBufferLike ):void;

  updatePassword( password:string ) 
  {
    this._password = password;
  }

  abstract terminate( reason:AbortException ):void;
}

export class LocalPdfManager extends BasePdfManager 
{
  #loadedStreamPromise:Promise<Stream>;

  constructor( docId:string, 
    data:Uint8Array | number[], 
    password:string  | undefined, 
    msgHandler:MessageHandler<Thread.worker>,
    evaluatorOptions:EvaluatorOptions, 
    enableXfa?:boolean,
    docBaseUrl?:string
  ) {
    super( docId, docBaseUrl );

    this._password = password;
    this.msgHandler = msgHandler;
    this.evaluatorOptions = evaluatorOptions;
    this.enableXfa = enableXfa;

    const stream = new Stream(data);
    this.pdfDocument = new PDFDocument(this, stream);
    this.#loadedStreamPromise = Promise.resolve(stream);
  }

  /** @implements */
  async ensure<
    O extends PDFDocument | Page | XRef | Catalog | AnnotationFactory,
    P extends keyof O,
    A=O[P] extends (...args:any) => any ? Parameters< O[P] > : undefined,
    R=O[P] extends (...args:any) => any ? ReturnType< O[P] > : O[P]
  >( obj:O, prop:P, args:A ):Promise< Awaited<R> >
  {
    const value = obj[prop];
    if (typeof value === "function") 
    {
      return value.apply(obj, args);
    }
    return <any>value;
  }

  // ensure = ( obj, prop, args ) =>
  // {
  //   const value = obj[prop];
  //   if (typeof value === "function") {
  //     return value.apply(obj, args);
  //   }
  //   return value;
  // }

  /** @implements */
  requestRange( begin:number, end:number ) 
  {
    return Promise.resolve();
  }

  /** @implements */
  requestLoadedStream() {}

  /** @implements */
  onLoadedStream()
  {
    return this.#loadedStreamPromise;
  }

  /** @implements */
  terminate( reason:AbortException ) {}
}

interface NetworkPdfManagerCtorParms
{
  msgHandler:MessageHandler< Thread.worker >;
  password:string | undefined;
  length:number;
  disableAutoFetch:boolean;
  rangeChunkSize:number;
}

export class NetworkPdfManager extends BasePdfManager 
{
  streamManager:ChunkedStreamManager;

  constructor( docId:string, 
    pdfNetworkStream:PDFWorkerStream, 
    args:NetworkPdfManagerCtorParms,
    evaluatorOptions:EvaluatorOptions, 
    enableXfa?:boolean,
    docBaseUrl?:string
  ) {
    super( docId, docBaseUrl );

    this._password = args.password;
    this.msgHandler = args.msgHandler;
    this.evaluatorOptions = evaluatorOptions;
    this.enableXfa = enableXfa;

    this.streamManager = new ChunkedStreamManager(pdfNetworkStream, {
      msgHandler: args.msgHandler,
      length: args.length,
      disableAutoFetch: args.disableAutoFetch,
      rangeChunkSize: args.rangeChunkSize,
    });
    this.pdfDocument = new PDFDocument( this, this.streamManager.getStream() );
  }

  /** @implements */
  async ensure<
    O extends PDFDocument | Page | XRef | Catalog | AnnotationFactory,
    P extends keyof O,
    A=O[P] extends (...args:any) => any ? Parameters< O[P] > : undefined,
    R=O[P] extends (...args:any) => any ? ReturnType< O[P] > : O[P]
  >( obj:O, prop:P, args:A ):Promise< Awaited<R> >
  {
    try {
      const value = obj[prop];
      if (typeof value === "function") {
        return value.apply(obj, args);
      }
      return <any>value;
    } catch (ex) {
      if (!(ex instanceof MissingDataException)) 
      {
        throw ex;
      }
      await this.requestRange(ex.begin, ex.end);
      return this.ensure(obj, prop, args);
    }
  }

  /** @implements */
  requestRange( begin:number, end:number ) 
  {
    return this.streamManager.requestRange(begin, end);
  }

  /** @implements */
  requestLoadedStream() 
  {
    this.streamManager.requestAllChunks();
  }

  override sendProgressiveData( chunk:ArrayBufferLike ) 
  {
    this.streamManager.onReceiveData({ chunk });
  }

  /** @implements */
  onLoadedStream()
  {
    return this.streamManager.onLoadedStream();
  }

  /** @implements */
  terminate( reason:AbortException ) 
  {
    this.streamManager.abort(reason);
  }
}
/*81---------------------------------------------------------------------------*/
