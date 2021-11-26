/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */
/* Copyright 2015 Mozilla Foundation
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
import { CMapCompressionType } from "../shared/util.js";
export class BaseCanvasFactory {
    /** @final */
    create(width, height) {
        if (width <= 0 || height <= 0) {
            throw new Error("Invalid canvas size");
        }
        const canvas = this._createCanvas(width, height);
        return {
            canvas,
            context: canvas.getContext("2d"),
        };
    }
    /** @final */
    reset(canvasAndContext, width, height) {
        if (!canvasAndContext.canvas) {
            throw new Error("Canvas is not specified");
        }
        if (width <= 0 || height <= 0) {
            throw new Error("Invalid canvas size");
        }
        canvasAndContext.canvas.width = width;
        canvasAndContext.canvas.height = height;
    }
    /** @final */
    destroy(canvasAndContext) {
        if (!canvasAndContext.canvas) {
            throw new Error("Canvas is not specified");
        }
        // Zeroing the width and height cause Firefox to release graphics
        // resources immediately, which can greatly reduce memory consumption.
        canvasAndContext.canvas.width = 0;
        canvasAndContext.canvas.height = 0;
        canvasAndContext.canvas = null;
        canvasAndContext.context = null;
    }
}
export class BaseCMapReaderFactory {
    baseUrl;
    isCompressed;
    constructor({ baseUrl, isCompressed = false }) {
        this.baseUrl = baseUrl;
        this.isCompressed = isCompressed;
    }
    /** @final */
    async fetch({ name }) {
        if (!this.baseUrl) {
            throw new Error('The CMap "baseUrl" parameter must be specified, ensure that ' +
                'the "cMapUrl" and "cMapPacked" API parameters are provided.');
        }
        if (!name) {
            throw new Error("CMap name must be specified.");
        }
        const url = this.baseUrl + name + (this.isCompressed ? ".bcmap" : "");
        const compressionType = this.isCompressed
            ? CMapCompressionType.BINARY
            : CMapCompressionType.NONE;
        return this._fetchData(url, compressionType).catch(reason => {
            throw new Error(`Unable to load ${this.isCompressed ? "binary " : ""}CMap at: ${url}`);
        });
    }
}
export class BaseStandardFontDataFactory {
    baseUrl;
    constructor({ baseUrl }) {
        this.baseUrl = baseUrl;
    }
    async fetch({ filename }) {
        if (!this.baseUrl) {
            throw new Error('The standard font "baseUrl" parameter must be specified, ensure that ' +
                'the "standardFontDataUrl" API parameter is provided.');
        }
        if (!filename) {
            throw new Error("Font filename must be specified.");
        }
        const url = `${this.baseUrl}${filename}`;
        return this._fetchData(url).catch(reason => {
            throw new Error(`Unable to load font data at: ${url}`);
        });
    }
}
export class BaseSVGFactory {
    /** @final */
    create(width, height) {
        if (width <= 0 || height <= 0) {
            throw new Error("Invalid SVG dimensions");
        }
        const svg = this._createSVG("svg:svg");
        svg.setAttribute("version", "1.1");
        svg.setAttribute("width", `${width}px`);
        svg.setAttribute("height", `${height}px`);
        svg.setAttribute("preserveAspectRatio", "none");
        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        return svg;
    }
    /** @final */
    createElement(type) {
        if (typeof type !== "string") {
            throw new Error("Invalid SVG element type");
        }
        return this._createSVG(type);
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=base_factory.js.map