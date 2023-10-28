/** @typedef {import("../src/display/display_utils").PageViewport} PageViewport */
/** @typedef {import("../src/display/optional_content_config").OptionalContentConfig} OptionalContentConfig */
/** @typedef {import("./event_utils").EventBus} EventBus */
/** @typedef {import("./interfaces").IL10n} IL10n */
/** @typedef {import("./interfaces").IRenderableView} IRenderableView */
/** @typedef {import("./pdf_rendering_queue").PDFRenderingQueue} PDFRenderingQueue */
import type { dot2d_t } from "../../lib/alias.js";
import type { MetadataEx, RenderTask } from "../pdf.ts-src/display/api.js";
import type { AnnotActions, AnnotationEditorUIManager, AnnotationStorage, FieldObject, OptionalContentConfig, PageViewport, PDFPageProxy, StatTimer } from "../pdf.ts-src/pdf.js";
import { AnnotationMode } from "../pdf.ts-src/pdf.js";
import { AnnotationEditorLayerBuilder } from "./annotation_editor_layer_builder.js";
import { AnnotationLayerBuilder } from "./annotation_layer_builder.js";
import type { EventBus, EventMap } from "./event_utils.js";
import type { IDownloadManager, IL10n, IPDFLinkService, IVisibleView } from "./interfaces.js";
import type { PDFFindController } from "./pdf_find_controller.js";
import type { PDFRenderingQueue } from "./pdf_rendering_queue.js";
import type { PageColors } from "./pdf_viewer.js";
import { StructTreeLayerBuilder } from "./struct_tree_layer_builder.js";
import { TextAccessibilityManager } from "./text_accessibility.js";
import { TextHighlighter } from "./text_highlighter.js";
import { TextLayerBuilder } from "./text_layer_builder.js";
import { OutputScale, RenderingStates, TextLayerMode } from "./ui_utils.js";
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
    /**
     * Path for image resources, mainly
     * for annotation icons. Include trailing slash.
     */
    imageResourcesPath?: string;
    /**
     * Allows to use an OffscreenCanvas if needed.
     */
    isOffscreenCanvasSupported?: boolean;
    /**
     * The maximum supported canvas size in
     * total pixels, i.e. width * height. Use `-1` for no limit, or `0` for
     * CSS-only zooming. The default value is 4096 * 4096 (16 mega-pixels).
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
    /**
     * The function that is used to lookup the necessary layer-properties.
     */
    layerProperties?: () => LayerPropsR_ | undefined;
}
type LayerPropsR_ = {
    annotationEditorUIManager?: AnnotationEditorUIManager | undefined;
    annotationStorage?: AnnotationStorage | undefined;
    downloadManager?: IDownloadManager | undefined;
    enableScripting: boolean;
    fieldObjectsPromise?: Promise<boolean | Record<string, FieldObject[]> | AnnotActions | MetadataEx | undefined> | undefined;
    findController?: PDFFindController | undefined;
    hasJSActionsPromise?: Promise<boolean> | undefined;
    linkService: IPDFLinkService;
};
interface CSSTransformP_ {
    target: HTMLCanvasElement | SVGElement;
    redrawAnnotationLayer?: boolean;
    redrawAnnotationEditorLayer?: boolean;
    redrawXfaLayer?: boolean;
    redrawTextLayer?: boolean;
    hideTextLayer?: boolean;
}
interface PDFPageViewUpdateP_ {
    /**
     * The new scale, if specified.
     */
    scale?: number;
    /**
     * The new rotation, if specified.
     */
    rotation?: number;
    /**
     * A promise that is resolved with an {@link OptionalContentConfig}
     * instance. The default value is `null`.
     */
    optionalContentConfigPromise?: Promise<OptionalContentConfig | undefined>;
    drawingDelay?: number;
}
type CancelRenderingP_ = {
    keepZoomLayer?: boolean;
    keepAnnotationLayer?: boolean;
    keepAnnotationEditorLayer?: boolean;
    keepXfaLayer?: boolean;
    keepTextLayer?: boolean;
    cancelExtraDelay?: number;
};
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
    imageResourcesPath: string;
    isOffscreenCanvasSupported: boolean;
    maxCanvasPixels: number;
    pageColors: PageColors | undefined;
    eventBus: EventBus;
    renderingQueue: PDFRenderingQueue | undefined;
    l10n: IL10n;
    renderTask: RenderTask | undefined;
    resume: (() => void) | undefined; /** @implement */
    _isStandalone: boolean | undefined;
    _container: HTMLDivElement | undefined;
    _annotationCanvasMap: Map<string, HTMLCanvasElement> | undefined;
    annotationLayer: AnnotationLayerBuilder | undefined;
    textLayer: TextLayerBuilder | undefined;
    zoomLayer: HTMLElement | undefined;
    xfaLayer: XfaLayerBuilder | undefined;
    structTreeLayer?: StructTreeLayerBuilder | undefined;
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
    get renderingState(): RenderingStates;
    set renderingState(state: RenderingStates);
    setPdfPage(pdfPage: PDFPageProxy): void;
    destroy(): void;
    get _textHighlighter(): TextHighlighter;
    reset({ keepZoomLayer, keepAnnotationLayer, keepAnnotationEditorLayer, keepXfaLayer, keepTextLayer, }?: {
        keepZoomLayer?: boolean | undefined;
        keepAnnotationLayer?: boolean | undefined;
        keepAnnotationEditorLayer?: boolean | undefined;
        keepXfaLayer?: boolean | undefined;
        keepTextLayer?: boolean | undefined;
    }): void;
    /**
     * Update e.g. the scale and/or rotation of the page.
     */
    update({ scale, rotation, optionalContentConfigPromise, drawingDelay, }: PDFPageViewUpdateP_): void;
    /**
     * PLEASE NOTE: Most likely you want to use the `this.reset()` method,
     *              rather than calling this one directly.
     */
    cancelRendering({ keepAnnotationLayer, keepAnnotationEditorLayer, keepXfaLayer, keepTextLayer, cancelExtraDelay, }?: CancelRenderingP_): void;
    cssTransform({ target, redrawAnnotationLayer, redrawAnnotationEditorLayer, redrawXfaLayer, redrawTextLayer, hideTextLayer, }: CSSTransformP_): void;
    getPagePoint(x: number, y: number): dot2d_t;
    /** @implement */
    draw(): Promise<void>;
    setPageLabel(label?: string): void;
    /**
     * For use by the `PDFThumbnailView.setImage`-method.
     * @ignore
     */
    get thumbnailCanvas(): HTMLCanvasElement | undefined;
}
export {};
//# sourceMappingURL=pdf_page_view.d.ts.map