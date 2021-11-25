import { createUnhandledEntryError } from "./createUnhandledEntryError.js";
import { handleUnexpected, handleNull, handleUndefined, unhandledEntry } from "./symbols.js";
/**
 * A wrapper around an enum or string/number literal value to be mapped.
 * Do not use this class directly. Use the {@link $enum.mapValue} function to
 * get an instance of this class.
 *
 * @template E - An enum or string/number literal type.
 */
export class EnumValueMappee {
    value;
    /**
     * Do not use this constructor directly. Use the {@link $enum.mapValue}
     * function to get an instance of this class.
     * @param value - The value to be wrapped by this "mappee".
     */
    constructor(value) {
        this.value = value;
    }
    /**
     * Maps the wrapped value using the supplied mapper.
     * Returns the value of the mapper's property whose name matches the wrapped
     * value.
     *
     * @template T - The data type that the enum or string/number literal value
     *           will be mapped to.
     *
     * @param mapper - A mapper implementation for type E that returns type T.
     * @returns The mapped value from the mapper.
     */
    with(mapper) {
        if (mapper.hasOwnProperty(this.value)) {
            return processEntry(mapper[this.value], this.value);
        }
        else if (mapper.hasOwnProperty(handleUnexpected)) {
            return processEntry(mapper[handleUnexpected], this.value);
        }
        else {
            throw new Error(`Unexpected value: ${this.value}`);
        }
    }
}
/**
 * A wrapper around an enum or string/number literal value to be mapped.
 * For values that may be null.
 * Do not use this class directly. Use the {@link $enum.mapValue} function to
 * get an instance of this class.
 *
 * NOTE: At run time, this class is used by {@link $enum.mapValue} ONLY for
 *       handling null values.
 *       {@link EnumValueMappee} contains the core run time implementation that is
 *       applicable to all "EnumValueMappee" classes.
 *
 * @template E - An enum or string/number literal type.
 */
export class EnumValueMappeeWithNull {
    /**
     * Maps the wrapped value using the supplied mapper.
     * If the wrapped value is null, returns the mapper's
     * {@link handleNull} value.
     * Otherwise, returns the value of the mapper's property whose name matches
     * the wrapped value.
     *
     * @template T - The data type that the enum or string/number literal value
     *           will be mapped to.
     *
     * @param mapper - A mapper implementation for type E that returns type T.
     * @returns The mapped value from the mapper.
     */
    with(mapper) {
        // This class is used at run time for mapping null values regardless of
        // the compile time type being visited, so we actually have to check if
        // handleNull exists.
        if (mapper.hasOwnProperty(handleNull)) {
            return processEntry(mapper[handleNull], null);
        }
        else if (mapper.hasOwnProperty(handleUnexpected)) {
            return processEntry(mapper[handleUnexpected], null);
        }
        else {
            throw new Error(`Unexpected value: null`);
        }
    }
}
/**
 * A wrapper around an enum or string/number literal value to be mapped.
 * For values that may be undefined.
 * Do not use this class directly. Use the {@link $enum.mapValue} function to
 * get an instance of this class.
 *
 * NOTE: At run time, this class is used by {@link $enum.mapValue} ONLY for
 *       handling undefined values.
 *       {@link EnumValueMappee} contains the core run time implementation that is
 *       applicable to all "EnumValueMappee" classes.
 *
 * @template E - An enum or string/number literal type.
 */
export class EnumValueMappeeWithUndefined {
    /**
     * Maps the wrapped value using the supplied mapper.
     * If the wrapped value is undefined, returns the mapper's
     * {@link handleUndefined} value.
     * Otherwise, returns the value of the mapper's property whose name matches
     * the wrapped value.
     *
     * @template T - The data type that the enum or string/number literal value
     *           will be mapped to.
     *
     * @param mapper - A mapper implementation for type E that returns type T.
     * @returns The mapped value from the mapper.
     */
    with(mapper) {
        // This class is used at run time for mapping undefined values
        // regardless of the compile time type being visited, so we actually
        // have to check if handleUndefined exists.
        if (mapper.hasOwnProperty(handleUndefined)) {
            return processEntry(mapper[handleUndefined], undefined);
        }
        else if (mapper.hasOwnProperty(handleUnexpected)) {
            return processEntry(mapper[handleUnexpected], undefined);
        }
        else {
            throw new Error(`Unexpected value: undefined`);
        }
    }
}
/**
 * Common implementation for processing an entry of an enum value mapper.
 * @param entry - Either the mapped value entry, or {@link unhandledEntry}.
 * @param value - The value being mapped.
 * @return The provided entry, if it is not an unhandledEntry.
 * @throws {Error} If the provided entry is an unhandledEntry.
 */
function processEntry(entry, value) {
    if (entry === unhandledEntry) {
        throw createUnhandledEntryError(value);
    }
    else {
        return entry;
    }
}
//# sourceMappingURL=EnumValueMappee.js.map