/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { AnnotationEditorType } from "../../shared/util.js";
import { FreeTextEditor, } from "./freetext.js";
import { InkEditor } from "./ink.js";
import { bindEvents, KeyboardManager, } from "./tools.js";
/**
 * Manage all the different editors on a page.
 */
export class AnnotationEditorLayer {
    static _initialized = false;
    #accessibilityManager;
    #allowClick = false;
    #boundPointerup = this.pointerup.bind(this);
    #boundPointerdown = this.pointerdown.bind(this);
    #editors = new Map();
    #hadPointerDown = false;
    #isCleaningUp = false;
    // #textLayerMap = new WeakMap<HTMLElement, HTMLElement[]>();
    // #textNodes = new Map<string, HTMLElement>();
    #uiManager;
    // #waitingEditors = new Set<AnnotationEditor>();
    annotationStorage;
    pageIndex;
    div;
    viewport;
    isMultipleSelection;
    constructor(options) {
        if (!AnnotationEditorLayer._initialized) {
            AnnotationEditorLayer._initialized = true;
            FreeTextEditor.initialize(options.l10n);
            InkEditor.initialize(options.l10n);
            options.uiManager.registerEditorTypes([FreeTextEditor, InkEditor]);
        }
        this.#uiManager = options.uiManager;
        this.annotationStorage = options.annotationStorage;
        this.pageIndex = options.pageIndex;
        this.div = options.div;
        this.#accessibilityManager = options.accessibilityManager;
        this.#uiManager.addLayer(this);
    }
    /**
     * Update the toolbar if it's required to reflect the tool currently used.
     */
    updateToolbar(mode) {
        this.#uiManager.updateToolbar(mode);
    }
    /**
     * The mode has changed: it must be updated.
     */
    updateMode(mode = this.#uiManager.getMode()) {
        this.#cleanup();
        if (mode === AnnotationEditorType.INK) {
            // We always want to an ink editor ready to draw in.
            this.addInkEditorIfNeeded(false);
            this.disableClick();
        }
        else {
            this.enableClick();
        }
        this.#uiManager.unselectAll();
        this.div.classList.toggle("freeTextEditing", mode === AnnotationEditorType.FREETEXT);
        this.div.classList.toggle("inkEditing", mode === AnnotationEditorType.INK);
    }
    addInkEditorIfNeeded(isCommitting) {
        if (!isCommitting &&
            this.#uiManager.getMode() !== AnnotationEditorType.INK) {
            return;
        }
        if (!isCommitting) {
            // We're removing an editor but an empty one can already exist so in this
            // case we don't need to create a new one.
            for (const editor of this.#editors.values()) {
                if (editor.isEmpty()) {
                    editor.setInBackground();
                    return;
                }
            }
        }
        const editor = this.#createAndAddNewEditor({ offsetX: 0, offsetY: 0 });
        editor.setInBackground();
    }
    /**
     * Set the editing state.
     */
    setEditingState(isEditing) {
        this.#uiManager.setEditingState(isEditing);
    }
    /**
     * Add some commands into the CommandManager (undo/redo stuff).
     */
    addCommands(params) {
        this.#uiManager.addCommands(params);
    }
    /**
     * Enable pointer events on the main div in order to enable
     * editor creation.
     */
    enable() {
        this.div.style.pointerEvents = "auto";
        for (const editor of this.#editors.values()) {
            editor.enableEditing();
        }
    }
    /**
     * Disable editor creation.
     */
    disable() {
        this.div.style.pointerEvents = "none";
        for (const editor of this.#editors.values()) {
            editor.disableEditing();
        }
    }
    /**
     * Set the current editor.
     */
    setActiveEditor(editor) {
        const currentActive = this.#uiManager.getActive();
        if (currentActive === editor) {
            return;
        }
        this.#uiManager.setActiveEditor(editor);
    }
    enableClick() {
        this.div.addEventListener("pointerdown", this.#boundPointerdown);
        this.div.addEventListener("pointerup", this.#boundPointerup);
    }
    disableClick() {
        this.div.removeEventListener("pointerdown", this.#boundPointerdown);
        this.div.removeEventListener("pointerup", this.#boundPointerup);
    }
    attach(editor) {
        this.#editors.set(editor.id, editor);
    }
    detach(editor) {
        this.#editors.delete(editor.id);
        this.#accessibilityManager?.removePointerInTextLayer(editor.contentDiv);
    }
    /**
     * Remove an editor.
     */
    remove(editor) {
        // Since we can undo a removal we need to keep the
        // parent property as it is, so don't null it!
        this.#uiManager.removeEditor(editor);
        this.detach(editor);
        this.annotationStorage.remove(editor.id);
        editor.div.style.display = "none";
        setTimeout(() => {
            // When the div is removed from DOM the focus can move on the
            // document.body, so we just slightly postpone the removal in
            // order to let an element potentially grab the focus before
            // the body.
            editor.div.style.display = "";
            editor.div.remove();
            editor.isAttachedToDOM = false;
            if (document.activeElement === document.body) {
                this.#uiManager.focusMainContainer();
            }
        }, 0);
        if (!this.#isCleaningUp) {
            this.addInkEditorIfNeeded(/* isCommitting = */ false);
        }
    }
    /**
     * An editor can have a different parent, for example after having
     * being dragged and droped from a page to another.
     */
    #changeParent(editor) {
        if (editor.parent === this) {
            return;
        }
        this.attach(editor);
        editor.pageIndex = this.pageIndex;
        editor.parent?.detach(editor);
        editor.parent = this;
        if (editor.div && editor.isAttachedToDOM) {
            editor.div.remove();
            this.div.append(editor.div);
        }
    }
    /**
     * Add a new editor in the current view.
     */
    add(editor) {
        this.#changeParent(editor);
        this.#uiManager.addEditor(editor);
        this.attach(editor);
        if (!editor.isAttachedToDOM) {
            const div = editor.render();
            this.div.append(div);
            editor.isAttachedToDOM = true;
        }
        this.moveEditorInDOM(editor);
        editor.onceAdded();
        this.addToAnnotationStorage(editor);
    }
    moveEditorInDOM(editor) {
        this.#accessibilityManager?.moveElementInDOM(this.div, editor.div, editor.contentDiv, 
        /* isRemovable = */ true);
    }
    /**
     * Add an editor in the annotation storage.
     */
    addToAnnotationStorage(editor) {
        if (!editor.isEmpty() && !this.annotationStorage.has(editor.id)) {
            this.annotationStorage.setValue(editor.id, editor);
        }
    }
    /**
     * Add or rebuild depending if it has been removed or not.
     */
    addOrRebuild(editor) {
        if (editor.needsToBeRebuilt()) {
            editor.rebuild();
        }
        else {
            this.add(editor);
        }
    }
    /**
     * Add a new editor and make this addition undoable.
     */
    addANewEditor(editor) {
        const cmd = () => {
            this.addOrRebuild(editor);
        };
        const undo = () => {
            editor.remove();
        };
        this.addCommands({ cmd, undo, mustExec: true });
    }
    /**
     * Add a new editor and make this addition undoable.
     */
    addUndoableEditor(editor) {
        const cmd = () => {
            this.addOrRebuild(editor);
        };
        const undo = () => {
            editor.remove();
        };
        this.addCommands({ cmd, undo, mustExec: false });
    }
    /**
     * Get an id for an editor.
     */
    getNextId() {
        return this.#uiManager.getId();
    }
    /**
     * Create a new editor
     */
    #createNewEditor(params) {
        switch (this.#uiManager.getMode()) {
            case AnnotationEditorType.FREETEXT:
                return new FreeTextEditor(params);
            case AnnotationEditorType.INK:
                return new InkEditor(params);
        }
        return undefined;
    }
    /**
     * Create a new editor
     */
    deserialize(data) {
        switch (data.annotationType) {
            case AnnotationEditorType.FREETEXT:
                return FreeTextEditor.deserialize(data, this);
            case AnnotationEditorType.INK:
                return InkEditor.deserialize(data, this);
        }
        return undefined;
    }
    /**
     * Create and add a new editor.
     */
    #createAndAddNewEditor(event) {
        const id = this.getNextId();
        const editor = this.#createNewEditor({
            parent: this,
            id,
            x: event.offsetX,
            y: event.offsetY,
        });
        if (editor) {
            this.add(editor);
        }
        return editor;
    }
    /**
     * Set the last selected editor.
     */
    setSelected(editor) {
        this.#uiManager.setSelected(editor);
    }
    /**
     * Add or remove an editor the current selection.
     */
    toggleSelected(editor) {
        this.#uiManager.toggleSelected(editor);
    }
    /**
     * Check if the editor is selected.
     */
    isSelected(editor) {
        return this.#uiManager.isSelected(editor);
    }
    /**
     * Unselect an editor.
     */
    unselect(editor) {
        this.#uiManager.unselect(editor);
    }
    /**
     * Pointerup callback.
     */
    pointerup(event) {
        const isMac = KeyboardManager.platform.isMac;
        if (event.button !== 0 || (event.ctrlKey && isMac)) {
            // Don't create an editor on right click.
            return;
        }
        if (!this.#hadPointerDown) {
            // It can happen when the user starts a drag inside a text editor
            // and then releases the mouse button outside of it. In such a case
            // we don't want to create a new editor, hence we check that a pointerdown
            // occured on this div previously.
            return;
        }
        this.#hadPointerDown = false;
        if (event.target !== this.div) {
            return;
        }
        if (!this.#allowClick) {
            this.#allowClick = true;
            return;
        }
        this.#createAndAddNewEditor(event);
    }
    /**
     * Pointerdown callback.
     */
    pointerdown(event) {
        const isMac = KeyboardManager.platform.isMac;
        if (event.button !== 0 || (event.ctrlKey && isMac)) {
            // Do nothing on right click.
            return;
        }
        if (event.target !== this.div) {
            return;
        }
        this.#hadPointerDown = true;
        const editor = this.#uiManager.getActive();
        this.#allowClick = !editor || editor.isEmpty();
    }
    /**
     * Drag callback.
     */
    drop(event) {
        const id = event.dataTransfer.getData("text/plain");
        const editor = this.#uiManager.getEditor(id);
        if (!editor) {
            return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        this.#changeParent(editor);
        const rect = this.div.getBoundingClientRect();
        const endX = event.clientX - rect.x;
        const endY = event.clientY - rect.y;
        editor.translate(endX - editor.startX, endY - editor.startY);
        this.moveEditorInDOM(editor);
        editor.div.focus();
    }
    /**
     * Dragover callback.
     */
    dragover(event) {
        event.preventDefault();
    }
    /**
     * Destroy the main editor.
     */
    destroy() {
        if (this.#uiManager.getActive()?.parent === this) {
            this.#uiManager.setActiveEditor(undefined);
        }
        for (const editor of this.#editors.values()) {
            this.#accessibilityManager?.removePointerInTextLayer(editor.contentDiv);
            editor.isAttachedToDOM = false;
            editor.div.remove();
            editor.parent = null;
        }
        this.div = undefined;
        this.#editors.clear();
        this.#uiManager.removeLayer(this);
    }
    #cleanup() {
        // When we're cleaning up, some editors are removed but we don't want
        // to add a new one which will induce an addition in this.#editors, hence
        // an infinite loop.
        this.#isCleaningUp = true;
        for (const editor of this.#editors.values()) {
            if (editor.isEmpty()) {
                editor.remove();
            }
        }
        this.#isCleaningUp = false;
    }
    /**
     * Render the main editor.
     */
    render(parameters) {
        this.viewport = parameters.viewport;
        bindEvents(this, this.div, ["dragover", "drop"]);
        this.setDimensions();
        for (const editor of this.#uiManager.getEditors(this.pageIndex)) {
            this.add(editor);
        }
        this.updateMode();
    }
    /**
     * Update the main editor.
     */
    update(parameters) {
        this.viewport = parameters.viewport;
        this.setDimensions();
        this.updateMode();
    }
    /**
     * Get the scale factor from the viewport.
     */
    get scaleFactor() {
        return this.viewport.scale;
    }
    /**
     * Get page dimensions.
     * @return dimensions.
     */
    get pageDimensions() {
        const [pageLLx, pageLLy, pageURx, pageURy] = this.viewport.viewBox;
        const width = pageURx - pageLLx;
        const height = pageURy - pageLLy;
        return [width, height];
    }
    get viewportBaseDimensions() {
        const { width, height, rotation } = this.viewport;
        return rotation % 180 === 0 ? [width, height] : [height, width];
    }
    /**
     * Set the dimensions of the main div.
     */
    setDimensions() {
        const { width, height, rotation } = this.viewport;
        const flipOrientation = rotation % 180 !== 0, widthStr = Math.floor(width) + "px", heightStr = Math.floor(height) + "px";
        this.div.style.width = flipOrientation ? heightStr : widthStr;
        this.div.style.height = flipOrientation ? widthStr : heightStr;
        this.div.setAttribute("data-main-rotation", rotation);
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=annotation_editor_layer.js.map