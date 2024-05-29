/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/xfa/signature.ts
 * @license Apache-2.0
 ******************************************************************************/
import { $buildXFAObject, NamespaceIds } from "./namespaces.js";
import { XFAObject } from "./xfa_object.js";
/*80--------------------------------------------------------------------------*/
const SIGNATURE_NS_ID = NamespaceIds.signature.id;
class Signature extends XFAObject {
    constructor(attributes) {
        super(SIGNATURE_NS_ID, "signature", /* hasChildren = */ true);
    }
}
export const SignatureNamespace = {
    [$buildXFAObject](name, attributes) {
        if (Object.hasOwn(SignatureNamespace, name)) {
            return SignatureNamespace[name](attributes);
        }
        return undefined;
    },
    signature(attrs) {
        return new Signature(attrs);
    },
};
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=signature.js.map