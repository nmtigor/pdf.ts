/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */
/* Copyright 2021 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Dict, isName, Name, Ref } from "./primitives.js";
import { stringToPDFString, warn } from "../shared/util.js";
import { NumberTree } from "./name_number_tree.js";
/*81---------------------------------------------------------------------------*/
const MAX_DEPTH = 40;
export class StructTreeRoot {
    dict;
    roleMap = new Map();
    constructor(rootDict) {
        this.dict = rootDict;
    }
    init() {
        this.readRoleMap();
    }
    readRoleMap() {
        const roleMapDict = this.dict.get("RoleMap");
        if (!(roleMapDict instanceof Dict))
            return;
        roleMapDict.forEach((key, value) => {
            if (!(value instanceof Name))
                return;
            this.roleMap.set(key, value.name);
        });
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
        const name = (nameObj instanceof Name) ? nameObj.name : "";
        const { root } = this.tree;
        if (root.roleMap.has(name)) {
            return root.roleMap.get(name);
        }
        return name;
    }
    parseKids() {
        let pageObjId;
        const objRef = this.dict.getRaw("Pg");
        if ((objRef instanceof Ref)) {
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
                return null;
            }
            return new StructElement({
                type: "PAGE_CONTENT" /* PAGE_CONTENT */,
                mcid: kid,
                pageObjId,
            });
        }
        // Find the dictionary for the kid.
        let kidDict; // Table 324
        if ((kid instanceof Ref)) {
            kidDict = this.dict.xref.fetch(kid);
        }
        else if (kid instanceof Dict) {
            kidDict = kid;
        }
        if (!kidDict)
            return null;
        const pageRef = kidDict.getRaw("Pg");
        if ((pageRef instanceof Ref)) {
            pageObjId = pageRef.toString();
        }
        const type = (kidDict.get("Type") instanceof Name)
            ? kidDict.get("Type").name
            : null;
        if (type === "MCR") {
            if (this.tree.pageDict.objId !== pageObjId) {
                return null;
            }
            return new StructElement({
                type: "STREAM_CONTENT" /* STREAM_CONTENT */,
                refObjId: (kidDict.getRaw("Stm") instanceof Ref)
                    ? kidDict.getRaw("Stm").toString()
                    : undefined,
                pageObjId,
                mcid: kidDict.get("MCID"),
            });
        }
        if (type === "OBJR") {
            if (this.tree.pageDict.objId !== pageObjId) {
                return null;
            }
            return new StructElement({
                type: "OBJECT" /* OBJECT */,
                refObjId: (kidDict.getRaw("Obj") instanceof Ref)
                    ? kidDict.getRaw("Obj").toString()
                    : undefined,
                pageObjId,
            });
        }
        return new StructElement({
            type: "ELEMENT" /* ELEMENT */,
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
    parse() {
        if (!this.root || !this.rootDict)
            return;
        const parentTree = this.rootDict.get("ParentTree");
        if (!parentTree)
            return;
        const id = this.pageDict.get("StructParents");
        if (!Number.isInteger(id))
            return;
        const numberTree = new NumberTree(parentTree, this.rootDict.xref);
        const parentArray = numberTree.get(id);
        if (!Array.isArray(parentArray))
            return;
        const map = new Map();
        for (const ref of parentArray) {
            if ((ref instanceof Ref)) {
                this.addNode(this.rootDict.xref.fetch(ref), map);
            }
        }
    }
    addNode(dict, map, level = 0) {
        if (level > MAX_DEPTH) {
            warn("StructTree MAX_DEPTH reached.");
            return null;
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
        if (!parentNode)
            return element;
        let save = false;
        for (const kid of parentNode.kids) {
            if (kid.type === "ELEMENT" /* ELEMENT */ && kid.dict === dict) {
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
        if (!obj)
            return false;
        if (obj instanceof Dict) {
            if (obj.objId !== dict.objId)
                return false;
            this.nodes[0] = element;
            return true;
        }
        if (!Array.isArray(obj)) {
            return true;
        }
        let save = false;
        for (let i = 0; i < obj.length; i++) {
            const kidRef = obj[i];
            if (kidRef && kidRef.toString() === dict.objId) {
                this.nodes[i] = element;
                save = true;
            }
        }
        return save;
    }
    /**
     * Convert the tree structure into a simplifed object literal that can
     * be sent to the main thread.
     * @return {Object}
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
            for (const kid of node.kids) {
                const kidElement = kid.type === "ELEMENT" /* ELEMENT */ ? kid.parentNode : null;
                if (kidElement) {
                    nodeToSerializable(kidElement, obj, level + 1);
                    continue;
                }
                else if (kid.type === "PAGE_CONTENT" /* PAGE_CONTENT */ ||
                    kid.type === "STREAM_CONTENT" /* STREAM_CONTENT */) {
                    obj.children.push({
                        type: "content",
                        id: `page${kid.pageObjId}_mcid${kid.mcid}`,
                    });
                }
                else if (kid.type === "OBJECT" /* OBJECT */) {
                    obj.children.push({
                        type: "object",
                        id: kid.refObjId,
                    });
                }
            }
        }
        const root = Object.create(null);
        root.children = [];
        root.role = "Root";
        for (const child of this.nodes) {
            if (!child)
                continue;
            nodeToSerializable(child, root);
        }
        return root;
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=struct_tree.js.map