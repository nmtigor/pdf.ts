import { RGB } from "../../shared/scripting_utils.js";
import { AnnotationEditorParamsType, AnnotationEditorType, rect_t } from "../../shared/util.js";
import { AnnotationEditorLayer } from "./annotation_editor_layer.js";
import { ColorManager } from "./tools.js";
export interface AnnotationEditorP {
    /**
     * the layer containing this editor
     */
    parent: AnnotationEditorLayer;
    /**
     * editor if
     */
    id: string;
    /**
     * x-coordinate
     */
    x: number;
    /**
     * y-coordinate
     */
    y: number;
}
export interface AnnotationEditorSerialized {
    annotationType: AnnotationEditorType;
    color: RGB;
    pageIndex: number;
    rect: rect_t;
    rotation: number;
}
export type PropertyToUpdate = [AnnotationEditorParamsType, string | number];
/**
 * Base class for editors.
 */
export declare abstract class AnnotationEditor {
    #private;
    static readonly _type: "freetext" | "ink";
    static _colorManager: ColorManager;
    static _zIndex: number;
    parent: AnnotationEditorLayer;
    id: string;
    width?: number;
    height?: number;
    pageIndex: number;
    name: string;
    div?: HTMLDivElement;
    x: number;
    y: number;
    rotation: number;
    isAttachedToDOM: boolean;
    startX: number;
    startY: number;
    constructor(parameters: AnnotationEditorP & {
        name: string;
    });
    static get _defaultLineColor(): string;
    /**
     * This editor will be behind the others.
     */
    setInBackground(): void;
    /**
     * This editor will be in the foreground.
     */
    setInForeground(): void;
    /**
     * onfocus callback.
     */
    focusin(event: FocusEvent): void;
    /**
     * onblur callback.
     */
    focusout(event: FocusEvent): void;
    commitOrRemove(): void;
    /**
     * Commit the data contained in this editor.
     */
    commit(): void;
    /**
     * We use drag-and-drop in order to move an editor on a page.
     */
    dragstart(event: DragEvent): void;
    /**
     * Set the editor position within its parent.
     * @param tx x-translation in screen coordinates.
     * @param ty y-translation in screen coordinates.
     */
    setAt(x: number, y: number, tx: number, ty: number): void;
    /**
     * Translate the editor position within its parent.
     * @param x x-translation in screen coordinates.
     * @param y y-translation in screen coordinates.
     */
    translate(x: number, y: number): void;
    /**
     * Convert a screen translation into a page one.
     */
    screenToPageTranslation(x: number, y: number): number[];
    /**
     * Set the dimensions of this editor.
     */
    setDims(width: number, height: number): void;
    fixDims(): void;
    /**
     * Get the translation used to position this editor when it's created.
     */
    getInitialTranslation(): number[];
    /**
     * Render this editor in a div.
     */
    render(): HTMLDivElement;
    /**
     * Onpointerdown callback.
     */
    pointerdown(event: PointerEvent): void;
    getRect(tx: number, ty: number): rect_t;
    getRectInCurrentCoords(rect: rect_t, pageHeight: number): number[];
    /**
     * Executed once this editor has been rendered.
     */
    onceAdded(): void;
    /**
     * Check if the editor contains something.
     */
    isEmpty(): boolean;
    /**
     * Enable edit mode.
     */
    enableEditMode(): void;
    /**
     * Disable edit mode.
     */
    disableEditMode(): void;
    /**
     * Check if the editor is edited.
     */
    isInEditMode(): boolean;
    /**
     * If it returns true, then this editor handle the keyboard
     * events itself.
     */
    shouldGetKeyboardEvents(): boolean;
    /**
     * Check if this editor needs to be rebuilt or not.
     */
    needsToBeRebuilt(): boolean | undefined;
    /**
     * Rebuild the editor in case it has been removed on undo.
     *
     * To implement in subclasses.
     */
    rebuild(): void;
    /**
     * Serialize the editor.
     * The result of the serialization will be used to construct a
     * new annotation to add to the pdf document.
     *
     * To implement in subclasses.
     */
    abstract serialize(): AnnotationEditorSerialized | undefined;
    /**
     * Deserialize the editor.
     * The result of the deserialization is a new editor.
     */
    static deserialize(data: AnnotationEditorSerialized, parent: AnnotationEditorLayer): AnnotationEditor;
    /**
     * Remove this editor.
     * It's used on ctrl+backspace action.
     */
    remove(): void;
    /**
     * Select this editor.
     */
    select(): void;
    /**
     * Unselect this editor.
     */
    unselect(): void;
    /**
     * Update some parameters which have been changed through the UI.
     */
    updateParams(type: AnnotationEditorParamsType, value: number | string): void;
    /**
     * When the user disables the editing mode some editors can change some of
     * their properties.
     */
    disableEditing(): void;
    /**
     * When the user enables the editing mode some editors can change some of
     * their properties.
     */
    enableEditing(): void;
    /**
     * Get some properties to update in the UI.
     */
    get propertiesToUpdate(): PropertyToUpdate[];
    /**
     * Get the div which really contains the displayed content.
     */
    get contentDiv(): HTMLDivElement | undefined;
    /**
     * If true then the editor is currently edited.
     * @type {boolean}
     */
    get isEditing(): boolean;
    /**
     * When set to true, it means that this editor is currently edited.
     * @param {boolean} value
     */
    set isEditing(value: boolean);
}
//# sourceMappingURL=editor.d.ts.map