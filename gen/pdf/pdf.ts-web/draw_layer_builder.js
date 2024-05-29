/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2023
 *
 * @module pdf/pdf.ts-web/draw_layer_builder.ts
 * @license Apache-2.0
 ******************************************************************************/
import { DrawLayer } from "../pdf.ts-src/pdf.js";
export class DrawLayerBuilder {
    pageIndex;
    _cancelled;
    #drawLayer;
    getDrawLayer() {
        return this.#drawLayer;
    }
    constructor(options) {
        this.pageIndex = options.pageIndex;
    }
    async render(intent = "display") {
        if (intent !== "display" || this.#drawLayer || this._cancelled) {
            return;
        }
        this.#drawLayer = new DrawLayer({
            pageIndex: this.pageIndex,
        });
    }
    cancel() {
        this._cancelled = true;
        if (!this.#drawLayer) {
            return;
        }
        this.#drawLayer.destroy();
        this.#drawLayer = undefined;
    }
    setParent(parent) {
        this.#drawLayer?.setParent(parent);
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=draw_layer_builder.js.map