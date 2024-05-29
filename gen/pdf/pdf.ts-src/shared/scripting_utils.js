/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/shared/scripting_utils.ts
 * @license Apache-2.0
 ******************************************************************************/
import "../../../lib/jslang.js";
// export type ColorConvertersDetail = {
//   [ C in CSTag ]:[ C, ...number[]];
// }
function makeColorComp(n) {
    return Math.floor(Math.clamp(0, n, 1) * 255)
        .toString(16)
        .padStart(2, "0");
}
function scaleAndClamp(x) {
    return Math.clamp(0, 255 * x, 255);
}
/**
 * PDF specifications section 10.3
 */
export class ColorConverters {
    static CMYK_G([c, y, m, k]) {
        return [
            "G",
            1 - Math.min(1, 0.3 * c + 0.59 * m + 0.11 * y + k),
        ];
    }
    static G_CMYK([g]) {
        return ["CMYK", 0, 0, 0, 1 - g];
    }
    static G_RGB([g]) {
        return ["RGB", g, g, g];
    }
    static G_rgb([g]) {
        g = scaleAndClamp(g);
        return [g, g, g];
    }
    static G_HTML([g]) {
        const G = makeColorComp(g);
        return `#${G}${G}${G}`;
    }
    static RGB_G([r, g, b]) {
        return ["G", 0.3 * r + 0.59 * g + 0.11 * b];
    }
    static RGB_rgb(color) {
        return color.map(scaleAndClamp);
    }
    static RGB_HTML(color) {
        return `#${color.map(makeColorComp).join("")}`;
    }
    static T_HTML() {
        return "#00000000";
    }
    static T_rgb() {
        return [];
    }
    static CMYK_RGB([c, y, m, k]) {
        return [
            "RGB",
            1 - Math.min(1, c + k),
            1 - Math.min(1, m + k),
            1 - Math.min(1, y + k),
        ];
    }
    static CMYK_rgb([c, y, m, k]) {
        return [
            scaleAndClamp(1 - Math.min(1, c + k)),
            scaleAndClamp(1 - Math.min(1, m + k)),
            scaleAndClamp(1 - Math.min(1, y + k)),
        ];
    }
    static CMYK_HTML(components) {
        const rgb = this.CMYK_RGB(components).slice(1);
        return this.RGB_HTML(rgb);
    }
    static RGB_CMYK([r, g, b]) {
        const c = 1 - r;
        const m = 1 - g;
        const y = 1 - b;
        const k = Math.min(c, m, y);
        return ["CMYK", c, m, y, k];
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=scripting_utils.js.map