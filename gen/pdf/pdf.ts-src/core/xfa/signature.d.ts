/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/xfa/signature.ts
 * @license Apache-2.0
 ******************************************************************************/
import { type XFAAttrs } from "./alias.js";
import { $buildXFAObject } from "./namespaces.js";
import { XFAObject } from "./xfa_object.js";
declare class Signature extends XFAObject {
    constructor(attributes: XFAAttrs);
}
export type XFANsSignature = typeof SignatureNamespace;
export declare const SignatureNamespace: {
    [$buildXFAObject](name: string, attributes: XFAAttrs): Signature | undefined;
    signature(attrs: XFAAttrs): Signature;
};
export {};
//# sourceMappingURL=signature.d.ts.map