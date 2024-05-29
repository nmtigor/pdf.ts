/** 80**************************************************************************
 * @module lib/util/general
 * @license Apache-2.0
 ******************************************************************************/
import type { uint } from "../alias.js";
/**
 * Ref. [Get Byte size of the string in Javascript](https://dev.to/rajnishkatharotiya/get-byte-size-of-the-string-in-javascript-20jm)
 */
export declare const byteSize: (_x: BlobPart) => number;
/**
 * @const @param text_x
 */
export declare const linesOf: (text_x: string) => string[];
/** */
export declare const isWhitespace: (_x: string) => boolean;
/**
 * Event handler to suppress context menu.
 *
 * Ref. [[pdf.js]/src/display/display_utils.js](https://github.com/mozilla/pdf.js/blob/master/src/display/display_utils.js)
 */
export declare const noContextMenu: (evt_x: MouseEvent) => void;
export declare const onWheel: (el_x: Element) => (evt_x: WheelEvent) => void;
export declare const space: (n_: uint) => string;
/**
 * @param ms time in milliseconds
 *
 * Ref. [What is the JavaScript version of sleep()?](https://stackoverflow.com/a/39914235)
 */
export declare const wait: (ms?: number) => Promise<void>;
//# sourceMappingURL=general.d.ts.map