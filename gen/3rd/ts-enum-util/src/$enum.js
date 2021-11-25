import { EnumWrapper } from "./EnumWrapper.js";
import * as symbols from "./symbols.js";
import { visitEnumValue } from "./visitEnumValue.js";
import { mapEnumValue } from "./mapEnumValue.js";
/**
 * Map of enum object -> EnumWrapper instance.
 * Used as a cache for {@link $enum}.
 * NOTE: WeakMap has very fast lookups and avoids memory leaks if used on a
 *       temporary enum-like object. Even if a WeakMap implementation is very
 *       naiive (like a Map polyfill), lookups are plenty fast for this use case
 *       of a relatively small number of enums within a project. Just don't
 *       perform cached lookups inside tight loops when you could cache the
 *       result in a local variable, and you'll be fine :)
 *       {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap}
 *       {@link https://www.measurethat.net/Benchmarks/Show/2513/5/map-keyed-by-object}
 */
const enumWrapperInstancesCache = new WeakMap();
export function $enum(enumObj) {
    let result = enumWrapperInstancesCache.get(enumObj);
    if (!result) {
        result = new EnumWrapper(enumObj);
        enumWrapperInstancesCache.set(enumObj, result);
    }
    return result;
}
$enum.handleNull = symbols.handleNull;
$enum.handleUndefined = symbols.handleUndefined;
$enum.handleUnexpected = symbols.handleUnexpected;
$enum.unhandledEntry = symbols.unhandledEntry;
$enum.visitValue = visitEnumValue;
$enum.mapValue = mapEnumValue;
//# sourceMappingURL=$enum.js.map