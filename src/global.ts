/*81*****************************************************************************
 * global
** ------ */

import { HTMLVCoo } from "./lib/mv.js";
import { assert } from "./lib/util/trace.js";
/*81---------------------------------------------------------------------------*/

/**
 * Singleton
 * @final
 */
class Global
{
  testing = false; /** @deprecated use preprocessor */

  readonly LASTUPDATE_NOT = "2020-07-10 22:17:59 +0200";
  readonly LASTUPDATE_DATNI = "2020-07-24 01:59:51 +0200";
  readonly LASTUPDATE_DEV = "2021-05-22 05:04:21 +0200";

  globalhvc?:HTMLVCoo;

  has_ResizeObserver = false;
  can_touchstart = false;
  
  readonly #tabsize = 2;
  #dent = 0;
  get dent()
  {
    let ret;
    if( this.#dent === 0 )
         ret = "";
    else ret = new Array( this.#dent ).fill( " ", 0 ).join("");
    return ret;
  }
  get indent()
  {
    const ret = this.dent;
    this.#dent += this.#tabsize;
    return ret;
  }
  get outdent()
  {
    this.#dent -= this.#tabsize;
    assert( this.#dent >= 0 );
    return this.#dent;
  }
  // inlog( s_x:string, c_x?:string )
  // {
  //   if( c_x === undefined )
  //        console.log( `${this.indent}${s_x}` );
  //   else console.log( `%c${this.indent}${s_x}`, `color:${c_x}` );
  // }
  // log( s_x:string, c_x?:string )
  // {
  //   if( c_x === undefined )
  //        console.log( `${this.dent}${s_x}` );
  //   else console.log( `%c${this.dent}${s_x}`, `color:${c_x}` );
  // }
}

export const global = new Global;
/*81---------------------------------------------------------------------------*/
