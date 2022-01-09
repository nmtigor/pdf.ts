/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { GrabToPan } from "./grab_to_pan.js";
import { PresentationModeState } from "./ui_utils.js";
/*81---------------------------------------------------------------------------*/
export var CursorTool;
(function (CursorTool) {
    CursorTool[CursorTool["SELECT"] = 0] = "SELECT";
    CursorTool[CursorTool["HAND"] = 1] = "HAND";
    CursorTool[CursorTool["ZOOM"] = 2] = "ZOOM";
})(CursorTool || (CursorTool = {}));
export class PDFCursorTools {
    container;
    eventBus;
    active = CursorTool.SELECT;
    get activeTool() { return this.active; }
    activeBeforePresentationMode;
    handTool;
    constructor({ container, eventBus, cursorToolOnLoad = CursorTool.SELECT }) {
        this.container = container;
        this.eventBus = eventBus;
        this.handTool = new GrabToPan({
            element: this.container,
        });
        this.#addEventListeners();
        // Defer the initial `switchTool` call, to give other viewer components
        // time to initialize *and* register 'cursortoolchanged' event listeners.
        Promise.resolve().then(() => {
            this.switchTool(cursorToolOnLoad);
        });
    }
    /**
     * NOTE: This method is ignored while Presentation Mode is active.
     * @param tool - The cursor mode that should be switched to,
     *   must be one of the values in {CursorTool}.
     */
    switchTool(tool) {
        // Cursor tools cannot be used in Presentation Mode.
        if (this.activeBeforePresentationMode !== undefined)
            return;
        // The requested tool is already active.
        if (tool === this.active)
            return;
        const disableActiveTool = () => {
            switch (this.active) {
                case CursorTool.SELECT:
                    break;
                case CursorTool.HAND:
                    this.handTool.deactivate();
                    break;
                case CursorTool.ZOOM:
                /* falls through */
            }
        };
        // Enable the new cursor tool.
        switch (tool) {
            case CursorTool.SELECT:
                disableActiveTool();
                break;
            case CursorTool.HAND:
                disableActiveTool();
                this.handTool.activate();
                break;
            case CursorTool.ZOOM:
            /* falls through */
            default:
                console.error(`switchTool: "${tool}" is an unsupported value.`);
                return;
        }
        // Update the active tool *after* it has been validated above,
        // in order to prevent setting it to an invalid state.
        this.active = tool;
        this._dispatchEvent();
    }
    _dispatchEvent() {
        this.eventBus.dispatch("cursortoolchanged", {
            source: this,
            tool: this.active,
        });
    }
    #addEventListeners() {
        this.eventBus._on("switchcursortool", evt => {
            this.switchTool(evt.tool);
        });
        this.eventBus._on("presentationmodechanged", evt => {
            switch (evt.state) {
                case PresentationModeState.FULLSCREEN: {
                    const previouslyActive = this.active;
                    this.switchTool(CursorTool.SELECT);
                    this.activeBeforePresentationMode = previouslyActive;
                    break;
                }
                case PresentationModeState.NORMAL: {
                    const previouslyActive = this.activeBeforePresentationMode;
                    this.activeBeforePresentationMode = undefined;
                    this.switchTool(previouslyActive);
                    break;
                }
            }
        });
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=pdf_cursor_tools.js.map