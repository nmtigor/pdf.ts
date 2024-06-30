/** 80**************************************************************************
 * @module pdf/pdf.ts-test/alias
 * @license Apache-2.0
 ******************************************************************************/
import type { uint } from "../../lib/alias.js";
import type { Cssc } from "../../lib/color/alias.js";
import type { AnnotStorageValue } from "../pdf.ts-src/display/annotation_layer.js";
export declare const see_ui_testing: () => void;
/**
 * Ref. https://github.com/mozilla/pdf.js/wiki/Contributing#4-run-lint-and-testing
 */
type TaskType_ = "eq" | "fbf" | "highlight" | "load" | "text" | "other";
export interface TestTask {
    id: string;
    file: string;
    md5: string;
    rounds: number;
    link?: boolean;
    firstPage?: uint;
    skipPages?: number[];
    lastPage?: uint;
    pageColors?: {
        background: Cssc;
        foreground: Cssc;
    };
    enableXfa?: boolean;
    type: TaskType_;
    save?: boolean;
    print?: boolean;
    forms?: boolean;
    annotations?: boolean;
    loadAnnotations?: boolean;
    annotationStorage?: Record<string, AnnotStorageValue & {
        bitmapName: string;
    }>;
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
export {};
//# sourceMappingURL=alias.d.ts.map