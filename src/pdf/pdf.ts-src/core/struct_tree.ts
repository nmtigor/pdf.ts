/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/struct_tree.ts
 * @license Apache-2.0
 ******************************************************************************/

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

import type { int } from "@fe-lib/alias.ts";
import type {
  AnnotStorageValue,
  StructTreeParent,
} from "../display/annotation_layer.ts";
import type { StructTreeNode } from "../display/api.ts";
import { AnnotationPrefix, stringToPDFString, warn } from "../shared/util.ts";
import { stringToAsciiOrUTF16BE } from "./core_utils.ts";
import { NumberTree } from "./name_number_tree.ts";
import type { BasePdfManager } from "./pdf_manager.ts";
import type { Obj } from "./primitives.ts";
import { Dict, isName, Name, Ref, RefSetCache } from "./primitives.ts";
import type { ASD_RR } from "./worker.ts";
import { writeObject } from "./writer.ts";
import type { XRef } from "./xref.ts";
/*80--------------------------------------------------------------------------*/

const MAX_DEPTH = 40;

const enum StructElementType {
  PAGE_CONTENT = 1,
  STREAM_CONTENT = 2,
  OBJECT = 3,
  ANNOTATION = 4,
  ELEMENT = 5,
}

type WriteKidsP_ = {
  newAnnotationsByPage: Map<number, AnnotStorageValue[]>;
  structTreeRootRef: Ref | undefined;
  kids: Ref[] | undefined;
  nums: (number | Ref)[];
  xref: XRef;
  pdfManager: BasePdfManager;
  //kkkk TOCLEANUP
  // newRefs: ASD_RR[];
  // buffer: string[];
  cache: RefSetCache<Dict | (number | Ref)[]>;
};

type CollectParentsP_ = {
  elements: AnnotStorageValue[];
  xref: XRef;
  pageDict: Dict;
  numberTree: NumberTree;
};

type UpdateParentTagP_ = {
  structTreeParent: StructTreeParent | undefined;
  tagDict: Dict;
  newTagRef: Ref;
  //kkkk TOCLEANUP
  // fallbackRef: Ref | undefined;
  structTreeRootRef: Ref | undefined;
  fallbackKids: Ref[] | undefined;
  xref: XRef;
  //kkkk TOCLEANUP
  // newRefs: ASD_RR[];
  // buffer: string[];
  cache: RefSetCache<Dict | (number | Ref)[]>;
};

export class StructTreeRoot {
  dict;
  ref;
  roleMap = new Map<string, string>();
  structParentIds: RefSetCache<[number, StructElementType][]> | undefined;

  constructor(rootDict: Dict, rootRef: Obj | undefined) {
    this.dict = rootDict;
    this.ref = rootRef instanceof Ref ? rootRef : undefined;
    this.roleMap = new Map();
  }

  init() {
    this.readRoleMap();
  }

  #addIdToPage(pageRef: Ref | undefined, id: number, type: StructElementType) {
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

