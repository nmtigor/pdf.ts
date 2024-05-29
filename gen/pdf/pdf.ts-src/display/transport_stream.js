/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/transport_stream.ts
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
import { PromiseCap } from "../../../lib/util/PromiseCap.js";
import { assert } from "../../../lib/util/trace.js";
import { isPdfFile } from "./display_utils.js";
export class PDFDataTransportStream {
    #queuedChunks = [];
    #progressiveDone;
    _contentDispositionFilename;
    #pdfDataRangeTransport;
    _isStreamingSupported;
    _isRangeSupported;
    _contentLength;
    _fullRequestReader;
    #rangeReaders = [];
    constructor(pdfDataRangeTransport, { disableRange = false, disableStream = false }) {
        assert(pdfDataRangeTransport, 'PDFDataTransportStream - missing required "pdfDataRangeTransport" argument.');
        const { length, initialData, progressiveDone, contentDispositionFilename } = pdfDataRangeTransport;
        this.#progressiveDone = progressiveDone;
        this._contentDispositionFilename = contentDispositionFilename;
        if (initialData?.length > 0) {
            // Prevent any possible issues by only transferring a Uint8Array that
            // completely "utilizes" its underlying ArrayBuffer.
            const buffer = initialData instanceof Uint8Array &&
                initialData.byteLength === initialData.buffer.byteLength
                ? initialData.buffer
                : new Uint8Array(initialData).buffer;
            this.#queuedChunks.push(buffer);
        }
        this.#pdfDataRangeTransport = pdfDataRangeTransport;
        this._isStreamingSupported = !disableStream;
        this._isRangeSupported = !disableRange;
        this._contentLength = length;
        pdfDataRangeTransport.addRangeListener((begin, chunk) => {
            this.#onReceiveData({ begin, chunk });
        });
        pdfDataRangeTransport.addProgressListener((loaded, total) => {
            this.#onProgress({ loaded, total });
        });
        pdfDataRangeTransport.addProgressiveReadListener((chunk) => {
            this.#onReceiveData({ chunk });
        });
        pdfDataRangeTransport.addProgressiveDoneListener(() => {
            this._onProgressiveDone();
        });
        pdfDataRangeTransport.transportReady();
    }
    #onReceiveData({ begin, chunk }) {
        // Prevent any possible issues by only transferring a Uint8Array that
        // completely "utilizes" its underlying ArrayBuffer.
        const buffer = chunk instanceof Uint8Array &&
            chunk.byteLength === chunk.buffer.byteLength
            ? chunk.buffer
            : new Uint8Array(chunk).buffer;
        if (begin === undefined) {
            if (this._fullRequestReader) {
                this._fullRequestReader._enqueue(buffer);
            }
            else {
                this.#queuedChunks.push(buffer);
            }
        }
        else {
            const found = this.#rangeReaders.some((rangeReader) => {
                if (rangeReader._begin !== begin) {
                    return false;
                }
                rangeReader._enqueue(buffer);
                return true;
            });
            assert(found, "#onReceiveData - no `PDFDataTransportStreamRangeReader` instance found.");
        }
    }
    get _progressiveDataLength() {
        return this._fullRequestReader?._loaded ?? 0;
    }
    #onProgress = (evt) => {
        if (evt.total === undefined) {
            // Reporting to first range reader, if it exists.
            this.#rangeReaders[0]?.onProgress?.({ loaded: evt.loaded });
        }
        else {
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
    _removeRangeReader(reader) {
        const i = this.#rangeReaders.indexOf(reader);
        if (i >= 0) {
            this.#rangeReaders.splice(i, 1);
        }
    }
    /** @implement */
    getFullReader() {
        assert(!this._fullRequestReader, "PDFDataTransportStream.getFullReader can only be called once.");
        const queuedChunks = this.#queuedChunks;
        this.#queuedChunks = undefined;
        return new PDFDataTransportStreamReader(this, queuedChunks, this.#progressiveDone, this._contentDispositionFilename);
    }
    /** @implement */
    getRangeReader(begin, end) {
        if (end <= this._progressiveDataLength) {
            return undefined;
        }
        const reader = new PDFDataTransportStreamRangeReader(this, begin, end);
        this.#pdfDataRangeTransport.requestDataRange(begin, end);
        this.#rangeReaders.push(reader);
        return reader;
    }
    /** @implement */
    cancelAllRequests(reason) {
        this._fullRequestReader?.cancel(reason);
        for (const reader of this.#rangeReaders.slice(0)) {
            reader.cancel(reason);
        }
        this.#pdfDataRangeTransport.abort();
    }
}
class PDFDataTransportStreamReader {
    #stream;
    #done;
    #filename;
    /** @implement */
    get filename() {
        return this.#filename;
    }
    #queuedChunks;
    _loaded = 0;
    #requests = [];
    #headersReady = Promise.resolve();
    get headersReady() {
        return this.#headersReady;
    }
    /** @implement */
    onProgress;
    constructor(stream, queuedChunks = undefined, progressiveDone = false, contentDispositionFilename) {
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
    _enqueue(chunk) {
        if (this.#done) {
            // Ignore new data.
            return;
        }
        if (this.#requests.length > 0) {
            const requestCapability = this.#requests.shift();
            requestCapability.resolve({ value: chunk, done: false });
        }
        else {
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
            return { value: chunk, done: false };
        }
        if (this.#done) {
            return { done: true };
        }
        const requestCapability = new PromiseCap();
        this.#requests.push(requestCapability);
        return requestCapability.promise;
    }
    /** @implement */
    cancel(reason) {
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
class PDFDataTransportStreamRangeReader {
    #stream;
    _begin;
    _end;
    #queuedChunk;
    #requests = [];
    #done = false;
    /** @implement */
    onProgress;
    /** @implement */
    get isStreamingSupported() {
        return false;
    }
    constructor(stream, begin, end) {
        this.#stream = stream;
        this._begin = begin;
        this._end = end;
    }
    _enqueue(chunk) {
        if (this.#done) {
            // ignore new data
            return;
        }
        if (this.#requests.length === 0) {
            this.#queuedChunk = chunk;
        }
        else {
            const requestsCapability = this.#requests.shift();
            requestsCapability.resolve({ value: chunk, done: false });
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
            return { value: chunk, done: false };
        }
        if (this.#done) {
            return { done: true };
        }
        const requestCapability = new PromiseCap();
        this.#requests.push(requestCapability);
        return requestCapability.promise;
    }
    /** @implement */
    cancel(reason) {
        this.#done = true;
        for (const requestCapability of this.#requests) {
            requestCapability.resolve({ done: true });
        }
        this.#requests.length = 0;
        this.#stream._removeRangeReader(this);
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=transport_stream.js.map