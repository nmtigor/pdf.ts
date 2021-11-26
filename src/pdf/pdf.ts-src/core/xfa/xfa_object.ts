/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */

/* Copyright 2021 Mozilla Foundation
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

import { isObjectLike } from "../../../../lib/jslang.js";
import { 
  type AvailableSpace, 
  type XFAAttrs, 
  type XFAExtra, 
  type XFAGlobalData, 
  type XFAElData, 
  type XFAHTMLObj, 
  type XFAIds, 
  type XFAStyleData,
  type XFAValue,
  type XFANsAttrs,
  type XFACleanup, 
} from "./alias.js";
import { getInteger, getKeyword, HTMLResult } from "./utils.js";
import { type rect_t, shadow, warn } from "../../shared/util.js";
import { NamespaceIds, type XFANsId } from "./namespaces.js";
import { Builder } from "./builder.js";
import { searchNode } from "./som.js";
import { encodeToXmlString } from "../core_utils.js";
/*81---------------------------------------------------------------------------*/

// We use these symbols to avoid name conflict between tags
// and properties/methods names.
export const $acceptWhitespace = Symbol();
export const $addHTML = Symbol();
export const $appendChild = Symbol();
export const $childrenToHTML = Symbol();
export const $clean = Symbol();
export const $cleanPage = Symbol();
export const $cleanup = Symbol();
export const $clone = Symbol();
export const $consumed = Symbol();
export const $content = Symbol("content");
export const $data = Symbol("data");
export const $dump = Symbol();
export const $extra = Symbol("extra");
export const $finalize = Symbol();
export const $flushHTML = Symbol();
export const $getAttributeIt = Symbol();
export const $getAttributes = Symbol();
export const $getAvailableSpace = Symbol();
export const $getChildrenByClass = Symbol();
export const $getChildrenByName = Symbol();
export const $getChildrenByNameIt = Symbol();
export const $getDataValue = Symbol();
export const $getExtra = Symbol();
export const $getRealChildrenByNameIt = Symbol();
export const $getChildren = Symbol();
export const $getContainedChildren = Symbol();
export const $getNextPage = Symbol();
export const $getSubformParent = Symbol();
export const $getParent = Symbol();
export const $getTemplateRoot = Symbol();
export const $globalData = Symbol();
export const $hasSettableValue = Symbol();
export const $ids = Symbol();
export const $indexOf = Symbol();
export const $insertAt = Symbol();
export const $isCDATAXml = Symbol();
export const $isBindable = Symbol();
export const $isDataValue = Symbol();
export const $isDescendent = Symbol();
export const $isNsAgnostic = Symbol();
export const $isSplittable = Symbol();
export const $isThereMoreWidth = Symbol();
export const $isTransparent = Symbol();
export const $isUsable = Symbol();
export const $lastAttribute = Symbol();
export const $namespaceId = Symbol("namespaceId");
export const $nodeName = Symbol("nodeName");
export const $nsAttributes = Symbol();
export const $onChild = Symbol();
export const $onChildCheck = Symbol();
export const $onText = Symbol();
export const $pushGlyphs = Symbol();
export const $popPara = Symbol();
export const $pushPara = Symbol();
export const $removeChild = Symbol();
export const $root = Symbol("root");
export const $resolvePrototypes = Symbol();
export const $searchNode = Symbol();
export const $setId = Symbol();
export const $setSetAttributes = Symbol();
export const $setValue = Symbol();
export const $tabIndex = Symbol();
export const $text = Symbol();
export const $toHTML = Symbol();
export const $toString = Symbol();
export const $toStyle = Symbol();
export const $uid = Symbol("uid");

const _applyPrototype = Symbol();
const _attributes = Symbol();
const _attributeNames = Symbol();
const _children = Symbol("_children");
const _cloneAttribute = Symbol();
const _dataValue = Symbol();
const _defaultValue = Symbol();
const _filteredChildrenGenerator = Symbol();
const _getPrototype = Symbol();
const _getUnsetAttributes = Symbol();
const _hasChildren = Symbol();
const _max = Symbol();
const _options = Symbol();
const _parent = Symbol("parent");
const _resolvePrototypesHelper = Symbol();
const _setAttributes = Symbol();
const _validator = Symbol();

let uid = 0;

