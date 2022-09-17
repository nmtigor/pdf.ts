import { CFFFDSelect, CFFTopDict } from "./cff_parser.js";
import { Font } from "./fonts.js";
interface Range {
    start: number;
    end: number;
    idDelta: number;
    ids?: number[];
}
interface CffInfo {
    glyphs: (Uint8Array | Uint8ClampedArray | number[])[];
    subrs?: (Uint8Array | Uint8ClampedArray | number[])[] | undefined;
    gsubrs?: (Uint8Array | Uint8ClampedArray | number[])[] | undefined;
    isCFFCIDFont: boolean;
    fdSelect?: CFFFDSelect | undefined;
    fdArray: CFFTopDict[];
}
declare type FontMatrix = [number, number, number, number, number, number];
declare type C2DCmd = "moveTo" | "lineTo" | "bezierCurveTo" | "quadraticCurveTo" | "transform" | "scale" | "translate" | "save" | "restore";
export interface CmdArgs {
    cmd: C2DCmd;
    args?: (number | string)[];
}
declare abstract class CompiledFont {
    fontMatrix: FontMatrix;
    compiledGlyphs: CmdArgs[][];
    compiledCharCodeToGlyphId: number[];
    glyphs: (Uint8Array | Uint8ClampedArray | number[])[];
    cmap?: Range[] | undefined;
    isCFFCIDFont?: boolean;
    fdSelect?: CFFFDSelect | undefined;
    fdArray?: CFFTopDict[];
    constructor(fontMatrix: FontMatrix);
    getPathJs(unicode: string): CmdArgs[];
    compileGlyph(code: Uint8Array | Uint8ClampedArray | number[], glyphId: number): CmdArgs[];
    abstract compileGlyphImpl(code: Uint8Array | Uint8ClampedArray | number[], cmds: CmdArgs[], glyphId: number): void;
    /** @final */
    hasBuiltPath(unicode: string): boolean;
}
export declare class TrueTypeCompiled extends CompiledFont {
    constructor(glyphs: Uint8Array[], cmap?: Range[], fontMatrix?: FontMatrix);
    /** @implement */
    compileGlyphImpl(code: Uint8Array, cmds: CmdArgs[], glyphId: number): void;
}
export declare class Type2Compiled extends CompiledFont {
    gsubrs: (Uint8Array | Uint8ClampedArray | number[])[];
    subrs: (Uint8Array | Uint8ClampedArray | number[])[];
    glyphNameMap: Record<string, string | number>;
    gsubrsBias: number;
    subrsBias: number;
    constructor(cffInfo: CffInfo, cmap?: Range[], fontMatrix?: FontMatrix, glyphNameMap?: Record<string, string | number>);
    /** @implement */
    compileGlyphImpl(code: Uint8Array, cmds: CmdArgs[], glyphId: number): void;
}
export declare class FontRendererFactory {
    static create(font: Font, seacAnalysisEnabled: boolean): TrueTypeCompiled | Type2Compiled;
}
export {};
//# sourceMappingURL=font_renderer.d.ts.map