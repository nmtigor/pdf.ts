/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/text_accessibility.ts
 * @license Apache-2.0
 ******************************************************************************/
/**
 * This class aims to provide some methods:
 *  - to reorder elements in the DOM with respect to the visual order;
 *  - to create a link, using aria-owns, between spans in the textLayer and
 *    annotations in the annotationLayer. The goal is to help to know
 *    where the annotations are in the text flow.
 */
export declare class TextAccessibilityManager {
    #private;
    setTextMapping(textDivs: (HTMLDivElement | HTMLSpanElement)[]): void;
    /**
     * Function called when the text layer has finished rendering.
     */
    enable(): void;
    disable(): void;
    /**
     * Remove an aria-owns id from a node in the text layer.
     */
    removePointerInTextLayer(element: HTMLElement): void;
    /**
     * Find the text node which is the nearest and add an aria-owns attribute
     * in order to correctly position this editor in the text flow.
     *
     * @return The id in the struct tree if any.
     */
    addPointerInTextLayer(element: HTMLElement, isRemovable: boolean): string | undefined;
    /**
     * Move a div in the DOM in order to respect the visual order.
     *
     * @return The id in the struct tree if any.
     */
    moveElementInDOM(container: HTMLDivElement, element: HTMLDivElement | undefined, contentElement: HTMLDivElement, isRemovable: boolean): string | undefined;
}
//# sourceMappingURL=text_accessibility.d.ts.map