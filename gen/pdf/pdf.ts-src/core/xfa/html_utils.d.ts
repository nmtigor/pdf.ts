import { type AvailableSpace, type XFAElObj, type XFAFontBase, type XFAHTMLObj, type XFAStyleData } from "./alias.js";
import { FontFinder } from "./fonts.js";
import { Area, Border, Caption, ContentArea, Draw, ExclGroup, Field, Subform } from "./template.js";
import { XFAObject } from "./xfa_object.js";
export declare function measureToString(m: string | number): string;
export declare function setMinMaxDimensions(node: Draw | Field, style: XFAStyleData): void;
export interface XFALayoutMode {
    w: number | undefined;
    h: number | undefined;
    isBroken: boolean;
}
export declare function layoutNode(node: Caption | Draw | Field, availableSpace: AvailableSpace): XFALayoutMode;
export declare function computeBbox(node: Draw | Field, html: XFAHTMLObj, availableSpace?: AvailableSpace): [number, number, number, number] | undefined;
export declare function fixDimensions(node: XFAObject): void;
export declare function layoutClass(node: XFAObject): "xfaPosition" | "xfaLrTb" | "xfaRlRow" | "xfaRlTb" | "xfaRow" | "xfaTable" | "xfaTb";
export declare function toStyle(node: XFAObject, ...names: string[]): XFAStyleData;
export declare function createWrapper(node: Draw | ExclGroup | Field | Subform, html: XFAElObj): XFAHTMLObj;
export declare function fixTextIndent(styles: XFAStyleData): void;
export declare function setAccess(node: ExclGroup | Field | Subform, classNames: string[]): void;
export declare function isPrintOnly(node: Area | Border | ContentArea | Draw | ExclGroup | Field): boolean;
export declare function setPara(node: Caption | Draw, nodeStyle: XFAStyleData | undefined, value: XFAElObj): void;
export declare function setFontFamily(xfaFont: XFAFontBase, node: XFAObject, fontFinder: FontFinder, style: XFAStyleData): void;
export declare function fixURL(str: string): string | undefined;
//# sourceMappingURL=html_utils.d.ts.map