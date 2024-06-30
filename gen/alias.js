/** 80**************************************************************************
 * @module alias
 * @license Apache-2.0
 ******************************************************************************/
/*80--------------------------------------------------------------------------*/
export const D_db = "root_1";
/*49-------------------------------------------*/
export const D_be = "premsys-be";
/*49-------------------------------------------*/
export const D_fe = "pdf.ts";
/*36------------------------------*/
export const D_fe_pdf = `${D_fe}/src/pdf`;
export const D_fp_src = `${D_fe_pdf}/pdf.ts-src`;
export const D_fp_test = `${D_fe_pdf}/pdf.ts-test`;
export const D_fp_web = `${D_fe_pdf}/pdf.ts-web`;
/*36------------------------------*/
export const D_fe_test = `${D_fe}/src/test`;
export const D_ft_pdfts = `${D_fe_test}pdf.ts`;
/*49-------------------------------------------*/
export const D_cy = `${D_fe}_ui-testing`;
/*49-------------------------------------------*/
export const D_pdfts = "pdf.ts";
/*64----------------------------------------------------------*/
/* Relative to `D_fe` */
/*====================*/
export const D_src_pdf = "src/pdf";
export const D_sp_src = `${D_src_pdf}/pdf.ts-src`;
export const D_sp_test = `${D_src_pdf}/pdf.ts-test`;
export const D_sp_web = `${D_src_pdf}/pdf.ts-web`;
/*49-------------------------------------------*/
export const D_res_pdf = "res/pdf";
export const D_rp_pdfs = `${D_res_pdf}/test/pdfs`;
export const D_rp_images = `${D_res_pdf}/test/images`;
export const D_rp_web = `${D_res_pdf}/pdf.ts-web`;
/*36------------------------------*/
export const D_rp_external = `${D_res_pdf}/pdf.ts-external`;
export const D_rpe_cmap = `${D_rp_external}/bcmaps`;
export const D_rpe_sfont = `${D_rp_external}/standard_fonts`;
/*49-------------------------------------------*/
export const D_gen_pdf = "gen/pdf";
export const D_gp_src = `${D_gen_pdf}/pdf.ts-src`;
/*49-------------------------------------------*/
export const D_tmp_pdf = "tmp/pdf";
/*80--------------------------------------------------------------------------*/
export const fontFamilyBase = [
    "system-ui",
    "Microsoft YaHei",
    "微软雅黑",
    "STHei",
    "华文黑体",
    "Helvetica Neue",
    "Helvetica",
    "Arial",
    "sans-serif",
].join(",");
export const fontFamilyMono = [
    "Source Code Pro",
    "monospace",
].join(",");
// export const fontFamily1 = `"Open Sans", "Helvetica Neue", Arial, sans-serif`;
/* Fallback system font:
https://bitsofco.de/the-new-system-font-stack/
*/
/*80--------------------------------------------------------------------------*/
/* zIndex */
/* premsys/MainWindl */
export const ThemeSetting_z = 10;
export const ToolbarResizer_z = 8;
export const Popmenu_z = 4;
export const Pocud_z = 2;
/* premsys/ExplorVCo */
export const SwipteNailLifting_z = 6;
/*80--------------------------------------------------------------------------*/
export const ClickExtent = 2;
export function isClick(x, y, x_0, y_0, extent_x = ClickExtent) {
    // console.log({ x, y, x_0, y_0 });
    return Math.abs(x_0 - x) <= extent_x &&
        Math.abs(y_0 - y) <= extent_x;
}
/** In milliseconds */
export const ClickHold_to = 1000;
/*64----------------------------------------------------------*/
/** in millisecond */
export const HoldDuration = 1000;
/*64----------------------------------------------------------*/
/** In milliseconds */
export const SpeedGran = 200;
export const SwipeValve = .08;
export var Swipe;
(function (Swipe) {
    Swipe[Swipe["dn"] = 1] = "dn";
    Swipe[Swipe["up"] = -1] = "up";
    Swipe[Swipe["no"] = 0] = "no";
})(Swipe || (Swipe = {}));
export function isSwipe(_x) {
    const speed = _x.ts_2 <= _x.ts_1
        ? 0
        : (_x.val_2 - _x.val_1) / (_x.ts_2 - _x.ts_1);
    return Math.abs(speed) <= SwipeValve
        ? Swipe.no
        : speed > 0
            ? Swipe.dn
            : Swipe.up;
}
/*80--------------------------------------------------------------------------*/
// deno-fmt-ignore
/**
 * Ref. https://w3c.github.io/uievents-key/
 */
