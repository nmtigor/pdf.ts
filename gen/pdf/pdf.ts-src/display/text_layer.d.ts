import { matrix_t } from "../shared/util.js";
import { TextContent } from "./api.js";
import { PageViewport } from "./display_utils.js";
/**
 * Text layer render parameters.
 */
interface TextLayerRenderParms {
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
     * HTML element that will contain text runs.
     */
    container: DocumentFragment;
    /**
     * The target viewport to properly layout the text runs.
     */
    viewport: PageViewport;
    /**
     * HTML elements that are correspond
     * to the text items of the textContent input. This is output and shall be
     * initially be set to empty array.
     */
    textDivs?: HTMLSpanElement[];
    /**
     * Strings that correspond to
     * the `str` property of the text items of textContent input. This is output
     * and shall be initially be set to empty array.
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
    interface TLRTCtorParms {
        textContent?: TextContent | undefined;
        textContentStream?: ReadableStream | undefined;
        container: DocumentFragment;
        viewport: PageViewport;
        textDivs?: HTMLSpanElement[] | undefined;
        textContentItemsStr?: string[] | undefined;
        enhanceTextSelection?: boolean | undefined;
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
        _enhanceTextSelection: boolean;
        _fontInspectorEnabled: boolean;
        _reader?: ReadableStreamDefaultReader | undefined;
        _layoutTextLastFontSize: string | null;
        _layoutTextLastFontFamily: string | null;
        _layoutTextCtx: CanvasRenderingContext2D | null;
        _textDivProperties: WeakMap<HTMLSpanElement, TextDivProps> | undefined;
        _renderingDone: boolean;
        _canceled: boolean;
        _capability: import("../shared/util.js").PromiseCapability<void>;
        _bounds: TLRTBound[] | undefined;
        constructor({ textContent, textContentStream, container, viewport, textDivs, textContentItemsStr, enhanceTextSelection, }: TLRTCtorParms);
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
        expandTextDivs(expandDivs?: boolean): void;
    }
    export function renderTextLayer(renderParameters: TextLayerRenderParms): TextLayerRenderTask;
    export {};
}
export import TextLayerRenderTask = Ns_renderTextLayer.TextLayerRenderTask;
export import renderTextLayer = Ns_renderTextLayer.renderTextLayer;
export {};
//# sourceMappingURL=text_layer.d.ts.map