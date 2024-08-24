/** 80**************************************************************************
 * @module test/pdf.ts/reftest
 * @license Apache-2.0
 ******************************************************************************/

import { removeDir, removeFile } from "@fe-util/util.ts";
import type { TestTask } from "@fe-pdf.ts-test/alias.ts";
import { filter_tasks } from "@fe-pdf.ts-test/util.ts";
import {
  D_fe,
  D_res_pdf,
  D_sp_test,
  D_tmp_pdf,
  LOG_cssc,
} from "@fe-src/alias.ts";
import type { uint } from "@fe-src/lib/alias.ts";
import { Hono } from "@hono/hono";
import { serveStatic } from "@hono/hono/deno";
import { validator } from "@hono/hono/validator";
import { parseArgs } from "@std/cli";
import { decodeBase64 } from "@std/encoding/base64";
import { encodeHex } from "@std/encoding/hex";
import { ensureDirSync, existsSync } from "@std/fs";
import { join, relative, resolve } from "@std/path";
import type { RoundResults } from "./Session.ts";
import {
  closeSession,
  finalize,
  getSession,
  initializeSessions,
} from "./Session.ts";
import type { Stat, T_browser, T_info, T_task_results } from "./alias.ts";
import { z_browser, z_info, z_task_results } from "./alias.ts";
import { Buffer } from "node:buffer";
import { z } from "@zod";
/*80--------------------------------------------------------------------------*/

const AD_pr = resolve(new URL(Deno.mainModule).pathname, "../../../../..");
// console.log("🚀 ~ AD_pr:", AD_pr);
const AD_fe = `${AD_pr}/${D_fe}`;

const parsedArgs = parseArgs(Deno.args);
let port: uint;
port = Number.isInteger(port = parseInt(parsedArgs["port"])) ? port : 8051;
const masterMode: boolean = parsedArgs["masterMode"] ?? false;

const manifest = filter_tasks(
  JSON.parse(
    Deno.readTextFileSync(`${AD_fe}/${D_sp_test}/test_manifest.json`),
  ),
  JSON.parse(
    Deno.readTextFileSync(`${AD_fe}/${D_sp_test}/test_filter.json`),
  ),
);
// console.log("🚀 ~ manifest:", manifest)

const app = new Hono();
/*80--------------------------------------------------------------------------*/

app.post(
  "/tellMeToQuit",
  validator("json", async (v_x, c_x) => {
    const r_ = await z.object({ browser: z_browser }).safeParseAsync(v_x);
    return r_.success ? r_.data as { browser: T_browser } : c_x.json(r_, 400);
  }),
  (c_x) => {
    const { browser } = c_x.req.valid("json");
    const session = getSession(browser);
    // monitorBrowserTimeout(session, null);
    closeSession(session.name);

    return c_x.body(null);
  },
);
/*64----------------------------------------------------------*/

app.post(
  "/info",
  validator("json", async (v_x, c_x) => {
    const r_ = await z_info.safeParseAsync(v_x);
    return r_.success ? r_.data as T_info : c_x.json(r_, 400);
  }),
  (c_x) => {
    const { message } = c_x.req.valid("json");
    console.log(message);

    return c_x.body(null);
  },
);
/*64----------------------------------------------------------*/

const AD_res_ = `${AD_fe}/${D_res_pdf}/test`;
const AD_tmp_ = `${AD_fe}/${D_tmp_pdf}/test`;
const refsTmpDir = `${AD_tmp_}/tmp`;
const testResultDir = `${AD_tmp_}/test_snapshots`;
const refsDir = `${AD_res_}/ref`;
const eqLog = `${AD_tmp_}/eq.log`;

let stats: Stat[] | undefined;

