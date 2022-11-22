/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

/* Copyright 2012 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { _PDFDEV } from "../../../global.ts";
import { Constructor, type TupleOf } from "../../../lib/alias.ts";
import { assert } from "../../../lib/util/trace.ts";
import {
  type AnnotStorageRecord,
  AnnotStorageValue,
} from "../display/annotation_layer.ts";
import { type TextItem } from "../display/api.ts";
import { DocWrapped, FieldWrapped } from "../scripting_api/app.ts";
import { SendData } from "../scripting_api/pdf_object.ts";
import { MActionMap } from "../shared/message_handler.ts";
import {
  AnnotationActionEventType,
  AnnotationBorderStyleType,
  AnnotationEditorType,
  AnnotationFieldFlag,
  AnnotationFlag,
  AnnotationReplyType,
  AnnotationType,
  escapeString,
  getModificationDate,
  IDENTITY_MATRIX,
  isAscii,
  LINE_DESCENT_FACTOR,
  LINE_FACTOR,
  type matrix_t,
  OPS,
  point_t,
  type rect_t,
  RenderingIntentFlag,
  shadow,
  stringToPDFString,
  stringToUTF16BEString,
  stringToUTF8String,
  Util,
  warn,
} from "../shared/util.ts";
import { BaseStream } from "./base_stream.ts";
import { bidi, type BidiText } from "./bidi.ts";
import { Attachments, Catalog, type CatParseDestDictRes } from "./catalog.ts";
import { ColorSpace } from "./colorspace.ts";
import {
  type AnnotActions,
  collectActions,
  getInheritableProperty,
  numberToString,
} from "./core_utils.ts";
import { CipherTransform } from "./crypto.ts";
import { DatasetReader } from "./dataset_reader.ts";
import {
  createDefaultAppearance,
  type DefaultAppearanceData,
  getPdfColor,
  parseDefaultAppearance,
} from "./default_appearance.ts";
import { type LocalIdFactory } from "./document.ts";
import { EvalState, PartialEvaluator } from "./evaluator.ts";
import { type Attachment, FileSpec } from "./file_spec.ts";
import { ErrorFont, Font, Glyph } from "./fonts.ts";
import { ObjectLoader } from "./object_loader.ts";
import { OperatorList } from "./operator_list.ts";
import { BasePdfManager } from "./pdf_manager.ts";
import { Dict, Name, type Obj, Ref, RefSet } from "./primitives.ts";
import { StringStream } from "./stream.ts";
import { WorkerTask } from "./worker.ts";
import { writeDict, writeObject } from "./writer.ts";
import { type XFAHTMLObj } from "./xfa/alias.ts";
import { XFAFactory } from "./xfa/factory.ts";
import { XRef } from "./xref.ts";
/*80--------------------------------------------------------------------------*/

type AnnotType =
  | "Caret"
  | "Circle"
  | "FileAttachment"
  | "FreeText"
  | "Ink"
  | "Line"
  | "Link"
  | "Highlight"
  | "Polygon"
  | "PolyLine"
  | "Popup"
  | "Stamp"
  | "Square"
  | "Squiggly"
  | "StrikeOut"
  | "Text"
  | "Underline"
  | "Widget";

interface _Dependency {
  ref: Ref;
  data: string;
}

interface _CreateNewAnnotationP {
  evaluator: PartialEvaluator;
  task: WorkerTask;
  baseFontRef?: Ref;
}

export class AnnotationFactory {
  /**
   * Create an `Annotation` object of the correct type for the given reference
   * to an annotation dictionary. This yields a promise that is resolved when
   * the `Annotation` object is constructed.
   *
   * @return A promise that is resolved with an {Annotation} instance.
   */
  static create(
    xref: XRef,
    ref: Ref,
    pdfManager: BasePdfManager,
    idFactory: LocalIdFactory,
    collectFields?: boolean,
  ) {
    return Promise.all([
      pdfManager.ensureCatalog("acroForm"),
      // Only necessary to prevent the `pdfManager.docBaseUrl`-getter, used
      // with certain Annotations, from throwing and thus breaking parsing:
      pdfManager.ensureCatalog("baseUrl"),
      // Only necessary in the `Catalog.parseDestDictionary`-method,
      // when parsing "GoToE" actions:
      pdfManager.ensureCatalog("attachments"),
      pdfManager.ensureDoc("xfaDatasets"),
      collectFields ? this.#getPageIndex(xref, ref, pdfManager) : -1,
    ]).then(([acroForm, baseUrl, attachments, xfaDatasets, pageIndex]) =>
      pdfManager.ensure(this, "_create", [
        xref,
        ref,
        pdfManager,
        idFactory,
        acroForm,
        attachments,
        xfaDatasets,
        collectFields,
        pageIndex,
      ])
    );
  }

  /**
   * @private
   */
  static _create(
    xref: XRef,
    ref: Ref,
    pdfManager: BasePdfManager,
    idFactory: LocalIdFactory,
    acroForm: Dict | undefined,
    attachments: Attachments | undefined,
    xfaDatasets: DatasetReader | undefined,
    collectFields: boolean,
    pageIndex = -1,
  ): Annotation | undefined {
    const dict = <Dict> xref.fetchIfRef(ref); // Table 164
    if (!(dict instanceof Dict)) {
      return undefined;
    }

    const id = ref instanceof Ref
      ? ref.toString()
      : `annot_${idFactory.createObjId()}`;

    // Determine the annotation's subtype.
    const subtypename = dict.get("Subtype");
    const subtype = subtypename instanceof Name
      ? subtypename.name as AnnotType
      : undefined;

    // Return the right annotation object based on the subtype and field type.
    const parameters: _AnnotationCtorP = {
      xref,
      ref,
      dict,
      subtype,
      id,
      pdfManager,
      acroForm: acroForm instanceof Dict ? acroForm : Dict.empty,
      attachments,
      xfaDatasets,
      collectFields,
      pageIndex,
    };

    switch (subtype) {
      case "Link":
        return new LinkAnnotation(parameters);

      case "Text":
        return new TextAnnotation(parameters);

      case "Widget":
        let fieldType = getInheritableProperty({ dict, key: "FT" });
        fieldType = fieldType instanceof Name ? fieldType.name : undefined;

        switch (fieldType) {
          case "Tx":
            return new TextWidgetAnnotation(parameters);
          case "Btn":
            return new ButtonWidgetAnnotation(parameters);
          case "Ch":
            return new ChoiceWidgetAnnotation(parameters);
          case "Sig":
            return new SignatureWidgetAnnotation(parameters);
        }
        warn(
          `Unimplemented widget field type "${fieldType}", ` +
            "falling back to base field type.",
        );
        return new WidgetAnnotation(parameters);

      case "Popup":
        return new PopupAnnotation(parameters);

      case "FreeText":
        return new FreeTextAnnotation(parameters);

      case "Line":
        return new LineAnnotation(parameters);

      case "Square":
        return new SquareAnnotation(parameters);

      case "Circle":
        return new CircleAnnotation(parameters);

      case "PolyLine":
        return new PolylineAnnotation(parameters);

      case "Polygon":
        return new PolygonAnnotation(parameters);

      case "Caret":
        return new CaretAnnotation(parameters);

      case "Ink":
        return new InkAnnotation(parameters);

      case "Highlight":
        return new HighlightAnnotation(parameters);

      case "Underline":
        return new UnderlineAnnotation(parameters);

      case "Squiggly":
        return new SquigglyAnnotation(parameters);

      case "StrikeOut":
        return new StrikeOutAnnotation(parameters);

      case "Stamp":
        return new StampAnnotation(parameters);

      case "FileAttachment":
        return new FileAttachmentAnnotation(parameters);

      default:
        if (!collectFields) {
          if (!subtype) {
            warn("Annotation is missing the required /Subtype.");
          } else {
            warn(
              `Unimplemented annotation type "${subtype}", ` +
                "falling back to base annotation.",
            );
          }
        }
        return new Annotation(parameters);
    }
  }

  static async #getPageIndex(xref: XRef, ref: Ref, pdfManager: BasePdfManager) {
    try {
      const annotDict = await xref.fetchIfRefAsync(ref);
      if (!(annotDict instanceof Dict)) {
        return -1;
      }

      const pageRef = annotDict.getRaw("P");
      if (!(pageRef instanceof Ref)) {
        return -1;
      }

      const pageIndex = await pdfManager.ensureCatalog("getPageIndex", [
        pageRef,
      ]);
      return pageIndex;
    } catch (ex) {
      warn(`#getPageIndex: "${ex}".`);
      return -1;
    }
  }

  static async saveNewAnnotations(
    evaluator: PartialEvaluator,
    task: WorkerTask,
    annotations: AnnotStorageValue[],
  ) {
    const xref = evaluator.xref;
    let baseFontRef;
    const dependencies = [];
    const promises = [];

    for (const annotation of annotations) {
      switch (annotation.annotationType) {
        case AnnotationEditorType.FREETEXT:
          if (!baseFontRef) {
            const baseFont = new Dict(xref);
            baseFont.set("BaseFont", Name.get("Helvetica"));
            baseFont.set("Type", Name.get("Font"));
            baseFont.set("Subtype", Name.get("Type1"));
            baseFont.set("Encoding", Name.get("WinAnsiEncoding"));
            const buffer: string[] = [];
            baseFontRef = xref.getNewRef();
            writeObject(baseFontRef, baseFont, buffer, undefined);
            dependencies.push({ ref: baseFontRef, data: buffer.join("") });
          }
          promises.push(
            FreeTextAnnotation.createNewAnnotation(
              xref,
              annotation,
              dependencies,
              { evaluator, task, baseFontRef },
            ),
          );
          break;
        case AnnotationEditorType.INK:
          promises.push(
            InkAnnotation.createNewAnnotation(xref, annotation, dependencies),
          );
      }
    }

    return {
      annotations: await Promise.all(promises),
      dependencies,
    };
  }

  static async printNewAnnotations(
    evaluator: PartialEvaluator,
    task: WorkerTask,
    annotations: AnnotStorageValue[],
  ) {
    if (!annotations) {
      return undefined;
    }

    const xref = evaluator.xref;
    const promises: Promise<MarkupAnnotation>[] = [];
    for (const annotation of annotations) {
      switch (annotation.annotationType) {
        case AnnotationEditorType.FREETEXT:
          promises.push(
            FreeTextAnnotation.createNewPrintAnnotation(xref, annotation, {
              evaluator,
              task,
            }),
          );
          break;
        case AnnotationEditorType.INK:
          promises.push(
            InkAnnotation.createNewPrintAnnotation(xref, annotation),
          );
          break;
      }
    }

    return Promise.all(promises);
  }
}

function getRgbColor(color: number[], defaultColor = new Uint8ClampedArray(3)) {
  if (!Array.isArray(color)) {
    return defaultColor;
  }

  const rgbColor = defaultColor || new Uint8ClampedArray(3);
  switch (color.length) {
    case 0: // Transparent, which we indicate with a null value
      return undefined;

    case 1: // Convert grayscale to RGB
      ColorSpace.singletons.gray.getRgbItem(color, 0, rgbColor, 0);
      return rgbColor;

    case 3: // Convert RGB percentages to RGB
      ColorSpace.singletons.rgb.getRgbItem(color, 0, rgbColor, 0);
      return rgbColor;

    case 4: // Convert CMYK to RGB
      ColorSpace.singletons.cmyk.getRgbItem(color, 0, rgbColor, 0);
      return rgbColor;

    default:
      return defaultColor;
  }
}

export function getQuadPoints(
  dict: Dict,
  rect?: rect_t,
): TupleOf<AnnotPoint, 4>[] | null {
  if (!dict.has("QuadPoints")) {
    return null;
  }

  // The region is described as a number of quadrilaterals.
  // Each quadrilateral must consist of eight coordinates.
  const quadPoints = <number[]> dict.getArray("QuadPoints");
  if (
    !Array.isArray(quadPoints) ||
    quadPoints.length === 0 ||
    quadPoints.length % 8 > 0
  ) {
    return null;
  }

  const quadPointsLists: AnnotPoint[][] = [];
  for (let i = 0, ii = quadPoints.length / 8; i < ii; i++) {
    // Each series of eight numbers represents the coordinates for one
    // quadrilateral in the order [x1, y1, x2, y2, x3, y3, x4, y4].
    // Convert this to an array of objects with x and y coordinates.
    quadPointsLists.push([]);
    for (let j = i * 8, jj = i * 8 + 8; j < jj; j += 2) {
      const x = quadPoints[j];
      const y = quadPoints[j + 1];

      // The quadpoints should be ignored if any coordinate in the array
      // lies outside the region specified by the rectangle. The rectangle
      // can be `null` for markup annotations since their rectangle may be
      // incorrect (fixes bug 1538111).
      if (
        rect !== undefined &&
        (x < rect[0] || x > rect[2] || y < rect[1] || y > rect[3])
      ) {
        return null;
      }
      quadPointsLists[i].push({ x, y });
    }
  }

  // The PDF specification states in section 12.5.6.10 (figure 64) that the
  // order of the quadpoints should be bottom left, bottom right, top right
  // and top left. However, in practice PDF files use a different order,
  // namely bottom left, bottom right, top left and top right (this is also
  // mentioned on https://github.com/highkite/pdfAnnotate#QuadPoints), so
  // this is the actual order we should work with. However, the situation is
  // even worse since Adobe's own applications and other applications violate
  // the specification and create annotations with other orders, namely top
  // left, top right, bottom left and bottom right or even top left, top right,
  // bottom right and bottom left. To avoid inconsistency and broken rendering,
  // we normalize all lists to put the quadpoints in the same standard order
  // (see https://stackoverflow.com/a/10729881).
  return quadPointsLists.map((quadPointsList) => {
    const [minX, maxX, minY, maxY] = quadPointsList.reduce(
      ([mX, MX, mY, MY], quadPoint) => [
        Math.min(mX, quadPoint.x),
        Math.max(MX, quadPoint.x),
        Math.min(mY, quadPoint.y),
        Math.max(MY, quadPoint.y),
      ],
      [Number.MAX_VALUE, Number.MIN_VALUE, Number.MAX_VALUE, Number.MIN_VALUE],
    );
    return [
      { x: minX, y: maxY },
      { x: maxX, y: maxY },
      { x: minX, y: minY },
      { x: maxX, y: minY },
    ];
  });
}

function getTransformMatrix(rect: rect_t, bbox: rect_t, matrix: matrix_t) {
  // 12.5.5: Algorithm: Appearance streams
  const [minX, minY, maxX, maxY] = Util.getAxialAlignedBoundingBox(
    bbox,
    matrix,
  );
  if (minX === maxX || minY === maxY) {
    // From real-life file, bbox was [0, 0, 0, 0]. In this case,
    // just apply the transform for rect
    return [1, 0, 0, 1, rect[0], rect[1]];
  }

  const xRatio = (rect[2] - rect[0]) / (maxX - minX);
  const yRatio = (rect[3] - rect[1]) / (maxY - minY);
  return [
    xRatio,
    0,
    0,
    yRatio,
    rect[0] - minX * xRatio,
    rect[1] - minY * yRatio,
  ];
}

interface _AnnotationCtorP {
  xref: XRef;
  ref: Ref;
  dict: Dict; // Table 164
  subtype?: AnnotType | undefined;
  id: string;
  pdfManager: BasePdfManager;
  acroForm: Dict;
  attachments: Attachments | undefined;
  xfaDatasets: DatasetReader | undefined;
  collectFields: boolean;
  pageIndex: number;
}

export interface RichText {
  str: string | undefined;
  html: XFAHTMLObj;
}

