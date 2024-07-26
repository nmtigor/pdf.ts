/** 80**************************************************************************
 * @module lib/util/general
 * @license Apache-2.0
 ******************************************************************************/

import { scrollO } from "../alias.ts";
import type { uint } from "../alias.ts";
/*80--------------------------------------------------------------------------*/

/**
 * Ref. [Get Byte size of the string in Javascript](https://dev.to/rajnishkatharotiya/get-byte-size-of-the-string-in-javascript-20jm)
 */
export const byteSize = (_x: BlobPart) => new Blob([_x]).size;

/**
 * @const @param text_x
 */
export const linesOf = (text_x: string) =>
  text_x.split(/[\n\r\u001C-\u001E\u0085\u2029]/g);
// console.log(linesOf("abc\n\n123\n"));

/** */
export const isWhitespace = (_x: string) => /^\s+$/.test(_x);
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
