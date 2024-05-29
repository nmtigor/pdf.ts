/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/chunked_stream.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { MessageHandler, Thread } from "../shared/message_handler.js";
import type { AbortException } from "../shared/util.js";
import type { Dict } from "./primitives.js";
import { Stream } from "./stream.js";
import type { PDFWorkerStream } from "./worker_stream.js";
interface ChunkedStreamSubstream extends ChunkedStream {
}
export declare class ChunkedStream extends Stream {
    chunkSize: number;
    _loadedChunks: Set<number>;
    get numChunksLoaded(): number;
    hasChunk(chunk: number): boolean;
    numChunks: number;
    get isDataLoaded(): boolean;
    manager: ChunkedStreamManager;
    progressiveDataLength: number;
    lastSuccessfulEnsureByteChunk: number; /** Single-entry cache */
    constructor(length: number, chunkSize: number, manager: ChunkedStreamManager);
    getMissingChunks(): number[];
    onReceiveData(begin: number, chunk: ArrayBufferLike): void;
    onReceiveProgressiveData(data: ArrayBufferLike): void;
    ensureByte(pos: number): void;
    ensureRange(begin: number, end: number): void;
    nextEmptyChunk(beginChunk: number): number | undefined;
    getByte(): number;
    getBytes(length?: number): Uint8Array;
    getByteRange(begin: number, end: number): Uint8Array;
    makeSubStream(start: number, length?: number, dict?: Dict): ChunkedStreamSubstream;
    getBaseStreams(): this[];
}
export interface ChunkRange {
    begin: number;
    end: number;
}
export declare class ChunkedStreamManager {
    #private;
    pdfNetworkStream: PDFWorkerStream;
    length: number;
    chunkSize: number;
    stream: ChunkedStream;
    getStream(): ChunkedStream;
    disableAutoFetch: boolean;
    msgHandler: MessageHandler<Thread.worker, Thread.main>;
    currRequestId: number;
    progressiveDataLength: number;
    aborted: boolean;
    constructor(pdfNetworkStream: PDFWorkerStream, args: {
        msgHandler: MessageHandler<Thread.worker>;
        length: number;
        disableAutoFetch: boolean;
        rangeChunkSize: number;
    });
    sendRequest(begin: number, end: number): Promise<void>;
    /**
     * Get all the chunks that are not yet loaded and group them into
     * contiguous ranges to load in as few requests as possible.
     */
    requestAllChunks(noFetch?: boolean): Promise<ChunkedStream>;
    /**
     * Loads any chunks in the requested range that are not yet loaded.
     */
    requestRange(begin: number, end: number): Promise<void>;
    requestRanges(ranges?: ChunkRange[]): Promise<void>;
    /**
     * Groups a sorted array of chunks into as few contiguous larger
     * chunks as possible.
     */
    groupChunks(chunks: number[]): {
        beginChunk: number;
        endChunk: number;
    }[];
    onProgress(args: {
        loaded: number;
    }): void;
    onReceiveData(args: {
        chunk: ArrayBufferLike;
        begin?: number;
    }): void;
    onError(err: any): void;
    getBeginChunk(begin: number): number;
    getEndChunk(end: number): number;
    abort(reason: AbortException): void;
}
export {};
//# sourceMappingURL=chunked_stream.d.ts.map