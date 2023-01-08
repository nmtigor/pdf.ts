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

import { Constructor } from "../../../../lib/alias.ts";
import { html } from "../../../../lib/dom.ts";
import { assert } from "../../../../lib/util/trace.ts";
import { RGB } from "../../shared/scripting_utils.ts";
import {
  AnnotationEditorParamsType,
  AnnotationEditorType,
  FeatureTest,
  rect_t,
  shadow,
} from "../../shared/util.ts";
import { AnnotationEditorLayer } from "./annotation_editor_layer.ts";
import {
  AddCommandsP,
  AnnotationEditorUIManager,
  bindEvents,
  ColorManager,
} from "./tools.ts";
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
   * editor if
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
}

export interface AnnotationEditorSerialized {
  annotationType: AnnotationEditorType;
  color: RGB;
  pageIndex: number;
  rect: rect_t;
  rotation: number;
}

export type PropertyToUpdate = [AnnotationEditorParamsType, string | number];

/**
 * Base class for editors.
 */
export abstract class AnnotationEditor {
  static readonly _type: "freetext" | "ink";
  static _colorManager = new ColorManager();
  static _zIndex = 1;

  #boundFocusin = this.focusin.bind(this);
  #boundFocusout = this.focusout.bind(this);
  #hasBeenSelected = false;
  #isEditing = false;
  #isInEditMode = false;
  _uiManager;
  #zIndex = AnnotationEditor._zIndex++;

  parent: AnnotationEditorLayer | undefined;
  id;
  width?: number;
  height?: number;
  pageIndex;
  name;
  div?: HTMLDivElement;

  rotation;
  pageDimensions;
  pageTranslation;
  x;
  y;

  isAttachedToDOM = false;

  startX!: number;
  startY!: number;

  constructor(parameters: AnnotationEditorP & { name: string }) {
    if (this.constructor === AnnotationEditor) {
      assert(0, "Cannot initialize AnnotationEditor.");
    }

    this.parent = parameters.parent;
    this.id = parameters.id;
    this.pageIndex = parameters.parent.pageIndex;
    this.name = parameters.name;
    this._uiManager = parameters.uiManager;

    const {
      rotation,
      rawDims: { pageWidth, pageHeight, pageX, pageY },
    } = this.parent.viewport;

    this.rotation = rotation;
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
    if (!this.#hasBeenSelected) {
      this.parent!.setSelected(this);
    } else {
      this.#hasBeenSelected = false;
    }
  }

  /**
   * onblur callback.
   */
  focusout(event: FocusEvent) {
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
   * We use drag-and-drop in order to move an editor on a page.
   */
  dragstart(event: DragEvent) {
    const rect = this.parent!.div!.getBoundingClientRect();
    this.startX = event.clientX - rect.x;
    this.startY = event.clientY - rect.y;
    event.dataTransfer!.setData("text/plain", this.id);
    event.dataTransfer!.effectAllowed = "move";
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

    this.div!.style.left = `${100 * this.x}%`;
    this.div!.style.top = `${100 * this.y}%`;
  }

  /**
   * Translate the editor position within its parent.
   * @param x x-translation in screen coordinates.
   * @param y y-translation in screen coordinates.
   */
  translate(x: number, y: number) {
    const [width, height] = this.parentDimensions;
    [x, y] = this.screenToPageTranslation(x, y);

    this.x += x / width;
    this.y += y / height;

    this.div!.style.left = `${100 * this.x}%`;
    this.div!.style.top = `${100 * this.y}%`;
  }

  /**
   * Convert a screen translation into a page one.
   */
  screenToPageTranslation(x: number, y: number) {
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
    return this._uiManager.viewParameters.rotation;
  }

  get parentDimensions() {
    const { realScale } = this._uiManager.viewParameters;
    const [pageWidth, pageHeight] = this.pageDimensions;
    return [pageWidth * realScale, pageHeight * realScale];
  }

  /**
   * Set the dimensions of this editor.
   */
  setDims(width: number, height: number) {
    const [parentWidth, parentHeight] = this.parentDimensions;
    this.div!.style.width = `${(100 * width) / parentWidth}%`;
    this.div!.style.height = `${(100 * height) / parentHeight}%`;
  }

  fixDims() {
    const { style } = this.div!;
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
  getInitialTranslation(): number[] {
    return [0, 0];
  }

  /**
   * Render this editor in a div.
   */
  render(): HTMLDivElement {
    this.div = html("div");
    this.div.setAttribute(
      "data-editor-rotation",
      (360 - this.rotation) % 360 as any,
    );
    this.div.className = this.name;
    this.div.setAttribute("id", this.id);
    this.div.setAttribute("tabIndex", <any> 0);

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
  pointerdown(event: PointerEvent) {
    const { isMac } = FeatureTest.platform;
    if (event.button !== 0 || (event.ctrlKey && isMac)) {
      // Avoid to focus this editor because of a non-left click.
      event.preventDefault();
      return;
    }

    if (
      (event.ctrlKey && !isMac) ||
      event.shiftKey ||
      (event.metaKey && isMac)
    ) {
      this.parent!.toggleSelected(this);
    } else {
      this.parent!.setSelected(this);
    }

    this.#hasBeenSelected = true;
  }

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
    this.div?.addEventListener("focusin", this.#boundFocusin);
  }

  /**
   * Serialize the editor.
   * The result of the serialization will be used to construct a
   * new annotation to add to the pdf document.
   *
   * To implement in subclasses.
   */
  abstract serialize(): AnnotationEditorSerialized | undefined;

  /**
   * Deserialize the editor.
   * The result of the deserialization is a new editor.
   */
  static deserialize(
    data: AnnotationEditorSerialized,
    parent: AnnotationEditorLayer,
    uiManager: AnnotationEditorUIManager,
  ): AnnotationEditor {
    const editor =
      new (this.prototype.constructor as Constructor<AnnotationEditor>)({
        parent,
        id: parent.getNextId(),
        uiManager,
      });
    editor.rotation = data.rotation;

    const [pageWidth, pageHeight] = editor.pageDimensions;
    const [x, y, width, height] = editor.getRectInCurrentCoords(
      data.rect,
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
    this.div!.removeEventListener("focusin", this.#boundFocusin);
    this.div!.removeEventListener("focusout", this.#boundFocusout);

    if (!this.isEmpty()) {
      // The editor is removed but it can be back at some point thanks to
      // undo/redo so we must commit it before.
      this.commit();
    }
    this.parent!.remove(this);
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
  updateParams(type: AnnotationEditorParamsType, value: number | string) {}

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
   * Get some properties to update in the UI.
   */
  get propertiesToUpdate(): PropertyToUpdate[] {
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
  set isEditing(value: boolean) {
    this.#isEditing = value;
    if (value) {
      this.parent!.setSelected(this);
      this.parent!.setActiveEditor(this);
    } else {
      this.parent!.setActiveEditor(undefined);
    }
  }
}
/*80--------------------------------------------------------------------------*/
