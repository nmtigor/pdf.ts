import type { Datasets } from "./datasets.js";
import type { Subform, Template } from "./template.js";
import type { XFAObject } from "./xfa_object.js";
import { XmlObject } from "./xfa_object.js";
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