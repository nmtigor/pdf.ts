/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/fetch_stream.ts
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

import { PromiseCap } from "@fe-lib/util/PromiseCap.ts";
import { assert } from "@fe-lib/util/trace.ts";
import { MOZCENTRAL } from "@fe-src/global.ts";
import type {
  IPDFStream,
  IPDFStreamRangeReader,
  IPDFStreamReader,
  ReadValue,
} from "../interfaces.ts";
import { AbortException, warn } from "../shared/util.ts";
import type { DocumentInitP } from "./api.ts";
import {
  createResponseStatusError,
  extractFilenameFromHeader,
  validateRangeRequestCapabilities,
  validateResponseStatus,
} from "./network_utils.ts";
/*80--------------------------------------------------------------------------*/

/*#static*/ if (MOZCENTRAL) {
  throw new Error(
    'Module "./fetch_stream.js" shall not be used with MOZCENTRAL builds.',
  );
}

function createFetchOptions(
  headers: Headers,
  withCredentials: boolean,
  abortController: AbortController,
) {
  return {
    method: "GET",
    headers,
    signal: abortController.signal,
    mode: "cors" as RequestMode,
    credentials:
      (withCredentials ? "include" : "same-origin") as RequestCredentials,
    redirect: "follow" as RequestRedirect,
  };
}

function createHeaders(httpHeaders: Record<string, string>) {
  const headers = new Headers();
  for (const property in httpHeaders) {
    const value = httpHeaders[property];
    if (value === undefined) {
      continue;
    }
    headers.append(property, value);
  }
  return headers;
}

function getArrayBuffer(val: Uint8Array | ArrayBuffer) {
  if (val instanceof Uint8Array) {
    if (val.length !== val.buffer.byteLength) {
      return val.buffer.slice(val.byteOffset, val.byteOffset + val.length);
    } else {
      return val.buffer;
    }
  }
  if (val instanceof ArrayBuffer) {
    return val;
  }
  warn(`getArrayBuffer - unexpected data format: ${val}`);
  return new Uint8Array(val).buffer;
}

export class PDFFetchStream implements IPDFStream {
  source;
  isHttp;
  httpHeaders: Record<string, string>;

  #fullRequestReader: PDFFetchStreamReader | undefined;
  get _progressiveDataLength() {
    return this.#fullRequestReader?._loaded ?? 0;
  }

  #rangeRequestReaders: PDFFetchStreamRangeReader[] = [];

  constructor(source: DocumentInitP) {
    this.source = source;
    this.isHttp = /^https?:/i.test(source.url!.toString());
    this.httpHeaders = (this.isHttp && source.httpHeaders) || {};
  }

  /** @implement */
  getFullReader() {
    assert(
      !this.#fullRequestReader,
      "PDFFetchStream.getFullReader can only be called once.",
    );
    this.#fullRequestReader = new PDFFetchStreamReader(this);
    return this.#fullRequestReader;
  }

  /** @implement */
  getRangeReader(begin: number, end: number) {
    if (end <= this._progressiveDataLength) {
      return undefined;
    }
    const reader = new PDFFetchStreamRangeReader(this, begin, end);
    this.#rangeRequestReaders.push(reader);
    return reader;
  }

  /** @implement */
  cancelAllRequests(reason: AbortException) {
    this.#fullRequestReader?.cancel(reason);

    for (const reader of this.#rangeRequestReaders.slice(0)) {
      reader.cancel(reason);
    }
  }
}

class PDFFetchStreamReader implements IPDFStreamReader {
  #stream: PDFFetchStream;
  #reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  _loaded = 0;

  #filename: string | undefined;
  get filename() {
    return this.#filename;
  }

  #withCredentials: boolean;

  #contentLength: number | undefined;
  /** @implement */
  get contentLength() {
    return this.#contentLength!;
  }

  #headersCapability = new PromiseCap();
  get headersReady() {
    return this.#headersCapability.promise;
  }

  #disableRange: boolean;
  #rangeChunkSize?: number | undefined;

  #abortController = new AbortController();

  #isStreamingSupported: boolean;
  /** @implement */
  get isStreamingSupported() {
    return this.#isStreamingSupported;
  }

  #isRangeSupported: boolean;
  /** @implement */
  get isRangeSupported() {
    return this.#isRangeSupported;
  }

