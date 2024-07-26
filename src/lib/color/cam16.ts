/** 80**************************************************************************
 * https://github.com/material-foundation/material-color-utilities/blob/main/typescript/hct/cam16.ts
 * (2023-06-22)
 *
 * @module lib/color/cam16
 * @license Apache-2.0
 ******************************************************************************/

import { uint32 } from "../alias.ts";
import { argbFromXyz, linearized } from "./color_utils.ts";
import type { chroma_t, hue_t } from "./alias.ts";
import { signum } from "./math_utils.ts";
import { ViewingConditions } from "./viewing_conditions.ts";
/*80--------------------------------------------------------------------------*/

/**
 * CAM16, a color appearance model. Colors are not just defined by their hex
 * code, but rather, a hex code and viewing conditions.
 *
 * CAM16 instances also have coordinates in the CAM16-UCS space, called J*, a*,
 * b*, or jstar, astar, bstar in code. CAM16-UCS is included in the CAM16
 * specification, and should be used when measuring distances between colors.
 *
 * In traditional color spaces, a color can be identified solely by the
 * observer's measurement of the color. Color appearance models such as CAM16
 * also use information about the environment where the color was
 * observed, known as the viewing conditions.
 *
 * For example, white under the traditional assumption of a midday sun white
 * point is accurately measured as a slightly chromatic blue by CAM16. (roughly,
 * hue 203, chroma 3, lightness 100)
 */
export class Cam16 {
  /**
   * All of the CAM16 dimensions can be calculated from 3 of the dimensions, in
   * the following combinations:
   *      -  {j or q} and {c, m, or s} and hue
   *      - jstar, astar, bstar
   * Prefer using a static method that constructs from 3 of those dimensions.
   * This constructor is intended for those methods to use to return all
   * possible dimensions.
   *
   * @param hue
   * @param chroma informally, colorfulness / color intensity. like saturation
   *     in HSL, except perceptually accurate.
   * @param j lightness
   * @param q brightness; ratio of lightness to white point's lightness
   * @param m colorfulness
   * @param s saturation; ratio of chroma to white point's chroma
   * @param jstar CAM16-UCS J coordinate
   * @param astar CAM16-UCS a coordinate
   * @param bstar CAM16-UCS b coordinate
   */
  constructor(
    readonly hue: hue_t,
    readonly chroma: chroma_t,
    readonly j: number,
    readonly q: number,
    readonly m: number,
    readonly s: number,
    readonly jstar: number,
    readonly astar: number,
    readonly bstar: number,
  ) {}

