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

import { Color } from "./color.ts";
import { Doc } from "./doc.ts";
import { EventDispatcher, ScriptingEventData } from "./event.ts";
import { Field } from "./field.ts";
import { FullScreen, ScriptingFullScreenData } from "./fullscreen.ts";
import { ExternalCall } from "./initialization.ts";
import { PDFObject, ScriptingData, SendData } from "./pdf_object.ts";
import { ScriptingProxyHandler } from "./proxy.ts";
import { ScriptingThermometerData, Thermometer } from "./thermometer.ts";
/*80--------------------------------------------------------------------------*/

const VIEWER_TYPE = "PDF.js";
const VIEWER_VARIATION = "Full";
const VIEWER_VERSION = 21.00720099;
const FORMS_VERSION = 21.00720099;

export interface DocWrapped {
  obj: Doc;
  wrapped: Doc;
}

export interface FieldWrapped {
  obj: Field;
  wrapped: Field;
}

export interface SendAppData extends SendData {
  command: string;
  value?: string;
}

export interface AppInfo {
  platform: string;
  language: string;
}

export interface ScriptingAppData extends ScriptingData<SendAppData>, AppInfo {
  globalEval(expr: string): void;
  externalCall: ExternalCall;
  _document: DocWrapped;
  calculationOrder: string[] | undefined;
  proxyHandler: ScriptingProxyHandler;
}

interface _Callback {
  callbackId: number;
  interval: boolean;
}

export class App extends PDFObject<SendAppData> {
  _constants?: Readonly<{
    align: Readonly<{
      readonly left: 0;
      readonly center: 1;
      readonly right: 2;
      readonly top: 3;
      readonly bottom: 4;
    }>;
  }>;
  get constants() {
    if (!this._constants) {
      this._constants = Object.freeze({
        align: Object.freeze({
          left: 0,
          center: 1,
          right: 2,
          top: 3,
          bottom: 4,
        }),
      });
    }
    return this._constants;
  }
  set constants(_) {
    throw new Error("app.constants is read-only");
  }

  _focusRect = true;

  _fs?: FullScreen;
  get fs() {
    if (this._fs === undefined) {
      this._fs = new Proxy<FullScreen>(
        new FullScreen(<ScriptingFullScreenData> { send: this._send }),
        this._proxyHandler,
      );
    }
    return this._fs;
  }
  set fs(_) {
    throw new Error("app.fs is read-only");
  }

  _language;

  _openInPlace = false;
  get openInPlace() {
    return this._openInPlace;
  }
  set openInPlace(val) {
    this._openInPlace = val; /* TODO */
  }

  _platform;
  get platform() {
    return this._platform;
  }
  set platform(_) {
    throw new Error("app.platform is read-only");
  }

  _runtimeHighlight = false;
  get runtimeHighlight() {
    return this._runtimeHighlight;
  }
  set runtimeHighlight(val) {
    this._runtimeHighlight = val; /* TODO */
  }

  _runtimeHighlightColor = ["T"];
  get runtimeHighlightColor() {
    return this._runtimeHighlightColor;
  }
  set runtimeHighlightColor(val) {
    if (Color._isValidColor(val)) {
      this._runtimeHighlightColor = val;
      /* TODO */
    }
  }

  _thermometer?: Thermometer;
  get thermometer() {
    if (this._thermometer === undefined) {
      this._thermometer = new Proxy<Thermometer>(
        new Thermometer(<ScriptingThermometerData> { send: this._send }),
        this._proxyHandler,
      );
    }
    return this._thermometer;
  }
  set thermometer(_) {
    throw new Error("app.thermometer is read-only");
  }

  _toolbar = false;
  get toolbar() {
    return this._toolbar;
  }
  set toolbar(val) {
    this._toolbar = val; /* TODO */
  }

  _document;
  _proxyHandler;
  _objects;
  _eventDispatcher;

