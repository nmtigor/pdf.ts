import { BaseStream } from "./base_stream.js";
import type { PDFFunctionFactory } from "./function.js";
import type { LocalColorSpaceCache } from "./image_utils.js";
import { Dict, Name, Ref } from "./primitives.js";
import type { XRef } from "./xref.js";
export type CS = Ref | Name | Dict | number | [
    Ref | Name,
    Ref | Name | Dict,
    (undefined | Ref | Name | Dict | number)?,
    (undefined | Ref | BaseStream | string)?
];
interface ParseP_ {
    cs: CS;
    xref: XRef;
    resources: Dict | undefined;
    pdfFunctionFactory: PDFFunctionFactory;
    localColorSpaceCache: LocalColorSpaceCache;
}
/**
 * PDF 1.7 8.6
 */
export declare abstract class ColorSpace {
    name: string;
    numComps: number | undefined;
    base?: ColorSpace | undefined;
    constructor(name: string, numComps?: number);
    /**
     * Converts the color value to the RGB color. The color components are
     * located in the src array starting from the srcOffset. Returns the array
     * of the rgb components, each value ranging from [0,255].
     *
     * @final
     */
    getRgb(src: Float32Array | number[], srcOffset: number): Uint8ClampedArray;
    /**
     * Converts the color value to the RGB color, similar to the getRgb method.
     * The result placed into the dest array starting from the destOffset.
     */
    abstract getRgbItem(src: Float32Array | number[], srcOffset: number, dest: Uint8ClampedArray, destOffset: number): void;
    /**
     * Converts the specified number of the color values to the RGB colors.
     * The colors are located in the src array starting from the srcOffset.
     * The result is placed into the dest array starting from the destOffset.
     * The src array items shall be in [0,2^bits) range, the dest array items
     * will be in [0,255] range. alpha01 indicates how many alpha components
     * there are in the dest array; it will be either 0 (RGB array) or 1 (RGBA
     * array).
     */
    abstract getRgbBuffer(src: Uint8Array | Uint16Array | Uint8ClampedArray | Uint32Array, srcOffset: number, count: number, dest: Uint8ClampedArray, destOffset: number, bits: number, alpha01: number): void;
    /**
     * Determines the number of bytes required to store the result of the
     * conversion done by the getRgbBuffer method. As in getRgbBuffer,
     * |alpha01| is either 0 (RGB output) or 1 (RGBA output).
     */
    abstract getOutputLength(inputLength: number, alpha01: number): number;
    /**
     * Returns true if source data will be equal the result/output data.
     */
    isPassthrough(bits: number): boolean;
    /**
     * Refer to the static `ColorSpace.isDefaultDecode` method below.
     */
    isDefaultDecode(decodeMap: unknown, bpc?: number): boolean;
    /**
     * Fills in the RGB colors in the destination buffer.  alpha01 indicates
     * how many alpha components there are in the dest array; it will be either
     * 0 (RGB array) or 1 (RGBA array).
     *
     * @final
     */
    fillRgb(dest: Uint8ClampedArray, originalWidth: number, originalHeight: number, width: number, height: number, actualHeight: number, bpc: number, comps: Uint8ClampedArray | Uint8Array | Uint16Array | Uint32Array, alpha01: number): void;
    /**
     * True if the colorspace has components in the default range of [0, 1].
     * This should be true for all colorspaces except for lab color spaces
     * which are [0,100], [-128, 127], [-128, 127].
     */
    get usesZeroToOneRange(): boolean;
    private static _cache;
    static getCached(cacheKey: unknown, xref: XRef, localColorSpaceCache: LocalColorSpaceCache): ColorSpace | undefined;
    static parseAsync({ cs, xref, resources, pdfFunctionFactory, localColorSpaceCache, }: ParseP_): Promise<ColorSpace>;
    static parse({ cs, xref, resources, pdfFunctionFactory, localColorSpaceCache, }: ParseP_): ColorSpace;
    private static _parse;
    /**
     * Checks if a decode map matches the default decode map for a color space.
     * This handles the general decode maps where there are two values per
     * component, e.g. [0, 1, 0, 1, 0, 1] for a RGB color.
     * This does not handle Lab, Indexed, or Pattern decode maps since they are
     * slightly different.
     * @param decode Decode map (usually from an image).
     * @param numComps Number of components the color space has.
     */
    static isDefaultDecode(decode: unknown, numComps: number): boolean;
    static get singletons(): {
        readonly gray: DeviceGrayCS;
        readonly rgb: DeviceRgbCS;
        readonly cmyk: DeviceCmykCS;
    };
}
/**
 * The default color is `new Float32Array([0])`.
 */
export declare class DeviceGrayCS extends ColorSpace {
    constructor();
    /** @implement */
    getRgbItem(src: Float32Array | number[], srcOffset: number, dest: Uint8ClampedArray, destOffset: number): void;
    /** @implement */
    getRgbBuffer(src: Uint8Array | Uint16Array | Uint8ClampedArray | Uint32Array, srcOffset: number, count: number, dest: Uint8ClampedArray, destOffset: number, bits: number, alpha01: number): void;
    getOutputLength(inputLength: number, alpha01: number): number;
}
/**
 * The default color is `new Float32Array([0, 0, 0])`.
 */
declare class DeviceRgbCS extends ColorSpace {
    constructor();
    /** @implement */
    getRgbItem(src: Float32Array | number[], srcOffset: number, dest: Uint8ClampedArray, destOffset: number): void;
    /** @implement */
    getRgbBuffer(src: Uint8Array | Uint16Array | Uint8ClampedArray | Uint32Array, srcOffset: number, count: number, dest: Uint8ClampedArray, destOffset: number, bits: number, alpha01: number): void;
    getOutputLength(inputLength: number, alpha01: number): number;
    isPassthrough(bits: number): boolean;
}
/**
 * The default color is `new Float32Array([0, 0, 0, 1])`.
 */
declare class DeviceCmykCS extends ColorSpace {
    #private;
    constructor();
    /** @implement */
    getRgbItem(src: Float32Array | number[], srcOffset: number, dest: Uint8ClampedArray, destOffset: number): void;
    /** @implement */
    getRgbBuffer(src: Uint8Array | Uint16Array | Uint8ClampedArray | Uint32Array, srcOffset: number, count: number, dest: Uint8ClampedArray, destOffset: number, bits: number, alpha01: number): void;
    getOutputLength(inputLength: number, alpha01: number): number;
}
export {};
//# sourceMappingURL=colorspace.d.ts.map