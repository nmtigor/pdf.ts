import { EventBus, EventMap, PresentationModeState, RendererType, ScrollMode, SpreadMode, TextLayerMode, VisibleElement, VisibleElements } from "./ui_utils.js";
import { PDFRenderingQueue } from "./pdf_rendering_queue.js";
import { AnnotationLayerBuilder } from "./annotation_layer_builder.js";
import { PDFPageView } from "./pdf_page_view.js";
import { TextLayerBuilder } from "./text_layer_builder.js";
import { IL10n, IPDFAnnotationLayerFactory, IPDFLinkService, IPDFStructTreeLayerFactory, IPDFTextLayerFactory, IPDFXfaLayerFactory, MouseState } from "./interfaces.js";
import { DownloadManager } from "./download_manager.js";
import { PDFFindController } from "./pdf_find_controller.js";
import { AnnotationMode } from "../pdf.ts-src/shared/util.js";
import { PDFDocumentProxy, PDFPageProxy } from "../pdf.ts-src/display/api.js";
import { OptionalContentConfig } from "../pdf.ts-src/display/optional_content_config.js";
import { PageViewport } from "../pdf.ts-src/display/display_utils.js";
import { AnnotationStorage } from "../pdf.ts-src/display/annotation_storage.js";
import { XfaLayerBuilder } from "./xfa_layer_builder.js";
import { PDFScriptingManager } from "./pdf_scripting_manager.js";
import { ExplicitDest } from "../pdf.ts-src/core/catalog.js";
import { StructTreeLayerBuilder } from "./struct_tree_layer_builder.js";
import { TextHighlighter } from "./text_highlighter.js";
import { FieldObject } from "../pdf.ts-src/core/annotation.js";
export interface PDFViewerOptions {
    /**
     * The container for the viewer element.
     */
    container: HTMLDivElement;
    /**
     * The viewer element.
     */
    viewer?: HTMLDivElement;
    /**
     * The application event bus.
     */
    eventBus: EventBus;
    /**
     * The navigation/linking service.
     */
    linkService: IPDFLinkService;
    /**
     * The download manager component.
     */
    downloadManager?: DownloadManager;
    /**
     * The find controller component.
     */
    findController?: PDFFindController;
    /**
     * The scripting manager component.
     */
    scriptingManager: PDFScriptingManager | false | undefined;
    /**
     * The rendering queue object.
     */
    renderingQueue?: PDFRenderingQueue;
    /**
     * Removes the border shadow around the pages. The default value is `false`.
     */
    removePageBorders?: boolean;
    /**
     * Controls if the text layer used for
     * selection and searching is created, and if the improved text selection
     * behaviour is enabled. The constants from {TextLayerMode} should be used.
     * The default value is `TextLayerMode.ENABLE`.
     */
    textLayerMode: TextLayerMode | undefined;
    /**
     * Controls if the annotation layer is
     * created, and if interactive form elements or `AnnotationStorage`-data are
     * being rendered. The constants from {@link AnnotationMode} should be used;
     * see also {@link RenderParameters} and {@link GetOperatorListParameters}.
     * The default value is `AnnotationMode.ENABLE_FORMS`.
     */
    annotationMode?: AnnotationMode;
    /**
     * Path for image resources, mainly
     * mainly for annotation icons. Include trailing slash.
     */
    imageResourcesPath: string | undefined;
    /**
     * Enables automatic rotation of
     * landscape pages upon printing. The default is `false`.
     */
    enablePrintAutoRotate: boolean | undefined;
    /**
     * 'canvas' or 'svg'. The default is 'canvas'.
     */
    renderer: RendererType | undefined;
    /**
     * Enables CSS only zooming. The default value is `false`.
     */
    useOnlyCssZoom: boolean | undefined;
    /**
     * The maximum supported canvas size in
     * total pixels, i.e. width * height. Use -1 for no limit. The default value
     * is 4096 * 4096 (16 mega-pixels).
     */
    maxCanvasPixels: number | undefined;
    /**
     * Localization service.
     */
    l10n?: IL10n;
}
declare class PDFPageViewBuffer {
    push: (view: PDFPageView) => void;
    resize: (newSize: number, pagesToKeep: VisibleElement[]) => void;
    has: (view: PDFPageView) => boolean;
    constructor(size: number);
}
interface ScrollPageIntoViewParms {
    /**
     * The page number.
     */
    pageNumber: number;
    /**
     * The original PDF destination array, in the
     * format: <page-ref> </XYZ|/FitXXX> <args..>
     */
    destArray?: ExplicitDest | undefined;
    /**
     * Allow negative page offsets.
     * The default value is `false`.
     */
    allowNegativeOffset?: boolean;
    /**
     * Ignore the zoom argument in
     * the destination array. The default value is `false`.
     */
    ignoreDestinationZoom?: boolean;
}
export interface PDFLocation {
    pageNumber: number;
    scale?: string | number;
    top: number;
    left: number;
    rotation: number;
    pdfOpenParams: string;
}
export interface ScrollIntoViewParms {
    pageDiv: HTMLDivElement;
    pageSpot?: {
        top?: number;
        left?: number;
    } | undefined;
    pageNumber?: number | undefined;
}
export interface PageOverview {
    width: number;
    height: number;
    rotation: number;
}
/**
 * Simple viewer control to display PDF content/pages.
 */
