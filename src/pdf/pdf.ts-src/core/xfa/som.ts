/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
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

import { warn } from "../../shared/util.js";
import { Datasets } from "./datasets.js";
import { NamespaceIds } from "./namespaces.js";
import { Xdp } from "./xdp.js";
import {
  $appendChild,
  $getChildren,
  $getChildrenByClass,
  $getChildrenByName,
  $getParent,
  $namespaceId,
  XFAAttribute,
  XFAObject,
  XFAObjectArray,
  XmlObject
} from "./xfa_object.js";
/*81---------------------------------------------------------------------------*/

const namePattern = /^[^.[]+/;
const indexPattern = /^[^\]]+/;
const operators = {
  dot: 0,
  dotDot: 1,
  dotHash: 2,
  dotBracket: 3,
  dotParen: 4,
};

const shortcuts = new Map<string,
  ( root:XFAObject, current:XFAObject ) => XFAObject
>([
  ["$data", (root, current) => (root.datasets ? (<Datasets>root.datasets).data : root)],
  [
    "$record",
    (root, current) =>
      (root.datasets ? (<Datasets>root.datasets).data! : root)[$getChildren]()[0],
  ],
  ["$template", (root, current) => (<Xdp>root).template],
  ["$connectionSet", (root, current) => (<Xdp>root).connectionSet],
  ["$form", (root, current) => (<any>root).form],
  ["$layout", (root, current) => (<any>root).layout],
  ["$host", (root, current) => (<any>root).host],
  ["$dataWindow", (root, current) => (<any>root).dataWindow],
  ["$event", (root, current) => (<any>root).event],
  ["!", (root, current) => (<Xdp>root).datasets],
  ["$xfa", (root, current) => root],
  ["xfa", (root, current) => root],
  ["$", (root, current) => current],
]);

const somCache = new WeakMap();
const NS_DATASETS = NamespaceIds.datasets.id;

function parseIndex( index:string ) 
{
  index = index.trim();
  if (index === "*") 
  {
    return Infinity;
  }
  return parseInt(index, 10) || 0;
}

interface Parsed
{
  name:string;
  cacheName:string;
  operator:number;
  index:number;
  js:undefined;
  formCalc:undefined;
}

// For now expressions containing .[...] or .(...) are not
// evaluated so don't parse them.
// TODO: implement that stuff and the remove the noExpr param.
function parseExpression( expr:string, dotDotAllowed?:boolean, noExpr=true )
{
  let match = expr.match(namePattern);
  if( !match ) return undefined;

  let [name] = match;
  const parsed:Parsed[] = [
    {
      name,
      cacheName: "." + name,
      index: 0,
      js: undefined,
      formCalc: undefined,
      operator: operators.dot,
    },
  ];

  let pos = name.length;

  while (pos < expr.length) {
    const spos = pos;
    const char = expr.charAt(pos++);
    if (char === "[") {
      match = expr.slice(pos).match(indexPattern);
      if (!match) {
        warn("XFA - Invalid index in SOM expression");
        return undefined;
      }
      parsed[parsed.length - 1].index = parseIndex(match[0]);
      pos += match[0].length + 1;
      continue;
    }

    let operator;
    switch (expr.charAt(pos)) {
      case ".":
        if (!dotDotAllowed) {
          return undefined;
        }
        pos++;
        operator = operators.dotDot;
        break;
      case "#":
        pos++;
        operator = operators.dotHash;
        break;
      case "[":
        if (noExpr) {
          warn(
            "XFA - SOM expression contains a FormCalc subexpression which is not supported for now."
          );
          return undefined;
        }
        // TODO: FormCalc expression so need to use the parser
        operator = operators.dotBracket;
        break;
      case "(":
        if (noExpr) {
          warn(
            "XFA - SOM expression contains a JavaScript subexpression which is not supported for now."
          );
          return undefined;
        }
        // TODO:
        // JavaScript expression: should be a boolean operation with a path
        // so maybe we can have our own parser for that stuff or
        // maybe use the formcalc one.
        operator = operators.dotParen;
        break;
      default:
        operator = operators.dot;
        break;
    }

    match = expr.slice(pos).match(namePattern);
    if (!match) {
      break;
    }

    [name] = match;
    pos += name.length;
    parsed.push({
      name,
      cacheName: expr.slice(spos, pos),
      operator,
      index: 0,
      js: undefined,
      formCalc: undefined,
    });
  }
  return parsed;
}