  addAnnotationIdToPage(pageRef: Ref | undefined, id: number) {
    this.#addIdToPage(pageRef, id, StructElementType.ANNOTATION);
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

  static async canCreateStructureTree({
    catalogRef,
    pdfManager,
    newAnnotationsByPage,
  }: {
    catalogRef: Ref;
    pdfManager: BasePdfManager;
    newAnnotationsByPage: Map<number, AnnotStorageValue[]>;
  }) {
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

  static async createStructureTree({
    newAnnotationsByPage,
    xref,
    catalogRef,
    pdfManager,
    newRefs,
  }: {
    newAnnotationsByPage: Map<number, AnnotStorageValue[]>;
    xref: XRef;
    catalogRef: Ref;
    pdfManager: BasePdfManager;
    newRefs: ASD_RR[];
  }) {
    // console.log("🚀 ~ StructTreeRoot.createStructureTree() ~ newRefs:");
    // console.dir(newRefs);
    const root = pdfManager.catalog!.cloneDict();
    const cache = new RefSetCache<Dict>();
    cache.put(catalogRef, root);

    const structTreeRootRef = xref.getNewTemporaryRef();
    root.set("StructTreeRoot", structTreeRootRef);

    const structTreeRoot = new Dict(xref);
    structTreeRoot.set("Type", Name.get("StructTreeRoot"));
    const parentTreeRef = xref.getNewTemporaryRef();
    structTreeRoot.set("ParentTree", parentTreeRef);
    const kids: Ref[] = [];
    structTreeRoot.set("K", kids);
    cache.put(structTreeRootRef, structTreeRoot);

    const parentTree = new Dict(xref);
    const nums: (number | Ref)[] = [];
    parentTree.set("Nums", nums);

    const nextKey = await this.#writeKids({
      newAnnotationsByPage,
      structTreeRootRef,
      kids,
      nums,
      xref,
      pdfManager,
      cache,
    });
    structTreeRoot.set("ParentTreeNextKey", nextKey);
    // console.log("🚀 ~ StructTreeRoot.createStructureTree() ~ newRefs:");
    // console.dir(newRefs);

    cache.put(parentTreeRef, parentTree);

    const buffer: string[] = [];
    for (const [ref, obj] of cache.items()) {
      buffer.length = 0;
      await writeObject(ref, obj, buffer, xref);
      newRefs.push({ ref, data: buffer.join("") });
    }
  }

