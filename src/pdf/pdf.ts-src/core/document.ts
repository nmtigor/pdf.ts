/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/document.ts
 * @license Apache-2.0
 ******************************************************************************/

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

import type { rect_t } from "@fe-lib/alias.ts";
import { assert, fail } from "@fe-lib/util/trace.ts";
import { PDFJSDev, TESTING } from "@fe-src/global.ts";
import type {
  AnnotStorageRecord,
  AnnotStorageValue,
} from "../display/annotation_layer.ts";
import type { CMapData } from "../display/base_factory.ts";
import type {
  MessageHandler,
  StreamSink,
  Thread,
} from "../shared/message_handler.ts";
import {
  AnnotationEditorPrefix,
  FormatError,
  info,
  InvalidPDFException,
  PageActionEventType,
  RenderingIntentFlag,
  shadow,
  stringToBytes,
  stringToPDFString,
  stringToUTF8String,
  Util,
  warn,
} from "../shared/util.ts";
import type {
  Annotation,
  AnnotationGlobals,
  AnnotImage,
  AnnotSaveReturn,
  FieldObject,
  MarkupAnnotation,
} from "./annotation.ts";
import {
  AnnotationFactory,
  PopupAnnotation,
  WidgetAnnotation,
} from "./annotation.ts";
import { BaseStream } from "./base_stream.ts";
import { Catalog } from "./catalog.ts";
import { clearGlobalCaches } from "./cleanup_helper.ts";
import {
  collectActions,
  getInheritableProperty,
  getNewAnnotationsMap,
  isWhiteSpace,
  lookupNormalRect,
  MissingDataException,
  PDF_VERSION_REGEXP,
  validateCSSFont,
  XRefEntryException,
  XRefParseException,
} from "./core_utils.ts";
import { calculateMD5 } from "./crypto.ts";
import { DatasetReader, type DatasetReaderCtorP } from "./dataset_reader.ts";
import { StreamsSequenceStream } from "./decode_stream.ts";
import { PartialEvaluator, type TranslatedFont } from "./evaluator.ts";
import type { SubstitutionInfo } from "./font_substitutions.ts";
import type { ErrorFont, Font } from "./fonts.ts";
import type { GlobalImageCache } from "./image_utils.ts";
import { ObjectLoader } from "./object_loader.ts";
import { OperatorList } from "./operator_list.ts";
import { Linearization } from "./parser.ts";
import type { BasePdfManager } from "./pdf_manager.ts";
import {
  Dict,
  isName,
  isRefsEqual,
  Name,
  type Obj,
  Ref,
  RefSet,
  RefSetCache,
} from "./primitives.ts";
import { NullStream, type Stream } from "./stream.ts";
import { StructTreePage, type StructTreeRoot } from "./struct_tree.ts";
import type { WorkerTask } from "./worker.ts";
import { writeObject } from "./writer.ts";
import { XFAFactory } from "./xfa/factory.ts";
import {
  getXfaFontDict,
  getXfaFontName,
  type XFAFontMetrics,
} from "./xfa_fonts.ts";
import { XRef } from "./xref.ts";
/*80--------------------------------------------------------------------------*/

const DEFAULT_USER_UNIT = 1.0;
const LETTER_SIZE_MEDIABOX: rect_t = [0, 0, 612, 792];

export interface LocalIdFactory extends GlobalIdFactory {
  createObjId(): string;
}

interface PageCtorP_ {
  pdfManager: BasePdfManager;
  xref: XRef;
  pageIndex: number;
  pageDict: Dict;
  ref: Ref | undefined;
  globalIdFactory: GlobalIdFactory;
  fontCache: RefSetCache<Promise<TranslatedFont>>;
  builtInCMapCache: Map<string, CMapData>;
  standardFontDataCache: Map<string, Uint8Array | ArrayBuffer>;
  globalImageCache: GlobalImageCache;
  systemFontCache: Map<string, SubstitutionInfo>;
  nonBlendModesSet: RefSet;
  xfaFactory?: XFAFactory | undefined;
}

interface PageGetOperatorListP_ {
  handler: MessageHandler<Thread.worker>;
  sink: StreamSink<Thread.main, "GetOperatorList">;
  task: WorkerTask;
  intent: RenderingIntentFlag;
  cacheKey: string;
  annotationStorage: AnnotStorageRecord | undefined;
  modifiedIds?: Set<string> | undefined;
}

interface ExtractTextContentP_ {
  handler: MessageHandler<Thread.worker>;
  task: WorkerTask;
  includeMarkedContent: boolean;
  disableNormalization: boolean;
  sink: StreamSink<Thread.main, "GetTextContent">;
}

export class Page {
  pdfManager;
  pageIndex;
  pageDict; // Table 30
  xref;
  ref;
  fontCache;
  builtInCMapCache;
  standardFontDataCache;
  globalImageCache;
  systemFontCache;
  nonBlendModesSet;
  evaluatorOptions;
  xfaFactory;

  #localIdFactory: LocalIdFactory;
  get _localIdFactory() {
    return this.#localIdFactory;
  }

  resourcesPromise?: Promise<Dict>;

