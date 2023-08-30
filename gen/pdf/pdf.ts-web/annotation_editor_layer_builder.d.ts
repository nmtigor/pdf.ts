import type { AnnotationEditorUIManager, AnnotationLayer, PageViewport, PDFPageProxy } from "../pdf.ts-src/pdf.js";
import { AnnotationEditorLayer } from "../pdf.ts-src/pdf.js";
import type { IL10n } from "./interfaces.js";
import type { TextAccessibilityManager } from "./text_accessibility.js";
interface AnnotationEditorLayerBuilderOptions {
    uiManager: AnnotationEditorUIManager;
    pageDiv: HTMLDivElement;
    pdfPage: PDFPageProxy;
    l10n?: IL10n;
    accessibilityManager: TextAccessibilityManager | undefined;
    annotationLayer?: AnnotationLayer | undefined;
}
export declare class AnnotationEditorLayerBuilder {
    #private;
    pageDiv: HTMLDivElement | undefined;
    pdfPage: PDFPageProxy;
    accessibilityManager: TextAccessibilityManager | undefined;
    l10n: IL10n;
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