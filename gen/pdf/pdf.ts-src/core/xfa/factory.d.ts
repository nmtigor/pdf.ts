/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/xfa/factory.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { rect_t } from "../../../../lib/alias.js";
import type { AnnotStorageRecord } from "../../display/annotation_layer.js";
import type { XFAData } from "../document.js";
import type { ErrorFont, Font } from "../fonts.js";
import type { XFAHTMLAttrs, XFAHTMLObj } from "./alias.js";
import { DataHandler } from "./data.js";
import type { Template } from "./template.js";
export interface XFAPages {
    xfaName: string;
    name: string;
    children: XFAHTMLObj[];
    attributes?: XFAHTMLAttrs;
}
export declare class XFAFactory {
    root: import("./xfa_object.js").XFAObject | undefined;
    form: Template;
    dataHandler: DataHandler | undefined;
    pages: XFAPages | undefined;
    dims: rect_t[];
    constructor(data: XFAData);
    isValid(): boolean;
    /**
     * In order to avoid to block the event loop, the conversion
     * into pages is made asynchronously.
     */
    _createPagesHelper(): Promise<XFAPages>;
    _createPages(): Promise<void>;
    getBoundingBox(pageIndex: number): [number, number, number, number];
    getNumPages(): Promise<number>;
    setImages(images: Map<string, Uint8Array | Uint8ClampedArray>): void;
    setFonts(fonts: (Font | ErrorFont)[]): string[] | undefined;
    appendFonts(fonts: (Font | ErrorFont)[], reallyMissingFonts: Set<string>): void;
    getPages(): Promise<XFAPages>;
    serializeData(storage: AnnotStorageRecord | undefined): string;
    static _createDocument(data: XFAData): string | import("../base_stream.js").BaseStream;
    static getRichTextAsHtml(rc: string): {
        html: XFAHTMLObj;
        str: string | undefined;
    } | undefined;
}
//# sourceMappingURL=factory.d.ts.map