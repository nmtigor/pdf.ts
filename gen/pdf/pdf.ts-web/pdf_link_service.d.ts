import { type Destination, type ExplicitDest, PDFDocumentProxy, type RefProxy, SetOCGState } from "../pdf.ts-src/pdf.js";
import { EventBus } from "./event_utils.js";
import { type IPDFLinkService } from "./interfaces.js";
import { PDFHistory } from "./pdf_history.js";
import { PDFViewer } from "./pdf_viewer.js";
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
    eventBus: EventBus;
    externalLinkTarget: LinkTarget | undefined;
    externalLinkRel: string | undefined;
    externalLinkEnabled: boolean;
    baseUrl: string | undefined;
    pdfDocument: PDFDocumentProxy | undefined;
    pdfViewer?: PDFViewer;
    pdfHistory?: PDFHistory;
    constructor({ eventBus, externalLinkTarget, externalLinkRel, ignoreDestinationZoom, }: PDFLinkServiceOptions);
    setDocument(pdfDocument?: PDFDocumentProxy, baseUrl?: string): void;
    setViewer(pdfViewer: PDFViewer): void;
    setHistory(pdfHistory: PDFHistory): void;
    get pagesCount(): number;
    /** @implement */
    get page(): number;
    set page(value: number);
    /** @implement */
    get rotation(): number;
    set rotation(value: number);
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
     * Wrapper around the `addLinkAttributes` helper function.
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
    /**
     * @implement
     * @param pageNum page number.
     * @param pageRef reference to the page.
     */
    cachePageRef(pageNum: number, pageRef: RefProxy | undefined): void;
    /** @implement */
    _cachedPageNumber(pageRef: RefProxy | undefined): number | undefined;
    /** @implement */
    isPageVisible(pageNumber: number): boolean;
    isPageCached(pageNumber: number): boolean;
}
export declare class SimpleLinkService implements IPDFLinkService {
    /** @implement */
    externalLinkTarget: LinkTarget | undefined;
    /** @implement */
    externalLinkRel: string | undefined;
    /** @implement */
    externalLinkEnabled: boolean;
    /** @implement */
    get pagesCount(): number;
    /** @implement */
    get page(): number;
    set page(value: number);
    /** @implement */
    get rotation(): number;
    set rotation(value: number);
    /**
     * @param dest The named, or explicit, PDF destination.
     */
    goToDestination(dest: Destination): Promise<void>;
    /**
     * @param val The page number, or page label.
     */
    goToPage(val: number | string): void;
    /** @implement */
    addLinkAttributes(link: HTMLAnchorElement, url: string, newWindow?: boolean): void;
    /**
     * @param dest The PDF destination object.
     * @return The hyperlink to the PDF object.
     */
    getDestinationHash(dest?: Destination): string;
    /**
     * @implement
     * @param hash The PDF parameters/hash.
     * @return The hyperlink to the PDF object.
     */
    getAnchorUrl(hash: string): string;
    /** @implement */
    setHash(hash: string): void;
    /** @implement */
    executeNamedAction(action: string): void;
    /**
     * @param {Object} action
     */
    executeSetOCGState(action: SetOCGState): void;
    /**
     * @implement
     * @param pageNum page number.
     * @param pageRef reference to the page.
     */
    cachePageRef(pageNum: number, pageRef: RefProxy | undefined): void;
    /** @implement */
    _cachedPageNumber(pageRef: RefProxy): undefined;
    /** @implement */
    isPageVisible(pageNumber: number): boolean;
    /**
     * @implement
     * @param {number} pageNumber
     */
    isPageCached(pageNumber: number): boolean;
}
export {};
//# sourceMappingURL=pdf_link_service.d.ts.map