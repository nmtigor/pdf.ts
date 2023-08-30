import type { rect_t } from "../../../lib/alias.js";
import type { rgb_t } from "../../../lib/color/alias.js";
import { type HSElement } from "../../../lib/dom.js";
import type { IDownloadManager, IL10n, IPDFLinkService } from "../../pdf.ts-web/interfaces.js";
import type { TextAccessibilityManager } from "../../pdf.ts-web/text_accessibility.js";
import type { AnnotationData, FieldObject, RichText } from "../core/annotation.js";
import type { BidiText } from "../core/bidi.js";
import type { Ref } from "../pdf.js";
import { ColorConvertersDetail } from "../shared/scripting_utils.js";
import { AnnotationEditorType } from "../shared/util.js";
import { AnnotationStorage } from "./annotation_storage.js";
import type { MetadataEx, PDFPageProxy } from "./api.js";
import { DOMSVGFactory, type PageViewport } from "./display_utils.js";
type Parent_ = {
    page: PDFPageProxy;
    viewport: PageViewport;
    zIndex: number;
    div: HTMLDivElement;
    l10n: IL10n;
    popupShow: (() => void | Promise<void>)[];
};
type AnnotationElementCtorP_ = {
    data: AnnotationData;
    layer?: HTMLDivElement;
    linkService?: IPDFLinkService;
    downloadManager?: IDownloadManager | undefined;
    /**
     * Path for image resources, mainly
     * for annotation icons. Include trailing slash.
     */
    imageResourcesPath?: string;
    renderForms?: boolean;
    svgFactory?: DOMSVGFactory;
    annotationStorage?: AnnotationStorage;
    enableScripting?: boolean;
    hasJSActions?: boolean;
    fieldObjects?: Record<string, FieldObject[]> | undefined;
    parent: Parent_;
    elements: AnnotationElement[];
};
export declare class AnnotationElement {
    #private;
    isRenderable: boolean;
    data: AnnotationData;
    layer: HTMLDivElement | undefined;
    linkService: IPDFLinkService;
    downloadManager: IDownloadManager | undefined;
    imageResourcesPath: string | undefined;
    renderForms: boolean | undefined;
    svgFactory: DOMSVGFactory;
    annotationStorage: AnnotationStorage;
    enableScripting: boolean | undefined;
    hasJSActions: boolean | undefined;
    _fieldObjects: Record<string, FieldObject[]> | undefined;
    parent: Parent_;
    container: HTMLElement;
    firstQuadRect: rect_t | undefined;
    quadrilaterals?: HTMLElement[] | undefined;
    popup?: PopupElement;
    annotationEditorType?: AnnotationEditorType;
    constructor(parameters: AnnotationElementCtorP_, { isRenderable, ignoreBorder, createQuadrilaterals, }?: {
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
    protected _createPopup(): void;
    /**
     * Render the quadrilaterals of the annotation.
     * @return An array of section elements.
     */
    protected _renderQuadrilaterals(className: string): HTMLElement[];
    /**
     * Render the annotation's HTML element(s).
     * @return A section element or an array of section elements.
     */
    render(): HTMLElement | HTMLElement[] | undefined;
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
    show(): void;
    hide(): void;
    getElementsToTriggerPopup(): HSElement | HSElement[];
    addHighlightArea(): void;
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
interface PopupElementCtorP_ {
    container: HTMLElement;
    color: Uint8ClampedArray | undefined;
    titleObj: BidiText | undefined;
    modificationDate: string | undefined;
    contentsObj: BidiText;
    richText: RichText | undefined;
    rect: rect_t | undefined;
    parentRect: rect_t | undefined;
    parent: Parent_;
    elements: AnnotationElement[];
    open: boolean | undefined;
}
declare class PopupElement {
    #private;
    trigger: (HTMLElement | SVGElement)[];
    constructor({ container, color, elements, titleObj, modificationDate, contentsObj, richText, parent, rect, parentRect, open, }: PopupElementCtorP_);
    /** @implement */
    render(): void;
    forceHide(): void;
    maybeShow(): void;
    get isVisible(): boolean;
}
export declare class FreeTextAnnotationElement extends AnnotationElement {
    textContent: string[] | undefined;
    constructor(parameters: AnnotationElementCtorP_);
    render(): HTMLElement;
}
export declare class InkAnnotationElement extends AnnotationElement {
    #private;
    containerClassName: string;
    /**
     * Use the polyline SVG element since it allows us to use coordinates
     * directly and to draw both straight lines and curves.
     */
    readonly svgElementName = "polyline";
    constructor(parameters: AnnotationElementCtorP_);
    render(): HTMLElement;
    getElementsToTriggerPopup(): SVGPolylineElement[];
    addHighlightArea(): void;
}
export declare class FileAttachmentAnnotationElement extends AnnotationElement {
    #private;
    filename: string;
    content: Uint8Array | Uint8ClampedArray | undefined;
    constructor(parameters: AnnotationElementCtorP_);
    render(): HTMLElement;
    getElementsToTriggerPopup(): HTMLDivElement;
    addHighlightArea(): void;
}
export type AnnotationLayerP = {
    viewport: PageViewport;
    div: HTMLDivElement;
    l10n: IL10n;
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
    annotationEditorType?: AnnotationEditorType;
    bitmap?: ImageBitmap;
    bitmapId?: string;
    charLimit?: number | undefined;
    color?: Uint8ClampedArray | rgb_t;
    deleted?: boolean;
    formattedValue?: string | undefined;
    fontSize?: number;
    hidden?: boolean;
    id?: string | undefined;
    items?: Item[];
    opacity?: number;
    pageIndex?: number;
    paths?: {
        bezier: number[];
        points: number[];
    }[];
    print?: boolean;
    rect?: rect_t | undefined;
    ref?: Ref;
    rotation?: number;
    thickness?: number;
    user?: string;
    value?: string | string[] | number | boolean | undefined;
    valueAsString?: string | string[] | undefined;
}
export type ASVKey = keyof AnnotStorageValue;
export type AnnotStorageRecord = Map<string, AnnotStorageValue>;
/**
 * Manage the layer containing all the annotations.
 */
export declare class AnnotationLayer {
    #private;
    div: HTMLDivElement;
    l10n: IL10n;
    page: PDFPageProxy;
    viewport: PageViewport;
    zIndex: number;
    popupShow?: (() => void | Promise<void>)[];
    constructor({ div, accessibilityManager, annotationCanvasMap, l10n, page, viewport, }: AnnotationLayerP);
    /**
     * Render a new annotation layer with all annotation elements.
     */
    render(params: AnnotationLayerP): Promise<void>;
    /**
     * Update the annotation elements on existing annotation layer.
     */
    update({ viewport }: AnnotationLayerP): void;
    getEditableAnnotations(): AnnotationElement[];
    getEditableAnnotation(id: string): AnnotationElement | undefined;
}
export {};
//# sourceMappingURL=annotation_layer.d.ts.map