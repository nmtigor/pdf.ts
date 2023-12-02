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

import { PromiseCap } from "@fe-lib/util/PromiseCap.ts";
import { assert } from "@fe-lib/util/trace.ts";
import type {
  IPDFStream,
  IPDFStreamRangeReader,
  IPDFStreamReader,
  ReadValue,
} from "../interfaces.ts";
import type { PDFDataRangeTransport } from "../pdf.ts";
import { AbortException } from "../shared/util.ts";
import { isPdfFile } from "./display_utils.ts";
/*80--------------------------------------------------------------------------*/

interface StreamInitP_ {
  length: number;
  initialData: ArrayLike<number> | undefined;
  progressiveDone: boolean | undefined;
  contentDispositionFilename: string | undefined;
  disableRange: boolean | undefined;
  disableStream: boolean | undefined;
}

export class PDFDataTransportStream implements IPDFStream {
  #queuedChunks: ArrayBufferLike[] | undefined = [];
  #progressiveDone: boolean;
  _contentDispositionFilename;

  #pdfDataRangeTransport: PDFDataRangeTransport;
  _isStreamingSupported: boolean;
  _isRangeSupported: boolean;
  _contentLength: number;

  _fullRequestReader?: PDFDataTransportStreamReader;
  #rangeReaders: PDFDataTransportStreamRangeReader[] = [];

  constructor({
    length,
    initialData,
    progressiveDone = false,
    contentDispositionFilename,
    disableRange = false,
    disableStream = false,
  }: StreamInitP_, pdfDataRangeTransport: PDFDataRangeTransport) {
    this.#progressiveDone = progressiveDone;
    this._contentDispositionFilename = contentDispositionFilename;

    if (initialData?.length as any > 0) {
      // Prevent any possible issues by only transferring a Uint8Array that
      // completely "utilizes" its underlying ArrayBuffer.
      const buffer = initialData instanceof Uint8Array &&
          initialData.byteLength === initialData.buffer.byteLength
        ? initialData.buffer
        : new Uint8Array(initialData!).buffer;
      this.#queuedChunks!.push(buffer);
    }

    this.#pdfDataRangeTransport = pdfDataRangeTransport;
    this._isStreamingSupported = !disableStream;
    this._isRangeSupported = !disableRange;
    this._contentLength = length;

    this.#pdfDataRangeTransport.addRangeListener(
      (begin: number, chunk: ArrayBufferLike) => {
        this.#onReceiveData({ begin, chunk });
      },
    );

    this.#pdfDataRangeTransport.addProgressListener(
      (loaded: number, total?: number) => {
        this.#onProgress({ loaded, total });
      },
    );

    this.#pdfDataRangeTransport.addProgressiveReadListener(
      (chunk: ArrayBufferLike) => {
        this.#onReceiveData({ chunk });
      },
    );

    this.#pdfDataRangeTransport.addProgressiveDoneListener(() => {
      this._onProgressiveDone();
    });

    this.#pdfDataRangeTransport.transportReady();
  }

  #onReceiveData({ begin, chunk }: { begin?: number; chunk: ArrayBufferLike }) {
    // Prevent any possible issues by only transferring a Uint8Array that
    // completely "utilizes" its underlying ArrayBuffer.
    const buffer = chunk instanceof Uint8Array &&
        chunk.byteLength === chunk.buffer.byteLength
      ? chunk.buffer
      : new Uint8Array(chunk).buffer;

    if (begin === undefined) {
      if (this._fullRequestReader) {
        this._fullRequestReader._enqueue(buffer);
      } else {
        this.#queuedChunks!.push(buffer);
      }
    } else {
      const found = this.#rangeReaders.some((rangeReader) => {
        if (rangeReader._begin !== begin) {
          return false;
        }
        rangeReader._enqueue(buffer);
        return true;
      });
      assert(
        found,
        "#onReceiveData - no `PDFDataTransportStreamRangeReader` instance found.",
      );
    }
  }

  get _progressiveDataLength() {
    return this._fullRequestReader?._loaded ?? 0;
  }

  #onProgress = (evt: { loaded: number; total?: number | undefined }) => {
    if (evt.total === undefined) {
      // Reporting to first range reader, if it exists.
      this.#rangeReaders[0]?.onProgress?.({ loaded: evt.loaded });
    } else {
      this._fullRequestReader?.onProgress?.({
        loaded: evt.loaded,
        total: evt.total,
      });
    }
  };

  _onProgressiveDone() {
    this._fullRequestReader?.progressiveDone();
    this.#progressiveDone = true;
  }

  _removeRangeReader(reader: PDFDataTransportStreamRangeReader) {
    const i = this.#rangeReaders.indexOf(reader);
    if (i >= 0) {
      this.#rangeReaders.splice(i, 1);
    }
  }

  /** @implement */
  getFullReader() {
    assert(
      !this._fullRequestReader,
      "PDFDataTransportStream.getFullReader can only be called once.",
    );
    const queuedChunks = this.#queuedChunks;
    this.#queuedChunks = undefined;
    return new PDFDataTransportStreamReader(
      this,
      queuedChunks,
      this.#progressiveDone,
      this._contentDispositionFilename,
    );
  }

  /** @implement */
  getRangeReader(begin: number, end: number) {
    if (end <= this._progressiveDataLength) {
      return undefined;
    }
    const reader = new PDFDataTransportStreamRangeReader(this, begin, end);
    this.#pdfDataRangeTransport.requestDataRange(begin, end);
    this.#rangeReaders.push(reader);
    return reader;
  }

  /** @implement */
  cancelAllRequests(reason: AbortException) {
    this._fullRequestReader?.cancel(reason);

    for (const reader of this.#rangeReaders.slice(0)) {
      reader.cancel(reason);
    }
    this.#pdfDataRangeTransport.abort();
  }
}

