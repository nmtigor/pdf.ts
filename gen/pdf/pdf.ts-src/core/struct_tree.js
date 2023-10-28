/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { AnnotationPrefix, stringToPDFString, warn } from "../shared/util.js";
import { NumberTree } from "./name_number_tree.js";
import { Dict, isName, Name, Ref, RefSetCache } from "./primitives.js";
import { writeObject } from "./writer.js";
/*80--------------------------------------------------------------------------*/
const MAX_DEPTH = 40;
var StructElementType;
(function (StructElementType) {
    StructElementType[StructElementType["PAGE_CONTENT"] = 1] = "PAGE_CONTENT";
    StructElementType[StructElementType["STREAM_CONTENT"] = 2] = "STREAM_CONTENT";
    StructElementType[StructElementType["OBJECT"] = 3] = "OBJECT";
    StructElementType[StructElementType["ANNOTATION"] = 4] = "ANNOTATION";
    StructElementType[StructElementType["ELEMENT"] = 5] = "ELEMENT";
})(StructElementType || (StructElementType = {}));
export class StructTreeRoot {
    dict;
    ref;
    roleMap = new Map();
    structParentIds;
    constructor(rootDict, rootRef) {
        this.dict = rootDict;
        this.ref = rootRef instanceof Ref ? rootRef : undefined;
        this.roleMap = new Map();
    }
    init() {
        this.readRoleMap();
    }
    #addIdToPage(pageRef, id, type) {
        if (!(pageRef instanceof Ref) || id < 0) {
            return;
        }
        this.structParentIds ||= new RefSetCache();
        let ids = this.structParentIds.get(pageRef);
        if (!ids) {
            ids = [];
            this.structParentIds.put(pageRef, ids);
        }
        ids.push([id, type]);
    }
    addAnnotationIdToPage(pageRef, id) {
        this.#addIdToPage(pageRef, id, StructElementType.ANNOTATION);
    }
    readRoleMap() {
        const roleMapDict = this.dict.get("RoleMap");
        if (!(roleMapDict instanceof Dict)) {
            return;
        }
        roleMapDict.forEach((key, value) => {
            if (!(value instanceof Name)) {
                return;
            }
            this.roleMap.set(key, value.name);
        });
    }
    static async canCreateStructureTree({ catalogRef, pdfManager, newAnnotationsByPage, }) {
        if (!(catalogRef instanceof Ref)) {
            warn("Cannot save the struct tree: no catalog reference.");
            return false;
        }
        let nextKey = 0;
        let hasNothingToUpdate = true;
        for (const [pageIndex, elements] of newAnnotationsByPage) {
            const { ref: pageRef } = await pdfManager.getPage(pageIndex);
            if (!(pageRef instanceof Ref)) {
                warn(`Cannot save the struct tree: page ${pageIndex} has no ref.`);
                hasNothingToUpdate = true;
                break;
            }
            for (const element of elements) {
                if (element.accessibilityData?.type) {
                    // Each tag must have a structure type.
                    element.parentTreeId = nextKey++;
                    hasNothingToUpdate = false;
                }
            }
        }
        if (hasNothingToUpdate) {
            for (const elements of newAnnotationsByPage.values()) {
                for (const element of elements) {
                    delete element.parentTreeId;
                }
            }
            return false;
        }
        return true;
    }
    static async createStructureTree({ newAnnotationsByPage, xref, catalogRef, pdfManager, newRefs, }) {
        // console.log("🚀 ~ StructTreeRoot.createStructureTree() ~ newRefs:");
        // console.dir(newRefs);
        const root = pdfManager.catalog.cloneDict();
        const structTreeRootRef = xref.getNewTemporaryRef();
        root.set("StructTreeRoot", structTreeRootRef);
        const buffer = [];
        await writeObject(catalogRef, root, buffer, xref);
        newRefs.push({ ref: catalogRef, data: buffer.join("") });
        const structTreeRoot = new Dict(xref);
        structTreeRoot.set("Type", Name.get("StructTreeRoot"));
        const parentTreeRef = xref.getNewTemporaryRef();
        structTreeRoot.set("ParentTree", parentTreeRef);
        const kids = [];
        structTreeRoot.set("K", kids);
        const parentTree = new Dict(xref);
        const nums = [];
        parentTree.set("Nums", nums);
        const nextKey = await this.#writeKids({
            newAnnotationsByPage,
            structTreeRootRef,
            kids,
            nums,
            xref,
            pdfManager,
            newRefs,
            buffer,
        });
        structTreeRoot.set("ParentTreeNextKey", nextKey);
        // console.log("🚀 ~ StructTreeRoot.createStructureTree() ~ newRefs:");
        // console.dir(newRefs);
        buffer.length = 0;
        await writeObject(parentTreeRef, parentTree, buffer, xref);
        newRefs.push({ ref: parentTreeRef, data: buffer.join("") });
        buffer.length = 0;
        await writeObject(structTreeRootRef, structTreeRoot, buffer, xref);
        newRefs.push({ ref: structTreeRootRef, data: buffer.join("") });
    }
    async canUpdateStructTree({ pdfManager, newAnnotationsByPage }) {
        if (!this.ref) {
            warn("Cannot update the struct tree: no root reference.");
            return false;
        }
        let nextKey = this.dict.get("ParentTreeNextKey");
        if (!Number.isInteger(nextKey) || nextKey < 0) {
            warn("Cannot update the struct tree: invalid next key.");
            return false;
        }
        const parentTree = this.dict.get("ParentTree");
        if (!(parentTree instanceof Dict)) {
            warn("Cannot update the struct tree: ParentTree isn't a dict.");
            return false;
        }
        const nums = parentTree.get("Nums");
        if (!Array.isArray(nums)) {
            warn("Cannot update the struct tree: nums isn't an array.");
            return false;
        }
        const { numPages } = pdfManager.catalog;
        for (const pageIndex of newAnnotationsByPage.keys()) {
            const { pageDict, ref: pageRef } = await pdfManager.getPage(pageIndex);
            if (!(pageRef instanceof Ref)) {
                warn(`Cannot save the struct tree: page ${pageIndex} has no ref.`);
                return false;
            }
            const id = pageDict.get("StructParents");
            if (!Number.isInteger(id) || id < 0 || id >= numPages) {
                warn(`Cannot save the struct tree: page ${pageIndex} has no id.`);
                return false;
            }
        }
        let hasNothingToUpdate = true;
        for (const [pageIndex, elements] of newAnnotationsByPage) {
            const { pageDict } = await pdfManager.getPage(pageIndex);
            StructTreeRoot.#collectParents({
                elements,
                xref: this.dict.xref,
                pageDict,
                parentTree,
            });
            for (const element of elements) {
                if (element.accessibilityData?.type) {
                    // Each tag must have a structure type.
                    element.parentTreeId = nextKey++;
                    hasNothingToUpdate = false;
                }
            }
        }
        if (hasNothingToUpdate) {
            for (const elements of newAnnotationsByPage.values()) {
                for (const element of elements) {
                    delete element.parentTreeId;
                    delete element.structTreeParent;
                }
            }
            return false;
        }
        return true;
    }
    async updateStructureTree({ newAnnotationsByPage, pdfManager, newRefs }) {
        const xref = this.dict.xref;
        const structTreeRoot = this.dict.clone();
        const structTreeRootRef = this.ref;
        let parentTreeRef = structTreeRoot.getRaw("ParentTree");
        let parentTree;
        if (parentTreeRef instanceof Ref) {
            parentTree = xref.fetch(parentTreeRef);
        }
        else {
            parentTree = parentTreeRef;
            parentTreeRef = xref.getNewTemporaryRef();
            structTreeRoot.set("ParentTree", parentTreeRef);
        }
        parentTree = parentTree.clone();
        let nums = parentTree.getRaw("Nums");
        let numsRef;
        if (nums instanceof Ref) {
            numsRef = nums;
            nums = xref.fetch(numsRef);
        }
        nums = nums.slice();
        if (!numsRef) {
            parentTree.set("Nums", nums);
        }
        let kids = structTreeRoot.getRaw("K");
        let kidsRef;
        if (kids instanceof Ref) {
            kidsRef = kids;
            kids = xref.fetch(kidsRef);
        }
        else {
            kidsRef = xref.getNewTemporaryRef();
            structTreeRoot.set("K", kidsRef);
        }
        kids = Array.isArray(kids) ? kids.slice() : [kids];
        const buffer = [];
        const newNextkey = await StructTreeRoot.#writeKids({
            newAnnotationsByPage,
            structTreeRootRef,
            kids,
            nums,
            xref,
            pdfManager,
            newRefs,
            buffer,
        });
        structTreeRoot.set("ParentTreeNextKey", newNextkey);
        buffer.length = 0;
        await writeObject(kidsRef, kids, buffer, xref);
        newRefs.push({ ref: kidsRef, data: buffer.join("") });
        if (numsRef) {
            buffer.length = 0;
            await writeObject(numsRef, nums, buffer, xref);
            newRefs.push({ ref: numsRef, data: buffer.join("") });
        }
        buffer.length = 0;
        await writeObject(parentTreeRef, parentTree, buffer, xref);
        newRefs.push({ ref: parentTreeRef, data: buffer.join("") });
        buffer.length = 0;
        await writeObject(structTreeRootRef, structTreeRoot, buffer, xref);
        newRefs.push({ ref: structTreeRootRef, data: buffer.join("") });
    }
    static async #writeKids({ newAnnotationsByPage, structTreeRootRef, kids, nums, xref, pdfManager, newRefs, buffer, }) {
        const objr = Name.get("OBJR");
        let nextKey = -Infinity;
        for (const [pageIndex, elements] of newAnnotationsByPage) {
            const { ref: pageRef } = await pdfManager.getPage(pageIndex);
            for (const { accessibilityData, ref, parentTreeId, structTreeParent } of elements) {
                const type = accessibilityData?.type, title = accessibilityData?.title, lang = accessibilityData?.lang, alt = accessibilityData?.alt, expanded = accessibilityData?.expanded, actualText = accessibilityData?.actualText;
                nextKey = Math.max(nextKey, parentTreeId);
                const tagRef = xref.getNewTemporaryRef();
                const tagDict = new Dict(xref);
                // The structure type is required.
                // tagDict.set("S", Name.get(type)); //kkkk bug?
                tagDict.set("S", Name.get(type ?? ""));
                // console.log("🚀 ~ StructTreeRoot.#writeKids() ~ newRefs:");
                // console.dir(newRefs);
                if (title) {
                    tagDict.set("T", title);
                }
                if (lang) {
                    tagDict.set("Lang", lang);
                }
                if (alt) {
                    tagDict.set("Alt", alt);
                }
                if (expanded) {
                    tagDict.set("E", expanded);
                }
                if (actualText) {
                    tagDict.set("ActualText", actualText);
                }
                if (structTreeParent) {
                    await this.#updateParentTag({
                        structTreeParent,
                        tagDict,
                        newTagRef: tagRef,
                        fallbackRef: structTreeRootRef,
                        xref,
                        newRefs,
                        buffer,
                    });
                }
                else {
                    tagDict.set("P", structTreeRootRef);
                }
                const objDict = new Dict(xref);
                tagDict.set("K", objDict);
                objDict.set("Type", objr);
                objDict.set("Pg", pageRef);
                objDict.set("Obj", ref);
                buffer.length = 0;
                await writeObject(tagRef, tagDict, buffer, xref);
                newRefs.push({ ref: tagRef, data: buffer.join("") });
                nums.push(parentTreeId, tagRef);
                kids.push(tagRef);
            }
        }
        return nextKey + 1;
    }
    static #collectParents({ elements, xref, pageDict, parentTree }) {
        const idToElement = new Map();
        for (const element of elements) {
            if (element.structTreeParentId) {
                const id = parseInt(element.structTreeParentId.split("_mc")[1], 10);
                idToElement.set(id, element);
            }
        }
        const id = pageDict.get("StructParents");
        const numberTree = new NumberTree(parentTree, xref);
        const parentArray = numberTree.get(id);
        if (!Array.isArray(parentArray)) {
            return;
        }
        const updateElement = (kid, pageKid, kidRef) => {
            const element = idToElement.get(kid);
            if (element) {
                const parentRef = pageKid.getRaw("P");
                const parentDict = xref.fetchIfRef(parentRef);
                if (parentRef instanceof Ref && parentDict instanceof Dict) {
                    // It should always the case, but we check just in case.
                    element.structTreeParent = { ref: kidRef, dict: pageKid };
                }
                return true;
            }
            return false;
        };
        for (const kidRef of parentArray) {
            if (!(kidRef instanceof Ref)) {
                continue;
            }
            const pageKid = xref.fetch(kidRef);
            const k = pageKid.get("K");
            if (Number.isInteger(k)) {
                updateElement(k, pageKid, kidRef);
                continue;
            }
            if (!Array.isArray(k)) {
                continue;
            }
            for (let kid of k) {
                kid = xref.fetchIfRef(kid);
                if (Number.isInteger(kid) && updateElement(kid, pageKid, kidRef)) {
                    break;
                }
            }
        }
    }
    static async #updateParentTag({ structTreeParent: { ref, dict }, tagDict, newTagRef, fallbackRef, xref, newRefs, buffer, }) {
        // We get the parent of the tag.
        const parentRef = dict.getRaw("P");
        let parentDict = xref.fetchIfRef(parentRef);
        tagDict.set("P", parentRef);
        // We get the kids in order to insert a new tag at the right position.
        let saveParentDict = false;
        let parentKids;
        let parentKidsRef = parentDict.getRaw("K");
        if (!(parentKidsRef instanceof Ref)) {
            parentKids = parentKidsRef;
            parentKidsRef = xref.getNewTemporaryRef();
            parentDict = parentDict.clone();
            parentDict.set("K", parentKidsRef);
            saveParentDict = true;
        }
        else {
            parentKids = xref.fetch(parentKidsRef);
        }
        if (Array.isArray(parentKids)) {
            const index = parentKids.indexOf(ref);
            if (index >= 0) {
                parentKids = parentKids.slice();
                parentKids.splice(index + 1, 0, newTagRef);
            }
            else {
                warn("Cannot update the struct tree: parent kid not found.");
                tagDict.set("P", fallbackRef);
                return;
            }
        }
        else if (parentKids instanceof Dict) {
            parentKids = [parentKidsRef, newTagRef];
            parentKidsRef = xref.getNewTemporaryRef();
            parentDict.set("K", parentKidsRef);
            saveParentDict = true;
        }
        buffer.length = 0;
        await writeObject(parentKidsRef, parentKids, buffer, xref);
        newRefs.push({ ref: parentKidsRef, data: buffer.join("") });
        if (!saveParentDict) {
            return;
        }
        buffer.length = 0;
        await writeObject(parentRef, parentDict, buffer, xref);
        newRefs.push({ ref: parentRef, data: buffer.join("") });
    }
}
/**
 * Instead of loading the whole tree we load just the page's relevant structure
 * elements, which means we need a wrapper structure to represent the tree.
 */
