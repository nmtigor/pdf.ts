import { type IPDFStream, type IPDFStreamRangeReader, type IPDFStreamReader, type ReadValue } from "../interfaces.js";
import { AbortException } from "../shared/util.js";
import { type DocumentInitP } from "./api.js";
export declare class PDFFetchStream implements IPDFStream {
    #private;
    source: DocumentInitP;
    isHttp: boolean;
    httpHeaders: Record<string, string>;
    get _progressiveDataLength(): number;
    constructor(source: DocumentInitP);
    /** @implement */
    getFullReader(): PDFFetchStreamReader;
    /** @implement */
    getRangeReader(begin: number, end: number): PDFFetchStreamRangeReader | undefined;
    /** @implement */
    cancelAllRequests(reason: AbortException): void;
}
declare class PDFFetchStreamReader implements IPDFStreamReader {
    #private;
    _loaded: number;
    get filename(): string | undefined;
    /** @implement */
    get contentLength(): number;
    get headersReady(): Promise<void>;
    /** @implement */
    get isStreamingSupported(): boolean;
    /** @implement */
    get isRangeSupported(): boolean;
    /** @implement */
    onProgress: ((data: {
        loaded: number;
        total: number;
    }) => void) | undefined;
    constructor(stream: PDFFetchStream);
    /** @implement */
    read(): Promise<ReadValue>;
    /** @implement */
    cancel(reason: object): void;
}
declare class PDFFetchStreamRangeReader implements IPDFStreamRangeReader {
    #private;
    _loaded: number;
    /** @implement */
    get isStreamingSupported(): boolean;
    /** @implement */
    onProgress: ((data: {
        loaded: number;
    }) => void) | undefined;
    constructor(stream: PDFFetchStream, begin: number, end: number);
    /** @implement */
    read(): Promise<ReadValue>;
    /** @implement */
    cancel(reason: object): void;
}
export {};
//# sourceMappingURL=fetch_stream.d.ts.map