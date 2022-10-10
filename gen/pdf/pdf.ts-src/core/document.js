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
import { _PDFDEV } from "../../../global.js";
import { assert } from "../../../lib/util/trace.js";
import { FormatError, info, InvalidPDFException, PageActionEventType, RenderingIntentFlag, shadow, stringToBytes, stringToPDFString, stringToUTF8String, UNSUPPORTED_FEATURES, Util, warn, } from "../shared/util.js";
import { AnnotationFactory, } from "./annotation.js";
import { BaseStream } from "./base_stream.js";
import { Catalog } from "./catalog.js";
import { clearGlobalCaches } from "./cleanup_helper.js";
import { collectActions, getInheritableProperty, getNewAnnotationsMap, isWhiteSpace, MissingDataException, validateCSSFont, XRefEntryException, XRefParseException, } from "./core_utils.js";
import { calculateMD5 } from "./crypto.js";
import { DatasetReader } from "./dataset_reader.js";
import { StreamsSequenceStream } from "./decode_stream.js";
import { PartialEvaluator } from "./evaluator.js";
import { ObjectLoader } from "./object_loader.js";
import { OperatorList } from "./operator_list.js";
import { Linearization } from "./parser.js";
import { Dict, isName, Name, Ref, } from "./primitives.js";
import { NullStream } from "./stream.js";
import { StructTreePage } from "./struct_tree.js";
import { writeObject } from "./writer.js";
import { XFAFactory } from "./xfa/factory.js";
import { getXfaFontDict, getXfaFontName, } from "./xfa_fonts.js";
import { XRef } from "./xref.js";
/*80--------------------------------------------------------------------------*/
const DEFAULT_USER_UNIT = 1.0;
const LETTER_SIZE_MEDIABOX = [0, 0, 612, 792];
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
    nonBlendModesSet;
    evaluatorOptions;
    xfaFactory;
    #localIdFactory;
    get _localIdFactory() {
        return this.#localIdFactory;
    }
    resourcesPromise;
    constructor({ pdfManager, xref, pageIndex, pageDict, ref, globalIdFactory, fontCache, builtInCMapCache, standardFontDataCache, globalImageCache, nonBlendModesSet, xfaFactory, }) {
        this.pdfManager = pdfManager;
        this.pageIndex = pageIndex;
        this.pageDict = pageDict;
        this.xref = xref;
        this.ref = ref;
        this.fontCache = fontCache;
        this.builtInCMapCache = builtInCMapCache;
        this.standardFontDataCache = standardFontDataCache;
        this.globalImageCache = globalImageCache;
        this.nonBlendModesSet = nonBlendModesSet;
        this.evaluatorOptions = pdfManager.evaluatorOptions;
        this.xfaFactory = xfaFactory;
        const idCounters = {
            obj: 0,
        };
        this.#localIdFactory = Object.assign(globalIdFactory, {
            createObjId: () => `p${pageIndex}_${++idCounters.obj}`,
            getPageObjId: () => `page${ref.toString()}`,
        });
    }
    #getInheritableProperty(key, getArray = false) {
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
        return Dict.merge({ xref: this.xref, dictArray: value });
    }
    get content() {
        return this.pageDict.getArray("Contents");
    }
    /**
     * Table 33
     */
    get resources() {
        // For robustness: The spec states that a \Resources entry has to be
        // present, but can be empty. Some documents still omit it; in this case
        // we return an empty dictionary.
        const resources = this.#getInheritableProperty("Resources");
        return shadow(this, "resources", resources instanceof Dict ? resources : Dict.empty);
    }
    _getBoundingBox(name) {
        if (this.xfaData) {
            return this.xfaData.bbox;
        }
        const box = this.#getInheritableProperty(name, 
        /* getArray = */ true);
        if (Array.isArray(box) && box.length === 4) {
            if (box[2] - box[0] !== 0 &&
                box[3] - box[1] !== 0) {
                return box;
            }
            warn(`Empty /${name} entry.`);
        }
        return null;
    }
    get mediaBox() {
        // Reset invalid media box to letter size.
        return shadow(this, "mediaBox", this._getBoundingBox("MediaBox") || LETTER_SIZE_MEDIABOX);
    }
    get cropBox() {
        // Reset invalid crop box to media box.
        return shadow(this, "cropBox", this._getBoundingBox("CropBox") || this.mediaBox);
    }
    get userUnit() {
        let obj = this.pageDict.get("UserUnit");
        if (!(typeof obj === "number") || obj <= 0) {
            obj = DEFAULT_USER_UNIT;
        }
        return shadow(this, "userUnit", obj);
    }
    get view() {
        // From the spec, 6th ed., p.963:
        // "The crop, bleed, trim, and art boxes should not ordinarily
        // extend beyond the boundaries of the media box. If they do, they are
        // effectively reduced to their intersection with the media box."
        const { cropBox, mediaBox } = this;
        let view;
        if (cropBox.eq(mediaBox)) {
            view = mediaBox;
        }
        else {
            const box = Util.intersect(cropBox, mediaBox);
            if (box && box[2] - box[0] !== 0 && box[3] - box[1] !== 0) {
                view = box;
            }
            else {
                warn("Empty /CropBox and /MediaBox intersection.");
            }
        }
        return shadow(this, "view", view || mediaBox);
    }
    get rotate() {
        let rotate = this.#getInheritableProperty("Rotate") || 0;
        // Normalize rotation so it's a multiple of 90 and between 0 and 270.
        if (rotate % 90 !== 0) {
            rotate = 0;
        }
        else if (rotate >= 360) {
            rotate %= 360;
        }
        else if (rotate < 0) {
            // The spec doesn't cover negatives. Assume it's counterclockwise
            // rotation. The following is the other implementation of modulo.
            rotate = ((rotate % 360) + 360) % 360;
        }
        return shadow(this, "rotate", rotate);
    }
    #onSubStreamError(handler, reason, objId) {
        if (this.evaluatorOptions.ignoreErrors) {
            // Error(s) when reading one of the /Contents sub-streams -- sending
            // unsupported feature notification and allow parsing to continue.
            handler.send("UnsupportedFeature", {
                featureId: UNSUPPORTED_FEATURES.errorContentSubStream,
            });
            warn(`getContentStream - ignoring sub-stream (${objId}): "${reason}".`);
            return;
        }
        throw reason;
    }
    getContentStream(handler) {
        return this.pdfManager.ensure(this, "content").then((content) => {
            if (content instanceof BaseStream) {
                return content;
            }
            if (Array.isArray(content)) {
                return new StreamsSequenceStream(content, this.#onSubStreamError.bind(this, handler));
            }
            // Replace non-existent page content with empty content.
            return new NullStream();
        });
    }
    get xfaData() {
        return shadow(this, "xfaData", this.xfaFactory
            ? { bbox: this.xfaFactory.getBoundingBox(this.pageIndex) }
            : null);
    }
    async saveNewAnnotations(handler, task, annotations) {
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
            options: this.evaluatorOptions,
        });
        const pageDict = this.pageDict;
        const annotationsArray = this.annotations.slice();
        const newData = await AnnotationFactory.saveNewAnnotations(partialEvaluator, task, annotations);
        for (const { ref } of newData.annotations) {
            annotationsArray.push(ref);
        }
        const savedDict = pageDict.get("Annots");
        pageDict.set("Annots", annotationsArray);
        const buffer = [];
        let transform;
        if (this.xref.encrypt) {
            transform = this.xref.encrypt.createCipherTransform(this.ref.num, this.ref.gen);
        }
        writeObject(this.ref, pageDict, buffer, transform);
        if (savedDict) {
            pageDict.set("Annots", savedDict);
        }
        const objects = newData.dependencies;
        objects.push({ ref: this.ref, data: buffer.join("") }, ...newData.annotations);
        return objects;
    }
    save(handler, task, annotationStorage) {
        const partialEvaluator = new PartialEvaluator({
            xref: this.xref,
            handler,
            pageIndex: this.pageIndex,
            idFactory: this.#localIdFactory,
            fontCache: this.fontCache,
            builtInCMapCache: this.builtInCMapCache,
            standardFontDataCache: this.standardFontDataCache,
            globalImageCache: this.globalImageCache,
            options: this.evaluatorOptions,
        });
        // Fetch the page's annotations and save the content
        // in case of interactive form fields.
        return this._parsedAnnotations.then((annotations) => {
            const newRefsPromises = [];
            for (const annotation of annotations) {
                if (!annotation.mustBePrinted(annotationStorage)) {
                    continue;
                }
                newRefsPromises.push(annotation
                    .save(partialEvaluator, task, annotationStorage)
                    .catch((reason) => {
                    warn("save - ignoring annotation data during " +
                        `"${task.name}" task: "${reason}".`);
                    return undefined;
                }));
            }
            return Promise.all(newRefsPromises).then((newRefs) => newRefs.filter((newRef) => !!newRef));
        });
    }
    loadResources(keys) {
        if (!this.resourcesPromise) {
            // TODO: add async `#getInheritableProperty` and remove this.
            this.resourcesPromise = this.pdfManager.ensure(this, "resources");
        }
        return this.resourcesPromise.then(() => {
            const objectLoader = new ObjectLoader(this.resources, keys, this.xref);
            return objectLoader.load();
        });
    }
    getOperatorList({ handler, sink, task, intent, cacheKey, annotationStorage = undefined, }) {
        const contentStreamPromise = this.getContentStream(handler);
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
            options: this.evaluatorOptions,
        });
        const newAnnotationsByPage = !this.xfaFactory
            ? getNewAnnotationsMap(annotationStorage)
            : undefined;
        let newAnnotationsPromise = Promise
            .resolve(undefined);
        if (newAnnotationsByPage) {
            const newAnnotations = newAnnotationsByPage.get(this.pageIndex);
            if (newAnnotations) {
                newAnnotationsPromise = AnnotationFactory.printNewAnnotations(partialEvaluator, task, newAnnotations);
            }
        }
        const dataPromises = Promise.all([contentStreamPromise, resourcesPromise]);
        const pageListPromise = dataPromises.then(([contentStream]) => {
            const opList = new OperatorList(intent, sink);
            handler.send("StartRenderPage", {
                transparency: partialEvaluator.hasBlendModes(this.resources, this.nonBlendModesSet),
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
                annotations = annotations.concat(newAnnotations);
            }
            if (annotations.length === 0 ||
                intent & RenderingIntentFlag.ANNOTATIONS_DISABLE) {
                pageOpList.flush(/* lastChunk = */ true);
                return { length: pageOpList.totalLength };
            }
            const renderForms = !!(intent & RenderingIntentFlag.ANNOTATIONS_FORMS), intentAny = !!(intent & RenderingIntentFlag.ANY), intentDisplay = !!(intent & RenderingIntentFlag.DISPLAY), intentPrint = !!(intent & RenderingIntentFlag.PRINT);
            // Collect the operator list promises for the annotations. Each promise
            // is resolved with the complete operator list for a single annotation.
            const opListPromises = [];
            for (const annotation of annotations) {
                if (intentAny ||
                    (intentDisplay && annotation.mustBeViewed(annotationStorage)) ||
                    (intentPrint && annotation.mustBePrinted(annotationStorage))) {
                    opListPromises.push(annotation
                        .getOperatorList(partialEvaluator, task, intent, renderForms, annotationStorage)
                        .catch((reason) => {
                        warn(`getOperatorList - ignoring annotation data during "${task.name}" task: "${reason}".`);
                        return undefined;
                    }));
                }
            }
            return Promise.all(opListPromises).then((opLists) => {
                let form = false, canvas = false;
                for (const { opList, separateForm, separateCanvas } of opLists) {
                    pageOpList.addOpList(opList);
                    if (separateForm) {
                        form = separateForm;
                    }
                    if (separateCanvas) {
                        canvas = separateCanvas;
                    }
                }
                pageOpList.flush(
                /* lastChunk = */ true, 
                /* separateAnnots = */ { form, canvas });
                return { length: pageOpList.totalLength };
            });
        });
    }
    extractTextContent({ handler, task, includeMarkedContent, sink, combineTextItems, }) {
        const contentStreamPromise = this.getContentStream(handler);
        const resourcesPromise = this.loadResources([
            "ExtGState",
            "Font",
            "Properties",
            "XObject",
        ]);
        const dataPromises = Promise.all([contentStreamPromise, resourcesPromise]);
        return dataPromises.then(([contentStream]) => {
            const partialEvaluator = new PartialEvaluator({
                xref: this.xref,
                handler,
                pageIndex: this.pageIndex,
                idFactory: this.#localIdFactory,
                fontCache: this.fontCache,
                builtInCMapCache: this.builtInCMapCache,
                standardFontDataCache: this.standardFontDataCache,
                globalImageCache: this.globalImageCache,
                options: this.evaluatorOptions,
            });
            return partialEvaluator.getTextContent({
                stream: contentStream,
                task,
                resources: this.resources,
                includeMarkedContent,
                combineTextItems,
                sink,
                viewBox: this.view,
            });
        });
    }
    async getStructTree() {
        const structTreeRoot = await this.pdfManager.ensureCatalog("structTreeRoot");
        if (!structTreeRoot) {
            return undefined;
        }
        const structTree = await this.pdfManager.ensure(this, "_parseStructTree", [
            structTreeRoot,
        ]);
        return structTree.serializable;
    }
    /**
     * @private
     */
    _parseStructTree(structTreeRoot) {
        const tree = new StructTreePage(structTreeRoot, this.pageDict);
        tree.parse();
        return tree;
    }
    getAnnotationsData(intent) {
        return this._parsedAnnotations.then((annotations) => {
            const annotationsData = [];
            if (annotations.length === 0) {
                return annotationsData;
            }
            const intentAny = !!(intent & RenderingIntentFlag.ANY), intentDisplay = !!(intent & RenderingIntentFlag.DISPLAY), intentPrint = !!(intent & RenderingIntentFlag.PRINT);
            for (const annotation of annotations) {
                // Get the annotation even if it's hidden because
                // JS can change its display.
                if (intentAny ||
                    (intentDisplay && annotation.viewable) ||
                    (intentPrint && annotation.printable)) {
                    annotationsData.push(annotation.data);
                }
            }
            return annotationsData;
        });
    }
    get annotations() {
        const annots = this.#getInheritableProperty("Annots");
        return shadow(this, "annotations", Array.isArray(annots) ? annots : []);
    }
    get _parsedAnnotations() {
        const parsedAnnotations = this.pdfManager
            .ensure(this, "annotations")
            .then(() => {
            const annotationPromises = [];
            for (const annotationRef of this.annotations) {
                annotationPromises.push(AnnotationFactory.create(this.xref, annotationRef, this.pdfManager, this.#localIdFactory, 
                /* collectFields */ false).catch((reason) => {
                    warn(`_parsedAnnotations: "${reason}".`);
                    return undefined;
                }));
            }
            return Promise.all(annotationPromises).then((annotations) => {
                return annotations.filter((annotation) => !!annotation);
            });
        });
        return shadow(this, "_parsedAnnotations", parsedAnnotations);
    }
    get jsActions() {
        const actions = collectActions(this.xref, this.pageDict, PageActionEventType);
        return shadow(this, "jsActions", actions);
    }
}
const PDF_HEADER_SIGNATURE = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]); // `%PDF-`
const STARTXREF_SIGNATURE = new Uint8Array([
    0x73,
    0x74,
    0x61,
    0x72,
    0x74,
    0x78,
    0x72,
    0x65,
    0x66,
]);
const ENDOBJ_SIGNATURE = new Uint8Array([0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a]);
const FINGERPRINT_FIRST_BYTES = 1024;
const EMPTY_FINGERPRINT = "\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00";
const PDF_HEADER_VERSION_REGEXP = /^[1-9]\.\d$/;
function find(stream, signature, limit = 1024, backwards = false) {
    /*#static*/  {
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
            while (j < signatureLength &&
                scanBytes[pos - j] === signature[signatureEnd - j]) {
                j++;
            }
            if (j >= signatureLength) {
                // `signature` found.
                stream.pos += pos - signatureEnd;
                return true;
            }
            pos--;
        }
    }
    else {
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
/**
 * The `PDFDocument` class holds all the (worker-thread) data of the PDF file.
 */
export class PDFDocument {
    pdfManager;
    stream;
    xref;
    catalog;
    #pagePromises = new Map();
    #version;
    #globalIdFactory;
    get _globalIdFactory() {
        return this.#globalIdFactory;
    }
    #localIdFactory;
    constructor(pdfManager, stream) {
        /*#static*/  {
            assert(stream instanceof BaseStream, 'PDFDocument: Invalid "stream" argument.');
        }
        if (stream.length <= 0) {
            throw new InvalidPDFException("The PDF file is empty, i.e. its size is zero bytes.");
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
                assert(0, "Abstract method `getPageObjId` called.");
                return "";
            },
        };
    }
    parse(recoveryMode) {
        this.xref.parse(recoveryMode);
        this.catalog = new Catalog(this.pdfManager, this.xref);
        // The `checkHeader` method is called before this method and parses the
        // version from the header. The specification states in section 7.5.2
        // that the version from the catalog, if present, should overwrite the
        // version from the header.
        if (this.catalog.version) {
            this.#version = this.catalog.version;
        }
    }
    get linearization() {
        let linearization = null;
        try {
            linearization = Linearization.create(this.stream);
        }
        catch (err) {
            if (err instanceof MissingDataException) {
                throw err;
            }
            info(err);
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
                startXRef = stream.pos + 6 - stream.start;
            }
        }
        else {
            // Find `startxref` by checking backwards from the end of the file.
            const step = 1024;
            const startXRefLength = STARTXREF_SIGNATURE.length;
            let found = false, pos = stream.end;
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
        // Read the PDF format version.
        const MAX_PDF_VERSION_LENGTH = 12;
        let version = "", ch;
        while ((ch = stream.getByte()) > /* Space = */ 0x20) {
            if (version.length >= MAX_PDF_VERSION_LENGTH) {
                break;
            }
            version += String.fromCharCode(ch);
        }
        if (!this.#version) {
            // Remove the "%PDF-" prefix.
            this.#version = version.substring(5);
        }
    }
    parseStartXRef() {
        this.xref.setStartXRef(this.startXRef);
    }
    get numPages() {
        let num = 0;
        if (this.catalog.hasActualNumPages) {
            num = this.catalog.numPages;
        }
        else if (this.xfaFactory) {
            // num is a Promise.
            num = this.xfaFactory.getNumPages();
        }
        else if (this.linearization) {
            num = this.linearization.numPages;
        }
        else {
            num = this.catalog.numPages;
        }
        return shadow(this, "numPages", num);
    }
    #hasOnlyDocumentSignatures(fields, recursionDepth = 0) {
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
                return this.#hasOnlyDocumentSignatures(field_.get("Kids"), recursionDepth);
            }
            const isSignature = isName(field_.get("FT"), "Sig");
            const rectangle = field_.get("Rect");
            const isInvisible = Array.isArray(rectangle) &&
                rectangle.every((value) => value === 0);
            return isSignature && isInvisible;
        });
    }
    get _xfaStreams() {
        const acroForm = this.catalog.acroForm;
        if (!acroForm) {
            return undefined;
        }
        const xfa = acroForm.get("XFA");
        const entries = {
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
            }
            else if (i === ii - 2) {
                name = "/xdp:xdp";
            }
            else {
                name = xfa[i];
            }
            if (!Object.hasOwn(entries, name)) {
                continue;
            }
            const data = this.xref.fetchIfRef(xfa[i + 1]);
            if (!(data instanceof BaseStream) || data.isEmpty) {
                continue;
            }
            entries[name] = data;
        }
        return entries;
    }
    get xfaDatasets() {
        const streams = this._xfaStreams;
        if (!streams) {
            return shadow(this, "xfaDatasets", undefined);
        }
        for (const key of ["datasets", "xdp:xdp"]) {
            const stream = streams[key];
            if (!stream) {
                continue;
            }
            try {
                const str = stringToUTF8String(stream.getString());
                const data = { [key]: str };
                return shadow(this, "xfaDatasets", new DatasetReader(data));
            }
            catch (_) {
                warn("XFA - Invalid utf-8 string.");
                break;
            }
        }
        return shadow(this, "xfaDatasets", undefined);
    }
    get xfaData() {
        const streams = this._xfaStreams;
        if (!streams) {
            return null;
        }
        const data = Object.create(null);
        for (const [key, stream] of Object.entries(streams)) {
            if (!stream) {
                continue;
            }
            try {
                data[key] = stringToUTF8String(stream.getString());
            }
            catch (_) {
                warn("XFA - Invalid utf-8 string.");
                return null;
            }
        }
        return data;
    }
    get xfaFactory() {
        let data;
        if (this.pdfManager.enableXfa &&
            this.catalog.needsRendering &&
            this.formInfo.hasXfa &&
            !this.formInfo.hasAcroForm) {
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
        const xfaImages = new Map();
        for (const key of keys) {
            const stream = xfaImagesDict.get(key);
            if (stream instanceof BaseStream) {
                xfaImages.set(key, stream.getBytes());
            }
        }
        this.xfaFactory.setImages(xfaImages);
    }
    async loadXfaFonts(handler, task) {
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
        const options = Object.assign(Object.create(null), this.pdfManager.evaluatorOptions);
        options.useSystemFonts = false;
        const partialEvaluator = new PartialEvaluator({
            xref: this.xref,
            handler,
            pageIndex: -1,
            idFactory: this.#globalIdFactory,
            fontCache: this.catalog.fontCache,
            builtInCMapCache: this.catalog.builtInCMapCache,
            standardFontDataCache: this.catalog.standardFontDataCache,
            options,
        });
        const operatorList = new OperatorList();
        const pdfFonts = [];
        const initialState = {
            get font() {
                return pdfFonts.at(-1);
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
            let fontFamily = descriptor.get("FontFamily");
            // For example, "Wingdings 3" is not a valid font name in the css specs.
            fontFamily = fontFamily.replace(/[ ]+(\d)/g, "$1");
            const fontWeight = descriptor.get("FontWeight");
            // Angle is expressed in degrees counterclockwise in PDF
            // when it's clockwise in CSS
            // (see https://drafts.csswg.org/css-fonts-4/#valdef-font-style-oblique-angle)
            const italicAngle = descriptor.get("ItalicAngle");
            const cssFontInfo = { fontFamily, fontWeight, italicAngle };
            if (!validateCSSFont(cssFontInfo)) {
                continue;
            }
            promises.push(partialEvaluator
                .handleSetFont(resources, [Name.get(fontName), 1], 
            /* fontRef = */ undefined, operatorList, task, initialState, 
            /* fallbackFontDict = */ undefined, 
            /* cssFontInfo = */ cssFontInfo)
                .catch((reason) => {
                warn(`loadXfaFonts: "${reason}".`);
                return null;
            }));
        }
        await Promise.all(promises);
        const missingFonts = this.xfaFactory?.setFonts(pdfFonts);
        if (!missingFonts) {
            return;
        }
        options.ignoreErrors = true;
        promises.length = 0;
        pdfFonts.length = 0;
        const reallyMissingFonts = new Set();
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
            for (const fontInfo of [
                { name: "Regular", fontWeight: 400, italicAngle: 0 },
                { name: "Bold", fontWeight: 700, italicAngle: 0 },
                { name: "Italic", fontWeight: 400, italicAngle: 12 },
                { name: "BoldItalic", fontWeight: 700, italicAngle: 12 },
            ]) {
                const name = `${missing}-${fontInfo.name}`;
                const dict = getXfaFontDict(name);
                promises.push(partialEvaluator
                    .handleSetFont(resources, [Name.get(name), 1], 
                /* fontRef = */ undefined, operatorList, task, initialState, 
                /* fallbackFontDict = */ dict, 
                /* cssFontInfo = */ {
                    fontFamily: missing,
                    fontWeight: fontInfo.fontWeight,
                    italicAngle: fontInfo.italicAngle,
                })
                    .catch((reason) => {
                    warn(`loadXfaFonts: "${reason}".`);
                    return null;
                }));
            }
        }
        await Promise.all(promises);
        this.xfaFactory.appendFonts(pdfFonts, reallyMissingFonts);
    }
    async serializeXfaData(annotationStorage) {
        return this.xfaFactory
            ? this.xfaFactory.serializeData(annotationStorage)
            : undefined;
    }
    get formInfo() {
        const formInfo = {
            hasFields: false,
            hasAcroForm: false,
            hasXfa: false,
            hasSignatures: false,
        };
        const acroForm = this.catalog.acroForm;
        if (!acroForm) {
            return shadow(this, "formInfo", formInfo);
        }
        try {
            const fields = acroForm.get("Fields");
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
            const sigFlags = acroForm.get("SigFlags");
            const hasSignatures = !!(sigFlags & 0x1);
            const hasOnlyDocumentSignatures = hasSignatures &&
                this.#hasOnlyDocumentSignatures(fields);
            formInfo.hasAcroForm = hasFields && !hasOnlyDocumentSignatures;
            formInfo.hasSignatures = hasSignatures;
        }
        catch (ex) {
            if (ex instanceof MissingDataException) {
                throw ex;
            }
            warn(`Cannot fetch form information: "${ex}".`);
        }
        return shadow(this, "formInfo", formInfo);
    }
    get documentInfo() {
        // const DocumentInfoValidators = {
        //   Title: isString,
        //   Author: isString,
        //   Subject: isString,
        //   Keywords: isString,
        //   Creator: isString,
        //   Producer: isString,
        //   CreationDate: isString,
        //   ModDate: isString,
        //   Trapped: isName,
        // };
        let version = this.#version;
        if (typeof version !== "string" ||
            !PDF_HEADER_VERSION_REGEXP.test(version)) {
            warn(`Invalid PDF header version number: ${version}`);
            version = undefined;
        }
        const docInfo = {
            PDFFormatVersion: version,
            Language: this.catalog.lang,
            EncryptFilterName: this.xref.encrypt
                ? this.xref.encrypt.filterName
                : undefined,
            IsLinearized: !!this.linearization,
            IsAcroFormPresent: this.formInfo.hasAcroForm,
            IsXFAPresent: this.formInfo.hasXfa,
            IsCollectionPresent: !!this.catalog.collection,
            IsSignaturesPresent: this.formInfo.hasSignatures,
        };
        let infoDict;
        try {
            infoDict = this.xref.trailer.get("Info");
        }
        catch (err) {
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
                        warn(`Bad value, for custom key "${key}", in Info: ${value}.`);
                        continue;
                    }
                    if (!docInfo.Custom) {
                        docInfo.Custom = Object.create(null);
                    }
                    docInfo.Custom[key] = customValue;
                    continue;
            }
            warn(`Bad value, for key "${key}", in Info: ${value}.`);
        }
        return shadow(this, "documentInfo", docInfo);
    }
    get fingerprints() {
        function validate(data) {
            return (typeof data === "string" &&
                data.length > 0 &&
                data !== EMPTY_FINGERPRINT);
        }
        function hexString(hash) {
            const buf = [];
            for (let i = 0, ii = hash.length; i < ii; i++) {
                const hex = hash[i].toString(16);
                buf.push(hex.padStart(2, "0"));
            }
            return buf.join("");
        }
        const idArray = this.xref.trailer.get("ID");
        let hashOriginal, hashModified;
        if (Array.isArray(idArray) && validate(idArray[0])) {
            hashOriginal = stringToBytes(idArray[0]);
            if (idArray[1] !== idArray[0] && validate(idArray[1])) {
                hashModified = stringToBytes(idArray[1]);
            }
        }
        else {
            hashOriginal = calculateMD5(this.stream.getByteRange(0, FINGERPRINT_FIRST_BYTES), 0, FINGERPRINT_FIRST_BYTES);
        }
        return shadow(this, "fingerprints", [
            hexString(hashOriginal),
            hashModified ? hexString(hashModified) : undefined,
        ]);
    }
    async #getLinearizationPage(pageIndex) {
        const { catalog, linearization, xref } = this;
        /*#static*/  {
            assert(linearization && linearization.pageFirst === pageIndex, "#getLinearizationPage - invalid pageIndex argument.");
        }
        const ref = Ref.get(linearization.objectNumberFirst, 0);
        try {
            const obj = await xref.fetchAsync(ref);
            // Ensure that the object that was found is actually a Page dictionary.
            if (obj instanceof Dict) {
                let type = obj.getRaw("Type");
                if (type instanceof Ref) {
                    type = await xref.fetchAsync(type);
                }
                if (isName(type, "Page") || (!obj.has("Type") && !obj.has("Kids"))) {
                    if (!catalog.pageKidsCountCache.has(ref)) {
                        catalog.pageKidsCountCache.put(ref, 1); // Cache the Page reference.
                    }
                    // Help improve performance of the `Catalog.getPageIndex` method.
                    if (!catalog.pageIndexCache.has(ref)) {
                        catalog.pageIndexCache.put(ref, 0);
                    }
                    return [obj, ref];
                }
            }
            throw new FormatError("The Linearization dictionary doesn't point to a valid Page dictionary.");
        }
        catch (reason) {
            warn(`_getLinearizationPage: "${reason.message}".`);
            return catalog.getPageDict(pageIndex);
        }
    }
    getPage(pageIndex) {
        const cachedPromise = this.#pagePromises.get(pageIndex);
        if (cachedPromise) {
            return cachedPromise;
        }
        const { catalog, linearization, xfaFactory } = this;
        let promise;
        if (xfaFactory) {
            promise = Promise.resolve([Dict.empty, undefined]);
        }
        else if (linearization && linearization.pageFirst === pageIndex) {
            promise = this.#getLinearizationPage(pageIndex);
        }
        else {
            promise = catalog.getPageDict(pageIndex);
        }
        promise = promise.then(([pageDict, ref]) => {
            return new Page({
                pdfManager: this.pdfManager,
                xref: this.xref,
                pageIndex,
                pageDict,
                ref,
                globalIdFactory: this._globalIdFactory,
                fontCache: catalog.fontCache,
                builtInCMapCache: catalog.builtInCMapCache,
                standardFontDataCache: catalog.standardFontDataCache,
                globalImageCache: catalog.globalImageCache,
                nonBlendModesSet: catalog.nonBlendModesSet,
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
        }
        catch (reason) {
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
        catalog.setActualNumPages(); // Ensure that it's always reset.
        let numPages;
        try {
            await Promise.all([
                pdfManager.ensureDoc("xfaFactory"),
                pdfManager.ensureDoc("linearization"),
                pdfManager.ensureCatalog("numPages"),
            ]);
            if (this.xfaFactory) {
                // The Page count is always calculated for XFA-documents.
                return;
            }
            else if (this.linearization) {
                numPages = this.linearization.numPages;
            }
            else {
                numPages = catalog.numPages;
            }
            if (!Number.isInteger(numPages)) {
                throw new FormatError("Page count is not an integer.");
            }
            else if (numPages <= 1) {
                return;
            }
            await this.getPage(numPages - 1);
        }
        catch (reason) {
            // Clear out the various caches to ensure that we haven't stored any
            // inconsistent and/or incorrect state, since that could easily break
            // subsequent `this.getPage` calls.
            this.#pagePromises.delete(numPages - 1);
            await this.cleanup();
            if (reason instanceof XRefEntryException && !recoveryMode) {
                throw new XRefParseException();
            }
            warn(`checkLastPage - invalid /Pages tree /Count: ${numPages}.`);
            let pagesTree;
            try {
                pagesTree = await catalog.getAllPageDicts(recoveryMode);
            }
            catch (reasonAll) {
                if (reasonAll instanceof XRefEntryException && !recoveryMode) {
                    throw new XRefParseException();
                }
                catalog.setActualNumPages(1);
                return;
            }
            for (const [pageIndex, [pageDict, ref]] of pagesTree) {
                let promise;
                if (pageDict instanceof Error) {
                    promise = Promise.reject(pageDict);
                    // Prevent "uncaught exception: Object"-messages in the console.
                    promise.catch(() => { });
                }
                else {
                    promise = Promise.resolve(new Page({
                        pdfManager,
                        xref: this.xref,
                        pageIndex,
                        pageDict,
                        ref,
                        globalIdFactory: this._globalIdFactory,
                        fontCache: catalog.fontCache,
                        builtInCMapCache: catalog.builtInCMapCache,
                        standardFontDataCache: catalog.standardFontDataCache,
                        globalImageCache: catalog.globalImageCache,
                        nonBlendModesSet: catalog.nonBlendModesSet,
                        xfaFactory: undefined,
                    }));
                }
                this.#pagePromises.set(pageIndex, promise);
            }
            catalog.setActualNumPages(pagesTree.size);
        }
    }
    fontFallback(id, handler) {
        return this.catalog.fontFallback(id, handler);
    }
    async cleanup(manuallyTriggered = false) {
        return this.catalog
            ? this.catalog.cleanup(manuallyTriggered)
            : clearGlobalCaches();
    }
    #collectFieldObjects(name, fieldRef, promises) {
        const field = this.xref.fetchIfRef(fieldRef);
        if (field.has("T")) {
            const partName = stringToPDFString(field.get("T"));
            if (name === "") {
                name = partName;
            }
            else {
                name = `${name}.${partName}`;
            }
        }
        if (!promises.has(name)) {
            promises.set(name, []);
        }
        promises.get(name).push(AnnotationFactory.create(this.xref, fieldRef, this.pdfManager, this.#localIdFactory, //kkkk bug? (never set)
        /* collectFields */ true)
            .then((annotation) => annotation && annotation.getFieldObject())
            .catch((reason) => {
            warn(`#collectFieldObjects: "${reason}".`);
            return undefined;
        }));
        if (field.has("Kids")) {
            const kids = field.get("Kids");
            for (const kid of kids) {
                this.#collectFieldObjects(name, kid, promises);
            }
        }
    }
    get fieldObjects() {
        if (!this.formInfo.hasFields) {
            return shadow(this, "fieldObjects", Promise.resolve(undefined));
        }
        const allFields = Object.create(null);
        const fieldPromises = new Map();
        for (const fieldRef of this.catalog.acroForm.get("Fields")) {
            this.#collectFieldObjects("", fieldRef, fieldPromises);
        }
        const allPromises = [];
        for (const [name, promises] of fieldPromises) {
            allPromises.push(Promise.all(promises).then((fields) => {
                fields = fields.filter((field) => !!field);
                if (fields.length > 0) {
                    allFields[name] = fields;
                }
            }));
        }
        return shadow(this, "fieldObjects", Promise.all(allPromises).then(() => allFields));
    }
    get hasJSActions() {
        const promise = this.pdfManager.ensureDoc("_parseHasJSActions");
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
            return Object.values(fieldObjects).some((fieldObject) => fieldObject.some((object) => object.actions !== undefined));
        }
        return false;
    }
    get calculationOrderIds() {
        const acroForm = this.catalog.acroForm;
        if (!acroForm || !acroForm.has("CO")) {
            return shadow(this, "calculationOrderIds", undefined);
        }
        const calculationOrder = acroForm.get("CO");
        if (!Array.isArray(calculationOrder) || calculationOrder.length === 0) {
            return shadow(this, "calculationOrderIds", undefined);
        }
        const ids = [];
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
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=document.js.map