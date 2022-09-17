/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */

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

import { Field, SendFieldData } from "./field.ts";
import { PDFObject, SendData } from "./pdf_object.ts";
/*80--------------------------------------------------------------------------*/

type _Obj = PDFObject<SendData>;
export class ScriptingProxyHandler implements ProxyHandler<_Obj> {
  /**
   * Don't dispatch an event for those properties.
   *  - delay: allow to delay field redraw until delay is set to false.
   *    Likely it's useless to implement that stuff.
   */
  nosend = new Set(["delay"]);

  get(obj: _Obj, prop: keyof _Obj) {
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

  set(obj: _Obj, prop: keyof _Obj, value: _Obj[keyof _Obj]) {
    if ((<any> obj)._kidIds) {
      // If the field is a container for other fields then
      // dispatch the kids.
      (<Field> obj)._kidIds!.forEach((id) => {
        (<Field> obj)._appObjects[id].wrapped[prop] = value;
      });
    }

    if (typeof prop === "string" && !prop.startsWith("_") && prop in obj) {
      const old = obj[prop];
      obj[prop] = value;
      if (
        !this.nosend.has(prop) &&
        obj._send &&
        obj._id !== null &&
        typeof old !== "function"
      ) {
        const data: SendData = { id: obj._id };
        (<any> data)[prop] = obj[prop];

        // send the updated value to the other side
        if (!(<any> obj)._siblings) {
          obj._send(data);
        } else {
          (<SendFieldData> data).siblings = (<Field> obj)._siblings;
          obj._send(data);
        }
      }
    } else {
      obj._expandos[prop] = value;
    }
    return true;
  }

  has(obj: _Obj, prop: keyof _Obj) {
    return (
      prop in obj._expandos ||
      (typeof prop === "string" && !prop.startsWith("_") && prop in obj)
    );
  }

  getPrototypeOf(obj: _Obj) {
    return null;
  }

  setPrototypeOf(obj: _Obj, proto: null) {
    return false;
  }

  isExtensible(obj: _Obj) {
    return true;
  }

  preventExtensions(obj: _Obj) {
    return false;
  }

  getOwnPropertyDescriptor(obj: _Obj, prop: keyof _Obj) {
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

  defineProperty(obj: _Obj, key: keyof _Obj, descriptor: PropertyDescriptor) {
    Object.defineProperty(obj._expandos, key, descriptor);
    return true;
  }

  deleteProperty(obj: _Obj, prop: keyof _Obj) {
    if (prop in obj._expandos) {
      delete obj._expandos[prop];
    }
    return true;
  }

  ownKeys(obj: _Obj) {
    const fromExpandos = Reflect.ownKeys(obj._expandos);
    const fromObj = Reflect.ownKeys(obj).filter((k) =>
      !(<string> k).startsWith("_")
    );
    return fromExpandos.concat(fromObj);
  }
}
/*80--------------------------------------------------------------------------*/
