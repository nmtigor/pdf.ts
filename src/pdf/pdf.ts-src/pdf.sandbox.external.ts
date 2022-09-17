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

// In mozilla-central, this file is loaded as non-module script,
// so it mustn't have any dependencies.

import { EventInSandBox } from "../pdf.ts-web/interfaces.ts";
/*80--------------------------------------------------------------------------*/

export class SandboxSupportBase {
  win;
  timeoutIds = new Map<number, number>();

  /**
   * Will be assigned after the sandbox is initialized
   */
  commFun: ((name: string, args: string) => void) | undefined;

  constructor(win: typeof window) {
    this.win = win;
  }

  destroy() {
    // this.commFunc = null; //kkkk bug? ✅
    this.commFun = undefined;
    // this.timeoutIds.forEach(( [_, id]) => this.win.clearTimeout(id)); //kkkk bug? ✅
    this.timeoutIds.forEach((_, id) => this.win.clearTimeout(id));
    this.timeoutIds = undefined as any;
  }

  /**
   * @param val Export a value in the sandbox.
   */
  exportValueToSandbox(val: object): string {
    throw new Error("Not implemented");
  }

  /**
   * @param val Import a value from the sandbox.
   */
  importValueFromSandbox(val: object) {
    throw new Error("Not implemented");
  }

  /**
   * @param errorMessage Create an error in the sandbox.
   */
  createErrorForSandbox(errorMessage: string) {
    throw new Error("Not implemented");
  }

  /**
   * @param {String} name - Name of the function to call in the sandbox
   * @param {Array<Object>} args - Arguments of the function.
   */
  callSandboxFunction(
    name: string,
    args:
      | { callbackId: number; nMilliseconds?: number; interval?: boolean }
      | EventInSandBox,
  ) {
    try {
      const args_ = this.exportValueToSandbox(args);
      this.commFun!(name, args_);
    } catch (e) {
      this.win.console.error(e);
    }
  }

  createSandboxExternals() {
    // All the functions in externals object are called
    // from the sandbox.
    const externals = {
      setTimeout: (callbackId: number, nMilliseconds: number) => {
        if (
          typeof callbackId !== "number" ||
          typeof nMilliseconds !== "number"
        ) {
          return;
        }
        const id = this.win.setTimeout(() => {
          this.timeoutIds.delete(callbackId);
          this.callSandboxFunction("timeoutCb", {
            callbackId,
            interval: false,
          });
        }, nMilliseconds);
        this.timeoutIds.set(callbackId, id);
      },
      clearTimeout: (id: number) => {
        this.win.clearTimeout(this.timeoutIds.get(id));
        this.timeoutIds.delete(id);
      },
      setInterval: (callbackId: number, nMilliseconds: number) => {
        if (
          typeof callbackId !== "number" ||
          typeof nMilliseconds !== "number"
        ) {
          return;
        }
        const id = this.win.setInterval(() => {
          this.callSandboxFunction("timeoutCb", {
            callbackId,
            interval: true,
          });
        }, nMilliseconds);
        this.timeoutIds.set(callbackId, id);
      },
      clearInterval: (id: number) => {
        this.win.clearInterval(this.timeoutIds.get(id));
        this.timeoutIds.delete(id);
      },
      alert: (cMsg: string) => {
        if (typeof cMsg !== "string") {
          return;
        }
        this.win.alert(cMsg);
      },
      confirm: (cMsg: string) => {
        if (typeof cMsg !== "string") {
          return false;
        }
        return this.win.confirm(cMsg);
      },
      prompt: (cQuestion: string, cDefault: string) => {
        if (typeof cQuestion !== "string" || typeof cDefault !== "string") {
          return undefined;
        }
        return this.win.prompt(cQuestion, cDefault);
      },
      parseURL: (cUrl: string) => {
        const url = new this.win.URL(cUrl);
        const props = [
          "hash",
          "host",
          "hostname",
          "href",
          "origin",
          "password",
          "pathname",
          "port",
          "protocol",
          "search",
          "searchParams",
          "username",
        ] as const;

        return Object.fromEntries(
          props.map((name) => [name, url[name].toString()]),
        );
      },
      send: (data: object) => {
        if (!data) {
          return;
        }
        const event = new this.win.CustomEvent("updatefromsandbox", {
          detail: this.importValueFromSandbox(data),
        });
        this.win.dispatchEvent(event);
      },
    };
    Object.setPrototypeOf(externals, null);

    return (name: keyof typeof externals, args: unknown[]) => {
      try {
        const result = (<any> externals)[name](...args);
        return this.exportValueToSandbox(result);
      } catch (error: any) {
        throw this.createErrorForSandbox(error?.toString() ?? "");
      }
    };
  }
}

// /*#static*/if( !MOZCENTRAL)
// {
//   exports.SandboxSupportBase = SandboxSupportBase;
// } else {
//   /* eslint-disable-next-line no-unused-vars, no-var */
//   var EXPORTED_SYMBOLS = ["SandboxSupportBase"];
// }
/*80--------------------------------------------------------------------------*/