const NS_DATASETS = NamespaceIds.datasets.id;

type NonattrValue =
  | null
  | undefined
  | XFAObject 
  | XFAObjectArray 
;
export type XFAProp = NonattrValue | string;

type Dumped = {
  $content?:string | number | Date | XFAObject
    | Map<string,string> | string[] | [number,number][] | [number,number];
  $name?:string;
  attributes?:XFAAttrs;
} & {
  [key:string]:string | Dumped | Dumped[]
    | number | Date | XFAObject | Record<string, string>;
}

type PropValueEx = 
  | XFAProp 
  | XFAObject[] 
  | XFAAttribute
;

export abstract class XFAObject
{
  [$namespaceId]:XFANsId;
  [$nodeName]:string;
  [_hasChildren]:boolean;

  [_parent]?:XFAObject;
  /** @final */
  [$getParent]() { return this[_parent]; }

  [_children]:XFAObject[] = [];
  /** @final */
  [$uid]:string;
  /** @final */
  [$globalData]:XFAGlobalData;

  id!:string;

  name?:string;

  h:unknown;
  w:unknown;
  use!:string;
  usehref!:string;

  /** @final */
  [$cleanup]?:XFACleanup;
  [$clean]( builder:Builder )
  {
    delete (<any>this)[_hasChildren];
    if( this[$cleanup] ) 
    {
      builder.clean( this[$cleanup]! );
      delete this[$cleanup];
    }
  }

  [$content]?:string | number | Date | XFAObject 
    | Map<string,string> | string[] | [number,number][] | [number,number] 
    | undefined;
  [$onText]( _:string, richText?:boolean ) {}

  [$setValue]( _:XFAValue ) {}

  /** @final */
  [$extra]:XFAExtra | XFAObject | undefined;

  /* _attributes */
  [_setAttributes]?:Set<string>;
  /** @final */
  [$setSetAttributes]( attributes:Record<string,string> )
  {
    // Just keep set attributes because it can be used in a proto.
    this[_setAttributes] = new Set( Object.keys(attributes) );
  }

  _attributes?:Set<string>;
  get [_attributeNames]()
  {
    // Lazily get attributes names
    const proto = <XFAObject>Object.getPrototypeOf(this);
    if( !proto._attributes )
    {
      const attributes = (proto._attributes = new Set());
      for( const name of Object.getOwnPropertyNames(this) )
      {
        if( (<any>this)[name] === null
         || (<any>this)[name] === undefined
         || (<any>this)[name] instanceof XFAObject
         || (<any>this)[name] instanceof XFAObjectArray
        ) {
          break;
        }
        attributes.add( name );
      }
    }
    return shadow( this, _attributeNames, proto._attributes );
  }

  /**
   * Get attribute names which have been set in the proto but not in this.
   */
  [_getUnsetAttributes]( protoAttributes:Set<string> )
  {
    const allAttr = this[_attributeNames];
    const setAttr = this[_setAttributes]!;
    return [...protoAttributes].filter( x => allAttr.has(x) && !setAttr.has(x) );
  }
  /* ~ */

  /** @final */
  [$tabIndex]?:number | undefined;

  assist?:unknown;
  anchorType?:string;
  border?:unknown;
  columnWidths?:number[];
  colSpan?:number;
  datasets?:unknown;
  form?:unknown;
  hAlign?:string;

  /** @final */
  layout?:string | undefined;

  margin?:unknown;
  operation?:string;
  para?:unknown;
  presence?:string | undefined;
  ref?:string | XFAObjectArray;
  rotate?:number;
  template?:unknown;
  traversal?:unknown;
  x?:number;
  y?:number;
  
  constructor( nsId:XFANsId, name:string, hasChildren=false )
  {
    this[$namespaceId] = nsId;
    this[$nodeName] = name;
    this[_hasChildren] = hasChildren;
    this[$uid] = `${name}${uid++}`;
  }

