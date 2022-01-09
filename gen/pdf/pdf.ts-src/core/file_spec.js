/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { stringToPDFString, warn } from "../shared/util.js";
import { BaseStream } from "./base_stream.js";
/*81---------------------------------------------------------------------------*/
function pickPlatformItem(dict) {
    // Look for the filename in this order:
    // UF, F, Unix, Mac, DOS
    if (dict.has("UF"))
        return dict.get("UF");
    else if (dict.has("F"))
        return dict.get("F");
    else if (dict.has("Unix"))
        return dict.get("Unix");
    else if (dict.has("Mac"))
        return dict.get("Mac");
    else if (dict.has("DOS"))
        return dict.get("DOS");
    return undefined;
}
/**
 * "A PDF file can refer to the contents of another file by using a File
 * Specification (PDF 1.1)", see the spec (7.11) for more details.
 * NOTE: Only embedded files are supported (as part of the attachments support)
 * TODO: support the 'URL' file system (with caching if !/V), portable
 * collections attributes and related files (/RF)
 */
export class FileSpec {
    xref;
    root;
    fs;
    description;
    contentAvailable;
    #filename;
    get filename() {
        if (!this.#filename && this.root) {
            const filename = pickPlatformItem(this.root) || "unnamed";
            this.#filename = stringToPDFString(filename)
                .replace(/\\\\/g, "\\")
                .replace(/\\\//g, "/")
                .replace(/\\/g, "/");
        }
        return this.#filename;
    }
    contentRef;
    constructor(root, xref) {
        // if (!root || !isDict(root)) {
        //   return;
        // }
        this.xref = xref;
        this.root = root;
        if (root.has("FS")) {
            this.fs = root.get("FS");
        }
        this.description = root.has("Desc")
            ? stringToPDFString(root.get("Desc"))
            : "";
        if (root.has("RF")) {
            warn("Related file specifications are not supported");
        }
        this.contentAvailable = true;
        if (!root.has("EF")) {
            this.contentAvailable = false;
            warn("Non-embedded file specifications are not supported");
        }
    }
    get content() {
        if (!this.contentAvailable)
            return undefined;
        if (!this.contentRef && this.root) {
            this.contentRef = pickPlatformItem(this.root.get("EF"));
        }
        let content = undefined;
        if (this.contentRef) {
            const xref = this.xref;
            const fileObj = xref.fetchIfRef(this.contentRef);
            if (fileObj && (fileObj instanceof BaseStream)) {
                content = fileObj.getBytes();
            }
            else {
                warn("Embedded file specification points to non-existing/invalid " +
                    "content");
            }
        }
        else {
            warn("Embedded file specification does not have a content");
        }
        return content;
    }
    get serializable() {
        return {
            filename: this.filename,
            content: this.content,
        };
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=file_spec.js.map