export var Key;
(function (Key) {
    /* 3.2. Modifier Keys */
    Key[Key["Alt"] = 0] = "Alt";
    Key[Key["Control"] = 1] = "Control";
    Key[Key["Shift"] = 2] = "Shift";
    Key[Key["Meta"] = 3] = "Meta";
    /* 3.3. Whitespace Keys */
    Key[Key["Enter"] = 4] = "Enter";
    Key[Key["Tab"] = 5] = "Tab";
    /* 3.4. Navigation Keys */
    Key[Key["ArrowDown"] = 6] = "ArrowDown";
    Key[Key["ArrowLeft"] = 7] = "ArrowLeft";
    Key[Key["ArrowRight"] = 8] = "ArrowRight";
    Key[Key["ArrowUp"] = 9] = "ArrowUp";
    Key[Key["End"] = 10] = "End";
    Key[Key["Home"] = 11] = "Home";
    Key[Key["PageDown"] = 12] = "PageDown";
    Key[Key["PageUp"] = 13] = "PageUp";
    /* 3.5. Editing Keys */
    Key[Key["Backspace"] = 14] = "Backspace";
    Key[Key["Delete"] = 15] = "Delete";
    /* 3.6. UI Keys */
    Key[Key["Escape"] = 16] = "Escape";
    /* 3.9. General-Purpose Function Keys */
    Key[Key["F1"] = 17] = "F1";
    Key[Key["F2"] = 18] = "F2";
    Key[Key["F3"] = 19] = "F3";
    Key[Key["F4"] = 20] = "F4";
    Key[Key["F5"] = 21] = "F5";
    Key[Key["F6"] = 22] = "F6";
    Key[Key["F7"] = 23] = "F7";
    Key[Key["F8"] = 24] = "F8";
    Key[Key["F9"] = 25] = "F9";
    Key[Key["F10"] = 26] = "F10";
    Key[Key["F11"] = 27] = "F11";
    Key[Key["F12"] = 28] = "F12";
})(Key || (Key = {}));
/*80--------------------------------------------------------------------------*/
export const LOG_cssc = {
    onReplStateChange: "#2196f3",
    selectionchange: "#cb9b8b",
    selectionchange_1: "#ff8257",
    xstate_transition: "#2196f3",
    xstate_entry: "#1ba39a",
    xstate_exit: "#506e6c",
    intrs: "#f68e78",
    resiz: "#fdf717",
    performance: "#00ff00",
    runhere: "#ff0000",
};
/*80--------------------------------------------------------------------------*/
/* Adding, deleting, order-changing values of `BeReturn` or its sub-enum need to
change all dbs correspondingly. */
export var BeReturn;
(function (BeReturn) {
    BeReturn[BeReturn["success"] = 0] = "success";
    BeReturn[BeReturn["invalid_db"] = 1] = "invalid_db";
    BeReturn[BeReturn["fail_connection"] = 2] = "fail_connection";
    BeReturn[BeReturn["fail_unknown"] = 3] = "fail_unknown";
    BeReturn[BeReturn["_max"] = 4] = "_max";
})(BeReturn || (BeReturn = {}));
console.assert(BeReturn._max <= 4);
/*80--------------------------------------------------------------------------*/
// export const PALEGRUP = Object.freeze([
//   "editor-dev", // 0
//   "editor",     // 1
//   "premsys",    // 2
//   "datetime",   // 3
//   "gic",        // 4
// ]);
// /** @enum */
// const PG_ = Object.freeze({
//   editor_dev: 0,
//   editor: 1,
//   premsys: 2,
//   datetime: 3,
//   gic: 4,
// });
// export const PALETYPE = Object.freeze([
//   "全局", // 0
//   "尺寸控制", // 1
//   "MdextCodeEditor", // 2
//   "MdextRichEditor", // 3
//   "PlainEdtr", // 4
//   "日历", // 5
// ]);
// /** @enum */
// const PT_ = Object.freeze({
//   glob: 0,
//   size_ctrl: 1,
//   code_edtr: 2,
//   rich_edtr: 3,
//   plan_edtr: 4,
//   calr: 5,
// });
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=alias.js.map