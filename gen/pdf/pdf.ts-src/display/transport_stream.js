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
import { createPromiseCap } from "../../../lib/promisecap.js";
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
    _fullRequestReader = null;
    #rangeReaders = [];
    constructor(params, pdfDataRangeTransport) {
        this.#progressiveDone = params.progressiveDone || false;
        this._contentDispositionFilename = params.contentDispositionFilename || null;
        const initialData = params.initialData;
        if (initialData.length > 0) {
            const buffer = new Uint8Array(initialData).buffer;
            this.#queuedChunks.push(buffer);
        }
        this.#pdfDataRangeTransport = pdfDataRangeTransport;
        this._isStreamingSupported = !params.disableStream;
        this._isRangeSupported = !params.disableRange;
        this._contentLength = params.length;
        this.#pdfDataRangeTransport.addRangeListener((begin, chunk) => {
            this.#onReceiveData({ begin, chunk });
        });
        this.#pdfDataRangeTransport.addProgressListener((loaded, total) => {
            this.#onProgress({ loaded, total });
        });
        this.#pdfDataRangeTransport.addProgressiveReadListener((chunk) => {
            this.#onReceiveData({ chunk });
        });
        this.#pdfDataRangeTransport.addProgressiveDoneListener(() => {
            this._onProgressiveDone();
        });
        this.#pdfDataRangeTransport.transportReady();
    }
    #onReceiveData = (args) => {
        const buffer = new Uint8Array(args.chunk).buffer;
        if (args.begin === undefined) {
            if (this._fullRequestReader) {
                this._fullRequestReader._enqueue(buffer);
            }
            else {
                this.#queuedChunks.push(buffer);
            }
        }
        else {
            const found = this.#rangeReaders.some(function (rangeReader) {
                if (rangeReader._begin !== args.begin) {
                    return false;
                }
                rangeReader._enqueue(buffer);
                return true;
            });
            assert(found, "#onReceiveData - no `PDFDataTransportStreamRangeReader` instance found.");
        }
    };
    get _progressiveDataLength() {
        return this._fullRequestReader?._loaded ?? 0;
    }
    #onProgress = (evt) => {
        if (evt.total === undefined) {
            // Reporting to first range reader, if it exists.
            const firstReader = this.#rangeReaders[0];
            if (firstReader?.onProgress) {
                firstReader.onProgress({ loaded: evt.loaded });
            }
        }
        else {
            const fullReader = this._fullRequestReader;
            if (fullReader?.onProgress) {
                fullReader.onProgress({ loaded: evt.loaded, total: evt.total });
            }
        }
    };
    _onProgressiveDone() {
        if (this._fullRequestReader) {
            this._fullRequestReader.progressiveDone();
        }
        this.#progressiveDone = true;
    }
    _removeRangeReader(reader) {
        const i = this.#rangeReaders.indexOf(reader);
        if (i >= 0) {
            this.#rangeReaders.splice(i, 1);
        }
    }
    /** @implements */
    getFullReader() {
        assert(!this._fullRequestReader, "PDFDataTransportStream.getFullReader can only be called once.");
        const queuedChunks = this.#queuedChunks;
        this.#queuedChunks = null;
        return new PDFDataTransportStreamReader(this, queuedChunks, this.#progressiveDone, this._contentDispositionFilename);
    }
    /** @implements */
    getRangeReader(begin, end) {
        if (end <= this._progressiveDataLength) {
            return null;
        }
        const reader = new PDFDataTransportStreamRangeReader(this, begin, end);
        this.#pdfDataRangeTransport.requestDataRange(begin, end);
        this.#rangeReaders.push(reader);
        return reader;
    }
    /** @implements */
    cancelAllRequests(reason) {
        if (this._fullRequestReader) {
            this._fullRequestReader.cancel(reason);
        }
        for (const reader of this.#rangeReaders.slice(0)) {
            reader.cancel(reason);
        }
        this.#pdfDataRangeTransport.abort();
    }
}
class PDFDataTransportStreamReader {
    #stream;
    #done;
    #filename = null;
    /** @implements */
    get filename() { return this.#filename; }
    #queuedChunks;
    _loaded = 0;
    #requests = [];
    #headersReady = Promise.resolve();
    get headersReady() { return this.#headersReady; }
    /** @implements */
    onProgress;
    constructor(stream, queuedChunks = null, progressiveDone = false, contentDispositionFilename = null) {
        this.#stream = stream;
        this.#done = progressiveDone || false;
        this.#filename = isPdfFile(contentDispositionFilename)
            ? contentDispositionFilename
            : null;
        this.#queuedChunks = queuedChunks || [];
        for (const chunk of this.#queuedChunks) {
            this._loaded += chunk.byteLength;
        }
        stream._fullRequestReader = this;
    }
    _enqueue(chunk) {
        if (this.#done) {
            return; // Ignore new data.
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
    /** @implements */
    get contentLength() { return this.#stream._contentLength; }
    /** @implements */
    async read() {
        if (this.#queuedChunks.length > 0) {
            const chunk = this.#queuedChunks.shift();
            return { value: chunk, done: false };
        }
        if (this.#done) {
            return { value: undefined, done: true };
        }
        const requestCapability = createPromiseCap();
        this.#requests.push(requestCapability);
        return requestCapability.promise;
    }
    /** @implements */
    cancel(reason) {
        this.#done = true;
        for (const requestCapability of this.#requests) {
            requestCapability.resolve({ value: undefined, done: true });
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
    #queuedChunk = null;
    #requests = [];
    #done = false;
    /** @implements */
    onProgress;
    /** @implements */
    get isStreamingSupported() { return false; }
    constructor(stream, begin, end) {
        this.#stream = stream;
        this._begin = begin;
        this._end = end;
    }
    _enqueue(chunk) {
        if (this.#done) {
            return; // ignore new data
        }
        if (this.#requests.length === 0) {
            this.#queuedChunk = chunk;
        }
        else {
            const requestsCapability = this.#requests.shift();
            requestsCapability.resolve({ value: chunk, done: false });
            for (const requestCapability of this.#requests) {
                requestCapability.resolve({ value: undefined, done: true });
            }
            this.#requests.length = 0;
        }
        this.#done = true;
        this.#stream._removeRangeReader(this);
    }
    /** @implements */
    async read() {
        if (this.#queuedChunk) {
            const chunk = this.#queuedChunk;
            this.#queuedChunk = null;
            return { value: chunk, done: false };
        }
        if (this.#done) {
            return { value: undefined, done: true };
        }
        const requestCapability = createPromiseCap();
        this.#requests.push(requestCapability);
        return requestCapability.promise;
    }
    /** @implements */
    cancel(reason) {
        this.#done = true;
        for (const requestCapability of this.#requests) {
            requestCapability.resolve({ value: undefined, done: true });
        }
        this.#requests.length = 0;
        this.#stream._removeRangeReader(this);
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=transport_stream.js.map