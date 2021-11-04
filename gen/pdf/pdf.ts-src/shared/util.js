/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */
/* Copyright 2012 Mozilla Foundation
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
import { assert, warn as warn_0 } from "../../../lib/util/trace.js";
import { isObjectLike } from "../../../lib/jslang.js";
/*81---------------------------------------------------------------------------*/
export const IDENTITY_MATRIX = [1, 0, 0, 1, 0, 0];
export const FONT_IDENTITY_MATRIX = [0.001, 0, 0, 0.001, 0, 0];
// Permission flags from Table 22, Section 7.6.3.2 of the PDF specification.
export var PermissionFlag;
(function (PermissionFlag) {
    PermissionFlag[PermissionFlag["PRINT"] = 4] = "PRINT";
    PermissionFlag[PermissionFlag["MODIFY_CONTENTS"] = 8] = "MODIFY_CONTENTS";
    PermissionFlag[PermissionFlag["COPY"] = 16] = "COPY";
    PermissionFlag[PermissionFlag["MODIFY_ANNOTATIONS"] = 32] = "MODIFY_ANNOTATIONS";
    PermissionFlag[PermissionFlag["FILL_INTERACTIVE_FORMS"] = 256] = "FILL_INTERACTIVE_FORMS";
    PermissionFlag[PermissionFlag["COPY_FOR_ACCESSIBILITY"] = 512] = "COPY_FOR_ACCESSIBILITY";
    PermissionFlag[PermissionFlag["ASSEMBLE"] = 1024] = "ASSEMBLE";
    PermissionFlag[PermissionFlag["PRINT_HIGH_QUALITY"] = 2048] = "PRINT_HIGH_QUALITY";
})(PermissionFlag || (PermissionFlag = {}));
;
;
;
export var AnnotationActionEventType;
(function (AnnotationActionEventType) {
    AnnotationActionEventType["E"] = "Mouse Enter";
    AnnotationActionEventType["X"] = "Mouse Exit";
    AnnotationActionEventType["D"] = "Mouse Down";
    AnnotationActionEventType["U"] = "Mouse Up";
    AnnotationActionEventType["Fo"] = "Focus";
    AnnotationActionEventType["Bl"] = "Blur";
    AnnotationActionEventType["PO"] = "PageOpen";
    AnnotationActionEventType["PC"] = "PageClose";
    AnnotationActionEventType["PV"] = "PageVisible";
    AnnotationActionEventType["PI"] = "PageInvisible";
    AnnotationActionEventType["K"] = "Keystroke";
    AnnotationActionEventType["F"] = "Format";
    AnnotationActionEventType["V"] = "Validate";
    AnnotationActionEventType["C"] = "Calculate";
})(AnnotationActionEventType || (AnnotationActionEventType = {}));
export var DocumentActionEventType;
(function (DocumentActionEventType) {
    DocumentActionEventType["WC"] = "WillClose";
    DocumentActionEventType["WS"] = "WillSave";
    DocumentActionEventType["DS"] = "DidSave";
    DocumentActionEventType["WP"] = "WillPrint";
    DocumentActionEventType["DP"] = "DidPrint";
})(DocumentActionEventType || (DocumentActionEventType = {}));
export var PageActionEventType;
(function (PageActionEventType) {
    PageActionEventType["O"] = "PageOpen";
    PageActionEventType["C"] = "PageClose";
})(PageActionEventType || (PageActionEventType = {}));
;
;
;
let verbosity = 1 /* WARNINGS */;
export function setVerbosityLevel(level) { verbosity = level; }
export function getVerbosityLevel() { return verbosity; }
/**
 * A notice for devs. These are good for things that are helpful to devs, such
 * as warning that Workers were disabled, which is important to devs but not
 * end users.
 */
export function info(msg) {
    if (verbosity >= 5 /* INFOS */) {
        console.log(`Info: ${msg}`);
    }
}
/**
 * Non-fatal warnings.
 */
