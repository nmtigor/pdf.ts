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

import type { dot2d_t } from "@fe-lib/alias.ts";
import type { Box, Outlines } from "../../alias.ts";
/*80--------------------------------------------------------------------------*/

type Edge_ = [number, number, number];
type Edge_b_ = [...Edge_, boolean];
type Edge_1_ = [...Edge_, Edge_?];
type Edge_2_ = [...Edge_, Edge_1_?];

export class Outliner {
  #box;
  #verticalEdges: Edge_b_[] = [];
  #intervals: [start: number, end: number][] = [];

  /**
   * Construct an outliner.
   * @param boxes An array of axis-aligned rectangles.
   * @param borderWidth The width of the border of the boxes, it
   *   allows to make the boxes bigger (or smaller).
   * @param innerMargin The margin between the boxes and the
   *   outlines. It's important to not have a null innerMargin when we want to
   *   draw the outline else the stroked outline could be clipped because of its
   *   width.
   * @param isLTR true if we're in LTR mode. It's used to determine
   *   the last point of the boxes.
   */
  constructor(boxes: Box[], borderWidth = 0, innerMargin = 0, isLTR = true) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    // We round the coordinates to slightly reduce the number of edges in the
    // final outlines.
    const NUMBER_OF_DIGITS = 4;
    const EPSILON = 10 ** -NUMBER_OF_DIGITS;

    // The coordinates of the boxes are in the page coordinate system.
    for (const { x, y, width, height } of boxes) {
      const x1 = Math.floor((x - borderWidth) / EPSILON) * EPSILON;
      const x2 = Math.ceil((x + width + borderWidth) / EPSILON) * EPSILON;
      const y1 = Math.floor((y - borderWidth) / EPSILON) * EPSILON;
      const y2 = Math.ceil((y + height + borderWidth) / EPSILON) * EPSILON;
      const left: Edge_b_ = [x1, y1, y2, true];
      const right: Edge_b_ = [x2, y1, y2, false];
      this.#verticalEdges.push(left, right);

      minX = Math.min(minX, x1);
      maxX = Math.max(maxX, x2);
      minY = Math.min(minY, y1);
      maxY = Math.max(maxY, y2);
    }

    const bboxWidth = maxX - minX + 2 * innerMargin;
    const bboxHeight = maxY - minY + 2 * innerMargin;
    const shiftedMinX = minX - innerMargin;
    const shiftedMinY = minY - innerMargin;
    const lastEdge = this.#verticalEdges.at(isLTR ? -1 : -2)!;
    const lastPoint = [lastEdge[0], lastEdge[2]];

    // Convert the coordinates of the edges into box coordinates.
    for (const edge of this.#verticalEdges) {
      const [x, y1, y2] = edge;
      edge[0] = (x - shiftedMinX) / bboxWidth;
      edge[1] = (y1 - shiftedMinY) / bboxHeight;
      edge[2] = (y2 - shiftedMinY) / bboxHeight;
    }

