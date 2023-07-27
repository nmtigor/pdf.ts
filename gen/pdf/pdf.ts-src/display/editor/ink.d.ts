import type { C2D, point_t, TupleOf } from "../../../../lib/alias.js";
import { IL10n } from "../../../pdf.ts-web/interfaces.js";
import { AnnotationEditorParamsType } from "../../shared/util.js";
import { AnnotationEditorLayer } from "./annotation_editor_layer.js";
import { AnnotationEditor, AnnotationEditorP, AnnotationEditorSerialized, PropertyToUpdate } from "./editor.js";
import { AnnotationEditorUIManager } from "./tools.js";
export interface InkEditorP extends AnnotationEditorP {
    name: "inkEditor";
    color?: string;
    thickness?: number;
    opacity?: number;
}
type _curve_t = TupleOf<point_t, 4>;
export interface InkEditorSerialized extends AnnotationEditorSerialized {
    thickness: number;
    opacity: number;
    paths: {
        bezier: number[];
        points: number[];
    }[];
}
/**
 * Basic draw editor in order to generate an Ink annotation.
 */
export declare class InkEditor extends AnnotationEditor {
    #private;
    static _defaultColor: string | undefined;
    static _defaultOpacity: number;
    static _defaultThickness: number;
    static _l10nPromise: Map<string, Promise<string>>;
    static readonly _type = "ink";
    color: string | undefined;
    thickness: number | undefined;
    opacity: number | undefined;
    paths: _curve_t[][];
    bezierPath2D: Path2D[];
    currentPath: point_t[];
    scaleFactor: number;
    translationX: number;
    translationY: number;
    canvas: HTMLCanvasElement | undefined;
    ctx: C2D;
    constructor(params: InkEditorP);
    static initialize(l10n: IL10n): void;
    static updateDefaultParams(type: AnnotationEditorParamsType, value: number | string): void;
    /** @inheritdoc */
    updateParams(type: AnnotationEditorParamsType, value: number | string): void;
    static get defaultPropertiesToUpdate(): PropertyToUpdate[];
    /** @inheritdoc */
    get propertiesToUpdate(): PropertyToUpdate[];
    /** @inheritdoc */
    rebuild(): void;
    /** @inheritdoc */
    remove(): void;
    setParent(parent: AnnotationEditorLayer | undefined): void;
    onScaleChanging(): void;
    /** @inheritdoc */
    enableEditMode(): void;
    /** @inheritdoc */
    disableEditMode(): void;
    /** @inheritdoc */
    onceAdded(): void;
    /** @inheritdoc */
    isEmpty(): boolean;
    /**
     * Commit the curves we have in this editor.
     */
    commit(): void;
    /** @inheritdoc */
    focusin(event: FocusEvent): void;
    /**
     * onpointerdown callback for the canvas we're drawing on.
     */
    canvasPointerdown(event: PointerEvent): void;
    /**
     * onpointermove callback for the canvas we're drawing on.
     */
    canvasPointermove(event: PointerEvent): void;
    /**
     * onpointerup callback for the canvas we're drawing on.
     */
    canvasPointerup(event: PointerEvent): void;
    /**
     * onpointerleave callback for the canvas we're drawing on.
     */
    canvasPointerleave(event: PointerEvent): void;
    /** @inheritdoc */
    render(): HTMLDivElement;
    /**
     * When the dimensions of the div change the inner canvas must
     * renew its dimensions, hence it must redraw its own contents.
     * @param width the new width of the div
     * @param height the new height of the div
     */
    setDimensions(width: number, height: number): void;
    /** @inheritdoc */
    static deserialize(data: InkEditorSerialized, parent: AnnotationEditorLayer, uiManager: AnnotationEditorUIManager): InkEditor;
    /**
     * @inheritdoc
     * @implement
     */
    serialize(): InkEditorSerialized | undefined;
}
export {};
//# sourceMappingURL=ink.d.ts.map