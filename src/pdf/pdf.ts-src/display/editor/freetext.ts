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

import { _PDFDEV } from "../../../../global.ts";
import { html } from "../../../../lib/dom.ts";
import { assert } from "../../../../lib/util/trace.ts";
import { IL10n } from "../../../pdf.ts-web/interfaces.ts";
import {
  AnnotationEditorParamsType,
  AnnotationEditorType,
  LINE_FACTOR,
  Util,
} from "../../shared/util.ts";
import { AnnotationEditorLayer } from "./annotation_editor_layer.ts";
import {
  AnnotationEditor,
  AnnotationEditorP,
  AnnotationEditorSerialized,
  PropertyToUpdate,
} from "./editor.ts";
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

export interface FreeTextEditorSerialized extends AnnotationEditorSerialized {
  fontSize: number;
  value: string;
}

/**
 * Basic text editor in order to create a FreeTex annotation.
 */
export class FreeTextEditor extends AnnotationEditor {
  static _freeTextDefaultContent = "";
  static _l10nPromise: Map<string, Promise<string>>;
  static _internalPadding = 0;
  static _defaultColor: string | undefined;
  static _defaultFontSize = 10;
  static _keyboardManager = new KeyboardManager([
    [
      ["ctrl+Enter", "mac+meta+Enter", "Escape", "mac+Escape"],
      FreeTextEditor.prototype.commitOrRemove,
    ],
  ]);
  static override readonly _type = "freetext";

  #boundEditorDivBlur = this.editorDivBlur.bind(this);
  #boundEditorDivFocus = this.editorDivFocus.bind(this);
  #boundEditorDivInput = this.editorDivInput.bind(this);
  #boundEditorDivKeydown = this.editorDivKeydown.bind(this);
  #color;
  #content = "";
  #editorDivId = `${this.id}-editor`;
  #hasAlreadyBeenCommitted = false;
  #fontSize;

  overlayDiv!: HTMLDivElement;
  editorDiv!: HTMLDivElement;

  constructor(params: FreeTextEditorP) {
    super({ ...params, name: "freeTextEditor" });
    this.#color = params.color ||
      FreeTextEditor._defaultColor ||
      AnnotationEditor._defaultLineColor;
    this.#fontSize = params.fontSize || FreeTextEditor._defaultFontSize;
  }

