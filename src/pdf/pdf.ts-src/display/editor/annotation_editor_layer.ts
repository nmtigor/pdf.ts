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

import type { Constructor } from "@fe-lib/alias.ts";
import type { HSElement } from "@fe-lib/dom.ts";
import type { IL10n } from "@pdf.ts-web/interfaces.ts";
import type { TextAccessibilityManager } from "@pdf.ts-web/text_accessibility.ts";
import { AnnotationEditorType, FeatureTest } from "../../shared/util.ts";
import type {
  AnnotationLayer,
  AnnotStorageValue,
} from "../annotation_layer.ts";
import { type PageViewport, setLayerDimensions } from "../display_utils.ts";
import type { AnnotationEditorP } from "./editor.ts";
import { AnnotationEditor } from "./editor.ts";
import { FreeTextEditor } from "./freetext.ts";
import { InkEditor } from "./ink.ts";
import { StampEditor } from "./stamp.ts";
import type { AddCommandsP, AnnotationEditorUIManager } from "./tools.ts";
/*80--------------------------------------------------------------------------*/

interface AnnotationEditorLayerOptions {
  mode?: unknown;
  div: HTMLDivElement;
  uiManager: AnnotationEditorUIManager;
  enabled?: boolean;
  accessibilityManager?: TextAccessibilityManager | undefined;
  pageIndex: number;
  l10n: IL10n;
  annotationLayer?: AnnotationLayer | undefined;
  viewport: PageViewport;
}

interface RenderEditorLayerOptions {
  viewport: PageViewport;
}

type PasteEditorP_ = {
  bitmapFile: File | null;
};

/**
 * Manage all the different editors on a page.
 */
export class AnnotationEditorLayer {
  static _initialized = false;

