/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2023
 */

export {};
/*80--------------------------------------------------------------------------*/

/**
 * Base CachedIterable class.
 */
export default class CachedIterable<
  T,
  I extends IteratorResult<T> | Promise<IteratorResult<T>>,
> extends Array<I> {
  static override from(..._: never[]): any {
    throw new Error("Disabled. See subclasses' impl.");
  }

  /**
   * Create a `CachedIterable` instance from an iterable or, if another
   * instance of `CachedIterable` is passed, return it without any
   * modifications.
   */
  protected static fromIterable<
    T,
    I extends IteratorResult<T> | Promise<IteratorResult<T>>,
    R extends CachedIterable<T, I>,
  >(
    iterable: AsyncIterable<T> | Iterable<T>,
  ): R {
    if (iterable instanceof this) {
      return iterable as R;
    }

    return new this(iterable as any) as R;
  }

  override [Symbol.iterator](): any {
    throw new Error("Disabled. See subclasses' impl.");
  }
}
/*80--------------------------------------------------------------------------*/
