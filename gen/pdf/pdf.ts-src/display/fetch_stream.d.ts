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
    /** @implements */
    getFullReader(): PDFFetchStreamReader;
    /** @implements */
    getRangeReader(begin: number, end: number): PDFFetchStreamRangeReader | undefined;
    /** @implements */
    cancelAllRequests(reason: AbortException): void;
}
declare class PDFFetchStreamReader implements IPDFStreamReader {
    #private;
    _loaded: number;
    get filename(): string | undefined;
    /** @implements */
    get contentLength(): number;
    get headersReady(): Promise<void>;
    /** @implements */
    get isStreamingSupported(): boolean;
    /** @implements */
    get isRangeSupported(): boolean;
    /** @implements */
    onProgress: ((data: {
        loaded: number;
        total: number;
    }) => void) | undefined;
    constructor(stream: PDFFetchStream);
    /** @implements */
    read(): Promise<ReadValue>;
    /** @implements */
    cancel(reason: object): void;
}
declare class PDFFetchStreamRangeReader implements IPDFStreamRangeReader {
    #private;
    _loaded: number;
    /** @implements */
    get isStreamingSupported(): boolean;
    /** @implements */
    onProgress: ((data: {
        loaded: number;
    }) => void) | undefined;
    constructor(stream: PDFFetchStream, begin: number, end: number);
    /** @implements */
    read(): Promise<ReadValue>;
    /** @implements */
    cancel(reason: object): void;
}
export {};
//# sourceMappingURL=fetch_stream.d.ts.map