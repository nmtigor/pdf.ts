import type { ErrorFont, Font } from "../fonts.js";
import type { XFAFontMetrics } from "../xfa_fonts.js";
import type { XFAFontBase } from "./alias.js";
import type { Font as XFAFont } from "./template.js";
interface PDFFont {
    bold?: Font | ErrorFont;
    bolditalic?: Font | ErrorFont;
    italic?: Font | ErrorFont;
    regular?: Font | ErrorFont | undefined;
}
export declare class FontFinder {
    fonts: Map<string, PDFFont | undefined>;
    cache: Map<string, PDFFont>;
    warned: Set<unknown>;
    defaultFont?: PDFFont;
    constructor(pdfFonts: (Font | ErrorFont)[]);
    add(pdfFonts: (Font | ErrorFont)[], reallyMissingFonts?: Set<string>): void;
    addPdfFont(pdfFont: Font | ErrorFont): void;
    getDefault(): PDFFont | undefined;
    find(fontName: string, mustWarn?: boolean): PDFFont | undefined;
}
export declare function selectFont(xfaFont: XFAFontBase, typeface: PDFFont): Font | ErrorFont | undefined;
export declare function getMetrics(xfaFont?: XFAFont, real?: boolean): XFAFontMetrics;
export {};
//# sourceMappingURL=fonts.d.ts.map