import { MetadataEx } from "../pdf.ts-src/display/api.js";
import { AnnotationStorage, type AnnotIntent, type FieldObject, PageViewport, PDFPageProxy } from "../pdf.ts-src/pdf.js";
import { IDownloadManager, type IL10n, type IPDFLinkService } from "./interfaces.js";
import { TextAccessibilityManager } from "./text_accessibility.js";
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
    fieldObjectsPromise: Promise<boolean | Record<string, FieldObject[]> | MetadataEx | undefined> | undefined;
    annotationCanvasMap: Map<string, HTMLCanvasElement> | undefined;
    accessibilityManager: TextAccessibilityManager | undefined;
}
export declare class AnnotationLayerBuilder {
    #private;
    pageDiv: HTMLDivElement;
    pdfPage: PDFPageProxy;
    linkService: IPDFLinkService;
    downloadManager: IDownloadManager | undefined;
    imageResourcesPath: string;
    renderForms: boolean;
    l10n: IL10n;
    annotationStorage: AnnotationStorage | undefined;
    enableScripting: boolean;
    _hasJSActionsPromise: Promise<boolean>;
    _fieldObjectsPromise: Promise<boolean | Record<string, FieldObject[]> | MetadataEx | undefined>;
    _annotationCanvasMap: Map<string, HTMLCanvasElement> | undefined;
    _accessibilityManager: TextAccessibilityManager | undefined;
    div?: HTMLDivElement;
    _cancelled: boolean;
    _eventBus: import("./event_utils.js").EventBus | undefined;
    constructor({ pageDiv, pdfPage, linkService, downloadManager, annotationStorage, imageResourcesPath, renderForms, l10n, enableScripting, hasJSActionsPromise, fieldObjectsPromise, annotationCanvasMap, accessibilityManager, }: AnnotationLayerBuilderOptions);
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