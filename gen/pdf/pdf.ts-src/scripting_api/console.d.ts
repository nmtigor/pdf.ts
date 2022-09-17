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