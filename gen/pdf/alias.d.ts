/** 80**************************************************************************
 * @module pdf/alias
 * @license Apache-2.0
 ******************************************************************************/
import type { OptionalContentConfigData } from "./pdf.ts-src/core/catalog.js";
import type { MetadataEx } from "./pdf.ts-src/display/api.js";
import type { AnnotActions, FieldObject } from "./pdf.ts-src/pdf.js";
export type FieldObjectsPromise = Promise<boolean | Record<string, FieldObject[]> | MetadataEx | AnnotActions | OptionalContentConfigData | undefined>;
/**
 * When push to https://github.com/nmtigor/pdf.ts/tree/github-pages, and visit
 * https://nmtigor.github.io/pdf.ts/ using GitHub Pages to , this must be
 * changed to "/pdf.ts"!
 */
export declare const AD_gh = "/pdf.ts";
//# sourceMappingURL=alias.d.ts.map