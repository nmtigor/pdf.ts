import type { rect_t } from "../../../lib/alias.js";
import { Dict, Name, Ref } from "./primitives.js";
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
    ctxMeasure: OffscreenCanvasRenderingContext2D;
    fontName: Name;
    static toUnicodeStream: StringStream;
    get toUnicodeRef(): Ref;
    get fontDescriptorRef(): Ref;
    constructor(xref: XRef, fontFamily: "monospace" | "sans-serif");
    get descendantFontRef(): Ref;
    get baseFontRef(): Ref;
    get resources(): Dict;
    _createContext(): OffscreenCanvasRenderingContext2D;
    createFontResources(text: string): Dict;
    createAppearance(text: string, rect: rect_t, rotation: number, fontSize: number, bgColor: Uint8ClampedArray, strokeAlpha: number | undefined): StringStream;
}
//# sourceMappingURL=default_appearance.d.ts.map