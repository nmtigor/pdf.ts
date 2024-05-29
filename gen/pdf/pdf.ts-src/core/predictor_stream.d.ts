/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/predictor_stream.ts
 * @license Apache-2.0
 ******************************************************************************/
import { DecodeStream } from "./decode_stream.js";
import type { FlateStream } from "./flate_stream.js";
import type { LZWStream } from "./lzw_stream.js";
import { Dict } from "./primitives.js";
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