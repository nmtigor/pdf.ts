import type { AnnotStorageRecord, AnnotStorageValue } from "./annotation_layer.js";
export type Serializable = {
    map?: AnnotStorageRecord | undefined;
    hash: string;
    transfers?: Transferable[] | undefined;
};
export declare const SerializableEmpty: Serializable;
/**
 * Key/value storage for annotation data in forms.
 */
export declare class AnnotationStorage {
    #private;
    get size(): number;
    onSetModified?: () => void;
    onResetModified?: () => void;
    onAnnotationEditor: ((type?: "freetext" | "ink" | "stamp" | undefined) => void) | undefined;
    /**
     * Get the value for a given key if it exists, or return the default value.
     */
    getValue(key: string, defaultValue: AnnotStorageValue): AnnotStorageValue;
    /**
     * Get the value for a given key.
     */
    getRawValue(key: string): AnnotStorageValue | undefined;
    /**
     * Remove a value from the storage.
     */
    remove(key: string): void;
    /**
     * Set the value for a given key
     */
    setValue(key: string, value: AnnotStorageValue): void;
    /**
     * Check if the storage contains the given key.
     */
    has(key: string): boolean;
    getAll(): Record<string, AnnotStorageValue> | undefined;
    setAll(obj: Record<string, AnnotStorageValue>): void;
    resetModified(): void;
    get print(): PrintAnnotationStorage;
    /**
     * PLEASE NOTE: Only intended for usage within the API itself.
     * @ignore
     */
    get serializable(): Serializable;
}
/**
 * A special `AnnotationStorage` for use during printing, where the serializable
 * data is *frozen* upon initialization, to prevent scripting from modifying its
 * contents. (Necessary since printing is triggered synchronously in browsers.)
 */
export declare class PrintAnnotationStorage extends AnnotationStorage {
    #private;
    constructor(parent: AnnotationStorage);
    get print(): PrintAnnotationStorage;
    /**
     * PLEASE NOTE: Only intended for usage within the API itself.
     * @ignore
     */
    get serializable(): Serializable;
}
//# sourceMappingURL=annotation_storage.d.ts.map