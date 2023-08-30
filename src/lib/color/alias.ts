/** 80**************************************************************************
 * @module lib/color/alias
 * @license Apache-2.0
 ******************************************************************************/

import { z } from "../../3rd/zod-3.20.0/lib/index.mjs";
import type { Ratio, uint8 } from "../alias.ts";
/*80--------------------------------------------------------------------------*/

export type red_t = uint8;
export const zRed = z.number().int().min(0).max(255);

export type alpha_t = Ratio;
export const zAlpha = z.number().min(0).max(1);

export type rgb_t = [red_t, red_t, red_t];
export type rgba_t = [red_t, red_t, red_t, alpha_t];

/*80--------------------------------------------------------------------------*/
