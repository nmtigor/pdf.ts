/*80****************************************************************************
 * global
** ------ */
import { assert } from "./lib/util/trace.js";
/*80--------------------------------------------------------------------------*/
// preprocessor names
// deno-fmt-ignore
export const INOUT = true // contracts
, DEV = true // debug build
, INFO = true // info of calling trace, interim results
, RESIZ = false // "resize", ResizeObserver
, INTRS = false // IntersectionObserver
, EDITOR = true, EDITOR_v = true // verbose
, EDITOR_vv = false // very verbose
, PDFTS = true, PDFTS_v = true // verbose
, PDFTS_vv = false // very verbose
, _INFO = DEV && INFO, APP = false // release build
, DENO = false, TESTING = false, /** @deprecated */ TEST_ALL = false
// from pdf.js
, GENERIC = true, MOZCENTRAL = false, CHROME = false, PRODUCTION = false, LIB = false, SKIP_BABEL = false, IMAGE_DECODERS = false, COMPONENTS = false, _PDFDEV = !PRODUCTION || TESTING;
/*80-------------------------------------------------------------------------*/
/**
 * Singleton
 * @final
 */
class Global {
    /** @deprecated Use preprocessor. */
    testing = false;
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
        if (this.#dent === 0) {
            ret = "";
        }
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
export const global = new Global();
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=global.js.map