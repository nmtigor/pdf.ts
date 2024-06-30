/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/image_utils.ts
 * @license Apache-2.0
 ******************************************************************************/
var _a;
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
import { assert, fail } from "../../../lib/util/trace.js";
import { PDFJSDev, TESTING } from "../../../global.js";
import { MAX_IMAGE_SIZE_TO_CACHE, warn } from "../shared/util.js";
import { RefSet, RefSetCache } from "./primitives.js";
/*80--------------------------------------------------------------------------*/
class BaseLocalCache {
    #onlyRefs;
    nameRefMap$;
    imageMap$;
    imageCache$ = new RefSetCache();
    constructor(options) {
        this.#onlyRefs = options?.onlyRefs === true;
        if (!this.#onlyRefs) {
            this.nameRefMap$ = new Map();
            this.imageMap$ = new Map();
        }
    }
    /** @final */
    getByName(name) {
        if (this.#onlyRefs) {
            fail("Should not call `getByName` method.");
        }
        const ref = this.nameRefMap$.get(name);
        if (ref) {
            return this.getByRef(ref);
        }
        return this.imageMap$.get(name) || undefined;
    }
    /** @final */
    getByRef(ref) {
        return this.imageCache$.get(ref) || undefined;
    }
}
export class LocalImageCache extends BaseLocalCache {
    /** @implement */
    set(name, ref = undefined, data) {
        if (typeof name !== "string") {
            throw new Error('LocalImageCache.set - expected "name" argument.');
        }
        if (ref) {
            if (this.imageCache$.has(ref)) {
                return;
            }
            this.nameRefMap$.set(name, ref);
            this.imageCache$.put(ref, data);
            return;
        }
        // name
        if (this.imageMap$.has(name)) {
            return;
        }
        this.imageMap$.set(name, data);
    }
}
export class LocalColorSpaceCache extends BaseLocalCache {
    /** @implement */
    set(name = undefined, ref = undefined, data) {
        if (typeof name !== "string" && !ref) {
            throw new Error('LocalColorSpaceCache.set - expected "name" and/or "ref" argument.');
        }
        if (ref) {
            if (this.imageCache$.has(ref)) {
                return;
            }
            if (name !== undefined) {
                // Optional when `ref` is defined.
                this.nameRefMap$.set(name, ref);
            }
            this.imageCache$.put(ref, data);
            return;
        }
        // name
        if (this.imageMap$.has(name)) {
            return;
        }
        this.imageMap$.set(name, data);
    }
}
export class LocalFunctionCache extends BaseLocalCache {
    constructor() {
        super({ onlyRefs: true });
    }
    /** @implement */
    set(name = undefined, ref, data) {
        if (!ref) {
            throw new Error('LocalFunctionCache.set - expected "ref" argument.');
        }
        if (this.imageCache$.has(ref)) {
            return;
        }
        this.imageCache$.put(ref, data);
    }
}
export class LocalGStateCache extends BaseLocalCache {
    /** @implement */
    set(name, ref = undefined, data) {
        if (typeof name !== "string") {
            throw new Error('LocalGStateCache.set - expected "name" argument.');
        }
        if (ref) {
            if (this.imageCache$.has(ref)) {
                return;
            }
            this.nameRefMap$.set(name, ref);
            this.imageCache$.put(ref, data);
            return;
        }
        // name
        if (this.imageMap$.has(name)) {
            return;
        }
        this.imageMap$.set(name, data);
    }
}
export class LocalTilingPatternCache extends BaseLocalCache {
    constructor(options) {
        super({ onlyRefs: true });
    }
    /** @implement */
    set(name, ref = undefined, data) {
        if (!ref) {
            throw new Error('LocalTilingPatternCache.set - expected "ref" argument.');
        }
        if (this.imageCache$.has(ref)) {
            return;
        }
        this.imageCache$.put(ref, data);
    }
}
export class RegionalImageCache extends BaseLocalCache {
    constructor() {
        super({ onlyRefs: true });
    }
    set(name, ref, data) {
        if (!ref) {
            throw new Error('RegionalImageCache.set - expected "ref" argument.');
        }
        if (this.imageCache$.has(ref)) {
            return;
        }
        this.imageCache$.put(ref, data);
    }
}
export class GlobalImageCache {
    static NUM_PAGES_THRESHOLD = 2;
    static MIN_IMAGES_TO_CACHE = 10;
    static MAX_BYTE_SIZE = 5 * MAX_IMAGE_SIZE_TO_CACHE;
    #refCache = new RefSetCache();
    #imageCache = new RefSetCache();
    #decodeFailedSet = new RefSet();
    addDecodeFailed(ref) {
        this.#decodeFailedSet.put(ref);
    }
    hasDecodeFailed(ref) {
        return this.#decodeFailedSet.has(ref);
    }
    constructor() {
        /*#static*/  {
            assert(_a.NUM_PAGES_THRESHOLD > 1, "GlobalImageCache - invalid NUM_PAGES_THRESHOLD constant.");
        }
    }
    get #byteSize() {
        let byteSize = 0;
        for (const imageData of this.#imageCache) {
            byteSize += imageData.byteSize;
        }
        return byteSize;
    }
    get #cacheLimitReached() {
        if (this.#imageCache.size < _a.MIN_IMAGES_TO_CACHE) {
            return false;
        }
        if (this.#byteSize < _a.MAX_BYTE_SIZE) {
            return false;
        }
        return true;
    }
    /** @final */
    shouldCache(ref, pageIndex) {
        let pageIndexSet = this.#refCache.get(ref);
        if (!pageIndexSet) {
            pageIndexSet = new Set();
            this.#refCache.put(ref, pageIndexSet);
        }
        pageIndexSet.add(pageIndex);
        if (pageIndexSet.size < _a.NUM_PAGES_THRESHOLD) {
            return false;
        }
        if (!this.#imageCache.has(ref) && this.#cacheLimitReached) {
            return false;
        }
        return true;
    }
    /**
     * PLEASE NOTE: Must be called *after* the `setData` method.
     * @final
     */
    addByteSize(ref, byteSize) {
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
    getData(ref, pageIndex) {
        const pageIndexSet = this.#refCache.get(ref);
        if (!pageIndexSet) {
            return undefined;
        }
        if (pageIndexSet.size < _a.NUM_PAGES_THRESHOLD) {
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
    setData(ref, data) {
        if (!this.#refCache.has(ref)) {
            throw new Error('GlobalImageCache.setData - expected "shouldCache" to have been called.');
        }
        if (this.#imageCache.has(ref)) {
            return;
        }
        if (this.#cacheLimitReached) {
            warn("GlobalImageCache.setData - cache limit reached.");
            return;
        }
        this.#imageCache.put(ref, data);
    }
    /** @fianl */
    clear(onlyData = false) {
        if (!onlyData) {
            this.#decodeFailedSet.clear();
            this.#refCache.clear();
        }
        this.#imageCache.clear();
    }
}
_a = GlobalImageCache;
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=image_utils.js.map