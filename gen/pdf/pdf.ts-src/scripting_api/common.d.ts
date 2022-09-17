import { AnnotActions } from "../core/core_utils.js";
import { ActionEventName } from "../shared/util.js";
export declare const FieldType: {
    none: number;
    number: number;
    percent: number;
    date: number;
    time: number;
};
export declare type ScriptingActionName = ActionEventName | "Format" | "Open" | "OpenAction" | "ResetForm";
export declare type ScriptingActions = Map<ScriptingActionName, string[]>;
export declare function createActionsMap(actions?: AnnotActions): ScriptingActions;
export declare function getFieldType(actions: ScriptingActions): number;
//# sourceMappingURL=common.d.ts.map