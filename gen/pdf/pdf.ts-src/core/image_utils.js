/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
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
import { assert } from "../../../lib/util/trace.js";
import { shadow, warn } from "../shared/util.js";
import { RefSetCache } from "./primitives.js";
/*81---------------------------------------------------------------------------*/
class BaseLocalCache {
    _onlyRefs;
    nameRefMap$;
    imageMap$;
    imageCache$ = new RefSetCache();
    constructor(options) {
        this._onlyRefs = (options && options.onlyRefs) === true;
        if (!this._onlyRefs) {
            this.nameRefMap$ = new Map();
            this.imageMap$ = new Map();
        }
    }
    getByName(name) {
        if (this._onlyRefs) {
            assert(0, "Should not call `getByName` method.");
        }
        const ref = this.nameRefMap$.get(name);
        if (ref) {
            return this.getByRef(ref);
        }
        return this.imageMap$.get(name) || null;
    }
    /** @final */
    getByRef(ref) {
        return this.imageCache$.get(ref) || null;
    }
}
export class LocalImageCache extends BaseLocalCache {
    /** @implements */
    set(name, ref = null, data) {
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
    /** @implements */
    set(name = null, ref = null, data) {
        if (typeof name !== "string" && !ref) {
            throw new Error('LocalColorSpaceCache.set - expected "name" and/or "ref" argument.');
        }
        if (ref) {
            if (this.imageCache$.has(ref)) {
                return;
            }
            if (name !== null) {
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
    /** @implements */
    set(name = null, ref, data) {
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
    /** @implements */
    set(name, ref = null, data) {
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
    /** @implements */
    set(name, ref = null, data) {
        if (!ref)
            throw new Error('LocalTilingPatternCache.set - expected "ref" argument.');
        if (this.imageCache$.has(ref))
            return;
        this.imageCache$.put(ref, data);
    }
}
export class GlobalImageCache {
    static get NUM_PAGES_THRESHOLD() {
        return shadow(this, "NUM_PAGES_THRESHOLD", 2);
    }
    static get MIN_IMAGES_TO_CACHE() {
        return shadow(this, "MIN_IMAGES_TO_CACHE", 10);
    }
    static get MAX_BYTE_SIZE() {
        return shadow(this, "MAX_BYTE_SIZE", /* Forty megabytes = */ 40e6);
    }
    #refCache = new RefSetCache();
    #imageCache = new RefSetCache();
    constructor() {
        // if (
        //   typeof PDFJSDev === "undefined" ||
        //   PDFJSDev.test("!PRODUCTION || TESTING")
        // ) {
        assert(GlobalImageCache.NUM_PAGES_THRESHOLD > 1, "GlobalImageCache - invalid NUM_PAGES_THRESHOLD constant.");
        // }
    }
    get _byteSize() {
        let byteSize = 0;
        this.#imageCache.forEach(imageData => {
            byteSize += imageData.byteSize;
        });
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
    shouldCache(ref, pageIndex) {
        const pageIndexSet = this.#refCache.get(ref);
        const numPages = pageIndexSet
            ? pageIndexSet.size + (pageIndexSet.has(pageIndex) ? 0 : 1)
            : 1;
        if (numPages < GlobalImageCache.NUM_PAGES_THRESHOLD) {
            return false;
        }
        if (!this.#imageCache.has(ref) && this._cacheLimitReached) {
            return false;
        }
        return true;
    }
    addPageIndex(ref, pageIndex) {
        let pageIndexSet = this.#refCache.get(ref);
        if (!pageIndexSet) {
            pageIndexSet = new Set();
            this.#refCache.put(ref, pageIndexSet);
        }
        pageIndexSet.add(pageIndex);
    }
    /**
     * PLEASE NOTE: Must be called *after* the `setData` method.
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
    getData(ref, pageIndex) {
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
    setData(ref, data) {
        if (!this.#refCache.has(ref)) {
            throw new Error('GlobalImageCache.setData - expected "addPageIndex" to have been called.');
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
    clear(onlyData = false) {
        if (!onlyData) {
            this.#refCache.clear();
        }
        this.#imageCache.clear();
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=image_utils.js.map