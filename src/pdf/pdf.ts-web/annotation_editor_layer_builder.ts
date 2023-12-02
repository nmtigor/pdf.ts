/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

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
import { GENERIC } from "@fe-src/global.ts";
import type {
  AnnotationEditorUIManager,
  AnnotationLayer,
  PageViewport,
  PDFPageProxy,
} from "../pdf.ts-src/pdf.ts";
import { AnnotationEditorLayer } from "../pdf.ts-src/pdf.ts";
import type { IL10n } from "./interfaces.ts";
import type { TextAccessibilityManager } from "./text_accessibility.ts";

/* Ref. gulpfile.mjs of pdf.js */
const { NullL10n } = /*#static*/ GENERIC
  ? await import("./l10n_utils.ts")
  : await import("./stubs.ts");
/*80--------------------------------------------------------------------------*/

interface AnnotationEditorLayerBuilderOptions {
  uiManager: AnnotationEditorUIManager;
  pageDiv: HTMLDivElement;
  pdfPage: PDFPageProxy;
  l10n?: IL10n | undefined;
  accessibilityManager: TextAccessibilityManager | undefined;
  annotationLayer?: AnnotationLayer | undefined;
}

export class AnnotationEditorLayerBuilder {
  pageDiv: HTMLDivElement | undefined;
  pdfPage;
  accessibilityManager;
  l10n;
  annotationEditorLayer: AnnotationEditorLayer | undefined;
  div: HTMLDivElement | undefined;

  _cancelled;
  #uiManager;
  #annotationLayer;

  constructor(options: AnnotationEditorLayerBuilderOptions) {
    this.pageDiv = options.pageDiv;
    this.pdfPage = options.pdfPage;
    this.accessibilityManager = options.accessibilityManager;
    this.l10n = options.l10n || NullL10n;
    this._cancelled = false;
    this.#uiManager = options.uiManager;
    this.#annotationLayer = options.annotationLayer;
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
    div.tabIndex = 0;
    div.hidden = true;
    div.dir = this.#uiManager.direction;
    this.pageDiv!.append(div);

    this.annotationEditorLayer = new AnnotationEditorLayer({
      uiManager: this.#uiManager,
      div,
      accessibilityManager: this.accessibilityManager,
      pageIndex: this.pdfPage.pageNumber - 1,
      l10n: this.l10n!,
      viewport: clonedViewport,
      annotationLayer: this.#annotationLayer,
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
    this.pageDiv = undefined;
    this.annotationEditorLayer!.destroy();
    this.div.remove();
  }

  hide() {
    if (!this.div) {
      return;
    }
    this.div.hidden = true;
  }

  show() {
    if (!this.div || this.annotationEditorLayer!.isEmpty) {
      return;
    }
    this.div.hidden = false;
  }
}
/*80--------------------------------------------------------------------------*/
