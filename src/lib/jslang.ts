/*81*****************************************************************************
 * jslang
** ------ */

import { 
  type AbstractConstructor, 
  type Constructor, 
  type FloatArray, 
  type IntegerArray, 
  type uint, 
  type uint8 
} from "./alias.js";
import { assert } from "./util/trace.js";
/*81---------------------------------------------------------------------------*/

// Ref. https://lodash.com/docs/4.17.15#isObjectLike
export function isObjectLike( value:unknown ):value is object
{
  return value != null && typeof value == "object";
}

let valve = 0;
/**
 * ! Compare deeply Object, Array only.
 * ! Compare enumerable own string-properties only.
 * 
 * @param { headconst } lhs_x
 * @param { headconst } rhs_x
 */
function eq_impl( lhs_x:unknown, rhs_x:unknown ):boolean
{
  // #if INOUT
    assert( valve--,
      "There is element referencing its ancestor.", import.meta
    );
  // #endif
  if( lhs_x === rhs_x
   || Number.isNaN(<any>lhs_x) && Number.isNaN(<any>rhs_x) //! Notice, `NaN === NaN` is false.
  ) return true;

  if( Array.isArray(lhs_x) )
  {
    if( !Array.isArray(rhs_x) ) return false;

    if( lhs_x.length !== rhs_x.length ) return false;
    if( !lhs_x.length && !rhs_x.length ) return true;
    
    let ret = false;
    for( let i = lhs_x.length; i--; )
    {
      ret = eq_impl( lhs_x[i], rhs_x[i] );
      
      if( !ret ) break;
    }
    return ret;  
  }

  if( lhs_x instanceof Int8Array 
   || lhs_x instanceof Uint8Array
   || lhs_x instanceof Uint8ClampedArray
   || lhs_x instanceof Int16Array
   || lhs_x instanceof Uint16Array
   || lhs_x instanceof Int32Array
   || lhs_x instanceof Uint32Array
   || lhs_x instanceof Float32Array
   || lhs_x instanceof Float64Array
  ) return lhs_x.eq( rhs_x );
  
  if( isObjectLike(lhs_x) )
  {
    if( !isObjectLike(rhs_x) || Array.isArray(rhs_x) ) return false;

    const keys_lhs = Object.keys( lhs_x );
    const keys_rhs = Object.keys( rhs_x );
    if( keys_lhs.length !== keys_rhs.length ) return false;
    if( !keys_lhs.length && !keys_rhs.length ) return true;

    let ret = false;
    for( const key of keys_lhs )
    {
      if( rhs_x.hasOwnProperty )
           ret ||= rhs_x.hasOwnProperty(key);
      else ret ||= key in rhs_x; //! rhs_x could be Object without proto.
      ret &&= eq_impl( (<any>lhs_x)[key], (<any>rhs_x)[key] );

      if( !ret ) break;
    }
    return ret;  
  }
  
  return false;
}
export function eq( lhs_x:unknown, rhs_x:unknown, valve_x=100 ):boolean
{
  valve = valve_x;
  return eq_impl( lhs_x, rhs_x );

}

declare global 
{
  interface Object
  {
    eq( rhs_x:unknown, valve_x?:uint ):boolean;
  }
}

/**
 * @param { headconst } rhs
 * @param { const } valve_x
 */
Reflect.defineProperty( Object.prototype, "eq", {
  value( this:Object, rhs_x:unknown, valve_x=100 )
  {
    valve = valve_x;
    return eq_impl( this, rhs_x );
  }
});

// Reflect.defineProperty( Object.prototype, "toString_eq", {
//   enumerable: false,
//   value: function( rhs_x:string )
//   {
//     console.assert( this.toString() === rhs_x );
//     return this;
//   }
// })
/*81---------------------------------------------------------------------------*/

declare global 
{
  //! Make sure non-`enumerable`.
  interface Array<T>
  {
    last:T | undefined;

    /**
     * @param { headconst } rhs
     * @param { const } valve_x
     */
    eq( rhs_x:unknown, valve_x?:uint ):boolean;

    fillArray( ary:[] ):this;
    fillArrayBack( ary:any[] ):this;
  }
}

Reflect.defineProperty( Array.prototype, "last", {
  get( this:Array<any> ) { return this[ this.length - 1 ]; }
});

Reflect.defineProperty( Array.prototype, "eq", {
  value( this:Array<any>, rhs_x:unknown, valve_x=100 )
  {
    valve = valve_x;
    return eq_impl( this, rhs_x );
  }
});

/**
 * @param { const } ary
 */
