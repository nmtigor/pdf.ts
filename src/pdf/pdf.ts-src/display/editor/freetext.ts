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

import type { dot2d_t } from "@fe-lib/alias.ts";
import type { rgb_t } from "@fe-lib/color/alias.ts";
import { html } from "@fe-lib/dom.ts";
import { assert } from "@fe-lib/util/trace.ts";
import { PDFJSDev, TESTING } from "@fe-src/global.ts";
import type { IL10n } from "@pdf.ts-web/interfaces.ts";
import type { AnnotationData } from "../../core/annotation.ts";
import {
  AnnotationEditorParamsType,
  AnnotationEditorType,
  LINE_FACTOR,
  shadow,
  Util,
} from "../../shared/util.ts";
import type { AnnotStorageValue } from "../annotation_layer.ts";
import { FreeTextAnnotationElement } from "../annotation_layer.ts";
import type { AnnotationEditorLayer } from "./annotation_editor_layer.ts";
import type { AnnotationEditorP, PropertyToUpdate } from "./editor.ts";
import { AnnotationEditor } from "./editor.ts";
import {
  AnnotationEditorUIManager,
  bindEvents,
  KeyboardManager,
} from "./tools.ts";
/*80--------------------------------------------------------------------------*/

export interface FreeTextEditorP extends AnnotationEditorP {
  name: "freeTextEditor";
  color?: string;
  fontSize?: number;
}

export interface FreeTextEditorSerialized extends AnnotStorageValue {
  fontSize: number;
  position: dot2d_t;
  value: string;
}

/**
 * Basic text editor in order to create a FreeTex annotation.
 */
export class FreeTextEditor extends AnnotationEditor {
  static override readonly _type = "freetext";
  static _freeTextDefaultContent = "";
  static _internalPadding = 0;
  static _defaultColor: string | undefined;
  static _defaultFontSize = 10;
  static get _keyboardManager() {
    const proto = FreeTextEditor.prototype;

    const arrowChecker = (self: FreeTextEditor) => self.isEmpty();

    const small = AnnotationEditorUIManager.TRANSLATE_SMALL;
    const big = AnnotationEditorUIManager.TRANSLATE_BIG;

    return shadow(
      this,
      "_keyboardManager",
      new KeyboardManager([
        [
          // Commit the text in case the user use ctrl+s to save the document.
          // The event must bubble in order to be caught by the viewer.
          // See bug 1831574.
          ["ctrl+s", "mac+meta+s", "ctrl+p", "mac+meta+p"],
          proto.commitOrRemove,
          { bubbles: true },
        ],
        [
          ["ctrl+Enter", "mac+meta+Enter", "Escape", "mac+Escape"],
          proto.commitOrRemove,
        ],
        [
          ["ArrowLeft", "mac+ArrowLeft"],
          proto._translateEmpty,
          { args: [-small, 0], checker: arrowChecker },
        ],
        [
          ["ctrl+ArrowLeft", "mac+shift+ArrowLeft"],
          proto._translateEmpty,
          { args: [-big, 0], checker: arrowChecker },
        ],
        [
          ["ArrowRight", "mac+ArrowRight"],
          proto._translateEmpty,
          { args: [small, 0], checker: arrowChecker },
        ],
        [
          ["ctrl+ArrowRight", "mac+shift+ArrowRight"],
          proto._translateEmpty,
          { args: [big, 0], checker: arrowChecker },
        ],
        [
          ["ArrowUp", "mac+ArrowUp"],
          proto._translateEmpty,
          { args: [0, -small], checker: arrowChecker },
        ],
        [
          ["ctrl+ArrowUp", "mac+shift+ArrowUp"],
          proto._translateEmpty,
          { args: [0, -big], checker: arrowChecker },
        ],
        [
          ["ArrowDown", "mac+ArrowDown"],
          proto._translateEmpty,
          { args: [0, small], checker: arrowChecker },
        ],
        [
          ["ctrl+ArrowDown", "mac+shift+ArrowDown"],
          proto._translateEmpty,
          { args: [0, big], checker: arrowChecker },
        ],
      ]),
    );
  }