export type AnnotationData =
  & {
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
    rect: rect_t;
    subtype?: AnnotType | undefined;
    hasOwnCanvas: boolean;

    kidIds?: string[];
    actions?: AnnotActions | undefined;
    fieldName?: string;
    pageIndex?: number;

    annotationType?: AnnotationType;

    name?: string;
    state?: string | undefined;
    stateModel?: string | undefined;

    quadPoints?: TupleOf<AnnotPoint, 4>[] | null;

    /* WidgetAnnotation */
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
    /* ~ */

    /* TextWidgetAnnotation */
    textAlignment?: number | undefined;
    maxLen?: number | undefined;
    multiLine?: boolean;
    comb?: boolean;
    doNotScroll?: boolean;
    /* ~ */

    /* ButtonWidgetAnnotation */
    checkBox?: boolean;
    radioButton?: boolean;
    pushButton?: boolean;
    isTooltipOnly?: boolean;
    exportValue?: string;
    buttonValue?: string | undefined;
    /* ~ */

    /* ChoiceWidgetAnnotation */
    options?: {
      exportValue: string | string[] | undefined;
      displayValue: string | string[] | undefined;
    }[];
    combo?: boolean;
    multiSelect?: boolean;
    /* ~ */

    /* MarkupAnnotation */
    inReplyTo?: string | undefined;
    replyType?: AnnotationReplyType;
    titleObj?: BidiText;
    creationDate?: string | undefined;
    hasPopup?: boolean;
    /* ~ */

    lineCoordinates?: rect_t; /* LineAnnotation */

    vertices?: AnnotPoint[]; /* PolylineAnnotation */

    lineEndings?: [
      _LineEndingStr,
      _LineEndingStr,
    ]; /* LineAnnotation, PolylineAnnotation */

    inkLists?: AnnotPoint[][]; /* InkAnnotation */

    //

    file?: Attachment; /* FileAttachmentAnnotation */

    /* PopupAnnotation */
    parentType?: string | undefined;
    parentId?: string | undefined;
    parentRect?: rect_t;
    /* ~ */

    textContent?: string[];
  }
  & CatParseDestDictRes;

/**
 * PDF 1.7 Table 56
 */
export type DashArray =
  | [number, number, number]
  | [number, number]
  | [number]
  | [];

export type SaveData = {
  ref: Ref;
  data: string;
  xfa?: {
    path: string;
    value: string;
  };
};
export type SaveReturn = TupleOf<SaveData, 1 | 2>;

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

  send?: (data: SendData) => void;
  globalEval?: (code: string) => unknown;
  doc?: DocWrapped;
  fieldPath?: string;
  appObjects?: Record<string, FieldWrapped>;
  siblings?: string[];
}

type _LineEndingStr =
  | "None"
  | "Square"
  | "Circle"
  | "Diamond"
  | "OpenArrow"
  | "ClosedArrow"
  | "Butt"
  | "ROpenArrow"
  | "RClosedArrow"
  | "Slash";
type _LineEnding = _LineEndingStr | Name;

export class Annotation {
  _streams: BaseStream[] = [];

  data: AnnotationData;

  _fallbackFontDict?: Dict;

  /* flags */
  flags!: AnnotationFlag;

  /**
   * Set the flags.
   *
   * @param flags Unsigned 32-bit integer specifying annotation characteristics
   * @see {@link shared/util.js}
   */
  setFlags(flags: unknown) {
    this.flags = Number.isInteger(flags) && (flags as number) > 0
      ? (flags as number)
      : 0;
  }

  protected _hasFlag(flags: AnnotationFlag, flag: AnnotationFlag) {
    return !!(flags & flag);
  }
  /**
   * Check if a provided flag is set.
   *
   * @param flag Hexadecimal representation for an annotation characteristic
   * @see {@link shared/util.js}
   */
  hasFlag(flag: AnnotationFlag) {
    return this._hasFlag(this.flags, flag);
  }

  protected _isViewable(flags: AnnotationFlag) {
    return !this._hasFlag(flags, AnnotationFlag.INVISIBLE) &&
      !this._hasFlag(flags, AnnotationFlag.NOVIEW);
  }
  get viewable() {
    if (this.data.quadPoints === null) {
      return false;
    }
    if (this.flags === 0) {
      return true;
    }
    return this._isViewable(this.flags);
  }
  /**
   * Check if the annotation must be displayed by taking into account
   * the value found in the annotationStorage which may have been set
   * through JS.
   *
   * @param annotationStorage Storage for annotation
   */
  mustBeViewed(annotationStorage?: AnnotStorageRecord) {
    const storageEntry = annotationStorage &&
      annotationStorage.get(this.data.id);
    if (storageEntry && storageEntry.hidden !== undefined) {
      return !storageEntry.hidden;
    }
    return this.viewable && !this._hasFlag(this.flags, AnnotationFlag.HIDDEN);
  }

  #isPrintable(flags: AnnotationFlag) {
    return this._hasFlag(flags, AnnotationFlag.PRINT) &&
      !this._hasFlag(flags, AnnotationFlag.INVISIBLE);
  }
  get printable() {
    if (this.data.quadPoints === null) {
      return false;
    }
    if (<number> this.flags === 0) {
      return false;
    }
    return this.#isPrintable(this.flags);
  }
  /**
   * Check if the annotation must be printed by taking into account
   * the value found in the annotationStorage which may have been set
   * through JS.
   *
   * @final
   * @param annotationStorage Storage for annotation
   */
  mustBePrinted(annotationStorage?: AnnotStorageRecord) {
    const storageEntry = annotationStorage &&
      annotationStorage.get(this.data.id);
    if (storageEntry && storageEntry.print !== undefined) {
      return storageEntry.print;
    }
    return this.printable;
  }
  /* ~ */

  color: Uint8ClampedArray | undefined;
  borderStyle!: AnnotationBorderStyle;
  borderColor: Uint8ClampedArray | undefined;
  backgroundColor: Uint8ClampedArray | undefined;

  /* _title */
  _title!: BidiText;

  /**
   * Set the title.
   *
   * @final
   * @param The title of the annotation, used e.g. with
   *   PopupAnnotations.
   */
  setTitle(title: unknown) {
    this._title = this.#parseStringHelper(title);
  }
  /* ~ */

  /* contents */
  _contents!: BidiText;

  /**
   * Set the contents.
   *
   * @param contents Text to display for the annotation or, if the
   *  type of annotation does not display text, a
   *  description of the annotation's contents
   */
  setContents(contents?: string) {
    this._contents = this.#parseStringHelper(contents);
  }
  /* ~ */

  appearance?: BaseStream | undefined;

  /* modificationDate */
  modificationDate: string | undefined;

  /**
   * Set the modification date.
   *
   * @param modificationDate - PDF date string that indicates when the
   *  annotation was last modified
   */
  setModificationDate(modificationDate: unknown) {
    this.modificationDate = typeof modificationDate === "string"
      ? modificationDate
      : undefined;
  }
  /* ~ */

  /* rectangle */
  rectangle!: rect_t;

  /**
   * Set the rectangle.
   *
   * @param rectangle The rectangle array with exactly four entries
   */
  setRectangle(rectangle: unknown) {
    if (Array.isArray(rectangle) && rectangle.length === 4) {
      this.rectangle = Util.normalizeRect(<rect_t> rectangle);
    } else {
      this.rectangle = [0, 0, 0, 0];
    }
  }
  /* ~ */

  lineEndings!: [_LineEndingStr, _LineEndingStr];
  oc: Dict | undefined;
  rotation!: number;

  constructor(params: _AnnotationCtorP) {
    const dict = params.dict; // Table 164

    this.setTitle(dict.get("T"));
    this.setContents(<string | undefined> dict.get("Contents"));
    this.setModificationDate(dict.get("M"));
    this.setFlags(dict.get("F"));
    this.setRectangle(dict.getArray("Rect"));
    this.setColor(<number[]> dict.getArray("C"));
    this.setBorderStyle(dict);
    this.setAppearance(dict);
    this.setOptionalContent(dict);

    const MK = dict.get("MK") as Dict | undefined; // Table 187
    this.setBorderAndBackgroundColors(MK);
    this.setRotation(MK);

    if (this.appearance) {
      this._streams.push(this.appearance);
    }

    // Expose public properties using a data object.
    this.data = {
      annotationFlags: this.flags,
      borderStyle: this.borderStyle,
      color: this.color,
      backgroundColor: this.backgroundColor,
      borderColor: this.borderColor,
      rotation: this.rotation,
      contentsObj: this._contents,
      hasAppearance: !!this.appearance,
      id: params.id,
      modificationDate: this.modificationDate,
      rect: this.rectangle,
      subtype: params.subtype,
      hasOwnCanvas: false,
    };

    if (params.collectFields) {
      // Fields can act as container for other fields and have
      // some actions even if no Annotation inherit from them.
      // Those fields can be referenced by CO (calculation order).
      const kids = dict.get("Kids");
      if (Array.isArray(kids)) {
        const kidIds = [];
        for (const kid of kids) {
          if (kid instanceof Ref) {
            kidIds.push(kid.toString());
          }
        }
        if (kidIds.length !== 0) {
          this.data.kidIds = kidIds;
        }
      }

      this.data.actions = collectActions(
        params.xref,
        dict,
        AnnotationActionEventType,
      );
      this.data.fieldName = this.constructFieldName$(dict);
      this.data.pageIndex = params.pageIndex;
    }
  }

  #parseStringHelper(data: unknown): BidiText {
    const str = typeof data === "string" ? stringToPDFString(data) : "";
    const dir = str && bidi(str).dir === "rtl" ? "rtl" : "ltr";

    return { str, dir };
  }

  /**
   * Set the border style (as AnnotationBorderStyle object).
   *
   * @param borderStyle - The border style dictionary
   */
  setBorderStyle(borderStyle: Dict) {
    /*#static*/ if (_PDFDEV) {
      assert(this.rectangle, "setRectangle must have been called previously.");
    }

    this.borderStyle = new AnnotationBorderStyle();
    if (!(borderStyle instanceof Dict)) {
      return;
    }
    if (borderStyle.has("BS")) {
      const dict = <Dict> borderStyle.get("BS");
      const dictType = dict.get("Type");

      if (
        !dictType || (dictType instanceof Name && dictType.name === "Border")
      ) {
        this.borderStyle.setWidth(
          <number | undefined> dict.get("W"),
          this.rectangle,
        );
        this.borderStyle.setStyle(<Name | undefined> dict.get("S"));
        this.borderStyle.setDashArray(
          <DashArray | undefined> dict.getArray("D"),
        );
      }
    } else if (borderStyle.has("Border")) {
      const array = <[
        number,
        number,
        number,
        DashArray | undefined,
      ]> borderStyle.getArray("Border");
      if (Array.isArray(array) && array.length >= 3) {
        this.borderStyle.setHorizontalCornerRadius(array[0]);
        this.borderStyle.setVerticalCornerRadius(array[1]);
        this.borderStyle.setWidth(array[2], this.rectangle);

        if (array.length === 4) {
          // Dash array available
          this.borderStyle.setDashArray(array[3], /* forceStyle = */ true);
        }
      }
    } else {
      // There are no border entries in the dictionary. According to the
      // specification, we should draw a solid border of width 1 in that
      // case, but Adobe Reader did not implement that part of the
      // specification and instead draws no border at all, so we do the same.
      // See also https://github.com/mozilla/pdf.js/issues/6179.
      this.borderStyle.setWidth(0);
    }
  }

  /**
   * Set the color and take care of color space conversion.
   * The default value is black, in RGB color space.
   *
   * @param color The color array containing either 0
   *  (transparent), 1 (grayscale), 3 (RGB) or 4 (CMYK) elements
   */
  setColor(color: number[]) {
    this.color = getRgbColor(color);
  }

  /**
   * Set the line endings; should only be used with specific annotation types.
   * @param lineEndings The line endings array.
   */
  setLineEndings(lineEndings: [_LineEnding, _LineEnding]) {
    this.lineEndings = ["None", "None"]; // The default values.

    if (Array.isArray(lineEndings) && lineEndings.length === 2) {
      for (let i = 0; i < 2; i++) {
        const obj = lineEndings[i];

        if (obj instanceof Name) {
          switch (obj.name) {
            case "None":
              continue;
            case "Square":
            case "Circle":
            case "Diamond":
            case "OpenArrow":
            case "ClosedArrow":
            case "Butt":
            case "ROpenArrow":
            case "RClosedArrow":
            case "Slash":
              this.lineEndings[i] = obj.name;
              continue;
          }
        }
        warn(`Ignoring invalid lineEnding: ${obj}`);
      }
    }
  }

  setRotation(mk: Dict | undefined) {
    this.rotation = 0;
    if (mk instanceof Dict) {
      let angle = <number | undefined> mk.get("R") || 0;
      if (Number.isInteger(angle) && angle !== 0) {
        angle %= 360;
        if (angle < 0) {
          angle += 360;
        }
        if (angle % 90 === 0) {
          this.rotation = angle;
        }
      }
    }
  }

  /**
   * Set the color for background and border if any.
   * The default values are transparent.
   *
   * @param mk The MK dictionary
   */
  setBorderAndBackgroundColors(mk: Dict | undefined) {
    if (mk instanceof Dict) {
      this.borderColor = getRgbColor(<number[]> mk.getArray("BC"));
      this.backgroundColor = getRgbColor(<number[]> mk.getArray("BG"));
    } else {
      this.borderColor = this.backgroundColor = undefined;
    }
  }

  /**
   * Set the (normal) appearance.
   *
   * @param dict The annotation's data dictionary
   */
  setAppearance(dict: Dict) {
    this.appearance = undefined;

    const appearanceStates = dict.get("AP");
    if (!(appearanceStates instanceof Dict)) {
      return;
    }

    // In case the normal appearance is a stream, then it is used directly.
    const normalAppearanceState = appearanceStates.get("N");
    if (normalAppearanceState instanceof BaseStream) {
      this.appearance = normalAppearanceState;
      return;
    }
    if (!(normalAppearanceState instanceof Dict)) {
      return;
    }

    // In case the normal appearance is a dictionary, the `AS` entry provides
    // the key of the stream in this dictionary.
    const as = dict.get("AS");
    if (!(as instanceof Name) || !normalAppearanceState.has(as.name)) {
      return;
    }
    this.appearance = <BaseStream> normalAppearanceState.get(as.name);
  }

  setOptionalContent(dict: Dict) {
    this.oc = undefined;

    const oc = dict.get("OC"); // Table 164
    if (oc instanceof Name) {
      warn("setOptionalContent: Support for /Name-entry is not implemented.");
    } else if (oc instanceof Dict) {
      this.oc = oc;
    }
  }

  loadResources(keys: string[], appearance: BaseStream) {
    return appearance.dict!.getAsync<Dict>("Resources").then((resources) => {
      if (!resources) {
        return undefined;
      }

      const objectLoader = new ObjectLoader(resources, keys, resources.xref!);
      return objectLoader.load().then(() => resources);
    });
  }

  async getOperatorList(
    evaluator: PartialEvaluator,
    task: WorkerTask,
    intent: RenderingIntentFlag,
    renderForms?: boolean,
    annotationStorage?: AnnotStorageRecord,
  ) {
    const data = this.data;
    let appearance = this.appearance;
    const isUsingOwnCanvas = !!(
      this.data.hasOwnCanvas && intent & RenderingIntentFlag.DISPLAY
    );
    if (!appearance) {
      if (!isUsingOwnCanvas) {
        return {
          opList: new OperatorList(),
          separateForm: false,
          separateCanvas: false,
        };
      }
      appearance = new StringStream("");
      appearance.dict = new Dict();
    }

    const appearanceDict = appearance.dict!;
    const resources = await this.loadResources(
      ["ExtGState", "ColorSpace", "Pattern", "Shading", "XObject", "Font"],
      appearance,
    );
    const bbox = <rect_t> appearanceDict.getArray("BBox") || [0, 0, 1, 1];
    const matrix = <matrix_t> appearanceDict.getArray("Matrix") ||
      [1, 0, 0, 1, 0, 0];
    const transform = getTransformMatrix(data.rect, bbox, matrix);

    const opList = new OperatorList();

    let optionalContent;
    if (this.oc) {
      optionalContent = await evaluator.parseMarkedContentProps(
        this.oc,
        /* resources = */ undefined,
      );
    }
    if (optionalContent !== undefined) {
      opList.addOp(OPS.beginMarkedContentProps, ["OC", optionalContent]);
    }

    opList.addOp(OPS.beginAnnotation, [
      data.id,
      data.rect,
      transform,
      matrix,
      isUsingOwnCanvas,
    ]);

    await evaluator.getOperatorList({
      stream: appearance!,
      task,
      resources,
      operatorList: opList,
      fallbackFontDict: this._fallbackFontDict,
    });
    opList.addOp(OPS.endAnnotation, []);

    if (optionalContent !== undefined) {
      opList.addOp(OPS.endMarkedContent, []);
    }
    this.reset();
    return { opList, separateForm: false, separateCanvas: isUsingOwnCanvas };
  }

  async save(
    evaluator: PartialEvaluator,
    task: WorkerTask,
    annotationStorage?: AnnotStorageRecord,
  ): Promise<SaveReturn | undefined> {
    return undefined;
  }

  get hasTextContent() {
    return false;
  }

  /** @final */
  async extractTextContent(
    evaluator: PartialEvaluator,
    task: WorkerTask,
    viewBox: rect_t,
  ) {
    if (!this.appearance) {
      return;
    }

    const resources = await this.loadResources(
      ["ExtGState", "Font", "Properties", "XObject"],
      this.appearance,
    );

    const text: string[] = [];
    const buffer: string[] = [];
    const sink = {
      desiredSize: Infinity,
      // ready: true, //kkkk bug? ✅
      ready: Promise.resolve(),

      enqueue(chunk: MActionMap["GetTextContent"]["Sinkchunk"], size: number) {
        for (const item of chunk.items) {
          buffer.push((item as TextItem).str);
          if ((item as TextItem).hasEOL) {
            text.push(buffer.join(""));
            buffer.length = 0;
          }
        }
      },
    };

    await evaluator.getTextContent({
      stream: this.appearance,
      task,
      resources,
      includeMarkedContent: true,
      combineTextItems: true,
      sink,
      viewBox,
    });
    this.reset();

    if (buffer.length) {
      text.push(buffer.join(""));
    }

    if (text.length > 0) {
      this.data.textContent = text;
    }
  }

  /**
   * Get field data for usage in JS sandbox.
   *
   * Field object is defined here:
   * https://www.adobe.com/content/dam/acom/en/devnet/acrobat/pdfs/js_api_reference.pdf#page=16
   */
  getFieldObject() {
    if (this.data.kidIds) {
      return <FieldObject> {
        id: this.data.id,
        actions: this.data.actions,
        name: this.data.fieldName,
        strokeColor: this.data.borderColor,
        fillColor: this.data.backgroundColor,
        type: "",
        kidIds: this.data.kidIds,
        page: this.data.pageIndex,
        rotation: this.rotation,
      };
    }
    return undefined;
  }

  /**
   * Reset the annotation.
   *
   * This involves resetting the various streams that are either cached on the
   * annotation instance or created during its construction.
   */
  reset() {
    /*#static*/ if (_PDFDEV) {
      if (
        this.appearance &&
        !this._streams.includes(this.appearance)
      ) {
        assert(0, "The appearance stream should always be reset.");
      }
    }

    for (const stream of this._streams) {
      stream.reset();
    }
  }

  /**
   * Construct the (fully qualified) field name from the (partial) field
   * names of the field and its ancestors.
   *
   * @final
   * @param dict Complete widget annotation dictionary
   */
  protected constructFieldName$(dict: Dict) {
    // Both the `Parent` and `T` fields are optional. While at least one of
    // them should be provided, bad PDF generators may fail to do so.
    if (!dict.has("T") && !dict.has("Parent")) {
      warn("Unknown field name, falling back to empty field name.");
      return "";
    }

    // If no parent exists, the partial and fully qualified names are equal.
    if (!dict.has("Parent")) {
      return stringToPDFString(<string> dict.get("T"));
    }

    // Form the fully qualified field name by appending the partial name to
    // the parent's fully qualified name, separated by a period.
    const fieldName = [];
    if (dict.has("T")) {
      fieldName.unshift(stringToPDFString(<string> dict.get("T")));
    }

    let loopDict = dict;
    const visited = new RefSet();
    if (dict.objId) {
      visited.put(dict.objId);
    }
    while (loopDict.has("Parent")) {
      loopDict = <Dict> loopDict.get("Parent");
      if (
        !(loopDict instanceof Dict) ||
        (loopDict.objId && visited.has(loopDict.objId))
      ) {
        // Even though it is not allowed according to the PDF specification,
        // bad PDF generators may provide a `Parent` entry that is not a
        // dictionary, but `null` for example (issue 8143).
        //
        // If parent has been already visited, it means that we're
        // in an infinite loop.
        break;
      }
      if (loopDict.objId) {
        visited.put(loopDict.objId);
      }

      if (loopDict.has("T")) {
        fieldName.unshift(stringToPDFString(<string> loopDict.get("T")));
      }
    }
    return fieldName.join(".");
  }
}

