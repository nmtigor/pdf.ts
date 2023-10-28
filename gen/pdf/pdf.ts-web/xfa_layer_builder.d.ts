import type { AnnotIntent, XFAData, XFAElData } from "../pdf.ts-src/pdf.js";
import { AnnotationStorage, PageViewport, PDFPageProxy } from "../pdf.ts-src/pdf.js";
import type { IPDFLinkService } from "./interfaces.js";
interface XfaLayerBuilderOptions {
    pageDiv: HTMLDivElement;
    pdfPage: PDFPageProxy | undefined;
    annotationStorage: AnnotationStorage | undefined;
    linkService: IPDFLinkService;
    xfaHtml?: XFAElData | undefined;
}
export interface XfaLayerP {
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
    constructor({ pageDiv, pdfPage, annotationStorage, linkService, xfaHtml, }: XfaLayerBuilderOptions);
    /**
     * @return A promise that is resolved when rendering
     *   of the XFA layer is complete. The first rendering will return an object
     *   with a `textDivs` property that can be used with the TextHighlighter.
     */
    render(viewport: PageViewport, intent?: AnnotIntent): Promise<void | {
        textDivs: Text[];
    }>;
    hide(): void;
}
export {};
//# sourceMappingURL=xfa_layer_builder.d.ts.map