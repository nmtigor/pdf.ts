/*81*****************************************************************************
 * dom
** --- */

import { loff_t } from "./alias.js";
import { tail_ignored_sy, loff_sym, ovlap_sy } from "./symbols.js";
/*81---------------------------------------------------------------------------*/

declare global 
{
  interface EventTarget
  {
    on( type:string, listener:any, options?:any ):void;
    off( type:string, listener:any, options?:any ):void;
  }
}

EventTarget.prototype.on = function( 
  type:string, listener:any, options?:any
) { 
  this.addEventListener( type, listener, options ); 
}
EventTarget.prototype.off = function( 
  type:string, listener:any, options?:any
) { 
  this.removeEventListener( type, listener, options ); 
}
/*64----------------------------------------------------------*/

declare global
{
  interface Event
  {
    canceled_?:boolean;
    canceled:boolean;
  }
}

Reflect.defineProperty( Event.prototype, "canceled", {
  get( this:Event ) { return this.canceled_ ?? false; },
  set( this:Event, canceled_x:boolean ) { this.canceled_ = canceled_x; },
});
/*64----------------------------------------------------------*/

declare global 
{
  interface Node
  {
    readonly isText:boolean;
    readonly secondChild:Node | null;
    removeAllChild:() => this;
    assert_eq:( rhs:object ) => void | never;
  }
}

Reflect.defineProperty( Node.prototype, "isText", {
  get( this:Node ) {
    return this.nodeType === Node.TEXT_NODE;
  },
});

Reflect.defineProperty( Node.prototype, "secondChild", {
  get( this:Node ) {
    return this.firstChild ? this.firstChild.nextSibling : null;
  },
});

Node.prototype.removeAllChild = function()
{
  while( this.firstChild ) this.removeChild( this.lastChild! );
  return this;
}

// /**
//  * @deprecated - Use Node.isConnected property
//  * @return { Boolean }
//  */
// Node.prototype.attached = function()
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
 * @param { headconst } rhs
 */
Node.prototype.assert_eq = function( rhs )
{
  // if( rhs && rhs[ref_test_sym] )
  // {
  //   console.assert( this === rhs[ref_test_sym] );
  //   return;
  // }
  
  if( this === rhs ) return;

  for( const key of Reflect.ownKeys(rhs) ) 
  {
    if( key === "childNodes" ) continue;
    
    const rhsval = (<any>rhs)[ key ];
    const zisval = (<any>this)[ key ];
    if( Array.isArray(rhsval) )
         console.assert( (<any[]>rhsval).eq( zisval ) );
    else console.assert( rhsval === zisval );
  }

  if( (<any>rhs).childNodes )
  {
    const childNodes = (<any>rhs).childNodes;
    console.assert( childNodes.length === this.childNodes.length );
    for( let i = childNodes.length; i--; )
      this.childNodes[i].assert_eq( childNodes[i] );
  }

  // if( rhs && rhs[test_ref_sym] ) rhs[ ref_test_sym ] = this;
}
/*64----------------------------------------------------------*/

declare global 
{
  interface Element
  {
    setAttrs( attrs_o:{ [key:string]:string } ):this;

    readonly scrollRight:number;
    readonly scrollBottom:number;
  }
}

Element.prototype.setAttrs = function( attrs_o ) 
{
  for( const key in attrs_o )
  {
    this.setAttribute( key, attrs_o[key] );
  }
  return this;
}

Reflect.defineProperty( Element.prototype, "scrollRight", {
  get( this:Element ) {
    return this.scrollLeft + this.clientWidth;
  },
});
Reflect.defineProperty( Element.prototype, "scrollBottom", {
  get( this:Element ) {
    return this.scrollTop + this.clientHeight;
  },
});
/*64----------------------------------------------------------*/

declare global 
{
  interface HTMLElement
  {
    /**
     * Return previous visible _HTMLElement_.
     */
    readonly prevVisible?:HTMLElement;

    readonly pageX:number;
    readonly pageY:number;
  }
}

Reflect.defineProperty( HTMLElement.prototype, "prevVisible", {
  get( this:HTMLElement ) {
    let ret = <any>this.previousSibling;
    while( ret )
    {
      if( !(ret instanceof HTMLElement) ) continue;

      if( ret.style.display !== "none" ) break;

      ret = ret.previousSibling;
    }
    ret ??= undefined;
    return ret;
  },
});

