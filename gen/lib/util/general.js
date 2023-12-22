/** 80**************************************************************************
 * @module lib/util/general
 * @license Apache-2.0
 ******************************************************************************/
/*80--------------------------------------------------------------------------*/
/**
 * Ref. [Get Byte size of the string in Javascript](https://dev.to/rajnishkatharotiya/get-byte-size-of-the-string-in-javascript-20jm)
 */
export const byteSize = (_x) => new Blob([_x]).size;
/**
 * @const @param text_x
 */
export const linesOf = (text_x) => text_x.split(/[\n\r\u001C-\u001E\u0085\u2029]/g);
// console.log(linesOf("abc\n\n123\n"));
/** */
export const isWhitespace = (_x) => /^\s+$/.test(_x);
/**
 * Event handler to suppress context menu.
 *
 * Ref. [[pdf.js]/src/display/display_utils.js](https://github.com/mozilla/pdf.js/blob/master/src/display/display_utils.js)
 */
export const noContextMenu = (evt_x) => {
    evt_x.preventDefault();
};
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=general.js.map