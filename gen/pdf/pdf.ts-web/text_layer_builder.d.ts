import { PageViewport, type TextContent, TextLayerRenderTask } from "../pdf.ts-src/pdf.js";
import { EventBus } from "./event_utils.js";
import { TextAccessibilityManager } from "./text_accessibility.js";
import { TextHighlighter } from "./text_highlighter.js";
interface TextLayerBuilderOptions {
    /**
     * The text layer container.
     */
    textLayerDiv: HTMLDivElement;
    /**
     * The application event bus.
     */
    eventBus: EventBus;
    /**
     * The page index.
     */
    pageIndex: number;
    /**
     * The viewport of the text layer.
     */
    viewport: PageViewport;
    /**
     * Optional object that will handle
     * highlighting text from the find controller.
     */
    highlighter: TextHighlighter | undefined;
    accessibilityManager: TextAccessibilityManager | undefined;
}
interface TLBMBound {
    divIdx: number;
    offset?: number;
}
interface TextLayerBuilderMatches {
    begin: TLBMBound;
    end: TLBMBound;
}
/**
 * The text layer builder provides text selection functionality for the PDF.
 * It does this by creating overlay divs over the PDF's text. These divs
 * contain text that matches the PDF text they are overlaying.
 */
export declare class TextLayerBuilder {
    #private;
    textLayerDiv: HTMLDivElement;
    eventBus: EventBus;
    textContent?: TextContent | undefined;
    textContentItemsStr: string[];
    textContentStream?: ReadableStream;
    renderingDone: boolean;
    pageNumber: number;
    matches: TextLayerBuilderMatches[];
    viewport: PageViewport;
    textDivs: HTMLDivElement[];
    textLayerRenderTask?: TextLayerRenderTask | undefined;
    highlighter: TextHighlighter | undefined;
    accessibilityManager: TextAccessibilityManager | undefined;
    constructor({ textLayerDiv, eventBus, pageIndex, viewport, highlighter, accessibilityManager, }: TextLayerBuilderOptions);
    /**
     * Renders the text layer.
     *
     * @param timeout Wait for a specified amount of milliseconds before rendering.
     */
    render(timeout?: number): void;
    /**
     * Cancel rendering of the text layer.
     */
    cancel(): void;
    setTextContentStream(readableStream: ReadableStream): void;
    setTextContent(textContent?: TextContent): void;
}
export {};
//# sourceMappingURL=text_layer_builder.d.ts.map