/** 80**************************************************************************
 * @module test/test_server
 * @license Apache-2.0
 ******************************************************************************/

import { serveDir } from "https://deno.land/std@0.195.0/http/file_server.ts";
import { serve } from "https://deno.land/std@0.195.0/http/server.ts";
/*80--------------------------------------------------------------------------*/

await serve(async (req: Request) =>
  serveDir(req, {
    fsRoot: "../..",
    // showDirListing: true,
  }), { port: 8000 });
/*80--------------------------------------------------------------------------*/
