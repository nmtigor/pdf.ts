export declare class OverlayManager {
    #private;
    get active(): HTMLDialogElement | undefined;
    _dialogPolyfillCSS?: boolean;
    /**
     * @param dialog The overlay's DOM element.
     * @param canForceClose Indicates if opening the overlay closes
     *  an active overlay. The default is `false`.
     * @return A promise that is resolved when the overlay has been registered.
     */
    register(dialog: HTMLDialogElement, canForceClose?: boolean): Promise<void>;
    /**
     * @param dialog The overlay's DOM element.
     * @return A promise that is resolved when the overlay has been opened.
     */
    open(dialog: HTMLDialogElement): Promise<void>;
    /**
     * @param dialog The overlay's DOM element.
     * @return A promise that is resolved when the overlay has been closed.
     */
    close(dialog?: HTMLDialogElement): Promise<void>;
}
//# sourceMappingURL=overlay_manager.d.ts.map