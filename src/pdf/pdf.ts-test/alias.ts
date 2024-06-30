/** 80**************************************************************************
 * @module pdf/pdf.ts-test/alias
 * @license Apache-2.0
 ******************************************************************************/

import type { uint } from "@fe-lib/alias.ts";
import type { Cssc } from "@fe-lib/color/alias.ts";
import type { AnnotStorageValue } from "@fe-pdf.ts-src/display/annotation_layer.ts";
/*80--------------------------------------------------------------------------*/

export const see_ui_testing = () => {};
/*80--------------------------------------------------------------------------*/

/**
 * Ref. https://github.com/mozilla/pdf.js/wiki/Contributing#4-run-lint-and-testing
 */
type TaskType_ =
  | "eq" // reference test that takes correctly rendered snapshots and compares them to snapshots from the current code
  | "fbf" // forward-back-forward test
  | "highlight"
  | "load" // checks if the PDF file can be loaded without crashing
  | "text" // reference test that takes snapshots of the text layer overlay and compares them to snapshots from the current code
  | "other";

export interface TestTask {
  id: string;
  file: string;
  md5: string;
  rounds: number;
  link?: boolean;
  firstPage?: uint;
  skipPages?: number[];
  lastPage?: uint;
  pageColors?: { background: Cssc; foreground: Cssc };
  enableXfa?: boolean;
  type: TaskType_;
  save?: boolean;
  print?: boolean;
  forms?: boolean;
  annotations?: boolean;
  loadAnnotations?: boolean;
  annotationStorage?: Record<
    string,
    AnnotStorageValue & { bitmapName: string }
  >;
  isOffscreenCanvasSupported?: boolean;
  renderTaskOnContinue?: boolean;
  optionalContent?: Record<string, boolean>;
  enableAutoFetch?: boolean;
  useSystemFonts?: boolean;
  useWorkerFetch?: boolean;
  outputScale?: number;
  rotation?: 0 | 90 | 180 | 270;
  password?: string;
  aboud?: string;
}

export type TestFilter = {
  only: string[];
  skip: string[];
  limit: uint;
  xfaOnly?: boolean;
};
/*80--------------------------------------------------------------------------*/