function checkEq(
  task: TestTask,
  results: RoundResults[],
  browser: T_browser,
  masterMode: boolean,
) {
  const taskId = task.id;
  const refSnapshotDir = join(refsDir, Deno.build.os, browser, taskId);
  const testSnapshotDir = join(testResultDir, Deno.build.os, browser, taskId);

  const pageResults = results[0];
  const taskType = task.type;
  let numEqNoSnapshot = 0;
  let numEqFailures = 0;
  for (let page = 0; page < pageResults.length; page++) {
    if (!pageResults[page]) {
      continue;
    }
    const pageResult = pageResults[page];
    let testSnapshot: Uint8Array;
    try {
      // testSnapshot = decodeBase64(
      //   pageResult.snapshot.substring("data:image/png;base64,".length),
      // );
      testSnapshot = Buffer.from(
        pageResult.snapshot.substring("data:image/png;base64,".length),
        "base64",
      );
    } catch (_) {
      console.error(`Valid snapshot was not found.`);
      console.error(`TEST-FAIL | ${taskType} test ${taskId} | in ${browser}`);
      return;
    }
    let refSnapshot: Uint8Array | undefined;
    let eq = false;
    const refPath = join(refSnapshotDir, `${page + 1}.png`);
    try {
      refSnapshot = Deno.readFileSync(refPath);
    } catch (_) {
      numEqNoSnapshot++;
      if (!masterMode) {
        console.log(`WARNING: no reference snapshot ${refPath}`);
      }
    }
    if (refSnapshot) {
      eq = encodeHex(refSnapshot) === encodeHex(testSnapshot);
      if (!eq) {
        console.log("byteLength ref: ", refSnapshot.byteLength);
        console.log("byteLength test: ", testSnapshot.byteLength);
        console.log(
          `TEST-UNEXPECTED-FAIL | ${taskType} ${taskId} | in ${browser} | ` +
            `rendering of page ${page + 1} != reference rendering`,
        );

        ensureDirSync(testSnapshotDir);
        const P_testSnapshot = join(testSnapshotDir, `${page + 1}.png`);
        const P_refSnapshot = join(testSnapshotDir, `${page + 1}_ref.png`);
        Deno.writeFileSync(P_testSnapshot, testSnapshot);
        Deno.writeFileSync(P_refSnapshot, refSnapshot);

        // This no longer follows the format of Mozilla reftest output.
        const viewportString =
          `(${pageResult.viewportWidth}x${pageResult.viewportHeight}x${pageResult.outputScale})`;
        Deno.writeTextFileSync(
          eqLog,
          [
            "REFTEST TEST-UNEXPECTED-FAIL | " +
            `${browser}-${taskId}-page${page + 1} | image comparison (==)`,
            `REFTEST   IMAGE 1 (TEST)${viewportString}: ${P_testSnapshot}`,
            `REFTEST   IMAGE 2 (REFERENCE)${viewportString}: ${P_refSnapshot}`,
            "",
          ].join("\n"),
          { append: true },
        );
        numEqFailures++;
      }
    }
    if (masterMode && (!refSnapshot || !eq)) {
      const tmpSnapshotDir = join(refsTmpDir, Deno.build.os, browser, taskId);
      ensureDirSync(tmpSnapshotDir);
      Deno.writeFileSync(
        join(tmpSnapshotDir, `${page + 1}.png`),
        testSnapshot,
      );
    }
  }

  const session = getSession(browser);
  session.numEqNoSnapshot += numEqNoSnapshot;
  if (numEqFailures > 0) {
    session.numEqFailures += numEqFailures;
  } else {
    console.log(`TEST-PASS | ${taskType} test ${taskId} | in ${browser}`);
  }
}

function checkFBF(
  task: TestTask,
  results: RoundResults[],
  browser: T_browser,
  masterMode: boolean,
) {
  let numFBFFailures = 0;
  const round0 = results[0],
    round1 = results[1];
  if (round0.length !== round1.length) {
    console.error("round 1 and 2 sizes are different");
  }

  for (let page = 0; page < round1.length; page++) {
    const r0Page = round0[page],
      r1Page = round1[page];
    if (!r0Page) {
      continue;
    }
    if (r0Page.snapshot !== r1Page.snapshot) {
      // The FBF tests fail intermittently in Firefox and Google Chrome when run
      // on the bots, ignoring `makeref` failures for now; see
      //  - https://github.com/mozilla/pdf.js/pull/12368
      //  - https://github.com/mozilla/pdf.js/pull/11491
      //
      // TODO: Figure out why this happens, so that we can remove the hack; see
      //       https://github.com/mozilla/pdf.js/issues/12371
      if (masterMode) {
        console.log(
          `TEST-SKIPPED | forward-back-forward test ${task.id} | ` +
            `in ${browser} | page ${page + 1}`,
        );
        continue;
      }

      console.log(
        `TEST-UNEXPECTED-FAIL | forward-back-forward test ${task.id} | ` +
          `in ${browser} | first rendering of page ${page + 1} != second`,
      );
      numFBFFailures++;
    }
  }

  if (numFBFFailures > 0) {
    getSession(browser).numFBFFailures += numFBFFailures;
  } else {
    console.log(
      `TEST-PASS | forward-back-forward test ${task.id} | in ${browser}`,
    );
  }
}

