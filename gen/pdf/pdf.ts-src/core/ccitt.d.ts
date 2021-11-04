interface CCITTFaxDecoderSource {
    /**
     * Method that return one byte of data for decoding,
     * or -1 when EOF is reached.
     */
    next: () => number;
}
export interface CCITTFaxDecoderOptions {
    K?: number | undefined;
    Columns?: number | undefined;
    Rows?: number | undefined;
    BlackIs1?: boolean | undefined;
    EndOfBlock?: boolean | undefined;
    EndOfLine?: boolean | undefined;
    EncodedByteAlign?: boolean | undefined;
}
declare namespace NsCCITTFaxDecoder {
    /**
     * @param - The data which should be decoded.
     * @param - Decoding options.
     */
    class CCITTFaxDecoder {
        #private;
        source: CCITTFaxDecoderSource;
        eof: boolean;
        encoding: number;
        eoline: boolean;
        byteAlign: boolean;
        columns: number;
        rows: number;
        eoblock: boolean;
        black: boolean;
        codingLine: Uint32Array;
        refLine: Uint32Array;
        codingPos: number;
        row: number;
        nextLine2D: boolean;
        inputBits: number;
        inputBuf: number;
        outputBits: number;
        rowsDone: boolean;
        err?: boolean;
        constructor(source: CCITTFaxDecoderSource, options?: CCITTFaxDecoderOptions);
        readNextChar(): number;
    }
}
export import CCITTFaxDecoder = NsCCITTFaxDecoder.CCITTFaxDecoder;
export {};
//# sourceMappingURL=ccitt.d.ts.map