/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

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

import { fitCurve } from "../../../../3rd/fit-curve/fit-curve.ts";
import { TupleOf } from "../../../../lib/alias.ts";
import { html } from "../../../../lib/dom.ts";
import { IL10n } from "../../../pdf.ts-web/interfaces.ts";
import {
  AnnotationEditorParamsType,
  AnnotationEditorType,
  point_t,
  Util,
} from "../../shared/util.ts";
import { AnnotationEditorLayer } from "./annotation_editor_layer.ts";
import {
  AnnotationEditor,
  AnnotationEditorP,
  AnnotationEditorSerialized,
  PropertyToUpdate,
} from "./editor.ts";
import { opacityToHex } from "./tools.ts";
/*80--------------------------------------------------------------------------*/

// The dimensions of the resizer is 15x15:
// https://searchfox.org/mozilla-central/rev/1ce190047b9556c3c10ab4de70a0e61d893e2954/toolkit/content/minimal-xul.css#136-137
// so each dimension must be greater than RESIZER_SIZE.
const RESIZER_SIZE = 16;

export interface InkEditorP extends AnnotationEditorP {
  name: "inkEditor";
  color?: string;
  thickness?: number;
  opacity?: number;
}

type _curve_t = TupleOf<point_t, 4>;

export interface InkEditorSerialized extends AnnotationEditorSerialized {
  thickness: number;
  opacity: number;
  paths: {
    bezier: number[];
    points: number[];
  }[];
}

/**
 * Basic draw editor in order to generate an Ink annotation.
 */
export class InkEditor extends AnnotationEditor {
  static _defaultColor: string | undefined;
  static _defaultOpacity = 1;
  static _defaultThickness = 1;
  static _l10nPromise: Map<string, Promise<string>>;

  #aspectRatio = 0;
  #baseHeight = 0;
  #baseWidth = 0;
  #boundCanvasPointermove = this.canvasPointermove.bind(this);
  #boundCanvasPointerleave = this.canvasPointerleave.bind(this);
  #boundCanvasPointerup = this.canvasPointerup.bind(this);
  #boundCanvasPointerdown = this.canvasPointerdown.bind(this);
  #disableEditing = false;
  #isCanvasInitialized = false;
  #lastPoint: point_t | undefined;
  #observer: ResizeObserver | undefined;
  #realWidth = 0;
  #realHeight = 0;
  #requestFrameCallback: (() => void) | undefined;

  color;
  thickness;
  opacity;
  paths: _curve_t[][] = [];
  bezierPath2D: Path2D[] = [];
  currentPath: point_t[] = [];
  scaleFactor = 1;
  translationX = 0;
  translationY = 0;

  canvas: HTMLCanvasElement | undefined;
  ctx!: CanvasRenderingContext2D;

  constructor(params: InkEditorP) {
    super({ ...params, name: "inkEditor" });
    this.color = params.color || undefined;
    this.thickness = params.thickness || undefined;
    this.opacity = params.opacity || undefined;
  }

  static initialize(l10n: IL10n) {
    this._l10nPromise = new Map(
      ["editor_ink_canvas_aria_label", "editor_ink_aria_label"].map((str) => [
        str,
        l10n.get(str),
      ]),
    );
  }

  static updateDefaultParams(
    type: AnnotationEditorParamsType,
    value: number | string,
  ) {
    switch (type) {
      case AnnotationEditorParamsType.INK_THICKNESS:
        InkEditor._defaultThickness = +value;
        break;
      case AnnotationEditorParamsType.INK_COLOR:
        InkEditor._defaultColor = <string> value;
        break;
      case AnnotationEditorParamsType.INK_OPACITY:
        InkEditor._defaultOpacity = +value / 100;
        break;
    }
  }

  /** @inheritdoc */
  override updateParams(
    type: AnnotationEditorParamsType,
    value: number | string,
  ) {
    switch (type) {
      case AnnotationEditorParamsType.INK_THICKNESS:
        this.#updateThickness(+value);
        break;
      case AnnotationEditorParamsType.INK_COLOR:
        this.#updateColor(<string> value);
        break;
      case AnnotationEditorParamsType.INK_OPACITY:
        this.#updateOpacity(+value);
        break;
    }
  }

