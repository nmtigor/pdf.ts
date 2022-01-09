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

import { 
  $appendChild, 
  $globalData, 
  $nodeName, 
  $text, 
  $toHTML,
  $toPages,
} from "./xfa_object.js";
import { Binder } from "./bind.js";
import { XFAParser } from "./parser.js";
import { type XFAData } from "../document.js";
import { DataHandler } from "./data.js";
import { FontFinder } from "./fonts.js";
import { type XFAElObj, type XFAHTMLObj } from "./alias.js";
import { HTMLResult, stripQuotes } from "./utils.js";
import { type rect_t, warn } from "../../shared/util.js";
import { ErrorFont, Font } from "../fonts.js";
import { type AnnotStorageRecord } from "../../display/annotation_layer.js";
import { Subform, Template } from "./template.js";
import { XhtmlNamespace } from "./xhtml.js";
/*81---------------------------------------------------------------------------*/

export interface XFAPages
{
  name:string;
  children:XFAElObj[];
}

export class XFAFactory
{
  root;
  form!:Template;
  dataHandler;

  pages:XFAPages | undefined;
  dims!:rect_t[];

  constructor( data:XFAData )
  {
    try {
      this.root = new XFAParser().parse( XFAFactory._createDocument(data) )!;
      const binder = new Binder( this.root );
      this.form = binder.bind();
      this.dataHandler = new DataHandler( this.root, binder.getData() );
      this.form[$globalData].template = this.form;
    } catch( e ) {
      warn(`XFA - an error occurred during parsing and binding: ${e}`);
    }
  }

  isValid() 
  {
    return !!this.root && !!this.form;
  }

  /**
   * In order to avoid to block the event loop, the conversion
   * into pages is made asynchronously.
   */
  _createPagesHelper() 
  {
    const iterator = this.form[$toPages]();
    return new Promise<XFAPages>(( resolve, reject ) => {
      const nextIteration = () => {
        try {
          const value = iterator.next();
          if (value.done) 
          {
            resolve( <XFAPages>value.value );
          } 
          else {
            setTimeout(nextIteration, 0);
          }
        } catch (e) {
          reject(e);
        }
      };
      setTimeout(nextIteration, 0);
    });
  }

  async _createPages()
  {
    try {
      this.pages = await this._createPagesHelper();
      this.dims = this.pages!.children!.map( c => {
        const { width, height } = c.attributes!.style!;
        return <rect_t>[0, 0, parseInt(width!), parseInt(height!)];
      });
    } catch (e) {
      warn(`XFA - an error occurred during layout: ${e}`);
    }
  }

  getBoundingBox( pageIndex:number ) 
  {
    return this.dims[pageIndex];
  }

  async getNumPages() 
  {
    if( !this.pages )
    {
      await this._createPages();
    }
    return this.dims.length;
  }

  setImages( images:Map<string, Uint8Array | Uint8ClampedArray> )
  {
    this.form![$globalData].images = images;
  }

  setFonts( fonts:(Font | ErrorFont)[] )
  {
    this.form![$globalData].fontFinder = new FontFinder(fonts);
    const missingFonts = [];
    for( let typeface of this.form![$globalData].usedTypefaces )
    {
      typeface = stripQuotes(typeface);
      const font = this.form![$globalData].fontFinder!.find(typeface);
      if( !font )
      {
        missingFonts.push(typeface);
      }
    }

    if (missingFonts.length > 0) 
    {
      return missingFonts;
    }

    return undefined;
  }

  appendFonts( fonts:(Font | ErrorFont)[], reallyMissingFonts:Set<string> )
  {
    this.form![$globalData].fontFinder!.add( fonts, reallyMissingFonts );
  }

  async getPages()
  {
    if( !this.pages )
    {
      await this._createPages();
    }
    const pages = this.pages!;
    this.pages = undefined;
    return pages;
  }

  serializeData( storage:AnnotStorageRecord | undefined ) 
  {
    return this.dataHandler!.serialize( storage );
  }

  static _createDocument( data:XFAData )
  {
    if( !data["/xdp:xdp"] )
    {
      return data["xdp:xdp"];
    }
    return Object.values(data).join("");
  }

  static getRichTextAsHtml( rc:string ) 
  {
    if( !rc || typeof rc !== "string" ) return undefined;

    try {
      let root = new XFAParser( XhtmlNamespace, /* richText */ true ).parse(rc)!;
      if (!["body", "xhtml"].includes( root[$nodeName]) )
      {
        // No body, so create one.
        const newRoot = XhtmlNamespace.body({});
        newRoot[$appendChild]( root );
        root = newRoot;
      }

      const result = <HTMLResult>root[$toHTML]();
      if( !result.success ) return undefined;

      const { html } = result;
      const { attributes } = <XFAHTMLObj>html;
      if( attributes )
      {
        if (attributes.class) 
        {
          attributes.class = attributes.class.filter(
            attr => !attr.startsWith("xfa")
          );
        }
        attributes.dir = "auto";
      }

      return { html: <XFAHTMLObj>html, str: root[$text]() };
    } catch (e) {
      warn(`XFA - an error occurred during parsing of rich text: ${e}`);
    }
    return undefined;
  }
}
/*81---------------------------------------------------------------------------*/
