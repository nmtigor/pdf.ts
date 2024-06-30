/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/pdf_link_service.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { uint } from "../../lib/alias.js";
import type { Destination, ExplicitDest, PDFDocumentProxy, SetOCGState } from "../pdf.ts-src/pdf.js";
import type { EventBus } from "./event_utils.js";
import type { IPDFLinkService } from "./interfaces.js";
import type { PDFHistory } from "./pdf_history.js";
import type { PDFViewer } from "./pdf_viewer.js";
export declare const enum LinkTarget {
    NONE = 0,
    SELF = 1,
    BLANK = 2,
    PARENT = 3,
    TOP = 4
}
interface PDFLinkServiceOptions {
    /**
     * The application event bus.
     */
    eventBus: EventBus;
    /**
     * Specifies the `target` attribute
     * for external links. Must use one of the values from {LinkTarget}.
     * Defaults to using no target.
     */
    externalLinkTarget: LinkTarget | undefined;
    /**
     * Specifies the `rel` attribute for
     * external links. Defaults to stripping the referrer.
     */
    externalLinkRel: string | undefined;
    /**
     * Ignores the zoom argument,
     * thus preserving the current zoom level in the viewer, when navigating
     * to internal destinations. The default value is `false`.
     */
    ignoreDestinationZoom: boolean | undefined;
}
/**
 * Performs navigation functions inside PDF, such as opening specified page,
 * or destination.
 */
export declare class PDFLinkService implements IPDFLinkService {
    #private;
    /** @implement */
    eventBus: EventBus;
    /** @implement */
    externalLinkTarget: LinkTarget | undefined;
    /** @implement */
    externalLinkRel: string | undefined;
    /** @implement */
    externalLinkEnabled: boolean;
    baseUrl: string | undefined;
    pdfDocument: PDFDocumentProxy | undefined;
    pdfViewer?: PDFViewer;
    pdfHistory?: PDFHistory;
    constructor({ eventBus, externalLinkTarget, externalLinkRel, ignoreDestinationZoom, }?: PDFLinkServiceOptions);
    setDocument(pdfDocument?: PDFDocumentProxy, baseUrl?: string): void;
    setViewer(pdfViewer: PDFViewer): void;
    setHistory(pdfHistory: PDFHistory): void;
    /** @implement */
    get pagesCount(): number;
    /** @implement */
    get page(): uint;
    set page(value: uint);
    /** @implement */
    get rotation(): number;
    set rotation(value: number);
    /** @implement */
    get isInPresentationMode(): boolean;
    /**
     * This method will, when available, also update the browser history.
     * @implement
     * @param dest The named, or explicit, PDF destination.
     */
    goToDestination(dest: string | ExplicitDest): Promise<void>;
    /**
     * This method will, when available, also update the browser history.
     *
     * @implement
     * @param val The page number, or page label.
     */
    goToPage(val: number | string): void;
    /**
     * Adds various attributes (href, title, target, rel) to hyperlinks.
     * @implement
     */
    addLinkAttributes(link: HTMLAnchorElement, url: string, newWindow?: boolean): void;
    /**
     * @implement
     * @param dest The PDF destination object.
     * @return The hyperlink to the PDF object.
     */
    getDestinationHash(dest?: Destination): string;
    /**
     * Prefix the full url on anchor links to make sure that links are resolved
     * relative to the current URL instead of the one defined in <base href>.
     * @implement
     * @param anchor The anchor hash, including the #.
     * @return The hyperlink to the PDF object.
     */
    getAnchorUrl(anchor: string): string;
    /** @implement */
    setHash(hash: string): void;
    /** @implement */
    executeNamedAction(action: string): void;
    executeSetOCGState(action: SetOCGState): Promise<void>;
}
export declare class SimpleLinkService extends PDFLinkService {
    setDocument(pdfDocument?: PDFDocumentProxy, baseUrl?: string): void;
}
export {};
//# sourceMappingURL=pdf_link_service.d.ts.map