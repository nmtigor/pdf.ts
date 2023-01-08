/** 80**************************************************************************
 * @module lib/mv
 * @license Apache-2.0
 ******************************************************************************/

import { INOUT } from "../global.ts";
import { CSSStyle } from "./alias.ts";
import { svg } from "./dom.ts";
import { mix } from "./jslang.ts";
import { $vuu } from "./symbols.ts";
import { assert, type ReportedError } from "./util/trace.ts";
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

  get parentVuu1(): Vuu | undefined {
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
   * @headconst @param ret_x
   * @headconst @param refvuu
   */
  attachBefore<V extends Vuu<C>>(ret_x: V, refvuu?: Vuu) {
    if (refvuu) {
      this.el$.insertBefore(ret_x.el$, refvuu.el$);
    } else {
      this.el$.append(ret_x.el$);
    }
    return ret_x;
  }

  /**
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

  assignAttro(attr_o: Record<string, string>): this {
    this.el$.assignAttro(attr_o);
    return this;
  }

  // static Vuufn() {}

  set cyName(name_x: string) {
    this.el$.setAttribute("data-cy", name_x);
  }
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

export class SVGViewbox<CI extends CooInterface = CooInterface>
  extends SVGVCo<CI> {
  /**
   * @headconst @param coo_x
   * @const @param viewBox_x
   */
  constructor(viewBox_x = "0 0 100 100") {
    super(svg("svg"));
    this.el$.setAttribute("viewBox", viewBox_x);
  }
}
/*80--------------------------------------------------------------------------*/

export type MooEq<T extends {} | null> = (a: T, b: T) => boolean;
export type MooHandler<T extends {} | null, D = any> = (
  newval: T,
  oldval?: T,
  data?: D,
) => void;

// type IndexedMooHandler< T > = [ uint, MooHandler<T> ];
// type SortedIndexedMooHandler< T > = SortedArray< IndexedMooHandler<T> >;
interface MooHandlerExt<T extends {} | null, D = any> {
  handler: MooHandler<T, D>;
  match_newval: T | undefined;
  match_oldval: T | undefined;
  force: boolean;
  index: number;
}
class MooHandlerDB<T extends {} | null, D = any> {
  readonly #eq: MooEq<T>;

  readonly #_a: MooHandlerExt<T, D>[] = [];
  get len_$() {
    return this.#_a.length;
  }
  get empty() {
    return this.#_a.length === 0;
  }

  #nforce = 0;
  get forcing_$() {
    return this.#nforce > 0;
  }

  /**
   * @headconst @param eq_x
   */
  constructor(eq_x: MooEq<T>) {
    this.#eq = eq_x;
  }

  /**
   * @headconst @param handler_x
   * @headconst @param match_newval_x
   * @headconst @param match_oldval_x
   * @const @param force_x
   * @const @param index_x
   * @return `true` if added, `false` if not.
   */
  add(
    handler_x: MooHandler<T, D>,
    match_newval_x?: T,
    match_oldval_x?: T,
    force_x = false,
    index_x = 0,
  ) {
    if (this.#_a.some((_) => _.handler === handler_x)) return false;

    if (force_x) ++this.#nforce;

    let i = this.#_a.findIndex((ext_y) => index_x < ext_y.index);
    if (i < 0) i = this.#_a.length;
    this.#_a.splice(i, 0, {
      handler: handler_x,
      match_newval: match_newval_x,
      match_oldval: match_oldval_x,
      force: force_x,
      index: index_x,
    });
    this.#got.length = 0; //!
    return true;
  }

  /**
   * @primaryconst
   * Not `@const` because `#eq()` could cause non-primary changes, which happens
   * in elements of `#_a`.
   */
  #strict_eq(v0_x: T | undefined, v1_x: T | undefined) {
    return v0_x === undefined && v1_x === undefined ||
      v0_x !== undefined && v1_x !== undefined && this.#eq(v0_x, v1_x);
  }

  /**
   * @headconst @param handler_x
   * @headconst @param match_newval_x
   * @headconst @param match_oldval_x
   * @return `true` if deleted, `false` if not
   */
  del(handler_x: MooHandler<T, D>, match_newval_x?: T, match_oldval_x?: T) {
    const i = this.#_a.findIndex((ext) => ext.handler === handler_x);
    if (i < 0) return false;

    const toDel = this.#_a[i];
    const del_ = this.#strict_eq(toDel.match_newval, match_newval_x) &&
      this.#strict_eq(toDel.match_oldval, match_oldval_x);
    if (del_) {
      if (toDel.force) --this.#nforce;

      this.#_a.splice(i, 1);
      this.#got.length = 0; //!
    }
    return del_;
  }

  /** @primaryconst */
  #match(v0_x: T | undefined, v1_x: T) {
    return v0_x === undefined || this.#eq(v0_x, v1_x);
  }

  #newval: T | undefined;
  #oldval: T | undefined;
  #gforce: boolean | undefined;
  #got: MooHandler<T, D>[] = [];
  get(newval_x: T, oldval_x: T, gforce_x: boolean) {
    if (
      this.#newval !== undefined && this.#eq(this.#newval, newval_x) &&
      this.#oldval !== undefined && this.#eq(this.#oldval, oldval_x) &&
      this.#gforce === gforce_x
    ) {
      return this.#got;
    }

    this.#newval = newval_x;
    this.#oldval = oldval_x;
    this.#gforce = gforce_x;
    this.#got.length = 0;

    const changed_ = !this.#eq(newval_x, oldval_x);
    this.#_a.forEach((ext) => {
      if (
        this.#match(ext.match_newval, newval_x) &&
        this.#match(ext.match_oldval, oldval_x) &&
        (changed_ || gforce_x || ext.force)
      ) {
        this.#got.push(ext.handler);
      }
    });
    return this.#got;
  }

  clear() {
    this.#_a.length = 0;
    this.#got.length = 0;
    this.#nforce = 0;
  }
}

