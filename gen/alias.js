/** 80**************************************************************************
 * @module alias
 * @license Apache-2.0
 ******************************************************************************/
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
export const Pocused_z = 2;
/*80--------------------------------------------------------------------------*/
export const ClickExtent = 2;
export function isClick(x, y, x_0, y_0, extent_x = ClickExtent) {
    // console.log({ x, y, x_0, y_0 });
    return Math.abs(x_0 - x) <= extent_x &&
        Math.abs(y_0 - y) <= extent_x;
}
/**
 * In milliseconds
 */
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
/** in millisecond */
export const HoldDuration = 1000;
/*80--------------------------------------------------------------------------*/
/**
 * Ref. https://w3c.github.io/uievents-key/
 */
export var Key;
(function (Key) {
    // 3.2. Modifier Keys
    Key[Key["Alt"] = 0] = "Alt";
    Key[Key["Control"] = 1] = "Control";
    Key[Key["Shift"] = 2] = "Shift";
    // 3.3. Whitespace Keys
    Key[Key["Enter"] = 3] = "Enter";
    Key[Key["Tab"] = 4] = "Tab";
    // 3.4. Navigation Keys
    Key[Key["ArrowDown"] = 5] = "ArrowDown";
    Key[Key["ArrowLeft"] = 6] = "ArrowLeft";
    Key[Key["ArrowRight"] = 7] = "ArrowRight";
    Key[Key["ArrowUp"] = 8] = "ArrowUp";
    Key[Key["End"] = 9] = "End";
    Key[Key["Home"] = 10] = "Home";
    Key[Key["PageDown"] = 11] = "PageDown";
    Key[Key["PageUp"] = 12] = "PageUp";
    // 3.5. Editing Keys
    Key[Key["Backspace"] = 13] = "Backspace";
    Key[Key["Delete"] = 14] = "Delete";
    // 3.6. UI Keys
    Key[Key["Escape"] = 15] = "Escape";
    // 3.9. General-Purpose Function Keys
    Key[Key["F1"] = 16] = "F1";
    Key[Key["F2"] = 17] = "F2";
    Key[Key["F3"] = 18] = "F3";
    Key[Key["F4"] = 19] = "F4";
    Key[Key["F5"] = 20] = "F5";
    Key[Key["F6"] = 21] = "F6";
    Key[Key["F7"] = 22] = "F7";
    Key[Key["F8"] = 23] = "F8";
    Key[Key["F9"] = 24] = "F9";
    Key[Key["F10"] = 25] = "F10";
    Key[Key["F11"] = 26] = "F11";
    Key[Key["F12"] = 27] = "F12";
})(Key || (Key = {}));
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
export var BeReturn;
(function (BeReturn) {
    BeReturn[BeReturn["success"] = 0] = "success";
    BeReturn[BeReturn["fail_connection"] = 1] = "fail_connection";
    BeReturn[BeReturn["fail_unknown"] = 2] = "fail_unknown";
    BeReturn[BeReturn["_max"] = 3] = "_max";
})(BeReturn || (BeReturn = {}));
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