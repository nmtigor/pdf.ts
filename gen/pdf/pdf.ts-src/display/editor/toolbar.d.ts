/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2023
 *
 * @module pdf/pdf.ts-src/display/editor/toolbar.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { AnnotationEditor } from "./editor.js";
import type { AnnotationEditorUIManager } from "./tools.js";
import type { Box } from "../../alias.js";
import type { ColorPicker } from "./color_picker.js";
export declare class EditorToolbar {
    #private;
    constructor(editor: AnnotationEditor);
    render(): HTMLDivElement;
    hide(): void;
    show(): void;
    addAltTextButton(button: HTMLButtonElement): void;
    addColorPicker(colorPicker: ColorPicker): void;
    remove(): void;
}
export declare class HighlightToolbar {
    #private;
    constructor(uiManager: AnnotationEditorUIManager);
    show(parent: Element, boxes: Box[], isLTR: boolean): void;
    hide(): void;
}
//# sourceMappingURL=toolbar.d.ts.map