/*81*****************************************************************************
 * core/test
** --------- */

import { css_3 } from "../../../test/alias.js";
/*81---------------------------------------------------------------------------*/

// #if TESTING
  // #if TEST_ALL
    await import( "./annotation_test.js" ); //! unsynchronized
    import "./bidi_test.js"
    import "./cff_parser_test.js"
    await import( "./cmap_test.js" );
    import "./colorspace_test.js"
    import "./core_utils_test.js"
    await import( "./evaluator_test.js" );
    import "./writer_test.js"
    import "./xml_parser_test.js"
  // #else
  // #endif
// #endif

export {}; // this file needs to be a module
/*81---------------------------------------------------------------------------*/

console.log(`%c:pdf/pdf.ts-src/core/test`,`color:${css_3}`);
