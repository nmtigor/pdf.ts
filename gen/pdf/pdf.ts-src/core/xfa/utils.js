/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { shadow } from "../../shared/util.js";
/*80--------------------------------------------------------------------------*/
const dimConverters = {
    pt: (x) => x,
    cm: (x) => (x / 2.54) * 72,
    mm: (x) => (x / (10 * 2.54)) * 72,
    in: (x) => x * 72,
    px: (x) => x,
};
const measurementPattern = /([+-]?\d+\.?\d*)(.*)/;
export function stripQuotes(str) {
    if (str.startsWith("'") || str.startsWith('"')) {
        return str.slice(1, str.length - 1);
    }
    return str;
}
export function getInteger({ data, defaultValue, validate }) {
    if (!data) {
        return defaultValue;
    }
    data = data.trim();
    const n = parseInt(data, 10);
    if (!isNaN(n) && validate(n)) {
        return n;
    }
    return defaultValue;
}
export function getFloat({ data, defaultValue, validate }) {
    if (!data) {
        return defaultValue;
    }
    data = data.trim();
    const n = parseFloat(data);
    if (!isNaN(n) && validate(n)) {
        return n;
    }
    return defaultValue;
}
export function getKeyword({ data, defaultValue, validate }) {
    if (!data) {
        return defaultValue;
    }
    data = data.trim();
    if (validate(data)) {
        return data;
    }
    return defaultValue;
}
export function getStringOption(data, options) {
    return getKeyword({
        data,
        defaultValue: options[0],
        validate: (k) => options.includes(k),
    });
}
export function getMeasurement(str, def = "0") {
    def = def || "0";
    if (!str) {
        return getMeasurement(def);
    }
    const match = str.trim().match(measurementPattern);
    if (!match) {
        return getMeasurement(def);
    }
    const [, valueStr, unit] = match;
    const value = parseFloat(valueStr);
    if (isNaN(value)) {
        return getMeasurement(def);
    }
    if (value === 0) {
        return 0;
    }
    const conv = dimConverters[unit];
    if (conv) {
        return conv(value);
    }
    return value;
}
export function getRatio(data) {
    if (!data) {
        return { num: 1, den: 1 };
    }
    const ratio = data
        .trim()
        .split(/\s*:\s*/)
        .map((x) => parseFloat(x))
        .filter((x) => !isNaN(x));
    if (ratio.length === 1) {
        ratio.push(1);
    }
    if (ratio.length === 0) {
        return { num: 1, den: 1 };
    }
    const [num, den] = ratio;
    return { num, den };
}
export function getRelevant(data) {
    if (!data) {
        return [];
    }
    return data
        .trim()
        .split(/\s+/)
        .map((e) => {
        return {
            excluded: e[0] === "-",
            viewname: e.substring(1),
        };
    });
}
export function getColor(data, def = [0, 0, 0]) {
    let [r, g, b] = def;
    if (!data) {
        return { r, g, b };
    }
    const color = data
        .trim()
        .split(/\s*,\s*/)
        .map((c) => Math.min(Math.max(0, parseInt(c.trim(), 10)), 255))
        .map((c) => (isNaN(c) ? 0 : c));
    if (color.length < 3) {
        return { r, g, b };
    }
    [r, g, b] = color;
    return { r, g, b };
}
export function getBBox(data) {
    const def = -1;
    if (!data) {
        return { x: def, y: def, width: def, height: def };
    }
    const bbox = data
        .trim()
        .split(/\s*,\s*/)
        .map((m) => getMeasurement(m, "-1"));
    if (bbox.length < 4 || bbox[2] < 0 || bbox[3] < 0) {
        return { x: def, y: def, width: def, height: def };
    }
    const [x, y, width, height] = bbox;
    return { x, y, width, height };
}
export class HTMLResult {
    static get FAILURE() {
        return shadow(this, "FAILURE", new HTMLResult(false));
    }
    static get EMPTY() {
        return shadow(this, "EMPTY", new HTMLResult(true));
    }
    success;
    html;
    bbox;
    breakNode;
    isBreak() {
        return !!this.breakNode;
    }
    constructor(success, html, bbox, breakNode) {
        this.success = success;
        this.html = html;
        this.bbox = bbox;
        this.breakNode = breakNode;
    }
    static breakNode(node) {
        return new HTMLResult(false, undefined, undefined, node);
    }
    static success(html, bbox) {
        return new HTMLResult(true, html, bbox);
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=utils.js.map