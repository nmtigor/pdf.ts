/*81*****************************************************************************
 * mv
 * -- */

import { Constructor } from "./alias.js";
import { mix } from "./jslang.js";
import { svg } from "./dom.js";
import { vuu_sy, Vuu_sym_t } from "./symbols.js";
import { assert } from "./util/trace.js";
/*81---------------------------------------------------------------------------*/

/**
 * Inwards API, i.e., API called from outside of `Coo`.
 */
export interface CooInterface
{
  reportError?:( error:Error ) => void | Promise<void>;
}

/**
 * Only has access to other Coo's through `ci`.
 * Notice, a in Coo contained Coo also only has access to other Coo's.
 * 
 * @final
 */
export abstract class Coo< CI extends CooInterface=CooInterface >
{
  abstract get ci():CI;
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

declare global 
{
  interface Node
  {
    [vuu_sy]?:Vuu;
    [Vuu_sym_t]?:Constructor<Vuu>;
    // [Vuu_sym_t]?:new ( ...args:any ) => Vuu;
  }
}

/**
 * Wrapper of DOM
 */
export abstract class Vuu< C extends Coo=Coo, E extends Element=Element >
{
  protected coo$;
  get coo() { return this.coo$; }

  protected el$;
  get el() { return this.el$; };

  /**
   * @param { headconst } coo_x
   * @param { headconst } el_x
   */
  constructor( coo_x:C, el_x:E )
  {
    this.coo$ = coo_x;

    this.el$ = el_x;
    //jjjj is this not always Vuu? check!
    this.el$[ vuu_sy ] = this;
    this.el$[ Vuu_sym_t ] = < Constructor<Vuu> >this.constructor;
  }

  get parentvuu1():Vuu | undefined
  {
    let node = this.el$.parentNode;
    while( node && !node[vuu_sy] ) node = node.parentNode;
    return node ? <Vuu>node[vuu_sy] : undefined;
  }

  /**
   * @param { headconst } node_x
   */
  static vuuOf( node_x:Node )
  {
    let node:Node | null = node_x;
    while( node && !node[vuu_sy] ) node = node.parentNode;
    return node ? <Vuu>node[vuu_sy] : undefined;
  }

  // /**
  //  * @deprecated - use DOM's `append()` directly
  //  * @param { headconst Vuu } ret_x
  //  * @param { Element } el_x
  //  * @return { Vuu } - return ret_x
  //  */
  // append( ret_x, el_x = this.el )
  // {
  //   el_x.appendChild( ret_x.el );
    
  //   return ret_x;
  // }

  // /**
  //  * @param { headconst } ret_x
  //  * @param { headconst } el_x
  //  */
  // prepend<V extends Vuu>( ret_x:V, el_x=this.el$ ):V
  // {
  //   el_x.insertBefore( ret_x.el$, el_x.firstChild );

  //   return ret_x;
  // }

  /**
   * @param { headconst } ret_x
   * @param { headconst } refvuu
   * @param { headconst } el_x
   */
  attachBefore<V extends Vuu<C>>( ret_x:V, refvuu?:Vuu, el_x=this.el$ )
  {
    if( refvuu )
         el_x.insertBefore( ret_x.el$, refvuu.el$ );
    else el_x.append( ret_x.el$ );

    return ret_x;
  }

