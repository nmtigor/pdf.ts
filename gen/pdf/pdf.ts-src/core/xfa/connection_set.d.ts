import { type XFAAttrs } from "./alias.js";
import { $buildXFAObject } from "./namespaces.js";
import { StringObject, XFAObject, XFAObjectArray } from "./xfa_object.js";
export declare class ConnectionSet extends XFAObject {
    wsdlConnection: XFAObjectArray;
    xmlConnection: XFAObjectArray;
    xsdConnection: XFAObjectArray;
    constructor(attributes: XFAAttrs);
}
declare class EffectiveInputPolicy extends XFAObject {
    constructor(attributes: XFAAttrs);
}
declare class EffectiveOutputPolicy extends XFAObject {
    constructor(attributes: XFAAttrs);
}
declare class Operation extends StringObject {
    input: string;
    output: string;
    constructor(attributes: XFAAttrs);
}
declare class RootElement extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class SoapAction extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class SoapAddress extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class Uri extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class WsdlAddress extends StringObject {
    constructor(attributes: XFAAttrs);
}
declare class WsdlConnection extends XFAObject {
    dataDescription: string;
    effectiveInputPolicy: unknown;
    effectiveOutputPolicy: unknown;
    soapAction: unknown;
    soapAddress: unknown;
    wsdlAddress: unknown;
    constructor(attributes: XFAAttrs);
}
declare class XmlConnection extends XFAObject {
    dataDescription: string;
    uri: unknown;
    constructor(attributes: XFAAttrs);
}
declare class XsdConnection extends XFAObject {
    dataDescription: string;
    rootElement: unknown;
    uri: unknown;
    constructor(attributes: XFAAttrs);
}
export type XFANsConnectionSet = typeof ConnectionSetNamespace;
export declare const ConnectionSetNamespace: {
    [$buildXFAObject](name: string, attributes: XFAAttrs): ConnectionSet | EffectiveInputPolicy | EffectiveOutputPolicy | Operation | RootElement | SoapAction | SoapAddress | Uri | WsdlAddress | WsdlConnection | XmlConnection | XsdConnection | undefined;
    connectionSet(attrs: XFAAttrs): ConnectionSet;
    effectiveInputPolicy(attrs: XFAAttrs): EffectiveInputPolicy;
    effectiveOutputPolicy(attrs: XFAAttrs): EffectiveOutputPolicy;
    operation(attrs: XFAAttrs): Operation;
    rootElement(attrs: XFAAttrs): RootElement;
    soapAction(attrs: XFAAttrs): SoapAction;
    soapAddress(attrs: XFAAttrs): SoapAddress;
    uri(attrs: XFAAttrs): Uri;
    wsdlAddress(attrs: XFAAttrs): WsdlAddress;
    wsdlConnection(attrs: XFAAttrs): WsdlConnection;
    xmlConnection(attrs: XFAAttrs): XmlConnection;
    xsdConnection(attrs: XFAAttrs): XsdConnection;
};
export {};
//# sourceMappingURL=connection_set.d.ts.map