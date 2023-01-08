/** 80**************************************************************************
 * @module lib/alias
 * @license Apache-2.0
 ******************************************************************************/
import { z } from "../3rd/zod/lib/index.mjs";
export const zInt = z.number().int();
export const zUint = zInt.min(0);
const zInt64 = zInt;
export const zId = zUint;
// export const Loff_t = Int32;
export const loff_UNDEFINED = -256;
export const loff_MAX = 1_000_000_000;
// export const Lnum_t = Int32;
// export const lnum_UNDEFINED:lnum_t = -256n;
export const lnum_MAX = 1_000_000_000;
export const zTs = zInt64;
export const zRatio = z.number().finite();
export class DumRuhr {
    run() { }
}
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