export declare abstract class BaseViewer implements IPDFAnnotationLayerFactory, IPDFTextLayerFactory, IPDFXfaLayerFactory, IPDFStructTreeLayerFactory {
    #private;
    container: HTMLDivElement;
    viewer: HTMLDivElement;
    eventBus: EventBus;
    linkService: IPDFLinkService;
    downloadManager: DownloadManager | undefined;
    findController: PDFFindController | undefined;
    _scriptingManager: PDFScriptingManager | null;
    get enableScripting(): boolean;
    removePageBorders: boolean;
    textLayerMode: TextLayerMode;
    _annotationMode: AnnotationMode;
    get renderForms(): boolean;
    imageResourcesPath: string;
    enablePrintAutoRotate: boolean;
    renderer: RendererType;
    useOnlyCssZoom: boolean;
    maxCanvasPixels: number | undefined;
    l10n: IL10n;
    _mouseState?: MouseState;
    defaultRenderingQueue: boolean;
    renderingQueue?: PDFRenderingQueue | undefined;
    _doc: HTMLElement;
    scroll: {
        right: boolean;
        down: boolean;
        lastX: number;
        lastY: number;
        /**
         * Ignore the zoom argument in
         * the destination array. The default value is `false`.
         */
        _eventHandler: (evt: unknown) => void;
    };
    presentationModeState: PresentationModeState;
    _onBeforeDraw: ((evt: EventMap['pagerender']) => void) | undefined;
    _onAfterDraw: ((evt: EventMap['pagerendered']) => void) | undefined;
    _pages: PDFPageView[];
    get pagesCount(): number;
    getPageView(index: number): PDFPageView;
    protected _currentPageNumber: number;
    get currentPageNumber(): number;
    /**
     * @param val The page number.
     */
    set currentPageNumber(val: number);
    _currentScale: number;
    get currentScale(): number;
    /**
     * @param val Scale of the pages in percents.
     */
    set currentScale(val: number);
    /** @final */
    get currentScaleValue(): string | number;
    /**
     * @final
     * @param val The scale of the pages (in percent or predefined value).
     */
    set currentScaleValue(val: string | number);
    _pageLabels?: string[] | undefined;
    /**
     * @return Returns the current page label, or `null` if no page labels exist.
     */
    get currentPageLabel(): string | undefined;
    /**
     * @param val The page label.
     */
    set currentPageLabel(val: string | undefined);
    _buffer: PDFPageViewBuffer;
    _pagesRotation: number;
    get pagesRotation(): number;
    _optionalContentConfigPromise?: Promise<OptionalContentConfig | undefined> | undefined;
    _pagesRequests: WeakMap<PDFPageView, Promise<PDFPageProxy | void>>;
    get firstPagePromise(): Promise<PDFPageProxy> | null;
    get onePageRendered(): Promise<void> | null;
    get pagesPromise(): Promise<void> | null;
    _scrollMode: ScrollMode;
    _previousScrollMode: ScrollMode;
    _spreadMode: SpreadMode;
    pdfDocument?: PDFDocumentProxy | undefined;
    constructor(options: PDFViewerOptions);
    /**
     * @return True if all {PDFPageView} objects are initialized.
     */
    get pageViewsReady(): boolean;
    /**
     * @return Whether the pageNumber is valid (within bounds).
     */
    protected setCurrentPageNumber$(val: number, resetCurrentPageView?: boolean): boolean;
    /**
     * @param rotation The rotation of the pages (0, 90, 180, 270).
     */
    set pagesRotation(rotation: number);
    /** @final */
    setDocument(pdfDocument?: PDFDocumentProxy): void;
    setPageLabels(labels: string[] | null): void;
    protected _resetView(): void;
    _ensurePageViewVisible(): void;
    _scrollUpdate(): void;
    protected _scrollIntoView({ pageDiv, pageSpot }: ScrollIntoViewParms, pageNumber?: number): void;
    protected get _pageWidthScaleFactor(): 1 | 2;
    _setScale(value: string | number, noScroll?: boolean): void;
    /**
     * @return The page number corresponding to the page label,
     *   or `null` when no page labels exist and/or the input is invalid.
     */
    pageLabelToPageNumber(label: string): number | null;
    /**
     * Scrolls page into view.
     */
    scrollPageIntoView({ pageNumber, destArray, allowNegativeOffset, ignoreDestinationZoom, }: ScrollPageIntoViewParms): void;
    /** @final */
    update(): void;
    containsElement(element: Node | null): boolean;
    focus(): void;
    get _isContainerRtl(): boolean;
    get isInPresentationMode(): boolean;
    get isChangingPresentationMode(): boolean;
    get isHorizontalScrollbarEnabled(): boolean;
    get isVerticalScrollbarEnabled(): boolean;
    /**
     * Helper method for `this.getVisiblePages$`. Should only ever be used when
     * the viewer can only display a single page at a time, for example:
     *  - When PresentationMode is active.
     */
    protected getCurrentVisiblePage$(): VisibleElements;
    protected getVisiblePages$(): VisibleElements;
    isPageVisible(pageNumber: number): boolean;
    isPageCached(pageNumber: number): boolean;
    cleanup(): void;
    protected _cancelRendering(): void;
    forceRendering(currentlyVisiblePages?: VisibleElements): boolean;
    /** @implements */
    createTextLayerBuilder(textLayerDiv: HTMLDivElement, pageIndex: number, viewport: PageViewport, enhanceTextSelection: boolean | undefined, eventBus: EventBus, highlighter: TextHighlighter): TextLayerBuilder;
    createTextHighlighter(pageIndex: number, eventBus: EventBus): TextHighlighter;
    /**
     * @implements
     * @param imageResourcesPath Path for image resources, mainly
     *   for annotation icons. Include trailing slash.
     */
    createAnnotationLayerBuilder(pageDiv: HTMLDivElement, pdfPage: PDFPageProxy, annotationStorage?: AnnotationStorage, imageResourcesPath?: string, renderForms?: boolean, l10n?: IL10n, enableScripting?: boolean, hasJSActionsPromise?: Promise<boolean>, mouseState?: MouseState, fieldObjectsPromise?: Promise<Record<string, FieldObject[]> | undefined>): AnnotationLayerBuilder;
    /**
     * @param annotationStorage Storage for annotation data in forms.
     */
    createXfaLayerBuilder(pageDiv: HTMLDivElement, pdfPage: PDFPageProxy | undefined, annotationStorage?: AnnotationStorage): XfaLayerBuilder;
    /** @implements */
    createStructTreeLayerBuilder(pdfPage: PDFPageProxy): StructTreeLayerBuilder;
    /**
     * @return Whether all pages of the PDF document have identical
     *   widths and heights.
     */
    get hasEqualPageSizes(): boolean;
    /**
     * Returns sizes of the pages.
     * @return Array of objects with width/height/rotation fields.
     */
    getPagesOverview(): PageOverview[];
    get optionalContentConfigPromise(): Promise<OptionalContentConfig | undefined>;
    /**
     * @param promise A promise that is
     *   resolved with an {@link OptionalContentConfig} instance.
     */
    set optionalContentConfigPromise(promise: Promise<OptionalContentConfig | undefined>);
    /**
     * @return One of the values in {ScrollMode}.
     */
    get scrollMode(): ScrollMode;
    /**
     * @param mode The direction in which the document pages should be
     *   laid out within the scrolling container.
     *   The constants from {ScrollMode} should be used.
     */
    set scrollMode(mode: ScrollMode);
    _updateScrollMode(pageNumber?: number): void;
    /**
     * @return One of the values in {SpreadMode}.
     */
    get spreadMode(): SpreadMode;
    /**
     * @param mode - Group the pages in spreads, starting with odd- or
     *   even-number pages (unless `SpreadMode.NONE` is used).
     *   The constants from {SpreadMode} should be used.
     */
    set spreadMode(mode: SpreadMode);
    _updateSpreadMode(pageNumber?: number): void;
    /**
     * @private
     */
    _getPageAdvance(currentPageNumber: number, previous?: boolean): number;
    /**
     * Go to the next page, taking scroll/spread-modes into account.
     * @return {boolean} Whether navigation occured.
     */
    nextPage(): boolean;
    /**
     * Go to the previous page, taking scroll/spread-modes into account.
     * @return Whether navigation occured.
     */
    previousPage(): boolean;
    /**
     * Increase the current zoom level one, or more, times.
     * @param steps Defaults to zooming once.
     */
    increaseScale(steps?: number): void;
    /**
     * Decrease the current zoom level one, or more, times.
     * @param steps Defaults to zooming once.
     */
    decreaseScale(steps?: number): void;
}
export {};
//# sourceMappingURL=base_viewer.d.ts.map