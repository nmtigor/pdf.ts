/** 80**************************************************************************
 * @module lib/util/general
 * @license Apache-2.0
 ******************************************************************************/
import { scrollO } from "../alias.js";
/*80--------------------------------------------------------------------------*/
/**
 * Ref. [Get Byte size of the string in Javascript](https://dev.to/rajnishkatharotiya/get-byte-size-of-the-string-in-javascript-20jm)
 */
export const byteSize = (_x) => new Blob([_x]).size;
/* Not sure if js impls use regexp interning like string. So. */
// const lt_re_ = /[\n\r\u001C-\u001E\u0085\u2029]/g;
/**
 * [Line terminator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#line_terminators)
 */
const lt_re_ = /\r\n|\n|\r|\u2028|\u2029/g;
/**
 * @const @param text_x
 */
export const linesOf = (text_x) => text_x.split(lt_re_);
// console.log(linesOf("abc\n\n123\n"));
// deno-fmt-ignore
/**
 * [\s](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Character_class_escape#s)
 */
const ws_a_ = [
    0x9, 0xB, 0xC, 0x20, 0xA0,
    5760,
    8192, 8193, 8194, 8195, 8196, 8197,
    8198, 8199, 8200, 8201, 8202,
    8239, 8287,
    12288,
    65279,
];
/**
 * @const @param _x the UTF-16 code unit value returned by `String.charCodeAt()`
 */
export const isWhitespaceCode = (_x) => ws_a_.indexOf(_x) >= 0;
/* Not sure if js impls use regexp interning like string. So. */
const ws_re_ = /^\s+$/;
/** */
export const isWhitespace = (_x) => ws_re_.test(_x);
/*80--------------------------------------------------------------------------*/
export const stopPropagation = (evt_x) => {
    evt_x.stopPropagation();
};
/**
 * Event handler to suppress context menu.
 *
 * Ref. [[pdf.js]/src/display/display_utils.js](https://github.com/mozilla/pdf.js/blob/master/src/display/display_utils.js)
 */
export const noContextMenu = (evt_x) => {
    evt_x.preventDefault();
};
export const onWheel = (el_x) => {
    return (evt_x) => {
        scrollO.top = evt_x.deltaY >= 0 ? 50 : -50;
        scrollO.left = 0;
        el_x.scrollBy(scrollO);
    };
};
/*80--------------------------------------------------------------------------*/
const space_a_ = [];
export const space = (n_) => {
    if (space_a_[n_] === undefined) {
        space_a_[n_] = new Array(n_).fill(" ").join("");
    }
    return space_a_[n_];
};
const textEncoder = new TextEncoder();
export const encodeStr = textEncoder.encode.bind(textEncoder);
const textDecoder = new TextDecoder();
export const decodeABV = textDecoder.decode.bind(textDecoder);
/*80--------------------------------------------------------------------------*/
/**
 * Ref. [What is the JavaScript version of sleep()?](https://stackoverflow.com/a/39914235)
 *
 * @param ms time in milliseconds
 */
export const wait = (ms = 0) => new Promise((r) => setTimeout(r, ms));
export const g_abortr = new AbortController();
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=general.js.map