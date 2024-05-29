/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/scripting_api/event.ts
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

import { TESTING } from "@fe-src/global.ts";
import type { AnnotActions } from "../core/core_utils.ts";
import type { DocWrapped, FieldWrapped } from "./app.ts";
import {
  USERACTIVATION_CALLBACKID,
  USERACTIVATION_MAXTIME_VALIDITY,
} from "./app_utils.ts";
import type { ScriptingActionName } from "./common.ts";
import type { Doc } from "./doc.ts";
import type { Field } from "./field.ts";
import type { ExternalCall } from "./initialization.ts";
import type { ScriptingData, SendData } from "./pdf_object.ts";
/*80--------------------------------------------------------------------------*/

interface _SendEventData extends SendData {
}

export interface ScriptingEventData extends ScriptingData<_SendEventData> {
  change?: string;
  changeEx?: string | string[];
  commitKey?: number;
  fieldFull?: boolean;
  keyDown?: boolean;
  modifier?: boolean;
  name: ScriptingActionName;
  richChange?: unknown[];
  richChangeEx?: unknown[];
  richValue?: unknown[];
  selEnd?: number;
  selStart?: number;
  shift?: number;
  source: Doc | Field;
  target?: Doc | Field;
  value?: string;
  willCommit?: boolean;

  actions?: AnnotActions;
  pageNumber?: number;
  ids?: string[];
}

export class Event {
  change;
  changeEx;
  commitKey;
  fieldFull;
  keyDown;
  modifier;
  name;
  rc = true;
  richChange;
  richChangeEx;
  richValue;
  selEnd;
  selStart;
  shift;
  source;
  target;
  targetName = "";
  type = "Field";
  value: string | number;
  willCommit;

  constructor(data: ScriptingEventData) {
    this.change = data.change || "";
    this.changeEx = data.changeEx;
    this.commitKey = data.commitKey || 0;
    this.fieldFull = data.fieldFull || false;
    this.keyDown = data.keyDown || false;
    this.modifier = data.modifier || false;
    this.name = data.name;
    this.richChange = data.richChange || [];
    this.richChangeEx = data.richChangeEx || [];
    this.richValue = data.richValue || [];
    this.selEnd = data.selEnd ?? -1;
    this.selStart = data.selStart ?? -1;
    this.shift = data.shift || false;
    this.source = data.source;
    this.target = data.target;
    this.value = data.value || "";
    this.willCommit = data.willCommit || false;
  }
}

interface SavedChange_ {
  value: string | number;
  changeEx: string | string[] | undefined;
  change: string;
  selStart: number;
  selEnd: number;
}

export class EventDispatcher {
  _document;
  _calculationOrder;
  _objects;
  _externalCall;

  _isCalculating = false;

  constructor(
    document: DocWrapped,
    calculationOrder: string[] | undefined,
    objects: Record<string, FieldWrapped>,
    externalCall: ExternalCall,
  ) {
    this._document = document;
    this._calculationOrder = calculationOrder;
    this._objects = objects;
    this._externalCall = externalCall;

    this._document.obj._eventDispatcher = this;
  }

  mergeChange(event: Event) {
    let value = event.value;
    // if( Array.isArray( value)) //kkkk bug?
    //   return value;
    if (Array.isArray(value)) {
      return undefined;
    }
    if (typeof value !== "string") {
      value = value.toString();
    }
    const prefix = event.selStart >= 0
      ? value.substring(0, event.selStart)
      : "";
    const postfix = event.selEnd >= 0 && event.selEnd <= value.length
      ? value.substring(event.selEnd)
      : "";

    return `${prefix}${event.change}${postfix}`;
  }

  userActivation() {
    this._document.obj._userActivation = true;
    this._externalCall("setTimeout", [
      USERACTIVATION_CALLBACKID,
      USERACTIVATION_MAXTIME_VALIDITY,
    ]);
  }

