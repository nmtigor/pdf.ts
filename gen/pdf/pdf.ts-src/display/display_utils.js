/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
/* Copyright 2015 Mozilla Foundation
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
import { html } from "../../../lib/dom.js";
import { BaseException, stringToBytes, Util, warn, } from "../shared/util.js";
import { BaseCanvasFactory, BaseCMapReaderFactory, BaseStandardFontDataFactory, BaseSVGFactory } from "./base_factory.js";
/*81---------------------------------------------------------------------------*/
const SVG_NS = "http://www.w3.org/2000/svg";
export class PixelsPerInch {
    static CSS = 96.0;
    static PDF = 72.0;
    static PDF_TO_CSS_UNITS = this.CSS / this.PDF;
}
export class DOMCanvasFactory extends BaseCanvasFactory {
    _document;
    constructor({ ownerDocument = globalThis.document } = {}) {
        super();
        this._document = ownerDocument;
    }
    /** @implements */
    _createCanvas(width, height) {
        const canvas = this._document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }
}
async function fetchData(url, asTypedArray = false) {
    const rn_ = async () => {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        return asTypedArray
            ? new Uint8Array(await response.arrayBuffer())
            : stringToBytes(await response.text());
    };
    if (isValidFetchUrl(url, document.baseURI))
        return await rn_();
    // The Fetch API is not supported.
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("GET", url, /* asTypedArray = */ true);
        if (asTypedArray) {
            request.responseType = "arraybuffer";
        }
        request.onreadystatechange = () => {
            if (request.readyState !== XMLHttpRequest.DONE)
                return;
            if (request.status === 200 || request.status === 0) {
                let data;
                if (asTypedArray && request.response) {
                    data = new Uint8Array(request.response);
                }
                else if (!asTypedArray && request.responseText) {
                    data = stringToBytes(request.responseText);
                }
                if (data) {
                    resolve(data);
                    return;
                }
            }
            reject(new Error(request.statusText));
        };
        request.send(null);
    });
}
export class DOMCMapReaderFactory extends BaseCMapReaderFactory {
    /** @implements */
    _fetchData(url, compressionType) {
        return fetchData(url, /* asTypedArray = */ this.isCompressed).then(data => {
            return { cMapData: data, compressionType };
        });
    }
}
export class DOMStandardFontDataFactory extends BaseStandardFontDataFactory {
    /** @implements */
    _fetchData(url) {
        return fetchData(url, /* asTypedArray = */ true);
    }
}
export class DOMSVGFactory extends BaseSVGFactory {
    /** @implements */
    _createSVG(type) {
        return document.createElementNS(SVG_NS, type);
    }
}
/**
 * PDF page viewport created based on scale, rotation and offset.
 */
