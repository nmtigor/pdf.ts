/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/core/glyf.ts
 * @license Apache-2.0
 ******************************************************************************/
interface _GlyfTableCtorP {
    glyfTable: Uint8Array | Uint8ClampedArray;
    isGlyphLocationsLong: number;
    locaTable: Uint8Array | Uint8ClampedArray;
    numGlyphs: number;
}
/**
 * GlyfTable object represents a glyf table containing glyph information:
 *  - glyph header (xMin, yMin, xMax, yMax);
 *  - contours if any;
 *  - components if the glyph is a composite.
 *
 * It's possible to re-scale each glyph in order to have a new font which
 * exactly fits an other one: the goal is to be able to build some substitution
 * font for well-known fonts (Myriad, Arial, ...).
 *
 * A full description of glyf table can be found here
 * https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6glyf.html
 */
export declare class GlyfTable {
    glyphs: Glyph[];
    constructor({ glyfTable, isGlyphLocationsLong, locaTable, numGlyphs }: _GlyfTableCtorP);
    getSize(): number;
    write(): {
        isLocationLong: boolean;
        loca: Uint8Array;
        glyf: Uint8Array;
    };
    scale(factors: number[]): void;
}
interface _GlyphCtorP {
    header?: GlyphHeader;
    simple?: SimpleGlyph;
    composites?: CompositeGlyph[];
}
declare class Glyph {
    header: GlyphHeader | undefined;
    simple: SimpleGlyph | undefined;
    composites: CompositeGlyph[] | undefined;
    constructor({ header, simple, composites }: _GlyphCtorP);
    static parse(pos: number, glyf: DataView): Glyph;
    getSize(): number;
    write(pos: number, buf: DataView): number;
    scale(factor: number): void;
}
interface _GlyphHeaderCtorP {
    numberOfContours: number;
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
}
declare class GlyphHeader {
    numberOfContours: number;
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
    constructor({ numberOfContours, xMin, yMin, xMax, yMax }: _GlyphHeaderCtorP);
    static parse(pos: number, glyf: DataView): readonly [10, GlyphHeader];
    getSize(): number;
    write(pos: number, buf: DataView): number;
    scale(x: number, factor: number): void;
}
interface _ContourCtorP {
    flags: number[];
    xCoordinates: number[];
    yCoordinates: number[];
}
declare class Contour {
    xCoordinates: number[];
    yCoordinates: number[];
    flags: number[];
    constructor({ flags, xCoordinates, yCoordinates }: _ContourCtorP);
}
interface _SimpleGlyphCtorP {
    contours: Contour[];
    instructions: Uint8Array;
}
declare class SimpleGlyph {
    contours: Contour[];
    instructions: Uint8Array;
    constructor({ contours, instructions }: _SimpleGlyphCtorP);
    static parse(pos: number, glyf: DataView, numberOfContours: number): SimpleGlyph;
    getSize(): number;
    write(pos: number, buf: DataView): number;
    scale(x: number, factor: number): void;
}
interface _CompositeGlyphCtorP {
    flags: number;
    glyphIndex: number;
    argument1: number;
    argument2: number;
    transf: number[];
    instructions: Uint8Array | undefined;
}
declare class CompositeGlyph {
    flags: number;
    glyphIndex: number;
    argument1: number;
    argument2: number;
    transf: number[];
    instructions: Uint8Array | undefined;
    constructor({ flags, glyphIndex, argument1, argument2, transf, instructions, }: _CompositeGlyphCtorP);
    static parse(pos: number, glyf: DataView): readonly [number, CompositeGlyph];
    getSize(): number;
    write(pos: number, buf: DataView): number;
    scale(x: number, factor: number): void;
}
export {};
//# sourceMappingURL=glyf.d.ts.map