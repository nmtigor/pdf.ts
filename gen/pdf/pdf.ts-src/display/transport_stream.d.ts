/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/transport_stream.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { IPDFStream, IPDFStreamRangeReader, IPDFStreamReader, ReadValue } from "../interfaces.js";
import type { PDFDataRangeTransport } from "../pdf.js";
import { AbortException } from "../shared/util.js";
interface StreamInitP_ {
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
    constructor(pdfDataRangeTransport: PDFDataRangeTransport, { disableRange, disableStream }: StreamInitP_);
    get _progressiveDataLength(): number;
    _onProgressiveDone(): void;
    _removeRangeReader(reader: PDFDataTransportStreamRangeReader): void;
    /** @implement */
    getFullReader(): PDFDataTransportStreamReader;
    /** @implement */
    getRangeReader(begin: number, end: number): PDFDataTransportStreamRangeReader | undefined;
    /** @implement */
    cancelAllRequests(reason: AbortException): void;
}
declare class PDFDataTransportStreamReader implements IPDFStreamReader {
    #private;
    /** @implement */
    get filename(): string | undefined;
    _loaded: number;
    get headersReady(): Promise<void>;
    /** @implement */
    onProgress: ((data: OnProgressP) => void) | undefined;
    constructor(stream: PDFDataTransportStream, queuedChunks?: ArrayBufferLike[] | undefined, progressiveDone?: boolean, contentDispositionFilename?: string);
    _enqueue(chunk: ArrayBufferLike): void;
    get isRangeSupported(): boolean;
    get isStreamingSupported(): boolean;
    /** @implement */
    get contentLength(): number;
    /** @implement */
    read(): Promise<ReadValue>;
    /** @implement */
    cancel(reason: object): void;
    progressiveDone(): void;
}
declare class PDFDataTransportStreamRangeReader implements IPDFStreamRangeReader {
    #private;
    _begin: number;
    _end: number;
    /** @implement */
    onProgress: ((data: {
        loaded: number;
    }) => void) | undefined;
    /** @implement */
    get isStreamingSupported(): boolean;
    constructor(stream: PDFDataTransportStream, begin: number, end: number);
    _enqueue(chunk: ArrayBufferLike): void;
    /** @implement */
    read(): Promise<ReadValue>;
    /** @implement */
    cancel(reason: object): void;
}
export {};
//# sourceMappingURL=transport_stream.d.ts.map