import type { AnnotStorageRecord } from "../../display/annotation_layer.js";
import { Datasets } from "./datasets.js";
import type { XFAObject, XmlObject } from "./xfa_object.js";
export declare class DataHandler {
    data: XmlObject;
    dataset: Datasets | undefined;
    constructor(root: XFAObject, data: XmlObject);
    serialize(storage: AnnotStorageRecord | undefined): string;
}
//# sourceMappingURL=data.d.ts.map