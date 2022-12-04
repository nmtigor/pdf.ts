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

import { assert } from "../../../lib/util/trace.ts";
import { MurmurHash3_64 } from "../shared/murmurhash3.ts";
import { objectFromMap } from "../shared/util.ts";
import {
  AnnotStorageRecord,
  type AnnotStorageValue,
  type ASVKey,
} from "./annotation_layer.ts";
import { AnnotationEditor } from "./editor/editor.ts";
/*80--------------------------------------------------------------------------*/

/**
 * Key/value storage for annotation data in forms.
 */
export class AnnotationStorage {
  #modified = false;

  #storage: AnnotStorageRecord = new Map<string, AnnotStorageValue>();
  get size() {
    return this.#storage.size;
  }

  // Callbacks to signal when the modification state is set or reset.
  // This is used by the viewer to only bind on `beforeunload` if forms
  // are actually edited to prevent doing so unconditionally since that
  // can have undesirable effects.
  onSetModified?: () => void;
  onResetModified?: () => void;
  onAnnotationEditor:
    | ((type?: "freetext" | "ink" | undefined) => void)
    | undefined;

  /**
   * Get the value for a given key if it exists, or return the default value.
   */
  getValue(key: string, defaultValue: AnnotStorageValue) {
    const value = this.#storage.get(key);
    if (value === undefined) {
      return defaultValue;
    }

    return Object.assign(defaultValue, value);
  }

  /**
   * Get the value for a given key.
   */
  getRawValue(key: string) {
    return this.#storage.get(key);
  }

  /**
   * Remove a value from the storage.
   */
  remove(key: string) {
    this.#storage.delete(key);

    if (this.#storage.size === 0) {
      this.resetModified();
    }

    if (typeof this.onAnnotationEditor === "function") {
      for (const value of this.#storage.values()) {
        if (value instanceof AnnotationEditor) {
          return;
        }
      }
      this.onAnnotationEditor(undefined);
    }
  }

  /**
   * Set the value for a given key
   */
  setValue(key: string, value: AnnotStorageValue) {
    const obj = this.#storage.get(key);
    let modified = false;
    if (obj !== undefined) {
      for (const [entry, val] of Object.entries(value)) {
        if (obj[entry as ASVKey] !== val) {
          modified = true;
          (obj as any)[entry] = val;
        }
      }
    } else {
      modified = true;
      this.#storage.set(key, value);
    }
    if (modified) {
      this.#setModified();
    }

    if (
      value instanceof AnnotationEditor &&
      typeof this.onAnnotationEditor === "function"
    ) {
      this.onAnnotationEditor(
        (value.constructor as typeof AnnotationEditor)._type,
      );
    }
  }

  /**
   * Check if the storage contains the given key.
   */
  has(key: string): boolean {
    return this.#storage.has(key);
  }

  getAll() {
    return this.#storage.size > 0 ? objectFromMap(this.#storage) : undefined;
  }

  #setModified() {
    if (!this.#modified) {
      this.#modified = true;
      if (typeof this.onSetModified === "function") {
        this.onSetModified();
      }
    }
  }

  resetModified() {
    if (this.#modified) {
      this.#modified = false;
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
    if (this.#storage.size === 0) {
      return undefined;
    }
    const clone: AnnotStorageRecord = new Map();

    for (const [key, val] of this.#storage) {
      const serialized = val instanceof AnnotationEditor
        ? val.serialize()
        : val;
      if (serialized) {
        clone.set(key, <AnnotStorageValue> serialized);
      }
    }
    return clone;
  }

  /**
   * PLEASE NOTE: Only intended for usage within the API itself.
   * @ignore
   */
  static getHash(map: AnnotStorageRecord | undefined) {
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
  #serializable: AnnotStorageRecord | undefined;

  constructor(parent: AnnotationStorage) {
    super();
    // Create a *copy* of the data, since Objects are passed by reference in JS.
    this.#serializable = structuredClone(parent.serializable);
  }

  // eslint-disable-next-line getter-return
  override get print(): PrintAnnotationStorage {
    assert(0, "Should not call PrintAnnotationStorage.print");
    return <any> 0;
  }

  /**
   * PLEASE NOTE: Only intended for usage within the API itself.
   * @ignore
   */
  override get serializable() {
    return this.#serializable;
  }
}
/*80--------------------------------------------------------------------------*/
