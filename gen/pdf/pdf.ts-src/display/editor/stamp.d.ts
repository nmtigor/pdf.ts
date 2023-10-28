import type { IL10n } from "../../../pdf.ts-web/interfaces.js";
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
    isSvg?: boolean | undefined;
}
/**
 * Basic text editor in order to create a FreeTex annotation.
 */
export declare class StampEditor extends AnnotationEditor {
    #private;
    static readonly _type = "stamp";
    constructor(params: StampEditorP);
    /** @inheritdoc */
    static initialize(l10n: IL10n): void;
    static get supportedTypes(): string[];
    static get supportedTypesStr(): string;
    /** @inheritdoc */
    static isHandlingMimeForPasting(mime: string): boolean;
    /** @inheritdoc */
    static paste(item: DataTransferItem, parent: AnnotationEditorLayer): void;
    /** @inheritdoc */
    remove(): void;
    /** @inheritdoc */
    rebuild(): void;
    /** @inheritdoc */
    onceAdded(): void;
    /** @inheritdoc */
    isEmpty(): boolean;
    /** @inheritdoc */
    get isResizable(): boolean;
    /** @inheritdoc */
    render(): HTMLDivElement;
    /** @inheritdoc */
    static deserialize(data: StampEditorSerialized, parent: AnnotationEditorLayer, uiManager: AnnotationEditorUIManager): StampEditor | undefined;
    /** @inheritdoc */
    serialize(isForCopying?: boolean, context?: Record<keyof any, any>): StampEditorSerialized | undefined;
}
//# sourceMappingURL=stamp.d.ts.map