  [$onChild]( child:XFAObject )
  {
    if( !this[_hasChildren] || !this[$onChildCheck](child) )
      return false;

    const name = child[$nodeName];
    const node:XFAObject | XFAObjectArray | undefined = (<any>this)[name];

    if( node instanceof XFAObjectArray )
    {
      if( node.push(child) )
      {
        this[$appendChild]( child );
        return true;
      }
    } 
    else {
      // IRL it's possible to already have a node.
      // So just replace it with the last version.
      if( node !== undefined )
      {
        this[$removeChild]( node );
      }
      (<any>this)[name] = child;
      this[$appendChild]( child );
      return true;
    }

    let id = "";
    if( this.id )
    {
      id = ` (id: ${this.id})`;
    } 
    else if( this.name )
    {
      id = ` (name: ${this.name} ${(<any>this.h).value})`;
    }
    warn(`XFA - node "${this[$nodeName]}"${id} has already enough "${name}"!`);
    return false;
  }

  [$onChildCheck]( child:XFAObject )
  {
    return this.hasOwnProperty( child[$nodeName] )
      && child[$namespaceId] === this[$namespaceId];
  }

  [$isNsAgnostic]() { return false; }
  [$acceptWhitespace]() { return false; }
  [$isCDATAXml]() { return false; }
  [$isBindable]() { return false; }

  /** @final */
  [$popPara]() 
  {
    if( this.para )
    {
      (<XFAExtra>this[$getTemplateRoot]()![$extra]).paraStack!.pop();
    }
  }

  /** @final */
  [$pushPara]() 
  {
    this[$getTemplateRoot]()![$extra].paraStack!.push( <any>this.para );
  }

  /** @final */
  [$setId]( ids:Map<string,XFAObject> )
  {
    if( this.id && this[$namespaceId] === NamespaceIds.template.id )
    {
      ids.set( this.id, this );
    }
  }

  /** @final */
  [$getTemplateRoot]()
  {
    return this[$globalData].template;
  }

  [$isSplittable]() { return false; }

  /**
     Return true if this node (typically a container)
     can provide more width during layout.
     The goal is to help to know what a descendant must
     do in case of horizontal overflow.
   */
  [$isThereMoreWidth]() { return false; }

  /** @final */
  [$appendChild]( child:XFAObject )
  {
    child[_parent] = this;
    this[_children].push( child );
    if (!child[$globalData] && this[$globalData]) 
    {
      child[$globalData] = this[$globalData];
    }
  }

  /** @final */
  [$removeChild]( child:XFAObject )
  {
    const i = this[_children].indexOf(child);
    this[_children].splice(i, 1);
  }

  [$hasSettableValue]() { return this.hasOwnProperty("value"); }

  [$finalize]() {}

  /** @final */
  [$indexOf]( child:XFAObject )
  {
    return this[_children].indexOf(child);
  }

  /** @final */
  [$insertAt]( i:number, child:XFAObject )
  {
    child[_parent] = this;
    this[_children].splice(i, 0, child);
    if (!child[$globalData] && this[$globalData]) 
    {
      child[$globalData] = this[$globalData];
    }
  }

  /**
   * If true the element is transparent when searching a node using
   * a SOM expression which means that looking for "foo.bar" in
   * <... name="foo"><toto><titi><... name="bar"></titi></toto>...
   * is fine because toto and titi are transparent.
   */
  [$isTransparent]() { return !this.name; }

  [$lastAttribute]() { return ""; }

  [$text]():string | undefined
  {
    if( this[_children].length === 0 )
    {
      return <string>this[$content];
    }
    return this[_children].map(c => c[$text]()).join("");
  }

  /** @final */
  [$isDescendent]( parent:XFAObject )
  {
    let node:XFAObject | undefined = this;
    while( node )
    {
      if( node === parent ) return true;

      node = node[$getParent]();
    }
    return false;
  }

  [$getSubformParent](): XFAObject | undefined 
  { 
    return this[$getParent](); 
  }

  [$dump]()
  {
    const dumped:Dumped = Object.create(null);
    if( this[$content] )
    {
      dumped.$content = this[$content]!;
    }

    for( const name of Object.getOwnPropertyNames(this) )
    {
      const value:XFAProp = (<any>this)[name];
      if( value === null
       || value === undefined
      ) {
        continue;
      }
      if( value instanceof XFAObject )
      {
        dumped[name] = value[$dump]();
      } 
      else if( value instanceof XFAObjectArray )
      {
        if( !value.isEmpty() )
        {
          dumped[name] = value.dump();
        }
      } 
      else dumped[name] = value;
    }

    return dumped;
  }

