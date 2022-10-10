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
/** @typedef {import("../annotation_storage.js").AnnotationStorage} AnnotationStorage */
// eslint-disable-next-line max-len
/** @typedef {import("./text_accessibility.js").TextAccessibilityManager} TextAccessibilityManager */
/** @typedef {import("./interfaces").IL10n} IL10n */
import { html } from "../../lib/dom.js";
import { AnnotationEditorLayer, } from "../pdf.ts-src/pdf.js";
import { NullL10n } from "./l10n_utils.js";
export class AnnotationEditorLayerBuilder {
    pageDiv;
    pdfPage;
    annotationStorage;
    accessibilityManager;
    l10n;
    annotationEditorLayer;
    div;
    _cancelled;
    #uiManager;
    constructor(options) {
        this.pageDiv = options.pageDiv;
        this.pdfPage = options.pdfPage;
        this.annotationStorage = options.annotationStorage || undefined;
        this.accessibilityManager = options.accessibilityManager;
        this.l10n = options.l10n || NullL10n;
        this._cancelled = false;
        this.#uiManager = options.uiManager;
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
        this.div = html("div");
        this.div.className = "annotationEditorLayer";
        this.div.tabIndex = 0;
        this.pageDiv.append(this.div);
        this.annotationEditorLayer = new AnnotationEditorLayer({
            uiManager: this.#uiManager,
            div: this.div,
            annotationStorage: this.annotationStorage,
            accessibilityManager: this.accessibilityManager,
            pageIndex: this.pdfPage._pageIndex,
            l10n: this.l10n,
            viewport: clonedViewport,
        });
        const parameters = {
            viewport: clonedViewport,
            div: this.div,
            annotations: null,
            intent,
        };
        this.annotationEditorLayer.render(parameters);
    }
    cancel() {
        this._cancelled = true;
        this.destroy();
    }
    hide() {
        if (!this.div) {
            return;
        }
        this.div.hidden = true;
    }
    show() {
        if (!this.div) {
            return;
        }
        this.div.hidden = false;
    }
    destroy() {
        if (!this.div) {
            return;
        }
        this.pageDiv = undefined;
        this.annotationEditorLayer.destroy();
        this.div.remove();
    }
}
//# sourceMappingURL=annotation_editor_layer_builder.js.map