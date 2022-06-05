/*81*****************************************************************************
 * pdf_find_utils_test
** ------------------- */

import { css_1, css_2 } from "../../test/alias.js";
import { CharacterType, getCharacterType } from "./pdf_find_utils.js";

const strttime = performance.now();
/*81---------------------------------------------------------------------------*/

console.log("%c>>>>>>> test getCharacterType >>>>>>>",`color:${css_1}`);
{
  console.log("it gets expected character types...");
  {
    const characters = {
      A: CharacterType.ALPHA_LETTER,
      a: CharacterType.ALPHA_LETTER,
      0: CharacterType.ALPHA_LETTER,
      5: CharacterType.ALPHA_LETTER,
      "\xC4": CharacterType.ALPHA_LETTER, // "Ä"
      "\xE4": CharacterType.ALPHA_LETTER, // "ä"
      _: CharacterType.ALPHA_LETTER,
      " ": CharacterType.SPACE,
      "\t": CharacterType.SPACE,
      "\r": CharacterType.SPACE,
      "\n": CharacterType.SPACE,
      "\xA0": CharacterType.SPACE, // nbsp
      "-": CharacterType.PUNCT,
      ",": CharacterType.PUNCT,
      ".": CharacterType.PUNCT,
      ";": CharacterType.PUNCT,
      ":": CharacterType.PUNCT,
      "\u2122": CharacterType.ALPHA_LETTER, // trademark
      "\u0E25": CharacterType.THAI_LETTER,
      "\u4000": CharacterType.HAN_LETTER,
      "\uF950": CharacterType.HAN_LETTER,
      "\u30C0": CharacterType.KATAKANA_LETTER,
      "\u3050": CharacterType.HIRAGANA_LETTER,
      "\uFF80": CharacterType.HALFWIDTH_KATAKANA_LETTER,
    };

    for( const character in characters )
    {
      const charCode = character.charCodeAt(0);
      const type = (<any>characters)[character];

      console.assert( getCharacterType(charCode) === type );
    }
  }
}
/*81---------------------------------------------------------------------------*/

console.log(`%c:pdf/pdf.ts-web/pdf_find_utils_test ${(performance.now()-strttime).toFixed(2)} ms`,`color:${css_2}`);
globalThis.ntestfile = globalThis.ntestfile ? globalThis.ntestfile+1 : 1;
