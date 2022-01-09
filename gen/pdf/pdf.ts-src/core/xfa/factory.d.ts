import { type XFAData } from "../document.js";
import { DataHandler } from "./data.js";
import { type XFAElObj, type XFAHTMLObj } from "./alias.js";
import { type rect_t } from "../../shared/util.js";
import { ErrorFont, Font } from "../fonts.js";
import { type AnnotStorageRecord } from "../../display/annotation_layer.js";
import { Template } from "./template.js";
export interface XFAPages {
    name: string;
    children: XFAElObj[];
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
    static _createDocument(data: XFAData): string;
    static getRichTextAsHtml(rc: string): {
        html: XFAHTMLObj;
        str: string | undefined;
    } | undefined;
}
//# sourceMappingURL=factory.d.ts.map