  #boundEditorDivBlur = this.editorDivBlur.bind(this);
  #boundEditorDivFocus = this.editorDivFocus.bind(this);
  #boundEditorDivInput = this.editorDivInput.bind(this);
  #boundEditorDivKeydown = this.editorDivKeydown.bind(this);
  #color;
  #content = "";
  #editorDivId = `${this.id}-editor`;
  #fontSize;
  #initialData!: FreeTextEditorSerialized;

  overlayDiv!: HTMLDivElement;
  editorDiv!: HTMLDivElement;

  constructor(params: FreeTextEditorP) {
    super({ ...params, name: "freeTextEditor" });
    this.#color = params.color ||
      FreeTextEditor._defaultColor ||
      AnnotationEditor._defaultLineColor;
    this.#fontSize = params.fontSize || FreeTextEditor._defaultFontSize;
  }

  /** @inheritdoc */
  static override initialize(l10n: IL10n) {
    AnnotationEditor.initialize(l10n, {
      strings: ["free_text2_default_content", "editor_free_text2_aria_label"],
    });
    const style = getComputedStyle(document.documentElement);

    /*#static*/ if (PDFJSDev || TESTING) {
      const lineHeight = parseFloat(
        style.getPropertyValue("--freetext-line-height"),
      );
      assert(
        lineHeight === LINE_FACTOR,
        "Update the CSS variable to agree with the constant.",
      );
    }

    this._internalPadding = parseFloat(
      style.getPropertyValue("--freetext-padding"),
    );
  }

  /** @inheritdoc */
  static override updateDefaultParams(
    type: AnnotationEditorParamsType,
    value: number | string | undefined,
  ) {
    switch (type) {
      case AnnotationEditorParamsType.FREETEXT_SIZE:
        FreeTextEditor._defaultFontSize = value as number;
        break;
      case AnnotationEditorParamsType.FREETEXT_COLOR:
        FreeTextEditor._defaultColor = value as string;
        break;
    }
  }

  /** @inheritdoc */
  override updateParams(
    type: AnnotationEditorParamsType,
    value: number | string,
  ) {
    switch (type) {
      case AnnotationEditorParamsType.FREETEXT_SIZE:
        this.#updateFontSize(+value);
        break;
      case AnnotationEditorParamsType.FREETEXT_COLOR:
        this.#updateColor(<string> value);
        break;
    }
  }

  /** @inheritdoc */
  static override get defaultPropertiesToUpdate() {
    return [
      [
        AnnotationEditorParamsType.FREETEXT_SIZE,
        FreeTextEditor._defaultFontSize,
      ],
      [
        AnnotationEditorParamsType.FREETEXT_COLOR,
        FreeTextEditor._defaultColor || AnnotationEditor._defaultLineColor,
      ],
    ] as PropertyToUpdate[];
  }

