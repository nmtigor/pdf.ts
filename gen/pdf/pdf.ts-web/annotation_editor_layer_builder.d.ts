import { AnnotationEditorLayer, AnnotationEditorUIManager, AnnotationStorage, PageViewport, PDFPageProxy } from "../pdf.ts-src/pdf.js";
import { IL10n } from "./interfaces.js";
interface AnnotationEditorLayerBuilderOptions {
    pageDiv: HTMLDivElement;
    pdfPage: PDFPageProxy;
    annotationStorage: AnnotationStorage | undefined;
    /**
     * Localization service.
     */
    l10n: IL10n;
    uiManager: AnnotationEditorUIManager;
}
export declare class AnnotationEditorLayerBuilder {
    #private;
    pageDiv: HTMLDivElement | undefined;
    pdfPage: PDFPageProxy;
    annotationStorage: AnnotationStorage | undefined;
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
    destroy(): void;
}
export {};
//# sourceMappingURL=annotation_editor_layer_builder.d.ts.map