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

import { PDFJSDev, SKIP_BABEL, TESTING } from "@fe-src/global.ts";
import { fail } from "@fe-src/lib/util/trace.ts";
import { MurmurHash3_64 } from "../shared/murmurhash3.ts";
import { objectFromMap } from "../shared/util.ts";
import type {
  AnnotStorageRecord,
  AnnotStorageValue,
  ASVKey,
} from "./annotation_layer.ts";
import { AnnotationEditor } from "./editor/editor.ts";
/*80--------------------------------------------------------------------------*/

export type Serializable = {
  map?: AnnotStorageRecord | undefined;
  hash: string;
  transfers?: Transferable[] | undefined;
};

export const SerializableEmpty: Serializable = Object.freeze({
  hash: "",
});

/**
 * Key/value storage for annotation data in forms.
 */
export class AnnotationStorage {
  #modified = false;

  #storage: AnnotStorageRecord = new Map();
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
    | ((type?: "freetext" | "ink" | "stamp" | undefined) => void)
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

  setAll(obj: Record<string, AnnotStorageValue>) {
    for (const [key, val] of Object.entries(obj)) {
      this.setValue(key, val);
    }
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
  get serializable(): Serializable {
    if (this.#storage.size === 0) {
      return SerializableEmpty;
    }
    const map: AnnotStorageRecord = new Map(),
      hash = new MurmurHash3_64(),
      transfers = [];
    const context = Object.create(null);
    let hasBitmap = false;

    for (const [key, val] of this.#storage) {
      const serialized = val instanceof AnnotationEditor
        ? val.serialize(/* isForCopying = */ false, context)
        : val;
      if (serialized) {
        map.set(key, serialized);

        hash.update(`${key}:${JSON.stringify(serialized)}`);
        hasBitmap ||= !!serialized.bitmap;
      }
    }

    if (hasBitmap) {
      // We must transfer the bitmap data separately, since it can be changed
      // during serialization with SVG images.
      for (const value of map.values()) {
        if (value.bitmap) {
          transfers.push(value.bitmap);
        }
      }
    }

    return map.size > 0
      ? { map, hash: hash.hexdigest(), transfers }
      : SerializableEmpty;
  }
}

/**
 * A special `AnnotationStorage` for use during printing, where the serializable
 * data is *frozen* upon initialization, to prevent scripting from modifying its
 * contents. (Necessary since printing is triggered synchronously in browsers.)
 */
export class PrintAnnotationStorage extends AnnotationStorage {
  #serializable: Serializable;

  constructor(parent: AnnotationStorage) {
    super();
    const { map, hash, transfers } = parent.serializable;
    // Create a *copy* of the data, since Objects are passed by reference in JS.
    const clone = structuredClone(
      map,
      (PDFJSDev || SKIP_BABEL || TESTING) && transfers
        ? { transfer: transfers }
        : undefined,
    );
    this.#serializable = { map: clone, hash, transfers };
  }

  // eslint-disable-next-line getter-return
  override get print(): PrintAnnotationStorage {
    return fail("Should not call PrintAnnotationStorage.print");
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