export function searchNode(
  root:XFAObject,
  container:XFAObject | undefined,
  expr:string,
  dotDotAllowed=true,
  useCache=true
) {
  const parsed = parseExpression( expr, dotDotAllowed );
  if( !parsed ) return undefined;

  const fn = shortcuts.get( parsed[0].name );
  let i = 0;
  let isQualified;
  let root_1;
  if( fn )
  {
    isQualified = true;
    root_1 = [ fn(root, container!) ];
    i = 1;
  } 
  else {
    isQualified = container === undefined;
    root_1 = [container || root];
  }

  for( let ii = parsed.length; i < ii; i++ )
  {
    const { name, cacheName, operator, index } = parsed[i];
    const nodes = [];
    for( const node of root_1 )
    {
      if( !(node instanceof XFAObject) )
        continue;

      let children:(XFAObject | XFAAttribute | string)[] | undefined, 
        cached;

      if( useCache )
      {
        cached = somCache.get(node);
        if( !cached )
        {
          cached = new Map();
          somCache.set(node, cached);
        }
        children = cached.get(cacheName);
      }

      if( !children )
      {
        switch (operator) 
        {
          case operators.dot:
            children = node[$getChildrenByName]( name, false );
            break;
          case operators.dotDot:
            children = node[$getChildrenByName]( name, true );
            break;
          case operators.dotHash:
            const children_1 = node[$getChildrenByClass]( name );
            if( children_1 instanceof XFAObjectArray ) 
            {
              children = children_1.children;
            } 
            else if( Array.isArray(children_1) )
            {
              children = children_1;
            }
            else {
              children = [children_1!];
            }
            break;
          default:
            break;
        }
        if (useCache) {
          cached.set(cacheName, children);
        }
      }

      if( children!.length > 0 ) 
      {
        nodes.push( children! );
      }
    }

    if (nodes.length === 0 && !isQualified && i === 0) 
    {
      // We've an unqualified expression and we didn't find anything
      // so look at container and siblings of container and so on.
      // http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.364.2157&rep=rep1&type=pdf#page=114
      const parent = container![$getParent]();
      container = parent;
      if( !container ) return undefined;

      i = -1;
      root_1 = [container];
      continue;
    }

    if( isFinite(index) ) 
    {
      root_1 = nodes.filter(node => index < node!.length).map(node => node![index]);
    } 
    else {
      root_1 = nodes.reduce((acc, node) => acc!.concat(node), []);
    }
  }

  if (root_1.length === 0) {
    return undefined;
  }

  return root_1;
}

function createNodes( root:XFAObject, path:Parsed[] ) 
{
  let node:XmlObject | undefined;
  for( const { name, index } of path ) 
  {
    for( let i = 0, ii = !isFinite(index) ? 0 : index; i <= ii; i++ ) 
    {
      const nsId = root[$namespaceId] === NS_DATASETS ? -1 : root[$namespaceId];
      node = new XmlObject(nsId, name);
      root[$appendChild]( node );
    }

    root = node!;
  }
  return node;
}

export function createDataNode( root:XFAObject, container:XmlObject, expr:string ) 
{
  const parsed = parseExpression(expr);
  if (!parsed) return undefined;

  if( parsed.some(x => x.operator === operators.dotDot) ) return undefined;

  const fn = shortcuts.get( parsed[0].name );
  let i = 0;
  if( fn )
  {
    root = fn(root, container);
    i = 1;
  } 
  else {
    root = container || root;
  }

  for (let ii = parsed.length; i < ii; i++) 
  {
    const { name, operator, index } = parsed[i];
    if( !isFinite(index) )
    {
      parsed[i].index = 0;
      return createNodes(root, parsed.slice(i));
    }

    let children:(XFAObject | XFAAttribute | string)[] | undefined;
    switch (operator) 
    {
      case operators.dot:
        children = root[$getChildrenByName]( name, false );
        break;
      case operators.dotDot:
        children = root[$getChildrenByName]( name, true );
        break;
      case operators.dotHash:
        const children_1 = root[$getChildrenByClass]( name );
        if( children_1 instanceof XFAObjectArray )
        {
          children = children_1.children;
        } 
        else if( Array.isArray(children_1) )
        {
          children = children_1;
        }
        else {
          children = [children_1!];
        }
        break;
      default:
        break;
    }

    if( children!.length === 0 )
    {
      return createNodes(root, parsed.slice(i));
    }

    if( index < children!.length )
    {
      const child = children![index];
      if( !(child instanceof XFAObject) ) 
      {
        warn(`XFA - Cannot create a node.`);
        return undefined;
      }
      root = child;
    } 
    else {
      parsed[i].index = index - children!.length;
      return createNodes( root, parsed.slice(i) );
    }
  }
  return undefined;
}
/*81---------------------------------------------------------------------------*/
