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

/** @typedef {import("./editor.js").AnnotationEditor} AnnotationEditor */
// eslint-disable-next-line max-len
/** @typedef {import("./tools.js").AnnotationEditorUIManager} AnnotationEditorUIManager */
/** @typedef {import("../display_utils.js").PageViewport} PageViewport */
// eslint-disable-next-line max-len
/** @typedef {import("../../web/text_accessibility.js").TextAccessibilityManager} TextAccessibilityManager */
/** @typedef {import("../../web/interfaces").IL10n} IL10n */

import { IL10n } from "../../../pdf.ts-web/interfaces.ts";
import { TextAccessibilityManager } from "../../../pdf.ts-web/text_accessibility.ts";
import { AnnotationEditorType, FeatureTest } from "../../shared/util.ts";
import { PageViewport, setLayerDimensions } from "../display_utils.ts";
import {
  AnnotationEditor,
  AnnotationEditorP,
  AnnotationEditorSerialized,
} from "./editor.ts";
import {
  FreeTextEditor,
  FreeTextEditorP,
  FreeTextEditorSerialized,
} from "./freetext.ts";
import { InkEditor, InkEditorP, InkEditorSerialized } from "./ink.ts";
import {
  AddCommandsP,
  AnnotationEditorUIManager,
  bindEvents,
} from "./tools.ts";
/*80--------------------------------------------------------------------------*/

interface AnnotationEditorLayerOptions {
  accessibilityManager?: TextAccessibilityManager | undefined;
  div: HTMLDivElement;
  enabled?: boolean;
  l10n: IL10n;
  mode?: unknown;
  pageIndex: number;
  uiManager: AnnotationEditorUIManager;
  viewport: PageViewport;
}

interface RenderEditorLayerOptions {
  viewport: PageViewport;
  // div:HTMLDivElement;
  // annotations;
  // intent;
}

/**
 * Manage all the different editors on a page.
 */
export class AnnotationEditorLayer {
  static _initialized = false;

  #accessibilityManager;
  #allowClick = false;
  #boundPointerup = this.pointerup.bind(this);
  #boundPointerdown = this.pointerdown.bind(this);
  #editors = new Map<string, AnnotationEditor>();
  #hadPointerDown = false;
  #isCleaningUp = false;
  #uiManager;

  pageIndex;
  div: HTMLDivElement | undefined;

  viewport!: PageViewport;

  isMultipleSelection?: boolean;

  constructor(options: AnnotationEditorLayerOptions) {
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
    this.#uiManager.unselectAll();

    if (mode !== AnnotationEditorType.NONE) {
      this.div!.classList.toggle(
        "freeTextEditing",
        mode === AnnotationEditorType.FREETEXT,
      );
      this.div!.classList.toggle(
        "inkEditing",
        mode === AnnotationEditorType.INK,
      );
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

  /**
   * Enable pointer events on the main div in order to enable
   * editor creation.
   */
  enable() {
    this.div!.style.pointerEvents = "auto";
    for (const editor of this.#editors.values()) {
      editor.enableEditing();
    }
  }

  /**
   * Disable editor creation.
   */
  disable() {
    this.div!.style.pointerEvents = "none";
    for (const editor of this.#editors.values()) {
      editor.disableEditing();
    }
    this.#cleanup();
    if (this.isEmpty) {
      this.div!.hidden = true;
    }
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
    this.div!.addEventListener("pointerdown", this.#boundPointerdown);
    this.div!.addEventListener("pointerup", this.#boundPointerup);
  }

  disableClick() {
    this.div!.removeEventListener("pointerdown", this.#boundPointerdown);
    this.div!.removeEventListener("pointerup", this.#boundPointerup);
  }

  attach(editor: AnnotationEditor) {
    this.#editors.set(editor.id, editor);
  }

  detach(editor: AnnotationEditor) {
    this.#editors.delete(editor.id);
    this.#accessibilityManager?.removePointerInTextLayer(editor.contentDiv!);
  }

  /**
   * Remove an editor.
   */
  remove(editor: AnnotationEditor) {
    // Since we can undo a removal we need to keep the
    // parent property as it is, so don't null it!

    this.#uiManager.removeEditor(editor);
    this.detach(editor);
    editor.div!.style.display = "none";
    setTimeout(() => {
      // When the div is removed from DOM the focus can move on the
      // document.body, so we just slightly postpone the removal in
      // order to let an element potentially grab the focus before
      // the body.
      editor.div!.style.display = "";
      editor.div!.remove();
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
  #changeParent(editor: AnnotationEditor) {
    if (editor.parent === this) {
      return;
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
    this.#changeParent(editor);
    this.#uiManager.addEditor(editor);
    this.attach(editor);

    if (!editor.isAttachedToDOM) {
      const div = editor.render();
      this.div!.append(div);
      editor.isAttachedToDOM = true;
    }

    this.moveEditorInDOM(editor);
    editor.onceAdded();
    this.#uiManager.addToAnnotationStorage(editor);
  }

  moveEditorInDOM(editor: AnnotationEditor) {
    this.#accessibilityManager?.moveElementInDOM(
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
      editor.rebuild();
    } else {
      this.add(editor);
    }
  }

  /**
   * Add a new editor and make this addition undoable.
   */
  addANewEditor(editor: AnnotationEditor) {
    const cmd = () => {
      this.addOrRebuild(editor);
    };
    const undo = () => {
      editor.remove();
    };

    this.addCommands({ cmd, undo, mustExec: true });
  }

  /**
   * Add a new editor and make this addition undoable.
   */
  addUndoableEditor(editor: AnnotationEditor) {
    const cmd = () => {
      this.addOrRebuild(editor);
    };
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
    switch (this.#uiManager.getMode()) {
      case AnnotationEditorType.FREETEXT:
        return new FreeTextEditor(params as FreeTextEditorP);
      case AnnotationEditorType.INK:
        return new InkEditor(params as InkEditorP);
    }
    return undefined;
  }

  /**
   * Create a new editor
   */
  deserialize(data: AnnotationEditorSerialized): AnnotationEditor | undefined {
    switch (data.annotationType) {
      case AnnotationEditorType.FREETEXT:
        return FreeTextEditor.deserialize(
          data as FreeTextEditorSerialized,
          this,
          this.#uiManager,
        );
      case AnnotationEditorType.INK:
        return InkEditor.deserialize(
          data as InkEditorSerialized,
          this,
          this.#uiManager,
        );
    }
    return undefined;
  }

  /**
   * Create and add a new editor.
   */
  #createAndAddNewEditor(event: PointerEvent): AnnotationEditor | undefined {
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

    if (!this.#hadPointerDown) {
      // It can happen when the user starts a drag inside a text editor
      // and then releases the mouse button outside of it. In such a case
      // we don't want to create a new editor, hence we check that a pointerdown
      // occured on this div previously.
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
  pointerdown(event: PointerEvent) {
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
  drop(event: DragEvent) {
    const id = event.dataTransfer!.getData("text/plain");
    const editor = this.#uiManager.getEditor(id);
    if (!editor) {
      return;
    }

    event.preventDefault();
    event.dataTransfer!.dropEffect = "move";

    this.#changeParent(editor);

    const rect = this.div!.getBoundingClientRect();
    const endX = event.clientX - rect.x;
    const endY = event.clientY - rect.y;

    editor.translate(endX - editor.startX, endY - editor.startY);
    this.moveEditorInDOM(editor);
    editor.div!.focus();
  }

  /**
   * Dragover callback.
   */
  dragover(event: DragEvent) {
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
    bindEvents(this, this.div!, ["dragover", "drop"]);
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