  constructor({
    pdfManager,
    xref,
    pageIndex,
    pageDict,
    ref,
    globalIdFactory,
    fontCache,
    builtInCMapCache,
    standardFontDataCache,
    globalImageCache,
    systemFontCache,
    nonBlendModesSet,
    xfaFactory,
  }: PageCtorP_) {
    this.pdfManager = pdfManager;
    this.pageIndex = pageIndex;
    this.pageDict = pageDict;
    this.xref = xref;
    this.ref = ref;
    this.fontCache = fontCache;
    this.builtInCMapCache = builtInCMapCache;
    this.standardFontDataCache = standardFontDataCache;
    this.globalImageCache = globalImageCache;
    this.systemFontCache = systemFontCache;
    this.nonBlendModesSet = nonBlendModesSet;
    this.evaluatorOptions = pdfManager.evaluatorOptions;
    this.xfaFactory = xfaFactory;

    const idCounters = {
      obj: 0,
    };
    this.#localIdFactory = Object.assign(globalIdFactory, {
      createObjId: () => `p${pageIndex}_${++idCounters.obj}`,
      getPageObjId: () => `p${ref!.toString()}`,
    });
  }

  #getInheritableProperty(key: string, getArray = false) {
    const value = getInheritableProperty({
      dict: this.pageDict,
      key,
      getArray,
      stopWhenFound: false,
    });
    if (!Array.isArray(value)) {
      return value;
    }
    if (value.length === 1 || !(value[0] instanceof Dict)) {
      return value[0];
    }
    return Dict.merge({ xref: this.xref, dictArray: <Dict[]> value });
  }

  get content() {
    return this.pageDict.getArray("Contents") as
      | Stream
      | (Ref | Stream)[]
      | undefined;
  }

  /**
   * Table 33
   */
  get resources() {
    // For robustness: The spec states that a \Resources entry has to be
    // present, but can be empty. Some documents still omit it; in this case
    // we return an empty dictionary.
    const resources = this.#getInheritableProperty("Resources");

    return shadow(
      this,
      "resources",
      resources instanceof Dict ? resources : Dict.empty,
    );
  }

  _getBoundingBox(name: string) {
    if (this.xfaData) {
      return this.xfaData.bbox;
    }
    const box = lookupNormalRect(
      this.#getInheritableProperty(name, /* getArray = */ true),
      undefined,
    );

    if (box) {
      if (box[2] - box[0] > 0 && box[3] - box[1] > 0) {
        return box;
      }
      warn(`Empty, or invalid, /${name} entry.`);
    }
    return undefined;
  }

  get mediaBox() {
    // Reset invalid media box to letter size.
    return shadow(
      this,
      "mediaBox",
      this._getBoundingBox("MediaBox") || LETTER_SIZE_MEDIABOX,
    );
  }

  get cropBox() {
    // Reset invalid crop box to media box.
    return shadow(
      this,
      "cropBox",
      this._getBoundingBox("CropBox") || this.mediaBox,
    );
  }

  get userUnit() {
    let obj = this.pageDict.get("UserUnit");
    if (!(typeof obj === "number") || obj <= 0) {
      obj = DEFAULT_USER_UNIT;
    }
    return shadow(this, "userUnit", obj);
  }

  get view(): rect_t {
    // From the spec, 6th ed., p.963:
    // "The crop, bleed, trim, and art boxes should not ordinarily
    // extend beyond the boundaries of the media box. If they do, they are
    // effectively reduced to their intersection with the media box."
    const { cropBox, mediaBox } = this;

    if (cropBox !== mediaBox && !cropBox.eq(mediaBox)) {
      const box = Util.intersect(cropBox, mediaBox);
      if (box && box[2] - box[0] > 0 && box[3] - box[1] > 0) {
        return shadow(this, "view", box);
      }
      warn("Empty /CropBox and /MediaBox intersection.");
    }
    return shadow(this, "view", mediaBox);
  }

  get rotate() {
    let rotate = <number> this.#getInheritableProperty("Rotate") || 0;

    // Normalize rotation so it's a multiple of 90 and between 0 and 270.
    if (rotate % 90 !== 0) {
      rotate = 0;
    } else if (rotate >= 360) {
      rotate %= 360;
    } else if (rotate < 0) {
      // The spec doesn't cover negatives. Assume it's counterclockwise
      // rotation. The following is the other implementation of modulo.
      rotate = ((rotate % 360) + 360) % 360;
    }
    return shadow(this, "rotate", rotate);
  }

  #onSubStreamError(
    reason: unknown,
    objId?: string,
  ) {
    if (this.evaluatorOptions.ignoreErrors) {
      warn(`getContentStream - ignoring sub-stream (${objId}): "${reason}".`);
      return;
    }
    throw reason;
  }

  getContentStream(): Promise<BaseStream> {
    return this.pdfManager.ensure(this, "content").then((content) => {
      if (content instanceof BaseStream) {
        return content;
      }
      if (Array.isArray(content)) {
        return new StreamsSequenceStream(
          content,
          this.#onSubStreamError.bind(this),
        );
      }
      // Replace non-existent page content with empty content.
      return new NullStream();
    });
  }

  get xfaData() {
    return shadow(
      this,
      "xfaData",
      this.xfaFactory
        ? { bbox: this.xfaFactory.getBoundingBox(this.pageIndex) }
        : undefined,
    );
  }

  #replaceIdByRef(
    annotations: AnnotStorageValue[],
    deletedAnnotations: RefSet | RefSetCache<Ref>,
    existingAnnotations: RefSet | undefined,
  ) {
    for (const annotation of annotations) {
      if (annotation.id) {
        const ref = Ref.fromString(annotation.id);
        if (!ref) {
          warn(`A non-linked annotation cannot be modified: ${annotation.id}`);
          continue;
        }
        if (annotation.deleted) {
          deletedAnnotations.put(ref, ref);
          continue;
        }
        existingAnnotations?.put(ref);
        annotation.ref = ref;
        delete annotation.id;
      }
    }
  }

  async saveNewAnnotations(
    handler: MessageHandler<Thread.worker>,
    task: WorkerTask,
    annotations: AnnotStorageValue[],
    imagePromises: Map<string, Promise<AnnotImage>> | undefined,
  ) {
    if (this.xfaFactory) {
      throw new Error("XFA: Cannot save new annotations.");
    }

    const partialEvaluator = new PartialEvaluator({
      xref: this.xref,
      handler,
      pageIndex: this.pageIndex,
      idFactory: this._localIdFactory,
      fontCache: this.fontCache,
      builtInCMapCache: this.builtInCMapCache,
      standardFontDataCache: this.standardFontDataCache,
      globalImageCache: this.globalImageCache,
      systemFontCache: this.systemFontCache,
      options: this.evaluatorOptions,
    });

    const deletedAnnotations = new RefSetCache<Ref>();
    const existingAnnotations = new RefSet();
    this.#replaceIdByRef(annotations, deletedAnnotations, existingAnnotations);

    const pageDict = this.pageDict;
    const annotationsArray = this.annotations.filter(
      (a) => !(a instanceof Ref && deletedAnnotations.has(a)),
    );
    const newData = await AnnotationFactory.saveNewAnnotations(
      partialEvaluator,
      task,
      annotations,
      imagePromises,
    );

    for (const { ref } of newData.annotations) {
      // Don't add an existing annotation ref to the annotations array.
      if (ref instanceof Ref && !existingAnnotations.has(ref)) {
        annotationsArray.push(ref);
      }
    }

    const savedDict = pageDict.get("Annots");
    pageDict.set("Annots", annotationsArray);
    const buffer: string[] = [];

    await writeObject(this.ref!, pageDict, buffer, this.xref);
    if (savedDict) {
      pageDict.set("Annots", savedDict);
    }

    const objects = newData.dependencies;
    objects.push(
      { ref: this.ref!, data: buffer.join("") },
      ...newData.annotations,
    );
    for (const deletedRef of deletedAnnotations) {
      objects.push({ ref: deletedRef, data: undefined });
    }

    // console.log("🚀 ~ Page ~ objects:")
    // console.dir(objects)
    return objects;
  }

  save(
    handler: MessageHandler<Thread.worker>,
    task: WorkerTask,
    annotationStorage?: AnnotStorageRecord,
  ) {
    const partialEvaluator = new PartialEvaluator({
      xref: this.xref,
      handler,
      pageIndex: this.pageIndex,
      idFactory: this.#localIdFactory,
      fontCache: this.fontCache,
      builtInCMapCache: this.builtInCMapCache,
      standardFontDataCache: this.standardFontDataCache,
      globalImageCache: this.globalImageCache,
      systemFontCache: this.systemFontCache,
      options: this.evaluatorOptions,
    });

    // Fetch the page's annotations and save the content
    // in case of interactive form fields.
    return this._parsedAnnotations.then((annotations) => {
      const newRefsPromises: Promise<AnnotSaveReturn | undefined>[] = [];
      for (const annotation of annotations) {
        if (!annotation.mustBePrinted(annotationStorage)) {
          continue;
        }
        newRefsPromises.push(
          annotation!
            .save(partialEvaluator, task, annotationStorage)
            .catch((reason) => {
              warn(
                "save - ignoring annotation data during " +
                  `"${task.name}" task: "${reason}".`,
              );
              return undefined;
            }),
        );
      }

      return Promise.all(newRefsPromises).then((newRefs) =>
        newRefs.filter((newRef) => !!newRef) as AnnotSaveReturn[]
      );
    });
  }

  loadResources(keys: string[]) {
    // TODO: add async `_getInheritableProperty` and remove this.
    this.resourcesPromise ||= this.pdfManager.ensure(this, "resources");

    return this.resourcesPromise.then(() => {
      const objectLoader = new ObjectLoader(this.resources, keys, this.xref);
      return objectLoader.load();
    });
  }

  getOperatorList({
    handler,
    sink,
    task,
    intent,
    cacheKey,
    annotationStorage = undefined,
    modifiedIds,
  }: PageGetOperatorListP_) {
    const contentStreamPromise = this.getContentStream();
    const resourcesPromise = this.loadResources([
      "ColorSpace",
      "ExtGState",
      "Font",
      "Pattern",
      "Properties",
      "Shading",
      "XObject",
    ]);

    const partialEvaluator = new PartialEvaluator({
      xref: this.xref,
      handler,
      pageIndex: this.pageIndex,
      idFactory: this.#localIdFactory,
      fontCache: this.fontCache,
      builtInCMapCache: this.builtInCMapCache,
      standardFontDataCache: this.standardFontDataCache,
      globalImageCache: this.globalImageCache,
      systemFontCache: this.systemFontCache,
      options: this.evaluatorOptions,
    });

    // const newAnnotationsByPage = !this.xfaFactory
    //   ? getNewAnnotationsMap(annotationStorage)
    //   : undefined;
    const newAnnotsByPage = !this.xfaFactory
      ? getNewAnnotationsMap(annotationStorage)
      : null;
    const newAnnots = newAnnotsByPage?.get(this.pageIndex);
    let newAnnotationsPromise: Promise<MarkupAnnotation[] | undefined> = Promise
      .resolve(undefined);
    let deletedAnnotations: RefSet | undefined;

    if (newAnnots) {
      const annotationGlobalsPromise = this.pdfManager.ensureDoc(
        "annotationGlobals",
      );
      let imagePromises: Map<string, Promise<AnnotImage>> | undefined;

      // An annotation can contain a reference to a bitmap, but this bitmap
      // is defined in another annotation. So we need to find this annotation
      // and generate the bitmap.
      const missingBitmaps = new Set<string>();
      for (const { bitmapId, bitmap } of newAnnots) {
        if (bitmapId && !bitmap && !missingBitmaps.has(bitmapId)) {
          missingBitmaps.add(bitmapId);
        }
      }

      const { isOffscreenCanvasSupported } = this.evaluatorOptions;
      if (missingBitmaps.size > 0) {
        const annotationWithBitmaps = newAnnots.slice();
        for (const [key, annotation] of annotationStorage!) {
          if (!key.startsWith(AnnotationEditorPrefix)) {
            continue;
          }
          if (annotation.bitmap && missingBitmaps.has(annotation.bitmapId!)) {
            annotationWithBitmaps.push(annotation);
          }
        }
        // The array annotationWithBitmaps cannot be empty: the check above
        // makes sure to have at least one annotation containing the bitmap.
        imagePromises = AnnotationFactory.generateImages(
          annotationWithBitmaps,
          this.xref,
          isOffscreenCanvasSupported,
        );
      } else {
        imagePromises = AnnotationFactory.generateImages(
          newAnnots,
          this.xref,
          isOffscreenCanvasSupported,
        );
      }

      deletedAnnotations = new RefSet();
      this.#replaceIdByRef(newAnnots, deletedAnnotations, undefined);

      newAnnotationsPromise = annotationGlobalsPromise.then(
        (annotationGlobals) => {
          if (!annotationGlobals) {
            return undefined;
          }

          return AnnotationFactory.printNewAnnotations(
            annotationGlobals,
            partialEvaluator,
            task,
            newAnnots,
            imagePromises,
          );
        },
      );
    }

    const pageListPromise = Promise.all([
      contentStreamPromise,
      resourcesPromise,
    ]).then(([contentStream]) => {
      const opList = new OperatorList(intent, sink);

      handler.send("StartRenderPage", {
        transparency: partialEvaluator.hasBlendModes(
          this.resources,
          this.nonBlendModesSet,
        ),
        pageIndex: this.pageIndex,
        cacheKey,
      });

      return partialEvaluator
        .getOperatorList({
          stream: contentStream,
          task,
          resources: this.resources,
          operatorList: opList,
        })
        .then(() => opList);
    });

    // Fetch the page's annotations and add their operator lists to the
    // page's operator list to render them.
    return Promise.all([
      pageListPromise,
      this._parsedAnnotations,
      newAnnotationsPromise,
    ]).then(([pageOpList, annotations, newAnnotations]) => {
      if (newAnnotations) {
        // Some annotations can already exist (if it has the refToReplace
        // property). In this case, we replace the old annotation by the new
        // one.
        annotations = annotations.filter(
          (a) => !(a?.ref && deletedAnnotations!.has(a.ref)),
        );
        for (let i = 0, ii = newAnnotations.length; i < ii; i++) {
          const newAnnotation = newAnnotations[i];
          if (newAnnotation.refToReplace) {
            const j = annotations.findIndex(
              (a) => a?.ref && isRefsEqual(a.ref, newAnnotation.refToReplace!),
            );
            if (j >= 0) {
              annotations.splice(j, 1, newAnnotation);
              newAnnotations.splice(i--, 1);
              ii--;
            }
          }
        }
        annotations = annotations.concat(newAnnotations);
      }
      if (
        annotations.length === 0 ||
        intent & RenderingIntentFlag.ANNOTATIONS_DISABLE
      ) {
        pageOpList.flush(/* lastChunk = */ true);
        return { length: pageOpList.totalLength };
      }
      const renderForms = !!(intent & RenderingIntentFlag.ANNOTATIONS_FORMS),
        isEditing = !!(intent & RenderingIntentFlag.IS_EDITING),
        intentAny = !!(intent & RenderingIntentFlag.ANY),
        intentDisplay = !!(intent & RenderingIntentFlag.DISPLAY),
        intentPrint = !!(intent & RenderingIntentFlag.PRINT);

      // Collect the operator list promises for the annotations. Each promise
      // is resolved with the complete operator list for a single annotation.
      const opListPromises = [];
      for (const annotation of annotations) {
        if (
          intentAny ||
          (intentDisplay &&
            annotation.mustBeViewed(annotationStorage, renderForms) &&
            (annotation as WidgetAnnotation).mustBeViewedWhenEditing(
              isEditing,
              modifiedIds,
            )) ||
          (intentPrint && annotation.mustBePrinted(annotationStorage))
        ) {
          opListPromises.push(
            annotation!
              .getOperatorList(
                partialEvaluator,
                task,
                intent,
                annotationStorage,
              )
              .catch((reason) => {
                warn(
                  "getOperatorList - ignoring annotation data during " +
                    `"${task.name}" task: "${reason}".`,
                );
                return {
                  // opList: null,
                  separateForm: false,
                  separateCanvas: false,
                };
              }),
          );
        }
      }

      return Promise.all(opListPromises).then((opLists) => {
        let form = false,
          canvas = false;

        for (
          const { opList, separateForm, separateCanvas } of opLists as {
            opList: OperatorList;
            separateForm: boolean;
            separateCanvas: boolean;
          }[]
        ) {
          pageOpList.addOpList(opList);

          form ||= separateForm;
          canvas ||= separateCanvas;
        }
        pageOpList.flush(
          /* lastChunk = */ true,
          /* separateAnnots = */ { form, canvas },
        );
        return { length: pageOpList.totalLength };
      });
    });
  }

  async extractTextContent({
    handler,
    task,
    includeMarkedContent,
    disableNormalization,
    sink,
  }: ExtractTextContentP_) {
    const contentStreamPromise = this.getContentStream();
    const resourcesPromise = this.loadResources([
      "ExtGState",
      "Font",
      "Properties",
      "XObject",
    ]);

    const langPromise = this.pdfManager.ensureCatalog("lang");

    const [contentStream, , lang] = await Promise.all([
      contentStreamPromise,
      resourcesPromise,
      langPromise,
    ]);
    const partialEvaluator = new PartialEvaluator({
      xref: this.xref,
      handler,
      pageIndex: this.pageIndex,
      idFactory: this.#localIdFactory,
      fontCache: this.fontCache,
      builtInCMapCache: this.builtInCMapCache,
      standardFontDataCache: this.standardFontDataCache,
      globalImageCache: this.globalImageCache,
      systemFontCache: this.systemFontCache,
      options: this.evaluatorOptions,
    });

    return partialEvaluator.getTextContent({
      stream: contentStream,
      task,
      resources: this.resources,
      includeMarkedContent,
      disableNormalization,
      sink,
      viewBox: this.view,
      lang,
    });
  }

  async getStructTree() {
    const structTreeRoot = await this.pdfManager.ensureCatalog(
      "structTreeRoot",
    );
    if (!structTreeRoot) {
      return undefined;
    }
    // Ensure that the structTree will contain the page's annotations.
    await this._parsedAnnotations;

    const structTree: StructTreePage = await this.pdfManager.ensure(
      this,
      "_parseStructTree",
      [
        structTreeRoot,
      ],
    );
    return structTree.serializable;
  }

  /**
   * @private
   */
  _parseStructTree(structTreeRoot: StructTreeRoot) {
    const tree = new StructTreePage(structTreeRoot, this.pageDict);
    tree.parse(this.ref);
    return tree;
  }

  async getAnnotationsData(
    handler: MessageHandler<Thread.worker>,
    task: WorkerTask,
    intent: RenderingIntentFlag,
  ) {
    const annotations = await this._parsedAnnotations;
    if (annotations.length === 0) {
      return annotations;
    }

    const annotationsData = [],
      textContentPromises = [];
    let partialEvaluator;

    const intentAny = !!(intent & RenderingIntentFlag.ANY),
      intentDisplay = !!(intent & RenderingIntentFlag.DISPLAY),
      intentPrint = !!(intent & RenderingIntentFlag.PRINT);

    for (const annotation of annotations) {
      // Get the annotation even if it's hidden because
      // JS can change its display.
      const isVisible = intentAny || (intentDisplay && annotation!.viewable);
      if (isVisible || (intentPrint && annotation!.printable)) {
        annotationsData.push(annotation!.data);
      }

      if (annotation!.hasTextContent && isVisible) {
        partialEvaluator ||= new PartialEvaluator({
          xref: this.xref,
          handler,
          pageIndex: this.pageIndex,
          idFactory: this._localIdFactory,
          fontCache: this.fontCache,
          builtInCMapCache: this.builtInCMapCache,
          standardFontDataCache: this.standardFontDataCache,
          globalImageCache: this.globalImageCache,
          systemFontCache: this.systemFontCache,
          options: this.evaluatorOptions,
        });

        textContentPromises.push(
          annotation!
            .extractTextContent(partialEvaluator, task, [
              -Infinity,
              -Infinity,
              Infinity,
              Infinity,
            ])
            .catch((reason) => {
              warn(
                `getAnnotationsData - ignoring textContent during "${task.name}" task: "${reason}".`,
              );
            }),
        );
      }
    }

    await Promise.all(textContentPromises);
    return annotationsData;
  }

  get annotations(): Ref[] {
    const annots = this.#getInheritableProperty("Annots");
    return shadow(
      this,
      "annotations",
      Array.isArray(annots) ? annots as Ref[] : [],
    );
  }

  get _parsedAnnotations() {
    const promise = this.pdfManager
      .ensure(this, "annotations")
      .then(async (annots: (Ref | Annotation)[]) => {
        if (annots.length === 0) {
          return annots as Annotation[];
        }
        const annotationGlobals = await this.pdfManager.ensureDoc(
          "annotationGlobals",
        );
        if (!annotationGlobals) {
          return [];
        }

        const annotationPromises: Promise<Annotation | undefined>[] = [];
        for (const annotationRef of annots) {
          annotationPromises.push(
            AnnotationFactory.create(
              this.xref,
              annotationRef as Ref,
              annotationGlobals,
              this._localIdFactory,
              /* collectFields */ false,
              this.ref,
            ).catch((reason) => {
              warn(`_parsedAnnotations: "${reason}".`);
              return undefined;
            }),
          );
        }

        const sortedAnnotations: Annotation[] = [];
        let popupAnnotations: Annotation[] | undefined,
          widgetAnnotations: WidgetAnnotation[] | undefined;
        // Ensure that PopupAnnotations are handled last, since they depend on
        // their parent Annotation in the display layer; fixes issue 11362.
        for (const annotation of await Promise.all(annotationPromises)) {
          if (!annotation) {
            continue;
          }
          if (annotation instanceof WidgetAnnotation) {
            (widgetAnnotations ||= []).push(annotation);
            continue;
          }
          if (annotation instanceof PopupAnnotation) {
            (popupAnnotations ||= []).push(annotation);
            continue;
          }
          sortedAnnotations.push(annotation);
        }
        if (widgetAnnotations) {
          sortedAnnotations.push(...widgetAnnotations);
        }
        if (popupAnnotations) {
          sortedAnnotations.push(...popupAnnotations);
        }

        return sortedAnnotations;
      });

    return shadow(this, "_parsedAnnotations", promise);
  }

  get jsActions() {
    const actions = collectActions(
      this.xref,
      this.pageDict,
      PageActionEventType,
    );
    return shadow(this, "jsActions", actions);
  }
}

