/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/xfa/unknown.ts
 * @license Apache-2.0
 ******************************************************************************/
import { type XFAAttrs } from "./alias.js";
import { $buildXFAObject } from "./namespaces.js";
import { XmlObject } from "./xfa_object.js";
export declare class UnknownNamespace {
    namespaceId: number;
    constructor(nsId: number);
    [$buildXFAObject](name: string, attributes: XFAAttrs): XmlObject;
}
//# sourceMappingURL=unknown.d.ts.map