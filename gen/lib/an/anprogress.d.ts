import { Ratio } from "../alias.js";
import { Moo } from "../mv.js";
import { HTMLAnvuu } from "./anvuu.js";
export declare const enum Anprogress_ST {
    unknown = 0,
    stop0 = 1,
    stop1 = 2,
    stop = 3,
    strt0 = 4,
    strt1 = 8,
    strt = 12
}
/** @final */
export declare class Anprogress {
    #private;
    readonly id: number;
    get min_$(): number;
    get max_$(): number;
    get dur_$(): number;
    /**
     * float in milliseconds,
     * returned from `performance.now()` indicating the point in time when
     * `requestAnimationFrame()` starts to execute callback functions.
     */
    ts_$: number | undefined;
    get st_mo(): Moo<Anprogress_ST, any>;
    get st(): Anprogress_ST;
    get newst(): Anprogress_ST;
    get progress_p(): Promise<void> | undefined;
    /**
     * @const @param min_x in milliseconds
     * @const @param max_x
     * @headconst @param anvuu
     * @headconst @param anfun
     */
    constructor(min_x: number, max_x: number, anvuu: HTMLAnvuu, anfun?: Anlinear);
    /**
     * @const @param min_x in milliseconds
     * @const @param max_x
     */
    reset(min_x: number, max_x: number): this;
    /**
     * @const @param ratio
     */
    valOf(ratio: Ratio): number;
    /**
     * Set `#st_mo`
     * out( this.ts_$ !== undefined )
     * @const @param ts_x
     * @const @param dir_x
     */
    protected strt$(ts_x: number, dir_x: number): void;
    /**
     * Set `#st_mo`
     * out( this.ts_$ === undefined )
     * @const @param dir_x
     */
    stop(dir_x?: 1 | -1): void;
    /**
     * @const @param src_x in milliseconds
     * @const @param dur_x How long to play.
     *  Can be negative, which means playing backwards
     * @const @param ts0_x Could set manually, float in milliseconds.
     */
    play(src_x?: number, dur_x?: number, ts0_x?: number): void;
    forwplay(src_x?: number, dur_x?: number, ts0_x?: number): void;
    backplay(src_x?: number, dur_x?: number, ts0_x?: number): void;
    set srcing(srcing_x: number);
    set tgting(tgting_x: number);
    set diring(diring_x: 1 | -1);
    reversing(): void;
}
declare abstract class Anfun {
    protected readonly xmax$: number;
    protected readonly ymax$: number;
    /**
     * @const @param xmax
     * @const @param ymax
     */
    constructor(xmax: number, ymax: number);
    /**
     * @const @param ratio_x
     */
    abstract getRatioOf(ratio_x: Ratio): Ratio;
}
export declare class Anlinear extends Anfun {
    constructor();
    /** @implement */
    getRatioOf(ratio_x: Ratio): Ratio;
}
export {};
//# sourceMappingURL=anprogress.d.ts.map