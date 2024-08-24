/** 80**************************************************************************
 * @module global
 * @license Apache-2.0
 ******************************************************************************/
import { space } from "./lib/util/general.js";
import { Hover, Pointer } from "./lib/alias.js";
import { assert } from "./lib/util/trace.js";
/*80--------------------------------------------------------------------------*/
// deno-fmt-ignore
/* preprocessor names */
export const INOUT = true // contracts
, DEV = true // debug build
, COLR = true, INFO = true, STEP = true, TRACE = true, RESIZ = true // "resize", ResizeObserver
, INTRS = true // IntersectionObserver
, THEMESETTING = false, EDITOR = true, /** @deprecated */ EDITOR_v = true // verbose
, PDFTS = true, PDFTS_v = true // verbose
, PDFTS_vv = false // very verbose
, /** @deprecated */ APP = false // release build
, DENO = false, TESTING = false, CYPRESS = false, _COLR = DEV && COLR, _INFO = DEV && INFO, _STEP = DEV && STEP && !TESTING, _TRACE = DEV && TRACE && !TESTING, MOZCENTRAL = false
// Only in ./pdf/
, PDFJSDev = true, GENERIC = true, CHROME = false, GECKOVIEW = false, LIB = false, SKIP_BABEL = true, IMAGE_DECODERS = false, COMPONENTS = false;
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
        return this.anyPointer === Pointer.coarse;
    }
    hover = Hover.none;
    anyHover = Hover.none;
    get can_hover() {
        return this.anyHover === Hover.hover;
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
    #tabsize = 4;
    #dent = 0;
    get dent() {
        let ret;
        if (this.#dent === 0)
            ret = "";
        else
            ret = space(this.#dent);
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
export const g_onresize = () => {
    /*#static*/  {
        console.log(`%c${global.indent}>>>>>>> window.on("resize") >>>>>>>`, "color:#ffcd4a");
    }
    /*#static*/  {
        console.log(`${global.dent}w:${document.documentElement.clientWidth}, h:${document.documentElement.clientHeight}`);
        global.outdent;
    }
};
export const g_onerror = (evt_x) => {
    if (global.ghvc) {
        global.ghvc.el.style.backgroundColor = "#61bed4";
    }
    /*#static*/  {
        global.ghvc?.ci.reportError?.(evt_x.error);
    }
};
export const g_onunhandledrejection = (evt_x) => {
    if (global.ghvc) {
        global.ghvc.el.style.backgroundColor = "#b6d361";
    }
    /*#static*/  {
        global.ghvc?.ci.reportError?.(evt_x.reason);
    }
};
/*80--------------------------------------------------------------------------*/
/*
Before runtimes support it natively...

Ref. https://devblogs.microsoft.com/typescript/announcing-typescript-5-2/#using-declarations-and-explicit-resource-management
*/
Symbol.dispose ??= Symbol("Symbol.dispose");
Symbol.asyncDispose ??= Symbol("Symbol.asyncDispose");
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=global.js.map