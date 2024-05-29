import CachedIterable from "./cached_iterable.js";
/**
 * CachedAsyncIterable caches the elements yielded by an async iterable.
 *
 * It can be used to iterate over an iterable many times without depleting the
 * iterable.
 */
export default class CachedAsyncIterable<T> extends CachedIterable<T, IteratorResult<T> | Promise<IteratorResult<T>>> {
    iterator: AsyncIterator<T, any, undefined> | Iterator<T, any, undefined>;
    /**
     * Create an `CachedAsyncIterable` instance.
     */
    constructor(iterable: Iterable<T> | AsyncIterable<T>);
    static from<T>(iterable: AsyncIterable<T> | Iterable<T>): CachedAsyncIterable<T>;
    /**
     * Asynchronous iterator caching the yielded elements.
     *
     * Elements yielded by the original iterable will be cached and available
     * synchronously. Returns an async generator object implementing the
     * iterator protocol over the elements of the original (async or sync)
     * iterable.
     */
    [Symbol.asyncIterator](): {
        next(): Promise<IteratorResult<T, any>>;
    };
    /**
     * This method allows user to consume the next element from the iterator
     * into the cache.
     *
     * @param count number of elements to consume
     */
    touchNext(count?: number): Promise<IteratorResult<T, any>>;
}
//# sourceMappingURL=cached_async_iterable.d.ts.map