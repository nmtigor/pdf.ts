/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/shared/image_utils.ts
 * @license Apache-2.0
 ******************************************************************************/
import { ImageKind } from "./util.js";
type ImageDataP_ = {
    src: Uint8Array | Uint8ClampedArray;
    srcPos?: number;
    dest: Uint8ClampedArray | Uint32Array;
    destPos?: number;
    width: number;
    height: number;
    nonBlackColor?: number;
    inverseDecode?: boolean;
};
export declare function convertToRGBA(params: ImageDataP_ & {
    kind: ImageKind;
}): {
    srcPos: number;
    destPos: number;
} | null;
export declare function convertBlackAndWhiteToRGBA({ src, srcPos, dest, width, height, nonBlackColor, inverseDecode, }: ImageDataP_): {
    srcPos: number;
    destPos: number;
};
export declare function grayToRGBA(src: Uint8ClampedArray, dest: Uint32Array): void;
export {};
//# sourceMappingURL=image_utils.d.ts.map