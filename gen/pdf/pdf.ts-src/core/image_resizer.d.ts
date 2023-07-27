import type { ImgData } from "./evaluator.js";
export declare class ImageResizer {
    _imgData: ImgData;
    _isMask: boolean;
    static _goodSquareLength: number;
    static _hasMaxArea: boolean;
    constructor(imgData: ImgData, isMask: boolean);
    static needsToBeResized(width: number, height: number): boolean;
    static get MAX_DIM(): number;
    static get MAX_AREA(): number;
    static set MAX_AREA(area: number);
    static setMaxArea(area: number): void;
    static _areGoodDims(width: number, height: number): boolean;
    static _guessMax(start: number, end: number, tolerance: number, defaultHeight: number): number;
    static createImage(imgData: ImgData, isMask?: boolean): Promise<ImgData>;
    _createImage(): Promise<ImgData>;
    _encodeBMP(): Uint8Array;
}
//# sourceMappingURL=image_resizer.d.ts.map