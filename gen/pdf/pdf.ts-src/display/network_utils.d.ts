/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/network_utils.ts
 * @license Apache-2.0
 ******************************************************************************/
import { HttpStatusCode } from "../../../lib/HttpStatusCode.js";
import { MissingPDFException, UnexpectedResponseException } from "../shared/util.js";
export type VRRC_P_ = {
    getResponseHeader: (name: string) => string | null;
    isHttp: boolean;
    rangeChunkSize: number | undefined;
    disableRange: boolean;
};
export declare function validateRangeRequestCapabilities({ getResponseHeader, isHttp, rangeChunkSize, disableRange, }: VRRC_P_): {
    allowRangeRequests: boolean;
    suggestedLength?: number;
};
export declare function extractFilenameFromHeader(getResponseHeader: (name: string) => string | null): string | undefined;
export declare function createResponseStatusError(status: HttpStatusCode, url: string | URL): MissingPDFException | UnexpectedResponseException;
export declare function validateResponseStatus(status: HttpStatusCode): boolean;
//# sourceMappingURL=network_utils.d.ts.map