/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/annotation_test.ts
 * @license Apache-2.0
 ******************************************************************************/

/* Copyright 2020 Mozilla Foundation
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
import { assertEquals, assertFalse, assertLess } from "@std/assert";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "@std/testing/bdd.ts";
import type { TestServer } from "@fe-pdf.ts-test/unittest_utils.ts";
import {
  CMAP_URL,
  createIdFactory,
  createTemporaryDenoServer,
  STANDARD_FONT_DATA_URL,
  XRefMock,
} from "@fe-pdf.ts-test/unittest_utils.ts";
import { AnnotStorageRecord } from "../display/annotation_layer.ts";
import {
  DefaultCMapReaderFactory,
  DefaultStandardFontDataFactory,
} from "../display/api.ts";
import { type CMapData } from "../display/base_factory.ts";
import type { Outlines } from "../display/editor/outliner.ts";
import {
  AnnotationBorderStyleType,
  AnnotationEditorType,
  AnnotationFieldFlag,
  AnnotationFlag,
  AnnotationReplyType,
  AnnotationType,
  OPS,
  RenderingIntentFlag,
  stringToBytes,
  stringToUTF8String,
} from "../shared/util.ts";
import type { AnnotationGlobals } from "./annotation.ts";
import {
  Annotation,
  AnnotationBorderStyle,
  AnnotationFactory,
  AnnotSaveReturn,
  getQuadPoints,
  MarkupAnnotation,
  WidgetAnnotation,
} from "./annotation.ts";
import { LocalIdFactory } from "./document.ts";
import { PartialEvaluator } from "./evaluator.ts";
import { FlateStream } from "./flate_stream.ts";
import { Lexer, Parser } from "./parser.ts";
import { Dict, Name, Ref, RefSetCache } from "./primitives.ts";
import { StringStream } from "./stream.ts";
import { WorkerTask } from "./worker.ts";
/*80--------------------------------------------------------------------------*/

