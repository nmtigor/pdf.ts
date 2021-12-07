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
import { createPromiseCap } from "../../../lib/promisecap.js";
import { HttpStatusCode } from "../../../lib/HttpStatusCode.js";
import { assert } from "../../../lib/util/trace.js";
import { stringToBytes, } from "../shared/util.js";
import { createResponseStatusError, extractFilenameFromHeader, validateRangeRequestCapabilities, } from "./network_utils.js";
/*81---------------------------------------------------------------------------*/
function getArrayBuffer(xhr) {
    const data = xhr.response;
    if (typeof data !== "string") {
        return data;
    }
    const array = stringToBytes(data);
    return array.buffer;
}
class NetworkManager {
    url;
    isHttp;
    httpHeaders;
    withCredentials;
    getXhr;
    currXhrId = 0;
    pendingRequests = Object.create(null);
    constructor(url, args = {}) {
        this.url = url;
        this.isHttp = /^https?:/i.test(url.toString());
        this.httpHeaders = (this.isHttp && args.httpHeaders) || Object.create(null);
        this.withCredentials = args.withCredentials || false;
        this.getXhr = args.getXhr || (() => new XMLHttpRequest());
    }
    requestRange(begin, end, listeners) {
        const args = {
            begin,
            end,
        };
        Object.assign(args, listeners);
        return this.request(args);
    }
    requestFull(listeners) {
        return this.request(listeners);
    }
    request(args) {
        const xhr = this.getXhr();
        const xhrId = this.currXhrId++;
        const pendingRequest = (this.pendingRequests[xhrId] = { xhr });
        xhr.open("GET", this.url.toString());
        xhr.withCredentials = this.withCredentials;
        for (const property in this.httpHeaders) {
            const value = this.httpHeaders[property];
            if (typeof value === "undefined")
                continue;
            xhr.setRequestHeader(property, value);
        }
        if (this.isHttp && "begin" in args && "end" in args) {
            xhr.setRequestHeader("Range", `bytes=${args.begin}-${args.end - 1}`);
            pendingRequest.expectedStatus = HttpStatusCode.PARTIAL_CONTENT;
        }
        else {
            pendingRequest.expectedStatus = HttpStatusCode.OK;
        }
        xhr.responseType = "arraybuffer";
        if (args.onError) {
            xhr.onerror = function (evt) {
                args.onError(xhr.status);
            };
        }
        xhr.onreadystatechange = this.onStateChange.bind(this, xhrId);
        xhr.onprogress = this.onProgress.bind(this, xhrId);
        pendingRequest.onHeadersReceived = args.onHeadersReceived;
        pendingRequest.onDone = args.onDone;
        pendingRequest.onError = args.onError;
        pendingRequest.onProgress = args.onProgress;
        xhr.send(null);
        return xhrId;
    }
    onProgress(xhrId, evt) {
        const pendingRequest = this.pendingRequests[xhrId];
        if (!pendingRequest) {
            return; // Maybe abortRequest was called...
        }
        pendingRequest.onProgress?.(evt);
    }
    onStateChange(xhrId, evt) {
        const pendingRequest = this.pendingRequests[xhrId];
        if (!pendingRequest) {
            return; // Maybe abortRequest was called...
        }
        const xhr = pendingRequest.xhr;
        if (xhr.readyState >= 2 && pendingRequest.onHeadersReceived) {
            pendingRequest.onHeadersReceived();
            delete pendingRequest.onHeadersReceived;
        }
        if (xhr.readyState !== 4) {
            return;
        }
        if (!(xhrId in this.pendingRequests)) {
            // The XHR request might have been aborted in onHeadersReceived()
            // callback, in which case we should abort request.
            return;
        }
        delete this.pendingRequests[xhrId];
        // Success status == 0 can be on ftp, file and other protocols.
        if (xhr.status === 0 && this.isHttp) {
            pendingRequest.onError?.(xhr.status);
            return;
        }
        const xhrStatus = xhr.status || HttpStatusCode.OK;
        // From http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.35.2:
        // "A server MAY ignore the Range header". This means it's possible to
        // get a 200 rather than a 206 response from a range request.
        const ok_response_on_range_request = xhrStatus === HttpStatusCode.OK &&
            pendingRequest.expectedStatus === HttpStatusCode.PARTIAL_CONTENT;
        if (!ok_response_on_range_request
            && xhrStatus !== pendingRequest.expectedStatus) {
            pendingRequest.onError?.(xhr.status);
            return;
        }
        const chunk = getArrayBuffer(xhr);
        if (xhrStatus === HttpStatusCode.PARTIAL_CONTENT) {
            const rangeHeader = xhr.getResponseHeader("Content-Range");
            const matches = /bytes (\d+)-(\d+)\/(\d+)/.exec(rangeHeader);
            pendingRequest.onDone({
                begin: parseInt(matches[1], 10),
                chunk,
            });
        }
        else if (chunk) {
            pendingRequest.onDone({
                begin: 0,
                chunk,
            });
        }
        else {
            pendingRequest.onError?.(xhr.status);
        }
    }
    getRequestXhr(xhrId) {
        return this.pendingRequests[xhrId].xhr;
    }
    isPendingRequest(xhrId) {
        return xhrId in this.pendingRequests;
    }
    abortRequest(xhrId) {
        const xhr = this.pendingRequests[xhrId].xhr;
        delete this.pendingRequests[xhrId];
        xhr.abort();
    }
}
export class PDFNetworkStream {
    #source;
    #manager;
    // #rangeChunkSize;
    #fullRequestReader;
    #rangeRequestReaders = [];
    constructor(source) {
        this.#source = source;
        this.#manager = new NetworkManager(source.url, {
            httpHeaders: source.httpHeaders,
            withCredentials: source.withCredentials,
        });
        // this.#rangeChunkSize = source.rangeChunkSize;
    }
    #onRangeRequestReaderClosed = (reader) => {
        const i = this.#rangeRequestReaders.indexOf(reader);
        if (i >= 0) {
            this.#rangeRequestReaders.splice(i, 1);
        }
    };
    /** @override */
    getFullReader() {
        assert(!this.#fullRequestReader, "PDFNetworkStream.getFullReader can only be called once.");
        this.#fullRequestReader = new PDFNetworkStreamFullRequestReader(this.#manager, this.#source);
        return this.#fullRequestReader;
    }
    /** @override */
    getRangeReader(begin, end) {
        const reader = new PDFNetworkStreamRangeRequestReader(this.#manager, begin, end);
        reader.onClosed = this.#onRangeRequestReaderClosed;
        this.#rangeRequestReaders.push(reader);
        return reader;
    }
    /** @implements */
    cancelAllRequests(reason) {
        this.#fullRequestReader?.cancel(reason);
        for (const reader of this.#rangeRequestReaders.slice(0)) {
            reader.cancel(reason);
        }
    }
}
class PDFNetworkStreamFullRequestReader {
    #manager;
    #url;
    #fullRequestId;
    #headersReceivedCapability = createPromiseCap();
    get headersReady() { return this.#headersReceivedCapability.promise; }
    #disableRange;
    #contentLength;
    get contentLength() { return this.#contentLength; }
    #rangeChunkSize;
    #isStreamingSupported = false;
    get isStreamingSupported() { return this.#isStreamingSupported; }
    #isRangeSupported = false;
    get isRangeSupported() { return this.#isRangeSupported; }
    _cachedChunks = [];
    #requests = [];
    #done = false;
    _storedError;
    #filename = null;
    get filename() { return this.#filename; }
    /** @implements */
    onProgress;
    constructor(manager, source) {
        this.#manager = manager;
        const args = {
            onHeadersReceived: this.#onHeadersReceived,
            onDone: this.#onDone,
            onError: this.#onError,
            onProgress: this.#onProgress,
        };
        this.#url = source.url;
        this.#fullRequestId = manager.requestFull(args);
        // this.#headersReceivedCapability = createPromiseCap();
        this.#disableRange = source.disableRange || false;
        this.#contentLength = source.length; // Optional
        this.#rangeChunkSize = source.rangeChunkSize;
        if (!this.#rangeChunkSize && !this.#disableRange) {
            this.#disableRange = true;
        }
    }
    #onHeadersReceived = () => {
        const fullRequestXhrId = this.#fullRequestId;
        const fullRequestXhr = this.#manager.getRequestXhr(fullRequestXhrId);
        const getResponseHeader = (name) => {
            return fullRequestXhr.getResponseHeader(name);
        };
        const { allowRangeRequests, suggestedLength } = validateRangeRequestCapabilities({
            getResponseHeader,
            isHttp: this.#manager.isHttp,
            rangeChunkSize: this.#rangeChunkSize,
            disableRange: this.#disableRange,
        });
        if (allowRangeRequests) {
            this.#isRangeSupported = true;
        }
        // Setting right content length.
        this.#contentLength = suggestedLength || this.#contentLength;
        this.#filename = extractFilenameFromHeader(getResponseHeader);
        if (this.#isRangeSupported) {
            // NOTE: by cancelling the full request, and then issuing range
            // requests, there will be an issue for sites where you can only
            // request the pdf once. However, if this is the case, then the
            // server should not be returning that it can support range requests.
            this.#manager.abortRequest(fullRequestXhrId);
        }
        this.#headersReceivedCapability.resolve();
    };
    #onDone = (data) => {
        if (data) {
            if (this.#requests.length > 0) {
                const requestCapability = this.#requests.shift();
                requestCapability.resolve({ value: data.chunk, done: false });
            }
            else {
                this._cachedChunks.push(data.chunk);
            }
        }
        this.#done = true;
        if (this._cachedChunks.length > 0)
            return;
        for (const requestCapability of this.#requests) {
            requestCapability.resolve({ value: undefined, done: true });
        }
        this.#requests.length = 0;
    };
    #onError = (status) => {
        this._storedError = createResponseStatusError(status, this.#url);
        this.#headersReceivedCapability.reject(this._storedError);
        for (const requestCapability of this.#requests) {
            requestCapability.reject(this._storedError);
        }
        this.#requests.length = 0;
        this._cachedChunks.length = 0;
    };
    #onProgress = (evt) => {
        this.onProgress?.({
            loaded: evt.loaded,
            total: evt.lengthComputable ? evt.total : this.#contentLength,
        });
    };
    /** @implements */
    async read() {
        if (this._storedError) {
            throw this._storedError;
        }
        if (this._cachedChunks.length > 0) {
            const chunk = this._cachedChunks.shift();
            return { value: chunk, done: false };
        }
        if (this.#done) {
            return { value: undefined, done: true };
        }
        const requestCapability = createPromiseCap();
        this.#requests.push(requestCapability);
        return requestCapability.promise;
    }
    /** @override */
    cancel(reason) {
        this.#done = true;
        this.#headersReceivedCapability.reject(reason);
        for (const requestCapability of this.#requests) {
            requestCapability.resolve({ value: undefined, done: true });
        }
        this.#requests.length = 0;
        if (this.#manager.isPendingRequest(this.#fullRequestId)) {
            this.#manager.abortRequest(this.#fullRequestId);
        }
        // this.#fullRequestReader = null;
    }
}
class PDFNetworkStreamRangeRequestReader {
    #manager;
    _url;
    #requestId;
    #requests = [];
    #queuedChunk = null;
    #done = false;
    _storedError;
    /** @implements */
    onProgress;
    onClosed = null;
    /** @override */
    get isStreamingSupported() { return false; }
    constructor(manager, begin, end) {
        this.#manager = manager;
        const args = {
            onDone: this.#onDone,
            onError: this.#onError,
            onProgress: this.#onProgress,
        };
        this._url = manager.url;
        this.#requestId = manager.requestRange(begin, end, args);
    }
    #close = () => this.onClosed?.(this);
    #onDone = (data) => {
        const chunk = data.chunk;
        if (this.#requests.length > 0) {
            const requestCapability = this.#requests.shift();
            requestCapability.resolve({ value: chunk, done: false });
        }
        else {
            this.#queuedChunk = chunk;
        }
        this.#done = true;
        for (const requestCapability of this.#requests) {
            requestCapability.resolve({ value: undefined, done: true });
        }
        this.#requests.length = 0;
        this.#close();
    };
    #onError = (status) => {
        this._storedError = createResponseStatusError(status, this._url);
        for (const requestCapability of this.#requests) {
            requestCapability.reject(this._storedError);
        }
        this.#requests.length = 0;
        this.#queuedChunk = null;
    };
    #onProgress = (evt) => {
        if (!this.isStreamingSupported) {
            this.onProgress?.({ loaded: evt.loaded });
        }
    };
    /** @implements */
    async read() {
        if (this._storedError)
            throw this._storedError;
        if (this.#queuedChunk !== null) {
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
    /** @override */
    cancel(reason) {
        this.#done = true;
        for (const requestCapability of this.#requests) {
            requestCapability.resolve({ value: undefined, done: true });
        }
        this.#requests.length = 0;
        if (this.#manager.isPendingRequest(this.#requestId)) {
            this.#manager.abortRequest(this.#requestId);
        }
        this.#close();
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=network.js.map