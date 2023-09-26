/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2022 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// eslint-disable-next-line max-len
/** @typedef {import("./annotation_editor_layer.js").AnnotationEditorLayer} AnnotationEditorLayer */
// eslint-disable-next-line max-len
/** @typedef {import("./tools.js").AnnotationEditorUIManager} AnnotationEditorUIManager */

import type {
  Constructor,
  dim2d_t,
  dot2d_t,
  rect_t,
} from "@fe-src/lib/alias.ts";
import { html } from "@fe-src/lib/dom.ts";
import { fail } from "@fe-src/lib/util/trace.ts";
import type { IL10n } from "../../../pdf.ts-web/interfaces.ts";
import {
  AnnotationEditorParamsType,
  FeatureTest,
  shadow,
} from "../../shared/util.ts";
import type { AnnotStorageValue } from "../annotation_layer.ts";
import type { AnnotationEditorLayer } from "./annotation_editor_layer.ts";
import type { AddCommandsP, AnnotationEditorUIManager } from "./tools.ts";
import { bindEvents, ColorManager } from "./tools.ts";
/*80--------------------------------------------------------------------------*/

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

type ResizerName_ =
  | "topLeft"
  | "topMiddle"
  | "topRight"
  | "middleRight"
  | "bottomRight"
  | "bottomMiddle"
  | "bottomLeft"
  | "middleLeft";

type InitialOptions_ = {
  isCentered?: boolean;
};

/**
 * Base class for editors.
 */
export abstract class AnnotationEditor {
  static readonly _type: "freetext" | "ink" | "stamp";
  static _colorManager = new ColorManager();
  static _zIndex = 1;

  parent: AnnotationEditorLayer | undefined;
  id;
  width?: number;
  height?: number;
  pageIndex;
  name;
  div?: HTMLDivElement;
  _uiManager;
  _focusEventsAllowed = true;
  annotationElementId: string | undefined;
  _willKeepAspectRatio = false;
  _initialOptions: InitialOptions_ = Object.create(null);
  isAttachedToDOM = false;
  deleted = false;

  rotation;
  pageRotation;
  pageDimensions: dim2d_t;
  pageTranslation;
  x;
  y;

  #keepAspectRatio = false;
  #resizersDiv: HTMLDivElement | undefined;

  #boundFocusin = this.focusin.bind(this);
  #boundFocusout = this.focusout.bind(this);
  #hasBeenClicked = false;
  #isEditing = false;
  #isInEditMode = false;
  #isDraggable = false;
  #zIndex = AnnotationEditor._zIndex++;

  startX!: number;
  startY!: number;

  constructor(parameters: AnnotationEditorP) {
    if (this.constructor === AnnotationEditor) {
      fail("Cannot initialize AnnotationEditor.");
    }

    this.parent = parameters.parent;
    this.id = parameters.id;
    this.pageIndex = parameters.parent.pageIndex;
    this.name = parameters.name;
    this._uiManager = parameters.uiManager;
    this._initialOptions.isCentered = parameters.isCentered;

    const {
      rotation,
      rawDims: { pageWidth, pageHeight, pageX, pageY },
    } = this.parent.viewport;

    this.rotation = rotation;
    this.pageRotation =
      (360 + rotation - this._uiManager.viewParameters.rotation) % 360;
    this.pageDimensions = [pageWidth, pageHeight];
    this.pageTranslation = [pageX, pageY];

    const [width, height] = this.parent.viewportBaseDimensions;
    this.x = parameters.x / width;
    this.y = parameters.y / height;
  }

  static get _defaultLineColor(): string {
    return shadow(
      this,
      "_defaultLineColor",
      this._colorManager.getHexCode("CanvasText"),
    );
  }

