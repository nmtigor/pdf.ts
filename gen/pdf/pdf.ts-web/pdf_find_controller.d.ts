/** @typedef {import("../src/display/api").PDFDocumentProxy} PDFDocumentProxy */
/** @typedef {import("./event_utils").EventBus} EventBus */
/** @typedef {import("./interfaces").IPDFLinkService} IPDFLinkService */
import { PromiseCap } from "../../lib/promisecap.js";
import { PDFDocumentProxy } from "../pdf.ts-src/pdf.js";
import { EventBus } from "./event_utils.js";
import { type IPDFLinkService } from "./interfaces.js";
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
export declare type FindType = "again" | "casesensitivitychange" | "diacriticmatchingchange" | "entirewordchange" | "findagain" | "findhighlightallchange" | "highlightallchange";
export declare type FindCtrlState = {
    type: FindType | "";
    query: string;
    phraseSearch: boolean;
    caseSensitive: boolean;
    entireWord: boolean;
    highlightAll: boolean;
    findPrevious?: boolean | undefined;
    matchDiacritics: boolean;
};
export interface MatchesCount {
    current: number;
    total: number;
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
    get pageMatchesLength(): number[][];
    get selected(): {
        pageIdx: number;
        matchIdx: number;
    };
    get state(): FindCtrlState | undefined;
    _firstPageCapability: PromiseCap;
    _rawQuery?: string;
    constructor({ linkService, eventBus, }: PDFFindControllerOptions);
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
}
export {};
//# sourceMappingURL=pdf_find_controller.d.ts.map