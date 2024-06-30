/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/xfa/utils.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { rect_t } from "../../../../lib/alias.js";
import type { XFAElData } from "./alias.js";
import { BreakAfter, BreakBefore, Template } from "./template.js";
export declare function stripQuotes(str: string): string;
interface _GetIntegerP {
    data?: string;
    defaultValue: number | string;
    validate: (x: number) => boolean;
}
export declare function getInteger({ data, defaultValue, validate }: _GetIntegerP): number;
interface _GetFloatP {
    data?: string;
    defaultValue: number;
    validate: (x: number) => boolean;
}
export declare function getFloat({ data, defaultValue, validate }: _GetFloatP): number;
interface _GetKeywordP {
    data?: string | undefined;
    defaultValue: string;
    validate: (k: string) => boolean;
}
export declare function getKeyword({ data, defaultValue, validate }: _GetKeywordP): string;
export declare function getStringOption(data: string | undefined, options: string[]): string;
export declare function getMeasurement(str: string | undefined, def?: string): number;
export declare function getRatio(data?: string): {
    num: number;
    den: number;
};
export declare function getRelevant(data?: string): {
    excluded: boolean;
    viewname: string;
}[];
export interface XFAColor {
    r: number;
    g: number;
    b: number;
}
export declare function getColor(data?: string, def?: number[]): {
    r: number;
    g: number;
    b: number;
};
export interface XFABBox {
    x: number;
    y: number;
    width: number;
    height: number;
}
export declare function getBBox(data?: string): XFABBox;
export declare class HTMLResult {
    static get FAILURE(): HTMLResult;
    static get EMPTY(): HTMLResult;
    success: boolean;
    html: XFAElData | undefined;
    bbox: [number, number, number, number] | undefined;
    breakNode: Template | BreakAfter | BreakBefore | undefined;
    isBreak(): boolean;
    constructor(success: boolean, html?: XFAElData, bbox?: rect_t, breakNode?: BreakAfter | BreakBefore | Template);
    static breakNode(node: BreakAfter | BreakBefore): HTMLResult;
    static success(html: XFAElData, bbox?: rect_t): HTMLResult;
}
export {};
//# sourceMappingURL=utils.d.ts.map