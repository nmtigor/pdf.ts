import type { EventBus } from "./event_utils.js";
import { CursorTool } from "./ui_utils.js";
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
    get activeTool(): CursorTool;
    private get _handTool();
    constructor({ container, eventBus, cursorToolOnLoad, }: PDFCursorToolsOptions);
    /**
     * @param tool The cursor mode that should be switched to,
     *   must be one of the values in {CursorTool}.
     */
    switchTool(tool?: CursorTool): void;
}
export {};
//# sourceMappingURL=pdf_cursor_tools.d.ts.map