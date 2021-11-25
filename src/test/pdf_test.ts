/*81*****************************************************************************
 * pdf_test
** -------- */

import { global } from "../global.js";
// import {} from "./alias.js";
/*81---------------------------------------------------------------------------*/

global.testing = true;

// tags: incomplete, unsynchronized
await import( "../pdf/pdf.ts-src/test.js" ); //! unsynchronized
await import( "../pdf/pdf.ts-web/test.js" ); //! unsynchronized

export {}; // this file needs to be a module
/*81---------------------------------------------------------------------------*/

console.log(`total: ${(performance.now()/1000).toFixed(2)} s (${globalThis.ntestfile} files)`);
