/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/scripting_api/console.ts
 * @license Apache-2.0
 ******************************************************************************/
import { PDFObject, ScriptingData, SendData } from "./pdf_object.js";
interface _SendConsoleData extends SendData {
    command?: string;
    value?: string;
}
export interface ScriptingConsoleData extends ScriptingData<_SendConsoleData> {
}
export declare class Console extends PDFObject<_SendConsoleData> {
    clear(): void;
    hide(): void;
    println(msg: unknown): void;
    show(): void;
}
export {};
//# sourceMappingURL=console.d.ts.map