/**
 * Instance of `Moo` concerns about one value, whether it changes or not.
 * Instance of `Moo` stores many callbacks.
 */
export class Moo<T extends {} | null, D = any> {
  readonly #initval: T;
  readonly #eq: MooEq<T>;
  readonly #forcing: boolean;

  #val!: T;
  get val() {
    return this.#val;
  }

  #newval!: T;
  get newval() {
    return this.#newval;
  }

  // #handler_db = new Set< MooHandler<T> >();
  #handler_db!: MooHandlerDB<T, D>;
  get _len() {
    return this.#handler_db.len_$;
  }

  #forcingOnce = false;
  set forceOnce(force_x: boolean) {
    this.#forcingOnce = force_x;
  }
  force(): this {
    this.#forcingOnce = true;
    return this;
  }

  get #forcing_() {
    return this.#forcing || this.#forcingOnce;
  }

  #data: D | undefined;
  set data(data_x: D) {
    // // #if INOUT
    //   assert( this.#data === undefined );
    // // #endif
    this.#data = data_x;
  }

  /**
   * @headconst @param val_x
   * @headconst @param eq_x
   * @const @param force_x
   */
  constructor(val_x: T, eq_x = (a: T, b: T) => a === b, force_x?: "force") {
    this.#initval = val_x;
    this.#eq = eq_x;
    this.#forcing = force_x === undefined ? false : true;

    this.reset();
  }

  /**
   * Without invoking any callbacks.
   */
  set(val: T) {
    this.#val = this.#newval = val;
  }

  /** @final */
  reset(): this {
    this.set(this.#initval);
    if (!this.#handler_db?.empty) {
      this.#handler_db = new MooHandlerDB<T, D>(this.#eq);
    }
    //! Not `#handler_db.clear()` because `#handler_db` could be shared.
    // if( !this.#handler_db ) this.#handler_db = new MooHandlerDB( this.#eq );
    // this.#handler_db.clear();
    this.#forcingOnce = this.#forcing;
    return this;
  }

  /** @final */
  registHandler(
    handler_x: MooHandler<T, D>,
    match_newval_x?: T,
    match_oldval_x?: T,
    force_x?: "force",
    index_x = 0,
  ) {
    this.#handler_db.add(
      handler_x,
      match_newval_x,
      match_oldval_x,
      force_x !== undefined,
      index_x,
    );
    // console.log( `this.#handler_db.size=${this.#handler_db.size}` );
  }
  /** @final */
  removeHandler(
    handler_x: MooHandler<T, D>,
    match_newval_x?: T,
    match_oldval_x?: T,
  ) {
    this.#handler_db.del(handler_x, match_newval_x, match_oldval_x);
    // console.log( `this.#handler_db.size=${this.#handler_db.size}` );
  }
  /** @final */
  registOnceHandler(
    handler_x: MooHandler<T, D>,
    match_newval_x?: T,
    match_oldval_x?: T,
    force_x?: "force",
    index_x = 0,
  ) {
    const wrap_ = (newval_y: T, oldval_y?: T, data_y?: D) => {
      handler_x(newval_y, oldval_y, data_y);
      this.removeHandler(wrap_, match_newval_x, match_oldval_x);
    };
    this.registHandler(
      wrap_,
      match_newval_x,
      match_oldval_x,
      force_x,
      index_x,
    );
  }

  /** @final */
  on(
    newval_x: T,
    handler_x: MooHandler<T, D>,
    force_x?: "force",
    index_x = 0,
  ) {
    this.registHandler(handler_x, newval_x, undefined, force_x, index_x);
  }
  /** @final */
  off(newval_x: T, handler_x: MooHandler<T, D>) {
    this.removeHandler(handler_x, newval_x);
  }
  /** @final */
  once(
    newval_x: T,
    handler_x: MooHandler<T, D>,
    force_x?: "force",
    index_x = 0,
  ) {
    this.registOnceHandler(
      handler_x,
      newval_x,
      undefined,
      force_x,
      index_x,
    );
  }

  set val(val_x: T) {
    if (
      this.#eq(val_x, this.#val) &&
      !this.#forcing_ &&
      !this.#handler_db.forcing_$
    ) {
      return;
    }

    this.#newval = val_x;
    this.#handler_db.get(val_x, this.#val, this.#forcing_)
      .forEach((handler_y) => handler_y(val_x, this.#val, this.#data));
    // for( const handler_y of this.#handler_db )
    // {
    //   handler_y( val_x, this.#val, this );
    // }
    this.#val = val_x;
    this.#forcingOnce = this.#forcing;
    this.#data = undefined; // it is used once

    // if( this.once_ ) this.#handler_db.clear();
  }

  refresh() {
    this.force().val = this.#val;
  }

  shareHandlerTo(rhs: Moo<T, D>) {
    /*#static*/ if (INOUT) {
      assert(rhs.#handler_db.empty || rhs.#handler_db === this.#handler_db);
    }
    // console.log( rhs.#handler_db );
    rhs.#handler_db = this.#handler_db;
  }
}
// new Moo(undefined); // error
// new Moo(null); // ok
// new Moo(2); // ok
/*80--------------------------------------------------------------------------*/
