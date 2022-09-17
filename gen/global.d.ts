import { HTMLVCo } from "./lib/mv.js";
import { HoldIndicatr } from "./lib/widget/progressbar.js";
export declare const INOUT = true, DEV = true, INFO = true, RESIZ = false, INTRS = false, EDITOR = true, EDITOR_v = true, EDITOR_vv = false, PDFTS = true, PDFTS_v = true, PDFTS_vv = false, _INFO = true, APP = false, DENO = false, TESTING = false, /** @deprecated */ TEST_ALL = false, GENERIC = true, MOZCENTRAL = false, CHROME = false, PRODUCTION = false, LIB = false, SKIP_BABEL = false, IMAGE_DECODERS = false, COMPONENTS = false, _PDFDEV = true;
/**
 * Singleton
 * @final
 */
declare class Global {
    #private;
    /** @deprecated Use preprocessor. */
    testing: boolean;
    readonly LASTUPDATE_NOT = "2020-07-10 22:17:59 +0200";
    readonly LASTUPDATE_DATNI = "2020-07-24 01:59:51 +0200";
    readonly LASTUPDATE_DEV = "2021-05-22 05:04:21 +0200";
    globalhvc?: HTMLVCo;
    holdindicatr?: [HoldIndicatr, HoldIndicatr, HoldIndicatr];
    has_ResizeObserver: boolean;
    can_touchstart: boolean;
    get dent(): string;
    get indent(): string;
    get outdent(): number;
}
export declare const global: Global;
export {};
//# sourceMappingURL=global.d.ts.map