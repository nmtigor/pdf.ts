import { EventBus } from "./event_utils.js";
import { type IL10n } from "./interfaces.js";
import { FindState, type FindType, type MatchesCount } from "./pdf_find_controller.js";
import { type ViewerConfiguration } from "./viewer.js";
/**
 * Creates a "search bar" given a set of DOM elements that act as controls
 * for searching or for setting search preferences in the UI. This object
 * also sets up the appropriate events for the controls. Actual searching
 * is done by PDFFindController.
 */
export declare class PDFFindBar {
    #private;
    eventBus: EventBus;
    l10n: IL10n;
    opened: boolean;
    bar: HTMLDivElement;
    toggleButton: HTMLButtonElement;
    findField: HTMLInputElement;
    highlightAll: HTMLInputElement;
    caseSensitive: HTMLInputElement;
    matchDiacritics: HTMLInputElement;
    entireWord: HTMLInputElement;
    findMsg: HTMLSpanElement;
    findResultsCount: HTMLSpanElement;
    findPreviousButton: HTMLButtonElement;
    findNextButton: HTMLButtonElement;
    constructor(options: ViewerConfiguration["findBar"], eventBus: EventBus, l10n: IL10n);
    reset(): void;
    dispatchEvent(type: FindType | "", findPrev?: boolean): void;
    updateUIState(state?: FindState, previous?: boolean, matchesCount?: MatchesCount): void;
    updateResultsCount({ current, total }?: {
        current?: number | undefined;
        total?: number | undefined;
    }): void;
    open(): void;
    close(): void;
    toggle(): void;
}
//# sourceMappingURL=pdf_find_bar.d.ts.map