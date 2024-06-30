/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/interfaces.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { Locale } from "../../lib/Locale.js";
import type { AnnotActions, AppInfo, Destination, DocInfo, ExplicitDest, FieldObject, PDFDocumentProxy, PrintAnnotationStorage, ScriptingActionName, SetOCGState } from "../pdf.ts-src/pdf.js";
import type { EventBus } from "./event_utils.js";
import type { LinkTarget } from "./pdf_link_service.js";
import type { RenderingStates } from "./ui_utils.js";
import type { FluentMessageArgs } from "../../3rd/fluent/dom/esm/localization.js";
import type { PDFViewerApplication } from "./app.js";
import type { PageOverview } from "./pdf_viewer.js";
import type { uint } from "../../lib/alias.js";
export interface IPDFLinkService {
    eventBus?: EventBus;
    get pagesCount(): number;
    get page(): uint;
    set page(value: uint);
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
    resume: (() => void) | undefined;
}
export interface IVisibleView extends IRenderableView {
    readonly id: number;
    readonly div: HTMLDivElement;
}
export interface IDownloadManager {
    downloadUrl(url: string, filename: string, _options?: object): void;
    downloadData(data: Uint8Array | Uint8ClampedArray, filename: string, contentType: string): void;
    /**
     * @return Indicating if the data was opened.
     */
    openOrDownloadData(data: Uint8Array | Uint8ClampedArray, filename: string, dest?: string): boolean;
    download(blob: Blob, url: string, filename: string, _options?: object): void;
}
export interface IL10n {
    /**
     * @return The current locale.
     */
    getLanguage(): Locale;
    getDirection(): "rtl" | "ltr";
    /**
     * Translates text identified by the key and adds/formats data using the args
     * property bag. If the key was not found, translation falls back to the
     * fallback text.
     */
    get<S extends string | string[]>(ids: S, args?: FluentMessageArgs, fallback?: string): Promise<S>;
    /**
     * Translates HTML element.
     */
    translate(element: HTMLElement): Promise<void>;
    /**
     * Pause the localization.
     */
    pause(): void;
    /**
     * Resume the localization.
     */
    resume(): void;
}
export type CreatePrintServiceP = {
    pdfDocument: PDFDocumentProxy;
    pagesOverview: PageOverview[];
    printContainer: HTMLDivElement;
    printResolution: number;
    printAnnotationStoragePromise?: Promise<PrintAnnotationStorage | undefined>;
};
export declare abstract class IPDFPrintServiceFactory {
    static initGlobals(app: PDFViewerApplication): void;
    static get supportsPrinting(): boolean;
    static createPrintService(params: CreatePrintServiceP): void;
}
export type CreateSandboxP = {
    objects: Record<string, FieldObject[]>;
    calculationOrder: string[] | undefined;
    appInfo: AppInfo;
    docInfo: DocInfo;
};
export interface EventInSandBox {
    id?: string;
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