/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { html } from "../../../../lib/dom.js";
import { assert } from "../../../../lib/util/trace.js";
import { shadow, } from "../../shared/util.js";
import { bindEvents, ColorManager, KeyboardManager } from "./tools.js";
/**
 * Base class for editors.
 */
export class AnnotationEditor {
    static _type;
    static _colorManager = new ColorManager();
    static _zIndex = 1;
    #boundFocusin = this.focusin.bind(this);
    #boundFocusout = this.focusout.bind(this);
    #hasBeenSelected = false;
    #isEditing = false;
    #isInEditMode = false;
    #zIndex = AnnotationEditor._zIndex++;
    parent;
    id;
    width;
    height;
    pageIndex;
    name;
    div;
    x;
    y;
    rotation;
    isAttachedToDOM = false;
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
        const [width, height] = this.parent.viewportBaseDimensions;
        this.x = parameters.x / width;
        this.y = parameters.y / height;
        this.rotation = this.parent.viewport.rotation;
    }
    static get _defaultLineColor() {
        return shadow(this, "_defaultLineColor", this._colorManager.getHexCode("CanvasText"));
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
        if (!this.parent.isMultipleSelection) {
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
        this.parent.addToAnnotationStorage(this);
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
        const [width, height] = this.parent.viewportBaseDimensions;
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
        const { rotation } = this.parent.viewport;
        switch (rotation) {
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
    /**
     * Set the dimensions of this editor.
     */
    setDims(width, height) {
        const [parentWidth, parentHeight] = this.parent.viewportBaseDimensions;
        this.div.style.width = `${(100 * width) / parentWidth}%`;
        this.div.style.height = `${(100 * height) / parentHeight}%`;
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
        const isMac = KeyboardManager.platform.isMac;
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
        const [parentWidth, parentHeight] = this.parent.viewportBaseDimensions;
        const [pageWidth, pageHeight] = this.parent.pageDimensions;
        const shiftX = (pageWidth * tx) / parentWidth;
        const shiftY = (pageHeight * ty) / parentHeight;
        const x = this.x * pageWidth;
        const y = this.y * pageHeight;
        const width = this.width * pageWidth;
        const height = this.height * pageHeight;
        switch (this.rotation) {
            case 0:
                return [
                    x + shiftX,
                    pageHeight - y - shiftY - height,
                    x + shiftX + width,
                    pageHeight - y - shiftY,
                ];
            case 90:
                return [
                    x + shiftY,
                    pageHeight - y + shiftX,
                    x + shiftY + height,
                    pageHeight - y + shiftX + width,
                ];
            case 180:
                return [
                    x - shiftX - width,
                    pageHeight - y + shiftY,
                    x - shiftX,
                    pageHeight - y + shiftY + height,
                ];
            case 270:
                return [
                    x - shiftY - height,
                    pageHeight - y - shiftX - width,
                    x - shiftY,
                    pageHeight - y - shiftX,
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
        this.div?.addEventListener("focusin", this.#boundFocusin);
    }
    /**
     * Deserialize the editor.
     * The result of the deserialization is a new editor.
     */
    static deserialize(data, parent) {
        const editor = new this.prototype.constructor({
            parent,
            id: parent.getNextId(),
        });
        editor.rotation = data.rotation;
        const [pageWidth, pageHeight] = parent.pageDimensions;
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
     * @param {boolean} value
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
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=editor.js.map