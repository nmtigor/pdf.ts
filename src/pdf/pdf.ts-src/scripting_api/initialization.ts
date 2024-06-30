/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/scripting_api/initialization.ts
 * @license Apache-2.0
 ******************************************************************************/

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

import type { CreateSandboxP } from "@fe-pdf.ts-web/interfaces.ts";
import type { FieldObject } from "../core/annotation.ts";
import { AForm } from "./aform.ts";
import { App, DocWrapped, ScriptingAppData, SendAppData } from "./app.ts";
import { serializeError } from "./app_utils.ts";
import { Color } from "./color.ts";
import { Console, ScriptingConsoleData } from "./console.ts";
import {
  Border,
  Cursor,
  Display,
  Font,
  GlobalConstants,
  Highlight,
  Position,
  ScaleHow,
  ScaleWhen,
  Style,
  Trans,
  ZoomType,
} from "./constants.ts";
import { Doc } from "./doc.ts";
import {
  CheckboxField,
  Field,
  RadioButtonField,
  ScriptingFieldData,
} from "./field.ts";
import { Send, SendData } from "./pdf_object.ts";
import { ScriptingProxyHandler } from "./proxy.ts";
import { ScriptingUtilData, Util } from "./util.ts";
/*80--------------------------------------------------------------------------*/

interface _ExternalCallMap {
  alert: [[string], undefined];
  confirm: [[string], boolean];
  clearInterval: [[number], undefined];
  clearTimeout: [[number], undefined];
  prompt: [[string, string], string | null];
  send: [[SendData], void];
  setInterval: [[number, number], number];
  setTimeout: [[number, number], number];
}

type ExternalCallName = keyof _ExternalCallMap;

export type ExternalCall = <N extends ExternalCallName>(
  fn: N,
  data: _ExternalCallMap[N][0],
) => _ExternalCallMap[N][1];

declare global {
  var callExternalFunction: ExternalCall;

  // var event:Event;
  var global: object;
  var app: App;
  var color: Color;
  // var console:Console;
  var util: Util;
  var border: typeof Border;
  var cursor: typeof Cursor;
  var display: typeof Display;
  var font: typeof Font;
  var highlight: typeof Highlight;
  var position: typeof Position;
  var scaleHow: typeof ScaleHow;
  var scaleWhen: typeof ScaleWhen;
  var style: typeof Style;
  var trans: typeof Trans;
  var zoomtype: ZoomType;
  var ADBE: {
    Reader_Value_Asked: boolean;
    Viewer_Value_Asked: boolean;
  };
}

