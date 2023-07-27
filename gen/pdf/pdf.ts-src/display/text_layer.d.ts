import type { C2D, OC2D } from "../../../lib/alias.js";
import { PromiseCap } from "../../../lib/util/PromiseCap.js";
import type { TextContent } from "./api.js";
import { PageViewport } from "./display_utils.js";
/**
 * Text layer render parameters.
 */
type TextLayerRenderP_ = {
    /**
     * Text content to
     * render, i.e. the value returned by the page's `streamTextContent` or
     * `getTextContent` method.
     */
    textContentSource: ReadableStream<TextContent> | TextContent;
    /**
     * The DOM node that will contain the text runs.
     */
    container: HTMLElement;
    /**
     * The target viewport to properly layout the text runs.
     */
    viewport: PageViewport;
    /**
     * HTML elements that correspond to
     * the text items of the textContent input.
     * This is output and shall initially be set to an empty array.
     */
    textDivs?: HTMLElement[];
    /**
     * Some properties
     * weakly mapped to the HTML elements used to render the text.
     */
    textDivProperties?: WeakMap<HTMLElement, TextDivProps>;
    /**
     * Strings that correspond to
     * the `str` property of the text items of the textContent input.
     * This is output and shall initially be set to an empty array.
     */
    textContentItemsStr?: string[];
    /**
     * true if we can use
     * OffscreenCanvas to measure string widths.
     */
    isOffscreenCanvasSupported?: boolean | undefined;
};
type TextLayerUpdateP_ = {
    /**
     * The DOM node that will contain the text runs.
     */
    container: HTMLDivElement;
    /**
     * The target viewport to properly layout the text runs.
     */
    viewport: PageViewport;
    /**
     * HTML elements that correspond to
     * the text items of the textContent input.
     * This is output and shall initially be set to an empty array.
     */
    textDivs?: HTMLElement[];
    /**
     * Some properties
     * weakly mapped to the HTML elements used to render the text.
     */
    textDivProperties: WeakMap<HTMLElement, TextDivProps>;
    /**
     * true if we can use
     * OffscreenCanvas to measure string widths.
     */
    isOffscreenCanvasSupported?: boolean | undefined;
    /**
     * true if the text layer must be rotated.
     */
    mustRotate?: boolean;
    /**
     * true if the text layer contents must be
     */
    mustRescale?: boolean;
};
export type TextDivProps = {
    angle: number;
    canvasWidth: number;
    fontSize: number;
    hasText: boolean;
    hasEOL: boolean;
    originalTransform?: string | undefined;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    paddingTop?: number;
    scale?: number;
};
type LayoutTextP_ = {
    prevFontSize?: unknown;
    prevFontFamily?: unknown;
    div?: HTMLElement;
    scale: number;
    properties?: TextDivProps | undefined;
    ctx: OC2D | C2D;
};
/**
 * Text layer rendering task.
 */
export declare class TextLayerRenderTask {
    #private;
    _textContentSource: TextContent | ReadableStream<TextContent>;
    _isReadableStream: boolean;
    _rootContainer: HTMLElement;
    _container: HTMLElement;
    _textDivs: HTMLSpanElement[];
    _textContentItemsStr: string[];
    _isOffscreenCanvasSupported: boolean | undefined;
    _fontInspectorEnabled: boolean;
    _reader?: ReadableStreamDefaultReader<TextContent> | undefined;
    _textDivProperties: WeakMap<HTMLSpanElement, TextDivProps>;
    _canceled: boolean;
    _capability: PromiseCap<void>;
    /**
     * Promise for textLayer rendering task completion.
     */
    get promise(): Promise<void>;
    _layoutTextParams: LayoutTextP_;
    _transform: [number, number, number, number, number, number];
    _pageWidth: number;
    _pageHeight: number;
    constructor({ textContentSource, container, viewport, textDivs, textDivProperties, textContentItemsStr, isOffscreenCanvasSupported, }: TextLayerRenderP_);
    /**
     * Cancel rendering of the textLayer.
     */
    cancel(): void;
    /**
     * @private
     */
    _layoutText(textDiv: HTMLSpanElement): void;
    /**
     * @private
     */
    _render(): void;
}
export declare function renderTextLayer(params: TextLayerRenderP_): TextLayerRenderTask;
export declare function updateTextLayer({ container, viewport, textDivs, textDivProperties, isOffscreenCanvasSupported, mustRotate, mustRescale, }: TextLayerUpdateP_): void;
export {};
//# sourceMappingURL=text_layer.d.ts.map