/** 80**************************************************************************
 * @module alias
 * @license Apache-2.0
 ******************************************************************************/

import type { UChr } from "./lib/alias.ts";
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
/*49-------------------------------------------*/

export const D_pdfcy = `${D_pdfts}_ui-testing`;
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
export function isClick(
  x: number,
  y: number,
  x_0: number,
  y_0: number,
  extent_x = ClickExtent,
): boolean {
  // console.log({ x, y, x_0, y_0 });
  return Math.abs(x_0 - x) <= extent_x &&
    Math.abs(y_0 - y) <= extent_x;
}
/*64----------------------------------------------------------*/

/** in millisecond */
export const HoldDuration = 1_000;
/*64----------------------------------------------------------*/

/** In milliseconds */
export const SpeedGran = 200;

export const SwipeValve = .08;
export type SwipeData = {
  ts_1: number;
  val_1: number;
  ts_2: number;
  val_2: number;
};
export const enum Swipe {
  dn = 1,
  up = -1,
  no = 0,
}
export function isSwipe(_x: SwipeData): Swipe {
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
export const enum Key {
  /* 3.2. Modifier Keys */
  Alt, Control, Shift, Meta,
  /* 3.3. Whitespace Keys */
  Enter, Tab,
  /* 3.4. Navigation Keys */
  ArrowDown, ArrowLeft, ArrowRight, ArrowUp,
  End, Home,
  PageDown, PageUp,
  /* 3.5. Editing Keys */
  Backspace, Delete,
  /* 3.6. UI Keys */
  Escape,
  /* 3.9. General-Purpose Function Keys */
  F1, F2, F3, F4, F5, F6, F7, F8, F9, F10, F11, F12,
}

export type Keybinding =
  | `${Key | UChr}`
  | `${Key}+${Key | UChr}`
  | `${Key}+${Key}+${Key | UChr}`;
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
export enum BeReturn {
  success,
  invalid_db,
  fail_connection,
  fail_unknown,
  _max,
}
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
