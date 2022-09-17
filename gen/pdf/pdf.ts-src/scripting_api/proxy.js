/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
export class ScriptingProxyHandler {
    /**
     * Don't dispatch an event for those properties.
     *  - delay: allow to delay field redraw until delay is set to false.
     *    Likely it's useless to implement that stuff.
     */
    nosend = new Set(["delay"]);
    get(obj, prop) {
        // script may add some properties to the object
        if (prop in obj._expandos) {
            const val = obj._expandos[prop];
            if (typeof val === "function") {
                return val.bind(obj);
            }
            return val;
        }
        if (typeof prop === "string" && !prop.startsWith("_") && prop in obj) {
            // return only public properties
            // i.e. the ones not starting with a '_'
            const val = obj[prop];
            if (typeof val === "function") {
                return val.bind(obj);
            }
            return val;
        }
        return undefined;
    }
    set(obj, prop, value) {
        if (obj._kidIds) {
            // If the field is a container for other fields then
            // dispatch the kids.
            obj._kidIds.forEach((id) => {
                obj._appObjects[id].wrapped[prop] = value;
            });
        }
        if (typeof prop === "string" && !prop.startsWith("_") && prop in obj) {
            const old = obj[prop];
            obj[prop] = value;
            if (!this.nosend.has(prop) &&
                obj._send &&
                obj._id !== null &&
                typeof old !== "function") {
                const data = { id: obj._id };
                data[prop] = obj[prop];
                // send the updated value to the other side
                if (!obj._siblings) {
                    obj._send(data);
                }
                else {
                    data.siblings = obj._siblings;
                    obj._send(data);
                }
            }
        }
        else {
            obj._expandos[prop] = value;
        }
        return true;
    }
    has(obj, prop) {
        return (prop in obj._expandos ||
            (typeof prop === "string" && !prop.startsWith("_") && prop in obj));
    }
    getPrototypeOf(obj) {
        return null;
    }
    setPrototypeOf(obj, proto) {
        return false;
    }
    isExtensible(obj) {
        return true;
    }
    preventExtensions(obj) {
        return false;
    }
    getOwnPropertyDescriptor(obj, prop) {
        if (prop in obj._expandos) {
            return {
                configurable: true,
                enumerable: true,
                value: obj._expandos[prop],
            };
        }
        if (typeof prop === "string" && !prop.startsWith("_") && prop in obj) {
            return { configurable: true, enumerable: true, value: obj[prop] };
        }
        return undefined;
    }
    defineProperty(obj, key, descriptor) {
        Object.defineProperty(obj._expandos, key, descriptor);
        return true;
    }
    deleteProperty(obj, prop) {
        if (prop in obj._expandos) {
            delete obj._expandos[prop];
        }
        return true;
    }
    ownKeys(obj) {
        const fromExpandos = Reflect.ownKeys(obj._expandos);
        const fromObj = Reflect.ownKeys(obj).filter((k) => !k.startsWith("_"));
        return fromExpandos.concat(fromObj);
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=proxy.js.map