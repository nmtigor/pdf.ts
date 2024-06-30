/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/document_test.ts
 * @license Apache-2.0
 ******************************************************************************/

/* Copyright 2017 Mozilla Foundation
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

import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd.ts";
import { createIdFactory, XRefMock } from "@fe-pdf.ts-test/test_utils.ts";
import { FieldObject } from "./annotation.ts";
import { Catalog } from "./catalog.ts";
import { PDFDocument } from "./document.ts";
import { BasePdfManager } from "./pdf_manager.ts";
import { Dict, Name, Ref } from "./primitives.ts";
import { StringStream } from "./stream.ts";
/*80--------------------------------------------------------------------------*/

describe("document", () => {
  describe("Page", () => {
    it("should create correct objId/fontId using the idFactory", () => {
      const idFactory1 = createIdFactory(/* pageIndex = */ 0);
      const idFactory2 = createIdFactory(/* pageIndex = */ 1);

      assertEquals(idFactory1.createObjId(), "p0_1");
      assertEquals(idFactory1.createObjId(), "p0_2");
      assertEquals(idFactory1.createFontId(), "f1");
      assertEquals(idFactory1.createFontId(), "f2");
      assertEquals(idFactory1.getDocId(), "g_d0");

      assertEquals(idFactory2.createObjId(), "p1_1");
      assertEquals(idFactory2.createObjId(), "p1_2");
      assertEquals(idFactory2.createFontId(), "f1");
      assertEquals(idFactory2.createFontId(), "f2");
      assertEquals(idFactory2.getDocId(), "g_d0");

      assertEquals(idFactory1.createObjId(), "p0_3");
      assertEquals(idFactory1.createObjId(), "p0_4");
      assertEquals(idFactory1.createFontId(), "f3");
      assertEquals(idFactory1.createFontId(), "f4");
      assertEquals(idFactory1.getDocId(), "g_d0");
    });
  });

  describe("PDFDocument", () => {
    const stream = new StringStream("Dummy_PDF_data");

    function getDocument(acroForm: Dict | undefined, xref = new XRefMock()) {
      const catalog = { acroForm } as Catalog;
      const pdfManager = <BasePdfManager> {
        get docId() {
          return "d0";
        },
        ensureDoc(prop: string, args: unknown[]): Promise<unknown> {
          return pdfManager.ensure(pdfDocument as any, prop, args);
        },
        ensureCatalog(prop: string, args: unknown[]) {
          return pdfManager.ensure(catalog as any, prop, args);
        },
        async ensure(
          obj: Record<string, unknown>,
          prop: string,
          args: unknown[],
        ): Promise<unknown> {
          const value = obj[prop];
          if (typeof value === "function") {
            return value.apply(obj, args);
          }
          return value;
        },
        get evaluatorOptions() {
          return { isOffscreenCanvasSupported: false };
        },
      };
      const pdfDocument = new PDFDocument(pdfManager, stream);
      pdfDocument.xref = xref as any;
      pdfDocument.catalog = catalog;
      return pdfDocument;
    }

    it("should get form info when no form data is present", () => {
      const pdfDocument = getDocument(undefined);
      assertEquals(pdfDocument.formInfo, {
        hasAcroForm: false,
        hasSignatures: false,
        hasXfa: false,
        hasFields: false,
      });
    });

    it("should get form info when XFA is present", () => {
      const acroForm = new Dict();

      // The `XFA` entry can only be a non-empty array or stream.
      acroForm.set("XFA", []);
      let pdfDocument = getDocument(acroForm);
      assertEquals(pdfDocument.formInfo, {
        hasAcroForm: false,
        hasSignatures: false,
        hasXfa: false,
        hasFields: false,
      });

      acroForm.set("XFA", ["foo", "bar"]);
      pdfDocument = getDocument(acroForm);
      assertEquals(pdfDocument.formInfo, {
        hasAcroForm: false,
        hasSignatures: false,
        hasXfa: true,
        hasFields: false,
      });

      acroForm.set("XFA", new StringStream(""));
      pdfDocument = getDocument(acroForm);
      assertEquals(pdfDocument.formInfo, {
        hasAcroForm: false,
        hasSignatures: false,
        hasXfa: false,
        hasFields: false,
      });

      acroForm.set("XFA", new StringStream("non-empty"));
      pdfDocument = getDocument(acroForm);
      assertEquals(pdfDocument.formInfo, {
        hasAcroForm: false,
        hasSignatures: false,
        hasXfa: true,
        hasFields: false,
      });
    });

    it("should get form info when AcroForm is present", () => {
      const acroForm = new Dict();

      // The `Fields` entry can only be a non-empty array.
      acroForm.set("Fields", []);
      let pdfDocument = getDocument(acroForm);
      assertEquals(pdfDocument.formInfo, {
        hasAcroForm: false,
        hasSignatures: false,
        hasXfa: false,
        hasFields: false,
      });

      acroForm.set("Fields", ["foo", "bar"]);
      pdfDocument = getDocument(acroForm);
      assertEquals(pdfDocument.formInfo, {
        hasAcroForm: true,
        hasSignatures: false,
        hasXfa: false,
        hasFields: true,
      });

      // If the first bit of the `SigFlags` entry is set and the `Fields` array
      // only contains document signatures, then there is no AcroForm data.
      acroForm.set("Fields", ["foo", "bar"]);
      acroForm.set("SigFlags", 2);
      pdfDocument = getDocument(acroForm);
      assertEquals(pdfDocument.formInfo, {
        hasAcroForm: true,
        hasSignatures: false,
        hasXfa: false,
        hasFields: true,
      });

      const annotationDict = new Dict();
      annotationDict.set("FT", Name.get("Sig"));
      annotationDict.set("Rect", [0, 0, 0, 0]);
      const annotationRef = Ref.get(11, 0);

      const kidsDict = new Dict();
      kidsDict.set("Kids", [annotationRef]);
      const kidsRef = Ref.get(10, 0);

      const xref = new XRefMock([
        { ref: annotationRef, data: annotationDict },
        { ref: kidsRef, data: kidsDict },
      ]);

      acroForm.set("Fields", [kidsRef]);
      acroForm.set("SigFlags", 3);
      pdfDocument = getDocument(acroForm, xref);
      assertEquals(pdfDocument.formInfo, {
        hasAcroForm: false,
        hasSignatures: true,
        hasXfa: false,
        hasFields: true,
      });
    });

    it("should get calculation order array or null", () => {
      const acroForm = new Dict();

      let pdfDocument = getDocument(acroForm);
      assertEquals(pdfDocument.calculationOrderIds, undefined);

      acroForm.set("CO", [Ref.get(1, 0), Ref.get(2, 0), Ref.get(3, 0)]);
      pdfDocument = getDocument(acroForm);
      assertEquals(pdfDocument.calculationOrderIds, ["1R", "2R", "3R"]);

      acroForm.set("CO", []);
      pdfDocument = getDocument(acroForm);
      assertEquals(pdfDocument.calculationOrderIds, undefined);

      acroForm.set("CO", ["1", "2"]);
      pdfDocument = getDocument(acroForm);
      assertEquals(pdfDocument.calculationOrderIds, undefined);

      acroForm.set("CO", ["1", Ref.get(1, 0), "2"]);
      pdfDocument = getDocument(acroForm);
      assertEquals(pdfDocument.calculationOrderIds, ["1R"]);
    });

    it("should get field objects array or null", async () => {
      const acroForm = new Dict();

      let pdfDocument = getDocument(acroForm);
      let fields: Record<string, (FieldObject | string)[]> | undefined =
        await pdfDocument.fieldObjects;
      assertEquals(fields, undefined);

      acroForm.set("Fields", []);
      pdfDocument = getDocument(acroForm);
      fields = await pdfDocument.fieldObjects;
      assertEquals(fields, undefined);

      const kid1Ref = Ref.get(314, 0);
      const kid11Ref = Ref.get(159, 0);
      const kid2Ref = Ref.get(265, 0);
      const kid2BisRef = Ref.get(266, 0);
      const parentRef = Ref.get(358, 0);

      const allFields = Object.create(null);
      for (const name of ["parent", "kid1", "kid2", "kid11"]) {
        const buttonWidgetDict = new Dict();
        buttonWidgetDict.set("Type", Name.get("Annot"));
        buttonWidgetDict.set("Subtype", Name.get("Widget"));
        buttonWidgetDict.set("FT", Name.get("Btn"));
        buttonWidgetDict.set("T", name);
        allFields[name] = buttonWidgetDict;
      }

      allFields.kid1.set("Kids", [kid11Ref]);
      allFields.parent.set("Kids", [kid1Ref, kid2Ref, kid2BisRef]);

      const xref = new XRefMock([
        { ref: parentRef, data: allFields.parent },
        { ref: kid1Ref, data: allFields.kid1 },
        { ref: kid11Ref, data: allFields.kid11 },
        { ref: kid2Ref, data: allFields.kid2 },
        { ref: kid2BisRef, data: allFields.kid2 },
      ]);

      acroForm.set("Fields", [parentRef]);
      pdfDocument = getDocument(acroForm, xref);
      fields = (await pdfDocument.fieldObjects)!;

      for (const [name, objs] of Object.entries(fields)) {
        fields[name] = objs.map((obj) => (obj as FieldObject).id);
      }

      assertEquals(fields["parent.kid1"], ["314R"]);
      assertEquals(fields["parent.kid1.kid11"], ["159R"]);
      assertEquals(fields["parent.kid2"], ["265R", "266R"]);
      assertEquals(fields.parent, ["358R"]);
    });

    it("should check if fields have any actions", async () => {
      const acroForm = new Dict();

      let pdfDocument = getDocument(acroForm);
      let hasJSActions = await pdfDocument.hasJSActions;
      assertEquals(hasJSActions, false);

      acroForm.set("Fields", []);
      pdfDocument = getDocument(acroForm);
      hasJSActions = await pdfDocument.hasJSActions;
      assertEquals(hasJSActions, false);

      const kid1Ref = Ref.get(314, 0);
      const kid11Ref = Ref.get(159, 0);
      const kid2Ref = Ref.get(265, 0);
      const parentRef = Ref.get(358, 0);

      const allFields = Object.create(null);
      for (const name of ["parent", "kid1", "kid2", "kid11"]) {
        const buttonWidgetDict = new Dict();
        buttonWidgetDict.set("Type", Name.get("Annot"));
        buttonWidgetDict.set("Subtype", Name.get("Widget"));
        buttonWidgetDict.set("FT", Name.get("Btn"));
        buttonWidgetDict.set("T", name);
        allFields[name] = buttonWidgetDict;
      }

      allFields.kid1.set("Kids", [kid11Ref]);
      allFields.parent.set("Kids", [kid1Ref, kid2Ref]);

      const xref = new XRefMock([
        { ref: parentRef, data: allFields.parent },
        { ref: kid1Ref, data: allFields.kid1 },
        { ref: kid11Ref, data: allFields.kid11 },
        { ref: kid2Ref, data: allFields.kid2 },
      ]);

      acroForm.set("Fields", [parentRef]);
      pdfDocument = getDocument(acroForm, xref);
      hasJSActions = await pdfDocument.hasJSActions;
      assertEquals(hasJSActions, false);

      const JS = Name.get("JavaScript");
      const additionalActionsDict = new Dict();
      const eDict = new Dict();
      eDict.set("JS", "hello()");
      eDict.set("S", JS);
      additionalActionsDict.set("E", eDict);
      allFields.kid2.set("AA", additionalActionsDict);

      pdfDocument = getDocument(acroForm, xref);
      hasJSActions = await pdfDocument.hasJSActions;
      assertEquals(hasJSActions, true);
    });
  });
});
/*80--------------------------------------------------------------------------*/
