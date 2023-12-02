import type { IL10n } from "../../../pdf.ts-web/interfaces.js";
import type { TextAccessibilityManager } from "../../../pdf.ts-web/text_accessibility.js";
import { AnnotationEditorType } from "../../shared/util.js";
import type { AnnotationLayer, AnnotStorageValue } from "../annotation_layer.js";
import { type PageViewport } from "../display_utils.js";
import { AnnotationEditor } from "./editor.js";
import type { AddCommandsP, AnnotationEditorUIManager } from "./tools.js";
interface AnnotationEditorLayerOptions {
    mode?: unknown;
    div: HTMLDivElement;
    uiManager: AnnotationEditorUIManager;
    enabled?: boolean;
    accessibilityManager?: TextAccessibilityManager | undefined;
    pageIndex: number;
    l10n: IL10n;
    annotationLayer?: AnnotationLayer | undefined;
    viewport: PageViewport;
}
interface RenderEditorLayerOptions {
    viewport: PageViewport;
}
type PasteEditorP_ = {
    bitmapFile: File | null;
};
/**
 * Manage all the different editors on a page.
 */
export declare class AnnotationEditorLayer {
    #private;
    static _initialized: boolean;
    pageIndex: number;
    div: HTMLDivElement | undefined;
    viewport: PageViewport;
    isMultipleSelection?: boolean;
    constructor({ uiManager, pageIndex, div, accessibilityManager, annotationLayer, viewport, l10n, }: AnnotationEditorLayerOptions);
    get isEmpty(): boolean;
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
    togglePointerEvents(enabled?: boolean): void;
    /**
     * Enable pointer events on the main div in order to enable
     * editor creation.
     */
    enable(): void;
    /**
     * Disable editor creation.
     */
    disable(): void;
    getEditableAnnotation(id: string): import("../annotation_layer.js").AnnotationElement | undefined;
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
     * An editor can have a different parent, for example after having
     * being dragged and droped from a page to another.
     */
    changeParent(editor: AnnotationEditor): void;
    /**
     * Add a new editor in the current view.
     */
    add(editor: AnnotationEditor): void;
    moveEditorInDOM(editor: AnnotationEditor): void;
    /**
     * Add or rebuild depending if it has been removed or not.
     */
    addOrRebuild(editor: AnnotationEditor): void;
    /**
     * Add a new editor and make this addition undoable.
     */
    addUndoableEditor(editor: AnnotationEditor): void;
    /**
     * Get an id for an editor.
     */
    getNextId(): string;
    /**
     * Paste some content into a new editor.
     */
    pasteEditor(mode: number, params: PasteEditorP_): void;
    /**
     * Create a new editor
     */
    deserialize(data: AnnotStorageValue): AnnotationEditor | undefined;
    /**
     * Create and add a new editor.
     */
    addNewEditor(): void;
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
    findNewParent(editor: AnnotationEditor, x: number, y: number): boolean;
    /**
     * Destroy the main editor.
     */
    destroy(): void;
    /**
     * Render the main editor.
     */
    render({ viewport }: RenderEditorLayerOptions): void;
    /**
     * Update the main editor.
     */
    update({ viewport }: RenderEditorLayerOptions): void;
    /**
     * Get page dimensions.
     * @return dimensions.
     */
    get pageDimensions(): [number, number];
    get viewportBaseDimensions(): number[];
}
export {};
//# sourceMappingURL=annotation_editor_layer.d.ts.map