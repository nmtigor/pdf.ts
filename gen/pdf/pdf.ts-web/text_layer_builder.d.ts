import { TextDivProps } from "../pdf.ts-src/display/text_layer.js";
import { PageViewport, type TextContent, TextLayerRenderTask } from "../pdf.ts-src/pdf.js";
import { TextAccessibilityManager } from "./text_accessibility.js";
import { TextHighlighter } from "./text_highlighter.js";
interface TextLayerBuilderOptions {
    /**
     * Optional object that will handle
     * highlighting text from the find controller.
     */
    highlighter: TextHighlighter | undefined;
    accessibilityManager: TextAccessibilityManager | undefined;
    /**
     * Allows to use an OffscreenCanvas if needed.
     */
    isOffscreenCanvasSupported?: boolean;
}
/**
 * The text layer builder provides text selection functionality for the PDF.
 * It does this by creating overlay divs over the PDF's text. These divs
 * contain text that matches the PDF text they are overlaying.
 */
export declare class TextLayerBuilder {
    #private;
    textContentItemsStr: string[];
    renderingDone: boolean;
    textDivs: HTMLDivElement[];
    get numTextDivs(): number;
    textDivProperties: WeakMap<HTMLElement, TextDivProps>;
    textLayerRenderTask?: TextLayerRenderTask | undefined;
    highlighter: TextHighlighter | undefined;
    accessibilityManager: TextAccessibilityManager | undefined;
    isOffscreenCanvasSupported: boolean | undefined;
    div: HTMLDivElement;
    constructor({ highlighter, accessibilityManager, isOffscreenCanvasSupported, }: TextLayerBuilderOptions);
    /**
     * Renders the text layer.
     */
    render(viewport: PageViewport): Promise<void>;
    hide(): void;
    show(): void;
    /**
     * Cancel rendering of the text layer.
     */
    cancel(): void;
    setTextContentSource(source: ReadableStream | TextContent): void;
}
export {};
//# sourceMappingURL=text_layer_builder.d.ts.map