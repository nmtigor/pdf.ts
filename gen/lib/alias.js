/** 80**************************************************************************
 * @module lib/alias
 * @license Apache-2.0
 ******************************************************************************/
import { z } from "../3rd/zod-3.20.0/lib/index.mjs";
export const zInt = z.number().int();
export const zUint = zInt.min(0);
const zInt64 = zInt;
export const zId = zUint;
export const loff_UNDEFINED = -1_000_000_001;
export const llen_MAX = 1_000_000_000;
// export const lnum_UNDEFINED:lnum_t = -256n;
export const lnum_MAX = 1_000_000;
export const zTs = zInt64;
export const zRatio = z.number().finite();
// deno-fmt-ignore
/**
 * Ref. http://www.unicode.org/reports/tr9/#Table_Bidirectional_Character_Types
 */
export var ChrTyp;
(function (ChrTyp) {
    // Strong
    ChrTyp[ChrTyp["L"] = 1] = "L";
    ChrTyp[ChrTyp["R"] = 2] = "R";
    ChrTyp[ChrTyp["AL"] = 4] = "AL";
    // Weak
    ChrTyp[ChrTyp["EN"] = 8] = "EN";
    ChrTyp[ChrTyp["ES"] = 16] = "ES";
    ChrTyp[ChrTyp["ET"] = 32] = "ET";
    ChrTyp[ChrTyp["AN"] = 64] = "AN";
    ChrTyp[ChrTyp["CS"] = 128] = "CS";
    ChrTyp[ChrTyp["NSM"] = 256] = "NSM";
    ChrTyp[ChrTyp["BN"] = 512] = "BN";
    // Neutral
    ChrTyp[ChrTyp["B"] = 1024] = "B";
    ChrTyp[ChrTyp["S"] = 2048] = "S";
    ChrTyp[ChrTyp["WS"] = 4096] = "WS";
    ChrTyp[ChrTyp["ON"] = 8192] = "ON";
    // Explicit Formatting
    ChrTyp[ChrTyp["LRE"] = 16384] = "LRE";
    ChrTyp[ChrTyp["LRO"] = 32768] = "LRO";
    ChrTyp[ChrTyp["RLE"] = 65536] = "RLE";
    ChrTyp[ChrTyp["RLO"] = 131072] = "RLO";
    ChrTyp[ChrTyp["PDF"] = 262144] = "PDF";
    ChrTyp[ChrTyp["LRI"] = 524288] = "LRI";
    ChrTyp[ChrTyp["RLI"] = 1048576] = "RLI";
    ChrTyp[ChrTyp["FSI"] = 2097152] = "FSI";
    ChrTyp[ChrTyp["PDI"] = 4194304] = "PDI";
})(ChrTyp || (ChrTyp = {}));
export const C2D = globalThis.CanvasRenderingContext2D;
export const OC2D = globalThis.OffscreenCanvasRenderingContext2D;
// export class DumRunr implements Runr {
//   run() {}
// }
/*80--------------------------------------------------------------------------*/
export var Sortart;
(function (Sortart) {
    Sortart[Sortart["asc"] = 0] = "asc";
    Sortart[Sortart["desc"] = 1] = "desc";
})(Sortart || (Sortart = {}));
/*80--------------------------------------------------------------------------*/
export var Hover;
(function (Hover) {
    Hover[Hover["none"] = 0] = "none";
    Hover[Hover["hover"] = 1] = "hover";
})(Hover || (Hover = {}));
export var Pointer;
(function (Pointer) {
    Pointer[Pointer["none"] = 0] = "none";
    Pointer[Pointer["coarse"] = 1] = "coarse";
    Pointer[Pointer["fine"] = 2] = "fine";
})(Pointer || (Pointer = {}));
//#endregion
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=alias.js.map