/**
 * Contains all data regarding an annotation's border style.
 */
export class AnnotationBorderStyle {
  width = 1;
  style = AnnotationBorderStyleType.SOLID;
  dashArray = [3];
  horizontalCornerRadius = 0;
  verticalCornerRadius = 0;

  /**
   * Set the width.
   *
   * @param width The width.
   * @param rect The annotation `Rect` entry.
   */
  setWidth(width?: number | Name, rect: rect_t = [0, 0, 0, 0]) {
    /*#static*/ if (_PDFDEV) {
      assert(
        Array.isArray(rect) && rect.length === 4,
        "A valid `rect` parameter must be provided.",
      );
    }

    // Some corrupt PDF generators may provide the width as a `Name`,
    // rather than as a number (fixes issue 10385).
    if (width instanceof Name) {
      this.width = 0; // This is consistent with the behaviour in Adobe Reader.
      return;
    }
    if (typeof width === "number") {
      if (width! > 0) {
        const maxWidth = (rect[2] - rect[0]) / 2;
        const maxHeight = (rect[3] - rect[1]) / 2;

        // Ignore large `width`s, since they lead to the Annotation overflowing
        // the size set by the `Rect` entry thus causing the `annotationLayer`
        // to render it over the surrounding document (fixes bug1552113.pdf).
        if (
          maxWidth > 0 &&
          maxHeight > 0 &&
          (width! > maxWidth || width! > maxHeight)
        ) {
          warn(`AnnotationBorderStyle.setWidth - ignoring width: ${width}`);
          width = 1;
        }
      }
      this.width = width!;
    }
  }

  /**
   * Set the style.
   *
   * @param style The annotation style.
   * @see {@link shared/util.js}
   */
  setStyle(style?: Name) {
    if (!(style instanceof Name)) {
      return;
    }
    switch (style.name) {
      case "S":
        this.style = AnnotationBorderStyleType.SOLID;
        break;

      case "D":
        this.style = AnnotationBorderStyleType.DASHED;
        break;

      case "B":
        this.style = AnnotationBorderStyleType.BEVELED;
        break;

      case "I":
        this.style = AnnotationBorderStyleType.INSET;
        break;

      case "U":
        this.style = AnnotationBorderStyleType.UNDERLINE;
        break;

      default:
        break;
    }
  }

  /**
   * Set the dash array.
   *
   * @param dashArray The dash array with at least one element
   */
  setDashArray(dashArray?: DashArray, forceStyle = false) {
    // We validate the dash array, but we do not use it because CSS does not
    // allow us to change spacing of dashes. For more information, visit
    // http://www.w3.org/TR/css3-background/#the-border-style.
    if (Array.isArray(dashArray) && dashArray.length > 0) {
      // According to the PDF specification: the elements in `dashArray`
      // shall be numbers that are nonnegative and not all equal to zero.
      let isValid = true;
      let allZeros = true;
      for (const element of dashArray) {
        const validNumber = +element >= 0;
        if (!validNumber) {
          isValid = false;
          break;
        } else if (element > 0) {
          allZeros = false;
        }
      }
      if (isValid && !allZeros) {
        this.dashArray = dashArray;

        if (forceStyle) {
          // Even though we cannot use the dash array in the display layer,
          // at least ensure that we use the correct border-style.
          this.setStyle(Name.get("D"));
        }
      } else {
        this.width = 0; // Adobe behavior when the array is invalid.
      }
    } else if (dashArray) {
      this.width = 0; // Adobe behavior when the array is invalid.
    }
  }

  /**
   * Set the horizontal corner radius (from a Border dictionary).
   *
   * @param radius - The horizontal corner radius.
   */
  setHorizontalCornerRadius(radius: number) {
    if (Number.isInteger(radius)) {
      this.horizontalCornerRadius = radius;
    }
  }

  /**
   * Set the vertical corner radius (from a Border dictionary).
   *
   * @param radius - The vertical corner radius.
   */
  setVerticalCornerRadius(radius: number) {
    if (Number.isInteger(radius)) {
      this.verticalCornerRadius = radius;
    }
  }
}

export interface AnnotPoint {
  x: number;
  y: number;
}

type AColor = TupleOf<number, 0 | 1 | 3 | 4>; // Table 164 C

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

interface _CreateNewDictP {
  apRef?: Ref;
  ap?: StringStream;
}

/**
 * 12.5.6.2
 */
export class MarkupAnnotation extends Annotation {
  /* creationDate */
  creationDate?: string | undefined;

  /**
   * Set the creation date.
   *
   * @param creationDate - PDF date string that indicates when the
   *  annotation was originally created
   */
  setCreationDate(creationDate: unknown) {
    this.creationDate = typeof creationDate === "string"
      ? creationDate
      : undefined;
  }
  /* ~ */

  constructor(parameters: _AnnotationCtorP) {
    super(parameters);

    const dict = parameters.dict; // Table 170

    if (dict.has("IRT")) {
      const rawIRT = dict.getRaw("IRT");
      this.data.inReplyTo = rawIRT instanceof Ref
        ? rawIRT.toString()
        : undefined;

      const rt = dict.get("RT");
      this.data.replyType = rt instanceof Name
        ? <AnnotationReplyType> rt.name
        : AnnotationReplyType.REPLY;
    }

    if (this.data.replyType === AnnotationReplyType.GROUP) {
      // Subordinate annotations in a group should inherit
      // the group attributes from the primary annotation.
      const parent = <Dict> dict.get("IRT");

      this.setTitle(parent.get("T"));
      this.data.titleObj = this._title;

      this.setContents(<string | undefined> parent.get("Contents"));
      this.data.contentsObj = this._contents;

      if (!parent.has("CreationDate")) {
        this.data.creationDate = undefined;
      } else {
        this.setCreationDate(parent.get("CreationDate"));
        this.data.creationDate = this.creationDate;
      }

      if (!parent.has("M")) {
        this.data.modificationDate = undefined;
      } else {
        this.setModificationDate(parent.get("M"));
        this.data.modificationDate = this.modificationDate;
      }

      this.data.hasPopup = parent.has("Popup");

      if (!parent.has("C")) {
        // Fall back to the default background color.
        this.data.color = undefined;
      } else {
        this.setColor(<number[]> parent.getArray("C"));
        this.data.color = this.color;
      }
    } else {
      this.data.titleObj = this._title;

      this.setCreationDate(dict.get("CreationDate"));
      this.data.creationDate = this.creationDate;

      this.data.hasPopup = dict.has("Popup");

      if (!dict.has("C")) {
        // Fall back to the default background color.
        this.data.color = undefined;
      }
    }

    if (dict.has("RC")) {
      this.data.richText = XFAFactory.getRichTextAsHtml(
        <string> dict.get("RC"),
      );
    }
  }

  static createNewDict(
    annotation: AnnotStorageValue,
    xref: XRef,
    _: _CreateNewDictP,
  ): Dict {
    assert(0);
    return <any> 0;
  }

  static async createNewAppearanceStream(
    annotation: AnnotStorageValue,
    xref: XRef,
    params?: _CreateNewAnnotationP,
  ): Promise<StringStream> {
    assert(0);
    return <any> 0;
  }

  /** @final */
  protected setDefaultAppearance$({
    xref,
    extra,
    strokeColor,
    fillColor,
    blendMode,
    strokeAlpha,
    fillAlpha,
    pointsCallback,
  }: _SetDefaultAppearanceP) {
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;

    const buffer = ["q"];
    if (extra) {
      buffer.push(extra);
    }
    if (strokeColor) {
      buffer.push(`${strokeColor[0]} ${strokeColor[1]} ${strokeColor[2]} RG`);
    }
    if (fillColor) {
      buffer.push(`${fillColor[0]} ${fillColor[1]} ${fillColor[2]} rg`);
    }

    let pointsArray = this.data.quadPoints;
    if (!pointsArray) {
      // If there are no quadpoints, the rectangle should be used instead.
      // Convert the rectangle definition to a points array similar to how the
      // quadpoints are defined.
      pointsArray = [
        [
          { x: this.rectangle[0], y: this.rectangle[3] },
          { x: this.rectangle[2], y: this.rectangle[3] },
          { x: this.rectangle[0], y: this.rectangle[1] },
          { x: this.rectangle[2], y: this.rectangle[1] },
        ],
      ];
    }

    for (const points of pointsArray) {
      const [mX, MX, mY, MY] = pointsCallback(
        buffer,
        <TupleOf<AnnotPoint, 4>> points,
      );
      minX = Math.min(minX, mX);
      maxX = Math.max(maxX, MX);
      minY = Math.min(minY, mY);
      maxY = Math.max(maxY, MY);
    }
    buffer.push("Q");

    const formDict = new Dict(xref);
    const appearanceStreamDict = new Dict(xref);
    appearanceStreamDict.set("Subtype", Name.get("Form"));

    const appearanceStream = new StringStream(buffer.join(" "));
    appearanceStream.dict = appearanceStreamDict;
    formDict.set("Fm0", appearanceStream);

    const gsDict = new Dict(xref);
    if (blendMode) {
      gsDict.set("BM", Name.get(blendMode));
    }
    if (typeof strokeAlpha === "number") {
      gsDict.set("CA", strokeAlpha);
    }
    if (typeof fillAlpha === "number") {
      gsDict.set("ca", fillAlpha);
    }

    const stateDict = new Dict(xref);
    stateDict.set("GS0", gsDict);

    const resources = new Dict(xref);
    resources.set("ExtGState", stateDict);
    resources.set("XObject", formDict);

    const appearanceDict = new Dict(xref);
    appearanceDict.set("Resources", resources);
    const bbox = (this.data.rect = [minX, minY, maxX, maxY]);
    appearanceDict.set("BBox", bbox);

    this.appearance = new StringStream("/GS0 gs /Fm0 Do");
    this.appearance.dict = appearanceDict;

    // This method is only called if there is no appearance for the annotation,
    // so `this.appearance` is not pushed yet in the `Annotation` constructor.
    this._streams.push(this.appearance, appearanceStream);
  }

  static async createNewAnnotation(
    xref: XRef,
    annotation: AnnotStorageValue,
    dependencies: _Dependency[],
    params?: _CreateNewAnnotationP,
  ) {
    const annotationRef = xref.getNewRef();
    const apRef = xref.getNewRef();
    const annotationDict = this.createNewDict(annotation, xref, { apRef });
    const ap = await this.createNewAppearanceStream(annotation, xref, params);

    const buffer: string[] = [];
    let transform = xref.encrypt
      ? xref.encrypt.createCipherTransform(apRef.num, apRef.gen)
      : undefined;
    writeObject(apRef, ap, buffer, transform);
    dependencies.push({ ref: apRef, data: buffer.join("") });

    buffer.length = 0;
    transform = xref.encrypt
      ? xref.encrypt.createCipherTransform(annotationRef.num, annotationRef.gen)
      : undefined;
    writeObject(annotationRef, annotationDict, buffer, transform);

    return { ref: annotationRef, data: buffer.join("") };
  }

  static async createNewPrintAnnotation(
    xref: XRef,
    annotation: AnnotStorageValue,
    params?: _CreateNewAnnotationP,
  ) {
    const ap = await this.createNewAppearanceStream(annotation, xref, params);
    const annotationDict = this.createNewDict(annotation, xref, { ap });

    return new (<Constructor<MarkupAnnotation>> this.prototype.constructor)({
      dict: annotationDict,
      xref,
    });
  }
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

export class WidgetAnnotation extends Annotation {
  ref: Ref;

  _hasValueFromXFA?: boolean;

  _defaultAppearance: string;
  _fieldResources: FieldResources;

  protected _hasText?: boolean;

