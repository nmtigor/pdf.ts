/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/xfa/unknown.ts
 * @license Apache-2.0
 ******************************************************************************/
import { $buildXFAObject } from "./namespaces.js";
import { XmlObject } from "./xfa_object.js";
/*80--------------------------------------------------------------------------*/
export class UnknownNamespace {
    namespaceId;
    constructor(nsId) {
        this.namespaceId = nsId;
    }
    [$buildXFAObject](name, attributes) {
        return new XmlObject(this.namespaceId, name, attributes);
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=unknown.js.map