const PDF_HEADER_SIGNATURE = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]); // `%PDF-`
const STARTXREF_SIGNATURE = new Uint8Array(
  [0x73, 0x74, 0x61, 0x72, 0x74, 0x78, 0x72, 0x65, 0x66],
);
const ENDOBJ_SIGNATURE = new Uint8Array([0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a]);

const FINGERPRINT_FIRST_BYTES = 1024;
const EMPTY_FINGERPRINT =
  "\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00";

function find(
  stream: Stream,
  signature: Uint8Array,
  limit = 1024,
  backwards = false,
) {
  /*#static*/ if (PDFJSDev || TESTING) {
    assert(limit > 0, 'The "limit" must be a positive integer.');
  }
  const signatureLength = signature.length;

  const scanBytes = stream.peekBytes(limit);
  const scanLength = scanBytes.length - signatureLength;

  if (scanLength <= 0) {
    return false;
  }
  if (backwards) {
    const signatureEnd = signatureLength - 1;

    let pos = scanBytes.length - 1;
    while (pos >= signatureEnd) {
      let j = 0;
      while (
        j < signatureLength &&
        scanBytes[pos - j] === signature[signatureEnd - j]
      ) {
        j++;
      }
      if (j >= signatureLength) {
        // `signature` found.
        stream.pos += pos - signatureEnd;
        return true;
      }
      pos--;
    }
  } else {
    // forwards
    let pos = 0;
    while (pos <= scanLength) {
      let j = 0;
      while (j < signatureLength && scanBytes[pos + j] === signature[j]) {
        j++;
      }
      if (j >= signatureLength) {
        // `signature` found.
        stream.pos += pos;
        return true;
      }
      pos++;
    }
  }
  return false;
}