  _timeoutIds = new WeakMap<object, _Callback>();
  _timeoutIdsRegistry;

  _timeoutCallbackIds = new Map<number, string>();
  _timeoutCallbackId;
  _globalEval;
  _externalCall;

  constructor(data: ScriptingAppData) {
    super(data);

    this._language = App._getLanguage(data.language);
    this._platform = App._getPlatform(data.platform);

    this._document = data._document;
    this._proxyHandler = data.proxyHandler;
    this._objects = <Record<string, FieldWrapped>> Object.create(null);
    this._eventDispatcher = new EventDispatcher(
      this._document,
      data.calculationOrder,
      this._objects,
    );

    if (typeof FinalizationRegistry !== "undefined") {
      // About setTimeOut/setInterval return values (specs):
      //   The return value of this method must be held in a
      //   JavaScript variable.
      //   Otherwise, the timeout object is subject to garbage-collection,
      //   which would cause the clock to stop.
      this._timeoutIdsRegistry = new FinalizationRegistry(
        this._cleanTimeout.bind(this),
      );
    } else {
      this._timeoutIdsRegistry = undefined;
    }

    this._timeoutCallbackId = 0;
    this._globalEval = data.globalEval;
    this._externalCall = data.externalCall;
    // this._document = data._document; //kkkk bug? ✅
  }

  // This function is called thanks to the proxy
  // when we call app['random_string'] to dispatch the event.
  _dispatchEvent(pdfEvent: ScriptingEventData) {
    this._eventDispatcher.dispatch(pdfEvent);
  }

  _registerTimeoutCallback(cExpr: string) {
    const id = this._timeoutCallbackId++;
    this._timeoutCallbackIds.set(id, cExpr);
    return id;
  }

  _unregisterTimeoutCallback(id: number) {
    this._timeoutCallbackIds.delete(id);
  }

  _evalCallback({ callbackId, interval }: _Callback) {
    const expr = this._timeoutCallbackIds.get(callbackId);
    if (!interval) {
      this._unregisterTimeoutCallback(callbackId);
    }

    if (expr) {
      this._globalEval(expr);
    }
  }

  _registerTimeout(callbackId: number, interval: boolean) {
    const timeout = Object.create(null);
    const id: _Callback = { callbackId, interval };
    this._timeoutIds.set(timeout, id);
    if (this._timeoutIdsRegistry) {
      this._timeoutIdsRegistry.register(timeout, id);
    }
    return timeout;
  }

  _unregisterTimeout(timeout: object) {
    if (this._timeoutIdsRegistry) {
      this._timeoutIdsRegistry.unregister(timeout);
    }

    const data = this._timeoutIds.get(timeout);
    if (!data) {
      return;
    }

    this._timeoutIds.delete(timeout);
    this._cleanTimeout(data);
  }

  _cleanTimeout({ callbackId, interval }: _Callback) {
    this._unregisterTimeoutCallback(callbackId);

    if (interval) {
      this._externalCall("clearInterval", [callbackId]);
    } else {
      this._externalCall("clearTimeout", [callbackId]);
    }
  }

  static _getPlatform(platform: string) {
    if (typeof platform === "string") {
      platform = platform.toLowerCase();
      if (platform.includes("win")) {
        return "WIN";
      } else if (platform.includes("mac")) {
        return "MAC";
      }
    }
    return "UNIX";
  }

  static _getLanguage(language: string) {
    const [main, sub] = language.toLowerCase().split(/[-_]/);
    switch (main) {
      case "zh":
        if (sub === "cn" || sub === "sg") {
          return "CHS";
        }
        return "CHT";
      case "da":
        return "DAN";
      case "de":
        return "DEU";
      case "es":
        return "ESP";
      case "fr":
        return "FRA";
      case "it":
        return "ITA";
      case "ko":
        return "KOR";
      case "ja":
        return "JPN";
      case "nl":
        return "NLD";
      case "no":
        return "NOR";
      case "pt":
        if (sub === "br") {
          return "PTB";
        }
        return "ENU";
      case "fi":
        return "SUO";
      case "SV":
        return "SVE";
      default:
        return "ENU";
    }
  }

