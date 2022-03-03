import { EventBus } from "./event_utils.js";
import { PDFViewer } from "./pdf_viewer.js";
import { ScrollMode, SpreadMode } from "./ui_utils.js";
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
interface PrsntModeArgs {
    pageNumber: number;
    scaleValue: string | number;
    scrollMode: ScrollMode;
    spreadMode: SpreadMode;
}
export declare class PDFPresentationMode {
    #private;
    container: HTMLDivElement;
    pdfViewer: PDFViewer;
    eventBus: EventBus;
    active: boolean;
    args: PrsntModeArgs | undefined;
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
    request(): boolean;
}
export {};
//# sourceMappingURL=pdf_presentation_mode.d.ts.map