import { ScrollMode, SpreadMode } from "./ui_utils.js";
import { CursorTool } from "./pdf_cursor_tools.js";
import { type ViewerConfiguration } from "./viewer.js";
import { EventBus } from "./event_utils.js";
interface Anchor {
    element: HTMLAnchorElement;
    eventName?: undefined;
    close: boolean;
    eventDetails?: undefined;
}
declare type ButtonEventName = "documentproperties" | "download" | "firstpage" | "lastpage" | "openfile" | "presentationmode" | "print" | "rotatecw" | "rotateccw" | "switchscrollmode" | "switchcursortool" | "switchspreadmode";
interface Button {
    element: HTMLButtonElement;
    eventName: ButtonEventName;
    close: boolean;
    eventDetails?: {
        tool?: CursorTool;
        mode?: ScrollMode | SpreadMode;
    };
}
export declare class SecondaryToolbar {
    #private;
    toolbar: HTMLDivElement;
    toggleButton: HTMLButtonElement;
    toolbarButtonContainer: HTMLDivElement;
    buttons: (Button | Anchor)[];
    items: {
        firstPage: HTMLButtonElement;
        lastPage: HTMLButtonElement;
        pageRotateCw: HTMLButtonElement;
        pageRotateCcw: HTMLButtonElement;
    };
    mainContainer: HTMLDivElement;
    eventBus: EventBus;
    opened: boolean;
    containerHeight?: number;
    previousContainerHeight?: number;
    pagesCount?: number;
    pageNumber?: number;
    constructor(options: ViewerConfiguration["secondaryToolbar"], mainContainer: HTMLDivElement, eventBus: EventBus);
    get isOpen(): boolean;
    setPageNumber(pageNumber: number): void;
    setPagesCount(pagesCount: number): void;
    reset(): void;
    _updateUIState(): void;
    _bindClickListeners(): void;
    _bindCursorToolsListener(buttons: ViewerConfiguration['secondaryToolbar']): void;
    _bindScrollModeListener(buttons: ViewerConfiguration['secondaryToolbar']): void;
    _bindSpreadModeListener(buttons: ViewerConfiguration['secondaryToolbar']): void;
    open(): void;
    close(): void;
    toggle(): void;
}
export {};
//# sourceMappingURL=secondary_toolbar.d.ts.map