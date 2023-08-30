/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2019 Mozilla Foundation
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

import { PDFJSDev, TESTING } from "../../../global.ts";
import { assert } from "../../../lib/util/trace.ts";
import { MAX_IMAGE_SIZE_TO_CACHE, OPS, warn } from "../shared/util.ts";
import type { ColorSpace } from "./colorspace.ts";
import type { ImgData, MarkedContentProps } from "./evaluator.ts";
import type { ParsedFunction } from "./function.ts";
import type { OpListIR } from "./operator_list.ts";
import type { Dict, Obj, Ref } from "./primitives.ts";
import { RefSetCache } from "./primitives.ts";
/*80--------------------------------------------------------------------------*/

abstract class BaseLocalCache<CD> {
  readonly #onlyRefs;
  protected nameRefMap$;
  protected imageMap$;
  protected imageCache$ = new RefSetCache<CD>();

  constructor(options?: { onlyRefs: boolean }) {
    this.#onlyRefs = options?.onlyRefs === true;

    if (!this.#onlyRefs) {
      this.nameRefMap$ = new Map<string, string | Ref>();
      this.imageMap$ = new Map<string, CD>();
    }
  }

  /** @final */
  getByName(name: string) {
    if (this.#onlyRefs) {
      assert(0, "Should not call `getByName` method.");
    }
    const ref = this.nameRefMap$!.get(name);
    if (ref) {
      return this.getByRef(ref);
    }
    return this.imageMap$!.get(name) || undefined;
  }

  /** @final */
  getByRef(ref: string | Ref) {
    return this.imageCache$.get(ref) || undefined;
  }

  abstract set(
    name: string | undefined,
    ref: Ref | string | undefined,
    data: CD,
  ): void;
}

export interface Image_LI_CData {
  fn: OPS.paintImageXObject;
  args: [objId: string, width: number, height: number];
  optionalContent: MarkedContentProps | undefined;
}
export interface ImageMask_LI_CData {
  fn: OPS.paintImageMaskXObject;
  args: [ImgData];
  optionalContent: MarkedContentProps | undefined;
}
export interface SolidColorImageMask_LI_CData {
  fn: OPS.paintSolidColorImageMask;
  args: ImgData[];
  optionalContent: MarkedContentProps | undefined;
}
export type LI_CData =
  | Image_LI_CData
  | ImageMask_LI_CData
  | SolidColorImageMask_LI_CData;
export class LocalImageCache extends BaseLocalCache<LI_CData | boolean> {
  /** @implement */
  set(
    name: string,
    ref: Ref | string | undefined = undefined,
    data: LI_CData | boolean,
  ) {
    if (typeof name !== "string") {
      throw new Error('LocalImageCache.set - expected "name" argument.');
    }
    if (ref) {
      if (this.imageCache$.has(ref)) {
        return;
      }
      this.nameRefMap$!.set(name, ref);
      this.imageCache$.put(ref, data);
      return;
    }
    // name
    if (this.imageMap$!.has(name)) {
      return;
    }
    this.imageMap$!.set(name, data);
  }
}

type LCS_CData = ColorSpace;
export class LocalColorSpaceCache extends BaseLocalCache<LCS_CData> {
  /** @implement */
  set(
    name: string | undefined = undefined,
    ref: Ref | string | undefined = undefined,
    data: LCS_CData,
  ) {
    if (typeof name !== "string" && !ref) {
      throw new Error(
        'LocalColorSpaceCache.set - expected "name" and/or "ref" argument.',
      );
    }
    if (ref) {
      if (this.imageCache$.has(ref)) {
        return;
      }
      if (name !== undefined) {
        // Optional when `ref` is defined.
        this.nameRefMap$!.set(name, ref);
      }
      this.imageCache$.put(ref, data);
      return;
    }
    // name
    if (this.imageMap$!.has(name!)) {
      return;
    }
    this.imageMap$!.set(name!, data);
  }
}

type LF_CData = ParsedFunction;
export class LocalFunctionCache extends BaseLocalCache<LF_CData> {
  constructor() {
    super({ onlyRefs: true });
  }

  /** @implement */
  set(
    name: string | undefined = undefined,
    ref: Ref | string | undefined,
    data: LF_CData,
  ) {
    if (!ref) {
      throw new Error('LocalFunctionCache.set - expected "ref" argument.');
    }
    if (this.imageCache$.has(ref)) {
      return;
    }
    this.imageCache$.put(ref, data);
  }
}

export type LGS_CData = [string, Obj][];
export class LocalGStateCache extends BaseLocalCache<LGS_CData | boolean> {
  /** @implement */
  set(
    name: string,
    ref: Ref | string | undefined = undefined,
    data: LGS_CData | boolean,
  ) {
    if (typeof name !== "string") {
      throw new Error('LocalGStateCache.set - expected "name" argument.');
    }
    if (ref) {
      if (this.imageCache$.has(ref)) {
        return;
      }
      this.nameRefMap$!.set(name, ref);
      this.imageCache$.put(ref, data);
      return;
    }
    // name
    if (this.imageMap$!.has(name)) {
      return;
    }
    this.imageMap$!.set(name, data);
  }
}

