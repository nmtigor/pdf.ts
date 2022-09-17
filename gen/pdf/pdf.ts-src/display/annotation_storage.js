/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
/* Copyright 2020 Mozilla Foundation
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
import { MurmurHash3_64 } from "../shared/murmurhash3.js";
import { objectFromMap } from "../shared/util.js";
import { AnnotationEditor } from "./editor/editor.js";
/*80--------------------------------------------------------------------------*/
/**
 * Key/value storage for annotation data in forms.
 */
export class AnnotationStorage {
    _storage = new Map();
    get size() {
        return this._storage.size;
    }
    _modified = false;
    // Callbacks to signal when the modification state is set or reset.
    // This is used by the viewer to only bind on `beforeunload` if forms
    // are actually edited to prevent doing so unconditionally since that
    // can have undesirable effects.
    onSetModified;
    onResetModified;
    /**
     * Get the value for a given key if it exists, or return the default value.
     */
    getValue(key, defaultValue) {
        const value = this._storage.get(key);
        if (value === undefined) {
            return defaultValue;
        }
        return Object.assign(defaultValue, value);
    }
    /**
     * Get the value for a given key.
     */
    getRawValue(key) {
        return this._storage.get(key);
    }
    /**
     * Remove a value from the storage.
     */
    removeKey(key) {
        this._storage.delete(key);
        if (this._storage.size === 0) {
            this.resetModified();
        }
    }
    /**
     * Set the value for a given key
     */
    setValue(key, value) {
        const obj = this._storage.get(key);
        let modified = false;
        if (obj !== undefined) {
            for (const [entry, val] of Object.entries(value)) {
                if (obj[entry] !== val) {
                    modified = true;
                    obj[entry] = val;
                }
            }
        }
        else {
            modified = true;
            this._storage.set(key, value);
        }
        if (modified) {
            this.#setModified();
        }
    }
    /**
     * Check if the storage contains the given key.
     */
    has(key) {
        return this._storage.has(key);
    }
    getAll() {
        return this._storage.size > 0 ? objectFromMap(this._storage) : undefined;
    }
    #setModified() {
        if (!this._modified) {
            this._modified = true;
            if (typeof this.onSetModified === "function") {
                this.onSetModified();
            }
        }
    }
    resetModified() {
        if (this._modified) {
            this._modified = false;
            if (typeof this.onResetModified === "function") {
                this.onResetModified();
            }
        }
    }
    get print() {
        return new PrintAnnotationStorage(this);
    }
    /**
     * PLEASE NOTE: Only intended for usage within the API itself.
     * @ignore
     */
    get serializable() {
        if (this._storage.size === 0) {
            return undefined;
        }
        const clone = new Map();
        for (const [key, val] of this._storage) {
            const serialized = val instanceof AnnotationEditor
                ? val.serialize()
                : val;
            if (serialized) {
                clone.set(key, serialized);
            }
        }
        return clone;
    }
    /**
     * PLEASE NOTE: Only intended for usage within the API itself.
     * @ignore
     */
    static getHash(map) {
        if (!map) {
            return "";
        }
        const hash = new MurmurHash3_64();
        for (const [key, val] of map) {
            hash.update(`${key}:${JSON.stringify(val)}`);
        }
        return hash.hexdigest();
    }
}
/**
 * A special `AnnotationStorage` for use during printing, where the serializable
 * data is *frozen* upon initialization, to prevent scripting from modifying its
 * contents. (Necessary since printing is triggered synchronously in browsers.)
 */
export class PrintAnnotationStorage extends AnnotationStorage {
    #serializable;
    constructor(parent) {
        super();
        // Create a *copy* of the data, since Objects are passed by reference in JS.
        this.#serializable = structuredClone(parent.serializable);
    }
    // eslint-disable-next-line getter-return
    get print() {
        assert(0, "Should not call PrintAnnotationStorage.print");
        return 0;
    }
    /**
     * PLEASE NOTE: Only intended for usage within the API itself.
     * @ignore
     */
    get serializable() {
        return this.#serializable;
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=annotation_storage.js.map