  #headers: Headers;

  /** @implement */
  onProgress: ((data: OnProgressP) => void) | undefined;

  constructor(stream: PDFFetchStream) {
    this.#stream = stream;
    const source = stream.source;
    this.#withCredentials = source.withCredentials || false;
    this.#contentLength = source.length;
    this.#disableRange = source.disableRange || false;
    this.#rangeChunkSize = source.rangeChunkSize;
    if (!this.#rangeChunkSize && !this.#disableRange) {
      this.#disableRange = true;
    }

    this.#isStreamingSupported = !source.disableStream;
    this.#isRangeSupported = !source.disableRange;

    this.#headers = createHeaders(this.#stream.httpHeaders);

    const url = source.url!;
    fetch(
      url,
      createFetchOptions(
        this.#headers,
        this.#withCredentials,
        this.#abortController,
      ),
    )
      .then((response) => {
        if (!validateResponseStatus(response.status)) {
          throw createResponseStatusError(response.status, url);
        }
        this.#reader = response.body!.getReader();
        this.#headersCapability.resolve();

        const getResponseHeader = (name: string) => response.headers.get(name);
        const { allowRangeRequests, suggestedLength } =
          validateRangeRequestCapabilities({
            getResponseHeader,
            isHttp: this.#stream.isHttp,
            rangeChunkSize: this.#rangeChunkSize!,
            disableRange: this.#disableRange,
          });

        this.#isRangeSupported = allowRangeRequests;
        // console.log(`#isRangeSupported=${this.#isRangeSupported}`);
        // Setting right content length.
        this.#contentLength = suggestedLength || this.#contentLength;

        this.#filename = extractFilenameFromHeader(getResponseHeader);

        // We need to stop reading when range is supported and streaming is
        // disabled.
        if (!this.#isStreamingSupported && this.#isRangeSupported) {
          this.cancel(new AbortException("Streaming is disabled."));
        }
      })
      .catch(this.#headersCapability.reject);
  }

  /** @implement */
  async read() {
    await this.#headersCapability.promise;
    const { value, done } = await this.#reader!.read();
    if (done) {
      return { value, done } as ReadValue;
    }
    this._loaded += value!.byteLength;
    this.onProgress?.({
      loaded: this._loaded,
      total: this.#contentLength!,
    });

    return { value: getArrayBuffer(value), done: false };
  }

  /** @implement */
  cancel(reason: object) {
    this.#reader?.cancel(reason);
    this.#abortController.abort();
  }
}

export class PDFFetchStreamRangeReader implements IPDFStreamRangeReader {
  #stream: PDFFetchStream;
  #reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  _loaded = 0;
  #withCredentials: boolean;
  #readCapability = new PromiseCap();

  #isStreamingSupported: boolean;
  /** @implement */
  get isStreamingSupported() {
    return this.#isStreamingSupported;
  }

  #abortController = new AbortController();

  #headers: Headers;

  /** @implement */
  onProgress: ((data: { loaded: number }) => void) | undefined;

  constructor(stream: PDFFetchStream, begin: number, end: number) {
    this.#stream = stream;
    const source = stream.source;
    this.#withCredentials = source.withCredentials || false;
    this.#isStreamingSupported = !source.disableStream;

    this.#headers = createHeaders(this.#stream.httpHeaders);
    this.#headers.append("Range", `bytes=${begin}-${end - 1}`);

    const url = source.url!;
    fetch(
      url,
      createFetchOptions(
        this.#headers,
        this.#withCredentials,
        this.#abortController,
      ),
    )
      .then((response: Response) => {
        if (!validateResponseStatus(response.status)) {
          throw createResponseStatusError(response.status, url);
        }
        this.#readCapability.resolve();
        this.#reader = response.body!.getReader();
      })
      .catch(this.#readCapability.reject);
  }

  /** @implement */
  async read() {
    await this.#readCapability.promise;
    const { value, done } = await this.#reader!.read();
    if (done) {
      return { value, done } as ReadValue;
    }
    this._loaded += value!.byteLength;
    this.onProgress?.({ loaded: this._loaded });

    return { value: getArrayBuffer(value), done: false };
  }

  /** @implement */
  cancel(reason: object) {
    this.#reader?.cancel(reason);
    this.#abortController.abort();
  }
}
/*80--------------------------------------------------------------------------*/