  async canUpdateStructTree({ pdfManager, xref, newAnnotationsByPage }: {
    pdfManager: BasePdfManager;
    xref: XRef;
    newAnnotationsByPage: Map<number, AnnotStorageValue[]>;
  }) {
    if (!this.ref) {
      warn("Cannot update the struct tree: no root reference.");
      return false;
    }

    let nextKey = this.dict.get("ParentTreeNextKey");
    if (!Number.isInteger(nextKey) || (nextKey as int) < 0) {
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
    const numberTree = new NumberTree(parentTree, xref);

    for (const pageIndex of newAnnotationsByPage.keys()) {
      const { pageDict } = await pdfManager.getPage(pageIndex);
      if (!pageDict.has("StructParents")) {
        // StructParents is required when the content stream has some tagged
        // contents but a page can just have tagged annotations.
        continue;
      }
      const id = pageDict.get("StructParents");
      if (!Number.isInteger(id) || !Array.isArray(numberTree.get(id as int))) {
        warn(`Cannot save the struct tree: page ${pageIndex} has a wrong id.`);
        return false;
      }
    }

    let hasNothingToUpdate = true;
    for (const [pageIndex, elements] of newAnnotationsByPage) {
      const { pageDict } = await pdfManager.getPage(pageIndex);
      StructTreeRoot.#collectParents({
        elements,
        xref: this.dict.xref!,
        pageDict,
        numberTree,
      });

      for (const element of elements) {
        if (element.accessibilityData?.type) {
          // Each tag must have a structure type.
          element.parentTreeId = (nextKey as int)++;
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

  async updateStructureTree({ newAnnotationsByPage, pdfManager, newRefs }: {
    newAnnotationsByPage: Map<number, AnnotStorageValue[]>;
    pdfManager: BasePdfManager;
    newRefs: ASD_RR[];
  }) {
    const xref = this.dict.xref!;
    const structTreeRoot = this.dict.clone();
    const structTreeRootRef = this.ref;
    const cache = new RefSetCache<Dict | (number | Ref)[]>();
    cache.put(structTreeRootRef!, structTreeRoot);

    let parentTreeRef = structTreeRoot.getRaw("ParentTree");
    let parentTree;
    if (parentTreeRef instanceof Ref) {
      parentTree = xref.fetch(parentTreeRef) as Dict;
    } else {
      parentTree = parentTreeRef as Dict;
      parentTreeRef = xref.getNewTemporaryRef();
      structTreeRoot.set("ParentTree", parentTreeRef);
    }
    parentTree = parentTree.clone();
    cache.put(parentTreeRef, parentTree);

    let nums = parentTree.getRaw("Nums") as (number | Ref)[];
    let numsRef;
    if (nums instanceof Ref) {
      numsRef = nums;
      nums = xref.fetch(numsRef) as (number | Ref)[];
    }
    nums = nums.slice();
    if (!numsRef) {
      parentTree.set("Nums", nums);
    }

    const newNextkey = await StructTreeRoot.#writeKids({
      newAnnotationsByPage,
      structTreeRootRef,
      kids: undefined,
      nums,
      xref,
      pdfManager,
      cache,
    });
    structTreeRoot.set("ParentTreeNextKey", newNextkey);

    if (numsRef) {
      cache.put(numsRef, nums);
    }

    const buffer: string[] = [];
    for (const [ref, obj] of cache.items()) {
      buffer.length = 0;
      await writeObject(ref, obj, buffer, xref);
      newRefs.push({ ref, data: buffer.join("") });
    }
  }

  static async #writeKids({
    newAnnotationsByPage,
    structTreeRootRef,
    kids,
    nums,
    xref,
    pdfManager,
    cache,
  }: WriteKidsP_) {
    const objr = Name.get("OBJR");
    let nextKey = -Infinity;

    for (const [pageIndex, elements] of newAnnotationsByPage) {
      const { ref: pageRef } = await pdfManager.getPage(pageIndex);
      const isPageRef = pageRef instanceof Ref;
      for (
        const { accessibilityData, ref, parentTreeId, structTreeParent }
          of elements
      ) {
        if (!accessibilityData?.type) {
          continue;
        }
        const { type, title, lang, alt, expanded, actualText } =
          accessibilityData;
        nextKey = Math.max(nextKey, parentTreeId!);

        const tagRef = xref.getNewTemporaryRef();
        const tagDict = new Dict(xref);

        // The structure type is required.
        tagDict.set("S", Name.get(type));
        // console.log("🚀 ~ StructTreeRoot.#writeKids() ~ newRefs:");
        // console.dir(newRefs);

        if (title) {
          tagDict.set("T", stringToAsciiOrUTF16BE(title));
        }
        if (lang) {
          tagDict.set("Lang", lang);
        }
        if (alt) {
          tagDict.set("Alt", stringToAsciiOrUTF16BE(alt));
        }
        if (expanded) {
          tagDict.set("E", stringToAsciiOrUTF16BE(expanded));
        }
        if (actualText) {
          tagDict.set("ActualText", stringToAsciiOrUTF16BE(actualText));
        }

        await this.#updateParentTag({
          structTreeParent,
          tagDict,
          newTagRef: tagRef,
          structTreeRootRef,
          fallbackKids: kids,
          xref,
          cache,
        });

        const objDict = new Dict(xref);
        tagDict.set("K", objDict);
        objDict.set("Type", objr);
        if (isPageRef) {
          // Pg is optional.
          objDict.set("Pg", pageRef);
        }
        objDict.set("Obj", ref);

        cache.put(tagRef, tagDict);
        nums.push(parentTreeId!, tagRef);
      }
    }
    return nextKey + 1;
  }

  static #collectParents(
    { elements, xref, pageDict, numberTree }: CollectParentsP_,
  ) {
    const idToElements = new Map<int, AnnotStorageValue[]>();
    for (const element of elements) {
      if (element.structTreeParentId) {
        const id: int = parseInt(
          element.structTreeParentId.split("_mc")[1],
          10,
        );
        let elems = idToElements.get(id);
        if (!elems) {
          elems = [];
          idToElements.set(id, elems);
        }
        elems.push(element);
      }
    }

    const id = pageDict.get("StructParents") as int;
    if (!Number.isInteger(id)) {
      return;
    }
    // The parentArray type has already been checked by the caller.
    const parentArray = numberTree.get(id) as unknown[];

    const updateElement = (kid: int, pageKid: Dict, kidRef: Ref) => {
      const elems = idToElements.get(kid);
      if (elems) {
        const parentRef = pageKid.getRaw("P");
        const parentDict = xref.fetchIfRef(parentRef);
        if (parentRef instanceof Ref && parentDict instanceof Dict) {
          // It should always the case, but we check just in case.
          const params = { ref: kidRef, dict: pageKid };
          for (const element of elems) {
            element.structTreeParent = params;
          }
        }
        return true;
      }
      return false;
    };
    for (const kidRef of parentArray) {
      if (!(kidRef instanceof Ref)) {
        continue;
      }
      const pageKid = xref.fetch(kidRef) as Dict;
      const k = pageKid.get("K");
      if (Number.isInteger(k)) {
        updateElement(k as int, pageKid, kidRef);
        continue;
      }

      if (!Array.isArray(k)) {
        continue;
      }
      for (let kid of k) {
        kid = xref.fetchIfRef(kid);
        if (
          Number.isInteger(kid) && updateElement(kid as int, pageKid, kidRef)
        ) {
          break;
        }
        if (!(kid instanceof Dict)) {
          continue;
        }
        if (!isName(kid.get("Type"), "MCR")) {
          break;
        }
        const mcid = kid.get("MCID") as int;
        if (Number.isInteger(mcid) && updateElement(mcid, pageKid, kidRef)) {
          break;
        }
      }
    }
  }

  static async #updateParentTag({
    structTreeParent,
    tagDict,
    newTagRef,
    // fallbackRef,
    structTreeRootRef,
    fallbackKids,
    xref,
    // newRefs,
    // buffer,
    cache,
  }: UpdateParentTagP_) {
    //kkkk TOCLEANUP
    // // We get the parent of the tag.
    // const parentRef = dict.getRaw("P") as Ref;
    // let parentDict = xref.fetchIfRef(parentRef) as Dict;

    // tagDict.set("P", parentRef);

    // // We get the kids in order to insert a new tag at the right position.
    // let saveParentDict = false;
    // let parentKids: Ref[] | Dict;
    // let parentKidsRef = parentDict.getRaw("K") as Ref[] | Dict | Ref;
    // if (!(parentKidsRef instanceof Ref)) {
    //   parentKids = parentKidsRef;
    //   parentKidsRef = xref.getNewTemporaryRef();
    //   parentDict = parentDict.clone();
    //   parentDict.set("K", parentKidsRef);
    //   saveParentDict = true;
    // } else {
    //   parentKids = xref.fetch(parentKidsRef) as Ref[] | Dict;
    // }

    // if (Array.isArray(parentKids)) {
    //   const index = parentKids.indexOf(ref);
    //   if (index >= 0) {
    //     parentKids = parentKids.slice();
    //     parentKids.splice(index + 1, 0, newTagRef);
    //   } else {
    //     warn("Cannot update the struct tree: parent kid not found.");
    //     tagDict.set("P", fallbackRef);
    //     return;
    //   }
    // } else if (parentKids instanceof Dict) {
    //   parentKids = [parentKidsRef, newTagRef];
    //   parentKidsRef = xref.getNewTemporaryRef();
    //   parentDict.set("K", parentKidsRef);
    //   saveParentDict = true;
    // }

    // buffer.length = 0;
    // await writeObject(parentKidsRef, parentKids, buffer, xref);
    // newRefs.push({ ref: parentKidsRef, data: buffer.join("") });

    // if (!saveParentDict) {
    //   return;
    // }

    // buffer.length = 0;
    // await writeObject(parentRef, parentDict, buffer, xref);
    // newRefs.push({ ref: parentRef, data: buffer.join("") });

    let ref: Ref | undefined;
    let parentRef: Ref | undefined;
    if (structTreeParent) {
      ({ ref } = structTreeParent);

      // We get the parent of the tag.
      parentRef = structTreeParent.dict.getRaw("P") as Ref || structTreeRootRef;
    } else {
      parentRef = structTreeRootRef;
    }

    tagDict.set("P", parentRef);

    // We get the kids in order to insert a new tag at the right position.
    const parentDict = xref.fetchIfRef(parentRef) as Dict | undefined;
    if (!parentDict) {
      fallbackKids!.push(newTagRef);
      return;
    }

    let cachedParentDict = cache.get(parentRef!) as Dict | undefined;
    if (!cachedParentDict) {
      cachedParentDict = parentDict.clone();
      cache.put(parentRef!, cachedParentDict);
    }
    const parentKidsRaw = cachedParentDict.getRaw("K") as number | Ref;
    let cachedParentKids = parentKidsRaw instanceof Ref
      ? cache.get(parentKidsRaw)
      : undefined;
    if (!cachedParentKids) {
      cachedParentKids = xref.fetchIfRef(parentKidsRaw) as
        | Dict
        | (number | Ref)[]
        | undefined;
      cachedParentKids = Array.isArray(cachedParentKids)
        ? cachedParentKids.slice()
        : [parentKidsRaw];
      const parentKidsRef = xref.getNewTemporaryRef();
      cachedParentDict.set("K", parentKidsRef);
      cache.put(parentKidsRef, cachedParentKids);
    }

    const index = (cachedParentKids as (number | Ref)[]).indexOf(ref!);
    (cachedParentKids as (number | Ref)[]).splice(
      index >= 0 ? index + 1 : (cachedParentKids as (number | Ref)[]).length,
      0,
      newTagRef,
    );
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
        return undefined;
      }

      return new StructElement({
        type: StructElementType.PAGE_CONTENT,
        mcid: kid as number,
        pageObjId,
      });
    }

    // Find the dictionary for the kid.
    let kidDict; // Table 324
    if (kid instanceof Ref) {
      kidDict = this.dict.xref!.fetch(kid) as Dict;
    } else if (kid instanceof Dict) {
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
      ? (kidDict.get("Type") as Name).name
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
        mcid: kidDict.get("MCID") as number,
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
  parse(pageRef: Ref | undefined) {
    if (!this.root || !this.rootDict) {
      return;
    }

    const parentTree = this.rootDict.get("ParentTree") as Ref;
    if (!parentTree) {
      return;
    }
    const id = this.pageDict.get("StructParents") as number;
    const ids = pageRef instanceof Ref &&
      this.root.structParentIds?.get(pageRef);
    if (!Number.isInteger(id) && !ids) {
      return;
    }

    const map = new Map<Dict, StructElementNode>();
    const numberTree = new NumberTree(parentTree, this.rootDict.xref!);

    if (Number.isInteger(id)) {
      const parentArray = numberTree.get(id);
      if (Array.isArray(parentArray)) {
        for (const ref of parentArray) {
          if (ref instanceof Ref) {
            this.addNode(this.rootDict.xref!.fetch(ref) as Dict, map);
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
        const elem = this.addNode(
          this.rootDict.xref!.fetchIfRef(obj) as Dict,
          map,
        );
        // console.log("🚀 ~ StructTreePage ~ parse ~ elem?.kids:");
        // console.dir(elem?.kids);
        if (
          elem?.kids?.length === 1 &&
          elem.kids[0].type === StructElementType.OBJECT
        ) {
          // The node in the struct tree is wrapping an object (annotation
          // or xobject), so we need to update the type of the node to match
          // the type of the object.
          elem.kids[0].type = type;
        }
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
        // console.log("🚀 ~ StructTreePage ~ getserializable ~ kid:", kid);
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
        } else if (kid.type === StructElementType.ANNOTATION) {
          obj.children.push({
            type: "annotation",
            id: `${AnnotationPrefix}${kid.refObjId}`,
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
