/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/xfa/factory.ts
 * @license Apache-2.0
 ******************************************************************************/
import { warn } from "../../shared/util.js";
import { Binder } from "./bind.js";
import { DataHandler } from "./data.js";
import { FontFinder } from "./fonts.js";
import { XFAParser } from "./parser.js";
import { $appendChild, $globalData, $nodeName, $text, $toHTML, $toPages, } from "./symbol_utils.js";
import { stripQuotes } from "./utils.js";
import { XhtmlNamespace } from "./xhtml.js";
export class XFAFactory {
    root;
    form;
    dataHandler;
    pages;
    dims;
    constructor(data) {
        try {
            this.root = new XFAParser().parse(XFAFactory._createDocument(data));
            const binder = new Binder(this.root);
            this.form = binder.bind();
            this.dataHandler = new DataHandler(this.root, binder.getData());
            this.form[$globalData].template = this.form;
        }
        catch (e) {
            warn(`XFA - an error occurred during parsing and binding: ${e}`);
        }
    }
    isValid() {
        return !!this.root && !!this.form;
    }
    /**
     * In order to avoid to block the event loop, the conversion
     * into pages is made asynchronously.
     */
    _createPagesHelper() {
        const iterator = this.form[$toPages]();
        return new Promise((resolve, reject) => {
            const nextIteration = () => {
                try {
                    const value = iterator.next();
                    if (value.done) {
                        resolve(value.value);
                    }
                    else {
                        setTimeout(nextIteration, 0);
                    }
                }
                catch (e) {
                    reject(e);
                }
            };
            setTimeout(nextIteration, 0);
        });
    }
    async _createPages() {
        try {
            this.pages = await this._createPagesHelper();
            this.dims = this.pages.children.map((c) => {
                const { width, height } = c.attributes.style;
                return [0, 0, parseInt(width), parseInt(height)];
            });
        }
        catch (e) {
            warn(`XFA - an error occurred during layout: ${e}`);
        }
    }
    getBoundingBox(pageIndex) {
        return this.dims[pageIndex];
    }
    async getNumPages() {
        if (!this.pages) {
            await this._createPages();
        }
        return this.dims.length;
    }
    setImages(images) {
        this.form[$globalData].images = images;
    }
    setFonts(fonts) {
        this.form[$globalData].fontFinder = new FontFinder(fonts);
        const missingFonts = [];
        for (let typeface of this.form[$globalData].usedTypefaces) {
            typeface = stripQuotes(typeface);
            const font = this.form[$globalData].fontFinder.find(typeface);
            if (!font) {
                missingFonts.push(typeface);
            }
        }
        if (missingFonts.length > 0) {
            return missingFonts;
        }
        return undefined;
    }
    appendFonts(fonts, reallyMissingFonts) {
        this.form[$globalData].fontFinder.add(fonts, reallyMissingFonts);
    }
    async getPages() {
        if (!this.pages) {
            await this._createPages();
        }
        const pages = this.pages;
        this.pages = undefined;
        return pages;
    }
    serializeData(storage) {
        return this.dataHandler.serialize(storage);
    }
    static _createDocument(data) {
        if (!data["/xdp:xdp"]) {
            return data["xdp:xdp"];
        }
        return Object.values(data).join("");
    }
    static getRichTextAsHtml(rc) {
        if (!rc || typeof rc !== "string")
            return undefined;
        try {
            let root = new XFAParser(XhtmlNamespace, /* richText */ true).parse(rc);
            if (!["body", "xhtml"].includes(root[$nodeName])) {
                // No body, so create one.
                const newRoot = XhtmlNamespace.body({});
                newRoot[$appendChild](root);
                root = newRoot;
            }
            const result = root[$toHTML]();
            if (!result.success)
                return undefined;
            const { html } = result;
            const { attributes } = html;
            if (attributes) {
                if (attributes.class) {
                    attributes.class = attributes.class.filter((attr) => !attr.startsWith("xfa"));
                }
                attributes.dir = "auto";
            }
            return { html: html, str: root[$text]() };
        }
        catch (e) {
            warn(`XFA - an error occurred during parsing of rich text: ${e}`);
        }
        return undefined;
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=factory.js.map