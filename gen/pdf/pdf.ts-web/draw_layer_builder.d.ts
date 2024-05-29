/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2023
 *
 * @module pdf/pdf.ts-web/draw_layer_builder.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { uint } from "../../lib/alias.js";
import { DrawLayer, type Intent } from "../pdf.ts-src/pdf.js";
type DrawLayerBuilderOptions = {
    pageIndex: uint;
    drawLayer?: DrawLayer;
};
export declare class DrawLayerBuilder {
    #private;
    pageIndex: number;
    _cancelled?: boolean;
    getDrawLayer(): DrawLayer | undefined;
    constructor(options: DrawLayerBuilderOptions);
    render(intent?: Intent): Promise<void>;
    cancel(): void;
    setParent(parent: HTMLDivElement): void;
}
export {};
//# sourceMappingURL=draw_layer_builder.d.ts.map