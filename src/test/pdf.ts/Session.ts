/** 80**************************************************************************
 * @module test/pdf.ts/Seesion
 * @license Apache-2.0
 ******************************************************************************/

import type { uint } from "@fe-lib/alias.ts";
import type { T_browser } from "./alias.ts";
import type { TestTask } from "@fe-pdf.ts-test/alias.ts";
/*80--------------------------------------------------------------------------*/

export type PageResults = {
  failure: string | false;
  snapshot: string;
  viewportWidth: uint | undefined;
  viewportHeight: uint | undefined;
  outputScale: number | undefined;
};
export type RoundResults = PageResults[];

export class Session {
  name;
  closed = false;

  masterMode;
  taskResults: Record<string, RoundResults[]> = {};
  tasks: Record<string, TestTask> = {};
  remaining;
  numRuns = 0;
  numErrors = 0;
  numFBFFailures = 0;
  numEqNoSnapshot = 0;
  numEqFailures = 0;

  constructor(
    browserName: T_browser,
    masterMode: boolean,
    manifest: TestTask[],
  ) {
    this.name = browserName;

    this.masterMode = masterMode;
    this.remaining = manifest.length;
    manifest.forEach((item) => {
      const rounds = item.rounds || 1;
      const roundsResults: RoundResults[] = [];
      roundsResults.length = rounds;
      this.taskResults[item.id] = roundsResults;
      this.tasks[item.id] = item;
    });
  }
}
/*64----------------------------------------------------------*/

let sessions: Session[];
let onAllSessionsClosed: (() => void) | undefined;

export function initializeSessions(
  browserNames: T_browser[],
  masterMode: boolean,
  manifest: TestTask[],
) {
  sessions = [];
  for (const browserName of browserNames) {
    sessions.push(new Session(browserName, masterMode, manifest));
  }
  onAllSessionsClosed = finalize;
}

/**
 * Make sure found: `browser` MUST be in `browserNames` of `initializeSession()`
 */
export function getSession(browser: T_browser): Session {
  return sessions.find((session) => session.name === browser)!;
}

export async function closeSession(browser: T_browser) {
  for (const session of sessions) {
    if (session.name !== browser) {
      continue;
    }
    // if (session.browser !== undefined) {
    //   await session.browser.close();
    // }
    session.closed = true;
    const allClosed = sessions.every((s) => s.closed);
    if (allClosed) {
      // if (tempDir) {
      //   fs.rmSync(tempDir, { recursive: true, force: true });
      // }
      onAllSessionsClosed?.();
    }
  }
}

export function finalize() {
  ///
}
/*80--------------------------------------------------------------------------*/
