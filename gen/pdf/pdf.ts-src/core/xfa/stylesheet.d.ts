import { type XFAAttrs } from "./alias.js";
import { $buildXFAObject } from "./namespaces.js";
import { XFAObject } from "./xfa_object.js";
declare class Stylesheet extends XFAObject {
    constructor(attributes: XFAAttrs);
}
export type XFANsStylesheet = typeof StylesheetNamespace;
export declare const StylesheetNamespace: {
    [$buildXFAObject](name: string, attributes: XFAAttrs): Stylesheet | undefined;
    stylesheet(attrs: XFAAttrs): Stylesheet;
};
export {};
//# sourceMappingURL=stylesheet.d.ts.map