  dispatch(baseEvent: ScriptingEventData) {
    /*#static*/ if (TESTING) {
      if (baseEvent.name === "sandboxtripbegin") {
        this._externalCall("send", [{ command: "sandboxTripEnd" }]);
        return;
      }
    }

    const id = baseEvent.id!;
    if (!(id in this._objects)) {
      let event: Event | undefined;
      if (id === "doc" || id === "page") {
        event = (globalThis as any).event = new Event(baseEvent);
        event.source = event.target = this._document.wrapped;
        event.name = baseEvent.name;
      }
      if (id === "doc") {
        const eventName = event!.name;
        if (eventName === "Open") {
          // The user has decided to open this pdf, hence we enable
          // userActivation.
          this.userActivation();
          // Initialize named actions before calling formatAll to avoid any
          // errors in the case where a formatter is using one of those named
          // actions (see #15818).
          this._document.obj._initActions();
          // Before running the Open event, we run the format callbacks but
          // without changing the value of the fields.
          // Acrobat does the same thing.
          this.formatAll();
        }
        if (
          !["DidPrint", "DidSave", "WillPrint", "WillSave"].includes(eventName)
        ) {
          this.userActivation();
        }
        this._document.obj._dispatchDocEvent(event!.name);
      } else if (id === "page") {
        this.userActivation();
        this._document.obj._dispatchPageEvent(
          event!.name,
          baseEvent.actions!,
          baseEvent.pageNumber!,
        );
      } else if (id === "app" && baseEvent.name === "ResetForm") {
        this.userActivation();
        for (const fieldId of baseEvent.ids!) {
          const obj = this._objects[fieldId];
          obj?.obj._reset();
        }
      }
      return;
    }

    const name = baseEvent.name;
    const source = this._objects[id];
    const event = ((globalThis as any).event = new Event(baseEvent));
    let savedChange: SavedChange_;

    this.userActivation();

    if (source.obj._isButton()) {
      source.obj._id = id;
      event.value = source.obj._getExportValue(event.value);
      if (name === "Action") {
        source.obj._value = event.value;
      }
    }

    switch (name) {
      case "Keystroke":
        savedChange = {
          value: event.value,
          changeEx: event.changeEx,
          change: event.change,
          selStart: event.selStart,
          selEnd: event.selEnd,
        };
        break;
      case "Blur":
      case "Focus":
        Object.defineProperty(event, "value", {
          configurable: false,
          writable: false,
          enumerable: true,
          value: event.value,
        });
        break;
      case "Validate":
        this.runValidation(source, event);
        return;
      case "Action":
        this.runActions(source, source, event, name);
        this.runCalculate(source, event);
        return;
    }

    this.runActions(source, source, event, name);

    if (name !== "Keystroke") {
      return;
    }

    if (event.rc) {
      if (event.willCommit) {
        this.runValidation(source, event);
      } else {
        if (source.obj._isChoice) {
          source.obj.value = savedChange!.changeEx;
          source.obj._send!({
            id: source.obj._id,
            siblings: source.obj._siblings,
            value: source.obj.value,
          });
          return;
        }

        const value = (source.obj.value = this.mergeChange(event)!);
        let selStart, selEnd;
        if (
          event.selStart !== savedChange!.selStart ||
          event.selEnd !== savedChange!.selEnd
        ) {
          // Selection has been changed by the script so apply the changes.
          selStart = event.selStart;
          selEnd = event.selEnd;
        } else {
          selEnd = selStart = savedChange!.selStart + event.change.length;
        }
        source.obj._send!({
          id: source.obj._id,
          siblings: source.obj._siblings,
          value,
          selRange: [selStart, selEnd],
        });
      }
    } else if (!event.willCommit) {
      source.obj._send!({
        id: source.obj._id,
        siblings: source.obj._siblings,
        value: savedChange!.value,
        selRange: [savedChange!.selStart, savedChange!.selEnd],
      });
    } else {
      // Entry is not valid (rc == false) and it's a commit
      // so just clear the field.
      source.obj._send!({
        id: source.obj._id,
        siblings: source.obj._siblings,
        value: "",
        formattedValue: undefined,
        selRange: [0, 0],
      });
    }
  }

