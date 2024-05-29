/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/scripting_api/common.ts
 * @license Apache-2.0
 ******************************************************************************/

/* Copyright 2020 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { AnnotActions } from "../core/core_utils.ts";
import { ActionEventName } from "../shared/util.ts";
/*80--------------------------------------------------------------------------*/

export const FieldType = {
  none: 0,
  number: 1,
  percent: 2,
  date: 3,
  time: 4,
};

export type ScriptingActionName =
  | ActionEventName
  | "Format"
  | "Open"
  | "OpenAction"
  | "ResetForm"
  | "sandboxtripbegin";
export type ScriptingActions = Map<ScriptingActionName, string[]>;
export function createActionsMap(actions?: AnnotActions) {
  const actionsMap: ScriptingActions = new Map();
  if (actions) {
    for (const [eventType, actionsForEvent] of Object.entries(actions)) {
      actionsMap.set(<ScriptingActionName> eventType, actionsForEvent);
    }
  }
  return actionsMap;
}

export function getFieldType(actions: ScriptingActions) {
  let format = actions.get("Format");
  if (!format) {
    return FieldType.none;
  }

  let format_ = format[0];

  format_ = format_.trim();
  if (format_.startsWith("AFNumber_")) return FieldType.number;
  if (format_.startsWith("AFPercent_")) return FieldType.percent;
  if (format_.startsWith("AFDate_")) return FieldType.date;
  if (format_.startsWith("AFTime_")) return FieldType.time;
  return FieldType.none;
}
/*80--------------------------------------------------------------------------*/