Reflect.defineProperty( Array.prototype, "fillArray", {
  value( this:Array<any>, ary:any[] )
  {
    // #if INOUT
      assert( ary.length <= this.length );
    // #endif
    for( let i = 0, LEN = this.length; i < LEN; ++i )
    {
      this[i] = ary[i];
    }
    return this;
  }
});
Reflect.defineProperty( Array.prototype, "fillArrayBack", {
  value( this:Array<any>, ary:any[] )
  {
    // #if INOUT
      assert( ary.length <= this.length );
    // #endif
    for( let i = this.length; i--; )
    {
      this[i] = ary[i];
    }
    return this;
  }
});
/*81---------------------------------------------------------------------------*/

/**
 * @param { const } cp Code Point returned by `string.charCodeAt()`
 */
export function isDecimalDigit( cp:uint ):boolean
{
  return 0x30 <= cp && cp <= 0x39;
}
export function isHexDigit( cp:uint ):boolean
{
  return (0x30 <= cp && cp <= 0x39) // 0..9
      || (0x41 <= cp && cp <= 0x46) // A..F
      || (0x61 <= cp && cp <= 0x66); // a..f
}
export function isOctalDigit( cp:uint ):boolean 
{
  return (0x30 <= cp && cp <= 0x37); // 0..7
}

export function isASCIIUpLetter( cp:uint ):boolean 
{
  return (0x41 <= cp && cp <= 0x5A); // A..Z
}
export function isASCIILoLetter( cp:uint ):boolean 
{
  return (0x61 <= cp && cp <= 0x7A); // a..z
}
export function isASCIILetter( cp:uint ):boolean 
{
  return isASCIIUpLetter(cp) || isASCIILoLetter(cp);
}
/*81---------------------------------------------------------------------------*/

declare global 
{
  interface Number
  {
    /**
     * in( 0 <= digits && digits <= 20 )
     */
    fixTo( digits?:uint8 ):number;
  }

  interface NumberConstructor
  {
    apxE( f0:number, f1:number ):boolean;
    apxS( f0:number, f1:number ):boolean;
    apxSE( f0:number, f1:number ):boolean;
    apxG( f0:number, f1:number ):boolean;
    apxGE( f0:number, f1:number ):boolean;

    /**
     * [min,max]
     * ! [min,max) normaally, but could achieve `max` because of `Math.round()`.
     */
    getRandom( max:number, min?:number, fixt?:uint ):number;
  }
}

Number.apxE = ( f0, f1 ) => Math.abs( f0 - f1 ) <= Number.EPSILON;
Number.apxS = function( f0, f1 ) { return f0 < f1 - Number.EPSILON; }
Number.apxSE = function( f0, f1 ) { return f0 <= f1 + Number.EPSILON; }
Number.apxG = function( f0, f1 ) { return f0 > f1 + Number.EPSILON; }
Number.apxGE = function( f0, f1 ) { return f0 >= f1 - Number.EPSILON; }
Number.getRandom = function( max, min=0, fixto=0 ) { 
  return min + ( Math.random() * (max - min) ).fixTo( fixto ); 
}

Number.prototype.fixTo = function( digits=0 )
{
  const mul = 10 ** digits;
  return Math.round( this.valueOf() * mul ) / mul;
}
/*81-----------------------------------------------------------------------------
 * TypedArray
** ---------- */

function iaEq_impl<TA extends IntegerArray>( lhs_x:TA, rhs_x:TA )
{
  if( rhs_x.length !== lhs_x.length ) return false;

  for( let i = lhs_x.length; i--; )
  {
    if( rhs_x[i] !== lhs_x[i] ) return false;
  }
  return true;
}
function faEq_impl<TA extends FloatArray>( lhs_x:TA, rhs_x:TA )
{
  if( rhs_x.length !== lhs_x.length ) return false;

  for( let i = lhs_x.length; i--; )
  {
    if( !Number.apxE(rhs_x[i], lhs_x[i]) ) return false;
  }
  return true;
}

declare global 
{
  interface Int8Array
  {
    /**
     * @param { const } rhs_x
     */
    eq( rhs_x:unknown ):boolean;
  }
  interface Uint8Array
  {
    /**
     * @param { const } rhs_x
     */
    eq( rhs_x:unknown ):boolean;
  }
  interface Uint8ClampedArray
  {
    /**
     * @param { const } rhs_x
     */
    eq( rhs_x:unknown ):boolean;
  }
  interface Int16Array
  {
    /**
     * @param { const } rhs_x
     */
    eq( rhs_x:unknown ):boolean;
  }
  interface Uint16Array
  {
    /**
     * @param { const } rhs_x
     */
    eq( rhs_x:unknown ):boolean;
  }
  interface Int32Array
  {
    /**
     * @param { const } rhs_x
     */
    eq( rhs_x:unknown ):boolean;
  }
  interface Uint32Array
  {
    /**
     * @param { const } rhs_x
     */
    eq( rhs_x:unknown ):boolean;
  }
  interface Float32Array
  {
    /**
     * @param { const } rhs_x
     */
    eq( rhs_x:unknown ):boolean;
  }
  interface Float64Array
  {
    /**
     * @param { const } rhs_x
     */
    eq( rhs_x:unknown ):boolean;
  }
}

