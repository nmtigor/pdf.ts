import { Dict } from "./primitives.js";
export declare abstract class BaseStream {
    pos: number;
    start?: number;
    end?: number;
    abstract get length(): number;
    abstract get isEmpty(): boolean;
    get isDataLoaded(): boolean;
    dict: Dict | undefined;
    cacheKey?: string;
    abstract getByte(): number;
    abstract getBytes(length?: number, forceClamped?: boolean): Uint8Array | Uint8ClampedArray;
    /** @final */
    peekByte(): number;
    /** @final */
    peekBytes(length?: number, forceClamped?: boolean): Uint8Array | Uint8ClampedArray;
    /** @final */
    getUint16(): number;
    /** @final */
    getInt32(): number;
    abstract getByteRange(begin: number, end: number): Uint8Array;
    /** @final */
    getString(length?: number): string;
    /** @final */
    skip(n?: number): void;
    abstract reset(): void;
    abstract moveStart(): void;
    abstract makeSubStream(start: number, length?: number, dict?: Dict): BaseStream;
    getBaseStreams(): BaseStream[] | undefined;
}
//# sourceMappingURL=base_stream.d.ts.map