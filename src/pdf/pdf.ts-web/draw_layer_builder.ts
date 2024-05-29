/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2023
 *
 * @module pdf/pdf.ts-web/draw_layer_builder.ts
 * @license Apache-2.0
 ******************************************************************************/

/* Copyright 2022 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { uint } from "@fe-lib/alias.ts";
import { DrawLayer, type Intent } from "../pdf.ts-src/pdf.ts";
/*80--------------------------------------------------------------------------*/

type DrawLayerBuilderOptions = {
  pageIndex: uint;
  drawLayer?: DrawLayer;
};

export class DrawLayerBuilder {
  pageIndex;
  _cancelled?: boolean;

  #drawLayer: DrawLayer | undefined;
  getDrawLayer() {
    return this.#drawLayer;
  }

  constructor(options: DrawLayerBuilderOptions) {
    this.pageIndex = options.pageIndex;
  }

  async render(intent: Intent = "display") {
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

  setParent(parent: HTMLDivElement) {
    this.#drawLayer?.setParent(parent);
  }
}
/*80--------------------------------------------------------------------------*/
