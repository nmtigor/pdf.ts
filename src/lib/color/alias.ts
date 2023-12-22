/** 80**************************************************************************
 * @module lib/color/alias
 * @license Apache-2.0
 ******************************************************************************/

import { z } from "@zod";
import type { ArrEl, Ratio, uint8 } from "../alias.ts";
import { zRatio, zUint8 } from "../alias.ts";
/*80--------------------------------------------------------------------------*/

export type red_t = uint8;
export const zRed = zUint8;

export type alpha_t = Ratio;
export const zAlpha = zRatio.min(0).max(1);

export type rgb_t = [red_t, red_t, red_t];
export type rgba_t = [red_t, red_t, red_t, alpha_t];

/** [0,360) */
export type hue_t = number;
export const zHue = z.number().min(0).lt(360);
/** [0,100] */
export type chroma_t = number;
export const zChroma = z.number().min(0).max(100);
/** [0,100] */
export type tone_t = number;
export const zTone = z.number().min(0).max(100);
/*64----------------------------------------------------------*/

/** "#123456" */
export type RRGGBB = string;
/** "#12345678" */
export type RRGGBBAA = string;
export type CsscHexNorm = RRGGBB | RRGGBBAA;

/** "rgb(25,55,55)" */
export type CsscRGB = string;
/** "rgb(25,55,55,.3)" */
export type CsscRGBA = string;

// deno-fmt-ignore
/**
 * Ref. https://www.w3schools.com/colors/colors_groups.asp
 */
