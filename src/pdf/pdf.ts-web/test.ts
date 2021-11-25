/*81*****************************************************************************
 * pdf.ts-web/test
** --------------- */

import { css_3 } from "../../test/alias.js";
/*81---------------------------------------------------------------------------*/

// #if TESTING
  // #if TEST_ALL
    await import( "./pdf_find_controller_test.js" ); //! unsynchronized
    import "./pdf_find_utils_test.js";
    import "./pdf_history_test.js";
  // #else
  // #endif
// #endif

export {}; // this file needs to be a module
/*81---------------------------------------------------------------------------*/

console.log(`%c:pdf/pdf.ts-web/test`,`color:${css_3}`);
