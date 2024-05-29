/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2024
 *
 * @module pdf/pdf.ts-src/display/editor/color_picker.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { Cssc } from "../../../../lib/color/alias.js";
import { HighlightEditor } from "./highlight.js";
import { type AnnotationEditorUIManager, KeyboardManager } from "./tools.js";
type ColorPickerCtorP_ = {
    editor?: HighlightEditor;
    uiManager?: AnnotationEditorUIManager;
};
export declare class ColorPicker {
    #private;
    static get _keyboardManager(): KeyboardManager<import("./editor.js").AnnotationEditor | AnnotationEditorUIManager | ColorPicker>;
    constructor({ editor, uiManager }: ColorPickerCtorP_);
    renderButton(): HTMLButtonElement;
    renderMainDropdown(): HTMLDivElement;
    _colorSelectFromKeyboard(event: MouseEvent): void;
    _moveToNext(event: MouseEvent): void;
    _moveToPrevious(event: MouseEvent): void;
    _moveToBeginning(event: MouseEvent): void;
    _moveToEnd(event: MouseEvent): void;
    hideDropdown(): void;
    _hideDropdownFromKeyboard(): void;
    updateColor(color: Cssc): void;
    destroy(): void;
}
export {};
//# sourceMappingURL=color_picker.d.ts.map