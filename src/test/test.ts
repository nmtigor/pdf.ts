/** 80**************************************************************************
 * @module test/test
 * @license MIT
 ******************************************************************************/

import { parseArgs } from "@std/cli/parse_args.ts";
import { resolve } from "@std/path/mod.ts";
import { build, run } from "@fe-util/util.ts";
/*80--------------------------------------------------------------------------*/

const AD_pr = resolve(new URL(Deno.mainModule).pathname, "../../../..");
// console.log("🚀 ~ AD_pr:", AD_pr);
const D_fe = "pdf.ts", AD_fe = `${AD_pr}/${D_fe}`;
const D_fe_test = `${D_fe}/src/test`, AD_fe_test = `${AD_pr}/${D_fe_test}`;
if (AD_fe_test !== Deno.cwd()) {
  /* Because in "test_util.ts", it invokes `Deno.cwd()`! */
  console.error(
    `Please path to "${AD_fe_test}", and run "deno run --allow-read --allow-run test.ts"`,
  );
  Deno.exit(1);
}

const parsedArgs = parseArgs(Deno.args);
const PF_tsc = parsedArgs["tsc"] ??
  resolve(AD_pr, "../typescript/TypeScript/bin/tsc");
// console.log("🚀 ~ PF_tsc:", PF_tsc);
/*64----------------------------------------------------------*/

let success = true;
const build_ = build.bind(undefined, PF_tsc);

success &&= (() => {
  if (!build_(AD_fe, undefined, 35)) return false;
  if (
    !run(
      "deno run --allow-read --allow-sys --allow-env --allow-run " +
        `${AD_fe}/util/bundle.ts ${AD_fe}/gen/pdf/pdf.ts-src/pdf.worker.js`,
    )
  ) return false;

  if (
    !run(
      /* `--allow-write` is optional. If provided, tested PDFs will be
      downloaded into `${AD_fe}/res/pdf/test/pdfs`. (see `getPDF()` in
      "test_utils.ts") */
      "deno test --allow-net --allow-read ../pdf",
      66,
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
