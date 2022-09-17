import { BaseStream } from "./base_stream.js";
import { Dict } from "./primitives.js";
import { Stream } from "./stream.js";
/**
 * Super class for the decoding streams.
 */
export declare abstract class DecodeStream extends BaseStream {
    buffer: Uint8Array | Uint8ClampedArray;
    _rawMinBufferLength: number;
    bufferLength: number;
    eof: boolean;
    /** @implement */
    get length(): any;
    /**
     * @implement
     * @final
     */
    get isEmpty(): boolean;
    minBufferLength: number;
    str?: BaseStream;
    constructor(maybeMinBufferLength?: number);
    protected abstract readBlock(): void;
    ensureBuffer(requested: number): Uint8Array | Uint8ClampedArray;
    /**
     * @implement
     * @final
     */
    getByte(): number;
    /**
     * @implement
     * @final
     */
    getBytes(length?: number): Uint8Array | Uint8ClampedArray;
    /** @implement */
    reset(): void;
    /** @implement */
    getByteRange(begin: number, end: number): any;
    /** @implement */
    moveStart(): void;
    /**
     * @implement
     * @final
     */
    makeSubStream(start: number, length: number, dict?: Dict): Stream;
    getBaseStreams(): BaseStream[] | undefined;
}
/** @final */
export declare class StreamsSequenceStream extends DecodeStream {
    streams: BaseStream[];
    _onError: ((reason: unknown, objId?: string) => void) | undefined;
    constructor(streams: BaseStream[], onError?: (reason: unknown, objId?: string) => void);
    /** @implement */
    readBlock(): void;
    getBaseStreams(): BaseStream[] | undefined;
}
export declare abstract class ImageStream extends DecodeStream {
    stream: BaseStream;
    maybeLength: number | undefined;
    params: Dict | undefined;
    width?: number | undefined;
    height?: number | undefined;
    bitsPerComponent?: number | undefined;
    numComps?: number | undefined;
    drawWidth?: number;
    drawHeight?: number;
    forceRGB?: boolean;
    constructor(stream: BaseStream, maybeLength?: number, params?: Dict);
}
//# sourceMappingURL=decode_stream.d.ts.map