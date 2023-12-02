export {};
/**
 * Base CachedIterable class.
 */
export default class CachedIterable<T, I extends IteratorResult<T> | Promise<IteratorResult<T>>> extends Array<I> {
    static from(..._: never[]): any;
    /**
     * Create a `CachedIterable` instance from an iterable or, if another
     * instance of `CachedIterable` is passed, return it without any
     * modifications.
     */
    protected static fromIterable<T, I extends IteratorResult<T> | Promise<IteratorResult<T>>, R extends CachedIterable<T, I>>(iterable: AsyncIterable<T> | Iterable<T>): R;
    [Symbol.iterator](): any;
}
//# sourceMappingURL=cached_iterable.d.ts.map