  /**
   * @param { headconst } ret_x
   * @param { headconst } el_x
   */
  detach<V extends Vuu<C>>( ret_x:V, el_x=this.el$ )
  {
    el_x.removeChild( ret_x.el$ );

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

  // /**
  //  * @deprecated - Use `this.el$.attr = 123;` directly
  //  */
  // attr( ...args ) { this.el$.setAttribute( ...args ); }

  // on< EN extends keyof GlobalEventHandlersEventMap >( type:EN, 
  //   listener:MyEventListener< GlobalEventHandlersEventMap[EN] > 
  //          | MyEventListenerObject< GlobalEventHandlersEventMap[EN] > 
  //          | null, 
  //   options?:boolean | AddEventListenerOptions 
  // ) { 
  //   this.el$.on( type, <EventListenerOrEventListenerObject|null>listener, options ); 
  // }
  on( ...args:[string,any,any?] ) { this.el$.on( ...args ); }
  off( ...args:[string,any,any?] ) { this.el$.off( ...args ); }

  // static Vuufn() {}
}
// Vuu.def = "def";

export class HTMLVuu< C extends Coo=Coo, E extends HTMLElement=HTMLElement >
  extends Vuu< C, E >
{  
  // /**
  //  * @param { headconst } coo_x 
  //  * @param { headconst } el_x
  //  */
  // constructor( coo_x:C, el_x:E )
  // {
  //   super( coo_x, el_x );
  // }
}

export class SVGVuu< C extends Coo=Coo, E extends SVGElement=SVGElement >
  extends Vuu< C, E >
{
  // /**
  //  * @param { headconst } coo_x 
  //  * @param { const } viewBox_x 
  //  */
  // constructor( coo_x:C, el_x:E )
  // {
  //   super( coo_x, el_x );
  // }
}

/**
 * It is a `Coo` tfunctionally.
 */
export interface HTMLVCoo< 
  CI extends CooInterface=CooInterface, 
  E extends HTMLElement=HTMLElement
> extends HTMLVuu< Coo<CI>, E >, Coo<CI>
{}
export abstract class HTMLVCoo< CI extends CooInterface, E extends HTMLElement > 
  extends mix( HTMLVuu, Coo )
{
  readonly #ci:CI= Object.create(null);
  /** @implements */
  get ci() { return this.#ci; }

  /**
   * @param { headconst } el_x
   */
  constructor( el_x:E )
  {
    super( undefined, el_x );
    this.coo$ = this;
  }

  showReportedError?( str:string ):void;
}

/**
 * It is a Coo functionally.
 */
export interface SVGVCoo< 
  CI extends CooInterface=CooInterface,
  E extends SVGElement=SVGElement
> extends SVGVuu< Coo<CI>, E >, Coo<CI>
{}
export abstract class SVGVCoo< CI extends CooInterface, E extends SVGElement > 
  extends mix( SVGVuu, Coo )
{
  readonly #ci:CI = Object.create(null);
  /** @implements */
  get ci() { return this.#ci; }

  /**
   * @param { headconst } el_x
   */
  constructor( el_x:E )
  {
    super( undefined, el_x );
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

export class SVGViewbox< CI extends CooInterface=CooInterface > extends SVGVCoo<CI>
{
  /**
   * @param { headconst } coo_x 
   * @param { const } viewBox_x 
   */
  constructor( viewBox_x="0 0 100 100" )
  {
    super( svg("svg") );
    
    this.el$.setAttrs({
      viewBox: viewBox_x,
    });
  }
}
/*81---------------------------------------------------------------------------*/

export type MooEq< T > = ( a:T, b:T ) => boolean;
export type MooHandler< T, D=any > = ( newval:T, oldval?:T, data?:D ) => void;

// type IndexedMooHandler< T > = [ uint, MooHandler<T> ];
// type SortedIndexedMooHandler< T > = SortedArray< IndexedMooHandler<T> >;
interface MooHandlerExt< T, D=any > 
{
  handler:MooHandler< T, D >;
  newval:T | undefined;
  oldval:T | undefined;
  force:boolean;
  index:number;
}
class MooHandlerDB< T, D=any >
{
  readonly #eq:MooEq<T>;

  #_a:MooHandlerExt<T,D>[] = [];
  get empty() { return this.#_a.length === 0; }
  #nforce = 0;
  get force() { return this.#nforce > 0; }
  
  #newval:T | undefined;
  #oldval?:T;
  #got:MooHandler<T,D>[] = [];
  #invalidate_cache = () => { this.#newval = undefined; }

  /**
   * @param { headocnst } eq_x
   */
  constructor( eq_x:MooEq<T> )
  {
    this.#eq = eq_x;
  }

  /**
   * @param { headconst } handler_x 
   * @param { headconst } newval 
   * @param { headconst } oldval 
   * @param { const } force
   * @return `true` if added, `false` if not
   */
  add( handler_x:MooHandler<T,D>, newval?:T, oldval?:T, force=false, index=0 )
  {
    let ret = true;
    if( this.#_a.some(_=>_.handler===handler_x) ) ret = false;

    if( ret )
    {
      if( force ) ++this.#nforce;

      let i = this.#_a.findIndex( ext => index < ext.index );
      if( i < 0 ) i = this.#_a.length;
      this.#_a.splice( i, 0, {
        handler: handler_x,
        newval,
        oldval,
        force,
        index,
      });

      this.#invalidate_cache(); //!
    }
    
    return ret;
  }

  /**
   * @param { headconst } handler_x 
   * @param { headconst } newval 
   * @param { headconst } oldval 
   * @return `true` if deleted, `false` if not
   */
  del( handler_x:MooHandler<T,D>, newval?:T, oldval?:T )
  {
    let ret = true;

    const i = this.#_a.findIndex( ext => ext.handler===handler_x );
    if( i < 0 ) ret = false;
    if( ret && newval !== undefined )
    {
      if( this.#_a[i].newval === undefined
       || !this.#eq( newval, <T>this.#_a[i].newval )
      ) ret = false;
    }
    if( ret && oldval !== undefined )
    {
      if( this.#_a[i].oldval === undefined
       || !this.#eq( oldval, <T>this.#_a[i].oldval )
      ) ret = false;
    }

    if( ret ) 
    {
      if( this.#_a[i].force ) --this.#nforce;

      this.#_a.splice( i, 1 );

      this.#invalidate_cache(); //!
    }
    
    return ret;
  }
  
  get( newval:T, oldval:T, gforce:boolean )
  {
    if( this.#newval !== undefined && this.#eq( newval, this.#newval )
     && this.#oldval !== undefined && this.#eq( oldval, this.#oldval )
    ) return this.#got;

    const nochange = this.#eq( newval, oldval );
    this.#got.length = 0;
    this.#_a.forEach( ext => {
      let got_ = true;

      if( ext.newval !== undefined 
       && !this.#eq( newval, ext.newval )
      ) got_ = false;
      if( got_ 
       && ext.oldval !== undefined 
       && !this.#eq( oldval, ext.oldval )        
      ) got_ = false;
      if( got_
       && !(gforce || ext.force) && nochange
      ) got_ = false;

      if( got_ ) this.#got.push( ext.handler );
    });
    return this.#got;
  }

  clear()
  {
    this.#_a.length = 0;
    this.#nforce = 0;

    this.#invalidate_cache();
  }
}

export class Moo< T, D=any >
{
  readonly #initval:T;
  readonly #eq:MooEq<T>;
  readonly #force:boolean;

  #val!:T;
  get val() { return this.#val; }
  #newval!:T;
  get newval() { return this.#newval; }
  // #handler_db = new Set< MooHandler<T> >();
  #handler_db!:MooHandlerDB<T,D>;
  #forceOnce = false;

  #data:D | undefined;
  set data( data_x:D )
  {
    // // #if INOUT
    //   assert( this.#data === undefined );
    // // #endif

    this.#data = data_x;
  }

  /**
   * @param { headconst } val_x
   * @param { headocnst } eq_x
   * @param { const } force
   */
  constructor( val_x:T, eq_x=(a:T,b:T)=>a===b, force_x?:"force" )
  {
    this.#initval = val_x;
    this.#eq = eq_x;
    this.#force = force_x === undefined ? false : true;

    this.reset();
  }

  reset()
  {
    this.#val = this.#initval;
    this.#newval = this.#initval;
    if( !this.#handler_db?.empty )
      this.#handler_db = new MooHandlerDB<T,D>( this.#eq ); 
    //! not `#handler_db.clear()` b/c `#handler_db` could be shared
    // if( !this.#handler_db ) this.#handler_db = new MooHandlerDB( this.#eq );
    // this.#handler_db.clear();
    this.#forceOnce = this.#force;

    return this;
  }

  /**
   * Without invoking any callbacks.
   */
  set( val:T ) { this.#val = this.#newval = val; }
  
  /** @final */
  registHandler( handler_x:MooHandler<T,D>, newval?:T, oldval?:T, force?:"force", index=0 )
  {
    this.#handler_db.add( handler_x, newval, oldval, force!==undefined, index );
    // console.log( `this.#handler_db.size=${this.#handler_db.size}` );
  }
  /** @final */
  removeHandler( handler_x:MooHandler<T,D>, newval?:T, oldval?:T )
  {
    this.#handler_db.del( handler_x, newval, oldval );
    // console.log( `this.#handler_db.size=${this.#handler_db.size}` );
  }

  /** @final */
  on( newval:T, handler_x:MooHandler<T,D>, force?:"force", index=0 ) 
  { 
    this.registHandler( handler_x, newval, undefined, force, index ); 
  }
  /** @final */
  off( newval:T, handler_x:MooHandler<T,D> ) 
  { 
    this.removeHandler( handler_x, newval ); 
  }

  shareHandlerTo( rhs:Moo<T> ) 
  { 
    // #if INOUT
      assert( rhs.#handler_db.empty || rhs.#handler_db === this.#handler_db );
    // #endif
    // console.log( rhs.#handler_db );

    rhs.#handler_db = this.#handler_db;
  }

  set forceOnce( force:boolean ) { this.#forceOnce = force; }
  force() { this.#forceOnce = true; return this; }
  refresh() { this.force().val = this.#val; }

  set val( val_x:T )
  {
    if( this.#eq( val_x, this.#val ) 
     && !this.#force
     && !this.#forceOnce
     && !this.#handler_db.force
    ) return;

    this.#newval = val_x;
    this.#handler_db.get( val_x, this.#val, this.#force || this.#forceOnce )
      .forEach( handler_y => handler_y( val_x, this.#val, this.#data ) );
    // for( const handler_y of this.#handler_db ) 
    // {
    //   handler_y( val_x, this.#val, this );
    // }
    this.#val = val_x; 
    this.#forceOnce = this.#force;
    this.#data = undefined; // it is used once

    // if( this.once_ ) this.#handler_db.clear();
  }
}
/*81---------------------------------------------------------------------------*/
