/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/text_layer_builder.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { GetTextContentP, PageViewport, PDFPageProxy } from "../pdf.ts-src/pdf.js";
import type { TextAccessibilityManager } from "./text_accessibility.js";
import type { TextHighlighter } from "./text_highlighter.js";
interface TextLayerBuilderOptions {
    pdfPage: PDFPageProxy;
    /**
     * Optional object that will handle
     * highlighting text from the find controller.
     */
    highlighter: TextHighlighter | undefined;
    accessibilityManager: TextAccessibilityManager | undefined;
    onAppend?: (div: HTMLDivElement) => void;
    enablePermissions?: boolean;
}
/**
 * The text layer builder provides text selection functionality for the PDF.
 * It does this by creating overlay divs over the PDF's text. These divs
 * contain text that matches the PDF text they are overlaying.
 */
export declare class TextLayerBuilder {
    #private;
    pdfPage: PDFPageProxy;
    highlighter: TextHighlighter | undefined;
    accessibilityManager: TextAccessibilityManager | undefined;
    div: HTMLDivElement;
    constructor({ pdfPage, highlighter, accessibilityManager, enablePermissions, onAppend, }: TextLayerBuilderOptions);
    /**
     * Renders the text layer.
     */
    render(viewport: PageViewport, textContentParams?: GetTextContentP): Promise<void>;
    hide(): void;
    show(): void;
    /**
     * Cancel rendering of the text layer.
     */
    cancel(): void;
}
export {};
//# sourceMappingURL=text_layer_builder.d.ts.map