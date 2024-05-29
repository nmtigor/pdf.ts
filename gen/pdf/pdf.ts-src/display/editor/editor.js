/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/editor/editor.ts
 * @license Apache-2.0
 ******************************************************************************/
var _a;
import { html } from "../../../../lib/dom.js";
import { noContextMenu } from "../../../../lib/util/general.js";
import { fail } from "../../../../lib/util/trace.js";
import { FeatureTest, shadow, } from "../../shared/util.js";
import { AltText } from "./alt_text.js";
import { EditorToolbar } from "./toolbar.js";
import { AnnotationEditorUIManager, bindEvents, ColorManager, KeyboardManager, } from "./tools.js";
/**
 * Base class for editors.
 */
export class AnnotationEditor {
    static _type;
    static _editorType;
    static _l10nPromise;
    parent;
    id;
    width;
    height;
    pageIndex;
    name;
    div;
    _uiManager;
    _focusEventsAllowed = true;
    annotationElementId;
    _willKeepAspectRatio = false;
    _initialOptions = Object.create(null);
    _isVisible = true;
    _structTreeParentId;
    isAttachedToDOM = false;
    deleted = false;
    rotation;
    pageRotation;
    pageDimensions;
    pageTranslation;
    x;
    y;
    #allResizerDivs;
    /* #altText */
    #altText;
    get altTextData() {
        return this.#altText?.data;
    }
    /**
     * Set the alt text data.
     */
    set altTextData(data) {
        if (!this.#altText) {
            return;
        }
        this.#altText.data = data;
    }
    hasAltText() {
        return !this.#altText?.isEmpty();
    }
    /* ~ */
    #disabled = false;
    //kkkk TOCLEANUP
    // #altTextDecorative = false;
    // #altTextButton: HTMLButtonElement | undefined;
    // #altTextTooltip: HTMLSpanElement | undefined;
    // #altTextTooltipTimeout: number | undefined;
    // #altTextWasFromKeyBoard = false;
    #keepAspectRatio = false;
    #resizersDiv;
    #savedDimensions;
    #boundFocusin = this.focusin.bind(this);
    #boundFocusout = this.focusout.bind(this);
    #editToolbar;
    #focusedResizerName;
    #hasBeenClicked = false;
    #initialPosition;
    #isEditing = false;
    #isInEditMode = false;
    #isResizerEnabledForKeyboard = false;
    #moveInDOMTimeout;
    #prevDragX = 0;
    #prevDragY = 0;
    #telemetryTimeouts;
    #isDraggable = false;
    get _isDraggable() {
        return this.#isDraggable;
    }
    set _isDraggable(value) {
        this.#isDraggable = value;
        this.div?.classList.toggle("draggable", value);
    }
    startX;
    startY;
    static _borderLineWidth = -1;
    static _colorManager = new ColorManager();
    static _zIndex = 1;
    #zIndex = _a._zIndex++;
    // Time to wait (in ms) before sending the telemetry data.
    // We wait a bit to avoid sending too many requests when changing something
    // like the thickness of a line.
    static _telemetryTimeout = 1000;
    static get _resizerKeyboardManager() {
        const resize = _a.prototype._resizeWithKeyboard;
        const small = AnnotationEditorUIManager.TRANSLATE_SMALL;
        const big = AnnotationEditorUIManager.TRANSLATE_BIG;
        return shadow(this, "_resizerKeyboardManager", new KeyboardManager([
            [["ArrowLeft", "mac+ArrowLeft"], resize, { args: [-small, 0] }],
            [
                ["ctrl+ArrowLeft", "mac+shift+ArrowLeft"],
                resize,
                { args: [-big, 0] },
            ],
            [["ArrowRight", "mac+ArrowRight"], resize, { args: [small, 0] }],
            [
                ["ctrl+ArrowRight", "mac+shift+ArrowRight"],
                resize,
                { args: [big, 0] },
            ],
            [["ArrowUp", "mac+ArrowUp"], resize, { args: [0, -small] }],
            [["ctrl+ArrowUp", "mac+shift+ArrowUp"], resize, { args: [0, -big] }],
            [["ArrowDown", "mac+ArrowDown"], resize, { args: [0, small] }],
            [["ctrl+ArrowDown", "mac+shift+ArrowDown"], resize, { args: [0, big] }],
            [
                ["Escape", "mac+Escape"],
                _a.prototype._stopResizingWithKeyboard,
            ],
        ]));
    }
    constructor(parameters) {
        if (this.constructor === _a) {
            fail("Cannot initialize AnnotationEditor.");
        }
        this.parent = parameters.parent;
        this.id = parameters.id;
        this.pageIndex = parameters.parent.pageIndex;
        this.name = parameters.name;
        this._uiManager = parameters.uiManager;
        this._initialOptions.isCentered = parameters.isCentered;
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
    get editorType() {
        return Object.getPrototypeOf(this).constructor._type;
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
     * Initialize the l10n stuff for this type of editor.
     */
    static initialize(l10n, _uiManager, options) {
        _a._l10nPromise ||= new Map([
            "pdfjs-editor-alt-text-button-label",
            "pdfjs-editor-alt-text-edit-button-label",
            "pdfjs-editor-alt-text-decorative-tooltip",
            "pdfjs-editor-resizer-label-topLeft",
            "pdfjs-editor-resizer-label-topMiddle",
            "pdfjs-editor-resizer-label-topRight",
            "pdfjs-editor-resizer-label-middleRight",
            "pdfjs-editor-resizer-label-bottomRight",
            "pdfjs-editor-resizer-label-bottomMiddle",
            "pdfjs-editor-resizer-label-bottomLeft",
            "pdfjs-editor-resizer-label-middleLeft",
        ].map((str) => [
            str,
            l10n.get(str.replaceAll(/([A-Z])/g, (c) => `-${c.toLowerCase()}`)),
        ]));
        if (options?.strings) {
            for (const str of options.strings) {
                _a._l10nPromise.set(str, l10n.get(str));
            }
        }
        if (_a._borderLineWidth !== -1) {
            return;
        }
        const style = getComputedStyle(document.documentElement);
        _a._borderLineWidth =
            parseFloat(style.getPropertyValue("--outline-width")) || 0;
    }
    /**
     * Update the default parameters for this type of editor.
     * @param _type
     * @param _value
     */
    static updateDefaultParams(_type, _value) { }
    /**
     * Get the default properties to set in the UI for this type of editor.
     */
    static get defaultPropertiesToUpdate() {
        return [];
    }
    /**
     * Check if this kind of editor is able to handle the given mime type for
     * pasting.
     */
    static isHandlingMimeForPasting(mime) {
        return false;
    }
    /**
     * Extract the data from the clipboard item and delegate the creation of the
     * editor to the parent.
     */
    static paste(item, parent) {
        fail("Not implemented");
    }
    /**
     * Get the properties to update in the UI for this editor.
     */
    get propertiesToUpdate() {
        return [];
    }
    /**
     * @return true if the editor handles the Enter key itself.
     */
    get isEnterHandled() {
        return true;
    }
    center() {
        const [pageWidth, pageHeight] = this.pageDimensions;
        switch (this.parentRotation) {
            case 90:
                this.x -= (this.height * pageHeight) / (pageWidth * 2);
                this.y += (this.width * pageWidth) / (pageHeight * 2);
                break;
            case 180:
                this.x += this.width / 2;
                this.y += this.height / 2;
                break;
            case 270:
                this.x += (this.height * pageHeight) / (pageWidth * 2);
                this.y -= (this.width * pageWidth) / (pageHeight * 2);
                break;
            default:
                this.x -= this.width / 2;
                this.y -= this.height / 2;
                break;
        }
        this.fixAndSetPosition();
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
        else {
            // The editor is being removed from the DOM, so we need to stop resizing.
            this.#stopResizing();
        }
        this.parent = parent;
    }
    /**
     * onfocus callback.
     */
    focusin(event) {
        if (!this._focusEventsAllowed) {
            return;
        }
        if (!this.#hasBeenClicked) {
            this.parent.setSelected(this);
        }
        else {
            this.#hasBeenClicked = false;
        }
    }
    /**
     * onblur callback.
     */
    focusout(event) {
        if (!this._focusEventsAllowed) {
            return;
        }
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
     * Set the editor position within its parent.
     * @param tx x-translation in screen coordinates.
     * @param ty y-translation in screen coordinates.
     */
    setAt(x, y, tx, ty) {
        const [width, height] = this.parent.viewportBaseDimensions;
        [tx, ty] = this.screenToPageTranslation(tx, ty);
        this.x = (x + tx) / width;
        this.y = (y + ty) / height;
        this.fixAndSetPosition();
    }
    #translate([width, height], x, y) {
        [x, y] = this.screenToPageTranslation(x, y);
        this.x += x / width;
        this.y += y / height;
        this.fixAndSetPosition();
    }
    /**
     * Translate the editor position within its parent.
     * @param x x-translation in screen coordinates.
     * @param y y-translation in screen coordinates.
     */
    translate(x, y) {
        // We don't change the initial position because the move here hasn't been
        // done by the user.
        this.#translate(this.parentDimensions, x, y);
    }
    /**
     * Translate the editor position within its page and adjust the scroll
     * in order to have the editor in the view.
     * @param x x-translation in page coordinates.
     * @param y y-translation in page coordinates.
     */
    translateInPage(x, y) {
        this.#initialPosition ||= [this.x, this.y];
        this.#translate(this.pageDimensions, x, y);
        this.div.scrollIntoView({ block: "nearest" });
    }
    drag(tx, ty) {
        this.#initialPosition ||= [this.x, this.y];
        const [parentWidth, parentHeight] = this.parentDimensions;
        this.x += tx / parentWidth;
        this.y += ty / parentHeight;
        if (this.parent && (this.x < 0 || this.x > 1 || this.y < 0 || this.y > 1)) {
            // It's possible to not have a parent: for example, when the user is
            // dragging all the selected editors but this one on a page which has been
            // destroyed.
            // It's why we need to check for it. In such a situation, it isn't really
            // a problem to not find a new parent: it's something which is related to
            // what the user is seeing, hence it depends on how pages are layed out.
            // The element will be outside of its parent so change the parent.
            const { x, y } = this.div.getBoundingClientRect();
            if (this.parent.findNewParent(this, x, y)) {
                this.x -= Math.floor(this.x);
                this.y -= Math.floor(this.y);
            }
        }
        // The editor can be moved wherever the user wants, so we don't need to fix
        // the position: it'll be done when the user will release the mouse button.
        let { x, y } = this;
        const [bx, by] = this.getBaseTranslation();
        x += bx;
        y += by;
        this.div.style.left = `${(100 * x).toFixed(2)}%`;
        this.div.style.top = `${(100 * y).toFixed(2)}%`;
        this.div.scrollIntoView({ block: "nearest" });
    }
    get _hasBeenMoved() {
        return (!!this.#initialPosition &&
            (this.#initialPosition[0] !== this.x ||
                this.#initialPosition[1] !== this.y));
    }
    /**
     * Get the translation to take into account the editor border.
     * The CSS engine positions the element by taking the border into account so
     * we must apply the opposite translation to have the editor in the right
     * position.
     */
    getBaseTranslation() {
        const [parentWidth, parentHeight] = this.parentDimensions;
        const { _borderLineWidth } = _a;
        const x = _borderLineWidth / parentWidth;
        const y = _borderLineWidth / parentHeight;
        switch (this.rotation) {
            case 90:
                return [-x, y];
            case 180:
                return [x, y];
            case 270:
                return [x, -y];
            default:
                return [-x, -y];
        }
    }
    /**
     * @return true if position must be fixed (i.e. make the x and y
     * living in the page).
     */
    get _mustFixPosition() {
        return true;
    }
    /**
     * Fix the position of the editor in order to keep it inside its parent page.
     * @param rotation the rotation of the page.
     */
    fixAndSetPosition(rotation = this.rotation) {
        const [pageWidth, pageHeight] = this.pageDimensions;
        let { x, y, width, height } = this;
        width *= pageWidth;
        height *= pageHeight;
        x *= pageWidth;
        y *= pageHeight;
        if (this._mustFixPosition) {
            switch (rotation) {
                case 0:
                    x = Math.max(0, Math.min(pageWidth - width, x));
                    y = Math.max(0, Math.min(pageHeight - height, y));
                    break;
                case 90:
                    x = Math.max(0, Math.min(pageWidth - height, x));
                    y = Math.min(pageHeight, Math.max(width, y));
                    break;
                case 180:
                    x = Math.min(pageWidth, Math.max(width, x));
                    y = Math.min(pageHeight, Math.max(height, y));
                    break;
                case 270:
                    x = Math.min(pageWidth, Math.max(height, x));
                    y = Math.max(0, Math.min(pageHeight - width, y));
                    break;
            }
        }
        this.x = x /= pageWidth;
        this.y = y /= pageHeight;
        const [bx, by] = this.getBaseTranslation();
        x += bx;
        y += by;
        const { style } = this.div;
        style.left = `${(100 * x).toFixed(2)}%`;
        style.top = `${(100 * y).toFixed(2)}%`;
        this.moveInDOM();
    }
    static #rotatePoint(x, y, angle) {
        switch (angle) {
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
     * Convert a screen translation into a page one.
     */
    screenToPageTranslation(x, y) {
        return _a.#rotatePoint(x, y, this.parentRotation);
    }
    /**
     * Convert a page translation into a screen one.
     */
    pageTranslationToScreen(x, y) {
        return _a.#rotatePoint(x, y, 360 - this.parentRotation);
    }
    #getRotationMatrix(rotation) {
        switch (rotation) {
            case 90: {
                const [pageWidth, pageHeight] = this.pageDimensions;
                return [0, -pageWidth / pageHeight, pageHeight / pageWidth, 0];
            }
            case 180:
                return [-1, 0, 0, -1];
            case 270: {
                const [pageWidth, pageHeight] = this.pageDimensions;
                return [0, pageWidth / pageHeight, -pageHeight / pageWidth, 0];
            }
            default:
                return [1, 0, 0, 1];
        }
    }
    get parentScale() {
        return this._uiManager.viewParameters.realScale;
    }
    get parentRotation() {
        return (this._uiManager.viewParameters.rotation + this.pageRotation) % 360;
    }
    get parentDimensions() {
        const { parentScale, pageDimensions: [pageWidth, pageHeight], } = this;
        const scaledWidth = pageWidth * parentScale;
        const scaledHeight = pageHeight * parentScale;
        return FeatureTest.isCSSRoundSupported
            ? [Math.round(scaledWidth), Math.round(scaledHeight)]
            : [scaledWidth, scaledHeight];
    }
    /**
     * Set the dimensions of this editor.
     */
    setDims(width, height) {
        const [parentWidth, parentHeight] = this.parentDimensions;
        this.div.style.width = `${((100 * width) / parentWidth).toFixed(2)}%`;
        if (!this.#keepAspectRatio) {
            this.div.style.height = `${((100 * height) / parentHeight).toFixed(2)}%`;
        }
    }
    fixDims() {
        const { style } = this.div;
        const { height, width } = style;
        const widthPercent = width.endsWith("%");
        const heightPercent = !this.#keepAspectRatio && height.endsWith("%");
        if (widthPercent && heightPercent) {
            return;
        }
        const [parentWidth, parentHeight] = this.parentDimensions;
        if (!widthPercent) {
            style.width = `${((100 * parseFloat(width)) / parentWidth).toFixed(2)}%`;
        }
        if (!this.#keepAspectRatio && !heightPercent) {
            style.height = `${((100 * parseFloat(height)) / parentHeight).toFixed(2)}%`;
        }
    }
    /**
     * Get the translation used to position this editor when it's created.
     */
    getInitialTranslation() {
        return [0, 0];
    }
    #createResizers() {
        if (this.#resizersDiv) {
            return;
        }
        this.#resizersDiv = html("div");
        this.#resizersDiv.classList.add("resizers");
        // When the resizers are used with the keyboard, they're focusable, hence
        // we want to have them in this order (top left, top middle, top right, ...)
        // in the DOM to have the focus order correct.
        const classes = this._willKeepAspectRatio
            ? ["topLeft", "topRight", "bottomRight", "bottomLeft"]
            : [
                "topLeft",
                "topMiddle",
                "topRight",
                "middleRight",
                "bottomRight",
                "bottomMiddle",
                "bottomLeft",
                "middleLeft",
            ];
        for (const name of classes) {
            const div = html("div");
            this.#resizersDiv.append(div);
            div.classList.add("resizer", name);
            div.setAttribute("data-resizer-name", name);
            div.on("pointerdown", this.#resizerPointerdown.bind(this, name));
            div.on("contextmenu", noContextMenu);
            div.tabIndex = -1;
        }
        this.div.prepend(this.#resizersDiv);
    }
    #resizerPointerdown(name, event) {
        event.preventDefault();
        const { isMac } = FeatureTest.platform;
        if (event.button !== 0 || (event.ctrlKey && isMac)) {
            return;
        }
        this.#altText?.toggle(false);
        const boundResizerPointermove = this.#resizerPointermove.bind(this, name);
        const savedDraggable = this._isDraggable;
        this._isDraggable = false;
        const pointerMoveOptions = { passive: true, capture: true };
        this.parent.togglePointerEvents(false);
        window.on("pointermove", boundResizerPointermove, pointerMoveOptions);
        const savedX = this.x;
        const savedY = this.y;
        const savedWidth = this.width;
        const savedHeight = this.height;
        const savedParentCursor = this.parent.div.style.cursor;
        const savedCursor = this.div.style.cursor;
        this.div.style.cursor =
            this.parent.div.style.cursor =
                window.getComputedStyle(event.target).cursor;
        const pointerUpCallback = () => {
            this.parent.togglePointerEvents(true);
            this.#altText?.toggle(true);
            this._isDraggable = savedDraggable;
            window.off("pointerup", pointerUpCallback);
            window.off("blur", pointerUpCallback);
            window.off("pointermove", boundResizerPointermove, pointerMoveOptions);
            this.parent.div.style.cursor = savedParentCursor;
            this.div.style.cursor = savedCursor;
            this.#addResizeToUndoStack(savedX, savedY, savedWidth, savedHeight);
        };
        window.on("pointerup", pointerUpCallback);
        // If the user switches to another window (with alt+tab), then we end the
        // resize session.
        window.on("blur", pointerUpCallback);
    }
    #addResizeToUndoStack(savedX, savedY, savedWidth, savedHeight) {
        const newX = this.x;
        const newY = this.y;
        const newWidth = this.width;
        const newHeight = this.height;
        if (newX === savedX &&
            newY === savedY &&
            newWidth === savedWidth &&
            newHeight === savedHeight) {
            return;
        }
        this.addCommands({
            cmd: () => {
                this.width = newWidth;
                this.height = newHeight;
                this.x = newX;
                this.y = newY;
                const [parentWidth, parentHeight] = this.parentDimensions;
                this.setDims(parentWidth * newWidth, parentHeight * newHeight);
                this.fixAndSetPosition();
            },
            undo: () => {
                this.width = savedWidth;
                this.height = savedHeight;
                this.x = savedX;
                this.y = savedY;
                const [parentWidth, parentHeight] = this.parentDimensions;
                this.setDims(parentWidth * savedWidth, parentHeight * savedHeight);
                this.fixAndSetPosition();
            },
            mustExec: true,
        });
    }
    #resizerPointermove(name, event) {
        const [parentWidth, parentHeight] = this.parentDimensions;
        const savedX = this.x;
        const savedY = this.y;
        const savedWidth = this.width;
        const savedHeight = this.height;
        const minWidth = _a.MIN_SIZE / parentWidth;
        const minHeight = _a.MIN_SIZE / parentHeight;
        // 10000 because we multiply by 100 and use toFixed(2) in fixAndSetPosition.
        // Without rounding, the positions of the corners other than the top left
        // one can be slightly wrong.
        const round = (x) => Math.round(x * 10000) / 10000;
        const rotationMatrix = this.#getRotationMatrix(this.rotation);
        const transf = (x, y) => [
            rotationMatrix[0] * x + rotationMatrix[2] * y,
            rotationMatrix[1] * x + rotationMatrix[3] * y,
        ];
        const invRotationMatrix = this.#getRotationMatrix(360 - this.rotation);
        const invTransf = (x, y) => [
            invRotationMatrix[0] * x + invRotationMatrix[2] * y,
            invRotationMatrix[1] * x + invRotationMatrix[3] * y,
        ];
        let isDiagonal = false;
        let isHorizontal = false;
        const [getPoint, getOpposite] = /* final switch */ {
            topLeft: () => {
                isDiagonal = true;
                return [(w, h) => [0, 0], (w, h) => [w, h]];
            },
            topMiddle: () => [(w, h) => [w / 2, 0], (w, h) => [w / 2, h]],
            topRight: () => {
                isDiagonal = true;
                return [(w, h) => [w, 0], (w, h) => [0, h]];
            },
            middleRight: () => {
                isDiagonal = true;
                return [(w, h) => [w, h / 2], (w, h) => [0, h / 2]];
            },
            bottomRight: () => {
                isDiagonal = true;
                return [(w, h) => [w, h], (w, h) => [0, 0]];
            },
            bottomMiddle: () => [(w, h) => [w / 2, h], (w, h) => [w / 2, 0]],
            bottomLeft: () => {
                isDiagonal = true;
                return [(w, h) => [0, h], (w, h) => [w, 0]];
            },
            middleLeft: () => {
                isDiagonal = true;
                return [(w, h) => [0, h / 2], (w, h) => [w, h / 2]];
            },
        }[name]();
        const point = getPoint(savedWidth, savedHeight);
        const oppositePoint = getOpposite(savedWidth, savedHeight);
        let transfOppositePoint = transf(...oppositePoint);
        const oppositeX = round(savedX + transfOppositePoint[0]);
        const oppositeY = round(savedY + transfOppositePoint[1]);
        let ratioX = 1;
        let ratioY = 1;
        let [deltaX, deltaY] = this.screenToPageTranslation(event.movementX, event.movementY);
        [deltaX, deltaY] = invTransf(deltaX / parentWidth, deltaY / parentHeight);
        if (isDiagonal) {
            const oldDiag = Math.hypot(savedWidth, savedHeight);
            ratioX = ratioY = Math.max(Math.min(Math.hypot(oppositePoint[0] - point[0] - deltaX, oppositePoint[1] - point[1] - deltaY) / oldDiag, 
            // Avoid the editor to be larger than the page.
            1 / savedWidth, 1 / savedHeight), 
            // Avoid the editor to be smaller than the minimum size.
            minWidth / savedWidth, minHeight / savedHeight);
        }
        else if (isHorizontal) {
            ratioX = Math.max(minWidth, Math.min(1, Math.abs(oppositePoint[0] - point[0] - deltaX))) / savedWidth;
        }
        else {
            ratioY = Math.max(minHeight, Math.min(1, Math.abs(oppositePoint[1] - point[1] - deltaY))) / savedHeight;
        }
        const newWidth = round(savedWidth * ratioX);
        const newHeight = round(savedHeight * ratioY);
        transfOppositePoint = transf(...getOpposite(newWidth, newHeight));
        const newX = oppositeX - transfOppositePoint[0];
        const newY = oppositeY - transfOppositePoint[1];
        this.width = newWidth;
        this.height = newHeight;
        this.x = newX;
        this.y = newY;
        this.setDims(parentWidth * newWidth, parentHeight * newHeight);
        this.fixAndSetPosition();
    }
    altTextFinish() {
        this.#altText?.finish();
    }
    /**
     * Add a toolbar for this editor.
     */
    async addEditToolbar() {
        if (this.#editToolbar || this.#isInEditMode) {
            return this.#editToolbar;
        }
        this.#editToolbar = new EditorToolbar(this);
        this.div.append(this.#editToolbar.render());
        if (this.#altText) {
            this.#editToolbar.addAltTextButton(await this.#altText.render());
        }
        return this.#editToolbar;
    }
    removeEditToolbar() {
        if (!this.#editToolbar) {
            return;
        }
        this.#editToolbar.remove();
        this.#editToolbar = undefined;
        // We destroy the alt text but we don't null it because we want to be able
        // to restore it in case the user undoes the deletion.
        this.#altText?.destroy();
    }
    getClientDimensions() {
        return this.div.getBoundingClientRect();
    }
    async addAltTextButton() {
        if (this.#altText) {
            return;
        }
        AltText.initialize(_a._l10nPromise);
        this.#altText = new AltText(this);
        await this.addEditToolbar();
    }
    /**
     * Render this editor in a div.
     */
    render() {
        this.div = html("div").assignAttro({
            "data-editor-rotation": (360 - this.rotation) % 360,
            id: this.id,
        });
        this.div.className = this.name;
        this.div.tabIndex = this.#disabled ? -1 : 0;
        if (!this._isVisible) {
            this.div.classList.add("hidden");
        }
        this.setInForeground();
        this.div.on("focusin", this.#boundFocusin);
        this.div.on("focusout", this.#boundFocusout);
        const [parentWidth, parentHeight] = this.parentDimensions;
        if (this.parentRotation % 180 !== 0) {
            this.div.style.maxWidth = `${((100 * parentHeight) / parentWidth).toFixed(2)}%`;
            this.div.style.maxHeight = `${((100 * parentWidth) /
                parentHeight).toFixed(2)}%`;
        }
        const [tx, ty] = this.getInitialTranslation();
        this.translate(tx, ty);
        bindEvents(this, this.div, ["pointerdown"]);
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
        this.#hasBeenClicked = true;
        if (this._isDraggable) {
            this.#setUpDragSession(event);
            return;
        }
        this.#selectOnPointerEvent(event);
    }
    #selectOnPointerEvent(event) {
        const { isMac } = FeatureTest.platform;
        if ((event.ctrlKey && !isMac) ||
            event.shiftKey ||
            (event.metaKey && isMac)) {
            this.parent.toggleSelected(this);
        }
        else {
            this.parent.setSelected(this);
        }
    }
    #setUpDragSession(event) {
        const isSelected = this._uiManager.isSelected(this);
        this._uiManager.setUpDragSession();
        let pointerMoveOptions, pointerMoveCallback;
        if (isSelected) {
            this.div.classList.add("moving");
            pointerMoveOptions = { passive: true, capture: true };
            this.#prevDragX = event.clientX;
            this.#prevDragY = event.clientY;
            pointerMoveCallback = (e) => {
                const { clientX: x, clientY: y } = e;
                const [tx, ty] = this.screenToPageTranslation(x - this.#prevDragX, y - this.#prevDragY);
                this.#prevDragX = x;
                this.#prevDragY = y;
                this._uiManager.dragSelectedEditors(tx, ty);
            };
            window.on("pointermove", pointerMoveCallback, pointerMoveOptions);
        }
        const pointerUpCallback = () => {
            window.off("pointerup", pointerUpCallback);
            window.off("blur", pointerUpCallback);
            if (isSelected) {
                this.div.classList.remove("moving");
                window.off("pointermove", pointerMoveCallback, pointerMoveOptions);
            }
            this.#hasBeenClicked = false;
            if (!this._uiManager.endDragSession()) {
                this.#selectOnPointerEvent(event);
            }
        };
        window.on("pointerup", pointerUpCallback);
        // If the user is using alt+tab during the dragging session, the pointerup
        // event could be not fired, but a blur event is fired so we can use it in
        // order to interrupt the dragging session.
        window.on("blur", pointerUpCallback);
    }
    moveInDOM() {
        // Moving the editor in the DOM can be expensive, so we wait a bit before.
        // It's important to not block the UI (for example when changing the font
        // size in a FreeText).
        if (this.#moveInDOMTimeout) {
            clearTimeout(this.#moveInDOMTimeout);
        }
        this.#moveInDOMTimeout = setTimeout(() => {
            this.#moveInDOMTimeout = undefined;
            this.parent?.moveEditorInDOM(this);
        }, 0);
    }
    _setParentAndPosition(parent, x, y) {
        parent.changeParent(this);
        this.x = x;
        this.y = y;
        this.fixAndSetPosition();
    }
    /**
     * Convert the current rect into a page one.
     * @param tx x-translation in screen coordinates.
     * @param ty y-translation in screen coordinates.
     * @param rotation the rotation of the page.
     */
    getRect(tx, ty, rotation = this.rotation) {
        const scale = this.parentScale;
        const [pageWidth, pageHeight] = this.pageDimensions;
        const [pageX, pageY] = this.pageTranslation;
        const shiftX = tx / scale;
        const shiftY = ty / scale;
        const x = this.x * pageWidth;
        const y = this.y * pageHeight;
        const width = this.width * pageWidth;
        const height = this.height * pageHeight;
        switch (rotation) {
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
     * If it returns true, then this editor handles the keyboard
     * events itself.
     */
    shouldGetKeyboardEvents() {
        return this.#isResizerEnabledForKeyboard;
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
     * Rotate the editor.
     */
    rotate(_angle) { }
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
        this.div.off("focusin", this.#boundFocusin);
        this.div.off("focusout", this.#boundFocusout);
        if (!this.isEmpty()) {
            // The editor is removed but it can be back at some point thanks to
            // undo/redo so we must commit it before.
            this.commit();
        }
        if (this.parent) {
            this.parent.remove(this);
        }
        else {
            this._uiManager.removeEditor(this);
        }
        if (this.#moveInDOMTimeout) {
            clearTimeout(this.#moveInDOMTimeout);
            this.#moveInDOMTimeout = undefined;
        }
        this.#stopResizing();
        this.removeEditToolbar();
        if (this.#telemetryTimeouts) {
            for (const timeout of this.#telemetryTimeouts.values()) {
                clearTimeout(timeout);
            }
            this.#telemetryTimeouts = undefined;
        }
        this.parent = undefined;
    }
    /**
     * @return true if this editor can be resized.
     */
    get isResizable() {
        return false;
    }
    /**
     * Add the resizers to this editor.
     */
    makeResizable() {
        if (this.isResizable) {
            this.#createResizers();
            this.#resizersDiv.classList.remove("hidden");
            bindEvents(this, this.div, ["keydown"]);
        }
    }
    get toolbarPosition() {
        return undefined;
    }
    /**
     * onkeydown callback.
     */
    keydown(event) {
        if (!this.isResizable ||
            event.target !== this.div ||
            event.key !== "Enter") {
            return;
        }
        this._uiManager.setSelected(this);
        this.#savedDimensions = {
            savedX: this.x,
            savedY: this.y,
            savedWidth: this.width,
            savedHeight: this.height,
        };
        const children = this.#resizersDiv.children;
        if (!this.#allResizerDivs) {
            this.#allResizerDivs = Array.from(children);
            const boundResizerKeydown = this.#resizerKeydown.bind(this);
            const boundResizerBlur = this.#resizerBlur.bind(this);
            for (const div of this.#allResizerDivs) {
                const name = div.getAttribute("data-resizer-name");
                div.setAttribute("role", "spinbutton");
                div.on("keydown", boundResizerKeydown);
                div.on("blur", boundResizerBlur);
                div.on("focus", this.#resizerFocus.bind(this, name));
                _a._l10nPromise
                    .get(`pdfjs-editor-resizer-label-${name}`)
                    .then((msg) => div.setAttribute("aria-label", msg));
            }
        }
        // We want to have the resizers in the visual order, so we move the first
        // (top-left) to the right place.
        const first = this.#allResizerDivs[0];
        let firstPosition = 0;
        for (const div of children) {
            if (div === first) {
                break;
            }
            firstPosition++;
        }
        const nextFirstPosition = (((360 - this.rotation + this.parentRotation) % 360) / 90) *
            (this.#allResizerDivs.length / 4);
        if (nextFirstPosition !== firstPosition) {
            // We need to reorder the resizers in the DOM in order to have the focus
            // on the top-left one.
            if (nextFirstPosition < firstPosition) {
                for (let i = 0; i < firstPosition - nextFirstPosition; i++) {
                    this.#resizersDiv.append(this.#resizersDiv.firstChild);
                }
            }
            else if (nextFirstPosition > firstPosition) {
                for (let i = 0; i < nextFirstPosition - firstPosition; i++) {
                    this.#resizersDiv.firstChild.before(this.#resizersDiv.lastChild);
                }
            }
            let i = 0;
            for (const child of children) {
                const div = this.#allResizerDivs[i++];
                const name = div.getAttribute("data-resizer-name");
                _a._l10nPromise
                    .get(`pdfjs-editor-resizer-label-${name}`)
                    .then((msg) => child.setAttribute("aria-label", msg));
            }
        }
        this.#setResizerTabIndex(0);
        this.#isResizerEnabledForKeyboard = true;
        this.#resizersDiv.firstChild.focus({
            focusVisible: true,
        });
        event.preventDefault();
        event.stopImmediatePropagation();
    }
    #resizerKeydown(event) {
        _a._resizerKeyboardManager.exec(this, event);
    }
    #resizerBlur(event) {
        if (this.#isResizerEnabledForKeyboard &&
            event.relatedTarget?.parentNode !== this.#resizersDiv) {
            this.#stopResizing();
        }
    }
    #resizerFocus(name) {
        this.#focusedResizerName = this.#isResizerEnabledForKeyboard
            ? name
            : undefined;
    }
    #setResizerTabIndex(value) {
        if (!this.#allResizerDivs) {
            return;
        }
        for (const div of this.#allResizerDivs) {
            div.tabIndex = value;
        }
    }
    _resizeWithKeyboard(x, y) {
        if (!this.#isResizerEnabledForKeyboard) {
            return;
        }
        this.#resizerPointermove(this.#focusedResizerName, {
            movementX: x,
            movementY: y,
        });
    }
    #stopResizing() {
        this.#isResizerEnabledForKeyboard = false;
        this.#setResizerTabIndex(-1);
        if (this.#savedDimensions) {
            const { savedX, savedY, savedWidth, savedHeight } = this.#savedDimensions;
            this.#addResizeToUndoStack(savedX, savedY, savedWidth, savedHeight);
            this.#savedDimensions = undefined;
        }
    }
    _stopResizingWithKeyboard() {
        this.#stopResizing();
        this.div.focus();
    }
    /**
     * Select this editor.
     */
    select() {
        this.makeResizable();
        this.div?.classList.add("selectedEditor");
        if (!this.#editToolbar) {
            this.addEditToolbar().then(() => {
                if (this.div?.classList.contains("selectedEditor")) {
                    // The editor can have been unselected while we were waiting for the
                    // edit toolbar to be created, hence we want to be sure that this
                    // editor is still selected.
                    this.#editToolbar?.show();
                }
            });
            return;
        }
        this.#editToolbar?.show();
    }
    /**
     * Unselect this editor.
     */
    unselect() {
        this.#resizersDiv?.classList.add("hidden");
        this.div?.classList.remove("selectedEditor");
        if (this.div?.contains(document.activeElement)) {
            // Don't use this.div.blur() because we don't know where the focus will
            // go.
            this._uiManager.currentLayer.div.focus({
                preventScroll: true,
            });
        }
        this.#editToolbar?.hide();
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
     * The editor is about to be edited.
     */
    enterInEditMode() { }
    /**
     * @return the element requiring an alt text.
     */
    getImageForAltText() {
        return undefined;
    }
    /**
     * Get the div which really contains the displayed content.
     */
    get contentDiv() {
        return this.div;
    }
    /**
     * If true then the editor is currently edited.
     */
    get isEditing() {
        return this.#isEditing;
    }
    /**
     * When set to true, it means that this editor is currently edited.
     */
    set isEditing(value) {
        this.#isEditing = value;
        if (!this.parent) {
            return;
        }
        if (value) {
            this.parent.setSelected(this);
            this.parent.setActiveEditor(this);
        }
        else {
            this.parent.setActiveEditor(undefined);
        }
    }
    /**
     * Set the aspect ratio to use when resizing.
     */
    setAspectRatio(width, height) {
        this.#keepAspectRatio = true;
        const aspectRatio = width / height;
        this.div.assignStylo({
            aspectRatio,
            height: "auto",
        });
    }
    static get MIN_SIZE() {
        return 16;
    }
    static canCreateNewEmptyEditor() {
        return true;
    }
    /**
     * Get the data to report to the telemetry when the editor is added.
     */
    get telemetryInitialData() {
        return { action: "added" };
    }
    /**
     * The telemetry data to use when saving/printing.
     */
    get telemetryFinalData() {
        return undefined;
    }
    static computeTelemetryFinalData(data) {
        return undefined;
    }
    _reportTelemetry(data, mustWait = false) {
        if (mustWait) {
            this.#telemetryTimeouts ||= new Map();
            const { action } = data;
            let timeout = this.#telemetryTimeouts.get(action);
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => {
                this._reportTelemetry(data);
                this.#telemetryTimeouts.delete(action);
                if (this.#telemetryTimeouts.size === 0) {
                    this.#telemetryTimeouts = undefined;
                }
            }, _a._telemetryTimeout);
            this.#telemetryTimeouts.set(action, timeout);
            return;
        }
        data.type ||= this.editorType;
        this._uiManager._eventBus.dispatch("reporttelemetry", {
            source: this,
            details: {
                type: "editing",
                data,
            },
        });
    }
    /**
     * Show or hide this editor.
     */
    show(visible = this._isVisible) {
        this.div.classList.toggle("hidden", !visible);
        this._isVisible = visible;
    }
    enable() {
        if (this.div) {
            this.div.tabIndex = 0;
        }
        this.#disabled = false;
    }
    disable() {
        if (this.div) {
            this.div.tabIndex = -1;
        }
        this.#disabled = true;
    }
}
_a = AnnotationEditor;
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