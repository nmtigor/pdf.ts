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
import { SimpleLinkService } from "./pdf_link_service.js";
import { XfaLayer } from "../pdf.ts-src/display/xfa_layer.js";
export class XfaLayerBuilder {
    pageDiv;
    pdfPage;
    annotationStorage;
    linkService;
    xfaHtml;
    div;
    #cancelled = false;
    cancel() { this.#cancelled = true; }
    constructor({ pageDiv, pdfPage, annotationStorage, linkService, xfaHtml }) {
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
    render(viewport, intent = "display") {
        if (intent === "print") {
            const parameters = {
                viewport: viewport.clone({ dontFlip: true }),
                div: this.div,
                xfa: this.xfaHtml,
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
        return this.pdfPage
            .getXfa()
            .then(xfa => {
            if (this.#cancelled || !xfa)
                return { textDivs: [] };
            const parameters = {
                viewport: viewport.clone({ dontFlip: true }),
                div: this.div,
                xfa: xfa,
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
            this.pageDiv.appendChild(this.div);
            parameters.div = this.div;
            return XfaLayer.render(parameters);
        })
            .catch(error => {
            console.error(error);
        });
    }
    hide() {
        if (!this.div)
            return;
        this.div.hidden = true;
    }
}
export class DefaultXfaLayerFactory {
    createXfaLayerBuilder(pageDiv, pdfPage, annotationStorage, xfaHtml) {
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
//# sourceMappingURL=xfa_layer_builder.js.map