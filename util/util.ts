/** 80**************************************************************************
 * @module util
 * @license MIT
 ******************************************************************************/

import { copySync, ensureDirSync, existsSync } from "@std/fs/mod.ts";
import { dirname } from "@std/path/mod.ts";
/*80--------------------------------------------------------------------------*/

export function cmd(cmd_x: string | string[]): Deno.Command {
  const cmd_a = Array.isArray(cmd_x)
    ? (console.log(cmd_x.join(" ")), cmd_x)
    : (console.log(cmd_x), cmd_x.split(" "));
  return new Deno.Command(cmd_a[0], { args: cmd_a.slice(1) });
}

export const decoder = new TextDecoder();

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
    console.error(decoder.decode(stderr.length ? stderr : stdout));
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
  console.log(decoder.decode(stdout));
  if (stderr.length) {
    console.error("%cError:", "color:red");
    console.error(decoder.decode(stderr));
  }

  t_ = performance.now() - t_;
  console.log(`%c<<<<<<< Done! (${(t_ / 1000).toFixed(1)}s)`, "color:orange");
  return success;
}
/*80--------------------------------------------------------------------------*/

export function forceCopyDir(D_SRC_x: string, D_TGT_x: string) {
  console.log(`%cCopying ${D_SRC_x} to ${D_TGT_x} >>>>>>>`, "color:orange");

  if (existsSync(D_TGT_x)) {
    Deno.removeSync(D_TGT_x, { recursive: true });
  }
  ensureDirSync(dirname(D_TGT_x));
  copySync(D_SRC_x, D_TGT_x);

  console.log(`%c<<<<<<< Done!`, "color:orange");
}
/*80--------------------------------------------------------------------------*/
