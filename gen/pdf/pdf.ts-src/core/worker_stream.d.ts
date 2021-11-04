import { IPDFStream, IPDFStreamRangeReader, IPDFStreamReader, ReadValue } from "../interfaces.js";
import { Thread, MessageHandler } from "../shared/message_handler.js";
import { AbortException } from "../shared/util.js";
export declare class PDFWorkerStream implements IPDFStream {
    #private;
    constructor(msgHandler: MessageHandler<Thread.worker>);
    /** @implements */
    getFullReader(): PDFWorkerStreamReader;
    /** @implements */
    getRangeReader(begin: number, end: number): PDFWorkerStreamRangeReader;
    /** @implements */
    cancelAllRequests(reason: AbortException): void;
}
declare class PDFWorkerStreamReader implements IPDFStreamReader {
    #private;
    /** @implements */
    onProgress: undefined;
    /** @implements */
    get contentLength(): number | undefined;
    /** @implements */
    get isRangeSupported(): boolean;
    /** @implements */
    get isStreamingSupported(): boolean;
    /** @implements */
    get headersReady(): Promise<void>;
    /** @implements */
    readonly filename: null;
    constructor(msgHandler: MessageHandler<Thread.worker>);
    /** @implements */
    read(): Promise<ReadValue>;
    /** @implements */
    cancel(reason: object): void;
}
declare class PDFWorkerStreamRangeReader implements IPDFStreamRangeReader {
    #private;
    /** @implements */
    onProgress: ((data: {
        loaded: number;
    }) => void) | undefined;
    constructor(begin: number, end: number, msgHandler: MessageHandler<Thread.worker>);
    get isStreamingSupported(): boolean;
    /** @implements */
    read(): Promise<ReadValue>;
    /** @implements */
    cancel(reason: object): void;
}
export {};
//# sourceMappingURL=worker_stream.d.ts.map