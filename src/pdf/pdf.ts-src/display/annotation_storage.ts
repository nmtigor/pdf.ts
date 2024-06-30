/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/annotation_storage.ts
 * @license Apache-2.0
 ******************************************************************************/

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

import type { uint } from "@fe-lib/alias.ts";
import { fail } from "@fe-lib/util/trace.ts";
import { MurmurHash3_64 } from "../shared/murmurhash3.ts";
import type { AnnotationEditorName } from "../shared/util.ts";
import { objectFromMap } from "../shared/util.ts";
import type {
  AnnotStorageRecord,
  AnnotStorageValue,
} from "./annotation_layer.ts";
import type { TFD_AnnotationEditor } from "./editor/editor.ts";
import { AnnotationEditor } from "./editor/editor.ts";
/*80--------------------------------------------------------------------------*/

export type Serializable = {
  map?: AnnotStorageRecord | undefined;
  hash: string;
  transfer?: Transferable[] | undefined;
};

export const SerializableEmpty: Serializable = Object.freeze({
  hash: "",
});

/**
 * Key/value storage for annotation data in forms.
 */
export class AnnotationStorage {
  #modified = false;

  #storage: Map<string, AnnotStorageValue | AnnotationEditor> = new Map();
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
    | ((type?: AnnotationEditorName | undefined) => void)
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
  getRawValue(key: string): AnnotStorageValue | AnnotationEditor | undefined {
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
  setValue(key: string, value: AnnotStorageValue | AnnotationEditor) {
    const obj = this.#storage.get(key);
    let modified = false;
    if (obj !== undefined) {
      type K_ = keyof (AnnotStorageValue | AnnotationEditor);
      for (const [entry, val] of Object.entries(value)) {
        if (obj[entry as K_] !== val) {
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
      transfer = [];
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
          transfer.push(value.bitmap);
        }
      }
    }

    return map.size > 0
      ? { map, hash: hash.hexdigest(), transfer }
      : SerializableEmpty;
  }

  get editorStats(): Record<AnnotationEditorName, TFD_AnnotationEditor> {
    let stats: Record<
      AnnotationEditorName,
      Map<string, Map<unknown, uint>> | TFD_AnnotationEditor | undefined
    >;
    const typeToEditor = new Map<
      AnnotationEditorName,
      typeof AnnotationEditor
    >();
    for (const value of this.#storage.values()) {
      if (!(value instanceof AnnotationEditor)) {
        continue;
      }
      const editorStats = value.telemetryFinalData;
      if (!editorStats) {
        continue;
      }
      const { type } = editorStats;
      if (!typeToEditor.has(type)) {
        typeToEditor.set(
          type,
          Object.getPrototypeOf(value).constructor as typeof AnnotationEditor,
        );
      }
      stats ||= Object.create(null);
      const map = (stats[type] ||= new Map()) as Map<
        string,
        Map<unknown, uint>
      >;
      for (const [key, val] of Object.entries(editorStats)) {
        if (key === "type") {
          continue;
        }
        let counters = map.get(key);
        if (!counters) {
          counters = new Map();
          map.set(key, counters);
        }
        const count = counters.get(val) ?? 0;
        counters.set(val, count + 1);
      }
    }
    for (const [type, editor] of typeToEditor) {
      stats![type] = editor.computeTelemetryFinalData(
        stats![type] as Map<string, Map<unknown, uint>>,
      );
    }
    return stats! as Record<AnnotationEditorName, TFD_AnnotationEditor>;
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
    const { map, hash, transfer } = parent.serializable;
    // Create a *copy* of the data, since Objects are passed by reference in JS.
    const clone = structuredClone(map, transfer ? { transfer } : undefined);

    this.#serializable = { map: clone, hash, transfer };
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
