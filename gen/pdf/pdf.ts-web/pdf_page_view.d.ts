import { AnnotationStorage } from "../pdf.ts-src/display/annotation_storage.js";
import { PDFPageProxy } from "../pdf.ts-src/display/api.js";
import { PageViewport, StatTimer } from "../pdf.ts-src/display/display_utils.js";
import { OptionalContentConfig } from "../pdf.ts-src/display/optional_content_config.js";
import { AnnotationMode, type point_t } from "../pdf.ts-src/shared/util.js";
import { type ErrorMoreInfo } from "./app.js";
import { type IL10n, type IPDFAnnotationLayerFactory, type IPDFStructTreeLayerFactory, type IPDFTextLayerFactory, type IPDFXfaLayerFactory, type IVisibleView } from "./interfaces.js";
import { PDFRenderingQueue, RenderingStates } from "./pdf_rendering_queue.js";
import { AnnotationLayerBuilder } from "./annotation_layer_builder.js";
import { TextLayerBuilder } from "./text_layer_builder.js";
import { EventBus, type EventMap, type OutputScale, RendererType, TextLayerMode } from "./ui_utils.js";
import { StructTreeLayerBuilder } from "./struct_tree_layer_builder.js";
import { XfaLayerBuilder } from "./xfa_layer_builder.js";
import { BaseViewer } from "./base_viewer.js";
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
    scale: number;
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
     * selection and searching is created, and if the improved text selection
     * behaviour is enabled. The constants from {TextLayerMode} should be used.
     * The default value is `TextLayerMode.ENABLE`.
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
    xfaLayerFactory?: IPDFXfaLayerFactory | undefined;
    structTreeLayerFactory: IPDFStructTreeLayerFactory;
    textHighlighterFactory: BaseViewer;
    /**
     * Path for image resources, mainly
     * for annotation icons. Include trailing slash.
     */
    imageResourcesPath?: string;
    /**
     * 'canvas' or 'svg'. The default is 'canvas'.
     */
    renderer?: RendererType;
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
     * Localization service.
     */
    l10n: IL10n;
}
interface PaintTask {
    promise: Promise<void>;
    onRenderContinue: ((cont: () => void) => void) | undefined;
    cancel(): void;
}
interface CssTransformParms {
    target: HTMLCanvasElement | SVGElement;
    redrawAnnotationLayer?: boolean;
    redrawXfaLayer?: boolean;
}
interface PDFPageViewUpdateParms {
    scale?: number;
    rotation?: number;
    optionalContentConfigPromise?: Promise<OptionalContentConfig | undefined>;
}
export declare class PDFPageView implements IVisibleView {
    #private;
    readonly id: number; /** @implements */
    readonly renderingId: string; /** @implements */
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
    _annotationMode: AnnotationMode;
    imageResourcesPath: string;
    useOnlyCssZoom: boolean;
    maxCanvasPixels: number;
    eventBus: EventBus;
    renderingQueue: PDFRenderingQueue | undefined;
    textLayerFactory: IPDFTextLayerFactory | undefined;
    annotationLayerFactory: IPDFAnnotationLayerFactory | undefined;
    xfaLayerFactory: IPDFXfaLayerFactory | undefined;
    textHighlighter: import("./text_highlighter.js").TextHighlighter;
    structTreeLayerFactory: IPDFStructTreeLayerFactory;
    renderer: RendererType;
    l10n: IL10n;
    paintTask: PaintTask | undefined;
    paintedViewportMap: WeakMap<SVGElement | HTMLCanvasElement, PageViewport>;
    renderingState: RenderingStates;
    resume?: (() => void) | undefined; /** @implements */
    _renderError?: ErrorMoreInfo | undefined;
    _isStandalone: boolean;
    annotationLayer: AnnotationLayerBuilder | undefined;
    textLayer: TextLayerBuilder | undefined;
    zoomLayer: HTMLElement | undefined;
    xfaLayer: XfaLayerBuilder | undefined;
    structTreeLayer?: StructTreeLayerBuilder;
    div: HTMLDivElement; /** @implements */
    stats?: StatTimer;
    canvas?: HTMLCanvasElement;
    svg?: SVGElement;
    loadingIconDiv?: HTMLDivElement;
    outputScale?: OutputScale;
    _onTextLayerRendered: ((event: EventMap["textlayerrendered"]) => void) | undefined;
    constructor(options: PDFPageViewOptions);
    setPdfPage(pdfPage: PDFPageProxy): void;
    destroy(): void;
    _buildXfaTextContentItems(textDivs: Text[]): Promise<void>;
    reset({ keepZoomLayer, keepAnnotationLayer, keepXfaLayer, }?: {
        keepZoomLayer?: boolean | undefined;
        keepAnnotationLayer?: boolean | undefined;
        keepXfaLayer?: boolean | undefined;
    }): void;
    update({ scale, rotation, optionalContentConfigPromise }: PDFPageViewUpdateParms): void;
    /**
     * PLEASE NOTE: Most likely you want to use the `this.reset()` method,
     *              rather than calling this one directly.
     */
    cancelRendering({ keepAnnotationLayer, keepXfaLayer }?: {
        keepAnnotationLayer?: boolean | undefined;
        keepXfaLayer?: boolean | undefined;
    }): void;
    cssTransform({ target, redrawAnnotationLayer, redrawXfaLayer, }: CssTransformParms): void;
    getPagePoint(x: number, y: number): point_t;
    draw(): Promise<void>;
    paintOnCanvas(canvasWrapper: HTMLDivElement): PaintTask;
    paintOnSvg(wrapper: HTMLDivElement): PaintTask;
    setPageLabel(label?: string): void;
}
export {};
//# sourceMappingURL=pdf_page_view.d.ts.map