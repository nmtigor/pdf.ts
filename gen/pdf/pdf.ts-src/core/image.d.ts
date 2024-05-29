/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/image.ts
 * @license Apache-2.0
 ******************************************************************************/
import { ImageKind } from "../shared/util.js";
import { BaseStream } from "./base_stream.js";
import { ColorSpace } from "./colorspace.js";
import { ImageStream } from "./decode_stream.js";
import type { ImgData } from "./evaluator.js";
import type { PDFFunctionFactory } from "./function.js";
import type { LocalColorSpaceCache } from "./image_utils.js";
import { type Dict } from "./primitives.js";
import type { XRef } from "./xref.js";
interface PDFImageCtorP_ {
    xref: XRef;
    res: Dict;
    image: ImageStream;
    isInline?: boolean;
    smask?: BaseStream | undefined;
    mask?: BaseStream | number[] | undefined;
    isMask?: boolean;
    pdfFunctionFactory: PDFFunctionFactory;
    localColorSpaceCache: LocalColorSpaceCache;
}
interface CreateMaskP_ {
    imgArray: Uint8Array | Uint8ClampedArray;
    width: number;
    height: number;
    imageIsFromDecodeStream: boolean;
    inverseDecode: boolean;
    interpolate: boolean | undefined;
    isOffscreenCanvasSupported?: boolean | undefined;
}
interface BuildImageP_ {
    xref: XRef;
    res: Dict;
    image: ImageStream;
    isInline: boolean;
    pdfFunctionFactory: PDFFunctionFactory;
    localColorSpaceCache: LocalColorSpaceCache;
}
interface GetImageBytesP_ {
    drawWidth?: number;
    drawHeight?: number;
    forceRGBA?: boolean;
    forceRGB?: boolean;
    internal?: boolean;
}
/**
 * 8.9
 */
export declare class PDFImage {
    image: ImageStream;
    width: number;
    height: number;
    interpolate: boolean;
    imageMask: boolean;
    matte: boolean | number[];
    bpc: number;
    colorSpace?: ColorSpace;
    numComps?: number | undefined;
    decode: number[] | undefined;
    needsDecode: boolean;
    decodeCoefficients: number[] | undefined;
    decodeAddends?: number[];
    smask?: PDFImage;
    mask?: PDFImage | number[];
    constructor({ xref, res, image, isInline, smask, mask, isMask, pdfFunctionFactory, localColorSpaceCache, }: PDFImageCtorP_);
    /**
     * Handles processing of image data and returns the Promise that is resolved
     * with a PDFImage when the image is ready to be used.
     */
    static buildImage({ xref, res, image, isInline, pdfFunctionFactory, localColorSpaceCache, }: BuildImageP_): Promise<PDFImage>;
    static createRawMask({ imgArray, width, height, imageIsFromDecodeStream, inverseDecode, interpolate, }: CreateMaskP_): ImgData;
    static createMask({ imgArray, width, height, imageIsFromDecodeStream, inverseDecode, interpolate, isOffscreenCanvasSupported, }: CreateMaskP_): Promise<ImgData>;
    get drawWidth(): number;
    get drawHeight(): number;
    decodeBuffer(buffer: Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array): void;
    getComponents(buffer: Uint8Array | Uint8ClampedArray): Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array;
    fillOpacity(rgbaBuf: Uint8ClampedArray, width: number, height: number, actualHeight: number, image: Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array): void;
    undoPreblend(buffer: Uint8ClampedArray, width: number, height: number): void;
    createImageData(forceRGBA?: boolean, isOffscreenCanvasSupported?: boolean): Promise<ImgData>;
    fillGrayBuffer(buffer: Uint8ClampedArray): void;
    createBitmap(kind: ImageKind, width: number, height: number, src: Uint8Array | Uint8ClampedArray): ImgData;
    getImageBytes(length: number, { drawWidth, drawHeight, forceRGBA, forceRGB, internal, }: GetImageBytesP_): Uint8Array | Uint8ClampedArray;
}
export {};
//# sourceMappingURL=image.d.ts.map