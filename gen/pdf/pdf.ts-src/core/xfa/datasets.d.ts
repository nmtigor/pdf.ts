import { type XFAAttrs } from "./alias.js";
import { $buildXFAObject } from "./namespaces.js";
import { $isNsAgnostic, $onChild, XFAObject, XmlObject } from "./xfa_object.js";
declare class Data extends XmlObject {
    constructor(attributes: XFAAttrs);
    [$isNsAgnostic](): boolean;
}
export declare class Datasets extends XFAObject {
    data?: Data;
    Signature: unknown;
    constructor(attributes: XFAAttrs);
    [$onChild](child: XFAObject): boolean;
}
export declare type XFANsDatasets = typeof DatasetsNamespace;
export declare const DatasetsNamespace: {
    [$buildXFAObject](name: string, attributes: XFAAttrs): Datasets | Data | undefined;
    datasets(attrs: XFAAttrs): Datasets;
    data(attrs: XFAAttrs): Data;
};
export {};
//# sourceMappingURL=datasets.d.ts.map