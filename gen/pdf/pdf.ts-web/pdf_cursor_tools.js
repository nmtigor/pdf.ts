/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */
/* Copyright 2017 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { GrabToPan } from "./grab_to_pan.js";
export class PDFCursorTools {
    container;
    eventBus;
    active = 0 /* SELECT */;
    activeBeforePresentationMode;
    handTool;
    constructor({ container, eventBus, cursorToolOnLoad = 0 /* SELECT */ }) {
        this.container = container;
        this.eventBus = eventBus;
        // this.active = CursorTool.SELECT;
        // this.activeBeforePresentationMode = null;
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
     * @return One of the values in {CursorTool}.
     */
    get activeTool() {
        return this.active;
    }
    /**
     * NOTE: This method is ignored while Presentation Mode is active.
     * @param tool - The cursor mode that should be switched to,
     *   must be one of the values in {CursorTool}.
     */
    switchTool(tool) {
        if (this.activeBeforePresentationMode !== undefined) {
            return; // Cursor tools cannot be used in Presentation Mode.
        }
        if (tool === this.active) {
            return; // The requested tool is already active.
        }
        const disableActiveTool = () => {
            switch (this.active) {
                case 0 /* SELECT */:
                    break;
                case 1 /* HAND */:
                    this.handTool.deactivate();
                    break;
                case 2 /* ZOOM */:
                /* falls through */
            }
        };
        // Enable the new cursor tool.
        switch (tool) {
            case 0 /* SELECT */:
                disableActiveTool();
                break;
            case 1 /* HAND */:
                disableActiveTool();
                this.handTool.activate();
                break;
            case 2 /* ZOOM */:
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
    /** @override */
    _dispatchEvent() {
        this.eventBus.dispatch("cursortoolchanged", {
            source: this,
            tool: this.active,
        });
    }
    #addEventListeners = () => {
        this.eventBus._on("switchcursortool", evt => {
            this.switchTool(evt.tool);
        });
        this.eventBus._on("presentationmodechanged", evt => {
            switch (evt.state) {
                case 3 /* FULLSCREEN */: {
                    const previouslyActive = this.active;
                    this.switchTool(0 /* SELECT */);
                    this.activeBeforePresentationMode = previouslyActive;
                    break;
                }
                case 1 /* NORMAL */: {
                    const previouslyActive = this.activeBeforePresentationMode;
                    this.activeBeforePresentationMode = undefined;
                    this.switchTool(previouslyActive);
                    break;
                }
            }
        });
    };
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=pdf_cursor_tools.js.map