import { $buildXFAObject } from "./namespaces.js";
import { type XFAAttrs } from "./alias.js";
import { XmlObject } from "./xfa_object.js";
export declare class UnknownNamespace {
    namespaceId: number;
    constructor(nsId: number);
    [$buildXFAObject](name: string, attributes: XFAAttrs): XmlObject;
}
//# sourceMappingURL=unknown.d.ts.map