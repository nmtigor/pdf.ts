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

import type { AnnotStorageRecord } from "../display/annotation_layer.ts";
import { MessageHandler, Thread } from "../shared/message_handler.ts";
import {
  AbortException,
  createValidAbsoluteUrl,
  FeatureTest,
  shadow,
  warn,
} from "../shared/util.ts";
import type { AnnotationFactory } from "./annotation.ts";
import type { Catalog } from "./catalog.ts";
import { ChunkedStreamManager } from "./chunked_stream.ts";
import { MissingDataException } from "./core_utils.ts";
import { Page, PDFDocument } from "./document.ts";
import { Stream } from "./stream.ts";
import type { WorkerTask } from "./worker.ts";
import type { PDFWorkerStream } from "./worker_stream.ts";
import type { XRef } from "./xref.ts";
/*80--------------------------------------------------------------------------*/

function parseDocBaseUrl(url?: string) {
  if (url) {
    const absoluteUrl = createValidAbsoluteUrl(url);
    if (absoluteUrl) {
      return absoluteUrl.href;
    }
    warn(`Invalid absolute docBaseUrl: "${url}".`);
  }
  return undefined;
}

export interface EvaluatorOptions {
  maxImageSize: number | undefined;
  disableFontFace: boolean | undefined;
  ignoreErrors: boolean | undefined;
  isEvalSupported: boolean | undefined;
  isOffscreenCanvasSupported: boolean | undefined;
  canvasMaxAreaInBytes: number;
  fontExtraProperties: boolean | undefined;
  useSystemFonts: boolean | undefined;
  cMapUrl?: string | undefined;
  standardFontDataUrl: string | undefined;
}

interface BasePdfManagerCtorP_ {
  docBaseUrl?: string;
  docId: string;
  password?: string;
  enableXfa?: boolean;
  evaluatorOptions: EvaluatorOptions;
}
export abstract class BasePdfManager {
  private _docBaseUrl;
  get docBaseUrl() {
    const catalog = this.pdfDocument.catalog!;
    return shadow(this, "docBaseUrl", catalog.baseUrl || this._docBaseUrl);
  }

  private _docId;
  /** @final */
  get docId() {
    return this._docId;
  }

  protected _password;
  /** @final */
  get password() {
    return this._password;
  }

  msgHandler!: MessageHandler<Thread.worker>;

  enableXfa;
  evaluatorOptions;

  pdfDocument!: PDFDocument;

  constructor(args: BasePdfManagerCtorP_) {
    this._docBaseUrl = parseDocBaseUrl(args.docBaseUrl);
    this._docId = args.docId;
    this._password = args.password;
    this.enableXfa = args.enableXfa;

    // Check `OffscreenCanvas` support once, rather than repeatedly throughout
    // the worker-thread code.
    args.evaluatorOptions.isOffscreenCanvasSupported &&=
      FeatureTest.isOffscreenCanvasSupported;
    this.evaluatorOptions = args.evaluatorOptions;
  }

  /** @fianl */
  ensureDoc<
    P extends keyof PDFDocument,
    A = PDFDocument[P] extends (...args: any) => any
      ? Parameters<PDFDocument[P]>
      : undefined,
  >(prop: P, args?: A) {
    return this.ensure(this.pdfDocument, prop, args);
  }

  /** @fianl */
  ensureXRef<
    P extends keyof XRef,
    A = XRef[P] extends (...args: any) => any ? Parameters<XRef[P]> : undefined,
  >(prop: P, args?: A) {
    return this.ensure(this.pdfDocument.xref, prop, args);
  }

  /** @fianl */
  ensureCatalog<
    P extends keyof Catalog,
    A = Catalog[P] extends (...args: any) => any ? Parameters<Catalog[P]>
      : undefined,
  >(prop: P, args?: A) {
    return this.ensure(this.pdfDocument.catalog!, prop, args);
  }

  getPage(pageIndex: number) {
    return this.pdfDocument.getPage(pageIndex);
  }

  fontFallback(id: string, handler: MessageHandler<Thread.worker>) {
    return this.pdfDocument.fontFallback(id, handler);
  }

  loadXfaFonts(handler: MessageHandler<Thread.worker>, task: WorkerTask) {
    return this.pdfDocument.loadXfaFonts(handler, task);
  }

  loadXfaImages() {
    return this.pdfDocument.loadXfaImages();
  }

