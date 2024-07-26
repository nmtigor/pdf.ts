/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2024
 *
 * @module pdf/pdf.ts-src/display/editor/color_picker.ts
 * @license Apache-2.0
 ******************************************************************************/
var _a;
import { html, span } from "../../../../lib/dom.js";
import { noContextMenu } from "../../../../lib/util/general.js";
import { AnnotationEditorParamsType, shadow } from "../../shared/util.js";
import { KeyboardManager } from "./tools.js";
export class ColorPicker {
    #boundKeyDown = this.#keyDown.bind(this);
    #boundPointerDown = this.#pointerDown.bind(this);
    #button;
    #buttonSwatch;
    #defaultColor;
    #dropdown;
    #dropdownWasFromKeyboard = false;
    #isMainColorPicker = false;
    #editor;
    #eventBus;
    #uiManager;
    #type;
    static get _keyboardManager() {
        return shadow(this, "_keyboardManager", new KeyboardManager([
            [
                ["Escape", "mac+Escape"],
                _a.prototype._hideDropdownFromKeyboard,
            ],
            [
                [" ", "mac+ "],
                _a.prototype._colorSelectFromKeyboard,
            ],
            [
                ["ArrowDown", "ArrowRight", "mac+ArrowDown", "mac+ArrowRight"],
                _a.prototype._moveToNext,
            ],
            [
                ["ArrowUp", "ArrowLeft", "mac+ArrowUp", "mac+ArrowLeft"],
                _a.prototype._moveToPrevious,
            ],
            [
                ["Home", "mac+Home"],
                _a.prototype._moveToBeginning,
            ],
            [
                ["End", "mac+End"],
                _a.prototype._moveToEnd,
            ],
        ]));
    }
    constructor({ editor, uiManager }) {
        if (editor) {
            this.#isMainColorPicker = false;
            this.#type = AnnotationEditorParamsType.HIGHLIGHT_COLOR;
            this.#editor = editor;
        }
        else {
            this.#isMainColorPicker = true;
            this.#type = AnnotationEditorParamsType.HIGHLIGHT_DEFAULT_COLOR;
        }
        this.#uiManager = editor?._uiManager || uiManager;
        this.#eventBus = this.#uiManager._eventBus;
        this.#defaultColor = editor?.color ||
            this.#uiManager?.highlightColors.values().next().value ||
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
        swatch.setAttribute("aria-hidden", true);
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
        for (const [name, color] of this.#uiManager.highlightColors) {
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
    #colorSelect(color, event) {
        event.stopPropagation();
        this.#eventBus.dispatch("switchannotationeditorparams", {
            source: this,
            type: this.#type,
            value: color,
        });
    }
    _colorSelectFromKeyboard(event) {
        if (event.target === this.#button) {
            this.#openDropdown(event);
            return;
        }
        const color = event.target.getAttribute("data-color");
        if (!color) {
            return;
        }
        this.#colorSelect(color, event);
    }
    _moveToNext(event) {
        if (!this.#isDropdownVisible) {
            this.#openDropdown(event);
            return;
        }
        if (event.target === this.#button) {
            this.#dropdown.firstChild?.focus();
            return;
        }
        event.target.nextSibling?.focus();
    }
    _moveToPrevious(event) {
        if (event.target === this.#dropdown?.firstChild ||
            event.target === this.#button) {
            if (this.#isDropdownVisible) {
                this._hideDropdownFromKeyboard();
            }
            return;
        }
        if (!this.#isDropdownVisible) {
            this.#openDropdown(event);
        }
        event.target.previousSibling?.focus();
    }
    _moveToBeginning(event) {
        if (!this.#isDropdownVisible) {
            this.#openDropdown(event);
            return;
        }
        this.#dropdown.firstChild?.focus();
    }
    _moveToEnd(event) {
        if (!this.#isDropdownVisible) {
            this.#openDropdown(event);
            return;
        }
        this.#dropdown.lastChild?.focus();
    }
    #keyDown(event) {
        _a._keyboardManager.exec(this, event);
    }
    #openDropdown(event) {
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
        this.#button.append(root);
    }
    #pointerDown(event) {
        if (this.#dropdown?.contains(event.target)) {
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
        this.#button.focus({
            preventScroll: true,
            focusVisible: this.#dropdownWasFromKeyboard,
        });
    }
    updateColor(color) {
        if (this.#buttonSwatch) {
            this.#buttonSwatch.style.backgroundColor = color;
        }
        if (!this.#dropdown) {
            return;
        }
        const i = this.#uiManager.highlightColors.values();
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
_a = ColorPicker;
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=color_picker.js.map