  constructor(params: _AnnotationCtorP) {
    super(params);

    const dict = params.dict;
    const data = this.data;
    this.ref = params.ref;

    data.annotationType = AnnotationType.WIDGET;
    if (data.fieldName === undefined) {
      data.fieldName = this.constructFieldName$(dict);
    }
    if (data.actions === undefined) {
      data.actions = collectActions(
        params.xref,
        dict,
        AnnotationActionEventType,
      );
    }

    let fieldValue = getInheritableProperty({
      dict,
      key: "V",
      getArray: true,
    });
    data.fieldValue = this._decodeFormValue(fieldValue);

    const defaultFieldValue = getInheritableProperty({
      dict,
      key: "DV",
      getArray: true,
    });
    data.defaultFieldValue = this._decodeFormValue(defaultFieldValue);

    if (fieldValue === undefined && params.xfaDatasets) {
      // Try to figure out if we have something in the xfa dataset.
      const path = this._title.str;
      if (path) {
        this._hasValueFromXFA = true;
        data.fieldValue = fieldValue = params.xfaDatasets.getValue(path);
      }
    }

    // When no "V" entry exists, let the fieldValue fallback to the "DV" entry
    // (fixes issue13823.pdf).
    if (fieldValue === undefined && data.defaultFieldValue !== undefined) {
      data.fieldValue = data.defaultFieldValue;
    }

    data.alternativeText = stringToPDFString(<string> dict.get("TU") || "");

    const defaultAppearance = getInheritableProperty({ dict, key: "DA" }) ||
      params.acroForm.get("DA");
    this._defaultAppearance = typeof defaultAppearance === "string"
      ? defaultAppearance
      : "";
    data.defaultAppearanceData = parseDefaultAppearance(
      this._defaultAppearance,
    );

    const fieldType = getInheritableProperty({ dict, key: "FT" });
    data.fieldType = fieldType instanceof Name ? fieldType.name : undefined;

    const localResources = <Dict | undefined> getInheritableProperty({
      dict,
      key: "DR",
    });
    const acroFormResources = <Dict | undefined> params.acroForm.get("DR");
    const appearanceResources = <Dict | undefined> this.appearance?.dict!.get(
      "Resources",
    );

    this._fieldResources = {
      localResources,
      acroFormResources,
      appearanceResources,
      mergedResources: Dict.merge({
        xref: params.xref,
        dictArray: [localResources, appearanceResources, acroFormResources],
        mergeSubDicts: true,
      }),
    };

    data.fieldFlags = <AnnotationFieldFlag> getInheritableProperty({
      dict,
      key: "Ff",
    });
    if (!Number.isInteger(data.fieldFlags) || data.fieldFlags < 0) {
      data.fieldFlags = 0;
    }

    data.readOnly = this.hasFieldFlag(AnnotationFieldFlag.READONLY);
    data.required = this.hasFieldFlag(AnnotationFieldFlag.REQUIRED);
    data.hidden = this._hasFlag(data.annotationFlags, AnnotationFlag.HIDDEN);
  }

  /**
   * Decode the given form value.
   *
   * @param formValue The (possibly encoded) form value.
   */
  protected _decodeFormValue(formValue: unknown) {
    if (Array.isArray(formValue)) {
      return formValue
        .filter((item) => typeof item === "string")
        .map((item) => stringToPDFString(item));
    } else if (formValue instanceof Name) {
      return stringToPDFString(formValue.name);
    } else if (typeof formValue === "string") {
      return stringToPDFString(formValue);
    }
    return undefined;
  }

  /**
   * Check if a provided field flag is set.
   *
   * @param flag Hexadecimal representation for an annotation field characteristic
   * @see {@link shared/util.js}
   */
  hasFieldFlag(flag: AnnotationFieldFlag) {
    return !!(this.data.fieldFlags! & flag);
  }

  static _getRotationMatrix(rotation: number, width: number, height: number) {
    switch (rotation) {
      case 90:
        return [0, 1, -1, 0, width, 0];
      case 180:
        return [-1, 0, 0, -1, width, height];
      case 270:
        return [0, -1, 1, 0, 0, height];
      default:
        throw new Error("Invalid rotation");
    }
  }

  getRotationMatrix(annotationStorage: AnnotStorageRecord | undefined) {
    const storageEntry = annotationStorage
      ? annotationStorage.get(this.data.id)
      : undefined;
    let rotation = storageEntry && storageEntry.rotation;
    if (rotation === undefined) {
      rotation = this.rotation;
    }

    if (rotation === 0) {
      return IDENTITY_MATRIX;
    }

    const width = this.data.rect[2] - this.data.rect[0];
    const height = this.data.rect[3] - this.data.rect[1];

    return WidgetAnnotation._getRotationMatrix(rotation, width, height);
  }

  getBorderAndBackgroundAppearances(
    annotationStorage: AnnotStorageRecord | undefined,
  ) {
    const storageEntry = annotationStorage
      ? annotationStorage.get(this.data.id)
      : undefined;
    let rotation = storageEntry && storageEntry.rotation;
    if (rotation === undefined) {
      rotation = this.rotation;
    }

    if (!this.backgroundColor && !this.borderColor) {
      return "";
    }
    const width = this.data.rect[2] - this.data.rect[0];
    const height = this.data.rect[3] - this.data.rect[1];
    const rect = rotation === 0 || rotation === 180
      ? `0 0 ${width} ${height} re`
      : `0 0 ${height} ${width} re`;

    let str = "";
    if (this.backgroundColor) {
      str = `${
        getPdfColor(
          this.backgroundColor,
          /* isFill */ true,
        )
      } ${rect} f `;
    }

    if (this.borderColor) {
      const borderWidth = this.borderStyle.width || 1;
      str += `${borderWidth} w ${
        getPdfColor(
          this.borderColor,
          /* isFill */ false,
        )
      } ${rect} S `;
    }

    return str;
  }

  override async getOperatorList(
    evaluator: PartialEvaluator,
    task: WorkerTask,
    intent: RenderingIntentFlag,
    renderForms?: boolean,
    annotationStorage?: AnnotStorageRecord,
  ) {
    // Do not render form elements on the canvas when interactive forms are
    // enabled. The display layer is responsible for rendering them instead.
    if (renderForms && !(this instanceof SignatureWidgetAnnotation)) {
      return {
        opList: new OperatorList(),
        separateForm: true,
        separateCanvas: false,
      };
    }

    if (!this._hasText) {
      return super.getOperatorList(
        evaluator,
        task,
        intent,
        renderForms,
        annotationStorage,
      );
    }

    const content = await this.getAppearance$(
      evaluator,
      task,
      annotationStorage,
    );
    if (this.appearance && content === undefined) {
      return super.getOperatorList(
        evaluator,
        task,
        intent,
        renderForms,
        annotationStorage,
      );
    }

    const opList = new OperatorList();

    // Even if there is an appearance stream, ignore it. This is the
    // behaviour used by Adobe Reader.
    if (!this._defaultAppearance || content === undefined) {
      return { opList, separateForm: false, separateCanvas: false };
    }

    const matrix: matrix_t = [1, 0, 0, 1, 0, 0];
    const bbox: rect_t = [
      0,
      0,
      this.data.rect[2] - this.data.rect[0],
      this.data.rect[3] - this.data.rect[1],
    ];
    const transform = getTransformMatrix(this.data.rect, bbox, matrix);

    let optionalContent;
    if (this.oc) {
      optionalContent = await evaluator.parseMarkedContentProps(
        this.oc,
        /* resources = */ undefined,
      );
    }
    if (optionalContent !== undefined) {
      opList.addOp(OPS.beginMarkedContentProps, ["OC", optionalContent]);
    }

    opList.addOp(OPS.beginAnnotation, [
      this.data.id,
      this.data.rect,
      transform,
      this.getRotationMatrix(annotationStorage),
      /* isUsingOwnCanvas = */ false,
    ]);

    const stream = new StringStream(content);
    await evaluator.getOperatorList({
      stream,
      task,
      resources: this._fieldResources.mergedResources,
      operatorList: opList,
    });
    opList.addOp(OPS.endAnnotation, []);

    if (optionalContent !== undefined) {
      opList.addOp(OPS.endMarkedContent, []);
    }
    return { opList, separateForm: false, separateCanvas: false };
  }

  _getMKDict(rotation: number) {
    const mk = new Dict();
    if (rotation) {
      mk.set("R", rotation);
    }
    if (this.borderColor) {
      mk.set(
        "BC",
        Array.from(this.borderColor, (c) => c / 255),
      );
    }
    if (this.backgroundColor) {
      mk.set(
        "BG",
        Array.from(this.backgroundColor, (c) => c / 255),
      );
    }
    return mk.size > 0 ? mk : null;
  }

  override async save(
    evaluator: PartialEvaluator,
    task: WorkerTask,
    annotationStorage?: AnnotStorageRecord,
  ): Promise<SaveReturn | undefined> {
    const storageEntry = annotationStorage
      ? annotationStorage.get(this.data.id)
      : undefined;
    let value = storageEntry && storageEntry.value;
    let rotation = storageEntry && storageEntry.rotation;
    if (value === this.data.fieldValue || value === undefined) {
      if (!this._hasValueFromXFA && rotation === undefined) {
        return undefined;
      }
      value = value || this.data.fieldValue;
    }

    // Value can be an array (with choice list and multiple selections)
    if (
      rotation === undefined &&
      !this._hasValueFromXFA &&
      Array.isArray(value) &&
      Array.isArray(this.data.fieldValue) &&
      value.length === this.data.fieldValue.length &&
      value.every((x, i) => x === (<string[]> this.data.fieldValue)[i])
    ) {
      return undefined;
    }

    if (rotation === undefined) {
      rotation = this.rotation;
    }

    let appearance = await this.getAppearance$(
      evaluator,
      task,
      annotationStorage,
    );
    if (appearance === undefined) {
      return undefined;
    }
    const { xref } = evaluator;

    const dict = <Dict> xref.fetchIfRef(this.ref);
    if (!(dict instanceof Dict)) {
      return undefined;
    }

    const bbox = [
      0,
      0,
      this.data.rect[2] - this.data.rect[0],
      this.data.rect[3] - this.data.rect[1],
    ];

    const xfa = {
      path: stringToPDFString(<string> dict.get("T") || ""),
      value: <string> value,
    };

    const newRef = xref.getNewRef();
    const AP = new Dict(xref);
    AP.set("N", newRef);

    const encrypt = xref.encrypt;
    let originalTransform: CipherTransform | undefined;
    let newTransform: CipherTransform | undefined;
    if (encrypt) {
      originalTransform = encrypt.createCipherTransform(
        this.ref.num,
        this.ref.gen,
      );
      newTransform = encrypt.createCipherTransform(newRef.num, newRef.gen);
      appearance = newTransform.encryptString(appearance);
    }

    const encoder = (
      val: string,
    ) => (isAscii(val) ? val : stringToUTF16BEString(val));
    dict.set(
      "V",
      Array.isArray(value) ? value.map(encoder) : encoder(<string> value),
    );
    dict.set("AP", AP);
    dict.set("M", `D:${getModificationDate()}`);

    const maybeMK = this._getMKDict(rotation);
    if (maybeMK) {
      dict.set("MK", maybeMK);
    }

    const appearanceDict = new Dict(xref);
    appearanceDict.set("Length", appearance.length);
    appearanceDict.set("Subtype", Name.get("Form"));
    appearanceDict.set("Resources", this._getSaveFieldResources(xref));
    appearanceDict.set("BBox", bbox);

    const rotationMatrix = this.getRotationMatrix(annotationStorage);
    if (rotationMatrix !== IDENTITY_MATRIX) {
      // The matrix isn't the identity one.
      appearanceDict.set("Matrix", rotationMatrix);
    }

    const bufferOriginal = [`${this.ref.num} ${this.ref.gen} obj\n`];
    writeDict(dict, bufferOriginal, originalTransform);
    bufferOriginal.push("\nendobj\n");

    const bufferNew = [`${newRef.num} ${newRef.gen} obj\n`];
    writeDict(appearanceDict, bufferNew, newTransform);
    bufferNew.push(" stream\n", appearance, "\nendstream\nendobj\n");

    return [
      // data for the original object
      // V field changed + reference for new AP
      { ref: this.ref, data: bufferOriginal.join(""), xfa },
      // data for the new AP
      { ref: newRef, data: bufferNew.join("") },
    ];
  }

  _getCombAppearance(
    defaultAppearance: string,
    font: Font | ErrorFont,
    text: string,
    width: number,
    hPadding: number,
    vPadding: number,
    annotationStorage: AnnotStorageRecord | undefined,
  ) {
    return "";
  }

  _getMultilineAppearance(
    defaultAppearance: string,
    text: string,
    font: Font | ErrorFont,
    fontSize: number,
    width: number,
    height: number,
    alignment: number,
    hPadding: number,
    vPadding: number,
    AnnotStorageRecord: AnnotStorageRecord | undefined,
  ) {
    return "";
  }

  _splitLine(
    line: string | undefined,
    font: Font | ErrorFont,
    fontSize: number,
    width: number,
    cache = <CachedLines> {},
  ) {
    // TODO: need to handle chars which are not in the font.
    line = cache.line || font.encodeString(line!).join("");

    const glyphs = cache.glyphs || font.charsToGlyphs(line);

    if (glyphs.length <= 1) {
      // Nothing to split
      return [line];
    }

    const positions = cache.positions || font.getCharPositions(line);
    const scale = fontSize / 1000;
    const chunks = [];

    let lastSpacePosInStringStart = -1,
      lastSpacePosInStringEnd = -1,
      lastSpacePos = -1,
      startChunk = 0,
      currentWidth = 0;

    for (let i = 0, ii = glyphs.length; i < ii; i++) {
      const [start, end] = positions[i];
      const glyph = glyphs[i];
      const glyphWidth = glyph.width! * scale;
      if (glyph.unicode === " ") {
        if (currentWidth + glyphWidth > width) {
          // We can break here
          chunks.push(line.substring(startChunk, start));
          startChunk = start;
          currentWidth = glyphWidth;
          lastSpacePosInStringStart = -1;
          lastSpacePos = -1;
        } else {
          currentWidth += glyphWidth;
          lastSpacePosInStringStart = start;
          lastSpacePosInStringEnd = end;
          lastSpacePos = i;
        }
      } else {
        if (currentWidth + glyphWidth > width) {
          // We must break to the last white position (if available)
          if (lastSpacePosInStringStart !== -1) {
            chunks.push(line.substring(startChunk, lastSpacePosInStringEnd));
            startChunk = lastSpacePosInStringEnd;
            i = lastSpacePos + 1;
            lastSpacePosInStringStart = -1;
            currentWidth = 0;
          } else {
            // Just break in the middle of the word
            chunks.push(line.substring(startChunk, start));
            startChunk = start;
            currentWidth = glyphWidth;
          }
        } else {
          currentWidth += glyphWidth;
        }
      }
    }

    if (startChunk < line.length) {
      chunks.push(line.substring(startChunk, line.length));
    }

    return chunks;
  }

  protected async getAppearance$(
    evaluator: PartialEvaluator,
    task: WorkerTask,
    annotationStorage?: AnnotStorageRecord,
  ) {
    const isPassword = this.hasFieldFlag(AnnotationFieldFlag.PASSWORD);
    if (isPassword) {
      return undefined;
    }

    const storageEntry = annotationStorage
      ? annotationStorage.get(this.data.id)
      : undefined;

    let value, rotation;
    if (storageEntry) {
      value = storageEntry.formattedValue || storageEntry.value;
      rotation = storageEntry.rotation;
    }

    if (rotation === undefined && value === undefined) {
      if (!this._hasValueFromXFA || this.appearance) {
        // The annotation hasn't been rendered so use the appearance.
        return undefined;
      }
    }

    if (value === undefined) {
      // The annotation has its value in XFA datasets but not in the V field.
      value = this.data.fieldValue;
      if (!value) {
        return "";
      }
    }

    if (Array.isArray(value) && value.length === 1) {
      value = value[0];
    }

    assert(typeof value === "string", "Expected `value` to be a string.");

    value = (<string> value).trim();

    if (value === "") {
      // the field is empty: nothing to render
      return "";
    }

    if (rotation === undefined) {
      rotation = this.rotation;
    }

    let lineCount = -1;
    if (this.data.multiLine) {
      lineCount = value.split(/\r\n|\r|\n/).length;
    }

    const defaultPadding = 2;
    const hPadding = defaultPadding;
    let totalHeight = this.data.rect[3] - this.data.rect[1];
    let totalWidth = this.data.rect[2] - this.data.rect[0];

    if (rotation === 90 || rotation === 270) {
      [totalWidth, totalHeight] = [totalHeight, totalWidth];
    }

    if (!this._defaultAppearance) {
      // The DA is required and must be a string.
      // If there is no font named Helvetica in the resource dictionary,
      // the evaluator will fall back to a default font.
      // Doing so prevents exceptions and allows saving/printing
      // the file as expected.
      this.data.defaultAppearanceData = parseDefaultAppearance(
        this._defaultAppearance = "/Helvetica 0 Tf 0 g",
      );
    }

    const font = await WidgetAnnotation._getFontData(
      evaluator,
      task,
      this.data.defaultAppearanceData,
      this._fieldResources.mergedResources,
    );
    const [defaultAppearance, fontSize] = this.computeFontSize$(
      totalHeight - defaultPadding,
      totalWidth - 2 * hPadding,
      value,
      font,
      lineCount,
    );

    let descent = font.descent;
    if (isNaN(descent)) {
      descent = 0;
    }

    // Take into account the space we have to compute the default vertical
    // padding.
    const defaultVPadding = Math.min(
      Math.floor((totalHeight - fontSize) / 2),
      defaultPadding,
    );
    const vPadding = defaultVPadding + Math.abs(descent) * fontSize;
    const alignment = this.data.textAlignment!;

    if (this.data.multiLine) {
      return this._getMultilineAppearance(
        defaultAppearance,
        value,
        font,
        fontSize,
        totalWidth,
        totalHeight,
        alignment,
        hPadding,
        vPadding,
        annotationStorage,
      );
    }

    // TODO: need to handle chars which are not in the font.
    const encodedString = font.encodeString(value).join("");

    if (this.data.comb) {
      return this._getCombAppearance(
        defaultAppearance,
        font,
        encodedString,
        totalWidth,
        hPadding,
        vPadding,
        annotationStorage,
      );
    }

    // Empty or it has a trailing whitespace.
    const colors = this.getBorderAndBackgroundAppearances(annotationStorage);

    if (alignment === 0 || alignment > 2) {
      // Left alignment: nothing to do
      return (
        `/Tx BMC q ${colors}BT ` +
        defaultAppearance +
        ` 1 0 0 1 ${hPadding} ${vPadding} Tm (${
          escapeString(
            encodedString,
          )
        }) Tj` +
        " ET Q EMC"
      );
    }

    const renderedText = this._renderText(
      encodedString,
      font,
      fontSize,
      totalWidth,
      alignment,
      hPadding,
      vPadding,
    );
    return (
      `/Tx BMC q ${colors}BT ` +
      defaultAppearance +
      ` 1 0 0 1 0 0 Tm ${renderedText}` +
      " ET Q EMC"
    );
  }
  /** For testing only. */
  async _getAppearance(
    evaluator: PartialEvaluator,
    task: WorkerTask,
    annotationStorage?: AnnotStorageRecord,
  ) {
    return this.getAppearance$(evaluator, task, annotationStorage);
  }

