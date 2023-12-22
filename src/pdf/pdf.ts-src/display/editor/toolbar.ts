/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2023
 */

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
import type { AnnotationEditor } from "./editor.ts";
/*80--------------------------------------------------------------------------*/

export class EditorToolbar {
  #toolbar: HTMLDivElement | undefined;
  #editor;
  #buttons: HTMLDivElement | undefined;

  constructor(editor: AnnotationEditor) {
    this.#editor = editor;
  }

  render() {
    const editToolbar = (this.#toolbar = div());
    editToolbar.className = "editToolbar";
    editToolbar.on("contextmenu", noContextMenu);
    editToolbar.on("pointerdown", EditorToolbar.#pointerDown);

    const buttons = (this.#buttons = div());
    buttons.className = "buttons";
    editToolbar.append(buttons);

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
    element.on("focusin", this.#focusIn, { capture: true });
    element.on("focusout", this.#focusOut, { capture: true });
    element.on("contextmenu", noContextMenu);
  }

  hide() {
    this.#toolbar!.classList.add("hidden");
  }

  show() {
    this.#toolbar!.classList.remove("hidden");
  }

  #addDeleteButton() {
    const button = html("button");
    button.className = "delete";
    button.tabIndex = 0;
    button.setAttribute("data-l10n-id", "pdfjs-editor-remove-button");
    this.#addListenersToElement(button);
    button.on("click", (e) => {
      this.#editor._uiManager.delete();
    });
    this.#buttons!.append(button);
  }

  remove() {
    this.#toolbar!.remove();
  }
}
/*80--------------------------------------------------------------------------*/
