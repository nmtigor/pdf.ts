/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */
/*81---------------------------------------------------------------------------*/
export class PasswordPrompt {
    overlayName;
    container;
    label;
    input;
    submitButton;
    cancelButton;
    overlayManager;
    l10n;
    _isViewerEmbedded;
    updateCallback;
    reason;
    /**
     * @param overlayManager Manager for the viewer overlays.
     * @param l10n Localization service.
     * @param isViewerEmbedded If the viewer is embedded, in e.g.
     *   an <iframe> or an <object>. The default value is `false`.
     */
    constructor(options, overlayManager, l10n, isViewerEmbedded = false) {
        this.overlayName = options.overlayName;
        this.container = options.container;
        this.label = options.label;
        this.input = options.input;
        this.submitButton = options.submitButton;
        this.cancelButton = options.cancelButton;
        this.overlayManager = overlayManager;
        this.l10n = l10n;
        this._isViewerEmbedded = isViewerEmbedded;
        // this.updateCallback = null;
        // this.reason = null;
        // Attach the event listeners.
        this.submitButton.addEventListener("click", this.verify.bind(this));
        this.cancelButton.addEventListener("click", this.close.bind(this));
        this.input.addEventListener("keydown", e => {
            if (e.keyCode === /* Enter = */ 13) {
                this.verify();
            }
        });
        this.overlayManager.register(this.overlayName, this.container, this.close.bind(this), true);
    }
    async open() {
        await this.overlayManager.open(this.overlayName);
        const passwordIncorrect = this.reason === 2 /* INCORRECT_PASSWORD */;
        if (!this._isViewerEmbedded || passwordIncorrect) {
            this.input.focus();
        }
        this.label.textContent = await this.l10n.get(`password_${passwordIncorrect ? "invalid" : "label"}`);
    }
    close() {
        this.overlayManager.close(this.overlayName).then(() => {
            this.input.value = "";
        });
    }
    verify() {
        const password = this.input.value;
        if (password?.length > 0) {
            this.close();
            this.updateCallback(password);
        }
    }
    setUpdateCallback(updateCallback, reason) {
        this.updateCallback = updateCallback;
        this.reason = reason;
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=password_prompt.js.map