Reflect.defineProperty( HTMLElement.prototype, "pageX", {
  get( this:HTMLElement ) {
    let ret = 0;
    let el = <any>this;
    do {
      ret += el?.offsetLeft ?? 0;
      ret += el?.clientLeft ?? 0;
      ret -= el?.scrollLeft ?? 0;
    }
    while( el = el.offsetParent );
    return ret;
  },
});
Reflect.defineProperty( HTMLElement.prototype, "pageY", {
  get( this:HTMLElement ) {
    let ret = 0;
    let el = <any>this;
    do {
      ret += el?.offsetTop ?? 0;
      ret += el?.clientTop ?? 0;
      ret -= el?.scrollTop ?? 0;
    }
    while( el = el.offsetParent );
    return ret;
  },
});
/*64----------------------------------------------------------*/

declare global 
{
  interface HTMLCollection
  {
    indexOf( element:Element ):number;
  }
  
  // var HTMLCollectionBase:{
  //   prototype:HTMLCollectionBase;
  // }
}

HTMLCollection.prototype.indexOf = function( element )
{
  for( let i = 0; i < this.length; ++i )
  {
    if( this.item(i) === element ) return i;
  }
  return -1;
}
/*64----------------------------------------------------------*/

export type HSElement = HTMLElement | SVGElement;
/*64----------------------------------------------------------*/

declare global 
{
  interface DOMRect
  {
    [ovlap_sy]:boolean;
  }

  interface Range
  {
    /**
     * @param { out } rec_a
     * @param { const } ovlap
     */
    getReca( rec_a:DOMRect[], ovlap?:boolean ):void;
    
    reset():void;
  }
}

Range.prototype.getReca = function( rec_a:DOMRect[], ovlap=false )
{
  const recs = this.getClientRects();
  if( recs.length )
  {
    for( let i = 0; i < recs.length; i++ ) 
    {
      const rec = recs[i];
      if( rec.width === 0 ) rec.width = rec.height * .1;
      rec[ ovlap_sy ] = ovlap;
      rec_a.push( rec );
    }
  }
  else {
    const rec = this.getBoundingClientRect();
    rec.width = rec.height * .1
    rec[ ovlap_sy ] = ovlap;
    rec_a.push( rec );
  }
}

Range.prototype.reset = function()
{
  this.setEnd( document, 0 );
  this.collapse();
}
/*64----------------------------------------------------------*/

declare global 
{
  interface Text
  {
    [loff_sym]:loff_t;
    [tail_ignored_sy]:boolean;
  }
}

/**
 * @param { const } text_x 
 * @param { const } loff_x
 * @param { const } tail_ignored_x
 */
export function textnode( text_x:string, loff_x?:loff_t, tail_ignored_x?:boolean )
{
  const ret = document.createTextNode( text_x );
  if( loff_x !== undefined ) ret[ loff_sym ] = loff_x;
  if( tail_ignored_x !== undefined ) ret[ tail_ignored_sy ] = tail_ignored_x;
  return ret;
}
/*64----------------------------------------------------------*/

type HTMLRet<NN extends string> = NN extends keyof HTMLElementTagNameMap 
  ? HTMLElementTagNameMap[NN] 
  : HTMLElement
;
export function html<NN extends string>( 
  nodeName:NN, innerHTML?:string, doc:Document=document
) { 
  let ret = doc.createElement( nodeName ); 
  if( innerHTML ) ret.innerHTML = innerHTML;
  return <HTMLRet<NN>>ret;
}

export function div( innerHTML?:string, doc:Document=document ) { return html( "div", innerHTML, doc ); }
export function span( innerHTML?:string, doc:Document=document ) { return html( "span", innerHTML, doc ); }

type SVGRet<NN extends string> = NN extends keyof SVGElementTagNameMap
  ? SVGElementTagNameMap[NN]
  : SVGElement
;
export function svg<NN extends string>( 
  nodeName:NN, doc:Document=document
) {
  return <SVGRet<NN>>doc.createElementNS( "http://www.w3.org/2000/svg", nodeName );
}
/*64----------------------------------------------------------*/

declare global 
{
  interface OnProgressParms
  {
    /**
     * Currently loaded number of bytes.
     */
    loaded:number;

    /**
     * Total number of bytes in the PDF file.
     */
    total:number;
  }
}
/*81---------------------------------------------------------------------------*/
