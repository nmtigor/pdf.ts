import { BaseStream } from "./base_stream.js";
import { Dict } from "./primitives.js";
export declare class Stream extends BaseStream {
    readonly bytes: Uint8Array;
    start: number;
    end: number;
    /** @implement */
    get length(): number;
    /** @implement */
    get isEmpty(): boolean;
    constructor(arrayBuffer: Uint8Array | ArrayLike<number> | ArrayBufferLike, start?: number, length?: number, dict?: Dict);
    /** @implement */
    getByte(): number;
    /** @implement */
    getBytes(length?: number): Uint8Array;
    /** @implement */
    getByteRange(begin: number, end: number): Uint8Array;
    /** @implement */
    reset(): void;
    /**
     * @implement
     * @final
     */
    moveStart(): void;
    /** @implement */
    makeSubStream(start: number, length?: number, dict?: Dict): Stream;
}
export declare class StringStream extends Stream {
    constructor(str: string);
}
export declare class NullStream extends Stream {
    constructor();
}
//# sourceMappingURL=stream.d.ts.map