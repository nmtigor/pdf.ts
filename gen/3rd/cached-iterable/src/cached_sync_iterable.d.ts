import CachedIterable from "./cached_iterable.js";
/**
 * CachedSyncIterable caches the elements yielded by an iterable.
 *
 * It can be used to iterate over an iterable many times without depleting the
 * iterable.
 */
export default class CachedSyncIterable<T> extends CachedIterable<T, IteratorResult<T>> {
    iterator: Iterator<T, any, undefined>;
    /**
     * Create an `CachedSyncIterable` instance.
     */
    constructor(iterable: Iterable<T>);
    static from<T>(iterable: Iterable<T>): CachedSyncIterable<T>;
    [Symbol.iterator](): {
        next(): IteratorResult<T, any>;
    };
    /**
     * This method allows user to consume the next element from the iterator
     * into the cache.
     *
     * @param count number of elements to consume
     */
    touchNext(count?: number): IteratorResult<T, any>;
}
//# sourceMappingURL=cached_sync_iterable.d.ts.map