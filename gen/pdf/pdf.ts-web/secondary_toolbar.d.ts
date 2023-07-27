import type { DefaultExternalServices } from "./app.js";
import type { EventBus } from "./event_utils.js";
import { CursorTool, ScrollMode, SpreadMode } from "./ui_utils.js";
import type { ViewerConfiguration } from "./viewer.js";
interface Anchor {
    element: HTMLAnchorElement;
    eventName?: undefined;
    close: boolean;
    eventDetails?: undefined;
}
type ButtonEventName = "documentproperties" | "download" | "firstpage" | "lastpage" | "openfile" | "presentationmode" | "print" | "rotatecw" | "rotateccw" | "switchscrollmode" | "switchcursortool" | "switchspreadmode";
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
    buttons: (Button | Anchor)[];
    items: {
        firstPage: HTMLButtonElement;
        lastPage: HTMLButtonElement;
        pageRotateCw: HTMLButtonElement;
        pageRotateCcw: HTMLButtonElement;
    };
    mainContainer?: HTMLDivElement;
    eventBus: EventBus;
    externalServices: DefaultExternalServices;
    opened: boolean;
    containerHeight?: number;
    previousContainerHeight?: number;
    pagesCount?: number;
    pageNumber?: number;
    constructor(options: ViewerConfiguration["secondaryToolbar"], eventBus: EventBus, externalServices: DefaultExternalServices);
    get isOpen(): boolean;
    setPageNumber(pageNumber: number): void;
    setPagesCount(pagesCount: number): void;
    reset(): void;
    open(): void;
    close(): void;
    toggle(): void;
}
export {};
//# sourceMappingURL=secondary_toolbar.d.ts.map