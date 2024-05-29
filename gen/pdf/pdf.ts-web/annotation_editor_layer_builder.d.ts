/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/annotation_editor_layer_builder.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { AnnotationEditorUIManager, AnnotationLayer, DrawLayer, PageViewport, PDFPageProxy } from "../pdf.ts-src/pdf.js";
import { AnnotationEditorLayer } from "../pdf.ts-src/pdf.js";
import type { IL10n } from "./interfaces.js";
import type { TextAccessibilityManager } from "./text_accessibility.js";
import type { TextLayerBuilder } from "./text_layer_builder.js";
interface AnnotationEditorLayerBuilderOptions {
    uiManager: AnnotationEditorUIManager;
    pdfPage: PDFPageProxy;
    l10n?: IL10n | undefined;
    accessibilityManager: TextAccessibilityManager | undefined;
    annotationLayer?: AnnotationLayer | undefined;
    textLayer?: TextLayerBuilder | undefined;
    drawLayer?: DrawLayer | undefined;
    onAppend?: (div: HTMLDivElement) => void;
}
export declare class AnnotationEditorLayerBuilder {
    #private;
    pdfPage: PDFPageProxy;
    accessibilityManager: TextAccessibilityManager | undefined;
    l10n: IL10n | undefined;
    annotationEditorLayer: AnnotationEditorLayer | undefined;
    div: HTMLDivElement | undefined;
    _cancelled: boolean;
    constructor(options: AnnotationEditorLayerBuilderOptions);
    /**
     * @param intent (default value is 'display')
     */
    render(viewport: PageViewport, intent?: string): Promise<void>;
    cancel(): void;
    hide(): void;
    show(): void;
}
export {};
//# sourceMappingURL=annotation_editor_layer_builder.d.ts.map