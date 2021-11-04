import { AnnotationBorderStyleType, AnnotationFieldFlag, AnnotationFlag, AnnotationReplyType, AnnotationType, rect_t } from "../shared/util.js";
import { Dict, Name, Ref } from "./primitives.js";
import { OperatorList } from "./operator_list.js";
import { BasePdfManager } from "./pdf_manager.js";
import { LocalIdFactory } from "./document.js";
import { PartialEvaluator } from "./evaluator.js";
import { WorkerTask } from "./worker.js";
import { TupleOf } from "../../../lib/alias.js";
import { AnnotActions } from "./core_utils.js";
import { DefaultAppearanceData } from "./default_appearance.js";
import { AnnotStorageRecord } from "../display/annotation_layer.js";
import { CatParseDestDictRes } from "./catalog.js";
import { Serializable } from "./file_spec.js";
import { XRef } from "./xref.js";
import { BaseStream } from "./base_stream.js";
import { BidiText } from "./bidi.js";
import { XFAHTMLObj } from "./xfa/alias.js";
declare type AnnotType = "Caret" | "Circle" | "FileAttachment" | "FreeText" | "Ink" | "Line" | "Link" | "Highlight" | "Polygon" | "PolyLine" | "Popup" | "Stamp" | "Square" | "Squiggly" | "StrikeOut" | "Text" | "Underline" | "Widget";
export declare class AnnotationFactory {
    /**
     * Create an `Annotation` object of the correct type for the given reference
     * to an annotation dictionary. This yields a promise that is resolved when
     * the `Annotation` object is constructed.
     *
     * @return A promise that is resolved with an {Annotation} instance.
     */
    static create(xref: XRef, ref: Ref, pdfManager: BasePdfManager, idFactory: LocalIdFactory, collectFields?: boolean): Promise<Annotation | undefined>;
    /**
     * @private
     */
    static _create(xref: XRef, ref: Ref, pdfManager: BasePdfManager, idFactory: LocalIdFactory, acroForm: Dict | undefined, collectFields: boolean, pageIndex?: number): Annotation | undefined;
    static _getPageIndex(xref: XRef, ref: Ref, pdfManager: BasePdfManager): Promise<number>;
}
export declare function getQuadPoints(dict: Dict, rect?: rect_t): TupleOf<AnnotPoint, 4>[] | undefined;
interface AnnotationCtorParms {
    xref: XRef;
    ref: Ref;
    dict: Dict;
    subtype?: AnnotType | undefined;
    id: string;
    pdfManager: BasePdfManager;
    acroForm: Dict;
    collectFields: boolean;
    pageIndex: number;
}
export interface RichText {
    str: string | undefined;
    html: XFAHTMLObj;
}
export declare type AnnotationData = {
    annotationFlags: AnnotationFlag;
    backgroundColor: Uint8ClampedArray | undefined;
    borderStyle: AnnotationBorderStyle;
    borderColor: Uint8ClampedArray | undefined;
    color: Uint8ClampedArray | undefined;
    contentsObj: BidiText;
    richText?: RichText | undefined;
    hasAppearance: boolean;
    id: string;
    modificationDate: string | undefined;
    rect: rect_t;
    subtype?: AnnotType | undefined;
    kidIds?: string[];
    actions?: AnnotActions | undefined;
    fieldName?: string;
    pageIndex?: number;
    annotationType?: AnnotationType;
    name?: string;
    state?: string | undefined;
    stateModel?: string | undefined;
    quadPoints?: TupleOf<AnnotPoint, 4>[] | undefined;
    fieldValue?: string | string[] | undefined;
    defaultFieldValue?: string | string[] | undefined;
    alternativeText?: string;
    defaultAppearance?: string;
    defaultAppearanceData?: DefaultAppearanceData;
    fieldType?: string | undefined;
    fieldFlags?: AnnotationFieldFlag;
    readOnly?: boolean;
    hidden?: boolean;
    textAlignment?: number | undefined;
    maxLen?: number | undefined;
    multiLine?: boolean;
    comb?: boolean;
    checkBox?: boolean;
    radioButton?: boolean;
    pushButton?: boolean;
    isTooltipOnly?: boolean;
    exportValue?: string;
    buttonValue?: string | undefined;
    options?: {
        exportValue?: string | string[] | undefined;
        displayValue?: string | string[] | undefined;
    }[];
    combo?: boolean;
    multiSelect?: boolean;
    inReplyTo?: string | undefined;
    replyType?: AnnotationReplyType;
    titleObj?: BidiText;
    creationDate?: string | undefined;
    hasPopup?: boolean;
    lineCoordinates?: rect_t;
    vertices?: AnnotPoint[];
    inkLists?: AnnotPoint[][];
    file?: Serializable;
    parentType?: string | undefined;
    parentId?: string | undefined;
    parentRect?: rect_t;
} & CatParseDestDictRes;
/**
 * PDF 1.7 Table 56
 */
