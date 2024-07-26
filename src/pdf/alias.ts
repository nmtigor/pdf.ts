/** 80**************************************************************************
 * @module pdf/alias
 * @license Apache-2.0
 ******************************************************************************/

import { DENO, TESTING } from "@fe-src/global.ts";
import type { OptionalContentConfigData } from "./pdf.ts-src/core/catalog.ts";
import type { MetadataEx } from "./pdf.ts-src/display/api.ts";
import type { AnnotActions, FieldObject } from "./pdf.ts-src/pdf.ts";
/*80--------------------------------------------------------------------------*/

//kkkk TOCLEANUP
// export const D_res = "res/pdf";
// export const D_external = `${D_res}/pdf.ts-external`;
// export const D_test_pdfs = `${D_res}/test/pdfs`;
// export const D_test_images = `${D_res}/test/images`;
// export const D_cmap_url = `${D_external}/bcmaps`;
// export const D_standard_font_data_url = `${D_external}/standard_fonts`;
// export const D_web = `${D_res}/pdf.ts-web`;
/*80--------------------------------------------------------------------------*/

export type FieldObjectsPromise = Promise<
  | boolean
  | Record<string, FieldObject[]>
  | MetadataEx
  | AnnotActions
  | OptionalContentConfigData
  | undefined
>;
/*80--------------------------------------------------------------------------*/

/**
 * When push to https://github.com/nmtigor/pdf.ts/tree/github-pages, and visit
 * https://nmtigor.github.io/pdf.ts/ using GitHub Pages, this MUST be changed to
 * "/pdf.ts"!
 */
export const AD_gh = "/pdf.ts";
/*80--------------------------------------------------------------------------*/
