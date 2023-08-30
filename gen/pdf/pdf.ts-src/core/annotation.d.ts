import type { point_t, rect_t, TupleOf } from "../../../lib/alias.js";
import type { AnnotStorageRecord, AnnotStorageValue } from "../display/annotation_layer.js";
import type { DocWrapped, FieldWrapped } from "../scripting_api/app.js";
import type { CorrectColor } from "../scripting_api/color.js";
import type { SendData } from "../scripting_api/pdf_object.js";
import { AnnotationBorderStyleType, AnnotationFieldFlag, AnnotationFlag, AnnotationReplyType, AnnotationType, RenderingIntentFlag } from "../shared/util.js";
import { BaseStream } from "./base_stream.js";
import { type BidiText } from "./bidi.js";
import type { Attachments, CatParseDestDictRes } from "./catalog.js";
import { type AnnotActions } from "./core_utils.js";
import type { DatasetReader } from "./dataset_reader.js";
import { type DefaultAppearanceData } from "./default_appearance.js";
import type { LocalIdFactory } from "./document.js";
import { PartialEvaluator } from "./evaluator.js";
import { type Attachment } from "./file_spec.js";
import type { ErrorFont, Font, Glyph } from "./fonts.js";
import { JpegStream } from "./jpeg_stream.js";
import { OperatorList } from "./operator_list.js";
import type { BasePdfManager } from "./pdf_manager.js";
import { Dict, Name, Ref } from "./primitives.js";
import { Stream, StringStream } from "./stream.js";
import type { WorkerTask } from "./worker.js";
import type { XFAHTMLObj } from "./xfa/alias.js";
import type { XRef } from "./xref.js";
type AnnotType = "Caret" | "Circle" | "FileAttachment" | "FreeText" | "Ink" | "Line" | "Link" | "Highlight" | "Polygon" | "PolyLine" | "Popup" | "Stamp" | "Square" | "Squiggly" | "StrikeOut" | "Text" | "Underline" | "Widget";
interface Dependency_ {
    ref: Ref;
    data: string;
}
type CreateNewAnnotationP_ = {
    evaluator?: PartialEvaluator;
    task?: WorkerTask;
    baseFontRef?: Ref;
    isOffscreenCanvasSupported?: boolean | undefined;
} & Partial<AnnotImage>;
export declare class AnnotationFactory {
    #private;
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
    static _create(xref: XRef, ref: Ref, pdfManager: BasePdfManager, idFactory: LocalIdFactory, acroForm: Dict | undefined, attachments: Attachments | undefined, xfaDatasets: DatasetReader | undefined, collectFields: boolean, pageIndex?: number): Annotation | undefined;
    static generateImages(annotations: IterableIterator<AnnotStorageValue> | AnnotStorageValue[], xref: XRef, isOffscreenCanvasSupported: boolean | undefined): Map<string, Promise<AnnotImage>> | undefined;
    static saveNewAnnotations(evaluator: PartialEvaluator, task: WorkerTask, annotations: AnnotStorageValue[], imagePromises: Map<string, Promise<AnnotImage>> | undefined): Promise<{
        annotations: {
            ref: Ref;
            data: string;
        }[];
        dependencies: {
            ref: Ref;
            data: string;
        }[];
    }>;
    static printNewAnnotations(evaluator: PartialEvaluator, task: WorkerTask, annotations: AnnotStorageValue[], imagePromises: Map<string, Promise<AnnotImage>> | undefined): Promise<MarkupAnnotation[] | undefined>;
}
export declare function getQuadPoints(dict: Dict, rect?: rect_t): TupleOf<AnnotPoint, 4>[] | null;
interface _AnnotationCtorP {
    xref: XRef;
    ref: Ref;
    dict: Dict;
    subtype?: AnnotType | undefined;
    id: string;
    pdfManager: BasePdfManager;
    acroForm: Dict;
    attachments: Attachments | undefined;
    xfaDatasets: DatasetReader | undefined;
    collectFields: boolean;
    needAppearances: boolean;
    pageIndex: number;
    isOffscreenCanvasSupported: boolean;
}
export interface RichText {
    str: string | undefined;
    html: XFAHTMLObj;
}
export type AnnotationData = {
    annotationFlags: AnnotationFlag;
    color: Uint8ClampedArray | undefined;
    backgroundColor: Uint8ClampedArray | undefined;
    borderStyle: AnnotationBorderStyle;
    borderColor: Uint8ClampedArray | undefined;
    rotation: number;
    contentsObj: BidiText;
    richText?: RichText | undefined;
    hasAppearance: boolean;
    id: string;
    modificationDate: string | undefined;
    rect: rect_t | undefined;
    subtype?: AnnotType | undefined;
    hasOwnCanvas: boolean;
    noRotate: boolean;
    noHTML: boolean;
    kidIds?: string[];
    actions?: AnnotActions | undefined;
    baseFieldName?: string;
    fieldName?: string;
    pageIndex?: number;
    annotationType?: AnnotationType;
    name?: string;
    state?: string | undefined;
    stateModel?: string | undefined;
    quadPoints?: TupleOf<AnnotPoint, 4>[] | null;
    fieldValue?: string | string[] | undefined;
    defaultFieldValue?: string | string[] | undefined;
    alternativeText?: string;
    defaultAppearance?: string;
    defaultAppearanceData?: DefaultAppearanceData;
    fieldType?: string | undefined;
    fieldFlags?: AnnotationFieldFlag;
    readOnly?: boolean;
    hidden?: boolean;
    required?: boolean;
    textAlignment?: number | undefined;
    maxLen?: number | undefined;
    multiLine?: boolean;
    comb?: boolean;
    doNotScroll?: boolean;
    checkBox?: boolean;
    radioButton?: boolean;
    pushButton?: boolean;
    isTooltipOnly?: boolean;
    exportValue?: string;
    buttonValue?: string | undefined;
    options?: {
        exportValue: string | string[] | undefined;
        displayValue: string | string[] | undefined;
    }[];
    combo?: boolean;
    multiSelect?: boolean;
    inReplyTo?: string | undefined;
    replyType?: AnnotationReplyType;
    titleObj?: BidiText;
    creationDate?: string | undefined;
    popupRef?: string | undefined;
    lineCoordinates?: rect_t;
    vertices?: AnnotPoint[];
    lineEndings?: [
        LineEndingStr_,
        LineEndingStr_
    ];
    inkLists?: AnnotPoint[][];
    file?: Attachment;
    parentType?: string | undefined;
    parentId?: string | undefined;
    parentRect?: rect_t | undefined;
    open?: boolean | undefined;
    textContent?: string[];
} & CatParseDestDictRes;
/**
 * PDF 1.7 Table 56
 */