  static deleteAnnotationElement(editor: AnnotationEditor) {
    const fakeEditor = new FakeEditor({
      id: editor.parent!.getNextId(),
      parent: editor.parent!,
      uiManager: editor._uiManager,
    } as AnnotationEditorP);
    fakeEditor.annotationElementId = editor.annotationElementId;
    fakeEditor.deleted = true;
    fakeEditor._uiManager.addToAnnotationStorage(fakeEditor);
  }

  /**
   * Initialize the l10n stuff for this type of editor.
   */
  static initialize(_l10n: IL10n) {}

  /**
   * Update the default parameters for this type of editor.
   * @param {number} _type
   * @param {*} _value
   */
  static updateDefaultParams(
    _type: AnnotationEditorParamsType,
    _value: number | string | undefined,
  ) {}

  /**
   * Get the default properties to set in the UI for this type of editor.
   */
  static get defaultPropertiesToUpdate(): PropertyToUpdate[] {
    return [];
  }

  /**
   * Check if this kind of editor is able to handle the given mime type for
   * pasting.
   */
  static isHandlingMimeForPasting(_mime: string): boolean {
    return false;
  }

  /**
   * Extract the data from the clipboard item and delegate the creation of the
   * editor to the parent.
   */
  static paste(item: DataTransferItem, parent: AnnotationEditorLayer): void {
    fail("Not implemented");
  }

  /**
   * Get the properties to update in the UI for this editor.
   */
  get propertiesToUpdate(): PropertyToUpdate[] {
    return [];
  }

  get _isDraggable() {
    return this.#isDraggable;
  }

  set _isDraggable(value) {
    this.#isDraggable = value;
    this.div?.classList.toggle("draggable", value);
  }

  center() {
    const [pageWidth, pageHeight] = this.pageDimensions;
    switch (this.parentRotation) {
      case 90:
        this.x -= (this.height! * pageHeight) / (pageWidth * 2);
        this.y += (this.width! * pageWidth) / (pageHeight * 2);
        break;
      case 180:
        this.x += this.width! / 2;
        this.y += this.height! / 2;
        break;
      case 270:
        this.x += (this.height! * pageHeight) / (pageWidth * 2);
        this.y -= (this.width! * pageWidth) / (pageHeight * 2);
        break;
      default:
        this.x -= this.width! / 2;
        this.y -= this.height! / 2;
        break;
    }
    this.fixAndSetPosition();
  }

  /**
   * Add some commands into the CommandManager (undo/redo stuff).
   */
  addCommands(params: AddCommandsP) {
    this._uiManager.addCommands(params);
  }

  get currentLayer() {
    return this._uiManager.currentLayer;
  }

  /**
   * This editor will be behind the others.
   */
  setInBackground() {
    this.div!.style.zIndex = <any> 0;
  }

  /**
   * This editor will be in the foreground.
   */
  setInForeground() {
    this.div!.style.zIndex = <any> this.#zIndex;
  }

  setParent(parent: AnnotationEditorLayer | undefined) {
    if (parent !== undefined) {
      this.pageIndex = parent.pageIndex;
      this.pageDimensions = parent.pageDimensions;
    }
    this.parent = parent;
  }

  /**
   * onfocus callback.
   */
  focusin(event: FocusEvent) {
    if (!this._focusEventsAllowed) {
      return;
    }
    if (!this.#hasBeenClicked) {
      this.parent!.setSelected(this);
    } else {
      this.#hasBeenClicked = false;
    }
  }

