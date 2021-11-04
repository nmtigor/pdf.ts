/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */
/*81---------------------------------------------------------------------------*/
function makeColorComp(n) {
    return Math.floor(Math.max(0, Math.min(1, n)) * 255)
        .toString(16)
        .padStart(2, "0");
}
/**
 * PDF specifications section 10.3
 */
export var ColorConverters;
(function (ColorConverters) {
    function CMYK_G([c, y, m, k]) {
        return ["G", 1 - Math.min(1, 0.3 * c + 0.59 * m + 0.11 * y + k)];
    }
    ColorConverters.CMYK_G = CMYK_G;
    function G_CMYK([g]) {
        return ["CMYK", 0, 0, 0, 1 - g];
    }
    ColorConverters.G_CMYK = G_CMYK;
    function G_RGB([g]) {
        return ["RGB", g, g, g];
    }
    ColorConverters.G_RGB = G_RGB;
    function G_HTML([g]) {
        const G = makeColorComp(g);
        return `#${G}${G}${G}`;
    }
    ColorConverters.G_HTML = G_HTML;
    function RGB_G([r, g, b]) {
        return ["G", 0.3 * r + 0.59 * g + 0.11 * b];
    }
    ColorConverters.RGB_G = RGB_G;
    function RGB_HTML([r, g, b]) {
        const R = makeColorComp(r);
        const G = makeColorComp(g);
        const B = makeColorComp(b);
        return `#${R}${G}${B}`;
    }
    ColorConverters.RGB_HTML = RGB_HTML;
    function T_HTML() {
        return "#00000000";
    }
    ColorConverters.T_HTML = T_HTML;
    function CMYK_RGB([c, y, m, k]) {
        return [
            "RGB",
            1 - Math.min(1, c + k),
            1 - Math.min(1, m + k),
            1 - Math.min(1, y + k),
        ];
    }
    ColorConverters.CMYK_RGB = CMYK_RGB;
    function CMYK_HTML(components) {
        return RGB_HTML(CMYK_RGB(components)); //kkkk bug?
    }
    ColorConverters.CMYK_HTML = CMYK_HTML;
    function RGB_CMYK([r, g, b]) {
        const c = 1 - r;
        const m = 1 - g;
        const y = 1 - b;
        const k = Math.min(c, m, y);
        return ["CMYK", c, m, y, k];
    }
    ColorConverters.RGB_CMYK = RGB_CMYK;
})(ColorConverters || (ColorConverters = {}));
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=scripting_utils.js.map