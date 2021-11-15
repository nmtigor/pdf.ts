import { PDFDocumentProxy } from "../pdf.ts-src/display/api.js";
import { PromiseCapability } from "../pdf.ts-src/shared/util.js";
import { IPDFLinkService } from "./interfaces.js";
import { EventBus } from "./ui_utils.js";
export declare const enum FindState {
    FOUND = 0,
    NOT_FOUND = 1,
    WRAPPED = 2,
    PENDING = 3
}
interface PDFFindControllerOptions {
    /**
     * The navigation/linking service.
     */
    linkService: IPDFLinkService;
    /**
     * The application event bus.
     */
    eventBus: EventBus;
}
export interface FindCtrlrState {
    type: string;
    query: string;
    phraseSearch: boolean;
    caseSensitive: boolean;
    entireWord: boolean;
    highlightAll: boolean;
    findPrevious?: boolean | undefined;
}
/**
 * Provides search functionality to find a given string in a PDF document.
 */
export declare class PDFFindController {
    #private;
    get highlightMatches(): boolean;
    _scrollMatches: boolean;
    _pdfDocument?: PDFDocumentProxy | undefined;
    get pageMatches(): number[][];
    _pageMatchesLength: number[][];
    get pageMatchesLength(): number[][];
    get selected(): {
        pageIdx: number;
        matchIdx: number;
    };
    get state(): FindCtrlrState | undefined;
    _firstPageCapability: PromiseCapability;
    _rawQuery?: string;
    constructor({ linkService, eventBus }: PDFFindControllerOptions);
    /**
     * Set a reference to the PDF document in order to search it.
     * Note that searching is not possible if this method is not called.
     *
     * @param pdfDocument The PDF document to search.
     */
    setDocument(pdfDocument?: PDFDocumentProxy): void;
    scrollMatchIntoView({ element, selectedLeft, pageIndex, matchIndex }: {
        element?: HTMLElement;
        selectedLeft: number;
        pageIndex?: number;
        matchIndex?: number;
    }): void;
    _shouldDirtyMatch(state: FindCtrlrState): boolean;
    _extractText(): void;
    _updateAllPages(): void;
    _nextMatch(): void;
    _nextPageMatch(): void;
    _requestMatchesCount(): {
        current: number;
        total: number;
    };
    _updateUIResultsCount(): void;
    _updateUIState(state: FindState, previous?: boolean): void;
}
export {};
//# sourceMappingURL=pdf_find_controller.d.ts.map