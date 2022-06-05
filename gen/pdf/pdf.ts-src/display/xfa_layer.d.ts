import { type IPDFLinkService } from "../../pdf.ts-web/interfaces.js";
import { type XFAElObj } from "../core/xfa/alias.js";
import { AnnotationStorage } from "./annotation_storage.js";
import { PDFPageProxy, type AnnotIntent } from "./api.js";
import { PageViewport } from "./display_utils.js";
interface _XfaLayerP {
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
interface _SetAttributesP {
    html: Element;
    element: XFAElObj;
    storage?: AnnotationStorage | undefined;
    intent?: AnnotIntent;
    linkService: IPDFLinkService;
}
export declare abstract class XfaLayer {
    static setupStorage(html: Element, id: string, element: XFAElObj, storage: AnnotationStorage, intent?: AnnotIntent): void;
    static setAttributes({ html, element, storage, intent, linkService }: _SetAttributesP): void;
    /**
     * Render the XFA layer.
     */
    static render(parameters: _XfaLayerP): {
        textDivs: Text[];
    };
    /**
     * Update the XFA layer.
     */
    static update(parameters: _XfaLayerP): void;
}
export {};
//# sourceMappingURL=xfa_layer.d.ts.map