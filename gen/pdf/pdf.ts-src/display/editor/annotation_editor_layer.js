/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { AnnotationEditorType, FeatureTest } from "../../shared/util.js";
import { setLayerDimensions } from "../display_utils.js";
import { AnnotationEditor } from "./editor.js";
import { FreeTextEditor } from "./freetext.js";
import { InkEditor } from "./ink.js";
import { StampEditor } from "./stamp.js";
/**
 * Manage all the different editors on a page.
 */
export class AnnotationEditorLayer {
    static _initialized = false;
    #accessibilityManager;
    #allowClick = false;
    #annotationLayer;
    #boundPointerup = this.pointerup.bind(this);
    #boundPointerdown = this.pointerdown.bind(this);
    #editors = new Map();
    #hadPointerDown = false;
    #isCleaningUp = false;
    #isDisabling = false;
    #uiManager;
    pageIndex;
    div;
    viewport;
    isMultipleSelection;
    constructor({ uiManager, pageIndex, div, accessibilityManager, annotationLayer, viewport, l10n, }) {
        const editorTypes = [FreeTextEditor, InkEditor, StampEditor];
        if (!AnnotationEditorLayer._initialized) {
            AnnotationEditorLayer._initialized = true;
            for (const editorType of editorTypes) {
                editorType.initialize(l10n);
            }
        }
        uiManager.registerEditorTypes(editorTypes);
        this.#uiManager = uiManager;
        this.pageIndex = pageIndex;
        this.div = div;
        this.#accessibilityManager = accessibilityManager;
        this.#annotationLayer = annotationLayer;
        this.viewport = viewport;
        this.#uiManager.addLayer(this);
    }
    get isEmpty() {
        return this.#editors.size === 0;
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
        if (mode !== AnnotationEditorType.NONE) {
            this.div.classList.toggle("freeTextEditing", mode === AnnotationEditorType.FREETEXT);
            this.div.classList.toggle("inkEditing", mode === AnnotationEditorType.INK);
            this.div.classList.toggle("stampEditing", mode === AnnotationEditorType.STAMP);
            this.div.hidden = false;
        }
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
        const editor = this.#createAndAddNewEditor({ offsetX: 0, offsetY: 0 }, 
        /* isCentered = */ false);
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
        const annotationElementIds = new Set();
        for (const editor of this.#editors.values()) {
            editor.enableEditing();
            if (editor.annotationElementId) {
                annotationElementIds.add(editor.annotationElementId);
            }
        }
        if (!this.#annotationLayer) {
            return;
        }
        const editables = this.#annotationLayer.getEditableAnnotations();
        for (const editable of editables) {
            // The element must be hidden whatever its state is.
            editable.hide();
            if (this.#uiManager.isDeletedAnnotationElement(editable.data.id)) {
                continue;
            }
            if (annotationElementIds.has(editable.data.id)) {
                continue;
            }
            const editor = this.deserialize(editable);
            if (!editor) {
                continue;
            }
            this.addOrRebuild(editor);
            editor.enableEditing();
        }
    }
    /**
     * Disable editor creation.
     */
    disable() {
        this.#isDisabling = true;
        this.div.style.pointerEvents = "none";
        const hiddenAnnotationIds = new Set();
        for (const editor of this.#editors.values()) {
            editor.disableEditing();
            if (!editor.annotationElementId || editor.serialize() !== undefined) {
                hiddenAnnotationIds.add(editor.annotationElementId);
                continue;
            }
            this.getEditableAnnotation(editor.annotationElementId)?.show();
            editor.remove();
        }
        if (this.#annotationLayer) {
            // Show the annotations that were hidden in enable().
            const editables = this.#annotationLayer.getEditableAnnotations();
            for (const editable of editables) {
                const { id } = editable.data;
                if (hiddenAnnotationIds.has(id) ||
                    this.#uiManager.isDeletedAnnotationElement(id)) {
                    continue;
                }
                editable.show();
            }
        }
        this.#cleanup();
        if (this.isEmpty) {
            this.div.hidden = true;
        }
        this.#isDisabling = false;
    }
    getEditableAnnotation(id) {
        return this.#annotationLayer?.getEditableAnnotation(id);
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
        this.div.on("pointerdown", this.#boundPointerdown);
        this.div.on("pointerup", this.#boundPointerup);
    }
    disableClick() {
        this.div.off("pointerdown", this.#boundPointerdown);
        this.div.off("pointerup", this.#boundPointerup);
    }
    attach(editor) {
        this.#editors.set(editor.id, editor);
        const { annotationElementId } = editor;
        if (annotationElementId &&
            this.#uiManager.isDeletedAnnotationElement(annotationElementId)) {
            this.#uiManager.removeDeletedAnnotationElement(editor);
        }
    }
    detach(editor) {
        this.#editors.delete(editor.id);
        this.#accessibilityManager?.removePointerInTextLayer(editor.contentDiv);
        if (!this.#isDisabling && editor.annotationElementId) {
            this.#uiManager.addDeletedAnnotationElement(editor);
        }
    }
    /**
     * Remove an editor.
     */
    remove(editor) {
        // Since we can undo a removal we need to keep the
        // parent property as it is, so don't undefined it!
        this.detach(editor);
        this.#uiManager.removeEditor(editor);
        if (editor.div.contains(document.activeElement)) {
            setTimeout(() => {
                // When the div is removed from DOM the focus can move on the
                // document.body, so we need to move it back to the main container.
                this.#uiManager.focusMainContainer();
            }, 0);
        }
        editor.div.remove();
        editor.isAttachedToDOM = false;
        if (!this.#isCleaningUp) {
            this.addInkEditorIfNeeded(/* isCommitting = */ false);
        }
    }
    /**
     * An editor can have a different parent, for example after having
     * being dragged and droped from a page to another.
     */
    changeParent(editor) {
        if (editor.parent === this) {
            return;
        }
        if (editor.annotationElementId) {
            // this.#uiManager.addDeletedAnnotationElement(editor.annotationElementId); //kkkk bug?
            this.#uiManager.addDeletedAnnotationElement(editor);
            AnnotationEditor.deleteAnnotationElement(editor);
            editor.annotationElementId = undefined;
        }
        this.attach(editor);
        editor.parent?.detach(editor);
        editor.setParent(this);
        if (editor.div && editor.isAttachedToDOM) {
            editor.div.remove();
            this.div.append(editor.div);
        }
    }
    /**
     * Add a new editor in the current view.
     */
    add(editor) {
        this.changeParent(editor);
        this.#uiManager.addEditor(editor);
        this.attach(editor);
        if (!editor.isAttachedToDOM) {
            const div = editor.render();
            this.div.append(div);
            editor.isAttachedToDOM = true;
        }
        // The editor will be correctly moved into the DOM (see fixAndSetPosition).
        editor.fixAndSetPosition();
        editor.onceAdded();
        this.#uiManager.addToAnnotationStorage(editor);
    }
    moveEditorInDOM(editor) {
        if (!editor.isAttachedToDOM) {
            return;
        }
        const { activeElement } = document;
        if (editor.div.contains(activeElement)) {
            // When the div is moved in the DOM the focus can move somewhere else,
            // so we want to be sure that the focus will stay on the editor but we
            // don't want to call any focus callbacks, hence we disable them and only
            // re-enable them when the editor has the focus.
            editor._focusEventsAllowed = false;
            setTimeout(() => {
                if (!editor.div.contains(document.activeElement)) {
                    editor.div.addEventListener("focusin", () => {
                        editor._focusEventsAllowed = true;
                    }, { once: true });
                    activeElement.focus();
                }
                else {
                    editor._focusEventsAllowed = true;
                }
            }, 0);
        }
        editor._structTreeParentId = this.#accessibilityManager?.moveElementInDOM(this.div, editor.div, editor.contentDiv, 
        /* isRemovable = */ true);
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
    addUndoableEditor(editor) {
        const cmd = () => editor._uiManager.rebuild(editor);
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
            case AnnotationEditorType.STAMP:
                return new StampEditor(params);
        }
        return undefined;
    }
    /**
     * Paste some content into a new editor.
     */
    pasteEditor(mode, params) {
        this.#uiManager.updateToolbar(mode);
        this.#uiManager.updateMode(mode);
        const { offsetX, offsetY } = this.#getCenterPoint();
        const id = this.getNextId();
        const editor = this.#createNewEditor({
            parent: this,
            id,
            x: offsetX,
            y: offsetY,
            uiManager: this.#uiManager,
            isCentered: true,
            ...params,
        });
        if (editor) {
            this.add(editor);
        }
    }
    /**
     * Create a new editor
     */
    deserialize(data) {
        switch (data.annotationType ?? data.annotationEditorType) {
            case AnnotationEditorType.FREETEXT:
                return FreeTextEditor.deserialize(data, this, this.#uiManager);
            case AnnotationEditorType.INK:
                return InkEditor.deserialize(data, this, this.#uiManager);
            case AnnotationEditorType.STAMP:
                return StampEditor.deserialize(data, this, this.#uiManager);
        }
        return undefined;
    }
    /**
     * Create and add a new editor.
     */
    #createAndAddNewEditor(event, isCentered) {
        const id = this.getNextId();
        const editor = this.#createNewEditor({
            parent: this,
            id,
            x: event.offsetX,
            y: event.offsetY,
            uiManager: this.#uiManager,
            isCentered,
        });
        if (editor) {
            this.add(editor);
        }
        return editor;
    }
    #getCenterPoint() {
        const { x, y, width, height } = this.div.getBoundingClientRect();
        const tlX = Math.max(0, x);
        const tlY = Math.max(0, y);
        const brX = Math.min(window.innerWidth, x + width);
        const brY = Math.min(window.innerHeight, y + height);
        const centerX = (tlX + brX) / 2 - x;
        const centerY = (tlY + brY) / 2 - y;
        const [offsetX, offsetY] = this.viewport.rotation % 180 === 0
            ? [centerX, centerY]
            : [centerY, centerX];
        return { offsetX, offsetY };
    }
    /**
     * Create and add a new editor.
     */
    addNewEditor() {
        this.#createAndAddNewEditor(this.#getCenterPoint(), 
        /* isCentered = */ true);
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
        const { isMac } = FeatureTest.platform;
        if (event.button !== 0 || (event.ctrlKey && isMac)) {
            // Don't create an editor on right click.
            return;
        }
        if (event.target !== this.div) {
            return;
        }
        if (!this.#hadPointerDown) {
            // It can happen when the user starts a drag inside a text editor
            // and then releases the mouse button outside of it. In such a case
            // we don't want to create a new editor, hence we check that a pointerdown
            // occurred on this div previously.
            return;
        }
        this.#hadPointerDown = false;
        if (!this.#allowClick) {
            this.#allowClick = true;
            return;
        }
        if (this.#uiManager.getMode() === AnnotationEditorType.STAMP) {
            this.#uiManager.unselectAll();
            return;
        }
        this.#createAndAddNewEditor(event, /* isCentered = */ false);
    }
    /**
     * Pointerdown callback.
     */
    pointerdown(event) {
        if (this.#hadPointerDown) {
            // It's possible to have a second pointerdown event before a pointerup one
            // when the user puts a finger on a touchscreen and then add a second one
            // to start a pinch-to-zoom gesture.
            // That said, in case it's possible to have two pointerdown events with
            // a mouse, we don't want to create a new editor in such a case either.
            this.#hadPointerDown = false;
            return;
        }
        const { isMac } = FeatureTest.platform;
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
    findNewParent(editor, x, y) {
        const layer = this.#uiManager.findParent(x, y);
        if (layer === undefined || layer === this) {
            return false;
        }
        layer.changeParent(editor);
        return true;
    }
    /**
     * Destroy the main editor.
     */
    destroy() {
        if (this.#uiManager.getActive()?.parent === this) {
            // We need to commit the current editor before destroying the layer.
            this.#uiManager.commitOrRemove();
            this.#uiManager.setActiveEditor(undefined);
        }
        for (const editor of this.#editors.values()) {
            this.#accessibilityManager?.removePointerInTextLayer(editor.contentDiv);
            editor.setParent(undefined);
            editor.isAttachedToDOM = false;
            editor.div.remove();
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
    render({ viewport }) {
        this.viewport = viewport;
        setLayerDimensions(this.div, viewport);
        for (const editor of this.#uiManager.getEditors(this.pageIndex)) {
            this.add(editor);
        }
        this.updateMode();
    }
    /**
     * Update the main editor.
     */
    update({ viewport }) {
        // Editors have their dimensions/positions in percent so to avoid any
        // issues (see #15582), we must commit the current one before changing
        // the viewport.
        this.#uiManager.commitOrRemove();
        this.viewport = viewport;
        setLayerDimensions(this.div, { rotation: viewport.rotation });
        this.updateMode();
    }
    /**
     * Get page dimensions.
     * @return dimensions.
     */
    get pageDimensions() {
        const { pageWidth, pageHeight } = this.viewport.rawDims;
        return [pageWidth, pageHeight];
    }
    get viewportBaseDimensions() {
        const { width, height, rotation } = this.viewport;
        return rotation % 180 === 0 ? [width, height] : [height, width];
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=annotation_editor_layer.js.map