class PDFDataTransportStreamReader implements IPDFStreamReader {
  #stream: PDFDataTransportStream;
  #done: boolean;

  #filename: string | undefined;
  /** @implement */
  get filename() {
    return this.#filename;
  }

  #queuedChunks: ArrayBufferLike[];
  _loaded = 0;
  #requests: PromiseCap<ReadValue>[] = [];

  #headersReady = Promise.resolve();
  get headersReady() {
    return this.#headersReady;
  }

  /** @implement */
  onProgress: ((data: OnProgressP) => void) | undefined;

  constructor(
    stream: PDFDataTransportStream,
    queuedChunks: ArrayBufferLike[] | undefined = undefined,
    progressiveDone = false,
    contentDispositionFilename?: string,
  ) {
    this.#stream = stream;
    this.#done = progressiveDone || false;
    this.#filename = isPdfFile(contentDispositionFilename)
      ? contentDispositionFilename
      : undefined;
    this.#queuedChunks = queuedChunks || [];
    for (const chunk of this.#queuedChunks) {
      this._loaded += chunk.byteLength;
    }
    stream._fullRequestReader = this;
  }

  _enqueue(chunk: ArrayBufferLike) {
    if (this.#done) {
      // Ignore new data.
      return;
    }
    if (this.#requests.length > 0) {
      const requestCapability = this.#requests.shift();
      requestCapability!.resolve({ value: chunk, done: false });
    } else {
      this.#queuedChunks.push(chunk);
    }
    this._loaded += chunk.byteLength;
  }

  get isRangeSupported() {
    return this.#stream._isRangeSupported;
  }

  get isStreamingSupported() {
    return this.#stream._isStreamingSupported;
  }

  /** @implement */
  get contentLength() {
    return this.#stream._contentLength;
  }

  /** @implement */
  async read() {
    if (this.#queuedChunks.length > 0) {
      const chunk = this.#queuedChunks.shift();
      return { value: chunk, done: false } as ReadValue;
    }
    if (this.#done) {
      return { done: true } as ReadValue;
    }
    const requestCapability = new PromiseCap<ReadValue>();
    this.#requests.push(requestCapability);
    return requestCapability.promise;
  }

  /** @implement */
  cancel(reason: object) {
    this.#done = true;
    for (const requestCapability of this.#requests) {
      requestCapability.resolve({ done: true });
    }
    this.#requests.length = 0;
  }

  progressiveDone() {
    if (this.#done) {
      return;
    }
    this.#done = true;
  }
}

class PDFDataTransportStreamRangeReader implements IPDFStreamRangeReader {
  #stream: PDFDataTransportStream;
  _begin: number;
  _end: number;
  #queuedChunk: ArrayBufferLike | undefined;
  #requests: PromiseCap<ReadValue>[] = [];
  #done = false;

  /** @implement */
  onProgress: ((data: { loaded: number }) => void) | undefined;

  /** @implement */
  get isStreamingSupported() {
    return false;
  }

  constructor(stream: PDFDataTransportStream, begin: number, end: number) {
    this.#stream = stream;
    this._begin = begin;
    this._end = end;
  }

  _enqueue(chunk: ArrayBufferLike) {
    if (this.#done) {
      // ignore new data
      return;
    }
    if (this.#requests.length === 0) {
      this.#queuedChunk = chunk;
    } else {
      const requestsCapability = this.#requests.shift();
      requestsCapability!.resolve({ value: chunk, done: false });
      for (const requestCapability of this.#requests) {
        requestCapability.resolve({ done: true });
      }
      this.#requests.length = 0;
    }
    this.#done = true;
    this.#stream._removeRangeReader(this);
  }

  /** @implement */
  async read() {
    if (this.#queuedChunk) {
      const chunk = this.#queuedChunk;
      this.#queuedChunk = undefined;
      return { value: chunk, done: false } as ReadValue;
    }
    if (this.#done) {
      return { done: true } as ReadValue;
    }
    const requestCapability = new PromiseCap<ReadValue>();
    this.#requests.push(requestCapability);
    return requestCapability.promise;
  }

  /** @implement */
  cancel(reason: object) {
    this.#done = true;
    for (const requestCapability of this.#requests) {
      requestCapability.resolve({ done: true });
    }
    this.#requests.length = 0;
    this.#stream._removeRangeReader(this);
  }
}
/*80--------------------------------------------------------------------------*/
