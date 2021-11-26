/*81*****************************************************************************
 * pdf_history_test
** ------------------- */

import { css_1, css_2 } from "../../test/alias.js";
import { isDestArraysEqual, isDestHashesEqual } from "./pdf_history.js";
import { type ExplicitDest } from "../pdf.ts-src/core/catalog.js";

const strttime = performance.now();
/*81---------------------------------------------------------------------------*/

console.log("%c>>>>>>> test isDestHashesEqual >>>>>>>",`color:${css_1}`);
{
  console.log("it should reject non-equal destination hashes...");
  {
    console.assert( isDestHashesEqual(null, "page.157") === false );
    console.assert( isDestHashesEqual("title.0", "page.157") === false );
    console.assert( isDestHashesEqual("page=1&zoom=auto", "page.157") === false );

    console.assert( 
      isDestHashesEqual("nameddest-page.157", "page.157") === false
    );
    console.assert( 
      isDestHashesEqual("page.157", "nameddest=page.157") === false
    );

    const destArrayString = JSON.stringify([
      { num: 3757, gen: 0 },
      { name: "XYZ" },
      92.918,
      748.972,
      null,
    ]);
    console.assert( isDestHashesEqual(destArrayString, "page.157") === false );
    console.assert( isDestHashesEqual("page.157", destArrayString) === false );
  }

  console.log("it should accept equal destination hashes...");
  {
    console.assert( isDestHashesEqual("page.157", "page.157") === true );
    console.assert( isDestHashesEqual("nameddest=page.157", "page.157") === true );

    console.assert( 
      isDestHashesEqual("nameddest=page.157&zoom=100", "page.157") === true 
    );
  }
}

console.log("%c>>>>>>> test isDestArraysEqual >>>>>>>",`color:${css_1}`);
{
  const firstDest:ExplicitDest = [{ num: 1, gen: 0 }, { name: "XYZ" }, 0, 375, null];
  const secondDest:ExplicitDest = [{ num: 5, gen: 0 }, { name: "XYZ" }, 0, 375, null];
  const thirdDest:ExplicitDest = [{ num: 1, gen: 0 }, { name: "XYZ" }, 750, 0, null];
  const fourthDest:ExplicitDest = [{ num: 1, gen: 0 }, { name: "XYZ" }, 0, 375, 1.0];
  const fifthDest:ExplicitDest = [{ gen: 0, num: 1 }, { name: "XYZ" }, 0, 375, null];

  console.log("it should reject non-equal destination arrays...");
  {
    console.assert( isDestArraysEqual(firstDest, undefined) === false );
    console.assert( isDestArraysEqual(firstDest, <any>[1, 2, 3, 4, 5]) === false );

    console.assert( isDestArraysEqual(firstDest, secondDest) === false );
    console.assert( isDestArraysEqual(firstDest, thirdDest) === false );
    console.assert( isDestArraysEqual(firstDest, fourthDest) === false );
  }

  console.log("it should accept equal destination arrays...");
  {
    console.assert( isDestArraysEqual(firstDest, firstDest) === true );
    console.assert( isDestArraysEqual(firstDest, fifthDest) === true );

    const firstDestCopy = <ExplicitDest>firstDest.slice();
    console.assert( firstDest !== firstDestCopy );

    console.assert( isDestArraysEqual(firstDest, firstDestCopy) === true );
  }
}
/*81---------------------------------------------------------------------------*/

console.log(`%c:pdf/pdf.ts-web/pdf_history_test ${(performance.now()-strttime).toFixed(2)} ms`,`color:${css_2}`);
globalThis.ntestfile = globalThis.ntestfile ? globalThis.ntestfile+1 : 1;
