import { Anprogress } from "../an/anprogress.js";
import { HTMLAnvuu } from "../an/anvuu.js";
import { Cssc } from "../colr.js";
import { Coo } from "../mv.js";
export declare class Progressbar<C extends Coo = Coo> extends HTMLAnvuu<C, HTMLDivElement> {
    readonly higt: number;
    protected readonly slider_el$: HTMLDivElement;
    readonly anp: Anprogress;
    /**
     * @headconst @param coo_x
     * @const @param higt_x
     * @const @param bg_cssc_x
     * @const @param fg_cssc_x
     * @const @param min_x in milliseconds
     * @const @param max_x in milliseconds
     */
    constructor(coo_x: C, higt_x: number, bg_cssc_x: Cssc, fg_cssc_x: Cssc, min_x: number, max_x: number);
    set anval(anval_x: number);
    set fgcolr(fg_cssc_x: Cssc);
}
export declare class HoldIndicatr<C extends Coo = Coo> extends Progressbar<C> {
    #private;
    /**
     * ! Can not detect by `this.anp.st & Anprogress_ST.stop`,
     * ! b/c `anp.st` could change in the next tick, not immediately.
     */
    get idle(): boolean;
    /**
     * @headconst @param coo_x
     * @const @param cssc_x
     * @const @param zIndex_x
     */
    constructor(coo_x: C, fg_cssc_x: Cssc, bottom_x: number, zIndex_x?: number);
    stop(): void;
    /**
     * @const @param max_x >0, in milliseconds
     */
    play(max_x: number): void;
}
//# sourceMappingURL=progressbar.d.ts.map