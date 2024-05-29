/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/draw_layer.ts
 * @license Apache-2.0
 ******************************************************************************/

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

import type { id_t, Ratio, uint } from "@fe-lib/alias.ts";
import type { Cssc } from "@fe-lib/color/alias.ts";
import { svg as createSVG } from "@fe-lib/dom.ts";
import type { Box } from "../alias.ts";
import { shadow } from "../shared/util.ts";
import { DOMSVGFactory } from "./display_utils.ts";
import type {
  FreeHighlightOutline,
  HighlightOutline,
  Outline,
} from "./editor/outliner.ts";

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
  #mapping = new Map<id_t, SVGSVGElement>();
  #toUpdate = new Map<id_t, SVGPathElement>();

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

  static #setBox(
    element: SVGElement,
    { x = 0, y = 0, width = 1, height = 1 } = {} as Box,
  ) {
    const { style } = element;
    style.top = `${100 * y}%`;
    style.left = `${100 * x}%`;
    style.width = `${100 * width}%`;
    style.height = `${100 * height}%`;
  }

  #createSVG(box: Box) {
    const svg = DrawLayer._svgFactory.create(1, 1, /* skipDimensions = */ true);
    this.#parent!.append(svg);
    svg.setAttribute("aria-hidden", true as any);
    DrawLayer.#setBox(svg, box);

    return svg;
  }

  #createClipPath(defs: SVGElement, pathId: string): string {
    const clipPath = createSVG("clipPath");
    defs.append(clipPath);
    const clipPathId = `clip_${pathId}`;
    clipPath.assignAttro({
      id: clipPathId,
      clipPathUnits: "objectBoundingBox",
    });
    const clipPathUse = createSVG("use");
    clipPath.append(clipPathUse);
    clipPathUse.setAttribute("href", `#${pathId}`);
    clipPathUse.classList.add("clip");

    return clipPathId;
  }

  highlight(
    outlines: Outline,
    color: Cssc,
    opacity: Ratio,
    isPathUpdatable = false,
  ) {
    const id = this.#id++;
    const root = this.#createSVG(outlines.box!);
    root.classList.add("highlight");
    if (outlines.free) {
      root.classList.add("free");
    }
    const defs = createSVG("defs");
    root.append(defs);
    const path = createSVG("path");
    defs.append(path);
    const pathId = `path_p${this.pageIndex}_${id}`;
    path.assignAttro({
      id: pathId,
      d: outlines.toSVGPath(),
    });

    if (isPathUpdatable) {
      this.#toUpdate.set(id, path);
    }

    // Create the clipping path for the editor div.
    const clipPathId = this.#createClipPath(defs, pathId);

    const use = createSVG("use");
    root.append(use);
    root.assignAttro({
      fill: color,
      "fill-opacity": opacity,
    });
    use.setAttribute("href", `#${pathId}`);

    this.#mapping.set(id, root);

    return { id, clipPathId: `url(#${clipPathId})` };
  }

  highlightOutline(outlines: Outline): id_t {
    // We cannot draw the outline directly in the SVG for highlights because
    // it composes with its parent with mix-blend-mode: multiply.
    // But the outline has a different mix-blend-mode, so we need to draw it in
    // its own SVG.
    const id = this.#id++;
    const root = this.#createSVG(outlines.box!);
    root.classList.add("highlightOutline");
    const defs = createSVG("defs");
    root.append(defs);
    const path = createSVG("path");
    defs.append(path);
    const pathId = `path_p${this.pageIndex}_${id}`;
    path.assignAttro({
      id: pathId,
      d: outlines.toSVGPath(),
      "vector-effect": "non-scaling-stroke",
    });

    let maskId;
    if (outlines.free) {
      root.classList.add("free");
      const mask = createSVG("mask");
      defs.append(mask);
      maskId = `mask_p${this.pageIndex}_${id}`;
      mask.assignAttro({
        id: maskId,
        "maskUnits": "objectBoundingBox",
      });
      const rect = createSVG("rect");
      mask.append(rect);
      rect.assignAttro({
        width: "1",
        height: "1",
        fill: "white",
      });
      const use = createSVG("use");
      mask.append(use);
      use.assignAttro({
        href: `#${pathId}`,
        stroke: "none",
        fill: "black",
        "fill-rule": "nonzero",
      });
      use.classList.add("mask");
    }

    const use1 = createSVG("use");
    root.append(use1);
    use1.setAttribute("href", `#${pathId}`);
    if (maskId) {
      use1.setAttribute("mask", `url(#${maskId})`);
    }
    const use2 = use1.cloneNode() as typeof use1;
    root.append(use2);
    use1.classList.add("mainOutline");
    use2.classList.add("secondaryOutline");

    this.#mapping.set(id, root);

    return id;
  }

  finalizeLine(id: id_t, line: HighlightOutline) {
    const path = this.#toUpdate.get(id)!;
    this.#toUpdate.delete(id);
    this.updateBox(id, line.box);
    path.setAttribute("d", line.toSVGPath());
  }

  updateLine(id: id_t, line: HighlightOutline) {
    const root = this.#mapping.get(id)!;
    const defs = root.firstChild!;
    const path = defs.firstChild;
    (path as Element).setAttribute("d", line.toSVGPath());
  }

  removeFreeHighlight(id: id_t) {
    this.remove(id);
    this.#toUpdate.delete(id);
  }

  updatePath(id: id_t, line: FreeHighlightOutline) {
    this.#toUpdate.get(id)!.setAttribute("d", line.toSVGPath());
  }

  //kkkk TOCLEANUP
  // static #extractPathFromHighlightOutlines(polygons: dot2d_t[]) {
  //   const buffer = [];
  //   for (const polygon of polygons) {
  //     let [prevX, prevY] = polygon;
  //     buffer.push(`M${prevX} ${prevY}`);
  //     for (let i = 2; i < polygon.length; i += 2) {
  //       const x = polygon[i];
  //       const y = polygon[i + 1];
  //       if (x === prevX) {
  //         buffer.push(`V${y}`);
  //         prevY = y;
  //       } else if (y === prevY) {
  //         buffer.push(`H${x}`);
  //         prevX = x;
  //       }
  //     }
  //     buffer.push("Z");
  //   }
  //   return buffer.join(" ");
  // }

  updateBox(id: id_t, box: Box) {
    DrawLayer.#setBox(this.#mapping.get(id)!, box);
  }

  show(id: id_t, visible?: boolean) {
    this.#mapping.get(id)!.classList.toggle("hidden", !visible);
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
    if (this.#parent === undefined) {
      return;
    }
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
