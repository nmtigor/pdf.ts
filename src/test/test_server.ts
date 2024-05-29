/** 80**************************************************************************
 * @module test/test_server
 * @license Apache-2.0
 ******************************************************************************/

import { serveDir } from "@std/http/file_server.ts";
import { resolve } from "@std/path/mod.ts";
/*80--------------------------------------------------------------------------*/

const AD_fe = resolve(new URL(Deno.mainModule).pathname, "../../..");

const server = Deno.serve(
  { port: 9071 },
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
