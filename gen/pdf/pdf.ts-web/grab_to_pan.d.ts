interface GrabToPanCtorParms {
    element: HTMLDivElement;
    /**
     * See `ignoreTarget(node)`
     */
    ignoreTarget?: (node: Element) => boolean;
    /**
     * Called
     * when grab-to-pan is (de)activated. The first argument is a boolean that
     * shows whether grab-to-pan is activated.
     */
    onActiveChanged?: (_: boolean) => unknown;
}
/**
 *
 * @param options.element {Element}
 * @param options.ignoreTarget {function} optional.
 * @param options.onActiveChanged {function(boolean)} optional.
 *
 *
 */
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
    constructor(options: GrabToPanCtorParms);
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
     * @param node The target of the event
     * @return Whether to not react to the click event.
     */
    ignoreTarget: (node: Element) => boolean;
}
export {};
//# sourceMappingURL=grab_to_pan.d.ts.map