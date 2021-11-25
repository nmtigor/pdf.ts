/*81*****************************************************************************
 * pdf_find_utils_test
** ------------------- */
import { css_1, css_2 } from "../../test/alias.js";
import { getCharacterType } from "./pdf_find_utils.js";
const strttime = performance.now();
/*81---------------------------------------------------------------------------*/
console.log("%c>>>>>>> test getCharacterType >>>>>>>", `color:${css_1}`);
{
    console.log("it gets expected character types...");
    {
        const characters = {
            A: 1 /* ALPHA_LETTER */,
            a: 1 /* ALPHA_LETTER */,
            0: 1 /* ALPHA_LETTER */,
            5: 1 /* ALPHA_LETTER */,
            "\xC4": 1 /* ALPHA_LETTER */,
            "\xE4": 1 /* ALPHA_LETTER */,
            _: 1 /* ALPHA_LETTER */,
            " ": 0 /* SPACE */,
            "\t": 0 /* SPACE */,
            "\r": 0 /* SPACE */,
            "\n": 0 /* SPACE */,
            "\xA0": 0 /* SPACE */,
            "-": 2 /* PUNCT */,
            ",": 2 /* PUNCT */,
            ".": 2 /* PUNCT */,
            ";": 2 /* PUNCT */,
            ":": 2 /* PUNCT */,
            "\u2122": 1 /* ALPHA_LETTER */,
            "\u0E25": 7 /* THAI_LETTER */,
            "\u4000": 3 /* HAN_LETTER */,
            "\uF950": 3 /* HAN_LETTER */,
            "\u30C0": 4 /* KATAKANA_LETTER */,
            "\u3050": 5 /* HIRAGANA_LETTER */,
            "\uFF80": 6 /* HALFWIDTH_KATAKANA_LETTER */,
        };
        for (const character in characters) {
            const charCode = character.charCodeAt(0);
            const type = characters[character];
            console.assert(getCharacterType(charCode) === type);
        }
    }
}
/*81---------------------------------------------------------------------------*/
console.log(`%c:pdf/pdf.ts-web/pdf_find_utils_test ${(performance.now() - strttime).toFixed(2)} ms`, `color:${css_2}`);
globalThis.ntestfile = globalThis.ntestfile ? globalThis.ntestfile + 1 : 1;
//# sourceMappingURL=pdf_find_utils_test.js.map