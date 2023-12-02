/** 80**************************************************************************
 * @module lib/dom
 * @license Apache-2.0
 ******************************************************************************/

import type { CSSStyle, llen_t } from "./alias.ts";
import type { Vuu } from "./cv.ts";
import { $cssstylesheet, $loff, $ovlap, $tail_ignored } from "./symbols.ts";
/*80--------------------------------------------------------------------------*/

declare global {
  interface EventMap extends
    ElementEventMap,
    // DocumentAndElementEventHandlersEventMap,
    GlobalEventHandlersEventMap,
    WindowEventHandlersEventMap,
    //
    DocumentEventMap,
    HTMLVideoElementEventMap,
    // MediaQueryListEventMap,
    OfflineAudioContextEventMap,
    ServiceWorkerEventMap,
    WindowEventMap,
    WorkerEventMap {}
  type EventName = keyof EventMap;
  type EventHandler<E extends EventName> = (ev: EventMap[E]) => any;

  interface Event {
    _canceled: boolean | undefined;
    canceled: boolean;

    /**
     * When `Poprect` is shown, `pocudVu` is not `null`. At this time, right-
     * click another place, the `Poprect` would probably be updated, rather than
     * reset. `targetPocudVu` is to prevent this from happening, because newly
     * created `PointerEvent` does not have `targetPocudVu`.
     *
     * Update `Poprect` only when setPocudVu()` is called hence `targetPocudVu`
     * is set. Otherwise, reset `Poprect`.
     */
    targetPocudVu?: Vuu;
  }

  interface WheelEvent {
    _repr(): {
      deltaMode: string;
      deltaX: number;
      deltaY: number;
    };
  }
}

if (globalThis.Event) {
  Reflect.defineProperty(Event.prototype, "canceled", {
    get(this: Event) {
      return this._canceled ?? false;
    },
    set(this: Event, canceled_x: boolean) {
      this._canceled = canceled_x;
    },
  });
  // console.log(Event.prototype.canceled);
}

if (globalThis.WheelEvent) {
  WheelEvent.prototype._repr = function (this) {
    const m_ = /* final switch */ ({
      [WheelEvent.DOM_DELTA_PIXEL]: "DOM_DELTA_PIXEL",
      [WheelEvent.DOM_DELTA_LINE]: "DOM_DELTA_LINE",
      [WheelEvent.DOM_DELTA_PAGE]: "DOM_DELTA_PAGE",
    } as Record<number, string>)[this.deltaMode];
    return {
      deltaMode: m_ ? `"${m_}"` : "undefined",
      deltaX: this.deltaX,
      deltaY: this.deltaY,
    };
  };
}
/*64----------------------------------------------------------*/

export const enum MouseButton {
  Main = 0,
  Auxiliary = 1,
  Secondary = 2,
  Back = 3,
  Forward = 4,
}
/*64----------------------------------------------------------*/

declare global {
  interface EventTarget {
    on<E extends EventName>(
      type: E,
      listener: EventHandler<E>,
      options?: AddEventListenerOptions | boolean,
    ): void;
    off<E extends EventName>(
      type: E,
      listener: EventHandler<E>,
      options?: EventListenerOptions | boolean,
    ): void;
  }
}

if (globalThis.EventTarget) {
  EventTarget.prototype.on = function (this, type, listener, options?) {
    return this.addEventListener(type, listener as any, options);
  };
  EventTarget.prototype.off = function (this, type, listener, options?) {
    return this.removeEventListener(type, listener as any, options);
  };
}
/*64----------------------------------------------------------*/

declare global {
  interface Node {
    readonly isText: boolean;
    readonly secondChild: Node | null;
    removeAllChild: () => this;
    /** @deprecated */
    assert_eq: (rhs: object) => void | never;
  }
}

if (globalThis.Node) {
  Reflect.defineProperty(Node.prototype, "isText", {
    get(this: Node) {
      return this.nodeType === Node.TEXT_NODE;
    },
  });

  Reflect.defineProperty(Node.prototype, "secondChild", {
    get(this: Node) {
      return this.firstChild ? this.firstChild.nextSibling : null;
    },
  });

  Node.prototype.removeAllChild = function (this) {
    while (this.firstChild) this.removeChild(this.lastChild!);
    return this;
  };

  /**
   * Only test properties in `rhs`
   * @headconst @param rhs
   */
  Node.prototype.assert_eq = function (this, rhs) {
    // if( rhs && rhs[$ref_test] )
    // {
    //   console.assert( this === rhs[$ref_test] );
    //   return;
    // }

    if (this === rhs) return;

    for (const key of Reflect.ownKeys(rhs)) {
      if (key === "childNodes") continue;

      const rhsval = (rhs as any)[key];
      const zisval = (this as any)[key];
      if (Array.isArray(rhsval)) {
        console.assert(rhsval.eq(zisval));
      } else {
        console.assert(rhsval === zisval);
      }
    }

    if ((rhs as any).childNodes) {
      const childNodes = (rhs as any).childNodes;
      console.assert(childNodes.length === this.childNodes.length);
      for (let i = childNodes.length; i--;) {
        this.childNodes[i].assert_eq(childNodes[i]);
      }
    }

    // if( rhs && rhs[test_ref_sym] ) rhs[ $ref_test ] = this;
  };
}
/*64----------------------------------------------------------*/

