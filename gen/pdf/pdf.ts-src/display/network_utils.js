/** 80**************************************************************************
 * Converted from JavaScript to TypeScript by
 * [nmtigor](https://github.com/nmtigor) @2022
 *
 * @module pdf/pdf.ts-src/display/network_utils.ts
 * @license Apache-2.0
 ******************************************************************************/
/* Copyright 2012 Mozilla Foundation
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
import { PDFJSDev, TESTING } from "../../../global.js";
import { HttpStatusCode } from "../../../lib/HttpStatusCode.js";
import { assert } from "../../../lib/util/trace.js";
import { MissingPDFException, UnexpectedResponseException, } from "../shared/util.js";
import { getFilenameFromContentDispositionHeader } from "./content_disposition.js";
import { isPdfFile } from "./display_utils.js";
export function validateRangeRequestCapabilities({ getResponseHeader, isHttp, rangeChunkSize, disableRange, }) {
    /*#static*/  {
        assert(disableRange ||
            Number.isInteger(rangeChunkSize) && rangeChunkSize > 0, "rangeChunkSize must be an integer larger than zero.");
    }
    const returnValues = {
        allowRangeRequests: false,
    };
    // console.log("run here 0");
    const length = parseInt(getResponseHeader("Content-Length"), 10);
    // console.log(getResponseHeader("Content-Length"));
    if (!Number.isInteger(length)) {
        return returnValues;
    }
    // console.log("run here 1");
    returnValues.suggestedLength = length;
    if (length <= 2 * rangeChunkSize) {
        // The file size is smaller than the size of two chunks, so it does not
        // make any sense to abort the request and retry with a range request.
        return returnValues;
    }
    // console.log("run here 2");
    if (disableRange || !isHttp) {
        return returnValues;
    }
    // console.log("run here 3");
    if (getResponseHeader("Accept-Ranges") !== "bytes") {
        return returnValues;
    }
    // console.log("run here 4");
    const contentEncoding = getResponseHeader("Content-Encoding") || "identity";
    if (contentEncoding !== "identity") {
        return returnValues;
    }
    // console.log("run here 5");
    returnValues.allowRangeRequests = true;
    return returnValues;
}
export function extractFilenameFromHeader(getResponseHeader) {
    const contentDisposition = getResponseHeader("Content-Disposition");
    if (contentDisposition) {
        let filename = getFilenameFromContentDispositionHeader(contentDisposition);
        if (filename.includes("%")) {
            try {
                filename = decodeURIComponent(filename);
            }
            catch { }
        }
        if (isPdfFile(filename)) {
            return filename;
        }
    }
    return undefined;
}
export function createResponseStatusError(status, url) {
    if (status === HttpStatusCode.NOT_FOUND ||
        (status === 0 && url.toString().startsWith("file:"))) {
        return new MissingPDFException(`Missing PDF "${url}".`);
    }
    return new UnexpectedResponseException(`Unexpected server response (${status}) while retrieving PDF "${url}".`, status);
}
export function validateResponseStatus(status) {
    return status === HttpStatusCode.OK ||
        status === HttpStatusCode.PARTIAL_CONTENT;
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=network_utils.js.map