import { Dict } from "./primitives.js";
import { ColorSpace } from "./colorspace.js";
import { ImageStream } from "./decode_stream.js";
import { PDFFunctionFactory } from "./function.js";
import { LocalColorSpaceCache } from "./image_utils.js";
import { ImgData } from "./evaluator.js";
import { XRef } from "./xref.js";
import { BaseStream } from "./base_stream.js";
interface PDFImageCtorParms {
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
interface CreateMaskParms {
    imgArray: Uint8ClampedArray;
    width: number;
    height: number;
    imageIsFromDecodeStream: boolean;
    inverseDecode: boolean;
    interpolate: boolean | undefined;
}
export interface ImageMask {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    interpolate: boolean | undefined;
}
interface BuildImageParms {
    xref: XRef;
    res: Dict;
    image: ImageStream;
    isInline: boolean;
    pdfFunctionFactory: PDFFunctionFactory;
    localColorSpaceCache: LocalColorSpaceCache;
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
    constructor({ xref, res, image, isInline, smask, mask, isMask, pdfFunctionFactory, localColorSpaceCache, }: PDFImageCtorParms);
    /**
     * Handles processing of image data and returns the Promise that is resolved
     * with a PDFImage when the image is ready to be used.
     */
    static buildImage({ xref, res, image, isInline, pdfFunctionFactory, localColorSpaceCache, }: BuildImageParms): Promise<PDFImage>;
    static createMask({ imgArray, width, height, imageIsFromDecodeStream, inverseDecode, interpolate, }: CreateMaskParms): ImageMask;
    get drawWidth(): number;
    get drawHeight(): number;
    decodeBuffer(buffer: Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array): void;
    getComponents(buffer: Uint8Array | Uint8ClampedArray): Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array;
    fillOpacity(rgbaBuf: Uint8ClampedArray, width: number, height: number, actualHeight: number, image: Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array): void;
    undoPreblend(buffer: Uint8ClampedArray, width: number, height: number): void;
    createImageData(forceRGBA?: boolean): ImgData;
    fillGrayBuffer(buffer: Uint8ClampedArray): void;
    getImageBytes(length: number, drawWidth?: number, drawHeight?: number, forceRGB?: boolean): Uint8Array | Uint8ClampedArray;
}
export {};
//# sourceMappingURL=image.d.ts.map