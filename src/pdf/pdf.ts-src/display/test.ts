/*81*****************************************************************************
 * display/test
** ------------ */

import { css_3 } from "../../../test/alias.js";
/*81---------------------------------------------------------------------------*/

// await import( "./test_1.js" );

// #if TESTING
  // #if TEST_ALL
    import "./annotation_storage_test.js"
    await import( "./api_test.js" ); //! unsynchronized
  // #else
  // #endif
// #endif

export {}; // this file needs to be a module
/*81---------------------------------------------------------------------------*/

console.log(`%c:pdf/pdf.ts-src/display/test`,`color:${css_3}`);
