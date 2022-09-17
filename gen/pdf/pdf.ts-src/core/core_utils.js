/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
/* Copyright 2019 Mozilla Foundation
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
import { _PDFDEV } from "../../../global.js";
import { assert } from "../../../lib/util/trace.js";
import { AnnotationEditorPrefix, BaseException, FontType, objectSize, StreamType, stringToPDFString, warn } from "../shared/util.js";
import { BaseStream } from "./base_stream.js";
import { Dict, isName, Ref, RefSet } from "./primitives.js";
/*80--------------------------------------------------------------------------*/
export function getLookupTableFactory(initializer) {
    let lookup;
    return () => {
        if (initializer) {
            lookup = Object.create(null);
            initializer(lookup);
            initializer = undefined;
        }
        return lookup;
    };
}
export function getArrayLookupTableFactory(initializer) {
    let lookup;
    return () => {
        if (initializer) {
            let arr = initializer();
            initializer = undefined;
            lookup = Object.create(null);
            for (let i = 0, ii = arr.length; i < ii; i += 2) {
                lookup[arr[i]] = arr[i + 1];
            }
            arr = undefined;
        }
        return lookup;
    };
}
export class MissingDataException extends BaseException {
    begin;
    end;
    constructor(begin, end) {
        super(`Missing data [${begin}, ${end})`, "MissingDataException");
        this.begin = begin;
        this.end = end;
    }
}
export class ParserEOFException extends BaseException {
    constructor(msg) {
        super(msg, "ParserEOFException");
    }
}
export class XRefEntryException extends BaseException {
    constructor(msg) {
        super(msg, "XRefEntryException");
    }
}
export class XRefParseException extends BaseException {
    constructor(msg) {
        super(msg, "XRefParseException");
    }
}
export class DocStats {
    #handler;
    #streamTypes = new Set();
    #fontTypes = new Set();
    constructor(handler) {
        this.#handler = handler;
    }
    _send() {
        const streamTypes = Object.create(null), fontTypes = Object.create(null);
        for (const type of this.#streamTypes) {
            streamTypes[type] = true;
        }
        for (const type of this.#fontTypes) {
            fontTypes[type] = true;
        }
        this.#handler.send("DocStats", { streamTypes, fontTypes });
    }
    addStreamType(type) {
        /*#static*/  {
            assert(StreamType[type] === type, 'addStreamType: Invalid "type" value.');
        }
        if (this.#streamTypes.has(type)) {
            return;
        }
        this.#streamTypes.add(type);
        this._send();
    }
    addFontType(type) {
         {
            assert(FontType[type] === type, 'addFontType: Invalid "type" value.');
        }
        if (this.#fontTypes.has(type)) {
            return;
        }
        this.#fontTypes.add(type);
        this._send();
    }
}
/**
 * Get the value of an inheritable property.
 *
 * If the PDF specification explicitly lists a property in a dictionary as
 * inheritable, then the value of the property may be present in the dictionary
 * itself or in one or more parents of the dictionary.
 *
 * If the key is not found in the tree, `undefined` is returned. Otherwise,
 * the value for the key is returned or, if `stopWhenFound` is `false`, a list
 * of values is returned.
 */
export function getInheritableProperty({ dict, key, getArray = false, stopWhenFound = true, }) {
    let values;
    const visited = new RefSet();
    while (dict instanceof Dict && !(dict.objId && visited.has(dict.objId))) {
        if (dict.objId) {
            visited.put(dict.objId);
        }
        const value = getArray
            ? dict.getArray(key)
            : dict.get(key);
        if (value !== undefined) {
            if (stopWhenFound) {
                return value;
            }
            if (!values)
                values = [];
            values.push(value);
        }
        dict = dict.get("Parent");
    }
    return values;
}
// prettier-ignore
const ROMAN_NUMBER_MAP = [
    "",
    "C",
    "CC",
    "CCC",
    "CD",
    "D",
    "DC",
    "DCC",
    "DCCC",
    "CM",
    "",
    "X",
    "XX",
    "XXX",
    "XL",
    "L",
    "LX",
    "LXX",
    "LXXX",
    "XC",
    "",
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
];
/**
 * Converts positive integers to (upper case) Roman numerals.
 * @param number The number that should be converted.
 * @param lowerCase Indicates if the result should be converted
 *   to lower case letters. The default value is `false`.
 * @return The resulting Roman number.
 */
