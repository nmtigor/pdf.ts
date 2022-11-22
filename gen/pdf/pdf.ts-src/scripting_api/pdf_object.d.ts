import { ScriptingDocProperties } from "../../pdf.ts-web/app.js";
export interface SendData {
    id?: string | undefined;
}
export type Send<D extends SendData> = (data: D) => void;
export interface ScriptingData<D extends SendData> extends ScriptingDocProperties {
    send?: Send<D>;
    id?: string;
}
export declare class PDFObject<D extends SendData> {
    _expandos: any;
    _send: Send<D> | undefined;
    _id: string | undefined;
    constructor(data: ScriptingData<D>);
}
//# sourceMappingURL=pdf_object.d.ts.map