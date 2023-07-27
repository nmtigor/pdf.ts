/** 80**************************************************************************
 * @module global
 * @license Apache-2.0
 ******************************************************************************/
import { Hover, Pointer } from "./lib/alias.js";
import { assert } from "./lib/util/trace.js";
/*80--------------------------------------------------------------------------*/
// preprocessor names
// deno-fmt-ignore
export const INOUT = true // contracts
, DEV = true // debug build
, TRACE = true, INFO = true, COLR = true, XSTATE = true, RESIZ = true // "resize", ResizeObserver
, INTRS = true // IntersectionObserver
, THEMESETTING = false, EDITOR = true, /** @deprecated */ EDITOR_v = true // verbose
, PDFTS = true, PDFTS_v = true // verbose
, PDFTS_vv = false // very verbose
, _TRACE = DEV && TRACE, _INFO = DEV && INFO, _COLR = DEV && COLR, /** @deprecated */ APP = false // release build
, TESTING = false, DENO = false, CYPRESS = true
// from pdf.js
, PDFJSDev = true, GENERIC = true, MOZCENTRAL = false, CHROME = false, GECKOVIEW = false, LIB = false, SKIP_BABEL = true, IMAGE_DECODERS = false, COMPONENTS = false;
/*80-------------------------------------------------------------------------*/
export const global = new class {
    /** @deprecated Use preprocessor */
    testing = false;
    LASTUPDATE_NOT = "2020-07-10 22:17:59 +0200";
    LASTUPDATE_DATNI = "2020-07-24 01:59:51 +0200";
    LASTUPDATE_DEV = "2021-05-22 05:04:21 +0200";
    ghvc;
    // holdindicatr?: [HoldIndicatr, HoldIndicatr, HoldIndicatr];
    /** @deprecated */
    has_ResizeObserver = false;
    /** @deprecated */
    can_touchstart = false;
    pointer = Pointer.none;
    anyPointer = Pointer.none;
    get can_touch() {
        return global.anyPointer === Pointer.coarse;
    }
    hover = Hover.none;
    anyHover = Hover.none;
    get can_hover() {
        return global.anyHover === Hover.hover;
    }
    // /* For testing only */
    // #_touch: Pointer | undefined;
    // set _touch(b_x: boolean | undefined) {
    //   this.#_touch ??= this.anyPointer;
    //   if (b_x === undefined) {
    //     global.anyPointer = this.#_touch;
    //   } else {
    //     if (b_x) {
    //       global.anyPointer = Pointer.coarse;
    //     } else {
    //       global.anyPointer = Pointer.fine;
    //     }
    //   }
    // }
    // #_hover: Hover | undefined;
    // set _hover(b_x: boolean | undefined) {
    //   this.#_hover ??= this.anyHover;
    //   if (b_x === undefined) {
    //     global.anyHover = this.#_hover;
    //   } else {
    //     if (b_x) {
    //       global.anyHover = Hover.hover;
    //     } else {
    //       global.anyHover = Hover.none;
    //     }
    //   }
    // }
    // /* ~ */
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
}();
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=global.js.map