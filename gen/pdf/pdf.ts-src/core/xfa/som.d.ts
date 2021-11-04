import { XFAAttribute, XFAObject, XmlObject } from "./xfa_object.js";
export declare function searchNode(root: XFAObject, container: XFAObject | undefined, expr: string, dotDotAllowed?: boolean, useCache?: boolean): (string | XFAObject | XFAAttribute)[] | undefined;
export declare function createDataNode(root: XFAObject, container: XmlObject, expr: string): XmlObject | undefined;
//# sourceMappingURL=som.d.ts.map