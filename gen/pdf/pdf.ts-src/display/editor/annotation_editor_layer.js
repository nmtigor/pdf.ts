/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { AnnotationEditorType, FeatureTest } from "../../shared/util.js";
import { setLayerDimensions } from "../display_utils.js";
import { AnnotationEditor } from "./editor.js";
import { FreeTextEditor } from "./freetext.js";
import { InkEditor } from "./ink.js";
import { bindEvents } from "./tools.js";
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
    constructor(options) {
        if (!AnnotationEditorLayer._initialized) {
            AnnotationEditorLayer._initialized = true;
            FreeTextEditor.initialize(options.l10n);
            InkEditor.initialize(options.l10n);
        }
        options.uiManager.registerEditorTypes([FreeTextEditor, InkEditor]);
        this.#uiManager = options.uiManager;
        this.pageIndex = options.pageIndex;
        this.div = options.div;
        this.#accessibilityManager = options.accessibilityManager;
        this.#annotationLayer = options.annotationLayer;
        this.viewport = options.viewport;
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
        this.#uiManager.unselectAll();
        if (mode !== AnnotationEditorType.NONE) {
            this.div.classList.toggle("freeTextEditing", mode === AnnotationEditorType.FREETEXT);
            this.div.classList.toggle("inkEditing", mode === AnnotationEditorType.INK);
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
            if (!editor.annotationElementId || editor.serialize() !== null) {
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
        this.div.addEventListener("pointerdown", this.#boundPointerdown);
        this.div.addEventListener("pointerup", this.#boundPointerup);
    }
    disableClick() {
        this.div.removeEventListener("pointerdown", this.#boundPointerdown);
        this.div.removeEventListener("pointerup", this.#boundPointerup);
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
        // parent property as it is, so don't null it!
        this.detach(editor);
        this.#uiManager.removeEditor(editor);
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
        this.#uiManager.addToAnnotationStorage(editor);
    }
    moveEditorInDOM(editor) {
        this.#accessibilityManager?.moveElementInDOM(this.div, editor.div, editor.contentDiv, 
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
        switch (data.annotationType ?? data.annotationEditorType) {
            case AnnotationEditorType.FREETEXT:
                return FreeTextEditor.deserialize(data, this, this.#uiManager);
            case AnnotationEditorType.INK:
                return InkEditor.deserialize(data, this, this.#uiManager);
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
            uiManager: this.#uiManager,
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
        const { isMac } = FeatureTest.platform;
        if (event.button !== 0 || (event.ctrlKey && isMac)) {
            // Don't create an editor on right click.
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
        bindEvents(this, this.div, ["dragover", "drop"]);
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