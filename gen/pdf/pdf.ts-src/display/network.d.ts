import { HttpStatusCode } from "../../../lib/HttpStatusCode.js";
import { type IPDFStream, type IPDFStreamRangeReader, type IPDFStreamReader, type ReadValue } from "../interfaces.js";
import { AbortException, MissingPDFException, UnexpectedResponseException } from "../shared/util.js";
import { type DocumentInitParms } from "./api.js";
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
declare type PendingRequest = {
    xhr: XMLHttpRequest;
    expectedStatus?: HttpStatusCode;
} & Listeners;
declare class NetworkManager {
    url: string | URL;
    isHttp: boolean;
    httpHeaders: Record<string, string>;
    withCredentials: boolean;
    getXhr: () => XMLHttpRequest;
    currXhrId: number;
    pendingRequests: PendingRequest[];
    constructor(url: string | URL, args?: {
        httpHeaders?: Record<string, string> | undefined;
        withCredentials?: boolean | undefined;
        getXhr?: () => XMLHttpRequest;
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
    constructor(source: DocumentInitParms);
    /** @override */
    getFullReader(): PDFNetworkStreamFullRequestReader;
    /** @override */
    getRangeReader(begin: number, end: number): PDFNetworkStreamRangeRequestReader;
    /** @implements */
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
    get filename(): string | null;
    /** @implements */
    onProgress: ((data: {
        loaded: number;
        total: number;
    }) => void) | undefined;
    constructor(manager: NetworkManager, source: DocumentInitParms);
    /** @implements */
    read(): Promise<ReadValue>;
    /** @override */
    cancel(reason: object): void;
}
declare class PDFNetworkStreamRangeRequestReader implements IPDFStreamRangeReader {
    #private;
    _url: string | URL;
    _storedError: MissingPDFException | UnexpectedResponseException | undefined;
    /** @implements */
    onProgress: ((data: {
        loaded: number;
    }) => void) | undefined;
    onClosed: ((reader: PDFNetworkStreamRangeRequestReader) => void) | null;
    /** @override */
    get isStreamingSupported(): boolean;
    constructor(manager: NetworkManager, begin: number, end: number);
    /** @implements */
    read(): Promise<ReadValue>;
    /** @override */
    cancel(reason: object): void;
}
export {};
//# sourceMappingURL=network.d.ts.map