/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
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

import { objectFromMap } from "../shared/util.js";
import { 
  ASVKey,
  AnnotStorageValue,
  AnnotStorageRecord,
} from "./annotation_layer.js";
/*81---------------------------------------------------------------------------*/

/**
 * Key/value storage for annotation data in forms.
 */
export class AnnotationStorage 
{
  _storage = new Map<string, AnnotStorageValue>();
  get size() { return this._storage.size; }

  _timeStamp = Date.now();
  /**
   * PLEASE NOTE: Only intended for usage within the API itself.
   * @ignore
   */
  get lastModified() { return this._timeStamp.toString(); }

  _modified = false;

  // Callbacks to signal when the modification state is set or reset.
  // This is used by the viewer to only bind on `beforeunload` if forms
  // are actually edited to prevent doing so unconditionally since that
  // can have undesirable effects.
  onSetModified?:() => void;
  onResetModified?:() => void;

  /**
   * Get the value for a given key if it exists, or return the default value.
   */
  getValue( key:string, defaultValue:AnnotStorageValue )
  {
    const value = this._storage.get(key);
    if (value === undefined) 
    {
      return defaultValue;
    }

    return Object.assign(defaultValue, value);
  }

  /**
   * Set the value for a given key
   */
  setValue( key:string, value:AnnotStorageValue ) 
  {
    const obj = this._storage.get(key);
    let modified = false;
    if( obj !== undefined )
    {
      for( const [entry, val] of Object.entries(value) )
      {
        if( obj[<ASVKey>entry] !== val) 
        {
          modified = true;
          (<any>obj)[entry] = val;
        }
      }
    } 
    else {
      modified = true;
      this._storage.set(key, value);
    }
    if (modified) 
    {
      this._timeStamp = Date.now();
      this.#setModified();
    }
  }

  getAll()
  {
    return this._storage.size > 0 ? objectFromMap(this._storage) : undefined;
  }

  #setModified()
  {
    if (!this._modified) 
    {
      this._modified = true;
      if (typeof this.onSetModified === "function") 
      {
        this.onSetModified();
      }
    }
  }

  resetModified() 
  {
    if (this._modified) 
    {
      this._modified = false;
      if (typeof this.onResetModified === "function") 
      {
        this.onResetModified();
      }
    }
  }

  /**
   * PLEASE NOTE: Only intended for usage within the API itself.
   * @ignore
   */
  get serializable()
  {
    return this._storage.size > 0 ? this._storage : undefined;
  }
}
/*81---------------------------------------------------------------------------*/