export declare type DashArray = [number, number] | [number] | [];
export declare type SaveData = {
    ref: Ref;
    data: string;
    xfa?: {
        path: string;
        value: string;
    };
};
export declare type SaveReturn = null | TupleOf<SaveData, 1 | 2>;
export interface FieldObject {
    id: string;
    type: string;
    value?: string | string[] | undefined;
    defaultValue?: string | string[];
    editable?: boolean;
    rect?: rect_t;
    name?: string;
    hidden?: boolean;
    actions?: AnnotActions;
    kidIds?: string[];
    page?: number;
    multiline?: boolean;
    password?: boolean;
    charLimit?: number;
    comb?: boolean;
    exportValues?: string;
    numItems?: number;
    multipleSelection?: boolean;
}
export declare class Annotation {
    #private;
    _streams: BaseStream[];
    data: AnnotationData;
    _fallbackFontDict?: Dict;
    flags: AnnotationFlag;
    /**
     * Set the flags.
     *
     * @param flags - Unsigned 32-bit integer specifying annotation characteristics
     * @see {@link shared/util.js}
     */
    setFlags(flags: unknown): void;
    protected _hasFlag(flags: AnnotationFlag, flag: AnnotationFlag): boolean;
    /**
     * Check if a provided flag is set.
     *
     * @param flag - Hexadecimal representation for an annotation characteristic
     * @see {@link shared/util.js}
     */
    hasFlag(flag: AnnotationFlag): boolean;
    protected _isViewable(flags: AnnotationFlag): boolean;
    get viewable(): boolean;
    /**
     * Check if the annotation must be displayed by taking into account
     * the value found in the annotationStorage which may have been set
     * through JS.
     *
     * @param annotationStorage Storage for annotation
     */
    mustBeViewed(annotationStorage?: AnnotStorageRecord): boolean;
    get printable(): boolean;
    /**
     * Check if the annotation must be printed by taking into account
     * the value found in the annotationStorage which may have been set
     * through JS.
     *
     * @param annotationStorage Storage for annotation
     */
    mustBePrinted(annotationStorage?: AnnotStorageRecord): boolean;
    color: Uint8ClampedArray | undefined;
    borderStyle: AnnotationBorderStyle;
    borderColor: Uint8ClampedArray | undefined;
    backgroundColor: Uint8ClampedArray | undefined;
    _title: BidiText;
    /**
     * Set the title.
     *
     * @final
     * @param The title of the annotation, used e.g. with
     *   PopupAnnotations.
     */
    setTitle(title: unknown): void;
    _contents: BidiText;
    /**
     * Set the contents.
     *
     * @param contents Text to display for the annotation or, if the
     *  type of annotation does not display text, a
     *  description of the annotation's contents
     */
    setContents(contents?: string): void;
    appearance?: BaseStream | undefined;
    modificationDate: string | undefined;
    /**
     * Set the modification date.
     *
     * @param modificationDate - PDF date string that indicates when the
     *  annotation was last modified
     */
    setModificationDate(modificationDate: unknown): void;
    rectangle: rect_t;
    /**
     * Set the rectangle.
     *
     * @param rectangle - The rectangle array with exactly four entries
     */
    setRectangle(rectangle: unknown): void;
    constructor(params: AnnotationCtorParms);
    /**
     * Set the border style (as AnnotationBorderStyle object).
     *
     * @param borderStyle - The border style dictionary
     */
    setBorderStyle(borderStyle: Dict): void;
    /**
     * Set the color and take care of color space conversion.
     * The default value is black, in RGB color space.
     *
     * @param color The color array containing either 0
     *  (transparent), 1 (grayscale), 3 (RGB) or 4 (CMYK) elements
     */
    setColor(color: number[]): void;
    /**
     * Set the (normal) appearance.
     *
     * @param dict The annotation's data dictionary
     */
    setAppearance(dict: Dict): void;
    /**
     * Set the color for background and border if any.
     * The default values are transparent.
     *
     * @param mk The MK dictionary
     */
    setBorderAndBackgroundColors(mk: unknown): void;
    loadResources(keys: string[]): Promise<Dict | undefined>;
    getOperatorList(evaluator: PartialEvaluator, task: WorkerTask, renderForms?: boolean, annotationStorage?: AnnotStorageRecord): Promise<OperatorList>;
    save(evaluator: PartialEvaluator, task: WorkerTask, annotationStorage?: AnnotStorageRecord): Promise<SaveReturn>;
    /**
     * Get field data for usage in JS sandbox.
     *
     * Field object is defined here:
     * https://www.adobe.com/content/dam/acom/en/devnet/acrobat/pdfs/js_api_reference.pdf#page=16
     */
    getFieldObject(): FieldObject | undefined;
    /**
     * Reset the annotation.
     *
     * This involves resetting the various streams that are either cached on the
     * annotation instance or created during its construction.
     */
    reset(): void;
    /**
     * Construct the (fully qualified) field name from the (partial) field
     * names of the field and its ancestors.
     *
     * @param dict Complete widget annotation dictionary
     */
    protected constructFieldName$(dict: Dict): string;
}
/**
 * Contains all data regarding an annotation's border style.
 */
