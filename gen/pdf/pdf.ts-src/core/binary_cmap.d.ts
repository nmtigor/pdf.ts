/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2023
 *
 * @module pdf/pdf.ts-src/core/binary_cmap.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { CMap } from "./cmap.js";
export declare class BinaryCMapReader {
    process(data: Uint8Array, cMap: CMap, extend: (useCMap: string) => Promise<CMap>): Promise<CMap>;
}
//# sourceMappingURL=binary_cmap.d.ts.map