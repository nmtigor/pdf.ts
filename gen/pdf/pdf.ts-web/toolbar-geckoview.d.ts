import type { EventBus } from "./event_utils.js";
import type { NimbusExperimentData } from "./firefoxcom.js";
type ToolbarOptions = {
    /**
     * Main container.
     */
    mainContainer: HTMLDivElement;
    /**
     * Container for the toolbar.
     */
    container: HTMLDivElement;
    /**
     * Button to download the document.
     */
    download: HTMLButtonElement;
    openInApp: HTMLElement;
};
export declare class Toolbar {
    #private;
    /**
     * @param nimbusData Nimbus configuration.
     */
    constructor(options: ToolbarOptions, eventBus: EventBus, nimbusData: NimbusExperimentData | undefined);
    setPageNumber(pageNumber: number, pageLabel?: string): void;
    setPagesCount(pagesCount: number, hasPageLabels: boolean): void;
    setPageScale(pageScaleValue: string | number | undefined, pageScale: number): void;
    reset(): void;
    updateLoadingIndicatorState(loading?: boolean): void;
}
export {};
//# sourceMappingURL=toolbar-geckoview.d.ts.map