  static #editorTypes = new Map(
    [FreeTextEditor, InkEditor, StampEditor].map((type) => [
      type._editorType,
      type,
    ]),
  );

  #accessibilityManager;
  #allowClick = false;
  #annotationLayer;
  #boundPointerup = this.pointerup.bind(this);
  #boundPointerdown = this.pointerdown.bind(this);
  #editorFocusTimeoutId: number | undefined;
  #editors = new Map<string, AnnotationEditor>();
  #hadPointerDown = false;
  #isCleaningUp = false;
  #isDisabling = false;
  #uiManager;

  pageIndex;
  div: HTMLDivElement | undefined;

  viewport!: PageViewport;

  isMultipleSelection?: boolean;

  constructor({
    uiManager,
    pageIndex,
    div,
    accessibilityManager,
    annotationLayer,
    viewport,
    l10n,
  }: AnnotationEditorLayerOptions) {
    const editorTypes = [...AnnotationEditorLayer.#editorTypes.values()];
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
  updateToolbar(mode: AnnotationEditorType) {
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
    } else {
      this.enableClick();
    }

    if (mode !== AnnotationEditorType.NONE) {
      const { classList } = this.div!;
      for (const editorType of AnnotationEditorLayer.#editorTypes.values()) {
        classList.toggle(
          `${editorType._type}Editing`,
          mode === editorType._editorType,
        );
      }
      this.div!.hidden = false;
    }
  }

  addInkEditorIfNeeded(isCommitting: boolean) {
    if (
      !isCommitting &&
      this.#uiManager.getMode() !== AnnotationEditorType.INK
    ) {
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

    const editor = this.#createAndAddNewEditor(
      { offsetX: 0, offsetY: 0 } as PointerEvent,
      /* isCentered = */ false,
    );
    editor!.setInBackground();
  }

  /**
   * Set the editing state.
   */
  setEditingState(isEditing: boolean) {
    this.#uiManager.setEditingState(isEditing);
  }

  /**
   * Add some commands into the CommandManager (undo/redo stuff).
   */
  addCommands(params: AddCommandsP) {
    this.#uiManager.addCommands(params);
  }

  togglePointerEvents(enabled = false) {
    this.div!.classList.toggle("disabled", !enabled);
  }

  /**
   * Enable pointer events on the main div in order to enable
   * editor creation.
   */
  enable() {
    this.togglePointerEvents(true);
    const annotationElementIds = new Set<string>();
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
    this.togglePointerEvents(false);
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
        if (
          hiddenAnnotationIds.has(id) ||
          this.#uiManager.isDeletedAnnotationElement(id)
        ) {
          continue;
        }
        editable.show();
      }
    }

    this.#cleanup();
    if (this.isEmpty) {
      this.div!.hidden = true;
    }
    const { classList } = this.div!;
    for (const editorType of AnnotationEditorLayer.#editorTypes.values()) {
      classList.remove(`${editorType._type}Editing`);
    }

    this.#isDisabling = false;
  }

  getEditableAnnotation(id: string) {
    return this.#annotationLayer?.getEditableAnnotation(id);
  }

  /**
   * Set the current editor.
   */
  setActiveEditor(editor: AnnotationEditor | undefined) {
    const currentActive = this.#uiManager.getActive();
    if (currentActive === editor) {
      return;
    }

    this.#uiManager.setActiveEditor(editor);
  }

  enableClick() {
    this.div!.on("pointerdown", this.#boundPointerdown);
    this.div!.on("pointerup", this.#boundPointerup);
  }

  disableClick() {
    this.div!.off("pointerdown", this.#boundPointerdown);
    this.div!.off("pointerup", this.#boundPointerup);
  }

  attach(editor: AnnotationEditor) {
    this.#editors.set(editor.id, editor);
    const { annotationElementId } = editor;
    if (
      annotationElementId &&
      this.#uiManager.isDeletedAnnotationElement(annotationElementId)
    ) {
      this.#uiManager.removeDeletedAnnotationElement(editor);
    }
  }

  detach(editor: AnnotationEditor) {
    this.#editors.delete(editor.id);
    this.#accessibilityManager?.removePointerInTextLayer(editor.contentDiv!);

    if (!this.#isDisabling && editor.annotationElementId) {
      this.#uiManager.addDeletedAnnotationElement(editor);
    }
  }

  /**
   * Remove an editor.
   */
  remove(editor: AnnotationEditor) {
    // Since we can undo a removal we need to keep the
    // parent property as it is, so don't undefined it!

    this.detach(editor);
    this.#uiManager.removeEditor(editor);
    editor.div!.remove();
    editor.isAttachedToDOM = false;

    if (!this.#isCleaningUp) {
      this.addInkEditorIfNeeded(/* isCommitting = */ false);
    }
  }

  /**
   * An editor can have a different parent, for example after having
   * being dragged and droped from a page to another.
   */
  changeParent(editor: AnnotationEditor) {
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
      this.div!.append(editor.div);
    }
  }

  /**
   * Add a new editor in the current view.
   */
  add(editor: AnnotationEditor) {
    this.changeParent(editor);
    this.#uiManager.addEditor(editor);
    this.attach(editor);

    if (!editor.isAttachedToDOM) {
      const div = editor.render();
      this.div!.append(div);
      editor.isAttachedToDOM = true;
    }

    // The editor will be correctly moved into the DOM (see fixAndSetPosition).
    editor.fixAndSetPosition();
    editor.onceAdded();
    this.#uiManager.addToAnnotationStorage(editor);
  }

  moveEditorInDOM(editor: AnnotationEditor) {
    if (!editor.isAttachedToDOM) {
      return;
    }

    const { activeElement } = document;
    if (editor.div!.contains(activeElement) && !this.#editorFocusTimeoutId) {
      // When the div is moved in the DOM the focus can move somewhere else,
      // so we want to be sure that the focus will stay on the editor but we
      // don't want to call any focus callbacks, hence we disable them and only
      // re-enable them when the editor has the focus.
      editor._focusEventsAllowed = false;
      this.#editorFocusTimeoutId = setTimeout(() => {
        this.#editorFocusTimeoutId = undefined;
        if (!editor.div!.contains(document.activeElement)) {
          editor.div!.addEventListener(
            "focusin",
            () => {
              editor._focusEventsAllowed = true;
            },
            { once: true },
          );
          (activeElement as HSElement).focus();
        } else {
          editor._focusEventsAllowed = true;
        }
      }, 0);
    }

    editor._structTreeParentId = this.#accessibilityManager?.moveElementInDOM(
      this.div!,
      editor.div,
      editor.contentDiv!,
      /* isRemovable = */ true,
    );
  }

  /**
   * Add or rebuild depending if it has been removed or not.
   */
  addOrRebuild(editor: AnnotationEditor) {
    if (editor.needsToBeRebuilt()) {
      editor.parent ||= this;
      editor.rebuild();
    } else {
      this.add(editor);
    }
  }

  /**
   * Add a new editor and make this addition undoable.
   */
  addUndoableEditor(editor: AnnotationEditor) {
    const cmd = () => editor._uiManager.rebuild(editor);
    const undo = () => {
      editor.remove();
    };

    this.addCommands({ cmd, undo, mustExec: false });
  }

  /**
   * Get an id for an editor.
   */
  getNextId(): string {
    return this.#uiManager.getId();
  }

  /**
   * Create a new editor
   */
  #createNewEditor(params: AnnotationEditorP): AnnotationEditor | undefined {
    const editorType = AnnotationEditorLayer.#editorTypes.get(
      this.#uiManager.getMode(),
    );
    return editorType
      ? new (editorType.prototype.constructor as Constructor<AnnotationEditor>)(
        params,
      )
      : undefined;
  }

  /**
   * Paste some content into a new editor.
   */
  pasteEditor(mode: number, params: PasteEditorP_) {
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
  deserialize(data: AnnotStorageValue): AnnotationEditor | undefined {
    return (
      AnnotationEditorLayer.#editorTypes.get(
        data.annotationType ?? data.annotationEditorType!,
      )?.deserialize(data as any, this, this.#uiManager) || undefined
    );
  }

  /**
   * Create and add a new editor.
   */
  #createAndAddNewEditor(
    event: PointerEvent,
    isCentered: boolean,
  ): AnnotationEditor | undefined {
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
    const { x, y, width, height } = this.div!.getBoundingClientRect();
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
    this.#createAndAddNewEditor(
      this.#getCenterPoint() as PointerEvent,
      /* isCentered = */ true,
    );
  }

  /**
   * Set the last selected editor.
   */
  setSelected(editor: AnnotationEditor) {
    this.#uiManager.setSelected(editor);
  }

  /**
   * Add or remove an editor the current selection.
   */
  toggleSelected(editor: AnnotationEditor) {
    this.#uiManager.toggleSelected(editor);
  }

  /**
   * Check if the editor is selected.
   */
  isSelected(editor: AnnotationEditor) {
    return this.#uiManager.isSelected(editor);
  }

  /**
   * Unselect an editor.
   */
  unselect(editor: AnnotationEditor) {
    this.#uiManager.unselect(editor);
  }

  /**
   * Pointerup callback.
   */
  pointerup(event: PointerEvent) {
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
  pointerdown(event: PointerEvent) {
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

  findNewParent(editor: AnnotationEditor, x: number, y: number): boolean {
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
      this.#accessibilityManager?.removePointerInTextLayer(editor.contentDiv!);
      editor.setParent(undefined);
      editor.isAttachedToDOM = false;
      editor.div!.remove();
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
  render({ viewport }: RenderEditorLayerOptions) {
    this.viewport = viewport;
    setLayerDimensions(this.div!, viewport);
    for (const editor of this.#uiManager.getEditors(this.pageIndex)) {
      this.add(editor);
    }
    this.updateMode();
  }

  /**
   * Update the main editor.
   */
  update({ viewport }: RenderEditorLayerOptions) {
    // Editors have their dimensions/positions in percent so to avoid any
    // issues (see #15582), we must commit the current one before changing
    // the viewport.
    this.#uiManager.commitOrRemove();

    this.viewport = viewport;
    setLayerDimensions(this.div!, { rotation: viewport.rotation });
    this.updateMode();
  }

  /**
   * Get page dimensions.
   * @return dimensions.
   */
  get pageDimensions(): [number, number] {
    const { pageWidth, pageHeight } = this.viewport.rawDims;
    return [pageWidth, pageHeight];
  }

  get viewportBaseDimensions() {
    const { width, height, rotation } = this.viewport;
    return rotation % 180 === 0 ? [width, height] : [height, width];
  }
}
/*80--------------------------------------------------------------------------*/