  static async _getFontData(
    evaluator: PartialEvaluator,
    task: WorkerTask,
    appearanceData: DefaultAppearanceData | undefined,
    resources: Dict,
  ) {
    const operatorList = new OperatorList();
    const initialState: Partial<EvalState> = {
      clone() {
        return this;
      },
    };

    const { fontName, fontSize } = appearanceData!;
    await evaluator.handleSetFont(
      resources,
      [fontName && Name.get(fontName), fontSize],
      /* fontRef = */ undefined,
      operatorList,
      task,
      initialState,
      // /* fallbackFontDict = */ null
    );

    return initialState.font!;
  }

  protected getTextWidth$(text: string, font: Font | ErrorFont) {
    return (
      font
        .charsToGlyphs(text)
        .reduce((width, glyph) => width + glyph.width!, 0) / 1000
    );
  }

  protected computeFontSize$(
    height: number,
    width: number,
    text: string,
    font: Font | ErrorFont,
    lineCount: number,
  ) {
    let { fontSize } = this.data.defaultAppearanceData!;
    if (!fontSize) {
      // A zero value for size means that the font shall be auto-sized:
      // its size shall be computed as a function of the height of the
      // annotation rectangle (see 12.7.3.3).

      const roundWithTwoDigits = (x: number) => Math.floor(x * 100) / 100;

      if (lineCount === -1) {
        const textWidth = this.getTextWidth$(text, font);
        fontSize = roundWithTwoDigits(
          Math.min(height / LINE_FACTOR, width / textWidth),
        );
      } else {
        const lines = text.split(/\r\n?|\n/);
        const cachedLines: CachedLines[] = [];
        for (const line of lines) {
          const encoded = font.encodeString(line).join("");
          const glyphs = font.charsToGlyphs(encoded);
          const positions = font.getCharPositions(encoded);
          cachedLines.push({
            line: encoded,
            glyphs,
            positions,
          });
        }

        const isTooBig = (fsize: number) => {
          // Return true when the text doesn't fit the given height.
          let totalHeight = 0;
          for (const cache of cachedLines) {
            const chunks = this._splitLine(
              undefined,
              font,
              fsize,
              width,
              cache,
            );
            totalHeight += chunks.length * fsize;
            if (totalHeight > height) {
              return true;
            }
          }
          return false;
        };

        // Hard to guess how many lines there are.
        // The field may have been sized to have 10 lines
        // and the user entered only 1 so if we get font size from
        // height and number of lines then we'll get something too big.
        // So we compute a fake number of lines based on height and
        // a font size equal to 12 (this is the default font size in
        // Acrobat).
        // Then we'll adjust font size to what we have really.
        fontSize = 12;
        let lineHeight = fontSize * LINE_FACTOR;
        let numberOfLines = Math.round(height / lineHeight);
        numberOfLines = Math.max(numberOfLines, lineCount);

        while (true) {
          lineHeight = height / numberOfLines;
          fontSize = roundWithTwoDigits(lineHeight / LINE_FACTOR);

          if (isTooBig(fontSize)) {
            numberOfLines++;
            continue;
          }

          break;
        }
      }

      const { fontName, fontColor } = this.data.defaultAppearanceData!;
      this._defaultAppearance = createDefaultAppearance({
        fontSize,
        fontName,
        fontColor,
      });
    }
    return <[string, number]> [this._defaultAppearance, fontSize];
  }

  _renderText(
    text: string,
    font: Font | ErrorFont,
    fontSize: number,
    totalWidth: number,
    alignment: number,
    hPadding: number,
    vPadding: number,
  ) {
    let shift;
    if (alignment === 1) {
      // Center
      const width = this.getTextWidth$(text, font) * fontSize;
      shift = (totalWidth - width) / 2;
    } else if (alignment === 2) {
      // Right
      const width = this.getTextWidth$(text, font) * fontSize;
      shift = totalWidth - width - hPadding;
    } else {
      shift = hPadding;
    }

    return `${numberToString(shift)} ${numberToString(vPadding)} Td (${
      escapeString(text)
    }) Tj`;
  }

  _getSaveFieldResources(xref: XRef) {
    /*#static*/ if (_PDFDEV) {
      assert(
        this.data.defaultAppearanceData,
        "Expected `_defaultAppearanceData` to have been set.",
      );
    }
    const { localResources, appearanceResources, acroFormResources } =
      this._fieldResources;

    const fontName = this.data.defaultAppearanceData &&
      this.data.defaultAppearanceData.fontName;
    if (!fontName) {
      return localResources || Dict.empty;
    }

    for (const resources of [localResources, appearanceResources]) {
      if (resources instanceof Dict) {
        const localFont = resources.get("Font");
        if (localFont instanceof Dict && localFont.has(fontName)) {
          return resources;
        }
      }
    }
    if (acroFormResources instanceof Dict) {
      const acroFormFont = acroFormResources.get("Font");
      if (acroFormFont instanceof Dict && acroFormFont.has(fontName)) {
        const subFontDict = new Dict(xref);
        subFontDict.set(fontName, acroFormFont.getRaw(fontName)!);

        const subResourcesDict = new Dict(xref);
        subResourcesDict.set("Font", subFontDict);

        return Dict.merge({
          xref,
          dictArray: [subResourcesDict, localResources],
          mergeSubDicts: true,
        });
      }
    }
    return localResources || Dict.empty;
  }

  override getFieldObject(): FieldObject | undefined {
    return undefined;
  }
}

class TextWidgetAnnotation extends WidgetAnnotation {
  constructor(params: _AnnotationCtorP) {
    super(params);

    this._hasText = true;

    const dict = params.dict;

    // The field value is always a string.
    if (typeof this.data.fieldValue !== "string") {
      this.data.fieldValue = "";
    }

    // Determine the alignment of text in the field.
    let alignment = getInheritableProperty({ dict, key: "Q" });
    if (
      !Number.isInteger(alignment) || <number> alignment < 0 ||
      <number> alignment > 2
    ) {
      alignment = undefined;
    }
    this.data.textAlignment = <number | undefined> alignment;

    // Determine the maximum length of text in the field.
    let maximumLength = getInheritableProperty({ dict, key: "MaxLen" });
    if (!Number.isInteger(maximumLength) || <number> maximumLength < 0) {
      maximumLength = 0;
    }
    this.data.maxLen = <number | undefined> maximumLength;

    // Process field flags for the display layer.
    this.data.multiLine = this.hasFieldFlag(AnnotationFieldFlag.MULTILINE);
    this.data.comb = this.hasFieldFlag(AnnotationFieldFlag.COMB) &&
      !this.hasFieldFlag(AnnotationFieldFlag.MULTILINE) &&
      !this.hasFieldFlag(AnnotationFieldFlag.PASSWORD) &&
      !this.hasFieldFlag(AnnotationFieldFlag.FILESELECT) &&
      this.data.maxLen !== 0;
    this.data.doNotScroll = this.hasFieldFlag(AnnotationFieldFlag.DONOTSCROLL);
  }

  override _getCombAppearance(
    defaultAppearance: string,
    font: Font | ErrorFont,
    text: string,
    width: number,
    hPadding: number,
    vPadding: number,
    annotationStorage: AnnotStorageRecord | undefined,
  ) {
    const combWidth = numberToString(width / this.data.maxLen!);
    const buf = [];
    const positions = font.getCharPositions(text);
    for (const [start, end] of positions) {
      buf.push(`(${escapeString(text.substring(start, end))}) Tj`);
    }

    // Empty or it has a trailing whitespace.
    const colors = this.getBorderAndBackgroundAppearances(annotationStorage);
    const renderedComb = buf.join(` ${combWidth} 0 Td `);
    return (
      `/Tx BMC q ${colors}BT ` +
      defaultAppearance +
      ` 1 0 0 1 ${hPadding} ${vPadding} Tm ${renderedComb}` +
      " ET Q EMC"
    );
  }

  override _getMultilineAppearance(
    defaultAppearance: string,
    text: string,
    font: Font | ErrorFont,
    fontSize: number,
    width: number,
    height: number,
    alignment: number,
    hPadding: number,
    vPadding: number,
    annotationStorage: AnnotStorageRecord | undefined,
  ) {
    const lines = text.split(/\r\n?|\n/);
    const buf = [];
    const totalWidth = width - 2 * hPadding;
    for (const line of lines) {
      const chunks = this._splitLine(line, font, fontSize, totalWidth);
      for (const chunk of chunks) {
        const padding: number = buf.length === 0 ? hPadding : 0;
        buf.push(
          this._renderText(
            chunk,
            font,
            fontSize,
            width,
            alignment,
            padding,
            -fontSize, // <0 because a line is below the previous one
          ),
        );
      }
    }

    const renderedText = buf.join("\n");

    // Empty or it has a trailing whitespace.
    const colors = this.getBorderAndBackgroundAppearances(annotationStorage);

    return (
      `/Tx BMC q ${colors}BT ` +
      defaultAppearance +
      ` 1 0 0 1 0 ${height} Tm ${renderedText}` +
      " ET Q EMC"
    );
  }

  override getFieldObject() {
    return <FieldObject> {
      id: this.data.id,
      value: this.data.fieldValue,
      defaultValue: this.data.defaultFieldValue || "",
      multiline: this.data.multiLine,
      password: this.hasFieldFlag(AnnotationFieldFlag.PASSWORD),
      charLimit: this.data.maxLen,
      comb: this.data.comb,
      editable: !this.data.readOnly,
      hidden: this.data.hidden,
      name: this.data.fieldName,
      rect: this.data.rect,
      actions: this.data.actions,
      page: this.data.pageIndex,
      strokeColor: this.data.borderColor,
      fillColor: this.data.backgroundColor,
      rotation: this.rotation,
      type: "text",
    };
  }
}

class ButtonWidgetAnnotation extends WidgetAnnotation {
  checkedAppearance?: BaseStream | undefined;
  uncheckedAppearance?: BaseStream | undefined;

  parent?: Ref | Dict;

  constructor(params: _AnnotationCtorP) {
    super(params);

    this.data.checkBox = !this.hasFieldFlag(AnnotationFieldFlag.RADIO) &&
      !this.hasFieldFlag(AnnotationFieldFlag.PUSHBUTTON);
    this.data.radioButton = this.hasFieldFlag(AnnotationFieldFlag.RADIO) &&
      !this.hasFieldFlag(AnnotationFieldFlag.PUSHBUTTON);
    this.data.pushButton = this.hasFieldFlag(AnnotationFieldFlag.PUSHBUTTON);
    this.data.isTooltipOnly = false;

    if (this.data.checkBox) this._processCheckBox(params);
    else if (this.data.radioButton) this._processRadioButton(params);
    else if (this.data.pushButton) {
      this.data.hasOwnCanvas = true;
      this._processPushButton(params);
    } else warn("Invalid field flags for button widget annotation");
  }

  override async getOperatorList(
    evaluator: PartialEvaluator,
    task: WorkerTask,
    intent: RenderingIntentFlag,
    renderForms?: boolean,
    annotationStorage?: AnnotStorageRecord,
  ) {
    if (this.data.pushButton) {
      return super.getOperatorList(
        evaluator,
        task,
        intent,
        false, // we use normalAppearance to render the button
        annotationStorage,
      );
    }

    let value;
    let rotation = null;
    if (annotationStorage) {
      const storageEntry = annotationStorage.get(this.data.id);
      value = storageEntry ? storageEntry.value : undefined;
      rotation = storageEntry ? storageEntry.rotation : null;
    }

    if (value === undefined && this.appearance) {
      // Nothing in the annotationStorage.
      // But we've a default appearance so use it.
      return super.getOperatorList(
        evaluator,
        task,
        intent,
        renderForms,
        annotationStorage,
      );
    }

    if (value === null || value === undefined) {
      // There is no default appearance so use the one derived
      // from the field value.
      if (this.data.checkBox) {
        value = this.data.fieldValue === this.data.exportValue;
      } else {
        value = this.data.fieldValue === this.data.buttonValue;
      }
    }

    const appearance = value
      ? this.checkedAppearance
      : this.uncheckedAppearance;
    if (appearance) {
      const savedAppearance = this.appearance;
      const savedMatrix = appearance.dict!.getArray("Matrix") ||
        IDENTITY_MATRIX;

      if (rotation) {
        appearance.dict!.set(
          "Matrix",
          this.getRotationMatrix(annotationStorage),
        );
      }

      this.appearance = appearance;
      const operatorList = super.getOperatorList(
        evaluator,
        task,
        intent,
        renderForms,
        annotationStorage,
      );
      this.appearance = savedAppearance;
      appearance.dict!.set("Matrix", savedMatrix);
      return operatorList;
    }

    // No appearance
    return {
      opList: new OperatorList(),
      separateForm: false,
      separateCanvas: false,
    };
  }

  override async save(
    evaluator: PartialEvaluator,
    task: WorkerTask,
    annotationStorage?: AnnotStorageRecord,
  ): Promise<SaveReturn | undefined> {
    if (this.data.checkBox) {
      return this._saveCheckbox(evaluator, task, annotationStorage);
    }

    if (this.data.radioButton) {
      return this._saveRadioButton(evaluator, task, annotationStorage);
    }

    // Nothing to save
    return undefined;
  }

  _saveCheckbox(
    evaluator: PartialEvaluator,
    task: WorkerTask,
    annotationStorage?: AnnotStorageRecord,
  ): SaveReturn | undefined {
    if (!annotationStorage) {
      return undefined;
    }
    const storageEntry = annotationStorage.get(this.data.id);
    let rotation = storageEntry && storageEntry.rotation;
    let value = storageEntry && storageEntry.value;

    if (rotation === undefined) {
      if (value === undefined) {
        return undefined;
      }

      const defaultValue = this.data.fieldValue === this.data.exportValue;
      if (defaultValue === value) {
        return undefined;
      }
    }

    const dict = evaluator.xref.fetchIfRef(this.ref);
    if (!(dict instanceof Dict)) {
      return undefined;
    }

    if (rotation === undefined) {
      rotation = this.rotation;
    }
    if (value === undefined) {
      value = this.data.fieldValue === this.data.exportValue;
    }

    const xfa = {
      path: stringToPDFString(<string> dict.get("T") || ""),
      value: value ? this.data.exportValue! : "",
    };

    const name = Name.get(value ? this.data.exportValue! : "Off");
    dict.set("V", name);
    dict.set("AS", name);
    dict.set("M", `D:${getModificationDate()}`);

    const maybeMK = this._getMKDict(rotation);
    if (maybeMK) {
      dict.set("MK", maybeMK);
    }

    const encrypt = evaluator.xref.encrypt;
    let originalTransform: CipherTransform | undefined;
    if (encrypt) {
      originalTransform = encrypt.createCipherTransform(
        this.ref.num,
        this.ref.gen,
      );
    }

    const buffer = [`${this.ref.num} ${this.ref.gen} obj\n`];
    writeDict(dict, buffer, originalTransform);
    buffer.push("\nendobj\n");

    return [{ ref: this.ref, data: buffer.join(""), xfa }];
  }