export function warn(msg, meta) {
    if (verbosity >= 1 /* WARNINGS */) {
        warn_0(`Warning: ${msg}`, meta);
    }
}
// function unreachable(msg) {
//   throw new Error(msg);
// }
// Checks if URLs have the same origin. For non-HTTP based URLs, returns false.
export function isSameOrigin(baseUrl, otherUrl) {
    let base;
    try {
        base = new URL(baseUrl);
        if (!base.origin || base.origin === "null") {
            return false; // non-HTTP url
        }
    }
    catch (e) {
        return false;
    }
    const other = new URL(otherUrl, base);
    return base.origin === other.origin;
}
// Checks if URLs use one of the allowed protocols, e.g. to avoid XSS.
function _isValidProtocol(url) {
    if (!url) {
        return false;
    }
    switch (url.protocol) {
        case "http:":
        case "https:":
        case "ftp:":
        case "mailto:":
        case "tel:":
            return true;
        default:
            return false;
    }
}
/**
 * Attempts to create a valid absolute URL.
 *
 * @param url An absolute, or relative, URL.
 * @param baseUrl An absolute URL.
 * @return Either a valid {URL}, or `null` otherwise.
 */
export function createValidAbsoluteUrl(url, baseUrl, options) {
    if (!url)
        return null;
    try {
        if (options && typeof url === "string") {
            // Let URLs beginning with "www." default to using the "http://" protocol.
            if (options.addDefaultProtocol && url.startsWith("www.")) {
                const dots = url.match(/\./g);
                // Avoid accidentally matching a *relative* URL pointing to a file named
                // e.g. "www.pdf" or similar.
                if (dots && dots.length >= 2) {
                    url = `http://${url}`;
                }
            }
            // According to ISO 32000-1:2008, section 12.6.4.7, URIs should be encoded
            // in 7-bit ASCII. Some bad PDFs use UTF-8 encoding; see bug 1122280.
            if (options.tryConvertEncoding) {
                try {
                    url = stringToUTF8String(url);
                }
                catch (ex) { }
            }
        }
        const absoluteUrl = baseUrl ? new URL(url + "", baseUrl) : new URL(url.toString());
        if (_isValidProtocol(absoluteUrl)) {
            return absoluteUrl;
        }
    }
    catch (ex) {
        /* `new URL()` will throw on incorrect data. */
    }
    return null;
}
export function shadow(obj, prop, value) {
    Object.defineProperty(obj, prop, {
        value,
        enumerable: true,
        configurable: true,
        writable: false,
    });
    return value;
}
export class BaseException extends Error {
    constructor(message, name) {
        super(message);
        this.name = name;
    }
}
export class PasswordException extends BaseException {
    code;
    constructor(msg, code) {
        super(msg, "PasswordException");
        this.code = code;
    }
}
export class UnknownErrorException extends BaseException {
    details;
    constructor(msg, details) {
        super(msg, "UnknownErrorException");
        this.details = details;
    }
}
export class InvalidPDFException extends BaseException {
    constructor(msg) {
        super(msg, "InvalidPDFException");
    }
}
export class MissingPDFException extends BaseException {
    constructor(msg) {
        super(msg, "MissingPDFException");
    }
}
export class UnexpectedResponseException extends BaseException {
    status;
    constructor(msg, status) {
        super(msg, "UnexpectedResponseException");
        this.status = status;
    }
}
/**
 * Error caused during parsing PDF data.
 */
export class FormatError extends BaseException {
    constructor(msg) {
        super(msg, "FormatError");
    }
}
/**
 * Error used to indicate task cancellation.
 */
export class AbortException extends BaseException {
    constructor(msg) {
        super(msg, "AbortException");
    }
}
const NullCharactersRegExp = /\x00/g;
export function removeNullCharacters(str) {
    if (typeof str !== "string") {
        warn("The argument for removeNullCharacters must be a string.");
        return str;
    }
    return str.replace(NullCharactersRegExp, "");
}
export function bytesToString(bytes) {
    assert(isObjectLike(bytes) && bytes.length !== undefined, "Invalid argument for bytesToString", import.meta);
    const length = bytes.length;
    const MAX_ARGUMENT_COUNT = 8192;
    if (length < MAX_ARGUMENT_COUNT) {
        // return String.fromCharCode.apply( null, bytes );
        return new TextDecoder().decode(bytes);
    }
    const strBuf = [];
    for (let i = 0; i < length; i += MAX_ARGUMENT_COUNT) {
        const chunkEnd = Math.min(i + MAX_ARGUMENT_COUNT, length);
        const chunk = bytes.subarray(i, chunkEnd);
        // strBuf.push( String.fromCharCode.apply( null, chunk ) );
        strBuf.push(new TextDecoder().decode(chunk));
    }
    return strBuf.join("");
}
export function stringToBytes(str) {
    const length = str.length;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; ++i) {
        bytes[i] = str.charCodeAt(i) & 0xff;
    }
    return bytes;
}
/**
 * Gets length of the array (Array, Uint8Array, or string) in bytes.
 */
