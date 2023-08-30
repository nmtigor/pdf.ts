/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { USERACTIVATION_CALLBACKID, USERACTIVATION_MAXTIME_VALIDITY, } from "./app_utils.js";
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
    value;
    willCommit;
    constructor(data) {
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
export class EventDispatcher {
    _document;
    _calculationOrder;
    _objects;
    _externalCall;
    _isCalculating = false;
    constructor(document, calculationOrder, objects, externalCall) {
        this._document = document;
        this._calculationOrder = calculationOrder;
        this._objects = objects;
        this._externalCall = externalCall;
        this._document.obj._eventDispatcher = this;
    }
    mergeChange(event) {
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
    dispatch(baseEvent) {
        const id = baseEvent.id;
        if (!(id in this._objects)) {
            let event;
            if (id === "doc" || id === "page") {
                event = globalThis.event = new Event(baseEvent);
                event.source = event.target = this._document.wrapped;
                event.name = baseEvent.name;
            }
            if (id === "doc") {
                const eventName = event.name;
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
                if (!["DidPrint", "DidSave", "WillPrint", "WillSave"].includes(eventName)) {
                    this.userActivation();
                }
                this._document.obj._dispatchDocEvent(event.name);
            }
            else if (id === "page") {
                this.userActivation();
                this._document.obj._dispatchPageEvent(event.name, baseEvent.actions, baseEvent.pageNumber);
            }
            else if (id === "app" && baseEvent.name === "ResetForm") {
                this.userActivation();
                for (const fieldId of baseEvent.ids) {
                    const obj = this._objects[fieldId];
                    obj?.obj._reset();
                }
            }
            return;
        }
        const name = baseEvent.name;
        const source = this._objects[id];
        const event = (globalThis.event = new Event(baseEvent));
        let savedChange;
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
            }
            else {
                if (source.obj._isChoice) {
                    source.obj.value = savedChange.changeEx;
                    source.obj._send({
                        id: source.obj._id,
                        siblings: source.obj._siblings,
                        value: source.obj.value,
                    });
                    return;
                }
                const value = (source.obj.value = this.mergeChange(event));
                let selStart, selEnd;
                if (event.selStart !== savedChange.selStart ||
                    event.selEnd !== savedChange.selEnd) {
                    // Selection has been changed by the script so apply the changes.
                    selStart = event.selStart;
                    selEnd = event.selEnd;
                }
                else {
                    selEnd = selStart = savedChange.selStart + event.change.length;
                }
                source.obj._send({
                    id: source.obj._id,
                    siblings: source.obj._siblings,
                    value,
                    selRange: [selStart, selEnd],
                });
            }
        }
        else if (!event.willCommit) {
            source.obj._send({
                id: source.obj._id,
                siblings: source.obj._siblings,
                value: savedChange.value,
                selRange: [savedChange.selStart, savedChange.selEnd],
            });
        }
        else {
            // Entry is not valid (rc == false) and it's a commit
            // so just clear the field.
            source.obj._send({
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
        const event = (globalThis.event = new Event({}));
        for (const source of Object.values(this._objects)) {
            event.value = source.obj.value;
            this.runActions(source, source, event, "Format");
        }
    }
    runValidation(source, event) {
        const didValidateRun = this.runActions(source, source, event, "Validate");
        if (event.rc) {
            source.obj.value = event.value;
            this.runCalculate(source, event);
            // const savedValue = (event.value = <string> source.obj.value);
            const savedValue = source.obj._getValue();
            event.value = source.obj.value;
            let formattedValue;
            if (this.runActions(source, source, event, "Format")) {
                formattedValue = event.value?.toString?.();
            }
            source.obj._send({
                id: source.obj._id,
                siblings: source.obj._siblings,
                value: savedValue,
                formattedValue,
            });
            event.value = savedValue;
        }
        else if (didValidateRun) {
            // The value is not valid.
            source.obj._send({
                id: source.obj._id,
                siblings: source.obj._siblings,
                value: "",
                formattedValue: undefined,
                selRange: [0, 0],
                focus: true, // Stay in the field.
            });
        }
    }
    runActions(source, target, event, eventName) {
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
        if (!this._calculationOrder ||
            this._isCalculating ||
            !this._document.obj.calculate) {
            return;
        }
        this._isCalculating = true;
        const first = this._calculationOrder[0];
        const source = this._objects[first];
        globalThis.event = new Event({});
        try {
            this.runCalculate(source, globalThis.event);
        }
        catch (error) {
            this._isCalculating = false;
            throw error;
        }
        this._isCalculating = false;
    }
    runCalculate(source, event) {
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
            event.value = undefined;
            const target = this._objects[targetId];
            let savedValue = target.obj.value;
            this.runActions(source, target, event, "Calculate");
            if (!event.rc) {
                continue;
            }
            if (event.value !== undefined) {
                // A new value has been calculated so set it.
                target.obj.value = event.value;
            }
            event.value = target.obj.value;
            this.runActions(target, target, event, "Validate");
            if (!event.rc) {
                if (target.obj.value !== savedValue) {
                    target.wrapped.value = savedValue;
                }
                continue;
            }
            savedValue = event.value = target.obj.value;
            let formattedValue;
            if (this.runActions(target, target, event, "Format")) {
                formattedValue = event.value?.toString?.();
            }
            target.obj._send({
                id: target.obj._id,
                siblings: target.obj._siblings,
                value: savedValue,
                formattedValue,
            });
        }
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=event.js.map