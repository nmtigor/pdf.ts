import { type XFAAttrs } from "./alias.js";
import { ConnectionSet } from "./connection_set.js";
import { Datasets } from "./datasets.js";
import { $buildXFAObject } from "./namespaces.js";
import { Template } from "./template.js";
import { $onChildCheck, XFAObject, XFAObjectArray } from "./xfa_object.js";
export declare class Xdp extends XFAObject {
    uuid: string;
    timeStamp: string;
    config: unknown;
    connectionSet: ConnectionSet | undefined;
    datasets: Datasets | undefined;
    localeSet: unknown;
    stylesheet: XFAObjectArray;
    template: Template | undefined;
    constructor(attributes: XFAAttrs);
    [$onChildCheck](child: XFAObject): boolean;
}
export declare type XFANsXdp = typeof XdpNamespace;
export declare const XdpNamespace: {
    [$buildXFAObject](name: string, attributes: XFAAttrs): Xdp | undefined;
    xdp(attrs: XFAAttrs): Xdp;
};
//# sourceMappingURL=xdp.d.ts.map