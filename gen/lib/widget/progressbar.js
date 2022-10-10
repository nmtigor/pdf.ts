/*80****************************************************************************
 * progressbar
** ----------- */
import { Anprogress } from "../an/anprogress.js";
import { HTMLAnvuu } from "../an/anvuu.js";
import { div } from "../dom.js";
/*80--------------------------------------------------------------------------*/
export class Progressbar extends HTMLAnvuu {
    higt;
    slider_el$ = div();
    anp;
    /**
     * @headconst @param coo_x
     * @const @param higt_x
     * @const @param bg_cssc_x
     * @const @param fg_cssc_x
     * @const @param min_x in milliseconds
     * @const @param max_x in milliseconds
     */
    constructor(coo_x, higt_x, bg_cssc_x, fg_cssc_x, min_x, max_x) {
        super(coo_x, div());
        this.higt = higt_x;
        Object.assign(this.el$.style, {
            height: `${higt_x}px`,
            backgroundColor: bg_cssc_x,
        });
        Object.assign(this.slider_el$.style, {
            width: "0%",
            height: "100%",
            backgroundColor: fg_cssc_x,
        });
        this.el$.append(this.slider_el$);
        this.anp = new Anprogress(min_x, max_x, this);
    }
    set anval(anval_x) {
        // console.log(">>>>>>> Progressbar.anval() >>>>>>>");
        this.slider_el$.style.width = `${(anval_x - this.anmin$) / (this.delta$) * 100}%`;
    }
    set fgcolr(fg_cssc_x) {
        this.slider_el$.style.backgroundColor = fg_cssc_x;
    }
}
/*80--------------------------------------------------------------------------*/
export class HoldIndicatr extends Progressbar {
    #idle = true;
    /**
     * ! Can not detect by `this.anp.st & Anprogress_ST.stop`,
     * ! b/c `anp.st` could change in the next tick, not immediately.
     */
    get idle() {
        return this.#idle;
    }
    /**
     * @headconst @param coo_x
     * @const @param cssc_x
     * @const @param zIndex_x
     */
    constructor(coo_x, fg_cssc_x, bottom_x, zIndex_x = 1000) {
        super(coo_x, 3, "transparent", fg_cssc_x, 0, 1);
        Object.assign(this.el$.style, {
            display: "none",
            width: "100%",
            position: "absolute",
            bottom: `${bottom_x}px`,
            zIndex: zIndex_x,
        });
        // this.anp.st_mo.registHandler( newval => {
        //   if( newval & Anprogress_ST.stop )
        //   {
        //     this.slider_el$.style.backgroundColor = fg_stop_cssc_x;
        //   }
        //   else if( newval & Anprogress_ST.strt )
        //   {
        //     this.slider_el$.style.backgroundColor = fg_cssc_x;
        //   }
        // });
    }
    stop() {
        this.anp.stop();
        this.el$.style.display = "none";
        this.#idle = true;
    }
    /**
     * @const @param max_x >0, in milliseconds
     */
    play(max_x) {
        this.#idle = false;
        this.el$.style.display = "unset";
        this.anp.reset(0, max_x).play();
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=progressbar.js.map