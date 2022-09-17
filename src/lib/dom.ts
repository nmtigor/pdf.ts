/*80****************************************************************************
 * dom
** --- */

import { type loff_t } from "./alias.ts";
import { $loff, $ovlap, $tail_ignored } from "./symbols.ts";
/*80--------------------------------------------------------------------------*/

declare global {
  interface EventTarget {
    on(type: string, listener: any, options?: any): void;
    off(type: string, listener: any, options?: any): void;
  }
}

EventTarget.prototype.on = function (
  this: EventTarget,
  type: string,
  listener: any,
  options?: any,
) {
  this.addEventListener(type, listener, options);
};
EventTarget.prototype.off = function (
  this: EventTarget,
  type: string,
  listener: any,
  options?: any,
) {
  this.removeEventListener(type, listener, options);
};
/*64----------------------------------------------------------*/

declare global {
  interface Event {
    canceled_?: boolean;
    canceled: boolean;
  }
}

Reflect.defineProperty(Event.prototype, "canceled", {
  get(this: Event) {
    return this.canceled_ ?? false;
  },
  set(this: Event, canceled_x: boolean) {
    this.canceled_ = canceled_x;
  },
});
/*64----------------------------------------------------------*/

declare global {
  interface Node {
    readonly isText: boolean;
    readonly secondChild: Node | null;
    removeAllChild: () => this;
    assert_eq: (rhs: object) => void | never;
  }
}

if (typeof Node !== "undefined") {
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

  Node.prototype.removeAllChild = function (this: Node) {
    while (this.firstChild) this.removeChild(this.lastChild!);
    return this;
  };

  // /**
  //  * @deprecated - Use Node.isConnected property
  //  * @return { Boolean }
  //  */
  // Node.prototype.attached = function(this:Node)
  // {
  //   let ret = false;

  //   let el = this;
  //   let valve = 1000+1;
  //   while( el && --valve )
  //   {
  //     if( el === document.body )
  //     {
  //       ret = true;
  //       break;
  //     }
  //     el = el.parentNode;
  //   }
  //   assert(valve);

  //   return ret;
  // }

  /**
   * Only test properties in `rhs`
   * @headconst @param rhs
   */
  Node.prototype.assert_eq = function (this: Node, rhs) {
    // if( rhs && rhs[$ref_test] )
    // {
    //   console.assert( this === rhs[$ref_test] );
    //   return;
    // }

    if (this === rhs) return;

    for (const key of Reflect.ownKeys(rhs)) {
      if (key === "childNodes") {
        continue;
      }

      const rhsval = (<any> rhs)[key];
      const zisval = (<any> this)[key];
      if (Array.isArray(rhsval)) {
        console.assert((<any[]> rhsval).eq(zisval));
      } else console.assert(rhsval === zisval);
    }

    if ((<any> rhs).childNodes) {
      const childNodes = (<any> rhs).childNodes;
      console.assert(childNodes.length === this.childNodes.length);
      for (let i = childNodes.length; i--;) {
        this.childNodes[i].assert_eq(childNodes[i]);
      }
    }

    // if( rhs && rhs[test_ref_sym] ) rhs[ $ref_test ] = this;
  };
}
/*64----------------------------------------------------------*/

declare global {
  interface Element {
    setAttrs(attrs_o: Record<string, string>): this;

    readonly scrollRight: number;
    readonly scrollBottom: number;
  }
}