export type DashArray = [number, number, number] | [number, number] | [number] | [];
export type SaveData = {
    ref: Ref;
    data: string;
    xfa?: {
        path: string | undefined;
        value: string;
    };
    needAppearances?: boolean;
};
export type SaveReturn = TupleOf<SaveData, 1 | 2>;
export interface FieldItem {
    exportValue: string | string[] | undefined;
    displayValue: string | string[] | undefined;
}
export interface FieldObject {
    id: string;
    type: string;
    value?: string | string[] | undefined;
    defaultValue?: string | string[] | undefined;
    editable?: boolean;
    rect?: rect_t | undefined;
    name?: string | undefined;
    hidden?: boolean | undefined;
    actions?: AnnotActions | undefined;
    kidIds?: string[];
    page?: number | undefined;
    strokeColor?: Uint8ClampedArray | CorrectColor | undefined;
    fillColor?: Uint8ClampedArray | CorrectColor | undefined;
    rotation?: number;
    multiline?: boolean | undefined;
    password?: boolean;
    charLimit?: number | undefined;
    comb?: boolean | undefined;
    exportValues?: string | undefined;
    items?: FieldItem[] | undefined;
    numItems?: number;
    multipleSelection?: boolean | undefined;
    send?: (data: SendData) => void;
    globalEval?: (code: string) => unknown;
    doc?: DocWrapped;
    fieldPath?: string;
    appObjects?: Record<string, FieldWrapped>;
    siblings?: string[];
}
type LineEndingStr_ = "None" | "Square" | "Circle" | "Diamond" | "OpenArrow" | "ClosedArrow" | "Butt" | "ROpenArrow" | "RClosedArrow" | "Slash";
type LineEnding_ = LineEndingStr_ | Name;
export declare class Annotation {
    #private;
    ref: Ref | undefined;
    _streams: BaseStream[];
    data: AnnotationData;
    _isOffscreenCanvasSupported: boolean;
    _fallbackFontDict?: Dict;
    _needAppearances: boolean;
    flags: AnnotationFlag;
    /**
     * Set the flags.
     *
     * @param flags Unsigned 32-bit integer specifying annotation characteristics
     * @see {@link shared/util.js}
     */
    setFlags(flags: unknown): void;
    protected _hasFlag(flags: AnnotationFlag, flag: AnnotationFlag): boolean;
    /**
     * Check if a provided flag is set.
     *
     * @param flag Hexadecimal representation for an annotation characteristic
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
     * @final
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
     * @param rectangle The rectangle array with exactly four entries
     */
    setRectangle(rectangle: unknown): void;
    lineEndings: [LineEndingStr_, LineEndingStr_];
    oc: Dict | undefined;
    rotation: number;
    _defaultAppearance: string;
    constructor(params: _AnnotationCtorP);
    setDefaultAppearance(params: _AnnotationCtorP): void;
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
     * Set the line endings; should only be used with specific annotation types.
     * @param lineEndings The line endings array.
     */
    setLineEndings(lineEndings: [LineEnding_, LineEnding_]): void;
    setRotation(mk: Dict | undefined): void;
    /**
     * Set the color for background and border if any.
     * The default values are transparent.
     *
     * @param mk The MK dictionary
     */
    setBorderAndBackgroundColors(mk: Dict | undefined): void;
    /**
     * Set the (normal) appearance.
     *
     * @param dict The annotation's data dictionary
     */
    setAppearance(dict: Dict): void;
    setOptionalContent(dict: Dict): void;
    loadResources(keys: string[], appearance: BaseStream): Promise<Dict | undefined>;
    getOperatorList(evaluator: PartialEvaluator, task: WorkerTask, intent: RenderingIntentFlag, renderForms?: boolean, annotationStorage?: AnnotStorageRecord): Promise<{
        opList: OperatorList;
        separateForm: boolean;
        separateCanvas: boolean;
    }>;
    save(evaluator: PartialEvaluator, task: WorkerTask, annotationStorage?: AnnotStorageRecord): Promise<SaveReturn | undefined>;
    get hasTextContent(): boolean;
    /** @final */
    extractTextContent(evaluator: PartialEvaluator, task: WorkerTask, viewBox: rect_t): Promise<void>;
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
     * @final
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
type AColor = TupleOf<number, 0 | 1 | 3 | 4>;
interface _SetDefaultAppearanceP {
    xref: XRef;
    extra?: string;
    strokeColor?: AColor;
    strokeAlpha?: number | undefined;
    fillColor?: AColor | undefined;
    fillAlpha?: number | undefined;
    blendMode?: string;
    pointsCallback: (buffer: string[], points: TupleOf<AnnotPoint, 4>) => rect_t;
}
interface CreateNewDictP_ {
    apRef?: Ref;
    ap?: StringStream | undefined;
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
    refToReplace?: Ref;
    constructor(params: _AnnotationCtorP);
    static createNewDict(annotation: AnnotStorageValue, xref: XRef, _: CreateNewDictP_): Dict;
    static createNewAppearanceStream(annotation: AnnotStorageValue, xref: XRef, params?: CreateNewAnnotationP_): Promise<StringStream | undefined>;
    /** @final */
    protected setDefaultAppearance$({ xref, extra, strokeColor, fillColor, blendMode, strokeAlpha, fillAlpha, pointsCallback, }: _SetDefaultAppearanceP): void;
    static createNewAnnotation(xref: XRef, annotation: AnnotStorageValue, dependencies: Dependency_[], params?: CreateNewAnnotationP_): Promise<{
        ref: Ref;
        data: string;
    }>;
    static createNewPrintAnnotation(xref: XRef, annotation: AnnotStorageValue, params: CreateNewAnnotationP_): Promise<MarkupAnnotation>;
}
interface FieldResources {
    localResources?: Dict | undefined;
    acroFormResources?: Dict | undefined;
    appearanceResources?: Dict | undefined;
    mergedResources: Dict;
}
interface CachedLines {
    line: string;
    glyphs: Glyph[];
    positions: point_t[];
}
export declare class WidgetAnnotation extends Annotation {
    _hasValueFromXFA?: boolean;
    _fieldResources: FieldResources;
    protected _hasText?: boolean;
    constructor(params: _AnnotationCtorP);
    /**
     * Decode the given form value.
     *
     * @param formValue The (possibly encoded) form value.
     */
    protected _decodeFormValue(formValue: unknown): string | string[] | undefined;
    /**
     * Check if a provided field flag is set.
     *
     * @param flag Hexadecimal representation for an annotation field characteristic
     * @see {@link shared/util.js}
     */
    hasFieldFlag(flag: AnnotationFieldFlag): boolean;
    getRotationMatrix(annotationStorage: AnnotStorageRecord | undefined): number[];
    getBorderAndBackgroundAppearances(annotationStorage: AnnotStorageRecord | undefined): string;
    getOperatorList(evaluator: PartialEvaluator, task: WorkerTask, intent: RenderingIntentFlag, renderForms?: boolean, annotationStorage?: AnnotStorageRecord): Promise<{
        opList: OperatorList;
        separateForm: boolean;
        separateCanvas: boolean;
    }>;
    _getMKDict(rotation: number): Dict | null;
    amendSavedDict(annotationStorage: AnnotStorageRecord | undefined, dict: Dict): void;
    save(evaluator: PartialEvaluator, task: WorkerTask, annotationStorage?: AnnotStorageRecord): Promise<SaveReturn | undefined>;
    _getCombAppearance(defaultAppearance: string, font: Font | ErrorFont, text: string, fontSize: number, width: number, height: number, hPadding: number, vPadding: number, descent: number, lineHeight: number, annotationStorage: AnnotStorageRecord | undefined): string;
    _getMultilineAppearance(defaultAppearance: string, lines: string[], font: Font | ErrorFont, fontSize: number, width: number, height: number, alignment: number, hPadding: number, vPadding: number, descent: number, lineHeight: number, AnnotStorageRecord: AnnotStorageRecord | undefined): string;
    _splitLine(line: string | undefined, font: Font | ErrorFont, fontSize: number, width: number, cache?: CachedLines): string[];
    protected getAppearance$(evaluator: PartialEvaluator, task: WorkerTask, intent: RenderingIntentFlag, annotationStorage?: AnnotStorageRecord): Promise<string | {
        needAppearances: boolean;
    } | undefined>;
    /** For testing only */
    _getAppearance(evaluator: PartialEvaluator, task: WorkerTask, intent: RenderingIntentFlag, annotationStorage?: AnnotStorageRecord): Promise<string | {
        needAppearances: boolean;
    } | undefined>;
    static _getFontData(evaluator: PartialEvaluator, task: WorkerTask, appearanceData: DefaultAppearanceData, resources: Dict): Promise<Font | ErrorFont>;
    protected getTextWidth$(text: string, font: Font | ErrorFont): number;
    protected computeFontSize$(height: number, width: number, text: string, font: Font | ErrorFont, lineCount: number): [string, number, number];
    _renderText(text: string, font: Font | ErrorFont, fontSize: number, totalWidth: number, alignment: number, prevInfo: {
        shift: number;
    }, hPadding: number, vPadding: number): string;
    _getSaveFieldResources(xref: XRef): Dict;
    getFieldObject(): FieldObject | undefined;
}
export declare class PopupAnnotation extends Annotation {
    constructor(params: _AnnotationCtorP);
}
export type AnnotImage = {
    imageStream: Stream | undefined;
    smaskStream: Stream | undefined;
    width: number;
    height: number;
    imageRef?: Ref | JpegStream;
};
export {};
//# sourceMappingURL=annotation.d.ts.map