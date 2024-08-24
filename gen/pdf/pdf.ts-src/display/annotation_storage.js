/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/annotation_storage.ts
 * @license Apache-2.0
 ******************************************************************************/
import { fail } from "../../../lib/util/trace.js";
import { MurmurHash3_64 } from "../shared/murmurhash3.js";
import { objectFromMap, shadow } from "../shared/util.js";
import { AnnotationEditor } from "./editor/editor.js";
export const SerializableEmpty = Object.freeze({ hash: "" });
/**
 * Key/value storage for annotation data in forms.
 */
export class AnnotationStorage {
    #modified = false;
    #modifiedIds;
    #storage = new Map();
    get size() {
        return this.#storage.size;
    }
    // Callbacks to signal when the modification state is set or reset.
    // This is used by the viewer to only bind on `beforeunload` if forms
    // are actually edited to prevent doing so unconditionally since that
    // can have undesirable effects.
    onSetModified;
    onResetModified;
    onAnnotationEditor;
    /**
     * Get the value for a given key if it exists, or return the default value.
     */
    getValue(key, defaultValue) {
        const value = this.#storage.get(key);
        if (value === undefined) {
            return defaultValue;
        }
        return Object.assign(defaultValue, value);
    }
    /**
     * Get the value for a given key.
     */
    getRawValue(key) {
        return this.#storage.get(key);
    }
    /**
     * Remove a value from the storage.
     */
    remove(key) {
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
    setValue(key, value) {
        const obj = this.#storage.get(key);
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
            this.#storage.set(key, value);
        }
        if (modified) {
            this.#setModified();
        }
        if (value instanceof AnnotationEditor &&
            typeof this.onAnnotationEditor === "function") {
            this.onAnnotationEditor(value.constructor._type);
        }
    }
    /**
     * Check if the storage contains the given key.
     */
    has(key) {
        return this.#storage.has(key);
    }
    getAll() {
        return this.#storage.size > 0 ? objectFromMap(this.#storage) : undefined;
    }
    setAll(obj) {
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
    get serializable() {
        if (this.#storage.size === 0) {
            return SerializableEmpty;
        }
        const map = new Map(), hash = new MurmurHash3_64(), transfer = [];
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
    get editorStats() {
        let stats;
        const typeToEditor = new Map();
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
                typeToEditor.set(type, Object.getPrototypeOf(value).constructor);
            }
            stats ||= Object.create(null);
            const map = (stats[type] ||= new Map());
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
            stats[type] = editor.computeTelemetryFinalData(stats[type]);
        }
        return stats;
    }
    resetModifiedIds() {
        this.#modifiedIds = undefined;
    }
    get modifiedIds() {
        if (this.#modifiedIds) {
            return this.#modifiedIds;
        }
        const ids = [];
        for (const value of this.#storage.values()) {
            if (!(value instanceof AnnotationEditor) ||
                !value.annotationElementId ||
                !value.serialize()) {
                continue;
            }
            ids.push(value.annotationElementId);
        }
        return (this.#modifiedIds = {
            ids: new Set(ids),
            hash: ids.join(","),
        });
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
        const { map, hash, transfer } = parent.serializable;
        // Create a *copy* of the data, since Objects are passed by reference in JS.
        const clone = structuredClone(map, transfer ? { transfer } : undefined);
        this.#serializable = { map: clone, hash, transfer };
    }
    // eslint-disable-next-line getter-return
    get print() {
        return fail("Should not call PrintAnnotationStorage.print");
    }
    /**
     * PLEASE NOTE: Only intended for usage within the API itself.
     * @ignore
     */
    get serializable() {
        return this.#serializable;
    }
    get modifiedIds() {
        return shadow(this, "modifiedIds", {
            ids: new Set(),
            hash: "",
        });
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=annotation_storage.js.map