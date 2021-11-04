/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */

/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { TypedArray } from "../../../lib/alias.js";
import { assert } from "../../../lib/util/trace.js";
import { shadow } from "../shared/util.js";
import { BaseStream } from "./base_stream.js";
import { TranslatedFont } from "./evaluator.js";
import { XRef } from "./xref.js";
/*81---------------------------------------------------------------------------*/

export const EOF = Symbol("EOF");
// export const EOF = { cmd:"" };
export type EOF = typeof EOF;

namespace XFANsName
{
  let nameCache:Record<string, Name> = Object.create(null);

  export class Name
  {
    name;

    constructor( name:string ) 
    {
      this.name = name;
    }

    static get( name:string )
    {
      const nameValue = nameCache[name];
      // eslint-disable-next-line no-restricted-syntax
      return nameValue ? nameValue : (nameCache[name] = new Name(name));
    }
  
    static _clearCache() 
    {
      nameCache = Object.create(null);
    }
  }
}
export import Name = XFANsName.Name;

namespace NsCmd
{
  let cmdCache:Record<string, Cmd> = Object.create(null);

  export class Cmd
  {
    cmd;

    constructor( cmd:string ) 
    {
      this.cmd = cmd;
    }

    static get( cmd:string )
    {
      const cmdValue = cmdCache[cmd];
      // eslint-disable-next-line no-restricted-syntax
      return cmdValue ? cmdValue : (cmdCache[cmd] = new Cmd(cmd));
    }
  
    static _clearCache() 
    {
      cmdCache = Object.create(null);
    }    
  }
}
export import Cmd = NsCmd.Cmd;

