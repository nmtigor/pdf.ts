/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2023
 */
const cache = new Map();
export function getMemoizerForLocale(locales) {
    const stringLocale = Array.isArray(locales) ? locales.join(" ") : locales;
    let memoizer = cache.get(stringLocale);
    if (memoizer === undefined) {
        memoizer = new Map();
        cache.set(stringLocale, memoizer);
    }
    return memoizer;
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=memoizer.js.map