  serializeXfaData(annotationStorage: AnnotStorageRecord | undefined) {
    return this.pdfDocument.serializeXfaData(annotationStorage);
  }

  cleanup(manuallyTriggered = false) {
    return this.pdfDocument.cleanup(manuallyTriggered);
  }

  abstract ensure<
    O extends PDFDocument | Page | XRef | Catalog | AnnotationFactory,
    P extends keyof O,
    A = O[P] extends (...args: any) => any ? Parameters<O[P]> : undefined,
    R = O[P] extends (...args: any) => any ? ReturnType<O[P]> : O[P],
  >(obj: O, prop: P, args?: A): Promise<Awaited<R>>;

  abstract requestRange(begin: number, end: number): Promise<void>;

  abstract requestLoadedStream(noFetch?: boolean): Promise<Stream>;

  sendProgressiveData?(chunk: ArrayBufferLike): void;

  updatePassword(password: string) {
    this._password = password;
  }

  abstract terminate(reason: AbortException): void;
}

export interface LocalPdfManagerCtorP extends BasePdfManagerCtorP_ {
  source: Uint8Array | ArrayBuffer | number[];
}
export class LocalPdfManager extends BasePdfManager {
  #loadedStreamPromise: Promise<Stream>;

  constructor(args: LocalPdfManagerCtorP) {
    super(args);

    const stream = new Stream(args.source);
    this.pdfDocument = new PDFDocument(this, stream);
    this.#loadedStreamPromise = Promise.resolve(stream);
  }

  /** @implement */
  async ensure<
    O extends PDFDocument | Page | XRef | Catalog | AnnotationFactory,
    P extends keyof O,
    A = O[P] extends (...args: any) => any ? Parameters<O[P]> : undefined,
    R = O[P] extends (...args: any) => any ? ReturnType<O[P]> : O[P],
  >(obj: O, prop: P, args: A): Promise<Awaited<R>> {
    const value = obj[prop];
    if (typeof value === "function") {
      return (value as Function).apply(obj, args);
    }
    return value as any;
  }

  /** @implement */
  requestRange(begin: number, end: number) {
    return Promise.resolve();
  }

  /** @implement */
  requestLoadedStream(noFetch = false) {
    return this.#loadedStreamPromise;
  }

  /** @implement */
  terminate(reason: AbortException) {}
}

export interface NetworkPdfManagerCtorP extends BasePdfManagerCtorP_ {
  source: PDFWorkerStream;
  handler: MessageHandler<Thread.worker>;
  length: number;
  disableAutoFetch: boolean;
  rangeChunkSize: number;
}
export class NetworkPdfManager extends BasePdfManager {
  streamManager: ChunkedStreamManager;

  constructor(args: NetworkPdfManagerCtorP) {
    super(args);

    this.streamManager = new ChunkedStreamManager(args.source, {
      msgHandler: args.handler,
      length: args.length,
      disableAutoFetch: args.disableAutoFetch,
      rangeChunkSize: args.rangeChunkSize,
    });
    this.pdfDocument = new PDFDocument(this, this.streamManager.getStream());
  }

  /** @implement */
  async ensure<
    O extends PDFDocument | Page | XRef | Catalog | AnnotationFactory,
    P extends keyof O,
    A = O[P] extends (...args: any) => any ? Parameters<O[P]> : undefined,
    R = O[P] extends (...args: any) => any ? ReturnType<O[P]> : O[P],
  >(obj: O, prop: P, args: A): Promise<Awaited<R>> {
    try {
      const value = obj[prop];
      if (typeof value === "function") {
        return (value as Function).apply(obj, args);
      }
      return value as any;
    } catch (ex) {
      if (!(ex instanceof MissingDataException)) {
        throw ex;
      }
      await this.requestRange(ex.begin, ex.end);
      return this.ensure(obj, prop, args);
    }
  }

  /** @implement */
  requestRange(begin: number, end: number) {
    return this.streamManager.requestRange(begin, end);
  }

  /** @implement */
  requestLoadedStream(noFetch = false) {
    return this.streamManager.requestAllChunks(noFetch);
  }

  override sendProgressiveData(chunk: ArrayBufferLike) {
    this.streamManager.onReceiveData({ chunk });
  }

  /** @implement */
  terminate(reason: AbortException) {
    this.streamManager.abort(reason);
  }
}
/*80--------------------------------------------------------------------------*/