  _saveRadioButton(
    evaluator: PartialEvaluator,
    task: WorkerTask,
    annotationStorage?: AnnotStorageRecord,
  ): SaveReturn | undefined {
    if (!annotationStorage) {
      return undefined;
    }
    const storageEntry = annotationStorage.get(this.data.id);
    let rotation = storageEntry && storageEntry.rotation;
    let value = storageEntry && storageEntry.value;

    if (rotation === undefined) {
      if (value === undefined) {
        return undefined;
      }

      const defaultValue = this.data.fieldValue === this.data.buttonValue;
      if (defaultValue === value) {
        return undefined;
      }
    }

    const dict = <Dict> evaluator.xref.fetchIfRef(this.ref);
    if (!(dict instanceof Dict)) {
      return undefined;
    }

    if (value === undefined) {
      value = this.data.fieldValue === this.data.buttonValue;
    }

    if (rotation === undefined) {
      rotation = this.rotation;
    }

    const xfa = {
      path: stringToPDFString(<string> dict.get("T") || ""),
      value: value ? this.data.buttonValue! : "",
    };

    const name = Name.get(value ? this.data.buttonValue! : "Off");
    let parentBuffer: string[] | undefined;
    const encrypt = evaluator.xref.encrypt;

    if (value) {
      if (this.parent instanceof Ref) {
        const parent = <Dict> evaluator.xref.fetch(this.parent);
        let parentTransform: CipherTransform | undefined;
        if (encrypt) {
          parentTransform = encrypt.createCipherTransform(
            this.parent.num,
            this.parent.gen,
          );
        }
        parent.set("V", name);
        parentBuffer = [`${this.parent.num} ${this.parent.gen} obj\n`];
        writeDict(parent, parentBuffer, parentTransform);
        parentBuffer.push("\nendobj\n");
      } else if (this.parent instanceof Dict) {
        this.parent.set("V", name);
      }
    }

    dict.set("AS", name);
    dict.set("M", `D:${getModificationDate()}`);

    const maybeMK = this._getMKDict(rotation);
    if (maybeMK) {
      dict.set("MK", maybeMK);
    }

    let originalTransform: CipherTransform | undefined;
    if (encrypt) {
      originalTransform = encrypt.createCipherTransform(
        this.ref.num,
        this.ref.gen,
      );
    }

    const buffer = [`${this.ref.num} ${this.ref.gen} obj\n`];
    writeDict(dict, buffer, originalTransform);
    buffer.push("\nendobj\n");

    const newRefs: SaveReturn = [{ ref: this.ref, data: buffer.join(""), xfa }];
    if (parentBuffer !== undefined) {
      newRefs!.push({
        ref: <Ref> this.parent,
        data: parentBuffer.join(""),
        // xfa: null,
      });
    }

    return newRefs;
  }

  _getDefaultCheckedAppearance(
    params: _AnnotationCtorP,
    type: "check" | "disc",
  ) {
    const width = this.data.rect[2] - this.data.rect[0];
    const height = this.data.rect[3] - this.data.rect[1];
    const bbox = [0, 0, width, height];

    // Ratio used to have a mark slightly smaller than the bbox.
    const FONT_RATIO = 0.8;
    const fontSize = Math.min(width, height) * FONT_RATIO;

    // Char Metrics
    // Widths came from widths for ZapfDingbats.
    // Heights are guessed with Fontforge and FoxitDingbats.pfb.
    let metrics: { width: number; height: number },
      char;
    if (type === "check") {
      // Char 33 (2713 in unicode)
      metrics = {
        width: 0.755 * fontSize,
        height: 0.705 * fontSize,
      };
      char = "\x33";
    } else if (type === "disc") {
      // Char 6C (25CF in unicode)
      metrics = {
        width: 0.791 * fontSize,
        height: 0.705 * fontSize,
      };
      char = "\x6C";
    } else {
      assert(0, `_getDefaultCheckedAppearance - unsupported type: ${type}`);
    }

    // Values to center the glyph in the bbox.
    const xShift = numberToString((width - metrics!.width) / 2);
    const yShift = numberToString((height - metrics!.height) / 2);

    const appearance =
      `q BT /PdfJsZaDb ${fontSize} Tf 0 g ${xShift} ${yShift} Td (${char}) Tj ET Q`;

    const appearanceStreamDict = new Dict(params.xref);
    appearanceStreamDict.set("FormType", 1);
    appearanceStreamDict.set("Subtype", Name.get("Form"));
    appearanceStreamDict.set("Type", Name.get("XObject"));
    appearanceStreamDict.set("BBox", bbox);
    appearanceStreamDict.set("Matrix", [1, 0, 0, 1, 0, 0]);
    appearanceStreamDict.set("Length", appearance.length);

    const resources = new Dict(params.xref);
    const font = new Dict(params.xref);
    font.set("PdfJsZaDb", this.fallbackFontDict);
    resources.set("Font", font);

    appearanceStreamDict.set("Resources", resources);

    this.checkedAppearance = new StringStream(appearance);
    this.checkedAppearance.dict = appearanceStreamDict;

    this._streams.push(this.checkedAppearance);
  }

  _processCheckBox(params: _AnnotationCtorP) {
    const customAppearance = params.dict.get("AP");
    if (!(customAppearance instanceof Dict)) {
      return;
    }

    const normalAppearance = customAppearance.get("N"); // Table 168
    if (!(normalAppearance instanceof Dict)) {
      return;
    }

    // See https://bugzilla.mozilla.org/show_bug.cgi?id=1722036.
    // If we've an AS and a V then take AS.
    const asValue = this._decodeFormValue(params.dict.get("AS"));
    if (typeof asValue === "string") {
      this.data.fieldValue = asValue;
    }

    const yes =
      this.data.fieldValue !== undefined && this.data.fieldValue !== "Off"
        ? <string> this.data.fieldValue
        : "Yes";

    const exportValues = normalAppearance.getKeys();
    if (exportValues.length === 0) {
      exportValues.push("Off", yes);
    } else if (exportValues.length === 1) {
      if (exportValues[0] === "Off") {
        exportValues.push(yes);
      } else {
        exportValues.unshift("Off");
      }
    } else if (exportValues.includes(yes)) {
      exportValues.length = 0;
      exportValues.push("Off", yes);
    } else {
      const otherYes = exportValues.find((v) => v !== "Off")!;
      exportValues.length = 0;
      exportValues.push("Off", otherYes);
    }

    // Don't use a "V" entry pointing to a non-existent appearance state,
    // see e.g. bug1720411.pdf where it's an *empty* Name-instance.
    if (!exportValues.includes(<string> this.data.fieldValue)) {
      this.data.fieldValue = "Off";
    }

    this.data.exportValue = exportValues[1];

    this.checkedAppearance =
      <BaseStream> normalAppearance.get(this.data.exportValue) || undefined;
    this.uncheckedAppearance = <BaseStream> normalAppearance.get("Off") ||
      undefined;

    if (this.checkedAppearance) {
      this._streams.push(this.checkedAppearance);
    } else {
      this._getDefaultCheckedAppearance(params, "check");
    }
    if (this.uncheckedAppearance) {
      this._streams.push(this.uncheckedAppearance);
    }
    this._fallbackFontDict = this.fallbackFontDict;
  }

  _processRadioButton(params: _AnnotationCtorP) {
    this.data.fieldValue = this.data.buttonValue = undefined;

    // The parent field's `V` entry holds a `Name` object with the appearance
    // state of whichever child field is currently in the "on" state.
    const fieldParent = params.dict.get("Parent");
    if (fieldParent instanceof Dict) {
      this.parent = <Dict | Ref> params.dict.getRaw("Parent");
      const fieldParentValue = fieldParent.get("V");
      if (fieldParentValue instanceof Name) {
        this.data.fieldValue = this._decodeFormValue(fieldParentValue);
      }
    }

    // The button's value corresponds to its appearance state.
    const appearanceStates = params.dict.get("AP");
    if (!(appearanceStates instanceof Dict)) {
      return;
    }
    const normalAppearance = appearanceStates.get("N");
    if (!(normalAppearance instanceof Dict)) {
      return;
    }
    for (const key of normalAppearance.getKeys()) {
      if (key !== "Off") {
        this.data.buttonValue = <string> this._decodeFormValue(key);
        break;
      }
    }

    this.checkedAppearance =
      <BaseStream> normalAppearance.get(this.data.buttonValue!) || undefined;
    this.uncheckedAppearance = <BaseStream> normalAppearance.get("Off") ||
      undefined;

    if (this.checkedAppearance) {
      this._streams.push(this.checkedAppearance);
    } else {
      this._getDefaultCheckedAppearance(params, "disc");
    }
    if (this.uncheckedAppearance) {
      this._streams.push(this.uncheckedAppearance);
    }
    this._fallbackFontDict = this.fallbackFontDict;
  }

  _processPushButton(params: _AnnotationCtorP) {
    if (
      !params.dict.has("A") &&
      !params.dict.has("AA") &&
      !this.data.alternativeText
    ) {
      warn("Push buttons without action dictionaries are not supported");
      return;
    }

    this.data.isTooltipOnly = !params.dict.has("A") && !params.dict.has("AA");

    Catalog.parseDestDictionary({
      destDict: params.dict,
      resultObj: this.data,
      docBaseUrl: params.pdfManager.docBaseUrl,
      docAttachments: params.attachments,
    });
  }

  override getFieldObject() {
    let type = "button";
    let exportValues;
    if (this.data.checkBox) {
      type = "checkbox";
      exportValues = this.data.exportValue;
    } else if (this.data.radioButton) {
      type = "radiobutton";
      exportValues = this.data.buttonValue;
    }
    return <FieldObject> {
      id: this.data.id,
      value: this.data.fieldValue || "Off",
      defaultValue: this.data.defaultFieldValue,
      exportValues,
      editable: !this.data.readOnly,
      name: this.data.fieldName,
      rect: this.data.rect,
      hidden: this.data.hidden,
      actions: this.data.actions,
      page: this.data.pageIndex,
      strokeColor: this.data.borderColor,
      fillColor: this.data.backgroundColor,
      rotation: this.rotation,
      type,
    };
  }

  get fallbackFontDict() {
    const dict = new Dict();
    dict.set("BaseFont", Name.get("ZapfDingbats"));
    dict.set("Type", Name.get("FallbackType"));
    dict.set("Subtype", Name.get("FallbackType"));
    dict.set("Encoding", Name.get("ZapfDingbatsEncoding"));

    return shadow(this, "fallbackFontDict", dict);
  }
}

class ChoiceWidgetAnnotation extends WidgetAnnotation {
  constructor(params: _AnnotationCtorP) {
    super(params);

    // Determine the options. The options array may consist of strings or
    // arrays. If the array consists of arrays, then the first element of
    // each array is the export value and the second element of each array is
    // the display value. If the array consists of strings, then these
    // represent both the export and display value. In this case, we convert
    // it to an array of arrays as well for convenience in the display layer.
    // Note that the specification does not state that the `Opt` field is
    // inheritable, but in practice PDF generators do make annotations
    // inherit the options from a parent annotation (issue 8094).
    this.data.options = [];

    const options = getInheritableProperty(
      { dict: params.dict, key: "Opt" },
    ); // Table 246
    if (Array.isArray(options)) {
      const xref = params.xref;
      for (let i = 0, ii = options.length; i < ii; i++) {
        const option = xref.fetchIfRef(options[i]);
        const isOptionArray = Array.isArray(option);

        this.data.options[i] = {
          exportValue: this._decodeFormValue(
            isOptionArray ? xref.fetchIfRef((<Obj[]> option)[0]) : option,
          ),
          displayValue: this._decodeFormValue(
            isOptionArray ? xref.fetchIfRef((<Obj[]> option)[1]) : option,
          ),
        };
      }
    }

    // The field value can be `null` if no item is selected, a string if one
    // item is selected or an array of strings if multiple items are selected.
    // For consistency in the API and convenience in the display layer, we
    // always make the field value an array with zero, one or multiple items.
    if (typeof this.data.fieldValue === "string") {
      this.data.fieldValue = [<string> this.data.fieldValue];
    } else if (!this.data.fieldValue) {
      this.data.fieldValue = [];
    }

    // Process field flags for the display layer.
    this.data.combo = this.hasFieldFlag(AnnotationFieldFlag.COMBO);
    this.data.multiSelect = this.hasFieldFlag(AnnotationFieldFlag.MULTISELECT);
    this._hasText = true;
  }

  override getFieldObject() {
    const type = this.data.combo ? "combobox" : "listbox";
    const value = this.data.fieldValue!.length > 0
      ? this.data.fieldValue![0]
      : undefined;
    return <FieldObject> {
      id: this.data.id,
      value,
      defaultValue: this.data.defaultFieldValue,
      editable: !this.data.readOnly,
      name: this.data.fieldName,
      rect: this.data.rect,
      numItems: this.data.fieldValue!.length,
      multipleSelection: this.data.multiSelect,
      hidden: this.data.hidden,
      actions: this.data.actions,
      items: this.data.options,
      page: this.data.pageIndex,
      strokeColor: this.data.borderColor,
      fillColor: this.data.backgroundColor,
      rotation: this.rotation,
      type,
    };
  }

  protected override async getAppearance$(
    evaluator: PartialEvaluator,
    task: WorkerTask,
    annotationStorage?: AnnotStorageRecord,
  ) {
    if (this.data.combo) {
      return super.getAppearance$(evaluator, task, annotationStorage);
    }

    if (!annotationStorage) {
      return undefined;
    }

    const storageEntry = annotationStorage.get(this.data.id);
    if (!storageEntry) {
      return undefined;
    }

    const rotation = storageEntry.rotation;
    let exportedValue = <string | string[] | undefined> storageEntry.value;
    if (rotation === undefined && exportedValue === undefined) {
      // The annotation hasn't been rendered so use the appearance
      return undefined;
    }

    if (exportedValue === undefined) {
      exportedValue = this.data.fieldValue;
    } else if (!Array.isArray(exportedValue)) {
      exportedValue = [exportedValue];
    }

    const defaultPadding = 2;
    const hPadding = defaultPadding;
    let totalHeight = this.data.rect[3] - this.data.rect[1];
    let totalWidth = this.data.rect[2] - this.data.rect[0];

    if (rotation === 90 || rotation === 270) {
      [totalWidth, totalHeight] = [totalHeight, totalWidth];
    }

    const lineCount = this.data.options!.length;
    const valueIndices = [];
    for (let i = 0; i < lineCount; i++) {
      const { exportValue } = this.data.options![i];
      if (exportedValue!.includes(<string> exportValue)) {
        valueIndices.push(i);
      }
    }

    if (!this._defaultAppearance) {
      // The DA is required and must be a string.
      // If there is no font named Helvetica in the resource dictionary,
      // the evaluator will fall back to a default font.
      // Doing so prevents exceptions and allows saving/printing
      // the file as expected.
      this.data.defaultAppearanceData = parseDefaultAppearance(
        this._defaultAppearance = "/Helvetica 0 Tf 0 g",
      );
    }

    const font = await WidgetAnnotation._getFontData(
      evaluator,
      task,
      this.data.defaultAppearanceData,
      this._fieldResources.mergedResources,
    );

    let defaultAppearance;
    let { fontSize } = this.data.defaultAppearanceData!;
    if (!fontSize) {
      const lineHeight = (totalHeight - defaultPadding) / lineCount;
      let lineWidth = -1;
      let value: string;
      for (const { displayValue } of this.data.options!) {
        const width = this.getTextWidth$(<string> displayValue, font);
        if (width > lineWidth) {
          lineWidth = width;
          value = <string> displayValue;
        }
      }

      [defaultAppearance, fontSize] = this.computeFontSize$(
        lineHeight,
        totalWidth - 2 * hPadding,
        value!,
        font,
        -1,
      );
    } else {
      defaultAppearance = this._defaultAppearance;
    }

    const lineHeight = fontSize * LINE_FACTOR;
    const vPadding = (lineHeight - fontSize) / 2;
    const numberOfVisibleLines = Math.floor(totalHeight / lineHeight);

    let firstIndex;
    if (valueIndices.length === 1) {
      const valuePosition = valueIndices[0];
      const indexInPage = valuePosition % numberOfVisibleLines;
      firstIndex = valuePosition - indexInPage;
    } else {
      // If nothing is selected (valueIndice.length === 0), we render
      // from the first element.
      firstIndex = valueIndices.length ? valueIndices[0] : 0;
    }
    const end = Math.min(firstIndex + numberOfVisibleLines + 1, lineCount);

    const buf = ["/Tx BMC q", `1 1 ${totalWidth} ${totalHeight} re W n`];

    if (valueIndices.length) {
      // This value has been copied/pasted from annotation-choice-widget.pdf.
      // It corresponds to rgb(153, 193, 218).
      buf.push("0.600006 0.756866 0.854904 rg");

      // Highlight the lines in filling a blue rectangle at the selected
      // positions.
      for (const index of valueIndices) {
        if (firstIndex <= index && index < end) {
          buf.push(
            `1 ${
              totalHeight - (index - firstIndex + 1) * lineHeight
            } ${totalWidth} ${lineHeight} re f`,
          );
        }
      }
    }
    buf.push("BT", defaultAppearance, `1 0 0 1 0 ${totalHeight} Tm`);

    for (let i = firstIndex; i < end; i++) {
      const { displayValue } = this.data.options![i];
      const hpadding = i === firstIndex ? hPadding : 0;
      const vpadding = i === firstIndex ? vPadding : 0;
      buf.push(
        this._renderText(
          <string> displayValue,
          font,
          fontSize,
          totalWidth,
          0,
          hpadding,
          -lineHeight + vpadding,
        ),
      );
    }

    buf.push("ET Q EMC");

    return buf.join("\n");
  }
}

class SignatureWidgetAnnotation extends WidgetAnnotation {
  constructor(params: _AnnotationCtorP) {
    super(params);

    // Unset the fieldValue since it's (most likely) a `Dict` which is
    // non-serializable and will thus cause errors when sending annotations
    // to the main-thread (issue 10347).
    this.data.fieldValue = undefined;
  }

