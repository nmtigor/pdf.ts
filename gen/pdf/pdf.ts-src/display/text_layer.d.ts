/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/text_layer.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { TextContent } from "./api.js";
import type { PageViewport } from "./display_utils.js";
type TextLayerP_ = {
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
};
type TextLayerUpdateP_ = {
    /**
     * The target viewport to properly layout the text runs.
     */
    viewport: PageViewport;
    /**
     * Callback invoked before the textLayer is updated in the DOM.
     */
    onBefore?: () => void;
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
export declare class TextLayer {
    #private;
    pageHeight: number;
    pageWidth: number;
    /**
     * Strings that correspond to the `str` property of
     * the text items of the textContent input.
     * This is output and will initially be set to an empty array
     */
    get textContentItemsStr(): string[];
    /**
     * HTML elements that correspond to the text items
     * of the textContent input.
     * This is output and will initially be set to an empty array.
     */
    get textDivs(): (HTMLDivElement | HTMLSpanElement)[];
    constructor({ textContentSource, container, viewport }: TextLayerP_);
    /**
     * Render the textLayer.
     * @returns {Promise}
     */
    render(): Promise<void>;
    /**
     * Update a previously rendered textLayer, if necessary.
     */
    update({ viewport, onBefore }: TextLayerUpdateP_): void;
    /**
     * Cancel rendering of the textLayer.
     */
    cancel(): void;
    /**
     * Clean-up global textLayer data.
     * @returns {undefined}
     */
    static cleanup(): void;
}
export declare function renderTextLayer(): {
    promise: Promise<void>;
    textDivs: (HTMLDivElement | HTMLSpanElement)[];
    textContentItemsStr: string[];
} | undefined;
export declare function updateTextLayer(): void;
export {};
//# sourceMappingURL=text_layer.d.ts.map