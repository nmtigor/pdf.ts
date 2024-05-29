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
import { html } from "../../lib/dom.js";
import { GENERIC, PDFJSDev } from "../../global.js";
import { AnnotationEditorLayer } from "../pdf.ts-src/pdf.js";
import { GenericL10n } from "./genericl10n.js";
export class AnnotationEditorLayerBuilder {
    pdfPage;
    accessibilityManager;
    l10n;
    annotationEditorLayer;
    div;
    _cancelled;
    #uiManager;
    #annotationLayer;
    #drawLayer;
    #onAppend;
    #textLayer;
    constructor(options) {
        this.pdfPage = options.pdfPage;
        this.accessibilityManager = options.accessibilityManager;
        this.l10n = options.l10n;
        /*#static*/  {
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
    async render(viewport, intent = "display") {
        if (intent !== "display") {
            return;
        }
        if (this._cancelled) {
            return;
        }
        const clonedViewport = viewport.clone({ dontFlip: true });
        if (this.div) {
            this.annotationEditorLayer.update({ viewport: clonedViewport });
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
            l10n: this.l10n,
            viewport: clonedViewport,
            annotationLayer: this.#annotationLayer,
            textLayer: this.#textLayer,
            drawLayer: this.#drawLayer,
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
        this.annotationEditorLayer.destroy();
    }
    hide() {
        if (!this.div) {
            return;
        }
        this.div.hidden = true;
    }
    show() {
        if (!this.div || this.annotationEditorLayer.isInvisible) {
            return;
        }
        this.div.hidden = false;
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=annotation_editor_layer_builder.js.map