export interface GlobalIdFactory {
  getDocId(): string;
  createFontId(): string;
  createObjId?(): string;
  getPageObjId(): string;
}

export interface DocumentInfo {
  Title?: string;
  Author?: string;
  Subject?: string;
  Keywords?: string;

  Creator?: string;
  Producer?: string;
  PDFFormatVersion?: string | undefined;
  Language: string | undefined;
  EncryptFilterName: string | undefined;

  CreationDate?: string;
  ModDate?: string;
  Trapped?: Name;

  IsAcroFormPresent: boolean;
  IsCollectionPresent: boolean;
  IsLinearized: boolean;
  IsSignaturesPresent: boolean;
  IsXFAPresent: boolean;

  Custom?: Record<string, string | number | boolean | Name>;
}

interface FormInfo {
  hasFields: boolean;
  hasAcroForm: boolean;
  hasXfa: boolean;
  hasSignatures: boolean;
}

type FieldPromises = Map<string, Promise<FieldObject | undefined>[]>;

interface XFAStreams_ {
  "xdp:xdp": string | BaseStream;
  template: string | BaseStream;
  datasets: string | BaseStream;
  config: string | BaseStream;
  connectionSet: string | BaseStream;
  localeSet: string | BaseStream;
  stylesheet: string | BaseStream;
  "/xdp:xdp": string | BaseStream;
}
export type XFAData = XFAStreams_ & {
  name: string;
  value: string;
  attributes?: string;

  children: (XFAData | null)[];

  [key: string]: unknown; //kkkk
};

