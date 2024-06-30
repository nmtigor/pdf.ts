/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/editor/stamp.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { IL10n } from "../../../pdf.ts-web/interfaces.js";
import { AnnotationEditorType } from "../../shared/util.js";
import type { AnnotStorageValue } from "../annotation_layer.js";
import type { AnnotationEditorLayer } from "./annotation_editor_layer.js";
import type { AnnotationEditorP } from "./editor.js";
import { AnnotationEditor } from "./editor.js";
import type { AnnotationEditorUIManager } from "./tools.js";
export interface StampEditorP extends AnnotationEditorP {
    name: "stampEditor";
    bitmapUrl?: string;
    bitmapFile?: File;
}
export interface StampEditorSerialized extends AnnotStorageValue {
    bitmapUrl?: string;
}
/**
 * Basic text editor in order to create a FreeTex annotation.
 */
export declare class StampEditor extends AnnotationEditor {
    #private;
    static readonly _type = "stamp";
    static readonly _editorType = AnnotationEditorType.STAMP;
    getImageForAltText(): HTMLCanvasElement | undefined;
    constructor(params: StampEditorP);
    static initialize(l10n: IL10n, uiManager: AnnotationEditorUIManager): void;
    static get supportedTypes(): string[];
    static get supportedTypesStr(): string;
    static isHandlingMimeForPasting(mime: string): boolean;
    static paste(item: DataTransferItem, parent: AnnotationEditorLayer): void;
    remove(): void;
    rebuild(): void;
    onceAdded(): void;
    isEmpty(): boolean;
    get isResizable(): boolean;
    render(): HTMLDivElement;
    static deserialize(data: StampEditorSerialized, parent: AnnotationEditorLayer, uiManager: AnnotationEditorUIManager): StampEditor | undefined;
    /** @implement */
    serialize(isForCopying?: boolean, context?: Record<keyof any, any>): StampEditorSerialized | undefined;
}
//# sourceMappingURL=stamp.d.ts.map