export function toRomanNumerals(number, lowerCase = false) {
    assert(Number.isInteger(number) && number > 0, "The number should be a positive integer.", import.meta);
    const romanBuf = [];
    let pos;
    // Thousands
    while (number >= 1000) {
        number -= 1000;
        romanBuf.push("M");
    }
    // Hundreds
    pos = (number / 100) | 0;
    number %= 100;
    romanBuf.push(ROMAN_NUMBER_MAP[pos]);
    // Tens
    pos = (number / 10) | 0;
    number %= 10;
    romanBuf.push(ROMAN_NUMBER_MAP[10 + pos]);
    // Ones
    romanBuf.push(ROMAN_NUMBER_MAP[20 + number]); // eslint-disable-line unicorn/no-array-push-push
    const romanStr = romanBuf.join("");
    return lowerCase ? romanStr.toLowerCase() : romanStr;
}
// Calculate the base 2 logarithm of the number `x`. This differs from the
// native function in the sense that it returns the ceiling value and that it
// returns 0 instead of `Infinity`/`NaN` for `x` values smaller than/equal to 0.
export function log2(x) {
    if (x <= 0) {
        return 0;
    }
    return Math.ceil(Math.log2(x));
}
export function readInt8(data, offset) {
    return (data[offset] << 24) >> 24;
}
export function readUint16(data, offset) {
    return (data[offset] << 8) | data[offset + 1];
}
export function readUint32(data, offset) {
    return (((data[offset] << 24) |
        (data[offset + 1] << 16) |
        (data[offset + 2] << 8) |
        data[offset + 3]) >>>
        0);
}
/**
 * Checks if ch is one of the following characters: SPACE, TAB, CR or LF.
 */
export function isWhiteSpace(ch) {
    return ch === 0x20 || ch === 0x09 || ch === 0x0d || ch === 0x0a;
}
/**
 * AcroForm field names use an array like notation to refer to
 * repeated XFA elements e.g. foo.bar[nnn].
 * see: XFA Spec Chapter 3 - Repeated Elements
 *
 * @param path XFA path name.
 * @return Array of Objects with the name and pos of each part of the path.
 */
