import { type matrix_t } from "../shared/util.js";
import { type TextContent } from "./api.js";
import { PageViewport } from "./display_utils.js";
/**
 * Text layer render parameters.
 */
interface _TextLayerRenderP {
    /**
     * Text content to
     * render (the object is returned by the page's `getTextContent` method).
     */
    textContent?: TextContent | undefined;
    /**
     * Text content stream to
     * render (the stream is returned by the page's `streamTextContent` method).
     */
    textContentStream?: ReadableStream | undefined;
    /**
     * The DOM node that will contain the text runs.
     */
    container: DocumentFragment | HTMLElement;
    /**
     * The target viewport to properly layout the text runs.
     */
    viewport: PageViewport;
    /**
     * HTML elements that correspond to
     * the text items of the textContent input.
     * This is output and shall initially be set to an empty array.
     */
    textDivs?: HTMLSpanElement[];
    /**
     * Strings that correspond to
     * the `str` property of the text items of the textContent input.
     * This is output and shall initially be set to an empty array.
     */
    textContentItemsStr?: string[];
    /**
     * Delay in milliseconds before rendering of the text runs occurs.
     */
    timeout?: number;
    /**
     * Whether to turn on the text selection enhancement.
     */
    enhanceTextSelection?: boolean;
}
interface TextDivProps {
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
}
declare namespace Ns_renderTextLayer {
    interface _TLRTCtorP {
        textContent?: TextContent | undefined;
        textContentStream?: ReadableStream | undefined;
        container: DocumentFragment | HTMLElement;
        viewport: PageViewport;
        textDivs?: HTMLSpanElement[] | undefined;
        textContentItemsStr?: string[] | undefined;
    }
    interface TLRTBound {
        left: number;
        top: number;
        right: number;
        bottom: number;
        div: HTMLSpanElement;
        size: [number, number];
        m?: matrix_t | undefined;
    }
    /**
     * Text layer rendering task.
     */
    export class TextLayerRenderTask {
        #private;
        _textContent?: TextContent | undefined;
        _textContentStream?: ReadableStream | undefined;
        _container: DocumentFragment | HTMLElement;
        _document: Document;
        _viewport: PageViewport;
        _textDivs: HTMLSpanElement[];
        _textContentItemsStr: string[];
        _fontInspectorEnabled: boolean;
        _devicePixelRatio: number;
        _reader?: ReadableStreamDefaultReader | undefined;
        _layoutTextLastFontSize: number | undefined;
        _layoutTextLastFontFamily: string | null;
        _layoutTextCtx: CanvasRenderingContext2D | null;
        _textDivProperties: WeakMap<HTMLSpanElement, TextDivProps> | undefined;
        _renderingDone: boolean;
        _canceled: boolean;
        _capability: import("../../../lib/promisecap.js").PromiseCap<void>;
        _bounds: TLRTBound[] | undefined;
        constructor({ textContent, textContentStream, container, viewport, textDivs, textContentItemsStr, }: _TLRTCtorP);
        /**
         * Promise for textLayer rendering task completion.
         */
        get promise(): Promise<void>;
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
        _render(timeout?: number): void;
    }
    export function renderTextLayer(renderParameters: _TextLayerRenderP): TextLayerRenderTask;
    export {};
}
export import TextLayerRenderTask = Ns_renderTextLayer.TextLayerRenderTask;
export import renderTextLayer = Ns_renderTextLayer.renderTextLayer;
export {};
//# sourceMappingURL=text_layer.d.ts.map