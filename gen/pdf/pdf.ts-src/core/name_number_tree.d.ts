import { Dict, type Ref } from "./primitives.js";
import type { XRef } from "./xref.js";
/**
 * A NameTree/NumberTree is like a Dict but has some advantageous properties,
 * see the specification (7.9.6 and 7.9.7) for additional details.
 * TODO: implement all the Dict functions and make this more efficient.
 */
declare abstract class NameOrNumberTree<T extends string | number> {
    #private;
    root: Ref | Dict | undefined;
    xref: XRef;
    constructor(root: Ref | Dict | undefined, xref: XRef, type: "Names" | "Nums");
    getAll(): Map<T, Dict>;
    get(key: number): import("./primitives.js").ObjNoRef | undefined;
}
export declare class NameTree extends NameOrNumberTree<string> {
    constructor(root: Ref, xref: XRef);
}
export declare class NumberTree extends NameOrNumberTree<number> {
    constructor(root: Ref | Dict, xref: XRef);
}
export {};
//# sourceMappingURL=name_number_tree.d.ts.map