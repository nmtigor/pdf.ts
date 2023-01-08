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
/** @typedef {import("../src/display/display_utils").PageViewport} PageViewport */
/** @typedef {import("./interfaces").IPDFLinkService} IPDFLinkService */
import { html } from "../../lib/dom.js";
import { XfaLayer, } from "../pdf.ts-src/pdf.js";
export class XfaLayerBuilder {
    pageDiv;
    pdfPage;
    annotationStorage;
    linkService;
    xfaHtml;
    div;
    #cancelled = false;
    cancel() {
        this.#cancelled = true;
    }
    constructor({ pageDiv, pdfPage, annotationStorage = undefined, linkService, xfaHtml = undefined, }) {
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
    async render(viewport, intent = "display") {
        if (intent === "print") {
            const parameters = {
                viewport: viewport.clone({ dontFlip: true }),
                div: this.div,
                xfaHtml: this.xfaHtml,
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
        const xfaHtml = await this.pdfPage.getXfa();
        if (this.#cancelled || !xfaHtml)
            return { textDivs: [] };
        const parameters = {
            viewport: viewport.clone({ dontFlip: true }),
            div: this.div,
            xfaHtml: xfaHtml,
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
        if (!this.div)
            return;
        this.div.hidden = true;
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=xfa_layer_builder.js.map