/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
import { assert } from "../../../lib/util/trace.js";
import { MissingPDFException, UnexpectedResponseException } from "../shared/util.js";
import { getFilenameFromContentDispositionHeader } from "./content_disposition.js";
import { isPdfFile } from "./display_utils.js";
/*81---------------------------------------------------------------------------*/
export function validateRangeRequestCapabilities({ getResponseHeader, isHttp, rangeChunkSize, disableRange, }) {
    assert(Number.isInteger(rangeChunkSize) && rangeChunkSize > 0, "rangeChunkSize must be an integer larger than zero.");
    const returnValues = {
        allowRangeRequests: false,
    };
    const length = parseInt(getResponseHeader("Content-Length"), 10);
    if (!Number.isInteger(length)) {
        return returnValues;
    }
    returnValues.suggestedLength = length;
    if (length <= 2 * rangeChunkSize)
        // The file size is smaller than the size of two chunks, so it does not
        // make any sense to abort the request and retry with a range request.
        return returnValues;
    if (disableRange || !isHttp)
        return returnValues;
    if (getResponseHeader("Accept-Ranges") !== "bytes")
        return returnValues;
    const contentEncoding = getResponseHeader("Content-Encoding") || "identity";
    if (contentEncoding !== "identity")
        return returnValues;
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
            catch (ex) { }
        }
        if (isPdfFile(filename))
            return filename;
    }
    return undefined;
}
export function createResponseStatusError(status, url) {
    if (status === 404 || (status === 0 && url.toString().startsWith("file:")))
        return new MissingPDFException(`Missing PDF "${url}".`);
    return new UnexpectedResponseException(`Unexpected server response (${status}) while retrieving PDF "${url}".`, status);
}
export function validateResponseStatus(status) {
    return status === 200 || status === 206;
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=network_utils.js.map