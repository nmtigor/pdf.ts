/** 80**************************************************************************
 * @module global
 * @license Apache-2.0
 ******************************************************************************/
import { Hover, Pointer } from "./lib/alias.js";
import { HTMLVCo } from "./lib/mv.js";
export declare const INOUT = true, DEV = true, TRACE = true, XSTATE = true, RESIZ = true, INTRS = true, THEMESETTING = false, EDITOR = true, EDITOR_v = true, EDITOR_vv = false, PDFTS = true, PDFTS_v = true, PDFTS_vv = false, _TRACE = true, APP = false, TESTING = false, /** @deprecated */ TEST_ALL = false, DENO = false, CYPRESS = true, GENERIC = true, MOZCENTRAL = false, CHROME = false, GECKOVIEW = false, PRODUCTION = false, LIB = false, SKIP_BABEL = true, IMAGE_DECODERS = false, COMPONENTS = false, _PDFDEV = true;
export declare const global: {
    /** @deprecated Use preprocessor. */
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
    readonly "__#5@#tabsize": 2;
    "__#5@#dent": number;
    readonly dent: string;
    readonly indent: string;
    readonly outdent: number;
};
//# sourceMappingURL=global.d.ts.map