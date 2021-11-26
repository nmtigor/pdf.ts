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

// eslint-disable-next-line max-len
/** @typedef {import("./interfaces").IPDFStructTreeLayerFactory} IPDFStructTreeLayerFactory */

import { html } from "../../lib/dom.js";
import { type StructTree } from "../pdf.ts-src/core/struct_tree.js";
import { PDFPageProxy } from "../pdf.ts-src/display/api.js";
import { type IPDFStructTreeLayerFactory } from "./interfaces.js";
/*81---------------------------------------------------------------------------*/

const PDF_ROLE_TO_HTML_ROLE = {
  // Document level structure types
  Document: null, // There's a "document" role, but it doesn't make sense here.
  DocumentFragment: null,
  // Grouping level structure types
  Part: "group",
  Sect: "group", // XXX: There's a "section" role, but it's abstract.
  Div: "group",
  Aside: "note",
  NonStruct: "none",
  // Block level structure types
  P: null,
  // H<n>,
  H: "heading",
  Title: null,
  FENote: "note",
  // Sub-block level structure type
  Sub: "group",
  // General inline level structure types
  Lbl: null,
  Span: null,
  Em: null,
  Strong: null,
  Link: "link",
  Annot: "note",
  Form: "form",
  // Ruby and Warichu structure types
  Ruby: null,
  RB: null,
  RT: null,
  RP: null,
  Warichu: null,
  WT: null,
  WP: null,
  // List standard structure types
  L: "list",
  LI: "listitem",
  LBody: null,
  // Table standard structure types
  Table: "table",
  TR: "row",
  TH: "columnheader",
  TD: "cell",
  THead: "columnheader",
  TBody: null,
  TFoot: null,
  // Standard structure type Caption
  Caption: null,
  // Standard structure type Figure
  Figure: "figure",
  // Standard structure type Formula
  Formula: null,
  // standard structure type Artifact
  Artifact: null,
};
type PDFRole = keyof typeof PDF_ROLE_TO_HTML_ROLE;

const HEADING_PATTERN = /^H(\d+)$/;

interface StructTreeLayerBuilderOptions
{
  pdfPage:PDFPageProxy;
}

export class StructTreeLayerBuilder
{
  pdfPage;

  constructor({ pdfPage }:StructTreeLayerBuilderOptions )
  {
    this.pdfPage = pdfPage;
  }

  render( structTree?:StructTree )
  {
    return this._walk(structTree);
  }

  #setAttributes( structElement:StructTree, htmlElement:HTMLSpanElement )
  {
    if (structElement.alt !== undefined) 
    {
      htmlElement.setAttribute("aria-label", structElement.alt);
    }
    if (structElement.id !== undefined) 
    {
      htmlElement.setAttribute("aria-owns", structElement.id);
    }
  }

  _walk( node?:StructTree )
  {
    if( !node ) return null;

    const element = html("span");
    if( "role" in node )
    {
      const { role } = node;
      const match = role!.match(HEADING_PATTERN);
      if (match) 
      {
        element.setAttribute("role", "heading");
        element.setAttribute("aria-level", match[1]);
      }
      else if( (<any>PDF_ROLE_TO_HTML_ROLE)[role!] ) 
      {
        element.setAttribute("role", PDF_ROLE_TO_HTML_ROLE[<PDFRole>role]! );
      }
    }

    this.#setAttributes(node, element);

    if (node.children) 
    {
      if (node.children.length === 1 && "id" in node.children[0]) 
      {
        // Often there is only one content node so just set the values on the
        // parent node to avoid creating an extra span.
        this.#setAttributes(node.children[0], element);
      }
      else {
        for( const kid of node.children )
        {
          element.appendChild( this._walk(kid)! );
        }
      }
    }
    return element;
  }
}

export class DefaultStructTreeLayerFactory implements IPDFStructTreeLayerFactory
{
  createStructTreeLayerBuilder( pdfPage:PDFPageProxy )
  {
    return new StructTreeLayerBuilder({
      pdfPage,
    });
  }
}
/*81---------------------------------------------------------------------------*/
