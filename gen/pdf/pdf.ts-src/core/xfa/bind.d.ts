import { Datasets } from "./datasets.js";
import { Subform, Template } from "./template.js";
import { XFAObject, XmlObject } from "./xfa_object.js";
export declare class Binder {
    #private;
    root: XFAObject;
    datasets: Datasets | undefined;
    emptyMerge: boolean;
    _mergeMode?: boolean | undefined;
    data: XmlObject;
    getData(): XmlObject;
    form: Subform | Template;
    constructor(root: XFAObject);
    bind(): Template;
}
//# sourceMappingURL=bind.d.ts.map