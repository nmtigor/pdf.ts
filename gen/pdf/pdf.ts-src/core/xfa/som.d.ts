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