/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2023
 */

import CachedIterable from "./cached_iterable.ts";
/*80--------------------------------------------------------------------------*/

/*
 * CachedSyncIterable caches the elements yielded by an iterable.
 *
 * It can be used to iterate over an iterable many times without depleting the
 * iterable.
 */
export default class CachedSyncIterable<T>
  extends CachedIterable<T, IteratorResult<T>> {
  iterator;

  /**
   * Create an `CachedSyncIterable` instance.
   */
  constructor(iterable: Iterable<T>) {
    super();

    if (Symbol.iterator in Object(iterable)) {
      this.iterator = iterable[Symbol.iterator]();
    } else {
      throw new TypeError("Argument must implement the iteration protocol.");
    }
  }

  static override from<T>(iterable: Iterable<T>) {
    return super.fromIterable<T, IteratorResult<T>, CachedSyncIterable<T>>(
      iterable,
    );
  }

  override [Symbol.iterator]() {
    const cached = this;
    let cur = 0;

    return {
      next() {
        if (cached.length <= cur) {
          cached.push(cached.iterator.next());
        }
        return cached[cur++];
      },
    };
  }

  /**
   * This method allows user to consume the next element from the iterator
   * into the cache.
   *
   * @param count number of elements to consume
   */
  touchNext(count = 1) {
    let idx = 0;
    while (idx++ < count) {
      const last = this[this.length - 1];
      if (last && last.done) {
        break;
      }
      this.push(this.iterator.next());
    }
    // Return the last cached {value, done} object to allow the calling
    // code to decide if it needs to call touchNext again.
    return this[this.length - 1];
  }
}
/*80--------------------------------------------------------------------------*/
