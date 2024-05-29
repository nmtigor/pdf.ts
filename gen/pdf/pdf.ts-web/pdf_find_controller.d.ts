/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/pdf_find_controller.ts
 * @license Apache-2.0
 ******************************************************************************/
import { PromiseCap } from "../../lib/util/PromiseCap.js";
import type { PDFDocumentProxy } from "../pdf.ts-src/pdf.js";
import type { EventBus } from "./event_utils.js";
import type { IPDFLinkService } from "./interfaces.js";
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
    /**
     * True if the matches
     * count must be updated on progress or only when the last page is reached.
     * The default value is `true`.
     */
    updateMatchesCountOnProgress?: boolean;
}
export type FindType = "again" | "casesensitivitychange" | "diacriticmatchingchange" | "entirewordchange" | "findagain" | "findhighlightallchange" | "highlightallchange";
export type FindCtrlState = {
    type: FindType | "";
    query: string | string[] | RegExpMatchArray | null;
    caseSensitive: boolean;
    entireWord: boolean;
    findPrevious?: boolean | undefined;
    highlightAll: boolean;
    matchDiacritics: boolean;
};
export interface MatchesCount {
    current: number;
    total: number;
}
type PDFFindControllerScrollMatchIntoViewParams = {
    element?: HTMLElement;
    selectedLeft?: number;
    pageIndex?: number;
    matchIndex?: number;
};
/**
 * Provides search functionality to find a given string in a PDF document.
 */
export declare class PDFFindController {
    #private;
    /**
     * Callback used to check if a `pageNumber` is currently visible.
     */
    onIsPageVisible?(pageNumber_x: number): boolean;
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
    constructor({ linkService, eventBus, updateMatchesCountOnProgress, }: PDFFindControllerOptions);
    /**
     * Set a reference to the PDF document in order to search it.
     * Note that searching is not possible if this method is not called.
     *
     * @param pdfDocument The PDF document to search.
     */
    setDocument(pdfDocument?: PDFDocumentProxy): void;
    scrollMatchIntoView({ element, selectedLeft, pageIndex, matchIndex }: PDFFindControllerScrollMatchIntoViewParams): void;
}
export {};
//# sourceMappingURL=pdf_find_controller.d.ts.map