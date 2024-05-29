/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/arithmetic_decoder.ts
 * @license Apache-2.0
 ******************************************************************************/
/**
 * This class implements the QM Coder decoding as defined in
 *   JPEG 2000 Part I Final Committee Draft Version 1.0
 *   Annex C.3 Arithmetic decoding procedure
 * available at http://www.jpeg.org/public/fcd15444-1.pdf
 *
 * The arithmetic decoder is used in conjunction with context models to decode
 * JPEG2000 and JBIG2 streams.
 */
export declare class ArithmeticDecoder {
    data: Uint8Array | Uint8ClampedArray;
    bp: number;
    dataEnd: number;
    chigh: number;
    clow: number;
    ct: number;
    a: number;
    /**
     * C.3.5 Initialisation of the decoder (INITDEC)
     */
    constructor(data: Uint8Array | Uint8ClampedArray, start: number, end: number);
    /**
     * C.3.4 Compressed data input (BYTEIN)
     */
    byteIn(): void;
    /**
     * C.3.2 Decoding a decision (DECODE)
     */
    readBit(contexts: Int8Array, pos: number): number;
}
//# sourceMappingURL=arithmetic_decoder.d.ts.map