class StructElementNode {
    tree;
    dict;
    kids = [];
    constructor(tree, dict) {
        this.tree = tree;
        this.dict = dict;
        this.parseKids();
    }
    get role() {
        const nameObj = this.dict.get("S");
        const name = nameObj instanceof Name ? nameObj.name : "";
        const { root } = this.tree;
        if (root.roleMap.has(name)) {
            return root.roleMap.get(name);
        }
        return name;
    }
    parseKids() {
        let pageObjId;
        const objRef = this.dict.getRaw("Pg");
        if (objRef instanceof Ref) {
            pageObjId = objRef.toString();
        }
        const kids = this.dict.get("K");
        if (Array.isArray(kids)) {
            for (const kid of kids) {
                const element = this.parseKid(pageObjId, kid);
                if (element) {
                    this.kids.push(element);
                }
            }
        }
        else {
            const element = this.parseKid(pageObjId, kids);
            if (element) {
                this.kids.push(element);
            }
        }
    }
    parseKid(pageObjId, kid) {
        // A direct link to content, the integer is an mcid.
        if (Number.isInteger(kid)) {
            if (this.tree.pageDict.objId !== pageObjId) {
                return undefined;
            }
            return new StructElement({
                type: StructElementType.PAGE_CONTENT,
                mcid: kid,
                pageObjId,
            });
        }
        // Find the dictionary for the kid.
        let kidDict; // Table 324
        if (kid instanceof Ref) {
            kidDict = this.dict.xref.fetch(kid);
        }
        else if (kid instanceof Dict) {
            kidDict = kid;
        }
        if (!kidDict) {
            return undefined;
        }
        const pageRef = kidDict.getRaw("Pg");
        if (pageRef instanceof Ref) {
            pageObjId = pageRef.toString();
        }
        const type = kidDict.get("Type") instanceof Name
            ? kidDict.get("Type").name
            : undefined;
        if (type === "MCR") {
            if (this.tree.pageDict.objId !== pageObjId) {
                return undefined;
            }
            const kidRef = kidDict.getRaw("Stm");
            return new StructElement({
                type: StructElementType.STREAM_CONTENT,
                refObjId: kidRef instanceof Ref ? kidRef.toString() : undefined,
                pageObjId,
                mcid: kidDict.get("MCID"),
            });
        }
        if (type === "OBJR") {
            if (this.tree.pageDict.objId !== pageObjId) {
                return undefined;
            }
            const kidRef = kidDict.getRaw("Obj");
            return new StructElement({
                type: StructElementType.OBJECT,
                refObjId: kidRef instanceof Ref ? kidRef.toString() : undefined,
                pageObjId,
            });
        }
        return new StructElement({
            type: StructElementType.ELEMENT,
            dict: kidDict,
        });
    }
}
class StructElement {
    type;
    dict;
    mcid;
    pageObjId;
    refObjId;
    parentNode;
    constructor({ type, dict, mcid, pageObjId, refObjId, }) {
        this.type = type;
        this.dict = dict;
        this.mcid = mcid;
        this.pageObjId = pageObjId;
        this.refObjId = refObjId;
    }
}
export class StructTreePage {
    root;
    rootDict;
    pageDict;
    nodes = [];
    constructor(structTreeRoot, pageDict) {
        this.root = structTreeRoot;
        this.rootDict = structTreeRoot?.dict ?? undefined;
        this.pageDict = pageDict;
    }
    /**
     * Table 322
     */
    parse(pageRef) {
        if (!this.root || !this.rootDict) {
            return;
        }
        const parentTree = this.rootDict.get("ParentTree");
        if (!parentTree) {
            return;
        }
        const id = this.pageDict.get("StructParents");
        const ids = pageRef instanceof Ref &&
            this.root.structParentIds?.get(pageRef);
        if (!Number.isInteger(id) && !ids) {
            return;
        }
        const map = new Map();
        const numberTree = new NumberTree(parentTree, this.rootDict.xref);
        if (Number.isInteger(id)) {
            const parentArray = numberTree.get(id);
            if (Array.isArray(parentArray)) {
                for (const ref of parentArray) {
                    if (ref instanceof Ref) {
                        this.addNode(this.rootDict.xref.fetch(ref), map);
                    }
                }
            }
        }
        if (!ids) {
            return;
        }
        for (const [elemId, type] of ids) {
            const obj = numberTree.get(elemId);
            if (obj) {
                const elem = this.addNode(this.rootDict.xref.fetchIfRef(obj), map);
                // console.log("🚀 ~ StructTreePage ~ parse ~ elem?.kids:");
                // console.dir(elem?.kids);
                if (elem?.kids?.length === 1 &&
                    elem.kids[0].type === StructElementType.OBJECT) {
                    // The node in the struct tree is wrapping an object (annotation
                    // or xobject), so we need to update the type of the node to match
                    // the type of the object.
                    elem.kids[0].type = type;
                }
            }
        }
    }
    addNode(dict, map, level = 0) {
        if (level > MAX_DEPTH) {
            warn("StructTree MAX_DEPTH reached.");
            return undefined;
        }
        if (map.has(dict)) {
            return map.get(dict);
        }
        const element = new StructElementNode(this, dict);
        map.set(dict, element);
        const parent = dict.get("P");
        if (!parent || isName(parent.get("Type"), "StructTreeRoot")) {
            if (!this.addTopLevelNode(dict, element)) {
                map.delete(dict);
            }
            return element;
        }
        const parentNode = this.addNode(parent, map, level + 1);
        if (!parentNode) {
            return element;
        }
        let save = false;
        for (const kid of parentNode.kids) {
            // console.log("🚀 ~ StructTreePage ~ addNode ~ kid:", kid)
            if (kid.type === StructElementType.ELEMENT && kid.dict === dict) {
                kid.parentNode = element;
                save = true;
            }
        }
        if (!save) {
            map.delete(dict);
        }
        return element;
    }
    addTopLevelNode(dict, element) {
        const obj = this.rootDict?.get("K");
        if (!obj) {
            return false;
        }
        if (obj instanceof Dict) {
            if (obj.objId !== dict.objId) {
                return false;
            }
            this.nodes[0] = element;
            return true;
        }
        if (!Array.isArray(obj)) {
            return true;
        }
        let save = false;
        for (let i = 0; i < obj.length; i++) {
            const kidRef = obj[i];
            if (kidRef?.toString() === dict.objId) {
                this.nodes[i] = element;
                save = true;
            }
        }
        return save;
    }
    /**
     * Convert the tree structure into a simplified object literal that can
     * be sent to the main thread.
     */
    get serializable() {
        function nodeToSerializable(node, parent, level = 0) {
            if (level > MAX_DEPTH) {
                warn("StructTree too deep to be fully serialized.");
                return;
            }
            const obj = Object.create(null);
            obj.role = node.role;
            obj.children = [];
            parent.children.push(obj);
            const alt = node.dict.get("Alt");
            if (typeof alt === "string") {
                obj.alt = stringToPDFString(alt);
            }
            const lang = node.dict.get("Lang");
            if (typeof lang === "string") {
                obj.lang = stringToPDFString(lang);
            }
            for (const kid of node.kids) {
                // console.log("🚀 ~ StructTreePage ~ getserializable ~ kid:", kid);
                const kidElement = kid.type === StructElementType.ELEMENT
                    ? kid.parentNode
                    : undefined;
                if (kidElement) {
                    nodeToSerializable(kidElement, obj, level + 1);
                    continue;
                }
                else if (kid.type === StructElementType.PAGE_CONTENT ||
                    kid.type === StructElementType.STREAM_CONTENT) {
                    obj.children.push({
                        type: "content",
                        id: `p${kid.pageObjId}_mc${kid.mcid}`,
                    });
                }
                else if (kid.type === StructElementType.OBJECT) {
                    obj.children.push({
                        type: "object",
                        id: kid.refObjId,
                    });
                }
                else if (kid.type === StructElementType.ANNOTATION) {
                    obj.children.push({
                        type: "annotation",
                        id: `${AnnotationPrefix}${kid.refObjId}`,
                    });
                }
            }
        }
        const root = Object.create(null);
        root.children = [];
        root.role = "Root";
        for (const child of this.nodes) {
            if (!child) {
                continue;
            }
            nodeToSerializable(child, root);
        }
        return root;
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=struct_tree.js.map