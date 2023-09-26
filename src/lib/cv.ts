/** 80**************************************************************************
 * @module lib/cv
 * @license Apache-2.0
 ******************************************************************************/

import type { CSSStyle } from "./alias.ts";
import { svg } from "./dom.ts";
import { mix } from "./jslang.ts";
import { $vuu } from "./symbols.ts";
import type { ReportedError } from "./util/trace.ts";
/*80--------------------------------------------------------------------------*/

/**
 * Inwards API, i.e., API called from outside of `Coo`.
 */
export interface CooInterface {
  reportError?(error: unknown): void | Promise<void>;
}

/**
 * Access rule like scope:
 * Only has access to sibling or child `Coo`'s through `ci`.
 * Child `Coo` accessing parent `Coo` has no such restriction.
 */
export abstract class Coo<CI extends CooInterface = CooInterface> {
  abstract get ci(): CI;

  getParentCoo?<PC extends Coo>(): PC;
}
// Coo.abc = "abc";

// //#region CI<>
// // Ref. https://stackoverflow.com/questions/44851268/typescript-how-to-extract-the-generic-parameter-from-a-type/50924506

// type CI<T> = T extends Coo<infer X> ? X : never
// //#endregion

// /**
//  * Moo for interacting with other Coo's Hii.
//  */
// class Hii extends Moo
// {
//   constructor( coo_x )
//   {
//     super( coo_x );
//   }
// }

declare global {
  interface Node {
    [$vuu]?: Vuu;
    // [$Vuu]?: AbstractConstructor<Vuu>;
  }
}

/**
 * Wrapper of DOM
 * Vuu ⊆ Coo
 */
export abstract class Vuu<C extends Coo = Coo, E extends Element = Element> {
  protected coo$: C;
  get coo() {
    return this.coo$;
  }

  protected el$: E;
  get el() {
    return this.el$;
  }

  /**
   * ! If any, not call in the `constructor()`
   */
  protected observeTheme$?(): void;
  protected unobserveTheme$?(): void;

  /**
   * @headconst @param coo_x
   * @headconst @param el_x
   */
  constructor(coo_x: C, el_x: E) {
    this.coo$ = coo_x;
    this.el$ = el_x;

    this.el$[$vuu] = this;
    // this.el$[$Vuu] = Vuu;
  }

  get parentVuu_1(): Vuu | undefined {
    let node = this.el$.parentNode;
    while (node && !node[$vuu]) node = node.parentNode;
    return node?.[$vuu];
  }

  /**
   * @headconst @param node_x
   */
  static of(node_x: Node): Vuu | undefined {
    let node: Node | null = node_x;
    while (node && !node[$vuu]) node = node.parentNode;
    return node?.[$vuu];
  }

  // /**
  //  * @deprecated - use DOM's `append()` directly
  //  * @headconst @param { Vuu } ret_x
  //  * @param { Element } el_x
  //  * @return { Vuu } - return ret_x
  //  */
  // append( ret_x, el_x = this.el )
  // {
  //   el_x.appendChild( ret_x.el );

  //   return ret_x;
  // }

  // /**
  //  * @headconst @param ret_x
  //  * @headconst @param el_x
  //  */
  // prepend<V extends Vuu>( ret_x:V, el_x=this.el$ ):V
  // {
  //   el_x.insertBefore( ret_x.el$, el_x.firstChild );

  //   return ret_x;
  // }

  /**
   * @deprecated
   * @headconst @param ret_x
   * @headconst @param refvuu_x
   */
  attachBefore<V extends Vuu<C>>(ret_x: V, refvuu_x?: Vuu) {
    if (refvuu_x) {
      this.el$.insertBefore(ret_x.el$, refvuu_x.el$);
    } else {
      this.el$.append(ret_x.el$);
    }
    return ret_x;
  }

  /**
   * @deprecated
   * @headconst @param ret_x
   */
  detach<V extends Vuu<C>>(ret_x: V) {
    this.el$.removeChild(ret_x.el$);
    return ret_x;
  }

