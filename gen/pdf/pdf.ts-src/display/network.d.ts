/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/network.ts
 * @license Apache-2.0
 ******************************************************************************/
import { HttpStatusCode } from "../../../lib/HttpStatusCode.js";
import type { IPDFStream, IPDFStreamRangeReader, IPDFStreamReader, ReadValue } from "../interfaces.js";
import { AbortException, MissingPDFException, UnexpectedResponseException } from "../shared/util.js";
import type { DocumentInitP } from "./api.js";
interface Listeners {
    onHeadersReceived?: (() => void) | undefined;
    onDone?: ((data: {
        begin: number;
        chunk: ArrayBufferLike;
    }) => void) | undefined;
    onError?: ((status: HttpStatusCode) => void) | undefined;
    onProgress?: ((data: {
        loaded: number;
        total: number;
    }) => void) | undefined;
    begin?: number;
    end?: number;
}
type PendingRequest = {
    xhr: XMLHttpRequest;
    expectedStatus?: HttpStatusCode;
} & Listeners;
declare class NetworkManager {
    url: string | URL;
    isHttp: boolean;
    httpHeaders: Record<string, string>;
    withCredentials: boolean;
    currXhrId: number;
    pendingRequests: PendingRequest[];
    constructor(url: string | URL, args?: {
        httpHeaders?: Record<string, string> | undefined;
        withCredentials?: boolean | undefined;
    });
    requestRange(begin: number, end: number, listeners: Listeners): number;
    requestFull(listeners: Listeners): number;
    request(args: Listeners): number;
    onProgress(xhrId: number, evt: ProgressEvent): void;
    onStateChange(xhrId: number, evt?: unknown): void;
    getRequestXhr(xhrId: number): XMLHttpRequest;
    isPendingRequest(xhrId: number): boolean;
    abortRequest(xhrId: number): void;
}
export declare class PDFNetworkStream implements IPDFStream {
    #private;
    constructor(source: DocumentInitP);
    /** @implement */
    getFullReader(): PDFNetworkStreamFullRequestReader;
    /** @implement */
    getRangeReader(begin: number, end: number): PDFNetworkStreamRangeRequestReader;
    /** @implement */
    cancelAllRequests(reason: AbortException): void;
}
declare class PDFNetworkStreamFullRequestReader implements IPDFStreamReader {
    #private;
    get headersReady(): Promise<void>;
    get contentLength(): number | undefined;
    get isStreamingSupported(): boolean;
    get isRangeSupported(): boolean;
    _cachedChunks: ArrayBufferLike[];
    _storedError?: MissingPDFException | UnexpectedResponseException;
    get filename(): string | undefined;
    /** @implement */
    onProgress: ((data: OnProgressP) => void) | undefined;
    constructor(manager: NetworkManager, source: DocumentInitP);
    /** @implement */
    read(): Promise<ReadValue>;
    /** @implement */
    cancel(reason: object): void;
}
export declare class PDFNetworkStreamRangeRequestReader implements IPDFStreamRangeReader {
    #private;
    _url: string | URL;
    _storedError: MissingPDFException | UnexpectedResponseException | undefined;
    /** @implement */
    onProgress: ((data: {
        loaded: number;
    }) => void) | undefined;
    onClosed?: (reader: PDFNetworkStreamRangeRequestReader) => void;
    /** @implement */
    get isStreamingSupported(): boolean;
    constructor(manager: NetworkManager, begin: number, end: number);
    /** @implement */
    read(): Promise<ReadValue>;
    /** @implement */
    cancel(reason: object): void;
}
export {};
//# sourceMappingURL=network.d.ts.map