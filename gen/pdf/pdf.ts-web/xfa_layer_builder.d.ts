import { XFAData } from "../pdf.ts-src/core/document.js";
import { XFAElData } from "../pdf.ts-src/core/xfa/alias.js";
import { AnnotationStorage } from "../pdf.ts-src/display/annotation_storage.js";
import { AnnotIntent, PDFPageProxy } from "../pdf.ts-src/display/api.js";
import { PageViewport } from "../pdf.ts-src/display/display_utils.js";
import { IPDFLinkService, IPDFXfaLayerFactory } from "./interfaces.js";
interface XfaLayerBuilderOptions {
    pageDiv: HTMLDivElement;
    pdfPage: PDFPageProxy | undefined;
    annotationStorage: AnnotationStorage | undefined;
    linkService: IPDFLinkService;
    xfaHtml?: XFAElData | undefined;
}
export interface XfaLayerParms {
    viewport: PageViewport;
    div?: HTMLDivElement;
    xfa?: XFAData;
    page: PDFPageProxy;
}
export declare class XfaLayerBuilder {
    #private;
    pageDiv: HTMLDivElement;
    pdfPage: PDFPageProxy | undefined;
    annotationStorage: AnnotationStorage | undefined;
    linkService: IPDFLinkService;
    xfaHtml: XFAElData | undefined;
    div?: HTMLDivElement;
    cancel(): void;
    constructor({ pageDiv, pdfPage, annotationStorage, linkService, xfaHtml }: XfaLayerBuilderOptions);
    /**
     * @return A promise that is resolved when rendering
     *   of the XFA layer is complete. The first rendering will return an object
     *   with a `textDivs` property that  can be used with the TextHighlighter.
     */
    render(viewport: PageViewport, intent?: AnnotIntent): Promise<void | {
        textDivs: Text[];
    }>;
    hide(): void;
}
export declare class DefaultXfaLayerFactory implements IPDFXfaLayerFactory {
    createXfaLayerBuilder(pageDiv: HTMLDivElement, pdfPage?: PDFPageProxy, annotationStorage?: AnnotationStorage, xfaHtml?: XFAElData): XfaLayerBuilder;
}
export {};
//# sourceMappingURL=xfa_layer_builder.d.ts.map