import { GrabToPan } from "./grab_to_pan.js";
import { EventBus } from "./ui_utils.js";
export declare const enum CursorTool {
    SELECT = 0,
    HAND = 1,
    ZOOM = 2
}
interface PDFCursorToolsOptions {
    /**
     * The document container.
     */
    container: HTMLDivElement;
    /**
     * The application event bus.
     */
    eventBus: EventBus;
    /**
     * The cursor tool that will be enabled
     * on load; the constants from {CursorTool} should be used. The default value
     * is `CursorTool.SELECT`.
     */
    cursorToolOnLoad: CursorTool | undefined;
}
export declare class PDFCursorTools {
    #private;
    container: HTMLDivElement;
    eventBus: EventBus;
    active: CursorTool;
    get activeTool(): CursorTool;
    activeBeforePresentationMode?: CursorTool | undefined;
    handTool: GrabToPan;
    constructor({ container, eventBus, cursorToolOnLoad }: PDFCursorToolsOptions);
    /**
     * NOTE: This method is ignored while Presentation Mode is active.
     * @param tool - The cursor mode that should be switched to,
     *   must be one of the values in {CursorTool}.
     */
    switchTool(tool?: CursorTool): void;
    protected _dispatchEvent(): void;
}
export {};
//# sourceMappingURL=pdf_cursor_tools.d.ts.map