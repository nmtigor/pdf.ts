/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/draw_layer.ts
 * @license Apache-2.0
 ******************************************************************************/
var _a;
import { svg as createSVG } from "../../../lib/dom.js";
import { shadow } from "../shared/util.js";
import { DOMSVGFactory } from "./display_utils.js";
/*80--------------------------------------------------------------------------*/
/**
 * Manage the SVGs drawn on top of the page canvas.
 * It's important to have them directly on top of the canvas because we want to
 * be able to use mix-blend-mode for some of them.
 */
export class DrawLayer {
    pageIndex;
    #parent;
    #id = 0;
    #mapping = new Map();
    #toUpdate = new Map();
    constructor({ pageIndex }) {
        this.pageIndex = pageIndex;
    }
    setParent(parent) {
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
    static #setBox(element, { x = 0, y = 0, width = 1, height = 1 } = {}) {
        const { style } = element;
        style.top = `${100 * y}%`;
        style.left = `${100 * x}%`;
        style.width = `${100 * width}%`;
        style.height = `${100 * height}%`;
    }
    #createSVG(box) {
        const svg = _a._svgFactory.create(1, 1, /* skipDimensions = */ true);
        this.#parent.append(svg);
        svg.setAttribute("aria-hidden", true);
        _a.#setBox(svg, box);
        return svg;
    }
    #createClipPath(defs, pathId) {
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
    highlight(outlines, color, opacity, isPathUpdatable = false) {
        const id = this.#id++;
        const root = this.#createSVG(outlines.box);
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
    highlightOutline(outlines) {
        // We cannot draw the outline directly in the SVG for highlights because
        // it composes with its parent with mix-blend-mode: multiply.
        // But the outline has a different mix-blend-mode, so we need to draw it in
        // its own SVG.
        const id = this.#id++;
        const root = this.#createSVG(outlines.box);
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
        const use2 = use1.cloneNode();
        root.append(use2);
        use1.classList.add("mainOutline");
        use2.classList.add("secondaryOutline");
        this.#mapping.set(id, root);
        return id;
    }
    finalizeLine(id, line) {
        const path = this.#toUpdate.get(id);
        this.#toUpdate.delete(id);
        this.updateBox(id, line.box);
        path.setAttribute("d", line.toSVGPath());
    }
    updateLine(id, line) {
        const root = this.#mapping.get(id);
        const defs = root.firstChild;
        const path = defs.firstChild;
        path.setAttribute("d", line.toSVGPath());
    }
    removeFreeHighlight(id) {
        this.remove(id);
        this.#toUpdate.delete(id);
    }
    updatePath(id, line) {
        this.#toUpdate.get(id).setAttribute("d", line.toSVGPath());
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
    updateBox(id, box) {
        _a.#setBox(this.#mapping.get(id), box);
    }
    show(id, visible) {
        this.#mapping.get(id).classList.toggle("hidden", !visible);
    }
    rotate(id, angle) {
        this.#mapping.get(id).setAttribute("data-main-rotation", angle);
    }
    changeColor(id, color) {
        this.#mapping.get(id).setAttribute("fill", color);
    }
    changeOpacity(id, opacity) {
        this.#mapping.get(id).setAttribute("fill-opacity", opacity);
    }
    addClass(id, className) {
        this.#mapping.get(id).classList.add(className);
    }
    removeClass(id, className) {
        this.#mapping.get(id).classList.remove(className);
    }
    remove(id) {
        if (this.#parent === undefined) {
            return;
        }
        this.#mapping.get(id).remove();
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
_a = DrawLayer;
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=draw_layer.js.map