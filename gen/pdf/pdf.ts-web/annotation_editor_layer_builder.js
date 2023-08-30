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
/** @typedef {import("../src/display/api").PDFPageProxy} PDFPageProxy */
// eslint-disable-next-line max-len
/** @typedef {import("../src/display/display_utils").PageViewport} PageViewport */
/** @typedef {import("./interfaces").IPDFLinkService} IPDFLinkService */
// eslint-disable-next-line max-len
/** @typedef {import("../src/display/editor/tools.js").AnnotationEditorUIManager} AnnotationEditorUIManager */
// eslint-disable-next-line max-len
/** @typedef {import("./text_accessibility.js").TextAccessibilityManager} TextAccessibilityManager */
/** @typedef {import("./interfaces").IL10n} IL10n */
// eslint-disable-next-line max-len
/** @typedef {import("../src/display/annotation_layer.js").AnnotationLayer} AnnotationLayer */
import { html } from "../../lib/dom.js";
import { AnnotationEditorLayer } from "../pdf.ts-src/pdf.js";
import { NullL10n } from "./l10n_utils.js";
export class AnnotationEditorLayerBuilder {
    pageDiv;
    pdfPage;
    accessibilityManager;
    l10n;
    annotationEditorLayer;
    div;
    _cancelled;
    #uiManager;
    #annotationLayer;
    constructor(options) {
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
        div.tabIndex = 0;
        div.hidden = true;
        this.pageDiv.append(div);
        this.annotationEditorLayer = new AnnotationEditorLayer({
            uiManager: this.#uiManager,
            div,
            accessibilityManager: this.accessibilityManager,
            pageIndex: this.pdfPage.pageNumber - 1,
            l10n: this.l10n,
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
        this.annotationEditorLayer.destroy();
        this.div.remove();
    }
    hide() {
        if (!this.div) {
            return;
        }
        this.div.hidden = true;
    }
    show() {
        if (!this.div || this.annotationEditorLayer.isEmpty) {
            return;
        }
        this.div.hidden = false;
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=annotation_editor_layer_builder.js.map