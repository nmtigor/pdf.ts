import { FontFinder } from "./fonts.js";
import { type XFALayoutMode } from "./html_utils.js";
import { type BorderExtra, ContentArea, Overflow, type OverflowExtra, PageArea, Para, Template } from "./template.js";
import { HTMLResult } from "./utils.js";
import { $content, $nsAttributes, XFAObject } from "./xfa_object.js";
export interface XFAAttrs {
    [key: string]: string;
}
export interface XFANsAttrs extends XFAAttrs {
    [$nsAttributes]?: {
        xfa: {
            dataNode?: "dataGroup" | "dataValue";
        };
    } & {
        [key: string]: XFAAttrs;
    };
}
export declare type XFAStyleData = Record<string, string>;
export interface AvailableSpace {
    width: number;
    height: number;
}
interface CommonAttrsData {
    class?: string[];
    dataId?: string;
    href?: string;
    id?: string;
    name?: string;
    newWindow?: boolean;
    style?: Record<string, string | undefined>;
    tabindex?: number | undefined;
    textContent?: string;
    type?: string;
    xfaOn?: string;
    xfaOff?: string;
    xmlns?: string;
}
export interface XFAHTMLAttrs extends CommonAttrsData {
    alt?: string | undefined;
    "aria-label"?: string | undefined;
    "aria-level"?: string;
    "aria-required"?: boolean;
    checked?: boolean;
    dir?: string;
    fieldId?: string;
    hidden?: boolean;
    mark?: string;
    maxLength?: number;
    multiple?: boolean;
    role?: string;
    required?: boolean;
    selected?: boolean;
    src?: URL | string;
    title?: string;
    value?: string;
    xfaName?: string;
}
export interface XFASVGAttrs extends CommonAttrsData {
    xmlns: "http://www.w3.org/2000/svg";
    viewBox?: string;
    preserveAspectRatio?: string;
    cx?: string;
    cy?: string;
    rx?: string;
    ry?: string;
    d?: string;
    vectorEffect?: string;
}
export interface XFAElObjBase {
    name: string;
    value?: string;
    children?: (XFAElData | undefined)[];
}
export interface XFAHTMLObj extends XFAElObjBase {
    attributes?: XFAHTMLAttrs;
}
export interface XFASVGObj extends XFAElObjBase {
    attributes?: XFASVGAttrs;
}
export declare type XFAElObj = XFAHTMLObj | XFASVGObj;
export declare type XFAElData = XFAElObj | string | boolean;
export declare type XFAIds = Map<string | symbol, XFAObject>;
export declare type XFAExtra = {
    afterBreakAfter?: HTMLResult;
    children?: XFAElData[];
    currentWidth?: number;
    height?: number;
    line?: XFAHTMLObj | undefined;
    numberInLine?: number;
    prevHeight?: number | undefined;
    width?: number;
    availableSpace?: AvailableSpace | undefined;
    columnWidths?: number[];
    currentColumn?: number;
    overflowNode?: Overflow | undefined;
    firstUnsplittable?: unknown;
    currentContentArea?: ContentArea | undefined;
    currentPageArea?: PageArea | undefined;
    noLayoutFailure?: boolean | undefined;
    pageNumber?: number;
    pagePosition?: string;
    oddOrEven?: string;
    blankOrNotBlank?: string;
    paraStack?: Para[];
    numberOfUse?: number;
    pageIndex?: number;
    pageSetIndex?: number;
    space?: AvailableSpace;
    index?: number;
    target?: XFAObject | undefined;
    attempt?: number;
    attributes?: XFAHTMLAttrs | XFASVGAttrs;
    generator?: Generator<HTMLResult> | undefined;
    failingNode?: XFAObject;
    _isSplittable?: boolean;
} & Partial<BorderExtra> & Partial<OverflowExtra> & Partial<XFALayoutMode>;
export interface XFAValue extends XFAObject {
    value?: {
        toString(): string;
    };
    [$content]: string | XFAObject;
}
export interface XFAGlobalData {
    usedTypefaces: Set<string>;
    template?: Template;
    fontFinder?: FontFinder;
    images?: Map<string, Uint8Array | Uint8ClampedArray>;
}
export interface XFAFontBase {
    typeface?: string;
    size?: number;
    weight?: string;
    posture?: string;
    letterSpacing?: number | undefined;
}
export interface XFAMargin {
    top: number;
    bottom: number;
    left: number;
    right: number;
}
export interface XFAPrefix {
    prefix: string;
    value: string;
}
export interface XFACleanup {
    hasNamespace: boolean;
    prefixes: XFAPrefix[] | undefined;
    nsAgnostic: boolean;
}
export {};
//# sourceMappingURL=alias.d.ts.map