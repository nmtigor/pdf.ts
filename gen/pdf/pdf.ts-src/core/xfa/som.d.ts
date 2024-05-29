/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/xfa/som.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { XFAObject, XmlObject } from "./xfa_object.js";
export type Parsed = {
    name: string;
    cacheName: string;
    operator: number;
    index: number;
    js: undefined;
    formCalc: undefined;
};
export declare function searchNode(root: XFAObject, container: XFAObject | undefined, expr: string, dotDotAllowed?: boolean, useCache?: boolean): XFAObject[] | undefined;
export declare function createDataNode(root: XFAObject, container: XmlObject, expr: string): XmlObject | undefined;
//# sourceMappingURL=som.d.ts.map