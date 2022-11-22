/*80****************************************************************************
 * global
** -------------------------------------------------------------------------- */

import { HTMLVCo } from "./lib/mv.ts";
import { assert } from "./lib/util/trace.ts";
/*80--------------------------------------------------------------------------*/

// preprocessor names
// deno-fmt-ignore
export const 
  INOUT = true // contracts
, DEV = true // debug build
  , INFO = true // info of calling trace, interim results
    , RESIZ = false // "resize", ResizeObserver
    , INTRS = false // IntersectionObserver
    , EDITOR = true
      , EDITOR_v = true // verbose
      , EDITOR_vv = false // very verbose
    , PDFTS = true
      , PDFTS_v = true // verbose
        , PDFTS_vv = false // very verbose
, _INFO = DEV && INFO
, APP = false // release build

, DENO = false

, TESTING = false
  , /** @deprecated */TEST_ALL = false 

  // from pdf.js
, GENERIC = true
, MOZCENTRAL = false
, CHROME = false
, PRODUCTION = false
, LIB = false
, SKIP_BABEL = true
, IMAGE_DECODERS = false
, COMPONENTS = false
, _PDFDEV = !PRODUCTION || TESTING
;
/*80-------------------------------------------------------------------------*/

export const global = new class {
  /** @deprecated Use preprocessor. */
  testing = false;

  readonly LASTUPDATE_NOT = "2020-07-10 22:17:59 +0200";
  readonly LASTUPDATE_DATNI = "2020-07-24 01:59:51 +0200";
  readonly LASTUPDATE_DEV = "2021-05-22 05:04:21 +0200";

  ghvc?: HTMLVCo;
  // holdindicatr?: [HoldIndicatr, HoldIndicatr, HoldIndicatr];

  /** @deprecated */
  has_ResizeObserver = false;

  can_touchstart = false;

  readonly #tabsize = 2;
  #dent = 0;
  get dent() {
    let ret;
    if (this.#dent === 0) {
      ret = "";
    } else ret = new Array(this.#dent).fill(" ", 0).join("");
    return ret;
  }
  get indent() {
    const ret = this.dent;
    this.#dent += this.#tabsize;
    return ret;
  }
  get outdent() {
    this.#dent -= this.#tabsize;
    assert(this.#dent >= 0);
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
}();
/*80--------------------------------------------------------------------------*/
