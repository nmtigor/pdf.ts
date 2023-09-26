/** 80**************************************************************************
 * @module test/test_server
 * @license Apache-2.0
 ******************************************************************************/

import { serveDir } from "@std/http/file_server.ts";
import { serve } from "@std/http/server.ts";
import { TEST_PORT } from "./alias.ts";
/*80--------------------------------------------------------------------------*/

await serve(async (req: Request) =>
  serveDir(req, {
    fsRoot: "../..",
    // showDirListing: true,
  }), { port: TEST_PORT });
/*80--------------------------------------------------------------------------*/
