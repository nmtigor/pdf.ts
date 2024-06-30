/** 80**************************************************************************
 * @module lib/color/alias
 * @license Apache-2.0
 ******************************************************************************/
import type { ArrEl, Ratio, uint8 } from "../alias.js";
export type red_t = uint8;
export declare const zRed: import("../../3rd/zod-3.23.8/lib/index.mjs").ZodNumber;
export type alpha_t = Ratio;
export declare const zAlpha: import("../../3rd/zod-3.23.8/lib/index.mjs").ZodNumber;
export type rgb_t = [red_t, red_t, red_t];
export type rgba_t = [red_t, red_t, red_t, alpha_t];
/** [0,360) */
export type hue_t = number;
export declare const zHue: import("../../3rd/zod-3.23.8/lib/index.mjs").ZodNumber;
/** [0,100] */
export type chroma_t = number;
export declare const zChroma: import("../../3rd/zod-3.23.8/lib/index.mjs").ZodNumber;
/** [0,100] */
export type tone_t = number;
export declare const zTone: import("../../3rd/zod-3.23.8/lib/index.mjs").ZodNumber;
/** "#123456" */
export type RRGGBB = string;
/** "#12345678" */
export type RRGGBBAA = string;
export type CsscHexNorm = RRGGBB | RRGGBBAA;
/** "rgb(25,55,55)" */
export type CsscRGB = string;
/** "rgb(25,55,55,.3)" */
export type CsscRGBA = string;
/**
 * Ref. https://www.w3schools.com/colors/colors_groups.asp
 */