  /**
   * onblur callback.
   */
  focusout(event: FocusEvent) {
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
    const target = event.relatedTarget as Element;
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
    } else {
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
  setAt(x: number, y: number, tx: number, ty: number) {
    const [width, height] = this.parent!.viewportBaseDimensions;
    [tx, ty] = this.screenToPageTranslation(tx, ty);

    this.x = (x + tx) / width;
    this.y = (y + ty) / height;

    this.fixAndSetPosition();
  }

  #translate([width, height]: dot2d_t, x: number, y: number) {
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
  translate(x: number, y: number) {
    this.#translate(this.parentDimensions, x, y);
  }

  /**
   * Translate the editor position within its page and adjust the scroll
   * in order to have the editor in the view.
   * @param x x-translation in page coordinates.
   * @param y y-translation in page coordinates.
   */
  translateInPage(x: number, y: number) {
    this.#translate(this.pageDimensions, x, y);
    this.moveInDOM();
    this.div!.scrollIntoView({ block: "nearest" });
  }

  drag(tx: number, ty: number) {
    const [parentWidth, parentHeight] = this.parentDimensions;
    this.x += tx / parentWidth;
    this.y += ty / parentHeight;
    if (this.x < 0 || this.x > 1 || this.y < 0 || this.y > 1) {
      // The element will be outside of its parent so change the parent.
      const { x, y } = this.div!.getBoundingClientRect();
      if (this.parent!.findNewParent(this, x, y)) {
        this.x -= Math.floor(this.x);
        this.y -= Math.floor(this.y);
      }
    }

    // The editor can be moved wherever the user wants, so we don't need to fix
    // the position: it'll be done when the user will release the mouse button.
    this.div!.style.left = `${(100 * this.x).toFixed(2)}%`;
    this.div!.style.top = `${(100 * this.y).toFixed(2)}%`;
    this.div!.scrollIntoView({ block: "nearest" });
  }

  fixAndSetPosition() {
    const [pageWidth, pageHeight] = this.pageDimensions;
    let { x, y, width, height } = this;
    width! *= pageWidth;
    height! *= pageHeight;
    x *= pageWidth;
    y *= pageHeight;

    switch (this.rotation) {
      case 0:
        x = Math.max(0, Math.min(pageWidth - width!, x));
        y = Math.max(0, Math.min(pageHeight - height!, y));
        break;
      case 90:
        x = Math.max(0, Math.min(pageWidth - height!, x));
        y = Math.min(pageHeight, Math.max(width!, y));
        break;
      case 180:
        x = Math.min(pageWidth, Math.max(width!, x));
        y = Math.min(pageHeight, Math.max(height!, y));
        break;
      case 270:
        x = Math.min(pageWidth, Math.max(height!, x));
        y = Math.max(0, Math.min(pageHeight - width!, y));
        break;
    }

    this.x = x / pageWidth;
    this.y = y / pageHeight;

    this.div!.style.left = `${(100 * this.x).toFixed(2)}%`;
    this.div!.style.top = `${(100 * this.y).toFixed(2)}%`;
  }

  static #rotatePoint(x: number, y: number, angle: number) {
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
  screenToPageTranslation(x: number, y: number) {
    return AnnotationEditor.#rotatePoint(x, y, this.parentRotation);
  }

  /**
   * Convert a page translation into a screen one.
   */
  pageTranslationToScreen(x: number, y: number) {
    return AnnotationEditor.#rotatePoint(x, y, 360 - this.parentRotation);
  }

  #getRotationMatrix(rotation: number) {
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

  get parentDimensions(): dot2d_t {
    const {
      parentScale,
      pageDimensions: [pageWidth, pageHeight],
    } = this;
    const scaledWidth = pageWidth * parentScale;
    const scaledHeight = pageHeight * parentScale;
    return FeatureTest.isCSSRoundSupported
      ? [Math.round(scaledWidth), Math.round(scaledHeight)]
      : [scaledWidth, scaledHeight];
  }

  /**
   * Set the dimensions of this editor.
   */
  setDims(width: number, height: number) {
    const [parentWidth, parentHeight] = this.parentDimensions;
    this.div!.style.width = `${((100 * width) / parentWidth).toFixed(2)}%`;
    if (!this.#keepAspectRatio) {
      this.div!.style.height = `${((100 * height) / parentHeight).toFixed(2)}%`;
    }
  }

  fixDims() {
    const { style } = this.div!;
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
      style.height = `${
        ((100 * parseFloat(height)) / parentHeight).toFixed(
          2,
        )
      }%`;
    }
  }

