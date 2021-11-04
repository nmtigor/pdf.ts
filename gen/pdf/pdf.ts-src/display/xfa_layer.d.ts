import { XFAElObj } from "../core/xfa/alias.js";
import { AnnotationStorage } from "./annotation_storage.js";
import { AnnotIntent, PDFPageProxy } from "./api.js";
import { PageViewport } from "./display_utils.js";
import { IPDFLinkService } from "src/pdf/pdf.ts-web/interfaces.js";
interface XfaLayerParms {
    viewport?: PageViewport;
    div: HTMLDivElement;
    xfa: XFAElObj | undefined;
    page?: PDFPageProxy | undefined;
    annotationStorage?: AnnotationStorage | undefined;
    linkService?: IPDFLinkService;
    intent: AnnotIntent;
}
interface SetAttributesParms {
    html: Element;
    element: XFAElObj;
    storage?: AnnotationStorage | undefined;
    intent?: AnnotIntent;
    linkService: IPDFLinkService;
}
export declare abstract class XfaLayer {
    static setupStorage(html: Element, id: string, element: XFAElObj, storage: AnnotationStorage, intent?: AnnotIntent): void;
    static setAttributes({ html, element, storage, intent, linkService }: SetAttributesParms): void;
    static render(parameters: XfaLayerParms): {
        textDivs: Text[];
    };
    /**
     * Update the xfa layer.
     */
    static update(parameters: XfaLayerParms): void;
}
export {};
//# sourceMappingURL=xfa_layer.d.ts.map