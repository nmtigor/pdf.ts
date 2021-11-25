import { isNonNumericKey, getOwnEnumerableNonNumericKeys } from "./objectKeysUtil.js";
/**
 * A generic wrapper for any enum-like object.
 * Provides utilities for runtime processing of an enum's values and keys, with strict compile-time
 * type safety.
 *
 * EnumWrapper cannot be directly instantiated. Use {@link $enum} to get/create an EnumWrapper
 * instance.
 *
 * @template V - Type of the enum value.
 * @template T - Type of the enum-like object that is being wrapped.
 */
export class EnumWrapper {
    enumObj;
    /**
     * List of all keys for this enum, in the original defined order of the enum.
     */
    keysList;
    /**
     * List of all values for this enum, in the original defined order of the enum.
     */
    valuesList;
    /**
     * Map of enum value -> enum key.
     * Used for reverse key lookups.
     * NOTE: Performance tests show that using a Map (even if it's a slow polyfill) is faster than building a lookup
     *       string key for values and using a plain Object:
     *       {@link https://www.measurethat.net/Benchmarks/Show/2514/1/map-keyed-by-string-or-number}
     */
    keysByValueMap;
    /**
     * The number of entries in this enum.
     * Part of the Map-like interface.
     */
    size;
    /**
     * The number of entries in this enum.
     * Part of the ArrayLike interface.
     */
    length;
    /**
     * Create a new EnumWrapper instance.
     * This is for internal use only.
     * Use {@link $enum} to publicly get/create an EnumWrapper
     *
     * @param enumObj - An enum-like object.
     */
    constructor(enumObj) {
        this.enumObj = enumObj;
        // Include only own enumerable keys that are not numeric.
        // This is necessary to ignore the reverse-lookup entries that are automatically added
        // by TypeScript to numeric enums.
        this.keysList = Object.freeze(getOwnEnumerableNonNumericKeys(enumObj));
        const length = this.keysList.length;
        const valuesList = new Array(length);
        const keysByValueMap = new Map();
        // According to multiple tests found on jsperf.com, a plain for loop is faster than using
        // Array.prototype.forEach
        for (let index = 0; index < length; ++index) {
            const key = this.keysList[index];
            const value = enumObj[key];
            valuesList[index] = value;
            keysByValueMap.set(value, key);
            // Type casting of "this" necessary to bypass readonly index signature for initialization.
            this[index] = Object.freeze([key, value]);
        }
        this.valuesList = Object.freeze(valuesList);
        this.keysByValueMap = keysByValueMap;
        this.size = this.length = length;
        // Make the EnumWrapper instance immutable
        Object.freeze(this);
    }
    /**
     * @return "[object EnumWrapper]"
     */
    toString() {
        // NOTE: overriding toString in addition to Symbol.toStringTag
        //       for maximum compatibility with older runtime environments
        //       that do not implement Object.prototype.toString in terms
        //       of Symbol.toStringTag
        return "[object EnumWrapper]";
    }
    /**
     * Get an iterator for this enum's keys.
     * Iteration order is based on the original defined order of the enum.
     * Part of the Map-like interface.
     * @return An iterator that iterates over this enum's keys.
     */
    keys() {
        let index = 0;
        return {
            next: () => {
                const isDone = index >= this.length;
                const result = {
                    done: isDone,
                    value: this.keysList[index]
                };
                ++index;
                return result;
            },
            [Symbol.iterator]() {
                return this;
            }
        };
    }
    /**
     * Get an iterator for this enum's values.
     * Iteration order is based on the original defined order of the enum.
     * Part of the Map-like interface.
     * NOTE: If there are duplicate values in the enum, then there will also be duplicate values
     *       in the result.
     * @return An iterator that iterates over this enum's values.
     */
    values() {
        let index = 0;
        return {
            next: () => {
                const isDone = index >= this.length;
                const result = {
                    done: isDone,
                    value: this.valuesList[index]
                };
                ++index;
                return result;
            },
            [Symbol.iterator]() {
                return this;
            }
        };
    }
    /**
     * Get an iterator for this enum's entries as [key, value] tuples.
     * Iteration order is based on the original defined order of the enum.
     * @return An iterator that iterates over this enum's entries as [key, value] tuples.
     */
    entries() {
        let index = 0;
        return {
            next: () => {
                const isDone = index >= this.length;
                const result = {
                    done: isDone,
                    // NOTE: defensive copy not necessary because entries are "frozen"
                    value: this[index]
                };
                ++index;
                return result;
            },
            [Symbol.iterator]() {
                return this;
            }
        };
    }
    /**
     * Get an iterator for this enum's entries as [key, value] tuples.
     * Iteration order is based on the original defined order of the enum.
     * @return An iterator that iterates over this enum's entries as [key, value] tuples.
     */
    [Symbol.iterator]() {
        return this.entries();
    }
    /**
     * Calls the provided iteratee on each item in this enum.
     * Iteration order is based on the original defined order of the enum.
     * See {@link EnumWrapper.Iteratee} for the signature of the iteratee.
     * The return value of the iteratee is ignored.
     * @param iteratee - The iteratee.
     * @param context - If provided, then the iteratee will be called with the context as its "this" value.
     */
    forEach(iteratee, context) {
        const length = this.length;
        // According to multiple tests found on jsperf.com, a plain for loop is faster than using
        // Array.prototype.forEach
        for (let index = 0; index < length; ++index) {
            const entry = this[index];
            iteratee.call(context, entry[1], entry[0], this, index);
        }
    }
    /**
     * Maps this enum's entries to a new list of values.
     * Iteration order is based on the original defined order of the enum.
     * Builds a new array containing the results of calling the provided iteratee on each item in this enum.
     * See {@link EnumWrapper.Iteratee} for the signature of the iteratee.
     * @param iteratee - The iteratee.
     * @param context - If provided, then the iteratee will be called with the context as its "this" value.
     * @return A new array containg the results of the iteratee.
     *
     * @template R - The of the mapped result for each entry.
     */
    map(iteratee, context) {
        const length = this.length;
        const result = new Array(length);
        // According to multiple tests found on jsperf.com, a plain for loop is faster than using Array.prototype.map
        for (let index = 0; index < length; ++index) {
            const entry = this[index];
            result[index] = iteratee.call(context, entry[1], entry[0], this, index);
        }
        return result;
    }
    /**
     * Get a list of this enum's keys.
     * Order of items in the list is based on the original defined order of the enum.
     * @return A list of this enum's keys.
     */
    getKeys() {
        // need to return a copy of this.keysList so it can be returned as Array instead of ReadonlyArray.
        return this.keysList.slice();
    }
    /**
     * Get a list of this enum's values.
     * Order of items in the list is based on the original defined order of the enum.
     * NOTE: If there are duplicate values in the enum, then there will also be duplicate values
     *       in the result.
     * @return A list of this enum's values.
     */
    getValues() {
        // need to return a copy of this.valuesList so it can be returned as Array instead of ReadonlyArray.
        return this.valuesList.slice();
    }
    /**
     * Get a list of this enum's entries as [key, value] tuples.
     * Order of items in the list is based on the original defined order of the enum.
     * @return A list of this enum's entries as [key, value] tuples.
     */
    getEntries() {
        // Create an array from the indexed entries of "this".
        // NOTE: no need for defensive copy of each entry because all entries are "frozen".
        return Array.prototype.slice.call(this);
    }
    /**
     * Get the index of a key based on the original defined order of this enum.
     * @param key A valid key for this enum.
     * @return The index of the key based on the original defined order of this enum.
     */
    indexOfKey(key) {
        return this.keysList.indexOf(key);
    }
    /**
     * Get the index of a value based on the original defined order of this enum.
     * @param value A valid value for this enum.
     * @return The index of the value based on the original defined order of this enum.
     */
    indexOfValue(value) {
        return this.valuesList.indexOf(value);
    }
    /**
     * Tests if the provided string is actually a valid key for this enum
     * Acts as a type guard to confirm that the provided value is actually the enum key type.
     * @param key - A potential key value for this enum.
     * @return True if the provided key is a valid key for this enum.
     */
    isKey(key) {
        return (key != null &&
            isNonNumericKey(key) &&
            this.enumObj.hasOwnProperty(key));
    }
    /**
     * Casts a string to a properly-typed key for this enum.
     * Throws an error if the key is invalid.
     * @param key - A potential key value for this enum.
     * @return The provided key value, cast to the type of this enum's keys.
     * @throws {Error} if the provided string is not a valid key for this enum.
     */
    asKeyOrThrow(key) {
        if (this.isKey(key)) {
            return key;
        }
        else {
            throw new Error(`Unexpected key: ${key}. Expected one of: ${this.getValues()}`);
        }
    }
    /**
     * Casts a string to a properly-typed key for this enum.
     * Returns a default key if the provided key is invalid.
     * @param key - A potential key value for this enum.
     * @param defaultKey - The key to be returned if the provided key is invalid.
     * @return The provided key value, cast to the type of this enum's keys.
     *         Returns `defaultKey` if the provided key is invalid.
     */
    asKeyOrDefault(key, defaultKey) {
        if (this.isKey(key)) {
            return key;
        }
        else {
            return defaultKey;
        }
    }
    /**
     * Tests if the provided value is a valid value for this enum.
     * Acts as a type guard to confirm that the provided value is actually the enum value type.
     * @param value - A potential value for this enum.
     * @return True if the provided value is valid for this enum.
     */
    isValue(value) {
        return value != null && this.keysByValueMap.has(value);
    }
    /**
     * Casts a value to a properly-typed value for this enum.
     * Throws an error if the value is invalid.
     * @param value - A potential value for this enum.
     * @return The provided value, cast to the type of this enum's values.
     * @throws {Error} if the provided value is not a valid value for this enum.
     */
    asValueOrThrow(value) {
        if (this.isValue(value)) {
            return value;
        }
        else {
            throw new Error(`Unexpected value: ${value}. Expected one of: ${this.getValues()}`);
        }
    }
    /**
     * Casts a value to a properly-typed value for this enum.
     * Returns a default value if the provided value is invalid.
     * @param value - A potential value for this enum.
     * @param defaultValue - The value to be returned if the provided value is invalid.
     * @return The provided value, cast to the type of this enum's values.
     *         Returns `defaultValue` if the provided value is invalid.
     */
    asValueOrDefault(value, defaultValue) {
        if (this.isValue(value)) {
            return value;
        }
        else {
            return defaultValue;
        }
    }
    /**
     * Performs a reverse lookup from enum value to corresponding enum key.
     * Throws an error if the value is invalid.
     * NOTE: If this enum has any duplicate values, then one of the keys for the duplicated value is
     *       arbitrarily returned.
     * @param value - A potential value for this enum.
     * @return The key for the provided value.
     * @throws {Error} if the provided value is not a valid value for this enum.
     */
    getKeyOrThrow(value) {
        // NOTE: Intentionally not using isValue() or asValueOrThrow() to avoid making two key lookups into the map
        //       for successful lookups.
        const result = value != null ? this.keysByValueMap.get(value) : undefined;
        if (result != null) {
            return result;
        }
        else {
            throw new Error(`Unexpected value: ${value}. Expected one of: ${this.getValues()}`);
        }
    }
    /**
     * Performs a reverse lookup from enum value to corresponding enum key.
     * Returns a default key if the provided value is invalid.
     * NOTE: If this enum has any duplicate values, then one of the keys for the duplicated value is
     *       arbitrarily returned.
     * @param value - A potential value for this enum.
     * @param defaultKey - The key to be returned if the provided value is invalid.
     * @return The key for the provided value.
     *         Returns `defaultKey` if the provided value is invalid.
     */
    getKeyOrDefault(value, defaultKey) {
        // NOTE: Intentionally not using isValue() to avoid making two key lookups into the map for successful lookups.
        const result = value != null ? this.keysByValueMap.get(value) : undefined;
        if (result != null) {
            return result;
        }
        else {
            return defaultKey;
        }
    }
    /**
     * Gets the enum value for the provided key.
     * Throws an error if the provided key is invalid.
     * @param key - A potential key value for this enum.
     * @return The enum value for the provided key.
     * @throws {Error} if the provided string is not a valid key for this enum.
     */
    getValueOrThrow(key) {
        // NOTE: The key MUST be separately validated before looking up the entry in enumObj to avoid false positive
        //       lookups for keys that match properties on Object.prototype, or keys that match the index keys of
        //       reverse lookups on numeric enums.
        return this.enumObj[this.asKeyOrThrow(key)];
    }
    /**
     * Gets the enum value for the provided key.
     * Returns a default value if the provided key is invalid.
     * @param key - A potential key value for this enum.
     * @param defaultValue - The value to be returned if the provided key is invalid.
     * @return The enum value for the provided key.
     *         Returns `defaultValue` if the provided key is invalid.
     */
    getValueOrDefault(key, defaultValue) {
        // NOTE: The key MUST be separately validated before looking up the entry in enumObj to avoid false positive
        //       lookups for keys that match properties on Object.prototype, or keys that match the index keys of
        //       reverse lookups on numeric enums.
        if (this.isKey(key)) {
            return this.enumObj[key];
        }
        else {
            return defaultValue;
        }
    }
}
// HACK: Forcefully overriding the value of the [Symbol.toStringTag] property.
//       This was originally implemented in the class as recommended by MDN
//       Symbol.toStringTag documentation:
//           public get [Symbol.toStringTag](): string { return "EnumWrapper"; }
//
//       However, after upgrading to TypeScript 3.7, this caused compiler errors
//       when running dtslint due to the getter being emitted to the .d.ts file,
//       but TSC complaining that getters aren't allowed in "ambient" contexts.
//       This seems to be realated to a known breaking change:
//           https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#class-field-mitigations
//
//       To avoid requiring TypeScript 3.6+ to use ts-enum-util, I no longer
//       implement the getter on the class and instead simply set the value of
//       the [Symbol.toStringTag] property on the class prototype to the desired
//       string.
//
//       I also tried implementing it as:
//           public readonly [Symbol.toStringTag] = "EnumWrapper";
//       But this got emitted to the .d.ts file with the initializer,
//       causing a compiler time error about initializers not allowed in an
//       "ambient" context. So I had to omit the declaration of the
//       [Symbol.toStringTag] in the class declaration and hackishly set its
//       value here (not important to have it part of the class declaration
//       as long as the value exists at runtime).
EnumWrapper.prototype[Symbol.toStringTag] = "EnumWrapper";
//# sourceMappingURL=EnumWrapper.js.map