export declare class AnnotationBorderStyle {
    width: number;
    style: AnnotationBorderStyleType;
    dashArray: number[];
    horizontalCornerRadius: number;
    verticalCornerRadius: number;
    /**
     * Set the width.
     *
     * @param width The width.
     * @param rect The annotation `Rect` entry.
     */
    setWidth(width?: number | Name, rect?: rect_t): void;
    /**
     * Set the style.
     *
     * @param style The annotation style.
     * @see {@link shared/util.js}
     */
    setStyle(style?: Name): void;
    /**
     * Set the dash array.
     *
     * @param dashArray The dash array with at least one element
     */
    setDashArray(dashArray?: DashArray, forceStyle?: boolean): void;
    /**
     * Set the horizontal corner radius (from a Border dictionary).
     *
     * @param radius - The horizontal corner radius.
     */
    setHorizontalCornerRadius(radius: number): void;
    /**
     * Set the vertical corner radius (from a Border dictionary).
     *
     * @param radius - The vertical corner radius.
     */
    setVerticalCornerRadius(radius: number): void;
}
export interface AnnotPoint {
    x: number;
    y: number;
}
declare type AColor = TupleOf<number, 0 | 1 | 3 | 4>;
interface SetDefaultAppearanceParms {
    xref: XRef;
    extra?: string;
    strokeColor?: AColor;
    strokeAlpha?: number | undefined;
    fillColor?: AColor | undefined;
    fillAlpha?: number | undefined;
    blendMode?: string;
    pointsCallback: (buffer: string[], points: TupleOf<AnnotPoint, 4>) => rect_t;
}
/**
 * 12.5.6.2
 */
export declare class MarkupAnnotation extends Annotation {
    creationDate?: string | undefined;
    /**
     * Set the creation date.
     *
     * @param creationDate - PDF date string that indicates when the
     *  annotation was originally created
     */
    setCreationDate(creationDate: unknown): void;
    constructor(parameters: AnnotationCtorParms);
    /** @final */
    protected setDefaultAppearance$({ xref, extra, strokeColor, fillColor, blendMode, strokeAlpha, fillAlpha, pointsCallback, }: SetDefaultAppearanceParms): void;
}
export {};
//# sourceMappingURL=annotation.d.ts.map