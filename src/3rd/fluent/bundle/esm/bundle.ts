/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

import type { Message, Pattern, Term } from "./ast.ts";
import { DATETIME, NUMBER } from "./builtins.ts";
import { getMemoizerForLocale } from "./memoizer.ts";
import { resolveComplexPattern } from "./resolver.ts";
import type { FluentResource } from "./resource.ts";
import { Scope } from "./scope.ts";
import type { FluentFunction, FluentValue } from "./types.ts";
import { FluentNone } from "./types.ts";
/*80--------------------------------------------------------------------------*/

export type TextTransform = (text: string) => string;
export type FluentVariable = FluentValue | string | number | Date;

/**
 * Message bundles are single-language stores of translation resources. They are
 * responsible for formatting message values and attributes to strings.
 */
export class FluentBundle {
  locales;
  /** @ignore */
  _terms = new Map<string, Term>();
  /** @ignore */
  _messages = new Map<string, Message>();
  /** @ignore */
  _functions: Record<string, FluentFunction>;
  /** @ignore */
  _useIsolating: boolean;
  /** @ignore */
  _transform: TextTransform;
  /** @ignore */
  _intls;
  /**
   * Create an instance of `FluentBundle`.
   *
   * @example
   * ```js
   * let bundle = new FluentBundle(["en-US", "en"]);
   *
   * let bundle = new FluentBundle(locales, {useIsolating: false});
   *
   * let bundle = new FluentBundle(locales, {
   *   useIsolating: true,
   *   functions: {
   *     NODE_ENV: () => process.env.NODE_ENV
   *   }
   * });
   * ```
   *
   * @param locales Used to instantiate `Intl` formatters used by translations.
   * @param options Optional configuration for the bundle.
   */
  constructor(
    locales: string | string[],
    { functions, useIsolating = true, transform = (v) => v }: {
      /** Additional functions available to translations as builtins. */
      functions?: Record<string, FluentFunction>;
      /**
       * Whether to use Unicode isolation marks (FSI, PDI) for bidi interpolations.
       *
       * Default: `true`.
       */
      useIsolating?: boolean;
      /** A function used to transform string parts of patterns. */
      transform?: TextTransform;
    } = {},
  ) {
    this.locales = Array.isArray(locales) ? locales : [locales];
    this._functions = {
      NUMBER,
      DATETIME,
      ...functions,
    };
    this._useIsolating = useIsolating;
    this._transform = transform;
    this._intls = getMemoizerForLocale(locales);
  }
  /**
   * Check if a message is present in the bundle.
   *
   * @param id - The identifier of the message to check.
   */
  hasMessage(id: string): boolean {
    return this._messages.has(id);
  }
  /**
   * Return a raw unformatted message object from the bundle.
   *
   * Raw messages are `{value, attributes}` shapes containing translation units
   * called `Patterns`. `Patterns` are implementation-specific; they should be
   * treated as black boxes and formatted with `FluentBundle.formatPattern`.
   *
   * @param id The identifier of the message to check.
   */
  getMessage(id: string): Message | undefined {
    return this._messages.get(id);
  }
  /**
   * Add a translation resource to the bundle.
   *
   * @example
   * ```js
   * let res = new FluentResource("foo = Foo");
   * bundle.addResource(res);
   * bundle.getMessage("foo");
   * // → {value: .., attributes: {..}}
   * ```
   *
   * @param res
   * @param options
   */
  addResource(res: FluentResource, { allowOverrides = false }: {
    /**
     * Boolean specifying whether it's allowed to override
     * an existing message or term with a new value.
     *
     * Default: `false`.
     */
    allowOverrides?: boolean;
  } = {}) {
    const errors = [];
    for (let i = 0; i < res.body.length; i++) {
      let entry = res.body[i];
      if (entry.id.startsWith("-")) {
        // Identifiers starting with a dash (-) define terms. Terms are private
        // and cannot be retrieved from FluentBundle.
        if (allowOverrides === false && this._terms.has(entry.id)) {
          errors.push(
            new Error(`Attempt to override an existing term: "${entry.id}"`),
          );
          continue;
        }
        this._terms.set(entry.id, entry as Term);
      } else {
        if (allowOverrides === false && this._messages.has(entry.id)) {
          errors.push(
            new Error(`Attempt to override an existing message: "${entry.id}"`),
          );
          continue;
        }
        this._messages.set(entry.id, entry);
      }
    }
    return errors;
  }
  /**
   * Format a `Pattern` to a string.
   *
   * Format a raw `Pattern` into a string. `args` will be used to resolve
   * references to variables passed as arguments to the translation.
   *
   * In case of errors `formatPattern` will try to salvage as much of the
   * translation as possible and will still return a string. For performance
   * reasons, the encountered errors are not returned but instead are appended
   * to the `errors` array passed as the third argument.
   *
   * If `errors` is omitted, the first encountered error will be thrown.
   *
   * @example
   * ```js
   * let errors = [];
   * bundle.addResource(
   *     new FluentResource("hello = Hello, {$name}!"));
   *
   * let hello = bundle.getMessage("hello");
   * if (hello.value) {
   *     bundle.formatPattern(hello.value, {name: "Jane"}, errors);
   *     // Returns "Hello, Jane!" and `errors` is empty.
   *
   *     bundle.formatPattern(hello.value, undefined, errors);
   *     // Returns "Hello, {$name}!" and `errors` is now:
   *     // [<ReferenceError: Unknown variable: name>]
   * }
   * ```
   */
  formatPattern(
    pattern: Pattern,
    args?: Record<string, FluentVariable>,
    errors?: Error[],
  ) {
    // Resolve a simple pattern without creating a scope. No error handling is
    // required; by definition simple patterns don't have placeables.
    if (typeof pattern === "string") {
      return this._transform(pattern);
    }
    // Resolve a complex pattern.
    let scope = new Scope(this, errors, args);
    try {
      let value = resolveComplexPattern(scope, pattern);
      return value.toString(scope);
    } catch (err) {
      if (scope.errors && err instanceof Error) {
        scope.errors.push(err);
        return new FluentNone().toString(scope);
      }
      throw err;
    }
  }
}
/*80--------------------------------------------------------------------------*/
