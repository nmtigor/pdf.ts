/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
var _a;
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
/** @typedef {import("./annotation_editor_layer.js").AnnotationEditorLayer} AnnotationEditorLayer */
import { LIB } from "../../../../global.js";
import { warn } from "../../../../lib/util/trace.js";
import { AnnotationEditorParamsType, AnnotationEditorPrefix, AnnotationEditorType, FeatureTest, getUuid, shadow, Util, } from "../../shared/util.js";
import { getColorValues, getRGB, PixelsPerInch } from "../display_utils.js";
/*80--------------------------------------------------------------------------*/
export function bindEvents(obj, element, names) {
    for (const name of names) {
        element.on(name, obj[name].bind(obj));
    }
}
/**
 * Convert a number between 0 and 100 into an hex number between 0 and 255.
 */
export function opacityToHex(opacity) {
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
    getId() {
        return `${AnnotationEditorPrefix}${this.#id++}`;
    }
}
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
    #cache;
    static get _isSVGFittingCanvas() {
        // By default, Firefox doesn't rescale without preserving the aspect ratio
        // when drawing an SVG image on a canvas, see https://bugzilla.mozilla.org/1547776.
        // The "workaround" is to append "svgView(preserveAspectRatio(none))" to the
        // url, but according to comment #15, it seems that it leads to unexpected
        // behavior in Safari.
        const svg = `data:image/svg+xml;charset=UTF-8,<svg viewBox="0 0 1 1" width="1" height="1" xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1" style="fill:red;"/></svg>`;
        const canvas = new OffscreenCanvas(1, 3);
        const ctx = canvas.getContext("2d");
        const image = new Image();
        image.src = svg;
        const promise = image.decode().then(() => {
            ctx.drawImage(image, 0, 0, 1, 1, 0, 0, 1, 3);
            return new Uint32Array(ctx.getImageData(0, 0, 1, 1).data.buffer)[0] === 0;
        });
        return shadow(this, "_isSVGFittingCanvas", promise);
    }
    async #get(key, rawData) {
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
            };
            let image;
            if (typeof rawData === "string") {
                data.url = rawData;
                const response = await fetch(rawData);
                if (!response.ok) {
                    throw new Error(response.statusText);
                }
                image = await response.blob();
            }
            else {
                image = data.file = rawData;
            }
            if (image.type === "image/svg+xml") {
                // Unfortunately, createImageBitmap doesn't work with SVG images.
                // (see https://bugzilla.mozilla.org/1841972).
                const mustRemoveAspectRatioPromise = _a._isSVGFittingCanvas;
                const fileReader = new FileReader();
                const imageElement = new Image();
                const imagePromise = new Promise((resolve, reject) => {
                    imageElement.onload = () => {
                        data.bitmap = imageElement;
                        data.isSvg = true;
                        resolve();
                    };
                    fileReader.onload = async () => {
                        const url = (data.svgUrl = fileReader.result);
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
            }
            else {
                data.bitmap = await createImageBitmap(image);
            }
            data.refCounter = 1;
        }
        catch (e) {
            console.error(e);
            data = undefined;
        }
        this.#cache.set(key, data);
        if (data) {
            this.#cache.set(data.id, data);
        }
        return data;
    }
    async getFromFile(file) {
        const { lastModified, name, size, type } = file;
        return this.#get(`${lastModified}_${name}_${size}_${type}`, file);
    }
    async getFromUrl(url) {
        return this.#get(url, url);
    }
    async getFromId(id) {
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
    getSvgUrl(id) {
        const data = this.#cache.get(id);
        if (!data?.isSvg) {
            return undefined;
        }
        return data.svgUrl;
    }
    deleteId(id) {
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
    isValidId(id) {
        return id.startsWith(`image_${this.#baseId}_`);
    }
}
_a = ImageManager;
/**
 * Class to handle undo/redo.
 * Commands are just saved in a buffer.
 * If we hit some memory issues we could likely use a circular buffer.
 * It has to be used as a singleton.
 */
export class CommandManager {
    #commands = [];
    #locked = false;
    #maxSize;
    #position = -1;
    constructor(maxSize = 128) {
        this.#maxSize = maxSize;
    }
    /**
     * Add a new couple of commands to be used in case of redo/undo.
     */
    add({ cmd, undo, mustExec, type = NaN, overwriteIfSameType = false, keepUndo = false, }) {
        if (mustExec) {
            cmd();
        }
        if (this.#locked) {
            return;
        }
        const save = { cmd, undo, type };
        if (this.#position === -1) {
            if (this.#commands.length > 0) {
                // All the commands have been undone and then a new one is added
                // hence we clear the queue.
                this.#commands.length = 0;
            }
            this.#position = 0;
            this.#commands.push(save);
            return;
        }
        if (overwriteIfSameType && this.#commands[this.#position].type === type) {
            // For example when we change a color we don't want to
            // be able to undo all the steps, hence we only want to
            // keep the last undoable action in this sequence of actions.
            if (keepUndo) {
                save.undo = this.#commands[this.#position].undo;
            }
            this.#commands[this.#position] = save;
            return;
        }
        const next = this.#position + 1;
        if (next === this.#maxSize) {
            this.#commands.splice(0, 1);
        }
        else {
            this.#position = next;
            if (next < this.#commands.length) {
                this.#commands.splice(next);
            }
        }
        this.#commands.push(save);
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
        this.#commands[this.#position].undo();
        this.#locked = false;
        this.#position -= 1;
    }
    /**
     * Redo the last command.
     */
    redo() {
        if (this.#position < this.#commands.length - 1) {
            this.#position += 1;
            // Avoid to insert something during the redo execution.
            this.#locked = true;
            this.#commands[this.#position].cmd();
            this.#locked = false;
        }
    }
    /**
     * Check if there is something to undo.
     */
    hasSomethingToUndo() {
        return this.#position !== -1;
    }
    /**
     * Check if there is something to redo.
     */
    hasSomethingToRedo() {
        return this.#position < this.#commands.length - 1;
    }
    destroy() {
        this.#commands = undefined;
    }
}
/**
 * Class to handle the different keyboards shortcuts we can have on mac or
 * non-mac OSes.
 */
export class KeyboardManager {
    buffer = [];
    callbacks = new Map();
    allKeys = new Set();
    /**
     * Create a new keyboard manager class.
     * @param callbacks an array containing an array of shortcuts
     * and a callback to call.
     * A shortcut is a string like `ctrl+c` or `mac+ctrl+c` for mac OS.
     */
    constructor(callbacks) {
        const { isMac } = FeatureTest.platform;
        for (const [keys, callback, options = {}] of callbacks) {
            for (const key of keys) {
                const isMacKey = key.startsWith("mac+");
                if (isMac && isMacKey) {
                    this.callbacks.set(key.slice(4), { callback, options });
                    this.allKeys.add(key.split("+").at(-1));
                }
                else if (!isMac && !isMacKey) {
                    this.callbacks.set(key, { callback, options });
                    this.allKeys.add(key.split("+").at(-1));
                }
            }
        }
    }
    /**
     * Serialize an event into a string in order to match a
     * potential key for a callback.
     */
    #serialize(event) {
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
    exec(self, event) {
        if (!this.allKeys.has(event.key)) {
            return;
        }
        const info = this.callbacks.get(this.#serialize(event));
        if (!info) {
            return;
        }
        const { callback, options: { bubbles = false, args = [], checker }, } = info;
        if (checker && !checker(self, event)) {
            return;
        }
        callback.bind(self, ...args)();
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
        ["CanvasText", [0, 0, 0]],
        ["Canvas", [255, 255, 255]],
    ]);
    get _colors() {
        /*#static*/ 
        const colors = new Map([
            ["CanvasText", undefined],
            ["Canvas", undefined],
        ]);
        getColorValues(colors);
        return shadow(this, "_colors", colors);
    }
    /**
     * In High Contrast Mode, the color on the screen is not always the
     * real color used in the pdf.
     * For example in some cases white can appear to be black but when saving
     * we want to have white.
     */
    convert(color) {
        const rgb = getRGB(color);
        if (!window.matchMedia("(forced-colors: active)").matches) {
            return rgb;
        }
        for (const [name, RGB_] of this._colors) {
            if (RGB_.every((x, i) => x === rgb[i])) {
                return ColorManager._colorsMapping.get(name);
            }
        }
        return rgb;
    }
    /**
     * An input element must have its color value as a hex string
     * and not as color name.
     * So this function converts a name into an hex string.
     */
    getHexCode(name) {
        const rgb = this._colors.get(name);
        if (!rgb) {
            return name;
        }
        return Util.makeHexColor(...rgb);
    }
}
/**
 * A pdf has several pages and each of them when it will rendered
 * will have an AnnotationEditorLayer which will contain the some
 * new Annotations associated to an editor in order to modify them.
 *
 * This class is used to manage all the different layers, editors and
 * some action like copy/paste, undo/redo, ...
 */
export class AnnotationEditorUIManager {
    #activeEditor;
    /**
     * Get the current active editor.
     */
    getActive() {
        return this.#activeEditor;
    }
    #allEditors = new Map();
    #allLayers = new Map();
    #annotationStorage;
    #commandManager = new CommandManager();
    #currentPageIndex = 0;
    get currentPageIndex() {
        return this.#currentPageIndex;
    }
    #deletedAnnotationsElementIds = new Set();
    #draggingEditors;
    #editorTypes;
    #editorsToRescale = new Set();
    #eventBus;
    #filterFactory;
    #idManager = new IdManager();
    /**
     * Get an id.
     */
    getId() {
        return this.#idManager.getId();
    }
    #isEnabled = false;
    #isWaiting = false;
    #lastActiveElement;
    #mode = AnnotationEditorType.NONE;
    /**
     * Get the current editor mode.
     */
    getMode() {
        return this.#mode;
    }
    #selectedEditors = new Set();
    get hasSelection() {
        return this.#selectedEditors.size !== 0;
    }
    #pageColors;
    #boundBlur = this.blur.bind(this);
    #boundFocus = this.focus.bind(this);
    #boundCopy = this.copy.bind(this);
    #boundCut = this.cut.bind(this);
    #boundPaste = this.paste.bind(this);
    #boundKeydown = this.keydown.bind(this);
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
    };
    #translation = [0, 0];
    #translationTimeoutId;
    #container;
    #viewer;
    viewParameters = {
        realScale: PixelsPerInch.PDF_TO_CSS_UNITS,
        rotation: 0,
    };
    static TRANSLATE_SMALL = 1; // page units.
    static TRANSLATE_BIG = 10; // page units.
    static get _keyboardManager() {
        const proto = AnnotationEditorUIManager.prototype;
        const arrowChecker = (self) => {
            // If the focused element is an input, we don't want to handle the arrow.
            // For example, sliders can be controlled with the arrow keys.
            const { activeElement } = document;
            return ((activeElement ?? undefined) &&
                self.#container.contains(activeElement) &&
                self.hasSomethingToControl());
        };
        const small = this.TRANSLATE_SMALL;
        const big = this.TRANSLATE_BIG;
        return shadow(this, "_keyboardManager", new KeyboardManager([
            [["ctrl+a", "mac+meta+a"], proto.selectAll],
            [["ctrl+z", "mac+meta+z"], proto.undo],
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
        ]));
    }
    constructor(container, viewer, eventBus, pdfDocument, pageColors) {
        this.#container = container;
        this.#viewer = viewer;
        this.#eventBus = eventBus;
        this.#eventBus._on("editingaction", this.#boundOnEditingAction);
        this.#eventBus._on("pagechanging", this.#boundOnPageChanging);
        this.#eventBus._on("scalechanging", this.#boundOnScaleChanging);
        this.#eventBus._on("rotationchanging", this.#boundOnRotationChanging);
        this.#annotationStorage = pdfDocument.annotationStorage;
        this.#filterFactory = pdfDocument.filterFactory;
        this.#pageColors = pageColors;
    }
    destroy() {
        this.#removeKeyboardManager();
        this.#removeFocusManager();
        this.#eventBus._off("editingaction", this.#boundOnEditingAction);
        this.#eventBus._off("pagechanging", this.#boundOnPageChanging);
        this.#eventBus._off("scalechanging", this.#boundOnScaleChanging);
        this.#eventBus._off("rotationchanging", this.#boundOnRotationChanging);
        for (const layer of this.#allLayers.values()) {
            layer.destroy();
        }
        this.#allLayers.clear();
        this.#allEditors.clear();
        this.#editorsToRescale.clear();
        this.#activeEditor = undefined;
        this.#selectedEditors.clear();
        this.#commandManager.destroy();
    }
    get hcmFilter() {
        return shadow(this, "hcmFilter", this.#pageColors
            ? this.#filterFactory.addHCMFilter(this.#pageColors.foreground, this.#pageColors.background)
            : "none");
    }
    onPageChanging({ pageNumber }) {
        this.#currentPageIndex = pageNumber - 1;
    }
    focusMainContainer() {
        this.#container.focus();
    }
    findParent(x, y) {
        for (const layer of this.#allLayers.values()) {
            const { x: layerX, y: layerY, width, height, } = layer.div.getBoundingClientRect();
            if (x >= layerX &&
                x <= layerX + width &&
                y >= layerY &&
                y <= layerY + height) {
                return layer;
            }
        }
        return undefined;
    }
    disableUserSelect(value = false) {
        this.#viewer.classList.toggle("noUserSelect", value);
    }
    addShouldRescale(editor) {
        this.#editorsToRescale.add(editor);
    }
    removeShouldRescale(editor) {
        this.#editorsToRescale.delete(editor);
    }
    onScaleChanging({ scale }) {
        this.commitOrRemove();
        this.viewParameters.realScale = scale * PixelsPerInch.PDF_TO_CSS_UNITS;
        for (const editor of this.#editorsToRescale) {
            editor.onScaleChanging();
        }
    }
    onRotationChanging({ pagesRotation }) {
        this.commitOrRemove();
        this.viewParameters.rotation = pagesRotation;
    }
    /**
     * Add an editor in the annotation storage.
     */
    addToAnnotationStorage(editor) {
        if (!editor.isEmpty() &&
            this.#annotationStorage &&
            !this.#annotationStorage.has(editor.id)) {
            this.#annotationStorage.setValue(editor.id, editor);
        }
    }
    #addFocusManager() {
        window.on("focus", this.#boundFocus);
        window.on("blur", this.#boundBlur);
    }
    #removeFocusManager() {
        window.off("focus", this.#boundFocus);
        window.off("blur", this.#boundBlur);
    }
    blur() {
        if (!this.hasSelection) {
            return;
        }
        // When several editors are selected and the window loses focus, we want to
        // keep the last active element in order to be able to focus it again when
        // the window gets the focus back but we don't want to trigger any focus
        // callbacks else only one editor will be selected.
        const { activeElement } = document;
        for (const editor of this.#selectedEditors) {
            if (editor.div.contains(activeElement)) {
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
        lastActiveElement.on("focusin", () => {
            lastEditor._focusEventsAllowed = true;
        }, { once: true });
        lastActiveElement.focus();
    }
    #addKeyboardManager() {
        // The keyboard events are caught at the container level in order to be able
        // to execute some callbacks even if the current page doesn't have focus.
        window.on("keydown", this.#boundKeydown, { capture: true });
    }
    #removeKeyboardManager() {
        window.off("keydown", this.#boundKeydown, {
            capture: true,
        });
    }
    #addCopyPasteListeners() {
        document.on("copy", this.#boundCopy);
        document.on("cut", this.#boundCut);
        document.on("paste", this.#boundPaste);
    }
    #removeCopyPasteListeners() {
        document.off("copy", this.#boundCopy);
        document.off("cut", this.#boundCut);
        document.off("paste", this.#boundPaste);
    }
    /**
     * Copy callback.
     */
    copy(event) {
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
        event.clipboardData.setData("application/pdfjs", JSON.stringify(editors));
    }
    /**
     * Cut callback.
     */
    cut(event) {
        this.copy(event);
        this.delete();
    }
    /**
     * Paste callback.
     */
    paste(event) {
        event.preventDefault();
        const { clipboardData } = event;
        for (const item of clipboardData.items) {
            for (const editorType of this.#editorTypes) {
                if (editorType.isHandlingMimeForPasting(item.type)) {
                    editorType.paste(item, this.currentLayer);
                    return;
                }
            }
        }
        let data = clipboardData.getData("application/pdfjs");
        if (!data) {
            return;
        }
        try {
            data = JSON.parse(data);
        }
        catch (ex) {
            warn(`paste: "${ex.message}".`);
            return;
        }
        if (!Array.isArray(data)) {
            return;
        }
        this.unselectAll();
        const layer = this.currentLayer;
        try {
            const newEditors = [];
            for (const editor of data) {
                const deserializedEditor = layer.deserialize(editor);
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
        }
        catch (ex) {
            warn(`paste: "${ex.message}".`);
        }
    }
    /**
     * Keydown callback.
     */
    keydown(event) {
        if (!this.getActive()?.shouldGetKeyboardEvents()) {
            AnnotationEditorUIManager._keyboardManager.exec(this, event);
        }
    }
    /**
     * Execute an action for a given name.
     * For example, the user can click on the "Undo" entry in the context menu
     * and it'll trigger the undo action.
     */
    onEditingAction(details) {
        if (["undo", "redo", "cut", "copy", "paste", "delete", "selectAll"].includes(details.name)) {
            this[details.name]();
        }
    }
    /**
     * Update the different possible states of this manager, e.g. is the clipboard
     * empty or is there something to undo, ...
     */
    #dispatchUpdateStates(details) {
        const hasChanged = Object.entries(details).some(([key, value]) => this.#previousStates[key] !== value);
        if (hasChanged) {
            this.#eventBus.dispatch("annotationeditorstateschanged", {
                source: this,
                details: Object.assign(this.#previousStates, details),
            });
        }
    }
    #dispatchUpdateUI(details) {
        this.#eventBus.dispatch("annotationeditorparamschanged", {
            source: this,
            details,
        });
    }
    /**
     * Set the editing state.
     * It can be useful to temporarily disable it when the user is editing a
     * FreeText annotation.
     */
    setEditingState(isEditing) {
        if (isEditing) {
            this.#addFocusManager();
            this.#addKeyboardManager();
            this.#addCopyPasteListeners();
            this.#dispatchUpdateStates({
                isEditing: this.#mode !== AnnotationEditorType.NONE,
                isEmpty: this.#isEmpty(),
                hasSomethingToUndo: this.#commandManager.hasSomethingToUndo(),
                hasSomethingToRedo: this.#commandManager.hasSomethingToRedo(),
                hasSelectedEditor: false,
            });
        }
        else {
            this.#removeFocusManager();
            this.#removeKeyboardManager();
            this.#removeCopyPasteListeners();
            this.#dispatchUpdateStates({
                isEditing: false,
            });
            this.disableUserSelect(false);
        }
    }
    registerEditorTypes(types) {
        if (this.#editorTypes) {
            return;
        }
        this.#editorTypes = types;
        for (const editorType of this.#editorTypes) {
            this.#dispatchUpdateUI(editorType.defaultPropertiesToUpdate);
        }
    }
    get currentLayer() {
        return this.#allLayers.get(this.#currentPageIndex);
    }
    getLayer(pageIndex) {
        return this.#allLayers.get(pageIndex);
    }
    /**
     * Add a new layer for a page which will contains the editors.
     */
    addLayer(layer) {
        this.#allLayers.set(layer.pageIndex, layer);
        if (this.#isEnabled) {
            layer.enable();
        }
        else {
            layer.disable();
        }
    }
    /**
     * Remove a layer.
     */
    removeLayer(layer) {
        this.#allLayers.delete(layer.pageIndex);
    }
    /**
     * Change the editor mode (None, FreeText, Ink, ...)
     */
    updateMode(mode, editId = undefined) {
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
    /**
     * Update the toolbar if it's required to reflect the tool currently used.
     */
    updateToolbar(mode) {
        if (mode === this.#mode) {
            return;
        }
        this.#eventBus.dispatch("switchannotationeditormode", {
            source: this,
            mode,
        });
    }
    /**
     * Update a parameter in the current editor or globally.
     */
    updateParams(type, value) {
        if (!this.#editorTypes) {
            return;
        }
        if (type === AnnotationEditorParamsType.CREATE) {
            this.currentLayer.addNewEditor();
            return;
        }
        for (const editor of this.#selectedEditors) {
            editor.updateParams(type, value);
        }
        for (const editorType of this.#editorTypes) {
            editorType.updateDefaultParams(type, value);
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
            }
            else {
                layer.enableClick();
            }
            layer.div.classList.toggle("waiting", mustWait);
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
        }
    }
    /**
     * Get all the editors belonging to a given page.
     */
    getEditors(pageIndex) {
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
    getEditor(id) {
        return this.#allEditors.get(id);
    }
    /**
     * Add a new editor.
     */
    addEditor(editor) {
        this.#allEditors.set(editor.id, editor);
    }
    /**
     * Remove an editor.
     */
    removeEditor(editor) {
        this.#allEditors.delete(editor.id);
        this.unselect(editor);
        if (!editor.annotationElementId ||
            !this.#deletedAnnotationsElementIds.has(editor.annotationElementId)) {
            this.#annotationStorage?.remove(editor.id);
        }
    }
    /**
     * The annotation element with the given id has been deleted.
     */
    addDeletedAnnotationElement(editor) {
        this.#deletedAnnotationsElementIds.add(editor.annotationElementId);
        editor.deleted = true;
    }
    /**
     * Check if the annotation element with the given id has been deleted.
     */
    isDeletedAnnotationElement(annotationElementId) {
        return this.#deletedAnnotationsElementIds.has(annotationElementId);
    }
    /**
     * The annotation element with the given id have been restored.
     */
    removeDeletedAnnotationElement(editor) {
        this.#deletedAnnotationsElementIds.delete(editor.annotationElementId);
        editor.deleted = false;
    }
    /**
     * Add an editor to the layer it belongs to or add it to the global map.
     */
    #addEditorToLayer(editor) {
        const layer = this.#allLayers.get(editor.pageIndex);
        if (layer) {
            layer.addOrRebuild(editor);
        }
        else {
            this.addEditor(editor);
        }
    }
    /**
     * Set the given editor as the active one.
     */
    setActiveEditor(editor) {
        if (this.#activeEditor === editor) {
            return;
        }
        this.#activeEditor = editor;
        if (editor) {
            this.#dispatchUpdateUI(editor.propertiesToUpdate);
        }
    }
    /**
     * Add or remove an editor the current selection.
     */
    toggleSelected(editor) {
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
    setSelected(editor) {
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
    isSelected(editor) {
        return this.#selectedEditors.has(editor);
    }
    /**
     * Unselect an editor.
     */
    unselect(editor) {
        editor.unselect();
        this.#selectedEditors.delete(editor);
        this.#dispatchUpdateStates({
            hasSelectedEditor: this.hasSelection,
        });
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
    addCommands(params) {
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
    hasSomethingToControl() {
        return !!this.#activeEditor || this.hasSelection;
    }
    /**
     * Select the editors.
     */
    #selectEditors(editors) {
        this.#selectedEditors.clear();
        for (const editor of editors) {
            if (editor.isEmpty()) {
                continue;
            }
            this.#selectedEditors.add(editor);
            editor.select();
        }
        this.#dispatchUpdateStates({ hasSelectedEditor: true });
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
            return;
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
    translateSelectedEditors(x, y, noCommit = false) {
        if (!noCommit) {
            this.commitOrRemove();
        }
        if (!this.hasSelection) {
            return;
        }
        this.#translation[0] += x;
        this.#translation[1] += y;
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
            editor.translateInPage(x, y);
        }
    }
    /**
     * Set up the drag session for moving the selected editors.
     */
    setUpDragSession() {
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
                savedPageIndex: editor.parent.pageIndex,
                newX: 0,
                newY: 0,
                newPageIndex: -1,
            });
        }
    }
    /**
     * Ends the drag session.
     * @return {boolean} true if at least one editor has been moved.
     */
    endDragSession() {
        if (!this.#draggingEditors) {
            return false;
        }
        this.disableUserSelect(false);
        const map = this.#draggingEditors;
        this.#draggingEditors = undefined;
        let mustBeAddedInUndoStack = false;
        for (const [{ x, y, parent }, value] of map) {
            value.newX = x;
            value.newY = y;
            value.newPageIndex = parent.pageIndex;
            mustBeAddedInUndoStack ||= x !== value.savedX ||
                y !== value.savedY ||
                parent.pageIndex !== value.savedPageIndex;
        }
        if (!mustBeAddedInUndoStack) {
            return false;
        }
        const move = (editor, x, y, pageIndex) => {
            if (this.#allEditors.has(editor.id)) {
                // The editor can be undone/redone on a page which is not visible (and
                // which potentially has no annotation editor layer), hence we need to
                // use the pageIndex instead of the parent.
                const parent = this.#allLayers.get(pageIndex);
                if (parent) {
                    editor._setParentAndPosition(parent, x, y);
                }
                else {
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
    dragSelectedEditors(tx, ty) {
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
    rebuild(editor) {
        if (editor.parent === undefined) {
            const parent = this.getLayer(editor.pageIndex);
            if (parent) {
                parent.changeParent(editor);
                parent.addOrRebuild(editor);
            }
            else {
                this.addEditor(editor);
                this.addToAnnotationStorage(editor);
                editor.rebuild();
            }
        }
        else {
            editor.parent.addOrRebuild(editor);
        }
    }
    /**
     * Is the current editor the one passed as argument?
     */
    isActive(editor) {
        return this.#activeEditor === editor;
    }
    get imageManager() {
        return shadow(this, "imageManager", new ImageManager());
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=tools.js.map