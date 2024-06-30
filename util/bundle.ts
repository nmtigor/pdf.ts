/** 80**************************************************************************
 * @module bundle
 * @license MIT
 ******************************************************************************/

import { build } from "@esbuild";
import { parseArgs } from "@std/cli";
import { existsSync } from "@std/fs";
import { basename, dirname, extname, resolve } from "@std/path";
/*80--------------------------------------------------------------------------*/

// const AD_fe = resolve(new URL(import.meta.url).pathname, "../..");
const AD_fe = resolve(new URL(Deno.mainModule).pathname, "../..");
// console.log("🚀 ~ AD_fe:", AD_fe)

const P_ = parseArgs(Deno.args)._[0] as string;
if (!P_) {
  console.error("%cError: No entrypoint provided", "color:red");
  console.error("Provide a js file as entrypoint to bundle.");
  Deno.exit(1);
}
if (!existsSync(P_, { isReadable: true, isFile: true })) {
  console.error(`%cError: "${P_}" does not exist.`, "color:red");
  Deno.exit(1);
}
const P_1 = resolve(P_);
if (!P_1.startsWith(`${AD_fe}/gen/`)) {
  console.error(
    `%cError: "${P_}" does not locate in "${AD_fe}/gen".`,
    "color:red",
  );
  console.error(`The entrypoint file must locate in "${AD_fe}/gen".`);
  Deno.exit(1);
}
const F_ = basename(P_1);
if (!F_.endsWith(".js")) {
  console.error(`%cError: "${F_}" does not end with ".js".`, "color:red");
  console.error(`The entrypoint file must end with ".js".`);
  Deno.exit(1);
}

const F_0 = F_.slice(0, -extname(F_).length);
// console.log(F_0);
const D_tgt = `${AD_fe}/built/${dirname(P_1).slice(`${AD_fe}/gen/`.length)}`;
// console.log(D_tgt);
const buildResult = await build({
  bundle: true,
  entryPoints: { [F_0]: P_1 },
  format: "esm",
  allowOverwrite: true,
  outdir: D_tgt,
  minify: true,
  // lineLimit: 80,
  legalComments: "none",
});
// console.dir(buildResult);
if (buildResult.errors.length) {
  console.error("%cError: Fail to bundle", "color:red");
  Deno.exit(1);
} else {
  console.log(`%cSucceeded to bundle to "${D_tgt}/${F_}"!`, "color:green");
  Deno.exit(0);
}
/*80--------------------------------------------------------------------------*/
