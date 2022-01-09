/*81*****************************************************************************
 * bidi_test
** --------- */

import { css_1, css_2 } from "../../../test/alias.js";
import "../../../lib/jslang.js";
import { bidi } from "./bidi.js";

const strttime = performance.now();
/*81---------------------------------------------------------------------------*/

console.log("%c>>>>>>> test bidi() >>>>>>>",`color:${css_1}`);
{
  console.log("it should mark text as LTR if there's only LTR-characters, when the string is very short...");
  {
    const str = "foo";
    const bidiText = bidi(str, -1, false);

    console.assert( bidiText.str === "foo" );
    console.assert( bidiText.dir === "ltr" );
  }

  console.log("it should mark text as LTR if there's only LTR-characters...");
  {
    const str = "Lorem ipsum dolor sit amet, consectetur adipisicing elit.";
    const bidiText = bidi(str, -1, false);

    console.assert( bidiText.str ===
      "Lorem ipsum dolor sit amet, consectetur adipisicing elit."
    );
    console.assert( bidiText.dir ==="ltr" );
  }

  console.log("it should mark text as RTL if more than 30% of text is RTL...");
  {
    // 33% of test text are RTL characters
    const test = "\u0645\u0635\u0631 Egypt";
    const result = "Egypt \u0631\u0635\u0645";
    const bidiText = bidi(test, -1, false);

    console.assert( bidiText.str === result );
    console.assert( bidiText.dir === "rtl" );
  }

  console.log("it should mark text as LTR if less than 30% of text is RTL...");
  {
    const test = "Egypt is known as \u0645\u0635\u0631 in Arabic.";
    const result = "Egypt is known as \u0631\u0635\u0645 in Arabic.";
    const bidiText = bidi(test, -1, false);

    console.assert( bidiText.str === result );
    console.assert( bidiText.dir === "ltr" );
  }

  console.log("it should mark text as RTL if less than 30% of text is RTL, when the string is very short (issue 11656)...");
  {
    const str = "()\u05d1("; // 25% of the string is RTL characters.
    const bidiText = bidi(str, -1, false);

    console.assert( bidiText.str === "(\u05d1)(" );
    console.assert( bidiText.dir === "rtl" );
  }
}
/*81---------------------------------------------------------------------------*/

console.log(`%c:pdf/pdf.ts-src/core/bidi_test ${(performance.now()-strttime).toFixed(2)} ms`,`color:${css_2}`);
globalThis.ntestfile = globalThis.ntestfile ? globalThis.ntestfile+1 : 1;
