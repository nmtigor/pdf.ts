/*81*****************************************************************************
 * pdf_test
** -------- */

import { global } from "../global.js";
/*81---------------------------------------------------------------------------*/

global.testing = true;
/*81===========================================================================*/

import "./alias.js";
// tags: incomplete, unsynchronized
import "../pdf/pdf.ts-src/test.js"; //! unsynchronized
import "../pdf/pdf.ts-web/test.js"; //! unsynchronized
/*81---------------------------------------------------------------------------*/

export {}; // this file needs to be a module

/*81=============================================================================
 * main
 * ---- */

// function main()
// {
// }
/*81---------------------------------------------------------------------------*/

// document.on( "DOMContentLoaded", main, { passive:true, once:true });

// window.on( "error", ( evt:ErrorEvent ) => {
// });
// window.on( "unhandledrejection", ( evt:PromiseRejectionEvent ) => {
// });
/*81===========================================================================*/

console.log(`total: ${performance.now().toFixed(2)} ms (${globalThis.ntestfile} files)`);