  #set(
    hue: hue_t,
    chroma: chroma_t,
    j: number,
    q: number,
    m: number,
    s: number,
    jstar: number,
    astar: number,
    bstar: number,
  ) {
    (this as any).hue = hue;
    (this as any).chroma = chroma;
    (this as any).j = j;
    (this as any).q = q;
    (this as any).m = m;
    (this as any).s = s;
    (this as any).jstar = jstar;
    (this as any).astar = astar;
    (this as any).bstar = bstar;
  }

  /**
   * CAM16 instances also have coordinates in the CAM16-UCS space, called J*,
   * a*, b*, or jstar, astar, bstar in code. CAM16-UCS is included in the CAM16
   * specification, and is used to measure distances between colors.
   */
  distance(other: Cam16): number {
    const dJ = this.jstar - other.jstar;
    const dA = this.astar - other.astar;
    const dB = this.bstar - other.bstar;
    const dEPrime = Math.sqrt(dJ * dJ + dA * dA + dB * dB);
    const dE = 1.41 * Math.pow(dEPrime, 0.63);
    return dE;
  }

  /**
   * @param argb ARGB representation of a color.
   * @out @param out_x
   * @return CAM16 color, assuming the color was viewed in default viewing
   *     conditions.
   */
  static fromInt(argb: uint32, out_x?: Cam16): Cam16 {
    return Cam16.fromIntInViewingConditions(
      argb,
      ViewingConditions.DEFAULT,
      out_x,
    );
  }

  /**
   * @param argb ARGB representation of a color.
   * @param viewingConditions Information about the environment where the color
   *     was observed.
   * @out @param out_x
   * @return CAM16 color.
   */
  static fromIntInViewingConditions(
    argb: uint32,
    viewingConditions: ViewingConditions,
    out_x?: Cam16,
  ): Cam16 {
    const red = (argb & 0x00ff0000) >> 16;
    const green = (argb & 0x0000ff00) >> 8;
    const blue = argb & 0x000000ff;
    const redL = linearized(red);
    const greenL = linearized(green);
    const blueL = linearized(blue);
    const x = 0.41233895 * redL + 0.35762064 * greenL + 0.18051042 * blueL;
    const y = 0.2126 * redL + 0.7152 * greenL + 0.0722 * blueL;
    const z = 0.01932141 * redL + 0.11916382 * greenL + 0.95034478 * blueL;

    const rC = 0.401288 * x + 0.650173 * y - 0.051461 * z;
    const gC = -0.250268 * x + 1.204414 * y + 0.045854 * z;
    const bC = -0.002079 * x + 0.048952 * y + 0.953127 * z;

    const rD = viewingConditions.rgbD[0] * rC;
    const gD = viewingConditions.rgbD[1] * gC;
    const bD = viewingConditions.rgbD[2] * bC;

    const rAF = Math.pow((viewingConditions.fl * Math.abs(rD)) / 100.0, 0.42);
    const gAF = Math.pow((viewingConditions.fl * Math.abs(gD)) / 100.0, 0.42);
    const bAF = Math.pow((viewingConditions.fl * Math.abs(bD)) / 100.0, 0.42);

    const rA = (signum(rD) * 400.0 * rAF) / (rAF + 27.13);
    const gA = (signum(gD) * 400.0 * gAF) / (gAF + 27.13);
    const bA = (signum(bD) * 400.0 * bAF) / (bAF + 27.13);

    const a = (11.0 * rA + -12.0 * gA + bA) / 11.0;
    const b = (rA + gA - 2.0 * bA) / 9.0;
    const u = (20.0 * rA + 20.0 * gA + 21.0 * bA) / 20.0;
    const p2 = (40.0 * rA + 20.0 * gA + bA) / 20.0;
    const atan2 = Math.atan2(b, a);
    const atanDegrees = (atan2 * 180.0) / Math.PI;
    const hue = atanDegrees < 0
      ? atanDegrees + 360.0
      : atanDegrees >= 360
      ? atanDegrees - 360.0
      : atanDegrees;
    const hueRadians = (hue * Math.PI) / 180.0;

    const ac = p2 * viewingConditions.nbb;
    const j = 100.0 *
      Math.pow(
        ac / viewingConditions.aw,
        viewingConditions.c * viewingConditions.z,
      );
    const q = (4.0 / viewingConditions.c) * Math.sqrt(j / 100.0) *
      (viewingConditions.aw + 4.0) * viewingConditions.fLRoot;
    const huePrime = hue < 20.14 ? hue + 360 : hue;
    const eHue = 0.25 * (Math.cos((huePrime * Math.PI) / 180.0 + 2.0) + 3.8);
    const p1 = (50000.0 / 13.0) * eHue * viewingConditions.nc *
      viewingConditions.ncb;
    const t = (p1 * Math.sqrt(a * a + b * b)) / (u + 0.305);
    const alpha = Math.pow(t, 0.9) *
      Math.pow(1.64 - Math.pow(0.29, viewingConditions.n), 0.73);
    const c = alpha * Math.sqrt(j / 100.0);
    const m = c * viewingConditions.fLRoot;
    const s = 50.0 *
      Math.sqrt((alpha * viewingConditions.c) / (viewingConditions.aw + 4.0));
    const jstar = ((1.0 + 100.0 * 0.007) * j) / (1.0 + 0.007 * j);
    const mstar = (1.0 / 0.0228) * Math.log(1.0 + 0.0228 * m);
    const astar = mstar * Math.cos(hueRadians);
    const bstar = mstar * Math.sin(hueRadians);

    if (out_x) {
      out_x.#set(hue, c, j, q, m, s, jstar, astar, bstar);
      return out_x;
    } else {
      return new Cam16(hue, c, j, q, m, s, jstar, astar, bstar);
    }
  }

  /**
   * @param j CAM16 lightness
   * @param c CAM16 chroma
   * @param h CAM16 hue
   * @out @param out_x
   */
  static fromJch(j: number, c: chroma_t, h: hue_t, out_x?: Cam16): Cam16 {
    return Cam16.fromJchInViewingConditions(
      j,
      c,
      h,
      ViewingConditions.DEFAULT,
      out_x,
    );
  }

  /**
   * @const @param j CAM16 lightness
   * @const @param c CAM16 chroma
   * @const @param h CAM16 hue
   * @headconst @param viewingConditions Information about the environment where
   *     the color was observed.
   * @out @param out_x
   */
  static fromJchInViewingConditions(
    j: number,
    c: chroma_t,
    h: hue_t,
    viewingConditions: ViewingConditions,
    out_x?: Cam16,
  ): Cam16 {
    const q = (4.0 / viewingConditions.c) * Math.sqrt(j / 100.0) *
      (viewingConditions.aw + 4.0) * viewingConditions.fLRoot;
    const m = c * viewingConditions.fLRoot;
    const alpha = c / Math.sqrt(j / 100.0);
    const s = 50.0 *
      Math.sqrt((alpha * viewingConditions.c) / (viewingConditions.aw + 4.0));
    const hueRadians = (h * Math.PI) / 180.0;
    const jstar = ((1.0 + 100.0 * 0.007) * j) / (1.0 + 0.007 * j);
    const mstar = (1.0 / 0.0228) * Math.log(1.0 + 0.0228 * m);
    const astar = mstar * Math.cos(hueRadians);
    const bstar = mstar * Math.sin(hueRadians);

    if (out_x) {
      out_x.#set(h, c, j, q, m, s, jstar, astar, bstar);
      return out_x;
    } else {
      return new Cam16(h, c, j, q, m, s, jstar, astar, bstar);
    }
  }

  /**
   * @param jstar CAM16-UCS lightness.
   * @param astar CAM16-UCS a dimension. Like a* in L*a*b*, it is a Cartesian
   *     coordinate on the Y axis.
   * @param bstar CAM16-UCS b dimension. Like a* in L*a*b*, it is a Cartesian
   *     coordinate on the X axis.
   * @out @param out_x
   */
  static fromUcs(
    jstar: number,
    astar: number,
    bstar: number,
    out_x?: Cam16,
  ): Cam16 {
    return Cam16.fromUcsInViewingConditions(
      jstar,
      astar,
      bstar,
      ViewingConditions.DEFAULT,
      out_x,
    );
  }

  /**
   * @param jstar CAM16-UCS lightness.
   * @param astar CAM16-UCS a dimension. Like a* in L*a*b*, it is a Cartesian
   *     coordinate on the Y axis.
   * @param bstar CAM16-UCS b dimension. Like a* in L*a*b*, it is a Cartesian
   *     coordinate on the X axis.
   * @param viewingConditions Information about the environment where the color
   *     was observed.
   * @out @param out_x
   */
  static fromUcsInViewingConditions(
    jstar: number,
    astar: number,
    bstar: number,
    viewingConditions: ViewingConditions,
    out_x?: Cam16,
  ): Cam16 {
    const a = astar;
    const b = bstar;
    const m = Math.sqrt(a * a + b * b);
    const M = (Math.exp(m * 0.0228) - 1.0) / 0.0228;
    const c = M / viewingConditions.fLRoot;
    let h = Math.atan2(b, a) * (180.0 / Math.PI);
    if (h < 0.0) {
      h += 360.0;
    }
    const j = jstar / (1 - (jstar - 100) * 0.007);
    return Cam16.fromJchInViewingConditions(j, c, h, viewingConditions, out_x);
  }

  /**
   * @return ARGB representation of color, assuming the color was viewed in
   *     default viewing conditions, which are near-identical to the default
   *     viewing conditions for sRGB.
   */
  toInt(): uint32 {
    return this.viewed(ViewingConditions.DEFAULT);
  }

  /**
   * @param viewingConditions Information about the environment where the color
   *     will be viewed.
   * @return ARGB representation of color
   */
  viewed(viewingConditions: ViewingConditions): uint32 {
    const alpha = this.chroma === 0.0 || this.j === 0.0
      ? 0.0
      : this.chroma / Math.sqrt(this.j / 100.0);

    const t = Math.pow(
      alpha / Math.pow(1.64 - Math.pow(0.29, viewingConditions.n), 0.73),
      1.0 / 0.9,
    );
    const hRad = (this.hue * Math.PI) / 180.0;

    const eHue = 0.25 * (Math.cos(hRad + 2.0) + 3.8);
    const ac = viewingConditions.aw *
      Math.pow(
        this.j / 100.0,
        1.0 / viewingConditions.c / viewingConditions.z,
      );
    const p1 = eHue * (50000.0 / 13.0) * viewingConditions.nc *
      viewingConditions.ncb;
    const p2 = ac / viewingConditions.nbb;

    const hSin = Math.sin(hRad);
    const hCos = Math.cos(hRad);

    const gamma = (23.0 * (p2 + 0.305) * t) /
      (23.0 * p1 + 11.0 * t * hCos + 108.0 * t * hSin);
    const a = gamma * hCos;
    const b = gamma * hSin;
    const rA = (460.0 * p2 + 451.0 * a + 288.0 * b) / 1403.0;
    const gA = (460.0 * p2 - 891.0 * a - 261.0 * b) / 1403.0;
    const bA = (460.0 * p2 - 220.0 * a - 6300.0 * b) / 1403.0;

    const rCBase = Math.max(0, (27.13 * Math.abs(rA)) / (400.0 - Math.abs(rA)));
    const rC = signum(rA) * (100.0 / viewingConditions.fl) *
      Math.pow(rCBase, 1.0 / 0.42);
    const gCBase = Math.max(0, (27.13 * Math.abs(gA)) / (400.0 - Math.abs(gA)));
    const gC = signum(gA) * (100.0 / viewingConditions.fl) *
      Math.pow(gCBase, 1.0 / 0.42);
    const bCBase = Math.max(0, (27.13 * Math.abs(bA)) / (400.0 - Math.abs(bA)));
    const bC = signum(bA) * (100.0 / viewingConditions.fl) *
      Math.pow(bCBase, 1.0 / 0.42);
    const rF = rC / viewingConditions.rgbD[0];
    const gF = gC / viewingConditions.rgbD[1];
    const bF = bC / viewingConditions.rgbD[2];

    const x = 1.86206786 * rF - 1.01125463 * gF + 0.14918677 * bF;
    const y = 0.38752654 * rF + 0.62144744 * gF - 0.00897398 * bF;
    const z = -0.01584150 * rF - 0.03412294 * gF + 1.04996444 * bF;

    const argb = argbFromXyz(x, y, z);
    return argb;
  }
}
/*80--------------------------------------------------------------------------*/
