import type { JpxStream } from "./jpx_stream.js";
interface PrecinctsSize {
    PPx: number;
    PPy: number;
}
interface siz_t {
    Xsiz: number;
    Ysiz: number;
    XOsiz: number;
    YOsiz: number;
    XTsiz: number;
    YTsiz: number;
    XTOsiz: number;
    YTOsiz: number;
    Csiz: number;
}
interface cod_t {
    entropyCoderWithCustomPrecincts: boolean;
    sopMarkerUsed: boolean;
    ephMarkerUsed: boolean;
    progressionOrder: number;
    layersCount: number;
    multipleComponentTransform: number;
    decompositionLevelsCount: number;
    xcb: number;
    ycb: number;
    selectiveArithmeticCodingBypass: boolean;
    resetContextProbabilities: boolean;
    terminationOnEachCodingPass: boolean;
    verticallyStripe: boolean;
    predictableTermination: boolean;
    segmentationSymbolUsed: boolean;
    reversibleTransformation: number;
    precinctsSizes: PrecinctsSize[];
}
interface spqcd_t {
    epsilon: number;
    mu: number;
}
interface qcd_t {
    noQuantization: boolean;
    scalarExpounded: boolean;
    guardBits: number;
    SPqcds: spqcd_t[];
}
interface Component {
    precision: number;
    isSigned: boolean;
    XRsiz: number;
    YRsiz: number;
    x0: number;
    x1: number;
    y0: number;
    y1: number;
    tcx0?: number;
    tcy0?: number;
    tcx1?: number;
    tcy1?: number;
    width: number;
    height: number;
    resolutions: Resolution[];
    subbands: Subband[];
    codingStyleParameters?: cod_t | undefined;
    quantizationParameters: qcd_t | undefined;
}
interface PrecinctParameters {
    precinctWidth: number;
    precinctHeight: number;
    numprecinctswide: number;
    numprecinctshigh: number;
    numprecincts: number;
    precinctWidthInSubband: number;
    precinctHeightInSubband: number;
}
interface Resolution {
    trx0: number;
    try0: number;
    trx1: number;
    try1: number;
    resLevel: number;
    subbands: Subband[];
    precinctParameters: PrecinctParameters;
}
type SubbandType = "LL" | "LH" | "HL" | "HH";
interface CodeblockParameters {
    codeblockWidth: number;
    codeblockHeight: number;
    numcodeblockwide: number;
    numcodeblockhigh: number;
}
interface Precinct {
    cbxMin: number;
    cbxMax: number;
    cbyMin: number;
    cbyMax: number;
    inclusionTree?: NsJpxImage.InclusionTree;
    zeroBitPlanesTree?: NsJpxImage.TagTree;
}
interface Codeblock {
    cbx: number;
    cby: number;
    tbx0: number;
    tby0: number;
    tbx1: number;
    tby1: number;
    tbx0_: number;
    tby0_: number;
    tbx1_: number;
    tby1_: number;
    precinctNumber: number;
    subbandType: SubbandType;
    Lblock: number;
    precinct: Precinct;
    included?: boolean;
    zeroBitPlanes: number;
    data?: {
        data: Uint8Array | Uint8ClampedArray;
        start: number;
        end: number;
        codingpasses: number;
    }[];
}
interface Subband {
    type: SubbandType;
    tbx0: number;
    tby0: number;
    tbx1: number;
    tby1: number;
    resolution: Resolution;
    codeblockParameters: CodeblockParameters;
    codeblocks: Codeblock[];
    precincts: Precinct[];
}
interface Packet {
    layerNumber: number;
    codeblocks: Codeblock[];
}
interface Tile {
    tx0?: number;
    ty0?: number;
    tx1?: number;
    ty1?: number;
    left: number;
    top: number;
    width: number;
    height: number;
    items: Uint8ClampedArray;
    components?: Component[];
    index?: number;
    length?: number;
    dataEnd?: number;
    partIndex?: number;
    partsCount?: number;
    QCC?: qcd_t[];
    QCD?: qcd_t;
    COC?: cod_t[];
    COD?: cod_t;
    packetsIterator?: NsJpxImage.LayerResolutionComponentPositionIterator | NsJpxImage.ResolutionLayerComponentPositionIterator | NsJpxImage.ResolutionPositionComponentLayerIterator | NsJpxImage.PositionComponentResolutionLayerIterator | NsJpxImage.ComponentPositionResolutionLayerIterator;
    codingStyleDefaultParameters: cod_t | undefined;
}
interface Context {
    mainHeader: boolean;
    SIZ: siz_t;
    components: Component[];
    COC: cod_t[];
    QCC: qcd_t[];
    currentTile: Tile;
    COD: cod_t;
    QCD: qcd_t;
    tiles: Tile[];
}
interface Level {
    width: number;
    height: number;
    items: number[] | Uint8Array;
    index: number;
}
declare namespace NsJpxImage {
    class JpxImage {
        failOnCorruptedImage: boolean;
        tiles?: Tile[];
        width?: number;
        height?: number;
        componentsCount?: number;
        bitsPerComponent?: number;
        parse(data: Uint8Array | Uint8ClampedArray): void;
        parseImageProperties(stream: JpxStream): void;
        parseCodestream(data: Uint8Array | Uint8ClampedArray, start: number, end: number): void;
    }
    class LayerResolutionComponentPositionIterator {
        nextPacket: () => Packet;
        constructor(context: Context);
    }
    class ResolutionLayerComponentPositionIterator {
        nextPacket: () => Packet;
        constructor(context: Context);
    }
    class ResolutionPositionComponentLayerIterator {
        nextPacket: () => Packet;
        constructor(context: Context);
    }
    class PositionComponentResolutionLayerIterator {
        nextPacket: () => Packet;
        constructor(context: Context);
    }
    class ComponentPositionResolutionLayerIterator {
        nextPacket: () => Packet;
        constructor(context: Context);
    }
    class TagTree {
        levels: Level[];
        currentLevel?: number;
        value?: number;
        constructor(width: number, height: number);
        reset(i: number, j: number): void;
        incrementValue(): void;
        nextLevel(): boolean;
    }
    class InclusionTree {
        levels: Level[];
        currentLevel?: number;
        constructor(width: number, height: number, defaultValue: number);
        reset(i: number, j: number, stopValue: number): boolean;
        incrementValue(stopValue: number): void;
        propagateValues(): void;
        nextLevel(): boolean;
    }
}
export import JpxImage = NsJpxImage.JpxImage;
export {};
//# sourceMappingURL=jpx.d.ts.map