export class PageViewport {
    /**
     * In PDF unit.
     */
    viewBox;
    /**
     * To CSS unit.
     */
    scale;
    rotation;
    /**
     * In CSS unit.
     */
    offsetX;
    offsetY;
    transform;
    width;
    height;
    constructor({ viewBox, scale, rotation, offsetX = 0, offsetY = 0, dontFlip = false, }) {
        this.viewBox = viewBox;
        this.scale = scale;
        this.rotation = rotation;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        // creating transform to convert pdf coordinate system to the normal
        // canvas like coordinates taking in account scale and rotation
        const centerX = (viewBox[2] + viewBox[0]) / 2;
        const centerY = (viewBox[3] + viewBox[1]) / 2;
        let rotateA, rotateB, rotateC, rotateD;
        // Normalize the rotation, by clamping it to the [0, 360) range.
        rotation %= 360;
        if (rotation < 0)
            rotation += 360;
        switch (rotation) // clockwise, with flip first
         {
            case 180:
                rotateA = -1;
                rotateB = 0;
                rotateC = 0;
                rotateD = 1;
                break;
            case 90:
                rotateA = 0;
                rotateB = 1;
                rotateC = 1;
                rotateD = 0;
                break;
            case 270:
                rotateA = 0;
                rotateB = -1;
                rotateC = -1;
                rotateD = 0;
                break;
            case 0:
                rotateA = 1;
                rotateB = 0;
                rotateC = 0;
                rotateD = -1;
                break;
            default:
                throw new Error("PageViewport: Invalid rotation, must be a multiple of 90 degrees.");
        }
        if (dontFlip) {
            rotateC = -rotateC;
            rotateD = -rotateD;
        }
        let offsetCanvasX, offsetCanvasY;
        let width, height;
        if (rotateA === 0) {
            offsetCanvasX = Math.abs(centerY - viewBox[1]) * scale + offsetX;
            offsetCanvasY = Math.abs(centerX - viewBox[0]) * scale + offsetY;
            width = Math.abs(viewBox[3] - viewBox[1]) * scale;
            height = Math.abs(viewBox[2] - viewBox[0]) * scale;
        }
        else {
            offsetCanvasX = Math.abs(centerX - viewBox[0]) * scale + offsetX;
            offsetCanvasY = Math.abs(centerY - viewBox[1]) * scale + offsetY;
            width = Math.abs(viewBox[2] - viewBox[0]) * scale;
            height = Math.abs(viewBox[3] - viewBox[1]) * scale;
        }
        // creating transform for the following operations:
        // translate(-centerX, -centerY), rotate and flip vertically,
        // scale, and translate(offsetCanvasX, offsetCanvasY)
        this.transform = [
            rotateA * scale,
            rotateB * scale,
            rotateC * scale,
            rotateD * scale,
            offsetCanvasX - rotateA * scale * centerX - rotateC * scale * centerY,
            offsetCanvasY - rotateB * scale * centerX - rotateD * scale * centerY,
        ];
        this.width = width;
        this.height = height;
    }
    /**
     * Clones viewport, with optional additional properties.
     * @return Cloned viewport.
     */
    clone({ scale = this.scale, rotation = this.rotation, offsetX = this.offsetX, offsetY = this.offsetY, dontFlip = false, } = {}) {
        return new PageViewport({
            viewBox: this.viewBox.slice(),
            scale,
            rotation,
            offsetX,
            offsetY,
            dontFlip,
        });
    }
    /**
     * Converts PDF point to the viewport coordinates. For examples, useful for
     * converting PDF location into canvas pixel coordinates.
     * @param x The x-coordinate.
     * @param y The y-coordinate.
     * @return Object containing `x` and `y` properties of the
     *   point in the viewport coordinate space.
     * @see {@link convertToPdfPoint}
     * @see {@link convertToViewportRectangle}
     */
    convertToViewportPoint(x, y) {
        return Util.applyTransform([x, y], this.transform);
    }
    /**
     * Converts PDF rectangle to the viewport coordinates.
     * @param rect The xMin, yMin, xMax and yMax coordinates.
     * @return Array containing corresponding coordinates of the
     *   rectangle in the viewport coordinate space.
     * @see {@link convertToViewportPoint}
     */
    convertToViewportRectangle(rect) {
        const topLeft = Util.applyTransform([rect[0], rect[1]], this.transform);
        const bottomRight = Util.applyTransform([rect[2], rect[3]], this.transform);
        return [topLeft[0], topLeft[1], bottomRight[0], bottomRight[1]];
    }
    /**
     * Converts viewport coordinates to the PDF location. For examples, useful
     * for converting canvas pixel location into PDF one.
     * @param x The x-coordinate.
     * @param y The y-coordinate.
     * @return Object containing `x` and `y` properties of the
     *   point in the PDF coordinate space.
     * @see {@link convertToViewportPoint}
     */
    convertToPdfPoint(x, y) {
        return Util.applyInverseTransform([x, y], this.transform);
    }
}
export class RenderingCancelledException extends BaseException {
    type;
    constructor(msg, type) {
        super(msg, "RenderingCancelledException");
        this.type = type;
    }
}
export function isDataScheme(url) {
    const ii = url.length;
    let i = 0;
    while (i < ii && url[i].trim() === "") {
        i++;
    }
    return url.substring(i, i + 5).toLowerCase() === "data:";
}
export function isPdfFile(filename) {
    return typeof filename === "string" && /\.pdf$/i.test(filename);
}
/**
 * Gets the filename from a given URL.
 */
