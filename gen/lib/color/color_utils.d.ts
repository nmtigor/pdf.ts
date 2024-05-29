/** 80**************************************************************************
 * Color science utilities
 *
 * Utility methods for color science constants and color space
 * conversions that aren't HCT or CAM16.
 *
 * https://github.com/material-foundation/material-color-utilities/blob/main/typescript/utils/color_utils.ts
 * (2023-01-01)
 *
 * @module lib/color/color_utils
 * @license Apache-2.0
 ******************************************************************************/
import type { uint32, uint8 } from "../alias.js";
import type { red_t } from "./alias.js";
/**
 * Converts a color from RGB components to ARGB format.
 */
export declare function argbFromRgb(red: red_t, green: red_t, blue: red_t): uint32;
/**
 * Converts a color from linear RGB components to ARGB format.
 */
export declare function argbFromLinrgb(linrgb: number[]): uint32;
/**
 * Returns the alpha component of a color in ARGB format.
 */
export declare function alphaFromArgb(argb: uint32): uint8;
/**
 * Returns the red component of a color in ARGB format.
 */
export declare function redFromArgb(argb: uint32): uint8;
/**
 * Returns the green component of a color in ARGB format.
 */
export declare function greenFromArgb(argb: uint32): uint8;
/**
 * Returns the blue component of a color in ARGB format.
 */
export declare function blueFromArgb(argb: uint32): uint8;
/**
 * Returns whether a color in ARGB format is opaque.
 */
export declare function isOpaque(argb: number): boolean;
/**
 * Converts a color from ARGB to XYZ.
 */
export declare function argbFromXyz(x: number, y: number, z: number): uint32;
/**
 * Converts a color from XYZ to ARGB.
 */
export declare function xyzFromArgb(argb: uint32): number[];
/**
 * Converts a color represented in Lab color space into an ARGB
 * integer.
 */
export declare function argbFromLab(l: number, a: number, b: number): number;
/**
 * Converts a color from ARGB representation to L*a*b*
 * representation.
 *
 * @param argb the ARGB representation of a color
 * @return a Lab object representing the color
 */
export declare function labFromArgb(argb: number): number[];
/**
 * Converts an L* value to an ARGB representation.
 *
 * @param lstar L* in L*a*b*
 * @return ARGB representation of grayscale color with lightness
 * matching L*
 */
export declare function argbFromLstar(lstar: number): number;
/**
 * Computes the L* value of a color in ARGB representation.
 *
 * @param argb ARGB representation of a color
 * @return L*, from L*a*b*, coordinate of the color
 */
export declare function lstarFromArgb(argb: uint32): number;
/**
 * Converts an L* value to a Y value.
 *
 * L* in L*a*b* and Y in XYZ measure the same quantity, luminance.
 *
 * L* measures perceptual luminance, a linear scale. Y in XYZ
 * measures relative luminance, a logarithmic scale.
 *
 * @param lstar L* in L*a*b*
 * @return Y in XYZ
 */
export declare function yFromLstar(lstar: number): number;
/**
 * Converts a Y value to an L* value.
 *
 * L* in L*a*b* and Y in XYZ measure the same quantity, luminance.
 *
 * L* measures perceptual luminance, a linear scale. Y in XYZ
 * measures relative luminance, a logarithmic scale.
 *
 * @param y Y in XYZ
 * @return L* in L*a*b*
 */
export declare function lstarFromY(y: number): number;
/**
 * Linearizes an RGB component.
 *
 * @param rgbComponent 0 <= rgb_component <= 255, represents R/G/B
 * channel
 * @return 0.0 <= output <= 100.0, color channel converted to
 * linear RGB space
 */
export declare function linearized(rgbComponent: uint8): number;
/**
 * Delinearizes an RGB component.
 *
 * @param rgbComponent 0.0 <= rgb_component <= 100.0, represents
 * linear R/G/B channel
 * @return 0 <= output <= 255, color channel converted to regular
 * RGB space
 */
export declare function delinearized(rgbComponent: number): uint8;
/**
 * Returns the standard white point; white on a sunny day.
 *
 * @return The white point
 */
export declare function whitePointD65(): number[];
//# sourceMappingURL=color_utils.d.ts.map