import { IL10n } from "../../../pdf.ts-web/interfaces.js";
import { AnnotationEditorParamsType } from "../../shared/util.js";
import { AnnotationEditorLayer } from "./annotation_editor_layer.js";
import { AnnotationEditor, AnnotationEditorP, AnnotationEditorSerialized, PropertyToUpdate } from "./editor.js";
import { KeyboardManager } from "./tools.js";
export interface FreeTextEditorP extends AnnotationEditorP {
    name: "freeTextEditor";
    color?: string;
    fontSize?: number;
}
export interface FreeTextEditorSerialized extends AnnotationEditorSerialized {
    fontSize: number;
    value: string;
}
/**
 * Basic text editor in order to create a FreeTex annotation.
 */
export declare class FreeTextEditor extends AnnotationEditor {
    #private;
    static _freeTextDefaultContent: string;
    static _l10nPromise: Map<string, Promise<string>>;
    static _internalPadding: number;
    static _defaultColor: string | undefined;
    static _defaultFontSize: number;
    static _keyboardManager: KeyboardManager;
    static readonly _type = "freetext";
    overlayDiv: HTMLDivElement;
    editorDiv: HTMLDivElement;
    constructor(params: FreeTextEditorP);
    static initialize(l10n: IL10n): void;
    static updateDefaultParams(type: AnnotationEditorParamsType, value: number | string): void;
    /** @inheritdoc */
    updateParams(type: AnnotationEditorParamsType, value: number | string): void;
    static get defaultPropertiesToUpdate(): PropertyToUpdate[];
    get propertiesToUpdate(): PropertyToUpdate[];
    /** @inheritdoc */
    getInitialTranslation(): number[];
    /** @inheritdoc */
    rebuild(): void;
    /** @inheritdoc */
    enableEditMode(): void;
    /** @inheritdoc */
    disableEditMode(): void;
    /** @inheritdoc */
    focusin(event: FocusEvent): void;
    /** @inheritdoc */
    onceAdded(): void;
    /** @inheritdoc */
    isEmpty(): boolean;
    /** @inheritdoc */
    remove(): void;
    /**
     * Commit the content we have in this editor.
     */
    commit(): void;
    /** @inheritdoc */
    shouldGetKeyboardEvents(): boolean;
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
    /** @inheritdoc */
    disableEditing(): void;
    /** @inheritdoc */
    enableEditing(): void;
    /** @inheritdoc */
    render(): HTMLDivElement;
    get contentDiv(): HTMLDivElement;
    /** @inheritdoc */
    static deserialize(data: FreeTextEditorSerialized, parent: AnnotationEditorLayer): FreeTextEditor;
    /**
     * @inheritdoc
     * @implement
     */
    serialize(): FreeTextEditorSerialized | undefined;
}
//# sourceMappingURL=freetext.d.ts.map