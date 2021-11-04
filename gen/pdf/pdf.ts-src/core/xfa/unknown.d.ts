import { $buildXFAObject } from "./namespaces.js";
import { XFAAttrs } from "./alias.js";
import { XmlObject } from "./xfa_object.js";
export declare class UnknownNamespace {
    namespaceId: number;
    constructor(nsId: number);
    [$buildXFAObject](name: string, attributes: XFAAttrs): XmlObject;
}
//# sourceMappingURL=unknown.d.ts.map