// /*#static*/ if (DENO) {
//   const { DOMParser } = await import(
//     "https://deno.land/x/deno_dom/deno-dom-wasm.ts"
//   );
//   globalThis.document = new DOMParser().parseFromString(
//     `<!DOCTYPE html><html lang="en"><head></head><body></body></html>`,
//     "text/html",
//   ) as unknown as Document;
// }
/*64----------------------------------------------------------*/

declare global {
  interface Document {
    /**
     * Used for adding CSS pseudo-element like `::-webkit-scrollbar`
     */
    [$cssstylesheet]: CSSStyleSheet;
  }
}

if (globalThis.Document) {
  let cssstylesheet_: CSSStyleSheet | undefined;
  Reflect.defineProperty(Document.prototype, $cssstylesheet, {
    get(this: Document) {
      cssstylesheet_ ??= this.head.appendChild(html("style")).sheet!;
      return cssstylesheet_;
    },
  });
}
/*64----------------------------------------------------------*/

declare global {
  interface Element {
    assignAttro(attr_o: Record<string, string | number | boolean>): this;

    readonly scrollRight: number;
    readonly scrollBottom: number;

    cyName: string;
  }
}

if (globalThis.Element) {
  Element.prototype.assignAttro = function (this, attr_o) {
    for (const [key, val] of Object.entries(attr_o)) {
      this.setAttribute(key, val as any);
    }
    return this;
  };

  Reflect.defineProperty(Element.prototype, "scrollRight", {
    get(this: Element) {
      return this.scrollLeft + this.clientWidth;
    },
  });
  Reflect.defineProperty(Element.prototype, "scrollBottom", {
    get(this: Element) {
      return this.scrollTop + this.clientHeight;
    },
  });

  Reflect.defineProperty(Element.prototype, "cyName", {
    get(this: Element) {
      return this.getAttribute("data-cy");
    },
    set(this: Element, name_x: string) {
      this.setAttribute("data-cy", name_x);
    },
  });
}
/*64----------------------------------------------------------*/

declare global {
  interface HTMLElement {
    assignStylo(styl_o: CSSStyle): this;

    /**
     * Return previous visible _HTMLElement_
     * jjjj cf. pdf/pdf.ts-web/ui_utils.getVisibleElements()
     */
    readonly prevVisible?: HTMLElement;

    // readonly pageX: number;
    // readonly pageY: number;

    readonly viewLeft: number;
    readonly viewRight: number;
    readonly viewTop: number;
    readonly viewBottom: number;
  }
}

if (globalThis.HTMLElement) {
  HTMLElement.prototype.assignStylo = function (this, styl_o) {
    Object.assign(this.style, styl_o);
    return this;
  };

  Reflect.defineProperty(HTMLElement.prototype, "prevVisible", {
    get(this: HTMLElement) {
      let ret = this.previousSibling as any;
      while (ret) {
        if (!(ret instanceof HTMLElement)) continue;

        if (ret.style.display !== "none") break;

        ret = ret.previousSibling;
      }
      ret ??= undefined;
      return ret;
    },
  });

  // Reflect.defineProperty(HTMLElement.prototype, "pageX", {
  //   get(this: HTMLElement) {
  //     let ret = 0;
  //     let el = this as any;
  //     do {
  //       ret += el?.offsetLeft ?? 0;
  //       ret += el?.clientLeft ?? 0;
  //       ret -= el?.scrollLeft ?? 0;
  //     } while (el = el.offsetParent);
  //     return ret;
  //   },
  // });
  // Reflect.defineProperty(HTMLElement.prototype, "pageY", {
  //   get(this: HTMLElement) {
  //     let ret = 0;
  //     let el = this as any;
  //     do {
  //       ret += el?.offsetTop ?? 0;
  //       ret += el?.clientTop ?? 0;
  //       ret -= el?.scrollTop ?? 0;
  //     } while (el = el.offsetParent);
  //     return ret;
  //   },
  // });

  Reflect.defineProperty(HTMLElement.prototype, "viewLeft", {
    get(this: HTMLElement) {
      return this.offsetLeft + this.clientLeft;
    },
  });
  Reflect.defineProperty(HTMLElement.prototype, "viewRight", {
    get(this: HTMLElement) {
      return this.viewLeft + this.clientWidth;
    },
  });
  Reflect.defineProperty(HTMLElement.prototype, "viewTop", {
    get(this: HTMLElement) {
      return this.offsetTop + this.clientTop;
    },
  });
  Reflect.defineProperty(HTMLElement.prototype, "viewBottom", {
    get(this: HTMLElement) {
      return this.viewTop + this.clientHeight;
    },
  });
}
/*64----------------------------------------------------------*/

