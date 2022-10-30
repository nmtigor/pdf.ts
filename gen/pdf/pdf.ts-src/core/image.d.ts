import { BaseStream } from "./base_stream.js";
import { ColorSpace } from "./colorspace.js";
import { ImageStream } from "./decode_stream.js";
import { type ImgData } from "./evaluator.js";
import { PDFFunctionFactory } from "./function.js";
import { LocalColorSpaceCache } from "./image_utils.js";
import { Dict } from "./primitives.js";
import { XRef } from "./xref.js";
interface _PDFImageCtorP {
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
interface _CreateMaskP {
    imgArray: Uint8Array | Uint8ClampedArray;
    width: number;
    height: number;
    imageIsFromDecodeStream: boolean;
    inverseDecode: boolean;
    interpolate: boolean | undefined;
    isOffscreenCanvasSupported?: boolean | undefined;
}
interface _BuildImageP {
    xref: XRef;
    res: Dict;
    image: ImageStream;
    isInline: boolean;
    pdfFunctionFactory: PDFFunctionFactory;
    localColorSpaceCache: LocalColorSpaceCache;
}
interface _GetImageBytesP {
    drawWidth?: number;
    drawHeight?: number;
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
    constructor({ xref, res, image, isInline, smask, mask, isMask, pdfFunctionFactory, localColorSpaceCache, }: _PDFImageCtorP);
    /**
     * Handles processing of image data and returns the Promise that is resolved
     * with a PDFImage when the image is ready to be used.
     */
    static buildImage({ xref, res, image, isInline, pdfFunctionFactory, localColorSpaceCache, }: _BuildImageP): Promise<PDFImage>;
    static createRawMask({ imgArray, width, height, imageIsFromDecodeStream, inverseDecode, interpolate, }: _CreateMaskP): ImgData;
    static createMask({ imgArray, width, height, imageIsFromDecodeStream, inverseDecode, interpolate, isOffscreenCanvasSupported, }: _CreateMaskP): ImgData;
    get drawWidth(): number;
    get drawHeight(): number;
    decodeBuffer(buffer: Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array): void;
    getComponents(buffer: Uint8Array | Uint8ClampedArray): Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array;
    fillOpacity(rgbaBuf: Uint8ClampedArray, width: number, height: number, actualHeight: number, image: Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array): void;
    undoPreblend(buffer: Uint8ClampedArray, width: number, height: number): void;
    createImageData(forceRGBA?: boolean): ImgData;
    fillGrayBuffer(buffer: Uint8ClampedArray): void;
    getImageBytes(length: number, { drawWidth, drawHeight, forceRGB, internal }: _GetImageBytesP): Uint8Array | Uint8ClampedArray;
}
export {};
//# sourceMappingURL=image.d.ts.map