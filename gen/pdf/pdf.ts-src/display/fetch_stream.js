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
import { assert } from "../../../lib/util/trace.js";
import { AbortException, createPromiseCapability, } from "../shared/util.js";
import { createResponseStatusError, extractFilenameFromHeader, validateRangeRequestCapabilities, validateResponseStatus, } from "./network_utils.js";
/*81---------------------------------------------------------------------------*/
function createFetchOptions(headers, withCredentials, abortController) {
    return {
        method: "GET",
        headers,
        signal: abortController?.signal ?? null,
        mode: "cors",
        credentials: (withCredentials ? "include" : "same-origin"),
        redirect: "follow",
    };
}
function createHeaders(httpHeaders) {
    const headers = new Headers();
    for (const property in httpHeaders) {
        const value = httpHeaders[property];
        if (typeof value === "undefined") {
            continue;
        }
        headers.append(property, value);
    }
    return headers;
}
export class PDFFetchStream {
    source;
    isHttp;
    httpHeaders;
    #fullRequestReader;
    get _progressiveDataLength() {
        return this.#fullRequestReader?._loaded ?? 0;
    }
    #rangeRequestReaders = [];
    constructor(source) {
        this.source = source;
        this.isHttp = /^https?:/i.test(source.url.toString());
        this.httpHeaders = (this.isHttp && source.httpHeaders) || {};
    }
    /** @implements */
    getFullReader() {
        assert(!this.#fullRequestReader, "PDFFetchStream.getFullReader can only be called once.");
        this.#fullRequestReader = new PDFFetchStreamReader(this);
        return this.#fullRequestReader;
    }
    /** @implements */
    getRangeReader(begin, end) {
        if (end <= this._progressiveDataLength) {
            return null;
        }
        const reader = new PDFFetchStreamRangeReader(this, begin, end);
        this.#rangeRequestReaders.push(reader);
        return reader;
    }
    /** @implements */
    cancelAllRequests(reason) {
        if (this.#fullRequestReader) {
            this.#fullRequestReader.cancel(reason);
        }
        for (const reader of this.#rangeRequestReaders.slice(0)) {
            reader.cancel(reason);
        }
    }
}
class PDFFetchStreamReader {
    #stream;
    #reader = null;
    _loaded = 0;
    #filename = null;
    get filename() { return this.#filename; }
    #withCredentials;
    #contentLength;
    /** @implements */
    get contentLength() { return this.#contentLength; }
    #headersCapability = createPromiseCapability();
    get headersReady() { return this.#headersCapability.promise; }
    #disableRange;
    #rangeChunkSize;
    #abortController;
    #isStreamingSupported;
    /** @implements */
    get isStreamingSupported() { return this.#isStreamingSupported; }
    #isRangeSupported;
    /** @implements */
    get isRangeSupported() { return this.#isRangeSupported; }
    #headers;
    /** @implements */
    onProgress;
    constructor(stream) {
        this.#stream = stream;
        const source = stream.source;
        this.#withCredentials = source.withCredentials || false;
        this.#contentLength = source.length;
        this.#disableRange = source.disableRange || false;
        this.#rangeChunkSize = source.rangeChunkSize;
        if (!this.#rangeChunkSize && !this.#disableRange) {
            this.#disableRange = true;
        }
        if (typeof AbortController !== "undefined") {
            this.#abortController = new AbortController();
        }
        this.#isStreamingSupported = !source.disableStream;
        this.#isRangeSupported = !source.disableRange;
        this.#headers = createHeaders(this.#stream.httpHeaders);
        const url = source.url;
        fetch(url.toString(), createFetchOptions(this.#headers, this.#withCredentials, this.#abortController))
            .then((response) => {
            if (!validateResponseStatus(response.status)) {
                throw createResponseStatusError(response.status, url);
            }
            this.#reader = response.body.getReader();
            this.#headersCapability.resolve();
            const getResponseHeader = (name) => response.headers.get(name);
            const { allowRangeRequests, suggestedLength } = validateRangeRequestCapabilities({
                getResponseHeader,
                isHttp: this.#stream.isHttp,
                rangeChunkSize: this.#rangeChunkSize,
                disableRange: this.#disableRange,
            });
            this.#isRangeSupported = allowRangeRequests;
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
    /** @implements */
    async read() {
        await this.#headersCapability.promise;
        const { value, done } = await this.#reader.read();
        if (done) {
            return { value, done };
        }
        this._loaded += value.byteLength;
        if (this.onProgress) {
            this.onProgress({
                loaded: this._loaded,
                total: this.#contentLength,
            });
        }
        const buffer = new Uint8Array(value).buffer;
        return { value: buffer, done: false };
    }
    /** @implements */
    cancel(reason) {
        if (this.#reader) {
            this.#reader.cancel(reason);
        }
        if (this.#abortController) {
            this.#abortController.abort();
        }
    }
}
class PDFFetchStreamRangeReader {
    #stream;
    #reader;
    _loaded = 0;
    #withCredentials;
    #readCapability = createPromiseCapability();
    #isStreamingSupported;
    /** @implements */
    get isStreamingSupported() { return this.#isStreamingSupported; }
    #abortController;
    #headers;
    /** @implements */
    onProgress;
    constructor(stream, begin, end) {
        this.#stream = stream;
        const source = stream.source;
        this.#withCredentials = source.withCredentials || false;
        this.#isStreamingSupported = !source.disableStream;
        if (typeof AbortController !== "undefined") {
            this.#abortController = new AbortController();
        }
        this.#headers = createHeaders(this.#stream.httpHeaders);
        this.#headers.append("Range", `bytes=${begin}-${end - 1}`);
        const url = source.url;
        fetch(url.toString(), createFetchOptions(this.#headers, this.#withCredentials, this.#abortController))
            .then((response) => {
            if (!validateResponseStatus(response.status)) {
                throw createResponseStatusError(response.status, url);
            }
            this.#readCapability.resolve();
            this.#reader = response.body.getReader();
        })
            .catch(this.#readCapability.reject);
    }
    /** @implements */
    async read() {
        await this.#readCapability.promise;
        const { value, done } = await this.#reader.read();
        if (done) {
            return { value, done };
        }
        this._loaded += value.byteLength;
        if (this.onProgress) {
            this.onProgress({ loaded: this._loaded });
        }
        const buffer = new Uint8Array(value).buffer;
        return { value: buffer, done: false };
    }
    /** @implements */
    cancel(reason) {
        if (this.#reader) {
            this.#reader.cancel(reason);
        }
        if (this.#abortController) {
            this.#abortController.abort();
        }
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=fetch_stream.js.map