export class Dict
{
  /* #map */
  // Map should only be used internally, use functions below to access.
  #map:Record< string, Obj | undefined > = Object.create(null);
  get size() { return Object.keys(this.#map).length; }
  /** No dereferencing. */
  getRaw( key:string ) { return this.#map[key]; }
  getKeys() { return Object.keys(this.#map); }
  /** No dereferencing. */
  getRawValues() { return Object.values(this.#map); }
  set( key:string, value:Obj | undefined ) 
  {
    // #if !PRODUCTION || TESTING
      if( value === undefined )
        assert( 0, 'Dict.set: The "value" cannot be undefined.' );
    // #endif
    this.#map[key] = value;
  }
  has( key:string ) { return this.#map[key] !== undefined; }
  /* ~ */

  xref;
  assignXref( newXref:XRef ) { this.xref = newXref; }

  objId?:string;
  suppressEncryption=false;

  constructor( xref?:XRef ) 
  {
    this.xref = xref;
  }

  /**
   * Automatically dereferences Ref objects.
   */
  get( key1:string, key2?:string, key3?:string ):Obj | undefined
  {
    let value = this.#map[key1];
    if( value === undefined && key2 !== undefined ) 
    {
      value = this.#map[key2];
      if( value === undefined && key3 !== undefined ) 
      {
        value = this.#map[key3];
      }
    }
    if( value instanceof Ref && this.xref )
    {
      return this.xref.fetch( value, this.suppressEncryption );
    }
    return value;
  }

  /**
   * Same as get(), but returns a promise and uses fetchIfRefAsync().
   */
  async getAsync<T extends NoRef=NoRef>( key1:string, key2?:string, key3?:string )
  {
    let value = this.#map[key1];
    if (value === undefined && key2 !== undefined) 
    {
      value = this.#map[key2];
      if (value === undefined && key3 !== undefined) 
      {
        value = this.#map[key3];
      }
    }
    if (value instanceof Ref && this.xref) 
    {
      value = this.xref.fetch(value, this.suppressEncryption);
    }

    if (Array.isArray(value)) 
    {
      value = value.slice(); // Ensure that we don't modify the Dict data.
      for (let i = 0, ii = value.length; i < ii; i++) 
      {
        if (value[i] instanceof Ref && this.xref) 
        {
          value[i] = this.xref.fetch( <Ref>value[i], this.suppressEncryption );
        }
      }
    }
    return <T>value;
  }

  /**
   * Same as get(), but dereferences all elements if the result is an Array.
   */
  getArray( key1:string, key2?:string, key3?:string ):NoRefNoRefAry | undefined
  {
    let value = this.get( key1, key2, key3 );
    if( !Array.isArray(value) || !this.xref ) return <NoRefNoAry | undefined>value;

    value = value.slice(); // Ensure that we don't modify the Dict data.
    for( let i = 0, ii = value.length; i < ii; ++i ) 
    {
      if( !(value[i] instanceof Ref) ) continue;

      value[i] = this.xref.fetch( <Ref>value[i], this.suppressEncryption );
    }
    return <NoRefNoRefAry>value;
  }

  forEach( callback:(k:string,v:any)=>any ) 
  {
    for( let key in this.#map ) 
    {
      callback( key, this.get(key) );
    }
  }

  static get empty()
  {
    const emptyDict = new Dict();

    emptyDict.set = (key, value) => {
      assert(0,"Should not call `set` on the empty dictionary.");
    };
    return shadow(this, "empty", emptyDict);
  }

  static merge({ xref, dictArray, mergeSubDicts=false }:{
    xref:XRef, dictArray:(Dict|undefined)[], mergeSubDicts?:boolean
  }) {
    const mergedDict = new Dict(xref),
      properties = new Map< string, any[] >();

    for (const dict of dictArray) {
      if (!(dict instanceof Dict)) {
        continue;
      }
      for (const [key, value] of Object.entries(dict.#map)) 
      {
        let property = properties.get(key);
        if (property === undefined) 
        {
          property = [];
          properties.set(key, property);
        }
        else if( !mergeSubDicts || !(value instanceof Dict) )
        {
          // Ignore additional entries, if either:
          //  - This is a "shallow" merge, where only the first element matters.
          //  - The value is *not* a `Dict`, since other types cannot be merged.
          continue;
        }
        property.push(value);
      }
    }
    for (const [name, values] of properties) 
    {
      if (values.length === 1 || !(values[0] instanceof Dict)) 
      {
        mergedDict.#map[name] = values[0];
        continue;
      }
      const subDict = new Dict(xref);

      for (const dict of values)
      {
        for (const [key, value] of Object.entries(dict.#map)) 
        {
          if( subDict.#map[key] === undefined )
          {
            subDict.#map[key] = <any>value;
          }
        }
      }
      if (subDict.size > 0) 
      {
        mergedDict.#map[name] = subDict;
      }
    }
    properties.clear();

    return mergedDict.size > 0 ? mergedDict : Dict.empty;
  }
}

export class FontDict extends Dict
{
  loadedName?:string;
  translated?:Promise< TranslatedFont >;
  
  fontAliases?:{
    [ hash:string ]:{
      fontID:string;
      aliasRef?:Ref;
    }
  }

  cacheKey?:Ref | string;
}

namespace NsRef
{
  let refCache:Record< string, Ref > = Object.create(null);

  export class Ref
  {
    /** object number */
    num;
    /** generation number */
    gen;

    constructor( num:number, gen:number )
    {
      this.num = num;
      this.gen = gen;
    }

    toString() 
    {
      // This function is hot, so we make the string as compact as possible.
      // |this.gen| is almost always zero, so we treat that case specially.
      if (this.gen === 0) 
      {
        return `${this.num}R`;
      }
      return `${this.num}R${this.gen}`;
    }

    static get( num:number, gen:number )
    {
      const key = gen === 0 ? `${num}R` : `${num}R${gen}`;
      const refValue = refCache[key];
      // eslint-disable-next-line no-restricted-syntax
      return refValue ? refValue : (refCache[key] = new Ref(num, gen));
    }
  
    static _clearCache() 
    {
      refCache = Object.create(null);
    }
  }
}
export import Ref = NsRef.Ref;

// The reference is identified by number and generation.
// This structure stores only one instance of the reference.
export class RefSet
{
  #set = new Set<string>();
  has( ref:Ref | string ) { return this.#set.has( ref.toString() ); }
  put( ref:Ref | string ) { this.#set.add( ref.toString() ); }
  remove( ref:Ref ) { this.#set.delete( ref.toString() ); }
  clear() { this.#set.clear(); }

  constructor( parent?:RefSet )
  {
    // #if !PRODUCTION || TESTING
    if( parent && !(parent instanceof RefSet) )
      assert(0,'RefSet: Invalid "parent" value.');
    // #endif
    // if (
    //   (typeof PDFJSDev === "undefined" ||
    //     PDFJSDev.test("!PRODUCTION || TESTING")) &&
    //   parent &&
    //   !(parent instanceof RefSet)
    // ) {
    //   assert(0,'RefSet: Invalid "parent" value.');
    // }
    this.#set = new Set( parent && parent.#set );
  }

  forEach( callback:(ref:string)=>void )
  {
    for (const ref of this.#set.values()) {
      callback(ref);
    }
  }
}

export class RefSetCache<T=Obj>
{
  #map = new Map< string, T >();
  get size() { return this.#map.size; }

  get( ref:Ref | string ) { return this.#map.get( ref.toString() ); }
  has( ref:Ref | string ) { return this.#map.has( ref.toString() ); }
  put( ref:Ref | string, obj:T ) { this.#map.set( ref.toString(), obj ); }

  putAlias( ref:Ref, aliasRef:Ref ) 
  {
    this.#map.set( ref.toString(), this.get(aliasRef)! );
  }

  forEach( callback:(value:T)=>void ) 
  {
    for( const value of this.#map.values() )
    {
      callback(value);
    }
  }

  clear() { this.#map.clear(); }
}

export function isName( v:any, name:string )
{
  return v instanceof Name && (name === undefined || v.name === name);
}

export function isCmd( v:any, cmd?:string ) 
{
  return v instanceof Cmd && (cmd === undefined || v.cmd === cmd);
}

export function isDict( v:any, type:string ) 
{
  return v instanceof Dict && isName( v.get("Type"),type );
}

export function isRefsEqual( v1:Ref, v2:Ref ) 
{
  return v1.num === v2.num && v1.gen === v2.gen;
}

export function clearPrimitiveCaches() 
{
  Cmd._clearCache();
  Name._clearCache();
  Ref._clearCache();
}

export type Obj =
  | boolean 
  | number 
  | string 
  | null

  | Name // 7.3.5

  | Cmd 
    | EOF

  | Obj[]// 7.3.6
    | TypedArray
  | Dict // 7.3.7
  
  | BaseStream // 7.3.8

  | Ref
;
export type NoCmd = Exclude< Obj, Cmd >;
export type NoRef = Exclude< Obj, Ref >;
export type NoRefNoAry = Exclude< NoRef, Obj[] >;
export type NoRefNoRefAry = NoRefNoAry | NoRef[]
/*81---------------------------------------------------------------------------*/
