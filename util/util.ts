/** 80**************************************************************************
 * @module util
 * @license MIT
 ******************************************************************************/

import { decodeABV } from "@fe-lib/util/general.ts";
import { copySync, ensureDirSync } from "@std/fs";
import { dirname } from "@std/path";
/*80--------------------------------------------------------------------------*/

export function cmd(cmd_x: string | string[]): Deno.Command {
  const cmd_a = Array.isArray(cmd_x)
    ? (console.log(cmd_x.join(" ")), cmd_x)
    : (console.log(cmd_x), cmd_x.split(" "));
  return new Deno.Command(cmd_a[0], { args: cmd_a.slice(1) });
}

/**
 * @param p_x a directory containing "tsconfig.json"
 * @param preNs_x preprocessor Names
 * @param t_x estimated duration in seconds
 */
export function build(
  tsc_x: string,
  p_x: string,
  preNs_x?: string,
  t_x?: number,
): boolean {
  console.log(
    `%cBuilding >>>>>>>${t_x === undefined ? "" : ` (~${t_x}s)`}`,
    "color:blue",
  );
  let t_ = performance.now();

  const { stdout, stderr } = cmd(
    `${tsc_x} -p ${p_x}${preNs_x ? ` --preprocessorNames ${preNs_x}` : ""}`,
  ).outputSync();
  let success = true;
  if (stderr.length || stdout.length) {
    success = false;
    console.error("%cError:", "color:red");
    console.error(decodeABV(stderr.length ? stderr : stdout));
  }

  t_ = performance.now() - t_;
  console.log(`%c<<<<<<< Done! (${(t_ / 1000).toFixed(1)}s)`, "color:blue");
  return success;
}

/**
 * @param t_x estimated duration in seconds
 */
export function run(cmd_x: string, t_x?: number): boolean {
  console.log(
    `%cRunning >>>>>>>${t_x === undefined ? "" : ` (~${t_x}s)`}`,
    "color:orange",
  );
  let t_ = performance.now();

  const { success, stdout, stderr } = cmd(cmd_x).outputSync();
  console.log(decodeABV(stdout));
  if (stderr.length) {
    console.error("%cError:", "color:red");
    console.error(decodeABV(stderr));
  }

  t_ = performance.now() - t_;
  console.log(`%c<<<<<<< Done! (${(t_ / 1000).toFixed(1)}s)`, "color:orange");
  return success;
}
/*80--------------------------------------------------------------------------*/

/**
 * ! USE WITH CARE
 */
export function removeFile(path: string | URL) {
  try {
    Deno.lstatSync(path);
    Deno.removeSync(path);
  } catch { /* */ }
}

/**
 * ! USE WITH CARE
 */
export function removeDir(path: string | URL) {
  try {
    Deno.lstatSync(path);
    Deno.removeSync(path, { recursive: true });
  } catch { /* */ }
}

export function copyDir(D_SRC_x: string, D_TGT_x: string, force_x?: "force") {
  console.log(`%cCopying ${D_SRC_x} to ${D_TGT_x} >>>>>>>`, "color:orange");

  if (force_x) {
    removeDir(D_TGT_x);
  }
  ensureDirSync(dirname(D_TGT_x));
  copySync(D_SRC_x, D_TGT_x);

  console.log(`%c<<<<<<< Done!`, "color:orange");
}
/*80--------------------------------------------------------------------------*/
