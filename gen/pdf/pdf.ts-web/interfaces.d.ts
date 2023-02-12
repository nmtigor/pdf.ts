/** @typedef {import("../src/display/api").PDFPageProxy} PDFPageProxy */
/** @typedef {import("../src/display/display_utils").PageViewport} PageViewport */
/** @typedef {import("./ui_utils").RenderingStates} RenderingStates */
import { type Locale_1, type WebL10nArgs } from "../../3rd/webL10n-2015-10-24/l10n.js";
import { AnnotActions, AppInfo, type Destination, DocInfo, type ExplicitDest, type FieldObject, type RefProxy, ScriptingActionName, type SetOCGState } from "../pdf.ts-src/pdf.js";
import { EventBus } from "./event_utils.js";
import { LinkTarget } from "./pdf_link_service.js";
import { RenderingStates } from "./ui_utils.js";
export interface IPDFLinkService {
    eventBus?: EventBus;
    get pagesCount(): number;
    get page(): number;
    set page(value: number);
    get rotation(): number;
    set rotation(value: number);
    get isInPresentationMode(): boolean;
    externalLinkTarget: LinkTarget | undefined;
    externalLinkRel: string | undefined;
    get externalLinkEnabled(): boolean;
    set externalLinkEnabled(value: boolean);
    /**
     * @param dest The named, or explicit, PDF destination.
     */
    goToDestination(dest: Destination): Promise<void>;
    /**
     * @param val The page number, or page label.
     */
    goToPage(val: number | string): void;
    /**
     * @param newWindow=false
     */
    addLinkAttributes(link: HTMLAnchorElement, url: string, newWindow?: boolean): void;
    /**
     * @param dest The PDF destination object.
     * @return The hyperlink to the PDF object.
     */
    getDestinationHash(dest?: Destination): string;
    /**
     * @param hash The PDF parameters/hash.
     * @return The hyperlink to the PDF object.
     */
    getAnchorUrl(hash: string): string;
    setHash(hash: string): void;
    executeNamedAction(action: string): void;
    executeSetOCGState(action: SetOCGState): void;
    /**
     * @param pageNum page number.
     * @param pageRef reference to the page.
     */
    cachePageRef(pageNum: number, pageRef: RefProxy | undefined): void;
    _cachedPageNumber(pageRef: RefProxy | undefined): number | undefined;
    isPageVisible(pageNumber: number): boolean;
    isPageCached(pageNumber: number): boolean;
}
export interface HistoryInitP {
    /**
     * The PDF document's unique fingerprint.
     */
    fingerprint: string;
    /**
     * Reset the browsing history.
     */
    resetHistory?: boolean;
    /**
     * Attempt to update the document URL, with
     * the current hash, when pushing/replacing browser history entries.
     */
    updateUrl: boolean | undefined;
}
export interface HistoryPushP {
    /**
     * The named destination. If absent, a
     * stringified version of `explicitDest` is used.
     */
    namedDest: string | undefined;
    /**
     * The explicit destination array.
     */
    explicitDest: ExplicitDest;
    /**
     * The page to which the destination points.
     */
    pageNumber?: number;
}
export interface IRenderableView {
    /**
     * Unique ID for rendering queue.
     */
    readonly renderingId: string;
    renderingState: RenderingStates;
    /**
     * @return Resolved on draw completion.
     */
    draw(): Promise<void>;
    resume?(): void;
}
export interface IVisibleView extends IRenderableView {
    readonly id: number;
    readonly div: HTMLDivElement;
}
export interface IDownloadManager {
    downloadUrl(url: string, filename: string): void;
    downloadData(data: Uint8Array | Uint8ClampedArray, filename: string, contentType: string): void;
    /**
     * @return Indicating if the data was opened.
     */
    openOrDownloadData(element: HTMLElement, data: Uint8Array | Uint8ClampedArray, filename: string): boolean;
    download(blob: Blob, url: string, filename: string): void;
}
export interface IL10n {
    getLanguage(): Promise<Lowercase<Locale_1> | "">;
    getDirection(): Promise<"rtl" | "ltr">;
    /**
     * Translates text identified by the key and adds/formats data using the args
     * property bag. If the key was not found, translation falls back to the
     * fallback text.
     */
    get(key: string, args?: WebL10nArgs, fallback?: string): Promise<string>;
    /**
     * Translates HTML element.
     */
    translate(element: HTMLElement): Promise<void>;
}
export type CreateSandboxP = {
    objects: Record<string, FieldObject[]>;
    calculationOrder: string[] | undefined;
    appInfo: AppInfo;
    docInfo: DocInfo;
};
export interface EventInSandBox {
    id: string;
    name: ScriptingActionName;
    pageNumber?: number;
    actions?: AnnotActions | undefined;
}
export declare abstract class IScripting {
    abstract createSandbox(data: CreateSandboxP): Promise<void>;
    abstract dispatchEventInSandbox(event: EventInSandBox): Promise<void>;
    abstract destroySandbox(): Promise<void>;
}
//# sourceMappingURL=interfaces.d.ts.map