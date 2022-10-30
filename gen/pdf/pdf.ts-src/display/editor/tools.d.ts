import { EventBus, EventMap } from "../../../pdf.ts-web/event_utils.js";
import { RGB } from "../../shared/scripting_utils.js";
import { AnnotationEditorType } from "../../shared/util.js";
import { AnnotationEditorLayer } from "./annotation_editor_layer.js";
import { AnnotationEditor } from "./editor.js";
import { FreeTextEditor } from "./freetext.js";
import { InkEditor } from "./ink.js";
export declare function bindEvents<T extends AnnotationEditor | AnnotationEditorLayer>(obj: T, element: HTMLElement, names: (keyof HTMLElementEventMap & keyof T)[]): void;
/**
 * Convert a number between 0 and 100 into an hex number between 0 and 255.
 */
export declare function opacityToHex(opacity: number): string;
export interface AddCommandsP {
    cmd: () => void;
    undo: () => void;
    mustExec?: boolean;
    type?: number;
    overwriteIfSameType?: boolean;
    keepUndo?: boolean;
}
/**
 * Class to handle undo/redo.
 * Commands are just saved in a buffer.
 * If we hit some memory issues we could likely use a circular buffer.
 * It has to be used as a singleton.
 */
export declare class CommandManager {
    #private;
    constructor(maxSize?: number);
    /**
     * Add a new couple of commands to be used in case of redo/undo.
     */
    add({ cmd, undo, mustExec, type, overwriteIfSameType, keepUndo, }: AddCommandsP): void;
    /**
     * Undo the last command.
     */
    undo(): void;
    /**
     * Redo the last command.
     */
    redo(): void;
    /**
     * Check if there is something to undo.
     */
    hasSomethingToUndo(): boolean;
    /**
     * Check if there is something to redo.
     */
    hasSomethingToRedo(): boolean;
    destroy(): void;
}
/**
 * Class to handle the different keyboards shortcuts we can have on mac or
 * non-mac OSes.
 */
export declare class KeyboardManager {
    #private;
    buffer: string[];
    callbacks: Map<string, () => void>;
    allKeys: Set<string>;
    /**
     * Create a new keyboard manager class.
     * @param callbacks an array containing an array of shortcuts
     * and a callback to call.
     * A shortcut is a string like `ctrl+c` or `mac+ctrl+c` for mac OS.
     */
    constructor(callbacks: [string[], () => void][]);
    static get platform(): {
        isWin: boolean;
        isMac: boolean;
    };
    /**
     * Execute a callback, if any, for a given keyboard event.
     * The self is used as `this` in the callback.
     * @returns
     */
    exec(self: unknown, event: KeyboardEvent): void;
}
export declare class ColorManager {
    static _colorsMapping: Map<string, [number, number, number]>;
    get _colors(): Map<string, RGB>;
    /**
     * In High Contrast Mode, the color on the screen is not always the
     * real color used in the pdf.
     * For example in some cases white can appear to be black but when saving
     * we want to have white.
     */
    convert(color: string): RGB;
    /**
     * An input element must have its color value as a hex string
     * and not as color name.
     * So this function converts a name into an hex string.
     */
    getHexCode(name: string): string;
}
export interface DispatchUpdateStatesP {
    isEditing?: boolean;
    isEmpty?: boolean;
    hasSomethingToUndo?: boolean;
    hasSomethingToRedo?: boolean;
    hasSelectedEditor?: boolean;
    hasEmptyClipboard?: boolean;
}
/**
 * A pdf has several pages and each of them when it will rendered
 * will have an AnnotationEditorLayer which will contain the some
 * new Annotations associated to an editor in order to modify them.
 *
 * This class is used to manage all the different layers, editors and
 * some action like copy/paste, undo/redo, ...
 */
export declare class AnnotationEditorUIManager {
    #private;
    static _keyboardManager: KeyboardManager;
    /**
     * Get the current active editor.
     */
    getActive(): AnnotationEditor | undefined;
    /**
     * Get the current editor mode.
     */
    getMode(): AnnotationEditorType;
    constructor(container: HTMLDivElement, eventBus: EventBus);
    destroy(): void;
    onPageChanging({ pageNumber }: EventMap["pagechanging"]): void;
    focusMainContainer(): void;
    /**
     * Copy callback.
     */
    copy(event: ClipboardEvent): void;
    /**
     * Cut callback.
     */
    cut(event: ClipboardEvent): void;
    /**
     * Paste callback.
     */
    paste(event: ClipboardEvent): void;
    /**
     * Keydown callback.
     */
    keydown(event: KeyboardEvent): void;
    /**
     * Execute an action for a given name.
     * For example, the user can click on the "Undo" entry in the context menu
     * and it'll trigger the undo action.
     */
    onEditingAction(details: {
        name: string;
    }): void;
    /**
     * Set the editing state.
     * It can be useful to temporarily disable it when the user is editing a
     * FreeText annotation.
     */
    setEditingState(isEditing: boolean): void;
    registerEditorTypes(types: (typeof InkEditor | typeof FreeTextEditor)[]): void;
    /**
     * Get an id.
     */
    getId(): string;
    /**
     * Add a new layer for a page which will contains the editors.
     */
    addLayer(layer: AnnotationEditorLayer): void;
    /**
     * Remove a layer.
     */
    removeLayer(layer: AnnotationEditorLayer): void;
    /**
     * Change the editor mode (None, FreeText, Ink, ...)
     */
    updateMode(mode: number): void;
    /**
     * Update the toolbar if it's required to reflect the tool currently used.
     */
    updateToolbar(mode: AnnotationEditorType): void;
    /**
     * Update a parameter in the current editor or globally.
     */
    updateParams(type: number, value: string | number): void;
    /**
     * Get all the editors belonging to a give page.
     */
    getEditors(pageIndex: number): AnnotationEditor[];
    /**
     * Get an editor with the given id.
     */
    getEditor(id: string): AnnotationEditor | undefined;
    /**
     * Add a new editor.
     */
    addEditor(editor: AnnotationEditor): void;
    /**
     * Remove an editor.
     */
    removeEditor(editor: AnnotationEditor): void;
    /**
     * Set the given editor as the active one.
     */
    setActiveEditor(editor: AnnotationEditor | undefined): void;
    /**
     * Add or remove an editor the current selection.
     */
    toggleSelected(editor: AnnotationEditor): void;
    /**
     * Set the last selected editor.
     */
    setSelected(editor: AnnotationEditor): void;
    /**
     * Check if the editor is selected.
     */
    isSelected(editor: AnnotationEditor): boolean;
    /**
     * Unselect an editor.
     */
    unselect(editor: AnnotationEditor): void;
    get hasSelection(): boolean;
    /**
     * Undo the last command.
     */
    undo(): void;
    /**
     * Redo the last undoed command.
     */
    redo(): void;
    /**
     * Add a command to execute (cmd) and another one to undo it.
     */
    addCommands(params: AddCommandsP): void;
    /**
     * Delete the current editor or all.
     */
    delete(): void;
    commitOrRemove(): void;
    /**
     * Select all the editors.
     */
    selectAll(): void;
    /**
     * Unselect all the selected editors.
     */
    unselectAll(): void;
    /**
     * Is the current editor the one passed as argument?
     */
    isActive(editor: AnnotationEditor): boolean;
}
//# sourceMappingURL=tools.d.ts.map