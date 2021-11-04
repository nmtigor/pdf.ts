interface Overlay {
    element: HTMLElement;
    container: HTMLElement;
    callerCloseMethod?: (() => void) | undefined;
    canForceClose: boolean;
}
export declare class OverlayManager {
    #private;
    _overlays: Record<string, Overlay>;
    _active: string | null;
    get active(): string | null;
    /**
     * @param name The name of the overlay that is registered.
     * @param element The overlay's DOM element.
     * @param callerCloseMethod The method that, if present, calls
     *  `OverlayManager.close` from the object registering the
     *  overlay. Access to this method is necessary in order to
     *  run cleanup code when e.g. the overlay is force closed.
     *  The default is `null`.
     * @param canForceClose Indicates if opening the overlay closes
     *  an active overlay. The default is `false`.
     * @return A promise that is resolved when the overlay has been registered.
     */
    register(name: string, element: HTMLElement, callerCloseMethod?: () => void, canForceClose?: boolean): Promise<void>;
    /**
     * @param name - The name of the overlay that is unregistered.
     * @return A promise that is resolved when the overlay has been unregistered.
     */
    unregister(name: string): Promise<void>;
    /**
     * @param name - The name of the overlay that should be opened.
     * @return A promise that is resolved when the overlay has been opened.
     */
    open(name: string): Promise<void>;
    /**
     * @param name The name of the overlay that should be closed.
     * @return A promise that is resolved when the overlay has been closed.
     */
    close(name: string): Promise<void>;
}
export {};
//# sourceMappingURL=overlay_manager.d.ts.map