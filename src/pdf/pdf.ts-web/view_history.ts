/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
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

import { ScrollMode, SidebarView, SpreadMode } from "./ui_utils";
/*81---------------------------------------------------------------------------*/

const DEFAULT_VIEW_HISTORY_CACHE_SIZE = 20;

export interface MultipleStored
{
  page:number | undefined;
  zoom?:string | number | undefined;
  scrollLeft:number;
  scrollTop:number;
  rotation:number | undefined;
  sidebarView?:SidebarView,
  scrollMode?:ScrollMode,
  spreadMode?:SpreadMode,
}

/**
 * View History - This is a utility for saving various view parameters for
 *                recently opened files.
 *
 * The way that the view parameters are stored depends on how PDF.js is built,
 * for 'gulp <flag>' the following cases exist:
 *  - MOZCENTRAL        - uses sessionStorage.
 *  - GENERIC or CHROME - uses localStorage, if it is available.
 */
export class ViewHistory 
{
  _initializedPromise:Promise<unknown>;

  file!:Record< string, string | number >;
  database:unknown;

  constructor( 
    public fingerprint:string,
    public cacheSize=DEFAULT_VIEW_HISTORY_CACHE_SIZE 
  ) {
    this._initializedPromise = this._readFromStorage().then(databaseStr => 
    {
      const database = JSON.parse(databaseStr || "{}");
      let index = -1;
      if( !Array.isArray(database.files) )
      {
        database.files = [];
      } 
      else {
        while (database.files.length >= this.cacheSize) {
          database.files.shift();
        }

        for( let i = 0, ii = database.files.length; i < ii; i++ )
        {
          const branch = database.files[i];
          if (branch.fingerprint === this.fingerprint) {
            index = i;
            break;
          }
        }
      }
      if (index === -1) {
        index = database.files.push({ fingerprint: this.fingerprint }) - 1;
      }
      this.file = database.files[index];
      this.database = database;
    });
  }

  async _writeToStorage() {
    const databaseStr = JSON.stringify(this.database);

    // #if MOZCENTRAL
    // if (typeof PDFJSDev !== "undefined" && PDFJSDev.test("MOZCENTRAL")) {
    sessionStorage.setItem("pdfjs.history", databaseStr);
    return;
    // }
    // #endif
    localStorage.setItem("pdfjs.history", databaseStr);
  }

  async _readFromStorage()
  {
    // #if MOZCENTRAL
    // if (typeof PDFJSDev !== "undefined" && PDFJSDev.test("MOZCENTRAL")) {
    return sessionStorage.getItem("pdfjs.history");
    // }
    // #endif
    return localStorage.getItem("pdfjs.history");
  }

  async set( name:string, val:SidebarView | ScrollMode | SpreadMode )
  {
    await this._initializedPromise;
    this.file[name] = val;
    return this._writeToStorage();
  }

  async setMultiple( properties:MultipleStored )
  {
    await this._initializedPromise;
    for( const name in properties )
    {
      this.file[name] = (<any>properties)[name];
    }
    return this._writeToStorage();
  }

  async get( name:string, defaultValue:SidebarView | ScrollMode | SpreadMode )
  {
    await this._initializedPromise;
    const val = this.file[name];
    return val !== undefined ? val : defaultValue;
  }

  async getMultiple( properties:MultipleStored )
  {
    await this._initializedPromise;
    const values:MultipleStored = Object.create(null);

    for( const name in properties )
    {
      const val = this.file[name];
      (<any>values)[name] = val !== undefined ? val : properties[ <keyof MultipleStored>name ];
    }
    return values;
  }
}
/*81---------------------------------------------------------------------------*/
