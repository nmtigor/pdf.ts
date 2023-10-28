/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2023
 */
export class Toolbar {
    #buttons;
    #eventBus;
    /**
     * @param _l10n Localization service.
     * @param nimbusData Nimbus configuration.
     * @param externalServices Interface for external services.
     */
    constructor(options, eventBus, _l10n, nimbusData) {
        this.#eventBus = eventBus;
        const buttons = [
            {
                element: options.download,
                eventName: "download",
                nimbusName: "download-button",
            },
            {
                element: options.openInApp,
                eventName: "openinexternalapp",
                nimbusName: "open-in-app-button",
            },
        ];
        if (nimbusData) {
            this.#buttons = [];
            for (const button of buttons) {
                if (nimbusData[button.nimbusName]) {
                    this.#buttons.push(button);
                }
                else {
                    button.element.remove();
                }
            }
            if (this.#buttons.length > 0) {
                options.container.classList.add("show");
            }
            else {
                options.container.remove();
                options.mainContainer.classList.add("noToolbar");
            }
        }
        else {
            options.container.classList.add("show");
            this.#buttons = buttons;
        }
        // Bind the event listeners for click and various other actions.
        this.#bindListeners(options);
    }
    setPageNumber(pageNumber, pageLabel) { }
    setPagesCount(pagesCount, hasPageLabels) { }
    setPageScale(pageScaleValue, pageScale) { }
    reset() { }
    #bindListeners(options) {
        // The buttons within the toolbar.
        for (const { element, eventName, eventDetails } of this.#buttons) {
            element.on("click", (evt) => {
                if (eventName !== null) {
                    this.#eventBus.dispatch(eventName, { source: this, ...eventDetails });
                    this.#eventBus.dispatch("reporttelemetry", {
                        source: this,
                        details: {
                            type: "gv-buttons",
                            data: { id: `${element.id}_tapped` },
                        },
                    });
                }
            });
        }
    }
    updateLoadingIndicatorState(loading = false) { }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=toolbar-geckoview.js.map