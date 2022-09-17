import { AnnotationStorage, type AnnotIntent, type FieldObject, PageViewport, PDFPageProxy } from "../pdf.ts-src/pdf.js";
import { IDownloadManager, type IL10n, type IPDFLinkService, type MouseState } from "./interfaces.js";
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
    downloadManager?: IDownloadManager | undefined;
    /**
     * Localization service.
     */
    l10n: IL10n;
    enableScripting?: boolean;
    hasJSActionsPromise?: Promise<boolean> | undefined;
    fieldObjectsPromise: Promise<Record<string, FieldObject[]> | undefined> | undefined;
    mouseState?: MouseState | undefined;
    annotationCanvasMap: Map<string, HTMLCanvasElement> | undefined;
}
export declare class AnnotationLayerBuilder {
    pageDiv: HTMLDivElement;
    pdfPage: PDFPageProxy;
    linkService: IPDFLinkService;
    downloadManager: IDownloadManager | undefined;
    imageResourcesPath: string;
    renderForms: boolean;
    l10n: IL10n;
    annotationStorage: AnnotationStorage | undefined;
    enableScripting: boolean;
    _hasJSActionsPromise: Promise<boolean> | undefined;
    _fieldObjectsPromise: Promise<Record<string, FieldObject[]> | undefined> | undefined;
    _mouseState: MouseState | undefined;
    _annotationCanvasMap: Map<string, HTMLCanvasElement> | undefined;
    div?: HTMLDivElement;
    _cancelled: boolean;
    constructor({ pageDiv, pdfPage, linkService, downloadManager, annotationStorage, imageResourcesPath, renderForms, l10n, enableScripting, hasJSActionsPromise, fieldObjectsPromise, mouseState, annotationCanvasMap, }: AnnotationLayerBuilderOptions);
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
export {};
//# sourceMappingURL=annotation_layer_builder.d.ts.map