  get activeDocs() {
    return [this._document.wrapped];
  }

  set activeDocs(_) {
    throw new Error("app.activeDocs is read-only");
  }

  get calculate() {
    return this._document.obj.calculate;
  }

  set calculate(calculate) {
    this._document.obj.calculate = calculate;
  }

  get focusRect() {
    return this._focusRect;
  }

  set focusRect(val) {
    /* TODO or not */
    this._focusRect = val;
  }

  get formsVersion() {
    return FORMS_VERSION;
  }

  set formsVersion(_) {
    throw new Error("app.formsVersion is read-only");
  }

  get fromPDFConverters() {
    return [];
  }

  set fromPDFConverters(_) {
    throw new Error("app.fromPDFConverters is read-only");
  }

  get language() {
    return this._language;
  }

  set language(_) {
    throw new Error("app.language is read-only");
  }

  get media() {
    return undefined;
  }

  set media(_) {
    throw new Error("app.media is read-only");
  }

  get monitors() {
    return [];
  }

  set monitors(_) {
    throw new Error("app.monitors is read-only");
  }

  get numPlugins() {
    return 0;
  }

  set numPlugins(_) {
    throw new Error("app.numPlugins is read-only");
  }

  get plugins() {
    return [];
  }

  set plugins(_) {
    throw new Error("app.plugins is read-only");
  }

  get printColorProfiles() {
    return [];
  }

  set printColorProfiles(_) {
    throw new Error("app.printColorProfiles is read-only");
  }

  get printerNames() {
    return [];
  }

  set printerNames(_) {
    throw new Error("app.printerNames is read-only");
  }

  get toolbarHorizontal() {
    return this.toolbar;
  }

  set toolbarHorizontal(value) {
    /* has been deprecated and it's now equivalent to toolbar */
    this.toolbar = value;
  }

  get toolbarVertical() {
    return this.toolbar;
  }

  set toolbarVertical(value) {
    /* has been deprecated and it's now equivalent to toolbar */
    this.toolbar = value;
  }

  get viewerType() {
    return VIEWER_TYPE;
  }

  set viewerType(_) {
    throw new Error("app.viewerType is read-only");
  }

  get viewerVariation() {
    return VIEWER_VARIATION;
  }

  set viewerVariation(_) {
    throw new Error("app.viewerVariation is read-only");
  }

  get viewerVersion() {
    return VIEWER_VERSION;
  }

  set viewerVersion(_) {
    throw new Error("app.viewerVersion is read-only");
  }

  addMenuItem() {
    /* Not implemented */
  }

  addSubMenu() {
    /* Not implemented */
  }

  addToolButton() {
    /* Not implemented */
  }

  alert(
    cMsg: string | { cMsg: string; nType: number },
    nIcon = 0,
    nType = 0,
    cTitle = "PDF.js",
    oDoc = undefined,
    oCheckbox = undefined,
  ) {
    if (cMsg && typeof cMsg === "object") {
      nType = cMsg.nType;
      cMsg = cMsg.cMsg;
    }
    cMsg = (cMsg || "").toString();
    nType = typeof nType !== "number" || isNaN(nType) || nType < 0 || nType > 3
      ? 0
      : nType;
    if (nType >= 2) {
      return this._externalCall("confirm", [cMsg]) ? 4 : 3;
    }

    this._externalCall("alert", [cMsg]);
    return 1;
  }

  beep() {
    /* Not implemented */
  }

  beginPriv() {
    /* Not implemented */
  }

  browseForDoc() {
    /* Not implemented */
  }

  clearInterval(oInterval: object) {
    this._unregisterTimeout(oInterval);
  }

  clearTimeOut(oTime: object) {
    this._unregisterTimeout(oTime);
  }