export declare const csscNameMapData: readonly [readonly ["pink", "#ffc0cb"], readonly ["lightpink", "#ffb6c1"], readonly ["hotpink", "#ff69b4"], readonly ["deeppink", "#ff1493"], readonly ["palevioletred", "#db7093"], readonly ["mediumvioletred", "#c71585"], readonly ["lavender", "#e6e6fa"], readonly ["thistle", "#d8bfd8"], readonly ["plum", "#dda0dd"], readonly ["orchid", "#da70d6"], readonly ["violet", "#ee82ee"], readonly ["fuchsia", "#ff00ff"], readonly ["magenta", "#ff00ff"], readonly ["mediumorchid", "#ba55d3"], readonly ["darkorchid", "#9932cc"], readonly ["darkviolet", "#9400d3"], readonly ["blueviolet", "#8a2be2"], readonly ["darkmagenta", "#8b008b"], readonly ["purple", "#800080"], readonly ["mediumpurple", "#9370db"], readonly ["mediumslateblue", "#7b68ee"], readonly ["slateblue", "#6a5acd"], readonly ["darkslateblue", "#483d8b"], readonly ["rebeccapurple", "#663399"], readonly ["indigo", "#4b0082"], readonly ["lightsalmon", "#ffa07a"], readonly ["salmon", "#fa8072"], readonly ["darksalmon", "#e9967a"], readonly ["lightcoral", "#f08080"], readonly ["indianred", "#cd5c5c"], readonly ["crimson", "#dc143c"], readonly ["red", "#ff0000"], readonly ["firebrick", "#b22222"], readonly ["darkred", "#8b0000"], readonly ["orange", "#ffa500"], readonly ["darkorange", "#ff8c00"], readonly ["coral", "#ff7f50"], readonly ["tomato", "#ff6347"], readonly ["orangered", "#ff4500"], readonly ["gold", "#ffd700"], readonly ["yellow", "#ffff00"], readonly ["lightyellow", "#ffffe0"], readonly ["lemonchiffon", "#fffacd"], readonly ["lightgoldenrodyellow", "#fafad2"], readonly ["papayawhip", "#ffefd5"], readonly ["moccasin", "#ffe4b5"], readonly ["peachpuff", "#ffdab9"], readonly ["palegoldenrod", "#eee8aa"], readonly ["khaki", "#f0e68c"], readonly ["darkkhaki", "#bdb76b"], readonly ["greenyellow", "#adff2f"], readonly ["chartreuse", "#7fff00"], readonly ["lawngreen", "#7cfc00"], readonly ["lime", "#00ff00"], readonly ["limegreen", "#32cd32"], readonly ["palegreen", "#98fb98"], readonly ["lightgreen", "#90ee90"], readonly ["mediumspringgreen", "#00fa9a"], readonly ["springgreen", "#00ff7f"], readonly ["mediumseagreen", "#3cb371"], readonly ["seagreen", "#2e8b57"], readonly ["forestgreen", "#228b22"], readonly ["green", "#008000"], readonly ["darkgreen", "#006400"], readonly ["yellowgreen", "#9acd32"], readonly ["olivedrab", "#6b8e23"], readonly ["darkolivegreen", "#556b2f"], readonly ["mediumaquamarine", "#66cdaa"], readonly ["darkseagreen", "#8fbc8f"], readonly ["lightseagreen", "#20b2aa"], readonly ["darkcyan", "#008b8b"], readonly ["teal", "#008080"], readonly ["aqua", "#00ffff"], readonly ["cyan", "#00ffff"], readonly ["lightcyan", "#e0ffff"], readonly ["paleturquoise", "#afeeee"], readonly ["aquamarine", "#7fffd4"], readonly ["turquoise", "#40e0d0"], readonly ["mediumturquoise", "#48d1cc"], readonly ["darkturquoise", "#00ced1"], readonly ["cadetblue", "#5f9ea0"], readonly ["steelblue", "#4682b4"], readonly ["lightsteelblue", "#b0c4de"], readonly ["lightblue", "#add8e6"], readonly ["powderblue", "#b0e0e6"], readonly ["lightskyblue", "#87cefa"], readonly ["skyblue", "#87ceeb"], readonly ["cornflowerblue", "#6495ed"], readonly ["deepskyblue", "#00bfff"], readonly ["dodgerblue", "#1e90ff"], readonly ["royalblue", "#4169e1"], readonly ["blue", "#0000ff"], readonly ["mediumblue", "#0000cd"], readonly ["darkblue", "#00008b"], readonly ["navy", "#000080"], readonly ["midnightblue", "#191970"], readonly ["cornsilk", "#fff8dc"], readonly ["blanchedalmond", "#ffebcd"], readonly ["bisque", "#ffe4c4"], readonly ["navajowhite", "#ffdead"], readonly ["wheat", "#f5deb3"], readonly ["burlywood", "#deb887"], readonly ["tan", "#d2b48c"], readonly ["rosybrown", "#bc8f8f"], readonly ["sandybrown", "#f4a460"], readonly ["goldenrod", "#daa520"], readonly ["darkgoldenrod", "#b8860b"], readonly ["peru", "#cd853f"], readonly ["chocolate", "#d2691e"], readonly ["olive", "#808000"], readonly ["saddlebrown", "#8b4513"], readonly ["sienna", "#a0522d"], readonly ["brown", "#a52a2a"], readonly ["maroon", "#800000"], readonly ["white", "#ffffff"], readonly ["snow", "#fffafa"], readonly ["honeydew", "#f0fff0"], readonly ["mintcream", "#f5fffa"], readonly ["azure", "#f0ffff"], readonly ["aliceblue", "#f0f8ff"], readonly ["ghostwhite", "#f8f8ff"], readonly ["whitesmoke", "#f5f5f5"], readonly ["seashell", "#fff5ee"], readonly ["beige", "#f5f5dc"], readonly ["oldlace", "#fdf5e6"], readonly ["floralwhite", "#fffaf0"], readonly ["ivory", "#fffff0"], readonly ["antiquewhite", "#faebd7"], readonly ["linen", "#faf0e6"], readonly ["lavenderblush", "#fff0f5"], readonly ["mistyrose", "#ffe4e1"], readonly ["gainsboro", "#dcdcdc"], readonly ["lightgray", "#d3d3d3"], readonly ["silver", "#c0c0c0"], readonly ["darkgray", "#a9a9a9"], readonly ["dimgray", "#696969"], readonly ["gray", "#808080"], readonly ["lightslategray", "#778899"], readonly ["slategray", "#708090"], readonly ["darkslategray", "#2f4f4f"], readonly ["black", "#000000"]];
export type CsscName = ArrEl<typeof csscNameMapData>[0];
/**
 * CSS color string excluding `currentcolor` \
 * Ref. https://www.w3schools.com/cssref/css_colors_legal.asp
 */
export type Cssc = CsscHexNorm | CsscRGB | CsscRGBA | CsscName;
/**
 * ! Not work (i.e., always true) if `!globalThis.Option`
 * @const @param cssc_x
 */
export declare function isValidCssc(cssc_x: string): cssc_x is Cssc;
export declare const zCssc: import("../../3rd/zod-3.23.8/lib/index.mjs").ZodAny | import("../../3rd/zod-3.23.8/lib/index.mjs").ZodEffects;
//# sourceMappingURL=alias.d.ts.map