export function arrayByteLength(arr) {
    return arr.length ?? arr.byteLength;
}
/**
 * Combines array items (arrays) into single Uint8Array object.
 * @param arr the array of the arrays (Array, Uint8Array, or string).
 */
export function arraysToBytes(arr) {
    const length = arr.length;
    // Shortcut: if first and only item is Uint8Array, return it.
    if (length === 1 && arr[0] instanceof Uint8Array)
        return arr[0];
    let resultLength = 0;
    for (let i = 0; i < length; i++) {
        resultLength += arrayByteLength(arr[i]);
    }
    let pos = 0;
    const data = new Uint8Array(resultLength);
    for (let i = 0; i < length; i++) {
        let item = arr[i];
        if (!(item instanceof Uint8Array)) {
            if (typeof item === "string") {
                item = stringToBytes(item);
            }
            else {
                item = new Uint8Array(item);
            }
        }
        const itemLength = item.byteLength;
        data.set(item, pos);
        pos += itemLength;
    }
    return data;
}
export function string32(value) {
    // if (
    //   typeof PDFJSDev === "undefined" ||
    //   PDFJSDev.test("!PRODUCTION || TESTING")
    // ) {
    assert(typeof value === "number" && Math.abs(value) < 2 ** 32, `string32: Unexpected input "${value}".`);
    // }
    return String.fromCharCode((value >> 24) & 0xff, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff);
}
export function objectSize(obj) {
    return Object.keys(obj).length;
}
// Ensure that the returned Object has a `null` prototype; hence why
// `Object.fromEntries(...)` is not used.
export function objectFromMap(map) {
    const obj = Object.create(null);
    for (const [key, value] of map) {
        obj[key] = value;
    }
    return obj;
}
// Checks the endianness of the platform.
function isLittleEndian() {
    const buffer8 = new Uint8Array(4);
    buffer8[0] = 1;
    const view32 = new Uint32Array(buffer8.buffer, 0, 1);
    return view32[0] === 1;
}
export const IsLittleEndianCached = {
    get value() {
        return shadow(this, "value", isLittleEndian());
    },
};
// Checks if it's possible to eval JS expressions.
function isEvalSupported() {
    try {
        new Function(""); // eslint-disable-line no-new, no-new-func
        return true;
    }
    catch (e) {
        return false;
    }
}
export const IsEvalSupportedCached = {
    get value() {
        return shadow(this, "value", isEvalSupported());
    },
};
const hexNumbers = [...Array(256).keys()].map(n => n.toString(16).padStart(2, "0"));
export class Util {
    static makeHexColor(r, g, b) {
        return `#${hexNumbers[r]}${hexNumbers[g]}${hexNumbers[b]}`;
    }
    // Concatenates two transformation matrices together and returns the result.
    static transform(m1, m2) {
        return [
            m1[0] * m2[0] + m1[2] * m2[1],
            m1[1] * m2[0] + m1[3] * m2[1],
            m1[0] * m2[2] + m1[2] * m2[3],
            m1[1] * m2[2] + m1[3] * m2[3],
            m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
            m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
        ];
    }
    // For 2d affine transforms
    static applyTransform(p, m) {
        const xt = p[0] * m[0] + p[1] * m[2] + m[4];
        const yt = p[0] * m[1] + p[1] * m[3] + m[5];
        return [xt, yt];
    }
    static applyInverseTransform(p, m) {
        const d = m[0] * m[3] - m[1] * m[2];
        const xt = (p[0] * m[3] - p[1] * m[2] + m[2] * m[5] - m[4] * m[3]) / d;
        const yt = (-p[0] * m[1] + p[1] * m[0] + m[4] * m[1] - m[5] * m[0]) / d;
        return [xt, yt];
    }
    // Applies the transform to the rectangle and finds the minimum axially
    // aligned bounding box.
    static getAxialAlignedBoundingBox(r, m) {
        const p1 = Util.applyTransform(r, m);
        const p2 = Util.applyTransform(r.slice(2, 4), m);
        const p3 = Util.applyTransform([r[0], r[3]], m);
        const p4 = Util.applyTransform([r[2], r[1]], m);
        return [
            Math.min(p1[0], p2[0], p3[0], p4[0]),
            Math.min(p1[1], p2[1], p3[1], p4[1]),
            Math.max(p1[0], p2[0], p3[0], p4[0]),
            Math.max(p1[1], p2[1], p3[1], p4[1]),
        ];
    }
    static inverseTransform(m) {
        const d = m[0] * m[3] - m[1] * m[2];
        return [
            m[3] / d,
            -m[1] / d,
            -m[2] / d,
            m[0] / d,
            (m[2] * m[5] - m[4] * m[3]) / d,
            (m[4] * m[1] - m[5] * m[0]) / d,
        ];
    }
    // Apply a generic 3d matrix M on a 3-vector v:
    //   | a b c |   | X |
    //   | d e f | x | Y |
    //   | g h i |   | Z |
    // M is assumed to be serialized as [a,b,c,d,e,f,g,h,i],
    // with v as [X,Y,Z]
    static apply3dTransform(m, v) {
        return [
            m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
            m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
            m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
        ];
    }
    // This calculation uses Singular Value Decomposition.
    // The SVD can be represented with formula A = USV. We are interested in the
    // matrix S here because it represents the scale values.
    static singularValueDecompose2dScale(m) {
        const transpose = [m[0], m[2], m[1], m[3]];
        // Multiply matrix m with its transpose.
        const a = m[0] * transpose[0] + m[1] * transpose[2];
        const b = m[0] * transpose[1] + m[1] * transpose[3];
        const c = m[2] * transpose[0] + m[3] * transpose[2];
        const d = m[2] * transpose[1] + m[3] * transpose[3];
        // Solve the second degree polynomial to get roots.
        const first = (a + d) / 2;
        const second = Math.sqrt((a + d) ** 2 - 4 * (a * d - c * b)) / 2;
        const sx = first + second || 1;
        const sy = first - second || 1;
        // Scale values are the square roots of the eigenvalues.
        return [Math.sqrt(sx), Math.sqrt(sy)];
    }
    // Normalize rectangle rect=[x1, y1, x2, y2] so that (x1,y1) < (x2,y2)
    // For coordinate systems whose origin lies in the bottom-left, this
    // means normalization to (BL,TR) ordering. For systems with origin in the
    // top-left, this means (TL,BR) ordering.
    static normalizeRect(rect) {
        const r = rect.slice(0); // clone rect
        if (rect[0] > rect[2]) {
            r[0] = rect[2];
            r[2] = rect[0];
        }
        if (rect[1] > rect[3]) {
            r[1] = rect[3];
            r[3] = rect[1];
        }
        return r;
    }
    // Returns a rectangle [x1, y1, x2, y2] corresponding to the
    // intersection of rect1 and rect2. If no intersection, returns 'false'
    // The rectangle coordinates of rect1, rect2 should be [x1, y1, x2, y2]
    static intersect(rect1, rect2) {
        function compare(a, b) { return a - b; }
        // Order points along the axes
        const orderedX = [rect1[0], rect1[2], rect2[0], rect2[2]].sort(compare);
        const orderedY = [rect1[1], rect1[3], rect2[1], rect2[3]].sort(compare);
        const result = [];
        rect1 = Util.normalizeRect(rect1);
        rect2 = Util.normalizeRect(rect2);
        // X: first and second points belong to different rectangles?
        if ((orderedX[0] === rect1[0] && orderedX[1] === rect2[0])
            || (orderedX[0] === rect2[0] && orderedX[1] === rect1[0])) {
            // Intersection must be between second and third points
            result[0] = orderedX[1];
            result[2] = orderedX[2];
        }
        else {
            return undefined;
        }
        // Y: first and second points belong to different rectangles?
        if ((orderedY[0] === rect1[1] && orderedY[1] === rect2[1])
            || (orderedY[0] === rect2[1] && orderedY[1] === rect1[1])) {
            // Intersection must be between second and third points
            result[1] = orderedY[1];
            result[3] = orderedY[2];
        }
        else {
            return undefined;
        }
        return result;
    }
    // From https://github.com/adobe-webplatform/Snap.svg/blob/b365287722a72526000ac4bfcf0ce4cac2faa015/src/path.js#L852
    static bezierBoundingBox(x0, y0, x1, y1, x2, y2, x3, y3) {
        const tvalues = [], bounds = [[], []];
        let a, b, c, t, t1, t2, b2ac, sqrtb2ac;
        for (let i = 0; i < 2; ++i) {
            if (i === 0) {
                b = 6 * x0 - 12 * x1 + 6 * x2;
                a = -3 * x0 + 9 * x1 - 9 * x2 + 3 * x3;
                c = 3 * x1 - 3 * x0;
            }
            else {
                b = 6 * y0 - 12 * y1 + 6 * y2;
                a = -3 * y0 + 9 * y1 - 9 * y2 + 3 * y3;
                c = 3 * y1 - 3 * y0;
            }
            if (Math.abs(a) < 1e-12) {
                if (Math.abs(b) < 1e-12)
                    continue;
                t = -c / b;
                if (0 < t && t < 1) {
                    tvalues.push(t);
                }
                continue;
            }
            b2ac = b * b - 4 * c * a;
            sqrtb2ac = Math.sqrt(b2ac);
            if (b2ac < 0)
                continue;
            t1 = (-b + sqrtb2ac) / (2 * a);
            if (0 < t1 && t1 < 1) {
                tvalues.push(t1);
            }
            t2 = (-b - sqrtb2ac) / (2 * a);
            if (0 < t2 && t2 < 1) {
                tvalues.push(t2);
            }
        }
        let j = tvalues.length, mt;
        const jlen = j;
        while (j--) {
            t = tvalues[j];
            mt = 1 - t;
            bounds[0][j] =
                mt * mt * mt * x0 +
                    3 * mt * mt * t * x1 +
                    3 * mt * t * t * x2 +
                    t * t * t * x3;
            bounds[1][j] =
                mt * mt * mt * y0 +
                    3 * mt * mt * t * y1 +
                    3 * mt * t * t * y2 +
                    t * t * t * y3;
        }
        bounds[0][jlen] = x0;
        bounds[1][jlen] = y0;
        bounds[0][jlen + 1] = x3;
        bounds[1][jlen + 1] = y3;
        bounds[0].length = bounds[1].length = jlen + 2;
        return [
            Math.min(...bounds[0]),
            Math.min(...bounds[1]),
            Math.max(...bounds[0]),
            Math.max(...bounds[1]),
        ];
    }
}
const PDFStringTranslateTable = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x2d8,
    0x2c7, 0x2c6, 0x2d9, 0x2dd, 0x2db, 0x2da, 0x2dc, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0x2022, 0x2020, 0x2021, 0x2026, 0x2014, 0x2013, 0x192,
    0x2044, 0x2039, 0x203a, 0x2212, 0x2030, 0x201e, 0x201c, 0x201d, 0x2018,
    0x2019, 0x201a, 0x2122, 0xfb01, 0xfb02, 0x141, 0x152, 0x160, 0x178, 0x17d,
    0x131, 0x142, 0x153, 0x161, 0x17e, 0, 0x20ac,
];
export function stringToPDFString(str) {
    const length = str.length, strBuf = [];
    if (str[0] === "\xFE" && str[1] === "\xFF") {
        // UTF16BE BOM
        for (let i = 2; i < length; i += 2) {
            strBuf.push(String.fromCharCode((str.charCodeAt(i) << 8) | str.charCodeAt(i + 1)));
        }
    }
    else if (str[0] === "\xFF" && str[1] === "\xFE") {
        // UTF16LE BOM
        for (let i = 2; i < length; i += 2) {
            strBuf.push(String.fromCharCode((str.charCodeAt(i + 1) << 8) | str.charCodeAt(i)));
        }
    }
    else {
        for (let i = 0; i < length; ++i) {
            const code = PDFStringTranslateTable[str.charCodeAt(i)];
            strBuf.push(code ? String.fromCharCode(code) : str.charAt(i));
        }
    }
    return strBuf.join("");
}
export function escapeString(str) {
    // replace "(", ")", "\n", "\r" and "\"
    // by "\(", "\)", "\\n", "\\r" and "\\"
    // in order to write it in a PDF file.
    return str.replace(/([()\\\n\r])/g, match => {
        if (match === "\n") {
            return "\\n";
        }
        else if (match === "\r") {
            return "\\r";
        }
        return `\\${match}`;
    });
}
export function isAscii(str) {
    return /^[\x00-\x7F]*$/.test(str);
}
export function stringToUTF16BEString(str) {
    const buf = ["\xFE\xFF"];
    for (let i = 0, ii = str.length; i < ii; i++) {
        const char = str.charCodeAt(i);
        buf.push(String.fromCharCode((char >> 8) & 0xff), String.fromCharCode(char & 0xff));
    }
    return buf.join("");
}
export function stringToUTF8String(str) {
    return decodeURIComponent(escape(str));
}
export function utf8StringToString(str) {
    return unescape(encodeURIComponent(str));
}
export function isBool(v) {
    return typeof v === "boolean";
}
export function isString(v) {
    return typeof v === "string";
}
export function isArrayBuffer(v) {
    return typeof v === "object" && v?.byteLength !== undefined;
}
export function isArrayEqual(arr1, arr2) {
    if (arr1.length !== arr2.length)
        return false;
    for (let i = 0, ii = arr1.length; i < ii; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }
    return true;
}
export function getModificationDate(date = new Date) {
    const buffer = [
        date.getUTCFullYear().toString(),
        (date.getUTCMonth() + 1).toString().padStart(2, "0"),
        date.getUTCDate().toString().padStart(2, "0"),
        date.getUTCHours().toString().padStart(2, "0"),
        date.getUTCMinutes().toString().padStart(2, "0"),
        date.getUTCSeconds().toString().padStart(2, "0"),
    ];
    return buffer.join("");
}
let PromiseCapability_ID = 0;
/**
 * Creates a promise capability object.
 * @alias createPromiseCapability
 */
