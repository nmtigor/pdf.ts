/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
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

import type { StructTreeNode } from "../display/api.ts";
import { stringToPDFString, warn } from "../shared/util.ts";
import { NumberTree } from "./name_number_tree.ts";
import { Dict, isName, Name, Ref } from "./primitives.ts";
/*80--------------------------------------------------------------------------*/

const MAX_DEPTH = 40;

const enum StructElementType {
  PAGE_CONTENT = "PAGE_CONTENT",
  STREAM_CONTENT = "STREAM_CONTENT",
  OBJECT = "OBJECT",
  ELEMENT = "ELEMENT",
}

export class StructTreeRoot {
  dict;
  roleMap = new Map<string, string>();

  constructor(rootDict: Dict) {
    this.dict = rootDict;
  }

  init() {
    this.readRoleMap();
  }

  readRoleMap() {
    const roleMapDict = this.dict.get("RoleMap") as Dict;
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
}

/**
 * Instead of loading the whole tree we load just the page's relevant structure
 * elements, which means we need a wrapper structure to represent the tree.
 */
class StructElementNode {
  kids: StructElement[] = [];

  constructor(public tree: StructTreePage, public dict: Dict) {
    this.parseKids();
  }

  get role() {
    const nameObj = this.dict.get("S");
    const name = nameObj instanceof Name ? nameObj.name : "";
    const { root } = this.tree;
    if (root.roleMap.has(name)) {
      return root.roleMap.get(name)!;
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
        const element = this.parseKid(pageObjId, <number | Dict | Ref> kid);
        if (element) {
          this.kids.push(element);
        }
      }
    } else {
      const element = this.parseKid(pageObjId, <number | Dict | Ref> kids);
      if (element) {
        this.kids.push(element);
      }
    }
  }

  parseKid(pageObjId: string | undefined, kid: number | Ref | Dict) {
    // A direct link to content, the integer is an mcid.
    if (Number.isInteger(kid)) {
      if (this.tree.pageDict.objId !== pageObjId) {
        return null;
      }

      return new StructElement({
        type: StructElementType.PAGE_CONTENT,
        mcid: <number> kid,
        pageObjId,
      });
    }

    // Find the dictionary for the kid.
    let kidDict; // Table 324
    if (kid instanceof Ref) {
      kidDict = <Dict> this.dict.xref!.fetch(kid);
    } else if (kid instanceof Dict) {
      kidDict = kid;
    }
    if (!kidDict) {
      return null;
    }
    const pageRef = kidDict.getRaw("Pg");
    if (pageRef instanceof Ref) {
      pageObjId = pageRef.toString();
    }

    const type = kidDict.get("Type") instanceof Name
      ? (<Name> kidDict.get("Type")).name
      : null;
    if (type === "MCR") {
      if (this.tree.pageDict.objId !== pageObjId) {
        return null;
      }
      return new StructElement({
        type: StructElementType.STREAM_CONTENT,
        refObjId: kidDict.getRaw("Stm") instanceof Ref
          ? kidDict.getRaw("Stm")!.toString()
          : undefined,
        pageObjId,
        mcid: <number> kidDict.get("MCID"),
      });
    }

    if (type === "OBJR") {
      if (this.tree.pageDict.objId !== pageObjId) {
        return null;
      }
      return new StructElement({
        type: StructElementType.OBJECT,
        refObjId: kidDict.getRaw("Obj") instanceof Ref
          ? kidDict.getRaw("Obj")!.toString()
          : undefined,
        pageObjId,
      });
    }

    return new StructElement({
      type: StructElementType.ELEMENT,
      dict: kidDict,
    });
  }
}

interface _StructElementCtorP {
  type: StructElementType;
  dict?: Dict;
  mcid?: number;
  pageObjId?: string | undefined;
  refObjId?: string | undefined;
}

class StructElement {
  type;
  dict;
  mcid;
  pageObjId;
  refObjId;
  parentNode?: StructElementNode;

  constructor({
    type,
    dict,
    mcid,
    pageObjId,
    refObjId,
  }: _StructElementCtorP) {
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
  nodes: StructElementNode[] = [];

  constructor(structTreeRoot: StructTreeRoot, pageDict: Dict) {
    this.root = structTreeRoot;
    this.rootDict = structTreeRoot?.dict ?? undefined;
    this.pageDict = pageDict;
  }

  /**
   * Table 322
   */
  parse() {
    if (!this.root || !this.rootDict) {
      return;
    }

    const parentTree = <Ref> this.rootDict.get("ParentTree");
    if (!parentTree) {
      return;
    }
    const id = <number> this.pageDict.get("StructParents");
    if (!Number.isInteger(id)) {
      return;
    }
    const numberTree = new NumberTree(parentTree, this.rootDict.xref!);
    const parentArray = numberTree.get(id);
    if (!Array.isArray(parentArray)) {
      return;
    }
    const map = new Map<Dict, StructElementNode>();
    for (const ref of parentArray) {
      if (ref instanceof Ref) {
        this.addNode(<Dict> this.rootDict.xref!.fetch(ref), map);
      }
    }
  }

  addNode(dict: Dict, map: Map<Dict, StructElementNode>, level = 0) {
    if (level > MAX_DEPTH) {
      warn("StructTree MAX_DEPTH reached.");
      return undefined;
    }

    if (map.has(dict)) {
      return map.get(dict);
    }

    const element = new StructElementNode(this, dict);
    map.set(dict, element);

    const parent = <Dict | undefined> dict.get("P");

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

  addTopLevelNode(dict: Dict, element: StructElementNode) {
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
    function nodeToSerializable(
      node: StructElementNode,
      parent: StructTreeNode,
      level = 0,
    ) {
      if (level > MAX_DEPTH) {
        warn("StructTree too deep to be fully serialized.");
        return;
      }
      const obj: StructTreeNode = Object.create(null);
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
        const kidElement = kid.type === StructElementType.ELEMENT
          ? kid.parentNode
          : undefined;
        if (kidElement) {
          nodeToSerializable(kidElement, obj, level + 1);
          continue;
        } else if (
          kid.type === StructElementType.PAGE_CONTENT ||
          kid.type === StructElementType.STREAM_CONTENT
        ) {
          obj.children.push({
            type: "content",
            id: `p${kid.pageObjId}_mc${kid.mcid}`,
          });
        } else if (kid.type === StructElementType.OBJECT) {
          obj.children.push({
            type: "object",
            id: kid.refObjId!,
          });
        }
      }
    }

    const root: StructTreeNode = Object.create(null);
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
