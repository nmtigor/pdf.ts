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

import {
  $acceptWhitespace,
  $clean,
  $content,
  $finalize,
  $globalData,
  $isCDATAXml,
  $nsAttributes,
  $onChild,
  $onText,
  $setId,
  XFAObject,
} from "./xfa_object.js";
import { XMLAttr, XMLParserBase, XMLParserErrorCode } from "../xml_parser.js";
import { Builder, Root } from "./builder.js";
import { warn } from "../../shared/util.js";
import { XFANsAttrs, XFAPrefix } from "./alias.js";
import { XFANsXhtml } from "./xhtml.js";
/*81---------------------------------------------------------------------------*/

export class XFAParser extends XMLParserBase
{
  _builder;
  _stack:XFAObject[] = [];
  _globalData = {
    usedTypefaces: new Set<string>(),
  };
  _ids = new Map<string, XFAObject>();
  _current:XFAObject;
  _errorCode = XMLParserErrorCode.NoError;
  _whiteRegex = /^\s+$/;
  _nbsps = /\xa0+/g;
  _richText;

  constructor( rootNameSpace?:XFANsXhtml, richText=false )
  {
    super();
    this._builder = new Builder(rootNameSpace);
    this._current = this._builder.buildRoot( this._ids );
    this._richText = richText;
  }

  parse( data:string )
  {
    this.parseXml( data );

    if( this._errorCode !== XMLParserErrorCode.NoError )
    {
      return undefined;
    }

    this._current[$finalize]();

    return (<Root>this._current).element;
  }

  onText( text:string )
  {
    // Normally by definition a &nbsp is unbreakable
    // but in real life Acrobat can break strings on &nbsp.
    text = text.replace(this._nbsps, match => match.slice(1) + " ");
    if( this._richText || this._current[$acceptWhitespace]() )
    {
      this._current[$onText](text, this._richText);
      return;
    }

    if (this._whiteRegex.test(text)) {
      return;
    }
    this._current[$onText](text.trim());
  }

  onCdata( text:string )
  {
    this._current[$onText](text);
  }

  _mkAttributes( attributes:XMLAttr[], tagName:string )
  {
    // Transform attributes into an object and get out
    // namespaces information.
    let namespace:string | undefined;
    let prefixes:XFAPrefix[] | undefined;
    const attributeObj:XFANsAttrs = Object.create({});
    for( const { name, value } of attributes ) 
    {
      if (name === "xmlns") 
      {
        if (!namespace) 
        {
          namespace = value;
        } 
        else {
          warn(`XFA - multiple namespace definition in <${tagName}>`);
        }
      } 
      else if (name.startsWith("xmlns:")) 
      {
        const prefix = name.substring("xmlns:".length);
        if (!prefixes) 
        {
          prefixes = [];
        }
        prefixes.push({ prefix, value });
      } 
      else {
        const i = name.indexOf(":");
        if (i === -1) 
        {
          attributeObj[name] = value;
        } 
        else {
          // Attributes can have their own namespace.
          // For example in data, we can have <foo xfa:dataNode="dataGroup"/>
          let nsAttrs = attributeObj[$nsAttributes];
          if (!nsAttrs) 
          {
            nsAttrs = attributeObj[$nsAttributes] = Object.create(null);
          }
          const [ns, attrName] = [name.slice(0, i), name.slice(i + 1)];
          let attrs = nsAttrs![ns];
          if (!attrs) 
          {
            attrs = nsAttrs![ns] = Object.create(null);
          }
          attrs[attrName] = value;
        }
      }
    }

    return <const>[namespace, prefixes, attributeObj];
  }

  _getNameAndPrefix( name:string, nsAgnostic:boolean )
  {
    const i = name.indexOf(":");
    if (i === -1) {
      return <const>[name, undefined];
    }
    return <const>[name.substring(i + 1), nsAgnostic ? "" : name.substring(0, i)];
  }

  onBeginElement( tagName:string, attributes:XMLAttr[], isEmpty:boolean )
  {
    const [namespace, prefixes, attributesObj] = this._mkAttributes(
      attributes,
      tagName
    );
    const [name, nsPrefix] = this._getNameAndPrefix(
      tagName,
      this._builder.isNsAgnostic()
    );
    const node = this._builder.build({
      nsPrefix,
      name,
      attributes: attributesObj,
      namespace,
      prefixes,
    });
    node[$globalData] = this._globalData;

    if( isEmpty )
    {
      // No children: just push the node into its parent.
      node[$finalize]();
      if( this._current[$onChild](node) )
      {
        node[$setId]( this._ids );
      }
      node[$clean](this._builder);
      return;
    }

    this._stack.push( this._current );
    this._current = node;
  }

  onEndElement( name:string )
  {
    const node = this._current;
    if( node[$isCDATAXml]() && typeof node[$content] === "string" )
    {
      const parser = new XFAParser();
      parser._globalData = this._globalData;
      const root = parser.parse( <string>node[$content] );
      node[$content] = undefined;
      node[$onChild]( root! );
    }

    node[$finalize]();
    this._current = this._stack.pop()!;
    if( this._current[$onChild](node) )
    {
      node[$setId]( this._ids );
    }
    node[$clean](this._builder);
  }

  onError( code:XMLParserErrorCode )
  {
    this._errorCode = code;
  }
}
/*81---------------------------------------------------------------------------*/