if (typeof Element !== "undefined") {
  Element.prototype.setAttrs = function (this: Element, attrs_o) {
    for (const key in attrs_o) {
      this.setAttribute(key, attrs_o[key]);
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
}
/*64----------------------------------------------------------*/

declare global {
  interface HTMLElement {
    /**
     * Return previous visible _HTMLElement_.
     */
    readonly prevVisible?: HTMLElement;

    readonly pageX: number;
    readonly pageY: number;
  }
}

if (typeof HTMLElement !== "undefined") {
  Reflect.defineProperty(HTMLElement.prototype, "prevVisible", {
    get(this: HTMLElement) {
      let ret = <any> this.previousSibling;
      while (ret) {
        if (!(ret instanceof HTMLElement)) {
          continue;
        }

        if (ret.style.display !== "none") {
          break;
        }

        ret = ret.previousSibling;
      }
      ret ??= undefined;
      return ret;
    },
  });

  Reflect.defineProperty(HTMLElement.prototype, "pageX", {
    get(this: HTMLElement) {
      let ret = 0;
      let el = <any> this;
      do {
        ret += el?.offsetLeft ?? 0;
        ret += el?.clientLeft ?? 0;
        ret -= el?.scrollLeft ?? 0;
      } while (el = el.offsetParent);
      return ret;
    },
  });
  Reflect.defineProperty(HTMLElement.prototype, "pageY", {
    get(this: HTMLElement) {
      let ret = 0;
      let el = <any> this;
      do {
        ret += el?.offsetTop ?? 0;
        ret += el?.clientTop ?? 0;
        ret -= el?.scrollTop ?? 0;
      } while (el = el.offsetParent);
      return ret;
    },
  });
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

if (typeof HTMLCollection !== "undefined") {
  HTMLCollection.prototype.indexOf = function (this: HTMLCollection, element) {
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
    [$ovlap]: boolean;
  }

  interface Range {
    /**
     * @param { out } rec_a
     * @const @param ovlap
     */
    getReca(rec_a: DOMRect[], ovlap?: boolean): void;

    reset(): void;
  }
}

if (typeof Range !== "undefined") {
  Range.prototype.getReca = function (
    this: Range,
    rec_a: DOMRect[],
    ovlap = false,
  ) {
    const recs = this.getClientRects();
    if (recs.length) {
      for (let i = 0; i < recs.length; i++) {
        const rec = recs[i];
        if (rec.width === 0) rec.width = rec.height * .1;
        rec[$ovlap] = ovlap;
        rec_a.push(rec);
      }
    } else {
      const rec = this.getBoundingClientRect();
      rec.width = rec.height * .1;
      rec[$ovlap] = ovlap;
      rec_a.push(rec);
    }
  };

  Range.prototype.reset = function (this: Range) {
    this.setEnd(document, 0);
    this.collapse();
  };
}
/*64----------------------------------------------------------*/

declare global {
  interface Text {
    [$loff]: loff_t;
    [$tail_ignored]: boolean;
  }
}

/**
 * @const @param text_x
 * @const @param loff_x
 * @const @param tail_ignored_x
 */
export function textnode(
  text_x: string,
  loff_x?: loff_t,
  tail_ignored_x?: boolean,
) {
  const ret = document.createTextNode(text_x);
  if (loff_x !== undefined) ret[$loff] = loff_x;
  if (tail_ignored_x !== undefined) ret[$tail_ignored] = tail_ignored_x;
  return ret;
}
/*64----------------------------------------------------------*/

type _HTMLRet<NN extends string> = NN extends keyof HTMLElementTagNameMap
  ? HTMLElementTagNameMap[NN]
  : HTMLElement;
export function html<NN extends string>(
  nodeName: NN,
  innerHTML?: string,
  doc?: Document,
) {
  doc ??= document;
  let ret = doc.createElement(nodeName);
  if (innerHTML) ret.innerHTML = innerHTML;
  return ret as _HTMLRet<NN>;
}

export function div(innerHTML?: string, doc?: Document) {
  return html("div", innerHTML, doc);
}
export function span(innerHTML?: string, doc?: Document) {
  return html("span", innerHTML, doc);
}

type _SVGRet<NN extends string> = NN extends keyof SVGElementTagNameMap
  ? SVGElementTagNameMap[NN]
  : SVGElement;
export function svg<NN extends string>(nodeName: NN, doc?: Document) {
  doc ??= document;
  return <_SVGRet<NN>> doc.createElementNS(
    "http://www.w3.org/2000/svg",
    nodeName,
  );
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
