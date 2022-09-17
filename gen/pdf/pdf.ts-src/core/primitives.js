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
import { _PDFDEV } from "../../../global.js";
import { assert } from "../../../lib/util/trace.js";
import { shadow } from "../shared/util.js";
/*80--------------------------------------------------------------------------*/
export const CIRCULAR_REF = Symbol("CIRCULAR_REF");
export const EOF = Symbol("EOF");
var XFANsName;
(function (XFANsName) {
    let nameCache = Object.create(null);
    class Name {
        name;
        constructor(name) {
            /*#static*/  {
                if (typeof name !== "string") {
                    assert(0, 'Name: The "name" must be a string.');
                }
            }
            this.name = name;
        }
        static get(name) {
            // eslint-disable-next-line no-restricted-syntax
            return nameCache[name] || (nameCache[name] = new Name(name));
        }
        static _clearCache() {
            nameCache = Object.create(null);
        }
    }
    XFANsName.Name = Name;
})(XFANsName || (XFANsName = {}));
export var Name = XFANsName.Name;
var NsCmd;
(function (NsCmd) {
    let cmdCache = Object.create(null);
    class Cmd {
        cmd;
        constructor(cmd) {
            /*#static*/  {
                if (typeof cmd !== "string") {
                    assert(0, 'Cmd: The "cmd" must be a string.');
                }
            }
            this.cmd = cmd;
        }
        static get(cmd) {
            // eslint-disable-next-line no-restricted-syntax
            return cmdCache[cmd] || (cmdCache[cmd] = new Cmd(cmd));
        }
        static _clearCache() {
            cmdCache = Object.create(null);
        }
    }
    NsCmd.Cmd = Cmd;
})(NsCmd || (NsCmd = {}));
export var Cmd = NsCmd.Cmd;
export class Dict {
    /* #map */
    // Map should only be used internally, use functions below to access.
    #map = Object.create(null);
    get size() {
        return Object.keys(this.#map).length;
    }
    /** No dereferencing. */
    getRaw(key) {
        return this.#map[key];
    }
    getKeys() {
        return Object.keys(this.#map);
    }
    /** No dereferencing. */
    getRawValues() {
        return Object.values(this.#map);
    }
    set(key, value) {
        /*#static*/  {
            if (typeof key !== "string") {
                assert(0, 'Dict.set: The "key" must be a string.');
            }
            else if (value === undefined) {
                assert(0, 'Dict.set: The "value" cannot be undefined.');
            }
        }
        this.#map[key] = value;
    }
    has(key) {
        return this.#map[key] !== undefined;
    }
    /* ~ */
    xref;
    assignXref(newXref) {
        this.xref = newXref;
    }
    objId;
    suppressEncryption = false;
    constructor(xref) {
        this.xref = xref;
    }
    /**
     * Automatically dereferences Ref objects.
     */
    get(key1, key2, key3) {
        let value = this.#map[key1];
        if (value === undefined && key2 !== undefined) {
            /*#static*/  {
                if (key2.length < key1.length) {
                    assert(0, "Dict.get: Expected keys to be ordered by length.");
                }
            }
            value = this.#map[key2];
            if (value === undefined && key3 !== undefined) {
                /*#static*/  {
                    if (key3.length < key2.length) {
                        assert(0, "Dict.get: Expected keys to be ordered by length.");
                    }
                }
                value = this.#map[key3];
            }
        }
        if (value instanceof Ref && this.xref) {
            return this.xref.fetch(value, this.suppressEncryption);
        }
        return value;
    }
    /**
     * Same as get(), but returns a promise and uses fetchIfRefAsync().
     */
    async getAsync(key1, key2, key3) {
        let value = this.#map[key1];
        if (value === undefined && key2 !== undefined) {
            /*#static*/  {
                if (key2.length < key1.length) {
                    assert(0, "Dict.getAsync: Expected keys to be ordered by length.");
                }
            }
            value = this.#map[key2];
            if (value === undefined && key3 !== undefined) {
                /*#static*/  {
                    if (key3.length < key2.length) {
                        assert(0, "Dict.getAsync: Expected keys to be ordered by length.");
                    }
                }
                value = this.#map[key3];
            }
        }
        if (value instanceof Ref && this.xref) {
            return this.xref.fetchAsync(value, this.suppressEncryption);
        }
        return value;
    }
    /**
     * Same as get(), but dereferences all elements if the result is an Array.
     */
    getArray(key1, key2, key3) {
        let value = this.#map[key1];
        if (value === undefined && key2 !== undefined) {
            /*#static*/  {
                if (key2.length < key1.length) {
                    assert(0, "Dict.getArray: Expected keys to be ordered by length.");
                }
            }
            value = this.#map[key2];
            if (value === undefined && key3 !== undefined) {
                /*#static*/  {
                    if (key3.length < key2.length) {
                        assert(0, "Dict.getArray: Expected keys to be ordered by length.");
                    }
                }
                value = this.#map[key3];
            }
        }
        if (value instanceof Ref && this.xref) {
            value = this.xref.fetch(value, this.suppressEncryption);
        }
        if (Array.isArray(value)) {
            value = value.slice(); // Ensure that we don't modify the Dict data.
            for (let i = 0, ii = value.length; i < ii; i++) {
                if (value[i] instanceof Ref && this.xref) {
                    value[i] = this.xref.fetch(value[i], this.suppressEncryption);
                }
            }
        }
        return value;
    }
    forEach(callback) {
        for (let key in this.#map) {
            callback(key, this.get(key));
        }
    }
    static get empty() {
        const emptyDict = new Dict();
        emptyDict.set = (key, value) => {
            assert(0, "Should not call `set` on the empty dictionary.");
        };
        return shadow(this, "empty", emptyDict);
    }
    static merge({ xref, dictArray, mergeSubDicts = false }) {
        const mergedDict = new Dict(xref), properties = new Map();
        for (const dict of dictArray) {
            if (!(dict instanceof Dict)) {
                continue;
            }
            for (const [key, value] of Object.entries(dict.#map)) {
                let property = properties.get(key);
                if (property === undefined) {
                    property = [];
                    properties.set(key, property);
                }
                else if (!mergeSubDicts || !(value instanceof Dict)) {
                    // Ignore additional entries, if either:
                    //  - This is a "shallow" merge, where only the first element matters.
                    //  - The value is *not* a `Dict`, since other types cannot be merged.
                    continue;
                }
                property.push(value);
            }
        }
        for (const [name, values] of properties) {
            if (values.length === 1 || !(values[0] instanceof Dict)) {
                mergedDict.#map[name] = values[0];
                continue;
            }
            const subDict = new Dict(xref);
            for (const dict of values) {
                for (const [key, value] of Object.entries(dict.#map)) {
                    if (subDict.#map[key] === undefined) {
                        subDict.#map[key] = value;
                    }
                }
            }
            if (subDict.size > 0) {
                mergedDict.#map[name] = subDict;
            }
        }
        properties.clear();
        return mergedDict.size > 0 ? mergedDict : Dict.empty;
    }
}
export class FontDict extends Dict {
    loadedName;
    translated;
    fontAliases;
    cacheKey;
}
export var NsRef;
(function (NsRef) {
    let refCache = Object.create(null);
    class Ref {
        /** object number */
        num;
        /** generation number */
        gen;
        constructor(num, gen) {
            this.num = num;
            this.gen = gen;
        }
        toString() {
            // This function is hot, so we make the string as compact as possible.
            // |this.gen| is almost always zero, so we treat that case specially.
            if (this.gen === 0) {
                return `${this.num}R`;
            }
            return `${this.num}R${this.gen}`;
        }
        static get(num, gen) {
            const key = gen === 0 ? `${num}R` : `${num}R${gen}`;
            // eslint-disable-next-line no-restricted-syntax
            return refCache[key] || (refCache[key] = new Ref(num, gen));
        }
        static _clearCache() {
            refCache = Object.create(null);
        }
    }
    NsRef.Ref = Ref;
})(NsRef || (NsRef = {}));
// Hoisting for deno.
export var Ref = NsRef.Ref;
// The reference is identified by number and generation.
// This structure stores only one instance of the reference.
export class RefSet {
    #set = new Set();
    has(ref) {
        return this.#set.has(ref.toString());
    }
    put(ref) {
        this.#set.add(ref.toString());
    }
    remove(ref) {
        this.#set.delete(ref.toString());
    }
    [Symbol.iterator]() {
        return this.#set.values();
    }
    clear() {
        this.#set.clear();
    }
    constructor(parent) {
        /*#static*/  {
            if (parent && !(parent instanceof RefSet)) {
                assert(0, 'RefSet: Invalid "parent" value.');
            }
        }
        this.#set = new Set(parent && parent.#set);
    }
}
export class RefSetCache {
    #map = new Map();
    get size() {
        return this.#map.size;
    }
    get(ref) {
        return this.#map.get(ref.toString());
    }
    has(ref) {
        return this.#map.has(ref.toString());
    }
    put(ref, obj) {
        this.#map.set(ref.toString(), obj);
    }
    putAlias(ref, aliasRef) {
        this.#map.set(ref.toString(), this.get(aliasRef));
    }
    [Symbol.iterator]() {
        return this.#map.values();
    }
    clear() {
        this.#map.clear();
    }
}
export function isName(v, name) {
    return v instanceof Name && (name === undefined || v.name === name);
}
export function isCmd(v, cmd) {
    return v instanceof Cmd && (cmd === undefined || v.cmd === cmd);
}
export function isDict(v, type) {
    return v instanceof Dict && (type === undefined || isName(v.get("Type"), type));
}
export function isRefsEqual(v1, v2) {
    return v1.num === v2.num && v1.gen === v2.gen;
}
export function clearPrimitiveCaches() {
    Cmd._clearCache();
    Name._clearCache();
    Ref._clearCache();
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=primitives.js.map