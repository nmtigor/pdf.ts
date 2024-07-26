/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/editor/annotation_editor_layer.ts
 * @license Apache-2.0
 ******************************************************************************/
var _a;
import { AnnotationEditorType, FeatureTest } from "../../shared/util.js";
import { setLayerDimensions } from "../display_utils.js";
import { AnnotationEditor } from "./editor.js";
import { FreeTextEditor } from "./freetext.js";
import { HighlightEditor } from "./highlight.js";
import { InkEditor } from "./ink.js";
import { StampEditor } from "./stamp.js";
/**
 * Manage all the different editors on a page.
 */
export class AnnotationEditorLayer {
    static _initialized = false;
    static #editorTypes = new Map([FreeTextEditor, InkEditor, StampEditor, HighlightEditor].map((type) => [
        type._editorType,
        type,
    ]));
    #editors = new Map();
    get isEmpty() {
        return this.#editors.size === 0;
    }
    #uiManager;
    get _signal() {
        return this.#uiManager._signal;
    }
    get scale() {
        return this.#uiManager.viewParameters.realScale;
    }
    #accessibilityManager;
    #annotationLayer;
    #textLayer;
    hasTextLayer(textLayer) {
        return textLayer === this.#textLayer?.div;
    }
    drawLayer;
    #allowClick = false;
    #boundPointerup;
    #boundPointerdown;
    #boundTextLayerPointerDown;
    #editorFocusTimeoutId;
    #hadPointerDown = false;
    #isCleaningUp = false;
    #isDisabling = false;
    pageIndex;
    div;
    viewport;
    isMultipleSelection;
    constructor({ uiManager, pageIndex, div, accessibilityManager, annotationLayer, drawLayer, textLayer, viewport, l10n, }) {
        const editorTypes = [..._a.#editorTypes.values()];
        if (!_a._initialized) {
            _a._initialized = true;
            for (const editorType of editorTypes) {
                editorType.initialize(l10n, uiManager);
            }
        }
        uiManager.registerEditorTypes(editorTypes);
        this.#uiManager = uiManager;
        this.pageIndex = pageIndex;
        this.div = div;
        this.#accessibilityManager = accessibilityManager;
        this.#annotationLayer = annotationLayer;
        this.#textLayer = textLayer;
        this.drawLayer = drawLayer;
        this.viewport = viewport;
        this.#uiManager.addLayer(this);
    }
    get isInvisible() {
        return (this.isEmpty && this.#uiManager.getMode() === AnnotationEditorType.NONE);
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
        switch (mode) {
            case AnnotationEditorType.NONE:
                this.disableTextSelection();
                this.togglePointerEvents(false);
                this.toggleAnnotationLayerPointerEvents(true);
                this.disableClick();
                return;
            case AnnotationEditorType.INK:
                // We always want to have an ink editor ready to draw in.
                this.addInkEditorIfNeeded(false);
                this.disableTextSelection();
                this.togglePointerEvents(true);
                this.disableClick();
                break;
            case AnnotationEditorType.HIGHLIGHT:
                this.enableTextSelection();
                this.togglePointerEvents(false);
                this.disableClick();
                break;
            default:
                this.disableTextSelection();
                this.togglePointerEvents(true);
                this.enableClick();
        }
        this.toggleAnnotationLayerPointerEvents(false);
        const { classList } = this.div;
        for (const editorType of _a.#editorTypes.values()) {
            classList.toggle(`${editorType._type}Editing`, mode === editorType._editorType);
        }
        this.div.hidden = false;
    }
    addInkEditorIfNeeded(isCommitting) {
        if (this.#uiManager.getMode() !== AnnotationEditorType.INK) {
            // We don't want to add an ink editor if we're not in ink mode!
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
        const editor = this.createAndAddNewEditor({ offsetX: 0, offsetY: 0 }, 
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
    togglePointerEvents(enabled = false) {
        this.div.classList.toggle("disabled", !enabled);
    }
    toggleAnnotationLayerPointerEvents(enabled = false) {
        this.#annotationLayer?.div.classList.toggle("disabled", !enabled);
    }
    /**
     * Enable pointer events on the main div in order to enable
     * editor creation.
     */
    enable() {
        this.div.tabIndex = 0;
        this.togglePointerEvents(true);
        const annotationElementIds = new Set();
        for (const editor of this.#editors.values()) {
            editor.enableEditing();
            editor.show(true);
            if (editor.annotationElementId) {
                this.#uiManager.removeChangedExistingAnnotation(editor);
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
        this.div.tabIndex = -1;
        this.togglePointerEvents(false);
        const changedAnnotations = new Map();
        const resetAnnotations = new Map();
        for (const editor of this.#editors.values()) {
            editor.disableEditing();
            if (!editor.annotationElementId) {
                continue;
            }
            if (editor.serialize() !== undefined) {
                changedAnnotations.set(editor.annotationElementId, editor);
                continue;
            }
            else {
                resetAnnotations.set(editor.annotationElementId, editor);
            }
            this.getEditableAnnotation(editor.annotationElementId)?.show();
            editor.remove();
        }
        if (this.#annotationLayer) {
            // Show the annotations that were hidden in enable().
            const editables = this.#annotationLayer.getEditableAnnotations();
            for (const editable of editables) {
                const { id } = editable.data;
                if (this.#uiManager.isDeletedAnnotationElement(id)) {
                    continue;
                }
                let editor = resetAnnotations.get(id);
                if (editor) {
                    editor.resetAnnotationElement(editable);
                    editor.show(false);
                    editable.show();
                    continue;
                }
                editor = changedAnnotations.get(id);
                if (editor) {
                    this.#uiManager.addChangedExistingAnnotation(editor);
                    editor.renderAnnotationElement(editable);
                    editor.show(false);
                }
                editable.show();
            }
        }
        this.#cleanup();
        if (this.isEmpty) {
            this.div.hidden = true;
        }
        const { classList } = this.div;
        for (const editorType of _a.#editorTypes.values()) {
            classList.remove(`${editorType._type}Editing`);
        }
        this.disableTextSelection();
        this.toggleAnnotationLayerPointerEvents(true);
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
    enableTextSelection() {
        this.div.tabIndex = -1;
        if (this.#textLayer?.div && !this.#boundTextLayerPointerDown) {
            this.#boundTextLayerPointerDown = this.#textLayerPointerDown.bind(this);
            this.#textLayer.div.on("pointerdown", this.#boundTextLayerPointerDown, { signal: this.#uiManager._signal });
            this.#textLayer.div.classList.add("highlighting");
        }
    }
    disableTextSelection() {
        this.div.tabIndex = 0;
        if (this.#textLayer?.div && this.#boundTextLayerPointerDown) {
            this.#textLayer.div.removeEventListener("pointerdown", this.#boundTextLayerPointerDown);
            this.#boundTextLayerPointerDown = undefined;
            this.#textLayer.div.classList.remove("highlighting");
        }
    }
    #textLayerPointerDown(event) {
        // Unselect all the editors in order to let the user select some text
        // without being annoyed by an editor toolbar.
        this.#uiManager.unselectAll();
        if (event.target === this.#textLayer.div) {
            const { isMac } = FeatureTest.platform;
            if (event.button !== 0 || (event.ctrlKey && isMac)) {
                // Do nothing on right click.
                return;
            }
            this.#uiManager.showAllEditors("highlight", true, 
            /* updateButton = */ true);
            this.#textLayer.div.classList.add("free");
            HighlightEditor.startHighlighting(this, this.#uiManager.direction === "ltr", event);
            this.#textLayer.div.on("pointerup", () => {
                this.#textLayer.div.classList.remove("free");
            }, { once: true, signal: this.#uiManager._signal });
            event.preventDefault();
        }
    }
    enableClick() {
        if (this.#boundPointerdown) {
            return;
        }
        const signal = this.#uiManager._signal;
        this.#boundPointerdown = this.pointerdown.bind(this);
        this.#boundPointerup = this.pointerup.bind(this);
        this.div.on("pointerdown", this.#boundPointerdown, { signal });
        this.div.on("pointerup", this.#boundPointerup, { signal });
    }
    disableClick() {
        if (!this.#boundPointerdown) {
            return;
        }
        this.div.off("pointerdown", this.#boundPointerdown);
        this.div.off("pointerup", this.#boundPointerup);
        this.#boundPointerdown = undefined;
        this.#boundPointerup = undefined;
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
        this.detach(editor);
        this.#uiManager.removeEditor(editor);
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
        if (editor.parent && editor.annotationElementId) {
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
        if (editor.parent === this && editor.isAttachedToDOM) {
            return;
        }
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
        editor._reportTelemetry(editor.telemetryInitialData);
    }
    moveEditorInDOM(editor) {
        if (!editor.isAttachedToDOM) {
            return;
        }
        const { activeElement } = document;
        if (editor.div.contains(activeElement) && !this.#editorFocusTimeoutId) {
            // When the div is moved in the DOM the focus can move somewhere else,
            // so we want to be sure that the focus will stay on the editor but we
            // don't want to call any focus callbacks, hence we disable them and only
            // re-enable them when the editor has the focus.
            editor._focusEventsAllowed = false;
            this.#editorFocusTimeoutId = setTimeout(() => {
                this.#editorFocusTimeoutId = undefined;
                if (!editor.div.contains(document.activeElement)) {
                    editor.div.on("focusin", () => {
                        editor._focusEventsAllowed = true;
                    }, { once: true, signal: this.#uiManager._signal });
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
            editor.parent ||= this;
            editor.rebuild();
            editor.show();
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
    get #currentEditorType() {
        return _a.#editorTypes.get(this.#uiManager.getMode());
    }
    /**
     * Create a new editor
     */
    #createNewEditor(params) {
        const editorType = this.#currentEditorType;
        return editorType
            ? new editorType.prototype.constructor(params)
            : undefined;
    }
    canCreateNewEmptyEditor() {
        return this.#currentEditorType?.canCreateNewEmptyEditor();
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
        return (_a.#editorTypes.get(data.annotationType ?? data.annotationEditorType)?.deserialize(data, this, this.#uiManager) || undefined);
    }
    /**
     * Create and add a new editor.
     */
    createAndAddNewEditor(event, isCentered, data = {}) {
        const id = this.getNextId();
        const editor = this.#createNewEditor({
            parent: this,
            id,
            x: event.offsetX,
            y: event.offsetY,
            uiManager: this.#uiManager,
            isCentered,
            ...data,
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
        this.createAndAddNewEditor(this.#getCenterPoint(), 
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
        this.createAndAddNewEditor(event, /* isCentered = */ false);
    }
    /**
     * Pointerdown callback.
     */
    pointerdown(event) {
        if (this.#uiManager.getMode() === AnnotationEditorType.HIGHLIGHT) {
            this.enableTextSelection();
        }
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
        if (this.#editorFocusTimeoutId) {
            clearTimeout(this.#editorFocusTimeoutId);
            this.#editorFocusTimeoutId = undefined;
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
            editor.rebuild();
        }
        // We're maybe rendering a layer which was invisible when we started to edit
        // so we must set the different callbacks for it.
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
        this.#cleanup();
        const oldRotation = this.viewport.rotation;
        const rotation = viewport.rotation;
        this.viewport = viewport;
        setLayerDimensions(this.div, { rotation });
        if (oldRotation !== rotation) {
            for (const editor of this.#editors.values()) {
                editor.rotate(rotation);
            }
        }
        this.addInkEditorIfNeeded(/* isCommitting = */ false);
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
_a = AnnotationEditorLayer;
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=annotation_editor_layer.js.map