/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2023
 */

import type { ComplexPattern } from "./ast.ts";
import type { FluentBundle, FluentVariable } from "./bundle.ts";
import type { Constructor } from "@fe-lib/alias.ts";
/*80--------------------------------------------------------------------------*/

export class Scope {
  /** The bundle for which the given resolution is happening. */
  bundle;
  /** The list of errors collected while resolving. */
  errors;
  /** A dict of developer-provided variables. */
  args;
  /**
   * The Set of patterns already encountered during this resolution.
   * Used to detect and prevent cyclic resolutions.
   * @ignore
   */
  dirty = new WeakSet<ComplexPattern>();
  /** A dict of parameters passed to a TermReference. */
  params: Record<string, FluentVariable> | undefined;
  /**
   * The running count of placeables resolved so far.
   * Used to detect the Billion Laughs and Quadratic Blowup attacks.
   * @ignore
   */
  placeables = 0;

  constructor(
    bundle: FluentBundle,
    errors?: Error[],
    args?: Record<string, FluentVariable>,
  ) {
    this.bundle = bundle;
    this.errors = errors;
    this.args = args;
  }
  reportError(error?: unknown) {
    if (!this.errors || !(error instanceof Error)) {
      throw error;
    }
    this.errors.push(error);
  }
  memoizeIntlObject(
    ctor:
      | typeof Intl.NumberFormat
      | typeof Intl.DateTimeFormat
      | typeof Intl.PluralRules,
    opts?:
      | Intl.NumberFormatOptions
      | Intl.DateTimeFormatOptions
      | Intl.PluralRulesOptions,
  ) {
    let cache = this.bundle._intls.get(ctor);
    if (!cache) {
      cache = {};
      this.bundle._intls.set(ctor, cache);
    }
    let id = JSON.stringify(opts);
    if (!cache[id]) {
      cache[id] = new (ctor as any)(this.bundle.locales, opts);
    }
    return cache[id];
  }
}
/*80--------------------------------------------------------------------------*/
