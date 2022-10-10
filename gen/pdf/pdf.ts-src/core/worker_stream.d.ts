import { type IPDFStream, type IPDFStreamRangeReader, type IPDFStreamReader, type ReadValue } from "../interfaces.js";
import { MessageHandler, Thread } from "../shared/message_handler.js";
import { AbortException } from "../shared/util.js";
export declare class PDFWorkerStream implements IPDFStream {
    #private;
    constructor(msgHandler: MessageHandler<Thread.worker>);
    /** @implement */
    getFullReader(): PDFWorkerStreamReader;
    /** @implement */
    getRangeReader(begin: number, end: number): PDFWorkerStreamRangeReader;
    /** @implement */
    cancelAllRequests(reason: AbortException): void;
}
declare class PDFWorkerStreamReader implements IPDFStreamReader {
    #private;
    /** @implement */
    onProgress: undefined;
    /** @implement */
    get contentLength(): number | undefined;
    /** @implement */
    get isRangeSupported(): boolean;
    /** @implement */
    get isStreamingSupported(): boolean;
    /** @implement */
    get headersReady(): Promise<void>;
    /** @implement */
    readonly filename: undefined;
    constructor(msgHandler: MessageHandler<Thread.worker>);
    /** @implement */
    read(): Promise<ReadValue>;
    /** @implement */
    cancel(reason: object): void;
}
declare class PDFWorkerStreamRangeReader implements IPDFStreamRangeReader {
    #private;
    /** @implement */
    onProgress: ((data: {
        loaded: number;
    }) => void) | undefined;
    constructor(begin: number, end: number, msgHandler: MessageHandler<Thread.worker>);
    get isStreamingSupported(): boolean;
    /** @implement */
    read(): Promise<ReadValue>;
    /** @implement */
    cancel(reason: object): void;
}
export {};
//# sourceMappingURL=worker_stream.d.ts.map