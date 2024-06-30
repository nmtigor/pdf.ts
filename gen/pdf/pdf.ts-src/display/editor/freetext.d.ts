/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/editor/freetext.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { dot2d_t } from "../../../../lib/alias.js";
import type { IL10n } from "../../../pdf.ts-web/interfaces.js";
import { AnnotationEditorParamsType, AnnotationEditorType } from "../../shared/util.js";
import type { AnnotationElement, AnnotStorageValue } from "../annotation_layer.js";
import type { AnnotationEditorLayer } from "./annotation_editor_layer.js";
import type { AnnotationEditorP, PropertyToUpdate } from "./editor.js";
import { AnnotationEditor } from "./editor.js";
import { AnnotationEditorUIManager, KeyboardManager } from "./tools.js";
export interface FreeTextEditorP extends AnnotationEditorP {
    name: "freeTextEditor";
    color?: string;
    fontSize?: number;
}
export interface FreeTextEditorSerialized extends AnnotStorageValue {
    fontSize: number;
    position: dot2d_t;
    value: string;
}
/**
 * Basic text editor in order to create a FreeTex annotation.
 */
export declare class FreeTextEditor extends AnnotationEditor {
    #private;
    static readonly _type = "freetext";
    static readonly _editorType = AnnotationEditorType.FREETEXT;
    overlayDiv: HTMLDivElement;
    editorDiv: HTMLDivElement;
    static _freeTextDefaultContent: string;
    static _internalPadding: number;
    static _defaultColor: string | undefined;
    static _defaultFontSize: number;
    static get _keyboardManager(): KeyboardManager<FreeTextEditor>;
    constructor(params: FreeTextEditorP);
    static initialize(l10n: IL10n, uiManager: AnnotationEditorUIManager): void;
    static updateDefaultParams(type: AnnotationEditorParamsType, value: number | string | boolean | undefined): void;
    updateParams(type: AnnotationEditorParamsType, value: number | string): void;
    static get defaultPropertiesToUpdate(): PropertyToUpdate[];
    get propertiesToUpdate(): PropertyToUpdate[];
    /**
     * Helper to translate the editor with the keyboard when it's empty.
     * @param x in page units.
     * @param y in page units.
     */
    _translateEmpty(x?: number, y?: number): void;
    getInitialTranslation(): dot2d_t;
    rebuild(): void;
    enableEditMode(): void;
    disableEditMode(): void;
    focusin(event: FocusEvent): void;
    onceAdded(): void;
    isEmpty(): boolean;
    remove(): void;
    /**
     * Commit the content we have in this editor.
     */
    commit(): void;
    shouldGetKeyboardEvents(): boolean;
    enterInEditMode(): void;
    /**
     * ondblclick callback.
     */
    dblclick(event: MouseEvent): void;
    /**
     * onkeydown callback.
     */
    keydown(event: KeyboardEvent): void;
    editorDivKeydown(event: KeyboardEvent): void;
    editorDivFocus(event: FocusEvent): void;
    editorDivBlur(event: FocusEvent): void;
    editorDivInput(event: Event): void;
    disableEditing(): void;
    enableEditing(): void;
    render(): HTMLDivElement;
    editorDivPaste(event: ClipboardEvent): void;
    get contentDiv(): HTMLDivElement;
    static deserialize(data: FreeTextEditorSerialized, parent: AnnotationEditorLayer, uiManager: AnnotationEditorUIManager): FreeTextEditor | undefined;
    /** @implement */
    serialize(isForCopying?: boolean): FreeTextEditorSerialized | undefined;
    renderAnnotationElement(annotation: AnnotationElement): HTMLElement;
    resetAnnotationElement(annotation: AnnotationElement): void;
}
//# sourceMappingURL=freetext.d.ts.map