export type CssFontInfo = {
  fontFamily: string;
  fontWeight: number | string | undefined;
  italicAngle: number | string;
  lineHeight?: number;
  metrics?: XFAFontMetrics | undefined;
};

/**
 * The `PDFDocument` class holds all the (worker-thread) data of the PDF file.
 */
export class PDFDocument {
  pdfManager;
  stream;
  xref;

  catalog?: Catalog;
  #pagePromises = new Map<number, Promise<Page>>();
  #version?: string;

  #globalIdFactory: GlobalIdFactory;
  get _globalIdFactory() {
    return this.#globalIdFactory;
  }
  #localIdFactory?: LocalIdFactory;

  constructor(pdfManager: BasePdfManager, stream: Stream) {
    /*#static*/ if (PDFJSDev || TESTING) {
      assert(
        stream instanceof BaseStream,
        'PDFDocument: Invalid "stream" argument.',
      );
    }
    if (stream.length <= 0) {
      throw new InvalidPDFException(
        "The PDF file is empty, i.e. its size is zero bytes.",
      );
    }

    this.pdfManager = pdfManager;
    this.stream = stream;
    this.xref = new XRef(stream, pdfManager);

    const idCounters = {
      font: 0,
    };
    this.#globalIdFactory = {
      getDocId: () => `g_${pdfManager.docId}`,
      createFontId: () => `f${++idCounters.font}`,

      getPageObjId() {
        fail("Abstract method `getPageObjId` called.");
      },
    };
  }

  parse(recoveryMode: boolean) {
    this.xref.parse(recoveryMode);
    this.catalog = new Catalog(this.pdfManager, this.xref);
  }

  get linearization() {
    let linearization: Linearization | undefined;
    try {
      linearization = Linearization.create(this.stream);
    } catch (err) {
      if (err instanceof MissingDataException) {
        throw err;
      }
      info(err as string);
    }
    return shadow(this, "linearization", linearization);
  }

  get startXRef() {
    const stream = this.stream;
    let startXRef = 0;

    if (this.linearization) {
      // Find the end of the first object.
      stream.reset();
      if (find(stream, ENDOBJ_SIGNATURE)) {
        stream.skip(6);

        let ch = stream.peekByte();
        while (isWhiteSpace(ch)) {
          stream.pos++;
          ch = stream.peekByte();
        }
        startXRef = stream.pos - stream.start;
      }
    } else {
      // Find `startxref` by checking backwards from the end of the file.
      const step = 1024;
      const startXRefLength = STARTXREF_SIGNATURE.length;
      let found = false,
        pos = stream.end;

      while (!found && pos > 0) {
        pos -= step - startXRefLength;
        if (pos < 0) {
          pos = 0;
        }
        stream.pos = pos;
        found = find(stream, STARTXREF_SIGNATURE, step, true);
      }

      if (found) {
        stream.skip(9);
        let ch;
        do {
          ch = stream.getByte();
        } while (isWhiteSpace(ch));
        let str = "";
        while (ch >= /* Space = */ 0x20 && ch <= /* '9' = */ 0x39) {
          str += String.fromCharCode(ch);
          ch = stream.getByte();
        }
        startXRef = parseInt(str, 10);
        if (isNaN(startXRef)) {
          startXRef = 0;
        }
      }
    }
    return shadow(this, "startXRef", startXRef);
  }

  /**
   * Find the header, get the PDF format version and setup the
   * stream to start from the header.
   */
  checkHeader() {
    const stream = this.stream;
    stream.reset();

    if (!find(stream, PDF_HEADER_SIGNATURE)) {
      // May not be a PDF file, but don't throw an error and let
      // parsing continue.
      return;
    }
    stream.moveStart();

    // Skip over the "%PDF-" prefix, since it was found above.
    stream.skip(PDF_HEADER_SIGNATURE.length);
    // Read the PDF format version.
    let version = "",
      ch;
    while (
      (ch = stream.getByte()) > /* Space = */ 0x20 &&
      version.length < /* MAX_PDF_VERSION_LENGTH = */ 7
    ) {
      version += String.fromCharCode(ch);
    }

    if (PDF_VERSION_REGEXP.test(version)) {
      this.#version = version;
    } else {
      warn(`Invalid PDF header version: ${version}`);
    }
  }

  parseStartXRef() {
    this.xref.setStartXRef(this.startXRef);
  }

  get numPages() {
    let num: Promise<number> | number | undefined = 0;
    if (this.catalog!.hasActualNumPages) {
      num = this.catalog!.numPages;
    } else if (this.xfaFactory) {
      // num is a Promise.
      num = this.xfaFactory.getNumPages();
    } else if (this.linearization) {
      num = this.linearization.numPages;
    } else {
      num = this.catalog!.numPages;
    }
    return shadow(this, "numPages", num);
  }

  #hasOnlyDocumentSignatures(fields: Ref[], recursionDepth = 0): boolean {
    const RECURSION_LIMIT = 10;

    if (!Array.isArray(fields)) {
      return false;
    }
    return fields.every((field) => {
      const field_ = this.xref.fetchIfRef(field);
      if (!(field_ instanceof Dict)) {
        return false;
      }
      if (field_.has("Kids")) {
        if (++recursionDepth > RECURSION_LIMIT) {
          warn("#hasOnlyDocumentSignatures: maximum recursion depth reached");
          return false;
        }
        return this.#hasOnlyDocumentSignatures(
          field_.get("Kids") as Ref[],
          recursionDepth,
        );
      }
      const isSignature = isName(field_.get("FT"), "Sig");
      const rectangle = field_.get("Rect");
      const isInvisible = Array.isArray(rectangle) &&
        rectangle.every((value) => value === 0);
      return isSignature && isInvisible;
    });
  }

  get _xfaStreams() {
    const acroForm = this.catalog!.acroForm;
    if (!acroForm) {
      return undefined;
    }

    const xfa = acroForm.get("XFA");
    const entries: XFAStreams_ = {
      "xdp:xdp": "",
      template: "",
      datasets: "",
      config: "",
      connectionSet: "",
      localeSet: "",
      stylesheet: "",
      "/xdp:xdp": "",
    };
    if (xfa instanceof BaseStream && !xfa.isEmpty) {
      entries["xdp:xdp"] = xfa;
      return entries;
    }

    if (!Array.isArray(xfa) || xfa.length === 0) {
      return undefined;
    }

    for (let i = 0, ii = xfa.length; i < ii; i += 2) {
      let name;
      if (i === 0) {
        name = "xdp:xdp";
      } else if (i === ii - 2) {
        name = "/xdp:xdp";
      } else {
        name = <string> xfa[i];
      }

      if (!Object.hasOwn(entries, name)) {
        continue;
      }
      const data = this.xref.fetchIfRef(xfa[i + 1]);
      if (!(data instanceof BaseStream) || data.isEmpty) {
        continue;
      }
      entries[<keyof XFAStreams_> name] = data;
    }
    return entries;
  }

  get xfaDatasets() {
    const streams = this._xfaStreams;
    if (!streams) {
      return shadow(this, "xfaDatasets", undefined);
    }
    for (const key of ["datasets", "xdp:xdp"]) {
      const stream = streams[<"datasets" | "xdp:xdp"> key];
      if (!stream) {
        continue;
      }
      try {
        const str = stringToUTF8String((stream as BaseStream).getString());
        const data = { [key]: str } as DatasetReaderCtorP;
        return shadow(this, "xfaDatasets", new DatasetReader(data));
      } catch {
        warn("XFA - Invalid utf-8 string.");
        break;
      }
    }
    return shadow(this, "xfaDatasets", undefined);
  }

  get xfaData() {
    const streams = this._xfaStreams;
    if (!streams) {
      return undefined;
    }
    const data = Object.create(null);
    for (const [key, stream] of Object.entries(streams)) {
      if (!stream) {
        continue;
      }
      try {
        data[key] = stringToUTF8String(stream.getString());
      } catch {
        warn("XFA - Invalid utf-8 string.");
        return undefined;
      }
    }
    return data;
  }

  get xfaFactory() {
    let data;
    if (
      this.pdfManager.enableXfa &&
      this.catalog!.needsRendering &&
      this.formInfo.hasXfa &&
      !this.formInfo.hasAcroForm
    ) {
      data = this.xfaData;
    }
    return shadow(this, "xfaFactory", data ? new XFAFactory(data) : undefined);
  }

  get isPureXfa() {
    return this.xfaFactory ? this.xfaFactory.isValid() : false;
  }

  get htmlForXfa() {
    return this.xfaFactory ? this.xfaFactory.getPages() : undefined;
  }

  async loadXfaImages() {
    const xfaImagesDict = await this.pdfManager.ensureCatalog("xfaImages");
    if (!xfaImagesDict) {
      return;
    }

    const keys = xfaImagesDict.getKeys();
    const objectLoader = new ObjectLoader(xfaImagesDict, keys, this.xref);
    await objectLoader.load();

    const xfaImages = new Map<string, Uint8Array | Uint8ClampedArray>();
    for (const key of keys) {
      const stream = xfaImagesDict.get(key);
      if (stream instanceof BaseStream) {
        xfaImages.set(key, stream.getBytes());
      }
    }

    this.xfaFactory!.setImages(xfaImages);
  }

  async loadXfaFonts(handler: MessageHandler<Thread.worker>, task: WorkerTask) {
    const acroForm = await this.pdfManager.ensureCatalog("acroForm");
    if (!acroForm) {
      return;
    }
    const resources = await acroForm.getAsync("DR");
    if (!(resources instanceof Dict)) {
      return;
    }
    const objectLoader = new ObjectLoader(resources, ["Font"], this.xref);
    await objectLoader.load();

    const fontRes = resources.get("Font");
    if (!(fontRes instanceof Dict)) {
      return;
    }

    const options = Object.assign(
      Object.create(null),
      this.pdfManager.evaluatorOptions,
    );
    options.useSystemFonts = false;

    const partialEvaluator = new PartialEvaluator({
      xref: this.xref,
      handler,
      pageIndex: -1,
      idFactory: this.#globalIdFactory,
      fontCache: this.catalog!.fontCache,
      builtInCMapCache: this.catalog!.builtInCMapCache,
      standardFontDataCache: this.catalog!.standardFontDataCache,
      options,
    });
    const operatorList = new OperatorList();
    const pdfFonts: (Font | ErrorFont)[] = [];
    const initialState = {
      get font() {
        return pdfFonts.at(-1)!;
      },
      set font(font) {
        pdfFonts.push(font);
      },
      clone() {
        return this;
      },
    };

    const fonts = new Map();
    fontRes.forEach((fontName, font) => {
      fonts.set(fontName, font);
    });
    const promises = [];

    for (const [fontName, font] of fonts) {
      const descriptor = font.get("FontDescriptor");
      if (!(descriptor instanceof Dict)) {
        continue;
      }
      let fontFamily = descriptor.get("FontFamily") as string;
      // For example, "Wingdings 3" is not a valid font name in the css specs.
      fontFamily = fontFamily.replaceAll(/[ ]+(\d)/g, "$1");
      const fontWeight = descriptor.get("FontWeight") as number | undefined;

      // Angle is expressed in degrees counterclockwise in PDF
      // when it's clockwise in CSS
      // (see https://drafts.csswg.org/css-fonts-4/#valdef-font-style-oblique-angle)
      const italicAngle = descriptor.get("ItalicAngle") as number;
      const cssFontInfo: CssFontInfo = { fontFamily, fontWeight, italicAngle };

      if (!validateCSSFont(cssFontInfo)) {
        continue;
      }
      promises.push(
        partialEvaluator
          .handleSetFont(
            resources,
            [Name.get(fontName), 1],
            /* fontRef = */ undefined,
            operatorList,
            task,
            initialState,
            /* fallbackFontDict = */ undefined,
            /* cssFontInfo = */ cssFontInfo,
          )
          .catch((reason) => {
            warn(`loadXfaFonts: "${reason}".`);
            return undefined;
          }),
      );
    }

    await Promise.all(promises);
    const missingFonts = this.xfaFactory?.setFonts(pdfFonts);

    if (!missingFonts) {
      return;
    }

    options.ignoreErrors = true;
    promises.length = 0;
    pdfFonts.length = 0;

    const reallyMissingFonts = new Set<string>();
    for (const missing of missingFonts) {
      if (!getXfaFontName(`${missing}-Regular`)) {
        // No substitution available: we'll fallback on Myriad.
        reallyMissingFonts.add(missing);
      }
    }

    if (reallyMissingFonts.size) {
      missingFonts.push("PdfJS-Fallback");
    }

    for (const missing of missingFonts) {
      if (reallyMissingFonts.has(missing)) {
        continue;
      }
      for (
        const fontInfo of [
          { name: "Regular", fontWeight: 400, italicAngle: 0 },
          { name: "Bold", fontWeight: 700, italicAngle: 0 },
          { name: "Italic", fontWeight: 400, italicAngle: 12 },
          { name: "BoldItalic", fontWeight: 700, italicAngle: 12 },
        ]
      ) {
        const name = `${missing}-${fontInfo.name}`;
        const dict = getXfaFontDict(name);

        promises.push(
          partialEvaluator
            .handleSetFont(
              resources,
              [Name.get(name), 1],
              /* fontRef = */ undefined,
              operatorList,
              task,
              initialState,
              /* fallbackFontDict = */ dict,
              /* cssFontInfo = */ {
                fontFamily: missing,
                fontWeight: fontInfo.fontWeight,
                italicAngle: fontInfo.italicAngle,
              },
            )
            .catch((reason) => {
              warn(`loadXfaFonts: "${reason}".`);
              return undefined;
            }),
        );
      }
    }

    await Promise.all(promises);
    this.xfaFactory!.appendFonts(pdfFonts, reallyMissingFonts);
  }

  async serializeXfaData(annotationStorage: AnnotStorageRecord | undefined) {
    return this.xfaFactory
      ? this.xfaFactory.serializeData(annotationStorage)
      : undefined;
  }

  /**
   * The specification states in section 7.5.2 that the version from
   * the catalog, if present, should overwrite the version from the header.
   */
  get version() {
    return this.catalog!.version || this.#version;
  }

  get formInfo() {
    const formInfo: FormInfo = {
      hasFields: false,
      hasAcroForm: false,
      hasXfa: false,
      hasSignatures: false,
    };
    const acroForm = this.catalog!.acroForm;
    if (!acroForm) {
      return shadow(this, "formInfo", formInfo);
    }

    try {
      const fields = acroForm.get("Fields") as Ref[];
      const hasFields = Array.isArray(fields) && fields.length > 0;
      formInfo.hasFields = hasFields; // Used by the `fieldObjects` getter.

      // The document contains XFA data if the `XFA` entry is a non-empty
      // array or stream.
      const xfa = acroForm.get("XFA");
      formInfo.hasXfa = (Array.isArray(xfa) && xfa.length > 0) ||
        (xfa instanceof BaseStream && !xfa.isEmpty);

      // The document contains AcroForm data if the `Fields` entry is a
      // non-empty array and it doesn't consist of only document signatures.
      // This second check is required for files that don't actually contain
      // AcroForm data (only XFA data), but that use the `Fields` entry to
      // store (invisible) document signatures. This can be detected using
      // the first bit of the `SigFlags` integer (see Table 219 in the
      // specification).
      const sigFlags = <number | undefined> acroForm.get("SigFlags");
      const hasSignatures = !!(<any> sigFlags & 0x1);
      const hasOnlyDocumentSignatures = hasSignatures &&
        this.#hasOnlyDocumentSignatures(fields);
      formInfo.hasAcroForm = hasFields && !hasOnlyDocumentSignatures;
      formInfo.hasSignatures = hasSignatures;
    } catch (ex) {
      if (ex instanceof MissingDataException) {
        throw ex;
      }
      warn(`Cannot fetch form information: "${ex}".`);
    }
    return shadow(this, "formInfo", formInfo);
  }

  get documentInfo() {
    const docInfo: DocumentInfo = {
      PDFFormatVersion: this.version,
      Language: this.catalog!.lang,
      EncryptFilterName: this.xref.encrypt
        ? this.xref.encrypt.filterName
        : undefined,
      IsLinearized: !!this.linearization,
      IsAcroFormPresent: this.formInfo.hasAcroForm,
      IsXFAPresent: this.formInfo.hasXfa,
      IsCollectionPresent: !!this.catalog!.collection,
      IsSignaturesPresent: this.formInfo.hasSignatures,
    };

    let infoDict;
    try {
      infoDict = this.xref!.trailer!.get("Info");
    } catch (err) {
      if (err instanceof MissingDataException) {
        throw err;
      }
      info("The document information dictionary is invalid.");
    }
    if (!(infoDict instanceof Dict)) {
      return shadow(this, "documentInfo", docInfo);
    }

    for (const key of infoDict.getKeys()) {
      const value = infoDict.get(key);

      switch (key) {
        case "Title":
        case "Author":
        case "Subject":
        case "Keywords":
        case "Creator":
        case "Producer":
        case "CreationDate":
        case "ModDate":
          if (typeof value === "string") {
            docInfo[key] = stringToPDFString(value);
            continue;
          }
          break;
        case "Trapped":
          if (value instanceof Name) {
            docInfo[key] = value;
            continue;
          }
          break;
        default:
          // For custom values, only accept white-listed types to prevent
          // errors that would occur when trying to send non-serializable
          // objects to the main-thread (for example `Dict` or `Stream`).
          let customValue;
          switch (typeof value) {
            case "string":
              customValue = stringToPDFString(value);
              break;
            case "number":
            case "boolean":
              customValue = value;
              break;
            default:
              if (value instanceof Name) {
                customValue = value;
              }
              break;
          }

          if (customValue === undefined) {
            warn(
              `Bad value, for custom key "${key}", in Info: ${<any> value}.`,
            );
            continue;
          }
          if (!docInfo.Custom) {
            docInfo.Custom = Object.create(null);
          }
          docInfo.Custom![key] = customValue;
          continue;
      }
      warn(`Bad value, for key "${key}", in Info: ${<any> value}.`);
    }
    return shadow(this, "documentInfo", docInfo);
  }

  get fingerprints() {
    function validate(data: Obj | undefined) {
      return (
        typeof data === "string" &&
        data.length > 0 &&
        data !== EMPTY_FINGERPRINT
      );
    }

    function hexString(hash: Uint8Array) {
      const buf = [];
      for (const num of hash) {
        const hex = num.toString(16);
        buf.push(hex.padStart(2, "0"));
      }
      return buf.join("");
    }

    const idArray = this.xref.trailer!.get("ID");
    let hashOriginal, hashModified;
    if (Array.isArray(idArray) && validate(idArray[0])) {
      hashOriginal = stringToBytes(<string> idArray[0]);

      if (idArray[1] !== idArray[0] && validate(idArray[1])) {
        hashModified = stringToBytes(<string> idArray[1]);
      }
    } else {
      hashOriginal = calculateMD5(
        this.stream.getByteRange(0, FINGERPRINT_FIRST_BYTES),
        0,
        FINGERPRINT_FIRST_BYTES,
      );
    }

    return shadow(
      this,
      "fingerprints",
      <[string, string | undefined]> [
        hexString(hashOriginal),
        hashModified ? hexString(hashModified) : undefined,
      ],
    );
  }

  async #getLinearizationPage(pageIndex: number) {
    const { catalog, linearization, xref } = this;
    /*#static*/ if (PDFJSDev || TESTING) {
      assert(
        linearization?.pageFirst === pageIndex,
        "#getLinearizationPage - invalid pageIndex argument.",
      );
    }

    const ref = Ref.get(linearization!.objectNumberFirst, 0);
    try {
      const obj = await xref.fetchAsync<Dict>(ref);
      // Ensure that the object that was found is actually a Page dictionary.
      if (obj instanceof Dict) {
        let type = obj.getRaw("Type");
        if (type instanceof Ref) {
          type = await xref.fetchAsync(type);
        }
        if (
          isName(type, "Page") ||
          (!obj.has("Type") && !obj.has("Kids") && obj.has("Contents"))
        ) {
          if (!catalog!.pageKidsCountCache.has(ref)) {
            catalog!.pageKidsCountCache.put(ref, 1); // Cache the Page reference.
          }
          // Help improve performance of the `Catalog.getPageIndex` method.
          if (!catalog!.pageIndexCache.has(ref)) {
            catalog!.pageIndexCache.put(ref, 0);
          }

          return [obj, ref] as const;
        }
      }
      throw new FormatError(
        "The Linearization dictionary doesn't point to a valid Page dictionary.",
      );
    } catch (reason) {
      warn(`_getLinearizationPage: "${(<Error> reason).message}".`);
      return catalog!.getPageDict(pageIndex);
    }
  }

  getPage(pageIndex: number) {
    const cachedPromise = this.#pagePromises.get(pageIndex);
    if (cachedPromise) {
      return cachedPromise;
    }
    const { catalog, linearization, xfaFactory } = this;

    let promise;
    if (xfaFactory) {
      promise = Promise.resolve([Dict.empty, undefined] as const);
    } else if (linearization?.pageFirst === pageIndex) {
      promise = this.#getLinearizationPage(pageIndex);
    } else {
      promise = catalog!.getPageDict(pageIndex);
    }
    // eslint-disable-next-line arrow-body-style
    promise = promise.then(([pageDict, ref]) => {
      return new Page({
        pdfManager: this.pdfManager,
        xref: this.xref,
        pageIndex,
        pageDict,
        ref,
        globalIdFactory: this._globalIdFactory,
        fontCache: catalog!.fontCache,
        builtInCMapCache: catalog!.builtInCMapCache,
        standardFontDataCache: catalog!.standardFontDataCache,
        globalImageCache: catalog!.globalImageCache,
        systemFontCache: catalog!.systemFontCache,
        nonBlendModesSet: catalog!.nonBlendModesSet,
        xfaFactory,
      });
    });

    this.#pagePromises.set(pageIndex, promise);
    return promise;
  }

  async checkFirstPage(recoveryMode = false) {
    if (recoveryMode) {
      return;
    }
    try {
      await this.getPage(0);
    } catch (reason) {
      if (reason instanceof XRefEntryException) {
        // Clear out the various caches to ensure that we haven't stored any
        // inconsistent and/or incorrect state, since that could easily break
        // subsequent `this.getPage` calls.
        this.#pagePromises.delete(0);
        await this.cleanup();

        throw new XRefParseException();
      }
    }
  }

  async checkLastPage(recoveryMode = false) {
    const { catalog, pdfManager } = this;

    catalog!.setActualNumPages(); // Ensure that it's always reset.
    let numPages: number | undefined;

    try {
      await Promise.all([
        pdfManager.ensureDoc("xfaFactory"),
        pdfManager.ensureDoc("linearization"),
        pdfManager.ensureCatalog("numPages"),
      ]);

      if (this.xfaFactory) {
        // The Page count is always calculated for XFA-documents.
        return;
      } else if (this.linearization) {
        numPages = this.linearization.numPages;
      } else {
        numPages = catalog!.numPages;
      }

      if (!Number.isInteger(numPages)) {
        throw new FormatError("Page count is not an integer.");
      } else if (numPages! <= 1) {
        return;
      }
      await this.getPage(numPages! - 1);
    } catch (reason) {
      // Clear out the various caches to ensure that we haven't stored any
      // inconsistent and/or incorrect state, since that could easily break
      // subsequent `this.getPage` calls.
      this.#pagePromises.delete(numPages! - 1);
      await this.cleanup();

      if (reason instanceof XRefEntryException && !recoveryMode) {
        throw new XRefParseException();
      }

      warn(`checkLastPage - invalid /Pages tree /Count: ${numPages}.`);

      let pagesTree;
      try {
        pagesTree = await catalog!.getAllPageDicts(recoveryMode);
      } catch (reasonAll) {
        if (reasonAll instanceof XRefEntryException && !recoveryMode) {
          throw new XRefParseException();
        }

        catalog!.setActualNumPages(1);
        return;
      }

      for (const [pageIndex, [pageDict, ref]] of pagesTree) {
        let promise;
        if (pageDict instanceof Error) {
          promise = Promise.reject(pageDict);

          // Prevent "uncaught exception: Object"-messages in the console.
          promise.catch(() => {});
        } else {
          promise = Promise.resolve(
            new Page({
              pdfManager,
              xref: this.xref,
              pageIndex,
              pageDict,
              ref,
              globalIdFactory: this._globalIdFactory,
              fontCache: catalog!.fontCache,
              builtInCMapCache: catalog!.builtInCMapCache,
              standardFontDataCache: catalog!.standardFontDataCache,
              globalImageCache: catalog!.globalImageCache,
              systemFontCache: catalog!.systemFontCache,
              nonBlendModesSet: catalog!.nonBlendModesSet,
              xfaFactory: undefined,
            }),
          );
        }

        this.#pagePromises.set(pageIndex, promise);
      }
      catalog!.setActualNumPages(pagesTree.size);
    }
  }

  fontFallback(id: string, handler: MessageHandler<Thread.worker>) {
    return this.catalog!.fontFallback(id, handler);
  }

  async cleanup(manuallyTriggered = false) {
    return this.catalog
      ? this.catalog.cleanup(manuallyTriggered)
      : clearGlobalCaches();
  }

  async #collectFieldObjects(
    name: string,
    fieldRef: Ref,
    promises: FieldPromises,
    annotationGlobals: AnnotationGlobals,
    visitedRefs: RefSet,
  ) {
    const { xref } = this;

    if (!(fieldRef instanceof Ref) || visitedRefs.has(fieldRef)) {
      return;
    }
    visitedRefs.put(fieldRef);
    const field = await xref.fetchAsync(fieldRef);
    if (!(field instanceof Dict)) {
      return;
    }
    if (field.has("T")) {
      const partName = stringToPDFString(await field.getAsync("T"));
      name = name === "" ? partName : `${name}.${partName}`;
    } else {
      let obj: Obj | undefined = field;
      while (true) {
        obj = obj.getRaw("Parent");
        if (obj instanceof Ref) {
          if (visitedRefs.has(obj)) {
            break;
          }
          obj = await xref.fetchAsync(obj);
        }
        if (!(obj instanceof Dict)) {
          break;
        }
        if (obj.has("T")) {
          const partName = stringToPDFString(await obj.getAsync("T"));
          name = name === "" ? partName : `${name}.${partName}`;
          break;
        }
      }
    }

    if (!promises.has(name)) {
      promises.set(name, []);
    }
    promises.get(name)!.push(
      AnnotationFactory.create(
        xref,
        fieldRef,
        annotationGlobals,
        /* idFactory = */ undefined,
        /* collectFields */ true,
      )
        .then((annotation) => annotation?.getFieldObject())
        .catch((reason) => {
          warn(`#collectFieldObjects: "${reason}".`);
          return undefined;
        }),
    );

    if (!field.has("Kids")) {
      return;
    }
    const kids = await field.getAsync("Kids");
    if (Array.isArray(kids)) {
      for (const kid of kids) {
        await this.#collectFieldObjects(
          name,
          kid as Ref,
          promises,
          annotationGlobals,
          visitedRefs,
        );
      }
    }
  }

  get fieldObjects() {
    if (!this.formInfo.hasFields) {
      return shadow(this, "fieldObjects", Promise.resolve(undefined));
    }

    const promise = Promise.all([
      this.pdfManager.ensureDoc("annotationGlobals"),
      this.pdfManager.ensureCatalog("acroForm"),
    ]).then(async ([annotationGlobals, acroForm]) => {
      if (!annotationGlobals) {
        return undefined;
      }

      const visitedRefs = new RefSet();
      const allFields: Record<string, FieldObject[]> = Object.create(null);
      const fieldPromises: FieldPromises = new Map();
      for (const fieldRef of await acroForm!.getAsync("Fields") as Ref[]) {
        await this.#collectFieldObjects(
          "",
          fieldRef,
          fieldPromises,
          annotationGlobals,
          visitedRefs,
        );
      }

      const allPromises: Promise<void>[] = [];
      for (const [name, promises] of fieldPromises) {
        allPromises.push(
          Promise.all(promises).then((fields) => {
            fields = fields.filter((field) => !!field);
            if (fields.length > 0) {
              allFields[name] = fields as FieldObject[];
            }
          }),
        );
      }

      await Promise.all(allPromises);
      return allFields;
    });

    return shadow(this, "fieldObjects", promise);
  }

  get hasJSActions() {
    const promise: Promise<boolean> = this.pdfManager.ensureDoc(
      "_parseHasJSActions",
    );
    return shadow(this, "hasJSActions", promise);
  }

  /**
   * @private
   */
  async _parseHasJSActions() {
    const [catalogJsActions, fieldObjects] = await Promise.all([
      this.pdfManager.ensureCatalog("jsActions"),
      this.pdfManager.ensureDoc("fieldObjects"),
    ]);

    if (catalogJsActions) {
      return true;
    }

    if (fieldObjects) {
      return Object.values(fieldObjects).some((fieldObject) =>
        fieldObject.some((object) => object.actions !== undefined)
      );
    }
    return false;
  }

  get calculationOrderIds() {
    const acroForm = this.catalog!.acroForm;
    if (!acroForm?.has("CO")) {
      return shadow(this, "calculationOrderIds", undefined);
    }

    const calculationOrder = acroForm.get("CO");
    if (!Array.isArray(calculationOrder) || calculationOrder.length === 0) {
      return shadow(this, "calculationOrderIds", undefined);
    }

    const ids: string[] = [];
    for (const id of calculationOrder) {
      if (id instanceof Ref) {
        ids.push(id.toString());
      }
    }
    if (ids.length === 0) {
      return shadow(this, "calculationOrderIds", undefined);
    }
    return shadow(this, "calculationOrderIds", ids);
  }

  get annotationGlobals() {
    return shadow(
      this,
      "annotationGlobals",
      AnnotationFactory.createGlobals(this.pdfManager),
    );
  }
}
/*80--------------------------------------------------------------------------*/
