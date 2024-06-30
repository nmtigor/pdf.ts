/** 80**************************************************************************
 * @module pdf/pdf.ts-test/util
 * @license Apache-2.0
 ******************************************************************************/
import type { TestFilter, TestTask } from "./alias.js";
/**
 * `tasks` could be modified IN PLACE, although remaining elements will be kept
 * intact.
 * @const @param filter
 */
export declare const filter_tasks: <T extends TestTask>(tasks: T[], filter: TestFilter) => T[];
//# sourceMappingURL=util.d.ts.map