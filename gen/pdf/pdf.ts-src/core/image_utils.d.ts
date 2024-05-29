/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/image_utils.ts
 * @license Apache-2.0
 ******************************************************************************/
import { OPS } from "../shared/util.js";
import type { ColorSpace } from "./colorspace.js";
import type { ImgData, MarkedContentProps } from "./evaluator.js";
import type { ParsedFunction } from "./function.js";
import type { OpListIR } from "./operator_list.js";
import type { Dict, Obj, Ref } from "./primitives.js";
import { RefSetCache } from "./primitives.js";
declare abstract class BaseLocalCache<CD> {
    #private;
    protected nameRefMap$: Map<string, string | Ref> | undefined;
    protected imageMap$: Map<string, CD> | undefined;
    protected imageCache$: RefSetCache<CD>;
    constructor(options?: {
        onlyRefs: boolean;
    });
    /** @final */
    getByName(name: string): NonNullable<CD> | undefined;
    /** @final */
    getByRef(ref: string | Ref): NonNullable<CD> | undefined;
    abstract set(name: string | undefined, ref: Ref | string | undefined, data: CD): void;
}
export interface Image_LI_CData {
    fn: OPS.paintImageXObject;
    args: [objId: string, width: number, height: number];
    optionalContent: MarkedContentProps | undefined;
}
export interface ImageMask_LI_CData {
    fn: OPS.paintImageMaskXObject;
    args: [ImgData];
    optionalContent: MarkedContentProps | undefined;
}
export interface SolidColorImageMask_LI_CData {
    fn: OPS.paintSolidColorImageMask;
    args: ImgData[];
    optionalContent: MarkedContentProps | undefined;
}
export type LI_CData = Image_LI_CData | ImageMask_LI_CData | SolidColorImageMask_LI_CData;
export declare class LocalImageCache extends BaseLocalCache<LI_CData | boolean> {
    /** @implement */
    set(name: string, ref: string | Ref | undefined, data: LI_CData | boolean): void;
}
type LCS_CData = ColorSpace;
export declare class LocalColorSpaceCache extends BaseLocalCache<LCS_CData> {
    /** @implement */
    set(name: string | undefined, ref: string | Ref | undefined, data: LCS_CData): void;
}
type LF_CData = ParsedFunction;
export declare class LocalFunctionCache extends BaseLocalCache<LF_CData> {
    constructor();
    /** @implement */
    set(name: string | undefined, ref: Ref | string | undefined, data: LF_CData): void;
}
export type LGS_CData = [string, Obj][];
export declare class LocalGStateCache extends BaseLocalCache<LGS_CData | boolean> {
    /** @implement */
    set(name: string, ref: string | Ref | undefined, data: LGS_CData | boolean): void;
}
type LTP_CData = {
    operatorListIR: OpListIR;
    dict: Dict;
};
export declare class LocalTilingPatternCache extends BaseLocalCache<LTP_CData> {
    constructor(options?: unknown);
    /** @implement */
    set(name: string | undefined, ref: string | Ref | undefined, data: LTP_CData): void;
}
type RIC_CData = unknown;
export declare class RegionalImageCache extends BaseLocalCache<RIC_CData> {
    constructor();
    set(name: string | undefined, ref: Ref | string | undefined, data: RIC_CData): void;
}
type GI_CData = Image_LI_CData & {
    objId: string;
    byteSize?: number;
};
export declare class GlobalImageCache {
    #private;
    static readonly NUM_PAGES_THRESHOLD = 2;
    static readonly MIN_IMAGES_TO_CACHE = 10;
    static readonly MAX_BYTE_SIZE: number;
    constructor();
    get _byteSize(): number;
    get _cacheLimitReached(): boolean;
    /** @final */
    shouldCache(ref: string | Ref, pageIndex: number): boolean;
    /**
     * PLEASE NOTE: Must be called *after* the `setData` method.
     * @final
     */
    addByteSize(ref: string | Ref, byteSize: number): void;
    /** @final */
    getData(ref: Ref, pageIndex: number): GI_CData | undefined;
    /** @final */
    setData(ref: Ref | string, data: GI_CData): void;
    /** @fianl */
    clear(onlyData?: boolean): void;
}
export {};
//# sourceMappingURL=image_utils.d.ts.map