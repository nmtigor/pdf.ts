import type { C2D, dot2d_t, TupleOf } from "../../../../lib/alias.js";
import type { IL10n } from "../../../pdf.ts-web/interfaces.js";
import { AnnotationEditorParamsType, AnnotationEditorType } from "../../shared/util.js";
import type { AnnotStorageValue } from "../annotation_layer.js";
import type { AnnotationEditorLayer } from "./annotation_editor_layer.js";
import type { AnnotationEditorP, PropertyToUpdate } from "./editor.js";
import { AnnotationEditor } from "./editor.js";
import { type AnnotationEditorUIManager } from "./tools.js";
export interface InkEditorP extends AnnotationEditorP {
    name: "inkEditor";
    color?: string;
    thickness?: number;
    opacity?: number;
}
type curve_t_ = TupleOf<dot2d_t, 4>;
export interface InkEditorSerialized extends AnnotStorageValue {
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
    static readonly _type = "ink";
    static readonly _editorType = AnnotationEditorType.INK;
    static _defaultColor: string | undefined;
    static _defaultOpacity: number;
    static _defaultThickness: number;
    color: string | undefined;
    thickness: number | undefined;
    opacity: number | undefined;
    paths: curve_t_[][];
    bezierPath2D: Path2D[];
    allRawPaths: unknown[];
    currentPath: dot2d_t[];
    scaleFactor: number;
    translationX: number;
    translationY: number;
    canvas: HTMLCanvasElement | undefined;
    ctx: C2D;
    constructor(params: InkEditorP);
    static initialize(l10n: IL10n): void;
    static updateDefaultParams(type: AnnotationEditorParamsType, value: number | string | undefined): void;
    updateParams(type: AnnotationEditorParamsType, value: number | string): void;
    static get defaultPropertiesToUpdate(): PropertyToUpdate[];
    get propertiesToUpdate(): PropertyToUpdate[];
    rebuild(): void;
    remove(): void;
    setParent(parent: AnnotationEditorLayer | undefined): void;
    onScaleChanging(): void;
    enableEditMode(): void;
    disableEditMode(): void;
    onceAdded(): void;
    isEmpty(): boolean;
    /**
     * Commit the curves we have in this editor.
     */
    commit(): void;
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
    get isResizable(): boolean;
    render(): HTMLDivElement;
    /**
     * When the dimensions of the div change the inner canvas must
     * renew its dimensions, hence it must redraw its own contents.
     * @param width the new width of the div
     * @param height the new height of the div
     */
    setDimensions(width: number, height: number): void;
    static deserialize(data: InkEditorSerialized, parent: AnnotationEditorLayer, uiManager: AnnotationEditorUIManager): InkEditor | undefined;
    /** @implement */
    serialize(isForCopying?: boolean): InkEditorSerialized | undefined;
}
export {};
//# sourceMappingURL=ink.d.ts.map