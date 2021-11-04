import { OPS } from "../shared/util.js";
import { Dict, Obj, Ref, RefSetCache } from "./primitives.js";
import { ImgData } from "./evaluator.js";
import { ColorSpace } from "./colorspace.js";
import { OpListIR } from "./operator_list.js";
import { ParsedFunction } from "./function.js";
declare abstract class BaseLocalCache<CD> {
    _onlyRefs: boolean;
    protected nameRefMap$: Map<string, string | Ref> | undefined;
    protected imageMap$: Map<string, CD> | undefined;
    protected imageCache$: RefSetCache<CD>;
    constructor(options?: {
        onlyRefs: boolean;
    });
    getByName(name: string): CD | null;
    /** @final */
    getByRef(ref: string | Ref): CD | null;
    abstract set(name: string | undefined, ref: Ref | string | null, data: CD): void;
}
interface Image_LI_CData {
    fn: OPS.paintImageXObject;
    args: [objId: string, width: number, height: number];
}
interface ImageMask_LI_CData {
    fn: OPS.paintImageMaskXObject;
    args: [ImgData];
}
export declare type LI_CData = Image_LI_CData | ImageMask_LI_CData;
declare type LI_CData_B = LI_CData | boolean;
export declare class LocalImageCache extends BaseLocalCache<LI_CData_B> {
    /** @implements */
    set(name: string, ref: string | Ref | null | undefined, data: LI_CData_B): void;
}
declare type LCS_CData = ColorSpace;
export declare class LocalColorSpaceCache extends BaseLocalCache<LCS_CData> {
    /** @implements */
    set(name: string | null | undefined, ref: string | Ref | null | undefined, data: LCS_CData): void;
}
declare type LF_CData = ParsedFunction;
export declare class LocalFunctionCache extends BaseLocalCache<LF_CData> {
    constructor();
    /** @implements */
    set(name: string | null | undefined, ref: Ref | string | null, data: LF_CData): void;
}
export declare type LGS_CData = [string, Obj][];
declare type LGS_CData_B = LGS_CData | boolean;
export declare class LocalGStateCache extends BaseLocalCache<LGS_CData_B> {
    /** @implements */
    set(name: string, ref: string | Ref | null | undefined, data: LGS_CData_B): void;
}
declare type LTP_CData = {
    operatorListIR: OpListIR;
    dict: Dict;
};
export declare class LocalTilingPatternCache extends BaseLocalCache<LTP_CData> {
    constructor(options?: unknown);
    /** @implements */
    set(name: string | undefined, ref: string | Ref | null | undefined, data: LTP_CData): void;
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
    shouldCache(ref: string | Ref, pageIndex: number): boolean;
    addPageIndex(ref: Ref | string, pageIndex: number): void;
    /**
     * PLEASE NOTE: Must be called *after* the `setData` method.
     */
    addByteSize(ref: string | Ref, byteSize: number): void;
    getData(ref: Ref, pageIndex: number): GI_CData | undefined;
    setData(ref: Ref | string, data: GI_CData): void;
    clear(onlyData?: boolean): void;
}
export {};
//# sourceMappingURL=image_utils.d.ts.map