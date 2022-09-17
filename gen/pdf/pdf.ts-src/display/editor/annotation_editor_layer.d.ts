/** @typedef {import("./editor.js").AnnotationEditor} AnnotationEditor */
/** @typedef {import("./tools.js").AnnotationEditorUIManager} AnnotationEditorUIManager */
/** @typedef {import("../annotation_storage.js").AnnotationStorage} AnnotationStorage */
/** @typedef {import("../../web/interfaces").IL10n} IL10n */
import { IL10n } from "../../../pdf.ts-web/interfaces.js";
import { AnnotationEditorType } from "../../shared/util.js";
import { AnnotationStorage } from "../annotation_storage.js";
import { PageViewport } from "../display_utils.js";
import { AnnotationEditor, AnnotationEditorSerialized } from "./editor.js";
import { AddCommandsP, AnnotationEditorUIManager } from "./tools.js";
interface AnnotationEditorLayerOptions {
    mode?: unknown;
    div: HTMLDivElement;
    uiManager: AnnotationEditorUIManager;
    enabled?: boolean;
    annotationStorage: AnnotationStorage;
    pageIndex: number;
    l10n: IL10n;
    viewport: PageViewport;
}
interface _AnnotationEditorLayerRenderP {
    viewport: PageViewport;
}
/**
 * Manage all the different editors on a page.
 */
export declare class AnnotationEditorLayer {
    #private;
    static _initialized: boolean;
    annotationStorage: AnnotationStorage;
    pageIndex: number;
    div: HTMLDivElement | undefined;
    viewport: PageViewport;
    isMultipleSelection?: boolean;
    constructor(options: AnnotationEditorLayerOptions);
    get textLayerElements(): HTMLElement[] | undefined;
    /**
     * Update the toolbar if it's required to reflect the tool currently used.
     */
    updateToolbar(mode: AnnotationEditorType): void;
    /**
     * The mode has changed: it must be updated.
     */
    updateMode(mode?: AnnotationEditorType): void;
    addInkEditorIfNeeded(isCommitting: boolean): void;
    /**
     * Set the editing state.
     */
    setEditingState(isEditing: boolean): void;
    /**
     * Add some commands into the CommandManager (undo/redo stuff).
     */
    addCommands(params: AddCommandsP): void;
    /**
     * Enable pointer events on the main div in order to enable
     * editor creation.
     */
    enable(): void;
    /**
     * Disable editor creation.
     */
    disable(): void;
    /**
     * Set the current editor.
     */
    setActiveEditor(editor: AnnotationEditor | undefined): void;
    enableClick(): void;
    disableClick(): void;
    attach(editor: AnnotationEditor): void;
    detach(editor: AnnotationEditor): void;
    /**
     * Remove an editor.
     */
    remove(editor: AnnotationEditor): void;
    /**
     * Function called when the text layer has finished rendering.
     */
    onTextLayerRendered(): void;
    /**
     * Remove an aria-owns id from a node in the text layer.
     */
    removePointerInTextLayer(editor: AnnotationEditor): void;
    /**
     * Find the text node which is the nearest and add an aria-owns attribute
     * in order to correctly position this editor in the text flow.
     */
    addPointerInTextLayer(editor: AnnotationEditor): void;
    /**
     * Move a div in the DOM in order to respect the visual order.
     */
    moveDivInDOM(editor: AnnotationEditor): void;
    /**
     * Add a new editor in the current view.
     */
    add(editor: AnnotationEditor): void;
    /**
     * Add an editor in the annotation storage.
     */
    addToAnnotationStorage(editor: AnnotationEditor): void;
    /**
     * Add or rebuild depending if it has been removed or not.
     */
    addOrRebuild(editor: AnnotationEditor): void;
    /**
     * Add a new editor and make this addition undoable.
     */
    addANewEditor(editor: AnnotationEditor): void;
    /**
     * Add a new editor and make this addition undoable.
     */
    addUndoableEditor(editor: AnnotationEditor): void;
    /**
     * Get an id for an editor.
     */
    getNextId(): string;
    /**
     * Create a new editor
     */
    deserialize(data: AnnotationEditorSerialized): AnnotationEditor | undefined;
    /**
     * Set the last selected editor.
     */
    setSelected(editor: AnnotationEditor): void;
    /**
     * Add or remove an editor the current selection.
     */
    toggleSelected(editor: AnnotationEditor): void;
    /**
     * Check if the editor is selected.
     */
    isSelected(editor: AnnotationEditor): boolean;
    /**
     * Unselect an editor.
     */
    unselect(editor: AnnotationEditor): void;
    /**
     * Pointerup callback.
     */
    pointerup(event: PointerEvent): void;
    /**
     * Pointerdown callback.
     */
    pointerdown(event: PointerEvent): void;
    /**
     * Drag callback.
     */
    drop(event: DragEvent): void;
    /**
     * Dragover callback.
     */
    dragover(event: DragEvent): void;
    /**
     * Destroy the main editor.
     */
    destroy(): void;
    /**
     * Render the main editor.
     */
    render(parameters: _AnnotationEditorLayerRenderP): void;
    /**
     * Update the main editor.
     */
    update(parameters: _AnnotationEditorLayerRenderP): void;
    /**
     * Get the scale factor from the viewport.
     */
    get scaleFactor(): number;
    /**
     * Get page dimensions.
     * @return dimensions.
     */
    get pageDimensions(): [number, number];
    get viewportBaseDimensions(): number[];
    /**
     * Set the dimensions of the main div.
     */
    setDimensions(): void;
}
export {};
//# sourceMappingURL=annotation_editor_layer.d.ts.map