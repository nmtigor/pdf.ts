import { rect_t } from "../shared/util.js";
import { Dict, Name } from "./primitives.js";
import { StringStream } from "./stream.js";
import { XRef } from "./xref.js";
export interface DefaultAppearanceData {
    fontSize: number;
    fontName: string;
    fontColor?: Uint8ClampedArray | undefined;
}
export declare function parseDefaultAppearance(str: string): {
    fontSize: number;
    fontName: string;
    fontColor: Uint8ClampedArray;
};
export declare function getPdfColor(color: Uint8ClampedArray, isFill: boolean): string;
export declare function createDefaultAppearance({ fontSize, fontName, fontColor }: DefaultAppearanceData): string;
export declare class FakeUnicodeFont {
    #private;
    xref: XRef;
    widths: Map<number, number> | undefined;
    firstChar: number;
    lastChar: number;
    fontFamily: "monospace" | "sans-serif";
    ctxMeasure: any;
    fontName: Name;
    static toUnicodeStream: StringStream;
    get toUnicodeRef(): import("./primitives.js").NsRef.Ref;
    get fontDescriptorRef(): import("./primitives.js").NsRef.Ref;
    constructor(xref: XRef, fontFamily: "monospace" | "sans-serif");
    get descendantFontRef(): import("./primitives.js").NsRef.Ref;
    get baseFontRef(): import("./primitives.js").NsRef.Ref;
    get resources(): Dict;
    _createContext(): any;
    createFontResources(text: string): Dict;
    createAppearance(text: string, rect: rect_t, rotation: number, fontSize: number, bgColor: Uint8ClampedArray): StringStream;
}
//# sourceMappingURL=default_appearance.d.ts.map