    this.#box = {
      x: shiftedMinX,
      y: shiftedMinY,
      width: bboxWidth,
      height: bboxHeight,
      lastPoint,
    };
  }

  getOutlines() {
    // We begin to sort lexicographically the vertical edges by their abscissa,
    // and then by their ordinate.
    this.#verticalEdges.sort(
      (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2],
    );

    // We're now using a sweep line algorithm to find the outlines.
    // We start with the leftmost vertical edge, and we're going to iterate
    // over all the vertical edges from left to right.
    // Each time we encounter a left edge, we're going to insert the interval
    // [y1, y2] in the set of intervals.
    // This set of intervals is used to break the vertical edges into chunks:
    // we only take the part of the vertical edge that isn't in the union of
    // the intervals.
    const outlineVerticalEdges = [];
    for (const edge of this.#verticalEdges) {
      if (edge[3]) {
        // Left edge.
        outlineVerticalEdges.push(...this.#breakEdge(edge));
        this.#insert(edge);
      } else {
        // Right edge.
        this.#remove(edge);
        outlineVerticalEdges.push(...this.#breakEdge(edge));
      }
    }
    return this.#getOutlines(outlineVerticalEdges);
  }

  #getOutlines(outlineVerticalEdges: Edge_[]): Outlines {
    const edges: [number, number, Edge_][] = [];
    const allEdges = new Set<Edge_1_ | Edge_2_>();

    for (const edge of outlineVerticalEdges) {
      const [x, y1, y2] = edge;
      edges.push([x, y1, edge], [x, y2, edge]);
    }

    // We sort lexicographically the vertices of each edge by their ordinate and
    // by their abscissa.
    // Every pair (v_2i, v_{2i + 1}) of vertices defines a horizontal edge.
    // So for every vertical edge, we're going to add the two vertical edges
    // which are connected to it through a horizontal edge.
    edges.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    for (let i = 0, ii = edges.length; i < ii; i += 2) {
      const edge1: Edge_1_ = edges[i][2];
      const edge2: Edge_2_ = edges[i + 1][2];
      edge1.push(edge2 as Edge_);
      edge2.push(edge1);
      allEdges.add(edge1);
      allEdges.add(edge2);
    }
    const outlines: dot2d_t[] = [];
    let outline: dot2d_t;

    while (allEdges.size > 0) {
      const edge = allEdges.values().next().value;
      let [x, y1, y2, edge1, edge2] = edge;
      allEdges.delete(edge);
      let lastPointX = x;
      let lastPointY = y1;

      outline = [x, y2];
      outlines.push(outline);

      while (true) {
        let e;
        if (allEdges.has(edge1)) {
          e = edge1;
        } else if (allEdges.has(edge2)) {
          e = edge2;
        } else {
          break;
        }

        allEdges.delete(e);
        [x, y1, y2, edge1, edge2] = e;

        if (lastPointX !== x) {
          outline.push(lastPointX, lastPointY, x, lastPointY === y1 ? y1 : y2);
          lastPointX = x;
        }
        lastPointY = lastPointY === y1 ? y2 : y1;
      }
      outline.push(lastPointX, lastPointY);
    }
    return { outlines, box: this.#box };
  }

  #binarySearch(y: number) {
    const array = this.#intervals;
    let start = 0;
    let end = array.length - 1;

    while (start <= end) {
      const middle = (start + end) >> 1;
      const y1 = array[middle][0];
      if (y1 === y) {
        return middle;
      }
      if (y1 < y) {
        start = middle + 1;
      } else {
        end = middle - 1;
      }
    }
    return end + 1;
  }

  #insert([, y1, y2]: Edge_b_) {
    const index = this.#binarySearch(y1);
    this.#intervals.splice(index, 0, [y1, y2]);
  }

  #remove([, y1, y2]: Edge_b_) {
    const index = this.#binarySearch(y1);
    for (let i = index; i < this.#intervals.length; i++) {
      const [start, end] = this.#intervals[i];
      if (start !== y1) {
        break;
      }
      if (start === y1 && end === y2) {
        this.#intervals.splice(i, 1);
        return;
      }
    }
    for (let i = index - 1; i >= 0; i--) {
      const [start, end] = this.#intervals[i];
      if (start !== y1) {
        break;
      }
      if (start === y1 && end === y2) {
        this.#intervals.splice(i, 1);
        return;
      }
    }
  }

  #breakEdge(edge: Edge_b_): Edge_[] {
    const [x, y1, y2] = edge;
    const results: Edge_[] = [[x, y1, y2]];
    const index = this.#binarySearch(y2);
    for (let i = 0; i < index; i++) {
      const [start, end] = this.#intervals[i];
      for (let j = 0, jj = results.length; j < jj; j++) {
        const [, y3, y4] = results[j];
        if (end <= y3 || y4 <= start) {
          // There is no intersection between the interval and the edge, hence
          // we keep it as is.
          continue;
        }
        if (y3 >= start) {
          if (y4 > end) {
            results[j][1] = end;
          } else {
            if (jj === 1) {
              return [];
            }
            // The edge is included in the interval, hence we remove it.
            results.splice(j, 1);
            j--;
            jj--;
          }
          continue;
        }
        results[j][2] = start;
        if (y4 > end) {
          results.push([x, end, y4]);
        }
      }
    }
    return results;
  }
}
/*80--------------------------------------------------------------------------*/