  static get defaultPropertiesToUpdate() {
    return [
      [AnnotationEditorParamsType.INK_THICKNESS, InkEditor._defaultThickness],
      [
        AnnotationEditorParamsType.INK_COLOR,
        InkEditor._defaultColor || AnnotationEditor._defaultLineColor,
      ],
      [
        AnnotationEditorParamsType.INK_OPACITY,
        Math.round(InkEditor._defaultOpacity * 100),
      ],
    ] as PropertyToUpdate[];
  }

  /** @inheritdoc */
  override get propertiesToUpdate() {
    return [
      [
        AnnotationEditorParamsType.INK_THICKNESS,
        this.thickness || InkEditor._defaultThickness,
      ],
      [
        AnnotationEditorParamsType.INK_COLOR,
        this.color ||
        InkEditor._defaultColor ||
        AnnotationEditor._defaultLineColor,
      ],
      [
        AnnotationEditorParamsType.INK_OPACITY,
        Math.round(100 * (this.opacity ?? InkEditor._defaultOpacity)),
      ],
    ] as PropertyToUpdate[];
  }

  /**
   * Update the thickness and make this action undoable.
   */
  #updateThickness(thickness: number) {
    const savedThickness = this.thickness;
    this.parent.addCommands({
      cmd: () => {
        this.thickness = thickness;
        this.#fitToContent();
      },
      undo: () => {
        this.thickness = savedThickness;
        this.#fitToContent();
      },
      mustExec: true,
      type: AnnotationEditorParamsType.INK_THICKNESS,
      overwriteIfSameType: true,
      keepUndo: true,
    });
  }

  /**
   * Update the color and make this action undoable.
   */
  #updateColor(color: string) {
    const savedColor = this.color;
    this.parent.addCommands({
      cmd: () => {
        this.color = color;
        this.#redraw();
      },
      undo: () => {
        this.color = savedColor;
        this.#redraw();
      },
      mustExec: true,
      type: AnnotationEditorParamsType.INK_COLOR,
      overwriteIfSameType: true,
      keepUndo: true,
    });
  }

  /**
   * Update the opacity and make this action undoable.
   */
  #updateOpacity(opacity: number) {
    opacity /= 100;
    const savedOpacity = this.opacity;
    this.parent.addCommands({
      cmd: () => {
        this.opacity = opacity;
        this.#redraw();
      },
      undo: () => {
        this.opacity = savedOpacity;
        this.#redraw();
      },
      mustExec: true,
      type: AnnotationEditorParamsType.INK_OPACITY,
      overwriteIfSameType: true,
      keepUndo: true,
    });
  }

  /** @inheritdoc */
  override rebuild() {
    super.rebuild();
    if (this.div === undefined) {
      return;
    }

    if (!this.canvas) {
      this.#createCanvas();
      this.#createObserver();
    }

    if (!this.isAttachedToDOM) {
      // At some point this editor was removed and we're rebuilding it,
      // hence we must add it to its parent.
      this.parent.add(this);
      this.#setCanvasDims();
    }
    this.#fitToContent();
  }

  /** @inheritdoc */
  override remove() {
    if (this.canvas === undefined) {
      return;
    }

    if (!this.isEmpty()) {
      this.commit();
    }

    // Destroy the canvas.
    this.canvas.width = this.canvas.height = 0;
    this.canvas.remove();
    this.canvas = undefined;

    this.#observer!.disconnect();
    this.#observer = undefined;

    super.remove();
  }

  /** @inheritdoc */
  override enableEditMode() {
    if (this.#disableEditing || this.canvas === undefined) {
      return;
    }

    super.enableEditMode();
    this.div!.draggable = false;
    this.canvas.addEventListener("pointerdown", this.#boundCanvasPointerdown);
    this.canvas.addEventListener("pointerup", this.#boundCanvasPointerup);
  }

  /** @inheritdoc */
  override disableEditMode() {
    if (!this.isInEditMode() || this.canvas === undefined) {
      return;
    }

    super.disableEditMode();
    this.div!.draggable = !this.isEmpty();
    this.div!.classList.remove("editing");

    this.canvas.removeEventListener(
      "pointerdown",
      this.#boundCanvasPointerdown,
    );
    this.canvas.removeEventListener("pointerup", this.#boundCanvasPointerup);
  }

  /** @inheritdoc */
  override onceAdded() {
    this.div!.draggable = !this.isEmpty();
  }

  /** @inheritdoc */
  override isEmpty() {
    return (
      this.paths.length === 0 ||
      (this.paths.length === 1 && this.paths[0].length === 0)
    );
  }

  #getInitialBBox() {
    const { width, height, rotation } = this.parent.viewport;
    switch (rotation) {
      case 90:
        return [0, width, width, height];
      case 180:
        return [width, height, width, height];
      case 270:
        return [height, 0, width, height];
      default:
        return [0, 0, width, height];
    }
  }

  /**
   * Set line styles.
   */
  #setStroke() {
    this.ctx.lineWidth = (this.thickness! * this.parent.scaleFactor) /
      this.scaleFactor;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.miterLimit = 10;
    this.ctx.strokeStyle = `${this.color}${opacityToHex(this.opacity!)}`;
  }

  /**
   * Start to draw on the canvas.
   */
  #startDrawing(x: number, y: number) {
    this.isEditing = true;
    if (!this.#isCanvasInitialized) {
      this.#isCanvasInitialized = true;
      this.#setCanvasDims();
      this.thickness ||= InkEditor._defaultThickness;
      this.color ||= InkEditor._defaultColor ||
        AnnotationEditor._defaultLineColor;
      this.opacity ??= InkEditor._defaultOpacity;
    }
    this.currentPath.push([x, y]);
    this.#lastPoint = undefined;
    this.#setStroke();
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);

    this.#requestFrameCallback = () => {
      if (!this.#requestFrameCallback) {
        return;
      }

      if (this.#lastPoint) {
        if (this.isEmpty()) {
          this.ctx.setTransform(1, 0, 0, 1, 0, 0);
          this.ctx.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
        } else {
          this.#redraw();
        }

        this.ctx.lineTo(...this.#lastPoint);
        this.#lastPoint = undefined;
        this.ctx.stroke();
      }

      globalThis.requestAnimationFrame(this.#requestFrameCallback);
    };
    globalThis.requestAnimationFrame(this.#requestFrameCallback);
  }

  /**
   * Draw on the canvas.
   */
  #draw(x: number, y: number) {
    const [lastX, lastY] = this.currentPath.at(-1)!;
    if (x === lastX && y === lastY) {
      return;
    }
    this.currentPath.push([x, y]);
    this.#lastPoint = [x, y];
  }

  /**
   * Stop to draw on the canvas.
   */
  #stopDrawing(x: number, y: number) {
    this.ctx.closePath();
    this.#requestFrameCallback = undefined;

    x = Math.min(Math.max(x, 0), this.canvas!.width);
    y = Math.min(Math.max(y, 0), this.canvas!.height);

    const [lastX, lastY] = this.currentPath.at(-1)!;
    if (x !== lastX || y !== lastY) {
      this.currentPath.push([x, y]);
    }

    // Interpolate the path entered by the user with some
    // Bezier's curves in order to have a smoother path and
    // to reduce the data size used to draw it in the PDF.
    let bezier: _curve_t[];
    if (this.currentPath.length !== 1) {
      bezier = fitCurve(this.currentPath, 30);
    } else {
      // We have only one point finally.
      const xy: point_t = [x, y];
      bezier = [[xy, <point_t> xy.slice(), <point_t> xy.slice(), xy]];
    }
    const path2D = InkEditor.#buildPath2D(bezier);
    this.currentPath.length = 0;

    const cmd = () => {
      this.paths.push(bezier);
      this.bezierPath2D.push(path2D);
      this.rebuild();
    };

    const undo = () => {
      this.paths.pop();
      this.bezierPath2D.pop();
      if (this.paths.length === 0) {
        this.remove();
      } else {
        if (!this.canvas) {
          this.#createCanvas();
          this.#createObserver();
        }
        this.#fitToContent();
      }
    };

    this.parent.addCommands({ cmd, undo, mustExec: true });
  }

  /**
   * Redraw all the paths.
   */
  #redraw() {
    if (this.isEmpty()) {
      this.#updateTransform();
      return;
    }
    this.#setStroke();

    const { canvas, ctx } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas!.width, canvas!.height);
    this.#updateTransform();
    for (const path of this.bezierPath2D) {
      ctx.stroke(path);
    }
  }

  /**
   * Commit the curves we have in this editor.
   */
  override commit() {
    if (this.#disableEditing) {
      return;
    }

    super.commit();

    this.isEditing = false;
    this.disableEditMode();

    // This editor must be on top of the main ink editor.
    this.setInForeground();

    this.#disableEditing = true;
    this.div!.classList.add("disabled");

    this.#fitToContent(/* firstTime = */ true);

    this.parent.addInkEditorIfNeeded(/* isCommitting = */ true);

    // When commiting, the position of this editor is changed, hence we must
    // move it to the right position in the DOM.
    this.parent.moveDivInDOM(this);
    // After the div has been moved in the DOM, the focus may have been stolen
    // by document.body, hence we just keep it here.
    this.div!.focus();
  }

  /** @inheritdoc */
  override focusin(event: FocusEvent) {
    super.focusin(event);
    this.enableEditMode();
  }

  /**
   * onpointerdown callback for the canvas we're drawing on.
   */
  canvasPointerdown(event: PointerEvent) {
    if (event.button !== 0 || !this.isInEditMode() || this.#disableEditing) {
      return;
    }

    // We want to draw on top of any other editors.
    // Since it's the last child, there's no need to give it a higher z-index.
    this.setInForeground();

    if (event.type !== "mouse") {
      this.div!.focus();
    }

    event.stopPropagation();

    this.canvas!.addEventListener(
      "pointerleave",
      this.#boundCanvasPointerleave,
    );
    this.canvas!.addEventListener("pointermove", this.#boundCanvasPointermove);

    this.#startDrawing(event.offsetX, event.offsetY);
  }

  /**
   * onpointermove callback for the canvas we're drawing on.
   */
  canvasPointermove(event: PointerEvent) {
    event.stopPropagation();
    this.#draw(event.offsetX, event.offsetY);
  }

  /**
   * onpointerup callback for the canvas we're drawing on.
   */
  canvasPointerup(event: PointerEvent) {
    if (event.button !== 0) {
      return;
    }
    if (this.isInEditMode() && this.currentPath.length !== 0) {
      event.stopPropagation();
      this.#endDrawing(event);

      // Since the ink editor covers all of the page and we want to be able
      // to select another editor, we just put this one in the background.
      this.setInBackground();
    }
  }

  /**
   * onpointerleave callback for the canvas we're drawing on.
   */
  canvasPointerleave(event: PointerEvent) {
    this.#endDrawing(event);
    this.setInBackground();
  }

  /**
   * End the drawing.
   */
  #endDrawing(event: PointerEvent) {
    this.#stopDrawing(event.offsetX, event.offsetY);

    this.canvas!.removeEventListener(
      "pointerleave",
      this.#boundCanvasPointerleave,
    );
    this.canvas!.removeEventListener(
      "pointermove",
      this.#boundCanvasPointermove,
    );

    this.parent.addToAnnotationStorage(this);
  }

  /**
   * Create the canvas element.
   */
  #createCanvas() {
    this.canvas = html("canvas");
    this.canvas.width = this.canvas.height = 0;
    this.canvas.className = "inkEditorCanvas";

    InkEditor._l10nPromise
      .get("editor_ink_canvas_aria_label")!
      .then((msg) => this.canvas?.setAttribute("aria-label", msg));
    this.div!.append(this.canvas);
    this.ctx = this.canvas.getContext("2d")!;
  }

  /**
   * Create the resize observer.
   */
  #createObserver() {
    this.#observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      if (rect.width && rect.height) {
        this.setDimensions(rect.width, rect.height);
      }
    });
    this.#observer.observe(this.div!);
  }

  /** @inheritdoc */
  override render() {
    if (this.div) {
      return this.div;
    }

    let baseX: number, baseY: number;
    if (this.width) {
      baseX = this.x;
      baseY = this.y;
    }

    super.render();

    InkEditor._l10nPromise
      .get("editor_ink_aria_label")!
      .then((msg) => this.div?.setAttribute("aria-label", msg));

    const [x, y, w, h] = this.#getInitialBBox();
    this.setAt(x, y, 0, 0);
    this.setDims(w, h);

    this.#createCanvas();

    if (this.width) {
      // This editor was created in using copy (ctrl+c).
      const [parentWidth, parentHeight] = this.parent.viewportBaseDimensions;
      this.setAt(
        baseX! * parentWidth,
        baseY! * parentHeight,
        this.width * parentWidth,
        this.height! * parentHeight,
      );
      this.#isCanvasInitialized = true;
      this.#setCanvasDims();
      this.setDims(this.width * parentWidth, this.height! * parentHeight);
      this.#redraw();
      this.#setMinDims();
      this.div!.classList.add("disabled");
    } else {
      this.div!.classList.add("editing");
      this.enableEditMode();
    }

    this.#createObserver();

    return this.div!;
  }

  #setCanvasDims() {
    if (!this.#isCanvasInitialized) {
      return;
    }
    const [parentWidth, parentHeight] = this.parent.viewportBaseDimensions;
    this.canvas!.width = Math.ceil(this.width! * parentWidth);
    this.canvas!.height = Math.ceil(this.height! * parentHeight);
    this.#updateTransform();
  }

  /**
   * When the dimensions of the div change the inner canvas must
   * renew its dimensions, hence it must redraw its own contents.
   * @param width the new width of the div
   * @param height the new height of the div
   * @returns
   */
  setDimensions(width: number, height: number) {
    const roundedWidth = Math.round(width);
    const roundedHeight = Math.round(height);
    if (
      this.#realWidth === roundedWidth &&
      this.#realHeight === roundedHeight
    ) {
      return;
    }

    this.#realWidth = roundedWidth;
    this.#realHeight = roundedHeight;

    this.canvas!.style.visibility = "hidden";

    if (
      this.#aspectRatio &&
      Math.abs(this.#aspectRatio - width / height) > 1e-2
    ) {
      height = Math.ceil(width / this.#aspectRatio);
      this.setDims(width, height);
    }

    const [parentWidth, parentHeight] = this.parent.viewportBaseDimensions;
    this.width = width / parentWidth;
    this.height = height / parentHeight;

    if (this.#disableEditing) {
      this.#setScaleFactor(width, height);
    }

    this.#setCanvasDims();
    this.#redraw();

    this.canvas!.style.visibility = "visible";
  }

  #setScaleFactor(width: number, height: number) {
    const padding = this.#getPadding();
    const scaleFactorW = (width - padding) / this.#baseWidth;
    const scaleFactorH = (height - padding) / this.#baseHeight;
    this.scaleFactor = Math.min(scaleFactorW, scaleFactorH);
  }

  /**
   * Update the canvas transform.
   */
  #updateTransform() {
    const padding = this.#getPadding() / 2;
    this.ctx.setTransform(
      this.scaleFactor,
      0,
      0,
      this.scaleFactor,
      this.translationX * this.scaleFactor + padding,
      this.translationY * this.scaleFactor + padding,
    );
  }

  /**
   * Convert the output of fitCurve in some Path2D.
   */
  static #buildPath2D(bezier: _curve_t[]): Path2D {
    const path2D = new Path2D();
    for (let i = 0, ii = bezier.length; i < ii; i++) {
      const [first, control1, control2, second] = bezier[i];
      if (i === 0) {
        path2D.moveTo(...first);
      }
      path2D.bezierCurveTo(
        control1[0],
        control1[1],
        control2[0],
        control2[1],
        second[0],
        second[1],
      );
    }
    return path2D;
  }

  /**
   * Transform and serialize the paths.
   * @param s scale factor
   * @param tx abscissa of the translation
   * @param ty ordinate of the translation
   * @param h height of the bounding box
   */
  #serializePaths(s: number, tx: number, ty: number, h: number) {
    const NUMBER_OF_POINTS_ON_BEZIER_CURVE = 4;
    const paths = [];
    const padding = this.thickness! / 2;
    let buffer: number[], points: number[];

    for (const bezier of this.paths) {
      buffer = [];
      points = [];
      for (let i = 0, ii = bezier.length; i < ii; i++) {
        const [first, control1, control2, second] = bezier[i];
        const p10 = s * (first[0] + tx) + padding;
        const p11 = h - s * (first[1] + ty) - padding;
        const p20 = s * (control1[0] + tx) + padding;
        const p21 = h - s * (control1[1] + ty) - padding;
        const p30 = s * (control2[0] + tx) + padding;
        const p31 = h - s * (control2[1] + ty) - padding;
        const p40 = s * (second[0] + tx) + padding;
        const p41 = h - s * (second[1] + ty) - padding;

        if (i === 0) {
          buffer.push(p10, p11);
          points.push(p10, p11);
        }
        buffer.push(p20, p21, p30, p31, p40, p41);
        this.#extractPointsOnBezier(
          p10,
          p11,
          p20,
          p21,
          p30,
          p31,
          p40,
          p41,
          NUMBER_OF_POINTS_ON_BEZIER_CURVE,
          points,
        );
      }
      paths.push({ bezier: buffer, points });
    }

    return paths;
  }

  /**
   * Extract n-1 points from the cubic Bezier curve.
   */
  #extractPointsOnBezier(
    p10: number,
    p11: number,
    p20: number,
    p21: number,
    p30: number,
    p31: number,
    p40: number,
    p41: number,
    n: number,
    points: number[],
  ) {
    // If we can save few points thanks to the flatness we must do it.
    if (this.#isAlmostFlat(p10, p11, p20, p21, p30, p31, p40, p41)) {
      points.push(p40, p41);
      return;
    }

    // Apply the de Casteljau's algorithm in order to get n points belonging
    // to the Bezier's curve:
    // https://en.wikipedia.org/wiki/De_Casteljau%27s_algorithm

    // The first point is the last point of the previous Bezier curve
    // so no need to push the first point.
    for (let i = 1; i < n - 1; i++) {
      const t = i / n;
      const mt = 1 - t;

      let q10 = t * p10 + mt * p20;
      let q11 = t * p11 + mt * p21;

      let q20 = t * p20 + mt * p30;
      let q21 = t * p21 + mt * p31;

      const q30 = t * p30 + mt * p40;
      const q31 = t * p31 + mt * p41;

      q10 = t * q10 + mt * q20;
      q11 = t * q11 + mt * q21;

      q20 = t * q20 + mt * q30;
      q21 = t * q21 + mt * q31;

      q10 = t * q10 + mt * q20;
      q11 = t * q11 + mt * q21;

      points.push(q10, q11);
    }

    points.push(p40, p41);
  }

  /**
   * Check if a cubic Bezier curve is almost flat.
   */
  #isAlmostFlat(
    p10: number,
    p11: number,
    p20: number,
    p21: number,
    p30: number,
    p31: number,
    p40: number,
    p41: number,
  ): boolean {
    // For reference:
    //   https://jeremykun.com/tag/bezier-curves/
    const tol = 10;

    const ax = (3 * p20 - 2 * p10 - p40) ** 2;
    const ay = (3 * p21 - 2 * p11 - p41) ** 2;
    const bx = (3 * p30 - p10 - 2 * p40) ** 2;
    const by = (3 * p31 - p11 - 2 * p41) ** 2;

    return Math.max(ax, bx) + Math.max(ay, by) <= tol;
  }

  /**
   * Get the bounding box containing all the paths.
   * @returns {Array<number>}
   */
  #getBbox() {
    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;

    for (const path of this.paths) {
      for (const [first, control1, control2, second] of path) {
        const bbox = Util.bezierBoundingBox(
          ...first,
          ...control1,
          ...control2,
          ...second,
        );
        xMin = Math.min(xMin, bbox[0]);
        yMin = Math.min(yMin, bbox[1]);
        xMax = Math.max(xMax, bbox[2]);
        yMax = Math.max(yMax, bbox[3]);
      }
    }

    return [xMin, yMin, xMax, yMax];
  }

  /**
   * The bounding box is computed with null thickness, so we must take
   * it into account for the display.
   * It corresponds to the total padding, hence it should be divided by 2
   * in order to have left/right paddings.
   * @returns {number}
   */
  #getPadding() {
    return this.#disableEditing
      ? Math.ceil(this.thickness! * this.parent.scaleFactor)
      : 0;
  }

  /**
   * Set the div position and dimensions in order to fit to
   * the bounding box of the contents.
   * @returns {undefined}
   */
  #fitToContent(firstTime = false) {
    if (this.isEmpty()) {
      return;
    }

    if (!this.#disableEditing) {
      this.#redraw();
      return;
    }

    const bbox = this.#getBbox();
    const padding = this.#getPadding();
    this.#baseWidth = Math.max(RESIZER_SIZE, bbox[2] - bbox[0]);
    this.#baseHeight = Math.max(RESIZER_SIZE, bbox[3] - bbox[1]);

    const width = Math.ceil(padding + this.#baseWidth * this.scaleFactor);
    const height = Math.ceil(padding + this.#baseHeight * this.scaleFactor);

    const [parentWidth, parentHeight] = this.parent.viewportBaseDimensions;
    this.width = width / parentWidth;
    this.height = height / parentHeight;

    this.#aspectRatio = width / height;
    this.#setMinDims();

    const prevTranslationX = this.translationX;
    const prevTranslationY = this.translationY;

    this.translationX = -bbox[0];
    this.translationY = -bbox[1];
    this.#setCanvasDims();
    this.#redraw();

    this.#realWidth = width;
    this.#realHeight = height;

    this.setDims(width, height);
    const unscaledPadding = firstTime ? padding / this.scaleFactor / 2 : 0;
    this.translate(
      prevTranslationX - this.translationX - unscaledPadding,
      prevTranslationY - this.translationY - unscaledPadding,
    );
  }

  #setMinDims() {
    const { style } = this.div!;
    if (this.#aspectRatio >= 1) {
      style.minHeight = `${RESIZER_SIZE}px`;
      style.minWidth = `${Math.round(this.#aspectRatio * RESIZER_SIZE)}px`;
    } else {
      style.minWidth = `${RESIZER_SIZE}px`;
      style.minHeight = `${Math.round(RESIZER_SIZE / this.#aspectRatio)}px`;
    }
  }

  /** @inheritdoc */
  static override deserialize(
    data: InkEditorSerialized,
    parent: AnnotationEditorLayer,
  ) {
    const editor = <InkEditor> super.deserialize(data, parent);

    editor.thickness = data.thickness;
    editor.color = Util.makeHexColor(...data.color);
    editor.opacity = data.opacity;

    const [pageWidth, pageHeight] = parent.pageDimensions;
    const width = editor.width! * pageWidth;
    const height = editor.height! * pageHeight;
    const scaleFactor = parent.scaleFactor;
    const padding = data.thickness / 2;

    editor.#aspectRatio = width / height;
    editor.#disableEditing = true;
    editor.#realWidth = Math.round(width);
    editor.#realHeight = Math.round(height);

    for (const { bezier } of data.paths) {
      const path: _curve_t[] = [];
      editor.paths.push(path);
      let p0 = scaleFactor * (bezier[0] - padding);
      let p1 = scaleFactor * (height - bezier[1] - padding);
      for (let i = 2, ii = bezier.length; i < ii; i += 6) {
        const p10 = scaleFactor * (bezier[i] - padding);
        const p11 = scaleFactor * (height - bezier[i + 1] - padding);
        const p20 = scaleFactor * (bezier[i + 2] - padding);
        const p21 = scaleFactor * (height - bezier[i + 3] - padding);
        const p30 = scaleFactor * (bezier[i + 4] - padding);
        const p31 = scaleFactor * (height - bezier[i + 5] - padding);
        path.push([
          [p0, p1],
          [p10, p11],
          [p20, p21],
          [p30, p31],
        ]);
        p0 = p30;
        p1 = p31;
      }
      const path2D = this.#buildPath2D(path);
      editor.bezierPath2D.push(path2D);
    }

    const bbox = editor.#getBbox();
    editor.#baseWidth = bbox[2] - bbox[0];
    editor.#baseHeight = bbox[3] - bbox[1];
    editor.#setScaleFactor(width, height);

    return editor;
  }

  /**
   * @inheritdoc
   * @implement
   */
  serialize(): InkEditorSerialized | undefined {
    if (this.isEmpty()) {
      return undefined;
    }

    const rect = this.getRect(0, 0);
    const height = this.rotation % 180 === 0
      ? rect[3] - rect[1]
      : rect[2] - rect[0];

    const color = AnnotationEditor._colorManager.convert(
      <string> this.ctx.strokeStyle,
    );

    return {
      annotationType: AnnotationEditorType.INK,
      color,
      thickness: this.thickness!,
      opacity: this.opacity!,
      paths: this.#serializePaths(
        this.scaleFactor / this.parent.scaleFactor,
        this.translationX,
        this.translationY,
        height,
      ),
      pageIndex: this.parent.pageIndex,
      rect,
      rotation: this.rotation,
    };
  }
}
/*80--------------------------------------------------------------------------*/
