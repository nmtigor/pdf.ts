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

/** @typedef {import("./interfaces").IPDFXfaLayerFactory} IPDFXfaLayerFactory */

import { html } from "../../lib/dom.js";
import { XFAData } from "../pdf.ts-src/core/document.js";
import { XFAElData, XFAElObj } from "../pdf.ts-src/core/xfa/alias.js";
import { AnnotationStorage } from "../pdf.ts-src/display/annotation_storage.js";
import { AnnotIntent, PDFPageProxy } from "../pdf.ts-src/display/api.js";
import { PageViewport } from "../pdf.ts-src/display/display_utils.js";
import { SimpleLinkService } from "./pdf_link_service.js";
import { XfaLayer } from "../pdf.ts-src/display/xfa_layer.js";
import { IPDFLinkService, IPDFXfaLayerFactory } from "./interfaces.js";
/*81---------------------------------------------------------------------------*/

interface XfaLayerBuilderOptions
{
  pageDiv:HTMLDivElement;
  pdfPage:PDFPageProxy | undefined;
  annotationStorage:AnnotationStorage | undefined;
  linkService:IPDFLinkService;
  xfaHtml?:XFAElData | undefined;
}

export interface XfaLayerParms
{
  viewport:PageViewport;
  div?:HTMLDivElement;
  xfa?:XFAData;
  page:PDFPageProxy;
}

export class XfaLayerBuilder
{
  pageDiv;
  pdfPage;
  annotationStorage;
  linkService;
  xfaHtml;

  div?:HTMLDivElement;

  #cancelled = false;
  cancel() { this.#cancelled = true; }

  constructor({ 
    pageDiv, 
    pdfPage, 
    annotationStorage, 
    linkService, 
    xfaHtml 
  }:XfaLayerBuilderOptions ) {
    this.pageDiv = pageDiv;
    this.pdfPage = pdfPage;
    this.annotationStorage = annotationStorage;
    this.linkService = linkService;
    this.xfaHtml = xfaHtml;
  }

  /**
   * @return A promise that is resolved when rendering
   *   of the XFA layer is complete. The first rendering will return an object
   *   with a `textDivs` property that  can be used with the TextHighlighter.
   */
  render( viewport:PageViewport, intent:AnnotIntent="display" )
  {
    if( intent === "print" )
    {
      const parameters = {
        viewport: viewport.clone({ dontFlip: true }),
        div: this.div!,
        xfa: <XFAElObj | undefined>this.xfaHtml,
        page: undefined,
        annotationStorage: this.annotationStorage,
        linkService: this.linkService,
        intent,
      };

      // Create an xfa layer div and render the form
      const div = html("div");
      this.pageDiv.appendChild(div);
      parameters.div = div;

      const result = XfaLayer.render(parameters);
      return Promise.resolve(result);
    }

    // intent === "display"
    return this.pdfPage!
      .getXfa()!
      .then( xfa => {
        if (this.#cancelled || !xfa) return { textDivs: [] };

        const parameters = {
          viewport: viewport.clone({ dontFlip: true }),
          div: this.div!,
          xfa: <XFAElObj | undefined>xfa,
          page: this.pdfPage,
          annotationStorage: this.annotationStorage,
          linkService: this.linkService,
          intent,
        };

        if (this.div) 
        {
          return XfaLayer.update(parameters);
        } 
        // Create an xfa layer div and render the form
        this.div = html("div");
        this.pageDiv.appendChild(this.div);
        parameters.div = this.div;
        return XfaLayer.render(parameters);
      })
      .catch( error => {
        console.error( error );
      });
  }

  hide()
  {
    if( !this.div ) return;
    
    this.div.hidden = true;
  }
}

export class DefaultXfaLayerFactory implements IPDFXfaLayerFactory
{
  createXfaLayerBuilder( 
    pageDiv:HTMLDivElement, 
    pdfPage?:PDFPageProxy,
    annotationStorage?:AnnotationStorage,
    xfaHtml?:XFAElData
  ) {
    return new XfaLayerBuilder({
      pageDiv,
      pdfPage,
      annotationStorage,
      linkService: new SimpleLinkService(),
      xfaHtml,
    });
  }
}
/*81---------------------------------------------------------------------------*/