function checkLoad(
  task: TestTask,
  results: RoundResults[],
  browser: T_browser,
) {
  // Load just checks for absence of failure, so if we got here the
  // test has passed
  console.log(`TEST-PASS | load test ${task.id} | in ${browser}`);
}

function checkRefTestResults(
  browser: T_browser,
  id: string,
  results: RoundResults[],
) {
  // console.log("🚀 ~ results:", results);
  let failed = false;
  const session = getSession(browser);
  const task = session.tasks[id];
  session.numRuns++;

  results.forEach((roundResults, round) => {
    roundResults.forEach((pageResult, page) => {
      if (!pageResult) {
        return; // no results
      }
      if (pageResult.failure) {
        failed = true;
        if (existsSync(`${AD_fe}/${D_res_pdf}/test/${task.file}.error`)) {
          console.log(
            `TEST-SKIPPED | PDF was not downloaded ${id} | ` +
              `in ${browser} | page ${page + 1} round ${round + 1} | ` +
              `${pageResult.failure}`,
          );
        } else {
          session.numErrors++;
          console.log(
            `TEST-UNEXPECTED-FAIL | test failed ${id} | ` +
              `in ${browser} | page ${page + 1} round ${round + 1} | ` +
              pageResult.failure,
          );
        }
      }
    });
  });
  if (failed) {
    return;
  }
  switch (task.type) {
    case "eq":
    case "text":
    case "highlight":
      checkEq(task, results, browser, session.masterMode);
      break;
    case "fbf":
      checkFBF(task, results, browser, session.masterMode);
      break;
    case "load":
      checkLoad(task, results, browser);
      break;
    default:
      throw new Error("Unknown test type");
  }
  // clear memory
  results.forEach((roundResults, round) => {
    roundResults.forEach((pageResult, page) => {
      pageResult.snapshot = undefined as any;
    });
  });
}

app.post(
  "/submit_task_results",
  validator("json", async (v_x, c_x) => {
    const r_ = await z_task_results.safeParseAsync(v_x);
    return r_.success ? r_.data as T_task_results : c_x.json(r_, 400);
  }),
  (c_x) => {
    const data = c_x.req.valid("json");
    // console.log("🚀 ~ data:", data)
    const { browser, round, id } = data;
    const page = data.page - 1; // !

    const session = getSession(browser);
    // monitorBrowserTimeout(session, handleSessionTimeout);

    const taskResults = session.taskResults[id];
    if (!taskResults[round]) {
      taskResults[round] = [];
    }

    if (taskResults[round][page]) {
      console.error(
        `Results for ${browser}:${id}:` +
          `${round + 1}:${page + 1} were already submitted`,
      );
      return c_x.body(null);
    }

    taskResults[round][page] = {
      failure: data.failure,
      snapshot: data.snapshot,
      viewportWidth: data.viewportWidth,
      viewportHeight: data.viewportHeight,
      outputScale: data.outputScale,
    };
    if (stats) {
      stats.push({ browser, pdf: id, page, round, stats: data.stats });
    }

    const isDone = taskResults.at(-1)?.[data.lastPageNum - 1];
    if (isDone) {
      checkRefTestResults(browser, id, taskResults);
      session.remaining--;
    }

    return c_x.body(null);
  },
);
/*64----------------------------------------------------------*/

app.post(
  "/setup",
  (c_x) => {
    removeDir(refsTmpDir);
    removeFile(eqLog);
    removeDir(testResultDir);

    initializeSessions(["firefox", "chrome"], masterMode, manifest);

    return c_x.body(null);
  },
);
/*64----------------------------------------------------------*/

const RD_fe_ = relative(".", AD_fe);
// console.log("🚀 ~ RD_fe_:", RD_fe_);
app.get("/gen/*", serveStatic({ root: RD_fe_ }));
app.get("/src/*", serveStatic({ root: RD_fe_ }));
app.get("/built/*", serveStatic({ root: RD_fe_ }));
app.get("/res/*", serveStatic({ root: RD_fe_ }));
/*80--------------------------------------------------------------------------*/

const server = Deno.serve({ port }, app.fetch);
Deno.writeTextFileSync(
  `${AD_fe}/src/baseurl.mjs`,
  [
    "/* DO NOT EDIT MANUALLY! */",
    `export const baseUrl = "http://${server.addr.hostname}:${server.addr.port}";`,
  ].join("\n"),
);
/*80--------------------------------------------------------------------------*/
