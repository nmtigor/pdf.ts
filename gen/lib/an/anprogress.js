/*80****************************************************************************
 * anprogress
** ---------- */
import { INOUT } from "../../global.js";
import { Moo } from "../mv.js";
import { createPromiseCap } from "../promisecap.js";
import { assert } from "../util/trace.js";
/*80--------------------------------------------------------------------------*/
export var Anprogress_ST;
(function (Anprogress_ST) {
    Anprogress_ST[Anprogress_ST["unknown"] = 0] = "unknown";
    Anprogress_ST[Anprogress_ST["stop0"] = 1] = "stop0";
    Anprogress_ST[Anprogress_ST["stop1"] = 2] = "stop1";
    Anprogress_ST[Anprogress_ST["stop"] = 3] = "stop";
    Anprogress_ST[Anprogress_ST["strt0"] = 4] = "strt0";
    Anprogress_ST[Anprogress_ST["strt1"] = 8] = "strt1";
    Anprogress_ST[Anprogress_ST["strt"] = 12] = "strt";
})(Anprogress_ST || (Anprogress_ST = {}));
/** @final */
export class Anprogress {
    static #ID = 0;
    id = ++Anprogress.#ID;
    /** in milliseconds */
    #min;
    get min_$() {
        return this.#min;
    }
    /** in milliseconds */
    #max;
    get max_$() {
        return this.#max;
    }
    /** in milliseconds */
    #dur;
    get dur_$() {
        return this.#dur;
    }
    #anfun;
    #anvuu;
    #src;
    /**
     * float in milliseconds,
     * returned from `performance.now()` indicating the point in time when
     * `requestAnimationFrame()` starts to execute callback functions.
     */
    ts_$;
    #st_mo = new Moo(Anprogress_ST.stop0);
    get st_mo() {
        return this.#st_mo;
    }
    get st() {
        return this.#st_mo.val;
    }
    get newst() {
        return this.#st_mo.newval;
    }
    /** return value of `requestAnimationFrame()` */
    #reqanfId;
    /** in milliseconds */
    #srcing;
    /** in milliseconds */
    #tgting;
    #diring;
    #progress_pc;
    get progress_p() {
        return this.#progress_pc?.promise;
    }
    /**
     * @const @param min_x in milliseconds
     * @const @param max_x
     * @headconst @param anvuu
     * @headconst @param anfun
     */
    constructor(min_x, max_x, anvuu, anfun = new Anlinear()) {
        this.#anfun = anfun;
        this.#anvuu = anvuu;
        this.reset(min_x, max_x);
    }
    /**
     * @const @param min_x in milliseconds
     * @const @param max_x
     */
    reset(min_x, max_x) {
        this.stop();
        this.#min = min_x;
        this.#max = max_x;
        this.#dur = max_x - min_x;
        this.#src = min_x;
        this.#srcing = this.#min;
        this.#tgting = this.#max;
        this.#diring = 1;
        /*#static*/ if (INOUT) {
            assert(this.#dur > 0);
        }
        return this;
    }
    /**
     * @const @param ratio
     */
    valOf(ratio) {
        return this.#min + this.#dur * ratio;
    }
    /**
     * Set `#st_mo`
     * out( this.ts_$ !== undefined )
     * @const @param ts_x
     * @const @param dir_x
     */
    strt$(ts_x, dir_x) {
        /*#static*/ if (INOUT) {
            assert(this.#progress_pc === undefined);
        }
        this.#progress_pc = createPromiseCap();
        this.ts_$ = ts_x;
        this.#st_mo.val = dir_x > 0 ? Anprogress_ST.strt0 : Anprogress_ST.strt1;
    }
    /**
     * Set `#st_mo`
     * out( this.ts_$ === undefined )
     * @const @param dir_x
     */
    stop(dir_x) {
        // // #if _INFO
        //   console.log(`${global.indent}>>>>>>> Anprogress_${this.id}.stop( ${dir_x} ) >>>>>>>`);
        //   console.log(`${global.dent}#st_mo._len=${this.#st_mo._len}`);
        // // #endif
        if (this.#reqanfId !== undefined)
            cancelAnimationFrame(this.#reqanfId);
        this.ts_$ = undefined;
        let newst = Anprogress_ST.unknown;
        if (dir_x === undefined) {
            if (this.st === Anprogress_ST.strt0)
                newst = Anprogress_ST.stop1;
            else if (this.st === Anprogress_ST.strt1)
                newst = Anprogress_ST.stop0;
        }
        else {
            if (dir_x > 0) {
                newst = Anprogress_ST.stop1;
            }
            else
                newst = Anprogress_ST.stop0;
        }
        if (newst !== Anprogress_ST.unknown)
            this.#st_mo.val = newst;
        this.#progress_pc?.resolve();
        this.#progress_pc = undefined;
        // // #if _INFO
        //   global.outdent;
        // // #endif
    }
    #tick = (ts_x) => {
        // console.log( `Anprogress.#tick(): st=${this.st}` );
        if (this.ts_$ === undefined)
            this.strt$(ts_x, this.#diring);
        // else this.#st_mo.val = Anprogress_ST.twen;
        if (ts_x < this.ts_$) {
            this.#reqanfId = requestAnimationFrame(this.#tick);
            return;
        }
        // how long has played within `this` plus start point `inval_`
        let cur = ((ts_x - this.ts_$) * this.#diring) + this.#srcing;
        if (this.#diring > 0 && cur > this.#tgting ||
            this.#diring < 0 && this.#tgting > cur) {
            cur = this.#tgting;
        }
        const ratio = (cur - this.#min) / this.#dur;
        this.#anvuu.setByRatio(this.#anfun.getRatioOf(ratio));
        const continu = this.#diring > 0
            ? (cur < this.#tgting)
            : (this.#tgting < cur);
        if (continu)
            this.#reqanfId = requestAnimationFrame(this.#tick);
        else
            this.stop(this.#diring);
    };
    /**
     * @const @param src_x in milliseconds
     * @const @param dur_x How long to play.
     *  Can be negative, which means playing backwards
     * @const @param ts0_x Could set manually, float in milliseconds.
     */
    play(src_x, dur_x, ts0_x) {
        // // #if _INFO
        //   console.log(`${global.indent}>>>>>>> Anprogress${this.id}.play( ${src_x}, ${dur_x}, ${ts0_x} ) >>>>>>>`);
        // // #endif
        if (this.newst & Anprogress_ST.strt)
            this.stop();
        let src1, tgt1;
        if (dur_x === undefined) {
            src1 = this.#min;
            tgt1 = this.#max;
        }
        else {
            if (src_x === undefined) {
                src1 = this.#src;
            }
            else
                src1 = src_x;
            tgt1 = src1 + dur_x;
        }
        if (src1 < this.#min)
            src1 = this.#min;
        else if (src1 > this.#max)
            src1 = this.#max;
        if (tgt1 < this.#min)
            tgt1 = this.#min;
        else if (tgt1 > this.#max)
            tgt1 = this.#max;
        this.#srcing = src1;
        this.#tgting = tgt1;
        this.#diring = this.#tgting > this.#srcing ? 1 : -1;
        // console.log( {tgt} );
        this.#src = this.#tgting; // for next play
        if (ts0_x !== undefined)
            this.strt$(ts0_x, this.#diring);
        this.#reqanfId = requestAnimationFrame(this.#tick);
        // // #if _INFO
        //   global.outdent;
        // // #endif
    }
    forwplay(src_x, dur_x, ts0_x) {
        return this.play(src_x, dur_x, ts0_x);
    }
    backplay(src_x, dur_x, ts0_x) {
        return this.play(src_x === undefined ? this.#max : src_x, dur_x === undefined ? -this.#dur : -dur_x, ts0_x);
    }
    set srcing(srcing_x) {
        if (srcing_x < this.#min)
            srcing_x = this.#min;
        else if (srcing_x > this.#max)
            srcing_x = this.#max;
        this.#srcing = srcing_x;
        this.#diring = this.#tgting > this.#srcing ? 1 : -1;
    }
    set tgting(tgting_x) {
        if (tgting_x < this.#min)
            tgting_x = this.#min;
        else if (tgting_x > this.#max)
            tgting_x = this.#max;
        this.#tgting = tgting_x;
        this.#diring = this.#tgting > this.#srcing ? 1 : -1;
        this.#src = this.#tgting; //!
    }
    set diring(diring_x) {
        if (diring_x !== this.#diring) {
            const _ = this.#srcing;
            this.#srcing = this.#tgting;
            this.#tgting = _;
            this.#src = this.#tgting; //!
        }
    }
    reversing() {
        this.diring = -this.#diring;
    }
}
/*80--------------------------------------------------------------------------*/
class Anfun {
    xmax$;
    ymax$;
    /**
     * @const @param xmax
     * @const @param ymax
     */
    constructor(xmax, ymax) {
        this.xmax$ = xmax;
        this.ymax$ = ymax;
        /*#static*/ if (INOUT) {
            assert(0 < this.xmax$);
            assert(0 < this.ymax$);
        }
    }
}
export class Anlinear extends Anfun {
    constructor() {
        super(100, 100);
    }
    /** @implement */
    getRatioOf(ratio_x) {
        return ratio_x;
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=anprogress.js.map