  static initialize(l10n: IL10n) {
    this._l10nPromise = new Map(
      ["free_text2_default_content", "editor_free_text2_aria_label"].map(
        (str) => [str, l10n.get(str)],
      ),
    );

    const style = getComputedStyle(document.documentElement);

    /*#static*/ if (_PDFDEV) {
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

  static updateDefaultParams(
    type: AnnotationEditorParamsType,
    value: number | string,
  ) {
    switch (type) {
      case AnnotationEditorParamsType.FREETEXT_SIZE:
        FreeTextEditor._defaultFontSize = +value;
        break;
      case AnnotationEditorParamsType.FREETEXT_COLOR:
        FreeTextEditor._defaultColor = <string> value;
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

  static get defaultPropertiesToUpdate() {
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

  /** @inheritdoc */
  override getInitialTranslation() {
    // The start of the base line is where the user clicked.
    const scale = this.parentScale;
    return [
      -FreeTextEditor._internalPadding * scale,
      -(FreeTextEditor._internalPadding + this.#fontSize) * scale,
    ];
  }

  /** @inheritdoc */
  override rebuild() {
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
    this.editorDiv.contentEditable = <any> true;
    this.div!.draggable = false;
    this.div!.removeAttribute("aria-activedescendant");
    this.editorDiv.addEventListener("keydown", this.#boundEditorDivKeydown);
    this.editorDiv.addEventListener("focus", this.#boundEditorDivFocus);
    this.editorDiv.addEventListener("blur", this.#boundEditorDivBlur);
    this.editorDiv.addEventListener("input", this.#boundEditorDivInput);
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
    this.div!.draggable = true;
    this.editorDiv.removeEventListener("keydown", this.#boundEditorDivKeydown);
    this.editorDiv.removeEventListener("focus", this.#boundEditorDivFocus);
    this.editorDiv.removeEventListener("blur", this.#boundEditorDivBlur);
    this.editorDiv.removeEventListener("input", this.#boundEditorDivInput);

    // On Chrome, the focus is given to <body> when contentEditable is set to
    // false, hence we focus the div.
    this.div!.focus({ preventScroll: true /* See issue #15744 */ });

    // In case the blur callback hasn't been called.
    this.isEditing = false;
    this.parent!.div!.classList.add("freeTextEditing");
  }

  /** @inheritdoc */
  override focusin(event: FocusEvent) {
    super.focusin(event);
    if (event.target !== this.editorDiv) {
      this.editorDiv.focus();
    }
  }

  /** @inheritdoc */
  override onceAdded() {
    if (this.width) {
      // The editor was created in using ctrl+c.
      return;
    }
    this.enableEditMode();
    this.editorDiv.focus();
  }

  /** @inheritdoc */
  override isEmpty() {
    return !this.editorDiv || this.editorDiv.innerText.trim() === "";
  }

  /** @inheritdoc */
  override remove() {
    this.isEditing = false;
    this.parent!.setEditingState(true);
    this.parent!.div!.classList.add("freeTextEditing");
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

    this.width = rect.width / parentWidth;
    this.height = rect.height / parentHeight;
  }

  /**
   * Commit the content we have in this editor.
   */
  override commit(): void {
    if (!this.isInEditMode()) {
      return;
    }

    super.commit();
    if (!this.#hasAlreadyBeenCommitted) {
      // This editor has something and it's the first time
      // it's commited so we can add it in the undo/redo stack.
      this.#hasAlreadyBeenCommitted = true;
      this.parent!.addUndoableEditor(this);
    }

    this.disableEditMode();
    this.#content = this.#extractText().trimEnd();

    this.#setEditorDimensions();
  }

  /** @inheritdoc */
  override shouldGetKeyboardEvents() {
    return this.isInEditMode();
  }

  /**
   * ondblclick callback.
   */
  dblclick(event: MouseEvent) {
    this.enableEditMode();
    this.editorDiv.focus();
  }

  /**
   * onkeydown callback.
   */
  keydown(event: KeyboardEvent) {
    if (event.target === this.div && event.key === "Enter") {
      this.enableEditMode();
      this.editorDiv.focus();
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
    this.editorDiv.setAttribute("aria-multiline", <any> true);
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

    FreeTextEditor._l10nPromise
      .get("editor_free_text2_aria_label")!
      .then((msg) => this.editorDiv?.setAttribute("aria-label", msg));

    FreeTextEditor._l10nPromise
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
      this.setAt(
        baseX! * parentWidth,
        baseY! * parentHeight,
        this.width * parentWidth,
        this.height! * parentHeight,
      );

      for (const line of this.#content.split("\n")) {
        const div = document.createElement("div");
        div.append(
          line ? document.createTextNode(line) : document.createElement("br"),
        );
        this.editorDiv.append(div);
      }

      this.div!.draggable = true;
      this.editorDiv.contentEditable = false as any;
    } else {
      this.div!.draggable = false;
      this.editorDiv.contentEditable = true as any;
    }

    return this.div!;
  }

  override get contentDiv() {
    return this.editorDiv;
  }

  /** @inheritdoc */
  static override deserialize(
    data: FreeTextEditorSerialized,
    parent: AnnotationEditorLayer,
    uiManager: AnnotationEditorUIManager,
  ) {
    const editor = <FreeTextEditor> super.deserialize(data, parent, uiManager);

    editor.#fontSize = data.fontSize;
    editor.#color = Util.makeHexColor(...data.color);
    editor.#content = data.value;

    return editor;
  }

  /**
   * @inheritdoc
   * @implement
   */
  serialize(): FreeTextEditorSerialized | undefined {
    if (this.isEmpty()) {
      return undefined;
    }

    const padding = FreeTextEditor._internalPadding * this.parentScale;
    const rect = this.getRect(padding, padding);

    const color = AnnotationEditor._colorManager.convert(
      this.isAttachedToDOM
        ? getComputedStyle(this.editorDiv).color
        : this.#color,
    );

    return {
      annotationType: AnnotationEditorType.FREETEXT,
      color,
      fontSize: this.#fontSize,
      value: this.#content,
      pageIndex: this.pageIndex,
      rect,
      rotation: this.rotation,
    };
  }
}
/*80--------------------------------------------------------------------------*/
