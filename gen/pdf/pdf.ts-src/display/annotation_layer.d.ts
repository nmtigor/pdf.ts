import { IDownloadManager, type IPDFLinkService, type MouseState } from "../../pdf.ts-web/interfaces.js";
import { type AnnotationData, type FieldObject } from "../core/annotation.js";
import { ColorConvertersDetail } from "../shared/scripting_utils.js";
import { AnnotationStorage } from "./annotation_storage.js";
import { PDFPageProxy } from "./api.js";
import { DOMSVGFactory, PageViewport } from "./display_utils.js";
declare type HTMLSectionElement = HTMLElement;
interface _AnnotationElementCtorP {
    data: AnnotationData;
    layer: HTMLDivElement;
    page: PDFPageProxy;
    viewport: PageViewport;
    linkService: IPDFLinkService;
    downloadManager: IDownloadManager | undefined;
    /**
     * Path for image resources, mainly
     * for annotation icons. Include trailing slash.
     */
    imageResourcesPath?: string;
    renderForms: boolean;
    svgFactory: DOMSVGFactory;
    annotationStorage: AnnotationStorage;
    enableScripting?: boolean;
    hasJSActions?: boolean;
    fieldObjects: Record<string, FieldObject[]> | undefined;
    mouseState?: MouseState;
}
export declare class AnnotationElement {
    #private;
    isRenderable: boolean;
    data: AnnotationData;
    layer: HTMLDivElement;
    page: PDFPageProxy;
    viewport: PageViewport;
    linkService: IPDFLinkService;
    downloadManager: IDownloadManager | undefined;
    imageResourcesPath: string | undefined;
    renderForms: boolean;
    svgFactory: DOMSVGFactory;
    annotationStorage: AnnotationStorage;
    enableScripting: boolean | undefined;
    hasJSActions: boolean | undefined;
    _fieldObjects: Record<string, FieldObject[]> | undefined;
    _mouseState: MouseState | undefined;
    container?: HTMLSectionElement;
    quadrilaterals?: HTMLSectionElement[] | undefined;
    constructor(parameters: _AnnotationElementCtorP, { isRenderable, ignoreBorder, createQuadrilaterals, }?: {
        isRenderable?: boolean | undefined;
        ignoreBorder?: boolean | undefined;
        createQuadrilaterals?: boolean | undefined;
    });
    get _commonActions(): {
        display: (event: CustomEvent) => void;
        print: (event: CustomEvent) => void;
        hidden: (event: CustomEvent) => void;
        focus: (event: CustomEvent) => void;
        userName: (event: CustomEvent) => void;
        readonly: (event: CustomEvent) => void;
        required: (event: CustomEvent) => void;
        bgColor: (event: CustomEvent<ColorConvertersDetail>) => void;
        fillColor: (event: CustomEvent<ColorConvertersDetail>) => void;
        fgColor: (event: CustomEvent<ColorConvertersDetail>) => void;
        textColor: (event: CustomEvent<ColorConvertersDetail>) => void;
        borderColor: (event: CustomEvent<ColorConvertersDetail>) => void;
        strokeColor: (event: CustomEvent<ColorConvertersDetail>) => void;
    };
    _dispatchEventFromSandbox(actions: Actions, jsEvent: CustomEvent): void;
    _setDefaultPropertiesFromJS(element: HTMLElement): void;
    /**
     * Create a popup for the annotation's HTML element. This is used for
     * annotations that do not have a Popup entry in the dictionary, but
     * are of a type that works with popups (such as Highlight annotations).
     */
    protected _createPopup(trigger_x: HTMLOrSVGElement | undefined, data: AnnotationData): void;
    /**
     * Render the quadrilaterals of the annotation.
     */
    protected _renderQuadrilaterals(className: string): HTMLElement[];
    /**
     * Render the annotation's HTML element(s).
     */
    render(): HTMLSectionElement | HTMLSectionElement[];
    /**
     * @private
     * @return {Array}
     */
    _getElementsByName(name: string, skipId?: string): {
        id: string;
        exportValue: string | undefined;
        domElement: HTMLElement | null;
    }[] | {
        id: any;
        exportValue: any;
        domElement: HTMLElement;
    }[];
    static get platform(): {
        isWin: boolean;
        isMac: boolean;
    };
}
export interface ResetForm {
    fields: string[];
    refs: string[];
    include: boolean;
}
declare type Action = (event: CustomEvent) => void;
interface Actions {
    value: Action;
    clear?: Action;
    editable?: Action;
    indices?: Action;
    insert?: Action;
    items?: Action;
    multipleSelection?: Action;
    remove?: Action;
    selRange?: Action;
    formattedValue?: Action;
}
interface Item {
    displayValue: string | null;
    exportValue: string;
}
export declare class FileAttachmentAnnotationElement extends AnnotationElement {
    #private;
    filename: string;
    content: Uint8Array | Uint8ClampedArray | undefined;
    constructor(parameters: _AnnotationElementCtorP);
    render(): HTMLElement;
}
interface _AnnotationLayerP {
    viewport: PageViewport;
    div: HTMLDivElement;
    annotations: AnnotationData[];
    page: PDFPageProxy;
    /**
     * Path for image resources, mainly
     * for annotation icons. Include trailing slash.
     */
    imageResourcesPath?: string | undefined;
    renderForms: boolean;
    linkService: IPDFLinkService;
    downloadManager: IDownloadManager | undefined;
    annotationStorage?: AnnotationStorage | undefined;
    /**
     * Enable embedded script execution.
     */
    enableScripting: boolean;
    /**
     * Some fields have JS actions.
     * The default value is `false`.
     */
    hasJSActions: boolean;
    fieldObjects: Record<string, FieldObject[]> | undefined;
    mouseState?: MouseState | undefined;
    annotationCanvasMap?: Map<string, HTMLCanvasElement>;
}
export interface AnnotStorageValue {
    value?: string | string[] | number | boolean | null | undefined;
    valueAsString?: string | string[] | undefined;
    formattedValue?: string | undefined;
    hidden?: boolean;
    items?: Item[];
    print?: boolean;
}
export declare type ASVKey = keyof AnnotStorageValue;
export declare type AnnotStorageRecord = Map<string, AnnotStorageValue>;
export declare class AnnotationLayer {
    #private;
    /**
     * Render a new annotation layer with all annotation elements.
     */
    static render(parameters: _AnnotationLayerP): void;
    /**
     * Update the annotation elements on existing annotation layer.
     */
    static update(parameters: _AnnotationLayerP): void;
}
export {};
//# sourceMappingURL=annotation_layer.d.ts.map