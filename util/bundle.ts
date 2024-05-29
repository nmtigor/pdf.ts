/** 80**************************************************************************
 * @module bundle
 * @license MIT
 ******************************************************************************/

import { build } from "@esbuild";
import { parseArgs } from "@std/cli/parse_args.ts";
import { existsSync } from "@std/fs/mod.ts";
import { basename, dirname, extname, resolve } from "@std/path/mod.ts";
/*80--------------------------------------------------------------------------*/

// const D_root = resolve(new URL(import.meta.url).pathname, "../..");
const D_root = resolve(new URL(Deno.mainModule).pathname, "../..");
// console.log("🚀 ~ D_root:", D_root)

const PF_ = parseArgs(Deno.args)._[0] as string;
if (!PF_) {
  console.error("%cError: No entrypoint provided", "color:red");
  console.error("Provide a js file as entrypoint to bundle.");
  Deno.exit(1);
}
if (!existsSync(PF_, { isReadable: true, isFile: true })) {
  console.error(`%cError: "${PF_}" does not exist.`, "color:red");
  Deno.exit(1);
}
const PF_1 = resolve(PF_);
if (!PF_1.startsWith(`${D_root}/gen/`)) {
  console.error(
    `%cError: "${PF_}" does not locate in "${D_root}/gen".`,
    "color:red",
  );
  console.error(`The entrypoint file must locate in "${D_root}/gen".`);
  Deno.exit(1);
}
const F_ = basename(PF_1);
if (!F_.endsWith(".js")) {
  console.error(`%cError: "${F_}" does not end with ".js".`, "color:red");
  console.error(`The entrypoint file must end with ".js".`);
  Deno.exit(1);
}

const F_0 = F_.slice(0, -extname(F_).length);
// console.log(F_0);
const D_tgt = `${D_root}/built/${dirname(PF_1).slice(`${D_root}/gen/`.length)}`;
// console.log(D_tgt);
const buildResult = await build({
  bundle: true,
  entryPoints: { [F_0]: PF_1 },
  format: "esm",
  allowOverwrite: true,
  outdir: D_tgt,
  minify: true,
  legalComments: "none",
});
// console.dir(buildResult);
if (buildResult.errors.length) {
  console.error("%cError: Fail to bundle", "color:red");
  Deno.exit(1);
} else {
  console.log(`%cSucceed to bundle to "${D_tgt}/${F_}"!`, "color:green");
  Deno.exit(0);
}
/*80--------------------------------------------------------------------------*/
