/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/scripting_api/event.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { AnnotActions } from "../core/core_utils.js";
import type { DocWrapped, FieldWrapped } from "./app.js";
import type { ScriptingActionName } from "./common.js";
import type { Doc } from "./doc.js";
import type { Field } from "./field.js";
import type { ExternalCall } from "./initialization.js";
import type { ScriptingData, SendData } from "./pdf_object.js";
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
export declare class Event {
    change: string;
    changeEx: string | string[] | undefined;
    commitKey: number;
    fieldFull: boolean;
    keyDown: boolean;
    modifier: boolean;
    name: ScriptingActionName;
    rc: boolean;
    richChange: unknown[];
    richChangeEx: unknown[];
    richValue: unknown[];
    selEnd: number;
    selStart: number;
    shift: number | boolean;
    source: Field | Doc;
    target: Field | Doc | undefined;
    targetName: string;
    type: string;
    value: string | number;
    willCommit: boolean;
    constructor(data: ScriptingEventData);
}
export declare class EventDispatcher {
    _document: DocWrapped;
    _calculationOrder: string[] | undefined;
    _objects: Record<string, FieldWrapped>;
    _externalCall: ExternalCall;
    _isCalculating: boolean;
    constructor(document: DocWrapped, calculationOrder: string[] | undefined, objects: Record<string, FieldWrapped>, externalCall: ExternalCall);
    mergeChange(event: Event): string | undefined;
    userActivation(): void;
    dispatch(baseEvent: ScriptingEventData): void;
    formatAll(): void;
    runValidation(source: FieldWrapped, event: Event): void;
    runActions(source: FieldWrapped, target: FieldWrapped, event: Event, eventName: ScriptingActionName): boolean;
    calculateNow(): void;
    runCalculate(source: FieldWrapped, event: Event): void;
}
export {};
//# sourceMappingURL=event.d.ts.map