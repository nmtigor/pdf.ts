/** 80**************************************************************************
 * @module alias
 * @license Apache-2.0
 ******************************************************************************/
import type { UChr } from "./lib/alias.js";
export declare const D_db = "root_1";
export declare const D_be = "premsys-be";
export declare const D_fe = "pdf.ts";
export declare const D_fe_pdf = "pdf.ts/src/pdf";
export declare const D_fp_src = "pdf.ts/src/pdf/pdf.ts-src";
export declare const D_fp_test = "pdf.ts/src/pdf/pdf.ts-test";
export declare const D_fp_web = "pdf.ts/src/pdf/pdf.ts-web";
export declare const D_fe_test = "pdf.ts/src/test";
export declare const D_ft_pdfts = "pdf.ts/src/testpdf.ts";
export declare const D_cy = "pdf.ts_ui-testing";
export declare const D_pdfts = "pdf.ts";
export declare const D_src_pdf = "src/pdf";
export declare const D_sp_src = "src/pdf/pdf.ts-src";
export declare const D_sp_test = "src/pdf/pdf.ts-test";
export declare const D_sp_web = "src/pdf/pdf.ts-web";
export declare const D_res_pdf = "res/pdf";
export declare const D_rp_pdfs = "res/pdf/test/pdfs";
export declare const D_rp_images = "res/pdf/test/images";
export declare const D_rp_web = "res/pdf/pdf.ts-web";
export declare const D_rp_external = "res/pdf/pdf.ts-external";
export declare const D_rpe_cmap = "res/pdf/pdf.ts-external/bcmaps";
export declare const D_rpe_sfont = "res/pdf/pdf.ts-external/standard_fonts";
export declare const D_gen_pdf = "gen/pdf";
export declare const D_gp_src = "gen/pdf/pdf.ts-src";
export declare const D_tmp_pdf = "tmp/pdf";
export declare const fontFamilyBase: string;
export declare const fontFamilyMono: string;
export declare const ThemeSetting_z = 10;
export declare const ToolbarResizer_z = 8;
export declare const Popmenu_z = 4;
export declare const Pocud_z = 2;
export declare const SwipteNailLifting_z = 6;
export declare const ClickExtent = 2;
export declare function isClick(x: number, y: number, x_0: number, y_0: number, extent_x?: number): boolean;
/** In milliseconds */
export declare const ClickHold_to = 1000;
/** in millisecond */
export declare const HoldDuration = 1000;
/** In milliseconds */
export declare const SpeedGran = 200;
export declare const SwipeValve = 0.08;
export type SwipeData = {
    ts_1: number;
    val_1: number;
    ts_2: number;
    val_2: number;
};
export declare const enum Swipe {
    dn = 1,
    up = -1,
    no = 0
}
export declare function isSwipe(_x: SwipeData): Swipe;
/**
 * Ref. https://w3c.github.io/uievents-key/
 */
export declare const enum Key {
    Alt = 0,
    Control = 1,
    Shift = 2,
    Meta = 3,
    Enter = 4,
    Tab = 5,
    ArrowDown = 6,
    ArrowLeft = 7,
    ArrowRight = 8,
    ArrowUp = 9,
    End = 10,
    Home = 11,
    PageDown = 12,
    PageUp = 13,
    Backspace = 14,
    Delete = 15,
    Escape = 16,
    F1 = 17,
    F2 = 18,
    F3 = 19,
    F4 = 20,
    F5 = 21,
    F6 = 22,
    F7 = 23,
    F8 = 24,
    F9 = 25,
    F10 = 26,
    F11 = 27,
    F12 = 28
}
export type Keybinding = `${Key | UChr}` | `${Key}+${Key | UChr}` | `${Key}+${Key}+${Key | UChr}`;
export declare const LOG_cssc: {
    onReplStateChange: string;
    selectionchange: string;
    selectionchange_1: string;
    xstate_transition: string;
    xstate_entry: string;
    xstate_exit: string;
    intrs: string;
    resiz: string;
    performance: string;
    runhere: string;
};
export declare enum BeReturn {
    success = 0,
    invalid_db = 1,
    fail_connection = 2,
    fail_unknown = 3,
    _max = 4
}
//# sourceMappingURL=alias.d.ts.map