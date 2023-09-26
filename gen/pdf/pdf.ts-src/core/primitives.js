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
import { PDFJSDev, TESTING } from "../../../global.js";
import { assert, fail } from "../../../lib/util/trace.js";
import { shadow } from "../shared/util.js";
/*80--------------------------------------------------------------------------*/
export const CIRCULAR_REF = Symbol("CIRCULAR_REF");
export const EOF = Symbol("EOF");
let CmdCache = Object.create(null);
let NameCache = Object.create(null);
let RefCache = Object.create(null);
export function clearPrimitiveCaches() {
    CmdCache = Object.create(null);
    NameCache = Object.create(null);
    RefCache = Object.create(null);
}
export class Name {
    name;
    constructor(name) {
        /*#static*/  {
            if (typeof name !== "string") {
                fail('Name: The "name" must be a string.');
            }
        }
        this.name = name;
    }
    static get(name) {
        // eslint-disable-next-line no-restricted-syntax
        return (NameCache[name] ||= new Name(name));
    }
}
export class Cmd {
    cmd;
    constructor(cmd) {
        /*#static*/  {
            if (typeof cmd !== "string") {
                fail('Cmd: The "cmd" must be a string.');
            }
        }
        this.cmd = cmd;
    }
    static get(cmd) {
        // eslint-disable-next-line no-restricted-syntax
        return (CmdCache[cmd] ||= new Cmd(cmd));
    }
}
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
                fail('Dict.set: The "key" must be a string.');
            }
            else if (value === undefined) {
                fail('Dict.set: The "value" cannot be undefined.');
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
                    fail("Dict.get: Expected keys to be ordered by length.");
                }
            }
            value = this.#map[key2];
            if (value === undefined && key3 !== undefined) {
                /*#static*/  {
                    if (key3.length < key2.length) {
                        fail("Dict.get: Expected keys to be ordered by length.");
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
                    fail("Dict.getAsync: Expected keys to be ordered by length.");
                }
            }
            value = this.#map[key2];
            if (value === undefined && key3 !== undefined) {
                /*#static*/  {
                    if (key3.length < key2.length) {
                        fail("Dict.getAsync: Expected keys to be ordered by length.");
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
                    fail("Dict.getArray: Expected keys to be ordered by length.");
                }
            }
            value = this.#map[key2];
            if (value === undefined && key3 !== undefined) {
                /*#static*/  {
                    if (key3.length < key2.length) {
                        fail("Dict.getArray: Expected keys to be ordered by length.");
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
            fail("Should not call `set` on the empty dictionary.");
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
export class Ref {
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
    static fromString(str) {
        const ref = RefCache[str];
        if (ref) {
            return ref;
        }
        const m = /^(\d+)R(\d*)$/.exec(str);
        if (!m || m[1] === "0") {
            return undefined;
        }
        // eslint-disable-next-line no-restricted-syntax
        return (RefCache[str] = new Ref(parseInt(m[1]), !m[2] ? 0 : parseInt(m[2])));
    }
    static get(num, gen) {
        const key = gen === 0 ? `${num}R` : `${num}R${gen}`;
        // eslint-disable-next-line no-restricted-syntax
        return (RefCache[key] ||= new Ref(num, gen));
    }
}
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
                fail('RefSet: Invalid "parent" value.');
            }
        }
        // TS18030: An optional chain cannot contain private identifiers
        // Ref. https://github.com/microsoft/TypeScript/issues/42734
        // this.#set = new Set(parent?.#set);
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
    return v instanceof Dict &&
        (type === undefined || isName(v.get("Type"), type));
}
export function isRefsEqual(v1, v2) {
    /*#static*/  {
        assert(v1 instanceof Ref && v2 instanceof Ref, "isRefsEqual: Both parameters should be `Ref`s.");
    }
    return v1.num === v2.num && v1.gen === v2.gen;
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=primitives.js.map