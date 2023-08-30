/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { html } from "../../../../lib/dom.js";
import { assert } from "../../../../lib/util/trace.js";
import { FeatureTest, shadow } from "../../shared/util.js";
import { bindEvents, ColorManager } from "./tools.js";
/**
 * Base class for editors.
 */
export class AnnotationEditor {
    static _type;
    static _colorManager = new ColorManager();
    static _zIndex = 1;
    parent;
    id;
    width;
    height;
    pageIndex;
    name;
    div;
    _uiManager;
    annotationElementId;
    rotation;
    pageRotation;
    pageDimensions;
    pageTranslation;
    x;
    y;
    isAttachedToDOM = false;
    deleted = false;
    #boundFocusin = this.focusin.bind(this);
    #boundFocusout = this.focusout.bind(this);
    #hasBeenSelected = false;
    #isEditing = false;
    #isInEditMode = false;
    #zIndex = AnnotationEditor._zIndex++;
    startX;
    startY;
    constructor(parameters) {
        if (this.constructor === AnnotationEditor) {
            assert(0, "Cannot initialize AnnotationEditor.");
        }
        this.parent = parameters.parent;
        this.id = parameters.id;
        this.pageIndex = parameters.parent.pageIndex;
        this.name = parameters.name;
        this._uiManager = parameters.uiManager;
        const { rotation, rawDims: { pageWidth, pageHeight, pageX, pageY }, } = this.parent.viewport;
        this.rotation = rotation;
        this.pageRotation =
            (360 + rotation - this._uiManager.viewParameters.rotation) % 360;
        this.pageDimensions = [pageWidth, pageHeight];
        this.pageTranslation = [pageX, pageY];
        const [width, height] = this.parent.viewportBaseDimensions;
        this.x = parameters.x / width;
        this.y = parameters.y / height;
    }
    static get _defaultLineColor() {
        return shadow(this, "_defaultLineColor", this._colorManager.getHexCode("CanvasText"));
    }
    static deleteAnnotationElement(editor) {
        const fakeEditor = new FakeEditor({
            id: editor.parent.getNextId(),
            parent: editor.parent,
            uiManager: editor._uiManager,
        });
        fakeEditor.annotationElementId = editor.annotationElementId;
        fakeEditor.deleted = true;
        fakeEditor._uiManager.addToAnnotationStorage(fakeEditor);
    }
    /**
     * Add some commands into the CommandManager (undo/redo stuff).
     */
    addCommands(params) {
        this._uiManager.addCommands(params);
    }
    get currentLayer() {
        return this._uiManager.currentLayer;
    }
    /**
     * This editor will be behind the others.
     */
    setInBackground() {
        this.div.style.zIndex = 0;
    }
    /**
     * This editor will be in the foreground.
     */
    setInForeground() {
        this.div.style.zIndex = this.#zIndex;
    }
    setParent(parent) {
        if (parent !== undefined) {
            this.pageIndex = parent.pageIndex;
            this.pageDimensions = parent.pageDimensions;
        }
        this.parent = parent;
    }
    /**
     * onfocus callback.
     */
    focusin(event) {
        if (!this.#hasBeenSelected) {
            this.parent.setSelected(this);
        }
        else {
            this.#hasBeenSelected = false;
        }
    }
    /**
     * onblur callback.
     */
    focusout(event) {
        if (!this.isAttachedToDOM) {
            return;
        }
        // In case of focusout, the relatedTarget is the element which
        // is grabbing the focus.
        // So if the related target is an element under the div for this
        // editor, then the editor isn't unactive.
        const target = event.relatedTarget;
        if (target?.closest(`#${this.id}`)) {
            return;
        }
        event.preventDefault();
        if (!this.parent?.isMultipleSelection) {
            this.commitOrRemove();
        }
    }
    commitOrRemove() {
        if (this.isEmpty()) {
            this.remove();
        }
        else {
            this.commit();
        }
    }
    /**
     * Commit the data contained in this editor.
     */
    commit() {
        this.addToAnnotationStorage();
    }
    addToAnnotationStorage() {
        this._uiManager.addToAnnotationStorage(this);
    }
    /**
     * We use drag-and-drop in order to move an editor on a page.
     */
    dragstart(event) {
        const rect = this.parent.div.getBoundingClientRect();
        this.startX = event.clientX - rect.x;
        this.startY = event.clientY - rect.y;
        event.dataTransfer.setData("text/plain", this.id);
        event.dataTransfer.effectAllowed = "move";
    }
    /**
     * Set the editor position within its parent.
     * @param tx x-translation in screen coordinates.
     * @param ty y-translation in screen coordinates.
     */
    setAt(x, y, tx, ty) {
        const [width, height] = this.parent.viewportBaseDimensions;
        [tx, ty] = this.screenToPageTranslation(tx, ty);
        this.x = (x + tx) / width;
        this.y = (y + ty) / height;
        this.div.style.left = `${100 * this.x}%`;
        this.div.style.top = `${100 * this.y}%`;
    }
    /**
     * Translate the editor position within its parent.
     * @param x x-translation in screen coordinates.
     * @param y y-translation in screen coordinates.
     */
    translate(x, y) {
        const [width, height] = this.parentDimensions;
        [x, y] = this.screenToPageTranslation(x, y);
        this.x += x / width;
        this.y += y / height;
        this.div.style.left = `${100 * this.x}%`;
        this.div.style.top = `${100 * this.y}%`;
    }
    /**
     * Convert a screen translation into a page one.
     */
    screenToPageTranslation(x, y) {
        switch (this.parentRotation) {
            case 90:
                return [y, -x];
            case 180:
                return [-x, -y];
            case 270:
                return [-y, x];
            default:
                return [x, y];
        }
    }
    get parentScale() {
        return this._uiManager.viewParameters.realScale;
    }
    get parentRotation() {
        return (this._uiManager.viewParameters.rotation + this.pageRotation) % 360;
    }
    get parentDimensions() {
        const { realScale } = this._uiManager.viewParameters;
        const [pageWidth, pageHeight] = this.pageDimensions;
        return [pageWidth * realScale, pageHeight * realScale];
    }
    /**
     * Set the dimensions of this editor.
     */
    setDims(width, height) {
        const [parentWidth, parentHeight] = this.parentDimensions;
        this.div.style.width = `${(100 * width) / parentWidth}%`;
        this.div.style.height = `${(100 * height) / parentHeight}%`;
    }
    fixDims() {
        const { style } = this.div;
        const { height, width } = style;
        const widthPercent = width.endsWith("%");
        const heightPercent = height.endsWith("%");
        if (widthPercent && heightPercent) {
            return;
        }
        const [parentWidth, parentHeight] = this.parentDimensions;
        if (!widthPercent) {
            style.width = `${(100 * parseFloat(width)) / parentWidth}%`;
        }
        if (!heightPercent) {
            style.height = `${(100 * parseFloat(height)) / parentHeight}%`;
        }
    }
    /**
     * Get the translation used to position this editor when it's created.
     */
    getInitialTranslation() {
        return [0, 0];
    }
    /**
     * Render this editor in a div.
     */
    render() {
        this.div = html("div");
        this.div.setAttribute("data-editor-rotation", (360 - this.rotation) % 360);
        this.div.className = this.name;
        this.div.setAttribute("id", this.id);
        this.div.setAttribute("tabIndex", 0);
        this.setInForeground();
        this.div.addEventListener("focusin", this.#boundFocusin);
        this.div.addEventListener("focusout", this.#boundFocusout);
        const [tx, ty] = this.getInitialTranslation();
        this.translate(tx, ty);
        bindEvents(this, this.div, ["dragstart", "pointerdown"]);
        return this.div;
    }
    /**
     * Onpointerdown callback.
     */
    pointerdown(event) {
        const { isMac } = FeatureTest.platform;
        if (event.button !== 0 || (event.ctrlKey && isMac)) {
            // Avoid to focus this editor because of a non-left click.
            event.preventDefault();
            return;
        }
        if ((event.ctrlKey && !isMac) ||
            event.shiftKey ||
            (event.metaKey && isMac)) {
            this.parent.toggleSelected(this);
        }
        else {
            this.parent.setSelected(this);
        }
        this.#hasBeenSelected = true;
    }
    getRect(tx, ty) {
        const scale = this.parentScale;
        const [pageWidth, pageHeight] = this.pageDimensions;
        const [pageX, pageY] = this.pageTranslation;
        const shiftX = tx / scale;
        const shiftY = ty / scale;
        const x = this.x * pageWidth;
        const y = this.y * pageHeight;
        const width = this.width * pageWidth;
        const height = this.height * pageHeight;
        switch (this.rotation) {
            case 0:
                return [
                    x + shiftX + pageX,
                    pageHeight - y - shiftY - height + pageY,
                    x + shiftX + width + pageX,
                    pageHeight - y - shiftY + pageY,
                ];
            case 90:
                return [
                    x + shiftY + pageX,
                    pageHeight - y + shiftX + pageY,
                    x + shiftY + height + pageX,
                    pageHeight - y + shiftX + width + pageY,
                ];
            case 180:
                return [
                    x - shiftX - width + pageX,
                    pageHeight - y + shiftY + pageY,
                    x - shiftX + pageX,
                    pageHeight - y + shiftY + height + pageY,
                ];
            case 270:
                return [
                    x - shiftY - height + pageX,
                    pageHeight - y - shiftX - width + pageY,
                    x - shiftY + pageX,
                    pageHeight - y - shiftX + pageY,
                ];
            default:
                throw new Error("Invalid rotation");
        }
    }
    getRectInCurrentCoords(rect, pageHeight) {
        const [x1, y1, x2, y2] = rect;
        const width = x2 - x1;
        const height = y2 - y1;
        switch (this.rotation) {
            case 0:
                return [x1, pageHeight - y2, width, height];
            case 90:
                return [x1, pageHeight - y1, height, width];
            case 180:
                return [x2, pageHeight - y1, width, height];
            case 270:
                return [x2, pageHeight - y2, height, width];
            default:
                throw new Error("Invalid rotation");
        }
    }
    /**
     * Executed once this editor has been rendered.
     */
    onceAdded() { }
    /**
     * Check if the editor contains something.
     */
    isEmpty() {
        return false;
    }
    /**
     * Enable edit mode.
     */
    enableEditMode() {
        this.#isInEditMode = true;
    }
    /**
     * Disable edit mode.
     */
    disableEditMode() {
        this.#isInEditMode = false;
    }
    /**
     * Check if the editor is edited.
     */
    isInEditMode() {
        return this.#isInEditMode;
    }
    /**
     * If it returns true, then this editor handle the keyboard
     * events itself.
     */
    shouldGetKeyboardEvents() {
        return false;
    }
    /**
     * Check if this editor needs to be rebuilt or not.
     */
    needsToBeRebuilt() {
        return this.div && !this.isAttachedToDOM;
    }
    /**
     * Rebuild the editor in case it has been removed on undo.
     *
     * To implement in subclasses.
     */
    rebuild() {
        this.div?.on("focusin", this.#boundFocusin);
        this.div?.on("focusout", this.#boundFocusout);
    }
    /**
     * Deserialize the editor.
     * The result of the deserialization is a new editor.
     */
    static deserialize(data, parent, uiManager) {
        const editor = new this.prototype.constructor({
            parent,
            id: parent.getNextId(),
            uiManager,
        });
        editor.rotation = data.rotation;
        const [pageWidth, pageHeight] = editor.pageDimensions;
        const [x, y, width, height] = editor.getRectInCurrentCoords(data.rect, pageHeight);
        editor.x = x / pageWidth;
        editor.y = y / pageHeight;
        editor.width = width / pageWidth;
        editor.height = height / pageHeight;
        return editor;
    }
    /**
     * Remove this editor.
     * It's used on ctrl+backspace action.
     */
    remove() {
        this.div.removeEventListener("focusin", this.#boundFocusin);
        this.div.removeEventListener("focusout", this.#boundFocusout);
        if (!this.isEmpty()) {
            // The editor is removed but it can be back at some point thanks to
            // undo/redo so we must commit it before.
            this.commit();
        }
        this.parent.remove(this);
    }
    /**
     * Select this editor.
     */
    select() {
        this.div?.classList.add("selectedEditor");
    }
    /**
     * Unselect this editor.
     */
    unselect() {
        this.div?.classList.remove("selectedEditor");
    }
    /**
     * Update some parameters which have been changed through the UI.
     */
    updateParams(type, value) { }
    /**
     * When the user disables the editing mode some editors can change some of
     * their properties.
     */
    disableEditing() { }
    /**
     * When the user enables the editing mode some editors can change some of
     * their properties.
     */
    enableEditing() { }
    /**
     * Get some properties to update in the UI.
     */
    get propertiesToUpdate() {
        return [];
    }
    /**
     * Get the div which really contains the displayed content.
     */
    get contentDiv() {
        return this.div;
    }
    /**
     * If true then the editor is currently edited.
     * @type {boolean}
     */
    get isEditing() {
        return this.#isEditing;
    }
    /**
     * When set to true, it means that this editor is currently edited.
     */
    set isEditing(value) {
        this.#isEditing = value;
        if (value) {
            this.parent.setSelected(this);
            this.parent.setActiveEditor(this);
        }
        else {
            this.parent.setActiveEditor(undefined);
        }
    }
}
// This class is used to fake an editor which has been deleted.
class FakeEditor extends AnnotationEditor {
    constructor(params) {
        super(params);
        this.annotationElementId = params.annotationElementId;
        this.deleted = true;
    }
    serialize() {
        return {
            id: this.annotationElementId,
            deleted: true,
            pageIndex: this.pageIndex,
        };
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=editor.js.map