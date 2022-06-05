import { type IPDFStream, type IPDFStreamRangeReader, type IPDFStreamReader, type ReadValue } from "../interfaces.js";
import { PDFDataRangeTransport } from "../pdf.js";
import { AbortException } from "../shared/util.js";
interface _StreamInitP {
    length: number;
    initialData: ArrayLike<number> | undefined;
    progressiveDone: boolean | undefined;
    contentDispositionFilename: string | undefined;
    disableRange: boolean | undefined;
    disableStream: boolean | undefined;
}
export declare class PDFDataTransportStream implements IPDFStream {
    #private;
    _contentDispositionFilename: string | undefined;
    _isStreamingSupported: boolean;
    _isRangeSupported: boolean;
    _contentLength: number;
    _fullRequestReader?: PDFDataTransportStreamReader;
    constructor(params: _StreamInitP, pdfDataRangeTransport: PDFDataRangeTransport);
    get _progressiveDataLength(): number;
    _onProgressiveDone(): void;
    _removeRangeReader(reader: PDFDataTransportStreamRangeReader): void;
    /** @implements */
    getFullReader(): PDFDataTransportStreamReader;
    /** @implements */
    getRangeReader(begin: number, end: number): PDFDataTransportStreamRangeReader | undefined;
    /** @implements */
    cancelAllRequests(reason: AbortException): void;
}
declare class PDFDataTransportStreamReader implements IPDFStreamReader {
    #private;
    /** @implements */
    get filename(): string | undefined;
    _loaded: number;
    get headersReady(): Promise<void>;
    /** @implements */
    onProgress: ((data: {
        loaded: number;
        total: number;
    }) => void) | undefined;
    constructor(stream: PDFDataTransportStream, queuedChunks?: ArrayBufferLike[] | undefined, progressiveDone?: boolean, contentDispositionFilename?: string);
    _enqueue(chunk: ArrayBufferLike): void;
    get isRangeSupported(): boolean;
    get isStreamingSupported(): boolean;
    /** @implements */
    get contentLength(): number;
    /** @implements */
    read(): Promise<ReadValue>;
    /** @implements */
    cancel(reason: object): void;
    progressiveDone(): void;
}
declare class PDFDataTransportStreamRangeReader implements IPDFStreamRangeReader {
    #private;
    _begin: number;
    _end: number;
    /** @implements */
    onProgress: ((data: {
        loaded: number;
    }) => void) | undefined;
    /** @implements */
    get isStreamingSupported(): boolean;
    constructor(stream: PDFDataTransportStream, begin: number, end: number);
    _enqueue(chunk: ArrayBufferLike): void;
    /** @implements */
    read(): Promise<ReadValue>;
    /** @implements */
    cancel(reason: object): void;
}
export {};
//# sourceMappingURL=transport_stream.d.ts.map