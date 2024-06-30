/** 80**************************************************************************
 * @module test/unittest
 * @license MIT
 ******************************************************************************/

import { parseArgs } from "@std/cli";
import { resolve } from "@std/path";
import { build, run } from "@fe-util/util.ts";
import { D_fe, D_fe_pdf, D_fe_test, D_gp_src, D_rp_pdfs } from "../alias.ts";
/*80--------------------------------------------------------------------------*/

const AD_pr = resolve(new URL(Deno.mainModule).pathname, "../../../..");
// console.log("🚀 ~ AD_pr:", AD_pr);
const AD_fe = `${AD_pr}/${D_fe}`;
const AD_fe_test = `${AD_pr}/${D_fe_test}`;
if (AD_fe_test !== Deno.cwd()) {
  /* Because in "test_util.ts", it invokes `Deno.cwd()`! */
  console.error(
    `Please path to "${AD_fe_test}", and run ` +
      `'deno run --allow-read --allow-run unittest.ts --tsc "/path_to/TypeScript/bin/tsc"'`,
  );
  Deno.exit(1);
}

const parsedArgs = parseArgs(Deno.args);
const P_tsc = parsedArgs["tsc"] ??
  resolve(AD_pr, "../typescript/TypeScript/bin/tsc");
// console.log("🚀 ~ P_tsc:", P_tsc);
/*64----------------------------------------------------------*/

let success = true;
const build_ = build.bind(undefined, P_tsc);

success &&= (() => {
  if (!build_(AD_fe, undefined, 20)) return false;
  if (
    !run(
      "deno run --allow-read --allow-sys --allow-env --allow-run " +
        `${AD_fe}/util/bundle.ts ${AD_fe}/${D_gp_src}/pdf.worker.js`,
    )
  ) return false;

  if (
    !run(
      `deno test --allow-net --allow-read --allow-write=${AD_fe}/${D_rp_pdfs} --trace-leaks ../pdf`,
      33,
    )
  ) return false;

  return true;
})();

if (success) {
  console.log(`%cSucceeded!`, "color:green");
  Deno.exit(0);
} else {
  Deno.exit(1);
}
/*80--------------------------------------------------------------------------*/
