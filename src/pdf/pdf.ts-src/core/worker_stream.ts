/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2023
 */

/* Copyright 2019 Mozilla Foundation
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

import { assert } from "@fe-lib/util/trace.ts";
import type {
  IPDFStream,
  IPDFStreamRangeReader,
  IPDFStreamReader,
  ReadValue,
} from "../interfaces.ts";
import type { MessageHandler, Thread } from "../shared/message_handler.ts";
import { AbortException } from "../shared/util.ts";
/*80--------------------------------------------------------------------------*/

export class PDFWorkerStream implements IPDFStream {
  #msgHandler;
  // #contentLength?:number;
  #fullRequestReader?: PDFWorkerStreamReader;
  #rangeRequestReaders: PDFWorkerStreamRangeReader[] = [];

  constructor(msgHandler: MessageHandler<Thread.worker>) {
    this.#msgHandler = msgHandler;
  }

  /** @implement */
  getFullReader() {
    assert(
      !this.#fullRequestReader,
      "PDFWorkerStream.getFullReader can only be called once.",
    );
    this.#fullRequestReader = new PDFWorkerStreamReader(this.#msgHandler);
    return this.#fullRequestReader;
  }

  /** @implement */
  getRangeReader(begin: number, end: number) {
    const reader = new PDFWorkerStreamRangeReader(begin, end, this.#msgHandler);
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

class PDFWorkerStreamReader implements IPDFStreamReader {
  #msgHandler;
  /** @implement */
  onProgress = undefined;

  #contentLength?: number | undefined;
  /** @implement */
  get contentLength() {
    return this.#contentLength;
  }

  #isRangeSupported = false;
  /** @implement */
  get isRangeSupported() {
    return this.#isRangeSupported;
  }

  #isStreamingSupported = false;
  /** @implement */
  get isStreamingSupported() {
    return this.#isStreamingSupported;
  }

  #reader: ReadableStreamDefaultReader<Uint8Array>;

  #headersReady: Promise<void>;
  /** @implement */
  get headersReady() {
    return this.#headersReady;
  }

  /** @implement */
  readonly filename = undefined;

  constructor(msgHandler: MessageHandler<Thread.worker>) {
    this.#msgHandler = msgHandler;

    const readableStream = this.#msgHandler.sendWithStream("GetReader", null);
    this.#reader = readableStream.getReader();

    this.#headersReady = this.#msgHandler
      .sendWithPromise("ReaderHeadersReady", null)
      .then((data) => {
        this.#isStreamingSupported = data.isStreamingSupported;
        this.#isRangeSupported = data.isRangeSupported;
        this.#contentLength = data.contentLength;
      });
  }

  /** @implement */
  async read() {
    const { value, done } = await this.#reader.read();
    if (done) {
      return { done: true } as ReadValue;
    }
    // `value` is wrapped into Uint8Array, we need to
    // unwrap it to ArrayBuffer for further processing.
    return { value: value!.buffer, done: false } as ReadValue;
  }

  /** @implement */
  cancel(reason: object) {
    this.#reader.cancel(reason);
  }
}

class PDFWorkerStreamRangeReader implements IPDFStreamRangeReader {
  #msgHandler;
  /** @implement */
  onProgress: ((data: { loaded: number }) => void) | undefined;

  #reader: ReadableStreamDefaultReader<Uint8Array>;

  constructor(
    begin: number,
    end: number,
    msgHandler: MessageHandler<Thread.worker>,
  ) {
    this.#msgHandler = msgHandler;

    const readableStream = this.#msgHandler.sendWithStream("GetRangeReader", {
      begin,
      end,
    });
    this.#reader = readableStream.getReader();
  }

  get isStreamingSupported() {
    return false;
  }

  /** @implement */
  async read() {
    const { value, done } = await this.#reader.read();
    if (done) {
      return { done: true } as ReadValue;
    } else return { value: value!.buffer, done: false } as ReadValue;
  }

  /** @implement */
  cancel(reason: object) {
    this.#reader.cancel(reason);
  }
}
/*80--------------------------------------------------------------------------*/