declare global {
  interface SVGElement {
    assignStylo(styl_o: CSSStyle): this;
  }
}

if (globalThis.SVGElement) {
  SVGElement.prototype.assignStylo = function (this, styl_o) {
    Object.assign(this.style, styl_o);
    return this;
  };
}
/*64----------------------------------------------------------*/

declare global {
  interface CSSStyleDeclaration {
    assignPropo(prop_o: Record<string, string | number>): void;
  }
}

if (globalThis.CSSStyleDeclaration) {
  CSSStyleDeclaration.prototype.assignPropo = function (this, prop_o) {
    for (const [key, val] of Object.entries(prop_o)) {
      this.setProperty(key, val as any);
    }
  };
}
/*64----------------------------------------------------------*/

declare global {
  interface HTMLCollection {
    indexOf(element: Element): number;
  }

  // var HTMLCollectionBase:{
  //   prototype:HTMLCollectionBase;
  // }
}

if (globalThis.HTMLCollection) {
  HTMLCollection.prototype.indexOf = function (this, element) {
    for (let i = 0; i < this.length; ++i) {
      if (this.item(i) === element) return i;
    }
    return -1;
  };
}
/*64----------------------------------------------------------*/

export type HSElement = HTMLElement | SVGElement;
/*64----------------------------------------------------------*/

declare global {
  interface DOMRect {
    contain(x_x: number, y_x: number): boolean;

    [$ovlap]: boolean;
  }

  interface Range {
    /**
     * @out @param rec_a_x
     * @const @param ovlap_x
     */
    getSticka(rec_a_x: DOMRect[], ovlap_x?: boolean): void;

    reset(): void;
  }
}

if (globalThis.DOMRect) {
  DOMRect.prototype.contain = function (this, x_x, y_x) {
    return this.left <= x_x && x_x < this.right &&
      this.top <= y_x && y_x < this.bottom;
  };
}

if (globalThis.Range) {
  Range.prototype.getSticka = function (this, rec_a_x, ovlap_x = false) {
    const recs = this.getClientRects();
    if (recs.length) {
      for (const rec of recs) {
        if (rec.width === 0) rec.width = rec.height * .1;
        rec[$ovlap] = ovlap_x;
        rec_a_x.push(rec);
      }
    } else {
      const rec = this.getBoundingClientRect();
      rec.width = rec.height * .1;
      rec[$ovlap] = ovlap_x;
      rec_a_x.push(rec);
    }
  };

  Range.prototype.reset = function (this) {
    this.setEnd(document, 0);
    this.collapse();
  };
}
/*64----------------------------------------------------------*/

declare global {
  interface Text {
    [$loff]?: llen_t;
    /**
     * For `TokLine<>` being empty or containing whitespaces only, when it is
     * appended to a `ELine<>`, an additional "|" will be added. For such
     * `Text`, its `[$tail_ignored]` is `true`.
     */
    [$tail_ignored]?: boolean;
  }
}

/**
 * @const @param text_x
 * @const @param loff_x
 * @const @param tail_ignored_x
 */
export function textnode(
  text_x: string,
  loff_x?: llen_t,
  tail_ignored_x?: boolean,
) {
  const ret = document.createTextNode(text_x);
  if (loff_x !== undefined) ret[$loff] = loff_x;
  if (tail_ignored_x !== undefined) ret[$tail_ignored] = tail_ignored_x;
  return ret;
}
/*64----------------------------------------------------------*/

type HTMLRet_<NN extends string> = NN extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[NN]
  : HTMLElement;
export function html<NN extends string>(
  nodeName_x: NN,
  innerHTML_x?: string,
  doc_x = document,
) {
  let ret = doc_x.createElement(nodeName_x);
  if (innerHTML_x) ret.innerHTML = innerHTML_x;
  return ret as HTMLRet_<NN>;
}
export function div(innerHTML_x?: string, doc_x = document) {
  return html("div", innerHTML_x, doc_x);
}
export function span(innerHTML_x?: string, doc_x = document) {
  return html("span", innerHTML_x, doc_x);
}

type SVGRet_<NN extends string> = NN extends keyof SVGElementTagNameMap
  ? SVGElementTagNameMap[NN]
  : SVGElement;
export function svg<NN extends string>(nodeName: NN, doc = document) {
  return doc.createElementNS(
    "http://www.w3.org/2000/svg",
    nodeName,
  ) as SVGRet_<NN>;
}
/*64----------------------------------------------------------*/

declare global {
  interface OnProgressP {
    /**
     * Currently loaded number of bytes.
     */
    loaded: number;

    /**
     * Total number of bytes in the PDF file.
     */
    total: number;
  }
}
/*80--------------------------------------------------------------------------*/
