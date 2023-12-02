/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2023
 */

import type { ComplexTranslation } from "./localization.ts";
import Localization from "./localization.ts";
import translateElement from "./overlay.ts";
/*80--------------------------------------------------------------------------*/

const L10NID_ATTR_NAME = "data-l10n-id";
const L10NARGS_ATTR_NAME = "data-l10n-args";
const L10N_ELEMENT_QUERY = `[${L10NID_ATTR_NAME}]`;
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
  roots = new Set<Element | DocumentFragment>();
  /** requestAnimationFrame handler. */
  pendingrAF: number | undefined;
  /** list of elements pending for translation. */
  pendingElements = new Set<Element>();
  windowElement: (Window & typeof globalThis) | null = null;
  mutationObserver: MutationObserver | undefined;
  observerConfig = {
    attributes: true,
    characterData: false,
    childList: true,
    subtree: true,
    attributeFilter: [L10NID_ATTR_NAME, L10NARGS_ATTR_NAME],
  };

  override onChange(eager = false) {
    super.onChange(eager);
    if (this.roots) {
      this.translateRoots();
    }
  }
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
  setAttributes(
    element: Element,
    id: string,
    args?: Record<string, string>,
  ): Element {
    element.setAttribute(L10NID_ATTR_NAME, id);
    if (args) {
      element.setAttribute(L10NARGS_ATTR_NAME, JSON.stringify(args));
    } else {
      element.removeAttribute(L10NARGS_ATTR_NAME);
    }
    return element;
  }
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
  getAttributes(element: Element) {
    return {
      id: element.getAttribute(L10NID_ATTR_NAME),
      args: JSON.parse(element.getAttribute(L10NARGS_ATTR_NAME) || null as any),
    };
  }
  /**
   * Add `newRoot` to the list of roots managed by this `DOMLocalization`.
   *
   * Additionally, if this `DOMLocalization` has an observer, start observing
   * `newRoot` in order to translate mutations in it.
   *
   * @param newRoot Root to observe.
   */
  connectRoot(newRoot: Element) {
    for (const root of this.roots) {
      if (
        root === newRoot ||
        root.contains(newRoot) ||
        newRoot.contains(root)
      ) {
        throw new Error("Cannot add a root that overlaps with existing root.");
      }
    }
    if (this.windowElement) {
      if (this.windowElement !== newRoot.ownerDocument.defaultView) {
        throw new Error(`Cannot connect a root:
          DOMLocalization already has a root from a different window.`);
      }
    } else {
      this.windowElement = newRoot.ownerDocument.defaultView!;
      this.mutationObserver = new this.windowElement.MutationObserver(
        (mutations) => this.translateMutations(mutations),
      );
    }
    this.roots.add(newRoot);
    this.mutationObserver!.observe(newRoot, this.observerConfig);
  }
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
  disconnectRoot(root: Element): boolean {
    this.roots.delete(root);
    // Pause the mutation observer to stop observing `root`.
    this.pauseObserving();
    if (this.roots.size === 0) {
      this.mutationObserver = undefined;
      this.windowElement = null;
      this.pendingrAF = undefined;
      this.pendingElements.clear();
      return true;
    }
    // Resume observing all other roots.
    this.resumeObserving();
    return false;
  }
  /**
   * Translate all roots associated with this `DOMLocalization`.
   */
  translateRoots(): Promise<void[]> {
    const roots = Array.from(this.roots) as DocumentFragment[];
    return Promise.all(roots.map((root) => this.translateFragment(root)));
  }
  /**
   * Pauses the `MutationObserver`.
   *
   * @private
   */
  pauseObserving() {
    if (!this.mutationObserver) {
      return;
    }
    this.translateMutations(this.mutationObserver.takeRecords());
    this.mutationObserver.disconnect();
  }
  /**
   * Resumes the `MutationObserver`.
   *
   * @private
   */
  resumeObserving() {
    if (!this.mutationObserver) {
      return;
    }
    for (const root of this.roots) {
      this.mutationObserver.observe(root, this.observerConfig);
    }
  }
  /**
   * Translate mutations detected by the `MutationObserver`.
   *
   * @private
   */
  translateMutations(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      switch (mutation.type) {
        case "attributes":
          if ((mutation.target as Element).hasAttribute("data-l10n-id")) {
            this.pendingElements.add(mutation.target as Element);
          }
          break;
        case "childList":
          for (const addedNode of mutation.addedNodes) {
            if (addedNode.nodeType === addedNode.ELEMENT_NODE) {
              if ((addedNode as Element).childElementCount) {
                for (
                  const element of this.getTranslatables(addedNode as Element)
                ) {
                  this.pendingElements.add(element);
                }
              } else if (
                (addedNode as Element).hasAttribute(L10NID_ATTR_NAME)
              ) {
                this.pendingElements.add(addedNode as Element);
              }
            }
          }
          break;
      }
    }
    // This fragment allows us to coalesce all pending translations
    // into a single requestAnimationFrame.
    if (this.pendingElements.size > 0) {
      if (this.pendingrAF === undefined) {
        this.pendingrAF = this.windowElement!.requestAnimationFrame(() => {
          this.translateElements(Array.from(this.pendingElements));
          this.pendingElements.clear();
          this.pendingrAF = undefined;
        });
      }
    }
  }
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
  translateFragment(frag: DocumentFragment): Promise<void> {
    return this.translateElements(this.getTranslatables(frag));
  }
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
  async translateElements(elements: Element[]): Promise<void> {
    if (!elements.length) {
      return undefined;
    }
    const keys = elements.map(this.getKeysForElement);
    const translations = await this.formatMessages(keys);
    return this.applyTranslations(elements, translations);
  }
  /**
   * Applies translations onto elements.
   *
   * @private
   */
  applyTranslations(elements: Element[], translations: ComplexTranslation[]) {
    this.pauseObserving();
    for (let i = 0; i < elements.length; i++) {
      if (translations[i] !== undefined) {
        translateElement(elements[i], translations[i]);
      }
    }
    this.resumeObserving();
  }
  /**
   * Collects all translatable child elements of the element.
   *
   * @private
   */
  getTranslatables(element: ParentNode): Element[] {
    const nodes = Array.from(element.querySelectorAll(L10N_ELEMENT_QUERY));
    if (
      typeof (element as any).hasAttribute === "function" &&
      (element as any).hasAttribute(L10NID_ATTR_NAME)
    ) {
      nodes.push(element as Element);
    }
    return nodes;
  }
  /**
   * Get the `data-l10n-*` attributes from DOM elements as a two-element
   * array.
   *
   * @private
   */
  getKeysForElement(element: Element) {
    return {
      id: element.getAttribute(L10NID_ATTR_NAME)!,
      args: JSON.parse(element.getAttribute(L10NARGS_ATTR_NAME) || null as any),
    };
  }
}
/*80--------------------------------------------------------------------------*/
