import type { rgb_t } from "../../../../lib/color/alias.js";
import type { AltTextManager } from "../../../pdf.ts-web/alt_text_manager.js";
import type { EventBus, EventMap } from "../../../pdf.ts-web/event_utils.js";
import type { PageColors } from "../../../pdf.ts-web/pdf_viewer.js";
import { AnnotationEditorType } from "../../shared/util.js";
import type { PDFDocumentProxy } from "../api.js";
import type { AnnotationEditorLayer } from "./annotation_editor_layer.js";
import type { AnnotationEditor } from "./editor.js";
import { FreeTextEditor } from "./freetext.js";
import { InkEditor } from "./ink.js";
import { StampEditor } from "./stamp.js";
export declare function bindEvents<T extends AnnotationEditor | AnnotationEditorLayer>(obj: T, element: HTMLElement, names: (keyof HTMLElementEventMap & keyof T)[]): void;
/**
 * Convert a number between 0 and 100 into an hex number between 0 and 255.
 */
export declare function opacityToHex(opacity: number): string;
export type BitmapData = {
    bitmap?: HTMLImageElement | ImageBitmap | undefined;
    id: `image_${string}_${number}`;
    refCounter: number;
    isSvg: boolean;
    svgUrl: string;
    url: string;
    file?: File;
};
/**
 * Class to manage the images used by the editors.
 * The main idea is to try to minimize the memory used by the images.
 * The images are cached and reused when possible
 * We use a refCounter to know when an image is not used anymore but we need to
 * be able to restore an image after a remove+undo, so we keep a file reference
 * or an url one.
 */
declare class ImageManager {
    #private;
    static get _isSVGFittingCanvas(): Promise<boolean>;
    getFromFile(file: File): Promise<BitmapData | undefined>;
    getFromUrl(url: string): Promise<BitmapData | undefined>;
    getFromId(id: string): Promise<BitmapData | undefined>;
    getSvgUrl(id: string): string | undefined;
    deleteId(id: string): void;
    isValidId(id: string): boolean;
}
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
type KeyboardCallback_ = (translateX?: number, translateY?: number, noCommit?: boolean) => void;
type KeyboardCallbackOptions_<S extends AnnotationEditorUIManager | FreeTextEditor> = {
    bubbles?: boolean;
    args?: [number?, number?, boolean?];
    checker?: (self: S, event?: unknown) => boolean | undefined;
};
/**
 * Class to handle the different keyboards shortcuts we can have on mac or
 * non-mac OSes.
 */
export declare class KeyboardManager<S extends AnnotationEditorUIManager | FreeTextEditor> {
    #private;
    buffer: string[];
    callbacks: Map<string, {
        callback: KeyboardCallback_;
        options: KeyboardCallbackOptions_<S>;
    }>;
    allKeys: Set<string>;
    /**
     * Create a new keyboard manager class.
     * @param callbacks an array containing an array of shortcuts
     * and a callback to call.
     * A shortcut is a string like `ctrl+c` or `mac+ctrl+c` for mac OS.
     */
    constructor(callbacks: [string[], KeyboardCallback_, KeyboardCallbackOptions_<S>?][]);
    /**
     * Execute a callback, if any, for a given keyboard event.
     * The self is used as `this` in the callback.
     */
    exec(self: S, event: KeyboardEvent): void;
}
export declare class ColorManager {
    static _colorsMapping: Map<string, rgb_t>;
    get _colors(): Map<string, rgb_t>;
    /**
     * In High Contrast Mode, the color on the screen is not always the
     * real color used in the pdf.
     * For example in some cases white can appear to be black but when saving
     * we want to have white.
     */
    convert(color: string): rgb_t;
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
    /**
     * Get the current active editor.
     */
    getActive(): AnnotationEditor | undefined;
    get currentPageIndex(): number;
    _eventBus: EventBus;
    /**
     * Get an id.
     */
    getId(): string;
    /**
     * Get the current editor mode.
     */
    getMode(): AnnotationEditorType;
    get hasSelection(): boolean;
    viewParameters: {
        realScale: number;
        rotation: number;
    };
    static TRANSLATE_SMALL: number;
    static TRANSLATE_BIG: number;
    static get _keyboardManager(): KeyboardManager<AnnotationEditorUIManager>;
    constructor(container: HTMLDivElement, viewer: HTMLDivElement, altTextManager: AltTextManager | undefined, eventBus: EventBus, pdfDocument: PDFDocumentProxy, pageColors: PageColors | undefined);
    destroy(): void;
    get hcmFilter(): string;
    get direction(): string;
    editAltText(editor: AnnotationEditor): void;
    onPageChanging({ pageNumber }: EventMap["pagechanging"]): void;
    focusMainContainer(): void;
    findParent(x: number, y: number): AnnotationEditorLayer | undefined;
    disableUserSelect(value?: boolean): void;
    addShouldRescale(editor: InkEditor): void;
    removeShouldRescale(editor: InkEditor): void;
    onScaleChanging({ scale }: EventMap["scalechanging"]): void;
    onRotationChanging({ pagesRotation }: EventMap["rotationchanging"]): void;
    /**
     * Add an editor in the annotation storage.
     */
    addToAnnotationStorage(editor: AnnotationEditor): void;
    blur(): void;
    focus(): void;
    addEditListeners(): void;
    removeEditListeners(): void;
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
    registerEditorTypes(types: (typeof InkEditor | typeof FreeTextEditor | typeof StampEditor)[]): void;
    get currentLayer(): AnnotationEditorLayer | undefined;
    getLayer(pageIndex: number): AnnotationEditorLayer | undefined;
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
    updateMode(mode: number, editId?: string | undefined): void;
    /**
     * Update the toolbar if it's required to reflect the tool currently used.
     */
    updateToolbar(mode: AnnotationEditorType): void;
    /**
     * Update a parameter in the current editor or globally.
     */
    updateParams(type: number, value: string | number | undefined): void;
    enableWaiting(mustWait?: boolean): void;
    /**
     * Get all the editors belonging to a given page.
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
     * The annotation element with the given id has been deleted.
     */
    addDeletedAnnotationElement(editor: AnnotationEditor): void;
    /**
     * Check if the annotation element with the given id has been deleted.
     */
    isDeletedAnnotationElement(annotationElementId: string): boolean;
    /**
     * The annotation element with the given id have been restored.
     */
    removeDeletedAnnotationElement(editor: AnnotationEditor): void;
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
    hasSomethingToControl(): boolean;
    /**
     * Select all the editors.
     */
    selectAll(): void;
    /**
     * Unselect all the selected editors.
     */
    unselectAll(): void;
    translateSelectedEditors(x?: number, y?: number, noCommit?: boolean): void;
    /**
     * Set up the drag session for moving the selected editors.
     */
    setUpDragSession(): void;
    /**
     * Ends the drag session.
     * @return true if at least one editor has been moved.
     */
    endDragSession(): boolean;
    /**
     * Drag the set of selected editors.
     */
    dragSelectedEditors(tx: number, ty: number): void;
    /**
     * Rebuild the editor (usually on undo/redo actions) on a potentially
     * non-rendered page.
     */
    rebuild(editor: AnnotationEditor): void;
    /**
     * Is the current editor the one passed as argument?
     */
    isActive(editor: AnnotationEditor): boolean;
    get imageManager(): ImageManager;
}
export {};
//# sourceMappingURL=tools.d.ts.map