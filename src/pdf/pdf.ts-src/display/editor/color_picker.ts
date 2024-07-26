/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2024
 *
 * @module pdf/pdf.ts-src/display/editor/color_picker.ts
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

import type { Cssc } from "@fe-lib/color/alias.ts";
import { html, span } from "@fe-lib/dom.ts";
import { noContextMenu } from "@fe-lib/util/general.ts";
import { AnnotationEditorParamsType, shadow } from "../../shared/util.ts";
import { HighlightEditor } from "./highlight.ts";
import { type AnnotationEditorUIManager, KeyboardManager } from "./tools.ts";
/*80--------------------------------------------------------------------------*/

type ColorPickerCtorP_ = {
  editor?: HighlightEditor;
  uiManager?: AnnotationEditorUIManager;
};

export class ColorPicker {
  #boundKeyDown = this.#keyDown.bind(this);
  #boundPointerDown = this.#pointerDown.bind(this);
  #button: HTMLButtonElement | undefined;
  #buttonSwatch: HTMLSpanElement | undefined;
  #defaultColor;
  #dropdown: HTMLDivElement | undefined;
  #dropdownWasFromKeyboard = false;
  #isMainColorPicker = false;
  #editor: HighlightEditor | undefined;
  #eventBus;
  #uiManager;
  #type;

  static get _keyboardManager() {
    return shadow(
      this,
      "_keyboardManager",
      new KeyboardManager([
        [
          ["Escape", "mac+Escape"],
          ColorPicker.prototype._hideDropdownFromKeyboard,
        ],
        [
          [" ", "mac+ "],
          ColorPicker.prototype._colorSelectFromKeyboard,
        ],
        [
          ["ArrowDown", "ArrowRight", "mac+ArrowDown", "mac+ArrowRight"],
          ColorPicker.prototype._moveToNext,
        ],
        [
          ["ArrowUp", "ArrowLeft", "mac+ArrowUp", "mac+ArrowLeft"],
          ColorPicker.prototype._moveToPrevious,
        ],
        [
          ["Home", "mac+Home"],
          ColorPicker.prototype._moveToBeginning,
        ],
        [
          ["End", "mac+End"],
          ColorPicker.prototype._moveToEnd,
        ],
      ]),
    );
  }

  constructor({ editor, uiManager }: ColorPickerCtorP_) {
    if (editor) {
      this.#isMainColorPicker = false;
      this.#type = AnnotationEditorParamsType.HIGHLIGHT_COLOR;
      this.#editor = editor;
    } else {
      this.#isMainColorPicker = true;
      this.#type = AnnotationEditorParamsType.HIGHLIGHT_DEFAULT_COLOR;
    }
    this.#uiManager = editor?._uiManager || uiManager!;
    this.#eventBus = this.#uiManager._eventBus;
    this.#defaultColor = editor?.color ||
      this.#uiManager?.highlightColors!.values().next().value ||
      "#FFFF98";
  }

