/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
/* Copyright 2012 Mozilla Foundation
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
import { MOZCENTRAL } from "../../global.js";
/*80--------------------------------------------------------------------------*/
export var WaitOnType;
(function (WaitOnType) {
    WaitOnType["EVENT"] = "event";
    WaitOnType["TIMEOUT"] = "timeout";
})(WaitOnType || (WaitOnType = {}));
/**
 * Allows waiting for an event or a timeout, whichever occurs first.
 * Can be used to ensure that an action always occurs, even when an event
 * arrives late or not at all.
 *
= * @return A promise that is resolved with a {WaitOnType} value.
 */
export function waitOnEventOrTimeout({ target, name, delay = 0, }) {
    return new Promise((resolve, reject) => {
        if (typeof target !== "object" ||
            !(name && typeof name === "string") ||
            !(Number.isInteger(delay) && delay >= 0)) {
            throw new Error("waitOnEventOrTimeout - invalid parameters.");
        }
        function handler(type) {
            if (target instanceof EventBus) {
                target._off(name, eventHandler);
            }
            else {
                target.removeEventListener(name, eventHandler);
            }
            if (timeout) {
                clearTimeout(timeout);
            }
            resolve(type);
        }
        const eventHandler = handler.bind(null, WaitOnType.EVENT);
        if (target instanceof EventBus) {
            target._on(name, eventHandler);
        }
        else {
            target.addEventListener(name, eventHandler);
        }
        const timeoutHandler = handler.bind(null, WaitOnType.TIMEOUT);
        const timeout = setTimeout(timeoutHandler, delay);
    });
}
/*49-------------------------------------------*/
/**
 * Simple event bus for an application. Listeners are attached using the `on`
 * and `off` methods. To raise an event, the `dispatch` method shall be used.
 */
export class EventBus {
    #listeners = Object.create(null);
    on(eventName, listener, options) {
        this._on(eventName, listener, {
            external: true,
            once: options?.once,
        });
    }
    off(eventName, listener) {
        this._off(eventName, listener);
    }
    dispatch(eventName, data) {
        const eventListeners = this.#listeners[eventName];
        if (!eventListeners || eventListeners.length === 0) {
            return;
        }
        let externalListeners;
        // Making copy of the listeners array in case if it will be modified
        // during dispatch.
        for (const { listener, external, once } of eventListeners.slice(0)) {
            if (once) {
                this._off(eventName, listener);
            }
            if (external) {
                (externalListeners ||= []).push(listener);
                continue;
            }
            listener(data);
        }
        // Dispatch any "external" listeners *after* the internal ones, to give the
        // viewer components time to handle events and update their state first.
        if (externalListeners) {
            for (const listener of externalListeners) {
                listener(data);
            }
            externalListeners = undefined;
        }
    }
    /**
     * @ignore
     */
    _on(eventName, listener, options) {
        const eventListeners = (this.#listeners[eventName] ||= []);
        eventListeners.push({
            listener,
            external: options?.external === true,
            once: options?.once === true,
        });
    }
    /**
     * @ignore
     */
    _off(eventName, listener) {
        const eventListeners = this.#listeners[eventName];
        if (!eventListeners) {
            return;
        }
        for (let i = 0, ii = eventListeners.length; i < ii; i++) {
            if (eventListeners[i].listener === listener) {
                eventListeners.splice(i, 1);
                return;
            }
        }
    }
}
/**
 * NOTE: Only used to support various PDF viewer tests in `mozilla-central`.
 */
export class AutomationEventBus extends EventBus {
    dispatch(eventName, data) {
        /*#static*/  {
            throw new Error("Not implemented: AutomationEventBus.dispatch");
        }
        super.dispatch(eventName, data);
        const detail = Object.create(null);
        if (data) {
            for (const key in data) {
                const value = data[key];
                if (key === "source") {
                    if (value === window || value === document) {
                        // No need to re-dispatch (already) global events.
                        return;
                    }
                    continue; // Ignore the `source` property.
                }
                detail[key] = value;
            }
        }
        const event = new CustomEvent(eventName, {
            bubbles: true,
            cancelable: true,
            detail,
        });
        document.dispatchEvent(event);
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=event_utils.js.map