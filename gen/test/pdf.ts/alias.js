/** 80**************************************************************************
 * @module test/pdf.ts/alias
 * @license Apache-2.0
 ******************************************************************************/
import { zUint } from "../../lib/alias.js";
import { z } from "../../3rd/zod-3.23.8/lib/index.mjs";
export const z_browser = z.enum(["chrome", "firefox"]);
export const z_info = z.object({
    browser: z_browser,
    message: z.string(),
});
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
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=alias.js.map