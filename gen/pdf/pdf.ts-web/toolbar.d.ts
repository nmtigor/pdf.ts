import { EventBus, EventName } from "./event_utils.js";
import { type IL10n } from "./interfaces.js";
import { type ViewerConfiguration } from "./viewer.js";
interface ToolbarButton {
    element: HTMLElement;
    eventName: EventName | null;
}
interface ToolbarItems {
    numPages: HTMLSpanElement;
    pageNumber: HTMLInputElement;
    scaleSelect: HTMLSelectElement;
    customScaleOption: HTMLOptionElement;
    previous: HTMLButtonElement;
    next: HTMLButtonElement;
    zoomIn: HTMLButtonElement;
    zoomOut: HTMLButtonElement;
}
export declare class Toolbar {
    #private;
    toolbar: HTMLDivElement;
    eventBus: EventBus;
    l10n: IL10n;
    buttons: ToolbarButton[];
    items: ToolbarItems;
    _wasLocalized: boolean;
    pageNumber: number;
    pageLabel?: string | undefined;
    hasPageLabels: boolean;
    pagesCount: number;
    pageScaleValue: string;
    pageScale: number;
    constructor(options: ViewerConfiguration['toolbar'], eventBus: EventBus, l10n: IL10n);
    setPageNumber(pageNumber: number, pageLabel?: string): void;
    setPagesCount(pagesCount: number, hasPageLabels: boolean): void;
    setPageScale(pageScaleValue: string | number | undefined, pageScale: number): void;
    reset(): void;
    updateLoadingIndicatorState(loading?: boolean): void;
}
export {};
//# sourceMappingURL=toolbar.d.ts.map