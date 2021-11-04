import { AnnotationStorage } from "../pdf.ts-src/display/annotation_storage.js";
import { IL10n, IPDFAnnotationLayerFactory, IPDFLinkService, MouseState } from "./interfaces.js";
import { DownloadManager } from "./download_manager.js";
import { PageViewport } from '../pdf.ts-src/display/display_utils.js';
import { AnnotIntent, PDFPageProxy } from '../pdf.ts-src/display/api.js';
import { FieldObject } from "../pdf.ts-src/core/annotation.js";
interface AnnotationLayerBuilderOptions {
    pageDiv: HTMLDivElement;
    pdfPage: PDFPageProxy;
    annotationStorage?: AnnotationStorage | undefined;
    /**
     * Path for image resources, mainly for annotation icons. Include trailing slash.
     */
    imageResourcesPath?: string;
    renderForms: boolean;
    linkService: IPDFLinkService;
    downloadManager?: DownloadManager | undefined;
    /**
     * Localization service.
     */
    l10n: IL10n;
    enableScripting?: boolean;
    hasJSActionsPromise?: Promise<boolean> | undefined;
    fieldObjectsPromise: Promise<Record<string, FieldObject[]> | undefined> | undefined;
    mouseState?: MouseState | undefined;
}
export declare class AnnotationLayerBuilder {
    pageDiv: HTMLDivElement;
    pdfPage: PDFPageProxy;
    linkService: IPDFLinkService;
    downloadManager?: DownloadManager | undefined;
    imageResourcesPath?: string;
    renderForms: boolean;
    l10n: IL10n;
    annotationStorage?: AnnotationStorage | undefined;
    enableScripting: boolean;
    _hasJSActionsPromise: Promise<boolean> | undefined;
    _fieldObjectsPromise: Promise<Record<string, FieldObject[]> | undefined> | undefined;
    _mouseState: MouseState | undefined;
    div?: HTMLDivElement;
    _cancelled: boolean;
    constructor({ pageDiv, pdfPage, linkService, downloadManager, annotationStorage, imageResourcesPath, renderForms, l10n, enableScripting, hasJSActionsPromise, fieldObjectsPromise, mouseState, }: AnnotationLayerBuilderOptions);
    /**
     * @param viewport
     * @param intent (default value is 'display')
     * @return A promise that is resolved when rendering of the
     *   annotations is complete.
     */
    render(viewport: PageViewport, intent?: AnnotIntent): Promise<void>;
    cancel(): void;
    hide(): void;
}
export declare class DefaultAnnotationLayerFactory implements IPDFAnnotationLayerFactory {
    /** @implements */
    createAnnotationLayerBuilder(pageDiv: HTMLDivElement, pdfPage: PDFPageProxy, annotationStorage?: AnnotationStorage, imageResourcesPath?: string, renderForms?: boolean, l10n?: IL10n, enableScripting?: boolean, hasJSActionsPromise?: Promise<boolean>, mouseState?: MouseState, fieldObjectsPromise?: Promise<Record<string, FieldObject[]> | undefined>): AnnotationLayerBuilder;
}
export {};
//# sourceMappingURL=annotation_layer_builder.d.ts.map