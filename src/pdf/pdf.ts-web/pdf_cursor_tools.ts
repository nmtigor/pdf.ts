/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
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

import { AnnotationEditorType } from "../pdf.ts-src/pdf.ts";
import { EventBus } from "./event_utils.ts";
import { GrabToPan } from "./grab_to_pan.ts";
import { CursorTool, PresentationModeState } from "./ui_utils.ts";
/*80--------------------------------------------------------------------------*/

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

export class PDFCursorTools {
  container: HTMLDivElement;
  eventBus: EventBus;

  active = CursorTool.SELECT;
  get activeTool() {
    return this.active;
  }
  previouslyActive?: CursorTool | undefined;

  handTool: GrabToPan;

  constructor({
    container,
    eventBus,
    cursorToolOnLoad = CursorTool.SELECT,
  }: PDFCursorToolsOptions) {
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
  switchTool(tool?: CursorTool) {
    if (this.previouslyActive !== undefined) {
      // Cursor tools cannot be used in PresentationMode/AnnotationEditor.
      return;
    }
    if (tool === this.active) {
      return; // The requested tool is already active.
    }

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

    this.#dispatchEvent();
  }

  #dispatchEvent() {
    this.eventBus.dispatch("cursortoolchanged", {
      source: this,
      tool: this.active,
    });
  }

  #addEventListeners() {
    this.eventBus._on("switchcursortool", (evt) => {
      this.switchTool(evt.tool);
    });

    // this.eventBus._on("presentationmodechanged", (evt) => {
    //   switch (evt.state) {
    //     case PresentationModeState.FULLSCREEN: {
    //       const previouslyActive = this.active;

    //       this.switchTool(CursorTool.SELECT);
    //       this.activeBeforePresentationMode = previouslyActive;
    //       break;
    //     }
    //     case PresentationModeState.NORMAL: {
    //       const previouslyActive = this.activeBeforePresentationMode;

    //       this.activeBeforePresentationMode = undefined;
    //       this.switchTool(previouslyActive);
    //       break;
    //     }
    //   }
    // });
    let annotationEditorMode = AnnotationEditorType.NONE,
      presentationModeState = PresentationModeState.NORMAL;

    const disableActive = () => {
      const previouslyActive = this.active;

      this.switchTool(CursorTool.SELECT);
      this.previouslyActive ??= previouslyActive; // Keep track of the first one.
    };
    const enableActive = () => {
      const previouslyActive = this.previouslyActive;

      if (
        previouslyActive !== undefined &&
        annotationEditorMode === AnnotationEditorType.NONE &&
        presentationModeState === PresentationModeState.NORMAL
      ) {
        this.previouslyActive = undefined;
        this.switchTool(previouslyActive);
      }
    };

    this.eventBus._on("secondarytoolbarreset", (evt) => {
      if (this.previouslyActive !== undefined) {
        annotationEditorMode = AnnotationEditorType.NONE;
        presentationModeState = PresentationModeState.NORMAL;

        enableActive();
      }
    });

    this.eventBus._on("annotationeditormodechanged", ({ mode }) => {
      annotationEditorMode = mode;

      if (mode === AnnotationEditorType.NONE) {
        enableActive();
      } else {
        disableActive();
      }
    });

    this.eventBus._on("presentationmodechanged", ({ state }) => {
      presentationModeState = state;

      if (state === PresentationModeState.NORMAL) {
        enableActive();
      } else if (state === PresentationModeState.FULLSCREEN) {
        disableActive();
      }
    });
  }
}
/*80--------------------------------------------------------------------------*/
