/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-web/event_utils.ts
 * @license Apache-2.0
 ******************************************************************************/
import { PromiseCap } from "../../lib/util/PromiseCap.js";
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
export async function waitOnEventOrTimeout({ target, name, delay = 0, }) {
    if (typeof target !== "object" ||
        !(name && typeof name === "string") ||
        !(Number.isInteger(delay) && delay >= 0)) {
        throw new Error("waitOnEventOrTimeout - invalid parameters.");
    }
    const { promise, resolve } = new PromiseCap();
    const ac = new AbortController();
    function handler(type) {
        ac.abort(); // Remove event listener.
        clearTimeout(timeout);
        resolve(type);
    }
    const evtMethod = target instanceof EventBus ? "_on" : "addEventListener";
    target[evtMethod](name, handler.bind(undefined, WaitOnType.EVENT), {
        signal: ac.signal,
    });
    const timeout = setTimeout(handler.bind(undefined, WaitOnType.TIMEOUT), delay);
    return promise;
}
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
            signal: options?.signal,
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
        let rmAbort;
        if (options?.signal instanceof AbortSignal) {
            const { signal } = options;
            if (signal.aborted) {
                console.error("Cannot use an `aborted` signal.");
                return;
            }
            const onAbort = () => this._off(eventName, listener);
            rmAbort = () => signal.removeEventListener("abort", onAbort);
            signal.addEventListener("abort", onAbort);
        }
        const eventListeners = (this.#listeners[eventName] ||= []);
        eventListeners.push({
            listener,
            external: options?.external === true,
            once: options?.once === true,
            rmAbort,
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
            const evt = eventListeners[i];
            if (evt.listener === listener) {
                evt.rmAbort?.(); // Ensure that the `AbortSignal` listener is removed.
                eventListeners.splice(i, 1);
                return;
            }
        }
    }
}
/**
 * NOTE: Only used in the Firefox build-in pdf viewer.
 */
export class FirefoxEventBus extends EventBus {
    #externalServices;
    #globalEventNames;
    #isInAutomation;
    constructor(globalEventNames, externalServices, isInAutomation) {
        super();
        this.#globalEventNames = globalEventNames;
        this.#externalServices = externalServices;
        this.#isInAutomation = isInAutomation;
    }
    dispatch(eventName, data) {
        /*#static*/  {
            throw new Error("Not implemented: FirefoxEventBus.dispatch");
        }
        super.dispatch(eventName, data);
        if (this.#isInAutomation) {
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
        if (this.#globalEventNames?.has(eventName)) {
            this.#externalServices.dispatchGlobalEvent({
                eventName,
                detail: data,
            });
        }
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=event_utils.js.map