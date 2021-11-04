import { IPDFStream, IPDFStreamRangeReader, IPDFStreamReader, ReadValue } from "../interfaces.js";
import { AbortException } from "../shared/util.js";
import { DocumentInitParms } from "./api.js";
export declare class PDFFetchStream implements IPDFStream {
    #private;
    source: DocumentInitParms;
    isHttp: boolean;
    httpHeaders: Record<string, string>;
    get _progressiveDataLength(): number;
    constructor(source: DocumentInitParms);
    /** @implements */
    getFullReader(): PDFFetchStreamReader;
    /** @implements */
    getRangeReader(begin: number, end: number): PDFFetchStreamRangeReader | null;
    /** @implements */
    cancelAllRequests(reason: AbortException): void;
}
declare class PDFFetchStreamReader implements IPDFStreamReader {
    #private;
    _loaded: number;
    get filename(): string | null;
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