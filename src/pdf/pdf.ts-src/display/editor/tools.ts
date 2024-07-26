/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/editor/tools.ts
 * @license Apache-2.0
 ******************************************************************************/

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

import type { Cssc, rgb_t } from "@fe-lib/color/alias.ts";
import type { HSElement } from "@fe-lib/dom.ts";
import { warn } from "@fe-lib/util/trace.ts";
import type { AltTextManager } from "@fe-pdf.ts-web/alt_text_manager.ts";
import type { MLManager as MLManager_c } from "@fe-pdf.ts-web/chromecom.ts";
import type { EventBus, EventMap } from "@fe-pdf.ts-web/event_utils.ts";
import type { MLManager as MLManager_f } from "@fe-pdf.ts-web/firefoxcom.ts";
import type { MLManager as MLManager_g } from "@fe-pdf.ts-web/genericcom.ts";
import type { PageColors } from "@fe-pdf.ts-web/pdf_viewer.ts";
import { LIB, TESTING } from "@fe-src/global.ts";
import type { Box } from "../../alias.ts";
import type { AnnotationEditorName } from "../../shared/util.ts";
import {
  AnnotationEditorParamsType,
  AnnotationEditorPrefix,
  AnnotationEditorType,
  FeatureTest,
  getUuid,
  shadow,
  Util,
} from "../../shared/util.ts";
import type { AnnotationElement } from "../annotation_layer.ts";
import type { PDFDocumentProxy } from "../api.ts";
import {
  fetchData,
  getColorValues,
  getRGB,
  PixelsPerInch,
} from "../display_utils.ts";
import type { AnnotationEditorLayer } from "./annotation_editor_layer.ts";
import type { ColorPicker } from "./color_picker.ts";
import type { AnnotationEditor, PropertyToUpdate } from "./editor.ts";
import { FreeTextEditor } from "./freetext.ts";
import type { HighlightEditor } from "./highlight.ts";
import { InkEditor } from "./ink.ts";
import { StampEditor } from "./stamp.ts";
import { HighlightToolbar } from "./toolbar.ts";
/*80--------------------------------------------------------------------------*/

export function bindEvents<T extends AnnotationEditor | AnnotationEditorLayer>(
  obj: T,
  element: HTMLElement,
  names: (keyof HTMLElementEventMap & keyof T)[],
) {
  for (const name of names) {
    element.on(name, (obj[name] as Function).bind(obj));
  }
}

/**
 * Convert a number between 0 and 100 into an hex number between 0 and 255.
 */
export function opacityToHex(opacity: number): string {
  return Math.round(Math.min(255, Math.max(1, 255 * opacity)))
    .toString(16)
    .padStart(2, "0");
}

/**
 * Class to create some unique ids for the different editors.
 */
class IdManager {
  #id = 0;
  /**
   * Get a unique id.
   */
  get id(): string {
    return `${AnnotationEditorPrefix}${this.#id++}`;
  }

  constructor() {
    /*#static*/ if (TESTING) {
      Object.defineProperty(this, "reset", {
        value: () => (this.#id = 0),
      });
    }
  }

  reset!: () => void;
}

export type BitmapData = {
  bitmap?: HTMLImageElement | ImageBitmap | undefined;
  id: `image_${string}_${number}`;
  refCounter: number;
  isSvg: boolean;
  svgUrl: string;
  url: string;
  file?: File;
};

/**
 * Class to manage the images used by the editors.
 * The main idea is to try to minimize the memory used by the images.
 * The images are cached and reused when possible
 * We use a refCounter to know when an image is not used anymore but we need to
 * be able to restore an image after a remove+undo, so we keep a file reference
 * or an url one.
 */
class ImageManager {
  #baseId = getUuid();
  #id = 0;
  #cache: Map<string, BitmapData | undefined> | undefined;

  static get _isSVGFittingCanvas() {
    // By default, Firefox doesn't rescale without preserving the aspect ratio
    // when drawing an SVG image on a canvas, see https://bugzilla.mozilla.org/1547776.
    // The "workaround" is to append "svgView(preserveAspectRatio(none))" to the
    // url, but according to comment #15, it seems that it leads to unexpected
    // behavior in Safari.
    const svg =
      `data:image/svg+xml;charset=UTF-8,<svg viewBox="0 0 1 1" width="1" height="1" xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1" style="fill:red;"/></svg>`;
    const canvas = new OffscreenCanvas(1, 3);
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const image = new Image();
    image.src = svg;
    const promise = image.decode().then(() => {
      ctx.drawImage(image, 0, 0, 1, 1, 0, 0, 1, 3);
      return new Uint32Array(ctx.getImageData(0, 0, 1, 1).data.buffer)[0] === 0;
    });

    return shadow(this, "_isSVGFittingCanvas", promise);
  }

  async #get(key: string, rawData: string | File) {
    this.#cache ||= new Map();
    let data = this.#cache.get(key);
    if (data === undefined) {
      // We already tried to load the image but it failed.
      return undefined;
    }
    if (data?.bitmap) {
      data.refCounter += 1;
      return data;
    }
    try {
      data ||= {
        id: `image_${this.#baseId}_${this.#id++}`,
        refCounter: 0,
        isSvg: false,
      } as BitmapData;
      let image;
      if (typeof rawData === "string") {
        data.url = rawData;

        image = await fetchData(rawData, "blob");
      } else {
        image = data.file = rawData;
      }

      if (image.type === "image/svg+xml") {
        // Unfortunately, createImageBitmap doesn't work with SVG images.
        // (see https://bugzilla.mozilla.org/1841972).
        const mustRemoveAspectRatioPromise = ImageManager._isSVGFittingCanvas;
        const fileReader = new FileReader();
        const imageElement = new Image();
        const imagePromise = new Promise<void>((resolve, reject) => {
          imageElement.onload = () => {
            data!.bitmap = imageElement;
            data!.isSvg = true;
            resolve();
          };
          fileReader.onload = async () => {
            const url = (data!.svgUrl = fileReader.result as string);
            // We need to set the preserveAspectRatio to none in order to let
            // the image fits the canvas when resizing.
            imageElement.src = (await mustRemoveAspectRatioPromise)
              ? `${url}#svgView(preserveAspectRatio(none))`
              : url;
          };
          imageElement.onerror = fileReader.onerror = reject;
        });
        fileReader.readAsDataURL(image);
        await imagePromise;
      } else {
        data.bitmap = await createImageBitmap(image);
      }
      data.refCounter = 1;
    } catch (e) {
      console.error(e);
      data = undefined;
    }
    this.#cache.set(key, data);
    if (data) {
      this.#cache.set(data.id, data);
    }
    return data;
  }

  async getFromFile(file: File) {
    const { lastModified, name, size, type } = file;
    return this.#get(`${lastModified}_${name}_${size}_${type}`, file);
  }

  async getFromUrl(url: string) {
    return this.#get(url, url);
  }

  async getFromId(id: string): Promise<BitmapData | undefined> {
    this.#cache ||= new Map();
    const data = this.#cache.get(id);
    if (!data) {
      return undefined;
    }
    if (data.bitmap) {
      data.refCounter += 1;
      return data;
    }

    if (data.file) {
      return this.getFromFile(data.file);
    }
    return this.getFromUrl(data.url);
  }

  getSvgUrl(id: string): string | undefined {
    const data = this.#cache!.get(id);
    if (!data?.isSvg) {
      return undefined;
    }
    return data.svgUrl;
  }

  deleteId(id: string) {
    this.#cache ||= new Map();
    const data = this.#cache.get(id);
    if (!data) {
      return;
    }
    data.refCounter -= 1;
    if (data.refCounter !== 0) {
      return;
    }
    data.bitmap = undefined;
  }

  // We can use the id only if it belongs this manager.
  // We must take care of having the right manager because we can copy/paste
  // some images from other documents, hence it'd be a pity to use an id from an
  // other manager.
  isValidId(id: string) {
    return id.startsWith(`image_${this.#baseId}_`);
  }
}