  override getFieldObject() {
    return <FieldObject> {
      id: this.data.id,
      page: this.data.pageIndex,
      type: "signature",
    };
  }
}

class TextAnnotation extends MarkupAnnotation {
  constructor(parameters: _AnnotationCtorP) {
    const DEFAULT_ICON_SIZE = 22; // px

    super(parameters);

    const dict = parameters.dict;
    this.data.annotationType = AnnotationType.TEXT;

    if (this.data.hasAppearance) {
      this.data.name = "NoIcon";
    } else {
      this.data.rect[1] = this.data.rect[3] - DEFAULT_ICON_SIZE;
      this.data.rect[2] = this.data.rect[0] + DEFAULT_ICON_SIZE;
      this.data.name = dict.has("Name")
        ? (<Name> dict.get("Name")).name
        : "Note";
    }

    if (dict.has("State")) {
      this.data.state = <string | undefined> dict.get("State");
      this.data.stateModel = <string | undefined> dict.get("StateModel");
    } else {
      this.data.state = undefined;
      this.data.stateModel = undefined;
    }
  }
}

class LinkAnnotation extends Annotation {
  constructor(params: _AnnotationCtorP) {
    super(params);

    this.data.annotationType = AnnotationType.LINK;

    const quadPoints = getQuadPoints(params.dict, this.rectangle);
    if (quadPoints) {
      this.data.quadPoints = quadPoints;
    }

    // The color entry for a link annotation is the color of the border.
    this.data.borderColor = this.data.borderColor || this.data.color;

    Catalog.parseDestDictionary({
      destDict: params.dict,
      resultObj: this.data,
      docBaseUrl: params.pdfManager.docBaseUrl,
      docAttachments: params.attachments,
    });
  }
}

export class PopupAnnotation extends Annotation {
  constructor(parameters: _AnnotationCtorP) {
    super(parameters);

    this.data.annotationType = AnnotationType.POPUP;

    let parentItem = <Dict> parameters.dict.get("Parent");
    if (!parentItem) {
      warn("Popup annotation has a missing or invalid parent annotation.");
      return;
    }

    const parentSubtype = parentItem.get("Subtype");
    this.data.parentType = parentSubtype instanceof Name
      ? parentSubtype.name
      : undefined;
    const rawParent = parameters.dict.getRaw("Parent");
    this.data.parentId = rawParent instanceof Ref
      ? rawParent.toString()
      : undefined;

    const parentRect = parentItem.getArray("Rect");
    if (Array.isArray(parentRect) && parentRect.length === 4) {
      this.data.parentRect = Util.normalizeRect(<rect_t> parentRect);
    } else {
      this.data.parentRect = [0, 0, 0, 0];
    }

    const rt = parentItem.get("RT");
    if (rt instanceof Name && rt.name === AnnotationReplyType.GROUP) {
      // Subordinate annotations in a group should inherit
      // the group attributes from the primary annotation.
      parentItem = <Dict> parentItem.get("IRT");
    }

    if (!parentItem.has("M")) {
      this.data.modificationDate = undefined;
    } else {
      this.setModificationDate(parentItem.get("M"));
      this.data.modificationDate = this.modificationDate;
    }

    if (!parentItem.has("C")) {
      // Fall back to the default background color.
      this.data.color = undefined;
    } else {
      this.setColor(<number[]> parentItem.getArray("C"));
      this.data.color = this.color;
    }

    // If the Popup annotation is not viewable, but the parent annotation is,
    // that is most likely a bug. Fallback to inherit the flags from the parent
    // annotation (this is consistent with the behaviour in Adobe Reader).
    if (!this.viewable) {
      const parentFlags = <AnnotationFlag> parentItem.get("F");
      if (this._isViewable(parentFlags)) {
        this.setFlags(parentFlags);
      }
    }

    this.setTitle(parentItem.get("T"));
    this.data.titleObj = this._title;

    this.setContents(<string> parentItem.get("Contents"));
    this.data.contentsObj = this._contents;

    if (parentItem.has("RC")) {
      this.data.richText = XFAFactory.getRichTextAsHtml(
        <string> parentItem.get("RC"),
      );
    }
  }
}

class FreeTextAnnotation extends MarkupAnnotation {
  constructor(parameters: _AnnotationCtorP) {
    super(parameters);

    this.data.annotationType = AnnotationType.FREETEXT;
  }

  override get hasTextContent() {
    return !!this.appearance;
  }

  static override createNewDict(
    annotation: AnnotStorageValue,
    xref: XRef,
    { apRef, ap }: _CreateNewDictP,
  ) {
    const { color, fontSize, rect, rotation, user, value } = annotation;
    const freetext = new Dict(xref);
    freetext.set("Type", Name.get("Annot"));
    freetext.set("Subtype", Name.get("FreeText"));
    freetext.set("CreationDate", `D:${getModificationDate()}`);
    freetext.set("Rect", rect);
    const da = `/Helv ${fontSize} Tf ${getPdfColor(color!, /* isFill */ true)}`;
    freetext.set("DA", da);
    freetext.set("Contents", value);
    freetext.set("F", 4);
    freetext.set("Border", [0, 0, 0]);
    freetext.set("Rotate", rotation);

    if (user) {
      freetext.set("T", stringToUTF8String(user));
    }

    const n = new Dict(xref);
    freetext.set("AP", n);

    if (apRef) {
      n.set("N", apRef);
    } else {
      n.set("N", ap);
    }

    return freetext;
  }

  static override async createNewAppearanceStream(
    annotation: AnnotStorageValue,
    xref: XRef,
    params?: _CreateNewAnnotationP,
  ) {
    const { baseFontRef, evaluator, task } = params!;
    const { color, fontSize, rect, rotation, value } = annotation;

    const resources = new Dict(xref);
    const font = new Dict(xref);

    if (baseFontRef) {
      font.set("Helv", baseFontRef);
    } else {
      const baseFont = new Dict(xref);
      baseFont.set("BaseFont", Name.get("Helvetica"));
      baseFont.set("Type", Name.get("Font"));
      baseFont.set("Subtype", Name.get("Type1"));
      baseFont.set("Encoding", Name.get("WinAnsiEncoding"));
      font.set("Helv", baseFont);
    }
    resources.set("Font", font);

    const helv = await WidgetAnnotation._getFontData(
      evaluator,
      task,
      <DefaultAppearanceData> {
        fontName: "Helvetica",
        fontSize,
      },
      resources,
    );

    const [x1, y1, x2, y2] = rect!;
    let w = x2 - x1;
    let h = y2 - y1;

    if (rotation! % 180 !== 0) {
      [w, h] = [h, w];
    }

    const lines = (<string> value).split("\n");
    const scale = fontSize! / 1000;
    let totalWidth = -Infinity;
    const encodedLines = [];
    for (let line of lines) {
      line = helv.encodeString(line).join("");
      encodedLines.push(line);
      let lineWidth = 0;
      const glyphs = helv.charsToGlyphs(line);
      for (const glyph of glyphs) {
        lineWidth += glyph.width! * scale;
      }
      totalWidth = Math.max(totalWidth, lineWidth);
    }

    let hscale = 1;
    if (totalWidth > w) {
      hscale = w / totalWidth;
    }
    let vscale = 1;
    const lineHeight = LINE_FACTOR * fontSize!;
    const lineDescent = LINE_DESCENT_FACTOR * fontSize!;
    const totalHeight = lineHeight * lines.length;
    if (totalHeight > h) {
      vscale = h / totalHeight;
    }
    const fscale = Math.min(hscale, vscale);
    const newFontSize = fontSize! * fscale;
    const buffer = [
      "q",
      `0 0 ${numberToString(w)} ${numberToString(h)} re W n`,
      `BT`,
      `1 0 0 1 0 ${numberToString(h + lineDescent)} Tm 0 Tc ${
        getPdfColor(
          color!,
          /* isFill */ true,
        )
      }`,
      `/Helv ${numberToString(newFontSize)} Tf`,
    ];

    const vShift = numberToString(lineHeight);
    for (const line of encodedLines) {
      buffer.push(`0 -${vShift} Td (${escapeString(line)}) Tj`);
    }
    buffer.push("ET", "Q");
    const appearance = buffer.join("\n");

    const appearanceStreamDict = new Dict(xref);
    appearanceStreamDict.set("FormType", 1);
    appearanceStreamDict.set("Subtype", Name.get("Form"));
    appearanceStreamDict.set("Type", Name.get("XObject"));
    appearanceStreamDict.set("BBox", [0, 0, w, h]);
    appearanceStreamDict.set("Length", appearance.length);
    appearanceStreamDict.set("Resources", resources);

    if (rotation) {
      const matrix = WidgetAnnotation._getRotationMatrix(rotation, w, h);
      appearanceStreamDict.set("Matrix", matrix);
    }

    const ap = new StringStream(appearance);
    ap.dict = appearanceStreamDict;

    return ap;
  }
}

class LineAnnotation extends MarkupAnnotation {
  constructor(parameters: _AnnotationCtorP) {
    super(parameters);

    const { dict } = parameters;
    this.data.annotationType = AnnotationType.LINE;

    const lineCoordinates = <rect_t> dict.getArray("L");
    this.data.lineCoordinates = Util.normalizeRect(lineCoordinates);

    this.setLineEndings(<[_LineEnding, _LineEnding]> dict.getArray("LE"));
    this.data.lineEndings = this.lineEndings;

    if (!this.appearance) {
      // The default stroke color is black.
      const strokeColor = this.color
        ? Array.from(this.color, (c) => c / 255) as AColor
        : [0, 0, 0] as AColor;
      const strokeAlpha = dict.get("CA") as number | undefined;

      // The default fill color is transparent. Setting the fill colour is
      // necessary if/when we want to add support for non-default line endings.
      let fillColor: AColor | undefined,
        interiorColor = <number[] | undefined> dict.getArray("IC");
      if (interiorColor) {
        const interiorColor_1 = getRgbColor(interiorColor);
        fillColor = interiorColor_1
          ? Array.from(interiorColor_1, (c) => c / 255) as AColor
          : undefined;
      }
      const fillAlpha = fillColor ? strokeAlpha : undefined;

      const borderWidth = this.borderStyle.width || 1,
        borderAdjust = 2 * borderWidth;

      // If the /Rect-entry is empty/wrong, create a fallback rectangle so that
      // we get similar rendering/highlighting behaviour as in Adobe Reader.
      const bbox: rect_t = [
        this.data.lineCoordinates[0] - borderAdjust,
        this.data.lineCoordinates[1] - borderAdjust,
        this.data.lineCoordinates[2] + borderAdjust,
        this.data.lineCoordinates[3] + borderAdjust,
      ];
      if (!Util.intersect(this.rectangle, bbox)) {
        this.rectangle = bbox;
      }

      this.setDefaultAppearance$({
        xref: parameters.xref,
        extra: `${borderWidth} w`,
        strokeColor,
        fillColor,
        strokeAlpha,
        fillAlpha,
        pointsCallback: (buffer, points) => {
          buffer.push(
            `${lineCoordinates[0]} ${lineCoordinates[1]} m`,
            `${lineCoordinates[2]} ${lineCoordinates[3]} l`,
            "S",
          );
          return [
            points[0].x - borderWidth,
            points[1].x + borderWidth,
            points[3].y - borderWidth,
            points[1].y + borderWidth,
          ];
        },
      });
    }
  }
}

class SquareAnnotation extends MarkupAnnotation {
  constructor(parameters: _AnnotationCtorP) {
    super(parameters);

    this.data.annotationType = AnnotationType.SQUARE;

    if (!this.appearance) {
      // The default stroke color is black.
      const strokeColor = this.color
        ? Array.from(this.color, (c) => c / 255) as AColor
        : [0, 0, 0] as AColor;
      const strokeAlpha = parameters.dict.get("CA") as number | undefined;

      // The default fill color is transparent.
      let fillColor: AColor | undefined,
        interiorColor: number[] | Uint8ClampedArray | undefined =
          <number[]> parameters.dict.getArray("IC");
      if (interiorColor) {
        interiorColor = getRgbColor(interiorColor);
        fillColor = interiorColor
          ? Array.from(interiorColor, (c) => c / 255) as AColor
          : undefined;
      }
      const fillAlpha = fillColor ? strokeAlpha : undefined;

      if (this.borderStyle.width === 0 && !fillColor) {
        // Prevent rendering a "hairline" border (fixes issue14164.pdf).
        return;
      }

      this.setDefaultAppearance$({
        xref: parameters.xref,
        extra: `${this.borderStyle.width} w`,
        strokeColor,
        fillColor,
        strokeAlpha,
        fillAlpha,
        pointsCallback: (buffer, points) => {
          const x = points[2].x + this.borderStyle.width / 2;
          const y = points[2].y + this.borderStyle.width / 2;
          const width = points[3].x - points[2].x - this.borderStyle.width;
          const height = points[1].y - points[3].y - this.borderStyle.width;
          buffer.push(`${x} ${y} ${width} ${height} re`);
          if (fillColor) {
            buffer.push("B");
          } else {
            buffer.push("S");
          }
          return [points[0].x, points[1].x, points[3].y, points[1].y];
        },
      });
    }
  }
}

class CircleAnnotation extends MarkupAnnotation {
  constructor(parameters: _AnnotationCtorP) {
    super(parameters);

    this.data.annotationType = AnnotationType.CIRCLE;

    if (!this.appearance) {
      // The default stroke color is black.
      const strokeColor = this.color
        ? Array.from(this.color, (c) => c / 255) as AColor
        : [0, 0, 0] as AColor;
      const strokeAlpha = parameters.dict.get("CA") as number | undefined;

      // The default fill color is transparent.
      let fillColor: AColor | undefined;
      let interiorColor: number[] | Uint8ClampedArray | undefined =
        <number[]> parameters.dict.getArray("IC");
      if (interiorColor) {
        interiorColor = getRgbColor(interiorColor);
        fillColor = interiorColor
          ? Array.from(interiorColor, (c) => c / 255) as AColor
          : undefined;
      }
      const fillAlpha = fillColor ? strokeAlpha : undefined;

      if (this.borderStyle.width === 0 && !fillColor) {
        // Prevent rendering a "hairline" border (fixes issue14164.pdf).
        return;
      }

      // Circles are approximated by Bézier curves with four segments since
      // there is no circle primitive in the PDF specification. For the control
      // points distance, see https://stackoverflow.com/a/27863181.
      const controlPointsDistance = (4 / 3) * Math.tan(Math.PI / (2 * 4));

      this.setDefaultAppearance$({
        xref: parameters.xref,
        extra: `${this.borderStyle.width} w`,
        strokeColor,
        fillColor,
        strokeAlpha,
        fillAlpha,
        pointsCallback: (buffer, points) => {
          const x0 = points[0].x + this.borderStyle.width / 2;
          const y0 = points[0].y - this.borderStyle.width / 2;
          const x1 = points[3].x - this.borderStyle.width / 2;
          const y1 = points[3].y + this.borderStyle.width / 2;
          const xMid = x0 + (x1 - x0) / 2;
          const yMid = y0 + (y1 - y0) / 2;
          const xOffset = ((x1 - x0) / 2) * controlPointsDistance;
          const yOffset = ((y1 - y0) / 2) * controlPointsDistance;

          buffer.push(
            `${xMid} ${y1} m`,
            `${xMid + xOffset} ${y1} ${x1} ${yMid + yOffset} ${x1} ${yMid} c`,
            `${x1} ${yMid - yOffset} ${xMid + xOffset} ${y0} ${xMid} ${y0} c`,
            `${xMid - xOffset} ${y0} ${x0} ${yMid - yOffset} ${x0} ${yMid} c`,
            `${x0} ${yMid + yOffset} ${xMid - xOffset} ${y1} ${xMid} ${y1} c`,
            "h",
          );
          if (fillColor) {
            buffer.push("B");
          } else {
            buffer.push("S");
          }
          return [points[0].x, points[1].x, points[3].y, points[1].y];
        },
      });
    }
  }
}

class PolylineAnnotation extends MarkupAnnotation {
  constructor(parameters: _AnnotationCtorP) {
    super(parameters);

    const { dict } = parameters;
    this.data.annotationType = AnnotationType.POLYLINE;
    this.data.vertices = [];

    if (!(this instanceof PolygonAnnotation)) {
      // Only meaningful for polyline annotations.
      this.setLineEndings(<[_LineEnding, _LineEnding]> dict.getArray("LE"));
      this.data.lineEndings = this.lineEndings;
    }

    // The vertices array is an array of numbers representing the alternating
    // horizontal and vertical coordinates, respectively, of each vertex.
    // Convert this to an array of objects with x and y coordinates.
    const rawVertices = <number[]> dict.getArray("Vertices");
    if (!Array.isArray(rawVertices)) {
      return;
    }

    for (let i = 0, ii = rawVertices.length; i < ii; i += 2) {
      this.data.vertices.push({
        x: rawVertices[i],
        y: rawVertices[i + 1],
      });
    }

    if (!this.appearance) {
      // The default stroke color is black.
      const strokeColor = this.color
        ? Array.from(this.color, (c) => c / 255) as AColor
        : [0, 0, 0] as AColor;
      const strokeAlpha = dict.get("CA") as number | undefined;

      const borderWidth = this.borderStyle.width || 1,
        borderAdjust = 2 * borderWidth;

      // If the /Rect-entry is empty/wrong, create a fallback rectangle so that
      // we get similar rendering/highlighting behaviour as in Adobe Reader.
      const bbox: rect_t = [Infinity, Infinity, -Infinity, -Infinity];
      for (const vertex of this.data.vertices) {
        bbox[0] = Math.min(bbox[0], vertex.x - borderAdjust);
        bbox[1] = Math.min(bbox[1], vertex.y - borderAdjust);
        bbox[2] = Math.max(bbox[2], vertex.x + borderAdjust);
        bbox[3] = Math.max(bbox[3], vertex.y + borderAdjust);
      }
      if (!Util.intersect(this.rectangle, bbox)) {
        this.rectangle = bbox;
      }

      this.setDefaultAppearance$({
        xref: parameters.xref,
        extra: `${borderWidth} w`,
        strokeColor,
        strokeAlpha,
        pointsCallback: (buffer, points) => {
          const vertices = this.data.vertices!;
          for (let i = 0, ii = vertices.length; i < ii; i++) {
            buffer.push(
              `${vertices[i].x} ${vertices[i].y} ${i === 0 ? "m" : "l"}`,
            );
          }
          buffer.push("S");
          return [points[0].x, points[1].x, points[3].y, points[1].y];
        },
      });
    }
  }
}

class PolygonAnnotation extends PolylineAnnotation {
  constructor(parameters: _AnnotationCtorP) {
    // Polygons are specific forms of polylines, so reuse their logic.
    super(parameters);

    this.data.annotationType = AnnotationType.POLYGON;
  }
}

class CaretAnnotation extends MarkupAnnotation {
  constructor(parameters: _AnnotationCtorP) {
    super(parameters);

    this.data.annotationType = AnnotationType.CARET;
  }
}

class InkAnnotation extends MarkupAnnotation {
  constructor(parameters: _AnnotationCtorP) {
    super(parameters);

    this.data.annotationType = AnnotationType.INK;
    this.data.inkLists = [];

    const rawInkLists = <(number | Ref)[][]> parameters.dict.getArray(
      "InkList",
    );
    if (!Array.isArray(rawInkLists)) {
      return;
    }

    const xref = parameters.xref;
    for (let i = 0, ii = rawInkLists.length; i < ii; ++i) {
      // The raw ink lists array contains arrays of numbers representing
      // the alternating horizontal and vertical coordinates, respectively,
      // of each vertex. Convert this to an array of objects with x and y
      // coordinates.
      this.data.inkLists.push([]);
      for (let j = 0, jj = rawInkLists[i].length; j < jj; j += 2) {
        this.data.inkLists[i].push({
          x: <number> xref.fetchIfRef(rawInkLists[i][j]),
          y: <number> xref.fetchIfRef(rawInkLists[i][j + 1]),
        });
      }
    }

    if (!this.appearance) {
      // The default stroke color is black.
      const strokeColor = this.color
        ? Array.from(this.color, (c) => c / 255) as AColor
        : [0, 0, 0] as AColor;
      const strokeAlpha = parameters.dict.get("CA") as number | undefined;

      const borderWidth = this.borderStyle.width || 1,
        borderAdjust = 2 * borderWidth;

      // If the /Rect-entry is empty/wrong, create a fallback rectangle so that
      // we get similar rendering/highlighting behaviour as in Adobe Reader.
      const bbox: rect_t = [Infinity, Infinity, -Infinity, -Infinity];
      for (const inkLists of this.data.inkLists) {
        for (const vertex of inkLists) {
          bbox[0] = Math.min(bbox[0], vertex.x - borderAdjust);
          bbox[1] = Math.min(bbox[1], vertex.y - borderAdjust);
          bbox[2] = Math.max(bbox[2], vertex.x + borderAdjust);
          bbox[3] = Math.max(bbox[3], vertex.y + borderAdjust);
        }
      }
      if (!Util.intersect(this.rectangle, bbox)) {
        this.rectangle = bbox;
      }

      this.setDefaultAppearance$({
        xref: parameters.xref,
        extra: `${borderWidth} w`,
        strokeColor,
        strokeAlpha,
        pointsCallback: (buffer, points) => {
          // According to the specification, see "12.5.6.13 Ink Annotations":
          //   When drawn, the points shall be connected by straight lines or
          //   curves in an implementation-dependent way.
          // In order to simplify things, we utilize straight lines for now.
          for (const inkList of this.data.inkLists!) {
            for (let i = 0, ii = inkList.length; i < ii; i++) {
              buffer.push(
                `${inkList[i].x} ${inkList[i].y} ${i === 0 ? "m" : "l"}`,
              );
            }
            buffer.push("S");
          }
          return [points[0].x, points[1].x, points[3].y, points[1].y];
        },
      });
    }
  }

