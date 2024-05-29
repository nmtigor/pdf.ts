/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/scripting_api/thermometer.ts
 * @license Apache-2.0
 ******************************************************************************/
import { PDFObject, ScriptingData, SendData } from "./pdf_object.js";
interface _SendThermometerData extends SendData {
}
export interface ScriptingThermometerData extends ScriptingData<_SendThermometerData> {
}
export declare class Thermometer extends PDFObject<_SendThermometerData> {
    _cancelled: boolean;
    get cancelled(): boolean;
    set cancelled(_: boolean);
    _duration: number;
    get duration(): number;
    set duration(val: number);
    _text: string;
    get text(): string;
    set text(val: string);
    _value: number;
    get value(): number;
    set value(val: number);
    constructor(data: ScriptingThermometerData);
    begin(): void;
    end(): void;
}
export {};
//# sourceMappingURL=thermometer.d.ts.map