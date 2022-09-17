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
/** @typedef {import("./annotation_editor_layer.js").AnnotationEditorLayer} AnnotationEditorLayer */
import { LIB } from "../../../../global.js";
import { AnnotationEditorPrefix, AnnotationEditorType, shadow, Util, } from "../../shared/util.js";
import { getColorValues, getRGB } from "../display_utils.js";
/*80--------------------------------------------------------------------------*/
export function bindEvents(obj, element, names) {
    for (const name of names) {
        element.addEventListener(name, obj[name].bind(obj));
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
        const isMac = KeyboardManager.platform.isMac;
        for (const [keys, callback] of callbacks) {
            for (const key of keys) {
                const isMacKey = key.startsWith("mac+");
                if (isMac && isMacKey) {
                    this.callbacks.set(key.slice(4), callback);
                    this.allKeys.add(key.split("+").at(-1));
                }
                else if (!isMac && !isMacKey) {
                    this.callbacks.set(key, callback);
                    this.allKeys.add(key.split("+").at(-1));
                }
            }
        }
    }
    static get platform() {
        const platform = typeof navigator !== "undefined" && navigator.platform
            ? navigator.platform
            : "";
        return shadow(this, "platform", {
            isWin: platform.includes("Win"),
            isMac: platform.includes("Mac"),
        });
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
     * @returns
     */
    exec(self, event) {
        if (!this.allKeys.has(event.key)) {
            return;
        }
        const callback = this.callbacks.get(this.#serialize(event));
        if (!callback) {
            return;
        }
        callback.bind(self)();
        event.stopPropagation();
        event.preventDefault();
    }
}
/**
 * Basic clipboard to copy/paste some editors.
 * It has to be used as a singleton.
 */
class ClipboardManager {
    #elements;
    /**
     * Copy an element.
     */
    copy(element) {
        if (!element) {
            return;
        }
        if (Array.isArray(element)) {
            this.#elements = element.map((el) => el.serialize());
        }
        else {
            this.#elements = [element.serialize()];
        }
        this.#elements = this.#elements.filter((el) => !!el);
        if (this.#elements.length === 0) {
            this.#elements = undefined;
        }
    }
    /**
     * Create a new element.
     */
    paste() {
        return this.#elements;
    }
    /**
     * Check if the clipboard is empty.
     */
    isEmpty() {
        return this.#elements === undefined;
    }
    destroy() {
        this.#elements = undefined;
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
    static _keyboardManager = new KeyboardManager([
        [["ctrl+a", "mac+meta+a"], AnnotationEditorUIManager.prototype.selectAll],
        [["ctrl+c", "mac+meta+c"], AnnotationEditorUIManager.prototype.copy],
        [["ctrl+v", "mac+meta+v"], AnnotationEditorUIManager.prototype.paste],
        [["ctrl+x", "mac+meta+x"], AnnotationEditorUIManager.prototype.cut],
        [["ctrl+z", "mac+meta+z"], AnnotationEditorUIManager.prototype.undo],
        [
            ["ctrl+y", "ctrl+shift+Z", "mac+meta+shift+Z"],
            AnnotationEditorUIManager.prototype.redo,
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
            ],
            AnnotationEditorUIManager.prototype.delete,
        ],
        [["Escape", "mac+Escape"], AnnotationEditorUIManager.prototype.unselectAll],
    ]);
    #activeEditor;
    /**
     * Get the current active editor.
     */
    getActive() {
        return this.#activeEditor;
    }
    #allEditors = new Map();
    #allLayers = new Map();
    #clipboardManager = new ClipboardManager();
    #commandManager = new CommandManager();
    #currentPageIndex = 0;
    #editorTypes;
    #eventBus;
    #idManager = new IdManager();
    #isEnabled = false;
    #mode = AnnotationEditorType.NONE;
    /**
     * Get the current editor mode.
     */
    getMode() {
        return this.#mode;
    }
    #selectedEditors = new Set();
    #boundKeydown = this.keydown.bind(this);
    #boundOnEditingAction = this.onEditingAction.bind(this);
    #boundOnPageChanging = this.onPageChanging.bind(this);
    #boundOnTextLayerRendered = this.onTextLayerRendered.bind(this);
    #previousStates = {
        isEditing: false,
        isEmpty: true,
        hasEmptyClipboard: true,
        hasSomethingToUndo: false,
        hasSomethingToRedo: false,
        hasSelectedEditor: false,
    };
    #container;
    constructor(container, eventBus) {
        this.#container = container;
        this.#eventBus = eventBus;
        this.#eventBus._on("editingaction", this.#boundOnEditingAction);
        this.#eventBus._on("pagechanging", this.#boundOnPageChanging);
        this.#eventBus._on("textlayerrendered", this.#boundOnTextLayerRendered);
    }
    destroy() {
        this.#removeKeyboardManager();
        this.#eventBus._off("editingaction", this.#boundOnEditingAction);
        this.#eventBus._off("pagechanging", this.#boundOnPageChanging);
        this.#eventBus._off("textlayerrendered", this.#boundOnTextLayerRendered);
        for (const layer of this.#allLayers.values()) {
            layer.destroy();
        }
        this.#allLayers.clear();
        this.#allEditors.clear();
        this.#activeEditor = undefined;
        this.#selectedEditors.clear();
        this.#clipboardManager.destroy();
        this.#commandManager.destroy();
    }
    onPageChanging({ pageNumber }) {
        this.#currentPageIndex = pageNumber - 1;
    }
    onTextLayerRendered({ pageNumber }) {
        const pageIndex = pageNumber - 1;
        const layer = this.#allLayers.get(pageIndex);
        layer?.onTextLayerRendered();
    }
    focusMainContainer() {
        this.#container.focus();
    }
    #addKeyboardManager() {
        // The keyboard events are caught at the container level in order to be able
        // to execute some callbacks even if the current page doesn't have focus.
        this.#container.addEventListener("keydown", this.#boundKeydown);
    }
    #removeKeyboardManager() {
        this.#container.removeEventListener("keydown", this.#boundKeydown);
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
            this.#addKeyboardManager();
            this.#dispatchUpdateStates({
                isEditing: this.#mode !== AnnotationEditorType.NONE,
                isEmpty: this.#isEmpty(),
                hasSomethingToUndo: this.#commandManager.hasSomethingToUndo(),
                hasSomethingToRedo: this.#commandManager.hasSomethingToRedo(),
                hasSelectedEditor: false,
                hasEmptyClipboard: this.#clipboardManager.isEmpty(),
            });
        }
        else {
            this.#removeKeyboardManager();
            this.#dispatchUpdateStates({
                isEditing: false,
            });
        }
    }
    registerEditorTypes(types) {
        this.#editorTypes = types;
        for (const editorType of this.#editorTypes) {
            this.#dispatchUpdateUI(editorType.defaultPropertiesToUpdate);
        }
    }
    /**
     * Get an id.
     */
    getId() {
        return this.#idManager.getId();
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
    updateMode(mode) {
        this.#mode = mode;
        if (mode === AnnotationEditorType.NONE) {
            this.setEditingState(false);
            this.#disableAll();
        }
        else {
            this.setEditingState(true);
            this.#enableAll();
            for (const layer of this.#allLayers.values()) {
                layer.updateMode(mode);
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
        for (const editor of this.#selectedEditors) {
            editor.updateParams(type, value);
        }
        for (const editorType of this.#editorTypes) {
            editorType.updateDefaultParams(type, value);
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
     * Get all the editors belonging to a give page.
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
    get hasSelection() {
        return this.#selectedEditors.size !== 0;
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
        if (this.#activeEditor) {
            // An editor is being edited so just commit it.
            this.#activeEditor.commitOrRemove();
        }
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
    /**
     * Copy the selected editor.
     */
    copy() {
        if (this.#activeEditor) {
            // An editor is being edited so just commit it.
            this.#activeEditor.commitOrRemove();
        }
        if (this.hasSelection) {
            const editors = [];
            for (const editor of this.#selectedEditors) {
                if (!editor.isEmpty()) {
                    editors.push(editor);
                }
            }
            if (editors.length === 0) {
                return;
            }
            this.#clipboardManager.copy(editors);
            this.#dispatchUpdateStates({ hasEmptyClipboard: false });
        }
    }
    /**
     * Cut the selected editor.
     */
    cut() {
        this.copy();
        this.delete();
    }
    /**
     * Paste a previously copied editor.
     */
    paste() {
        if (this.#clipboardManager.isEmpty()) {
            return;
        }
        this.unselectAll();
        const layer = this.#allLayers.get(this.#currentPageIndex);
        const newEditors = this.#clipboardManager
            .paste()
            .map((data) => layer.deserialize(data));
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
        // if( this.#selectEditors.size === 0) //kkkk bug? ✅ 
        if (this.#selectedEditors.size === 0) {
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
    /**
     * Is the current editor the one passed as argument?
     */
    isActive(editor) {
        return this.#activeEditor === editor;
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=tools.js.map