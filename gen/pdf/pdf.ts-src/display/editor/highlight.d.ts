/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2024
 *
 * @module pdf/pdf.ts-src/display/editor/highlight.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { dot2d_t, id_t, Ratio, uint } from "../../../../lib/alias.js";
import type { Cssc } from "../../../../lib/color/alias.js";
import { IL10n } from "../../../pdf.ts-web/interfaces.js";
import type { Box } from "../../alias.js";
import { AnnotationEditorParamsType, AnnotationEditorType } from "../../shared/util.js";
import type { AnnotStorageValue } from "../annotation_layer.js";
import type { AnnotationEditorLayer } from "./annotation_editor_layer.js";
import { ColorPicker } from "./color_picker.js";
import type { AnnotationEditorP, PropertyToUpdate, TFD_AnnotationEditor, TID_AnnotationEditor } from "./editor.js";
import { AnnotationEditor } from "./editor.js";
import type { FreeHighlightOutline, HighlightOutline } from "./outliner.js";
import { FreeOutliner } from "./outliner.js";
import { AnnotationEditorUIManager, KeyboardManager } from "./tools.js";
interface HighlightEditorP_ extends AnnotationEditorP {
    name: "highlightEditor";
    color?: Cssc;
    thickness?: number;
    opacity?: Ratio;
    boxes: Box[];
    methodOfCreation?: string;
    text?: string;
    highlightId: id_t | -1;
    highlightOutlines?: HighlightOutline;
    clipPathId?: string;
    anchorNode: Node | null;
    anchorOffset?: number;
    focusNode: Node | null;
    focusOffset?: number;
}
interface TID_HighlightEditor_ extends TID_AnnotationEditor {
    type: "free_highlight" | "highlight";
    color: unknown;
    thickness: number;
    methodOfCreation: string;
}
interface TFD_HighlightEditor_ extends TFD_AnnotationEditor {
    type: "highlight";
    color?: string | undefined;
    numberOfColors?: uint;
}
/**
 * Basic draw editor in order to generate an Highlight annotation.
 */
export declare class HighlightEditor extends AnnotationEditor {
    #private;
    static readonly _type = "highlight";
    static readonly _editorType = AnnotationEditorType.HIGHLIGHT;
    color: string;
    static _defaultColor: Cssc;
    static _defaultOpacity: Ratio;
    static _defaultThickness: number;
    static _freeHighlightId: id_t | -1;
    static _freeOutliner: FreeOutliner | undefined;
    static _freeHighlight: FreeHighlightOutline | undefined;
    static _freeHighlightClipId: string;
    static get _keyboardManager(): KeyboardManager<AnnotationEditor | AnnotationEditorUIManager | ColorPicker>;
    constructor(params: HighlightEditorP_);
    get telemetryInitialData(): TID_HighlightEditor_;
    get telemetryFinalData(): TFD_HighlightEditor_;
    static computeTelemetryFinalData(data: Map<string, Map<unknown, uint>>): TFD_HighlightEditor_;
    /** @inheritdoc */
    static initialize(l10n: IL10n, uiManager: AnnotationEditorUIManager): void;
    /** @inheritdoc */
    static updateDefaultParams(type: AnnotationEditorParamsType, value?: number | string | boolean | undefined): void;
    /** @inheritdoc */
    translateInPage(x: number, y: number): void;
    /** @inheritdoc */
    get toolbarPosition(): dot2d_t | undefined;
    /** @inheritdoc */
    updateParams(type: AnnotationEditorParamsType, value: number | string): void;
    static get defaultPropertiesToUpdate(): PropertyToUpdate[];
    /** @inheritdoc */
    get propertiesToUpdate(): PropertyToUpdate[];
    /** @inheritdoc */
    addEditToolbar(): Promise<import("./toolbar.js").EditorToolbar | undefined>;
    /** @inheritdoc */
    disableEditing(): void;
    /** @inheritdoc */
    enableEditing(): void;
    /** @inheritdoc */
    fixAndSetPosition(): void;
    /** @inheritdoc */
    getBaseTranslation(): dot2d_t;
    /** @inheritdoc */
    getRect(tx: number, ty: number): [number, number, number, number];
    /** @inheritdoc */
    onceAdded(): void;
    /** @inheritdoc */
    remove(): void;
    /** @inheritdoc */
    rebuild(): void;
    setParent(parent: AnnotationEditorLayer | undefined): void;
    /** @inheritdoc */
    rotate(angle: number): void;
    /** @inheritdoc */
    render(): HTMLDivElement;
    pointerover(): void;
    pointerleave(): void;
    _moveCaret(direction: 0 | 1 | 2 | 3): void;
    /** @inheritdoc */
    select(): void;
    /** @inheritdoc */
    unselect(): void;
    /** @inheritdoc */
    get _mustFixPosition(): boolean;
    /** @inheritdoc */
    show(visible?: boolean): void;
    static startHighlighting(parent: AnnotationEditorLayer, isLTR: boolean, { target: textLayer, x, y }: PointerEvent): void;
    /** @inheritdoc */
    static deserialize(data: AnnotStorageValue, parent: AnnotationEditorLayer, uiManager: AnnotationEditorUIManager): HighlightEditor;
    /**
     * @inheritdoc
     * @implement
     */
    serialize(isForCopying?: boolean): AnnotStorageValue | undefined;
    static canCreateNewEmptyEditor(): boolean;
}
export {};
//# sourceMappingURL=highlight.d.ts.map