  formatAll() {
    // Run format actions if any for all the fields.
    const event =
      ((globalThis as any).event = new Event({} as ScriptingEventData));
    for (const source of Object.values(this._objects)) {
      event.value = source.obj._getValue() as string | number;
      this.runActions(source, source, event, "Format");
    }
  }

  runValidation(source: FieldWrapped, event: Event) {
    const didValidateRun = this.runActions(source, source, event, "Validate");
    if (event.rc) {
      source.obj.value = event.value;

      this.runCalculate(source, event);

      const savedValue =
        (event.value = source.obj._getValue() as string | number);
      let formattedValue: string | undefined;

      if (this.runActions(source, source, event, "Format")) {
        formattedValue = event.value?.toString?.();
      }

      source.obj._send!({
        id: source.obj._id,
        siblings: source.obj._siblings,
        value: savedValue,
        formattedValue,
      });
      event.value = savedValue;
    } else if (didValidateRun) {
      // The value is not valid.
      source.obj._send!({
        id: source.obj._id,
        siblings: source.obj._siblings,
        value: "",
        formattedValue: undefined,
        selRange: [0, 0],
        focus: true, // Stay in the field.
      });
    }
  }

  runActions(
    source: FieldWrapped,
    target: FieldWrapped,
    event: Event,
    eventName: ScriptingActionName,
  ) {
    event.source = source.wrapped;
    event.target = target.wrapped;
    event.name = eventName;
    event.targetName = target.obj.name;
    event.rc = true;

    return target.obj._runActions(event);
  }

  calculateNow() {
    // This function can be called by a JS script (doc.calculateNow()).
    // If !this._calculationOrder then there is nothing to calculate.
    // _isCalculating is here to prevent infinite recursion with calculateNow.
    // If !this._document.obj.calculate then the script doesn't want to have
    // a calculate.

    if (
      !this._calculationOrder ||
      this._isCalculating ||
      !this._document.obj.calculate
    ) {
      return;
    }
    this._isCalculating = true;
    const first = this._calculationOrder[0];
    const source = this._objects[first];
    (<any> globalThis).event = new Event({} as ScriptingEventData);

    try {
      this.runCalculate(source, (<any> globalThis).event);
    } catch (error) {
      this._isCalculating = false;
      throw error;
    }

    this._isCalculating = false;
  }

  runCalculate(source: FieldWrapped, event: Event) {
    // _document.obj.calculate is equivalent to doc.calculate and can be
    // changed by a script to allow a future calculate or not.
    // This function is either called by calculateNow or when an action
    // is triggered (in this case we cannot be currently calculating).
    // So there are no need to check for _isCalculating because it has
    // been already done in calculateNow.
    if (!this._calculationOrder || !this._document.obj.calculate) {
      return;
    }

    for (const targetId of this._calculationOrder) {
      if (!(targetId in this._objects)) {
        continue;
      }

      if (!this._document.obj.calculate) {
        // An action could have changed calculate value.
        break;
      }

      event.value = undefined as any;
      const target = this._objects[targetId];
      let savedValue = target.obj._getValue();
      this.runActions(source, target, event, "Calculate");
      if (!event.rc) {
        continue;
      }

      if (event.value !== undefined) {
        // A new value has been calculated so set it.
        target.obj.value = event.value;
      } else {
        event.value = target.obj._getValue() as string | number;
      }

      this.runActions(target, target, event, "Validate");
      if (!event.rc) {
        if (target.obj._getValue() !== savedValue) {
          target.wrapped.value = savedValue;
        }
        continue;
      }

      if (event.value === undefined) {
        event.value = target.obj._getValue() as string | number;
      }

      savedValue = target.obj._getValue();
      let formattedValue: string | undefined;
      if (this.runActions(target, target, event, "Format")) {
        formattedValue = event.value?.toString?.();
      }

      target.obj._send!({
        id: target.obj._id,
        siblings: target.obj._siblings,
        value: <string> savedValue,
        formattedValue,
      });
    }
  }
}
/*80--------------------------------------------------------------------------*/
