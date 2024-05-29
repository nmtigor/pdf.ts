/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/annotation_editor_layer_builder.ts
 * @license Apache-2.0
 ******************************************************************************/

/* Copyright 2022 Mozilla Foundation
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

import { html } from "@fe-lib/dom.ts";
import { GENERIC, PDFJSDev } from "@fe-src/global.ts";
import type {
  AnnotationEditorUIManager,
  AnnotationLayer,
  DrawLayer,
  PageViewport,
  PDFPageProxy,
} from "../pdf.ts-src/pdf.ts";
import { AnnotationEditorLayer } from "../pdf.ts-src/pdf.ts";
import { GenericL10n } from "./genericl10n.ts";
import type { IL10n } from "./interfaces.ts";
import type { TextAccessibilityManager } from "./text_accessibility.ts";
import type { TextLayerBuilder } from "./text_layer_builder.ts";

//kkkk TOCLEANUP
// /* Ref. gulpfile.mjs of pdf.js */
// const { NullL10n } = /*#static*/ GENERIC
//   ? await import("./l10n_utils.ts")
//   : await import("./stubs.ts");
/*80--------------------------------------------------------------------------*/

interface AnnotationEditorLayerBuilderOptions {
  uiManager: AnnotationEditorUIManager;
  pdfPage: PDFPageProxy;
  l10n?: IL10n | undefined;
  accessibilityManager: TextAccessibilityManager | undefined;
  annotationLayer?: AnnotationLayer | undefined;
  textLayer?: TextLayerBuilder | undefined;
  drawLayer?: DrawLayer | undefined;
  onAppend?: (div: HTMLDivElement) => void;
}

export class AnnotationEditorLayerBuilder {
  pdfPage;
  accessibilityManager;
  l10n;
  annotationEditorLayer: AnnotationEditorLayer | undefined;
  div: HTMLDivElement | undefined;

  _cancelled;
  #uiManager;
  #annotationLayer;
  #drawLayer;
  #onAppend;
  #textLayer;

  constructor(options: AnnotationEditorLayerBuilderOptions) {
    this.pdfPage = options.pdfPage;
    this.accessibilityManager = options.accessibilityManager;
    this.l10n = options.l10n;
    /*#static*/ if (PDFJSDev || GENERIC) {
      this.l10n ||= new GenericL10n();
    }
    this._cancelled = false;
    this.#uiManager = options.uiManager;
    this.#annotationLayer = options.annotationLayer;
    this.#textLayer = options.textLayer;
    this.#drawLayer = options.drawLayer;
    this.#onAppend = options.onAppend;
  }

  /**
   * @param intent (default value is 'display')
   */
  async render(viewport: PageViewport, intent = "display") {
    if (intent !== "display") {
      return;
    }

    if (this._cancelled) {
      return;
    }

    const clonedViewport = viewport.clone({ dontFlip: true });
    if (this.div) {
      this.annotationEditorLayer!.update({ viewport: clonedViewport });
      this.show();
      return;
    }

    // Create an AnnotationEditor layer div
    const div = this.div = html("div");
    div.className = "annotationEditorLayer";
    div.hidden = true;
    div.dir = this.#uiManager.direction;
    this.#onAppend?.(div);

    this.annotationEditorLayer = new AnnotationEditorLayer({
      uiManager: this.#uiManager,
      div,
      accessibilityManager: this.accessibilityManager,
      pageIndex: this.pdfPage.pageNumber - 1,
      l10n: this.l10n!,
      viewport: clonedViewport,
      annotationLayer: this.#annotationLayer,
      textLayer: this.#textLayer,
      drawLayer: this.#drawLayer!,
    });

    const parameters = {
      viewport: clonedViewport,
      div,
      annotations: null,
      intent,
    };

    this.annotationEditorLayer.render(parameters);
    this.show();
  }

  cancel() {
    this._cancelled = true;

    if (!this.div) {
      return;
    }
    this.annotationEditorLayer!.destroy();
  }

  hide() {
    if (!this.div) {
      return;
    }
    this.div.hidden = true;
  }

  show() {
    if (!this.div || this.annotationEditorLayer!.isInvisible) {
      return;
    }
    this.div.hidden = false;
  }
}
/*80--------------------------------------------------------------------------*/