  renderButton() {
    const button = (this.#button = html("button"));
    button.className = "colorPicker";
    button.tabIndex = 0;
    button.assignAttro({
      "data-l10n-id": "pdfjs-editor-colorpicker-button",
      "aria-haspopup": true,
    });
    const signal = this.#uiManager._signal;
    button.on("click", this.#openDropdown.bind(this), { signal });
    button.on("keydown", this.#boundKeyDown, { signal });
    const swatch = (this.#buttonSwatch = span());
    swatch.className = "swatch";
    swatch.setAttribute("aria-hidden", true as any);
    swatch.style.backgroundColor = this.#defaultColor;
    button.append(swatch);
    return button;
  }

  renderMainDropdown() {
    const dropdown = (this.#dropdown = this.#getDropdownRoot());
    dropdown.assignAttro({
      "aria-orientation": "horizontal",
      "aria-labelledby": "highlightColorPickerLabel",
    });

    return dropdown;
  }

  #getDropdownRoot() {
    const div = html("div");
    const signal = this.#uiManager._signal;
    div.on("contextmenu", noContextMenu, { signal });
    div.className = "dropdown";
    div.role = "listbox";
    div.assignAttro({
      "aria-multiselectable": false,
      "aria-orientation": "vertical",
      "data-l10n-id": "pdfjs-editor-colorpicker-dropdown",
    });
    for (const [name, color] of this.#uiManager.highlightColors!) {
      const button = html("button");
      button.tabIndex = 0;
      button.role = "option";
      button.title = name;
      button.assignAttro({
        "data-color": color,
        "data-l10n-id": `pdfjs-editor-colorpicker-${name}`,
      });
      const swatch = span();
      button.append(swatch);
      swatch.className = "swatch";
      swatch.style.backgroundColor = color;
      button.assignAttro({
        "aria-selected": color === this.#defaultColor,
      });
      button.on("click", this.#colorSelect.bind(this, color), { signal });
      div.append(button);
    }

    div.on("keydown", this.#boundKeyDown, { signal });

    return div;
  }

  #colorSelect(color: Cssc, event: MouseEvent) {
    event.stopPropagation();
    this.#eventBus.dispatch("switchannotationeditorparams", {
      source: this,
      type: this.#type,
      value: color,
    });
  }

  _colorSelectFromKeyboard(event: MouseEvent) {
    if (event.target === this.#button) {
      this.#openDropdown(event);
      return;
    }
    const color = (event.target as Element).getAttribute("data-color");
    if (!color) {
      return;
    }
    this.#colorSelect(color, event);
  }

  _moveToNext(event: MouseEvent) {
    if (!this.#isDropdownVisible) {
      this.#openDropdown(event);
      return;
    }
    if (event.target === this.#button) {
      (this.#dropdown!.firstChild as HTMLElement | null)?.focus();
      return;
    }
    ((event.target as Node).nextSibling as HTMLElement | null)?.focus();
  }

  _moveToPrevious(event: MouseEvent) {
    if (
      event.target === this.#dropdown?.firstChild ||
      event.target === this.#button
    ) {
      if (this.#isDropdownVisible) {
        this._hideDropdownFromKeyboard();
      }
      return;
    }
    if (!this.#isDropdownVisible) {
      this.#openDropdown(event);
    }
    ((event.target as Node).previousSibling as HTMLElement | null)?.focus();
  }

  _moveToBeginning(event: MouseEvent) {
    if (!this.#isDropdownVisible) {
      this.#openDropdown(event);
      return;
    }
    (this.#dropdown!.firstChild as HTMLElement | null)?.focus();
  }

  _moveToEnd(event: MouseEvent) {
    if (!this.#isDropdownVisible) {
      this.#openDropdown(event);
      return;
    }
    (this.#dropdown!.lastChild as HTMLElement | null)?.focus();
  }

  #keyDown(event: KeyboardEvent) {
    ColorPicker._keyboardManager.exec(this, event);
  }

  #openDropdown(event: MouseEvent) {
    if (this.#isDropdownVisible) {
      this.hideDropdown();
      return;
    }
    this.#dropdownWasFromKeyboard = event.detail === 0;
    window.on("pointerdown", this.#boundPointerDown, {
      signal: this.#uiManager._signal,
    });
    if (this.#dropdown) {
      this.#dropdown.classList.remove("hidden");
      return;
    }
    const root = (this.#dropdown = this.#getDropdownRoot());
    this.#button!.append(root);
  }

  #pointerDown(event: PointerEvent) {
    if (this.#dropdown?.contains(event.target as Node | null)) {
      return;
    }
    this.hideDropdown();
  }

  hideDropdown() {
    this.#dropdown?.classList.add("hidden");
    window.off("pointerdown", this.#boundPointerDown);
  }

  get #isDropdownVisible() {
    return this.#dropdown && !this.#dropdown.classList.contains("hidden");
  }

  _hideDropdownFromKeyboard() {
    if (this.#isMainColorPicker) {
      return;
    }
    if (!this.#isDropdownVisible) {
      // The user pressed Escape with no dropdown visible, so we must
      // unselect it.
      this.#editor?.unselect();
      return;
    }
    this.hideDropdown();
    this.#button!.focus({
      preventScroll: true,
      focusVisible: this.#dropdownWasFromKeyboard,
    } as FocusOptions);
  }

  updateColor(color: Cssc) {
    if (this.#buttonSwatch) {
      this.#buttonSwatch.style.backgroundColor = color;
    }
    if (!this.#dropdown) {
      return;
    }

    const i = this.#uiManager.highlightColors!.values();
    for (const child of this.#dropdown.children) {
      child.assignAttro({
        "aria-selected": i.next().value === color,
      });
    }
  }

  destroy() {
    this.#button?.remove();
    this.#button = undefined;
    this.#buttonSwatch = undefined;
    this.#dropdown?.remove();
    this.#dropdown = undefined;
  }
}
/*80--------------------------------------------------------------------------*/
