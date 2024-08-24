/** 80**************************************************************************
 * @module lib/util/general
 * @license Apache-2.0
 ******************************************************************************/

import type { uint, uint16 } from "../alias.ts";
import { scrollO } from "../alias.ts";
/*80--------------------------------------------------------------------------*/

/**
 * Ref. [Get Byte size of the string in Javascript](https://dev.to/rajnishkatharotiya/get-byte-size-of-the-string-in-javascript-20jm)
 */
export const byteSize = (_x: BlobPart) => new Blob([_x]).size;

/* Not sure if js impls use regexp interning like string. So. */
// const lt_re_ = /[\n\r\u001C-\u001E\u0085\u2029]/g;
/**
 * [Line terminator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#line_terminators)
 */
const lt_re_ = /\r\n|\n|\r|\u2028|\u2029/g;
/**
 * @const @param text_x
 */
export const linesOf = (text_x: string) => text_x.split(lt_re_);
// console.log(linesOf("abc\n\n123\n"));

// deno-fmt-ignore
/**
 * [\s](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Character_class_escape#s)
 */
const ws_a_: uint16[] = [
  0x9, 0xB, 0xC, 0x20, 0xA0,
  0x0_1680,
  0x0_2000, 0x0_2001, 0x0_2002, 0x0_2003, 0x0_2004, 0x0_2005, 
  0x0_2006, 0x0_2007, 0x0_2008, 0x0_2009, 0x0_200A,
  0x0_202F, 0x0_205F,
  0x0_3000,
  0x0_FEFF,
];
/**
 * @const @param _x the UTF-16 code unit value returned by `String.charCodeAt()`
 */
export const isWhitespaceCode = (_x: uint16) => ws_a_.indexOf(_x) >= 0;

/* Not sure if js impls use regexp interning like string. So. */
const ws_re_ = /^\s+$/;
/** */
export const isWhitespace = (_x: string) => ws_re_.test(_x);
/*80--------------------------------------------------------------------------*/

export const stopPropagation = (evt_x: Event) => {
  evt_x.stopPropagation();
};

/**
 * Event handler to suppress context menu.
 *
 * Ref. [[pdf.js]/src/display/display_utils.js](https://github.com/mozilla/pdf.js/blob/master/src/display/display_utils.js)
 */
export const noContextMenu = (evt_x: MouseEvent) => {
  evt_x.preventDefault();
};

export const onWheel = (el_x: Element) => {
  return (evt_x: WheelEvent) => {
    scrollO.top = evt_x.deltaY >= 0 ? 50 : -50;
    scrollO.left = 0;
    el_x.scrollBy(scrollO);
  };
};
/*80--------------------------------------------------------------------------*/

const space_a_: (string | undefined)[] = [];
export const space = (n_: uint) => {
  if (space_a_[n_] === undefined) {
    space_a_[n_] = new Array(n_).fill(" ").join("");
  }
  return space_a_[n_]!;
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
export const wait = (ms = 0) => new Promise<void>((r) => setTimeout(r, ms));

export const g_abortr = new AbortController();
/*80--------------------------------------------------------------------------*/
