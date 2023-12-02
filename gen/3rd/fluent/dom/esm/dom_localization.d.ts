import type { ComplexTranslation } from "./localization.js";
import Localization from "./localization.js";
/**
 * The `DOMLocalization` class is responsible for fetching resources and
 * formatting translations.
 *
 * It implements the fallback strategy in case of errors encountered during the
 * formatting of translations and methods for observing DOM
 * trees with a `MutationObserver`.
 */
export default class DOMLocalization extends Localization {
    /** A Set of DOM trees observed by the `MutationObserver`. */
    roots: Set<Element | DocumentFragment>;
    /** requestAnimationFrame handler. */
    pendingrAF: number | undefined;
    /** list of elements pending for translation. */
    pendingElements: Set<Element>;
    windowElement: (Window & typeof globalThis) | null;
    mutationObserver: MutationObserver | undefined;
    observerConfig: {
        attributes: boolean;
        characterData: boolean;
        childList: boolean;
        subtree: boolean;
        attributeFilter: string[];
    };
    onChange(eager?: boolean): void;
    /**
     * Set the `data-l10n-id` and `data-l10n-args` attributes on DOM elements.
     * FluentDOM makes use of mutation observers to detect changes
     * to `data-l10n-*` attributes and translate elements asynchronously.
     * `setAttributes` is a convenience method which allows to translate
     * DOM elements declaratively.
     *
     * You should always prefer to use `data-l10n-id` on elements (statically in
     * HTML or dynamically via `setAttributes`) over manually retrieving
     * translations with `format`.  The use of attributes ensures that the
     * elements can be retranslated when the user changes their language
     * preferences.
     *
     * ```javascript
     * localization.setAttributes(
     *   document.querySelector('#welcome'), 'hello', { who: 'world' }
     * );
     * ```
     *
     * This will set the following attributes on the `#welcome` element.
     * The MutationObserver will pick up this change and will localize the element
     * asynchronously.
     *
     * ```html
     * <p id='welcome'
     *   data-l10n-id='hello'
     *   data-l10n-args='{"who": "world"}'>
     * </p>
     * ```
     *
     * @param element Element to set attributes on
     * @param id l10n-id string
     * @param args KVP list of l10n arguments
     */
    setAttributes(element: Element, id: string, args?: Record<string, string>): Element;
    /**
     * Get the `data-l10n-*` attributes from DOM elements.
     *
     * ```javascript
     * localization.getAttributes(
     *   document.querySelector('#welcome')
     * );
     * // -> { id: 'hello', args: { who: 'world' } }
     * ```
     *
     * @param element HTML element
     */
    getAttributes(element: Element): {
        id: string | null;
        args: any;
    };
    /**
     * Add `newRoot` to the list of roots managed by this `DOMLocalization`.
     *
     * Additionally, if this `DOMLocalization` has an observer, start observing
     * `newRoot` in order to translate mutations in it.
     *
     * @param newRoot Root to observe.
     */
    connectRoot(newRoot: Element): void;
    /**
     * Remove `root` from the list of roots managed by this `DOMLocalization`.
     *
     * Additionally, if this `DOMLocalization` has an observer, stop observing
     * `root`.
     *
     * Returns `true` if the root was the last one managed by this
     * `DOMLocalization`.
     *
     * @param root Root to disconnect.
     */
    disconnectRoot(root: Element): boolean;
    /**
     * Translate all roots associated with this `DOMLocalization`.
     */
    translateRoots(): Promise<void[]>;
    /**
     * Pauses the `MutationObserver`.
     *
     * @private
     */
    pauseObserving(): void;
    /**
     * Resumes the `MutationObserver`.
     *
     * @private
     */
    resumeObserving(): void;
    /**
     * Translate mutations detected by the `MutationObserver`.
     *
     * @private
     */
    translateMutations(mutations: MutationRecord[]): void;
    /**
     * Translate a DOM element or fragment asynchronously using this
     * `DOMLocalization` object.
     *
     * Manually trigger the translation (or re-translation) of a DOM fragment.
     * Use the `data-l10n-id` and `data-l10n-args` attributes to mark up the DOM
     * with information about which translations to use.
     *
     * Returns a `Promise` that gets resolved once the translation is complete.
     *
     * @param frag Element or DocumentFragment to be translated
     */
    translateFragment(frag: DocumentFragment): Promise<void>;
    /**
     * Translate a list of DOM elements asynchronously using this
     * `DOMLocalization` object.
     *
     * Manually trigger the translation (or re-translation) of a list of elements.
     * Use the `data-l10n-id` and `data-l10n-args` attributes to mark up the DOM
     * with information about which translations to use.
     *
     * Returns a `Promise` that gets resolved once the translation is complete.
     *
     * @param elements List of elements to be translated
     */
    translateElements(elements: Element[]): Promise<void>;
    /**
     * Applies translations onto elements.
     *
     * @private
     */
    applyTranslations(elements: Element[], translations: ComplexTranslation[]): void;
    /**
     * Collects all translatable child elements of the element.
     *
     * @private
     */
    getTranslatables(element: ParentNode): Element[];
    /**
     * Get the `data-l10n-*` attributes from DOM elements as a two-element
     * array.
     *
     * @private
     */
    getKeysForElement(element: Element): {
        id: string;
        args: any;
    };
}
//# sourceMappingURL=dom_localization.d.ts.map