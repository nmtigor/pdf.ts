/*81*****************************************************************************
 * global
** ------ */
import { assert } from "./lib/util/trace.js";
/*81---------------------------------------------------------------------------*/
/**
 * Singleton
 * @final
 */
class Global {
    testing = false; /** @deprecated use preprocessor */
    LASTUPDATE_NOT = "2020-07-10 22:17:59 +0200";
    LASTUPDATE_DATNI = "2020-07-24 01:59:51 +0200";
    LASTUPDATE_DEV = "2021-05-22 05:04:21 +0200";
    globalhvc;
    holdindicatr;
    has_ResizeObserver = false;
    can_touchstart = false;
    #tabsize = 2;
    #dent = 0;
    get dent() {
        let ret;
        if (this.#dent === 0)
            ret = "";
        else
            ret = new Array(this.#dent).fill(" ", 0).join("");
        return ret;
    }
    get indent() {
        const ret = this.dent;
        this.#dent += this.#tabsize;
        return ret;
    }
    get outdent() {
        this.#dent -= this.#tabsize;
        assert(this.#dent >= 0);
        return this.#dent;
    }
}
export const global = new Global;
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=global.js.map