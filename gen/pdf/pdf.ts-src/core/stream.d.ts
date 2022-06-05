import { BaseStream } from "./base_stream.js";
import { Dict } from "./primitives.js";
export declare class Stream extends BaseStream {
    readonly bytes: Uint8Array;
    start: number;
    end: number;
    /** @implements */
    get length(): number;
    /** @implements */
    get isEmpty(): boolean;
    constructor(arrayBuffer: Uint8Array | ArrayLike<number> | ArrayBufferLike, start?: number, length?: number, dict?: Dict);
    /** @implements */
    getByte(): number;
    /** @implements */
    getBytes(length?: number): Uint8Array;
    /** @implements */
    getByteRange(begin: number, end: number): Uint8Array;
    /** @implements */
    reset(): void;
    /**
     * @implements
     * @final
     */
    moveStart(): void;
    /** @implements */
    makeSubStream(start: number, length?: number, dict?: Dict): Stream;
}
export declare class StringStream extends Stream {
    constructor(str: string);
}
export declare class NullStream extends Stream {
    constructor();
}
//# sourceMappingURL=stream.d.ts.map