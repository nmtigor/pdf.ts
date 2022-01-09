import { HTMLVCoo } from "./lib/mv.js";
import { HoldIndicatr } from "./lib/widget/progressbar.js";
/**
 * Singleton
 * @final
 */
declare class Global {
    #private;
    testing: boolean; /** @deprecated use preprocessor */
    readonly LASTUPDATE_NOT = "2020-07-10 22:17:59 +0200";
    readonly LASTUPDATE_DATNI = "2020-07-24 01:59:51 +0200";
    readonly LASTUPDATE_DEV = "2021-05-22 05:04:21 +0200";
    globalhvc?: HTMLVCoo;
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