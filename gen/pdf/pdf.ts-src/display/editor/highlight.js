/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2024
 *
 * @module pdf/pdf.ts-src/display/editor/highlight.ts
 * @license Apache-2.0
 ******************************************************************************/
var _a;
import { html } from "../../../../lib/dom.js";
import { noContextMenu } from "../../../../lib/util/general.js";
import { AnnotationEditorParamsType, AnnotationEditorType, shadow, Util, } from "../../shared/util.js";
import { ColorPicker } from "./color_picker.js";
import { AnnotationEditor } from "./editor.js";
import { FreeOutliner, Outliner } from "./outliner.js";
import { bindEvents, KeyboardManager, } from "./tools.js";
/**
 * Basic draw editor in order to generate an Highlight annotation.
 */
export class HighlightEditor extends AnnotationEditor {
    static _type = "highlight";
    static _editorType = AnnotationEditorType.HIGHLIGHT;
    color;
    #anchorNode = null;
    #anchorOffset = 0;
    #boxes;
    #clipPathId;
    #colorPicker;
    #focusOutlines;
    #focusNode = null;
    #focusOffset = 0;
    #highlightDiv;
    #highlightOutlines;
    #id;
    #isFreeHighlight = false;
    #boundKeydown = this.#keydown.bind(this);
    #lastPoint;
    #opacity;
    #outlineId;
    #text = "";
    #thickness;
    #methodOfCreation = "";
    static _defaultColor;
    static _defaultOpacity = 1;
    static _defaultThickness = 12;
    static _freeHighlightId = -1;
    static _freeOutliner;
    static _freeHighlight;
    static _freeHighlightClipId = "";
    static get _keyboardManager() {
        const proto = _a.prototype;
        return shadow(this, "_keyboardManager", new KeyboardManager([
            [["ArrowLeft", "mac+ArrowLeft"], proto._moveCaret, { args: [0] }],
            [["ArrowRight", "mac+ArrowRight"], proto._moveCaret, { args: [1] }],
            [["ArrowUp", "mac+ArrowUp"], proto._moveCaret, { args: [2] }],
            [["ArrowDown", "mac+ArrowDown"], proto._moveCaret, { args: [3] }],
        ]));
    }
    constructor(params) {
        super({ ...params, name: "highlightEditor" });
        this.color = params.color || _a._defaultColor;
        this.#thickness = params.thickness || _a._defaultThickness;
        this.#opacity = params.opacity || _a._defaultOpacity;
        this.#boxes = params.boxes;
        this.#methodOfCreation = params.methodOfCreation || "";
        this.#text = params.text || "";
        this._isDraggable = false;
        if (params.highlightId > -1) {
            this.#isFreeHighlight = true;
            this.#createFreeOutlines(params);
            this.#addToDrawLayer();
        }
        else {
            this.#anchorNode = params.anchorNode;
            this.#anchorOffset = params.anchorOffset;
            this.#focusNode = params.focusNode;
            this.#focusOffset = params.focusOffset;
            this.#createOutlines();
            this.#addToDrawLayer();
            this.rotate(this.rotation);
        }
    }
    get telemetryInitialData() {
        return {
            action: "added",
            type: this.#isFreeHighlight ? "free_highlight" : "highlight",
            color: this._uiManager.highlightColorNames.get(this.color),
            thickness: this.#thickness,
            methodOfCreation: this.#methodOfCreation,
        };
    }
    get telemetryFinalData() {
        return {
            type: "highlight",
            color: this._uiManager.highlightColorNames.get(this.color),
        };
    }
    static computeTelemetryFinalData(data) {
        // We want to know how many colors have been used.
        return { numberOfColors: data.get("color").size };
    }
    #createOutlines() {
        const outliner = new Outliner(this.#boxes, /* borderWidth = */ 0.001);
        this.#highlightOutlines = outliner.getOutlines();
        ({
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
        } = this.#highlightOutlines.box);
        const outlinerForOutline = new Outliner(this.#boxes, 
        /* borderWidth = */ 0.0025, 
        /* innerMargin = */ 0.001, this._uiManager.direction === "ltr");
        this.#focusOutlines = outlinerForOutline.getOutlines();
        // The last point is in the pages coordinate system.
        const { lastPoint } = this.#focusOutlines.box;
        this.#lastPoint = [
            (lastPoint[0] - this.x) / this.width,
            (lastPoint[1] - this.y) / this.height,
        ];
    }
    #createFreeOutlines({ highlightOutlines, highlightId, clipPathId }) {
        this.#highlightOutlines = highlightOutlines;
        const extraThickness = 1.5;
        this.#focusOutlines = highlightOutlines.getNewOutline(
        /* Slightly bigger than the highlight in order to have a little
           space between the highlight and the outline. */
        this.#thickness / 2 + extraThickness, 
        /* innerMargin = */ 0.0025);
        if (highlightId >= 0) {
            this.#id = highlightId;
            this.#clipPathId = clipPathId;
            // We need to redraw the highlight because we change the coordinates to be
            // in the box coordinate system.
            this.parent.drawLayer.finalizeLine(highlightId, highlightOutlines);
            this.#outlineId = this.parent.drawLayer.highlightOutline(this.#focusOutlines);
        }
        else if (this.parent) {
            const angle = this.parent.viewport.rotation;
            this.parent.drawLayer.updateLine(this.#id, highlightOutlines);
            this.parent.drawLayer.updateBox(this.#id, _a.#rotateBbox(this.#highlightOutlines.box, (angle - this.rotation + 360) % 360));
            this.parent.drawLayer.updateLine(this.#outlineId, this.#focusOutlines);
            this.parent.drawLayer.updateBox(this.#outlineId, _a.#rotateBbox(this.#focusOutlines.box, angle));
        }
        const { x, y, width, height } = highlightOutlines.box;
        switch (this.rotation) {
            case 0:
                this.x = x;
                this.y = y;
                this.width = width;
                this.height = height;
                break;
            case 90: {
                const [pageWidth, pageHeight] = this.parentDimensions;
                this.x = y;
                this.y = 1 - x;
                this.width = (width * pageHeight) / pageWidth;
                this.height = (height * pageWidth) / pageHeight;
                break;
            }
            case 180:
                this.x = 1 - x;
                this.y = 1 - y;
                this.width = width;
                this.height = height;
                break;
            case 270: {
                const [pageWidth, pageHeight] = this.parentDimensions;
                this.x = 1 - y;
                this.y = x;
                this.width = (width * pageHeight) / pageWidth;
                this.height = (height * pageWidth) / pageHeight;
                break;
            }
        }
        const { lastPoint } = this.#focusOutlines.box;
        this.#lastPoint = [
            (lastPoint[0] - x) / width,
            (lastPoint[1] - y) / height,
        ];
    }
    /** @inheritdoc */
    static initialize(l10n, uiManager) {
        AnnotationEditor.initialize(l10n, uiManager);
        _a._defaultColor ||=
            uiManager.highlightColors?.values().next().value || "#fff066";
    }
    /** @inheritdoc */
    static updateDefaultParams(type, value) {
        switch (type) {
            case AnnotationEditorParamsType.HIGHLIGHT_DEFAULT_COLOR:
                _a._defaultColor = value;
                break;
            case AnnotationEditorParamsType.HIGHLIGHT_THICKNESS:
                _a._defaultThickness = value;
                break;
        }
    }
    /** @inheritdoc */
    translateInPage(x, y) { }
    /** @inheritdoc */
    get toolbarPosition() {
        return this.#lastPoint;
    }
    /** @inheritdoc */
    updateParams(type, value) {
        switch (type) {
            case AnnotationEditorParamsType.HIGHLIGHT_COLOR:
                this.#updateColor(value);
                break;
            case AnnotationEditorParamsType.HIGHLIGHT_THICKNESS:
                this.#updateThickness(value);
                break;
        }
    }
    static get defaultPropertiesToUpdate() {
        return [
            [
                AnnotationEditorParamsType.HIGHLIGHT_DEFAULT_COLOR,
                _a._defaultColor,
            ],
            [
                AnnotationEditorParamsType.HIGHLIGHT_THICKNESS,
                _a._defaultThickness,
            ],
        ];
    }
    /** @inheritdoc */
    get propertiesToUpdate() {
        return [
            [
                AnnotationEditorParamsType.HIGHLIGHT_COLOR,
                this.color || _a._defaultColor,
            ],
            [
                AnnotationEditorParamsType.HIGHLIGHT_THICKNESS,
                this.#thickness || _a._defaultThickness,
            ],
            [AnnotationEditorParamsType.HIGHLIGHT_FREE, this.#isFreeHighlight],
        ];
    }
    /**
     * Update the color and make this action undoable.
     */
    #updateColor(color) {
        const setColor = (col) => {
            this.color = col;
            this.parent?.drawLayer.changeColor(this.#id, col);
            this.#colorPicker?.updateColor(col);
        };
        const savedColor = this.color;
        this.addCommands({
            cmd: setColor.bind(this, color),
            undo: setColor.bind(this, savedColor),
            post: this._uiManager.updateUI.bind(this._uiManager, this),
            mustExec: true,
            type: AnnotationEditorParamsType.HIGHLIGHT_COLOR,
            overwriteIfSameType: true,
            keepUndo: true,
        });
        this._reportTelemetry({
            action: "color_changed",
            color: this._uiManager.highlightColorNames.get(color),
        }, 
        /* mustWait = */ true);
    }
    /**
     * Update the thickness and make this action undoable.
     */
    #updateThickness(thickness) {
        const savedThickness = this.#thickness;
        const setThickness = (th) => {
            this.#thickness = th;
            this.#changeThickness(th);
        };
        this.addCommands({
            cmd: setThickness.bind(this, thickness),
            undo: setThickness.bind(this, savedThickness),
            post: this._uiManager.updateUI.bind(this._uiManager, this),
            mustExec: true,
            type: AnnotationEditorParamsType.INK_THICKNESS,
            overwriteIfSameType: true,
            keepUndo: true,
        });
        this._reportTelemetry({ action: "thickness_changed", thickness }, 
        /* mustWait = */ true);
    }
    /** @inheritdoc */
    async addEditToolbar() {
        const toolbar = await super.addEditToolbar();
        if (!toolbar) {
            return undefined;
        }
        if (this._uiManager.highlightColors) {
            this.#colorPicker = new ColorPicker({ editor: this });
            toolbar.addColorPicker(this.#colorPicker);
        }
        return toolbar;
    }
    /** @inheritdoc */
    disableEditing() {
        super.disableEditing();
        this.div.classList.toggle("disabled", true);
    }
    /** @inheritdoc */
    enableEditing() {
        super.enableEditing();
        this.div.classList.toggle("disabled", false);
    }
    /** @inheritdoc */
    fixAndSetPosition() {
        return super.fixAndSetPosition(this.#getRotation());
    }
    /** @inheritdoc */
    getBaseTranslation() {
        // The editor itself doesn't have any CSS border (we're drawing one
        // ourselves in using SVG).
        return [0, 0];
    }
    /** @inheritdoc */
    getRect(tx, ty) {
        return super.getRect(tx, ty, this.#getRotation());
    }
    /** @inheritdoc */
    onceAdded() {
        this.parent.addUndoableEditor(this);
        this.div.focus();
    }
    /** @inheritdoc */
    remove() {
        this.#cleanDrawLayer();
        this._reportTelemetry({
            action: "deleted",
        });
        super.remove();
    }
    /** @inheritdoc */
    rebuild() {
        if (!this.parent) {
            return;
        }
        super.rebuild();
        if (this.div === undefined) {
            return;
        }
        this.#addToDrawLayer();
        if (!this.isAttachedToDOM) {
            // At some point this editor was removed and we're rebuilding it,
            // hence we must add it to its parent.
            this.parent.add(this);
        }
    }
    setParent(parent) {
        let mustBeSelected = false;
        if (this.parent && !parent) {
            this.#cleanDrawLayer();
        }
        else if (parent) {
            this.#addToDrawLayer(parent);
            // If mustBeSelected is true it means that this editor was selected
            // when its parent has been destroyed, hence we must select it again.
            mustBeSelected = !this.parent &&
                !!this.div?.classList.contains("selectedEditor");
        }
        super.setParent(parent);
        this.show(this._isVisible);
        if (mustBeSelected) {
            // We select it after the parent has been set.
            this.select();
        }
    }
    #changeThickness(thickness) {
        if (!this.#isFreeHighlight) {
            return;
        }
        this.#createFreeOutlines({
            highlightOutlines: this.#highlightOutlines.getNewOutline(thickness / 2),
        });
        this.fixAndSetPosition();
        const [parentWidth, parentHeight] = this.parentDimensions;
        this.setDims(this.width * parentWidth, this.height * parentHeight);
    }
    #cleanDrawLayer() {
        if (this.#id === undefined || !this.parent) {
            return;
        }
        this.parent.drawLayer.remove(this.#id);
        this.#id = undefined;
        this.parent.drawLayer.remove(this.#outlineId);
        this.#outlineId = undefined;
    }
    #addToDrawLayer(parent = this.parent) {
        if (this.#id !== undefined) {
            return;
        }
        ({ id: this.#id, clipPathId: this.#clipPathId } = parent.drawLayer
            .highlight(this.#highlightOutlines, this.color, this.#opacity));
        this.#outlineId = parent.drawLayer.highlightOutline(this.#focusOutlines);
        if (this.#highlightDiv) {
            this.#highlightDiv.style.clipPath = this.#clipPathId;
        }
    }
    static #rotateBbox({ x, y, width, height }, angle) {
        switch (angle) {
            case 90:
                return {
                    x: 1 - y - height,
                    y: x,
                    width: height,
                    height: width,
                };
            case 180:
                return {
                    x: 1 - x - width,
                    y: 1 - y - height,
                    width,
                    height,
                };
            case 270:
                return {
                    x: y,
                    y: 1 - x - width,
                    width: height,
                    height: width,
                };
        }
        return {
            x,
            y,
            width,
            height,
        };
    }
    /** @inheritdoc */
    rotate(angle) {
        // We need to rotate the svgs because of the coordinates system.
        const { drawLayer } = this.parent;
        let box;
        if (this.#isFreeHighlight) {
            angle = (angle - this.rotation + 360) % 360;
            box = _a.#rotateBbox(this.#highlightOutlines.box, angle);
        }
        else {
            // An highlight annotation is always drawn horizontally.
            // box = HighlightEditor.#rotateBbox(this, angle); //kkkk bug?
            box = _a.#rotateBbox(this.#focusOutlines.box, angle);
        }
        drawLayer.rotate(this.#id, angle);
        drawLayer.rotate(this.#outlineId, angle);
        drawLayer.updateBox(this.#id, box);
        drawLayer.updateBox(this.#outlineId, _a.#rotateBbox(this.#focusOutlines.box, angle));
    }
    /** @inheritdoc */
    render() {
        if (this.div) {
            return this.div;
        }
        const div = super.render();
        if (this.#text) {
            div.setAttribute("aria-label", this.#text);
            div.setAttribute("role", "mark");
        }
        if (this.#isFreeHighlight) {
            div.classList.add("free");
        }
        else {
            this.div.on("keydown", this.#boundKeydown, {
                signal: this._uiManager._signal,
            });
        }
        const highlightDiv = (this.#highlightDiv = html("div"));
        div.append(highlightDiv);
        highlightDiv.setAttribute("aria-hidden", "true");
        highlightDiv.className = "internal";
        highlightDiv.style.clipPath = this.#clipPathId;
        const [parentWidth, parentHeight] = this.parentDimensions;
        this.setDims(this.width * parentWidth, this.height * parentHeight);
        bindEvents(this, this.#highlightDiv, ["pointerover", "pointerleave"]);
        this.enableEditing();
        return div;
    }
    pointerover() {
        this.parent.drawLayer.addClass(this.#outlineId, "hovered");
    }
    pointerleave() {
        this.parent.drawLayer.removeClass(this.#outlineId, "hovered");
    }
    #keydown(event) {
        _a._keyboardManager.exec(this, event);
    }
    _moveCaret(direction) {
        this.parent.unselect(this);
        switch (direction) {
            case 0 /* left */:
            case 2 /* up */:
                this.#setCaret(/* start = */ true);
                break;
            case 1 /* right */:
            case 3 /* down */:
                this.#setCaret(/* start = */ false);
                break;
        }
    }
    #setCaret(start) {
        if (!this.#anchorNode) {
            return;
        }
        const selection = window.getSelection();
        if (start) {
            selection.setPosition(this.#anchorNode, this.#anchorOffset);
        }
        else {
            selection.setPosition(this.#focusNode, this.#focusOffset);
        }
    }
    /** @inheritdoc */
    select() {
        super.select();
        if (!this.#outlineId) {
            return;
        }
        this.parent?.drawLayer.removeClass(this.#outlineId, "hovered");
        this.parent?.drawLayer.addClass(this.#outlineId, "selected");
    }
    /** @inheritdoc */
    unselect() {
        super.unselect();
        if (!this.#outlineId) {
            return;
        }
        this.parent?.drawLayer.removeClass(this.#outlineId, "selected");
        if (!this.#isFreeHighlight) {
            this.#setCaret(/* start = */ false);
        }
    }
    /** @inheritdoc */
    get _mustFixPosition() {
        return !this.#isFreeHighlight;
    }
    /** @inheritdoc */
    show(visible = this._isVisible) {
        super.show(visible);
        if (this.parent) {
            this.parent.drawLayer.show(this.#id, visible);
            this.parent.drawLayer.show(this.#outlineId, visible);
        }
    }
    #getRotation() {
        // Highlight annotations are always drawn horizontally but if
        // a free highlight annotation can be rotated.
        return this.#isFreeHighlight ? this.rotation : 0;
    }
    #serializeBoxes() {
        if (this.#isFreeHighlight) {
            return undefined;
        }
        const [pageWidth, pageHeight] = this.pageDimensions;
        const [pageX, pageY] = this.pageTranslation;
        const boxes = this.#boxes;
        const quadPoints = new Float32Array(boxes.length * 8);
        let i = 0;
        for (const { x, y, width, height } of boxes) {
            const sx = x * pageWidth + pageX;
            const sy = (1 - y - height) * pageHeight + pageY;
            // The specifications say that the rectangle should start from the bottom
            // left corner and go counter-clockwise.
            // But when opening the file in Adobe Acrobat it appears that this isn't
            // correct hence the 4th and 6th numbers are just swapped.
            quadPoints[i] = quadPoints[i + 4] = sx;
            quadPoints[i + 1] = quadPoints[i + 3] = sy;
            quadPoints[i + 2] = quadPoints[i + 6] = sx + width * pageWidth;
            quadPoints[i + 5] = quadPoints[i + 7] = sy + height * pageHeight;
            i += 8;
        }
        return quadPoints;
    }
    #serializeOutlines(rect) {
        return this.#highlightOutlines.serialize(rect, this.#getRotation());
    }
    static startHighlighting(parent, isLTR, { target: textLayer, x, y }) {
        const { x: layerX, y: layerY, width: parentWidth, height: parentHeight, } = textLayer.getBoundingClientRect();
        const pointerMove = (e) => {
            this.#highlightMove(parent, e);
        };
        const signal = parent._signal;
        const pointerDownOptions = { capture: true, passive: false, signal };
        const pointerDown = (e) => {
            // Avoid to have undesired clicks during the drawing.
            e.preventDefault();
            e.stopPropagation();
        };
        const pointerUpCallback = (e) => {
            textLayer.off("pointermove", pointerMove);
            window.off("blur", pointerUpCallback);
            window.off("pointerup", pointerUpCallback);
            window.off("pointerdown", pointerDown, pointerDownOptions);
            window.off("contextmenu", noContextMenu);
            this.#endHighlight(parent, e);
        };
        window.on("blur", pointerUpCallback, { signal });
        window.on("pointerup", pointerUpCallback, { signal });
        window.on("pointerdown", pointerDown, pointerDownOptions);
        window.on("contextmenu", noContextMenu, { signal });
        textLayer.on("pointermove", pointerMove, { signal });
        // this._freeHighlight = new FreeOutliner(
        //   { x, y },
        //   [layerX, layerY, parentWidth, parentHeight],
        //   parent.scale,
        //   this._defaultThickness / 2,
        //   isLTR,
        //   /* innerMargin = */ 0.001,
        // ); //kkkk bug?
        this._freeOutliner = new FreeOutliner({ x, y }, [layerX, layerY, parentWidth, parentHeight], parent.scale, this._defaultThickness / 2, isLTR, 
        /* innerMargin = */ 0.001);
        this._freeHighlight = this._freeOutliner.getOutlines();
        ({ id: this._freeHighlightId, clipPathId: this._freeHighlightClipId } =
            parent.drawLayer.highlight(this._freeHighlight, this._defaultColor, this._defaultOpacity, 
            /* isPathUpdatable = */ true));
    }
    static #highlightMove(parent, event) {
        if (this._freeOutliner.add(event)) {
            // Redraw only if the point has been added.
            parent.drawLayer.updatePath(this._freeHighlightId, this._freeHighlight);
        }
    }
    static #endHighlight(parent, event) {
        if (!this._freeOutliner.isEmpty()) {
            parent.createAndAddNewEditor(event, false, {
                highlightId: this._freeHighlightId,
                // highlightOutlines: this._freeHighlight!.getOutlines(), //kkkk bug?
                highlightOutlines: this._freeHighlight,
                clipPathId: this._freeHighlightClipId,
                methodOfCreation: "main_toolbar",
            });
        }
        else {
            parent.drawLayer.removeFreeHighlight(this._freeHighlightId);
        }
        this._freeHighlightId = -1;
        this._freeOutliner = undefined;
        this._freeHighlight = undefined;
        this._freeHighlightClipId = "";
    }
    /** @inheritdoc */
    static deserialize(data, parent, uiManager) {
        const editor = super.deserialize(data, parent, uiManager);
        // const {
        //   rect: [blX, blY, trX, trY],
        //   color,
        //   quadPoints,
        // } = data;
        const [blX, blY, trX, trY] = data.rect;
        const color = data.color;
        const quadPoints = data.quadPoints;
        editor.color = Util.makeHexColor(...color);
        editor.#opacity = data.opacity;
        const [pageWidth, pageHeight] = editor.pageDimensions;
        editor.width = (trX - blX) / pageWidth;
        editor.height = (trY - blY) / pageHeight;
        const boxes = (editor.#boxes = []);
        for (let i = 0; i < quadPoints.length; i += 8) {
            boxes.push({
                x: (quadPoints[4] - trX) / pageWidth,
                y: (trY - (1 - quadPoints[i + 5])) / pageHeight,
                width: (quadPoints[i + 2] - quadPoints[i]) / pageWidth,
                height: (quadPoints[i + 5] - quadPoints[i + 1]) / pageHeight,
            });
        }
        editor.#createOutlines();
        return editor;
    }
    /**
     * @inheritdoc
     * @implement
     */
    serialize(isForCopying = false) {
        // It doesn't make sense to copy/paste a highlight annotation.
        if (this.isEmpty() || isForCopying) {
            return undefined;
        }
        const rect = this.getRect(0, 0);
        const color = AnnotationEditor._colorManager.convert(this.color);
        return {
            annotationType: AnnotationEditorType.HIGHLIGHT,
            color,
            opacity: this.#opacity,
            thickness: this.#thickness,
            quadPoints: this.#serializeBoxes(),
            outlines: this.#serializeOutlines(rect),
            pageIndex: this.pageIndex,
            rect,
            rotation: this.#getRotation(),
            structTreeParentId: this._structTreeParentId,
        };
    }
    static canCreateNewEmptyEditor() {
        return false;
    }
}
_a = HighlightEditor;
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=highlight.js.map