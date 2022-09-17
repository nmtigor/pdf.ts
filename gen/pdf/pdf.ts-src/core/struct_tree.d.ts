import { StructTreeNode } from "../display/api.js";
import { Dict, Ref } from "./primitives.js";
declare const enum StructElementType {
    PAGE_CONTENT = "PAGE_CONTENT",
    STREAM_CONTENT = "STREAM_CONTENT",
    OBJECT = "OBJECT",
    ELEMENT = "ELEMENT"
}
export declare class StructTreeRoot {
    dict: Dict;
    roleMap: Map<string, string>;
    constructor(rootDict: Dict);
    init(): void;
    readRoleMap(): void;
}
/**
 * Instead of loading the whole tree we load just the page's relevant structure
 * elements, which means we need a wrapper structure to represent the tree.
 */
declare class StructElementNode {
    tree: StructTreePage;
    dict: Dict;
    kids: StructElement[];
    constructor(tree: StructTreePage, dict: Dict);
    get role(): string;
    parseKids(): void;
    parseKid(pageObjId: string | undefined, kid: number | Ref | Dict): StructElement | null;
}
interface _StructElementCtorP {
    type: StructElementType;
    dict?: Dict;
    mcid?: number;
    pageObjId?: string | undefined;
    refObjId?: string | undefined;
}
declare class StructElement {
    type: StructElementType;
    dict: Dict | undefined;
    mcid: number | undefined;
    pageObjId: string | undefined;
    refObjId: string | undefined;
    parentNode?: StructElementNode;
    constructor({ type, dict, mcid, pageObjId, refObjId, }: _StructElementCtorP);
}
export declare class StructTreePage {
    root: StructTreeRoot;
    rootDict: Dict;
    pageDict: Dict;
    nodes: StructElementNode[];
    constructor(structTreeRoot: StructTreeRoot, pageDict: Dict);
    /**
     * Table 322
     */
    parse(): void;
    addNode(dict: Dict, map: Map<Dict, StructElementNode>, level?: number): StructElementNode | undefined;
    addTopLevelNode(dict: Dict, element: StructElementNode): boolean;
    /**
     * Convert the tree structure into a simplified object literal that can
     * be sent to the main thread.
     */
    get serializable(): StructTreeNode;
}
export {};
//# sourceMappingURL=struct_tree.d.ts.map