  endPriv() {
    /* Not implemented */
  }

  execDialog() {
    /* Not implemented */
  }

  execMenuItem(item: string) {
    switch (item) {
      case "SaveAs":
      case "FirstPage":
      case "LastPage":
      case "NextPage":
      case "PrevPage":
      case "ZoomViewIn":
      case "ZoomViewOut":
        this._send!({ command: item });
        break;
      case "FitPage":
        this._send!({ command: "zoom", value: "page-fit" });
        break;
      case "Print":
        this._send!({ command: "print" });
        break;
    }
  }

  getNthPlugInName() {
    /* Not implemented */
  }

  getPath() {
    /* Not implemented */
  }

  goBack() {
    /* TODO */
  }

  goForward() {
    /* TODO */
  }

  hideMenuItem() {
    /* Not implemented */
  }

  hideToolbarButton() {
    /* Not implemented */
  }

  launchURL() {
    /* Unsafe */
  }

  listMenuItems() {
    /* Not implemented */
  }

  listToolbarButtons() {
    /* Not implemented */
  }

  loadPolicyFile() {
    /* Not implemented */
  }

  mailGetAddrs() {
    /* Not implemented */
  }

  mailMsg() {
    /* TODO or not ? */
  }

  newDoc() {
    /* Not implemented */
  }

  newCollection() {
    /* Not implemented */
  }

  newFDF() {
    /* Not implemented */
  }

  openDoc() {
    /* Not implemented */
  }

  openFDF() {
    /* Not implemented */
  }

  popUpMenu() {
    /* Not implemented */
  }

  popUpMenuEx() {
    /* Not implemented */
  }

  removeToolButton() {
    /* Not implemented */
  }

  response(
    cQuestion: string | { cQuestion: string; cDefault: string },
    cTitle = "",
    cDefault = "",
    bPassword = "",
    cLabel = "",
  ) {
    if (cQuestion && typeof cQuestion === "object") {
      cDefault = cQuestion.cDefault;
      cQuestion = cQuestion.cQuestion;
    }
    cQuestion = (cQuestion || "").toString();
    cDefault = (cDefault || "").toString();
    return this._externalCall("prompt", [cQuestion, cDefault || ""]);
  }

  setInterval(
    cExpr: string | { cExpr: string; nMilliseconds?: number },
    nMilliseconds = 0,
  ) {
    if (cExpr && typeof cExpr === "object") {
      nMilliseconds = cExpr.nMilliseconds || 0;
      cExpr = cExpr.cExpr;
    }

    if (typeof cExpr !== "string") {
      throw new TypeError("First argument of app.setInterval must be a string");
    }
    if (typeof nMilliseconds !== "number") {
      throw new TypeError(
        "Second argument of app.setInterval must be a number",
      );
    }
    const callbackId = this._registerTimeoutCallback(cExpr);
    this._externalCall("setInterval", [callbackId, nMilliseconds]);
    return this._registerTimeout(callbackId, true);
  }

  setTimeOut(
    cExpr: string | { cExpr: string; nMilliseconds?: number },
    nMilliseconds = 0,
  ) {
    if (cExpr && typeof cExpr === "object") {
      nMilliseconds = cExpr.nMilliseconds || 0;
      cExpr = cExpr.cExpr;
    }

    if (typeof cExpr !== "string") {
      throw new TypeError("First argument of app.setTimeOut must be a string");
    }
    if (typeof nMilliseconds !== "number") {
      throw new TypeError("Second argument of app.setTimeOut must be a number");
    }
    const callbackId = this._registerTimeoutCallback(cExpr);
    this._externalCall("setTimeout", [callbackId, nMilliseconds]);
    return this._registerTimeout(callbackId, false);
  }

  trustedFunction() {
    /* Not implemented */
  }

  trustPropagatorFunction() {
    /* Not implemented */
  }
}
/*80--------------------------------------------------------------------------*/
