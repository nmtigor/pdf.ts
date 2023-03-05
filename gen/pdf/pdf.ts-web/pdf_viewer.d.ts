import { type point_t } from "../../lib/alias.js";
import { AnnotationEditorType, AnnotationMode, type ExplicitDest, OptionalContentConfig, PDFDocumentProxy, PDFPageProxy } from "../pdf.ts-src/pdf.js";
import { EventBus, EventMap } from "./event_utils.js";
import { IDownloadManager, type IL10n, type IPDFLinkService } from "./interfaces.js";
import { PDFFindController } from "./pdf_find_controller.js";
import { PDFPageView } from "./pdf_page_view.js";
import { PDFRenderingQueue } from "./pdf_rendering_queue.js";
import { PDFScriptingManager } from "./pdf_scripting_manager.js";
import { PresentationModeState, RendererType, ScrollMode, SpreadMode, TextLayerMode, type VisibleElements } from "./ui_utils.js";
export declare const enum PagesCountLimit {
    FORCE_SCROLL_MODE_PAGE = 15000,
    FORCE_LAZY_PAGE_INIT = 7500,
    PAUSE_EAGER_PAGE_INIT = 250
}
export type PageColors = {
    background: string;
    foreground: string;
};
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
    downloadManager?: IDownloadManager;
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
     * Enables the creation and editing
     * of new Annotations. The constants from {@link AnnotationEditorType} should
     * be used. The default value is `AnnotationEditorType.DISABLE`.
     */
    annotationEditorMode?: AnnotationEditorType;
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
    renderer?: RendererType | undefined;
    /**
     * Enables CSS only zooming. The default value is `false`.
     */
    useOnlyCssZoom: boolean | undefined;
    /**
     * Allows to use an OffscreenCanvas if needed.
     */
    isOffscreenCanvasSupported?: boolean;
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
    /**
     * Enables PDF document permissions,
     * when they exist. The default value is `false`.
     */
    enablePermissions?: boolean;
    /**
     * Overwrites background and foreground colors
     * with user defined ones in order to improve readability in high contrast
     * mode.
     */
    pageColors: PageColors | undefined;
}
export declare class PDFPageViewBuffer {
    #private;
    has(view: PDFPageView): boolean;
    [Symbol.iterator](): IterableIterator<PDFPageView>;
    constructor(size: number);
    push(view: PDFPageView): void;
    /**
     * After calling resize, the size of the buffer will be `newSize`.
     * The optional parameter `idsToKeep` is, if present, a Set of page-ids to
     * push to the back of the buffer, delaying their destruction. The size of
     * `idsToKeep` has no impact on the final size of the buffer; if `idsToKeep`
     * is larger than `newSize`, some of those pages will be destroyed anyway.
     */
    resize(newSize: number, idsToKeep?: Set<number>): void;
}
interface _ScrollPageIntoViewP {
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
export interface PageOverview {
    width: number;
    height: number;
    rotation: number;
}
type SetScaleOptions_ = {
    noScroll?: boolean;
    preset?: boolean;
    drawingDelay?: number;
    steps?: number | undefined;
    scaleFactor?: number | undefined;
};
/**
 * Simple viewer control to display PDF content/pages.
 */
export declare class PDFViewer {
    #private;
    container: HTMLDivElement;
    viewer: HTMLDivElement;
    eventBus: EventBus;
    linkService: IPDFLinkService;
    downloadManager: IDownloadManager | undefined;
    findController: PDFFindController | undefined;
    _scriptingManager: PDFScriptingManager | undefined;
    get enableScripting(): boolean;
    removePageBorders: boolean | undefined;
    textLayerMode: TextLayerMode;
    get renderForms(): boolean;
    imageResourcesPath: string;
    enablePrintAutoRotate: boolean;
    renderer: RendererType | undefined;
    useOnlyCssZoom: boolean;
    isOffscreenCanvasSupported: boolean;
    maxCanvasPixels: number | undefined;
    l10n: IL10n;
    pageColors: PageColors | undefined;
    defaultRenderingQueue: boolean;
    renderingQueue?: PDFRenderingQueue | undefined;
    scroll: {
        right: boolean;
        down: boolean;
        /**
         * 'canvas' or 'svg'. The default is 'canvas'.
         */
        lastX: number;
        lastY: number;
        _eventHandler: (evt: unknown) => void;
    };
    presentationModeState: PresentationModeState;
    _onBeforeDraw: ((evt: EventMap["pagerender"]) => void) | undefined;
    _onAfterDraw: ((evt: EventMap["pagerendered"]) => void) | undefined;
    _pages: PDFPageView[];
    get pagesCount(): number;
    getPageView(index: number): PDFPageView;
    protected _currentPageNumber: number;
    get currentPageNumber(): number;
    /**
     * @param val The page number.
     */
    set currentPageNumber(val: number);
    /**
     * In PDF unit.
     */
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
    _pagesRotation: number;
    get pagesRotation(): number;
    _optionalContentConfigPromise?: Promise<OptionalContentConfig | undefined> | undefined;
    get firstPagePromise(): Promise<PDFPageProxy> | null;
    get onePageRendered(): Promise<{
        timestamp: number;
    }> | null;
    get pagesPromise(): Promise<void> | undefined;
    _scrollMode: ScrollMode;
    /**
     * @return One of the values in {ScrollMode}.
     */
    get scrollMode(): ScrollMode;
    _previousScrollMode: ScrollMode;
    _spreadMode: SpreadMode;
    /**
     * @return One of the values in {SpreadMode}.
     */
    get spreadMode(): SpreadMode;
    pdfDocument?: PDFDocumentProxy | undefined;
    constructor(options: PDFViewerOptions);
    /**
     * @return True if all {PDFPageView} objects are initialized.
     */
    get pageViewsReady(): boolean;
    /**
     * @final
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
    _scrollUpdate(): void;
    _setScaleUpdatePages(newScale: number, newValue: number | string, { noScroll, preset, drawingDelay }: SetScaleOptions_): void;
    protected get _pageWidthScaleFactor(): 1 | 2;
    _setScale(value: string | number, options: SetScaleOptions_): void;
    /**
     * @param label The page label.
     * @return The page number corresponding to the page label,
     *   or `null` when no page labels exist and/or the input is invalid.
     */
    pageLabelToPageNumber(label: string): number | null;
    /**
     * Scrolls page into view.
     */
    scrollPageIntoView({ pageNumber, destArray, allowNegativeOffset, ignoreDestinationZoom, }: _ScrollPageIntoViewP): void;
    /** @final */
    update(): void;
    containsElement(element: Node | null): boolean;
    focus(): void;
    get _isContainerRtl(): boolean;
    get isInPresentationMode(): boolean;
    get isChangingPresentationMode(): boolean;
    get isHorizontalScrollbarEnabled(): boolean;
    get isVerticalScrollbarEnabled(): boolean;
    /** @final */
    protected getVisiblePages$(): VisibleElements;
    isPageVisible(pageNumber: number): boolean;
    isPageCached(pageNumber: number): boolean;
    cleanup(): void;
    protected _cancelRendering(): void;
    forceRendering(currentlyVisiblePages?: VisibleElements): boolean;
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
     * @param mode The direction in which the document pages should be
     *   laid out within the scrolling container.
     *   The constants from {ScrollMode} should be used.
     */
    set scrollMode(mode: ScrollMode);
    _updateScrollMode(pageNumber?: number): void;
    /**
     * @param mode Group the pages in spreads, starting with odd- or
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
     * @return Whether navigation occured.
     */
    nextPage(): boolean;
    /**
     * Go to the previous page, taking scroll/spread-modes into account.
     * @return Whether navigation occured.
     */
    previousPage(): boolean;
    /**
     * Increase the current zoom level one, or more, times.
     */
    increaseScale(options?: SetScaleOptions_ | undefined): void;
    /**
     * Decrease the current zoom level one, or more, times.
     */
    decreaseScale(options?: SetScaleOptions_ | undefined): void;
    get containerTopLeft(): point_t;
    get annotationEditorMode(): AnnotationEditorType;
    /**
     * @param AnnotationEditor mode (None, FreeText, Ink, ...)
     */
    set annotationEditorMode(mode: AnnotationEditorType);
    set annotationEditorParams({ type, value }: EventMap["switchannotationeditorparams"]);
    refresh(noUpdate?: boolean, updateArgs?: any): void;
}
export {};
//# sourceMappingURL=pdf_viewer.d.ts.map