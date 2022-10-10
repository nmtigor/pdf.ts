import { PasswordResponses } from "../pdf.ts-src/pdf.js";
import { type IL10n } from "./interfaces.js";
import { OverlayManager } from "./overlay_manager.js";
import { type ViewerConfiguration } from "./viewer.js";
export declare class PasswordPrompt {
    #private;
    dialog: HTMLDialogElement;
    label: HTMLParagraphElement;
    input: HTMLInputElement;
    submitButton: HTMLButtonElement;
    cancelButton: HTMLButtonElement;
    overlayManager: OverlayManager;
    l10n: IL10n;
    _isViewerEmbedded: boolean;
    /**
     * @param overlayManager Manager for the viewer overlays.
     * @param l10n Localization service.
     * @param isViewerEmbedded If the viewer is embedded, in e.g.
     *   an <iframe> or an <object>. The default value is `false`.
     */
    constructor(options: ViewerConfiguration["passwordOverlay"], overlayManager: OverlayManager, l10n: IL10n, isViewerEmbedded?: boolean);
    open(): Promise<void>;
    close: () => Promise<void>;
    setUpdateCallback(updateCallback: (password: string | Error) => void, reason: PasswordResponses): Promise<void>;
}
//# sourceMappingURL=password_prompt.d.ts.map