  static override createNewDict(
    annotation: AnnotStorageValue,
    xref: XRef,
    { apRef, ap }: _CreateNewDictP,
  ) {
    const { paths, rect, rotation } = annotation;
    const ink = new Dict(xref);
    ink.set("Type", Name.get("Annot"));
    ink.set("Subtype", Name.get("Ink"));
    ink.set("CreationDate", `D:${getModificationDate()}`);
    ink.set("Rect", rect);
    ink.set(
      "InkList",
      paths!.map((p) => p.points),
    );
    ink.set("F", 4);
    ink.set("Border", [0, 0, 0]);
    ink.set("Rotate", rotation);

    const n = new Dict(xref);
    ink.set("AP", n);

    if (apRef) {
      n.set("N", apRef);
    } else {
      n.set("N", ap);
    }

    return ink;
  }

  static override async createNewAppearanceStream(
    annotation: AnnotStorageValue,
    xref: XRef,
    params?: _CreateNewAnnotationP,
  ) {
    const { color, rect, rotation, paths, thickness, opacity } = annotation;
    const [x1, y1, x2, y2] = rect!;
    let w = x2 - x1;
    let h = y2 - y1;

    if (rotation! % 180 !== 0) {
      [w, h] = [h, w];
    }

    const appearanceBuffer = [
      `${thickness} w 1 J 1 j`,
      `${getPdfColor(color!, /* isFill */ false)}`,
    ];

    if (opacity !== 1) {
      appearanceBuffer.push("/R0 gs");
    }

    const buffer = [];
    for (const { bezier } of paths!) {
      buffer.length = 0;
      buffer.push(
        `${numberToString(bezier[0])} ${numberToString(bezier[1])} m`,
      );
      for (let i = 2, ii = bezier.length; i < ii; i += 6) {
        const curve = bezier
          .slice(i, i + 6)
          .map(numberToString)
          .join(" ");
        buffer.push(`${curve} c`);
      }
      buffer.push("S");
      appearanceBuffer.push(buffer.join("\n"));
    }
    const appearance = appearanceBuffer.join("\n");

    const appearanceStreamDict = new Dict(xref);
    appearanceStreamDict.set("FormType", 1);
    appearanceStreamDict.set("Subtype", Name.get("Form"));
    appearanceStreamDict.set("Type", Name.get("XObject"));
    appearanceStreamDict.set("BBox", [0, 0, w, h]);
    appearanceStreamDict.set("Length", appearance.length);

    if (rotation) {
      const matrix = WidgetAnnotation._getRotationMatrix(rotation, w, h);
      appearanceStreamDict.set("Matrix", matrix);
    }

    if (opacity !== 1) {
      const resources = new Dict(xref);
      const extGState = new Dict(xref);
      const r0 = new Dict(xref);
      r0.set("CA", opacity);
      r0.set("Type", Name.get("ExtGState"));
      extGState.set("R0", r0);
      resources.set("ExtGState", extGState);
      appearanceStreamDict.set("Resources", resources);
    }

    const ap = new StringStream(appearance);
    ap.dict = appearanceStreamDict;

    return ap;
  }
}

class HighlightAnnotation extends MarkupAnnotation {
  constructor(parameters: _AnnotationCtorP) {
    super(parameters);

    this.data.annotationType = AnnotationType.HIGHLIGHT;
    const quadPoints = (this.data.quadPoints = getQuadPoints(parameters.dict));
    if (quadPoints) {
      const resources = <Dict | undefined> this.appearance?.dict!.get(
        "Resources",
      );

      if (!this.appearance || !resources?.has("ExtGState")) {
        if (this.appearance) {
          // Workaround for cases where there's no /ExtGState-entry directly
          // available, e.g. when the appearance stream contains a /XObject of
          // the /Form-type, since that causes the highlighting to completely
          // obscure the PDF content below it (fixes issue13242.pdf).
          warn("HighlightAnnotation - ignoring built-in appearance stream.");
        }
        // Default color is yellow in Acrobat Reader
        const fillColor = this.color
          ? Array.from(this.color, (c) => c / 255) as AColor
          : [1, 1, 0] as AColor;
        const fillAlpha = parameters.dict.get("CA") as number | undefined;

        this.setDefaultAppearance$({
          xref: parameters.xref,
          fillColor,
          fillAlpha,
          blendMode: "Multiply",
          pointsCallback: (buffer, points) => {
            buffer.push(
              `${points[0].x} ${points[0].y} m`,
              `${points[1].x} ${points[1].y} l`,
              `${points[3].x} ${points[3].y} l`,
              `${points[2].x} ${points[2].y} l`,
              "f",
            );
            return [points[0].x, points[1].x, points[3].y, points[1].y];
          },
        });
      }
    } else {
      this.data.hasPopup = false;
    }
  }
}

class UnderlineAnnotation extends MarkupAnnotation {
  constructor(parameters: _AnnotationCtorP) {
    super(parameters);

    this.data.annotationType = AnnotationType.UNDERLINE;
    const quadPoints = (this.data.quadPoints = getQuadPoints(parameters.dict));
    if (quadPoints) {
      if (!this.appearance) {
        // Default color is black
        const strokeColor = this.color
          ? Array.from(this.color, (c) => c / 255) as AColor
          : [0, 0, 0] as AColor;
        const strokeAlpha = parameters.dict.get("CA") as number | undefined;

        this.setDefaultAppearance$({
          xref: parameters.xref,
          extra: "[] 0 d 1 w",
          strokeColor,
          strokeAlpha,
          pointsCallback: (buffer, points) => {
            buffer.push(
              `${points[2].x} ${points[2].y} m`,
              `${points[3].x} ${points[3].y} l`,
              "S",
            );
            return [points[0].x, points[1].x, points[3].y, points[1].y];
          },
        });
      }
    } else {
      this.data.hasPopup = false;
    }
  }
}

class SquigglyAnnotation extends MarkupAnnotation {
  constructor(parameters: _AnnotationCtorP) {
    super(parameters);

    this.data.annotationType = AnnotationType.SQUIGGLY;

    const quadPoints = (this.data.quadPoints = getQuadPoints(parameters.dict));
    if (quadPoints) {
      if (!this.appearance) {
        // Default color is black
        const strokeColor = this.color
          ? Array.from(this.color, (c) => c / 255) as AColor
          : [0, 0, 0] as AColor;
        const strokeAlpha = parameters.dict.get("CA") as number | undefined;

        this.setDefaultAppearance$({
          xref: parameters.xref,
          extra: "[] 0 d 1 w",
          strokeColor,
          strokeAlpha,
          pointsCallback: (buffer, points) => {
            const dy = (points[0].y - points[2].y) / 6;
            let shift = dy;
            let x = points[2].x;
            const y = points[2].y;
            const xEnd = points[3].x;
            buffer.push(`${x} ${y + shift} m`);
            do {
              x += 2;
              shift = shift === 0 ? dy : 0;
              buffer.push(`${x} ${y + shift} l`);
            } while (x < xEnd);
            buffer.push("S");
            return [points[2].x, xEnd, y - 2 * dy, y + 2 * dy];
          },
        });
      }
    } else {
      this.data.hasPopup = false;
    }
  }
}

class StrikeOutAnnotation extends MarkupAnnotation {
  constructor(parameters: _AnnotationCtorP) {
    super(parameters);

    this.data.annotationType = AnnotationType.STRIKEOUT;

    const quadPoints = (this.data.quadPoints = getQuadPoints(parameters.dict));
    if (quadPoints) {
      if (!this.appearance) {
        // Default color is black
        const strokeColor = this.color
          ? Array.from(this.color, (c) => c / 255) as AColor
          : [0, 0, 0] as AColor;
        const strokeAlpha = parameters.dict.get("CA") as number | undefined;

        this.setDefaultAppearance$({
          xref: parameters.xref,
          extra: "[] 0 d 1 w",
          strokeColor,
          strokeAlpha,
          pointsCallback: (buffer, points) => {
            buffer.push(
              `${(points[0].x + points[2].x) / 2} ` +
                `${(points[0].y + points[2].y) / 2} m`,
              `${(points[1].x + points[3].x) / 2} ` +
                `${(points[1].y + points[3].y) / 2} l`,
              "S",
            );
            return [points[0].x, points[1].x, points[3].y, points[1].y];
          },
        });
      }
    } else {
      this.data.hasPopup = false;
    }
  }
}

class StampAnnotation extends MarkupAnnotation {
  constructor(parameters: _AnnotationCtorP) {
    super(parameters);

    this.data.annotationType = AnnotationType.STAMP;
  }
}

class FileAttachmentAnnotation extends MarkupAnnotation {
  constructor(parameters: _AnnotationCtorP) {
    super(parameters);

    const file = new FileSpec(
      <Dict> parameters.dict.get("FS"),
      parameters.xref,
    );

    this.data.annotationType = AnnotationType.FILEATTACHMENT;
    this.data.file = file.serializable;
  }
}
/*80--------------------------------------------------------------------------*/