export const csscNameMapData = [
  /* Pink Colors */
  ["pink", "#ffc0cb"], ["lightpink", "#ffb6c1"],
  ["hotpink", "#ff69b4"], ["deeppink", "#ff1493"],
  ["palevioletred", "#db7093"], ["mediumvioletred", "#c71585"],
  /* Purple Colors */
  ["lavender", "#e6e6fa"], ["thistle", "#d8bfd8"],
  ["plum", "#dda0dd"], ["orchid", "#da70d6"],
  ["violet", "#ee82ee"], ["fuchsia", "#ff00ff"],
  ["magenta", "#ff00ff"], ["mediumorchid", "#ba55d3"],
  ["darkorchid", "#9932cc"], ["darkviolet", "#9400d3"],
  ["blueviolet", "#8a2be2"], ["darkmagenta", "#8b008b"],
  ["purple", "#800080"], ["mediumpurple", "#9370db"],
  ["mediumslateblue", "#7b68ee"], ["slateblue", "#6a5acd"],
  ["darkslateblue", "#483d8b"], ["rebeccapurple", "#663399"],
  ["indigo", "#4b0082"],
  /* Red Colors */
  ["lightsalmon", "#ffa07a"], ["salmon", "#fa8072"],
  ["darksalmon", "#e9967a"], ["lightcoral", "#f08080"],
  ["indianred", "#cd5c5c"], ["crimson", "#dc143c"],
  ["red", "#ff0000"], ["firebrick", "#b22222"],
  ["darkred", "#8b0000"],
  /* Orange Colors */
  ["orange", "#ffa500"], ["darkorange", "#ff8c00"],
  ["coral", "#ff7f50"], ["tomato", "#ff6347"],
  ["orangered", "#ff4500"], /* Yellow Colors */
  ["gold", "#ffd700"], ["yellow", "#ffff00"],
  ["lightyellow", "#ffffe0"], ["lemonchiffon", "#fffacd"],
  ["lightgoldenrodyellow", "#fafad2"], ["papayawhip", "#ffefd5"],
  ["moccasin", "#ffe4b5"], ["peachpuff", "#ffdab9"],
  ["palegoldenrod", "#eee8aa"], ["khaki", "#f0e68c"],
  ["darkkhaki", "#bdb76b"], /* Green Colors */
  ["greenyellow", "#adff2f"], ["chartreuse", "#7fff00"],
  ["lawngreen", "#7cfc00"], ["lime", "#00ff00"],
  ["limegreen", "#32cd32"], ["palegreen", "#98fb98"],
  ["lightgreen", "#90ee90"], ["mediumspringgreen", "#00fa9a"],
  ["springgreen", "#00ff7f"], ["mediumseagreen", "#3cb371"],
  ["seagreen", "#2e8b57"], ["forestgreen", "#228b22"],
  ["green", "#008000"], ["darkgreen", "#006400"],
  ["yellowgreen", "#9acd32"], ["olivedrab", "#6b8e23"],
  ["darkolivegreen", "#556b2f"], ["mediumaquamarine", "#66cdaa"],
  ["darkseagreen", "#8fbc8f"], ["lightseagreen", "#20b2aa"],
  ["darkcyan", "#008b8b"], ["teal", "#008080"],
  /* Cyan Colors */
  ["aqua", "#00ffff"], ["cyan", "#00ffff"],
  ["lightcyan", "#e0ffff"], ["paleturquoise", "#afeeee"],
  ["aquamarine", "#7fffd4"], ["turquoise", "#40e0d0"],
  ["mediumturquoise", "#48d1cc"], ["darkturquoise", "#00ced1"],
  /* Blue Colors */
  ["cadetblue", "#5f9ea0"], ["steelblue", "#4682b4"],
  ["lightsteelblue", "#b0c4de"], ["lightblue", "#add8e6"],
  ["powderblue", "#b0e0e6"], ["lightskyblue", "#87cefa"],
  ["skyblue", "#87ceeb"], ["cornflowerblue", "#6495ed"],
  ["deepskyblue", "#00bfff"], ["dodgerblue", "#1e90ff"],
  ["royalblue", "#4169e1"], ["blue", "#0000ff"],
  ["mediumblue", "#0000cd"], ["darkblue", "#00008b"],
  ["navy", "#000080"], ["midnightblue", "#191970"],
  /* Brown Colors */
  ["cornsilk", "#fff8dc"], ["blanchedalmond", "#ffebcd"],
  ["bisque", "#ffe4c4"], ["navajowhite", "#ffdead"],
  ["wheat", "#f5deb3"], ["burlywood", "#deb887"],
  ["tan", "#d2b48c"], ["rosybrown", "#bc8f8f"],
  ["sandybrown", "#f4a460"], ["goldenrod", "#daa520"],
  ["darkgoldenrod", "#b8860b"], ["peru", "#cd853f"],
  ["chocolate", "#d2691e"], ["olive", "#808000"],
  ["saddlebrown", "#8b4513"], ["sienna", "#a0522d"],
  ["brown", "#a52a2a"], ["maroon", "#800000"],
  /* White Colors */
  ["white", "#ffffff"], ["snow", "#fffafa"],
  ["honeydew", "#f0fff0"], ["mintcream", "#f5fffa"],
  ["azure", "#f0ffff"], ["aliceblue", "#f0f8ff"],
  ["ghostwhite", "#f8f8ff"], ["whitesmoke", "#f5f5f5"],
  ["seashell", "#fff5ee"], ["beige", "#f5f5dc"],
  ["oldlace", "#fdf5e6"], ["floralwhite", "#fffaf0"],
  ["ivory", "#fffff0"], ["antiquewhite", "#faebd7"],
  ["linen", "#faf0e6"], ["lavenderblush", "#fff0f5"],
  ["mistyrose", "#ffe4e1"],
  /* Grey Colors */
  ["gainsboro", "#dcdcdc"], ["lightgray", "#d3d3d3"],
  ["silver", "#c0c0c0"], ["darkgray", "#a9a9a9"],
  ["dimgray", "#696969"], ["gray", "#808080"],
  ["lightslategray", "#778899"], ["slategray", "#708090"],
  ["darkslategray", "#2f4f4f"], ["black", "#000000"],
] as const;
export type CsscName = ArrEl<typeof csscNameMapData>[0];

/**
 * CSS color string excluding `currentcolor` \
 * Ref. https://www.w3schools.com/cssref/css_colors_legal.asp
 */
export type Cssc = CsscHexNorm | CsscRGB | CsscRGBA | CsscName;

const style_ = globalThis.Option ? (new Option()).style : { color: "" };
/**
 * ! Not work (i.e., always true) if `!globalThis.Option`
 * @const @param cssc_x
 */
export function isValidCssc(cssc_x: string): cssc_x is Cssc {
  if (cssc_x === "currentcolor") return false;

  style_.color = "";
  style_.color = cssc_x;
  // console.log( style_.color );
  return !!style_.color;
}
// console.log( isValidCssc("#23202F") );
export const zCssc = z.custom(isValidCssc);
/*80--------------------------------------------------------------------------*/
