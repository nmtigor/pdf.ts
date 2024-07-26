/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2023
 *
 * @module pdf/pdf.ts-src/display/editor/toolbar.ts
 * @license Apache-2.0
 ******************************************************************************/

/* Copyright 2023 Mozilla Foundation
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

import { div, html } from "@fe-lib/dom.ts";
import { noContextMenu } from "@fe-lib/util/general.ts";
import type { Box } from "../../alias.ts";
import type { ColorPicker } from "./color_picker.ts";
import type { AnnotationEditor } from "./editor.ts";
import type { AnnotationEditorUIManager } from "./tools.ts";
/*80--------------------------------------------------------------------------*/

export class EditorToolbar {
  #toolbar: HTMLDivElement | undefined;
  #colorPicker: ColorPicker | undefined;
  #editor;
  #buttons: HTMLDivElement | undefined;

  constructor(editor: AnnotationEditor) {
    this.#editor = editor;
  }

  render() {
    const editToolbar = (this.#toolbar = div());
    editToolbar.className = "editToolbar";
    editToolbar.setAttribute("role", "toolbar");
    const signal = this.#editor._uiManager._signal;
    editToolbar.on("contextmenu", noContextMenu, { signal });
    editToolbar.on("pointerdown", EditorToolbar.#pointerDown, { signal });

    const buttons = (this.#buttons = div());
    buttons.className = "buttons";
    editToolbar.append(buttons);

    const position = this.#editor.toolbarPosition;
    if (position) {
      const { style } = editToolbar;
      const x = this.#editor._uiManager.direction === "ltr"
        ? 1 - position[0]
        : position[0];
      style.insetInlineEnd = `${100 * x}%`;
      style.top = `calc(${
        100 * position[1]
      }% + var(--editor-toolbar-vert-offset))`;
    }

    this.#addDeleteButton();

    return editToolbar;
  }

  static #pointerDown(e: Event) {
    e.stopPropagation();
  }

  #focusIn = (e: FocusEvent) => {
    this.#editor._focusEventsAllowed = false;
    e.preventDefault();
    e.stopPropagation();
  };

  #focusOut = (e: FocusEvent) => {
    this.#editor._focusEventsAllowed = true;
    e.preventDefault();
    e.stopPropagation();
  };

  #addListenersToElement(element: HTMLElement) {
    // If we're clicking on a button with the keyboard or with
    // the mouse, we don't want to trigger any focus events on
    // the editor.
    const signal = this.#editor._uiManager._signal;
    element.on("focusin", this.#focusIn, { capture: true, signal });
    element.on("focusout", this.#focusOut, { capture: true, signal });
    element.on("contextmenu", noContextMenu, { signal });
  }

  hide() {
    this.#toolbar!.classList.add("hidden");
    this.#colorPicker?.hideDropdown();
  }

  show() {
    this.#toolbar!.classList.remove("hidden");
  }

  #addDeleteButton() {
    const button = html("button");
    button.className = "delete";
    button.tabIndex = 0;
    button.setAttribute(
      "data-l10n-id",
      `pdfjs-editor-remove-${this.#editor.editorType}-button`,
    );
    this.#addListenersToElement(button);
    button.on("click", (e) => {
      this.#editor._uiManager.delete();
    }, { signal: this.#editor._uiManager._signal });
    this.#buttons!.append(button);
  }

  get #divider() {
    const divider = html("div");
    divider.className = "divider";
    return divider;
  }

  addAltTextButton(button: HTMLButtonElement) {
    this.#addListenersToElement(button);
    this.#buttons!.prepend(button, this.#divider);
  }

  addColorPicker(colorPicker: ColorPicker) {
    this.#colorPicker = colorPicker;
    const button = colorPicker.renderButton();
    this.#addListenersToElement(button);
    this.#buttons!.prepend(button, this.#divider);
  }

  remove() {
    this.#toolbar!.remove();
    this.#colorPicker?.destroy();
    this.#colorPicker = undefined;
  }
}

export class HighlightToolbar {
  #buttons: HTMLDivElement | undefined;
  #toolbar: HTMLDivElement | undefined;
  #uiManager;

  constructor(uiManager: AnnotationEditorUIManager) {
    this.#uiManager = uiManager;
  }

  #render() {
    const editToolbar = (this.#toolbar = html("div"));
    editToolbar.className = "editToolbar";
    editToolbar.setAttribute("role", "toolbar");
    editToolbar.on("contextmenu", noContextMenu, {
      signal: this.#uiManager._signal,
    });

    const buttons = (this.#buttons = html("div"));
    buttons.className = "buttons";
    editToolbar.append(buttons);

    this.#addHighlightButton();

    return editToolbar;
  }

  #getLastPoint(boxes: Box[], isLTR: boolean) {
    let lastY = 0;
    let lastX = 0;
    for (const box of boxes) {
      const y = box.y + box.height;
      if (y < lastY) {
        continue;
      }
      const x = box.x + (isLTR ? box.width : 0);
      if (y > lastY) {
        lastX = x;
        lastY = y;
        continue;
      }
      if (isLTR) {
        if (x > lastX) {
          lastX = x;
        }
      } else if (x < lastX) {
        lastX = x;
      }
    }
    return [isLTR ? 1 - lastX : lastX, lastY];
  }

  show(parent: Element, boxes: Box[], isLTR: boolean) {
    const [x, y] = this.#getLastPoint(boxes, isLTR);
    const { style } = (this.#toolbar ||= this.#render());
    parent.append(this.#toolbar);
    style.insetInlineEnd = `${100 * x}%`;
    style.top = `calc(${100 * y}% + var(--editor-toolbar-vert-offset))`;
  }

  hide() {
    this.#toolbar!.remove();
  }

  #addHighlightButton() {
    const button = html("button");
    button.className = "highlightButton";
    button.tabIndex = 0;
    button.setAttribute("data-l10n-id", `pdfjs-highlight-floating-button1`);
    const span = html("span");
    button.append(span);
    span.className = "visuallyHidden";
    span.setAttribute("data-l10n-id", "pdfjs-highlight-floating-button-label");
    const signal = this.#uiManager._signal;
    button.on("contextmenu", noContextMenu, { signal });
    button.on("click", () => {
      this.#uiManager.highlightSelection("floating_button");
    }, { signal });
    this.#buttons!.append(button);
  }
}
/*80--------------------------------------------------------------------------*/
