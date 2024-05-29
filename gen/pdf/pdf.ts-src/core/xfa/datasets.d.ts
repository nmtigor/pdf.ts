/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/xfa/datasets.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { XFAAttrs } from "./alias.js";
import { $buildXFAObject } from "./namespaces.js";
import { $isNsAgnostic, $onChild } from "./symbol_utils.js";
import { XFAObject, XmlObject } from "./xfa_object.js";
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
export type XFANsDatasets = typeof DatasetsNamespace;
export declare const DatasetsNamespace: {
    [$buildXFAObject](name: string, attributes: XFAAttrs): Datasets | Data | undefined;
    datasets(attrs: XFAAttrs): Datasets;
    data(attrs: XFAAttrs): Data;
};
export {};
//# sourceMappingURL=datasets.d.ts.map