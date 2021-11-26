import { LinkTarget, PageViewport } from "../pdf.ts-src/display/display_utils.js";
import { AnnotationStorage } from "../pdf.ts-src/display/annotation_storage.js";
import { RenderingStates } from "./pdf_rendering_queue.js";
import { TextLayerBuilder } from "./text_layer_builder.js";
import { EventBus } from "./ui_utils.js";
import { AnnotationLayerBuilder } from "./annotation_layer_builder.js";
import { PDFPageProxy, type RefProxy } from "../pdf.ts-src/display/api.js";
import { type Locale_1, type WebL10nArgs } from "../../lib/l10n.js";
import { XfaLayerBuilder } from "./xfa_layer_builder.js";
import { type Destination, type ExplicitDest } from "../pdf.ts-src/core/catalog.js";
import { StructTreeLayerBuilder } from "./struct_tree_layer_builder.js";
import { type XFAElData } from "../pdf.ts-src/core/xfa/alias.js";
import { TextHighlighter } from "./text_highlighter.js";
import { type FieldObject } from "../pdf.ts-src/core/annotation.js";
export interface IPDFLinkService {
    readonly pagesCount: number;
    page: number;
    rotation: number;
    externalLinkTarget: LinkTarget | undefined;
    externalLinkRel: string | undefined;
    externalLinkEnabled: boolean;
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
    /**
     * @param pageNum page number.
     * @param pageRef reference to the page.
     */
    cachePageRef(pageNum: number, pageRef: RefProxy | undefined): void;
    isPageVisible(pageNumber: number): boolean;
    isPageCached(pageNumber: number): boolean;
    eventBus?: EventBus;
}
export interface HistoryInitParms {
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
export interface HistoryPushParms {
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
export interface IPDFTextLayerFactory {
    /**
     * @param enhanceTextSelection=false
     */
    createTextLayerBuilder(textLayerDiv: HTMLDivElement, pageIndex: number, viewport: PageViewport, enhanceTextSelection: boolean, eventBus: EventBus, highlighter: TextHighlighter | undefined): TextLayerBuilder;
}
export interface MouseState {
    isDown?: boolean;
}
export interface IPDFAnnotationLayerFactory {
    /**
     * @param annotationStorage Storage for annotation data in forms.
     * @param imageResourcesPath="" Path for image resources, mainly
     *   for annotation icons. Include trailing slash.
     * @param renderForms=true
     */
    createAnnotationLayerBuilder(pageDiv: HTMLDivElement, pdfPage: PDFPageProxy, annotationStorage?: AnnotationStorage, imageResourcesPath?: string, renderForms?: boolean, l10n?: IL10n, enableScripting?: boolean, hasJSActionsPromise?: Promise<boolean>, mouseState?: MouseState, fieldObjectsPromise?: Promise<Record<string, FieldObject[]> | undefined>): AnnotationLayerBuilder;
}
export interface IPDFXfaLayerFactory {
    createXfaLayerBuilder(pageDiv: HTMLDivElement, pdfPage: PDFPageProxy, annotationStorage?: AnnotationStorage, xfaHtml?: XFAElData): XfaLayerBuilder;
}
export interface IPDFStructTreeLayerFactory {
    createStructTreeLayerBuilder(pdfPage: PDFPageProxy): StructTreeLayerBuilder;
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
export declare abstract class IScripting {
    abstract createSandbox(data: unknown): Promise<void>;
    abstract dispatchEventInSandbox(event: unknown): Promise<void>;
    abstract destroySandbox(): Promise<void>;
}
//# sourceMappingURL=interfaces.d.ts.map