  [$toStyle]( _?:XFAObject ):XFAStyleData | string | undefined
  {
    return undefined;
  }

  [$toHTML]( availableSpace?:AvailableSpace ): HTMLResult | string | undefined
  {
    return HTMLResult.EMPTY;
  }

  *[$getContainedChildren]():Generator<XFAObject> 
  {
    // This function is overriden in Subform and SubformSet.
    for( const node of this[$getChildren]() ) 
    {
      yield node;
    }
  }

  *[_filteredChildrenGenerator]( filter:Set<string> | undefined, include:boolean ):Generator<HTMLResult>
  {
    for (const node of this[$getContainedChildren]()) 
    {
      if (!filter || include === filter.has(node[$nodeName])) 
      {
        const availableSpace = this[$getAvailableSpace]();
        const res = <HTMLResult>node[$toHTML](availableSpace);
        if( !res.success ) 
        {
          (<XFAExtra>this[$extra]).failingNode = node;
        }
        yield res;
      }
    }
  }

  [$flushHTML]():XFAHTMLObj | undefined { return undefined; }

  [$addHTML]( html:XFAElData, bbox?:rect_t )
  {
    (<XFAExtra>this[$extra]).children!.push(html);
  }

  [$getAvailableSpace]():AvailableSpace | undefined { return undefined; }

  /** @final */
  [$childrenToHTML]({ filter, include=true }:{ filter?:Set<string>; include?:boolean; })
  {
    if( !(<XFAExtra>this[$extra]).generator )
    {
      (<XFAExtra>this[$extra]).generator = this[_filteredChildrenGenerator](
        filter,
        include
      );
    } 
    else {
      const availableSpace = this[$getAvailableSpace]();
      const res = <HTMLResult>(<XFAExtra>this[$extra]).failingNode![$toHTML]( availableSpace );
      if( !res.success ) return res;

      if( res.html )
      {
        this[$addHTML]( res.html, res.bbox );
      }
      delete (<any>this[$extra]).failingNode;
    }

    while (true) 
    {
      const gen = (<XFAExtra>this[$extra]).generator!.next();
      if (gen.done)
      {
        break;
      }
      const res = gen.value;
      if (!res.success)
      {
        return res;
      }
      if (res.html) {
        this[$addHTML](res.html, res.bbox);
      }
    }

    (<XFAExtra>this[$extra]).generator = undefined;

    return HTMLResult.EMPTY;
  }

  /**
   * Update the node with properties coming from a prototype and apply
   * this function recursivly to all children.
   * @final
   */
  [$resolvePrototypes]( ids:XFAIds, ancestors=new Set<XFAObject>() )
  {
    for (const child of this[_children]) {
      child[_resolvePrototypesHelper](ids, ancestors);
    }
  }

  [_resolvePrototypesHelper]( ids:XFAIds, ancestors:Set<XFAObject> )
  {
    const proto = this[_getPrototype](ids, ancestors);
    if (proto) {
      // _applyPrototype will apply $resolvePrototypes with correct ancestors
      // to avoid infinite loop.
      this[_applyPrototype](proto, ids, ancestors);
    } 
    else {
      this[$resolvePrototypes](ids, ancestors);
    }
  }

