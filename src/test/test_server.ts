/** 80**************************************************************************
 * @module test/test_server
 * @license Apache-2.0
 ******************************************************************************/

import type { uint } from "@fe-lib/alias.ts";
import { parseArgs } from "@std/cli";
import { serveDir } from "@std/http";
import { resolve } from "@std/path";
/*80--------------------------------------------------------------------------*/

const AD_fe = resolve(new URL(Deno.mainModule).pathname, "../../..");
// console.log("🚀 ~ AD_fe:", AD_fe)

const parsedArgs = parseArgs(Deno.args);
let port: uint;
port = Number.isInteger(port = parseInt(parsedArgs["port"])) ? port : 9071;

const server = Deno.serve(
  { port },
  (req: Request) =>
    serveDir(req, { fsRoot: AD_fe /* showDirListing: true, */ }),
);
Deno.writeTextFileSync(
  `${AD_fe}/src/baseurl.mjs`,
  [
    "/* DO NOT EDIT MANUALLY! */",
    `export const baseUrl = "http://${server.addr.hostname}:${server.addr.port}";`,
  ].join("\n"),
);
/*80--------------------------------------------------------------------------*/
