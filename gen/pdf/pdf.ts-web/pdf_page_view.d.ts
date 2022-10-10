import { AnnotationMode, AnnotationStorage, OptionalContentConfig, PageViewport, PDFPageProxy, type point_t, StatTimer } from "../pdf.ts-src/pdf.js";
import { AnnotationEditorLayerBuilder } from "./annotation_editor_layer_builder.js";
import { AnnotationLayerBuilder } from "./annotation_layer_builder.js";
import { type ErrorMoreInfo } from "./app.js";
import { EventBus, EventMap } from "./event_utils.js";
import { type IL10n, IPDFAnnotationEditorLayerFactory, type IPDFAnnotationLayerFactory, type IPDFStructTreeLayerFactory, type IPDFTextLayerFactory, type IPDFXfaLayerFactory, type IVisibleView } from "./interfaces.js";
import { PDFRenderingQueue } from "./pdf_rendering_queue.js";
import { PDFViewer } from "./pdf_viewer.js";
import { PageColors } from "./pdf_viewer.js";
import { StructTreeLayerBuilder } from "./struct_tree_layer_builder.js";
import { TextAccessibilityManager } from "./text_accessibility.js";
import { TextLayerBuilder } from "./text_layer_builder.js";
import { OutputScale, RendererType, RenderingStates, TextLayerMode } from "./ui_utils.js";
import { XfaLayerBuilder } from "./xfa_layer_builder.js";
interface PDFPageViewOptions {
    /**
     * The viewer element.
     */
    container: HTMLDivElement | undefined;
    /**
     * The application event bus.
     */
    eventBus: EventBus;
    /**
     * The page unique ID (normally its number).
     */
    id: number;
    /**
     * The page scale display.
     */
    scale?: number;
    /**
     * The page viewport.
     */
    defaultViewport: PageViewport;
    /**
     * A promise that is resolved with an {@link OptionalContentConfig} instance.
     * The default value is `null`.
     */
    optionalContentConfigPromise?: Promise<OptionalContentConfig | undefined>;
    /**
     * The rendering queue object.
     */
    renderingQueue?: PDFRenderingQueue | undefined;
    textLayerFactory?: IPDFTextLayerFactory | undefined;
    /**
     * Controls if the text layer used for
     * selection and searching is created. The constants from {TextLayerMode}
     * should be used. The default value is `TextLayerMode.ENABLE`.
     */
    textLayerMode?: TextLayerMode;
    /**
     * Controls if the annotation layer is
     * created, and if interactive form elements or `AnnotationStorage`-data are
     * being rendered. The constants from {@link AnnotationMode} should be used;
     * see also {@link RenderParameters} and {@link GetOperatorListParameters}.
     * The default value is `AnnotationMode.ENABLE_FORMS`.
     */
    annotationMode?: AnnotationMode;
    annotationLayerFactory: IPDFAnnotationLayerFactory | undefined;
    annotationEditorLayerFactory: IPDFAnnotationEditorLayerFactory | undefined;
    xfaLayerFactory?: IPDFXfaLayerFactory | undefined;
    structTreeLayerFactory?: IPDFStructTreeLayerFactory;
    textHighlighterFactory?: PDFViewer;
    /**
     * Path for image resources, mainly
     * for annotation icons. Include trailing slash.
     */
    imageResourcesPath?: string;
    /**
     * 'canvas' or 'svg'. The default is 'canvas'.
     */
    renderer?: RendererType | undefined;
    /**
     * Enables CSS only zooming. The default value is `false`.
     */
    useOnlyCssZoom?: boolean;
    /**
     * The maximum supported canvas size in
     * total pixels, i.e. width * height. Use -1 for no limit. The default value
     * is 4096 * 4096 (16 mega-pixels).
     */
    maxCanvasPixels?: number | undefined;
    /**
     * Overwrites background and foreground colors
     * with user defined ones in order to improve readability in high contrast
     * mode.
     */
    pageColors?: PageColors | undefined;
    /**
     * Localization service.
     */
    l10n?: IL10n;
}
interface PaintTask {
    promise: Promise<void>;
    onRenderContinue: ((cont: () => void) => void) | undefined;
    cancel(): void;
    separateAnnots: boolean;
}
interface _CSSTransformP {
    target: HTMLCanvasElement | SVGElement;
    redrawAnnotationLayer?: boolean;
    redrawAnnotationEditorLayer?: boolean;
    redrawXfaLayer?: boolean;
}
interface _PDFPageViewUpdateP {
    scale?: number;
    rotation?: number;
    optionalContentConfigPromise?: Promise<OptionalContentConfig | undefined>;
}
export declare class PDFPageView implements IVisibleView {
    #private;
    /** @implement */
    readonly id: number;
    /** @implement */
    readonly renderingId: string;
    pdfPage?: PDFPageProxy;
    pageLabel?: string | undefined;
    rotation: number;
    scale: number;
    viewport: PageViewport;
    get width(): number;
    get height(): number;
    pdfPageRotate: number;
    _annotationStorage?: AnnotationStorage;
    _optionalContentConfigPromise: Promise<OptionalContentConfig | undefined> | undefined;
    hasRestrictedScaling: boolean;
    textLayerMode: TextLayerMode;
    imageResourcesPath: string;
    useOnlyCssZoom: boolean;
    maxCanvasPixels: number;
    pageColors: PageColors | undefined;
    eventBus: EventBus;
    renderingQueue: PDFRenderingQueue | undefined;
    textLayerFactory: IPDFTextLayerFactory | undefined;
    annotationLayerFactory: IPDFAnnotationLayerFactory | undefined;
    annotationEditorLayerFactory: IPDFAnnotationEditorLayerFactory | undefined;
    xfaLayerFactory: IPDFXfaLayerFactory | undefined;
    textHighlighter: import("./text_highlighter.js").TextHighlighter | undefined;
    structTreeLayerFactory: IPDFStructTreeLayerFactory | undefined;
    renderer: RendererType | undefined;
    l10n: IL10n;
    paintTask: PaintTask | undefined;
    paintedViewportMap: WeakMap<SVGElement | HTMLCanvasElement, PageViewport>;
    renderingState: RenderingStates;
    resume?: (() => void) | undefined; /** @implement */
    _renderError?: ErrorMoreInfo | undefined;
    _isStandalone: boolean | undefined;
    _annotationCanvasMap: Map<string, HTMLCanvasElement> | undefined;
    annotationLayer: AnnotationLayerBuilder | undefined;
    textLayer: TextLayerBuilder | undefined;
    zoomLayer: HTMLElement | undefined;
    xfaLayer: XfaLayerBuilder | undefined;
    structTreeLayer?: StructTreeLayerBuilder;
    div: HTMLDivElement; /** @implement */
    stats?: StatTimer;
    canvas?: HTMLCanvasElement;
    svg?: SVGElement;
    loadingIconDiv?: HTMLDivElement;
    outputScale?: OutputScale;
    _onTextLayerRendered: ((event: EventMap["textlayerrendered"]) => void) | undefined;
    annotationEditorLayer: AnnotationEditorLayerBuilder | undefined;
    _accessibilityManager: TextAccessibilityManager | undefined;
    constructor(options: PDFPageViewOptions);
    setPdfPage(pdfPage: PDFPageProxy): void;
    destroy(): void;
    /**
     * @private
     */
    _renderAnnotationEditorLayer(): Promise<void>;
    _buildXfaTextContentItems(textDivs: Text[]): Promise<void>;
    reset({ keepZoomLayer, keepAnnotationLayer, keepAnnotationEditorLayer, keepXfaLayer, }?: {
        keepZoomLayer?: boolean | undefined;
        keepAnnotationLayer?: boolean | undefined;
        keepAnnotationEditorLayer?: boolean | undefined;
        keepXfaLayer?: boolean | undefined;
    }): void;
    update({ scale, rotation, optionalContentConfigPromise }: _PDFPageViewUpdateP): void;
    /**
     * PLEASE NOTE: Most likely you want to use the `this.reset()` method,
     *              rather than calling this one directly.
     */
    cancelRendering({ keepAnnotationLayer, keepAnnotationEditorLayer, keepXfaLayer, }?: {
        keepAnnotationLayer?: boolean | undefined;
        keepAnnotationEditorLayer?: boolean | undefined;
        keepXfaLayer?: boolean | undefined;
    }): void;
    cssTransform({ target, redrawAnnotationLayer, redrawAnnotationEditorLayer, redrawXfaLayer, }: _CSSTransformP): void;
    getPagePoint(x: number, y: number): point_t;
    /**
     * @ignore
     */
    toggleLoadingIconSpinner(viewVisible?: boolean): void;
    draw(): Promise<void>;
    paintOnCanvas(canvasWrapper: HTMLDivElement): PaintTask;
    paintOnSvg(wrapper: HTMLDivElement): PaintTask;
    setPageLabel(label?: string): void;
    /**
     * For use by the `PDFThumbnailView.setImage`-method.
     * @ignore
     */
    get thumbnailCanvas(): HTMLCanvasElement | null | undefined;
}
export {};
//# sourceMappingURL=pdf_page_view.d.ts.map