Reflect.defineProperty( Int8Array.prototype, "eq", {
  value( this:Int8Array, rhs_x:unknown )
  {
    if( !(rhs_x instanceof Int8Array) ) return false;

    return iaEq_impl( this, rhs_x );
  }
});
Reflect.defineProperty( Uint8Array.prototype, "eq", {
  value( this:Uint8Array, rhs_x:unknown )
  {
    if( !(rhs_x instanceof Uint8Array) ) return false;

    return iaEq_impl( this, rhs_x );
  }
});
Reflect.defineProperty( Uint8ClampedArray.prototype, "eq", {
  value( this:Uint8ClampedArray, rhs_x:unknown )
  {
    if( !(rhs_x instanceof Uint8ClampedArray) ) return false;

    return iaEq_impl( this, rhs_x );
  }
});
Reflect.defineProperty( Int16Array.prototype, "eq", {
  value( this:Int16Array, rhs_x:unknown )
  {
    if( !(rhs_x instanceof Int16Array) ) return false;

    return iaEq_impl( this, rhs_x );
  }
});
Reflect.defineProperty( Uint16Array.prototype, "eq", {
  value( this:Uint16Array, rhs_x:unknown )
  {
    if( !(rhs_x instanceof Uint16Array) ) return false;

    return iaEq_impl( this, rhs_x );
  }
});
Reflect.defineProperty( Int32Array.prototype, "eq", {
  value( this:Int32Array, rhs_x:unknown )
  {
    if( !(rhs_x instanceof Int32Array) ) return false;

    return iaEq_impl( this, rhs_x );
  }
});
Reflect.defineProperty( Uint32Array.prototype, "eq", {
  value( this:Uint32Array, rhs_x:unknown )
  {
    if( !(rhs_x instanceof Uint32Array) ) return false;

    return iaEq_impl( this, rhs_x );
  }
});
Reflect.defineProperty( Float32Array.prototype, "eq", {
  value( this:Float32Array, rhs_x:unknown )
  {
    if( !(rhs_x instanceof Float32Array) ) return false;

    return faEq_impl( this, rhs_x );
  }
});
Reflect.defineProperty( Float64Array.prototype, "eq", {
  value( this:Float64Array, rhs_x:unknown )
  {
    if( !(rhs_x instanceof Float64Array) ) return false;

    return faEq_impl( this, rhs_x );
  }
});
/*81---------------------------------------------------------------------------*/

declare global 
{
  interface Date
  {
    myformat():string;
    getShiChen():"???"|"???"|"???"|"???"|"???"|"???"|"???"|"???"|"???"|"???"|"???"|"???";
  }

  interface DateConstructor
  {
    date:Date;
    setHours( refdate:Date, hours:number, min?:number, sec?:number, ms?:number ):number;
    setDate( refdate:Date, date:number ):number;
    setMonth( refdate:Date, month:number, date?:number):number;
    setFullYear( refdate:Date, year:number, month?:number, date?:number):number;
  }
}

Date.prototype.myformat = function():string
{
  // let month_s;
  // switch( this.getMonth() )
  // {
  // case 0: month_s = "Jan"; break;
  // case 1: month_s = "Feb"; break;
  // case 2: month_s = "Mar"; break;
  // case 3: month_s = "Apr"; break;
  // case 4: month_s = "May"; break;
  // case 5: month_s = "Jun"; break;
  // case 6: month_s = "Jul"; break;
  // case 7: month_s = "Aug"; break;
  // case 8: month_s = "Sep"; break;
  // case 9: month_s = "Oct"; break;
  // case 10: month_s = "Nov"; break;
  // default: month_s = "Dec"; break;
  // }

  // const _0 = ( v ) => `${v<10?"0":""}${v}`;

  const tz = this.getTimezoneOffset();
  
  return [
    [ `${ this.getFullYear() }`, 
      `${ this.getMonth() + 1 }`.padStart( 2, "0" ),
      `${ this.getDate() }`.padStart( 2, "0" ) 
    ].join( "-" ),
    [ `${ this.getHours() }`.padStart( 2, "0" ),
      `${ this.getMinutes() }`.padStart( 2, "0" ),
      `${ this.getSeconds() }`.padStart( 2, "0" ) 
    ].join( ":" ),
    [ `${ tz <= 0 ? "+" : "-" }`,
      `${ Math.floor( Math.abs( tz ) / 60 ) }`.padStart( 2, "0" ),
      `${ Math.abs( tz ) % 60 }`.padStart( 2, "0" )
    ].join( "" ),
  ].join( " " );
}