type LTP_CData = {
  operatorListIR: OpListIR;
  dict: Dict;
};
export class LocalTilingPatternCache extends BaseLocalCache<LTP_CData> {
  constructor(options?: unknown) {
    super({ onlyRefs: true });
  }

  /** @implement */
  set(
    name: string | undefined,
    ref: Ref | string | undefined = undefined,
    data: LTP_CData,
  ) {
    if (!ref) {
      throw new Error('LocalTilingPatternCache.set - expected "ref" argument.');
    }
    if (this.imageCache$.has(ref)) {
      return;
    }
    this.imageCache$.put(ref, data);
  }
}

type RIC_CData = unknown;
export class RegionalImageCache extends BaseLocalCache<RIC_CData> {
  constructor() {
    super({ onlyRefs: true });
  }

  set(
    name: string | undefined,
    ref: Ref | string | undefined,
    data: RIC_CData,
  ) {
    if (!ref) {
      throw new Error('RegionalImageCache.set - expected "ref" argument.');
    }
    if (this.imageCache$.has(ref)) {
      return;
    }
    this.imageCache$.put(ref, data);
  }
}

type GI_CData = Image_LI_CData & {
  objId: string;
  byteSize?: number;
};
export class GlobalImageCache {
  static readonly NUM_PAGES_THRESHOLD = 2;

  static readonly MIN_IMAGES_TO_CACHE = 10;

  static readonly MAX_BYTE_SIZE = 5 * MAX_IMAGE_SIZE_TO_CACHE;

  #refCache = new RefSetCache<Set<number>>();
  #imageCache = new RefSetCache<GI_CData>();

  constructor() {
    /*#static*/ if (PDFJSDev || TESTING) {
      assert(
        GlobalImageCache.NUM_PAGES_THRESHOLD > 1,
        "GlobalImageCache - invalid NUM_PAGES_THRESHOLD constant.",
      );
    }
  }

  get _byteSize() {
    let byteSize = 0;
    for (const imageData of this.#imageCache) {
      byteSize += imageData.byteSize!;
    }
    return byteSize;
  }

  get _cacheLimitReached() {
    if (this.#imageCache.size < GlobalImageCache.MIN_IMAGES_TO_CACHE) {
      return false;
    }
    if (this._byteSize < GlobalImageCache.MAX_BYTE_SIZE) {
      return false;
    }
    return true;
  }

  /** @final */
  shouldCache(ref: string | Ref, pageIndex: number) {
    let pageIndexSet = this.#refCache.get(ref);
    if (!pageIndexSet) {
      pageIndexSet = new Set();
      this.#refCache.put(ref, pageIndexSet);
    }
    pageIndexSet.add(pageIndex);

    if (pageIndexSet.size < GlobalImageCache.NUM_PAGES_THRESHOLD) {
      return false;
    }
    if (!this.#imageCache.has(ref) && this._cacheLimitReached) {
      return false;
    }
    return true;
  }

  /**
   * PLEASE NOTE: Must be called *after* the `setData` method.
   * @final
   */
  addByteSize(ref: string | Ref, byteSize: number) {
    const imageData = this.#imageCache.get(ref);
    if (!imageData) {
      return; // The image data isn't cached (the limit was reached).
    }
    if (imageData.byteSize) {
      return; // The byte-size has already been set.
    }
    imageData.byteSize = byteSize;
  }

  /** @final */
  getData(ref: Ref, pageIndex: number) {
    const pageIndexSet = this.#refCache.get(ref);
    if (!pageIndexSet) {
      return undefined;
    }
    if (pageIndexSet.size < GlobalImageCache.NUM_PAGES_THRESHOLD) {
      return undefined;
    }
    const imageData = this.#imageCache.get(ref);
    if (!imageData) {
      return undefined;
    }
    // Ensure that we keep track of all pages containing the image reference.
    pageIndexSet.add(pageIndex);

    return imageData;
  }

  /** @final */
  setData(ref: Ref | string, data: GI_CData) {
    if (!this.#refCache.has(ref)) {
      throw new Error(
        'GlobalImageCache.setData - expected "shouldCache" to have been called.',
      );
    }
    if (this.#imageCache.has(ref)) {
      return;
    }
    if (this._cacheLimitReached) {
      warn("GlobalImageCache.setData - cache limit reached.");
      return;
    }
    this.#imageCache.put(ref, data);
  }

  /** @fianl */
  clear(onlyData = false) {
    if (!onlyData) {
      this.#refCache.clear();
    }
    this.#imageCache.clear();
  }
}
/*80--------------------------------------------------------------------------*/