export function getFilenameFromUrl(url) {
    const anchor = url.indexOf("#");
    const query = url.indexOf("?");
    const end = Math.min(anchor > 0 ? anchor : url.length, query > 0 ? query : url.length);
    return url.substring(url.lastIndexOf("/", end) + 1, end);
}
/**
 * Returns the filename or guessed filename from the url (see issue 3455).
 * @param url The original PDF location.
 * @param defaultFilename The value returned if the filename is
 *   unknown, or the protocol is unsupported.
 * @return Guessed PDF filename.
 */
export function getPdfFilenameFromUrl(url, defaultFilename = "document.pdf") {
    if (typeof url !== "string")
        return defaultFilename;
    if (isDataScheme(url)) {
        warn('getPdfFilenameFromUrl: ignore "data:"-URL for performance reasons.');
        return defaultFilename;
    }
    const reURI = /^(?:(?:[^:]+:)?\/\/[^/]+)?([^?#]*)(\?[^#]*)?(#.*)?$/;
    //              SCHEME        HOST        1.PATH  2.QUERY   3.REF
    // Pattern to get last matching NAME.pdf
    const reFilename = /[^/?#=]+\.pdf\b(?!.*\.pdf\b)/i;
    const splitURI = reURI.exec(url);
    let suggestedFilename = reFilename.exec(splitURI[1]) ||
        reFilename.exec(splitURI[2]) ||
        reFilename.exec(splitURI[3]);
    if (suggestedFilename) {
        suggestedFilename = suggestedFilename[0];
        if (suggestedFilename.includes("%")) {
            // URL-encoded %2Fpath%2Fto%2Ffile.pdf should be file.pdf
            try {
                suggestedFilename = reFilename.exec(decodeURIComponent(suggestedFilename))[0];
            }
            catch (ex) {
                // Possible (extremely rare) errors:
                // URIError "Malformed URI", e.g. for "%AA.pdf"
                // TypeError "null has no properties", e.g. for "%2F.pdf"
            }
        }
    }
    return suggestedFilename || defaultFilename;
}
export class StatTimer {
    started = Object.create(null);
    times = [];
    time(name) {
        if (name in this.started) {
            warn(`Timer is already running for ${name}`);
        }
        this.started[name] = Date.now();
    }
    timeEnd(name) {
        if (!(name in this.started)) {
            warn(`Timer has not been started for ${name}`);
        }
        this.times.push({
            name,
            start: this.started[name],
            end: Date.now(),
        });
        // Remove timer from started so it can be called again.
        delete this.started[name];
    }
    toString() {
        // Find the longest name for padding purposes.
        const outBuf = [];
        let longest = 0;
        for (const time of this.times) {
            const name = time.name;
            if (name.length > longest) {
                longest = name.length;
            }
        }
        for (const time of this.times) {
            const duration = time.end - time.start;
            outBuf.push(`${time.name.padEnd(longest)} ${duration}ms\n`);
        }
        return outBuf.join("");
    }
}
export function isValidFetchUrl(url, baseUrl) {
    try {
        const { protocol } = baseUrl
            ? new URL(url, baseUrl)
            : new URL(url);
        // The Fetch API only supports the http/https protocols, and not file/ftp.
        return protocol === "http:" || protocol === "https:";
    }
    catch (ex) {
        return false; // `new URL()` will throw on incorrect data.
    }
}
export function loadScript(src, removeScriptElement = false) {
    return new Promise((resolve, reject) => {
        const script = html("script");
        script.src = src;
        script.onload = (evt) => {
            if (removeScriptElement) {
                script.remove();
            }
            resolve(evt);
        };
        script.onerror = () => {
            reject(new Error(`Cannot load script at: ${script.src}`));
        };
        (document.head || document.documentElement).appendChild(script);
    });
}
// Deprecated API function -- display regardless of the `verbosity` setting.
export function deprecated(details) {
    console.log("Deprecated API usage: " + details);
}
let pdfDateStringRegex;
export class PDFDateString {
    /**
     * Convert a PDF date string to a JavaScript `Date` object.
     *
     * The PDF date string format is described in section 7.9.4 of the official
     * PDF 32000-1:2008 specification. However, in the PDF 1.7 reference (sixth
     * edition) Adobe describes the same format including a trailing apostrophe.
     * This syntax in incorrect, but Adobe Acrobat creates PDF files that contain
     * them. We ignore all apostrophes as they are not necessary for date parsing.
     *
     * Moreover, Adobe Acrobat doesn't handle changing the date to universal time
     * and doesn't use the user's time zone (effectively ignoring the HH' and mm'
     * parts of the date string).
     */
    static toDateObject(input) {
        if (!input || !(typeof input === "string"))
            return null;
        // Lazily initialize the regular expression.
        if (!pdfDateStringRegex) {
            pdfDateStringRegex = new RegExp("^D:" + // Prefix (required)
                "(\\d{4})" + // Year (required)
                "(\\d{2})?" + // Month (optional)
                "(\\d{2})?" + // Day (optional)
                "(\\d{2})?" + // Hour (optional)
                "(\\d{2})?" + // Minute (optional)
                "(\\d{2})?" + // Second (optional)
                "([Z|+|-])?" + // Universal time relation (optional)
                "(\\d{2})?" + // Offset hour (optional)
                "'?" + // Splitting apostrophe (optional)
                "(\\d{2})?" + // Offset minute (optional)
                "'?" // Trailing apostrophe (optional)
            );
        }
        // Optional fields that don't satisfy the requirements from the regular
        // expression (such as incorrect digit counts or numbers that are out of
        // range) will fall back the defaults from the specification.
        const matches = pdfDateStringRegex.exec(input);
        if (!matches) {
            return null;
        }
        // JavaScript's `Date` object expects the month to be between 0 and 11
        // instead of 1 and 12, so we have to correct for that.
        const year = parseInt(matches[1], 10);
        let month = parseInt(matches[2], 10);
        month = month >= 1 && month <= 12 ? month - 1 : 0;
        let day = parseInt(matches[3], 10);
        day = day >= 1 && day <= 31 ? day : 1;
        let hour = parseInt(matches[4], 10);
        hour = hour >= 0 && hour <= 23 ? hour : 0;
        let minute = parseInt(matches[5], 10);
        minute = minute >= 0 && minute <= 59 ? minute : 0;
        let second = parseInt(matches[6], 10);
        second = second >= 0 && second <= 59 ? second : 0;
        const universalTimeRelation = matches[7] || "Z";
        let offsetHour = parseInt(matches[8], 10);
        offsetHour = offsetHour >= 0 && offsetHour <= 23 ? offsetHour : 0;
        let offsetMinute = parseInt(matches[9], 10) || 0;
        offsetMinute = offsetMinute >= 0 && offsetMinute <= 59 ? offsetMinute : 0;
        // Universal time relation 'Z' means that the local time is equal to the
        // universal time, whereas the relations '+'/'-' indicate that the local
        // time is later respectively earlier than the universal time. Every date
        // is normalized to universal time.
        if (universalTimeRelation === "-") {
            hour += offsetHour;
            minute += offsetMinute;
        }
        else if (universalTimeRelation === "+") {
            hour -= offsetHour;
            minute -= offsetMinute;
        }
        return new Date(Date.UTC(year, month, day, hour, minute, second));
    }
}
/**
 * NOTE: This is (mostly) intended to support printing of XFA forms.
 */
export function getXfaPageViewport(xfaPage, { scale = 1, rotation = 0 }) {
    const { width, height } = xfaPage.attributes.style;
    const viewBox = [0, 0, parseInt(width), parseInt(height)];
    return new PageViewport({
        viewBox,
        scale,
        rotation,
    });
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=display_utils.js.map