/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/scripting_api/initialization.ts
 * @license Apache-2.0
 ******************************************************************************/
import type { CreateSandboxP } from "../../pdf.ts-web/interfaces.js";
import { App } from "./app.js";
import { Color } from "./color.js";
import { Border, Cursor, Display, Font, Highlight, Position, ScaleHow, ScaleWhen, Style, Trans, ZoomType } from "./constants.js";
import { SendData } from "./pdf_object.js";
import { Util } from "./util.js";
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
export type ExternalCall = <N extends ExternalCallName>(fn: N, data: _ExternalCallMap[N][0]) => _ExternalCallMap[N][1];
declare global {
    var callExternalFunction: ExternalCall;
    var global: object;
    var app: App;
    var color: Color;
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
export declare function initSandbox(params: {
    data: CreateSandboxP;
}): (name: "timeoutCb" | "dispatchEvent", args: unknown) => void;
export {};
//# sourceMappingURL=initialization.d.ts.map