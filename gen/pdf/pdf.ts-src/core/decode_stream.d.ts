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
    /** @implements */
    get length(): any;
    /**
     * @implements
     * @final
     */
    get isEmpty(): boolean;
    minBufferLength: number;
    str?: BaseStream;
    constructor(maybeMinBufferLength?: number);
    protected abstract readBlock(): void;
    ensureBuffer(requested: number): Uint8Array | Uint8ClampedArray;
    /**
     * @implements
     * @final
     */
    getByte(): number;
    /**
     * @implements
     * @final
     */
    getBytes(length?: number, forceClamped?: boolean): Uint8Array | Uint8ClampedArray;
    /** @implements */
    reset(): void;
    /** @implements */
    getByteRange(begin: number, end: number): any;
    /** @implements */
    moveStart(): void;
    /**
     * @implements
     * @final
     */
    makeSubStream(start: number, length: number, dict?: Dict): Stream;
    getBaseStreams(): BaseStream[] | undefined;
}
/** @final */
export declare class StreamsSequenceStream extends DecodeStream {
    streams: BaseStream[];
    _onError: ((reason: unknown, objId?: string | undefined) => void) | undefined;
    constructor(streams: BaseStream[], onError?: (reason: unknown, objId?: string) => void);
    /** @implements */
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