export interface AddCommandsP {
  cmd: () => void;
  undo: () => void;
  post?: (() => void) | undefined;
  mustExec?: boolean;
  type?: number;
  overwriteIfSameType?: boolean;
  keepUndo?: boolean;
}

/**
 * Class to handle undo/redo.
 * Commands are just saved in a buffer.
 * If we hit some memory issues we could likely use a circular buffer.
 * It has to be used as a singleton.
 */
export class CommandManager {
  #commands: AddCommandsP[] | undefined = [];
  #locked = false;
  #maxSize;
  #position = -1;

  constructor(maxSize = 128) {
    this.#maxSize = maxSize;
  }

  /**
   * Add a new couple of commands to be used in case of redo/undo.
   */
  add({
    cmd,
    undo,
    post,
    mustExec,
    type = NaN,
    overwriteIfSameType = false,
    keepUndo = false,
  }: AddCommandsP) {
    if (mustExec) {
      cmd();
    }

    if (this.#locked) {
      return;
    }

    const save: AddCommandsP = { cmd, undo, post, type };
    if (this.#position === -1) {
      if (this.#commands!.length > 0) {
        // All the commands have been undone and then a new one is added
        // hence we clear the queue.
        this.#commands!.length = 0;
      }
      this.#position = 0;
      this.#commands!.push(save);
      return;
    }

    if (overwriteIfSameType && this.#commands![this.#position].type === type) {
      // For example when we change a color we don't want to
      // be able to undo all the steps, hence we only want to
      // keep the last undoable action in this sequence of actions.
      if (keepUndo) {
        save.undo = this.#commands![this.#position].undo;
      }
      this.#commands![this.#position] = save;
      return;
    }

    const next = this.#position + 1;
    if (next === this.#maxSize) {
      this.#commands!.splice(0, 1);
    } else {
      this.#position = next;
      if (next < this.#commands!.length) {
        this.#commands!.splice(next);
      }
    }

    this.#commands!.push(save);
  }

  /**
   * Undo the last command.
   */
  undo() {
    if (this.#position === -1) {
      // Nothing to undo.
      return;
    }

    // Avoid to insert something during the undo execution.
    this.#locked = true;
    const { undo, post } = this.#commands![this.#position];
    undo();
    post?.();
    this.#locked = false;

    this.#position -= 1;
  }

  /**
   * Redo the last command.
   */
  redo() {
    if (this.#position < this.#commands!.length - 1) {
      this.#position += 1;

      // Avoid to insert something during the redo execution.
      this.#locked = true;
      const { cmd, post } = this.#commands![this.#position];
      cmd();
      post?.();
      this.#locked = false;
    }
  }

  /**
   * Check if there is something to undo.
   */
  hasSomethingToUndo(): boolean {
    return this.#position !== -1;
  }

  /**
   * Check if there is something to redo.
   */
  hasSomethingToRedo(): boolean {
    return this.#position < this.#commands!.length - 1;
  }

  destroy() {
    this.#commands = undefined;
  }
}

type KeyboardCallback_ =
  | ((translateX?: number, translateY?: number, noCommit?: boolean) => void)
  | ((direction: 0 | 1 | 2 | 3) => void)
  | ((event: MouseEvent) => void);

type KeyboardCallbackOptions_<
  S extends AnnotationEditorUIManager | AnnotationEditor | ColorPicker,
> = {
  bubbles?: boolean;
  // args?: [number?, number?, boolean?];
  args?: unknown[];
  checker?:
    | ((self: S, event: KeyboardEvent) => boolean)
    | ((self: S) => boolean);
};

/**
 * Class to handle the different keyboards shortcuts we can have on mac or
 * non-mac OSes.
 */
export class KeyboardManager<
  S extends AnnotationEditorUIManager | AnnotationEditor | ColorPicker,
> {
  buffer: string[] = [];
  callbacks = new Map<
    string,
    {
      callback: KeyboardCallback_;
      options: KeyboardCallbackOptions_<S>;
    }
  >();
  allKeys = new Set<string>();

  /**
   * Create a new keyboard manager class.
   * @param callbacks an array containing an array of shortcuts
   * and a callback to call.
   * A shortcut is a string like `ctrl+c` or `mac+ctrl+c` for mac OS.
   */
  constructor(
    callbacks: [string[], KeyboardCallback_, KeyboardCallbackOptions_<S>?][],
  ) {
    const { isMac } = FeatureTest.platform;
    for (const [keys, callback, options = {}] of callbacks) {
      for (const key of keys) {
        const isMacKey = key.startsWith("mac+");
        if (isMac && isMacKey) {
          this.callbacks.set(key.slice(4), { callback, options });
          this.allKeys.add(key.split("+").at(-1)!);
        } else if (!isMac && !isMacKey) {
          this.callbacks.set(key, { callback, options });
          this.allKeys.add(key.split("+").at(-1)!);
        }
      }
    }
  }

  /**
   * Serialize an event into a string in order to match a
   * potential key for a callback.
   */
  #serialize(event: KeyboardEvent): string {
    if (event.altKey) {
      this.buffer.push("alt");
    }
    if (event.ctrlKey) {
      this.buffer.push("ctrl");
    }
    if (event.metaKey) {
      this.buffer.push("meta");
    }
    if (event.shiftKey) {
      this.buffer.push("shift");
    }
    this.buffer.push(event.key);
    const str = this.buffer.join("+");
    this.buffer.length = 0;

    return str;
  }

  /**
   * Execute a callback, if any, for a given keyboard event.
   * The self is used as `this` in the callback.
   */
  exec(self: S, event: KeyboardEvent): void {
    if (!this.allKeys.has(event.key)) {
      return;
    }
    const info = this.callbacks.get(this.#serialize(event));
    if (!info) {
      return;
    }
    const {
      callback,
      options: { bubbles = false, args = [], checker },
    } = info;

    if (checker && !checker(self, event)) {
      return;
    }
    callback.bind(self, ...args, event)();

    // For example, ctrl+s in a FreeText must be handled by the viewer, hence
    // the event must bubble.
    if (!bubbles) {
      event.stopPropagation();
      event.preventDefault();
    }
  }
}

export class ColorManager {
  static _colorsMapping = new Map([
    ["CanvasText", [0, 0, 0] as rgb_t],
    ["Canvas", [255, 255, 255] as rgb_t],
  ]);

  get _colors(): Map<string, rgb_t> {
    /*#static*/ if (LIB) {
      if (typeof document === "undefined") {
        return shadow(this, "_colors", ColorManager._colorsMapping);
      }
    }

    const colors = new Map<string, undefined | rgb_t>([
      ["CanvasText", undefined],
      ["Canvas", undefined],
    ]);
    getColorValues(colors);
    return shadow(this, "_colors", colors as Map<string, rgb_t>);
  }

  /**
   * In High Contrast Mode, the color on the screen is not always the
   * real color used in the pdf.
   * For example in some cases white can appear to be black but when saving
   * we want to have white.
   */
  convert(color: string): rgb_t {
    const rgb = getRGB(color);
    if (!window.matchMedia("(forced-colors: active)").matches) {
      return rgb;
    }

    for (const [name, RGB_] of this._colors) {
      if (RGB_.every((x, i) => x === rgb[i])) {
        return ColorManager._colorsMapping.get(name)!;
      }
    }
    return rgb;
  }

  /**
   * An input element must have its color value as a hex string
   * and not as color name.
   * So this function converts a name into an hex string.
   */
  getHexCode(name: string): string {
    const rgb = this._colors.get(name);
    if (!rgb) {
      return name;
    }
    return Util.makeHexColor(...rgb);
  }
}

export interface DispatchUpdateStatesP {
  isEditing?: boolean;
  isEmpty?: boolean;
  hasSomethingToUndo?: boolean;
  hasSomethingToRedo?: boolean;
  hasSelectedEditor?: boolean;
  hasSelectedText?: boolean;
  hasEmptyClipboard?: boolean;
}

type DraggingEditor_ = {
  savedX: number;
  savedY: number;
  savedPageIndex: number;
  newX: number;
  newY: number;
  newPageIndex: number;
};

