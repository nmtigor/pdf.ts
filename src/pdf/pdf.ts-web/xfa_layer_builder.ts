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
// eslint-disable-next-line max-len
/** @typedef {import("../src/display/annotation_storage").AnnotationStorage} AnnotationStorage */
// eslint-disable-next-line max-len
/** @typedef {import("../src/display/display_utils").PageViewport} PageViewport */
/** @typedef {import("./interfaces").IPDFLinkService} IPDFLinkService */

import { html } from "@fe-lib/dom.ts";
import type {
  AnnotIntent,
  XFAData,
  XFAElData,
  XFAElObj,
} from "../pdf.ts-src/pdf.ts";
import {
  AnnotationStorage,
  PageViewport,
  PDFPageProxy,
  XfaLayer,
} from "../pdf.ts-src/pdf.ts";
import type { IPDFLinkService } from "./interfaces.ts";
/*80--------------------------------------------------------------------------*/

interface XfaLayerBuilderOptions {
  pageDiv: HTMLDivElement;
  pdfPage: PDFPageProxy | undefined;
  annotationStorage: AnnotationStorage | undefined;
  linkService: IPDFLinkService;
  xfaHtml?: XFAElData | undefined;
}

export interface XfaLayerP {
  viewport: PageViewport;
  div?: HTMLDivElement;
  xfa?: XFAData;
  page: PDFPageProxy;
}

export class XfaLayerBuilder {
  pageDiv;
  pdfPage;
  annotationStorage;
  linkService;
  xfaHtml;

  div?: HTMLDivElement;

  #cancelled = false;
  cancel() {
    this.#cancelled = true;
  }

  constructor({
    pageDiv,
    pdfPage,
    annotationStorage = undefined,
    linkService,
    xfaHtml = undefined,
  }: XfaLayerBuilderOptions) {
    this.pageDiv = pageDiv;
    this.pdfPage = pdfPage;
    this.annotationStorage = annotationStorage;
    this.linkService = linkService;
    this.xfaHtml = xfaHtml;
  }

  /**
   * @return A promise that is resolved when rendering
   *   of the XFA layer is complete. The first rendering will return an object
   *   with a `textDivs` property that can be used with the TextHighlighter.
   */
  async render(viewport: PageViewport, intent: AnnotIntent = "display") {
    if (intent === "print") {
      const parameters = {
        viewport: viewport.clone({ dontFlip: true }),
        div: this.div!,
        xfaHtml: <XFAElObj> this.xfaHtml,
        annotationStorage: this.annotationStorage,
        linkService: this.linkService,
        intent,
      };

      // Create an xfa layer div and render the form
      const div = html("div");
      this.pageDiv.append(div);
      parameters.div = div;

      return XfaLayer.render(parameters);
    }

    // intent === "display"
    const xfaHtml = await this.pdfPage!.getXfa();
    if (this.#cancelled || !xfaHtml) return { textDivs: [] };

    const parameters = {
      viewport: viewport.clone({ dontFlip: true }),
      div: this.div!,
      xfaHtml: <XFAElObj> xfaHtml,
      page: this.pdfPage,
      annotationStorage: this.annotationStorage,
      linkService: this.linkService,
      intent,
    };

    if (this.div) {
      return XfaLayer.update(parameters);
    }
    // Create an xfa layer div and render the form
    this.div = html("div");
    this.pageDiv.append(this.div);
    parameters.div = this.div;

    return XfaLayer.render(parameters);
  }

  hide() {
    if (!this.div) return;

    this.div.hidden = true;
  }
}
/*80--------------------------------------------------------------------------*/