Date.prototype.getShiChen = function()
{
  switch( this.getHours() )
  {
  case 23: case 0:  return "???";
  case 1:  case 2:  return "???";
  case 3:  case 4:  return "???";
  case 5:  case 6:  return "???";
  case 7:  case 8:  return "???";
  case 9:  case 10: return "???";
  case 11: case 12: return "???";
  case 13: case 14: return "???";
  case 15: case 16: return "???";
  case 17: case 18: return "???";
  case 19: case 20: return "???";
  default:          return "???";
  }
}

Date.date = new Date;
Date.setHours = function( refdate, hours, min, sec, ms )
{
  Date.date.setTime( refdate.getTime() );
  if( ms !== undefined )
    return Date.date.setHours( hours, min, sec, ms );
  else if( sec !== undefined )
    return Date.date.setHours( hours, min, sec );
  else if( min !== undefined )
    return Date.date.setHours( hours, min );
  else 
    return Date.date.setHours( hours );
}
Date.setDate = function( refdate, date )
{
  Date.date.setTime( refdate.getTime() );
  return Date.date.setDate( date );
}
Date.setMonth = function( refdate, month, date )
{
  Date.date.setTime( refdate.getTime() );
  if( date !== undefined )
    return Date.date.setMonth( month, date );
  else 
    return Date.date.setMonth( month );
}
Date.setFullYear = function( refdate, year, month, date )
{
  Date.date.setTime( refdate.getTime() );
  if( date !== undefined )
    return Date.date.setFullYear( year, month, date );
  else if( month !== undefined )
    return Date.date.setFullYear( year, month );
  else 
    return Date.date.setFullYear( year );
}
/*81---------------------------------------------------------------------------*/

declare global 
{
  interface Math
  {
    clamp( min:number, val:number, max:number ):number;

    // minn( ...values:(number|bigint)[] ):number|bigint;
    // maxn( ...values:(number|bigint)[] ):number|bigint;
  }
}

Math.clamp = ( min_x:number, val_x:number, max_x:number ) =>
  Math.max( min_x, Math.min( val_x, max_x ));

// Math.minn = ( ...values ) =>
// {
//   let ret:number|bigint = Infinity;
//   values.forEach( v => {
//     if( v < ret ) ret = v;
//   })
//   return ret;
// }
// Math.maxn = ( ...values ) =>
// {
//   let ret:number|bigint = -Infinity;
//   values.forEach( v => {
//     if( v > ret ) ret = v;
//   })
//   return ret;
// }
/*81---------------------------------------------------------------------------*/

/**
 * class X extends mix( Y, Z )
 * ! should always companion with an `interface` declaration.
 * 
 * @param mixins First element has highest precedence, and so on.
 */
export function mix( ...mixins:(Constructor | AbstractConstructor)[] )
{
  // #if INOUT
    assert( mixins.length ); 
  // #endif

  abstract class Mix extends mixins[0] {}
  // console.log( Mix );

  function copyProperties( source:object, target:object ) 
  {
    // console.log( target );
    // console.log( source );
    for( const key of Reflect.ownKeys(source) ) 
    {
      // console.log( key );
      if( key in target ) 
      {
        // console.log( `${key} in ${target}` );
        continue;
      }

      if ( key !== "constructor"
        && key !== "prototype"
        && key !== "name"
      ) {
        const desc = Object.getOwnPropertyDescriptor( source, key );
        if( desc !== undefined ) Object.defineProperty( target, key, desc );
      }
    }
  }

  function deepcopyProperties( source:object, target:object ) 
  {
    let o:object | null = source;
    while( o )
    {
      copyProperties( o, target );
      o = Reflect.getPrototypeOf( o );
    }
  }

  for( let i = 1; i < mixins.length; i++ )
  {
    deepcopyProperties( mixins[i].prototype, Mix.prototype );
    deepcopyProperties( mixins[i], Mix ); // add static stuff
  }

  return Mix as AbstractConstructor;
} 
/*81---------------------------------------------------------------------------*/
