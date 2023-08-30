import type { EventBus } from "./event_utils.js";
import type { PDFViewer } from "./pdf_viewer.js";
interface PDFPresentationModeOptions {
    /**
     * The container for the viewer element.
     */
    container: HTMLDivElement;
    /**
     * The document viewer.
     */
    pdfViewer: PDFViewer;
    /**
     * The application event bus.
     */
    eventBus: EventBus;
}
interface TouchSwipeState {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}
export declare class PDFPresentationMode {
    #private;
    get active(): boolean;
    container: HTMLDivElement;
    pdfViewer: PDFViewer;
    eventBus: EventBus;
    contextMenuOpen: boolean;
    mouseScrollTimeStamp: number;
    mouseScrollDelta: number;
    touchSwipeState?: TouchSwipeState | undefined;
    switchInProgress?: number;
    controlsTimeout?: number;
    constructor({ container, pdfViewer, eventBus, }: PDFPresentationModeOptions);
    /**
     * Request the browser to enter fullscreen mode.
     * @return Indicating if the request was successful.
     */
    request(): Promise<boolean>;
}
export {};
//# sourceMappingURL=pdf_presentation_mode.d.ts.map