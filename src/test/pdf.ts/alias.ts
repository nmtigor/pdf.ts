/** 80**************************************************************************
 * @module test/pdf.ts/alias
 * @license Apache-2.0
 ******************************************************************************/

import type { uint } from "@fe-lib/alias.ts";
import { zUint } from "@fe-lib/alias.ts";
import type { StatTime } from "@fe-pdf.ts-src/display/display_utils.ts";
import { z } from "@zod";
/*80--------------------------------------------------------------------------*/

export type T_browser = "chrome" | "firefox";
export const z_browser = z.enum(["chrome", "firefox"]);

export type T_info = {
  browser: T_browser;
  message: string;
};
export const z_info = z.object({
  browser: z_browser,
  message: z.string(),
});

export type T_task_results = {
  browser: T_browser;
  id: string;
  numPages: uint;
  /** 1-based */
  lastPageNum: uint;
  failure: string | false;
  file: string;
  /** 0-based */
  round: uint;
  /** 1-based */
  page: uint;
  snapshot: string;
  stats: StatTime[];
  viewportWidth: uint | undefined;
  viewportHeight: uint | undefined;
  outputScale: number | undefined;
};
export const z_task_results = z.object({
  browser: z_browser,
  id: z.string(),
  numPages: zUint,
  lastPageNum: zUint,
  failure: z.string().or(z.literal(false)),
  file: z.string(),
  round: zUint,
  page: zUint,
  snapshot: z.string(),
  stats: z.array(z.object({
    name: z.string(),
    start: z.number(),
    end: z.number(),
  })),
  viewportWidth: zUint.or(z.undefined()),
  viewportHeight: zUint.or(z.undefined()),
  outputScale: z.number().or(z.undefined()),
});
/*64----------------------------------------------------------*/

export type Stat = {
  browser: T_browser;
  pdf: string;
  page: uint;
  round: uint;
  stats: StatTime[];
};
/*80--------------------------------------------------------------------------*/