  /** @final */
  [_getPrototype]( ids:XFAIds, ancestors:Set<XFAObject> )
  {
    const { use, usehref } = this;
    if( !use && !usehref ) return undefined;

    let proto:XFAObject | undefined;
    let somExpression:string | undefined;
    let id:string | undefined;
    let ref = use;

    // If `usehref` and `use` are non-empty then use usehref.
    if( usehref )
    {
      ref = usehref;
      // Href can be one of the following:
      // - #ID
      // - URI#ID
      // - #som(expression)
      // - URI#som(expression)
      // - URI
      // For now we don't handle URI other than "." (current document).
      if( usehref.startsWith("#som(") && usehref.endsWith(")") )
      {
        somExpression = usehref.slice( "#som(".length, usehref.length - 1 );
      } 
      else if( usehref.startsWith(".#som(") && usehref.endsWith(")") )
      {
        somExpression = usehref.slice( ".#som(".length, usehref.length - 1 );
      } 
      else if( usehref.startsWith("#") )
      {
        id = usehref.slice(1);
      } 
      else if( usehref.startsWith(".#") )
      {
        id = usehref.slice(2);
      }
    } 
    else if( use.startsWith("#") )
    {
      id = use.slice(1);
    } 
    else {
      somExpression = use;
    }

    this.use = this.usehref = "";
    if( id )
    {
      proto = ids.get(id);
    } 
    else {
      const proto_a = searchNode(
        ids.get( $root )!,
        this,
        somExpression!,
        true /* = dotDotAllowed */,
        false /* = useCache */
      );
      if( proto_a )
      {
        proto = <XFAObject>proto_a[0];
      }
    }

    if( !proto )
    {
      warn(`XFA - Invalid prototype reference: ${ref}.`);
      return undefined;
    }

    if( proto[$nodeName] !== this[$nodeName] )
    {
      warn(
        `XFA - Incompatible prototype: ${proto[$nodeName]} !== ${this[$nodeName]}.`
      );
      return undefined;
    }

    if( ancestors.has(proto) )
    {
      // We've a cycle so break it.
      warn(`XFA - Cycle detected in prototypes use.`);
      return undefined;
    }

    ancestors.add( proto );

    // The prototype can have a "use" attribute itself.
    const protoProto = proto[_getPrototype]( ids, ancestors );
    if( protoProto )
    {
      proto[_applyPrototype]( protoProto, ids, ancestors );
    }

    // The prototype can have a child which itself has a "use" property.
    proto[$resolvePrototypes]( ids, ancestors );

    ancestors.delete( proto );

    return proto;
  }

  [_applyPrototype]( proto:XFAObject, ids:XFAIds, ancestors:Set<XFAObject> )
  {
    if( ancestors.has(proto) )
    {
      // We've a cycle so break it.
      warn(`XFA - Cycle detected in prototypes use.`);
      return;
    }

    if( !this[$content] && proto[$content] )
    {
      this[$content] = proto[$content];
    }

    const newAncestors = new Set( ancestors );
    newAncestors.add( proto );

    for( const unsetAttrName of 
      this[_getUnsetAttributes]( proto[_setAttributes]! )
    ) {
      (<any>this)[unsetAttrName] = (<any>proto)[unsetAttrName];
      this[_setAttributes]!.add( unsetAttrName );
    }

    for( const name of Object.getOwnPropertyNames(this) )
    {
      if( this[_attributeNames].has(name) ) continue;

      const value:NonattrValue = (<any>this)[name];
      const protoValue:NonattrValue = (<any>proto)[name];

      if( value instanceof XFAObjectArray )
      {
        for( const child of value[_children] )
        {
          child[_resolvePrototypesHelper]( ids, ancestors );
        }

        for( let i = value[_children].length, ii = (<XFAObjectArray | XFAObjectArray>protoValue)[_children].length;
          i < ii; i++
        ) {
          const child = proto[_children][i][$clone]();
          if( value.push(child) )
          {
            child[_parent] = this;
            this[_children].push( child );
            child[_resolvePrototypesHelper]( ids, ancestors );
          } 
          else {
            // No need to continue: other nodes will be rejected.
            break;
          }
        }
        continue;
      }

      if( value !== null && value !== undefined )
      {
        value[$resolvePrototypes]( ids, ancestors );
        if( protoValue )
        {
          // protoValue must be treated as a prototype for value.
          value[_applyPrototype]( <XFAObject>protoValue, ids, ancestors );
        }
        continue;
      }

      if( protoValue !== null && protoValue !== undefined ) 
      {
        const child = (<XFAObject>protoValue)[$clone]();
        child[_parent] = this;
        (<any>this)[name] = child;
        this[_children].push( child );
        child[_resolvePrototypesHelper]( ids, ancestors );
      }
    }
  }

  static [_cloneAttribute]( obj:unknown ):unknown
  {
    if( Array.isArray(obj) )
    {
      return obj.map(x => XFAObject[_cloneAttribute](x));
    }
    if( isObjectLike(obj) )
    {
      return Object.assign( {}, obj );
    }
    return obj;
  }

