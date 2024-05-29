/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/grab_to_pan.ts
 * @license Apache-2.0
 ******************************************************************************/
type GrabToPanCtorP_ = {
    element: HTMLDivElement;
};
export declare class GrabToPan {
    #private;
    element: HTMLDivElement;
    document: Document;
    onActiveChanged?: ((_: boolean) => unknown) | undefined;
    overlay: HTMLDivElement;
    active?: boolean;
    scrollLeftStart?: number;
    scrollTopStart?: number;
    clientXStart?: number;
    clientYStart?: number;
    /**
     * Construct a GrabToPan instance for a given HTML element.
     */
    constructor({ element }: GrabToPanCtorP_);
    /**
     * Bind a mousedown event to the element to enable grab-detection.
     */
    activate: () => void;
    /**
     * Removes all events. Any pending pan session is immediately stopped.
     */
    deactivate: () => void;
    toggle: () => void;
    /**
     * Whether to not pan if the target element is clicked.
     * Override this method to change the default behaviour.
     *
     * @param node The target of the event.
     * @return Whether to not react to the click event.
     */
    ignoreTarget: (node: Element) => boolean;
}
export {};
//# sourceMappingURL=grab_to_pan.d.ts.map