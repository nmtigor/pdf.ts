/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
/* Copyright 2014 Mozilla Foundation
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
/** @typedef {import("./interfaces").IDownloadManager} IDownloadManager */
/** @typedef {import("./interfaces").IL10n} IL10n */
/** @typedef {import("./interfaces").IPDFLinkService} IPDFLinkService */
import { html } from "../../lib/dom.js";
import { AnnotationLayer, } from "../pdf.ts-src/pdf.js";
import { NullL10n } from "./l10n_utils.js";
export class AnnotationLayerBuilder {
    pageDiv;
    pdfPage;
    linkService;
    downloadManager;
    imageResourcesPath;
    renderForms;
    l10n;
    annotationStorage;
    enableScripting;
    _hasJSActionsPromise;
    _fieldObjectsPromise;
    _mouseState;
    _annotationCanvasMap;
    div;
    _cancelled = false;
    constructor({ pageDiv, pdfPage, linkService, downloadManager, annotationStorage, imageResourcesPath = "", renderForms = true, l10n = NullL10n, enableScripting = false, hasJSActionsPromise, fieldObjectsPromise, mouseState, annotationCanvasMap = undefined, }) {
        this.pageDiv = pageDiv;
        this.pdfPage = pdfPage;
        this.linkService = linkService;
        this.downloadManager = downloadManager;
        this.imageResourcesPath = imageResourcesPath;
        this.renderForms = renderForms;
        this.l10n = l10n;
        this.annotationStorage = annotationStorage;
        this.enableScripting = enableScripting;
        this._hasJSActionsPromise = hasJSActionsPromise;
        this._fieldObjectsPromise = fieldObjectsPromise;
        this._mouseState = mouseState;
        this._annotationCanvasMap = annotationCanvasMap;
    }
    /**
     * @param viewport
     * @param intent (default value is 'display')
     * @return A promise that is resolved when rendering of the
     *   annotations is complete.
     */
    async render(viewport, intent = "display") {
        const [annotations, hasJSActions = false, fieldObjects] = await Promise.all([
            this.pdfPage.getAnnotations({ intent }),
            this._hasJSActionsPromise,
            this._fieldObjectsPromise,
        ]);
        if (this._cancelled || annotations.length === 0)
            return;
        const parameters = {
            viewport: viewport.clone({ dontFlip: true }),
            div: this.div,
            annotations,
            page: this.pdfPage,
            imageResourcesPath: this.imageResourcesPath,
            renderForms: this.renderForms,
            linkService: this.linkService,
            downloadManager: this.downloadManager,
            annotationStorage: this.annotationStorage,
            enableScripting: this.enableScripting,
            hasJSActions,
            fieldObjects,
            mouseState: this._mouseState,
        };
        if (this.div) {
            // If an annotationLayer already exists, refresh its children's
            // transformation matrices.
            AnnotationLayer.update(parameters);
        }
        else {
            // Create an annotation layer div and render the annotations
            // if there is at least one annotation.
            this.div = html("div");
            this.div.className = "annotationLayer";
            this.pageDiv.append(this.div);
            parameters.div = this.div;
            AnnotationLayer.render(parameters);
            this.l10n.translate(this.div);
        }
    }
    cancel() {
        this._cancelled = true;
    }
    hide() {
        if (!this.div)
            return;
        this.div.hidden = true;
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=annotation_layer_builder.js.map