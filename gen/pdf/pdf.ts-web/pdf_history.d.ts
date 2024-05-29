/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/pdf_history.ts
 * @license Apache-2.0
 ******************************************************************************/
import { type ExplicitDest } from "../pdf.ts-src/pdf.js";
import { EventBus } from "./event_utils.js";
import { type HistoryInitP, type HistoryPushP, type IPDFLinkService } from "./interfaces.js";
import { type PDFLocation } from "./pdf_viewer.js";
interface PDFHistoryOptions {
    /**
     * The navigation/linking service.
     */
    linkService: IPDFLinkService;
    /**
     * The application event bus.
     */
    eventBus: EventBus;
}
interface PDFHistoryPosition {
    hash: string;
    page: number | undefined;
    first?: number;
    rotation: number;
    temporary?: boolean;
    dest?: ExplicitDest;
}
export interface HistoryState {
    fingerprint: string;
    uid: number;
    destination: PDFHistoryPosition | undefined;
    chromecomState?: unknown;
}
export declare class PDFHistory {
    #private;
    linkService: IPDFLinkService;
    eventBus: EventBus;
    _popStateInProgress?: boolean;
    _currentHash?: string;
    get initialRotation(): number | undefined;
    get initialBookmark(): string | null;
    _boundEvents: {
        updateViewarea(_: {
            location?: PDFLocation | undefined;
        }): void;
        popState(_: {
            state: any;
        }): void;
        pageHide(): void;
    } | undefined;
    _isPagesLoaded?: boolean;
    constructor({ linkService, eventBus }: PDFHistoryOptions);
    /**
     * Initialize the history for the PDF document, using either the current
     * browser history entry or the document hash, whichever is present.
     */
    initialize({ fingerprint, resetHistory, updateUrl, }: HistoryInitP): void;
    /**
     * Reset the current `PDFHistory` instance, and consequently prevent any
     * further updates and/or navigation of the browser history.
     */
    reset(): void;
    /**
     * Push an internal destination to the browser history.
     */
    push({ namedDest, explicitDest, pageNumber, }: HistoryPushP): void;
    /**
     * Push a page to the browser history; generally the `push` method should be
     * used instead.
     */
    pushPage(pageNumber: number): void;
    /**
     * Push the current position to the browser history.
     */
    pushCurrentPosition(): void;
    /**
     * Go back one step in the browser history.
     * NOTE: Avoids navigating away from the document, useful for "named actions".
     */
    back(): void;
    /**
     * Go forward one step in the browser history.
     * NOTE: Avoids navigating away from the document, useful for "named actions".
     */
    forward(): void;
    /**
     * @return Indicating if the user is currently moving through the
     *   browser history, useful e.g. for skipping the next 'hashchange' event.
     */
    get popStateInProgress(): boolean;
}
export declare function isDestHashesEqual(destHash: unknown, pushHash: unknown): boolean;
export declare function isDestArraysEqual(firstDest: ExplicitDest | undefined, secondDest: ExplicitDest | undefined): boolean;
export {};
//# sourceMappingURL=pdf_history.d.ts.map