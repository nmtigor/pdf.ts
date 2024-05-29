/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/scripting_api/pdf_object.ts
 * @license Apache-2.0
 ******************************************************************************/
export class PDFObject {
    _expandos;
    _send;
    _id;
    constructor(data) {
        this._expandos = Object.create(null);
        this._send = data.send || undefined;
        this._id = data.id || undefined;
    }
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=pdf_object.js.map