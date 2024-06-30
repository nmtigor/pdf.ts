/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/jpx.ts
 * @license Apache-2.0
 ******************************************************************************/
import { BaseException } from "../shared/util.js";
export declare class JpxError extends BaseException {
    constructor(msg: string);
}
export declare class JpxImage {
    #private;
    static decode(data: unknown, ignoreColorSpace?: boolean): unknown;
    static cleanup(): void;
    static parseImageProperties(stream_x: unknown): {
        width: number;
        height: number;
        bitsPerComponent: number;
        componentsCount: number;
    };
}
//# sourceMappingURL=jpx.d.ts.map