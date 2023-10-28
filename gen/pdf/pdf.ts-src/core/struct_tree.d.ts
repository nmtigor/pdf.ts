import type { AnnotStorageValue } from "../display/annotation_layer.js";
import type { StructTreeNode } from "../display/api.js";
import type { BasePdfManager } from "./pdf_manager.js";
import type { Obj } from "./primitives.js";
import { Dict, Ref, RefSetCache } from "./primitives.js";
import type { ASD_RR } from "./worker.js";
import type { XRef } from "./xref.js";
declare const enum StructElementType {
    PAGE_CONTENT = 1,
    STREAM_CONTENT = 2,
    OBJECT = 3,
    ANNOTATION = 4,
    ELEMENT = 5
}
export declare class StructTreeRoot {
    #private;
    dict: Dict;
    ref: Ref | undefined;
    roleMap: Map<string, string>;
    structParentIds: RefSetCache<[number, StructElementType][]> | undefined;
    constructor(rootDict: Dict, rootRef: Obj | undefined);
    init(): void;
    addAnnotationIdToPage(pageRef: Ref | undefined, id: number): void;
    readRoleMap(): void;
    static canCreateStructureTree({ catalogRef, pdfManager, newAnnotationsByPage, }: {
        catalogRef: Ref;
        pdfManager: BasePdfManager;
        newAnnotationsByPage: Map<number, AnnotStorageValue[]>;
    }): Promise<boolean>;
    static createStructureTree({ newAnnotationsByPage, xref, catalogRef, pdfManager, newRefs, }: {
        newAnnotationsByPage: Map<number, AnnotStorageValue[]>;
        xref: XRef;
        catalogRef: Ref;
        pdfManager: BasePdfManager;
        newRefs: ASD_RR[];
    }): Promise<void>;
    canUpdateStructTree({ pdfManager, newAnnotationsByPage }: {
        pdfManager: BasePdfManager;
        newAnnotationsByPage: Map<number, AnnotStorageValue[]>;
    }): Promise<boolean>;
    updateStructureTree({ newAnnotationsByPage, pdfManager, newRefs }: {
        newAnnotationsByPage: Map<number, AnnotStorageValue[]>;
        pdfManager: BasePdfManager;
        newRefs: ASD_RR[];
    }): Promise<void>;
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
    parseKid(pageObjId: string | undefined, kid: number | Ref | Dict): StructElement | undefined;
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
    parse(pageRef: Ref | undefined): void;
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