  /** @final */
  [$clone]<T extends XFAObject>( this:T )
  {
    const clone:XFAObject = Object.create( Object.getPrototypeOf(this) );
    for( const $symbol of Object.getOwnPropertySymbols(this) )
    {
      try {
        (<any>clone)[$symbol] = (<any>this)[$symbol];
      } catch (_) {
        shadow( clone, $symbol, (<any>this)[$symbol] );
      }
    }
    clone[$uid] = `${clone[$nodeName]}${uid++}`;
    clone[_children] = <XFAObject[]>[];

    for( const name of Object.getOwnPropertyNames(this) )
    {
      if( this[_attributeNames].has(name) )
      {
        (<any>clone)[name] = XFAObject[_cloneAttribute]( (<any>this)[name] );
        continue;
      }
      const value = (<any>this)[name];
      if( value instanceof XFAObjectArray )
      {
        (<any>clone)[name] = new XFAObjectArray( value[_max] );
      } 
      else {
        (<any>clone)[name] = undefined;
      }
    }

    for( const child of this[_children] )
    {
      const name = child[$nodeName];
      const clonedChild = child[$clone]();
      clone[_children].push( clonedChild );
      clonedChild[_parent] = clone;
      if( (<any>clone)[name] === undefined )
      {
        (<any>clone)[name] = clonedChild;
      } 
      else {
        (<XFAObjectArray>(<any>clone)[name])[_children].push( clonedChild );
      }
    }

    return <T>clone;
  }

  [$getChildren]( name?:string )
  {
    if( !name ) return this[_children];

    return this[_children].filter( c => c[$nodeName] === name );
  }

  [$getChildrenByClass]( name:string ):PropValueEx
  {
    return <XFAProp>(<any>this)[name];
  }

  /** @final */
  [$getChildrenByName]( name:string, allTransparent:boolean, first=true )
  {
    return Array.from( this[$getChildrenByNameIt](name, allTransparent, first) );
  }

  *[$getChildrenByNameIt]( name:string, allTransparent:boolean, first=true 
  ):Generator<XFAObject | XFAAttribute> {
    if (name === "parent") {
      yield this[_parent]!;
      return;
    }

    for (const child of this[_children]) {
      if (child[$nodeName] === name) {
        yield child;
      }

      if (child.name === name) {
        yield child;
      }

      if (allTransparent || child[$isTransparent]()) {
        yield* child[$getChildrenByNameIt](name, allTransparent, false);
      }
    }

    if( first && this[_attributeNames].has(name) )
    {
      yield new XFAAttribute( this, name, (<any>this)[name] );
    }
  }
}

/** @final */
export class XFAObjectArray
{
  readonly [_max]:number;

  [_children]:XFAObject[] = [];
  get children() { return this[_children]; }
  isEmpty() { return this[_children].length === 0; }
  clear() { this[_children].length = 0; }

  constructor( max=Infinity )
  {
    this[_max] = max;
  }

  push( child:XFAObject )
  {
    const len = this[_children].length;
    if (len <= this[_max]) {
      this[_children].push(child);
      return true;
    }
    warn(
      `XFA - node "${child[$nodeName]}" accepts no more than ${this[_max]} children`
    );
    return false;
  }

  dump()
  {
    return this[_children].length === 1
      ? this[_children][0][$dump]()
      : this[_children].map( x => x[$dump]() );
  }

  [$clone]()
  {
    const clone = new XFAObjectArray( this[_max] );
    clone[_children] = this[_children].map( c => c[$clone]() );
    return clone;
  }
}

/** @final */
export class XFAAttribute
{
  [_parent]:XFAObject;
  [$getParent]() { return this[_parent]; }

  [$nodeName]:string;

  [$content]:string;
  [$text]() { return this[$content]; }

  [$consumed] = false;
  [$uid] = `attribute${uid++}`;

  constructor( node:XFAObject, name:string, value:string )
  {
    this[_parent] = node;
    this[$nodeName] = name;
    this[$content] = value;
  }

  [$isDataValue]() { return true; }
  [$getDataValue]() {return this[$content].trim(); }
  [$setValue]( value:XFAValue )
  {
    this[$content] = (value.value || "").toString();
  }

  [$isDescendent]( parent:XFAObject )
  {
    return this[_parent] === parent || this[_parent][$isDescendent]( parent );
  }
}

export class XmlObject extends XFAObject
{
  override [_children]:XmlObject[] = [];

  override [$content]?:string | XmlObject | undefined = "";
  override [$onText]( str:string ) { this[$content] += str; }
  override [$setValue]( value:XFAValue )
  {
    this[$content] = (value.value || "").toString();
  }

