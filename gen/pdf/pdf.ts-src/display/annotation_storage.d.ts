import { type AnnotStorageValue, AnnotStorageRecord } from "./annotation_layer.js";
/**
 * Key/value storage for annotation data in forms.
 */
export declare class AnnotationStorage {
    #private;
    _storage: AnnotStorageRecord;
    get size(): number;
    _timeStamp: number;
    /**
     * PLEASE NOTE: Only intended for usage within the API itself.
     * @ignore
     */
    get lastModified(): string;
    _modified: boolean;
    onSetModified?: () => void;
    onResetModified?: () => void;
    /**
     * Get the value for a given key if it exists, or return the default value.
     */
    getValue(key: string, defaultValue: AnnotStorageValue): AnnotStorageValue;
    /**
     * Set the value for a given key
     */
    setValue(key: string, value: AnnotStorageValue): void;
    getAll(): Record<string, AnnotStorageValue> | undefined;
    resetModified(): void;
    /**
     * PLEASE NOTE: Only intended for usage within the API itself.
     * @ignore
     */
    get serializable(): AnnotStorageRecord | undefined;
}
//# sourceMappingURL=annotation_storage.d.ts.map