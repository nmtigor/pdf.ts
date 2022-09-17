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

import ModuleLoader from "../../3rd/quickjs/quickjs-eval.js";
import { _PDFDEV } from "../../global.ts";
import { EventInSandBox } from "../pdf.ts-web/interfaces.ts";
import { SandboxSupportBase } from "./pdf.sandbox.external.ts";
/*80--------------------------------------------------------------------------*/

// /* eslint-disable-next-line no-unused-vars */
// const pdfjsVersion = PDFJSDev.eval("BUNDLE_VERSION");
// /* eslint-disable-next-line no-unused-vars */
// const pdfjsBuild = PDFJSDev.eval("BUNDLE_BUILD");

class SandboxSupport extends SandboxSupportBase {
  override exportValueToSandbox(val: object) {
    // The communication with the Quickjs sandbox is based on strings
    // So we use JSON.stringfy to serialize
    return JSON.stringify(val);
  }

  override importValueFromSandbox(val: object) {
    return val;
  }

  override createErrorForSandbox(errorMessage: string) {
    return new Error(errorMessage);
  }
}

// const PDF_SCRIPTING_JS_SOURCE =
//   await fetch( "./pdf.scripting.js").then( res => res.text());

class Sandbox {
  support;

  _module;

  /**
   * 0 to display error using console.error
   * else display error using window.alert
   */
  _alertOnError = 0;

  constructor(win: typeof window, module: unknown) {
    this.support = new SandboxSupport(win);

    // The "external" functions created in pdf.sandbox.external.js
    // are finally used here:
    // https://github.com/mozilla/pdf.js.quickjs/blob/main/src/myjs.js
    // They're called from the sandbox only.
    (<any> module).externalCall = this.support.createSandboxExternals();

    this._module = module;
  }

  create(data: unknown) {
    /*#static*/ if (_PDFDEV) {
      (<any> this._module).ccall("nukeSandbox", null, []);
    }
    // const code = [PDFJSDev.eval( "PDF_SCRIPTING_JS_SOURCE")];
    // const code = [PDF_SCRIPTING_JS_SOURCE];
    const code = [""];

    /*#static*/ if (_PDFDEV) {
      code.push(
        `globalThis.sendResultForTesting = callExternalFunction.bind( null, "send");`,
      );
    } else {
      code.push("delete dump;");
    }

    let success = false;
    let buf = 0;
    try {
      const sandboxData = JSON.stringify(data);
      // "pdfjsScripting.initSandbox..." MUST be the last line to be evaluated
      // since the returned value is used for the communication.
      code.push(`pdfjsScripting.initSandbox({ data: ${sandboxData} })`);
      buf = (<any> this._module).stringToNewUTF8(code.join("\n"));

      success = !!(<any> this._module).ccall(
        "init",
        "number",
        ["number", "number"],
        [buf, this._alertOnError],
      );
    } catch (error) {
      console.error(error);
    } finally {
      if (buf) {
        (<any> this._module).ccall("free", "number", ["number"], [buf]);
      }
    }

    if (success) {
      this.support.commFun = (<any> this._module).cwrap("commFun", null, [
        "string",
        "string",
      ]);
    } else {
      this.nukeSandbox();
      throw new Error("Cannot start sandbox");
    }
  }

  dispatchEvent(event: EventInSandBox) {
    this.support?.callSandboxFunction("dispatchEvent", event);
  }

  dumpMemoryUse() {
    if (this._module) {
      (<any> this._module).ccall("dumpMemoryUse", null, []);
    }
  }

  nukeSandbox() {
    if (this._module !== null) {
      this.support.destroy();
      (<any> this).support = undefined;
      (<any> this._module).ccall("nukeSandbox", null, []);
      this._module = undefined;
    }
  }

  evalForTesting(code: unknown, key: unknown) {
    /*#static*/ if (_PDFDEV) {
      (<any> this._module).ccall(
        "evalInSandbox",
        null,
        ["string", "int"],
        [
          `try {
             sendResultForTesting([{ id: "${key}", result: ${code} }]);
          } catch( error) {
             sendResultForTesting([{ id: "${key}", result: error.message }]);
          }`,
          this._alertOnError,
        ],
      );
    } else {
      throw new Error("Not implemented: evalForTesting");
    }
  }
}

export function QuickJSSandbox() {
  return ModuleLoader().then((module: unknown) => {
    return new Sandbox(window, module);
  });
}
/*80--------------------------------------------------------------------------*/
