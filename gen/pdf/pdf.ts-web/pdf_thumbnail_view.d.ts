import { OptionalContentConfig, PageViewport, PDFPageProxy, RenderTask } from "../pdf.ts-src/pdf.js";
import { type IL10n, type IPDFLinkService, type IVisibleView } from "./interfaces.js";
import { PDFPageView } from "./pdf_page_view.js";
import { PDFRenderingQueue } from "./pdf_rendering_queue.js";
import { PageColors } from "./pdf_viewer.js";
import { RenderingStates } from "./ui_utils.js";
interface PDFThumbnailViewOptions {
    /**
     * The viewer element.
     */
    container: HTMLDivElement;
    /**
     * The thumbnail's unique ID (normally its number).
     */
    id: number;
    /**
     * The page viewport.
     */
    defaultViewport: PageViewport;
    /**
     * A promise that is resolved with an {@link OptionalContentConfig} instance.
     * The default value is `null`.
     */
    optionalContentConfigPromise?: Promise<OptionalContentConfig>;
    /**
     * The navigation/linking service.
     */
    linkService: IPDFLinkService;
    /**
     * The rendering queue object.
     */
    renderingQueue: PDFRenderingQueue;
    /**
     * Localization service.
     */
    l10n: IL10n;
    /**
     * Overwrites background and foreground colors
     * with user defined ones in order to improve readability in high contrast
     * mode.
     */
    pageColors: PageColors | undefined;
}
export declare class TempImageFactory {
    #private;
    static getCanvas(width: number, height: number): readonly [HTMLCanvasElement, CanvasRenderingContext2D];
    static destroyCanvas(): void;
}
export declare class PDFThumbnailView implements IVisibleView {
    #private;
    readonly id: number; /** @implement */
    readonly renderingId: string; /** @implement */
    pageLabel: string | undefined;
    pdfPage?: PDFPageProxy;
    rotation: number;
    viewport: PageViewport;
    pdfPageRotate: number;
    _optionalContentConfigPromise: Promise<OptionalContentConfig> | undefined;
    pageColors: PageColors | undefined;
    linkService: IPDFLinkService;
    renderingQueue: PDFRenderingQueue;
    renderTask?: RenderTask | undefined;
    renderingState: RenderingStates;
    resume?: (() => void) | undefined; /** @implement */
    canvasWidth: number;
    canvasHeight: number;
    scale: number;
    l10n: IL10n;
    anchor: HTMLAnchorElement;
    div: HTMLDivElement; /** @implement */
    ring: HTMLDivElement;
    canvas?: HTMLCanvasElement;
    image?: HTMLImageElement;
    constructor({ container, id, defaultViewport, optionalContentConfigPromise, linkService, renderingQueue, l10n, pageColors, }: PDFThumbnailViewOptions);
    setPdfPage(pdfPage: PDFPageProxy): void;
    reset(): void;
    update({ rotation }: {
        rotation?: number;
    }): void;
    /**
     * PLEASE NOTE: Most likely you want to use the `this.reset()` method,
     *              rather than calling this one directly.
     */
    cancelRendering(): void;
    draw(): Promise<void>;
    setImage(pageView: PDFPageView): void;
    get _thumbPageTitle(): Promise<string>;
    get _thumbPageCanvas(): Promise<string>;
    setPageLabel(label: string | null): void;
}
export {};
//# sourceMappingURL=pdf_thumbnail_view.d.ts.map