  /** @inheritdoc */
  override get propertiesToUpdate() {
    return [
      [AnnotationEditorParamsType.FREETEXT_SIZE, this.#fontSize],
      [AnnotationEditorParamsType.FREETEXT_COLOR, this.#color],
    ] as PropertyToUpdate[];
  }

  /**
   * Update the font size and make this action as undoable.
   */
  #updateFontSize(fontSize: number) {
    const setFontsize = (size: number) => {
      this.editorDiv.style.fontSize = `calc(${size}px * var(--scale-factor))`;
      this.translate(0, -(size - this.#fontSize) * this.parentScale);
      this.#fontSize = size;
      this.#setEditorDimensions();
    };
    const savedFontsize = this.#fontSize;
    this.addCommands({
      cmd: () => {
        setFontsize(fontSize);
      },
      undo: () => {
        setFontsize(savedFontsize);
      },
      mustExec: true,
      type: AnnotationEditorParamsType.FREETEXT_SIZE,
      overwriteIfSameType: true,
      keepUndo: true,
    });
  }

  /**
   * Update the color and make this action undoable.
   */
  #updateColor(color: string) {
    const savedColor = this.#color;
    this.addCommands({
      cmd: () => {
        this.#color = this.editorDiv.style.color = color;
      },
      undo: () => {
        this.#color = this.editorDiv.style.color = savedColor;
      },
      mustExec: true,
      type: AnnotationEditorParamsType.FREETEXT_COLOR,
      overwriteIfSameType: true,
      keepUndo: true,
    });
  }

  /**
   * Helper to translate the editor with the keyboard when it's empty.
   * @param x in page units.
   * @param y in page units.
   */
  _translateEmpty(x?: number, y?: number) {
    this._uiManager.translateSelectedEditors(x, y, /* noCommit = */ true);
  }

  /** @inheritdoc */
  override getInitialTranslation(): dot2d_t {
    // The start of the base line is where the user clicked.
    const scale = this.parentScale;
    return [
      -FreeTextEditor._internalPadding * scale,
      -(FreeTextEditor._internalPadding + this.#fontSize) * scale,
    ];
  }

  /** @inheritdoc */
  override rebuild() {
    if (!this.parent) {
      return;
    }
    super.rebuild();
    if (this.div === undefined) {
      return;
    }

    if (!this.isAttachedToDOM) {
      // At some point this editor was removed and we're rebuilting it,
      // hence we must add it to its parent.
      this.parent!.add(this);
    }
  }

  /** @inheritdoc */
  override enableEditMode() {
    if (this.isInEditMode()) {
      return;
    }

    this.parent!.setEditingState(false);
    this.parent!.updateToolbar(AnnotationEditorType.FREETEXT);
    super.enableEditMode();
    this.overlayDiv.classList.remove("enabled");
    this.editorDiv.contentEditable = true as any;
    this._isDraggable = false;
    this.div!.removeAttribute("aria-activedescendant");
    this.editorDiv.on("keydown", this.#boundEditorDivKeydown);
    this.editorDiv.on("focus", this.#boundEditorDivFocus);
    this.editorDiv.on("blur", this.#boundEditorDivBlur);
    this.editorDiv.on("input", this.#boundEditorDivInput);
  }

  /** @inheritdoc */
  override disableEditMode() {
    if (!this.isInEditMode()) {
      return;
    }

    this.parent!.setEditingState(true);
    super.disableEditMode();
    this.overlayDiv.classList.add("enabled");
    this.editorDiv.contentEditable = false as any;
    this.div!.setAttribute("aria-activedescendant", this.#editorDivId);
    this._isDraggable = true;
    this.editorDiv.off("keydown", this.#boundEditorDivKeydown);
    this.editorDiv.off("focus", this.#boundEditorDivFocus);
    this.editorDiv.off("blur", this.#boundEditorDivBlur);
    this.editorDiv.off("input", this.#boundEditorDivInput);

    // On Chrome, the focus is given to <body> when contentEditable is set to
    // false, hence we focus the div.
    this.div!.focus({ preventScroll: true /* See issue #15744 */ });

    // In case the blur callback hasn't been called.
    this.isEditing = false;
    this.parent!.div!.classList.add("freeTextEditing");
  }

  /** @inheritdoc */
  override focusin(event: FocusEvent) {
    if (!this._focusEventsAllowed) {
      return;
    }
    super.focusin(event);
    if (event.target !== this.editorDiv) {
      this.editorDiv.focus();
    }
  }

  /** @inheritdoc */
  override onceAdded() {
    if (this.width) {
      this.#cheatInitialRect();
      // The editor was created in using ctrl+c.
      return;
    }
    this.enableEditMode();
    this.editorDiv.focus();
    if (this._initialOptions?.isCentered) {
      this.center();
    }
    this._initialOptions = undefined as any;
  }

  /** @inheritdoc */
  override isEmpty() {
    return !this.editorDiv || this.editorDiv.innerText.trim() === "";
  }

  /** @inheritdoc */
  override remove() {
    this.isEditing = false;
    if (this.parent) {
      this.parent!.setEditingState(true);
      this.parent!.div!.classList.add("freeTextEditing");
    }
    super.remove();
  }

  /**
   * Extract the text from this editor.
   */
  #extractText(): string {
    const divs = this.editorDiv.getElementsByTagName("div");
    if (divs.length === 0) {
      return this.editorDiv.innerText;
    }
    const buffer = [];
    for (const div of divs) {
      buffer.push(div.innerText.replace(/\r\n?|\n/, ""));
    }
    return buffer.join("\n");
  }

  #setEditorDimensions() {
    const [parentWidth, parentHeight] = this.parentDimensions;

    let rect;
    if (this.isAttachedToDOM) {
      rect = this.div!.getBoundingClientRect();
    } else {
      // This editor isn't on screen but we need to get its dimensions, so
      // we just insert it in the DOM, get its bounding box and then remove it.
      const { currentLayer, div } = this;
      const savedDisplay = div!.style.display;
      div!.style.display = "hidden";
      currentLayer!.div!.append(this.div!);
      rect = div!.getBoundingClientRect();
      div!.remove();
      div!.style.display = savedDisplay;
    }

    // The dimensions are relative to the rotation of the page, hence we need to
    // take that into account (see issue #16636).
    if (this.rotation % 180 === this.parentRotation % 180) {
      this.width = rect.width / parentWidth;
      this.height = rect.height / parentHeight;
    } else {
      this.width = rect.height / parentWidth;
      this.height = rect.width / parentHeight;
    }
    this.fixAndSetPosition();
  }

  /**
   * Commit the content we have in this editor.
   */
  override commit(): void {
    if (!this.isInEditMode()) {
      return;
    }

    super.commit();
    this.disableEditMode();
    const savedText = this.#content;
    const newText = (this.#content = this.#extractText().trimEnd());
    if (savedText === newText) {
      return;
    }

    const setText = (text: string) => {
      this.#content = text;
      if (!text) {
        this.remove();
        return;
      }
      this.#setContent();
      this._uiManager.rebuild(this);
      this.#setEditorDimensions();
    };
    this.addCommands({
      cmd: () => {
        setText(newText);
      },
      undo: () => {
        setText(savedText);
      },
      mustExec: false,
    });
    this.#setEditorDimensions();
  }

  /** @inheritdoc */
  override shouldGetKeyboardEvents() {
    return this.isInEditMode();
  }

  /** @inheritdoc */
  override enterInEditMode() {
    this.enableEditMode();
    this.editorDiv.focus();
  }

  /**
   * ondblclick callback.
   */
  dblclick(event: MouseEvent) {
    this.enterInEditMode();
  }

  /**
   * onkeydown callback.
   */
  keydown(event: KeyboardEvent) {
    if (event.target === this.div && event.key === "Enter") {
      this.enterInEditMode();
      // Avoid to add an unwanted new line.
      event.preventDefault();
    }
  }

  editorDivKeydown(event: KeyboardEvent) {
    FreeTextEditor._keyboardManager.exec(this, event);
  }

  editorDivFocus(event: FocusEvent) {
    this.isEditing = true;
  }

  editorDivBlur(event: FocusEvent) {
    this.isEditing = false;
  }

  editorDivInput(event: Event) {
    this.parent!.div!.classList.toggle("freeTextEditing", this.isEmpty());
  }

  /** @inheritdoc */
  override disableEditing() {
    this.editorDiv.setAttribute("role", "comment");
    this.editorDiv.removeAttribute("aria-multiline");
  }

  /** @inheritdoc */
  override enableEditing() {
    this.editorDiv.setAttribute("role", "textbox");
    this.editorDiv.setAttribute("aria-multiline", true as any);
  }

  /** @inheritdoc */
  override render() {
    if (this.div) {
      return this.div;
    }

    let baseX: number, baseY: number;
    if (this.width) {
      baseX = this.x;
      baseY = this.y;
    }

    super.render();
    this.editorDiv = html("div");
    this.editorDiv.className = "internal";

    this.editorDiv.setAttribute("id", this.#editorDivId);
    this.enableEditing();

    AnnotationEditor._l10nPromise!
      .get("editor_free_text2_aria_label")!
      .then((msg) => this.editorDiv?.setAttribute("aria-label", msg));

    AnnotationEditor._l10nPromise!
      .get("free_text2_default_content")!
      .then((msg) => this.editorDiv?.setAttribute("default-content", msg));
    this.editorDiv.contentEditable = true as any;

    const { style } = this.editorDiv;
    style.fontSize = `calc(${this.#fontSize}px * var(--scale-factor))`;
    style.color = this.#color;

    this.div!.append(this.editorDiv);

    this.overlayDiv = html("div");
    this.overlayDiv.classList.add("overlay", "enabled");
    this.div!.append(this.overlayDiv);

    // TODO: implement paste callback.
    // The goal is to sanitize and have something suitable for this
    // editor.
    bindEvents(this, this.div!, ["dblclick", "keydown"]);

    if (this.width) {
      // This editor was created in using copy (ctrl+c).
      const [parentWidth, parentHeight] = this.parentDimensions;
      if (this.annotationElementId) {
        // This stuff is hard to test: if something is changed here, please
        // test with the following PDF file:
        //  - freetexts.pdf
        //  - rotated_freetexts.pdf
        // Only small variations between the original annotation and its editor
        // are allowed.

        // position is the position of the first glyph in the annotation
        // and it's relative to its container.
        const { position } = this.#initialData;
        let [tx, ty] = this.getInitialTranslation();
        [tx, ty] = this.pageTranslationToScreen(tx, ty);
        const [pageWidth, pageHeight] = this.pageDimensions;
        const [pageX, pageY] = this.pageTranslation;
        let posX: number, posY: number;
        switch (this.rotation) {
          case 0:
            posX = baseX! + (position[0] - pageX) / pageWidth;
            posY = baseY! + this.height! - (position[1] - pageY) / pageHeight;
            break;
          case 90:
            posX = baseX! + (position[0] - pageX) / pageWidth;
            posY = baseY! - (position[1] - pageY) / pageHeight;
            [tx, ty] = [ty, -tx];
            break;
          case 180:
            posX = baseX! - this.width + (position[0] - pageX) / pageWidth;
            posY = baseY! - (position[1] - pageY) / pageHeight;
            [tx, ty] = [-tx, -ty];
            break;
          case 270:
            posX = baseX! +
              (position[0] - pageX - this.height! * pageHeight) / pageWidth;
            posY = baseY! +
              (position[1] - pageY - this.width * pageWidth) / pageHeight;
            [tx, ty] = [-ty, tx];
            break;
        }
        this.setAt(posX! * parentWidth, posY! * parentHeight, tx, ty);
      } else {
        this.setAt(
          baseX! * parentWidth,
          baseY! * parentHeight,
          this.width * parentWidth,
          this.height! * parentHeight,
        );
      }

      this.#setContent();
      this._isDraggable = true;
      this.editorDiv.contentEditable = false as any;
    } else {
      this._isDraggable = false;
      this.editorDiv.contentEditable = true as any;
    }

    /*#static*/ if (TESTING) {
      this.div!.setAttribute("annotation-id", this.annotationElementId as any);
    }

    return this.div!;
  }

  #setContent() {
    this.editorDiv.replaceChildren();
    if (!this.#content) {
      return;
    }
    for (const line of this.#content.split("\n")) {
      const div = document.createElement("div");
      div.append(
        line ? document.createTextNode(line) : document.createElement("br"),
      );
      this.editorDiv.append(div);
    }
  }

  override get contentDiv() {
    return this.editorDiv;
  }

  /** @inheritdoc */
  static override deserialize(
    data: FreeTextEditorSerialized,
    parent: AnnotationEditorLayer,
    uiManager: AnnotationEditorUIManager,
  ): FreeTextEditor | undefined {
    let initialData: FreeTextEditorSerialized;
    if (data instanceof FreeTextAnnotationElement) {
      const {
        data: {
          defaultAppearanceData: { fontSize, fontColor },
          rect,
          rotation,
          id,
        },
        textContent,
        textPosition,
        parent: {
          page: { pageNumber },
        },
      } = data as FreeTextAnnotationElement & {
        data: Required<AnnotationData>;
      };
      // textContent is supposed to be an array of strings containing each line
      // of text. However, it can be undefined or empty.
      if (!textContent || textContent.length === 0) {
        // Empty annotation.
        return undefined;
      }
      initialData = data = {
        annotationType: AnnotationEditorType.FREETEXT,
        color: Array.from(fontColor!) as rgb_t,
        fontSize,
        value: textContent.join("\n"),
        position: textPosition!,
        pageIndex: pageNumber - 1,
        rect,
        rotation,
        id,
        deleted: false,
      };
    }
    const editor = super.deserialize(data, parent, uiManager) as FreeTextEditor;

    editor.#fontSize = data.fontSize!;
    // editor.#color = Util.makeHexColor(...data.color!);
    editor.#color = Util.makeHexColor(
      data.color![0],
      data.color![1],
      data.color![2],
    );
    editor.#content = data.value!;
    editor.annotationElementId = data.id || undefined;
    editor.#initialData = initialData!;

    return editor;
  }

  /**
   * @inheritdoc
   * @implement
   */
  serialize(isForCopying = false) {
    if (this.isEmpty()) {
      return undefined;
    }

    if (this.deleted) {
      return {
        pageIndex: this.pageIndex,
        id: this.annotationElementId,
        deleted: true,
      } as FreeTextEditorSerialized;
    }

    const padding = FreeTextEditor._internalPadding * this.parentScale;
    const rect = this.getRect(padding, padding);

    const color = AnnotationEditor._colorManager.convert(
      this.isAttachedToDOM
        ? getComputedStyle(this.editorDiv).color
        : this.#color,
    );

    const serialized = {
      annotationType: AnnotationEditorType.FREETEXT,
      color,
      fontSize: this.#fontSize,
      value: this.#content,
      pageIndex: this.pageIndex,
      rect,
      rotation: this.rotation,
      structTreeParentId: this._structTreeParentId,
    } as FreeTextEditorSerialized;

    if (isForCopying) {
      // Don't add the id when copying because the pasted editor mustn't be
      // linked to an existing annotation.
      return serialized;
    }

    if (this.annotationElementId && !this.#hasElementChanged(serialized)) {
      return undefined;
    }

    serialized.id = this.annotationElementId;

    return serialized;
  }

  #hasElementChanged(serialized: FreeTextEditorSerialized) {
    const { value, fontSize, color, rect, pageIndex } = this.#initialData;

    return (
      serialized.value !== value ||
      serialized.fontSize !== fontSize ||
      serialized.rect!.some((x, i) => Math.abs(x - rect![i]) >= 1) ||
      serialized.color!.some((c, i) => c !== color![i]) ||
      serialized.pageIndex !== pageIndex
    );
  }

  #cheatInitialRect(delayed = false) {
    // The annotation has a rect but the editor has an other one.
    // When we want to know if the annotation has changed (e.g. has been moved)
    // we must compare the editor initial rect with the current one.
    // So this method is a hack to have a way to compare the real rects.
    if (!this.annotationElementId) {
      return;
    }

    this.#setEditorDimensions();
    if (!delayed && (this.width === 0 || this.height === 0)) {
      setTimeout(() => this.#cheatInitialRect(/* delayed = */ true), 0);
      return;
    }

    const padding = FreeTextEditor._internalPadding * this.parentScale;
    this.#initialData.rect = this.getRect(padding, padding);
  }
}
/*80--------------------------------------------------------------------------*/
