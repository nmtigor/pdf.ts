/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
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
import { clearPrimitiveCaches, Dict, isDict, isName, isRefsEqual, Name, Ref, RefSet, RefSetCache, } from "./primitives.js";
import { collectActions, MissingDataException, recoverJsURL, toRomanNumerals, } from "./core_utils.js";
import { createPromiseCapability, createValidAbsoluteUrl, DocumentActionEventType, FormatError, info, isBool, objectSize, PermissionFlag, shadow, stringToPDFString, stringToUTF8String, warn, } from "../shared/util.js";
import { NameTree, NumberTree } from "./name_number_tree.js";
import { ColorSpace } from "./colorspace.js";
import { FileSpec } from "./file_spec.js";
import { GlobalImageCache } from "./image_utils.js";
import { MetadataParser } from "./metadata_parser.js";
import { StructTreeRoot } from "./struct_tree.js";
import { BaseStream } from "./base_stream.js";
function fetchDestination(dest) {
    if (dest instanceof Dict) {
        dest = dest.get("D");
    }
    return Array.isArray(dest) ? dest : undefined;
}
/**
 * Table 28
 */
export class Catalog {
    pdfManager;
    xref;
    #catDict; // Table 28
    fontCache = new RefSetCache();
    builtInCMapCache = new Map();
    standardFontDataCache = new Map();
    globalImageCache = new GlobalImageCache();
    pageKidsCountCache = new RefSetCache();
    pageIndexCache = new RefSetCache();
    nonBlendModesSet = new RefSet();
    constructor(pdfManager, xref) {
        this.pdfManager = pdfManager;
        this.xref = xref;
        this.#catDict = xref.getCatalogObj();
        if (!(this.#catDict instanceof Dict)) {
            throw new FormatError("Catalog object is not a dictionary.");
        }
    }
    get version() {
        const version = this.#catDict.get("Version");
        return shadow(this, "version", version instanceof Name ? version.name : undefined);
    }
    get lang() {
        const lang = this.#catDict.get("Lang");
        return shadow(this, "lang", typeof lang === "string" ? stringToPDFString(lang) : undefined);
    }
    /**
     * @return `true` for pure XFA documents,
     *   `false` for XFA Foreground documents.
     */
    get needsRendering() {
        const needsRendering = this.#catDict.get("NeedsRendering");
        return shadow(this, "needsRendering", typeof needsRendering === "boolean" ? needsRendering : false);
    }
    get collection() {
        let collection = null;
        try {
            const obj = this.#catDict.get("Collection");
            if ((obj instanceof Dict) && obj.size > 0) {
                collection = obj;
            }
        }
        catch (ex) {
            if (ex instanceof MissingDataException) {
                throw ex;
            }
            info("Cannot fetch Collection entry; assuming no collection is present.");
        }
        return shadow(this, "collection", collection);
    }
    get acroForm() {
        let acroForm;
        try {
            const obj = this.#catDict.get("AcroForm");
            if ((obj instanceof Dict) && obj.size > 0) {
                acroForm = obj;
            }
        }
        catch (ex) {
            if (ex instanceof MissingDataException) {
                throw ex;
            }
            info("Cannot fetch AcroForm entry; assuming no forms are present.");
        }
        return shadow(this, "acroForm", acroForm);
    }
    get acroFormRef() {
        const value = this.#catDict.getRaw("AcroForm");
        return shadow(this, "acroFormRef", (value instanceof Ref) ? value : undefined);
    }
    get metadata() {
        const streamRef = this.#catDict.getRaw("Metadata");
        if (!(streamRef instanceof Ref))
            return shadow(this, "metadata", undefined);
        const suppressEncryption = !(this.xref.encrypt && this.xref.encrypt.encryptMetadata);
        const stream = this.xref.fetch(streamRef, suppressEncryption);
        let metadata;
        if ((stream instanceof BaseStream)
            && (stream.dict instanceof Dict)) {
            const type = stream.dict.get("Type");
            const subtype = stream.dict.get("Subtype");
            if (isName(type, "Metadata") && isName(subtype, "XML")) {
                // XXX: This should examine the charset the XML document defines,
                // however since there are currently no real means to decode arbitrary
                // charsets, let's just hope that the author of the PDF was reasonable
                // enough to stick with the XML default charset, which is UTF-8.
                try {
                    const data = stringToUTF8String(stream.getString());
                    if (data) {
                        metadata = new MetadataParser(data).serializable;
                    }
                }
                catch (e) {
                    if (e instanceof MissingDataException) {
                        throw e;
                    }
                    info("Skipping invalid metadata.");
                }
            }
        }
        return shadow(this, "metadata", metadata);
    }
    get markInfo() {
        let markInfo = null;
        try {
            markInfo = this.#readMarkInfo();
        }
        catch (ex) {
            if (ex instanceof MissingDataException) {
                throw ex;
            }
            warn("Unable to read mark info.");
        }
        return shadow(this, "markInfo", markInfo);
    }
    #readMarkInfo() {
        const obj = this.#catDict.get("MarkInfo");
        if (!(obj instanceof Dict))
            return null;
        const markInfo = Object.assign(Object.create(null), {
            Marked: false,
            UserProperties: false,
            Suspects: false,
        });
        for (const key in markInfo) {
            if (!obj.has(key)) {
                continue;
            }
            const value = obj.get(key);
            if (!(typeof value === "boolean"))
                continue;
            markInfo[key] = value;
        }
        return markInfo;
    }
    get structTreeRoot() {
        let structTree;
        try {
            structTree = this.#readStructTreeRoot();
        }
        catch (ex) {
            if (ex instanceof MissingDataException) {
                throw ex;
            }
            warn("Unable read to structTreeRoot info.");
        }
        return shadow(this, "structTreeRoot", structTree);
    }
    #readStructTreeRoot() {
        const obj = this.#catDict.get("StructTreeRoot");
        if (!(obj instanceof Dict))
            return undefined;
        const root = new StructTreeRoot(obj);
        root.init();
        return root;
    }
    get toplevelPagesDict() {
        const pagesObj = this.#catDict.get("Pages");
        if (!(pagesObj instanceof Dict)) {
            throw new FormatError("Invalid top-level pages dictionary.");
        }
        return shadow(this, "toplevelPagesDict", pagesObj);
    }
    get documentOutline() {
        let obj = null;
        try {
            obj = this.#readDocumentOutline();
        }
        catch (ex) {
            if (ex instanceof MissingDataException) {
                throw ex;
            }
            warn("Unable to read document outline.");
        }
        return shadow(this, "documentOutline", obj);
    }
    #readDocumentOutline() {
        let obj = this.#catDict.get("Outlines");
        if (!(obj instanceof Dict))
            return null;
        obj = obj.getRaw("First");
        if (!(obj instanceof Ref))
            return null;
        const root = { items: [] };
        const queue = [{ obj: obj, parent: root }];
        // To avoid recursion, keep track of the already processed items.
        const processed = new RefSet();
        processed.put(obj);
        const xref = this.xref;
        const blackColor = new Uint8ClampedArray(3);
        while (queue.length > 0) {
            const i = queue.shift();
            const outlineDict = xref.fetchIfRef(i.obj);
            if (outlineDict === null) {
                continue;
            }
            if (!outlineDict.has("Title")) {
                throw new FormatError("Invalid outline item encountered.");
            }
            const data = {};
            Catalog.parseDestDictionary({
                destDict: outlineDict,
                resultObj: data,
                docBaseUrl: this.pdfManager.docBaseUrl,
            });
            const title = outlineDict.get("Title");
            const flags = outlineDict.get("F") ?? 0;
            const color = outlineDict.getArray("C");
            const count = outlineDict.get("Count");
            let rgbColor = blackColor;
            // We only need to parse the color when it's valid, and non-default.
            if (Array.isArray(color) &&
                color.length === 3 &&
                (color[0] !== 0 || color[1] !== 0 || color[2] !== 0)) {
                rgbColor = ColorSpace.singletons.rgb.getRgb(color, 0);
            }
            const outlineItem = {
                dest: data.dest,
                url: data.url,
                unsafeUrl: data.unsafeUrl,
                newWindow: data.newWindow,
                title: stringToPDFString(title),
                color: rgbColor,
                count: Number.isInteger(count) ? count : undefined,
                bold: !!(flags & 2),
                italic: !!(flags & 1),
                items: [],
            };
            i.parent.items.push(outlineItem);
            obj = outlineDict.getRaw("First");
            if ((obj instanceof Ref) && !processed.has(obj)) {
                queue.push({ obj: obj, parent: outlineItem });
                processed.put(obj);
            }
            obj = outlineDict.getRaw("Next");
            if ((obj instanceof Ref) && !processed.has(obj)) {
                queue.push({ obj: obj, parent: i.parent });
                processed.put(obj);
            }
        }
        return root.items.length > 0 ? root.items : null;
    }
    get permissions() {
        let permissions = null;
        try {
            permissions = this.#readPermissions();
        }
        catch (ex) {
            if (ex instanceof MissingDataException) {
                throw ex;
            }
            warn("Unable to read permissions.");
        }
        return shadow(this, "permissions", permissions);
    }
    #readPermissions() {
        const encrypt = this.xref.trailer.get("Encrypt");
        if (!(encrypt instanceof Dict))
            return null;
        let flags = encrypt.get("P");
        if (!(typeof flags === "number"))
            return null;
        // PDF integer objects are represented internally in signed 2's complement
        // form. Therefore, convert the signed decimal integer to a signed 2's
        // complement binary integer so we can use regular bitwise operations on it.
        flags += 2 ** 32;
        const permissions = [];
        for (const key in PermissionFlag) {
            const value = PermissionFlag[key];
            if (flags & value) {
                permissions.push(value);
            }
        }
        return permissions;
    }
    /**
     * Table 100
     */
    get optionalContentConfig() {
        let config;
        try {
            const properties = this.#catDict.get("OCProperties");
            if (!properties) {
                return shadow(this, "optionalContentConfig", undefined);
            }
            const defaultConfig = properties.get("D");
            if (!defaultConfig) {
                return shadow(this, "optionalContentConfig", undefined);
            }
            const groupsData = properties.get("OCGs");
            if (!Array.isArray(groupsData)) {
                return shadow(this, "optionalContentConfig", undefined);
            }
            const groups = [];
            const groupRefs = [];
            // Ensure all the optional content groups are valid.
            for (const groupRef of groupsData) {
                if (!(groupRef instanceof Ref))
                    continue;
                groupRefs.push(groupRef);
                const group = this.xref.fetchIfRef(groupRef); // Table 98
                let v;
                groups.push({
                    id: groupRef.toString(),
                    name: (typeof (v = group.get("Name")) == "string")
                        ? stringToPDFString(v)
                        : null,
                    intent: (typeof (v = group.get("Intent")) === "string")
                        ? stringToPDFString(v)
                        : null,
                });
            }
            config = this.#readOptionalContentConfig(defaultConfig, groupRefs);
            config.groups = groups;
        }
        catch (ex) {
            if (ex instanceof MissingDataException) {
                throw ex;
            }
            warn(`Unable to read optional content config: ${ex}`);
        }
        return shadow(this, "optionalContentConfig", config);
    }
    /**
     * Table 101
     */
    #readOptionalContentConfig(config, contentGroupRefs) {
        function parseOnOff(refs) {
            const onParsed = [];
            if (Array.isArray(refs)) {
                for (const value of refs) {
                    if (!(value instanceof Ref))
                        continue;
                    if (contentGroupRefs.includes(value)) {
                        onParsed.push(value.toString());
                    }
                }
            }
            return onParsed;
        }
        function parseOrder(refs, nestedLevels = 0) {
            if (!Array.isArray(refs)) {
                return null;
            }
            const order = [];
            for (const value of refs) {
                if ((value instanceof Ref) && contentGroupRefs.includes(value)) {
                    parsedOrderRefs.put(value); // Handle "hidden" groups, see below.
                    order.push(value.toString());
                    continue;
                }
                // Handle nested /Order arrays (see e.g. issue 9462 and bug 1240641).
                const nestedOrder = parseNestedOrder(value, nestedLevels);
                if (nestedOrder) {
                    order.push(nestedOrder);
                }
            }
            if (nestedLevels > 0) {
                return order;
            }
            const hiddenGroups = [];
            for (const groupRef of contentGroupRefs) {
                if (parsedOrderRefs.has(groupRef)) {
                    continue;
                }
                hiddenGroups.push(groupRef.toString());
            }
            if (hiddenGroups.length) {
                order.push({ name: null, order: hiddenGroups });
            }
            return order;
        }
        function parseNestedOrder(ref, nestedLevels) {
            if (++nestedLevels > MAX_NESTED_LEVELS) {
                warn("parseNestedOrder - reached MAX_NESTED_LEVELS.");
                return null;
            }
            const value = xref.fetchIfRef(ref);
            if (!Array.isArray(value)) {
                return null;
            }
            const nestedName = xref.fetchIfRef(value[0]);
            if (typeof nestedName !== "string") {
                return null;
            }
            const nestedOrder = parseOrder(value.slice(1), nestedLevels);
            if (!nestedOrder || !nestedOrder.length) {
                return null;
            }
            return { name: stringToPDFString(nestedName), order: nestedOrder };
        }
        const xref = this.xref, parsedOrderRefs = new RefSet(), MAX_NESTED_LEVELS = 10;
        let v;
        return {
            name: (typeof (v = config.get("Name")) === "string")
                ? stringToPDFString(v)
                : null,
            creator: (typeof (v = config.get("Creator")) === "string")
                ? stringToPDFString(v)
                : null,
            baseState: ((v = config.get("BaseState")) instanceof Name)
                ? v.name
                : null,
            on: parseOnOff(config.get("ON")),
            off: parseOnOff(config.get("OFF")),
            order: parseOrder(config.get("Order")),
        };
    }
    get numPages() {
        const obj = this.toplevelPagesDict.get("Count");
        if (!Number.isInteger(obj)) {
            throw new FormatError("Page count in top-level pages dictionary is not an integer.");
        }
        return shadow(this, "numPages", obj);
    }
    get destinations() {
        const obj = this.#readDests();
        const dests = Object.create(null);
        if (obj instanceof NameTree) {
            for (const [key, value] of obj.getAll()) {
                const dest = fetchDestination(value);
                if (dest) {
                    dests[key] = dest;
                }
            }
        }
        else if (obj instanceof Dict) {
            obj.forEach(function (key, value) {
                const dest = fetchDestination(value);
                if (dest) {
                    dests[key] = dest;
                }
            });
        }
        return shadow(this, "destinations", dests);
    }
    getDestination(id) {
        const obj = this.#readDests();
        if (obj instanceof NameTree) {
            const dest = fetchDestination(obj.get(+id));
            if (dest)
                return dest;
            // Fallback to checking the *entire* NameTree, in an attempt to handle
            // corrupt PDF documents with out-of-order NameTrees (fixes issue 10272).
            const allDest = this.destinations[id];
            if (allDest) {
                warn(`Found "${id}" at an incorrect position in the NameTree.`);
                return allDest;
            }
        }
        else if (obj instanceof Dict) {
            const dest = fetchDestination(obj.get(id));
            if (dest)
                return dest;
        }
        return undefined;
    }
    #readDests() {
        const obj = this.#catDict.get("Names"); // Table 31
        if (obj && obj.has("Dests")) {
            return new NameTree(obj.getRaw("Dests"), this.xref);
        }
        else if (this.#catDict.has("Dests")) {
            // Simple destination dictionary.
            return this.#catDict.get("Dests");
        }
        return undefined;
    }
    get pageLabels() {
        let obj = null;
        try {
            obj = this.#readPageLabels();
        }
        catch (ex) {
            if (ex instanceof MissingDataException) {
                throw ex;
            }
            warn("Unable to read page labels.");
        }
        return shadow(this, "pageLabels", obj);
    }
    #readPageLabels() {
        const obj = this.#catDict.getRaw("PageLabels");
        if (!obj)
            return null;
        const pageLabels = new Array(this.numPages);
        let style = null;
        let prefix = "";
        const numberTree = new NumberTree(obj, this.xref);
        const nums = numberTree.getAll();
        let currentLabel = "";
        let currentIndex = 1;
        for (let i = 0, ii = this.numPages; i < ii; i++) {
            const labelDict = nums.get(i);
            if (labelDict !== undefined) {
                if (!(labelDict instanceof Dict)) {
                    throw new FormatError("PageLabel is not a dictionary.");
                }
                let v;
                if (labelDict.has("Type")
                    && !((v = labelDict.get("Type")) instanceof Name && v.name === "PageLabel")) {
                    throw new FormatError("Invalid type in PageLabel dictionary.");
                }
                if (labelDict.has("S")) {
                    const s = labelDict.get("S");
                    if (!(s instanceof Name)) {
                        throw new FormatError("Invalid style in PageLabel dictionary.");
                    }
                    style = s.name;
                }
                else {
                    style = null;
                }
                if (labelDict.has("P")) {
                    const p = labelDict.get("P");
                    if (!(typeof p === "string")) {
                        throw new FormatError("Invalid prefix in PageLabel dictionary.");
                    }
                    prefix = stringToPDFString(p);
                }
                else {
                    prefix = "";
                }
                if (labelDict.has("St")) {
                    const st = labelDict.get("St");
                    if (!(Number.isInteger(st) && st >= 1)) {
                        throw new FormatError("Invalid start in PageLabel dictionary.");
                    }
                    currentIndex = st;
                }
                else {
                    currentIndex = 1;
                }
            }
            switch (style) {
                case "D":
                    currentLabel = currentIndex;
                    break;
                case "R":
                case "r":
                    currentLabel = toRomanNumerals(currentIndex, style === "r");
                    break;
                case "A":
                case "a":
                    const LIMIT = 26; // Use only the characters A-Z, or a-z.
                    const A_UPPER_CASE = 0x41, A_LOWER_CASE = 0x61;
                    const baseCharCode = style === "a" ? A_LOWER_CASE : A_UPPER_CASE;
                    const letterIndex = currentIndex - 1;
                    const character = String.fromCharCode(baseCharCode + (letterIndex % LIMIT));
                    const charBuf = [];
                    for (let j = 0, jj = (letterIndex / LIMIT) | 0; j <= jj; j++) {
                        charBuf.push(character);
                    }
                    currentLabel = charBuf.join("");
                    break;
                default:
                    if (style) {
                        throw new FormatError(`Invalid style "${style}" in PageLabel dictionary.`);
                    }
                    currentLabel = "";
            }
            pageLabels[i] = prefix + currentLabel;
            currentIndex++;
        }
        return pageLabels;
    }
    get pageLayout() {
        const obj = this.#catDict.get("PageLayout");
        // Purposely use a non-standard default value, rather than 'SinglePage', to
        // allow differentiating between `undefined` and /SinglePage since that does
        // affect the Scroll mode (continuous/non-continuous) used in Adobe Reader.
        let pageLayout = undefined;
        if (obj instanceof Name) {
            switch (obj.name) {
                case "SinglePage":
                    pageLayout = 1 /* SinglePage */;
                    break;
                case "OneColumn":
                    pageLayout = 2 /* OneColumn */;
                    break;
                case "TwoColumnLeft":
                    pageLayout = 3 /* TwoColumnLeft */;
                    break;
                case "TwoColumnRight":
                    pageLayout = 4 /* TwoColumnRight */;
                    break;
                case "TwoPageLeft":
                    pageLayout = 5 /* TwoPageLeft */;
                    break;
                case "TwoPageRight":
                    pageLayout = 6 /* TwoPageRight */;
                    break;
            }
        }
        return shadow(this, "pageLayout", pageLayout);
    }
    get pageMode() {
        const obj = this.#catDict.get("PageMode");
        let pageMode = 1 /* UseNone */; // Default value.
        if (obj instanceof Name) {
            switch (obj.name) {
                case "UseNone":
                    pageMode = 1 /* UseNone */;
                    break;
                case "UseOutlines":
                    pageMode = 2 /* UseOutlines */;
                    break;
                case "UseThumbs":
                    pageMode = 3 /* UseThumbs */;
                    break;
                case "FullScreen":
                    pageMode = 4 /* FullScreen */;
                    break;
                case "UseOC":
                    pageMode = 5 /* UseOC */;
                    break;
                case "UseAttachments":
                    pageMode = 6 /* UseAttachments */;
                    break;
            }
        }
        return shadow(this, "pageMode", pageMode);
    }
    get viewerPreferences() {
        const ViewerPreferencesValidators = {
            HideToolbar: isBool,
            HideMenubar: isBool,
            HideWindowUI: isBool,
            FitWindow: isBool,
            CenterWindow: isBool,
            DisplayDocTitle: isBool,
            NonFullScreenPageMode: isName,
            Direction: isName,
            ViewArea: isName,
            ViewClip: isName,
            PrintArea: isName,
            PrintClip: isName,
            PrintScaling: isName,
            Duplex: isName,
            PickTrayByPDFSize: isBool,
            PrintPageRange: Array.isArray,
            NumCopies: Number.isInteger,
        };
        const obj = this.#catDict.get("ViewerPreferences");
        let prefs;
        if (obj instanceof Dict) {
            for (const key in ViewerPreferencesValidators) {
                if (!obj.has(key)) {
                    continue;
                }
                const value = obj.get(key);
                // Make sure the (standard) value conforms to the specification.
                if (!ViewerPreferencesValidators[key](value)) {
                    info(`Bad value in ViewerPreferences for "${key}".`);
                    continue;
                }
                let prefValue;
                switch (key) {
                    case "NonFullScreenPageMode":
                        switch (value.name) {
                            case "UseNone":
                            case "UseOutlines":
                            case "UseThumbs":
                            case "UseOC":
                                prefValue = value.name;
                                break;
                            default:
                                prefValue = "UseNone";
                        }
                        break;
                    case "Direction":
                        switch (value.name) {
                            case "L2R":
                            case "R2L":
                                prefValue = value.name;
                                break;
                            default:
                                prefValue = "L2R";
                        }
                        break;
                    case "ViewArea":
                    case "ViewClip":
                    case "PrintArea":
                    case "PrintClip":
                        switch (value.name) {
                            case "MediaBox":
                            case "CropBox":
                            case "BleedBox":
                            case "TrimBox":
                            case "ArtBox":
                                prefValue = value.name;
                                break;
                            default:
                                prefValue = "CropBox";
                        }
                        break;
                    case "PrintScaling":
                        switch (value.name) {
                            case "None":
                            case "AppDefault":
                                prefValue = value.name;
                                break;
                            default:
                                prefValue = "AppDefault";
                        }
                        break;
                    case "Duplex":
                        switch (value.name) {
                            case "Simplex":
                            case "DuplexFlipShortEdge":
                            case "DuplexFlipLongEdge":
                                prefValue = value.name;
                                break;
                            default:
                                prefValue = "None";
                        }
                        break;
                    case "PrintPageRange":
                        const length = value.length;
                        if (length % 2 !== 0) {
                            // The number of elements must be even.
                            break;
                        }
                        const isValid = value.every((page, i, arr) => {
                            return (Number.isInteger(page) &&
                                page > 0 &&
                                (i === 0 || page >= arr[i - 1]) &&
                                page <= this.numPages);
                        });
                        if (isValid) {
                            prefValue = value;
                        }
                        break;
                    case "NumCopies":
                        if (value > 0) {
                            prefValue = value;
                        }
                        break;
                    default:
                        if (typeof value !== "boolean") {
                            throw new FormatError(`viewerPreferences - expected a boolean value for: ${key}`);
                        }
                        prefValue = value;
                }
                if (prefValue !== undefined) {
                    if (!prefs) {
                        prefs = Object.create(null);
                    }
                    prefs[key] = prefValue;
                }
                else {
                    info(`Bad value in ViewerPreferences for "${key}".`);
                }
            }
        }
        return shadow(this, "viewerPreferences", prefs);
    }
    get openAction() {
        const obj = this.#catDict.get("OpenAction");
        const openAction = Object.create(null);
        if ((obj instanceof Dict)) {
            // Convert the OpenAction dictionary into a format that works with
            // `parseDestDictionary`, to avoid having to re-implement those checks.
            const destDict = new Dict(this.xref);
            destDict.set("A", obj);
            const resultObj = {};
            Catalog.parseDestDictionary({ destDict, resultObj });
            if (Array.isArray(resultObj.dest)) {
                openAction.dest = resultObj.dest;
            }
            else if (resultObj.action) {
                openAction.action = resultObj.action;
            }
        }
        else if (Array.isArray(obj)) {
            openAction.dest = obj;
        }
        return shadow(this, "openAction", objectSize(openAction) > 0 ? openAction : undefined);
    }
    get attachments() {
        const obj = this.#catDict.get("Names");
        let attachments = null;
        if (obj instanceof Dict && obj.has("EmbeddedFiles")) {
            const nameTree = new NameTree(obj.getRaw("EmbeddedFiles"), this.xref);
            for (const [key, value] of nameTree.getAll()) {
                const fs = new FileSpec(value, this.xref);
                if (!attachments) {
                    attachments = Object.create(null);
                }
                attachments[stringToPDFString(key)] = fs.serializable;
            }
        }
        return shadow(this, "attachments", attachments);
    }
    get xfaImages() {
        const obj = this.#catDict.get("Names");
        let xfaImages = null;
        if (obj instanceof Dict && obj.has("XFAImages")) {
            const nameTree = new NameTree(obj.getRaw("XFAImages"), this.xref);
            for (const [key, value] of nameTree.getAll()) {
                if (!xfaImages) {
                    xfaImages = new Dict(this.xref);
                }
                xfaImages.set(key, value);
            }
        }
        return shadow(this, "xfaImages", xfaImages);
    }
    #collectJavaScript() {
        const obj = this.#catDict.get("Names");
        let javaScript;
        function appendIfJavaScriptDict(name, jsDict) {
            if (!(jsDict instanceof Dict))
                return;
            if (!isName(jsDict.get("S"), "JavaScript"))
                return;
            let js = jsDict.get("JS");
            if (js instanceof BaseStream) {
                js = js.getString();
            }
            else if (typeof js !== "string") {
                return;
            }
            if (javaScript === undefined) {
                javaScript = new Map();
            }
            javaScript.set(name, stringToPDFString(js));
        }
        if (obj instanceof Dict && obj.has("JavaScript")) {
            const nameTree = new NameTree(obj.getRaw("JavaScript"), this.xref);
            for (const [key, value] of nameTree.getAll()) {
                appendIfJavaScriptDict(key, value);
            }
        }
        // Append OpenAction "JavaScript" actions, if any, to the JavaScript map.
        const openAction = this.#catDict.get("OpenAction");
        if (openAction) {
            appendIfJavaScriptDict("OpenAction", openAction);
        }
        return javaScript;
    }
    get javaScript() {
        const javaScript = this.#collectJavaScript();
        return shadow(this, "javaScript", javaScript ? [...javaScript.values()] : undefined);
    }
    get jsActions() {
        const javaScript = this.#collectJavaScript();
        let actions = collectActions(this.xref, this.#catDict, DocumentActionEventType);
        if (javaScript) {
            if (!actions) {
                actions = Object.create(null);
            }
            for (const [key, val] of javaScript) {
                if (key in actions) {
                    actions[key].push(val);
                }
                else {
                    actions[key] = [val];
                }
            }
        }
        return shadow(this, "jsActions", actions);
    }
    fontFallback(id, handler) {
        const promises = [];
        this.fontCache.forEach(promise => {
            promises.push(promise);
        });
        return Promise.all(promises).then(translatedFonts => {
            for (const translatedFont of translatedFonts) {
                if (translatedFont.loadedName === id) {
                    translatedFont.fallback(handler);
                    return;
                }
            }
        });
    }
    cleanup(manuallyTriggered = false) {
        clearPrimitiveCaches();
        this.globalImageCache.clear(/* onlyData = */ manuallyTriggered);
        this.pageKidsCountCache.clear();
        this.pageIndexCache.clear();
        this.nonBlendModesSet.clear();
        const promises = [];
        this.fontCache.forEach(promise => {
            promises.push(promise);
        });
        return Promise.all(promises).then(translatedFonts => {
            for (const { dict } of translatedFonts) {
                delete dict?.cacheKey;
            }
            this.fontCache.clear();
            this.builtInCMapCache.clear();
            this.standardFontDataCache.clear();
        });
    }
    /**
     * Dict: Ref. 7.7.3.3 Page Objects
     */
    getPageDict(pageIndex) {
        const capability = createPromiseCapability();
        const nodesToVisit = [this.#catDict.getRaw("Pages")];
        const visitedNodes = new RefSet();
        const xref = this.xref;
        const pageKidsCountCache = this.pageKidsCountCache;
        let count;
        let currentPageIndex = 0;
        function next() {
            while (nodesToVisit.length) {
                const currentNode = nodesToVisit.pop();
                if ((currentNode instanceof Ref)) {
                    count = pageKidsCountCache.get(currentNode);
                    // Skip nodes where the page can't be.
                    if (count > 0 && currentPageIndex + count < pageIndex) {
                        currentPageIndex += count;
                        continue;
                    }
                    // Prevent circular references in the /Pages tree.
                    if (visitedNodes.has(currentNode)) {
                        capability.reject(new FormatError("Pages tree contains circular reference."));
                        return;
                    }
                    visitedNodes.put(currentNode);
                    xref.fetchAsync(currentNode).then(obj => {
                        if (isDict(obj, "Page") || ((obj instanceof Dict) && !obj.has("Kids"))) {
                            if (pageIndex === currentPageIndex) {
                                // Cache the Page reference, since it can *greatly* improve
                                // performance by reducing redundant lookups in long documents
                                // where all nodes are found at *one* level of the tree.
                                if (currentNode && !pageKidsCountCache.has(currentNode)) {
                                    pageKidsCountCache.put(currentNode, 1);
                                }
                                capability.resolve([obj, currentNode]);
                            }
                            else {
                                currentPageIndex++;
                                next();
                            }
                            return;
                        }
                        nodesToVisit.push(obj);
                        next();
                    }, capability.reject);
                    return;
                }
                // Must be a child page dictionary.
                if (!(currentNode instanceof Dict)) {
                    capability.reject(new FormatError("Page dictionary kid reference points to wrong type of object."));
                    return;
                }
                count = currentNode.get("Count");
                if (Number.isInteger(count) && count >= 0) {
                    // Cache the Kids count, since it can reduce redundant lookups in
                    // documents where all nodes are found at *one* level of the tree.
                    const objId = currentNode.objId;
                    if (objId && !pageKidsCountCache.has(objId)) {
                        pageKidsCountCache.put(objId, count);
                    }
                    // Skip nodes where the page can't be.
                    if (currentPageIndex + count <= pageIndex) {
                        currentPageIndex += count;
                        continue;
                    }
                }
                const kids = currentNode.get("Kids");
                if (!Array.isArray(kids)) {
                    // Prevent errors in corrupt PDF documents that violate the
                    // specification by *inlining* Page dicts directly in the Kids
                    // array, rather than using indirect objects (fixes issue9540.pdf).
                    if (isName(currentNode.get("Type"), "Page")
                        || (!currentNode.has("Type") && currentNode.has("Contents"))) {
                        if (currentPageIndex === pageIndex) {
                            capability.resolve([currentNode, undefined]);
                            return;
                        }
                        currentPageIndex++;
                        continue;
                    }
                    capability.reject(new FormatError("Page dictionary kids object is not an array."));
                    return;
                }
                // Always check all `Kids` nodes, to avoid getting stuck in an empty
                // node further down in the tree (see issue5644.pdf, issue8088.pdf),
                // and to ensure that we actually find the correct `Page` dict.
                for (let last = kids.length - 1; last >= 0; last--) {
                    nodesToVisit.push(kids[last]);
                }
            }
            capability.reject(new Error(`Page index ${pageIndex} not found.`));
        }
        next();
        return capability.promise;
    }
    getPageIndex(pageRef) {
        const cachedPageIndex = this.pageIndexCache.get(pageRef);
        if (cachedPageIndex !== undefined) {
            return Promise.resolve(cachedPageIndex);
        }
        // The page tree nodes have the count of all the leaves below them. To get
        // how many pages are before we just have to walk up the tree and keep
        // adding the count of siblings to the left of the node.
        const xref = this.xref;
        function pagesBeforeRef(kidRef) {
            let total = 0, parentRef;
            return xref
                .fetchAsync(kidRef)
                .then(node => {
                if (isRefsEqual(kidRef, pageRef) &&
                    !isDict(node, "Page") &&
                    !((node instanceof Dict) && !node.has("Type") && node.has("Contents"))) {
                    throw new FormatError("The reference does not point to a /Page dictionary.");
                }
                if (!node) {
                    return null;
                }
                if (!(node instanceof Dict)) {
                    throw new FormatError("Node must be a dictionary.");
                }
                parentRef = node.getRaw("Parent");
                return node.getAsync("Parent");
            })
                .then(parent => {
                if (!parent) {
                    return null;
                }
                if (!(parent instanceof Dict)) {
                    throw new FormatError("Parent must be a dictionary.");
                }
                return parent.getAsync("Kids");
            })
                .then(kids => {
                if (!kids) {
                    return null;
                }
                const kidPromises = [];
                let found = false;
                for (let i = 0, ii = kids.length; i < ii; i++) {
                    const kid = kids[i];
                    if (!(kid instanceof Ref)) {
                        throw new FormatError("Kid must be a reference.");
                    }
                    if (isRefsEqual(kid, kidRef)) {
                        found = true;
                        break;
                    }
                    kidPromises.push(xref.fetchAsync(kid).then(obj => {
                        if (!(obj instanceof Dict)) {
                            throw new FormatError("Kid node must be a dictionary.");
                        }
                        if (obj.has("Count")) {
                            total += obj.get("Count");
                        }
                        else {
                            // Page leaf node.
                            total++;
                        }
                    }));
                }
                if (!found) {
                    throw new FormatError("Kid reference not found in parent's kids.");
                }
                return Promise.all(kidPromises).then(function () {
                    return [total, parentRef];
                });
            });
        }
        let total = 0;
        const next = (ref) => pagesBeforeRef(ref).then(args => {
            if (!args) {
                this.pageIndexCache.put(pageRef, total);
                return total;
            }
            const [count, parentRef] = args;
            total += count;
            return next(parentRef);
        });
        return next(pageRef);
    }
    /**
     * @typedef ParseDestDictionaryParameters
     * @property {Dict} destDict - The dictionary containing the destination.
     * @property {Object} resultObj - The object where the parsed destination
     *   properties will be placed.
     * @property {string} [docBaseUrl] - The document base URL that is used when
     *   attempting to recover valid absolute URLs from relative ones.
     */
    /**
     * Helper function used to parse the contents of destination dictionaries.
     */
    static parseDestDictionary(params) {
        const destDict = params.destDict;
        if (!(destDict instanceof Dict)) {
            warn("parseDestDictionary: `destDict` must be a dictionary.");
            return;
        }
        const resultObj = params.resultObj;
        if (typeof resultObj !== "object") {
            warn("parseDestDictionary: `resultObj` must be an object.");
            return;
        }
        const docBaseUrl = params.docBaseUrl || undefined;
        let action = destDict.get("A"), url, dest;
        if (!(action instanceof Dict)) {
            if (destDict.has("Dest")) {
                // A /Dest entry should *only* contain a Name or an Array, but some bad
                // PDF generators ignore that and treat it as an /A entry.
                action = destDict.get("Dest");
            }
            else {
                action = destDict.get("AA");
                if (action instanceof Dict) {
                    if (action.has("D")) {
                        // MouseDown
                        action = action.get("D");
                    }
                    else if (action.has("U")) {
                        // MouseUp
                        action = action.get("U");
                    }
                }
            }
        }
        if (action instanceof Dict) {
            const actionType = action.get("S"); // Table 193
            if (!(actionType instanceof Name)) {
                warn("parseDestDictionary: Invalid type in Action dictionary.");
                return;
            }
            const actionName = actionType.name; // Table 198
            switch (actionName) {
                case "ResetForm":
                    const flags = action.get("Flags");
                    const include = (((typeof flags === "number") ? flags : 0) & 1) === 0;
                    const fields = [];
                    const refs = [];
                    for (const obj of action.get("Fields") || []) {
                        if (obj instanceof Ref) {
                            refs.push(obj.toString());
                        }
                        else if (typeof obj === "string") {
                            fields.push(stringToPDFString(obj));
                        }
                    }
                    resultObj.resetForm = { fields, refs, include };
                    break;
                case "URI":
                    url = action.get("URI");
                    if (url instanceof Name) {
                        // Some bad PDFs do not put parentheses around relative URLs.
                        url = "/" + url.name;
                    }
                    // TODO: pdf spec mentions urls can be relative to a Base entry in the dictionary.
                    break;
                case "GoTo":
                    dest = action.get("D");
                    break;
                case "Launch":
                // We neither want, nor can, support arbitrary 'Launch' actions.
                // However, in practice they are mostly used for linking to other PDF
                // files, which we thus attempt to support (utilizing `docBaseUrl`).
                /* falls through */
                case "GoToR":
                    const urlDict = action.get("F");
                    if (urlDict instanceof Dict) {
                        // We assume that we found a FileSpec dictionary
                        // and fetch the URL without checking any further.
                        url = urlDict.get("F") || null;
                    }
                    else if (typeof urlDict === "string") {
                        url = urlDict;
                    }
                    // NOTE: the destination is relative to the *remote* document.
                    let remoteDest = action.get("D");
                    if (remoteDest) {
                        if (remoteDest instanceof Name) {
                            remoteDest = remoteDest.name;
                        }
                        if (typeof url === "string") {
                            const baseUrl = url.split("#")[0];
                            if (typeof remoteDest === "string") {
                                url = baseUrl + "#" + remoteDest;
                            }
                            else if (Array.isArray(remoteDest)) {
                                url = baseUrl + "#" + JSON.stringify(remoteDest);
                            }
                        }
                    }
                    // The 'NewWindow' property, equal to `LinkTarget.BLANK`.
                    const newWindow = action.get("NewWindow");
                    if (typeof newWindow === "boolean") {
                        resultObj.newWindow = newWindow;
                    }
                    break;
                case "Named":
                    const namedAction = action.get("N");
                    if (namedAction instanceof Name) {
                        resultObj.action = namedAction.name;
                    }
                    break;
                case "JavaScript":
                    const jsAction = action.get("JS");
                    let js;
                    if (jsAction instanceof BaseStream) {
                        js = jsAction.getString();
                    }
                    else if (typeof jsAction === "string") {
                        js = jsAction;
                    }
                    const jsURL = js && recoverJsURL(stringToPDFString(js));
                    if (jsURL) {
                        url = jsURL.url;
                        resultObj.newWindow = jsURL.newWindow;
                        break;
                    }
                /* falls through */
                default:
                    if (actionName === "JavaScript" || actionName === "SubmitForm") {
                        // Don't bother the user with a warning for actions that require
                        // scripting support, since those will be handled separately.
                        break;
                    }
                    warn(`parseDestDictionary - unsupported action: "${actionName}".`);
                    break;
            }
        }
        else if (destDict.has("Dest")) {
            // Simple destination.
            dest = destDict.get("Dest");
        }
        if (typeof url === "string") {
            const absoluteUrl = createValidAbsoluteUrl(url, docBaseUrl, {
                addDefaultProtocol: true,
                tryConvertEncoding: true,
            });
            if (absoluteUrl) {
                resultObj.url = absoluteUrl.href;
            }
            resultObj.unsafeUrl = url;
        }
        if (dest) {
            if (dest instanceof Name) {
                dest = dest.name;
            }
            if ((typeof dest === "string") || Array.isArray(dest)) {
                resultObj.dest = dest;
            }
        }
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=catalog.js.map