/**
 * A pdf has several pages and each of them when it will rendered
 * will have an AnnotationEditorLayer which will contain the some
 * new Annotations associated to an editor in order to modify them.
 *
 * This class is used to manage all the different layers, editors and
 * some action like copy/paste, undo/redo, ...
 */
export class AnnotationEditorUIManager {
  #abortController = new AbortController();
  #activeEditor: AnnotationEditor | undefined;
  /**
   * Get the current active editor.
   */
  getActive() {
    return this.#activeEditor;
  }

  #allEditors = new Map<string, AnnotationEditor>();

  #allLayers = new Map<number, AnnotationEditorLayer>();
  get currentLayer() {
    return this.#allLayers.get(this.#currentPageIndex);
  }
  getLayer(pageIndex: number) {
    return this.#allLayers.get(pageIndex);
  }

  #altTextManager;
  #annotationStorage;
  #changedExistingAnnotations: Map<string | undefined, string> | undefined;
  #commandManager = new CommandManager();

  #currentPageIndex = 0;
  get currentPageIndex() {
    return this.#currentPageIndex;
  }

  #deletedAnnotationsElementIds = new Set();
  #draggingEditors: Map<AnnotationEditor, DraggingEditor_> | undefined;
  #editorTypes!: (
    | typeof InkEditor
    | typeof FreeTextEditor
    | typeof StampEditor
    | typeof HighlightEditor
  )[];
  #editorsToRescale = new Set<InkEditor>();
  _eventBus;
  #filterFactory;
  #focusMainContainerTimeoutId: number | undefined;

  #idManager = new IdManager();
  /**
   * Get an id.
   */
  getId(): string {
    return this.#idManager.id;
  }

  #isEnabled = false;
  #isWaiting = false;
  #lastActiveElement:
    | [editor: AnnotationEditor, activeElement: Element | null]
    | undefined;

  #mode = AnnotationEditorType.NONE;
  /**
   * Get the current editor mode.
   */
  getMode() {
    return this.#mode;
  }

  #selectedEditors = new Set<AnnotationEditor>();
  get hasSelection() {
    return this.#selectedEditors.size !== 0;
  }
  #selectedTextNode: Node | null = null;

  #pageColors;
  #showAllStates:
    | Map<AnnotationEditorParamsType, string | number | undefined>
    | undefined;

  /* #highlightColors */
  #highlightColors;
  get highlightColors(): Map<string, Cssc> | undefined {
    return shadow(
      this,
      "highlightColors",
      this.#highlightColors
        ? new Map(
          this.#highlightColors
            .split(",")
            .map(
              (pair) => pair.split("=").map((x) => x.trim()),
            ) as [string, Cssc][],
        )
        : undefined,
    );
  }
  get highlightColorNames(): Map<Cssc, string> | undefined {
    return shadow(
      this,
      "highlightColorNames",
      this.highlightColors
        ? new Map(Array.from(
          this.highlightColors,
          (e) => e.reverse(),
        ) as [Cssc, string][])
        : undefined,
    );
  }
  /* ~ */

  #enableHighlightFloatingButton;
  #highlightWhenShiftUp = false;
  #highlightToolbar: HighlightToolbar | undefined;

  #mainHighlightColorPicker: ColorPicker | undefined;
  setMainHighlightColorPicker(colorPicker: ColorPicker) {
    this.#mainHighlightColorPicker = colorPicker;
  }

  /* #mlManager */
  #mlManager;
  async mlGuess(data: unknown) {
    return this.#mlManager?.guess(data) || undefined;
  }
  get hasMLManager() {
    return !!this.#mlManager;
  }
  /* ~ */

  #boundBlur = this.blur.bind(this);
  #boundFocus = this.focus.bind(this);
  #boundCopy = this.copy.bind(this);
  #boundCut = this.cut.bind(this);
  #boundPaste = this.paste.bind(this);
  #boundKeydown = this.keydown.bind(this);
  #boundKeyup = this.keyup.bind(this);
  #boundOnEditingAction = this.onEditingAction.bind(this);
  #boundOnPageChanging = this.onPageChanging.bind(this);
  #boundOnScaleChanging = this.onScaleChanging.bind(this);
  #boundOnRotationChanging = this.onRotationChanging.bind(this);

  #previousStates = {
    isEditing: false,
    isEmpty: true,
    hasSomethingToUndo: false,
    hasSomethingToRedo: false,
    hasSelectedEditor: false,
    hasSelectedText: false,
  };
  #translation = [0, 0];
  #translationTimeoutId: number | undefined;
  _signal;
  #container;
  #viewer;

  viewParameters = {
    realScale: PixelsPerInch.PDF_TO_CSS_UNITS,
    rotation: 0,
  };
  isShiftKeyDown = false;

  static TRANSLATE_SMALL = 1; // page units.
  static TRANSLATE_BIG = 10; // page units.
  static get _keyboardManager() {
    const proto = AnnotationEditorUIManager.prototype;

    /**
     * If the focused element is an input, we don't want to handle the arrow.
     * For example, sliders can be controlled with the arrow keys.
     */
    const arrowChecker = (self: AnnotationEditorUIManager) =>
      self.#container.contains(document.activeElement) &&
      document.activeElement!.tagName !== "BUTTON" &&
      self.hasSomethingToControl();

    const textInputChecker = (_self: any, { target: el }: KeyboardEvent) => {
      if (el instanceof HTMLInputElement) {
        const { type } = el;
        return type !== "text" && type !== "number";
      }
      return true;
    };

    const small = this.TRANSLATE_SMALL;
    const big = this.TRANSLATE_BIG;

    return shadow(
      this,
      "_keyboardManager",
      new KeyboardManager([
        [
          ["ctrl+a", "mac+meta+a"],
          proto.selectAll,
          { checker: textInputChecker },
        ],
        [["ctrl+z", "mac+meta+z"], proto.undo, { checker: textInputChecker }],
        [
          // On mac, depending of the OS version, the event.key is either "z" or
          // "Z" when the user presses "meta+shift+z".
          [
            "ctrl+y",
            "ctrl+shift+z",
            "mac+meta+shift+z",
            "ctrl+shift+Z",
            "mac+meta+shift+Z",
          ],
          proto.redo,
          { checker: textInputChecker },
        ],
        [
          [
            "Backspace",
            "alt+Backspace",
            "ctrl+Backspace",
            "shift+Backspace",
            "mac+Backspace",
            "mac+alt+Backspace",
            "mac+ctrl+Backspace",
            "Delete",
            "ctrl+Delete",
            "shift+Delete",
            "mac+Delete",
          ],
          proto.delete,
          { checker: textInputChecker },
        ],
        [
          ["Enter", "mac+Enter"],
          proto.addNewEditorFromKeyboard,
          {
            // Those shortcuts can be used in the toolbar for some other actions
            // like zooming, hence we need to check if the container has the
            // focus.
            checker: (self: AnnotationEditorUIManager, { target: el }) =>
              !(el instanceof HTMLButtonElement) &&
              self.#container.contains(el as Node) &&
              !self.isEnterHandled,
          },
        ],
        [
          [" ", "mac+ "],
          proto.addNewEditorFromKeyboard,
          {
            // Those shortcuts can be used in the toolbar for some other actions
            // like zooming, hence we need to check if the container has the
            // focus.
            checker: (self: AnnotationEditorUIManager, { target: el }) =>
              !(el instanceof HTMLButtonElement) &&
              self.#container.contains(document.activeElement),
          },
        ],
        [["Escape", "mac+Escape"], proto.unselectAll],
        [
          ["ArrowLeft", "mac+ArrowLeft"],
          proto.translateSelectedEditors,
          { args: [-small, 0], checker: arrowChecker },
        ],
        [
          ["ctrl+ArrowLeft", "mac+shift+ArrowLeft"],
          proto.translateSelectedEditors,
          { args: [-big, 0], checker: arrowChecker },
        ],
        [
          ["ArrowRight", "mac+ArrowRight"],
          proto.translateSelectedEditors,
          { args: [small, 0], checker: arrowChecker },
        ],
        [
          ["ctrl+ArrowRight", "mac+shift+ArrowRight"],
          proto.translateSelectedEditors,
          { args: [big, 0], checker: arrowChecker },
        ],
        [
          ["ArrowUp", "mac+ArrowUp"],
          proto.translateSelectedEditors,
          { args: [0, -small], checker: arrowChecker },
        ],
        [
          ["ctrl+ArrowUp", "mac+shift+ArrowUp"],
          proto.translateSelectedEditors,
          { args: [0, -big], checker: arrowChecker },
        ],
        [
          ["ArrowDown", "mac+ArrowDown"],
          proto.translateSelectedEditors,
          { args: [0, small], checker: arrowChecker },
        ],
        [
          ["ctrl+ArrowDown", "mac+shift+ArrowDown"],
          proto.translateSelectedEditors,
          { args: [0, big], checker: arrowChecker },
        ],
      ]),
    );
  }

  constructor(
    container: HTMLDivElement,
    viewer: HTMLDivElement,
    altTextManager: AltTextManager | undefined,
    eventBus: EventBus,
    pdfDocument: PDFDocumentProxy,
    pageColors?: PageColors,
    highlightColors?: string,
    enableHighlightFloatingButton?: boolean,
    mlManager?: MLManager_c | MLManager_g | MLManager_f,
  ) {
    this._signal = this.#abortController.signal;
    this.#container = container;
    this.#viewer = viewer;
    this.#altTextManager = altTextManager;
    this._eventBus = eventBus;
    this._eventBus._on("editingaction", this.#boundOnEditingAction);
    this._eventBus._on("pagechanging", this.#boundOnPageChanging);
    this._eventBus._on("scalechanging", this.#boundOnScaleChanging);
    this._eventBus._on("rotationchanging", this.#boundOnRotationChanging);
    this.#addSelectionListener();
    this.#addDragAndDropListeners();
    this.#addKeyboardManager();
    this.#annotationStorage = pdfDocument.annotationStorage;
    this.#filterFactory = pdfDocument.filterFactory;
    this.#pageColors = pageColors;
    this.#highlightColors = highlightColors;
    this.#enableHighlightFloatingButton = enableHighlightFloatingButton;
    this.#mlManager = mlManager;

    /*#static*/ if ("TESTING") {
      Object.defineProperty(this, "reset", {
        value: () => {
          this.selectAll();
          this.delete();
          this.#idManager.reset();
        },
      });
    }
  }

  destroy() {
    this.#abortController?.abort();
    this.#abortController = undefined as any;
    this._signal = undefined as any;

    this._eventBus._off("editingaction", this.#boundOnEditingAction);
    this._eventBus._off("pagechanging", this.#boundOnPageChanging);
    this._eventBus._off("scalechanging", this.#boundOnScaleChanging);
    this._eventBus._off("rotationchanging", this.#boundOnRotationChanging);
    for (const layer of this.#allLayers.values()) {
      layer.destroy();
    }
    this.#allLayers.clear();
    this.#allEditors.clear();
    this.#editorsToRescale.clear();
    this.#activeEditor = undefined;
    this.#selectedEditors.clear();
    this.#commandManager.destroy();
    this.#altTextManager?.destroy();
    this.#highlightToolbar?.hide();
    this.#highlightToolbar = undefined;
    if (this.#focusMainContainerTimeoutId) {
      clearTimeout(this.#focusMainContainerTimeoutId);
      this.#focusMainContainerTimeoutId = undefined;
    }
    if (this.#translationTimeoutId) {
      clearTimeout(this.#translationTimeoutId);
      this.#translationTimeoutId = undefined;
    }
  }

  get hcmFilter() {
    return shadow(
      this,
      "hcmFilter",
      this.#pageColors
        ? this.#filterFactory.addHCMFilter(
          this.#pageColors.foreground,
          this.#pageColors.background,
        )
        : "none",
    );
  }

  get direction() {
    return shadow(
      this,
      "direction",
      getComputedStyle(this.#container).direction,
    );
  }

  editAltText(editor: AnnotationEditor) {
    this.#altTextManager?.editAltText(this, editor);
  }

  onPageChanging({ pageNumber }: EventMap["pagechanging"]) {
    this.#currentPageIndex = pageNumber - 1;
  }

  focusMainContainer() {
    this.#container.focus();
  }

  findParent(x: number, y: number) {
    for (const layer of this.#allLayers.values()) {
      const {
        x: layerX,
        y: layerY,
        width,
        height,
      } = layer.div!.getBoundingClientRect();
      if (
        x >= layerX &&
        x <= layerX + width &&
        y >= layerY &&
        y <= layerY + height
      ) {
        return layer;
      }
    }
    return undefined;
  }

  disableUserSelect(value = false) {
    this.#viewer.classList.toggle("noUserSelect", value);
  }

  addShouldRescale(editor: InkEditor) {
    this.#editorsToRescale.add(editor);
  }

  removeShouldRescale(editor: InkEditor) {
    this.#editorsToRescale.delete(editor);
  }

  onScaleChanging({ scale }: EventMap["scalechanging"]) {
    this.commitOrRemove();
    this.viewParameters.realScale = scale * PixelsPerInch.PDF_TO_CSS_UNITS;
    for (const editor of this.#editorsToRescale) {
      editor.onScaleChanging();
    }
  }

  onRotationChanging({ pagesRotation }: EventMap["rotationchanging"]) {
    this.commitOrRemove();
    this.viewParameters.rotation = pagesRotation;
  }

  #getAnchorElementForSelection({ anchorNode }: Selection): HTMLElement {
    return anchorNode!.nodeType === Node.TEXT_NODE
      ? anchorNode!.parentElement!
      : anchorNode as HTMLElement;
  }

  highlightSelection(methodOfCreation = "") {
    const selection = document.getSelection();
    if (!selection || selection.isCollapsed) {
      return;
    }
    const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
    const text = selection.toString();
    const anchorElement = this.#getAnchorElementForSelection(selection);
    const textLayer = anchorElement.closest(".textLayer");
    const boxes = this.getSelectionBoxes(textLayer);
    if (!boxes) {
      return;
    }
    selection.empty();
    if (this.#mode === AnnotationEditorType.NONE) {
      this._eventBus.dispatch("showannotationeditorui", {
        source: this,
        mode: AnnotationEditorType.HIGHLIGHT,
      });
      this.showAllEditors(
        "highlight",
        true,
        /* updateButton = */ true,
      );
    }
    for (const layer of this.#allLayers.values()) {
      if (layer.hasTextLayer(textLayer)) {
        layer.createAndAddNewEditor({ x: 0, y: 0 } as PointerEvent, false, {
          methodOfCreation,
          boxes,
          anchorNode,
          anchorOffset,
          focusNode,
          focusOffset,
          text,
        });
        break;
      }
    }
  }

  #displayHighlightToolbar() {
    const selection = document.getSelection();
    if (!selection || selection.isCollapsed) {
      return;
    }
    const anchorElement = this.#getAnchorElementForSelection(selection);
    const textLayer = anchorElement.closest(".textLayer");
    const boxes = this.getSelectionBoxes(textLayer);
    if (!boxes) {
      return;
    }
    this.#highlightToolbar ||= new HighlightToolbar(this);
    this.#highlightToolbar.show(
      textLayer as Element,
      boxes,
      this.direction === "ltr",
    );
  }

  /**
   * Add an editor in the annotation storage.
   */
  addToAnnotationStorage(editor: AnnotationEditor) {
    if (
      !editor.isEmpty() &&
      this.#annotationStorage &&
      !this.#annotationStorage.has(editor.id)
    ) {
      this.#annotationStorage.setValue(editor.id, editor);
    }
  }

  #selectionChange() {
    const selection = document.getSelection();
    if (!selection || selection.isCollapsed) {
      if (this.#selectedTextNode) {
        this.#highlightToolbar?.hide();
        this.#selectedTextNode = null;
        this.#dispatchUpdateStates({
          hasSelectedText: false,
        });
      }
      return;
    }
    const { anchorNode } = selection;
    if (anchorNode === this.#selectedTextNode) {
      return;
    }

    const anchorElement = this.#getAnchorElementForSelection(selection);
    const textLayer = anchorElement.closest(".textLayer");
    if (!textLayer) {
      if (this.#selectedTextNode) {
        this.#highlightToolbar?.hide();
        this.#selectedTextNode = null;
        this.#dispatchUpdateStates({
          hasSelectedText: false,
        });
      }
      return;
    }
    this.#highlightToolbar?.hide();
    this.#selectedTextNode = anchorNode;
    this.#dispatchUpdateStates({
      hasSelectedText: true,
    });

    if (
      this.#mode !== AnnotationEditorType.HIGHLIGHT &&
      this.#mode !== AnnotationEditorType.NONE
    ) {
      return;
    }

    if (this.#mode === AnnotationEditorType.HIGHLIGHT) {
      this.showAllEditors(
        "highlight",
        true,
        /* updateButton = */ true,
      );
    }

    this.#highlightWhenShiftUp = this.isShiftKeyDown;
    if (!this.isShiftKeyDown) {
      const signal = this._signal;
      const pointerup = (e: PointerEvent) => {
        if (e.type === "pointerup" && e.button !== 0) {
          // Do nothing on right click.
          return;
        }
        window.off("pointerup", pointerup);
        window.off("blur", pointerup as any);
        if (e.type === "pointerup") {
          this.#onSelectEnd("main_toolbar");
        }
      };
      window.on("pointerup", pointerup, { signal });
      window.on("blur", pointerup as any, { signal });
    }
  }

  #onSelectEnd(methodOfCreation = "") {
    if (this.#mode === AnnotationEditorType.HIGHLIGHT) {
      this.highlightSelection(methodOfCreation);
    } else if (this.#enableHighlightFloatingButton) {
      this.#displayHighlightToolbar();
    }
  }

  #addSelectionListener() {
    document.on("selectionchange", this.#selectionChange.bind(this), {
      signal: this._signal,
    });
  }

  #addFocusManager() {
    const signal = this._signal;
    window.on("focus", this.#boundFocus, { signal });
    window.on("blur", this.#boundBlur, { signal });
  }

  #removeFocusManager() {
    window.off("focus", this.#boundFocus);
    window.off("blur", this.#boundBlur);
  }

  blur() {
    this.isShiftKeyDown = false;
    if (this.#highlightWhenShiftUp) {
      this.#highlightWhenShiftUp = false;
      this.#onSelectEnd("main_toolbar");
    }
    if (!this.hasSelection) {
      return;
    }
    // When several editors are selected and the window loses focus, we want to
    // keep the last active element in order to be able to focus it again when
    // the window gets the focus back but we don't want to trigger any focus
    // callbacks else only one editor will be selected.
    const { activeElement } = document;
    for (const editor of this.#selectedEditors) {
      if (editor.div!.contains(activeElement)) {
        this.#lastActiveElement = [editor, activeElement];
        editor._focusEventsAllowed = false;
        break;
      }
    }
  }

  focus() {
    if (!this.#lastActiveElement) {
      return;
    }
    const [lastEditor, lastActiveElement] = this.#lastActiveElement;
    this.#lastActiveElement = undefined;
    lastActiveElement!.on("focusin", () => {
      lastEditor._focusEventsAllowed = true;
    }, { once: true, signal: this._signal });
    (lastActiveElement as HSElement).focus();
  }

  #addKeyboardManager() {
    const signal = this._signal;
    // The keyboard events are caught at the container level in order to be able
    // to execute some callbacks even if the current page doesn't have focus.
    window.on("keydown", this.#boundKeydown, { signal });
    window.on("keyup", this.#boundKeyup, { signal });
  }

  #removeKeyboardManager() {
    window.off("keydown", this.#boundKeydown);
    window.off("keyup", this.#boundKeyup);
  }

  #addCopyPasteListeners() {
    const signal = this._signal;
    document.on("copy", this.#boundCopy, { signal });
    document.on("cut", this.#boundCut, { signal });
    document.on("paste", this.#boundPaste, { signal });
  }

  #removeCopyPasteListeners() {
    document.off("copy", this.#boundCopy);
    document.off("cut", this.#boundCut);
    document.off("paste", this.#boundPaste);
  }

  #addDragAndDropListeners() {
    const signal = this._signal;
    document.on("dragover", this.dragOver.bind(this), { signal });
    document.on("drop", this.drop.bind(this), { signal });
  }

  addEditListeners() {
    this.#addKeyboardManager();
    this.#addCopyPasteListeners();
  }

  removeEditListeners() {
    this.#removeKeyboardManager();
    this.#removeCopyPasteListeners();
  }

  dragOver(event: DragEvent) {
    for (const { type } of event.dataTransfer!.items) {
      for (const editorType of this.#editorTypes) {
        if (editorType.isHandlingMimeForPasting(type)) {
          event.dataTransfer!.dropEffect = "copy";
          event.preventDefault();
          return;
        }
      }
    }
  }

  /**
   * Drop callback.
   */
  drop(event: DragEvent) {
    for (const item of event.dataTransfer!.items) {
      for (const editorType of this.#editorTypes) {
        if (editorType.isHandlingMimeForPasting(item.type)) {
          editorType.paste(item, this.currentLayer!);
          event.preventDefault();
          return;
        }
      }
    }
  }

  /**
   * Copy callback.
   */
  copy(event: ClipboardEvent) {
    event.preventDefault();

    // An editor is being edited so just commit it.
    this.#activeEditor?.commitOrRemove();

    if (!this.hasSelection) {
      return;
    }

    const editors = [];
    for (const editor of this.#selectedEditors) {
      const serialized = editor.serialize(/* isForCopying = */ true);
      if (serialized) {
        editors.push(serialized);
      }
    }
    if (editors.length === 0) {
      return;
    }

    event.clipboardData!.setData("application/pdfjs", JSON.stringify(editors));
  }

  /**
   * Cut callback.
   */
  cut(event: ClipboardEvent) {
    this.copy(event);
    this.delete();
  }

  /**
   * Paste callback.
   */
  paste(event: ClipboardEvent) {
    event.preventDefault();
    const { clipboardData } = event;
    for (const item of clipboardData!.items) {
      for (const editorType of this.#editorTypes) {
        if (editorType.isHandlingMimeForPasting(item.type)) {
          editorType.paste(item, this.currentLayer!);
          return;
        }
      }
    }

    let data = clipboardData!.getData("application/pdfjs");
    if (!data) {
      return;
    }

    try {
      data = JSON.parse(data);
    } catch (ex: any) {
      warn(`paste: "${ex.message}".`);
      return;
    }

    if (!Array.isArray(data)) {
      return;
    }

    this.unselectAll();
    const layer = this.currentLayer;

    try {
      const newEditors: AnnotationEditor[] = [];
      for (const editor of data) {
        const deserializedEditor = layer!.deserialize(editor);
        if (!deserializedEditor) {
          return;
        }
        newEditors.push(deserializedEditor);
      }

      const cmd = () => {
        for (const editor of newEditors) {
          this.#addEditorToLayer(editor);
        }
        this.#selectEditors(newEditors);
      };
      const undo = () => {
        for (const editor of newEditors) {
          editor.remove();
        }
      };
      this.addCommands({ cmd, undo, mustExec: true });
    } catch (ex: any) {
      warn(`paste: "${ex.message}".`);
    }
  }

  /**
   * Keydown callback.
   */
  keydown(event: KeyboardEvent) {
    if (!this.isShiftKeyDown && event.key === "Shift") {
      this.isShiftKeyDown = true;
    }
    if (
      this.#mode !== AnnotationEditorType.NONE &&
      !this.isEditorHandlingKeyboard
    ) {
      AnnotationEditorUIManager._keyboardManager.exec(this, event);
    }
  }

  /**
   * Keyup callback.
   */
  keyup(event: KeyboardEvent) {
    if (this.isShiftKeyDown && event.key === "Shift") {
      this.isShiftKeyDown = false;
      if (this.#highlightWhenShiftUp) {
        this.#highlightWhenShiftUp = false;
        this.#onSelectEnd("main_toolbar");
      }
    }
  }

  /**
   * Execute an action for a given name.
   * For example, the user can click on the "Undo" entry in the context menu
   * and it'll trigger the undo action.
   */
  onEditingAction({ name }: { name: string }) {
    switch (name) {
      case "undo":
      case "redo":
      case "delete":
      case "selectAll":
        this[name]();
        break;
      case "highlightSelection":
        this.highlightSelection("context_menu");
        break;
    }
  }

  /**
   * Update the different possible states of this manager, e.g. is there
   * something to undo, redo, ...
   */
  #dispatchUpdateStates(details: DispatchUpdateStatesP) {
    const hasChanged = Object.entries(details).some(
      ([key, value]) => (this.#previousStates as any)[key] !== value,
    );

    if (hasChanged) {
      this._eventBus.dispatch("annotationeditorstateschanged", {
        source: this,
        details: Object.assign(this.#previousStates, details),
      });
      // We could listen on our own event but it sounds like a bit weird and
      // it's a way to simpler to handle that stuff here instead of having to
      // add something in every place where an editor can be unselected.
      if (
        this.#mode === AnnotationEditorType.HIGHLIGHT &&
        details.hasSelectedEditor === false
      ) {
        this.#dispatchUpdateUI([
          [AnnotationEditorParamsType.HIGHLIGHT_FREE, true],
        ]);
      }
    }
  }

  #dispatchUpdateUI(details: PropertyToUpdate[]) {
    this._eventBus.dispatch("annotationeditorparamschanged", {
      source: this,
      details,
    });
  }

  /**
   * Set the editing state.
   * It can be useful to temporarily disable it when the user is editing a
   * FreeText annotation.
   */
  setEditingState(isEditing: boolean) {
    if (isEditing) {
      this.#addFocusManager();
      this.#addCopyPasteListeners();
      this.#dispatchUpdateStates({
        isEditing: this.#mode !== AnnotationEditorType.NONE,
        isEmpty: this.#isEmpty(),
        hasSomethingToUndo: this.#commandManager.hasSomethingToUndo(),
        hasSomethingToRedo: this.#commandManager.hasSomethingToRedo(),
        hasSelectedEditor: false,
      });
    } else {
      this.#removeFocusManager();
      this.#removeCopyPasteListeners();
      this.#dispatchUpdateStates({
        isEditing: false,
      });
      this.disableUserSelect(false);
    }
  }

  registerEditorTypes(
    types: (
      | typeof InkEditor
      | typeof FreeTextEditor
      | typeof StampEditor
      | typeof HighlightEditor
    )[],
  ) {
    if (this.#editorTypes) {
      return;
    }
    this.#editorTypes = types;
    for (const editorType of this.#editorTypes) {
      this.#dispatchUpdateUI(editorType.defaultPropertiesToUpdate);
    }
  }

  /**
   * Add a new layer for a page which will contains the editors.
   */
  addLayer(layer: AnnotationEditorLayer) {
    this.#allLayers.set(layer.pageIndex, layer);
    if (this.#isEnabled) {
      layer.enable();
    } else {
      layer.disable();
    }
  }

  /**
   * Remove a layer.
   */
  removeLayer(layer: AnnotationEditorLayer) {
    this.#allLayers.delete(layer.pageIndex);
  }

  /**
   * Change the editor mode (None, FreeText, Ink, ...)
   * @param isFromKeyboard true if the mode change is due to a
   *   keyboard action.
   */
  updateMode(
    mode: number,
    editId: string | undefined = undefined,
    isFromKeyboard = false,
  ) {
    if (this.#mode === mode) {
      return;
    }
    this.#mode = mode;
    if (mode === AnnotationEditorType.NONE) {
      this.setEditingState(false);
      this.#disableAll();
      return;
    }
    this.setEditingState(true);
    this.#enableAll();
    this.unselectAll();
    for (const layer of this.#allLayers.values()) {
      layer.updateMode(mode);
    }
    if (!editId && isFromKeyboard) {
      this.addNewEditorFromKeyboard();
      return;
    }

    if (!editId) {
      return;
    }
    for (const editor of this.#allEditors.values()) {
      if (editor.annotationElementId === editId) {
        this.setSelected(editor);
        editor.enterInEditMode();
        break;
      }
    }
  }

  addNewEditorFromKeyboard() {
    if (this.currentLayer!.canCreateNewEmptyEditor()) {
      this.currentLayer!.addNewEditor();
    }
  }

  /**
   * Update the toolbar if it's required to reflect the tool currently used.
   */
  updateToolbar(mode: AnnotationEditorType) {
    if (mode === this.#mode) {
      return;
    }
    this._eventBus.dispatch("switchannotationeditormode", {
      source: this,
      mode,
    });
  }

  /**
   * Update a parameter in the current editor or globally.
   */
  updateParams(type: number, value: string | number | boolean | undefined) {
    if (!this.#editorTypes) {
      return;
    }

    switch (type) {
      case AnnotationEditorParamsType.CREATE:
        this.currentLayer!.addNewEditor();
        return;
      case AnnotationEditorParamsType.HIGHLIGHT_DEFAULT_COLOR:
        this.#mainHighlightColorPicker?.updateColor(value as Cssc);
        break;
      case AnnotationEditorParamsType.HIGHLIGHT_SHOW_ALL:
        this._eventBus.dispatch("reporttelemetry", {
          source: this,
          details: {
            type: "editing",
            data: {
              type: "highlight",
              action: "toggle_visibility",
            },
          },
        });
        (this.#showAllStates ||= new Map()).set(type, value);
        this.showAllEditors("highlight", value as boolean);
        break;
    }

    for (const editor of this.#selectedEditors) {
      editor.updateParams(type, value);
    }

    for (const editorType of this.#editorTypes) {
      editorType.updateDefaultParams(type, value);
    }
  }

  showAllEditors(
    type: AnnotationEditorName,
    visible: boolean,
    updateButton = false,
  ) {
    for (const editor of this.#allEditors.values()) {
      if (editor.editorType === type) {
        editor.show(visible);
      }
    }
    const state =
      this.#showAllStates?.get(AnnotationEditorParamsType.HIGHLIGHT_SHOW_ALL) ??
        true;
    if (state !== visible) {
      this.#dispatchUpdateUI([
        [AnnotationEditorParamsType.HIGHLIGHT_SHOW_ALL, visible],
      ]);
    }
  }

  enableWaiting(mustWait = false) {
    if (this.#isWaiting === mustWait) {
      return;
    }
    this.#isWaiting = mustWait;
    for (const layer of this.#allLayers.values()) {
      if (mustWait) {
        layer.disableClick();
      } else {
        layer.enableClick();
      }
      layer.div!.classList.toggle("waiting", mustWait);
    }
  }

  /**
   * Enable all the layers.
   */
  #enableAll() {
    if (!this.#isEnabled) {
      this.#isEnabled = true;
      for (const layer of this.#allLayers.values()) {
        layer.enable();
      }
      for (const editor of this.#allEditors.values()) {
        editor.enable();
      }
    }
  }

  /**
   * Disable all the layers.
   */
  #disableAll() {
    this.unselectAll();
    if (this.#isEnabled) {
      this.#isEnabled = false;
      for (const layer of this.#allLayers.values()) {
        layer.disable();
      }
      for (const editor of this.#allEditors.values()) {
        editor.disable();
      }
    }
  }

  /**
   * Get all the editors belonging to a given page.
   */
  getEditors(pageIndex: number): AnnotationEditor[] {
    const editors = [];
    for (const editor of this.#allEditors.values()) {
      if (editor.pageIndex === pageIndex) {
        editors.push(editor);
      }
    }
    return editors;
  }

  /**
   * Get an editor with the given id.
   */
  getEditor(id: string): AnnotationEditor | undefined {
    return this.#allEditors.get(id);
  }

  /**
   * Add a new editor.
   */
  addEditor(editor: AnnotationEditor) {
    this.#allEditors.set(editor.id, editor);
  }

  /**
   * Remove an editor.
   */
  removeEditor(editor: AnnotationEditor) {
    if (editor.div!.contains(document.activeElement)) {
      if (this.#focusMainContainerTimeoutId) {
        clearTimeout(this.#focusMainContainerTimeoutId);
      }
      this.#focusMainContainerTimeoutId = setTimeout(() => {
        // When the div is removed from DOM the focus can move on the
        // document.body, so we need to move it back to the main container.
        this.focusMainContainer();
        this.#focusMainContainerTimeoutId = undefined;
      }, 0);
    }
    this.#allEditors.delete(editor.id);
    this.unselect(editor);
    if (
      !editor.annotationElementId ||
      !this.#deletedAnnotationsElementIds.has(editor.annotationElementId)
    ) {
      this.#annotationStorage?.remove(editor.id);
    }
  }

  /**
   * The annotation element with the given id has been deleted.
   */
  addDeletedAnnotationElement(editor: AnnotationEditor) {
    this.#deletedAnnotationsElementIds.add(editor.annotationElementId);
    this.addChangedExistingAnnotation(editor);
    editor.deleted = true;
  }

  /**
   * Check if the annotation element with the given id has been deleted.
   */
  isDeletedAnnotationElement(annotationElementId: string): boolean {
    return this.#deletedAnnotationsElementIds.has(annotationElementId);
  }

  /**
   * The annotation element with the given id have been restored.
   */
  removeDeletedAnnotationElement(editor: AnnotationEditor) {
    this.#deletedAnnotationsElementIds.delete(editor.annotationElementId);
    this.removeChangedExistingAnnotation(editor);
    editor.deleted = false;
  }

  /**
   * Add an editor to the layer it belongs to or add it to the global map.
   */
  #addEditorToLayer(editor: AnnotationEditor) {
    const layer = this.#allLayers.get(editor.pageIndex);
    if (layer) {
      layer.addOrRebuild(editor);
    } else {
      this.addEditor(editor);
      this.addToAnnotationStorage(editor);
    }
  }

  /**
   * Set the given editor as the active one.
   */
  setActiveEditor(editor: AnnotationEditor | undefined) {
    if (this.#activeEditor === editor) {
      return;
    }

    this.#activeEditor = editor;
    if (editor) {
      this.#dispatchUpdateUI(editor.propertiesToUpdate);
    }
  }

  get #lastSelectedEditor(): AnnotationEditor | undefined {
    let ed;
    for (ed of this.#selectedEditors) {
      // Iterate to get the last element.
    }
    return ed;
  }

  /**
   * Update the UI of the active editor.
   */
  updateUI(editor: AnnotationEditor) {
    if (this.#lastSelectedEditor === editor) {
      this.#dispatchUpdateUI(editor.propertiesToUpdate);
    }
  }

  /**
   * Add or remove an editor the current selection.
   */
  toggleSelected(editor: AnnotationEditor) {
    if (this.#selectedEditors.has(editor)) {
      this.#selectedEditors.delete(editor);
      editor.unselect();
      this.#dispatchUpdateStates({
        hasSelectedEditor: this.hasSelection,
      });
      return;
    }
    this.#selectedEditors.add(editor);
    editor.select();
    this.#dispatchUpdateUI(editor.propertiesToUpdate);
    this.#dispatchUpdateStates({
      hasSelectedEditor: true,
    });
  }

  /**
   * Set the last selected editor.
   */
  setSelected(editor: AnnotationEditor) {
    for (const ed of this.#selectedEditors) {
      if (ed !== editor) {
        ed.unselect();
      }
    }
    this.#selectedEditors.clear();

    this.#selectedEditors.add(editor);
    editor.select();
    this.#dispatchUpdateUI(editor.propertiesToUpdate);
    this.#dispatchUpdateStates({
      hasSelectedEditor: true,
    });
  }

  /**
   * Check if the editor is selected.
   */
  isSelected(editor: AnnotationEditor) {
    return this.#selectedEditors.has(editor);
  }

  get firstSelectedEditor() {
    return this.#selectedEditors.values().next().value;
  }

  /**
   * Unselect an editor.
   */
  unselect(editor: AnnotationEditor) {
    editor.unselect();
    this.#selectedEditors.delete(editor);
    this.#dispatchUpdateStates({
      hasSelectedEditor: this.hasSelection,
    });
  }

  get isEnterHandled() {
    return (
      this.#selectedEditors.size === 1 &&
      this.firstSelectedEditor.isEnterHandled
    );
  }

  /**
   * Undo the last command.
   */
  undo() {
    this.#commandManager.undo();
    this.#dispatchUpdateStates({
      hasSomethingToUndo: this.#commandManager.hasSomethingToUndo(),
      hasSomethingToRedo: true,
      isEmpty: this.#isEmpty(),
    });
  }

  /**
   * Redo the last undoed command.
   */
  redo() {
    this.#commandManager.redo();
    this.#dispatchUpdateStates({
      hasSomethingToUndo: true,
      hasSomethingToRedo: this.#commandManager.hasSomethingToRedo(),
      isEmpty: this.#isEmpty(),
    });
  }

  /**
   * Add a command to execute (cmd) and another one to undo it.
   */
  addCommands(params: AddCommandsP) {
    this.#commandManager.add(params);
    this.#dispatchUpdateStates({
      hasSomethingToUndo: true,
      hasSomethingToRedo: false,
      isEmpty: this.#isEmpty(),
    });
  }

  #isEmpty() {
    if (this.#allEditors.size === 0) {
      return true;
    }

    if (this.#allEditors.size === 1) {
      for (const editor of this.#allEditors.values()) {
        return editor.isEmpty();
      }
    }

    return false;
  }

  /**
   * Delete the current editor or all.
   */
  delete() {
    this.commitOrRemove();
    if (!this.hasSelection) {
      return;
    }

    const editors = [...this.#selectedEditors];
    const cmd = () => {
      for (const editor of editors) {
        editor.remove();
      }
    };
    const undo = () => {
      for (const editor of editors) {
        this.#addEditorToLayer(editor);
      }
    };

    this.addCommands({ cmd, undo, mustExec: true });
  }

  commitOrRemove() {
    // An editor is being edited so just commit it.
    this.#activeEditor?.commitOrRemove();
  }

  hasSomethingToControl(): boolean {
    return !!this.#activeEditor || this.hasSelection;
  }

  /**
   * Select the editors.
   */
  #selectEditors(
    editors: IterableIterator<AnnotationEditor> | AnnotationEditor[],
  ) {
    for (const editor of this.#selectedEditors) {
      editor.unselect();
    }
    this.#selectedEditors.clear();
    for (const editor of editors) {
      if (editor.isEmpty()) {
        continue;
      }
      this.#selectedEditors.add(editor);
      editor.select();
    }
    this.#dispatchUpdateStates({ hasSelectedEditor: this.hasSelection });
  }

  /**
   * Select all the editors.
   */
  selectAll() {
    for (const editor of this.#selectedEditors) {
      editor.commit();
    }
    this.#selectEditors(this.#allEditors.values());
  }

  /**
   * Unselect all the selected editors.
   */
  unselectAll() {
    if (this.#activeEditor) {
      // An editor is being edited so just commit it.
      this.#activeEditor.commitOrRemove();
      if (this.#mode !== AnnotationEditorType.NONE) {
        // If the mode is NONE, we want to really unselect the editor, hence we
        // mustn't return here.
        return;
      }
    }

    if (!this.hasSelection) {
      return;
    }
    for (const editor of this.#selectedEditors) {
      editor.unselect();
    }
    this.#selectedEditors.clear();
    this.#dispatchUpdateStates({
      hasSelectedEditor: false,
    });
  }

  translateSelectedEditors(x?: number, y?: number, noCommit = false) {
    if (!noCommit) {
      this.commitOrRemove();
    }
    if (!this.hasSelection) {
      return;
    }

    this.#translation[0] += x!;
    this.#translation[1] += y!;
    const [totalX, totalY] = this.#translation;
    const editors = [...this.#selectedEditors];

    // We don't want to have an undo/redo for each translation so we wait a bit
    // before adding the command to the command manager.
    const TIME_TO_WAIT = 1000;

    if (this.#translationTimeoutId) {
      clearTimeout(this.#translationTimeoutId);
    }

    this.#translationTimeoutId = setTimeout(() => {
      this.#translationTimeoutId = undefined;
      this.#translation[0] = this.#translation[1] = 0;

      this.addCommands({
        cmd: () => {
          for (const editor of editors) {
            if (this.#allEditors.has(editor.id)) {
              editor.translateInPage(totalX, totalY);
            }
          }
        },
        undo: () => {
          for (const editor of editors) {
            if (this.#allEditors.has(editor.id)) {
              editor.translateInPage(-totalX, -totalY);
            }
          }
        },
        mustExec: false,
      });
    }, TIME_TO_WAIT);

    for (const editor of editors) {
      editor.translateInPage(x!, y!);
    }
  }

  /**
   * Set up the drag session for moving the selected editors.
   */
  setUpDragSession() {
    // Note: don't use any references to the editor's parent which can be undefined
    // if the editor belongs to a destroyed page.
    if (!this.hasSelection) {
      return;
    }
    // Avoid to have spurious text selection in the text layer when dragging.
    this.disableUserSelect(true);
    this.#draggingEditors = new Map();
    for (const editor of this.#selectedEditors) {
      this.#draggingEditors.set(editor, {
        savedX: editor.x,
        savedY: editor.y,
        savedPageIndex: editor.pageIndex,
        newX: 0,
        newY: 0,
        newPageIndex: -1,
      });
    }
  }

  /**
   * Ends the drag session.
   * @return true if at least one editor has been moved.
   */
  endDragSession(): boolean {
    if (!this.#draggingEditors) {
      return false;
    }
    this.disableUserSelect(false);
    const map = this.#draggingEditors;
    this.#draggingEditors = undefined;
    let mustBeAddedInUndoStack = false;

    for (const [{ x, y, pageIndex }, value] of map) {
      value.newX = x;
      value.newY = y;
      value.newPageIndex = pageIndex;
      mustBeAddedInUndoStack ||= x !== value.savedX ||
        y !== value.savedY ||
        pageIndex !== value.savedPageIndex;
    }

    if (!mustBeAddedInUndoStack) {
      return false;
    }

    const move = (
      editor: AnnotationEditor,
      x: number,
      y: number,
      pageIndex: number,
    ) => {
      if (this.#allEditors.has(editor.id)) {
        // The editor can be undone/redone on a page which is not visible (and
        // which potentially has no annotation editor layer), hence we need to
        // use the pageIndex instead of the parent.
        const parent = this.#allLayers.get(pageIndex);
        if (parent) {
          editor._setParentAndPosition(parent, x, y);
        } else {
          editor.pageIndex = pageIndex;
          editor.x = x;
          editor.y = y;
        }
      }
    };

    this.addCommands({
      cmd: () => {
        for (const [editor, { newX, newY, newPageIndex }] of map) {
          move(editor, newX, newY, newPageIndex);
        }
      },
      undo: () => {
        for (const [editor, { savedX, savedY, savedPageIndex }] of map) {
          move(editor, savedX, savedY, savedPageIndex);
        }
      },
      mustExec: true,
    });

    return true;
  }

  /**
   * Drag the set of selected editors.
   */
  dragSelectedEditors(tx: number, ty: number) {
    if (!this.#draggingEditors) {
      return;
    }
    for (const editor of this.#draggingEditors.keys()) {
      editor.drag(tx, ty);
    }
  }

  /**
   * Rebuild the editor (usually on undo/redo actions) on a potentially
   * non-rendered page.
   */
  rebuild(editor: AnnotationEditor) {
    if (editor.parent === undefined) {
      const parent = this.getLayer(editor.pageIndex);
      if (parent) {
        parent.changeParent(editor);
        parent.addOrRebuild(editor);
      } else {
        this.addEditor(editor);
        this.addToAnnotationStorage(editor);
        editor.rebuild();
      }
    } else {
      editor.parent.addOrRebuild(editor);
    }
  }

  get isEditorHandlingKeyboard() {
    return (
      this.getActive()?.shouldGetKeyboardEvents() ||
      (this.#selectedEditors.size === 1 &&
        this.firstSelectedEditor.shouldGetKeyboardEvents())
    );
  }

  /**
   * Is the current editor the one passed as argument?
   */
  isActive(editor: AnnotationEditor) {
    return this.#activeEditor === editor;
  }

  get imageManager() {
    return shadow(this, "imageManager", new ImageManager());
  }

  getSelectionBoxes(textLayer: Element | null): Box[] | undefined {
    if (!textLayer) {
      return undefined;
    }
    const selection = document.getSelection()!;
    for (let i = 0, ii = selection.rangeCount; i < ii; i++) {
      if (
        !textLayer.contains(selection.getRangeAt(i).commonAncestorContainer)
      ) {
        return undefined;
      }
    }

    const {
      x: layerX,
      y: layerY,
      width: parentWidth,
      height: parentHeight,
    } = textLayer.getBoundingClientRect();

    // We must rotate the boxes because we want to have them in the non-rotated
    // page coordinates.
    let rotator: (x: number, y: number, w: number, h: number) => Box;
    switch (textLayer.getAttribute("data-main-rotation")) {
      case "90":
        rotator = (x, y, w, h) => ({
          x: (y - layerY) / parentHeight,
          y: 1 - (x + w - layerX) / parentWidth,
          width: h / parentHeight,
          height: w / parentWidth,
        });
        break;
      case "180":
        rotator = (x, y, w, h) => ({
          x: 1 - (x + w - layerX) / parentWidth,
          y: 1 - (y + h - layerY) / parentHeight,
          width: w / parentWidth,
          height: h / parentHeight,
        });
        break;
      case "270":
        rotator = (x, y, w, h) => ({
          x: 1 - (y + h - layerY) / parentHeight,
          y: (x - layerX) / parentWidth,
          width: h / parentHeight,
          height: w / parentWidth,
        });
        break;
      default:
        rotator = (x, y, w, h) => ({
          x: (x - layerX) / parentWidth,
          y: (y - layerY) / parentHeight,
          width: w / parentWidth,
          height: h / parentHeight,
        });
        break;
    }

    const boxes: Box[] = [];
    for (let i = 0, ii = selection.rangeCount; i < ii; i++) {
      const range = selection.getRangeAt(i);
      if (range.collapsed) {
        continue;
      }
      for (const { x, y, width, height } of range.getClientRects()) {
        if (width === 0 || height === 0) {
          continue;
        }
        boxes.push(rotator(x, y, width, height));
      }
    }
    return boxes.length === 0 ? undefined : boxes;
  }

  addChangedExistingAnnotation({ annotationElementId, id }: AnnotationEditor) {
    (this.#changedExistingAnnotations ||= new Map()).set(
      annotationElementId,
      id,
    );
  }

  removeChangedExistingAnnotation({ annotationElementId }: AnnotationEditor) {
    this.#changedExistingAnnotations?.delete(annotationElementId);
  }

  renderAnnotationElement(annotation: AnnotationElement) {
    const editorId = this.#changedExistingAnnotations?.get(annotation.data.id);
    if (!editorId) {
      return;
    }
    const editor = this.#annotationStorage.getRawValue(editorId);
    if (!editor) {
      return;
    }
    if (
      this.#mode === AnnotationEditorType.NONE &&
      !(editor as AnnotationEditor).hasBeenModified
    ) {
      return;
    }
    (editor as AnnotationEditor).renderAnnotationElement(annotation);
  }
}
/*80--------------------------------------------------------------------------*/
