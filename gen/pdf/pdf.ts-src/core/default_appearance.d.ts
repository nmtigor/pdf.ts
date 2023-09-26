import type { rect_t } from "../../../lib/alias.js";
import type { rgb_t } from "../../../lib/color/alias.js";
import type { BaseStream } from "./base_stream.js";
import { type DeviceGrayCS } from "./colorspace.js";
import type { EvaluatorOptions } from "./pdf_manager.js";
import type { Ref } from "./primitives.js";
import { Dict, Name } from "./primitives.js";
import { StringStream } from "./stream.js";
import type { XRef } from "./xref.js";
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
type AppearanceStreamParsed = {
    scaleFactor: number;
    fontSize: number;
    fontName: string;
    fontColor: Uint8ClampedArray;
    fillColorSpace: DeviceGrayCS;
};
export declare function parseAppearanceStream(stream: BaseStream, evaluatorOptions?: EvaluatorOptions, xref?: XRef): AppearanceStreamParsed;
export declare function getPdfColor(color: Uint8ClampedArray | rgb_t, isFill: boolean): string;
export declare function createDefaultAppearance({ fontSize, fontName, fontColor }: DefaultAppearanceData): string;
export declare class FakeUnicodeFont {
    #private;
    xref: XRef;
    widths: Map<number, number> | undefined;
    firstChar: number;
    lastChar: number;
    fontFamily: "sans-serif" | "monospace";
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
export {};
//# sourceMappingURL=default_appearance.d.ts.map