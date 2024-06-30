/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/annotation_layer_builder.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { FieldObjectsPromise } from "../alias.js";
import type { AnnotationStorage, AnnotIntent, PageViewport, PDFPageProxy } from "../pdf.ts-src/pdf.js";
import { AnnotationLayer } from "../pdf.ts-src/pdf.js";
import type { IDownloadManager, IPDFLinkService } from "./interfaces.js";
import type { TextAccessibilityManager } from "./text_accessibility.js";
interface AnnotationLayerBuilderOptions {
    pdfPage: PDFPageProxy;
    annotationStorage?: AnnotationStorage | undefined;
    /**
     * Path for image resources, mainly for annotation icons. Include trailing slash.
     */
    imageResourcesPath?: string;
    renderForms: boolean;
    linkService: IPDFLinkService;
    downloadManager?: IDownloadManager | undefined;
    enableScripting?: boolean;
    hasJSActionsPromise?: Promise<boolean> | undefined;
    fieldObjectsPromise: FieldObjectsPromise | undefined;
    annotationCanvasMap: Map<string, HTMLCanvasElement> | undefined;
    accessibilityManager: TextAccessibilityManager | undefined;
    annotationEditorUIManager?: unknown;
    onAppend?: (div: HTMLDivElement) => void;
}
export declare class AnnotationLayerBuilder {
    #private;
    pdfPage: PDFPageProxy;
    linkService: IPDFLinkService;
    downloadManager: IDownloadManager | undefined;
    imageResourcesPath: string;
    renderForms: boolean;
    annotationStorage: AnnotationStorage | undefined;
    enableScripting: boolean;
    _hasJSActionsPromise: Promise<boolean>;
    _fieldObjectsPromise: FieldObjectsPromise;
    _annotationCanvasMap: Map<string, HTMLCanvasElement> | undefined;
    _accessibilityManager: TextAccessibilityManager | undefined;
    _annotationEditorUIManager: unknown;
    annotationLayer: AnnotationLayer | undefined;
    div?: HTMLDivElement;
    _cancelled: boolean;
    _eventBus: import("./event_utils.js").EventBus | undefined;
    constructor({ pdfPage, linkService, downloadManager, annotationStorage, imageResourcesPath, renderForms, enableScripting, hasJSActionsPromise, fieldObjectsPromise, annotationCanvasMap, accessibilityManager, annotationEditorUIManager, onAppend, }: AnnotationLayerBuilderOptions);
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