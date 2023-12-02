import { CachedAsyncIterable } from "../../../cached-iterable/src/index.js";
import type { Message } from "../../bundle/esm/ast.js";
import type { FluentBundle, FluentVariable } from "../../bundle/esm/bundle.js";
export type FluentMessageArgs = Record<string, FluentVariable>;
type Key_ = {
    id: string;
    args?: FluentMessageArgs | undefined;
};
export type FluentAttribute = {
    name: string;
    value: string;
};
export type ComplexTranslation = {
    value: string | null;
    attributes: FluentAttribute[] | null;
};
type Translation_ = string | ComplexTranslation;
type Method_ = (bundle: FluentBundle, errors: Error[], message: Message, args?: FluentMessageArgs) => Translation_ | null;
/**
 * The `Localization` class is a central high-level API for vanilla
 * JavaScript use of Fluent.
 * It combines language negotiation, FluentBundle and I/O to
 * provide a scriptable API to format translations.
 */
export default class Localization {
    resourceIds: string[];
    generateBundles: (resourceIds?: string[]) => AsyncGenerator<FluentBundle, void, unknown>;
    bundles: CachedAsyncIterable<FluentBundle>;
    /**
     * @param resourceIds List of resource IDs
     * @param generateBundles Function that returns a
     *    generator over FluentBundles
     */
    constructor(resourceIds: string[] | undefined, generateBundles: (resourceIds?: string[]) => AsyncGenerator<FluentBundle, void, unknown>);
    addResourceIds(resourceIds: string[], eager?: boolean): number;
    removeResourceIds(resourceIds: string[]): number;
    /**
     * Format translations and handle fallback if needed.
     *
     * Format translations for `keys` from `FluentBundle` instances on this
     * DOMLocalization. In case of errors, fetch the next context in the
     * fallback chain.
     *
     * @param keys Translation keys to format.
     * @param method Formatting function.
     * @private
     */
    formatWithFallback(keys: Key_[], method: Method_): Promise<(Translation_ | null)[]>;
    /**
     * Format translations into `{value, attributes}` objects.
     *
     * The fallback logic is the same as in `formatValues`
     * but it returns `{value, attributes}` objects
     * which are suitable for the translation of DOM elements.
     *
     * Returns a Promise resolving to an array of the translation strings.
     *
     * @example
     * ```js
     * docL10n.formatMessages([
     *   {id: 'hello', args: { who: 'Mary' }},
     *   {id: 'welcome'}
     * ]).then(console.log);
     *
     * // [
     * //   { value: 'Hello, Mary!', attributes: null },
     * //   {
     * //     value: 'Welcome!',
     * //     attributes: [ { name: "title", value: 'Hello' } ]
     * //   }
     * // ]
     * ```
     *
     * @private
     */
    formatMessages(keys: Key_[]): Promise<ComplexTranslation[]>;
    /**
     * Retrieve translations corresponding to the passed keys.
     *
     * A generalized version of `DOMLocalization.formatValue`. Keys must
     * be `{id, args}` objects.
     *
     * Returns a Promise resolving to an array of the translation strings.
     *
     * @example
     * ```js
     * docL10n.formatValues([
     *   {id: 'hello', args: { who: 'Mary' }},
     *   {id: 'hello', args: { who: 'John' }},
     *   {id: 'welcome'}
     * ]).then(console.log);
     *
     * // ['Hello, Mary!', 'Hello, John!', 'Welcome!']
     * ```
     */
    formatValues(keys: Key_[]): Promise<string[]>;
    /**
     * Retrieve the translation corresponding to the `id` identifier.
     *
     * If passed, `args` is a simple hash object with a list of variables that
     * will be interpolated in the value of the translation.
     *
     * Returns a Promise resolving to the translation string.
     *
     * Use this sparingly for one-off messages which don't need to be
     * retranslated when the user changes their language preferences, e.g. in
     * notifications.
     *
     * @example
     * ```js
     * docL10n.formatValue(
     *   'hello', { who: 'world' }
     * ).then(console.log);
     *
     * // 'Hello, world!'
     * ```
     *
     * @param id Identifier of the translation to format
     * @param   {Object}  [args] - Optional external arguments
     */
    formatValue(id: string, args?: FluentMessageArgs): Promise<string>;
    handleEvent(): void;
    /**
     * This method should be called when there's a reason to believe
     * that language negotiation or available resources changed.
     */
    onChange(eager?: boolean): void;
}
export {};
//# sourceMappingURL=localization.d.ts.map