export function initSandbox(params: { data: CreateSandboxP }) {
  delete (globalThis as any).pdfjsScripting;

  // externalCall is a function to call a function defined
  // outside the sandbox.
  // (see src/pdf.sandbox.external.js).
  const externalCall = globalThis.callExternalFunction;
  delete (globalThis as any).callExternalFunction;

  // eslint-disable-next-line no-eval
  const globalEval = (code: string) => globalThis.eval(code);
  const send = (data: SendData) => externalCall("send", [data]);
  const proxyHandler = new ScriptingProxyHandler();
  const { data } = params;
  const doc = new Doc({
    send,
    globalEval,
    ...data.docInfo,
  });
  const _document: DocWrapped = {
    obj: doc,
    wrapped: new Proxy<Doc>(doc, proxyHandler),
  };
  const app = new App(
    <ScriptingAppData> {
      send: <Send<SendAppData>> send,
      globalEval,
      externalCall,
      _document,
      calculationOrder: data.calculationOrder,
      proxyHandler,
      ...data.appInfo,
    },
  );

  const util = new Util(<ScriptingUtilData> { externalCall });
  const appObjects = app._objects;

  if (data.objects) {
    const annotations = [];

    for (const [name, objs] of Object.entries(data.objects)) {
      annotations.length = 0;
      let container: FieldObject | undefined;

      for (const obj of objs) {
        if (obj.type !== "") {
          annotations.push(obj);
        } else {
          container = obj;
        }
      }

      let obj = container;
      if (annotations.length > 0) {
        obj = annotations[0];
        obj.send = send;
      }

      obj!.globalEval = globalEval;
      obj!.doc = _document;
      obj!.fieldPath = name;
      obj!.appObjects = appObjects;

      let field;
      switch (obj!.type) {
        case "radiobutton": {
          const otherButtons = annotations.slice(1);
          field = new RadioButtonField(otherButtons, obj as ScriptingFieldData);
          break;
        }
        case "checkbox": {
          const otherButtons = annotations.slice(1);
          field = new CheckboxField(otherButtons, obj as ScriptingFieldData);
          break;
        }
        case "text":
          if (annotations.length <= 1) {
            field = new Field(obj as ScriptingFieldData);
            break;
          }
          obj!.siblings = annotations.map((x) => x.id).slice(1);
          field = new Field(obj as ScriptingFieldData);
          break;
        default:
          field = new Field(obj as ScriptingFieldData);
      }

      const wrapped = new Proxy<Field>(field, proxyHandler);
      const _object = { obj: field, wrapped };
      doc._addField(name, _object);
      for (const object of objs) {
        appObjects[object.id] = _object;
      }
      if (container) {
        appObjects[container.id] = _object;
      }
    }
  }

  const color = new Color();

  (<any> globalThis).event = undefined;
  globalThis.global = Object.create(null);
  globalThis.app = new Proxy(app, <ProxyHandler<App>> proxyHandler);
  globalThis.color = new Proxy(color, <ProxyHandler<Color>> proxyHandler);
  (<any> globalThis).console = new Proxy(
    new Console(<ScriptingConsoleData> { send }),
    proxyHandler,
  );
  globalThis.util = new Proxy(util, <ProxyHandler<Util>> proxyHandler);
  globalThis.border = Border;
  globalThis.cursor = Cursor;
  globalThis.display = Display;
  globalThis.font = Font;
  globalThis.highlight = Highlight;
  globalThis.position = Position;
  globalThis.scaleHow = ScaleHow;
  globalThis.scaleWhen = ScaleWhen;
  globalThis.style = Style;
  globalThis.trans = Trans;
  globalThis.zoomtype = ZoomType.none;

  // Avoid to have a popup asking to update Acrobat.
  globalThis.ADBE = {
    Reader_Value_Asked: true,
    Viewer_Value_Asked: true,
  };

  // AF... functions
  const aform = new AForm(doc, app, util, color);
  for (const name of Object.getOwnPropertyNames(AForm.prototype)) {
    if (name !== "constructor" && !name.startsWith("_")) {
      (globalThis as any)[name] = (aform as any)[name].bind(aform);
    }
  }

  // Add global constants such as IDS_GREATER_THAN or RE_NUMBER_ENTRY_DOT_SEP
  for (const [name, value] of Object.entries(GlobalConstants)) {
    Object.defineProperty(globalThis, name, {
      value,
      writable: false,
    });
  }

  // Color functions
  Object.defineProperties(globalThis, {
    ColorConvert: {
      value: color.convert.bind(color),
      writable: true,
    },
    ColorEqual: {
      value: color.equal.bind(color),
      writable: true,
    },
  });

  // The doc properties must live in the global scope too
  const properties = Object.create(null);
  for (const name of Object.getOwnPropertyNames(Doc.prototype)) {
    if (name === "constructor" || name.startsWith("_")) {
      continue;
    }
    const descriptor = Object.getOwnPropertyDescriptor(Doc.prototype, name)!;
    if (descriptor.get) {
      properties[name] = {
        get: descriptor.get.bind(doc),
        set: descriptor.set!.bind(doc),
      };
    } else {
      properties[name] = {
        value: (Doc.prototype as any)[name].bind(doc),
      };
    }
  }
  Object.defineProperties(globalThis, properties);

  const functions = {
    dispatchEvent: app._dispatchEvent.bind(app),
    timeoutCb: app._evalCallback.bind(app),
  };

  return (name: keyof typeof functions, args: unknown) => {
    try {
      functions[name](args as any);
    } catch (error) {
      (send as any)(serializeError(error));
    }
  };
}
/*80--------------------------------------------------------------------------*/
