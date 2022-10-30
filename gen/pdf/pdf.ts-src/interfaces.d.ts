import { ReadableStreamDefaultReadResult } from "../../lib/alias.js";
import { AbortException } from "./shared/util.js";
/**
 * Interface that represents PDF data transport. If possible, it allows
 * progressively load entire or fragment of the PDF binary data.
 */
export interface IPDFStream {
    /**
     * Gets a reader for the entire PDF data.
     */
    getFullReader(): IPDFStreamReader;
    /**
     * Gets a reader for the range of the PDF data.
     * @param begin the start offset of the data.
     * @param end the end offset of the data.
     */
    getRangeReader(begin: number, end: number): IPDFStreamRangeReader | undefined;
    /**
     * Cancels all opened reader and closes all their opened requests.
     * @param reason the reason for cancelling
     */
    cancelAllRequests(reason: AbortException): void;
}
export declare type ReadValue = ReadableStreamDefaultReadResult<ArrayBufferLike>;
/**
 * Interface for a PDF binary data reader.
 */
export interface IPDFStreamReader {
    /**
     * Sets or gets the progress callback. The callback can be useful when the
     * isStreamingSupported property of the object is defined as false.
     * The callback is called with one parameter: an object with the loaded and
     * total properties.
     */
    onProgress: ((data: OnProgressP) => void) | undefined;
    /**
     * Gets a promise that is resolved when the headers and other metadata of
     * the PDF data stream are available.
     */
    readonly headersReady: Promise<any>;
    /**
     * Gets the Content-Disposition filename. It is defined after the headersReady
     * promise is resolved.
     *
     * The filename, or `undefined` if the Content-Disposition header is missing/invalid.
     */
    readonly filename: string | undefined;
    /**
     * Gets PDF binary data length. It is defined after the headersReady promise
     * is resolved.
     *
     * he data length (or 0 if unknown).
     */
    readonly contentLength: number | undefined;
    /**
     * Gets ability of the stream to handle range requests. It is defined after
     * the headersReady promise is resolved. Rejected when the reader is cancelled
     * or an error occurs.
     */
    readonly isRangeSupported: boolean;
    /**
     * Gets ability of the stream to progressively load binary data. It is defined
     * after the headersReady promise is resolved.
     */
    readonly isStreamingSupported: boolean;
    /**
     * Requests a chunk of the binary data. The method returns the promise, which
     * is resolved into object with properties "value" and "done". If the done
     * is set to true, then the stream has reached its end, otherwise the value
     * contains binary data. Cancelled requests will be resolved with the done is
     * set to true.
     */
    read(): Promise<ReadValue>;
    /**
     * Cancels all pending read requests and closes the stream.
     */
    cancel(reason: object): void;
}
/**
 * Interface for a PDF binary data fragment reader.
 */
export interface IPDFStreamRangeReader {
    /**
     * Sets or gets the progress callback. The callback can be useful when the
     * isStreamingSupported property of the object is defined as false.
     * The callback is called with one parameter: an object with the loaded
     * property.
     */
    onProgress: ((data: {
        loaded: number;
    }) => void) | undefined;
    /**
     * Gets ability of the stream to progressively load binary data.
     */
    readonly isStreamingSupported: boolean;
    /**
     * Requests a chunk of the binary data. The method returns the promise, which
     * is resolved into object with properties "value" and "done". If the done
     * is set to true, then the stream has reached its end, otherwise the value
     * contains binary data. Cancelled requests will be resolved with the done is
     * set to true.
     */
    read(): Promise<ReadValue>;
    /**
     * Cancels all pending read requests and closes the stream.
     */
    cancel(reason: object): void;
}
//# sourceMappingURL=interfaces.d.ts.map