export function parseXFAPath(path) {
    const positionPattern = /(.+)\[(\d+)\]$/;
    return path.split(".").map((component) => {
        const m = component.match(positionPattern);
        if (m) {
            return { name: m[1], pos: parseInt(m[2], 10) };
        }
        return { name: component, pos: 0 };
    });
}
export function escapePDFName(str) {
    const buffer = [];
    let start = 0;
    for (let i = 0, ii = str.length; i < ii; i++) {
        const char = str.charCodeAt(i);
        // Whitespace or delimiters aren't regular chars, so escape them.
        if (char < 0x21 ||
            char > 0x7e ||
            char === 0x23 /* # */ ||
            char === 0x28 /* ( */ ||
            char === 0x29 /* ) */ ||
            char === 0x3c /* < */ ||
            char === 0x3e /* > */ ||
            char === 0x5b /* [ */ ||
            char === 0x5d /* ] */ ||
            char === 0x7b /* { */ ||
            char === 0x7d /* } */ ||
            char === 0x2f /* / */ ||
            char === 0x25 /* % */) {
            if (start < i) {
                buffer.push(str.substring(start, i));
            }
            buffer.push(`#${char.toString(16)}`);
            start = i + 1;
        }
    }
    if (buffer.length === 0) {
        return str;
    }
    if (start < str.length) {
        buffer.push(str.substring(start, str.length));
    }
    return buffer.join("");
}
function _collectJS(entry, xref, list, parents) {
    if (!entry) {
        return;
    }
    let parent;
    if ((entry instanceof Ref)) {
        if (parents.has(entry)) {
            // If we've already found entry then we've a cycle.
            return;
        }
        parent = entry;
        parents.put(parent);
        entry = xref.fetch(entry);
    }
    if (Array.isArray(entry)) {
        for (const element of entry) {
            _collectJS(element, xref, list, parents);
        }
    }
    else if (entry instanceof Dict) {
        if (isName(entry.get("S"), "JavaScript")) {
            const js = entry.get("JS");
            let code;
            if (js instanceof BaseStream) {
                code = js.getString();
            }
            else if (typeof js === "string") {
                code = js;
            }
            code = code && stringToPDFString(code).replace(/\u0000/g, "");
            if (code) {
                list.push(code);
            }
        }
        _collectJS(entry.getRaw("Next"), xref, list, parents);
    }
    if (parent) {
        parents.remove(parent);
    }
}
export function collectActions(xref, dict, eventType) {
    const actions = Object.create(null);
    const additionalActionsDicts = getInheritableProperty({
        dict,
        key: "AA",
        stopWhenFound: false,
    });
    if (additionalActionsDicts) {
        // additionalActionsDicts contains dicts from ancestors
        // as they're found in the tree from bottom to top.
        // So the dicts are visited in reverse order to guarantee
        // that actions from elder ancestors will be overwritten
        // by ones from younger ancestors.
        for (let i = additionalActionsDicts.length - 1; i >= 0; i--) {
            const additionalActions = additionalActionsDicts[i];
            if (!(additionalActions instanceof Dict)) {
                continue;
            }
            for (const key of additionalActions.getKeys()) {
                const action = eventType[key];
                if (!action) {
                    continue;
                }
                const actionDict = additionalActions.getRaw(key);
                const parents = new RefSet();
                const list = [];
                _collectJS(actionDict, xref, list, parents);
                if (list.length > 0) {
                    actions[action] = list;
                }
            }
        }
    }
    // Collect the Action if any (we may have one on pushbutton).
    if (dict.has("A")) {
        const actionDict = dict.get("A");
        const parents = new RefSet();
        const list = [];
        _collectJS(actionDict, xref, list, parents);
        if (list.length > 0) {
            actions.Action = list;
        }
    }
    return objectSize(actions) > 0 ? actions : undefined;
}
const XMLEntities = {
    /* < */ 0x3c: "&lt;",
    /* > */ 0x3e: "&gt;",
    /* & */ 0x26: "&amp;",
    /* " */ 0x22: "&quot;",
    /* ' */ 0x27: "&apos;",
};
export function encodeToXmlString(str) {
    const buffer = [];
    let start = 0;
    for (let i = 0, ii = str.length; i < ii; i++) {
        const char = str.codePointAt(i);
        if (0x20 <= char && char <= 0x7e) {
            // ascii
            const entity = XMLEntities[char];
            if (entity) {
                if (start < i) {
                    buffer.push(str.substring(start, i));
                }
                buffer.push(entity);
                start = i + 1;
            }
        }
        else {
            if (start < i) {
                buffer.push(str.substring(start, i));
            }
            buffer.push(`&#x${char.toString(16).toUpperCase()};`);
            if (char > 0xd7ff && (char < 0xe000 || char > 0xfffd)) {
                // char is represented by two u16
                i++;
            }
            start = i + 1;
        }
    }
    if (buffer.length === 0) {
        return str;
    }
    if (start < str.length) {
        buffer.push(str.substring(start, str.length));
    }
    return buffer.join("");
}
export function validateCSSFont(cssFontInfo) {
    // See https://developer.mozilla.org/en-US/docs/Web/CSS/font-style.
    const DEFAULT_CSS_FONT_OBLIQUE = "14";
    // See https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight.
    const DEFAULT_CSS_FONT_WEIGHT = "400";
    const CSS_FONT_WEIGHT_VALUES = new Set([
        "100",
        "200",
        "300",
        "400",
        "500",
        "600",
        "700",
        "800",
        "900",
        "1000",
        "normal",
        "bold",
        "bolder",
        "lighter",
    ]);
    const { fontFamily, fontWeight, italicAngle } = cssFontInfo;
    // See https://developer.mozilla.org/en-US/docs/Web/CSS/string.
    if (/^".*"$/.test(fontFamily)) {
        if (/[^\\]"/.test(fontFamily.slice(1, fontFamily.length - 1))) {
            warn(`XFA - FontFamily contains some unescaped ": ${fontFamily}.`, import.meta);
            return false;
        }
    }
    else if (/^'.*'$/.test(fontFamily)) {
        if (/[^\\]'/.test(fontFamily.slice(1, fontFamily.length - 1))) {
            warn(`XFA - FontFamily contains some unescaped ': ${fontFamily}.`, import.meta);
            return false;
        }
    }
    else {
        // See https://developer.mozilla.org/en-US/docs/Web/CSS/custom-ident.
        for (const ident of fontFamily.split(/[ \t]+/)) {
            if (/^(\d|(-(\d|-)))/.test(ident) || !/^[\w-\\]+$/.test(ident)) {
                warn(`XFA - FontFamily contains some invalid <custom-ident>: ${fontFamily}.`, import.meta);
                return false;
            }
        }
    }
    const weight = fontWeight ? fontWeight.toString() : "";
    cssFontInfo.fontWeight = CSS_FONT_WEIGHT_VALUES.has(weight)
        ? weight
        : DEFAULT_CSS_FONT_WEIGHT;
    const angle = parseFloat(italicAngle);
    cssFontInfo.italicAngle = isNaN(angle) || angle < -90 || angle > 90
        ? DEFAULT_CSS_FONT_OBLIQUE
        : italicAngle.toString();
    return true;
}
export function recoverJsURL(str) {
    // Attempt to recover valid URLs from `JS` entries with certain
    // white-listed formats:
    //  - window.open('http://example.com')
    //  - app.launchURL('http://example.com', true)
    //  - xfa.host.gotoURL('http://example.com')
    const URL_OPEN_METHODS = ["app.launchURL", "window.open", "xfa.host.gotoURL"];
    const regex = new RegExp("^\\s*(" +
        URL_OPEN_METHODS.join("|").split(".").join("\\.") +
        ")\\((?:'|\")([^'\"]*)(?:'|\")(?:,\\s*(\\w+)\\)|\\))", "i");
    const jsUrl = regex.exec(str);
    if (jsUrl && jsUrl[2]) {
        const url = jsUrl[2];
        let newWindow = false;
        if (jsUrl[3] === "true" && jsUrl[1] === "app.launchURL") {
            newWindow = true;
        }
        return { url, newWindow };
    }
    return null;
}
export function numberToString(value) {
    if (Number.isInteger(value)) {
        return value.toString();
    }
    const roundedValue = Math.round(value * 100);
    if (roundedValue % 100 === 0) {
        return (roundedValue / 100).toString();
    }
    if (roundedValue % 10 === 0) {
        return value.toFixed(1);
    }
    return value.toFixed(2);
}
export function getNewAnnotationsMap(annotationStorage) {
    if (!annotationStorage) {
        return undefined;
    }
    const newAnnotationsByPage = new Map();
    // The concept of page in a XFA is very different, so
    // editing is just not implemented.
    for (const [key, value] of annotationStorage) {
        if (!key.startsWith(AnnotationEditorPrefix)) {
            continue;
        }
        let annotations = newAnnotationsByPage.get(value.pageIndex);
        if (!annotations) {
            annotations = [];
            newAnnotationsByPage.set(value.pageIndex, annotations);
        }
        annotations.push(value);
    }
    return newAnnotationsByPage.size > 0 ? newAnnotationsByPage : undefined;
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=core_utils.js.map