import { EventBus, EventMap } from "./event_utils.js";
import { PDFFindController } from "./pdf_find_controller.js";
interface TextHighlighterOptions {
    findController: PDFFindController | undefined;
    /**
     * The application event bus.
     */
    eventBus: EventBus;
    /**
     * The page index.
     */
    pageIndex: number;
}
interface MatchPos {
    divIdx: number;
    offset: number;
}
interface Match {
    begin: MatchPos;
    end: MatchPos;
}
/**
 * TextHighlighter handles highlighting matches from the FindController in
 * either the text layer or XFA layer depending on the type of document.
 */
export declare class TextHighlighter {
    #private;
    findController: PDFFindController | undefined;
    matches: Match[];
    eventBus: EventBus;
    pageIdx: number;
    _onUpdateTextLayerMatches: ((evt: EventMap["updatetextlayermatches"]) => void) | undefined;
    textDivs: (HTMLSpanElement | Text)[] | undefined;
    textContentItemsStr: string[] | undefined;
    enabled: boolean;
    constructor({ findController, eventBus, pageIndex }: TextHighlighterOptions);
    /**
     * Store two arrays that will map DOM nodes to text they should contain.
     * The arrays should be of equal length and the array element at each index
     * should correspond to the other. e.g.
     * `items[0] = "<span>Item 0</span>" and texts[0] = "Item 0";
     */
    setTextMapping(divs: (HTMLSpanElement | Text)[], texts: string[]): void;
    /**
     * Start listening for events to update the highlighter and check if there are
     * any current matches that need be highlighted.
     */
    enable(): void;
    disable(): void;
    _renderMatches(matches: Match[]): void;
    _updateMatches(): void;
}
export {};
//# sourceMappingURL=text_highlighter.d.ts.map