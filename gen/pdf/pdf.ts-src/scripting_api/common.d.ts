/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/scripting_api/common.ts
 * @license Apache-2.0
 ******************************************************************************/
import { AnnotActions } from "../core/core_utils.js";
import { ActionEventName } from "../shared/util.js";
export declare const FieldType: {
    none: number;
    number: number;
    percent: number;
    date: number;
    time: number;
};
export type ScriptingActionName = ActionEventName | "Format" | "Open" | "OpenAction" | "ResetForm" | "sandboxtripbegin";
export type ScriptingActions = Map<ScriptingActionName, string[]>;
export declare function createActionsMap(actions?: AnnotActions): ScriptingActions;
export declare function getFieldType(actions: ScriptingActions): number;
//# sourceMappingURL=common.d.ts.map