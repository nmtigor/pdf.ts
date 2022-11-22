import { type ImgData } from "../core/evaluator.js";
import { FontExpotData, Glyph } from "../core/fonts.js";
import { type OpListIR } from "../core/operator_list.js";
import { type ShadingPatternIR, ShadingType, type TilingPatternIR } from "../core/pattern.js";
import { type matrix_t, OPS, type rect_t, TextRenderingMode } from "../shared/util.js";
import { PDFCommonObjs, PDFObjects, PDFObjs } from "./api.js";
import { DOMSVGFactory, PageViewport } from "./display_utils.js";
declare class SVGExtraState {
    font?: FontExpotData;
    fontSize: number;
    fontSizeScale: number;
    fontFamily?: string | undefined;
    fontWeight: string;
    fontStyle?: string;
    textMatrix: [number, number, number, number, number, number];
    lineMatrix?: [number, number, number, number, number, number];
    fontMatrix: [number, number, number, number, number, number];
    leading: number;
    textRenderingMode: TextRenderingMode;
    textMatrixScale: number;
    x: number;
    y: number;
    lineX: number;
    lineY: number;
    charSpacing: number;
    wordSpacing: number;
    fontDirection?: -1 | 1;
    textHScale: number;
    textRise: number;
    fillColor: string;
    strokeColor: string;
    fillAlpha: number;
    strokeAlpha: number;
    lineWidth: number;
    lineJoin: string;
    lineCap: string;
    miterLimit: number;
    dashArray: number[];
    dashPhase: number;
    dependencies: Promise<unknown>[];
    activeClipUrl?: string;
    clipGroup?: SVGGElement | undefined;
    maskId: string;
    xcoords?: number[];
    ycoords?: number[];
    tspan?: SVGTSpanElement;
    txtElement?: SVGTextElement;
    txtgrp?: SVGGElement;
    path?: SVGPathElement | undefined;
    element?: Element;
    clone(): any;
    setCurrentPoint(x: number, y: number): void;
}
type OpTree = {
    fn?: string;
    fnId: OPS;
    args?: unknown;
    items?: OpTree;
}[];
export declare class SVGGraphics {
    #private;
    svgFactory: DOMSVGFactory;
    current: SVGExtraState;
    transformMatrix: [number, number, number, number, number, number];
    transformStack: matrix_t[];
    extraStack: SVGExtraState[];
    commonObjs: PDFObjects<PDFCommonObjs>;
    objs: PDFObjects<PDFObjs | undefined>;
    pendingClip?: string | undefined;
    pendingEOFill: boolean;
    embedFonts: boolean;
    embeddedFonts: any;
    cssStyle?: SVGStyleElement;
    forceDataSchema: boolean;
    /**
     * In `src/shared/util.js` the operator names are mapped to IDs.
     * The list below represents the reverse of that, i.e., it maps IDs
     * to operator names.
     */
    viewport?: PageViewport;
    defs?: SVGDefsElement;
    svg?: SVGElement | undefined;
    tgrp?: SVGGElement | undefined;
    constructor(commonObjs: PDFObjects<PDFCommonObjs>, objs: PDFObjects<PDFObjs | undefined>, forceDataSchema?: boolean);
    getObject(data: unknown, fallback?: PDFCommonObjs | PDFObjs | undefined): string | import("../core/fonts.js").FontExpotDataEx | {
        error: string;
    } | import("../core/font_renderer.js").CmdArgs[] | ImgData | ["RadialAxial", ShadingType.AXIAL | ShadingType.RADIAL, [number, number, number, number] | undefined, [number, string][], import("../shared/util.js").point_t, import("../shared/util.js").point_t, number, number] | ["Mesh", ShadingType, Float32Array, Uint8Array, import("../core/pattern.js").MeshFigure[], [number, number, number, number], [number, number, number, number] | undefined, Uint8ClampedArray | undefined] | import("../core/pattern.js").DummyIR | undefined;
    [OPS.save](): void;
    [OPS.restore](): void;
    [OPS.group](items: OpTree): void;
    loadDependencies(operatorList: OpListIR): Promise<unknown[]>;
    [OPS.transform](a: number, b: number, c: number, d: number, e: number, f: number): void;
    getSVG(operatorList: OpListIR, viewport: PageViewport): Promise<SVGElement>;
    convertOpList(operatorList: OpListIR): OpTree;
    executeOpTree(opTree: OpTree): void;
    [OPS.setWordSpacing](wordSpacing: number): void;
    [OPS.setCharSpacing](charSpacing: number): void;
    [OPS.nextLine](): void;
    [OPS.setTextMatrix](a: number, b: number, c: number, d: number, e: number, f: number): void;
    [OPS.beginText](): void;
    [OPS.moveText](x: number, y: number): void;
    [OPS.showText](glyphs: (Glyph | number | null)[]): void;
    [OPS.setLeadingMoveText](x: number, y: number): void;
    addFontStyle(fontObj: FontExpotData): void;
    [OPS.setFont](details: [string, number]): void;
    [OPS.endText](): void;
    [OPS.setLineWidth](width: number): void;
    [OPS.setLineCap](style: 0 | 1 | 2): void;
    [OPS.setLineJoin](style: 0 | 1 | 2): void;
    [OPS.setMiterLimit](limit: number): void;
    setStrokeAlpha(strokeAlpha: number): void;
    [OPS.setStrokeRGBColor](r: number, g: number, b: number): void;
    setFillAlpha(fillAlpha: number): void;
    [OPS.setFillRGBColor](r: number, g: number, b: number): void;
    [OPS.setStrokeColorN](args: TilingPatternIR | ShadingPatternIR): void;
    [OPS.setFillColorN](args: TilingPatternIR | ShadingPatternIR): void;
    [OPS.shadingFill](args: ShadingPatternIR): void;
    [OPS.setDash](dashArray: number[], dashPhase: number): void;
    [OPS.constructPath](ops: OPS[], args: number[]): void;
    [OPS.endPath](): void;
    [OPS.clip](type: string): void;
    [OPS.closePath](): void;
    [OPS.setLeading](leading: number): void;
    [OPS.setTextRise](textRise: number): void;
    [OPS.setTextRenderingMode](textRenderingMode: TextRenderingMode): void;
    [OPS.setHScale](scale: number): void;
    [OPS.setRenderingIntent](intent: unknown): void;
    [OPS.setFlatness](flatness: unknown): void;
    [OPS.setGState](states: [string, unknown][]): void;
    [OPS.fill](): void;
    [OPS.stroke](): void;
    [OPS.eoFill](): void;
    [OPS.fillStroke](): void;
    [OPS.eoFillStroke](): void;
    [OPS.closeStroke](): void;
    [OPS.closeFillStroke](): void;
    [OPS.closeEOFillStroke](): void;
    [OPS.paintSolidColorImageMask](): void;
    [OPS.paintImageXObject](objId: string): void;
    [OPS.paintInlineImageXObject](imgData: ImgData, mask?: SVGMaskElement): void;
    [OPS.paintImageMaskXObject](img: ImgData): void;
    [OPS.paintFormXObjectBegin](matrix: matrix_t, bbox?: rect_t): void;
    [OPS.paintFormXObjectEnd](): void;
}
export {};
//# sourceMappingURL=svg.d.ts.map