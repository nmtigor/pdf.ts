import { type XFAElObj } from "../core/xfa/alias.js";
import { AnnotationStorage } from "./annotation_storage.js";
import { type AnnotIntent, PDFPageProxy } from "./api.js";
import { PageViewport } from "./display_utils.js";
import { type IPDFLinkService } from "../../pdf.ts-web/interfaces.js";
interface XfaLayerParms {
    viewport?: PageViewport;
    div: HTMLDivElement;
    xfaHtml: XFAElObj;
    page?: PDFPageProxy | undefined;
    annotationStorage?: AnnotationStorage | undefined;
    linkService?: IPDFLinkService;
    /**
     * (default value is 'display').
     */
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
    /**
     * Render the XFA layer.
     */
    static render(parameters: XfaLayerParms): {
        textDivs: Text[];
    };
    /**
     * Update the XFA layer.
     */
    static update(parameters: XfaLayerParms): void;
}
export {};
//# sourceMappingURL=xfa_layer.d.ts.map