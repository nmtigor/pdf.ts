/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
/* Copyright 2016 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* no-babel-preset */
import { getLookupTableFactory } from "./core_utils.js";
/*80--------------------------------------------------------------------------*/
// Some characters, e.g. copyrightserif, are mapped to the private use area
// and might not be displayed using standard fonts. Mapping/hacking well-known
// chars to the similar equivalents in the normal characters range.
const getSpecialPUASymbols = getLookupTableFactory((t) => {
    t[63721] = 0x00a9; // copyrightsans (0xF8E9) => copyright
    t[63193] = 0x00a9; // copyrightserif (0xF6D9) => copyright
    t[63720] = 0x00ae; // registersans (0xF8E8) => registered
    t[63194] = 0x00ae; // registerserif (0xF6DA) => registered
    t[63722] = 0x2122; // trademarksans (0xF8EA) => trademark
    t[63195] = 0x2122; // trademarkserif (0xF6DB) => trademark
    t[63729] = 0x23a7; // bracelefttp (0xF8F1)
    t[63730] = 0x23a8; // braceleftmid (0xF8F2)
    t[63731] = 0x23a9; // braceleftbt (0xF8F3)
    t[63740] = 0x23ab; // bracerighttp (0xF8FC)
    t[63741] = 0x23ac; // bracerightmid (0xF8FD)
    t[63742] = 0x23ad; // bracerightbt (0xF8FE)
    t[63726] = 0x23a1; // bracketlefttp (0xF8EE)
    t[63727] = 0x23a2; // bracketleftex (0xF8EF)
    t[63728] = 0x23a3; // bracketleftbt (0xF8F0)
    t[63737] = 0x23a4; // bracketrighttp (0xF8F9)
    t[63738] = 0x23a5; // bracketrightex (0xF8FA)
    t[63739] = 0x23a6; // bracketrightbt (0xF8FB)
    t[63723] = 0x239b; // parenlefttp (0xF8EB)
    t[63724] = 0x239c; // parenleftex (0xF8EC)
    t[63725] = 0x239d; // parenleftbt (0xF8ED)
    t[63734] = 0x239e; // parenrighttp (0xF8F6)
    t[63735] = 0x239f; // parenrightex (0xF8F7)
    t[63736] = 0x23a0; // parenrightbt (0xF8F8)
});
export function mapSpecialUnicodeValues(code) {
    if (code >= 0xfff0 && code <= 0xffff) {
        // Specials unicode block.
        return 0;
    }
    else if (code >= 0xf600 && code <= 0xf8ff) {
        return getSpecialPUASymbols()[code] || code;
    }
    else if (code === /* softhyphen = */ 0x00ad) {
        return 0x002d; // hyphen
    }
    return code;
}
export function getUnicodeForGlyph(name, glyphsUnicodeMap) {
    let unicode = glyphsUnicodeMap[name];
    if (unicode !== undefined) {
        return unicode;
    }
    if (!name) {
        return -1;
    }
    // Try to recover valid Unicode values from 'uniXXXX'/'uXXXX{XX}' glyphs.
    if (name[0] === "u") {
        const nameLen = name.length;
        let hexStr;
        if (nameLen === 7 && name[1] === "n" && name[2] === "i") {
            // 'uniXXXX'
            hexStr = name.substring(3);
        }
        else if (nameLen >= 5 && nameLen <= 7) {
            // 'uXXXX{XX}'
            hexStr = name.substring(1);
        }
        else {
            return -1;
        }
        // Check for upper-case hexadecimal characters, to avoid false positives.
        if (hexStr === hexStr.toUpperCase()) {
            unicode = parseInt(hexStr, 16);
            if (unicode >= 0) {
                return unicode;
            }
        }
    }
    return -1;
}
// See https://learn.microsoft.com/en-us/typography/opentype/spec/os2#ulunicoderange1-bits-031ulunicoderange2-bits-3263ulunicoderange3-bits-6495ulunicoderange4-bits-96127
const UnicodeRanges = [
    [0x0000, 0x007f],
    [0x0080, 0x00ff],
    [0x0100, 0x017f],
    [0x0180, 0x024f],
    [0x0250, 0x02af, 0x1d00, 0x1d7f, 0x1d80, 0x1dbf],
    [0x02b0, 0x02ff, 0xa700, 0xa71f],
    [0x0300, 0x036f, 0x1dc0, 0x1dff],
    [0x0370, 0x03ff],
    [0x2c80, 0x2cff],
    [0x0400, 0x04ff, 0x0500, 0x052f, 0x2de0, 0x2dff, 0xa640, 0xa69f],
    [0x0530, 0x058f],
    [0x0590, 0x05ff],
    [0xa500, 0xa63f],
    [0x0600, 0x06ff, 0x0750, 0x077f],
    [0x07c0, 0x07ff],
    [0x0900, 0x097f],
    [0x0980, 0x09ff],
    [0x0a00, 0x0a7f],
    [0x0a80, 0x0aff],
    [0x0b00, 0x0b7f],
    [0x0b80, 0x0bff],
    [0x0c00, 0x0c7f],
    [0x0c80, 0x0cff],
    [0x0d00, 0x0d7f],
    [0x0e00, 0x0e7f],
    [0x0e80, 0x0eff],
    [0x10a0, 0x10ff, 0x2d00, 0x2d2f],
    [0x1b00, 0x1b7f],
    [0x1100, 0x11ff],
    [0x1e00, 0x1eff, 0x2c60, 0x2c7f, 0xa720, 0xa7ff],
    [0x1f00, 0x1fff],
    [0x2000, 0x206f, 0x2e00, 0x2e7f],
    [0x2070, 0x209f],
    [0x20a0, 0x20cf],
    [0x20d0, 0x20ff],
    [0x2100, 0x214f],
    [0x2150, 0x218f],
    [0x2190, 0x21ff, 0x27f0, 0x27ff, 0x2900, 0x297f, 0x2b00, 0x2bff],
    [0x2200, 0x22ff, 0x2a00, 0x2aff, 0x27c0, 0x27ef, 0x2980, 0x29ff],
    [0x2300, 0x23ff],
    [0x2400, 0x243f],
    [0x2440, 0x245f],
    [0x2460, 0x24ff],
    [0x2500, 0x257f],
    [0x2580, 0x259f],
    [0x25a0, 0x25ff],
    [0x2600, 0x26ff],
    [0x2700, 0x27bf],
    [0x3000, 0x303f],
    [0x3040, 0x309f],
    [0x30a0, 0x30ff, 0x31f0, 0x31ff],
    [0x3100, 0x312f, 0x31a0, 0x31bf],
    [0x3130, 0x318f],
    [0xa840, 0xa87f],
    [0x3200, 0x32ff],
    [0x3300, 0x33ff],
    [0xac00, 0xd7af],
    [0xd800, 0xdfff],
    [0x10900, 0x1091f],
    [
        0x4e00,
        0x9fff,
        0x2e80,
        0x2eff,
        0x2f00,
        0x2fdf,
        0x2ff0,
        0x2fff,
        0x3400,
        0x4dbf,
        0x20000,
        0x2a6df,
        0x3190,
        0x319f,
    ],
    [0xe000, 0xf8ff],
    [0x31c0, 0x31ef, 0xf900, 0xfaff, 0x2f800, 0x2fa1f],
    [0xfb00, 0xfb4f],
    [0xfb50, 0xfdff],
    [0xfe20, 0xfe2f],
    [0xfe10, 0xfe1f],
    [0xfe50, 0xfe6f],
    [0xfe70, 0xfeff],
    [0xff00, 0xffef],
    [0xfff0, 0xffff],
    [0x0f00, 0x0fff],
    [0x0700, 0x074f],
    [0x0780, 0x07bf],
    [0x0d80, 0x0dff],
    [0x1000, 0x109f],
    [0x1200, 0x137f, 0x1380, 0x139f, 0x2d80, 0x2ddf],
    [0x13a0, 0x13ff],
    [0x1400, 0x167f],
    [0x1680, 0x169f],
    [0x16a0, 0x16ff],
    [0x1780, 0x17ff],
    [0x1800, 0x18af],
    [0x2800, 0x28ff],
    [0xa000, 0xa48f],
    [0x1700, 0x171f, 0x1720, 0x173f, 0x1740, 0x175f, 0x1760, 0x177f],
    [0x10300, 0x1032f],
    [0x10330, 0x1034f],
    [0x10400, 0x1044f],
    [0x1d000, 0x1d0ff, 0x1d100, 0x1d1ff, 0x1d200, 0x1d24f],
    [0x1d400, 0x1d7ff],
    [0xff000, 0xffffd],
    [0xfe00, 0xfe0f, 0xe0100, 0xe01ef],
    [0xe0000, 0xe007f],
    [0x1900, 0x194f],
    [0x1950, 0x197f],
    [0x1980, 0x19df],
    [0x1a00, 0x1a1f],
    [0x2c00, 0x2c5f],
    [0x2d30, 0x2d7f],
    [0x4dc0, 0x4dff],
    [0xa800, 0xa82f],
    [0x10000, 0x1007f, 0x10080, 0x100ff, 0x10100, 0x1013f],
    [0x10140, 0x1018f],
    [0x10380, 0x1039f],
    [0x103a0, 0x103df],
    [0x10450, 0x1047f],
    [0x10480, 0x104af],
    [0x10800, 0x1083f],
    [0x10a00, 0x10a5f],
    [0x1d300, 0x1d35f],
    [0x12000, 0x123ff, 0x12400, 0x1247f],
    [0x1d360, 0x1d37f],
    [0x1b80, 0x1bbf],
    [0x1c00, 0x1c4f],
    [0x1c50, 0x1c7f],
    [0xa880, 0xa8df],
    [0xa900, 0xa92f],
    [0xa930, 0xa95f],
    [0xaa00, 0xaa5f],
    [0x10190, 0x101cf],
    [0x101d0, 0x101ff],
    [0x102a0, 0x102df, 0x10280, 0x1029f, 0x10920, 0x1093f],
    [0x1f030, 0x1f09f, 0x1f000, 0x1f02f], // 122 - Domino Tiles - Mahjong Tiles
];
export function getUnicodeRangeFor(value, lastPosition = -1) {
    // TODO: create a map range => position, sort the ranges and cache it.
    // Then we can make a binary search for finding a range for a given unicode.
    if (lastPosition !== -1) {
        const range = UnicodeRanges[lastPosition];
        for (let i = 0, ii = range.length; i < ii; i += 2) {
            if (value >= range[i] && value <= range[i + 1]) {
                return lastPosition;
            }
        }
    }
    for (let i = 0, ii = UnicodeRanges.length; i < ii; i++) {
        const range = UnicodeRanges[i];
        for (let j = 0, jj = range.length; j < jj; j += 2) {
            if (value >= range[j] && value <= range[j + 1]) {
                return i;
            }
        }
    }
    return -1;
}
const CategoryCache = new Map();
const SpecialCharRegExp = new RegExp("^(\\s)|(\\p{Mn})|(\\p{Cf})$", "u");
export function getCharUnicodeCategory(char) {
    const cachedCategory = CategoryCache.get(char);
    if (cachedCategory) {
        return cachedCategory;
    }
    const groups = char.match(SpecialCharRegExp);
    const category = {
        isWhitespace: !!(groups && groups[1]),
        isZeroWidthDiacritic: !!(groups && groups[2]),
        isInvisibleFormatMark: !!(groups && groups[3]),
    };
    CategoryCache.set(char, category);
    return category;
}
export function clearUnicodeCaches() {
    CategoryCache.clear();
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=unicode.js.map