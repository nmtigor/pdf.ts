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
/*81=============================================================================
 * main
 * ---- */
// function main()
// {
// }
/*81---------------------------------------------------------------------------*/
// document.on( "DOMContentLoaded", main, { passive:true, once:true });
/*81===========================================================================*/
console.log(`total: ${performance.now().toFixed(2)} ms (${globalThis.ntestfile} files)`);
//# sourceMappingURL=pdf_test.js.map