  [_dataValue]?:boolean;
  /** @final */
  [$isDataValue](): boolean | undefined
  {
    if( this[_dataValue] === undefined )
    {
      return this[_children].length === 0
        || this[_children][0][$namespaceId] === NamespaceIds.xhtml.id
    }
    return this[_dataValue];
  }

  /** @final */
  [$consumed] = false;

  [_attributes]?:Map<string, XFAAttribute>;

  constructor( nsId:XFANsId, name:string, attributes:XFANsAttrs={} )
  {
    super( nsId, name );

    if( name !== "#text" )
    {
      const map = new Map<string, XFAAttribute>();
      this[_attributes] = map;
      for( const [attrName, value] of Object.entries(attributes) )
      {
        map.set( attrName, new XFAAttribute(this, attrName, value) );
      }
      if( attributes.hasOwnProperty($nsAttributes) )
      {
        // XFA attributes.
        const dataNode = attributes[$nsAttributes]!.xfa.dataNode;
        if( dataNode !== undefined )
        {
          if( dataNode === "dataGroup")
          {
            this[_dataValue] = false;
          } 
          else if( dataNode === "dataValue" )
          {
            this[_dataValue] = true;
          }
        }
      }
    }
  }

  /** @final */
  [$toString]( buf:string[] )
  {
    const tagName = this[$nodeName];
    if( tagName === "#text" )
    {
      buf.push( encodeToXmlString( <string>this[$content]) );
      return;
    }
    const prefix = this[$namespaceId] === NS_DATASETS ? "xfa:" : "";
    buf.push(`<${prefix}${tagName}`);
    for( const [name, value] of this[_attributes]!.entries() )
    {
      buf.push(` ${name}="${encodeToXmlString(value[$content])}"`);
    }
    if( this[_dataValue] !== undefined )
    {
      if( this[_dataValue] )
           buf.push(` xfa:dataNode="dataValue"`);
      else buf.push(` xfa:dataNode="dataGroup"`);
    }
    if( !this[$content] && this[_children].length === 0  )
    {
      buf.push("/>");
      return;
    }

    buf.push(">");
    if( this[$content] )
    {
      if( typeof this[$content] === "string" )
      {
        buf.push( encodeToXmlString(<string>this[$content]) );
      } 
      else {
        (<XmlObject>this[$content])[$toString]( buf );
      }
    }
    else {
      for( const child of this[_children] )
      {
        child[$toString]( buf );
      }
    }
    buf.push(`</${prefix}${tagName}>`);
  }

  override [$onChild]( child:XFAObject )
  {
    if( this[$content] )
    {
      const node = new XmlObject( this[$namespaceId], "#text" );
      this[$appendChild]( node );
      node[$content] = this[$content];
      this[$content] = "";
    }
    this[$appendChild](child);
    return true;
  }

  override [$finalize]()
  {
    if( this[$content] && this[_children].length > 0 )
    {
      const node = new XmlObject( this[$namespaceId], "#text" );
      this[$appendChild]( node );
      node[$content] = this[$content];
      delete this[$content];
    }
  }

  override [$toHTML]()
  {
    if( this[$nodeName] === "#text" )
    {
      return HTMLResult.success({
        name: "#text",
        value: <string>this[$content],
      });
    }

    return HTMLResult.EMPTY;
  }

  // override [$getChildren]( name?:string )
  // {
  //   if( !name ) return this[_children];

  //   return this[_children].filter(c => c[$nodeName] === name);
  // }

  /** @final */
  [$getAttributes]() { return this[_attributes]; }

  /** @final */
  override [$getChildrenByClass]( name:string ): XFAObject[] | XFAAttribute
  {
    const value = this[_attributes]?.get(name);
    if( value !== null && value !== undefined )
    {
      return value;
    }
    return this[$getChildren]( name );
  }

  override *[$getChildrenByNameIt]( name:string, allTransparent:boolean 
  ):Generator<XmlObject | XFAAttribute> {
    const value = this[_attributes]?.get(name);
    if (value) {
      yield value;
    }

    for( const child of this[_children] )
    {
      if (child[$nodeName] === name) {
        yield child;
      }

      if (allTransparent) {
        yield* child[$getChildrenByNameIt](name, allTransparent);
      }
    }
  }

