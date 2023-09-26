/** 80**************************************************************************
 * @module lib/color/alias
 * @license Apache-2.0
 ******************************************************************************/
import { z } from "../../3rd/zod-3.22.2/lib/index.mjs";
export const zRed = z.number().int().min(0).max(255);
export const zAlpha = z.number().min(0).max(1);
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=alias.js.map