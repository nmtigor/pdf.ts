/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/xfa_layer.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { IPDFLinkService } from "../../pdf.ts-web/interfaces.js";
import type { XFAElObj } from "../core/xfa/alias.js";
import type { AnnotationStorage } from "./annotation_storage.js";
import type { AnnotIntent, PDFPageProxy } from "./api.js";
import type { PageViewport } from "./display_utils.js";
interface XfaLayerP_ {
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
    static render(parameters: XfaLayerP_): {
        textDivs: Text[];
    };
    /**
     * Update the XFA layer.
     */
    static update(parameters: XfaLayerP_): void;
}
export {};
//# sourceMappingURL=xfa_layer.d.ts.map