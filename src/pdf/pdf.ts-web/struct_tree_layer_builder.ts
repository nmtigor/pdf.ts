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

/** @typedef {import("../src/display/api").PDFPageProxy} PDFPageProxy */

import { html } from "../../lib/dom.ts";
import {
  StructTreeContent,
  StructTreeNode,
} from "../pdf.ts-src/display/api.ts";
import { PDFPageProxy } from "../pdf.ts-src/pdf.ts";
/*80--------------------------------------------------------------------------*/

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
type _PDFRole = keyof typeof PDF_ROLE_TO_HTML_ROLE;

const HEADING_PATTERN = /^H(\d+)$/;

interface StructTreeLayerBuilderOptions {
  pdfPage: PDFPageProxy;
}

export class StructTreeLayerBuilder {
  pdfPage;

  constructor({ pdfPage }: StructTreeLayerBuilderOptions) {
    this.pdfPage = pdfPage;
  }

  render(structTree: StructTreeNode) {
    return this._walk(structTree);
  }

  #setAttributes(
    structElement: StructTreeNode | StructTreeContent,
    htmlElement: HTMLSpanElement,
  ) {
    if ((structElement as StructTreeNode).alt !== undefined) {
      htmlElement.setAttribute(
        "aria-label",
        (structElement as StructTreeNode).alt!,
      );
    }
    if ((structElement as StructTreeContent).id !== undefined) {
      htmlElement.setAttribute(
        "aria-owns",
        (structElement as StructTreeContent).id!,
      );
    }
    if ((structElement as StructTreeNode).lang !== undefined) {
      htmlElement.setAttribute("lang", (structElement as StructTreeNode).lang!);
    }
  }

  _walk(node?: StructTreeNode) {
    if (!node) return undefined;

    const element = html("span");
    if ("role" in node) {
      const { role } = node;
      const match = role.match(HEADING_PATTERN);
      if (match) {
        element.setAttribute("role", "heading");
        element.setAttribute("aria-level", match[1]);
      } else if ((PDF_ROLE_TO_HTML_ROLE)[role as _PDFRole]) {
        element.setAttribute("role", PDF_ROLE_TO_HTML_ROLE[role as _PDFRole]!);
      }
    }

    this.#setAttributes(node, element);

    if (node.children) {
      if (node.children.length === 1 && "id" in node.children[0]) {
        // Often there is only one content node so just set the values on the
        // parent node to avoid creating an extra span.
        this.#setAttributes(node.children[0], element);
      } else {
        for (const kid of node.children) {
          element.append(this._walk(kid as StructTreeNode)!);
        }
      }
    }
    return element;
  }
}
/*80--------------------------------------------------------------------------*/