  /**
   * Get the translation used to position this editor when it's created.
   */
  getInitialTranslation(): dot2d_t {
    return [0, 0];
  }

  static #noContextMenu(e: MouseEvent) {
    e.preventDefault();
  }

  #createResizers() {
    if (this.#resizersDiv) {
      return;
    }
    this.#resizersDiv = html("div");
    this.#resizersDiv.classList.add("resizers");
    const classes: ResizerName_[] = [
      "topLeft",
      "topRight",
      "bottomRight",
      "bottomLeft",
    ];
    if (!this._willKeepAspectRatio) {
      classes.push("topMiddle", "middleRight", "bottomMiddle", "middleLeft");
    }
    for (const name of classes) {
      const div = html("div");
      this.#resizersDiv.append(div);
      div.classList.add("resizer", name);
      div.on("pointerdown", this.#resizerPointerdown.bind(this, name));
      div.on("contextmenu", AnnotationEditor.#noContextMenu);
    }
    this.div!.prepend(this.#resizersDiv);
  }

  #resizerPointerdown(name: ResizerName_, event: PointerEvent) {
    event.preventDefault();
    const { isMac } = FeatureTest.platform;
    if (event.button !== 0 || (event.ctrlKey && isMac)) {
      return;
    }

    const boundResizerPointermove = this.#resizerPointermove.bind(this, name);
    const savedDraggable = this._isDraggable;
    this._isDraggable = false;
    const pointerMoveOptions = { passive: true, capture: true };
    window.on("pointermove", boundResizerPointermove, pointerMoveOptions);
    const savedX = this.x;
    const savedY = this.y;
    const savedWidth = this.width;
    const savedHeight = this.height;
    const savedParentCursor = this.parent!.div!.style.cursor;
    const savedCursor = this.div!.style.cursor;
    this.div!.style.cursor =
      this.parent!.div!.style.cursor =
        window.getComputedStyle(event.target as Element).cursor;

    const pointerUpCallback = () => {
      this._isDraggable = savedDraggable;
      window.off("pointerup", pointerUpCallback);
      window.off("blur", pointerUpCallback);
      window.off("pointermove", boundResizerPointermove, pointerMoveOptions);
      this.parent!.div!.style.cursor = savedParentCursor;
      this.div!.style.cursor = savedCursor;

      const newX = this.x;
      const newY = this.y;
      const newWidth = this.width;
      const newHeight = this.height;
      if (
        newX === savedX &&
        newY === savedY &&
        newWidth === savedWidth &&
        newHeight === savedHeight
      ) {
        return;
      }

      this.addCommands({
        cmd: () => {
          this.width = newWidth!;
          this.height = newHeight!;
          this.x = newX;
          this.y = newY;
          const [parentWidth, parentHeight] = this.parentDimensions;
          this.setDims(parentWidth * newWidth!, parentHeight * newHeight!);
          this.fixAndSetPosition();
          this.moveInDOM();
        },
        undo: () => {
          this.width = savedWidth!;
          this.height = savedHeight!;
          this.x = savedX;
          this.y = savedY;
          const [parentWidth, parentHeight] = this.parentDimensions;
          this.setDims(parentWidth * savedWidth!, parentHeight * savedHeight!);
          this.fixAndSetPosition();
          this.moveInDOM();
        },
        mustExec: true,
      });
    };
    window.on("pointerup", pointerUpCallback);
    // If the user switches to another window (with alt+tab), then we end the
    // resize session.
    window.on("blur", pointerUpCallback);
  }

  #resizerPointermove(name: ResizerName_, event: PointerEvent) {
    const [parentWidth, parentHeight] = this.parentDimensions;
    const savedX = this.x;
    const savedY = this.y;
    const savedWidth = this.width!;
    const savedHeight = this.height!;
    const minWidth = AnnotationEditor.MIN_SIZE / parentWidth;
    const minHeight = AnnotationEditor.MIN_SIZE / parentHeight;

    // 10000 because we multiply by 100 and use toFixed(2) in fixAndSetPosition.
    // Without rounding, the positions of the corners other than the top left
    // one can be slightly wrong.
    const round = (x: number) => Math.round(x * 10000) / 10000;
    const rotationMatrix = this.#getRotationMatrix(this.rotation);
    const transf = (x: number, y: number) => [
      rotationMatrix[0] * x + rotationMatrix[2] * y,
      rotationMatrix[1] * x + rotationMatrix[3] * y,
    ];
    const invRotationMatrix = this.#getRotationMatrix(360 - this.rotation);
    const invTransf = (x: number, y: number) => [
      invRotationMatrix[0] * x + invRotationMatrix[2] * y,
      invRotationMatrix[1] * x + invRotationMatrix[3] * y,
    ];
    let getPoint: (w: number, h: number) => dot2d_t;
    let getOpposite: (w: number, h: number) => dot2d_t;
    let isDiagonal = false;
    let isHorizontal = false;

    switch (name) {
      case "topLeft":
        isDiagonal = true;
        getPoint = (w, h) => [0, 0];
        getOpposite = (w, h) => [w, h];
        break;
      case "topMiddle":
        getPoint = (w, h) => [w / 2, 0];
        getOpposite = (w, h) => [w / 2, h];
        break;
      case "topRight":
        isDiagonal = true;
        getPoint = (w, h) => [w, 0];
        getOpposite = (w, h) => [0, h];
        break;
      case "middleRight":
        isHorizontal = true;
        getPoint = (w, h) => [w, h / 2];
        getOpposite = (w, h) => [0, h / 2];
        break;
      case "bottomRight":
        isDiagonal = true;
        getPoint = (w, h) => [w, h];
        getOpposite = (w, h) => [0, 0];
        break;
      case "bottomMiddle":
        getPoint = (w, h) => [w / 2, h];
        getOpposite = (w, h) => [w / 2, 0];
        break;
      case "bottomLeft":
        isDiagonal = true;
        getPoint = (w, h) => [0, h];
        getOpposite = (w, h) => [w, 0];
        break;
      case "middleLeft":
        isHorizontal = true;
        getPoint = (w, h) => [0, h / 2];
        getOpposite = (w, h) => [w, h / 2];
        break;
    }

    const point = getPoint(savedWidth, savedHeight);
    const oppositePoint = getOpposite(savedWidth, savedHeight);
    let transfOppositePoint = transf(...oppositePoint);
    const oppositeX = round(savedX + transfOppositePoint[0]);
    const oppositeY = round(savedY + transfOppositePoint[1]);
    let ratioX = 1;
    let ratioY = 1;

    let [deltaX, deltaY] = this.screenToPageTranslation(
      event.movementX,
      event.movementY,
    );
    [deltaX, deltaY] = invTransf(deltaX / parentWidth, deltaY / parentHeight);

    if (isDiagonal) {
      const oldDiag = Math.hypot(savedWidth, savedHeight);
      ratioX = ratioY = Math.max(
        Math.min(
          Math.hypot(
            oppositePoint[0] - point[0] - deltaX,
            oppositePoint[1] - point[1] - deltaY,
          ) / oldDiag,
          // Avoid the editor to be larger than the page.
          1 / savedWidth,
          1 / savedHeight,
        ),
        // Avoid the editor to be smaller than the minimum size.
        minWidth / savedWidth,
        minHeight / savedHeight,
      );
    } else if (isHorizontal) {
      ratioX = Math.max(
        minWidth,
        Math.min(1, Math.abs(oppositePoint[0] - point[0] - deltaX)),
      ) / savedWidth;
    } else {
      ratioY = Math.max(
        minHeight,
        Math.min(1, Math.abs(oppositePoint[1] - point[1] - deltaY)),
      ) / savedHeight;
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

  /**
   * Render this editor in a div.
   */
  render(): HTMLDivElement {
    this.div = html("div").assignAttro({
      "data-editor-rotation": (360 - this.rotation) % 360,
      id: this.id,
      tabIndex: 0,
    });

    this.setInForeground();

    this.div.on("focusin", this.#boundFocusin);
    this.div.on("focusout", this.#boundFocusout);

    const [parentWidth, parentHeight] = this.parentDimensions;
    if (this.parentRotation % 180 !== 0) {
      this.div.style.maxWidth = `${
        ((100 * parentHeight) / parentWidth).toFixed(
          2,
        )
      }%`;
      this.div.style.maxHeight = `${
        (
          (100 * parentWidth) /
          parentHeight
        ).toFixed(2)
      }%`;
    }

    const [tx, ty] = this.getInitialTranslation();
    this.translate(tx, ty);

    bindEvents(this, this.div, ["pointerdown"]);

    return this.div;
  }

  /**
   * Onpointerdown callback.
   */
  pointerdown(event: PointerEvent) {
    const { isMac } = FeatureTest.platform;
    if (event.button !== 0 || (event.ctrlKey && isMac)) {
      // Avoid to focus this editor because of a non-left click.
      event.preventDefault();
      return;
    }

    this.#hasBeenClicked = true;

    this.#setUpDragSession(event);
  }

  #setUpDragSession(event: PointerEvent) {
    if (!this._isDraggable) {
      return;
    }

    const isSelected = this._uiManager.isSelected(this);
    this._uiManager.setUpDragSession();

    let pointerMoveOptions: AddEventListenerOptions,
      pointerMoveCallback: EventHandler<"pointermove">;
    if (isSelected) {
      pointerMoveOptions = { passive: true, capture: true };
      pointerMoveCallback = (e) => {
        const [tx, ty] = this.screenToPageTranslation(e.movementX, e.movementY);
        this._uiManager.dragSelectedEditors(tx, ty);
      };
      window.on("pointermove", pointerMoveCallback, pointerMoveOptions);
    }

    const pointerUpCallback = () => {
      window.off("pointerup", pointerUpCallback);
      window.off("blur", pointerUpCallback);
      if (isSelected) {
        window.off("pointermove", pointerMoveCallback, pointerMoveOptions);
      }

      this.#hasBeenClicked = false;
      if (!this._uiManager.endDragSession()) {
        const { isMac } = FeatureTest.platform;
        if (
          (event.ctrlKey && !isMac) ||
          event.shiftKey ||
          (event.metaKey && isMac)
        ) {
          this.parent!.toggleSelected(this);
        } else {
          this.parent!.setSelected(this);
        }
      }
    };
    window.on("pointerup", pointerUpCallback);
    // If the user is using alt+tab during the dragging session, the pointerup
    // event could be not fired, but a blur event is fired so we can use it in
    // order to interrupt the dragging session.
    window.on("blur", pointerUpCallback);
  }

  moveInDOM() {
    this.parent!.moveEditorInDOM(this);
  }

  _setParentAndPosition(parent: AnnotationEditorLayer, x: number, y: number) {
    parent.changeParent(this);
    this.x = x;
    this.y = y;
    this.fixAndSetPosition();
    this.moveInDOM();
  }

  /**
   * Convert the current rect into a page one.
   */
  getRect(tx: number, ty: number): rect_t {
    const scale = this.parentScale;
    const [pageWidth, pageHeight] = this.pageDimensions;
    const [pageX, pageY] = this.pageTranslation;
    const shiftX = tx / scale;
    const shiftY = ty / scale;
    const x = this.x * pageWidth;
    const y = this.y * pageHeight;
    const width = this.width! * pageWidth;
    const height = this.height! * pageHeight;

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

  getRectInCurrentCoords(rect: rect_t, pageHeight: number) {
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
  onceAdded() {}

  /**
   * Check if the editor contains something.
   */
  isEmpty(): boolean {
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
  isInEditMode(): boolean {
    return this.#isInEditMode;
  }

  /**
   * If it returns true, then this editor handle the keyboard
   * events itself.
   */
  shouldGetKeyboardEvents(): boolean {
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
   * Serialize the editor.
   * The result of the serialization will be used to construct a
   * new annotation to add to the pdf document.
   *
   * To implement in subclasses.
   */
  abstract serialize(
    _isForCopying?: boolean,
    _context?: Record<keyof any, any>,
  ): AnnotStorageValue | undefined;

  /**
   * Deserialize the editor.
   * The result of the deserialization is a new editor.
   */
  static deserialize(
    data: AnnotStorageValue,
    parent: AnnotationEditorLayer,
    uiManager: AnnotationEditorUIManager,
  ): AnnotationEditor | undefined {
    const editor =
      new (this.prototype.constructor as Constructor<AnnotationEditor>)({
        parent,
        id: parent.getNextId(),
        uiManager,
      });
    editor.rotation = data.rotation!;

    const [pageWidth, pageHeight] = editor.pageDimensions;
    const [x, y, width, height] = editor.getRectInCurrentCoords(
      data.rect!,
      pageHeight,
    );
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
    this.div!.off("focusin", this.#boundFocusin);
    this.div!.off("focusout", this.#boundFocusout);

    if (!this.isEmpty()) {
      // The editor is removed but it can be back at some point thanks to
      // undo/redo so we must commit it before.
      this.commit();
    }
    if (this.parent) {
      this.parent.remove(this);
    } else {
      this._uiManager.removeEditor(this);
    }
  }

  /**
   * @return true if this editor can be resized.
   */
  get isResizable(): boolean {
    return false;
  }

  /**
   * Add the resizers to this editor.
   */
  makeResizable() {
    if (this.isResizable) {
      this.#createResizers();
      this.#resizersDiv!.classList.remove("hidden");
    }
  }

  /**
   * Select this editor.
   */
  select() {
    this.makeResizable();
    this.div?.classList.add("selectedEditor");
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
      this._uiManager.currentLayer!.div!.focus();
    }
  }

  /**
   * Update some parameters which have been changed through the UI.
   */
  updateParams(
    type: AnnotationEditorParamsType,
    value: number | string | undefined,
  ) {}

  /**
   * When the user disables the editing mode some editors can change some of
   * their properties.
   */
  disableEditing() {}

  /**
   * When the user enables the editing mode some editors can change some of
   * their properties.
   */
  enableEditing() {}

  /**
   * The editor is about to be edited.
   */
  enterInEditMode() {}

  /**
   * Get the div which really contains the displayed content.
   */
  get contentDiv() {
    return this.div;
  }

  /**
   * If true then the editor is currently edited.
   */
  get isEditing(): boolean {
    return this.#isEditing;
  }

  /**
   * When set to true, it means that this editor is currently edited.
   */
  set isEditing(value: boolean) {
    this.#isEditing = value;
    if (!this.parent) {
      return;
    }
    if (value) {
      this.parent!.setSelected(this);
      this.parent!.setActiveEditor(this);
    } else {
      this.parent!.setActiveEditor(undefined);
    }
  }

  /**
   * Set the aspect ratio to use when resizing.
   */
  setAspectRatio(width: number, height: number) {
    this.#keepAspectRatio = true;
    const aspectRatio = width / height;
    this.div!.assignStylo({
      aspectRatio,
      height: "auto",
    });
  }

  static get MIN_SIZE() {
    return 16;
  }
}

// This class is used to fake an editor which has been deleted.
class FakeEditor extends AnnotationEditor {
  constructor(params: AnnotationEditorP) {
    super(params);
    this.annotationElementId = params.annotationElementId;
    this.deleted = true;
  }

  serialize() {
    return {
      id: this.annotationElementId,
      deleted: true,
      pageIndex: this.pageIndex,
    } as AnnotStorageValue;
  }
}
/*80--------------------------------------------------------------------------*/
