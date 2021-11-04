/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */
import { getXfaPageViewport, PixelsPerInch } from "../pdf.ts-src/display/display_utils.js";
import { DefaultXfaLayerFactory } from "./xfa_layer_builder.js";
/*81---------------------------------------------------------------------------*/
export function getXfaHtmlForPrinting(printContainer, pdfDocument) {
    const xfaHtml = pdfDocument.allXfaHtml;
    const factory = new DefaultXfaLayerFactory();
    const scale = Math.round(PixelsPerInch.PDF_TO_CSS_UNITS * 100) / 100;
    for (const xfaPage of xfaHtml.children) {
        const page = document.createElement("div");
        page.className = "xfaPrintedPage";
        printContainer.appendChild(page);
        const builder = factory.createXfaLayerBuilder(page, undefined, pdfDocument.annotationStorage, xfaPage);
        const viewport = getXfaPageViewport(xfaPage, { scale });
        builder.render(viewport, "print");
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=print_utils.js.map