  *[$getAttributeIt]( name:string, skipConsumed:boolean ):Generator<XFAAttribute>
  {
    const value = this[_attributes]?.get(name);
    if (value && (!skipConsumed || !value[$consumed])) 
    {
      yield value;
    }
    for (const child of this[_children]) 
    {
      yield* (<XmlObject>child)[$getAttributeIt](name, skipConsumed);
    }
  }

  *[$getRealChildrenByNameIt]( name:string, allTransparent:boolean, skipConsumed:boolean 
  ):Generator<XmlObject>
  {
    for (const child of this[_children]) 
    {
      if (child[$nodeName] === name && (!skipConsumed || !child[$consumed])) 
      {
        yield child;
      }

      if (allTransparent) 
      {
        yield* child[$getRealChildrenByNameIt](
          name,
          allTransparent,
          skipConsumed
        );
      }
    }
  }

  /** @final */
  [$getDataValue]()
  {
    if( this[_dataValue] === undefined )
    {
      if( this[_children].length === 0 )
      {
        return (<string>this[$content]).trim();
      }
      if( this[_children][0][$namespaceId] === NamespaceIds.xhtml.id )
      {
        return this[_children][0][$text]()!.trim();
      }
      return undefined;
    }
    return (<string>this[$content]).trim();
  }

  override [$dump]( hasNS=false )
  {
    const dumped:Dumped = Object.create(null);
    if (hasNS) 
    {
      dumped.$ns = this[$namespaceId];
    }
    if( this[$content] )
    {
      dumped.$content = this[$content]!;
    }
    dumped.$name = this[$nodeName];

    dumped.children = [];
    for( const child of this[_children] )
    {
      dumped.children.push( child[$dump](hasNS) );
    }

    dumped.attributes = Object.create(null);
    for( const [name, value] of this[_attributes]! )
    {
      dumped.attributes![name] = value[$content];
    }

    return dumped;
  }
}

export abstract class ContentObject extends XFAObject
{
  override [$content]:string | number | Date | XFAObject 
    | Map<string,string> | string[] | [number,number][] | [number,number] 
    = "";
  override [$onText]( text:string ) { this[$content] += text; }
  
  constructor( nsId:XFANsId, name:string )
  {
    super( nsId, name );
  }

  override [$finalize]() {}
}

export abstract class OptionObject extends ContentObject
{
  [_options]:string[]

  constructor( nsId:XFANsId, name:string, options:string[] )
  {
    super(nsId, name);

    this[_options] = options;
  }

  /** @final */
  override [$finalize](): void
  {
    this[$content] = getKeyword({
      data: <string>this[$content],
      defaultValue: this[_options][0],
      validate: k => this[_options].includes(k),
    });
  }

  /** @final */
  override [$clean]( builder:Builder )
  {
    super[$clean](builder);
    delete (<any>this)[_options];
  }
}

export abstract class StringObject extends ContentObject 
{
  override [$content]:string | Date | string[] | [number,number][];

  /** @final */
  override [$finalize]()
  {
    this[$content] = this[$content].toString().trim();
  }
}

export abstract class IntegerObject extends ContentObject
{
  override [$content]:string | number;

  [_defaultValue]:number;
  [_validator]:( n:number ) => boolean;

  constructor( nsId:XFANsId, name:string, 
    defaultValue:number, validator:(n:number)=>boolean
  ) {
    super( nsId, name );

    this[_defaultValue] = defaultValue;
    this[_validator] = validator;
  }

  /** @final */
  override [$finalize]()
  {
    this[$content] = getInteger({
      data: <string>this[$content],
      defaultValue: this[_defaultValue]!,
      validate: this[_validator]!,
    });
  }

  /** @final */
  override [$clean]( builder:Builder )
  {
    super[$clean](builder);
    delete (<any>this)[_defaultValue];
    delete (<any>this)[_validator];
  }
}

export abstract class Option01 extends IntegerObject
{
  constructor( nsId:XFANsId, name:string )
  {
    super( nsId, name, 0, n => n === 1 );
  }
}

export class Option10 extends IntegerObject
{
  constructor( nsId:XFANsId, name:string )
  {
    super( nsId, name, 1, n => n === 0 );
  }
}
/*81---------------------------------------------------------------------------*/
