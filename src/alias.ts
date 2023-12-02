/** 80**************************************************************************
 * @module alias
 * @license Apache-2.0
 ******************************************************************************/

import type { UChr } from "./lib/alias.ts";
/*80--------------------------------------------------------------------------*/

export const fontFamilyBase = [
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

export const ThemeSetting_z = 10;
export const ToolbarResizer_z = 8;
export const SwipteNailLifting_z = 6;
export const Popmenu_z = 4;
export const Pocud_z = 2;
/*80--------------------------------------------------------------------------*/

export const ClickExtent = 2;
export function isClick(
  x: number,
  y: number,
  x_0: number,
  y_0: number,
  extent_x = ClickExtent,
) {
  // console.log({ x, y, x_0, y_0 });
  return Math.abs(x_0 - x) <= extent_x &&
    Math.abs(y_0 - y) <= extent_x;
}

export const ClickHoldTo = 1_000;

/**
 * In milliseconds
 */
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

/** in millisecond */
export const HoldDuration = 1000;
/*80--------------------------------------------------------------------------*/

/**
 * Ref. https://w3c.github.io/uievents-key/
 */
export const enum Key {
  // 3.2. Modifier Keys
  Alt,
  Control,
  Shift,
  Meta,
  // 3.3. Whitespace Keys
  Enter,
  Tab,
  // 3.4. Navigation Keys
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  End,
  Home,
  PageDown,
  PageUp,
  // 3.5. Editing Keys
  Backspace,
  Delete,
  // 3.6. UI Keys
  Escape,
  // 3.9. General-Purpose Function Keys
  F1,
  F2,
  F3,
  F4,
  F5,
  F6,
  F7,
  F8,
  F9,
  F10,
  F11,
  F12,
}

export type Keybinding =
  | `${Key | UChr}`
  | `${Key}+${Key | UChr}`
  | `${Key}+${Key}+${Key | UChr}`;
/*80--------------------------------------------------------------------------*/

export const LOG_cssc = {
  xstate_transition: "#2196f3",
  xstate_entry: "#1ba39a",
  intrs: "#f68e78",
  resiz: "#edb767",

  selectionchange: "#cb9b8b",
  selectionchange_1: "#ff8257",

  performance: "#00ff00",

  runhere: "#ff0000",
};
/*80--------------------------------------------------------------------------*/

export enum BeReturn {
  success,
  fail_connection,
  fail_unknown,
  _max,
}
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
