/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2023
 */

/* Copyright 2023 Mozilla Foundation
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

import type { dot2d_t, id_t, Ratio, uint } from "@fe-lib/alias.ts";
import type { Cssc } from "@fe-lib/color/alias.ts";
import { shadow } from "../shared/util.ts";
import { DOMSVGFactory } from "./display_utils.ts";
import type { Box, Outlines } from "../alias.ts";
/*80--------------------------------------------------------------------------*/

/**
 * Manage the SVGs drawn on top of the page canvas.
 * It's important to have them directly on top of the canvas because we want to
 * be able to use mix-blend-mode for some of them.
 */
export class DrawLayer {
  pageIndex;

  #parent: Element | undefined;
  #id: id_t = 0;
  #mapping = new Map<id_t, SVGElement>();

  constructor({ pageIndex }: { pageIndex: uint }) {
    this.pageIndex = pageIndex;
  }

  setParent(parent: Element) {
    if (!this.#parent) {
      this.#parent = parent;
      return;
    }

    if (this.#parent !== parent) {
      if (this.#mapping.size > 0) {
        for (const root of this.#mapping.values()) {
          root.remove();
          parent.append(root);
        }
      }
      this.#parent = parent;
    }
  }

  static get _svgFactory() {
    return shadow(this, "_svgFactory", new DOMSVGFactory());
  }

  static #setBox(element: SVGElement, { x, y, width, height }: Box) {
    const { style } = element;
    style.top = `${100 * y}%`;
    style.left = `${100 * x}%`;
    style.width = `${100 * width}%`;
    style.height = `${100 * height}%`;
  }

  #createSVG(box: Box) {
    const svg = DrawLayer._svgFactory.create(1, 1, /* skipDimensions = */ true);
    this.#parent!.append(svg);
    DrawLayer.#setBox(svg, box);

    return svg;
  }

  highlight({ outlines, box }: Outlines, color: Cssc, opacity: Ratio) {
    const id = this.#id++;
    const root = this.#createSVG(box);
    root.classList.add("highlight");
    const defs = DrawLayer._svgFactory.createElement("defs");
    root.append(defs);
    const path = DrawLayer._svgFactory.createElement("path");
    defs.append(path);
    const pathId = `path_p${this.pageIndex}_${id}`;
    path.assignAttro({
      id: pathId,
      d: DrawLayer.#extractPathFromHighlightOutlines(outlines),
    });

    // Create the clipping path for the editor div.
    const clipPath = DrawLayer._svgFactory.createElement("clipPath");
    defs.append(clipPath);
    const clipPathId = `clip_${pathId}`;
    clipPath.setAttribute("id", clipPathId);
    clipPath.setAttribute("clipPathUnits", "objectBoundingBox");
    const clipPathUse = DrawLayer._svgFactory.createElement("use");
    clipPath.append(clipPathUse);
    clipPathUse.setAttribute("href", `#${pathId}`);
    clipPathUse.classList.add("clip");

    const use = DrawLayer._svgFactory.createElement("use");
    root.append(use);
    root.assignAttro({
      fill: color,
      "fill-opacity": opacity,
    });
    use.setAttribute("href", `#${pathId}`);

    this.#mapping.set(id, root);

    return { id, clipPathId: `url(#${clipPathId})` };
  }

  highlightOutline({ outlines, box }: Outlines) {
    // We cannot draw the outline directly in the SVG for highlights because
    // it composes with its parent with mix-blend-mode: multiply.
    // But the outline has a different mix-blend-mode, so we need to draw it in
    // its own SVG.
    const id = this.#id++;
    const root = this.#createSVG(box);
    root.classList.add("highlightOutline");
    const defs = DrawLayer._svgFactory.createElement("defs");
    root.append(defs);
    const path = DrawLayer._svgFactory.createElement("path");
    defs.append(path);
    const pathId = `path_p${this.pageIndex}_${id}`;
    path.assignAttro({
      id: pathId,
      d: DrawLayer.#extractPathFromHighlightOutlines(outlines),
      "vector-effect": "non-scaling-stroke",
    });

    const use1 = DrawLayer._svgFactory.createElement("use");
    root.append(use1);
    use1.setAttribute("href", `#${pathId}`);
    const use2 = use1.cloneNode() as typeof use1;
    root.append(use2);
    use1.classList.add("mainOutline");
    use2.classList.add("secondaryOutline");

    this.#mapping.set(id, root);

    return id;
  }

  static #extractPathFromHighlightOutlines(polygons: dot2d_t[]) {
    const buffer = [];
    for (const polygon of polygons) {
      let [prevX, prevY] = polygon;
      buffer.push(`M${prevX} ${prevY}`);
      for (let i = 2; i < polygon.length; i += 2) {
        const x = polygon[i];
        const y = polygon[i + 1];
        if (x === prevX) {
          buffer.push(`V${y}`);
          prevY = y;
        } else if (y === prevY) {
          buffer.push(`H${x}`);
          prevX = x;
        }
      }
      buffer.push("Z");
    }
    return buffer.join(" ");
  }

  updateBox(id: id_t, box: Box) {
    DrawLayer.#setBox(this.#mapping.get(id)!, box);
  }

  rotate(id: id_t, angle: number) {
    this.#mapping.get(id)!.setAttribute("data-main-rotation", angle as any);
  }

  changeColor(id: id_t, color: Cssc) {
    this.#mapping.get(id)!.setAttribute("fill", color);
  }

  changeOpacity(id: id_t, opacity: Ratio) {
    this.#mapping.get(id)!.setAttribute("fill-opacity", opacity as any);
  }

  addClass(id: id_t, className: string) {
    this.#mapping.get(id)!.classList.add(className);
  }

  removeClass(id: id_t, className: string) {
    this.#mapping.get(id)!.classList.remove(className);
  }

  remove(id: id_t) {
    this.#mapping.get(id)!.remove();
    this.#mapping.delete(id);
  }

  destroy() {
    this.#parent = undefined;
    for (const root of this.#mapping.values()) {
      root.remove();
    }
    this.#mapping.clear();
  }
}
/*80--------------------------------------------------------------------------*/
