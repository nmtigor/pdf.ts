import { DecodeStream } from "./decode_stream.js";
import { Dict } from "./primitives.js";
import { FlateStream } from "./flate_stream.js";
import { LZWStream } from "./lzw_stream.js";
export interface PredictorStream {
    readBlock(): void;
}
/** @final */
export declare class PredictorStream extends DecodeStream {
    predictor: number;
    colors: number;
    bits: number;
    columns: number;
    pixBytes: number;
    rowBytes: number;
    /**
     * ! Could return non-PredictorStream.
     */
    constructor(str: FlateStream | LZWStream, maybeLength?: number, params?: Dict);
    protected readBlockTiff(): void;
    protected readBlockPng(): void;
}
//# sourceMappingURL=predictor_stream.d.ts.map