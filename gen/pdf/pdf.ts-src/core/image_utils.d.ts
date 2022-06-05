import { OPS } from "../shared/util.js";
import { ColorSpace } from "./colorspace.js";
import { MarkedContentProps, type ImgData } from "./evaluator.js";
import { type ParsedFunction } from "./function.js";
import { type OpListIR } from "./operator_list.js";
import { Dict, Ref, RefSetCache, type Obj } from "./primitives.js";
declare abstract class BaseLocalCache<CD> {
    #private;
    protected nameRefMap$: Map<string, string | Ref> | undefined;
    protected imageMap$: Map<string, CD> | undefined;
    protected imageCache$: RefSetCache<CD>;
    constructor(options?: {
        onlyRefs: boolean;
    });
    /** @final */
    getByName(name: string): CD | undefined;
    /** @final */
    getByRef(ref: string | Ref): CD | undefined;
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
export declare type LI_CData = Image_LI_CData | ImageMask_LI_CData | SolidColorImageMask_LI_CData;
export declare class LocalImageCache extends BaseLocalCache<LI_CData | boolean> {
    /** @implements */
    set(name: string, ref: string | Ref | undefined, data: LI_CData | boolean): void;
}
declare type LCS_CData = ColorSpace;
export declare class LocalColorSpaceCache extends BaseLocalCache<LCS_CData> {
    /** @implements */
    set(name: string | undefined, ref: string | Ref | undefined, data: LCS_CData): void;
}
declare type LF_CData = ParsedFunction;
export declare class LocalFunctionCache extends BaseLocalCache<LF_CData> {
    constructor();
    /** @implements */
    set(name: string | undefined, ref: Ref | string | undefined, data: LF_CData): void;
}
export declare type LGS_CData = [string, Obj][];
export declare class LocalGStateCache extends BaseLocalCache<LGS_CData | boolean> {
    /** @implements */
    set(name: string, ref: string | Ref | undefined, data: LGS_CData | boolean): void;
}
declare type LTP_CData = {
    operatorListIR: OpListIR;
    dict: Dict;
};
export declare class LocalTilingPatternCache extends BaseLocalCache<LTP_CData> {
    constructor(options?: unknown);
    /** @implements */
    set(name: string | undefined, ref: string | Ref | undefined, data: LTP_CData): void;
}
declare type GI_CData = Image_LI_CData & {
    objId: string;
    byteSize?: number;
};
export declare class GlobalImageCache {
    #private;
    static get NUM_PAGES_THRESHOLD(): number;
    static get MIN_IMAGES_TO_CACHE(): number;
    static get MAX_BYTE_SIZE(): number;
    constructor();
    get _byteSize(): number;
    get _cacheLimitReached(): boolean;
    /** @final */
    shouldCache(ref: string | Ref, pageIndex: number): boolean;
    /** @final */
    addPageIndex(ref: Ref | string, pageIndex: number): void;
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