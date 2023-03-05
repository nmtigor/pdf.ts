import { type rect_t } from "../../../lib/alias.js";
import { IDownloadManager, type IPDFLinkService } from "../../pdf.ts-web/interfaces.js";
import { TextAccessibilityManager } from "../../pdf.ts-web/text_accessibility.js";
import { type AnnotationData, type FieldObject } from "../core/annotation.js";
import { ColorConvertersDetail } from "../shared/scripting_utils.js";
import { AnnotationEditorType } from "../shared/util.js";
import { AnnotationStorage } from "./annotation_storage.js";
import { MetadataEx, PDFPageProxy } from "./api.js";
import { DOMSVGFactory, PageViewport } from "./display_utils.js";
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
    container?: HTMLElement;
    quadrilaterals?: HTMLElement[] | undefined;
    constructor(parameters: _AnnotationElementCtorP, { isRenderable, ignoreBorder, createQuadrilaterals, }?: {
        isRenderable?: boolean | undefined;
        ignoreBorder?: boolean | undefined;
        createQuadrilaterals?: boolean | undefined;
    });
    setRotation(angle: number, container?: HTMLElement): void;
    get _commonActions(): {
        display: (event: CustomEvent) => void;
        print: (event: CustomEvent) => void;
        hidden: (event: CustomEvent) => void;
        focus: (event: CustomEvent) => void;
        userName: (event: CustomEvent) => void;
        readonly: (event: CustomEvent) => void;
        required: (event: CustomEvent<{
            required: boolean;
        }>) => void;
        bgColor: (event: CustomEvent<ColorConvertersDetail>) => void;
        fillColor: (event: CustomEvent<ColorConvertersDetail>) => void;
        fgColor: (event: CustomEvent<ColorConvertersDetail>) => void;
        textColor: (event: CustomEvent<ColorConvertersDetail>) => void;
        borderColor: (event: CustomEvent<ColorConvertersDetail>) => void;
        strokeColor: (event: CustomEvent<ColorConvertersDetail>) => void;
        rotation: (event: CustomEvent<{
            rotation: number;
        }>) => void;
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
     * @return An array of section elements.
     */
    protected _renderQuadrilaterals(className: string): HTMLElement[];
    /**
     * Render the annotation's HTML element(s).
     * @return A section element or an array of section elements.
     */
    render(): HTMLElement | HTMLElement[];
    protected _getElementsByName(name: string, skipId?: string): {
        id: string;
        exportValue: string | undefined;
        domElement: Element | null;
    }[] | {
        id: string | null;
        exportValue: any;
        domElement: HTMLElement;
    }[];
    _setRequired(lement: HTMLElement, isRequired: boolean): void;
}
export interface ResetForm {
    fields: string[];
    refs: string[];
    include: boolean;
}
type Action = (event: CustomEvent) => void;
interface Actions {
    value: Action;
    charLimit?: Action;
    clear?: Action;
    editable?: Action;
    formattedValue?: Action;
    indices?: Action;
    insert?: Action;
    items?: Action;
    multipleSelection?: Action;
    remove?: Action;
    selRange?: Action;
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
export type AnnotationLayerP = {
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
    fieldObjects: boolean | Record<string, FieldObject[]> | MetadataEx | undefined;
    annotationCanvasMap: Map<string, HTMLCanvasElement> | undefined;
    accessibilityManager?: TextAccessibilityManager | undefined;
};
export interface AnnotStorageValue {
    annotationType?: AnnotationEditorType;
    charLimit?: number | undefined;
    color?: Uint8ClampedArray;
    formattedValue?: string | undefined;
    fontSize?: number;
    hidden?: boolean;
    items?: Item[];
    opacity?: number;
    pageIndex?: number;
    paths?: {
        bezier: number[];
        points: number[];
    }[];
    print?: boolean;
    rect?: rect_t;
    rotation?: number;
    thickness?: number;
    user?: string;
    value?: string | string[] | number | boolean | undefined;
    valueAsString?: string | string[] | undefined;
}
export type ASVKey = keyof AnnotStorageValue;
export type AnnotStorageRecord = Map<string, AnnotStorageValue>;
export declare class AnnotationLayer {
    #private;
    /**
     * Render a new annotation layer with all annotation elements.
     */
    static render(params: AnnotationLayerP): void;
    /**
     * Update the annotation elements on existing annotation layer.
     */
    static update(params: AnnotationLayerP): void;
}
export {};
//# sourceMappingURL=annotation_layer.d.ts.map