export function createPromiseCapability() {
    const capability = Object.create(null);
    capability.id = ++PromiseCapability_ID;
    let isSettled = false;
    Object.defineProperty(capability, "settled", {
        get() {
            return isSettled;
        },
    });
    capability.promise = new Promise((resolve, reject) => {
        capability.resolve = (data) => {
            isSettled = true;
            resolve(data);
        };
        capability.reject = (reason) => {
            isSettled = true;
            reject(reason);
        };
    });
    return capability;
}
export function createObjectURL(data, contentType = "", forceDataSchema = false) {
    if (URL.createObjectURL && typeof Blob !== "undefined" && !forceDataSchema) {
        return URL.createObjectURL(new Blob([data], { type: contentType }));
    }
    // Blob/createObjectURL is not available, falling back to data schema.
    const digits = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let buffer = `data:${contentType};base64,`;
    for (let i = 0, ii = data.length; i < ii; i += 3) {
        const b1 = data[i] & 0xff;
        const b2 = data[i + 1] & 0xff;
        const b3 = data[i + 2] & 0xff;
        const d1 = b1 >> 2, d2 = ((b1 & 3) << 4) | (b2 >> 4);
        const d3 = i + 1 < ii ? ((b2 & 0xf) << 2) | (b3 >> 6) : 64;
        const d4 = i + 2 < ii ? b3 & 0x3f : 64;
        buffer += digits[d1] + digits[d2] + digits[d3] + digits[d4];
    }
    return buffer;
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=util.js.map