import { type XFAData } from "../document.js";
import { DataHandler } from "./data.js";
import { type XFAHTMLObj } from "./alias.js";
import { HTMLResult } from "./utils.js";
import { type rect_t } from "../../shared/util.js";
import { ErrorFont, Font } from "../fonts.js";
import { type AnnotStorageRecord } from "../../display/annotation_layer.js";
import { Subform, Template } from "./template.js";
export declare class XFAFactory {
    root: import("./xfa_object.js").XFAObject | undefined;
    form: Subform | Template;
    dataHandler: DataHandler | undefined;
    pages: HTMLResult | undefined;
    dims: rect_t[];
    constructor(data: XFAData);
    isValid(): boolean;
    _createPages(): void;
    getBoundingBox(pageIndex: number): [number, number, number, number];
    get numPages(): number;
    setImages(images: Map<string, Uint8Array | Uint8ClampedArray>): void;
    setFonts(fonts: (Font | ErrorFont)[]): string[] | undefined;
    appendFonts(fonts: (Font | ErrorFont)[], reallyMissingFonts: Set<string>): void;
    getPages(): HTMLResult;
    serializeData(storage: AnnotStorageRecord | undefined): string;
    static _createDocument(data: XFAData): string;
    static getRichTextAsHtml(rc: string): {
        html: XFAHTMLObj;
        str: string | undefined;
    } | undefined;
}
//# sourceMappingURL=factory.d.ts.map