  // /**
  //  * @param { Vuu } vuu_x
  //  * @return { Boolean }
  //  */
  // attachedTo( vuu_x )
  // {
  //   return vuu_x && this.el$.parentNode === vuu_x.el;
  // }

  on<E extends EventName>(
    type: E,
    listener: EventHandler<E>,
    options?: AddEventListenerOptions | boolean,
  ) {
    return this.el$.on(type, listener, options);
  }
  off<E extends EventName>(
    type: E,
    listener: EventHandler<E>,
    options?: EventListenerOptions | boolean,
  ) {
    return this.el$.off(type, listener, options);
  }

  assignAttro(attr_o: Record<string, string | number>): this {
    this.el$.assignAttro(attr_o);
    return this;
  }

  // static Vuufn() {}
}
// Vuu.def = "def";

export class HTMLVuu<C extends Coo = Coo, E extends HTMLElement = HTMLElement>
  extends Vuu<C, E> {
  // /**
  //  * @headconst @param coo_x
  //  * @headconst @param el_x
  //  */
  // constructor( coo_x:C, el_x:E )
  // {
  //   super( coo_x, el_x );
  // }

  assignStylo(styl_o: CSSStyle): this {
    this.el$.assignStylo(styl_o);
    return this;
  }
}

export class SVGVuu<C extends Coo = Coo, E extends SVGElement = SVGElement>
  extends Vuu<C, E> {
  // /**
  //  * @headconst @param coo_x
  //  * @const @param viewBox_x
  //  */
  // constructor( coo_x:C, el_x:E )
  // {
  //   super( coo_x, el_x );
  // }

  assignStylo(styl_o: CSSStyle): this {
    this.el$.assignStylo(styl_o);
    return this;
  }
}

/**
 * It is a `Coo` functionally.
 */
export interface HTMLVCo<
  CI extends CooInterface = CooInterface,
  E extends HTMLElement = HTMLElement,
> extends HTMLVuu<Coo<CI>, E>, Coo<CI> {}
export abstract class HTMLVCo<CI extends CooInterface, E extends HTMLElement>
  extends mix(HTMLVuu as any, Coo) {
  // override coo$: Coo<CI>;

  readonly #ci: CI = Object.create(null);
  /** @implement */
  get ci() {
    return this.#ci;
  }

  /**
   * @headconst @param el_x
   */
  constructor(el_x: E) {
    super(undefined as any, el_x);
    this.coo$ = this;
  }

  showReportedError?(re_x: ReportedError): void;
}

/**
 * It is a Coo functionally.
 */
export interface SVGVCo<
  CI extends CooInterface = CooInterface,
  E extends SVGElement = SVGElement,
> extends SVGVuu<Coo<CI>, E>, Coo<CI> {}
export abstract class SVGVCo<CI extends CooInterface, E extends SVGElement>
  extends mix(SVGVuu as any, Coo) {
  readonly #ci: CI = Object.create(null);
  /** @implement */
  get ci() {
    return this.#ci;
  }

  /**
   * @headconst @param el_x
   */
  constructor(el_x: E) {
    super(undefined as any, el_x);
    this.coo$ = this;
  }
}
// console.log( VCoo );
// console.log( VCoo.def );
// console.log( VCoo.abc );
// let vcoo = new VCoo();
// vcoo.Coofn1111111();
// console.log( vcoo instanceof Vuu ); // true
// console.log( vcoo instanceof Coo1 ); // false
// console.log( vcoo instanceof Coo ); // false

export type ViewBox = `${number} ${number} ${number} ${number}`;

export class SVGViewbox<CI extends CooInterface = CooInterface>
  extends SVGVCo<CI, SVGSVGElement> {
  /**
   * @headconst @param coo_x
   * @const @param viewBox_x
   */
  constructor(viewBox_x: ViewBox = "0 0 100 100") {
    super(svg("svg"));
    this.el$.setAttribute("viewBox", viewBox_x);
  }
}
/*80--------------------------------------------------------------------------*/
