/**
 * Return true if the specified object key value is NOT a numeric key.
 * @param key - An object key.
 * @return true if the specified object key value is NOT a numeric key.
 */
export function isNonNumericKey(key) {
    return key !== String(parseFloat(key));
}
/**
 * Get all own enumerable string (non-numeric) keys of an object.
 * Implemented in terms of methods available in ES6.
 * The order of the result is *guaranteed* to be in the same order in which the
 * properties were added to the object, due to the specification of the
 * Object.getOwnPropertyNames method.
 * (first all numeric keys)
 * @param obj - An object.
 * @return A list of all the object's own enumerable string (non-numeric) keys.
 */
export function getOwnEnumerableNonNumericKeysES6(obj) {
    return Object.getOwnPropertyNames(obj).filter((key) => {
        return obj.propertyIsEnumerable(key) && isNonNumericKey(key);
    });
}
/**
 * Get all own enumerable string (non-numeric) keys of an object.
 * Implemented in terms of methods available in ES5.
 * The order of the result is *most likely* to be in the same order in which the
 * properties were added to the object, due to de-facto standards in most JS
 * runtime environments' implementations of Object.keys
 * @param obj - An object.
 * @return A list of all the object's own enumerable string (non-numeric) keys.
 */
export function getOwnEnumerableNonNumericKeysES5(obj) {
    return Object.keys(obj).filter(isNonNumericKey);
}
/**
 * Get all own enumerable string (non-numeric) keys of an object.
 * Implemented in terms of methods available in ES3.
 * The order of the result is *most likely* to be in the same order in which the
 * properties were added to the object, due to de-facto standards in most JS
 * runtime environments' implementations of for/in object key iteration.
 * @param obj - An object.
 * @return A list of all the object's own enumerable string (non-numeric) keys.
 */
export function getOwnEnumerableNonNumericKeysES3(obj) {
    const result = [];
    for (const key in obj) {
        if (obj.hasOwnProperty(key) &&
            obj.propertyIsEnumerable(key) &&
            isNonNumericKey(key)) {
            result.push(key);
        }
    }
    return result;
}
/**
 * Get all own enumerable string (non-numeric) keys of an object, using
 * the best implementation available.
 * The order of the result is either *guaranteed* or *most likely* to be in the
 * same order in which the properties were added to the object, depending on
 * the best available implementation.
 * @see getEnumerableStringKeysES6
 * @see getEnumerableStringKeysES5
 * @see getEnumerableStringKeysES3
 * @param obj - An object.
 * @return A list of all the object's own enumerable string (non-numeric) keys.
 */
export const getOwnEnumerableNonNumericKeys = !!Object.getOwnPropertyNames
    ? getOwnEnumerableNonNumericKeysES6
    : !!Object.keys
        ? getOwnEnumerableNonNumericKeysES5
        : getOwnEnumerableNonNumericKeysES3;
//# sourceMappingURL=objectKeysUtil.js.map