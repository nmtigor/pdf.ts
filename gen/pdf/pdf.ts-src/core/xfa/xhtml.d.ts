import type { AvailableSpace, XFAAttrs } from "./alias.js";
import type { Builder } from "./builder.js";
import { $buildXFAObject } from "./namespaces.js";
import { $acceptWhitespace, $clean, $content, $onText, $pushGlyphs, $text, $toHTML } from "./symbol_utils.js";
import type { TextMeasure } from "./text.js";
import { HTMLResult } from "./utils.js";
import { XmlObject } from "./xfa_object.js";
declare const $richText: unique symbol;
export declare abstract class XhtmlObject extends XmlObject {
    [$content]?: string;
    href?: string;
    [$richText]: boolean;
    style: string;
    constructor(attributes: XFAAttrs, name: string);
    [$clean](builder: Builder): void;
    [$acceptWhitespace](): boolean;
    [$onText](str: string, richText?: boolean): void;
    [$pushGlyphs](measure: TextMeasure, mustPop?: boolean): void;
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
declare class A extends XhtmlObject {
    href: string;
    constructor(attributes: XFAAttrs);
}
declare class B extends XhtmlObject {
    constructor(attributes: XFAAttrs);
    [$pushGlyphs](measure: TextMeasure): void;
}
declare class Body extends XhtmlObject {
    constructor(attributes: XFAAttrs);
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
declare class Br extends XhtmlObject {
    constructor(attributes: XFAAttrs);
    [$text](): string;
    [$pushGlyphs](measure: TextMeasure): void;
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
declare class Html extends XhtmlObject {
    constructor(attributes: XFAAttrs);
    [$toHTML](availableSpace?: AvailableSpace): HTMLResult;
}
declare class I extends XhtmlObject {
    constructor(attributes: XFAAttrs);
    [$pushGlyphs](measure: TextMeasure): void;
}
declare class Li extends XhtmlObject {
    constructor(attributes: XFAAttrs);
}
declare class Ol extends XhtmlObject {
    constructor(attributes: XFAAttrs);
}
declare class P extends XhtmlObject {
    constructor(attributes: XFAAttrs);
    [$pushGlyphs](measure: TextMeasure): void;
    [$text](): string | undefined;
}
declare class Span extends XhtmlObject {
    constructor(attributes: XFAAttrs);
}
declare class Sub extends XhtmlObject {
    constructor(attributes: XFAAttrs);
}
declare class Sup extends XhtmlObject {
    constructor(attributes: XFAAttrs);
}
declare class Ul extends XhtmlObject {
    constructor(attributes: XFAAttrs);
}
export type XFANsXhtml = typeof XhtmlNamespace;
export declare const XhtmlNamespace: {
    [$buildXFAObject](name: string, attributes: XFAAttrs): A | B | Body | Br | Html | I | Li | Ol | P | Span | Sub | Sup | Ul | undefined;
    a(attrs: XFAAttrs): A;
    b(attrs: XFAAttrs): B;
    body(attrs: XFAAttrs): Body;
    br(attrs: XFAAttrs): Br;
    html(attrs: XFAAttrs): Html;
    i(attrs: XFAAttrs): I;
    li(attrs: XFAAttrs): Li;
    ol(attrs: XFAAttrs): Ol;
    p(attrs: XFAAttrs): P;
    span(attrs: XFAAttrs): Span;
    sub(attrs: XFAAttrs): Sub;
    sup(attrs: XFAAttrs): Sup;
    ul(attrs: XFAAttrs): Ul;
};
export {};
//# sourceMappingURL=xhtml.d.ts.map