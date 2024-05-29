/** 80**************************************************************************
 * @module pdf/alias
 * @license Apache-2.0
 ******************************************************************************/
import type { OptionalContentConfigData } from "./pdf.ts-src/core/catalog.js";
import type { MetadataEx } from "./pdf.ts-src/display/api.js";
import type { AnnotActions, FieldObject } from "./pdf.ts-src/pdf.js";
export declare const D_res = "res/pdf";
export declare const D_external = "res/pdf/pdf.ts-external";
export declare const D_test_pdfs = "res/pdf/test/pdfs";
export declare const D_test_images = "res/pdf/test/images";
export declare const D_cmap_url = "res/pdf/pdf.ts-external/bcmaps";
export declare const D_standard_font_data_url = "res/pdf/pdf.ts-external/standard_fonts";
export declare const D_web = "res/pdf/pdf.ts-web";
export type FieldObjectsPromise = Promise<boolean | Record<string, FieldObject[]> | MetadataEx | AnnotActions | OptionalContentConfigData | undefined>;
export declare const AD_gh = "/pdf.ts";
//# sourceMappingURL=alias.d.ts.map