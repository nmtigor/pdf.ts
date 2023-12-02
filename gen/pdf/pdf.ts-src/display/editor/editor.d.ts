import type { dim2d_t, dot2d_t, rect_t } from "../../../../lib/alias.js";
import type { IL10n } from "../../../pdf.ts-web/interfaces.js";
import type { AnnotationEditorType } from "../../shared/util.js";
import { AnnotationEditorParamsType } from "../../shared/util.js";
import type { AnnotStorageValue } from "../annotation_layer.js";
import type { AnnotationEditorLayer } from "./annotation_editor_layer.js";
import type { AddCommandsP } from "./tools.js";
import { AnnotationEditorUIManager, ColorManager, KeyboardManager } from "./tools.js";
export interface AnnotationEditorP {
    /**
     * the global manager
     */
    uiManager: AnnotationEditorUIManager;
    /**
     * the layer containing this editor
     */
    parent: AnnotationEditorLayer;
    /**
     * editor id
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
    name?: string;
    annotationElementId?: string;
    isCentered: boolean;
}
export type PropertyToUpdate = [AnnotationEditorParamsType, string | number];
type InitialOptions_ = {
    isCentered?: boolean;
};
export type AltTextData = {
    altText: string;
    decorative: boolean;
};
/**
 * Base class for editors.
 */
export declare abstract class AnnotationEditor {
    #private;
    static readonly _type: "freetext" | "ink" | "stamp";
    static readonly _editorType: AnnotationEditorType;
    static _l10nPromise: Map<string, Promise<string>> | undefined;
    static _borderLineWidth: number;
    static _colorManager: ColorManager;
    static _zIndex: number;
    parent: AnnotationEditorLayer | undefined;
    id: string;
    width?: number;
    height?: number;
    pageIndex: number;
    name: string | undefined;
    div?: HTMLDivElement;
    _uiManager: AnnotationEditorUIManager;
    _focusEventsAllowed: boolean;
    annotationElementId: string | undefined;
    _willKeepAspectRatio: boolean;
    _initialOptions: InitialOptions_;
    _structTreeParentId: string | undefined;
    isAttachedToDOM: boolean;
    deleted: boolean;
    rotation: number;
    pageRotation: number;
    pageDimensions: dim2d_t;
    pageTranslation: number[];
    x: number;
    y: number;
    startX: number;
    startY: number;
    static SMALL_EDITOR_SIZE: number;
    static get _resizerKeyboardManager(): KeyboardManager<AnnotationEditor | AnnotationEditorUIManager>;
    constructor(parameters: AnnotationEditorP);
    get editorType(): any;
    static get _defaultLineColor(): string;
    static deleteAnnotationElement(editor: AnnotationEditor): void;
    /**
     * Initialize the l10n stuff for this type of editor.
     */
    static initialize(l10n: IL10n, options?: {
        strings: [string] | [string, string];
    }): void;
    /**
     * Update the default parameters for this type of editor.
     * @param _type
     * @param _value
     */
    static updateDefaultParams(_type: AnnotationEditorParamsType, _value: number | string | undefined): void;
    /**
     * Get the default properties to set in the UI for this type of editor.
     */
    static get defaultPropertiesToUpdate(): PropertyToUpdate[];
    /**
     * Check if this kind of editor is able to handle the given mime type for
     * pasting.
     */
    static isHandlingMimeForPasting(mime: string): boolean;
    /**
     * Extract the data from the clipboard item and delegate the creation of the
     * editor to the parent.
     */
    static paste(item: DataTransferItem, parent: AnnotationEditorLayer): void;
    /**
     * Get the properties to update in the UI for this editor.
     */
    get propertiesToUpdate(): PropertyToUpdate[];
    get _isDraggable(): boolean;
    set _isDraggable(value: boolean);
    /**
     * @return true if the editor handles the Enter key itself.
     */
    get isEnterHandled(): boolean;
    center(): void;
    /**
     * Add some commands into the CommandManager (undo/redo stuff).
     */
    addCommands(params: AddCommandsP): void;
    get currentLayer(): AnnotationEditorLayer | undefined;
    /**
     * This editor will be behind the others.
     */
    setInBackground(): void;
    /**
     * This editor will be in the foreground.
     */
    setInForeground(): void;
    setParent(parent: AnnotationEditorLayer | undefined): void;
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
    addToAnnotationStorage(): void;
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
     * Translate the editor position within its page and adjust the scroll
     * in order to have the editor in the view.
     * @param x x-translation in page coordinates.
     * @param y y-translation in page coordinates.
     */
    translateInPage(x: number, y: number): void;
    drag(tx: number, ty: number): void;
    fixAndSetPosition(): void;
    /**
     * Convert a screen translation into a page one.
     */
    screenToPageTranslation(x: number, y: number): dot2d_t;
    /**
     * Convert a page translation into a screen one.
     */
    pageTranslationToScreen(x: number, y: number): dot2d_t;
    get parentScale(): number;
    get parentRotation(): number;
    get parentDimensions(): dot2d_t;
    /**
     * Set the dimensions of this editor.
     */
    setDims(width: number, height: number): void;
    fixDims(): void;
    /**
     * Get the translation used to position this editor when it's created.
     */
    getInitialTranslation(): dot2d_t;
    addAltTextButton(): Promise<void>;
    altTextFinish(): void;
    getClientDimensions(): DOMRect;
    get altTextData(): AltTextData;
    /**
     * Set the alt text data.
     */
    set altTextData({ altText, decorative }: AltTextData);
    /**
     * Render this editor in a div.
     */
    render(): HTMLDivElement;
    /**
     * Onpointerdown callback.
     */
    pointerdown(event: PointerEvent): void;
    moveInDOM(): void;
    _setParentAndPosition(parent: AnnotationEditorLayer, x: number, y: number): void;
    /**
     * Convert the current rect into a page one.
     */
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
     * If it returns true, then this editor handles the keyboard
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
    abstract serialize(isForCopying?: boolean, context?: Record<keyof any, any>): AnnotStorageValue | undefined;
    /**
     * Deserialize the editor.
     * The result of the deserialization is a new editor.
     */
    static deserialize(data: AnnotStorageValue, parent: AnnotationEditorLayer, uiManager: AnnotationEditorUIManager): AnnotationEditor | undefined;
    /**
     * Remove this editor.
     * It's used on ctrl+backspace action.
     */
    remove(): void;
    /**
     * @return true if this editor can be resized.
     */
    get isResizable(): boolean;
    /**
     * Add the resizers to this editor.
     */
    makeResizable(): void;
    /**
     * onkeydown callback.
     */
    keydown(event: KeyboardEvent): void;
    _resizeWithKeyboard(x?: number, y?: number): void;
    _stopResizingWithKeyboard(): void;
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
    updateParams(type: AnnotationEditorParamsType, value: number | string | undefined): void;
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
     * The editor is about to be edited.
     */
    enterInEditMode(): void;
    /**
     * @return the element requiring an alt text.
     */
    getImageForAltText(): HTMLCanvasElement | undefined;
    /**
     * Get the div which really contains the displayed content.
     */
    get contentDiv(): HTMLDivElement | undefined;
    /**
     * If true then the editor is currently edited.
     */
    get isEditing(): boolean;
    /**
     * When set to true, it means that this editor is currently edited.
     */
    set isEditing(value: boolean);
    /**
     * Set the aspect ratio to use when resizing.
     */
    setAspectRatio(width: number, height: number): void;
    static get MIN_SIZE(): number;
}
export {};
//# sourceMappingURL=editor.d.ts.map