describe("annotation", () => {
  let tempServer: TestServer;

  class PDFManagerMock {
    pdfDocument;
    evaluatorOptions = {
      isEvalSupported: true,
      isOffscreenCanvasSupported: false,
    };

    constructor(params: { docBaseUrl: string | undefined }) {
      this.pdfDocument = {
        catalog: {
          baseUrl: params.docBaseUrl || undefined,
        },
      };
    }

    ensure(obj: unknown, prop: string, args: unknown) {
      return new Promise((resolve) => {
        const value = (obj as any)[prop];
        if (typeof value === "function") {
          resolve(value.apply(obj, args));
        } else {
          resolve(value);
        }
      });
    }

    ensureCatalog(prop: string, args: unknown) {
      return this.ensure(this.pdfDocument.catalog, prop, args);
    }

    ensureDoc(prop: string, args: unknown) {
      return this.ensure(this.pdfDocument, prop, args);
    }
  }

  let fontDataReader: DefaultStandardFontDataFactory;

  class HandlerMock {
    inputs: { name: string; data: unknown }[] = [];

    send(name: string, data: unknown) {
      this.inputs.push({ name, data });
    }

    sendWithPromise(name: string, data: unknown) {
      if (name !== "FetchStandardFontData") {
        return Promise.reject(new Error(`Unsupported mock ${name}.`));
      }
      return fontDataReader.fetch(data as any);
    }
  }

  let annotationGlobalsMock: AnnotationGlobals,
    pdfManagerMock: any,
    idFactoryMock: LocalIdFactory,
    partialEvaluator: PartialEvaluator;

  beforeAll(async () => {
    tempServer = createTemporaryDenoServer();

    fontDataReader = new DefaultStandardFontDataFactory({
      baseUrl: STANDARD_FONT_DATA_URL(tempServer),
    });

    pdfManagerMock = new PDFManagerMock({
      docBaseUrl: undefined,
    });

    annotationGlobalsMock = (await AnnotationFactory.createGlobals(
      pdfManagerMock,
    ))!;

    const CMapReaderFactory = new DefaultCMapReaderFactory({
      baseUrl: CMAP_URL(tempServer),
    });

    const builtInCMapCache = new Map<string, CMapData>();
    builtInCMapCache.set(
      "UniJIS-UTF16-H",
      await CMapReaderFactory.fetch({ name: "UniJIS-UTF16-H" }),
    );
    builtInCMapCache.set(
      "Adobe-Japan1-UCS2",
      await CMapReaderFactory.fetch({ name: "Adobe-Japan1-UCS2" }),
    );

    idFactoryMock = createIdFactory(/* pageIndex = */ 0);
    partialEvaluator = new PartialEvaluator({
      xref: new XRefMock() as any,
      handler: new HandlerMock() as any,
      pageIndex: 0,
      idFactory: createIdFactory(/* pageIndex = */ 0),
      fontCache: new RefSetCache(),
      builtInCMapCache,
      standardFontDataCache: new Map(),
      systemFontCache: new Map(),
    });
  });

  afterAll(async () => {
    annotationGlobalsMock = undefined as any;
    pdfManagerMock = undefined;
    idFactoryMock = undefined as any;
    partialEvaluator = undefined as any;

    const { server } = tempServer;
    await server.shutdown();
    tempServer = undefined as any;
  });

  describe("AnnotationFactory", () => {
    it("should get id for annotation", async () => {
      const annotationDict = new Dict();
      annotationDict.set("Type", Name.get("Annot"));
      annotationDict.set("Subtype", Name.get("Link"));

      const annotationRef = Ref.get(10, 0);
      const xref = new XRefMock([{
        ref: annotationRef,
        data: annotationDict,
      }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        annotationRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.LINK);
      assertEquals(data.id, "10R");
    });

    it(
      "should handle, and get fallback IDs for, annotations that are not " +
        "indirect objects (issue 7569)",
      async () => {
        const annotationDict = new Dict();
        annotationDict.set("Type", Name.get("Annot"));
        annotationDict.set("Subtype", Name.get("Link"));

        const xref = new XRefMock() as any;
        const idFactory = createIdFactory(/* pageIndex = */ 0);

        const annotation1 = (AnnotationFactory.create(
          xref,
          annotationDict as any,
          annotationGlobalsMock,
          idFactory,
        ) as Promise<Annotation>).then(({ data }) => {
          assertEquals(data.annotationType, AnnotationType.LINK);
          assertEquals(data.id, "annot_p0_1");
        });

        const annotation2 = (AnnotationFactory.create(
          xref,
          annotationDict as any,
          annotationGlobalsMock,
          idFactory,
        ) as Promise<Annotation>).then(({ data }) => {
          assertEquals(data.annotationType, AnnotationType.LINK);
          assertEquals(data.id, "annot_p0_2");
        });

        await Promise.all([annotation1, annotation2]);
      },
    );

    it("should handle missing /Subtype", async () => {
      const annotationDict = new Dict();
      annotationDict.set("Type", Name.get("Annot"));

      const annotationRef = Ref.get(1, 0);
      const xref = new XRefMock([{
        ref: annotationRef,
        data: annotationDict,
      }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        annotationRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, undefined);
    });
  });

  describe("getQuadPoints", () => {
    let dict!: Dict,
      rect: rect_t | undefined;

    beforeEach(() => {
      dict = new Dict();
    });

    afterEach(() => {
      dict = undefined as any;
      rect = undefined;
    });

    it("should ignore missing quadpoints", () => {
      assertEquals(getQuadPoints(dict, [] as any), null);
    });

    it("should ignore non-array values", () => {
      dict.set("QuadPoints", "foo");
      assertEquals(getQuadPoints(dict, [] as any), null);
    });

    it("should ignore arrays where the length is not a multiple of eight", () => {
      dict.set("QuadPoints", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      assertEquals(getQuadPoints(dict, [] as any), null);
    });

    it("should ignore quadpoints if one coordinate lies outside the rectangle", () => {
      rect = [10, 10, 20, 20];
      const inputs = [
        [11, 11, 12, 12, 9, 13, 14, 14], // Smaller than lower x coordinate.
        [11, 11, 12, 12, 13, 9, 14, 14], // Smaller than lower y coordinate.
        [11, 11, 12, 12, 21, 13, 14, 14], // Larger than upper x coordinate.
        [11, 11, 12, 12, 13, 21, 14, 14], // Larger than upper y coordinate.
      ];
      for (const input of inputs) {
        dict.set("QuadPoints", input);
        assertEquals(getQuadPoints(dict, rect), null);
      }
    });

    it("should process quadpoints in the standard order", () => {
      rect = [10, 10, 20, 20];
      // deno-fmt-ignore
      const quadPoints = [
        10, 20, 20, 20, 10, 10, 20, 10, 11, 19, 19, 19, 11, 11, 19, 11,
      ];
      dict.set("QuadPoints", quadPoints);
      assertEquals(getQuadPoints(dict, rect), Float32Array.from(quadPoints));
    });

    it("should normalize and process quadpoints in non-standard orders", () => {
      rect = [10, 10, 20, 20];
      const nonStandardOrders = [
        // Bottom left, bottom right, top right and top left.
        [10, 20, 20, 20, 20, 10, 10, 10],

        // Top left, top right, bottom left and bottom right.
        [10, 10, 20, 10, 10, 20, 20, 20],

        // Top left, top right, bottom right and bottom left.
        [10, 10, 20, 10, 20, 20, 10, 20],
      ];

      for (const nonStandardOrder of nonStandardOrders) {
        dict.set("QuadPoints", nonStandardOrder);
        assertEquals(
          getQuadPoints(dict, rect),
          Float32Array.from([10, 20, 20, 20, 10, 10, 20, 10]),
        );
      }
    });
  });

  describe("Annotation", () => {
    let dict: Dict,
      ref: Ref;

    beforeAll(() => {
      dict = new Dict();
      ref = Ref.get(1, 0);
    });

    afterAll(() => {
      dict = ref = undefined as any;
    });

    it("should set and get valid contents", () => {
      const annotation = new Annotation({
        dict,
        ref,
        annotationGlobals: annotationGlobalsMock,
        evaluatorOptions: pdfManagerMock.evaluatorOptions,
      } as any);
      annotation.setContents("Foo bar baz");

      assertEquals(annotation._contents, { str: "Foo bar baz", dir: "ltr" });
    });

    it("should not set and get invalid contents", () => {
      const annotation = new Annotation({
        dict,
        ref,
        annotationGlobals: annotationGlobalsMock,
        evaluatorOptions: pdfManagerMock.evaluatorOptions,
      } as any);
      annotation.setContents(undefined);

      assertEquals(annotation._contents, { str: "", dir: "ltr" });
    });

    it("should set and get a valid modification date", () => {
      const annotation = new Annotation({
        dict,
        ref,
        annotationGlobals: annotationGlobalsMock,
        evaluatorOptions: pdfManagerMock.evaluatorOptions,
      } as any);
      annotation.setModificationDate("D:20190422");

      assertEquals(annotation.modificationDate, "D:20190422");
    });

    it("should not set and get an invalid modification date", () => {
      const annotation = new Annotation({
        dict,
        ref,
        annotationGlobals: annotationGlobalsMock,
        evaluatorOptions: pdfManagerMock.evaluatorOptions,
      } as any);
      annotation.setModificationDate(undefined);

      assertEquals(annotation.modificationDate, undefined);
    });

    it("should set and get flags", () => {
      const annotation = new Annotation({
        dict,
        ref,
        annotationGlobals: annotationGlobalsMock,
        evaluatorOptions: pdfManagerMock.evaluatorOptions,
      } as any);
      annotation.setFlags(13);

      assertEquals(annotation.hasFlag(AnnotationFlag.INVISIBLE), true);
      assertEquals(annotation.hasFlag(AnnotationFlag.NOZOOM), true);
      assertEquals(annotation.hasFlag(AnnotationFlag.PRINT), true);
      assertEquals(annotation.hasFlag(AnnotationFlag.READONLY), false);
      assertEquals(annotation.hasFlag(AnnotationFlag.HIDDEN), false);
    });

    it("should be viewable and not printable by default", () => {
      const annotation = new Annotation({
        dict,
        ref,
        annotationGlobals: annotationGlobalsMock,
        evaluatorOptions: pdfManagerMock.evaluatorOptions,
      } as any);

      assertEquals(annotation.viewable, true);
      assertEquals(annotation.printable, false);
    });

    it("should set and get a valid rectangle", () => {
      const annotation = new Annotation({
        dict,
        ref,
        annotationGlobals: annotationGlobalsMock,
        evaluatorOptions: pdfManagerMock.evaluatorOptions,
      } as any);
      annotation.setRectangle([117, 694, 164.298, 720]);

      assertEquals(annotation.rectangle, [117, 694, 164.298, 720]);
    });

    it("should not set and get an invalid rectangle", () => {
      const annotation = new Annotation({
        dict,
        ref,
        annotationGlobals: annotationGlobalsMock,
        evaluatorOptions: pdfManagerMock.evaluatorOptions,
      } as any);
      annotation.setRectangle([117, 694, 164.298]);

      assertEquals(annotation.rectangle, [0, 0, 0, 0]);
    });

    it("should reject a color if it is not an array", () => {
      const annotation = new Annotation({
        dict,
        ref,
        annotationGlobals: annotationGlobalsMock,
        evaluatorOptions: pdfManagerMock.evaluatorOptions,
      } as any);
      annotation.setColor("red" as any);

      assertEquals(annotation.color, new Uint8ClampedArray([0, 0, 0]));
    });

    it("should set and get a transparent color", () => {
      const annotation = new Annotation({
        dict,
        ref,
        annotationGlobals: annotationGlobalsMock,
        evaluatorOptions: pdfManagerMock.evaluatorOptions,
      } as any);
      annotation.setColor([]);

      assertEquals(annotation.color, undefined);
    });

    it("should set and get a grayscale color", () => {
      const annotation = new Annotation({
        dict,
        ref,
        annotationGlobals: annotationGlobalsMock,
        evaluatorOptions: pdfManagerMock.evaluatorOptions,
      } as any);
      annotation.setColor([0.4]);

      assertEquals(annotation.color, new Uint8ClampedArray([102, 102, 102]));
    });

    it("should set and get an RGB color", () => {
      const annotation = new Annotation({
        dict,
        ref,
        annotationGlobals: annotationGlobalsMock,
        evaluatorOptions: pdfManagerMock.evaluatorOptions,
      } as any);
      annotation.setColor([0, 0, 1]);

      assertEquals(annotation.color, new Uint8ClampedArray([0, 0, 255]));
    });

    it("should set and get a CMYK color", () => {
      const annotation = new Annotation({
        dict,
        ref,
        annotationGlobals: annotationGlobalsMock,
        evaluatorOptions: pdfManagerMock.evaluatorOptions,
      } as any);
      annotation.setColor([0.1, 0.92, 0.84, 0.02]);

      assertEquals(annotation.color, new Uint8ClampedArray([234, 59, 48]));
    });

    it("should not set and get an invalid color", () => {
      const annotation = new Annotation({
        dict,
        ref,
        annotationGlobals: annotationGlobalsMock,
        evaluatorOptions: pdfManagerMock.evaluatorOptions,
      } as any);
      annotation.setColor([0.4, 0.6]);

      assertEquals(annotation.color, new Uint8ClampedArray([0, 0, 0]));
    });
  });

  describe("AnnotationBorderStyle", () => {
    it("should set and get a valid width", () => {
      const borderStyleInt = new AnnotationBorderStyle();
      borderStyleInt.setWidth(3);
      const borderStyleNum = new AnnotationBorderStyle();
      borderStyleNum.setWidth(2.5);

      assertEquals(borderStyleInt.width, 3);
      assertEquals(borderStyleNum.width, 2.5);
    });

    it("should not set and get an invalid width", () => {
      const borderStyle = new AnnotationBorderStyle();
      borderStyle.setWidth("three" as any);

      assertEquals(borderStyle.width, 1);
    });

    it("should set the width to zero, when the input is a `Name` (issue 10385)", () => {
      const borderStyleZero = new AnnotationBorderStyle();
      borderStyleZero.setWidth(Name.get("0"));
      const borderStyleFive = new AnnotationBorderStyle();
      borderStyleFive.setWidth(Name.get("5"));

      assertEquals(borderStyleZero.width, 0);
      assertEquals(borderStyleFive.width, 0);
    });

    it("should set and get a valid style", () => {
      const borderStyle = new AnnotationBorderStyle();
      borderStyle.setStyle(Name.get("D"));

      assertEquals(borderStyle.style, AnnotationBorderStyleType.DASHED);
    });

    it("should not set and get an invalid style", () => {
      const borderStyle = new AnnotationBorderStyle();
      borderStyle.setStyle("Dashed" as any);

      assertEquals(borderStyle.style, AnnotationBorderStyleType.SOLID);
    });

    it("should set and get a valid dash array", () => {
      const borderStyle = new AnnotationBorderStyle();
      borderStyle.setDashArray([1, 2, 3]);

      assertEquals(borderStyle.dashArray, [1, 2, 3]);
    });

    it("should not set and get an invalid dash array", () => {
      const borderStyle = new AnnotationBorderStyle();
      borderStyle.setDashArray([0, 0]);

      assertEquals(borderStyle.dashArray, [3]);
    });

    it("should not set the width to zero if the dash array is empty (issue 17904)", () => {
      const borderStyle = new AnnotationBorderStyle();
      borderStyle.setWidth(3);
      borderStyle.setDashArray([]);

      assertEquals(borderStyle.width, 3);
      assertEquals(borderStyle.dashArray, []);
    });

    it("should set and get a valid horizontal corner radius", () => {
      const borderStyle = new AnnotationBorderStyle();
      borderStyle.setHorizontalCornerRadius(3);

      assertEquals(borderStyle.horizontalCornerRadius, 3);
    });

    it("should not set and get an invalid horizontal corner radius", () => {
      const borderStyle = new AnnotationBorderStyle();
      borderStyle.setHorizontalCornerRadius("three" as any);

      assertEquals(borderStyle.horizontalCornerRadius, 0);
    });

    it("should set and get a valid vertical corner radius", () => {
      const borderStyle = new AnnotationBorderStyle();
      borderStyle.setVerticalCornerRadius(3);

      assertEquals(borderStyle.verticalCornerRadius, 3);
    });

    it("should not set and get an invalid vertical corner radius", () => {
      const borderStyle = new AnnotationBorderStyle();
      borderStyle.setVerticalCornerRadius("three" as any);

      assertEquals(borderStyle.verticalCornerRadius, 0);
    });
  });

  describe("MarkupAnnotation", () => {
    let dict: Dict;
    let ref: Ref;

    beforeAll(() => {
      dict = new Dict();
      ref = Ref.get(1, 0);
    });

    afterAll(() => {
      dict = ref = undefined as any;
    });

    it("should set and get a valid creation date", () => {
      const markupAnnotation = new MarkupAnnotation({
        dict,
        ref,
        annotationGlobals: annotationGlobalsMock,
        evaluatorOptions: pdfManagerMock.evaluatorOptions,
      } as any);
      markupAnnotation.setCreationDate("D:20190422");

      assertEquals(markupAnnotation.creationDate, "D:20190422");
    });

    it("should not set and get an invalid creation date", () => {
      const markupAnnotation = new MarkupAnnotation({
        dict,
        ref,
        annotationGlobals: annotationGlobalsMock,
        evaluatorOptions: pdfManagerMock.evaluatorOptions,
      } as any);
      markupAnnotation.setCreationDate(undefined);

      assertEquals(markupAnnotation.creationDate, undefined);
    });

    it("should not parse IRT/RT when not defined", async () => {
      dict.set("Type", Name.get("Annot"));
      dict.set("Subtype", Name.get("Text"));

      const xref = new XRefMock([{ ref, data: dict }]) as any;
      const { data } = (await AnnotationFactory.create(
        xref,
        ref,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.inReplyTo, undefined);
      assertEquals(data.replyType, undefined);
    });

    it("should parse IRT and set default RT when not defined", async () => {
      const annotationRef = Ref.get(819, 0);
      const annotationDict = new Dict();
      annotationDict.set("Type", Name.get("Annot"));
      annotationDict.set("Subtype", Name.get("Text"));

      const replyRef = Ref.get(820, 0);
      const replyDict = new Dict();
      replyDict.set("Type", Name.get("Annot"));
      replyDict.set("Subtype", Name.get("Text"));
      replyDict.set("IRT", annotationRef);

      const xref = new XRefMock([
        { ref: annotationRef, data: annotationDict },
        { ref: replyRef, data: replyDict },
      ]) as any;
      annotationDict.assignXref(xref);
      replyDict.assignXref(xref);

      const { data } = (await AnnotationFactory.create(
        xref,
        replyRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.inReplyTo, annotationRef.toString());
      assertEquals(data.replyType, AnnotationReplyType.REPLY);
    });

    it("should parse IRT/RT for a group type", async () => {
      const annotationRef = Ref.get(819, 0);
      const annotationDict = new Dict();
      annotationDict.set("Type", Name.get("Annot"));
      annotationDict.set("Subtype", Name.get("Text"));
      annotationDict.set("T", "ParentTitle");
      annotationDict.set("Contents", "ParentText");
      annotationDict.set("CreationDate", "D:20180423");
      annotationDict.set("M", "D:20190423");
      annotationDict.set("C", [0, 0, 1]);

      const popupRef = Ref.get(820, 0);
      const popupDict = new Dict();
      popupDict.set("Type", Name.get("Annot"));
      popupDict.set("Subtype", Name.get("Popup"));
      popupDict.set("Parent", annotationRef);
      annotationDict.set("Popup", popupRef);

      const replyRef = Ref.get(821, 0);
      const replyDict = new Dict();
      replyDict.set("Type", Name.get("Annot"));
      replyDict.set("Subtype", Name.get("Text"));
      replyDict.set("IRT", annotationRef);
      replyDict.set("RT", Name.get("Group"));
      replyDict.set("T", "ReplyTitle");
      replyDict.set("Contents", "ReplyText");
      replyDict.set("CreationDate", "D:20180523");
      replyDict.set("M", "D:20190523");
      replyDict.set("C", [0.4]);

      const xref = new XRefMock([
        { ref: annotationRef, data: annotationDict },
        { ref: popupRef, data: popupDict },
        { ref: replyRef, data: replyDict },
      ]) as any;
      annotationDict.assignXref(xref);
      popupDict.assignXref(xref);
      replyDict.assignXref(xref);

      const { data } = (await AnnotationFactory.create(
        xref,
        replyRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.inReplyTo, annotationRef.toString());
      assertEquals(data.replyType, AnnotationReplyType.GROUP);
      assertEquals(data.titleObj, { str: "ParentTitle", dir: "ltr" });
      assertEquals(data.contentsObj, { str: "ParentText", dir: "ltr" });
      assertEquals(data.creationDate, "D:20180423");
      assertEquals(data.modificationDate, "D:20190423");
      assertEquals(data.color, new Uint8ClampedArray([0, 0, 255]));
      // kkkk `undefined`
      // assertEquals(data.popupRef, "820R");
    });

    it("should parse IRT/RT for a reply type", async () => {
      const annotationRef = Ref.get(819, 0);
      const annotationDict = new Dict();
      annotationDict.set("Type", Name.get("Annot"));
      annotationDict.set("Subtype", Name.get("Text"));
      annotationDict.set("T", "ParentTitle");
      annotationDict.set("Contents", "ParentText");
      annotationDict.set("CreationDate", "D:20180423");
      annotationDict.set("M", "D:20190423");
      annotationDict.set("C", [0, 0, 1]);

      const popupRef = Ref.get(820, 0);
      const popupDict = new Dict();
      popupDict.set("Type", Name.get("Annot"));
      popupDict.set("Subtype", Name.get("Popup"));
      popupDict.set("Parent", annotationRef);
      annotationDict.set("Popup", popupRef);

      const replyRef = Ref.get(821, 0);
      const replyDict = new Dict();
      replyDict.set("Type", Name.get("Annot"));
      replyDict.set("Subtype", Name.get("Text"));
      replyDict.set("IRT", annotationRef);
      replyDict.set("RT", Name.get("R"));
      replyDict.set("T", "ReplyTitle");
      replyDict.set("Contents", "ReplyText");
      replyDict.set("CreationDate", "D:20180523");
      replyDict.set("M", "D:20190523");
      replyDict.set("C", [0.4]);

      const xref = new XRefMock([
        { ref: annotationRef, data: annotationDict },
        { ref: popupRef, data: popupDict },
        { ref: replyRef, data: replyDict },
      ]) as any;
      annotationDict.assignXref(xref);
      popupDict.assignXref(xref);
      replyDict.assignXref(xref);

      const { data } = (await AnnotationFactory.create(
        xref,
        replyRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.inReplyTo, annotationRef.toString());
      assertEquals(data.replyType, AnnotationReplyType.REPLY);
      assertEquals(data.titleObj, { str: "ReplyTitle", dir: "ltr" });
      assertEquals(data.contentsObj, { str: "ReplyText", dir: "ltr" });
      assertEquals(data.creationDate, "D:20180523");
      assertEquals(data.modificationDate, "D:20190523");
      assertEquals(data.color, new Uint8ClampedArray([102, 102, 102]));
      assertEquals(data.popupRef, undefined);
    });
  });

  describe("TextAnnotation", () => {
    it("should not parse state model and state when not defined", async () => {
      const annotationRef = Ref.get(819, 0);
      const annotationDict = new Dict();
      annotationDict.set("Type", Name.get("Annot"));
      annotationDict.set("Subtype", Name.get("Text"));
      annotationDict.set("Contents", "TestText");

      const replyRef = Ref.get(820, 0);
      const replyDict = new Dict();
      replyDict.set("Type", Name.get("Annot"));
      replyDict.set("Subtype", Name.get("Text"));
      replyDict.set("IRT", annotationRef);
      replyDict.set("RT", Name.get("R"));
      replyDict.set("Contents", "ReplyText");

      const xref = new XRefMock([
        { ref: annotationRef, data: annotationDict },
        { ref: replyRef, data: replyDict },
      ]) as any;
      annotationDict.assignXref(xref);
      replyDict.assignXref(xref);

      const { data } = (await AnnotationFactory.create(
        xref,
        replyRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.stateModel, undefined);
      assertEquals(data.state, undefined);
    });

    it("should correctly parse state model and state when defined", async () => {
      const annotationRef = Ref.get(819, 0);
      const annotationDict = new Dict();
      annotationDict.set("Type", Name.get("Annot"));
      annotationDict.set("Subtype", Name.get("Text"));

      const replyRef = Ref.get(820, 0);
      const replyDict = new Dict();
      replyDict.set("Type", Name.get("Annot"));
      replyDict.set("Subtype", Name.get("Text"));
      replyDict.set("IRT", annotationRef);
      replyDict.set("RT", Name.get("R"));
      replyDict.set("StateModel", "Review");
      replyDict.set("State", "Rejected");

      const xref = new XRefMock([
        { ref: annotationRef, data: annotationDict },
        { ref: replyRef, data: replyDict },
      ]) as any;
      annotationDict.assignXref(xref);
      replyDict.assignXref(xref);

      const { data } = (await AnnotationFactory.create(
        xref,
        replyRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.stateModel, "Review");
      assertEquals(data.state, "Rejected");
    });
  });

  describe("LinkAnnotation", () => {
    it("should correctly parse a URI action", async () => {
      const actionDict = new Dict();
      actionDict.set("Type", Name.get("Action"));
      actionDict.set("S", Name.get("URI"));
      actionDict.set("URI", "http://www.ctan.org/tex-archive/info/lshort");

      const annotationDict = new Dict();
      annotationDict.set("Type", Name.get("Annot"));
      annotationDict.set("Subtype", Name.get("Link"));
      annotationDict.set("A", actionDict);

      const annotationRef = Ref.get(820, 0);
      const xref = new XRefMock([{
        ref: annotationRef,
        data: annotationDict,
      }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        annotationRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.LINK);
      assertEquals(data.url, "http://www.ctan.org/tex-archive/info/lshort");
      assertEquals(
        data.unsafeUrl,
        "http://www.ctan.org/tex-archive/info/lshort",
      );
      assertEquals(data.dest, undefined);
    });

    it(
      "should correctly parse a URI action, where the URI entry " +
        "is missing a protocol",
      async () => {
        const actionDict = new Dict();
        actionDict.set("Type", Name.get("Action"));
        actionDict.set("S", Name.get("URI"));
        actionDict.set("URI", "www.hmrc.gov.uk");

        const annotationDict = new Dict();
        annotationDict.set("Type", Name.get("Annot"));
        annotationDict.set("Subtype", Name.get("Link"));
        annotationDict.set("A", actionDict);

        const annotationRef = Ref.get(353, 0);
        const xref = new XRefMock([
          { ref: annotationRef, data: annotationDict },
        ]) as any;

        const { data } = (await AnnotationFactory.create(
          xref,
          annotationRef,
          annotationGlobalsMock,
          idFactoryMock,
        ))!;
        assertEquals(data.annotationType, AnnotationType.LINK);
        assertEquals(data.url, "http://www.hmrc.gov.uk/");
        assertEquals(data.unsafeUrl, "www.hmrc.gov.uk");
        assertEquals(data.dest, undefined);
      },
    );

    it(
      "should correctly parse a URI action, where the URI entry " +
        "has an incorrect encoding (bug 1122280)",
      async () => {
        const actionStream = new StringStream(
          "<<\n" +
            "/Type /Action\n" +
            "/S /URI\n" +
            "/URI (http://www.example.com/\\303\\274\\303\\266\\303\\244)\n" +
            ">>\n",
        );
        const parser = new Parser({
          lexer: new Lexer(actionStream),
        });
        const actionDict = parser.getObj();

        const annotationDict = new Dict();
        annotationDict.set("Type", Name.get("Annot"));
        annotationDict.set("Subtype", Name.get("Link"));
        annotationDict.set("A", actionDict);

        const annotationRef = Ref.get(8, 0);
        const xref = new XRefMock([
          { ref: annotationRef, data: annotationDict },
        ]) as any;

        const { data } = (await AnnotationFactory.create(
          xref,
          annotationRef,
          annotationGlobalsMock,
          idFactoryMock,
        ))!;
        assertEquals(data.annotationType, AnnotationType.LINK);
        assertEquals(
          data.url,
          new URL(
            stringToUTF8String(
              "http://www.example.com/\xC3\xBC\xC3\xB6\xC3\xA4",
            ),
          ).href,
        );
        assertEquals(
          data.unsafeUrl,
          "http://www.example.com/\xC3\xBC\xC3\xB6\xC3\xA4",
        );
        assertEquals(data.dest, undefined);
      },
    );

    it("should correctly parse a GoTo action", async () => {
      const actionDict = new Dict();
      actionDict.set("Type", Name.get("Action"));
      actionDict.set("S", Name.get("GoTo"));
      actionDict.set("D", "page.157");

      const annotationDict = new Dict();
      annotationDict.set("Type", Name.get("Annot"));
      annotationDict.set("Subtype", Name.get("Link"));
      annotationDict.set("A", actionDict);

      const annotationRef = Ref.get(798, 0);
      const xref = new XRefMock([{
        ref: annotationRef,
        data: annotationDict,
      }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        annotationRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.LINK);
      assertEquals(data.url, undefined);
      assertEquals(data.unsafeUrl, undefined);
      assertEquals(data.dest, "page.157");
    });

    it(
      "should correctly parse a GoToR action, where the FileSpec entry " +
        "is a string containing a relative URL",
      async () => {
        const actionDict = new Dict();
        actionDict.set("Type", Name.get("Action"));
        actionDict.set("S", Name.get("GoToR"));
        actionDict.set("F", "../../0013/001346/134685E.pdf");
        actionDict.set("D", "4.3");
        actionDict.set("NewWindow", true);

        const annotationDict = new Dict();
        annotationDict.set("Type", Name.get("Annot"));
        annotationDict.set("Subtype", Name.get("Link"));
        annotationDict.set("A", actionDict);

        const annotationRef = Ref.get(489, 0);
        const xref = new XRefMock([
          { ref: annotationRef, data: annotationDict },
        ]) as any;

        const { data } = (await AnnotationFactory.create(
          xref,
          annotationRef,
          annotationGlobalsMock,
          idFactoryMock,
        ))!;
        assertEquals(data.annotationType, AnnotationType.LINK);
        assertEquals(data.url, undefined);
        assertEquals(data.unsafeUrl, "../../0013/001346/134685E.pdf#4.3");
        assertEquals(data.dest, undefined);
        assertEquals(data.newWindow, true);
      },
    );

    it(
      "should correctly parse a GoToR action, containing a relative URL, " +
        'with the "docBaseUrl" parameter specified',
      async () => {
        const actionDict = new Dict();
        actionDict.set("Type", Name.get("Action"));
        actionDict.set("S", Name.get("GoToR"));
        actionDict.set("F", "../../0013/001346/134685E.pdf");
        actionDict.set("D", "4.3");

        const annotationDict = new Dict();
        annotationDict.set("Type", Name.get("Annot"));
        annotationDict.set("Subtype", Name.get("Link"));
        annotationDict.set("A", actionDict);

        const annotationRef = Ref.get(489, 0);
        const xref = new XRefMock([
          { ref: annotationRef, data: annotationDict },
        ]) as any;
        const pdfManager: any = new PDFManagerMock({
          docBaseUrl: "http://www.example.com/test/pdfs/qwerty.pdf",
        });
        const annotationGlobals = await AnnotationFactory.createGlobals(
          pdfManager,
        );

        const { data } = (await AnnotationFactory.create(
          xref,
          annotationRef,
          annotationGlobals!,
          idFactoryMock,
        ))!;
        assertEquals(data.annotationType, AnnotationType.LINK);
        assertEquals(
          data.url,
          "http://www.example.com/0013/001346/134685E.pdf#4.3",
        );
        assertEquals(data.unsafeUrl, "../../0013/001346/134685E.pdf#4.3");
        assertEquals(data.dest, undefined);
      },
    );

    it("should correctly parse a GoToR action, with named destination", async () => {
      const actionDict = new Dict();
      actionDict.set("Type", Name.get("Action"));
      actionDict.set("S", Name.get("GoToR"));
      actionDict.set("F", "http://www.example.com/test.pdf");
      actionDict.set("D", "15");

      const annotationDict = new Dict();
      annotationDict.set("Type", Name.get("Annot"));
      annotationDict.set("Subtype", Name.get("Link"));
      annotationDict.set("A", actionDict);

      const annotationRef = Ref.get(495, 0);
      const xref = new XRefMock([{
        ref: annotationRef,
        data: annotationDict,
      }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        annotationRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.LINK);
      assertEquals(data.url, "http://www.example.com/test.pdf#15");
      assertEquals(data.unsafeUrl, "http://www.example.com/test.pdf#15");
      assertEquals(data.dest, undefined);
      assertFalse(data.newWindow);
    });

    it("should correctly parse a GoToR action, with explicit destination array", async () => {
      const actionDict = new Dict();
      actionDict.set("Type", Name.get("Action"));
      actionDict.set("S", Name.get("GoToR"));
      actionDict.set("F", "http://www.example.com/test.pdf");
      actionDict.set("D", [14, Name.get("XYZ"), null, 298.043, null]);

      const annotationDict = new Dict();
      annotationDict.set("Type", Name.get("Annot"));
      annotationDict.set("Subtype", Name.get("Link"));
      annotationDict.set("A", actionDict);

      const annotationRef = Ref.get(489, 0);
      const xref = new XRefMock([{
        ref: annotationRef,
        data: annotationDict,
      }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        annotationRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.LINK);
      assertEquals(
        data.url,
        new URL(
          "http://www.example.com/test.pdf#" +
            '[14,{"name":"XYZ"},null,298.043,null]',
        ).href,
      );
      assertEquals(
        data.unsafeUrl,
        "http://www.example.com/test.pdf#" +
          '[14,{"name":"XYZ"},null,298.043,null]',
      );
      assertEquals(data.dest, undefined);
      assertFalse(data.newWindow);
    });

    it(
      "should correctly parse a Launch action, where the FileSpec dict " +
        'contains a relative URL, with the "docBaseUrl" parameter specified',
      async () => {
        const fileSpecDict = new Dict();
        fileSpecDict.set("Type", Name.get("FileSpec"));
        fileSpecDict.set("F", "Part II/Part II.pdf");
        fileSpecDict.set("UF", "Part II/Part II.pdf");

        const actionDict = new Dict();
        actionDict.set("Type", Name.get("Action"));
        actionDict.set("S", Name.get("Launch"));
        actionDict.set("F", fileSpecDict);
        actionDict.set("NewWindow", true);

        const annotationDict = new Dict();
        annotationDict.set("Type", Name.get("Annot"));
        annotationDict.set("Subtype", Name.get("Link"));
        annotationDict.set("A", actionDict);

        const annotationRef = Ref.get(88, 0);
        const xref = new XRefMock([
          { ref: annotationRef, data: annotationDict },
        ]) as any;
        const pdfManager: any = new PDFManagerMock({
          docBaseUrl: "http://www.example.com/test/pdfs/qwerty.pdf",
        });
        const annotationGlobals = await AnnotationFactory.createGlobals(
          pdfManager,
        );

        const { data } = (await AnnotationFactory.create(
          xref,
          annotationRef,
          annotationGlobals!,
          idFactoryMock,
        ))!;
        assertEquals(data.annotationType, AnnotationType.LINK);
        assertEquals(
          data.url,
          new URL("http://www.example.com/test/pdfs/Part II/Part II.pdf").href,
        );
        assertEquals(data.unsafeUrl, "Part II/Part II.pdf");
        assertEquals(data.dest, undefined);
        assertEquals(data.newWindow, true);
      },
    );

    it(
      "should recover valid URLs from JavaScript actions having certain " +
        "white-listed formats",
      async () => {
        function checkJsAction(params: {
          jsEntry: string | StringStream;
          expectedUrl: string | undefined;
          expectedUnsafeUrl: string | undefined;
          expectedNewWindow: boolean | undefined;
        }) {
          const jsEntry = params.jsEntry;
          const expectedUrl = params.expectedUrl;
          const expectedUnsafeUrl = params.expectedUnsafeUrl;
          const expectedNewWindow = params.expectedNewWindow;

          const actionDict = new Dict();
          actionDict.set("Type", Name.get("Action"));
          actionDict.set("S", Name.get("JavaScript"));
          actionDict.set("JS", jsEntry);

          const annotationDict = new Dict();
          annotationDict.set("Type", Name.get("Annot"));
          annotationDict.set("Subtype", Name.get("Link"));
          annotationDict.set("A", actionDict);

          const annotationRef = Ref.get(46, 0);
          const xref = new XRefMock([
            { ref: annotationRef, data: annotationDict },
          ]) as any;

          return (AnnotationFactory.create(
            xref,
            annotationRef,
            annotationGlobalsMock,
            idFactoryMock,
          ) as Promise<Annotation>).then(({ data }) => {
            assertEquals(data.annotationType, AnnotationType.LINK);
            assertEquals(data.url, expectedUrl);
            assertEquals(data.unsafeUrl, expectedUnsafeUrl);
            assertEquals(data.dest, undefined);
            assertEquals(data.newWindow, expectedNewWindow);
          });
        }

        // Check that we reject a 'JS' entry containing arbitrary JavaScript.
        const annotation1 = checkJsAction({
          jsEntry: 'function someFun() { return "qwerty"; } someFun();',
          expectedUrl: undefined,
          expectedUnsafeUrl: undefined,
          expectedNewWindow: undefined,
        });

        // Check that we accept a white-listed {string} 'JS' entry.
        const annotation2 = checkJsAction({
          jsEntry: "window.open('http://www.example.com/test.pdf')",
          expectedUrl: new URL("http://www.example.com/test.pdf").href,
          expectedUnsafeUrl: "http://www.example.com/test.pdf",
          expectedNewWindow: false,
        });

        // Check that we accept a white-listed {Stream} 'JS' entry.
        const annotation3 = checkJsAction({
          jsEntry: new StringStream(
            'app.launchURL("http://www.example.com/test.pdf", true)',
          ),
          expectedUrl: new URL("http://www.example.com/test.pdf").href,
          expectedUnsafeUrl: "http://www.example.com/test.pdf",
          expectedNewWindow: true,
        });

        await Promise.all([annotation1, annotation2, annotation3]);
      },
    );

    it("should correctly parse a Named action", async () => {
      const actionDict = new Dict();
      actionDict.set("Type", Name.get("Action"));
      actionDict.set("S", Name.get("Named"));
      actionDict.set("N", Name.get("GoToPage"));

      const annotationDict = new Dict();
      annotationDict.set("Type", Name.get("Annot"));
      annotationDict.set("Subtype", Name.get("Link"));
      annotationDict.set("A", actionDict);

      const annotationRef = Ref.get(12, 0);
      const xref = new XRefMock([{
        ref: annotationRef,
        data: annotationDict,
      }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        annotationRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.LINK);
      assertEquals(data.url, undefined);
      assertEquals(data.unsafeUrl, undefined);
      assertEquals(data.action, "GoToPage");
    });

    it("should correctly parse a simple Dest", async () => {
      const annotationDict = new Dict();
      annotationDict.set("Type", Name.get("Annot"));
      annotationDict.set("Subtype", Name.get("Link"));
      annotationDict.set("Dest", Name.get("LI0"));

      const annotationRef = Ref.get(583, 0);
      const xref = new XRefMock([{
        ref: annotationRef,
        data: annotationDict,
      }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        annotationRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.LINK);
      assertEquals(data.url, undefined);
      assertEquals(data.unsafeUrl, undefined);
      assertEquals(data.dest, "LI0");
    });

    it("should correctly parse a simple Dest, with explicit destination array", async () => {
      const annotationDict = new Dict();
      annotationDict.set("Type", Name.get("Annot"));
      annotationDict.set("Subtype", Name.get("Link"));
      annotationDict.set("Dest", [
        Ref.get(17, 0),
        Name.get("XYZ"),
        0,
        841.89,
        null,
      ]);

      const annotationRef = Ref.get(10, 0);
      const xref = new XRefMock([{
        ref: annotationRef,
        data: annotationDict,
      }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        annotationRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.LINK);
      assertEquals(data.url, undefined);
      assertEquals(data.unsafeUrl, undefined);
      assertEquals(data.dest, [
        Ref.get(17, 0),
        Name.get("XYZ") as { name: "XYZ" },
        0,
        841.89,
        null,
      ]);
    });

    it(
      "should correctly parse a Dest, which violates the specification " +
        "by containing a dictionary",
      async () => {
        const destDict = new Dict();
        destDict.set("Type", Name.get("Action"));
        destDict.set("S", Name.get("GoTo"));
        destDict.set("D", "page.157");

        const annotationDict = new Dict();
        annotationDict.set("Type", Name.get("Annot"));
        annotationDict.set("Subtype", Name.get("Link"));
        // The /Dest must be a Name or an Array, refer to ISO 32000-1:2008
        // section 12.3.3, but there are PDF files where it's a dictionary.
        annotationDict.set("Dest", destDict);

        const annotationRef = Ref.get(798, 0);
        const xref = new XRefMock([
          { ref: annotationRef, data: annotationDict },
        ]) as any;

        const { data } = (await AnnotationFactory.create(
          xref,
          annotationRef,
          annotationGlobalsMock,
          idFactoryMock,
        ))!;
        assertEquals(data.annotationType, AnnotationType.LINK);
        assertEquals(data.url, undefined);
        assertEquals(data.unsafeUrl, undefined);
        assertEquals(data.dest, "page.157");
      },
    );

    it("should not set quadpoints if not defined", async () => {
      const annotationDict = new Dict();
      annotationDict.set("Type", Name.get("Annot"));
      annotationDict.set("Subtype", Name.get("Link"));

      const annotationRef = Ref.get(121, 0);
      const xref = new XRefMock([{
        ref: annotationRef,
        data: annotationDict,
      }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        annotationRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.LINK);
      assertEquals(data.quadPoints, undefined);
    });

    it("should set quadpoints if defined", async () => {
      const annotationDict = new Dict();
      annotationDict.set("Type", Name.get("Annot"));
      annotationDict.set("Subtype", Name.get("Link"));
      annotationDict.set("Rect", [10, 10, 20, 20]);
      annotationDict.set("QuadPoints", [10, 20, 20, 20, 10, 10, 20, 10]);

      const annotationRef = Ref.get(121, 0);
      const xref = new XRefMock([{
        ref: annotationRef,
        data: annotationDict,
      }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        annotationRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.LINK);
      assertEquals(
        data.quadPoints,
        Float32Array.from([10, 20, 20, 20, 10, 10, 20, 10]),
      );
    });
  });

  describe("WidgetAnnotation", () => {
    let widgetDict: Dict;

    beforeEach(() => {
      widgetDict = new Dict();
      widgetDict.set("Type", Name.get("Annot"));
      widgetDict.set("Subtype", Name.get("Widget"));
    });

    afterEach(() => {
      widgetDict = undefined as any;
    });

    it("should handle unknown field names", async () => {
      const widgetRef = Ref.get(20, 0);
      const xref = new XRefMock([{ ref: widgetRef, data: widgetDict }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        widgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.WIDGET);
      assertEquals(data.fieldName, "");
    });

    it("should construct the field name when there are no ancestors", async () => {
      widgetDict.set("T", "foo");

      const widgetRef = Ref.get(21, 0);
      const xref = new XRefMock([{ ref: widgetRef, data: widgetDict }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        widgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.WIDGET);
      assertEquals(data.fieldName, "foo");
    });

    it("should construct the field name when there are ancestors", async () => {
      const firstParent = new Dict();
      firstParent.set("T", "foo");

      const secondParent = new Dict();
      secondParent.set("Parent", firstParent);
      secondParent.set("T", "bar");

      widgetDict.set("Parent", secondParent);
      widgetDict.set("T", "baz");

      const widgetRef = Ref.get(22, 0);
      const xref = new XRefMock([{ ref: widgetRef, data: widgetDict }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        widgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.WIDGET);
      assertEquals(data.fieldName, "foo.bar.baz");
    });

    it(
      "should construct the field name if a parent is not a dictionary " +
        "(issue 8143)",
      async () => {
        const parentDict = new Dict();
        parentDict.set("Parent", null);
        parentDict.set("T", "foo");

        widgetDict.set("Parent", parentDict);
        widgetDict.set("T", "bar");

        const widgetRef = Ref.get(22, 0);
        const xref = new XRefMock([{
          ref: widgetRef,
          data: widgetDict,
        }]) as any;

        const { data } = (await AnnotationFactory.create(
          xref,
          widgetRef,
          annotationGlobalsMock,
          idFactoryMock,
        ))!;
        assertEquals(data.annotationType, AnnotationType.WIDGET);
        assertEquals(data.fieldName, "foo.bar");
      },
    );
  });

  describe("TextWidgetAnnotation", () => {
    let textWidgetDict: Dict,
      helvRefObj: { ref: Ref; data: Dict },
      gothRefObj: { ref: Ref; data: Dict };

    beforeEach(() => {
      textWidgetDict = new Dict();
      textWidgetDict.set("Type", Name.get("Annot"));
      textWidgetDict.set("Subtype", Name.get("Widget"));
      textWidgetDict.set("FT", Name.get("Tx"));

      const helvDict = new Dict();
      helvDict.set("BaseFont", Name.get("Helvetica"));
      helvDict.set("Type", Name.get("Font"));
      helvDict.set("Subtype", Name.get("Type1"));

      const gothDict = new Dict();
      gothDict.set("BaseFont", Name.get("MSGothic"));
      gothDict.set("Type", Name.get("Font"));
      gothDict.set("Subtype", Name.get("Type0"));
      gothDict.set("Encoding", Name.get("UniJIS-UTF16-H"));
      gothDict.set("Name", Name.get("MSGothic"));

      const cidSysInfoDict = new Dict();
      cidSysInfoDict.set("Ordering", "Japan1");
      cidSysInfoDict.set("Registry", "Adobe");
      cidSysInfoDict.set("Supplement", "5");

      const fontDescriptorDict = new Dict();
      fontDescriptorDict.set("FontName", Name.get("MSGothic"));
      fontDescriptorDict.set("CapHeight", "680");

      const gothDescendantDict = new Dict();
      gothDescendantDict.set("BaseFont", Name.get("MSGothic"));
      gothDescendantDict.set("CIDSystemInfo", cidSysInfoDict);
      gothDescendantDict.set("Subtype", Name.get("CIDFontType2"));
      gothDescendantDict.set("Type", Name.get("Font"));
      gothDescendantDict.set("FontDescriptor", fontDescriptorDict);

      gothDict.set("DescendantFonts", [gothDescendantDict]);

      const helvRef = Ref.get(314, 0);
      const gothRef = Ref.get(159, 0);
      helvRefObj = { ref: helvRef, data: helvDict };
      gothRefObj = { ref: gothRef, data: gothDict };
      const resourceDict = new Dict();
      const fontDict = new Dict();
      fontDict.set("Helv", helvRef);
      resourceDict.set("Font", fontDict);

      textWidgetDict.set("DA", "/Helv 5 Tf");
      textWidgetDict.set("DR", resourceDict);
      textWidgetDict.set("Rect", [0, 0, 32, 10]);
    });

    afterEach(() => {
      textWidgetDict = helvRefObj = gothRefObj = undefined as any;
    });

    it("should handle unknown text alignment, maximum length and flags", async () => {
      textWidgetDict.set("DV", "foo");

      const textWidgetRef = Ref.get(124, 0);
      const xref = new XRefMock([{
        ref: textWidgetRef,
        data: textWidgetDict,
      }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        textWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.WIDGET);
      assertEquals(data.textAlignment, undefined);
      assertEquals(data.maxLen, 0);
      assertEquals(data.readOnly, false);
      assertEquals(data.hidden, false);
      assertEquals(data.multiLine, false);
      assertEquals(data.comb, false);
      assertEquals(data.defaultFieldValue, "foo");
    });

    it("should not set invalid text alignment, maximum length and flags", async () => {
      textWidgetDict.set("Q", "center");
      textWidgetDict.set("MaxLen", "five");
      textWidgetDict.set("Ff", "readonly");

      const textWidgetRef = Ref.get(43, 0);
      const xref = new XRefMock([{
        ref: textWidgetRef,
        data: textWidgetDict,
      }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        textWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.WIDGET);
      assertEquals(data.textAlignment, undefined);
      assertEquals(data.maxLen, 0);
      assertEquals(data.readOnly, false);
      assertEquals(data.hidden, false);
      assertEquals(data.multiLine, false);
      assertEquals(data.comb, false);
    });

    it("should set valid text alignment, maximum length and flags", async () => {
      textWidgetDict.set("Q", 1);
      textWidgetDict.set("MaxLen", 20);
      textWidgetDict.set(
        "Ff",
        AnnotationFieldFlag.READONLY + AnnotationFieldFlag.MULTILINE,
      );

      const textWidgetRef = Ref.get(84, 0);
      const xref = new XRefMock([{
        ref: textWidgetRef,
        data: textWidgetDict,
      }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        textWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.WIDGET);
      assertEquals(data.textAlignment, 1);
      assertEquals(data.maxLen, 20);
      assertEquals(data.readOnly, true);
      assertEquals(data.hidden, false);
      assertEquals(data.multiLine, true);
    });

    it("should reject comb fields without a maximum length", async () => {
      textWidgetDict.set("Ff", AnnotationFieldFlag.COMB);

      const textWidgetRef = Ref.get(46, 0);
      const xref = new XRefMock([{
        ref: textWidgetRef,
        data: textWidgetDict,
      }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        textWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.WIDGET);
      assertEquals(data.comb, false);
    });

    it("should accept comb fields with a maximum length", async () => {
      textWidgetDict.set("MaxLen", 20);
      textWidgetDict.set("Ff", AnnotationFieldFlag.COMB);

      const textWidgetRef = Ref.get(46, 0);
      const xref = new XRefMock([{
        ref: textWidgetRef,
        data: textWidgetDict,
      }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        textWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.WIDGET);
      assertEquals(data.comb, true);
    });

    it("should only accept comb fields when the flags are valid", async () => {
      const invalidFieldFlags = [
        AnnotationFieldFlag.MULTILINE,
        AnnotationFieldFlag.PASSWORD,
        AnnotationFieldFlag.FILESELECT,
      ];

      // Start with all invalid flags set and remove them one by one.
      // The field may only use combs when all invalid flags are unset.
      let flags = AnnotationFieldFlag.COMB +
        AnnotationFieldFlag.MULTILINE +
        AnnotationFieldFlag.PASSWORD +
        AnnotationFieldFlag.FILESELECT;

      let promise = Promise.resolve();
      for (let i = 0, ii = invalidFieldFlags.length; i <= ii; i++) {
        promise = promise.then(() => {
          textWidgetDict.set("MaxLen", 20);
          textWidgetDict.set("Ff", flags);

          const textWidgetRef = Ref.get(93, 0);
          const xref = new XRefMock([
            { ref: textWidgetRef, data: textWidgetDict },
          ]) as any;

          return (AnnotationFactory.create(
            xref,
            textWidgetRef,
            annotationGlobalsMock,
            idFactoryMock,
          ) as Promise<Annotation>).then(({ data }) => {
            assertEquals(data.annotationType, AnnotationType.WIDGET);

            const valid = invalidFieldFlags.length === 0;
            assertEquals(data.comb, valid);

            // Remove the last invalid flag for the next iteration.
            if (!valid) {
              flags -= invalidFieldFlags.pop()!;
            }
          });
        });
      }
      await promise;
    });

    it("should render regular text for printing", async () => {
      const textWidgetRef = Ref.get(271, 0);
      const xref = new XRefMock([
        { ref: textWidgetRef, data: textWidgetDict },
        helvRefObj,
      ]) as any;
      const task = new WorkerTask("test print");
      partialEvaluator.xref = xref;

      const annotation = await AnnotationFactory.create(
        xref,
        textWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ) as WidgetAnnotation;
      const annotationStorage = new Map();
      annotationStorage.set(annotation.data.id, { value: "test\\print" });

      const appearance = await annotation._getAppearance(
        partialEvaluator,
        task,
        RenderingIntentFlag.PRINT,
        annotationStorage,
      );
      assertEquals(
        appearance,
        "/Tx BMC q BT /Helv 5 Tf 1 0 0 1 0 0 Tm" +
          " 2 3.07 Td (test\\\\print) Tj ET Q EMC",
      );
    });

    it("should render regular text in Japanese for printing", async () => {
      ((textWidgetDict.get("DR") as Dict).get("Font") as Dict).set(
        "Goth",
        gothRefObj.ref,
      );
      textWidgetDict.set("DA", "/Goth 5 Tf");

      const textWidgetRef = Ref.get(271, 0);
      const xref = new XRefMock([
        { ref: textWidgetRef, data: textWidgetDict },
        gothRefObj,
      ]) as any;
      const task = new WorkerTask("test print");
      partialEvaluator.xref = xref;

      const annotation = await AnnotationFactory.create(
        xref,
        textWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ) as WidgetAnnotation;
      const annotationStorage = new Map();
      annotationStorage.set(annotation.data.id, {
        value: "こんにちは世界の",
      });

      const appearance = await annotation._getAppearance(
        partialEvaluator,
        task,
        RenderingIntentFlag.PRINT,
        annotationStorage,
      );
      const utf16String =
        "\x30\x53\x30\x93\x30\x6b\x30\x61\x30\x6f\x4e\x16\x75\x4c\x30\x6e";
      assertEquals(
        appearance,
        "/Tx BMC q BT /Goth 5 Tf 1 0 0 1 0 0 Tm" +
          ` 2 3.07 Td (${utf16String}) Tj ET Q EMC`,
      );
    });

    it("should render regular text for printing using normal appearance", async () => {
      const textWidgetRef = Ref.get(271, 0);

      const appearanceStatesDict = new Dict();
      const normalAppearanceDict = new Dict();

      const normalAppearanceStream = new StringStream("0.1 0.2 0.3 rg");
      normalAppearanceStream.dict = normalAppearanceDict;

      appearanceStatesDict.set("N", normalAppearanceStream);
      textWidgetDict.set("AP", appearanceStatesDict);

      const xref = new XRefMock([
        { ref: textWidgetRef, data: textWidgetDict },
        helvRefObj,
      ]) as any;
      const task = new WorkerTask("test print");
      partialEvaluator.xref = xref;

      const annotation = (await AnnotationFactory.create(
        xref,
        textWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      const annotationStorage = new Map();

      const { opList } = await annotation.getOperatorList(
        partialEvaluator,
        task,
        RenderingIntentFlag.PRINT,
        false,
        annotationStorage,
      );
      assertEquals(opList.argsArray.length, 3);
      assertEquals(opList.fnArray, [
        OPS.beginAnnotation,
        OPS.setFillRGBColor,
        OPS.endAnnotation,
      ]);
      assertEquals(opList.argsArray[0], [
        "271R",
        [0, 0, 32, 10],
        [32, 0, 0, 10, 0, 0],
        [1, 0, 0, 1, 0, 0],
        false,
      ]);
      assertEquals(opList.argsArray[1], new Uint8ClampedArray([26, 51, 76]));
    });

    it("should render auto-sized text for printing", async () => {
      textWidgetDict.set("DA", "/Helv 0 Tf");

      const textWidgetRef = Ref.get(271, 0);
      const xref = new XRefMock([
        { ref: textWidgetRef, data: textWidgetDict },
        helvRefObj,
      ]) as any;
      const task = new WorkerTask("test print");
      partialEvaluator.xref = xref;

      const annotation = await AnnotationFactory.create(
        xref,
        textWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ) as WidgetAnnotation;
      const annotationStorage = new Map();
      annotationStorage.set(annotation.data.id, { value: "test (print)" });

      const appearance = await annotation._getAppearance(
        partialEvaluator,
        task,
        RenderingIntentFlag.PRINT,
        annotationStorage,
      );
      assertEquals(
        appearance,
        "/Tx BMC q BT /Helv 5.92 Tf 0 g 1 0 0 1 0 0 Tm" +
          " 2 3.07 Td (test \\(print\\)) Tj ET Q EMC",
      );
    });

    it("should render auto-sized text in Japanese for printing", async () => {
      ((textWidgetDict.get("DR") as Dict).get("Font") as Dict).set(
        "Goth",
        gothRefObj.ref,
      );
      textWidgetDict.set("DA", "/Goth 0 Tf");

      const textWidgetRef = Ref.get(271, 0);
      const xref = new XRefMock([
        { ref: textWidgetRef, data: textWidgetDict },
        gothRefObj,
      ]) as any;
      const task = new WorkerTask("test print");
      partialEvaluator.xref = xref;

      const annotation = await AnnotationFactory.create(
        xref,
        textWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ) as WidgetAnnotation;
      const annotationStorage = new Map();
      annotationStorage.set(annotation.data.id, {
        value: "こんにちは世界の",
      });

      const appearance = await annotation._getAppearance(
        partialEvaluator,
        task,
        RenderingIntentFlag.PRINT,
        annotationStorage,
      );
      const utf16String =
        "\x30\x53\x30\x93\x30\x6b\x30\x61\x30\x6f\x4e\x16\x75\x4c\x30\x6e";
      assertEquals(
        appearance,
        "/Tx BMC q BT /Goth 5.92 Tf 0 g 1 0 0 1 0 0 Tm" +
          ` 2 3.07 Td (${utf16String}) Tj ET Q EMC`,
      );
    });

    it("should not render a password for printing", async () => {
      textWidgetDict.set("Ff", AnnotationFieldFlag.PASSWORD);

      const textWidgetRef = Ref.get(271, 0);
      const xref = new XRefMock([
        { ref: textWidgetRef, data: textWidgetDict },
        helvRefObj,
      ]) as any;
      const task = new WorkerTask("test print");
      partialEvaluator.xref = xref;

      const annotation = await AnnotationFactory.create(
        xref,
        textWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ) as WidgetAnnotation;
      const annotationStorage = new Map();
      annotationStorage.set(annotation.data.id, { value: "mypassword" });

      const appearance = await annotation._getAppearance(
        partialEvaluator,
        task,
        RenderingIntentFlag.PRINT,
        annotationStorage,
      );
      assertEquals(appearance, undefined);
    });

    it("should render multiline text for printing", async () => {
      textWidgetDict.set("Ff", AnnotationFieldFlag.MULTILINE);

      const textWidgetRef = Ref.get(271, 0);
      const xref = new XRefMock([
        { ref: textWidgetRef, data: textWidgetDict },
        helvRefObj,
      ]) as any;
      const task = new WorkerTask("test print");
      partialEvaluator.xref = xref;

      const annotation = await AnnotationFactory.create(
        xref,
        textWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ) as WidgetAnnotation;
      const annotationStorage = new Map();
      annotationStorage.set(annotation.data.id, {
        value: "a aa aaa aaaa aaaaa aaaaaa " +
          "pneumonoultramicroscopicsilicovolcanoconiosis",
      });

      const appearance = await annotation._getAppearance(
        partialEvaluator,
        task,
        RenderingIntentFlag.PRINT,
        annotationStorage,
      );
      assertEquals(
        appearance,
        "/Tx BMC q BT /Helv 5 Tf 1 0 0 1 0 10 Tm " +
          "2 -6.93 Td (a aa aaa ) Tj\n" +
          "0 -8 Td (aaaa aaaaa ) Tj\n" +
          "0 -8 Td (aaaaaa ) Tj\n" +
          "0 -8 Td (pneumonoultr) Tj\n" +
          "0 -8 Td (amicroscopi) Tj\n" +
          "0 -8 Td (csilicovolca) Tj\n" +
          "0 -8 Td (noconiosis) Tj ET Q EMC",
      );
    });

    it("should render multiline text in Japanese for printing", async () => {
      textWidgetDict.set("Ff", AnnotationFieldFlag.MULTILINE);
      ((textWidgetDict.get("DR") as Dict).get("Font") as Dict).set(
        "Goth",
        gothRefObj.ref,
      );
      textWidgetDict.set("DA", "/Goth 5 Tf");

      const textWidgetRef = Ref.get(271, 0);
      const xref = new XRefMock([
        { ref: textWidgetRef, data: textWidgetDict },
        gothRefObj,
      ]) as any;
      const task = new WorkerTask("test print");
      partialEvaluator.xref = xref;

      const annotation = await AnnotationFactory.create(
        xref,
        textWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ) as WidgetAnnotation;
      const annotationStorage = new Map();
      annotationStorage.set(annotation.data.id, {
        value: "こんにちは世界の",
      });

      const appearance = await annotation._getAppearance(
        partialEvaluator,
        task,
        RenderingIntentFlag.PRINT,
        annotationStorage,
      );
      assertEquals(
        appearance,
        "/Tx BMC q BT /Goth 5 Tf 1 0 0 1 0 10 Tm " +
          "2 -6.93 Td (\x30\x53\x30\x93\x30\x6b\x30\x61\x30\x6f) Tj\n" +
          "0 -8 Td (\x4e\x16\x75\x4c\x30\x6e) Tj ET Q EMC",
      );
    });

    it("should render multiline text with various EOL for printing", async () => {
      textWidgetDict.set("Ff", AnnotationFieldFlag.MULTILINE);
      textWidgetDict.set("Rect", [0, 0, 128, 10]);

      const textWidgetRef = Ref.get(271, 0);
      const xref = new XRefMock([
        { ref: textWidgetRef, data: textWidgetDict },
        helvRefObj,
      ]) as any;
      const task = new WorkerTask("test print");
      partialEvaluator.xref = xref;
      const expectedAppearance = "/Tx BMC q BT /Helv 5 Tf 1 0 0 1 0 10 Tm " +
        "2 -6.93 Td " +
        "(Lorem ipsum dolor sit amet, consectetur adipiscing elit.) Tj\n" +
        "0 -8 Td " +
        "(Aliquam vitae felis ac lectus bibendum ultricies quis non) Tj\n" +
        "0 -8 Td " +
        "( diam.) Tj\n" +
        "0 -8 Td " +
        "(Morbi id porttitor quam, a iaculis dui.) Tj\n" +
        "0 -8 Td " +
        "(Pellentesque habitant morbi tristique senectus et netus ) Tj\n" +
        "0 -8 Td " +
        "(et malesuada fames ac turpis egestas.) Tj\n" +
        "0 -8 Td () Tj\n" +
        "0 -8 Td () Tj\n" +
        "0 -8 Td " +
        "(Nulla consectetur, ligula in tincidunt placerat, velit ) Tj\n" +
        "0 -8 Td " +
        "(augue consectetur orci, sed mattis libero nunc ut massa.) Tj\n" +
        "0 -8 Td " +
        "(Etiam facilisis tempus interdum.) Tj ET Q EMC";

      const annotation = await AnnotationFactory.create(
        xref,
        textWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ) as WidgetAnnotation;
      const annotationStorage = new Map();
      annotationStorage.set(annotation.data.id, {
        value: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.\r" +
          "Aliquam vitae felis ac lectus bibendum ultricies quis non diam.\n" +
          "Morbi id porttitor quam, a iaculis dui.\r\n" +
          "Pellentesque habitant morbi tristique senectus et " +
          "netus et malesuada fames ac turpis egestas.\n\r\n\r" +
          "Nulla consectetur, ligula in tincidunt placerat, " +
          "velit augue consectetur orci, sed mattis libero nunc ut massa.\r" +
          "Etiam facilisis tempus interdum.",
      });

      const appearance = await annotation._getAppearance(
        partialEvaluator,
        task,
        RenderingIntentFlag.PRINT,
        annotationStorage,
      );

      assertEquals(appearance, expectedAppearance);
    });

    it("should render comb for printing", async () => {
      textWidgetDict.set("Ff", AnnotationFieldFlag.COMB);
      textWidgetDict.set("MaxLen", 4);

      const textWidgetRef = Ref.get(271, 0);
      const xref = new XRefMock([
        { ref: textWidgetRef, data: textWidgetDict },
        helvRefObj,
      ]) as any;
      const task = new WorkerTask("test print");
      partialEvaluator.xref = xref;

      const annotation = await AnnotationFactory.create(
        xref,
        textWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ) as WidgetAnnotation;
      const annotationStorage = new Map();
      annotationStorage.set(annotation.data.id, { value: "aa(aa)a\\" });

      const appearance = await annotation._getAppearance(
        partialEvaluator,
        task,
        RenderingIntentFlag.PRINT,
        annotationStorage,
      );
      assertEquals(
        appearance,
        "/Tx BMC q BT /Helv 5 Tf 1 0 0 1 2 3.07 Tm" +
          " (a) Tj 8 0 Td (a) Tj 8 0 Td (\\() Tj" +
          " 8 0 Td (a) Tj 8 0 Td (a) Tj" +
          " 8 0 Td (\\)) Tj 8 0 Td (a) Tj" +
          " 8 0 Td (\\\\) Tj ET Q EMC",
      );
    });

    it("should render comb with Japanese text for printing", async () => {
      textWidgetDict.set("Ff", AnnotationFieldFlag.COMB);
      textWidgetDict.set("MaxLen", 4);
      ((textWidgetDict.get("DR") as Dict).get("Font") as Dict).set(
        "Goth",
        gothRefObj.ref,
      );
      textWidgetDict.set("DA", "/Goth 5 Tf");
      textWidgetDict.set("Rect", [0, 0, 32, 10]);

      const textWidgetRef = Ref.get(271, 0);
      const xref = new XRefMock([
        { ref: textWidgetRef, data: textWidgetDict },
        gothRefObj,
      ]) as any;
      const task = new WorkerTask("test print");
      partialEvaluator.xref = xref;

      const annotation = await AnnotationFactory.create(
        xref,
        textWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ) as WidgetAnnotation;
      const annotationStorage = new Map();
      annotationStorage.set(annotation.data.id, {
        value: "こんにちは世界の",
      });

      const appearance = await annotation._getAppearance(
        partialEvaluator,
        task,
        RenderingIntentFlag.PRINT,
        annotationStorage,
      );
      assertEquals(
        appearance,
        "/Tx BMC q BT /Goth 5 Tf 1 0 0 1 2 3.07 Tm" +
          " (\x30\x53) Tj 8 0 Td (\x30\x93) Tj 8 0 Td (\x30\x6b) Tj" +
          " 8 0 Td (\x30\x61) Tj 8 0 Td (\x30\x6f) Tj" +
          " 8 0 Td (\x4e\x16) Tj 8 0 Td (\x75\x4c) Tj" +
          " 8 0 Td (\x30\x6e) Tj ET Q EMC",
      );
    });

    it("should save text", async () => {
      const textWidgetRef = Ref.get(123, 0);
      const xref = new XRefMock([
        { ref: textWidgetRef, data: textWidgetDict },
        helvRefObj,
      ]) as any;
      partialEvaluator.xref = xref;
      const task = new WorkerTask("test save");

      const annotation = (await AnnotationFactory.create(
        xref,
        textWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      const annotationStorage = new Map();
      annotationStorage.set(annotation.data.id, { value: "hello world" });

      const data = await annotation.save(
        partialEvaluator,
        task,
        annotationStorage,
      ) as AnnotSaveReturn;
      assertEquals(data.length, 2);
      const [oldData, newData] = data;
      assertEquals(oldData.ref, Ref.get(123, 0));
      assertEquals(newData!.ref, Ref.get(2, 0));

      oldData.data = oldData.data!.replace(/\(D:\d+\)/, "(date)");
      assertEquals(
        oldData.data,
        "123 0 obj\n" +
          "<< /Type /Annot /Subtype /Widget /FT /Tx /DA (/Helv 5 Tf) /DR " +
          "<< /Font << /Helv 314 0 R>>>> /Rect [0 0 32 10] " +
          "/V (hello world) /AP << /N 2 0 R>> /M (date)>>\nendobj\n",
      );
      assertEquals(
        newData!.data,
        "2 0 obj\n<< /Subtype /Form /Resources " +
          "<< /Font << /Helv 314 0 R>>>> /BBox [0 0 32 10] /Length 74>> stream\n" +
          "/Tx BMC q BT /Helv 5 Tf 1 0 0 1 0 0 Tm 2 3.07 Td (hello world) Tj " +
          "ET Q EMC\nendstream\nendobj\n",
      );
    });

    it("should save rotated text", async () => {
      const textWidgetRef = Ref.get(123, 0);
      const xref = new XRefMock([
        { ref: textWidgetRef, data: textWidgetDict },
        helvRefObj,
      ]) as any;
      partialEvaluator.xref = xref;
      const task = new WorkerTask("test save");

      const annotation = (await AnnotationFactory.create(
        xref,
        textWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      const annotationStorage = new Map();
      annotationStorage.set(annotation.data.id, {
        value: "hello world",
        rotation: 90,
      });

      const data = await annotation.save(
        partialEvaluator,
        task,
        annotationStorage,
      ) as AnnotSaveReturn;
      assertEquals(data.length, 2);
      const [oldData, newData] = data;
      assertEquals(oldData.ref, Ref.get(123, 0));
      assertEquals(newData!.ref, Ref.get(2, 0));

      oldData.data = oldData.data!.replace(/\(D:\d+\)/, "(date)");
      assertEquals(
        oldData.data,
        "123 0 obj\n" +
          "<< /Type /Annot /Subtype /Widget /FT /Tx /DA (/Helv 5 Tf) /DR " +
          "<< /Font << /Helv 314 0 R>>>> /Rect [0 0 32 10] " +
          "/V (hello world) /MK << /R 90>> /AP << /N 2 0 R>> /M (date)>>\nendobj\n",
      );
      assertEquals(
        newData!.data,
        "2 0 obj\n<< /Subtype /Form /Resources " +
          "<< /Font << /Helv 314 0 R>>>> /BBox [0 0 32 10] /Matrix [0 1 -1 0 32 0] /Length 74>> stream\n" +
          "/Tx BMC q BT /Helv 5 Tf 1 0 0 1 0 0 Tm 2 2.94 Td (hello world) Tj " +
          "ET Q EMC\nendstream\nendobj\n",
      );
    });

    it("should compress and save text", async () => {
      const textWidgetRef = Ref.get(123, 0);
      const xref = new XRefMock([
        { ref: textWidgetRef, data: textWidgetDict },
        helvRefObj,
      ]) as any;
      partialEvaluator.xref = xref;
      const task = new WorkerTask("test save");

      const annotation = (await AnnotationFactory.create(
        xref,
        textWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      const annotationStorage = new Map();
      const value = "a".repeat(256);
      annotationStorage.set(annotation.data.id, { value });

      const data = await annotation.save(
        partialEvaluator,
        task,
        annotationStorage,
      );
      assertEquals(data!.length, 2);
      const [oldData, newData] = data!;
      assertEquals(oldData.ref, Ref.get(123, 0));
      assertEquals(newData!.ref, Ref.get(2, 0));

      oldData.data = oldData.data!.replace(/\(D:\d+\)/, "(date)");
      assertEquals(
        oldData.data,
        "123 0 obj\n" +
          "<< /Type /Annot /Subtype /Widget /FT /Tx /DA (/Helv 5 Tf) /DR " +
          "<< /Font << /Helv 314 0 R>>>> /Rect [0 0 32 10] " +
          `/V (${value}) /AP << /N 2 0 R>> /M (date)>>\nendobj\n`,
      );

      const compressedStream = newData!.data!.substring(
        newData!.data!.indexOf("stream\n") + "stream\n".length,
        newData!.data!.indexOf("\nendstream"),
      );
      // Ensure that the data was in fact (significantly) compressed.
      assertLess(compressedStream.length, value.length / 3);

      assertEquals(
        newData!.data,
        "2 0 obj\n<< /Subtype /Form /Resources " +
          "<< /Font << /Helv 314 0 R>>>> /BBox [0 0 32 10] " +
          `/Filter /FlateDecode /Length ${compressedStream.length}>> stream\n` +
          `${compressedStream}\nendstream\nendobj\n`,
      );

      // Given that the exact compression-output may differ between environments
      // and browsers, ensure that the resulting data can be correctly decoded
      // by our `FlateStream`-implementation since that simulates opening the
      // generated data with the PDF.js library.
      const flateStream = new FlateStream(new StringStream(compressedStream));
      assertEquals(
        flateStream.getString(),
        `/Tx BMC q BT /Helv 5 Tf 1 0 0 1 0 0 Tm 2 3.07 Td (${value}) Tj ET Q EMC`,
      );
    });

    it("should get field object for usage in JS sandbox", async () => {
      const textWidgetRef = Ref.get(123, 0);
      const xDictRef = Ref.get(141, 0);
      const dDictRef = Ref.get(262, 0);
      const next0Ref = Ref.get(314, 0);
      const next1Ref = Ref.get(271, 0);
      const next2Ref = Ref.get(577, 0);
      const next00Ref = Ref.get(413, 0);
      const xDict = new Dict();
      const dDict = new Dict();
      const next0Dict = new Dict();
      const next1Dict = new Dict();
      const next2Dict = new Dict();
      const next00Dict = new Dict();

      const xref = new XRefMock([
        { ref: textWidgetRef, data: textWidgetDict },
        { ref: xDictRef, data: xDict },
        { ref: dDictRef, data: dDict },
        { ref: next0Ref, data: next0Dict },
        { ref: next00Ref, data: next00Dict },
        { ref: next1Ref, data: next1Dict },
        { ref: next2Ref, data: next2Dict },
      ]) as any;

      const JS = Name.get("JavaScript");
      const additionalActionsDict = new Dict();
      const eDict = new Dict();
      eDict.set("JS", "hello()");
      eDict.set("S", JS);
      additionalActionsDict.set("E", eDict);

      // Test the cycle detection here.
      xDict.set("JS", "world()");
      xDict.set("S", JS);
      xDict.set("Next", [next0Ref, next1Ref, next2Ref, xDictRef]);

      next0Dict.set("JS", "olleh()");
      next0Dict.set("S", JS);
      next0Dict.set("Next", next00Ref);

      next00Dict.set("JS", "foo()");
      next00Dict.set("S", JS);
      next00Dict.set("Next", next0Ref);

      next1Dict.set("JS", "dlrow()");
      next1Dict.set("S", JS);
      next1Dict.set("Next", xDictRef);

      next2Dict.set("JS", "oof()");
      next2Dict.set("S", JS);

      dDict.set("JS", "bar()");
      dDict.set("S", JS);
      dDict.set("Next", dDictRef);
      additionalActionsDict.set("D", dDictRef);

      additionalActionsDict.set("X", xDictRef);
      textWidgetDict.set("AA", additionalActionsDict);

      partialEvaluator.xref = xref;

      const annotation = (await AnnotationFactory.create(
        xref,
        textWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      const fieldObject = await annotation.getFieldObject();
      const actions = fieldObject!.actions!;
      assertEquals(actions["Mouse Enter"], ["hello()"]);
      assertEquals(actions["Mouse Exit"], [
        "world()",
        "olleh()",
        "foo()",
        "dlrow()",
        "oof()",
      ]);
      assertEquals(actions["Mouse Down"], ["bar()"]);
    });

    it("should save Japanese text", async () => {
      ((textWidgetDict.get("DR") as Dict).get("Font") as Dict).set(
        "Goth",
        gothRefObj.ref,
      );
      textWidgetDict.set("DA", "/Goth 5 Tf");

      const textWidgetRef = Ref.get(123, 0);
      const xref = new XRefMock([
        { ref: textWidgetRef, data: textWidgetDict },
        gothRefObj,
      ]) as any;
      partialEvaluator.xref = xref;
      const task = new WorkerTask("test save");

      const annotation = (await AnnotationFactory.create(
        xref,
        textWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      const annotationStorage = new Map();
      annotationStorage.set(annotation.data.id, {
        value: "こんにちは世界の",
      });

      const data = await annotation.save(
        partialEvaluator,
        task,
        annotationStorage,
      ) as AnnotSaveReturn;
      const utf16String =
        "\x30\x53\x30\x93\x30\x6b\x30\x61\x30\x6f\x4e\x16\x75\x4c\x30\x6e";
      assertEquals(data.length, 2);
      const [oldData, newData] = data;
      assertEquals(oldData.ref, Ref.get(123, 0));
      assertEquals(newData!.ref, Ref.get(2, 0));

      oldData.data = oldData.data!.replace(/\(D:\d+\)/, "(date)");
      assertEquals(
        oldData.data,
        "123 0 obj\n" +
          "<< /Type /Annot /Subtype /Widget /FT /Tx /DA (/Goth 5 Tf) /DR " +
          "<< /Font << /Helv 314 0 R /Goth 159 0 R>>>> /Rect [0 0 32 10] " +
          `/V (\xfe\xff${utf16String}) /AP << /N 2 0 R>> /M (date)>>\nendobj\n`,
      );
      assertEquals(
        newData!.data,
        "2 0 obj\n<< /Subtype /Form /Resources " +
          "<< /Font << /Helv 314 0 R /Goth 159 0 R>>>> /BBox [0 0 32 10] /Length 79>> stream\n" +
          `/Tx BMC q BT /Goth 5 Tf 1 0 0 1 0 0 Tm 2 3.07 Td (${utf16String}) Tj ` +
          "ET Q EMC\nendstream\nendobj\n",
      );
    });
  });

  describe("ButtonWidgetAnnotation", () => {
    let buttonWidgetDict: Dict;

    beforeEach(() => {
      buttonWidgetDict = new Dict();
      buttonWidgetDict.set("Type", Name.get("Annot"));
      buttonWidgetDict.set("Subtype", Name.get("Widget"));
      buttonWidgetDict.set("FT", Name.get("Btn"));
    });

    afterEach(() => {
      buttonWidgetDict = undefined as any;
    });

    it("should handle checkboxes with export value", async () => {
      buttonWidgetDict.set("V", Name.get("Checked"));
      buttonWidgetDict.set("DV", Name.get("Off"));

      const appearanceStatesDict = new Dict();
      const normalAppearanceDict = new Dict();

      normalAppearanceDict.set("Off", 0);
      normalAppearanceDict.set("Checked", 1);
      appearanceStatesDict.set("N", normalAppearanceDict);
      buttonWidgetDict.set("AP", appearanceStatesDict);

      const buttonWidgetRef = Ref.get(124, 0);
      const xref = new XRefMock([
        { ref: buttonWidgetRef, data: buttonWidgetDict },
      ]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        buttonWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.WIDGET);
      assertEquals(data.checkBox, true);
      assertEquals(data.fieldValue, "Checked");
      assertEquals(data.defaultFieldValue, "Off");
      assertEquals(data.radioButton, false);
      assertEquals(data.exportValue, "Checked");
    });

    it("should handle checkboxes without export value", async () => {
      buttonWidgetDict.set("V", Name.get("Checked"));
      buttonWidgetDict.set("DV", Name.get("Off"));

      const buttonWidgetRef = Ref.get(124, 0);
      const xref = new XRefMock([
        { ref: buttonWidgetRef, data: buttonWidgetDict },
      ]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        buttonWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.WIDGET);
      assertEquals(data.checkBox, true);
      assertEquals(data.fieldValue, "Checked");
      assertEquals(data.defaultFieldValue, "Off");
      assertEquals(data.radioButton, false);
    });

    it("should handle checkboxes without /Off appearance", async () => {
      buttonWidgetDict.set("V", Name.get("Checked"));
      buttonWidgetDict.set("DV", Name.get("Off"));

      const appearanceStatesDict = new Dict();
      const normalAppearanceDict = new Dict();

      normalAppearanceDict.set("Checked", 1);
      appearanceStatesDict.set("N", normalAppearanceDict);
      buttonWidgetDict.set("AP", appearanceStatesDict);

      const buttonWidgetRef = Ref.get(124, 0);
      const xref = new XRefMock([
        { ref: buttonWidgetRef, data: buttonWidgetDict },
      ]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        buttonWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.WIDGET);
      assertEquals(data.checkBox, true);
      assertEquals(data.fieldValue, "Checked");
      assertEquals(data.defaultFieldValue, "Off");
      assertEquals(data.radioButton, false);
      assertEquals(data.exportValue, "Checked");
    });

    it("should render checkbox with fallback font for printing", async () => {
      const appearanceStatesDict = new Dict();
      const normalAppearanceDict = new Dict();
      const checkedAppearanceDict = new Dict();
      const uncheckedAppearanceDict = new Dict();

      const checkedStream = new StringStream("/ 12 Tf (4) Tj");
      checkedStream.dict = checkedAppearanceDict;

      const uncheckedStream = new StringStream("");
      uncheckedStream.dict = uncheckedAppearanceDict;

      checkedAppearanceDict.set("BBox", [0, 0, 8, 8]);
      checkedAppearanceDict.set("FormType", 1);
      checkedAppearanceDict.set("Matrix", [1, 0, 0, 1, 0, 0]);
      normalAppearanceDict.set("Checked", checkedStream);
      normalAppearanceDict.set("Off", uncheckedStream);
      appearanceStatesDict.set("N", normalAppearanceDict);

      buttonWidgetDict.set("AP", appearanceStatesDict);

      const buttonWidgetRef = Ref.get(124, 0);
      const xref = new XRefMock([
        { ref: buttonWidgetRef, data: buttonWidgetDict },
      ]) as any;
      const task = new WorkerTask("test print");
      const checkboxEvaluator = partialEvaluator.clone({ ignoreErrors: true });
      const annotation = (await AnnotationFactory.create(
        xref,
        buttonWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      const annotationStorage: AnnotStorageRecord = new Map();
      annotationStorage.set(annotation.data.id, { value: true });

      const { opList } = await annotation.getOperatorList(
        checkboxEvaluator,
        task,
        RenderingIntentFlag.PRINT,
        false,
        annotationStorage,
      );
      assertEquals(opList.argsArray.length, 5);
      assertEquals(opList.fnArray, [
        OPS.beginAnnotation,
        OPS.dependency,
        OPS.setFont,
        OPS.showText,
        OPS.endAnnotation,
      ]);
      assertEquals(opList.argsArray[0], [
        "124R",
        [0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [1, 0, 0, 1, 0, 0],
        false,
      ]);
      assertEquals((opList.argsArray as any)[3][0][0].unicode, "4");
    });

    it("should render checkboxes for printing", async () => {
      const appearanceStatesDict = new Dict();
      const normalAppearanceDict = new Dict();
      const checkedAppearanceDict = new Dict();
      const uncheckedAppearanceDict = new Dict();

      const checkedStream = new StringStream("0.1 0.2 0.3 rg");
      checkedStream.dict = checkedAppearanceDict;

      const uncheckedStream = new StringStream("0.3 0.2 0.1 rg");
      uncheckedStream.dict = uncheckedAppearanceDict;

      checkedAppearanceDict.set("BBox", [0, 0, 8, 8]);
      checkedAppearanceDict.set("FormType", 1);
      checkedAppearanceDict.set("Matrix", [1, 0, 0, 1, 0, 0]);
      normalAppearanceDict.set("Checked", checkedStream);
      normalAppearanceDict.set("Off", uncheckedStream);
      appearanceStatesDict.set("N", normalAppearanceDict);

      buttonWidgetDict.set("AP", appearanceStatesDict);

      const buttonWidgetRef = Ref.get(124, 0);
      const xref = new XRefMock([
        { ref: buttonWidgetRef, data: buttonWidgetDict },
      ]) as any;
      const task = new WorkerTask("test print");

      const annotation = (await AnnotationFactory.create(
        xref,
        buttonWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      const annotationStorage = new Map();
      annotationStorage.set(annotation.data.id, { value: true });

      const { opList: opList1 } = await annotation.getOperatorList(
        partialEvaluator,
        task,
        RenderingIntentFlag.PRINT,
        false,
        annotationStorage,
      );
      assertEquals(opList1.argsArray.length, 3);
      assertEquals(opList1.fnArray, [
        OPS.beginAnnotation,
        OPS.setFillRGBColor,
        OPS.endAnnotation,
      ]);
      assertEquals(opList1.argsArray[0], [
        "124R",
        [0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [1, 0, 0, 1, 0, 0],
        false,
      ]);
      assertEquals(opList1.argsArray[1], new Uint8ClampedArray([26, 51, 76]));

      annotationStorage.set(annotation.data.id, { value: false });

      const { opList: opList2 } = await annotation.getOperatorList(
        partialEvaluator,
        task,
        RenderingIntentFlag.PRINT,
        false,
        annotationStorage,
      );
      assertEquals(opList2.argsArray.length, 3);
      assertEquals(opList2.fnArray, [
        OPS.beginAnnotation,
        OPS.setFillRGBColor,
        OPS.endAnnotation,
      ]);
      assertEquals(opList2.argsArray[0], [
        "124R",
        [0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [1, 0, 0, 1, 0, 0],
        false,
      ]);
      assertEquals(opList2.argsArray[1], new Uint8ClampedArray([76, 51, 26]));
    });

    it("should render checkboxes for printing twice", async () => {
      const appearanceStatesDict = new Dict();
      const normalAppearanceDict = new Dict();
      const checkedAppearanceDict = new Dict();
      const uncheckedAppearanceDict = new Dict();

      const checkedStream = new StringStream("0.1 0.2 0.3 rg");
      checkedStream.dict = checkedAppearanceDict;

      const uncheckedStream = new StringStream("0.3 0.2 0.1 rg");
      uncheckedStream.dict = uncheckedAppearanceDict;

      checkedAppearanceDict.set("BBox", [0, 0, 8, 8]);
      checkedAppearanceDict.set("FormType", 1);
      checkedAppearanceDict.set("Matrix", [1, 0, 0, 1, 0, 0]);
      normalAppearanceDict.set("Checked", checkedStream);
      normalAppearanceDict.set("Off", uncheckedStream);
      appearanceStatesDict.set("N", normalAppearanceDict);

      buttonWidgetDict.set("AP", appearanceStatesDict);
      buttonWidgetDict.set("AS", Name.get("Off"));

      const buttonWidgetRef = Ref.get(1249, 0);
      const xref = new XRefMock([
        { ref: buttonWidgetRef, data: buttonWidgetDict },
      ]) as any;
      const task = new WorkerTask("test print");

      const annotation = (await AnnotationFactory.create(
        xref,
        buttonWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      const annotationStorage = new Map();

      for (let i = 0; i < 2; i++) {
        annotationStorage.set(annotation.data.id, { value: true });

        const { opList } = await annotation.getOperatorList(
          partialEvaluator,
          task,
          RenderingIntentFlag.PRINT,
          false,
          annotationStorage,
        );
        assertEquals(opList.argsArray.length, 3);
        assertEquals(opList.fnArray, [
          OPS.beginAnnotation,
          OPS.setFillRGBColor,
          OPS.endAnnotation,
        ]);
        assertEquals(opList.argsArray[0], [
          "1249R",
          [0, 0, 0, 0],
          [0, 0, 0, 0, 0, 0],
          [1, 0, 0, 1, 0, 0],
          false,
        ]);
        assertEquals(opList.argsArray[1], new Uint8ClampedArray([26, 51, 76]));
      }
    });

    it("should render checkboxes for printing using normal appearance", async () => {
      const appearanceStatesDict = new Dict();
      const normalAppearanceDict = new Dict();
      const checkedAppearanceDict = new Dict();
      const uncheckedAppearanceDict = new Dict();

      const checkedStream = new StringStream("0.1 0.2 0.3 rg");
      checkedStream.dict = checkedAppearanceDict;

      const uncheckedStream = new StringStream("0.3 0.2 0.1 rg");
      uncheckedStream.dict = uncheckedAppearanceDict;

      checkedAppearanceDict.set("BBox", [0, 0, 8, 8]);
      checkedAppearanceDict.set("FormType", 1);
      checkedAppearanceDict.set("Matrix", [1, 0, 0, 1, 0, 0]);
      normalAppearanceDict.set("Checked", checkedStream);
      normalAppearanceDict.set("Off", uncheckedStream);
      appearanceStatesDict.set("N", normalAppearanceDict);

      buttonWidgetDict.set("AP", appearanceStatesDict);
      buttonWidgetDict.set("AS", Name.get("Checked"));

      const buttonWidgetRef = Ref.get(124, 0);
      const xref = new XRefMock([
        { ref: buttonWidgetRef, data: buttonWidgetDict },
      ]) as any;
      const task = new WorkerTask("test print");

      const annotation = (await AnnotationFactory.create(
        xref,
        buttonWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      const annotationStorage = new Map();

      const { opList } = await annotation.getOperatorList(
        partialEvaluator,
        task,
        RenderingIntentFlag.PRINT,
        false,
        annotationStorage,
      );
      assertEquals(opList.argsArray.length, 3);
      assertEquals(opList.fnArray, [
        OPS.beginAnnotation,
        OPS.setFillRGBColor,
        OPS.endAnnotation,
      ]);
      assertEquals(opList.argsArray[0], [
        "124R",
        [0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [1, 0, 0, 1, 0, 0],
        false,
      ]);
      assertEquals(opList.argsArray[1], new Uint8ClampedArray([26, 51, 76]));
    });

    it("should save checkboxes", async () => {
      const appearanceStatesDict = new Dict();
      const normalAppearanceDict = new Dict();

      normalAppearanceDict.set("Checked", Ref.get(314, 0));
      normalAppearanceDict.set("Off", Ref.get(271, 0));
      appearanceStatesDict.set("N", normalAppearanceDict);

      buttonWidgetDict.set("AP", appearanceStatesDict);
      buttonWidgetDict.set("V", Name.get("Off"));

      const buttonWidgetRef = Ref.get(123, 0);
      const xref = new XRefMock([
        { ref: buttonWidgetRef, data: buttonWidgetDict },
      ]) as any;
      partialEvaluator.xref = xref;
      const task = new WorkerTask("test save");

      const annotation = (await AnnotationFactory.create(
        xref,
        buttonWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      const annotationStorage = new Map();
      annotationStorage.set(annotation.data.id, { value: true });

      const [oldData] = await annotation.save(
        partialEvaluator,
        task,
        annotationStorage,
      ) as AnnotSaveReturn;
      oldData.data = oldData.data!.replace(/\(D:\d+\)/, "(date)");
      assertEquals(oldData.ref, Ref.get(123, 0));
      assertEquals(
        oldData.data,
        "123 0 obj\n" +
          "<< /Type /Annot /Subtype /Widget /FT /Btn " +
          "/AP << /N << /Checked 314 0 R /Off 271 0 R>>>> " +
          "/V /Checked /AS /Checked /M (date)>>\nendobj\n",
      );

      annotationStorage.set(annotation.data.id, { value: false });

      const data = await annotation.save(
        partialEvaluator,
        task,
        annotationStorage,
      );
      assertEquals(data, undefined);
    });

    it("should save rotated checkboxes", async () => {
      const appearanceStatesDict = new Dict();
      const normalAppearanceDict = new Dict();

      normalAppearanceDict.set("Checked", Ref.get(314, 0));
      normalAppearanceDict.set("Off", Ref.get(271, 0));
      appearanceStatesDict.set("N", normalAppearanceDict);

      buttonWidgetDict.set("AP", appearanceStatesDict);
      buttonWidgetDict.set("V", Name.get("Off"));

      const buttonWidgetRef = Ref.get(123, 0);
      const xref = new XRefMock([
        { ref: buttonWidgetRef, data: buttonWidgetDict },
      ]) as any;
      partialEvaluator.xref = xref;
      const task = new WorkerTask("test save");

      const annotation = (await AnnotationFactory.create(
        xref,
        buttonWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      const annotationStorage = new Map();
      annotationStorage.set(annotation.data.id, { value: true, rotation: 180 });

      const [oldData] = await annotation.save(
        partialEvaluator,
        task,
        annotationStorage,
      ) as AnnotSaveReturn;
      oldData.data = oldData.data!.replace(/\(D:\d+\)/, "(date)");
      assertEquals(oldData.ref, Ref.get(123, 0));
      assertEquals(
        oldData.data,
        "123 0 obj\n" +
          "<< /Type /Annot /Subtype /Widget /FT /Btn " +
          "/AP << /N << /Checked 314 0 R /Off 271 0 R>>>> " +
          "/V /Checked /AS /Checked /M (date) /MK << /R 180>>>>\nendobj\n",
      );

      annotationStorage.set(annotation.data.id, { value: false });

      const data = await annotation.save(
        partialEvaluator,
        task,
        annotationStorage,
      );
      assertEquals(data, undefined);
    });

    it("should handle radio buttons with a field value", async () => {
      const parentDict = new Dict();
      parentDict.set("V", Name.get("1"));

      const normalAppearanceStateDict = new Dict();
      normalAppearanceStateDict.set("2", null);

      const appearanceStatesDict = new Dict();
      appearanceStatesDict.set("N", normalAppearanceStateDict);

      buttonWidgetDict.set("Ff", AnnotationFieldFlag.RADIO);
      buttonWidgetDict.set("Parent", parentDict);
      buttonWidgetDict.set("AP", appearanceStatesDict);

      const buttonWidgetRef = Ref.get(124, 0);
      const xref = new XRefMock([
        { ref: buttonWidgetRef, data: buttonWidgetDict },
      ]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        buttonWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.WIDGET);
      assertEquals(data.checkBox, false);
      assertEquals(data.radioButton, true);
      assertEquals(data.fieldValue, "1");
      assertEquals(data.buttonValue, "2");
    });

    it("should handle radio buttons with a field value that's not an ASCII string", async () => {
      const parentDict = new Dict();
      parentDict.set("V", Name.get("\x91I=\x91\xf0\x93\xe0\x97e3"));

      const normalAppearanceStateDict = new Dict();
      normalAppearanceStateDict.set("\x91I=\x91\xf0\x93\xe0\x97e3", null);

      const appearanceStatesDict = new Dict();
      appearanceStatesDict.set("N", normalAppearanceStateDict);

      buttonWidgetDict.set("Ff", AnnotationFieldFlag.RADIO);
      buttonWidgetDict.set("Parent", parentDict);
      buttonWidgetDict.set("AP", appearanceStatesDict);

      const buttonWidgetRef = Ref.get(124, 0);
      const xref = new XRefMock([
        { ref: buttonWidgetRef, data: buttonWidgetDict },
      ]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        buttonWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.WIDGET);
      assertEquals(data.checkBox, false);
      assertEquals(data.radioButton, true);
      assertEquals(data.fieldValue, "‚I=‚ðﬁàŠe3");
      assertEquals(data.buttonValue, "‚I=‚ðﬁàŠe3");
    });

    it("should handle radio buttons without a field value", async () => {
      const normalAppearanceStateDict = new Dict();
      normalAppearanceStateDict.set("2", null);

      const appearanceStatesDict = new Dict();
      appearanceStatesDict.set("N", normalAppearanceStateDict);

      buttonWidgetDict.set("Ff", AnnotationFieldFlag.RADIO);
      buttonWidgetDict.set("AP", appearanceStatesDict);

      const buttonWidgetRef = Ref.get(124, 0);
      const xref = new XRefMock([
        { ref: buttonWidgetRef, data: buttonWidgetDict },
      ]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        buttonWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.WIDGET);
      assertEquals(data.checkBox, false);
      assertEquals(data.radioButton, true);
      assertEquals(data.fieldValue, undefined);
      assertEquals(data.buttonValue, "2");
    });

    it("should render radio buttons for printing", async () => {
      const appearanceStatesDict = new Dict();
      const normalAppearanceDict = new Dict();
      const checkedAppearanceDict = new Dict();
      const uncheckedAppearanceDict = new Dict();

      const checkedStream = new StringStream("0.1 0.2 0.3 rg");
      checkedStream.dict = checkedAppearanceDict;

      const uncheckedStream = new StringStream("0.3 0.2 0.1 rg");
      uncheckedStream.dict = uncheckedAppearanceDict;

      checkedAppearanceDict.set("BBox", [0, 0, 8, 8]);
      checkedAppearanceDict.set("FormType", 1);
      checkedAppearanceDict.set("Matrix", [1, 0, 0, 1, 0, 0]);
      normalAppearanceDict.set("Checked", checkedStream);
      normalAppearanceDict.set("Off", uncheckedStream);
      appearanceStatesDict.set("N", normalAppearanceDict);

      buttonWidgetDict.set("Ff", AnnotationFieldFlag.RADIO);
      buttonWidgetDict.set("AP", appearanceStatesDict);

      const buttonWidgetRef = Ref.get(124, 0);
      const xref = new XRefMock([
        { ref: buttonWidgetRef, data: buttonWidgetDict },
      ]) as any;
      const task = new WorkerTask("test print");

      const annotation = (await AnnotationFactory.create(
        xref,
        buttonWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      const annotationStorage = new Map();
      annotationStorage.set(annotation.data.id, { value: true });

      const { opList: opList1 } = await annotation.getOperatorList(
        partialEvaluator,
        task,
        RenderingIntentFlag.PRINT,
        false,
        annotationStorage,
      );
      assertEquals(opList1.argsArray.length, 3);
      assertEquals(opList1.fnArray, [
        OPS.beginAnnotation,
        OPS.setFillRGBColor,
        OPS.endAnnotation,
      ]);
      assertEquals(opList1.argsArray[0], [
        "124R",
        [0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [1, 0, 0, 1, 0, 0],
        false,
      ]);
      assertEquals(opList1.argsArray[1], new Uint8ClampedArray([26, 51, 76]));

      annotationStorage.set(annotation.data.id, { value: false });

      const { opList: opList2 } = await annotation.getOperatorList(
        partialEvaluator,
        task,
        RenderingIntentFlag.PRINT,
        false,
        annotationStorage,
      );
      assertEquals(opList2.argsArray.length, 3);
      assertEquals(opList2.fnArray, [
        OPS.beginAnnotation,
        OPS.setFillRGBColor,
        OPS.endAnnotation,
      ]);
      assertEquals(opList2.argsArray[0], [
        "124R",
        [0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [1, 0, 0, 1, 0, 0],
        false,
      ]);
      assertEquals(opList2.argsArray[1], new Uint8ClampedArray([76, 51, 26]));
    });

    it("should render radio buttons for printing using normal appearance", async () => {
      const appearanceStatesDict = new Dict();
      const normalAppearanceDict = new Dict();
      const checkedAppearanceDict = new Dict();
      const uncheckedAppearanceDict = new Dict();

      const checkedStream = new StringStream("0.1 0.2 0.3 rg");
      checkedStream.dict = checkedAppearanceDict;

      const uncheckedStream = new StringStream("0.3 0.2 0.1 rg");
      uncheckedStream.dict = uncheckedAppearanceDict;

      checkedAppearanceDict.set("BBox", [0, 0, 8, 8]);
      checkedAppearanceDict.set("FormType", 1);
      checkedAppearanceDict.set("Matrix", [1, 0, 0, 1, 0, 0]);
      normalAppearanceDict.set("Checked", checkedStream);
      normalAppearanceDict.set("Off", uncheckedStream);
      appearanceStatesDict.set("N", normalAppearanceDict);

      buttonWidgetDict.set("Ff", AnnotationFieldFlag.RADIO);
      buttonWidgetDict.set("AP", appearanceStatesDict);
      buttonWidgetDict.set("AS", Name.get("Off"));

      const buttonWidgetRef = Ref.get(124, 0);
      const xref = new XRefMock([
        { ref: buttonWidgetRef, data: buttonWidgetDict },
      ]) as any;
      const task = new WorkerTask("test print");

      const annotation = (await AnnotationFactory.create(
        xref,
        buttonWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      const annotationStorage = new Map();

      const { opList } = await annotation.getOperatorList(
        partialEvaluator,
        task,
        RenderingIntentFlag.PRINT,
        false,
        annotationStorage,
      );
      assertEquals(opList.argsArray.length, 3);
      assertEquals(opList.fnArray, [
        OPS.beginAnnotation,
        OPS.setFillRGBColor,
        OPS.endAnnotation,
      ]);
      assertEquals(opList.argsArray[0], [
        "124R",
        [0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [1, 0, 0, 1, 0, 0],
        false,
      ]);
      assertEquals(opList.argsArray[1], new Uint8ClampedArray([76, 51, 26]));
    });

    it("should save radio buttons", async () => {
      const appearanceStatesDict = new Dict();
      const normalAppearanceDict = new Dict();

      normalAppearanceDict.set("Checked", Ref.get(314, 0));
      normalAppearanceDict.set("Off", Ref.get(271, 0));
      appearanceStatesDict.set("N", normalAppearanceDict);

      buttonWidgetDict.set("Ff", AnnotationFieldFlag.RADIO);
      buttonWidgetDict.set("AP", appearanceStatesDict);

      const buttonWidgetRef = Ref.get(123, 0);
      const parentRef = Ref.get(456, 0);

      const parentDict = new Dict();
      parentDict.set("V", Name.get("Off"));
      parentDict.set("Kids", [buttonWidgetRef]);
      buttonWidgetDict.set("Parent", parentRef);

      const xref = new XRefMock([
        { ref: buttonWidgetRef, data: buttonWidgetDict },
        { ref: parentRef, data: parentDict },
      ]) as any;

      parentDict.xref = xref;
      buttonWidgetDict.xref = xref;
      partialEvaluator.xref = xref;
      const task = new WorkerTask("test save");

      const annotation = (await AnnotationFactory.create(
        xref,
        buttonWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      const annotationStorage = new Map();
      annotationStorage.set(annotation.data.id, { value: true });

      let data = await annotation.save(
        partialEvaluator,
        task,
        annotationStorage,
      ) as AnnotSaveReturn;
      assertEquals(data.length, 2);
      const [radioData, parentData] = data;
      radioData.data = radioData.data!.replace(/\(D:\d+\)/, "(date)");
      assertEquals(radioData.ref, Ref.get(123, 0));
      assertEquals(
        radioData.data,
        "123 0 obj\n" +
          "<< /Type /Annot /Subtype /Widget /FT /Btn /Ff 32768 " +
          "/AP << /N << /Checked 314 0 R /Off 271 0 R>>>> " +
          "/Parent 456 0 R /AS /Checked /M (date)>>\nendobj\n",
      );
      assertEquals(parentData!.ref, Ref.get(456, 0));
      assertEquals(
        parentData!.data,
        "456 0 obj\n<< /V /Checked /Kids [123 0 R]>>\nendobj\n",
      );

      annotationStorage.set(annotation.data.id, { value: false });

      data = await annotation.save(
        partialEvaluator,
        task,
        annotationStorage,
      ) as AnnotSaveReturn;
      assertEquals(data, undefined);
    });

    it("should save radio buttons without a field value", async () => {
      const appearanceStatesDict = new Dict();
      const normalAppearanceDict = new Dict();

      normalAppearanceDict.set("Checked", Ref.get(314, 0));
      normalAppearanceDict.set("Off", Ref.get(271, 0));
      appearanceStatesDict.set("N", normalAppearanceDict);

      buttonWidgetDict.set("Ff", AnnotationFieldFlag.RADIO);
      buttonWidgetDict.set("AP", appearanceStatesDict);

      const buttonWidgetRef = Ref.get(123, 0);
      const parentRef = Ref.get(456, 0);

      const parentDict = new Dict();
      parentDict.set("Kids", [buttonWidgetRef]);
      buttonWidgetDict.set("Parent", parentRef);

      const xref = new XRefMock([
        { ref: buttonWidgetRef, data: buttonWidgetDict },
        { ref: parentRef, data: parentDict },
      ]) as any;

      parentDict.xref = xref;
      buttonWidgetDict.xref = xref;
      partialEvaluator.xref = xref;
      const task = new WorkerTask("test save");

      const annotation = (await AnnotationFactory.create(
        xref,
        buttonWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      const annotationStorage = new Map();
      annotationStorage.set(annotation.data.id, { value: true });

      const data = await annotation.save(
        partialEvaluator,
        task,
        annotationStorage,
      ) as AnnotSaveReturn;
      assertEquals(data.length, 2);
      const [radioData, parentData] = data;
      radioData.data = radioData.data!.replace(/\(D:\d+\)/, "(date)");
      assertEquals(radioData.ref, Ref.get(123, 0));
      assertEquals(
        radioData.data,
        "123 0 obj\n" +
          "<< /Type /Annot /Subtype /Widget /FT /Btn /Ff 32768 " +
          "/AP << /N << /Checked 314 0 R /Off 271 0 R>>>> " +
          "/Parent 456 0 R /AS /Checked /M (date)>>\nendobj\n",
      );
      assertEquals(parentData!.ref, Ref.get(456, 0));
      assertEquals(
        parentData!.data,
        "456 0 obj\n<< /Kids [123 0 R] /V /Checked>>\nendobj\n",
      );
    });

    it("should save nothing", async () => {
      const buttonWidgetRef = Ref.get(124, 0);
      const xref = new XRefMock([
        { ref: buttonWidgetRef, data: buttonWidgetDict },
      ]) as any;
      const task = new WorkerTask("test save");

      const annotation = (await AnnotationFactory.create(
        xref,
        buttonWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      const annotationStorage = new Map();

      const data = await annotation.save(
        partialEvaluator,
        task,
        annotationStorage,
      );
      assertEquals(data, undefined);
    });

    it("should handle push buttons", async () => {
      const buttonWidgetRef = Ref.get(124, 0);
      buttonWidgetDict.set("Ff", AnnotationFieldFlag.PUSHBUTTON);

      const actionDict = new Dict();
      actionDict.set("S", Name.get("JavaScript"));
      actionDict.set("JS", "do_something();");
      buttonWidgetDict.set("A", actionDict);

      const xref = new XRefMock([
        { ref: buttonWidgetRef, data: buttonWidgetDict },
      ]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        buttonWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.WIDGET);
      assertEquals(data.pushButton, true);
      assertEquals(data.actions!.Action, ["do_something();"]);
    });

    it("should handle push buttons that act as a tooltip only", async () => {
      const buttonWidgetRef = Ref.get(124, 0);
      buttonWidgetDict.set("Ff", AnnotationFieldFlag.PUSHBUTTON);
      buttonWidgetDict.set("TU", "An alternative text");

      const xref = new XRefMock([
        { ref: buttonWidgetRef, data: buttonWidgetDict },
      ]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        buttonWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.WIDGET);
      assertEquals(data.pushButton, true);
      assertEquals(data.alternativeText, "An alternative text");
    });

    it("should handle URL in A dict in push buttons", async () => {
      const buttonWidgetRef = Ref.get(124, 0);
      buttonWidgetDict.set("Ff", AnnotationFieldFlag.PUSHBUTTON);

      const actionDict = new Dict();
      actionDict.set("S", Name.get("JavaScript"));
      actionDict.set(
        "JS",
        "app.launchURL('https://developer.mozilla.org/en-US/', true)",
      );
      buttonWidgetDict.set("A", actionDict);

      const xref = new XRefMock([
        { ref: buttonWidgetRef, data: buttonWidgetDict },
      ]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        buttonWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.url, "https://developer.mozilla.org/en-US/");
    });

    it("should handle URL in AA dict in push buttons", async () => {
      const buttonWidgetRef = Ref.get(124, 0);
      buttonWidgetDict.set("Ff", AnnotationFieldFlag.PUSHBUTTON);

      // D stands for MouseDown.
      const dDict = new Dict();
      dDict.set("S", Name.get("JavaScript"));
      dDict.set(
        "JS",
        "app.launchURL('https://developer.mozilla.org/en-US/', true)",
      );
      const actionDict = new Dict();
      actionDict.set("D", dDict);
      buttonWidgetDict.set("AA", actionDict);

      const xref = new XRefMock([
        { ref: buttonWidgetRef, data: buttonWidgetDict },
      ]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        buttonWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.url, "https://developer.mozilla.org/en-US/");
    });
  });

  describe("ChoiceWidgetAnnotation", () => {
    let choiceWidgetDict: Dict,
      fontRefObj: { ref: Ref; data: Dict };

    beforeEach(() => {
      choiceWidgetDict = new Dict();
      choiceWidgetDict.set("Type", Name.get("Annot"));
      choiceWidgetDict.set("Subtype", Name.get("Widget"));
      choiceWidgetDict.set("FT", Name.get("Ch"));

      const helvDict = new Dict();
      helvDict.set("BaseFont", Name.get("Helvetica"));
      helvDict.set("Type", Name.get("Font"));
      helvDict.set("Subtype", Name.get("Type1"));

      const fontRef = Ref.get(314, 0);
      fontRefObj = { ref: fontRef, data: helvDict };
      const resourceDict = new Dict();
      const fontDict = new Dict();
      fontDict.set("Helv", fontRef);
      resourceDict.set("Font", fontDict);

      choiceWidgetDict.set("DA", "/Helv 5 Tf");
      choiceWidgetDict.set("DR", resourceDict);
      choiceWidgetDict.set("Rect", [0, 0, 32, 10]);
    });

    afterEach(() => {
      choiceWidgetDict = fontRefObj = undefined as any;
    });

    it("should handle missing option arrays", async () => {
      const choiceWidgetRef = Ref.get(122, 0);
      const xref = new XRefMock([
        { ref: choiceWidgetRef, data: choiceWidgetDict },
      ]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        choiceWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.WIDGET);
      assertEquals(data.options, []);
    });

    it("should handle option arrays with array elements", async () => {
      const optionBarRef = Ref.get(20, 0);
      const optionBarStr = "Bar";
      const optionOneRef = Ref.get(10, 0);
      const optionOneArr = ["bar_export", optionBarRef] as [string, Ref];

      const options = [["foo_export", "Foo"], optionOneRef];
      const expected = [
        { exportValue: "foo_export", displayValue: "Foo" },
        { exportValue: "bar_export", displayValue: "Bar" },
      ];

      choiceWidgetDict.set("Opt", options);

      const choiceWidgetRef = Ref.get(123, 0);
      const xref = new XRefMock([
        { ref: choiceWidgetRef, data: choiceWidgetDict },
        { ref: optionBarRef, data: optionBarStr },
        { ref: optionOneRef, data: optionOneArr },
      ]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        choiceWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.WIDGET);
      assertEquals(data.options, expected);
    });

    it("should handle option arrays with string elements", async () => {
      const optionBarRef = Ref.get(10, 0);
      const optionBarStr = "Bar";

      const options = ["Foo", optionBarRef];
      const expected = [
        { exportValue: "Foo", displayValue: "Foo" },
        { exportValue: "Bar", displayValue: "Bar" },
      ];

      choiceWidgetDict.set("Opt", options);

      const choiceWidgetRef = Ref.get(981, 0);
      const xref = new XRefMock([
        { ref: choiceWidgetRef, data: choiceWidgetDict },
        { ref: optionBarRef, data: optionBarStr },
      ]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        choiceWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.WIDGET);
      assertEquals(data.options, expected);
    });

    it("should handle inherited option arrays (issue 8094)", async () => {
      const options = [
        ["Value1", "Description1"],
        ["Value2", "Description2"],
      ];
      const expected = [
        { exportValue: "Value1", displayValue: "Description1" },
        { exportValue: "Value2", displayValue: "Description2" },
      ];

      const parentDict = new Dict();
      parentDict.set("Opt", options);

      choiceWidgetDict.set("Parent", parentDict);

      const choiceWidgetRef = Ref.get(123, 0);
      const xref = new XRefMock([
        { ref: choiceWidgetRef, data: choiceWidgetDict },
      ]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        choiceWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.WIDGET);
      assertEquals(data.options, expected);
    });

    it("should decode form values", async () => {
      const encodedString = "\xFE\xFF\x00F\x00o\x00o";
      const decodedString = "Foo";

      choiceWidgetDict.set("Opt", [encodedString]);
      choiceWidgetDict.set("V", encodedString);
      choiceWidgetDict.set("DV", Name.get("foo"));

      const choiceWidgetRef = Ref.get(984, 0);
      const xref = new XRefMock([
        { ref: choiceWidgetRef, data: choiceWidgetDict },
      ]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        choiceWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.WIDGET);
      assertEquals(data.fieldValue, [decodedString]);
      assertEquals(data.defaultFieldValue, "foo");
      assertEquals(data.options, [
        { exportValue: decodedString, displayValue: decodedString },
      ]);
    });

    it("should convert the field value to an array", async () => {
      const inputs = [null, "Foo", ["Foo", "Bar"]];
      const outputs = [[], ["Foo"], ["Foo", "Bar"]];

      let promise = Promise.resolve();
      for (let i = 0, ii = inputs.length; i < ii; i++) {
        promise = promise.then(() => {
          choiceWidgetDict.set("V", inputs[i]);

          const choiceWidgetRef = Ref.get(968, 0);
          const xref = new XRefMock([
            { ref: choiceWidgetRef, data: choiceWidgetDict },
          ]) as any;

          return (AnnotationFactory.create(
            xref,
            choiceWidgetRef,
            annotationGlobalsMock,
            idFactoryMock,
          ) as Promise<Annotation>).then(({ data }) => {
            assertEquals(data.annotationType, AnnotationType.WIDGET);
            assertEquals(data.fieldValue, outputs[i]);
          });
        });
      }
      await promise;
    });

    it("should handle unknown flags", async () => {
      const choiceWidgetRef = Ref.get(166, 0);
      const xref = new XRefMock([
        { ref: choiceWidgetRef, data: choiceWidgetDict },
      ]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        choiceWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.WIDGET);
      assertEquals(data.readOnly, false);
      assertEquals(data.hidden, false);
      assertEquals(data.combo, false);
      assertEquals(data.multiSelect, false);
    });

    it("should not set invalid flags", async () => {
      choiceWidgetDict.set("Ff", "readonly");

      const choiceWidgetRef = Ref.get(165, 0);
      const xref = new XRefMock([
        { ref: choiceWidgetRef, data: choiceWidgetDict },
      ]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        choiceWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.WIDGET);
      assertEquals(data.readOnly, false);
      assertEquals(data.hidden, false);
      assertEquals(data.combo, false);
      assertEquals(data.multiSelect, false);
    });

    it("should set valid flags", async () => {
      choiceWidgetDict.set(
        "Ff",
        AnnotationFieldFlag.READONLY +
          AnnotationFieldFlag.COMBO +
          AnnotationFieldFlag.MULTISELECT,
      );

      const choiceWidgetRef = Ref.get(512, 0);
      const xref = new XRefMock([
        { ref: choiceWidgetRef, data: choiceWidgetDict },
      ]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        choiceWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.WIDGET);
      assertEquals(data.readOnly, true);
      assertEquals(data.hidden, false);
      assertEquals(data.combo, true);
      assertEquals(data.multiSelect, true);
    });

    it("should render choice for printing", async () => {
      const choiceWidgetRef = Ref.get(271, 0);
      const xref = new XRefMock([
        { ref: choiceWidgetRef, data: choiceWidgetDict },
        fontRefObj,
      ]) as any;
      const task = new WorkerTask("test print");
      partialEvaluator.xref = xref;

      const annotation = await AnnotationFactory.create(
        xref,
        choiceWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ) as WidgetAnnotation;
      const annotationStorage = new Map();
      annotationStorage.set(annotation.data.id, { value: "a value" });

      const appearance = await annotation._getAppearance(
        partialEvaluator,
        task,
        RenderingIntentFlag.PRINT,
        annotationStorage,
      );
      assertEquals(
        appearance,
        [
          "/Tx BMC q",
          "1 1 32 10 re W n",
          "BT",
          "/Helv 5 Tf",
          "1 0 0 1 0 10 Tm",
          "ET Q EMC",
        ].join("\n"),
      );
    });

    it("should render choice with multiple selections but one is visible for printing", async () => {
      choiceWidgetDict.set("Ff", AnnotationFieldFlag.MULTISELECT);
      choiceWidgetDict.set("Opt", [
        ["A", "a"],
        ["B", "b"],
        ["C", "c"],
        ["D", "d"],
      ]);
      choiceWidgetDict.set("V", ["A"]);

      const choiceWidgetRef = Ref.get(271, 0);
      const xref = new XRefMock([
        { ref: choiceWidgetRef, data: choiceWidgetDict },
        fontRefObj,
      ]) as any;
      const task = new WorkerTask("test print");
      partialEvaluator.xref = xref;

      const annotation = await AnnotationFactory.create(
        xref,
        choiceWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ) as WidgetAnnotation;
      const annotationStorage = new Map();
      annotationStorage.set(annotation.data.id, { value: ["A", "C"] });

      const appearance = await annotation._getAppearance(
        partialEvaluator,
        task,
        RenderingIntentFlag.PRINT,
        annotationStorage,
      );
      assertEquals(
        appearance,
        [
          "/Tx BMC q",
          "1 1 32 10 re W n",
          "0.600006 0.756866 0.854904 rg",
          "1 3.25 32 6.75 re f",
          "BT",
          "/Helv 5 Tf",
          "1 0 0 1 0 10 Tm",
          "2 -5.88 Td (a) Tj",
          "0 -6.75 Td (b) Tj",
          "ET Q EMC",
        ].join("\n"),
      );
    });

    it("should render choice with multiple selections for printing", async () => {
      choiceWidgetDict.set("Ff", AnnotationFieldFlag.MULTISELECT);
      choiceWidgetDict.set("Opt", [
        ["A", "a"],
        ["B", "b"],
        ["C", "c"],
        ["D", "d"],
      ]);
      choiceWidgetDict.set("V", ["A"]);

      const choiceWidgetRef = Ref.get(271, 0);
      const xref = new XRefMock([
        { ref: choiceWidgetRef, data: choiceWidgetDict },
        fontRefObj,
      ]) as any;
      const task = new WorkerTask("test print");
      partialEvaluator.xref = xref;

      const annotation = await AnnotationFactory.create(
        xref,
        choiceWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ) as WidgetAnnotation;
      const annotationStorage = new Map();
      annotationStorage.set(annotation.data.id, { value: ["B", "C"] });

      const appearance = await annotation._getAppearance(
        partialEvaluator,
        task,
        RenderingIntentFlag.PRINT,
        annotationStorage,
      );
      assertEquals(
        appearance,
        [
          "/Tx BMC q",
          "1 1 32 10 re W n",
          "0.600006 0.756866 0.854904 rg",
          "1 3.25 32 6.75 re f",
          "1 -3.5 32 6.75 re f",
          "BT",
          "/Helv 5 Tf",
          "1 0 0 1 0 10 Tm",
          "2 -5.88 Td (b) Tj",
          "0 -6.75 Td (c) Tj",
          "ET Q EMC",
        ].join("\n"),
      );
    });

    it("should save rotated choice", async () => {
      choiceWidgetDict.set("Opt", ["A", "B", "C"]);
      choiceWidgetDict.set("V", "A");

      const choiceWidgetRef = Ref.get(123, 0);
      const xref = new XRefMock([
        { ref: choiceWidgetRef, data: choiceWidgetDict },
        fontRefObj,
      ]) as any;
      partialEvaluator.xref = xref;
      const task = new WorkerTask("test save");

      const annotation = (await AnnotationFactory.create(
        xref,
        choiceWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      const annotationStorage = new Map();
      annotationStorage.set(annotation.data.id, { value: "C", rotation: 270 });

      const data = await annotation.save(
        partialEvaluator,
        task,
        annotationStorage,
      ) as AnnotSaveReturn;
      assertEquals(data.length, 2);
      const [oldData, newData] = data;
      assertEquals(oldData.ref, Ref.get(123, 0));
      assertEquals(newData!.ref, Ref.get(2, 0));

      oldData.data = oldData.data!.replace(/\(D:\d+\)/, "(date)");
      assertEquals(
        oldData.data,
        "123 0 obj\n" +
          "<< /Type /Annot /Subtype /Widget /FT /Ch /DA (/Helv 5 Tf) /DR " +
          "<< /Font << /Helv 314 0 R>>>> " +
          "/Rect [0 0 32 10] /Opt [(A) (B) (C)] /V (C) " +
          "/MK << /R 270>> /AP << /N 2 0 R>> /M (date)>>\nendobj\n",
      );
      assertEquals(
        newData!.data,
        [
          "2 0 obj",
          "<< /Subtype /Form /Resources << /Font << /Helv 314 0 R>>>> " +
          "/BBox [0 0 32 10] /Matrix [0 -1 1 0 0 10] /Length 170>> stream",
          "/Tx BMC q",
          "1 1 10 32 re W n",
          "0.600006 0.756866 0.854904 rg",
          "1 11.75 10 6.75 re f",
          "BT",
          "/Helv 5 Tf",
          "1 0 0 1 0 32 Tm",
          "2 -5.88 Td (A) Tj",
          "0 -6.75 Td (B) Tj",
          "0 -6.75 Td (C) Tj",
          "ET Q EMC",
          "endstream",
          "endobj\n",
        ].join("\n"),
      );
    });

    it("should save choice", async () => {
      choiceWidgetDict.set("Opt", ["A", "B", "C"]);
      choiceWidgetDict.set("V", "A");

      const choiceWidgetRef = Ref.get(123, 0);
      const xref = new XRefMock([
        { ref: choiceWidgetRef, data: choiceWidgetDict },
        fontRefObj,
      ]) as any;
      partialEvaluator.xref = xref;
      const task = new WorkerTask("test save");

      const annotation = (await AnnotationFactory.create(
        xref,
        choiceWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      const annotationStorage = new Map();
      annotationStorage.set(annotation.data.id, { value: "C" });

      const data = await annotation.save(
        partialEvaluator,
        task,
        annotationStorage,
      ) as AnnotSaveReturn;
      assertEquals(data.length, 2);
      const [oldData, newData] = data;
      assertEquals(oldData.ref, Ref.get(123, 0));
      assertEquals(newData!.ref, Ref.get(2, 0));

      oldData.data = oldData.data!.replace(/\(D:\d+\)/, "(date)");
      assertEquals(
        oldData.data,
        "123 0 obj\n" +
          "<< /Type /Annot /Subtype /Widget /FT /Ch /DA (/Helv 5 Tf) /DR " +
          "<< /Font << /Helv 314 0 R>>>> " +
          "/Rect [0 0 32 10] /Opt [(A) (B) (C)] /V (C) " +
          "/AP << /N 2 0 R>> /M (date)>>\nendobj\n",
      );
      assertEquals(
        newData!.data,
        [
          "2 0 obj",
          "<< /Subtype /Form /Resources << /Font << /Helv 314 0 R>>>> " +
          "/BBox [0 0 32 10] /Length 133>> stream",
          "/Tx BMC q",
          "1 1 32 10 re W n",
          "0.600006 0.756866 0.854904 rg",
          "1 3.25 32 6.75 re f",
          "BT",
          "/Helv 5 Tf",
          "1 0 0 1 0 10 Tm",
          "2 -5.88 Td (C) Tj",
          "ET Q EMC",
          "endstream",
          "endobj\n",
        ].join("\n"),
      );
    });

    it("should save choice with multiple selections", async () => {
      choiceWidgetDict.set("Ff", AnnotationFieldFlag.MULTISELECT);
      choiceWidgetDict.set("Opt", [
        ["A", "a"],
        ["B", "b"],
        ["C", "c"],
        ["D", "d"],
      ]);
      choiceWidgetDict.set("V", ["A"]);

      const choiceWidgetRef = Ref.get(123, 0);
      const xref = new XRefMock([
        { ref: choiceWidgetRef, data: choiceWidgetDict },
        fontRefObj,
      ]) as any;
      const task = new WorkerTask("test save");
      partialEvaluator.xref = xref;

      const annotation = (await AnnotationFactory.create(
        xref,
        choiceWidgetRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      const annotationStorage = new Map();
      annotationStorage.set(annotation.data.id, { value: ["B", "C"] });

      const data = await annotation.save(
        partialEvaluator,
        task,
        annotationStorage,
      ) as AnnotSaveReturn;

      assertEquals(data.length, 2);
      const [oldData, newData] = data;
      assertEquals(oldData.ref, Ref.get(123, 0));
      assertEquals(newData!.ref, Ref.get(2, 0));

      oldData.data = oldData.data!.replace(/\(D:\d+\)/, "(date)");
      assertEquals(
        oldData.data,
        "123 0 obj\n" +
          "<< /Type /Annot /Subtype /Widget /FT /Ch /DA (/Helv 5 Tf) /DR " +
          "<< /Font << /Helv 314 0 R>>>> /Rect [0 0 32 10] /Ff 2097152 /Opt " +
          "[[(A) (a)] [(B) (b)] [(C) (c)] [(D) (d)]] /V [(B) (C)] /AP " +
          "<< /N 2 0 R>> /M (date)>>\nendobj\n",
      );
      assertEquals(
        newData!.data,
        [
          "2 0 obj",
          "<< /Subtype /Form /Resources << /Font << /Helv 314 0 R>>>> " +
          "/BBox [0 0 32 10] /Length 171>> stream",
          "/Tx BMC q",
          "1 1 32 10 re W n",
          "0.600006 0.756866 0.854904 rg",
          "1 3.25 32 6.75 re f",
          "1 -3.5 32 6.75 re f",
          "BT",
          "/Helv 5 Tf",
          "1 0 0 1 0 10 Tm",
          "2 -5.88 Td (b) Tj",
          "0 -6.75 Td (c) Tj",
          "ET Q EMC",
          "endstream",
          "endobj\n",
        ].join("\n"),
      );
    });
  });

  describe("LineAnnotation", () => {
    it("should set the line coordinates", async () => {
      const lineDict = new Dict();
      lineDict.set("Type", Name.get("Annot"));
      lineDict.set("Subtype", Name.get("Line"));
      lineDict.set("L", [1, 2, 3, 4]);
      lineDict.set("LE", ["Square", "Circle"]);

      const lineRef = Ref.get(122, 0);
      const xref = new XRefMock([{ ref: lineRef, data: lineDict }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        lineRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.LINE);
      assertEquals(data.lineCoordinates, [1, 2, 3, 4]);
      assertEquals(data.lineEndings, ["None", "None"]);
    });

    it("should set the line endings", async () => {
      const lineDict = new Dict();
      lineDict.set("Type", Name.get("Annot"));
      lineDict.set("Subtype", Name.get("Line"));
      lineDict.set("L", [1, 2, 3, 4]);
      lineDict.set("LE", [Name.get("Square"), Name.get("Circle")]);

      const lineRef = Ref.get(122, 0);
      const xref = new XRefMock([{ ref: lineRef, data: lineDict }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        lineRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.LINE);
      assertEquals(data.lineCoordinates, [1, 2, 3, 4]);
      assertEquals(data.lineEndings, ["Square", "Circle"]);
    });
  });

  describe("FileAttachmentAnnotation", () => {
    it("should correctly parse a file attachment", async () => {
      const fileStream = new StringStream(
        "<<\n" +
          "/Type /EmbeddedFile\n" +
          "/Subtype /text#2Fplain\n" +
          ">>\n" +
          "stream\n" +
          "Test attachment" +
          "endstream\n",
      );
      const parser = new Parser({
        lexer: new Lexer(fileStream),
        xref: undefined,
        allowStreams: true,
      });

      const fileStreamRef = Ref.get(18, 0);
      const fileStreamDict = parser.getObj() as Dict;

      const embeddedFileDict = new Dict();
      embeddedFileDict.set("F", fileStreamRef);

      const fileSpecRef = Ref.get(19, 0);
      const fileSpecDict = new Dict();
      fileSpecDict.set("Type", Name.get("Filespec"));
      fileSpecDict.set("Desc", "abc");
      fileSpecDict.set("EF", embeddedFileDict);
      fileSpecDict.set("UF", "Test.txt");

      const fileAttachmentRef = Ref.get(20, 0);
      const fileAttachmentDict = new Dict();
      fileAttachmentDict.set("Type", Name.get("Annot"));
      fileAttachmentDict.set("Subtype", Name.get("FileAttachment"));
      fileAttachmentDict.set("FS", fileSpecRef);
      fileAttachmentDict.set("T", "Topic");
      fileAttachmentDict.set("Contents", "Test.txt");

      const xref = new XRefMock([
        { ref: fileStreamRef, data: fileStreamDict },
        { ref: fileSpecRef, data: fileSpecDict },
        { ref: fileAttachmentRef, data: fileAttachmentDict },
      ]) as any;
      embeddedFileDict.assignXref(xref);
      fileSpecDict.assignXref(xref);
      fileAttachmentDict.assignXref(xref);

      const { data } = (await AnnotationFactory.create(
        xref,
        fileAttachmentRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.FILEATTACHMENT);
      assertEquals(data.file, {
        rawFilename: "Test.txt",
        filename: "Test.txt",
        content: stringToBytes("Test attachment"),
        description: "abc",
      });
    });
  });

  describe("PopupAnnotation", () => {
    it("should inherit properties from its parent", async () => {
      const parentDict = new Dict();
      parentDict.set("Type", Name.get("Annot"));
      parentDict.set("Subtype", Name.get("Text"));
      parentDict.set("M", "D:20190423");
      parentDict.set("C", [0, 0, 1]);

      const popupDict = new Dict();
      popupDict.set("Type", Name.get("Annot"));
      popupDict.set("Subtype", Name.get("Popup"));
      popupDict.set("Parent", parentDict);

      const popupRef = Ref.get(13, 0);
      const xref = new XRefMock([{ ref: popupRef, data: popupDict }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        popupRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.POPUP);
      assertEquals(data.modificationDate, "D:20190423");
      assertEquals(data.color, new Uint8ClampedArray([0, 0, 255]));
    });

    it("should handle missing parent properties", async () => {
      const parentDict = new Dict();
      parentDict.set("Type", Name.get("Annot"));
      parentDict.set("Subtype", Name.get("Text"));

      const popupDict = new Dict();
      popupDict.set("Type", Name.get("Annot"));
      popupDict.set("Subtype", Name.get("Popup"));
      popupDict.set("Parent", parentDict);

      const popupRef = Ref.get(13, 0);
      const xref = new XRefMock([{ ref: popupRef, data: popupDict }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        popupRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.POPUP);
      assertEquals(data.modificationDate, undefined);
      assertEquals(data.color, undefined);
    });

    it(
      "should inherit the parent flags when the Popup is not viewable, " +
        "but the parent is (PR 7352)",
      async () => {
        const parentDict = new Dict();
        parentDict.set("Type", Name.get("Annot"));
        parentDict.set("Subtype", Name.get("Text"));
        parentDict.set("F", 28); // viewable

        const popupDict = new Dict();
        popupDict.set("Type", Name.get("Annot"));
        popupDict.set("Subtype", Name.get("Popup"));
        popupDict.set("F", 56); // not viewable
        popupDict.set("Parent", parentDict);

        const popupRef = Ref.get(13, 0);
        const xref = new XRefMock([{ ref: popupRef, data: popupDict }]) as any;

        const { data, viewable } = (await AnnotationFactory.create(
          xref,
          popupRef,
          annotationGlobalsMock,
          idFactoryMock,
        ))!;
        assertEquals(data.annotationType, AnnotationType.POPUP);
        // We should not modify the `annotationFlags` returned through
        // e.g., the API.
        assertEquals(data.annotationFlags, 56);
        // The popup should inherit the `viewable` property of the parent.
        assertEquals(viewable, true);
      },
    );

    it(
      "should correctly inherit Contents from group-master annotation " +
        "if parent has ReplyType == Group",
      async () => {
        const annotationRef = Ref.get(819, 0);
        const annotationDict = new Dict();
        annotationDict.set("Type", Name.get("Annot"));
        annotationDict.set("Subtype", Name.get("Text"));
        annotationDict.set("T", "Correct Title");
        annotationDict.set("Contents", "Correct Text");
        annotationDict.set("M", "D:20190423");
        annotationDict.set("C", [0, 0, 1]);

        const replyRef = Ref.get(820, 0);
        const replyDict = new Dict();
        replyDict.set("Type", Name.get("Annot"));
        replyDict.set("Subtype", Name.get("Text"));
        replyDict.set("IRT", annotationRef);
        replyDict.set("RT", Name.get("Group"));
        replyDict.set("T", "Reply Title");
        replyDict.set("Contents", "Reply Text");
        replyDict.set("M", "D:20190523");
        replyDict.set("C", [0.4]);

        const popupRef = Ref.get(821, 0);
        const popupDict = new Dict();
        popupDict.set("Type", Name.get("Annot"));
        popupDict.set("Subtype", Name.get("Popup"));
        popupDict.set("T", "Wrong Title");
        popupDict.set("Contents", "Wrong Text");
        popupDict.set("Parent", replyRef);
        popupDict.set("M", "D:20190623");
        popupDict.set("C", [0.8]);
        replyDict.set("Popup", popupRef);

        const xref = new XRefMock([
          { ref: annotationRef, data: annotationDict },
          { ref: replyRef, data: replyDict },
          { ref: popupRef, data: popupDict },
        ]) as any;
        annotationDict.assignXref(xref);
        popupDict.assignXref(xref);
        replyDict.assignXref(xref);

        const { data } = (await AnnotationFactory.create(
          xref,
          popupRef,
          annotationGlobalsMock,
          idFactoryMock,
        ))!;
        assertEquals(data.titleObj, {
          str: "Correct Title",
          dir: "ltr",
        });
        assertEquals(data.contentsObj, {
          str: "Correct Text",
          dir: "ltr",
        });
        assertEquals(data.modificationDate, "D:20190423");
        assertEquals(data.color, new Uint8ClampedArray([0, 0, 255]));
      },
    );
  });

  describe("FreeTextAnnotation", () => {
    it("should create a new FreeText annotation", async () => {
      partialEvaluator.xref = new XRefMock() as any;
      const task = new WorkerTask("test FreeText creation");
      const data = await AnnotationFactory.saveNewAnnotations(
        partialEvaluator,
        task,
        [
          {
            annotationType: AnnotationEditorType.FREETEXT,
            rect: [12, 34, 56, 78],
            rotation: 0,
            fontSize: 10,
            color: [0, 0, 0] as any,
            value: "Hello PDF.js World!",
          },
        ],
        undefined,
      );

      const base = data.annotations[0].data!.replace(/\(D:\d+\)/, "(date)");
      assertEquals(
        base,
        "2 0 obj\n" +
          "<< /Type /Annot /Subtype /FreeText /CreationDate (date) " +
          "/Rect [12 34 56 78] /DA (/Helv 10 Tf 0 g) /Contents (Hello PDF.js World!) " +
          "/F 4 /Border [0 0 0] /Rotate 0 /AP << /N 3 0 R>>>>\n" +
          "endobj\n",
      );

      const font = data.dependencies[0].data;
      assertEquals(
        font,
        "1 0 obj\n" +
          "<< /BaseFont /Helvetica /Type /Font /Subtype /Type1 /Encoding " +
          "/WinAnsiEncoding>>\n" +
          "endobj\n",
      );

      const appearance = data.dependencies[1].data;
      assertEquals(
        appearance,
        "3 0 obj\n" +
          "<< /FormType 1 /Subtype /Form /Type /XObject /BBox [12 34 56 78] " +
          "/Resources << /Font << /Helv 1 0 R>>>> /Matrix [1 0 0 1 -12 -34] " +
          "/Length 98>> stream\n" +
          "q\n" +
          "1 0 0 1 0 0 cm\n" +
          "12 34 44 44 re W n\n" +
          "BT\n" +
          "0 g\n" +
          "0 Tc /Helv 10 Tf\n" +
          "12 68 Td (Hello PDF.js World!) Tj\n" +
          "ET\n" +
          "Q\n" +
          "endstream\n" +
          "endobj\n",
      );
    });

    it("should render an added FreeText annotation for printing", async () => {
      partialEvaluator.xref = new XRefMock() as any;
      const task = new WorkerTask("test FreeText printing");
      const freetextAnnotation = (
        await AnnotationFactory.printNewAnnotations(
          annotationGlobalsMock,
          partialEvaluator,
          task,
          [
            {
              annotationType: AnnotationEditorType.FREETEXT,
              rect: [12, 34, 56, 78],
              rotation: 0,
              fontSize: 10,
              color: [0, 0, 0] as any,
              value: "A",
            },
          ],
          undefined,
        )
      )![0];

      const { opList } = await freetextAnnotation.getOperatorList(
        partialEvaluator,
        task,
        RenderingIntentFlag.PRINT,
        false,
      );

      assertEquals(opList.fnArray.length, 16);
      assertEquals(opList.fnArray, [
        OPS.beginAnnotation,
        OPS.save,
        OPS.transform,
        OPS.constructPath,
        OPS.clip,
        OPS.endPath,
        OPS.beginText,
        OPS.setFillRGBColor,
        OPS.setCharSpacing,
        OPS.dependency,
        OPS.setFont,
        OPS.moveText,
        OPS.showText,
        OPS.endText,
        OPS.restore,
        OPS.endAnnotation,
      ]);
    });

    it("should extract the text from a FreeText annotation", async () => {
      partialEvaluator.xref = new XRefMock() as any;
      const task = new WorkerTask("test FreeText text extraction");
      const freetextAnnotation = (
        await AnnotationFactory.printNewAnnotations(
          annotationGlobalsMock,
          partialEvaluator,
          task,
          [
            {
              annotationType: AnnotationEditorType.FREETEXT,
              rect: [12, 34, 56, 78],
              rotation: 0,
              fontSize: 10,
              color: [0, 0, 0] as any,
              value: "Hello PDF.js\nWorld !",
            },
          ],
          undefined,
        )
      )![0];

      await freetextAnnotation.extractTextContent(partialEvaluator, task, [
        -Infinity,
        -Infinity,
        Infinity,
        Infinity,
      ]);

      assertEquals(freetextAnnotation.data.textContent, [
        "Hello PDF.js",
        "World !",
      ]);
    });
  });

  describe("InkAnnotation", () => {
    it("should handle a single ink list", async () => {
      const inkDict = new Dict();
      inkDict.set("Type", Name.get("Annot"));
      inkDict.set("Subtype", Name.get("Ink"));
      const inkList = [1, 1, 1, 2, 2, 2, 3, 3];
      inkDict.set("InkList", [inkList]);

      const inkRef = Ref.get(142, 0);
      const xref = new XRefMock([{ ref: inkRef, data: inkDict }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        inkRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.INK);
      assertEquals(data.inkLists!.length, 1);
      assertEquals(data.inkLists![0], Float32Array.from(inkList));
    });

    it("should handle multiple ink lists", async () => {
      const inkDict = new Dict();
      inkDict.set("Type", Name.get("Annot"));
      inkDict.set("Subtype", Name.get("Ink"));
      const inkList0 = [1, 1, 1, 2];
      const inkList1 = [3, 3, 4, 5];
      inkDict.set("InkList", [inkList0, inkList1]);

      const inkRef = Ref.get(143, 0);
      const xref = new XRefMock([{ ref: inkRef, data: inkDict }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        inkRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.INK);
      assertEquals(data.inkLists!.length, 2);
      assertEquals(data.inkLists![0], Float32Array.from(inkList0));
      assertEquals(data.inkLists![1], Float32Array.from(inkList1));
    });

    it("should create a new Ink annotation", async () => {
      partialEvaluator.xref = new XRefMock() as any;
      const task = new WorkerTask("test Ink creation");
      const data = await AnnotationFactory.saveNewAnnotations(
        partialEvaluator,
        task,
        [
          {
            annotationType: AnnotationEditorType.INK,
            rect: [12, 34, 56, 78],
            rotation: 0,
            thickness: 1,
            opacity: 1,
            color: [0, 0, 0] as any,
            paths: [
              {
                // deno-fmt-ignore
                bezier: [
                  10, 11, 12, 13, 14, 15, 16, 17, 22, 23, 24, 25, 26, 27,
                ],
                points: [1, 2, 3, 4, 5, 6, 7, 8],
              },
              {
                // deno-fmt-ignore
                bezier: [
                  910, 911, 912, 913, 914, 915, 916, 917, 922, 923, 924, 925,
                  926, 927,
                ],
                points: [91, 92, 93, 94, 95, 96, 97, 98],
              },
            ],
          },
        ],
        undefined,
      );

      const base = data.annotations[0].data!.replace(/\(D:\d+\)/, "(date)");
      assertEquals(
        base,
        "1 0 obj\n" +
          "<< /Type /Annot /Subtype /Ink /CreationDate (date) /Rect [12 34 56 78] " +
          "/InkList [[1 2 3 4 5 6 7 8] [91 92 93 94 95 96 97 98]] /F 4 " +
          "/Rotate 0 /BS << /W 1>> /C [0 0 0] /CA 1 /AP << /N 2 0 R>>>>\n" +
          "endobj\n",
      );

      const appearance = data.dependencies[0].data;
      assertEquals(
        appearance,
        "2 0 obj\n" +
          "<< /FormType 1 /Subtype /Form /Type /XObject /BBox [12 34 56 78] /Length 129>> stream\n" +
          "1 w 1 J 1 j\n" +
          "0 G\n" +
          "10 11 m\n" +
          "12 13 14 15 16 17 c\n" +
          "22 23 24 25 26 27 c\n" +
          "S\n" +
          "910 911 m\n" +
          "912 913 914 915 916 917 c\n" +
          "922 923 924 925 926 927 c\n" +
          "S\n" +
          "endstream\n" +
          "endobj\n",
      );
    });

    it("should create a new Ink annotation with some transparency", async () => {
      partialEvaluator.xref = new XRefMock() as any;
      const task = new WorkerTask("test Ink creation");
      const data = await AnnotationFactory.saveNewAnnotations(
        partialEvaluator,
        task,
        [
          {
            annotationType: AnnotationEditorType.INK,
            rect: [12, 34, 56, 78],
            rotation: 0,
            thickness: 1,
            opacity: 0.12,
            color: [0, 0, 0] as any,
            paths: [
              {
                // deno-fmt-ignore
                bezier: [
                  10, 11, 12, 13, 14, 15, 16, 17, 22, 23, 24, 25, 26, 27,
                ],
                points: [1, 2, 3, 4, 5, 6, 7, 8],
              },
              {
                // deno-fmt-ignore
                bezier: [
                  910, 911, 912, 913, 914, 915, 916, 917, 922, 923, 924, 925,
                  926, 927,
                ],
                points: [91, 92, 93, 94, 95, 96, 97, 98],
              },
            ],
          },
        ],
        undefined,
      );

      const base = data.annotations[0].data!.replace(/\(D:\d+\)/, "(date)");
      assertEquals(
        base,
        "1 0 obj\n" +
          "<< /Type /Annot /Subtype /Ink /CreationDate (date) /Rect [12 34 56 78] " +
          "/InkList [[1 2 3 4 5 6 7 8] [91 92 93 94 95 96 97 98]] /F 4 " +
          "/Rotate 0 /BS << /W 1>> /C [0 0 0] /CA 0.12 /AP << /N 2 0 R>>>>\n" +
          "endobj\n",
      );

      const appearance = data.dependencies[0].data;
      assertEquals(
        appearance,
        "2 0 obj\n" +
          "<< /FormType 1 /Subtype /Form /Type /XObject /BBox [12 34 56 78] /Length 136 /Resources " +
          "<< /ExtGState << /R0 << /CA 0.12 /Type /ExtGState>>>>>>>> stream\n" +
          "1 w 1 J 1 j\n" +
          "0 G\n" +
          "/R0 gs\n" +
          "10 11 m\n" +
          "12 13 14 15 16 17 c\n" +
          "22 23 24 25 26 27 c\n" +
          "S\n" +
          "910 911 m\n" +
          "912 913 914 915 916 917 c\n" +
          "922 923 924 925 926 927 c\n" +
          "S\n" +
          "endstream\n" +
          "endobj\n",
      );
    });

    it("should render an added Ink annotation for printing", async () => {
      partialEvaluator.xref = new XRefMock() as any;
      const task = new WorkerTask("test Ink printing");
      const inkAnnotation = (
        await AnnotationFactory.printNewAnnotations(
          annotationGlobalsMock,
          partialEvaluator,
          task,
          [
            {
              annotationType: AnnotationEditorType.INK,
              rect: [12, 34, 56, 78],
              rotation: 0,
              thickness: 3,
              opacity: 1,
              color: [0, 255, 0] as any,
              paths: [
                {
                  bezier: [1, 2, 3, 4, 5, 6, 7, 8],
                  // Useless in the printing case.
                  points: [1, 2, 3, 4, 5, 6, 7, 8],
                },
              ],
            },
          ],
          undefined,
        )
      )![0];

      const { opList } = await inkAnnotation.getOperatorList(
        partialEvaluator,
        task,
        RenderingIntentFlag.PRINT,
        false,
      );

      assertEquals(opList.argsArray.length, 8);
      assertEquals(opList.fnArray, [
        OPS.beginAnnotation,
        OPS.setLineWidth,
        OPS.setLineCap,
        OPS.setLineJoin,
        OPS.setStrokeRGBColor,
        OPS.constructPath,
        OPS.stroke,
        OPS.endAnnotation,
      ]);

      // Linewidth.
      assertEquals(opList.argsArray[1], [3]);
      // LineCap.
      assertEquals(opList.argsArray[2], [1]);
      // LineJoin.
      assertEquals(opList.argsArray[3], [1]);
      // Color.
      assertEquals(opList.argsArray[4], new Uint8ClampedArray([0, 255, 0]));
      // Path.
      assertEquals(opList.argsArray[5]![0], [OPS.moveTo, OPS.curveTo]);
      assertEquals(opList.argsArray[5]![1], [1, 2, 3, 4, 5, 6, 7, 8]);
      // Min-max.
      assertEquals(opList.argsArray[5]![2], [1, 2, 1, 2]);
    });
  });

  describe("HighlightAnnotation", () => {
    it("should set quadpoints to null if not defined", async () => {
      const highlightDict = new Dict();
      highlightDict.set("Type", Name.get("Annot"));
      highlightDict.set("Subtype", Name.get("Highlight"));

      const highlightRef = Ref.get(121, 0);
      const xref = new XRefMock([{
        ref: highlightRef,
        data: highlightDict,
      }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        highlightRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.HIGHLIGHT);
      assertEquals(data.quadPoints, null);
    });

    it("should set quadpoints if defined", async () => {
      const highlightDict = new Dict();
      highlightDict.set("Type", Name.get("Annot"));
      highlightDict.set("Subtype", Name.get("Highlight"));
      highlightDict.set("Rect", [10, 10, 20, 20]);
      highlightDict.set("QuadPoints", [10, 20, 20, 20, 10, 10, 20, 10]);

      const highlightRef = Ref.get(121, 0);
      const xref = new XRefMock([{
        ref: highlightRef,
        data: highlightDict,
      }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        highlightRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.HIGHLIGHT);
      assertEquals(
        data.quadPoints,
        Float32Array.from([10, 20, 20, 20, 10, 10, 20, 10]),
      );
    });

    it("should set quadpoints to null when empty", async () => {
      const highlightDict = new Dict();
      highlightDict.set("Type", Name.get("Annot"));
      highlightDict.set("Subtype", Name.get("Highlight"));
      highlightDict.set("Rect", [10, 10, 20, 20]);
      highlightDict.set("QuadPoints", []);

      const highlightRef = Ref.get(121, 0);
      const xref = new XRefMock([{
        ref: highlightRef,
        data: highlightDict,
      }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        highlightRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.HIGHLIGHT);
      assertEquals(data.quadPoints, null);
    });

    it("should create a new Highlight annotation", async () => {
      partialEvaluator.xref = new XRefMock() as any;
      const task = new WorkerTask("test Highlight creation");
      const data = await AnnotationFactory.saveNewAnnotations(
        partialEvaluator,
        task,
        [
          {
            annotationType: AnnotationEditorType.HIGHLIGHT,
            rect: [12, 34, 56, 78],
            rotation: 0,
            opacity: 1,
            color: [0, 0, 0],
            // quadPoints: [1, 2, 3, 4, 5, 6, 7],
            quadPoints: Float32Array.from([1, 2, 3, 4, 5, 6, 7]),
            outlines: [
              [8, 9, 10, 11],
              [12, 13, 14, 15],
            ] as Outlines,
          },
        ],
      );

      const base = data.annotations[0].data!.replace(/\(D:\d+\)/, "(date)");
      assertEquals(
        base,
        "1 0 obj\n" +
          "<< /Type /Annot /Subtype /Highlight /CreationDate (date) /Rect [12 34 56 78] " +
          "/F 4 /Border [0 0 0] /Rotate 0 /QuadPoints [1 2 3 4 5 6 7] /C [0 0 0] " +
          "/CA 1 /AP << /N 2 0 R>>>>\n" +
          "endobj\n",
      );

      const appearance = data.dependencies[0].data;
      assertEquals(
        appearance,
        "2 0 obj\n" +
          "<< /FormType 1 /Subtype /Form /Type /XObject /BBox [12 34 56 78] " +
          "/Length 47 /Resources << /ExtGState << /R0 << /BM /Multiply>>>>>>>> stream\n" +
          "0 g\n" +
          "/R0 gs\n" +
          "8 9 m\n" +
          "10 11 l\n" +
          "h\n" +
          "12 13 m\n" +
          "14 15 l\n" +
          "h\n" +
          "f*\n" +
          "endstream\n" +
          "endobj\n",
      );
    });

    it("should render a new Highlight annotation for printing", async () => {
      partialEvaluator.xref = new XRefMock() as any;
      const task = new WorkerTask("test Highlight printing");
      const highlightAnnotation = (
        await AnnotationFactory.printNewAnnotations(
          annotationGlobalsMock,
          partialEvaluator,
          task,
          [
            {
              annotationType: AnnotationEditorType.HIGHLIGHT,
              rect: [12, 34, 56, 78],
              rotation: 0,
              opacity: 0.5,
              color: [0, 255, 0],
              // quadPoints: [1, 2, 3, 4, 5, 6, 7],
              quadPoints: Float32Array.from([1, 2, 3, 4, 5, 6, 7]),
              outlines: [[8, 9, 10, 11]] as Outlines,
            },
          ],
        )
      )![0];

      const { opList } = await highlightAnnotation.getOperatorList(
        partialEvaluator,
        task,
        RenderingIntentFlag.PRINT,
        false,
      );

      assertEquals(opList.argsArray.length, 6);
      assertEquals(opList.fnArray, [
        OPS.beginAnnotation,
        OPS.setFillRGBColor,
        OPS.setGState,
        OPS.constructPath,
        OPS.eoFill,
        OPS.endAnnotation,
      ]);
    });

    it("should create a new free Highlight annotation", async () => {
      partialEvaluator.xref = new XRefMock() as any;
      const task = new WorkerTask("test free Highlight creation");
      const data = await AnnotationFactory.saveNewAnnotations(
        partialEvaluator,
        task,
        [
          {
            annotationType: AnnotationEditorType.HIGHLIGHT,
            rect: [12, 34, 56, 78],
            rotation: 0,
            opacity: 1,
            color: [0, 0, 0],
            thickness: 3.14,
            outlines: {
              // deno-fmt-ignore
              outline: Float32Array.from([
                NaN, NaN, 8, 9, 10, 11, NaN, NaN, 12, 13, 14, 15,
              ]),
              points: [Float32Array.from([16, 17, 18, 19])],
            } as Outlines,
          },
        ],
      );

      const base = data.annotations[0].data!.replace(/\(D:\d+\)/, "(date)");
      assertEquals(
        base,
        "1 0 obj\n" +
          "<< /Type /Annot /Subtype /Ink /CreationDate (date) /Rect [12 34 56 78] " +
          "/InkList [[16 17 18 19]] /F 4 /Rotate 0 /IT /InkHighlight /BS << /W 3.14>> " +
          "/C [0 0 0] /CA 1 /AP << /N 2 0 R>>>>\n" +
          "endobj\n",
      );

      const appearance = data.dependencies[0].data;
      assertEquals(
        appearance,
        "2 0 obj\n" +
          "<< /FormType 1 /Subtype /Form /Type /XObject /BBox [12 34 56 78] " +
          "/Length 30 /Resources << /ExtGState << /R0 << /BM /Multiply>>>>>>>> " +
          "stream\n" +
          "0 g\n" +
          "/R0 gs\n" +
          "10 11 m\n" +
          "14 15 l\n" +
          "h f\n" +
          "endstream\n" +
          "endobj\n",
      );
    });

    it("should render a new free Highlight annotation for printing", async () => {
      partialEvaluator.xref = new XRefMock() as any;
      const task = new WorkerTask("test free Highlight printing");
      const highlightAnnotation = (
        await AnnotationFactory.printNewAnnotations(
          annotationGlobalsMock,
          partialEvaluator,
          task,
          [
            {
              annotationType: AnnotationEditorType.HIGHLIGHT,
              rect: [12, 34, 56, 78],
              rotation: 0,
              opacity: 0.5,
              color: [0, 255, 0],
              thickness: 3.14,
              outlines: {
                // deno-fmt-ignore
                outline: Float32Array.from([
                  NaN, NaN, 8, 9, 10, 11, NaN, NaN, 12, 13, 14, 15,
                ]),
                points: [Float32Array.from([16, 17, 18, 19])],
              } as Outlines,
            },
          ],
        )
      )![0];

      const { opList } = await highlightAnnotation.getOperatorList(
        partialEvaluator,
        task,
        RenderingIntentFlag.PRINT,
        false,
      );

      assertEquals(opList.argsArray.length, 6);
      assertEquals(opList.fnArray, [
        OPS.beginAnnotation,
        OPS.setFillRGBColor,
        OPS.setGState,
        OPS.constructPath,
        OPS.fill,
        OPS.endAnnotation,
      ]);
    });
  });

  describe("UnderlineAnnotation", () => {
    it("should set quadpoints to null if not defined", async () => {
      const underlineDict = new Dict();
      underlineDict.set("Type", Name.get("Annot"));
      underlineDict.set("Subtype", Name.get("Underline"));

      const underlineRef = Ref.get(121, 0);
      const xref = new XRefMock([{
        ref: underlineRef,
        data: underlineDict,
      }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        underlineRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.UNDERLINE);
      assertEquals(data.quadPoints, null);
    });

    it("should set quadpoints if defined", async () => {
      const underlineDict = new Dict();
      underlineDict.set("Type", Name.get("Annot"));
      underlineDict.set("Subtype", Name.get("Underline"));
      underlineDict.set("Rect", [10, 10, 20, 20]);
      underlineDict.set("QuadPoints", [10, 20, 20, 20, 10, 10, 20, 10]);

      const underlineRef = Ref.get(121, 0);
      const xref = new XRefMock([{
        ref: underlineRef,
        data: underlineDict,
      }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        underlineRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.UNDERLINE);
      assertEquals(
        data.quadPoints,
        Float32Array.from([10, 20, 20, 20, 10, 10, 20, 10]),
      );
    });
  });

  describe("SquigglyAnnotation", () => {
    it("should set quadpoints to null if not defined", async () => {
      const squigglyDict = new Dict();
      squigglyDict.set("Type", Name.get("Annot"));
      squigglyDict.set("Subtype", Name.get("Squiggly"));

      const squigglyRef = Ref.get(121, 0);
      const xref = new XRefMock([{
        ref: squigglyRef,
        data: squigglyDict,
      }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        squigglyRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.SQUIGGLY);
      assertEquals(data.quadPoints, null);
    });

    it("should set quadpoints if defined", async () => {
      const squigglyDict = new Dict();
      squigglyDict.set("Type", Name.get("Annot"));
      squigglyDict.set("Subtype", Name.get("Squiggly"));
      squigglyDict.set("Rect", [10, 10, 20, 20]);
      squigglyDict.set("QuadPoints", [10, 20, 20, 20, 10, 10, 20, 10]);

      const squigglyRef = Ref.get(121, 0);
      const xref = new XRefMock([{
        ref: squigglyRef,
        data: squigglyDict,
      }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        squigglyRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.SQUIGGLY);
      assertEquals(
        data.quadPoints,
        Float32Array.from([10, 20, 20, 20, 10, 10, 20, 10]),
      );
    });
  });

  describe("StrikeOutAnnotation", () => {
    it("should set quadpoints to null if not defined", async () => {
      const strikeOutDict = new Dict();
      strikeOutDict.set("Type", Name.get("Annot"));
      strikeOutDict.set("Subtype", Name.get("StrikeOut"));

      const strikeOutRef = Ref.get(121, 0);
      const xref = new XRefMock([{
        ref: strikeOutRef,
        data: strikeOutDict,
      }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        strikeOutRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.STRIKEOUT);
      assertEquals(data.quadPoints, null);
    });

    it("should set quadpoints if defined", async () => {
      const strikeOutDict = new Dict();
      strikeOutDict.set("Type", Name.get("Annot"));
      strikeOutDict.set("Subtype", Name.get("StrikeOut"));
      strikeOutDict.set("Rect", [10, 10, 20, 20]);
      strikeOutDict.set("QuadPoints", [10, 20, 20, 20, 10, 10, 20, 10]);

      const strikeOutRef = Ref.get(121, 0);
      const xref = new XRefMock([{
        ref: strikeOutRef,
        data: strikeOutDict,
      }]) as any;

      const { data } = (await AnnotationFactory.create(
        xref,
        strikeOutRef,
        annotationGlobalsMock,
        idFactoryMock,
      ))!;
      assertEquals(data.annotationType, AnnotationType.STRIKEOUT);
      assertEquals(
        data.quadPoints,
        Float32Array.from([10, 20, 20, 20, 10, 10, 20, 10]),
      );
    });
  });
});
/*80--------------------------------------------------------------------------*/
