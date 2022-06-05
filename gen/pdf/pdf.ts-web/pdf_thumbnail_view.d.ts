import { PDFPageProxy, RenderTask } from "../pdf.ts-src/display/api.js";
import { PageViewport } from "../pdf.ts-src/display/display_utils.js";
import { OptionalContentConfig } from "../pdf.ts-src/display/optional_content_config.js";
import { type IL10n, type IPDFLinkService, type IVisibleView } from "./interfaces.js";
import { PDFPageView } from "./pdf_page_view.js";
import { PDFRenderingQueue } from "./pdf_rendering_queue.js";
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
    checkSetImageDisabled: () => boolean;
    /**
     * Localization service.
     */
    l10n: IL10n;
}
export declare class TempImageFactory {
    #private;
    static getCanvas(width: number, height: number): readonly [HTMLCanvasElement, CanvasRenderingContext2D];
    static destroyCanvas(): void;
}
export declare class PDFThumbnailView implements IVisibleView {
    #private;
    readonly id: number; /** @implements */
    readonly renderingId: string; /** @implements */
    pageLabel: string | undefined;
    pdfPage?: PDFPageProxy;
    rotation: number;
    viewport: PageViewport;
    pdfPageRotate: number;
    _optionalContentConfigPromise: Promise<OptionalContentConfig> | undefined;
    linkService: IPDFLinkService;
    renderingQueue: PDFRenderingQueue;
    renderTask?: RenderTask | undefined;
    renderingState: RenderingStates;
    resume?: (() => void) | undefined; /** @implements */
    canvasWidth: number;
    canvasHeight: number;
    scale: number;
    l10n: IL10n;
    anchor: HTMLAnchorElement;
    div: HTMLDivElement; /** @implements */
    ring: HTMLDivElement;
    canvas?: HTMLCanvasElement;
    image?: HTMLImageElement;
    constructor({ container, id, defaultViewport, optionalContentConfigPromise, linkService, renderingQueue, checkSetImageDisabled, l10n, }: PDFThumbnailViewOptions);
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