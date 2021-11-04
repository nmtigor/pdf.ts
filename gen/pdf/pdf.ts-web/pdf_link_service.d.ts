import { Ref } from "../pdf.ts-src/core/primitives.js";
import { PDFDocumentProxy, RefProxy } from "../pdf.ts-src/display/api.js";
import { IPDFLinkService } from "./interfaces.js";
import { PDFViewer } from "./pdf_viewer.js";
import { PDFHistory } from "./pdf_history.js";
import { EventBus } from "./ui_utils.js";
import { LinkTarget } from "../pdf.ts-src/display/display_utils.js";
import { Destination, ExplicitDest } from "../pdf.ts-src/core/catalog.js";
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
    /** @implements */
    get page(): number;
    set page(value: number);
    /** @implements */
    get rotation(): number;
    set rotation(value: number);
    /**
     * This method will, when available, also update the browser history.
     * @implements
     * @param dest The named, or explicit, PDF destination.
     */
    goToDestination(dest: string | ExplicitDest): Promise<void>;
    /**
     * This method will, when available, also update the browser history.
     *
     * @implements
     * @param val The page number, or page label.
     */
    goToPage(val: number | string): void;
    /**
     * Wrapper around the `addLinkAttributes`-function in the API.
     * @implements
     */
    addLinkAttributes(link: HTMLAnchorElement, url: string, newWindow?: boolean): void;
    /**
     * @implements
     * @param dest The PDF destination object.
     * @return The hyperlink to the PDF object.
     */
    getDestinationHash(dest?: Destination): string;
    /**
     * Prefix the full url on anchor links to make sure that links are resolved
     * relative to the current URL instead of the one defined in <base href>.
     * @implements
     * @param anchor The anchor hash, including the #.
     * @return The hyperlink to the PDF object.
     */
    getAnchorUrl(anchor: string): string;
    /** @implements */
    setHash(hash: string): void;
    /** @implements */
    executeNamedAction(action: string): void;
    /**
     * @implements
     * @param pageNum page number.
     * @param pageRef reference to the page.
     */
    cachePageRef(pageNum: number, pageRef: RefProxy | undefined): void;
    _cachedPageNumber(pageRef: Ref): number | null;
    /** @implements */
    isPageVisible(pageNumber: number): boolean;
    isPageCached(pageNumber: number): boolean;
}
export declare class SimpleLinkService implements IPDFLinkService {
    /** @implements */
    externalLinkTarget: LinkTarget | undefined;
    /** @implements */
    externalLinkRel: string | undefined;
    /** @implements */
    externalLinkEnabled: boolean;
    /** @implements */
    get pagesCount(): number;
    /** @implements */
    get page(): number;
    set page(value: number);
    /** @implements */
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
    /** @implements */
    addLinkAttributes(link: HTMLAnchorElement, url: string, newWindow?: boolean): void;
    /**
     * @param dest The PDF destination object.
     * @return The hyperlink to the PDF object.
     */
    getDestinationHash(dest?: Destination): string;
    /**
     * @implements
     * @param hash The PDF parameters/hash.
     * @return The hyperlink to the PDF object.
     */
    getAnchorUrl(hash: string): string;
    /** @implements */
    setHash(hash: string): void;
    /** @implements */
    executeNamedAction(action: string): void;
    /**
     * @implements
     * @param pageNum page number.
     * @param pageRef reference to the page.
     */
    cachePageRef(pageNum: number, pageRef: RefProxy | undefined): void;
    /** @implements */
    isPageVisible(pageNumber: number): boolean;
    /**
     * @implements
     * @param {number} pageNumber
     */
    isPageCached(pageNumber: number): boolean;
}
export {};
//# sourceMappingURL=pdf_link_service.d.ts.map