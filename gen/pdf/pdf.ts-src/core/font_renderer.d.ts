/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/font_renderer.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { id_t, uint } from "../../../lib/alias.js";
import type { matrix_t } from "../shared/util.js";
import { FontRenderOps } from "../shared/util.js";
import type { CFFFDSelect, CFFTopDict } from "./cff_parser.js";
import type { Font } from "./fonts.js";
interface Range {
    start: number;
    end: number;
    idDelta: uint;
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
export type Cmds = (FontRenderOps | number)[];
declare class Commands {
    cmds: Cmds;
    add(cmd: FontRenderOps, args?: unknown[]): void;
}
declare abstract class CompiledFont {
    fontMatrix: [number, number, number, number, number, number];
    compiledGlyphs: Record<id_t, Cmds>;
    compiledCharCodeToGlyphId: number[];
    glyphs: (Uint8Array | Uint8ClampedArray | number[])[];
    cmap?: Range[] | undefined;
    isCFFCIDFont?: boolean;
    fdSelect?: CFFFDSelect | undefined;
    fdArray?: CFFTopDict[];
    constructor(fontMatrix: matrix_t);
    getPathJs(unicode: string): Cmds;
    compileGlyph(code: Uint8Array | Uint8ClampedArray | number[], glyphId: number): Cmds;
    abstract compileGlyphImpl(code: Uint8Array | Uint8ClampedArray | number[], cmds: Commands, glyphId: number): void;
    /** @final */
    hasBuiltPath(unicode: string): boolean;
}
export declare class TrueTypeCompiled extends CompiledFont {
    constructor(glyphs: Uint8Array[], cmap?: Range[], fontMatrix?: matrix_t);
    /** @implement */
    compileGlyphImpl(code: Uint8Array, cmds: Commands, glyphId: number): void;
}
export declare class Type2Compiled extends CompiledFont {
    gsubrs: (number[] | Uint8Array | Uint8ClampedArray)[];
    subrs: (number[] | Uint8Array | Uint8ClampedArray)[];
    glyphNameMap: Record<string, string | number>;
    gsubrsBias: number;
    subrsBias: number;
    constructor(cffInfo: CffInfo, cmap?: Range[], fontMatrix?: matrix_t, glyphNameMap?: Record<string, string | number>);
    /** @implement */
    compileGlyphImpl(code: Uint8Array, cmds: Commands, glyphId: number): void;
}
export declare class FontRendererFactory {
    static create(font: Font, seacAnalysisEnabled: boolean): TrueTypeCompiled | Type2Compiled;
}
export {};
//# sourceMappingURL=font_renderer.d.ts.map