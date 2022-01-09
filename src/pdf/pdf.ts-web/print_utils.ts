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

import { type XFAElObj } from "../pdf.ts-src/core/xfa/alias.js";
import { PDFDocumentProxy } from "../pdf.ts-src/display/api.js";
import { getXfaPageViewport, PixelsPerInch } from "../pdf.ts-src/display/display_utils.js";
import { SimpleLinkService } from "./pdf_link_service.js";
import { XfaLayerBuilder } from "./xfa_layer_builder.js";
/*81---------------------------------------------------------------------------*/

export function getXfaHtmlForPrinting( 
  printContainer:HTMLDivElement, pdfDocument:PDFDocumentProxy
) {
  const xfaHtml = pdfDocument.allXfaHtml!;
  const linkService = new SimpleLinkService();
  const scale = Math.round(PixelsPerInch.PDF_TO_CSS_UNITS * 100) / 100;

  for( const xfaPage of xfaHtml.children! )
  {
    const page = document.createElement("div");
    page.className = "xfaPrintedPage";
    printContainer.appendChild(page);

    const builder = new XfaLayerBuilder({
      pageDiv: page,
      pdfPage: undefined,
      annotationStorage: pdfDocument.annotationStorage,
      linkService,
      xfaHtml: xfaPage,
    });
    const viewport = getXfaPageViewport( <XFAElObj>xfaPage, { scale });

    builder.render(viewport, "print");
  }
}
/*81---------------------------------------------------------------------------*/
