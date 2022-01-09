/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
/* Copyright 2021 Mozilla Foundation
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
import { $acceptWhitespace, $childrenToHTML, $clean, $content, $extra, $getChildren, $getParent, $globalData, $nodeName, $onText, $pushGlyphs, $text, $toHTML, XmlObject, } from "./xfa_object.js";
import { $buildXFAObject, NamespaceIds } from "./namespaces.js";
import { fixTextIndent, fixURL, measureToString, setFontFamily } from "./html_utils.js";
import { getMeasurement, HTMLResult, stripQuotes, } from "./utils.js";
/*81---------------------------------------------------------------------------*/
const XHTML_NS_ID = NamespaceIds.xhtml.id;
const $richText = Symbol();
const VALID_STYLES = new Set([
    "color",
    "font",
    "font-family",
    "font-size",
    "font-stretch",
    "font-style",
    "font-weight",
    "margin",
    "margin-bottom",
    "margin-left",
    "margin-right",
    "margin-top",
    "letter-spacing",
    "line-height",
    "orphans",
    "page-break-after",
    "page-break-before",
    "page-break-inside",
    "tab-interval",
    "tab-stop",
    "text-align",
    "text-decoration",
    "text-indent",
    "vertical-align",
    "widows",
    "kerning-mode",
    "xfa-font-horizontal-scale",
    "xfa-font-vertical-scale",
    "xfa-spacerun",
    "xfa-tab-stops",
]);
const StyleMapping = new Map([
    ["page-break-after", "breakAfter"],
    ["page-break-before", "breakBefore"],
    ["page-break-inside", "breakInside"],
    ["kerning-mode", (value) => (value === "none" ? "none" : "normal")],
    [
        "xfa-font-horizontal-scale",
        (value) => `scaleX(${Math.max(0, Math.min(parseInt(value) / 100)).toFixed(2)})`,
    ],
    [
        "xfa-font-vertical-scale",
        (value) => `scaleY(${Math.max(0, Math.min(parseInt(value) / 100)).toFixed(2)})`,
    ],
    ["xfa-spacerun", ""],
    ["xfa-tab-stops", ""],
    [
        "font-size",
        (value, original) => {
            return measureToString(0.99 *
                (original.fontSize = getMeasurement(value)));
        },
    ],
    ["letter-spacing", (value) => measureToString(getMeasurement(value))],
    ["line-height", (value) => measureToString(getMeasurement(value))],
    ["margin", (value) => measureToString(getMeasurement(value))],
    ["margin-bottom", (value) => measureToString(getMeasurement(value))],
    ["margin-left", (value) => measureToString(getMeasurement(value))],
    ["margin-right", (value) => measureToString(getMeasurement(value))],
    ["margin-top", (value) => measureToString(getMeasurement(value))],
    ["text-indent", (value) => measureToString(getMeasurement(value))],
    ["font-family", (value) => value],
    ["vertical-align", (value) => measureToString(getMeasurement(value))],
]);
const spacesRegExp = /\s+/g;
const crlfRegExp = /[\r\n]+/g;
const crlfForRichTextRegExp = /\r\n?/g;
function mapStyle(styleStr, node, richText) {
    const style = Object.create(null);
    if (!styleStr)
        return style;
    const original = Object.create(null);
    for (const [key, value] of styleStr.split(";").map(s => s.split(":", 2))) {
        const mapping = StyleMapping.get(key);
        if (mapping === "")
            continue;
        let newValue = value;
        if (mapping) {
            if (typeof mapping === "string") {
                newValue = mapping;
            }
            else {
                newValue = mapping(value, original);
            }
        }
        if (key.endsWith("scale")) {
            if (style.transform) {
                style.transform = `${style[key]} ${newValue}`;
            }
            else {
                style.transform = newValue;
            }
        }
        else {
            style[key.replaceAll(/-([a-zA-Z])/g, (_, x) => x.toUpperCase())] =
                newValue;
        }
    }
    if (style.fontFamily) {
        setFontFamily({
            typeface: style.fontFamily,
            weight: style.fontWeight || "normal",
            posture: style.fontStyle || "normal",
            size: original.fontSize || 0,
        }, node, node[$globalData].fontFinder, style);
    }
    if (richText
        && style.verticalAlign
        && style.verticalAlign !== "0px"
        && style.fontSize) {
        // A non-zero verticalAlign means that we've a sub/super-script and
        // consequently the font size must be decreased.
        // https://www.adobe.com/content/dam/acom/en/devnet/pdf/pdfs/PDF32000_2008.pdf#G11.2097514
        // And the two following factors to position the scripts have been
        // found here:
        // https://en.wikipedia.org/wiki/Subscript_and_superscript#Desktop_publishing
        const SUB_SUPER_SCRIPT_FACTOR = 0.583;
        const VERTICAL_FACTOR = 0.333;
        const fontSize = getMeasurement(style.fontSize);
        style.fontSize = measureToString(fontSize * SUB_SUPER_SCRIPT_FACTOR);
        style.verticalAlign = measureToString(Math.sign(getMeasurement(style.verticalAlign)) *
            fontSize *
            VERTICAL_FACTOR);
    }
    fixTextIndent(style);
    return style;
}
function checkStyle(node) {
    if (!node.style) {
        return "";
    }
    // Remove any non-allowed keys.
    return node.style
        .trim()
        .split(/\s*;\s*/)
        .filter(s => !!s)
        .map(s => s.split(/\s*:\s*/, 2))
        .filter(([key, value]) => {
        if (key === "font-family") {
            node[$globalData].usedTypefaces.add(value);
        }
        return VALID_STYLES.has(key);
    })
        .map(kv => kv.join(":"))
        .join(";");
}
const NoWhites = new Set(["body", "html"]);
export class XhtmlObject extends XmlObject {
    [$content];
    href;
    [$richText] = false;
    style;
    constructor(attributes, name) {
        super(XHTML_NS_ID, name);
        this.style = attributes.style || "";
    }
    [$clean](builder) {
        super[$clean](builder);
        this.style = checkStyle(this);
    }
    [$acceptWhitespace]() { return !NoWhites.has(this[$nodeName]); }
    [$onText](str, richText = false) {
        if (!richText) {
            str = str.replace(crlfRegExp, "");
            if (!this.style.includes("xfa-spacerun:yes")) {
                str = str.replace(spacesRegExp, " ");
            }
        }
        else {
            this[$richText] = true;
        }
        if (str) {
            this[$content] += str;
        }
    }
    [$pushGlyphs](measure, mustPop = true) {
        const xfaFont = Object.create(null);
        const margin = {
            top: NaN,
            bottom: NaN,
            left: NaN,
            right: NaN,
        };
        let lineHeight;
        for (const [key, value] of this.style
            .split(";")
            .map(s => s.split(":", 2))) {
            switch (key) {
                case "font-family":
                    xfaFont.typeface = stripQuotes(value);
                    break;
                case "font-size":
                    xfaFont.size = getMeasurement(value);
                    break;
                case "font-weight":
                    xfaFont.weight = value;
                    break;
                case "font-style":
                    xfaFont.posture = value;
                    break;
                case "letter-spacing":
                    xfaFont.letterSpacing = getMeasurement(value);
                    break;
                case "margin":
                    const values = value.split(/ \t/).map(x => getMeasurement(x));
                    switch (values.length) {
                        case 1:
                            margin.top =
                                margin.bottom =
                                    margin.left =
                                        margin.right =
                                            values[0];
                            break;
                        case 2:
                            margin.top = margin.bottom = values[0];
                            margin.left = margin.right = values[1];
                            break;
                        case 3:
                            margin.top = values[0];
                            margin.bottom = values[2];
                            margin.left = margin.right = values[1];
                            break;
                        case 4:
                            margin.top = values[0];
                            margin.left = values[1];
                            margin.bottom = values[2];
                            margin.right = values[3];
                            break;
                    }
                    break;
                case "margin-top":
                    margin.top = getMeasurement(value);
                    break;
                case "margin-bottom":
                    margin.bottom = getMeasurement(value);
                    break;
                case "margin-left":
                    margin.left = getMeasurement(value);
                    break;
                case "margin-right":
                    margin.right = getMeasurement(value);
                    break;
                case "line-height":
                    lineHeight = getMeasurement(value);
                    break;
            }
        }
        measure.pushData(xfaFont, margin, lineHeight);
        if (this[$content]) {
            measure.addString(this[$content]);
        }
        else {
            for (const child of this[$getChildren]()) {
                if (child[$nodeName] === "#text") {
                    measure.addString(child[$content]);
                    continue;
                }
                child[$pushGlyphs](measure);
            }
        }
        if (mustPop) {
            measure.popFont();
        }
    }
    [$toHTML](availableSpace) {
        const children = [];
        this[$extra] = {
            children,
        };
        this[$childrenToHTML]({});
        if (children.length === 0 && !this[$content]) {
            return HTMLResult.EMPTY;
        }
        let value;
        if (this[$richText]) {
            value = this[$content]
                ? this[$content].replace(crlfForRichTextRegExp, "\n")
                : undefined;
        }
        else {
            value = this[$content] || undefined;
        }
        return HTMLResult.success({
            name: this[$nodeName],
            attributes: {
                href: this.href,
                style: mapStyle(this.style, this, this[$richText]),
            },
            children,
            value,
        });
    }
}
class A extends XhtmlObject {
    href;
    constructor(attributes) {
        super(attributes, "a");
        this.href = fixURL(attributes.href) || "";
    }
}
class B extends XhtmlObject {
    constructor(attributes) {
        super(attributes, "b");
    }
    [$pushGlyphs](measure) {
        measure.pushData({ weight: "bold" }, { top: NaN, bottom: NaN, left: NaN, right: NaN });
        super[$pushGlyphs](measure);
        measure.popFont();
    }
}
class Body extends XhtmlObject {
    constructor(attributes) {
        super(attributes, "body");
    }
    [$toHTML](availableSpace) {
        const res = super[$toHTML](availableSpace);
        const { html } = res;
        if (!html)
            return HTMLResult.EMPTY;
        html.name = "div";
        html.attributes.class = ["xfaRich"];
        return res;
    }
}
class Br extends XhtmlObject {
    constructor(attributes) {
        super(attributes, "br");
    }
    [$text]() { return "\n"; }
    [$pushGlyphs](measure) { measure.addString("\n"); }
    [$toHTML](availableSpace) {
        return HTMLResult.success({
            name: "br",
        });
    }
}
class Html extends XhtmlObject {
    constructor(attributes) {
        super(attributes, "html");
    }
    [$toHTML](availableSpace) {
        const children = [];
        this[$extra] = {
            children,
        };
        this[$childrenToHTML]({});
        if (children.length === 0) {
            return HTMLResult.success({
                name: "div",
                attributes: {
                    class: ["xfaRich"],
                    style: {},
                },
                value: this[$content] || "",
            });
        }
        if (children.length === 1) {
            const child = children[0];
            if (child.attributes && child.attributes.class.includes("xfaRich")) {
                return HTMLResult.success(child);
            }
        }
        return HTMLResult.success({
            name: "div",
            attributes: {
                class: ["xfaRich"],
                style: {},
            },
            children,
        });
    }
}
class I extends XhtmlObject {
    constructor(attributes) {
        super(attributes, "i");
    }
    [$pushGlyphs](measure) {
        measure.pushData({ posture: "italic" }, { top: NaN, bottom: NaN, left: NaN, right: NaN });
        super[$pushGlyphs](measure);
        measure.popFont();
    }
}
class Li extends XhtmlObject {
    constructor(attributes) {
        super(attributes, "li");
    }
}
class Ol extends XhtmlObject {
    constructor(attributes) {
        super(attributes, "ol");
    }
}
class P extends XhtmlObject {
    constructor(attributes) {
        super(attributes, "p");
    }
    [$pushGlyphs](measure) {
        super[$pushGlyphs](measure, /* mustPop = */ false);
        measure.addString("\n");
        measure.addPara();
        measure.popFont();
    }
    [$text]() {
        const siblings = this[$getParent]()[$getChildren]();
        if (siblings[siblings.length - 1] === this) {
            return super[$text]();
        }
        return super[$text]() + "\n";
    }
}
class Span extends XhtmlObject {
    constructor(attributes) {
        super(attributes, "span");
    }
}
class Sub extends XhtmlObject {
    constructor(attributes) {
        super(attributes, "sub");
    }
}
class Sup extends XhtmlObject {
    constructor(attributes) {
        super(attributes, "sup");
    }
}
class Ul extends XhtmlObject {
    constructor(attributes) {
        super(attributes, "ul");
    }
}
export const XhtmlNamespace = {
    [$buildXFAObject](name, attributes) {
        if (XhtmlNamespace.hasOwnProperty(name)) {
            return XhtmlNamespace[name](attributes);
        }
        return undefined;
    },
    a(attrs) { return new A(attrs); },
    b(attrs) { return new B(attrs); },
    body(attrs) { return new Body(attrs); },
    br(attrs) { return new Br(attrs); },
    html(attrs) { return new Html(attrs); },
    i(attrs) { return new I(attrs); },
    li(attrs) { return new Li(attrs); },
    ol(attrs) { return new Ol(attrs); },
    p(attrs) { return new P(attrs); },
    span(attrs) { return new Span(attrs); },
    sub(attrs) { return new Sub(attrs); },
    sup(attrs) { return new Sup(attrs); },
    ul(attrs) { return new Ul(attrs); },
};
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=xhtml.js.map