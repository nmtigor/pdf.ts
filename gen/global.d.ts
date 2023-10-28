/** 80**************************************************************************
 * @module global
 * @license Apache-2.0
 ******************************************************************************/
import { Hover, Pointer } from "./lib/alias.js";
import type { HTMLVCo } from "./lib/cv.js";
export declare const INOUT = true, DEV = true, TRACE = true, INFO = true, COLR = false, RESIZ = true, INTRS = true, THEMESETTING = false, EDITOR = true, /** @deprecated */ EDITOR_v = true, PDFTS = true, PDFTS_v = true, PDFTS_vv = false, /** @deprecated */ APP = false, DENO = true, TESTING = true, CYPRESS = true, _INFO = true, _COLR = false, _TRACE = false, MOZCENTRAL = false, PDFJSDev = true, GENERIC = true, CHROME = false, GECKOVIEW = false, LIB = false, SKIP_BABEL = true, IMAGE_DECODERS = false, COMPONENTS = false;
export declare const global: {
    /** @deprecated Use preprocessor */
    testing: boolean;
    readonly LASTUPDATE_NOT: "2020-07-10 22:17:59 +0200";
    readonly LASTUPDATE_DATNI: "2020-07-24 01:59:51 +0200";
    readonly LASTUPDATE_DEV: "2021-05-22 05:04:21 +0200";
    ghvc?: HTMLVCo;
    /** @deprecated */
    has_ResizeObserver: boolean;
    /** @deprecated */
    can_touchstart: boolean;
    pointer: Pointer;
    anyPointer: Pointer;
    readonly can_touch: boolean;
    hover: Hover;
    anyHover: Hover;
    readonly can_hover: boolean;
    readonly "__#3@#tabsize": 4;
    "__#3@#dent": number;
    readonly dent: string;
    readonly indent: string;
    readonly outdent: number;
};
//# sourceMappingURL=global.d.ts.map