/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2023
 */
/*80--------------------------------------------------------------------------*/
/**
 * Base CachedIterable class.
 */
export default class CachedIterable extends Array {
    static from(..._) {
        throw new Error("Disabled. See subclasses' impl.");
    }
    /**
     * Create a `CachedIterable` instance from an iterable or, if another
     * instance of `CachedIterable` is passed, return it without any
     * modifications.
     */
    static fromIterable(iterable) {
        if (iterable instanceof this) {
            return iterable;
        }
        return new this(iterable);
    }
    [Symbol.iterator]() {
        throw new Error("Disabled. See subclasses' impl.");
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=cached_iterable.js.map