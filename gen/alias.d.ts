/** 80**************************************************************************
 * @module alias
 * @license Apache-2.0
 ******************************************************************************/
import type { UChr } from "./lib/alias.js";
export declare const fontFamilyBase: string;
export declare const fontFamilyMono: string;
export declare const ThemeSetting_z = 10;
export declare const ToolbarResizer_z = 8;
export declare const SwipteNailLifting_z = 6;
export declare const Popmenu_z = 4;
export declare const Pocused_z = 2;
export declare const ClickExtent = 2;
export declare function isClick(x: number, y: number, x_0: number, y_0: number, extent_x?: number): boolean;
/**
 * In milliseconds
 */
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
/** in millisecond */
export declare const HoldDuration = 1000;
/**
 * Ref. https://w3c.github.io/uievents-key/
 */
export declare const enum Key {
    Alt = 0,
    Control = 1,
    Shift = 2,
    Enter = 3,
    Tab = 4,
    ArrowDown = 5,
    ArrowLeft = 6,
    ArrowRight = 7,
    ArrowUp = 8,
    End = 9,
    Home = 10,
    PageDown = 11,
    PageUp = 12,
    Backspace = 13,
    Delete = 14,
    Escape = 15,
    F1 = 16,
    F2 = 17,
    F3 = 18,
    F4 = 19,
    F5 = 20,
    F6 = 21,
    F7 = 22,
    F8 = 23,
    F9 = 24,
    F10 = 25,
    F11 = 26,
    F12 = 27
}
export type Keybinding = `${Key | UChr}` | `${Key}+${Key | UChr}` | `${Key}+${Key}+${Key | UChr}`;
export declare const LOG_cssc: {
    xstate_transition: string;
    xstate_entry: string;
    intrs: string;
    resiz: string;
    selectionchange: string;
    selectionchange_1: string;
    performance: string;
    runhere: string;
};
export declare enum BeReturn {
    success = 0,
    fail_connection = 1,
    fail_unknown = 2,
    _max = 3
}
//# sourceMappingURL=alias.d.ts.map