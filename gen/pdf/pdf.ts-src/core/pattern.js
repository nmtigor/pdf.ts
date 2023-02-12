/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
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
import { GENERIC } from "../../../global.js";
import { assert } from "../../../lib/util/trace.js";
import { FormatError, info, shadow, UNSUPPORTED_FEATURES, Util, warn, } from "../shared/util.js";
import { BaseStream } from "./base_stream.js";
import { ColorSpace } from "./colorspace.js";
import { MissingDataException } from "./core_utils.js";
/*80--------------------------------------------------------------------------*/
export var ShadingType;
(function (ShadingType) {
    ShadingType[ShadingType["FUNCTION_BASED"] = 1] = "FUNCTION_BASED";
    ShadingType[ShadingType["AXIAL"] = 2] = "AXIAL";
    ShadingType[ShadingType["RADIAL"] = 3] = "RADIAL";
    ShadingType[ShadingType["FREE_FORM_MESH"] = 4] = "FREE_FORM_MESH";
    ShadingType[ShadingType["LATTICE_FORM_MESH"] = 5] = "LATTICE_FORM_MESH";
    ShadingType[ShadingType["COONS_PATCH_MESH"] = 6] = "COONS_PATCH_MESH";
    ShadingType[ShadingType["TENSOR_PATCH_MESH"] = 7] = "TENSOR_PATCH_MESH";
})(ShadingType || (ShadingType = {}));
export class Pattern {
    static parseShading(shading, xref, res, handler, pdfFunctionFactory, localColorSpaceCache) {
        const dict = shading instanceof BaseStream ? shading.dict : shading; // Table 75
        const type = dict.get("ShadingType");
        try {
            switch (type) {
                case ShadingType.AXIAL:
                case ShadingType.RADIAL:
                    return new RadialAxialShading(dict, xref, res, pdfFunctionFactory, localColorSpaceCache);
                case ShadingType.FREE_FORM_MESH:
                case ShadingType.LATTICE_FORM_MESH:
                case ShadingType.COONS_PATCH_MESH:
                case ShadingType.TENSOR_PATCH_MESH:
                    return new MeshShading(shading, xref, res, pdfFunctionFactory, localColorSpaceCache);
                default:
                    throw new FormatError("Unsupported ShadingType: " + type);
            }
        }
        catch (ex) {
            if (ex instanceof MissingDataException) {
                throw ex;
            }
            /*#static*/  {
                handler.send("UnsupportedFeature", {
                    featureId: UNSUPPORTED_FEATURES.shadingPattern,
                });
            }
            warn(ex);
            return new DummyShading();
        }
    }
}
class BaseShading {
    /**
     * A small number to offset the first/last color stops so we can insert ones
     * to support extend. Number.MIN_VALUE is too small and breaks the extend.
     */
    static get SMALL_NUMBER() {
        return shadow(this, "SMALL_NUMBER", 1e-6);
    }
}
/**
 * Radial and axial shading have very similar implementations
 * If needed, the implementations can be broken into two classes.
 */
class RadialAxialShading extends BaseShading {
    coordsArr;
    shadingType;
    bbox;
    extendStart;
    extendEnd;
    colorStops;
    constructor(dict, xref, resources, pdfFunctionFactory, localColorSpaceCache) {
        super();
        this.coordsArr = dict.getArray("Coords");
        this.shadingType = dict.get("ShadingType");
        const cs = ColorSpace.parse({
            cs: (dict.getRaw("CS") || dict.getRaw("ColorSpace")),
            xref,
            resources,
            pdfFunctionFactory,
            localColorSpaceCache,
        });
        const bbox = dict.getArray("BBox");
        if (Array.isArray(bbox) && bbox.length === 4) {
            this.bbox = Util.normalizeRect(bbox);
        }
        else {
            this.bbox = undefined;
        }
        let t0 = 0.0;
        let t1 = 1.0;
        if (dict.has("Domain")) {
            const domainArr = dict.getArray("Domain");
            t0 = domainArr[0];
            t1 = domainArr[1];
        }
        let extendStart = false;
        let extendEnd = false;
        if (dict.has("Extend")) {
            const extendArr = dict.getArray("Extend");
            extendStart = extendArr[0];
            extendEnd = extendArr[1];
        }
        if (this.shadingType === ShadingType.RADIAL &&
            (!extendStart || !extendEnd)) {
            // Radial gradient only currently works if either circle is fully within
            // the other circle.
            const [x1, y1, r1, x2, y2, r2] = this.coordsArr;
            const distance = Math.hypot(x1 - x2, y1 - y2);
            if (r1 <= r2 + distance && r2 <= r1 + distance) {
                warn("Unsupported radial gradient.");
            }
        }
        this.extendStart = extendStart;
        this.extendEnd = extendEnd;
        const fnObj = dict.getRaw("Function");
        const fn = pdfFunctionFactory.createFromArray(fnObj);
        // 10 samples seems good enough for now, but probably won't work
        // if there are sharp color changes. Ideally, we would implement
        // the spec faithfully and add lossless optimizations.
        const NUMBER_OF_SAMPLES = 10;
        const step = (t1 - t0) / NUMBER_OF_SAMPLES;
        const colorStops = (this.colorStops = []);
        // Protect against bad domains.
        if (t0 >= t1 || step <= 0) {
            // Acrobat doesn't seem to handle these cases so we'll ignore for
            // now.
            info("Bad shading domain.");
            return;
        }
        const color = new Float32Array(cs.numComps);
        const ratio = new Float32Array(1);
        let rgbColor;
        for (let i = 0; i <= NUMBER_OF_SAMPLES; i++) {
            ratio[0] = t0 + i * step;
            fn(ratio, 0, color, 0);
            rgbColor = cs.getRgb(color, 0);
            const cssColor = Util.makeHexColor(rgbColor[0], rgbColor[1], rgbColor[2]);
            colorStops.push([i / NUMBER_OF_SAMPLES, cssColor]);
        }
        let background = "transparent";
        if (dict.has("Background")) {
            rgbColor = cs.getRgb(dict.get("Background"), 0);
            background = Util.makeHexColor(rgbColor[0], rgbColor[1], rgbColor[2]);
        }
        if (!extendStart) {
            // Insert a color stop at the front and offset the first real color stop
            // so it doesn't conflict with the one we insert.
            colorStops.unshift([0, background]);
            colorStops[1][0] += BaseShading.SMALL_NUMBER;
        }
        if (!extendEnd) {
            // Same idea as above in extendStart but for the end.
            colorStops.at(-1)[0] -= BaseShading.SMALL_NUMBER;
            colorStops.push([1, background]);
        }
        this.colorStops = colorStops;
    }
    /** @implement */
    getIR() {
        const coordsArr = this.coordsArr;
        const shadingType = this.shadingType;
        let type;
        let p0;
        let p1;
        let r0;
        let r1;
        if (shadingType === ShadingType.AXIAL) {
            p0 = [coordsArr[0], coordsArr[1]];
            p1 = [coordsArr[2], coordsArr[3]];
            r0 = undefined;
            r1 = undefined;
            type = ShadingType.AXIAL;
        }
        else if (shadingType === ShadingType.RADIAL) {
            p0 = [coordsArr[0], coordsArr[1]];
            p1 = [coordsArr[3], coordsArr[4]];
            r0 = coordsArr[2];
            r1 = coordsArr[5];
            type = ShadingType.RADIAL;
        }
        else {
            assert(0, `getPattern type unknown: ${shadingType}`);
        }
        return [
            "RadialAxial",
            type,
            this.bbox,
            this.colorStops,
            p0,
            p1,
            r0,
            r1,
        ];
    }
}
/**
 * All mesh shadings. For now, they will be presented as set of the triangles
 * to be drawn on the canvas and rgb color for each vertex.
 */
class MeshStreamReader {
    stream;
    context;
    buffer = 0;
    bufferLength = 0;
    tmpCompsBuf;
    tmpCsCompsBuf;
    constructor(stream, context) {
        this.stream = stream;
        this.context = context;
        const numComps = context.numComps;
        this.tmpCompsBuf = new Float32Array(numComps);
        const csNumComps = context.colorSpace.numComps;
        this.tmpCsCompsBuf = context.colorFn
            ? new Float32Array(csNumComps)
            : this.tmpCompsBuf;
    }
    get hasData() {
        if (this.stream.end) {
            return this.stream.pos < this.stream.end;
        }
        if (this.bufferLength > 0) {
            return true;
        }
        const nextByte = this.stream.getByte();
        if (nextByte < 0) {
            return false;
        }
        this.buffer = nextByte;
        this.bufferLength = 8;
        return true;
    }
    readBits(n) {
        let buffer = this.buffer;
        let bufferLength = this.bufferLength;
        if (n === 32) {
            if (bufferLength === 0) {
                return (((this.stream.getByte() << 24) |
                    (this.stream.getByte() << 16) |
                    (this.stream.getByte() << 8) |
                    this.stream.getByte()) >>>
                    0);
            }
            buffer = (buffer << 24) |
                (this.stream.getByte() << 16) |
                (this.stream.getByte() << 8) |
                this.stream.getByte();
            const nextByte = this.stream.getByte();
            this.buffer = nextByte & ((1 << bufferLength) - 1);
            return (((buffer << (8 - bufferLength)) |
                ((nextByte & 0xff) >> bufferLength)) >>>
                0);
        }
        if (n === 8 && bufferLength === 0) {
            return this.stream.getByte();
        }
        while (bufferLength < n) {
            buffer = (buffer << 8) | this.stream.getByte();
            bufferLength += 8;
        }
        bufferLength -= n;
        this.bufferLength = bufferLength;
        this.buffer = buffer & ((1 << bufferLength) - 1);
        return buffer >> bufferLength;
    }
    align() {
        this.buffer = 0;
        this.bufferLength = 0;
    }
    readFlag() {
        return this.readBits(this.context.bitsPerFlag);
    }
    readCoordinate() {
        const bitsPerCoordinate = this.context.bitsPerCoordinate;
        const xi = this.readBits(bitsPerCoordinate);
        const yi = this.readBits(bitsPerCoordinate);
        const decode = this.context.decode;
        const scale = bitsPerCoordinate < 32
            ? 1 / ((1 << bitsPerCoordinate) - 1)
            : 2.3283064365386963e-10; // 2 ^ -32
        return [
            xi * scale * (decode[1] - decode[0]) + decode[0],
            yi * scale * (decode[3] - decode[2]) + decode[2],
        ];
    }
    readComponents() {
        const numComps = this.context.numComps;
        const bitsPerComponent = this.context.bitsPerComponent;
        const scale = bitsPerComponent < 32
            ? 1 / ((1 << bitsPerComponent) - 1)
            : 2.3283064365386963e-10; // 2 ^ -32
        const decode = this.context.decode;
        const components = this.tmpCompsBuf;
        for (let i = 0, j = 4; i < numComps; i++, j += 2) {
            const ci = this.readBits(bitsPerComponent);
            components[i] = ci * scale * (decode[j + 1] - decode[j]) + decode[j];
        }
        const color = this.tmpCsCompsBuf;
        if (this.context.colorFn) {
            this.context.colorFn(components, 0, color, 0);
        }
        return this.context.colorSpace.getRgb(color, 0);
    }
}
const getB = (() => {
    function buildB(count) {
        const lut = [];
        for (let i = 0; i <= count; i++) {
            const t = i / count, t_ = 1 - t;
            lut.push(new Float32Array([
                t_ * t_ * t_,
                3 * t * t_ * t_,
                3 * t * t * t_,
                t * t * t,
            ]));
        }
        return lut;
    }
    const cache = [];
    return (count) => {
        if (!cache[count]) {
            cache[count] = buildB(count);
        }
        return cache[count];
    };
})();
export class MeshShading extends BaseShading {
    static get MIN_SPLIT_PATCH_CHUNKS_AMOUNT() {
        return shadow(this, "MIN_SPLIT_PATCH_CHUNKS_AMOUNT", 3);
    }
    static get MAX_SPLIT_PATCH_CHUNKS_AMOUNT() {
        return shadow(this, "MAX_SPLIT_PATCH_CHUNKS_AMOUNT", 20);
    }
    /**
     * Count of triangles per entire mesh bounds.
     */
    static get TRIANGLE_DENSITY() {
        return shadow(this, "TRIANGLE_DENSITY", 20);
    }
    shadingType;
    bbox;
    cs;
    background;
    coords = [];
    colors = [];
    figures = [];
    bounds;
    constructor(stream, xref, resources, pdfFunctionFactory, localColorSpaceCache) {
        super();
        if (!(stream instanceof BaseStream)) {
            throw new FormatError("Mesh data is not a stream");
        }
        const dict = stream.dict;
        this.shadingType = dict.get("ShadingType");
        const bbox = dict.getArray("BBox");
        if (Array.isArray(bbox) && bbox.length === 4) {
            this.bbox = Util.normalizeRect(bbox);
        }
        else {
            this.bbox = undefined;
        }
        const cs = ColorSpace.parse({
            cs: (dict.getRaw("CS") || dict.getRaw("ColorSpace")),
            xref,
            resources,
            pdfFunctionFactory,
            localColorSpaceCache,
        });
        this.cs = cs;
        this.background = dict.has("Background")
            ? cs.getRgb(dict.get("Background"), 0)
            : undefined;
        const fnObj = dict.getRaw("Function");
        const fn = fnObj ? pdfFunctionFactory.createFromArray(fnObj) : undefined;
        const decodeContext = {
            bitsPerCoordinate: dict.get("BitsPerCoordinate"),
            bitsPerComponent: dict.get("BitsPerComponent"),
            bitsPerFlag: dict.get("BitsPerFlag"),
            decode: dict.getArray("Decode"),
            colorFn: fn,
            colorSpace: cs,
            numComps: fn ? 1 : cs.numComps,
        };
        const reader = new MeshStreamReader(stream, decodeContext);
        let patchMesh = false;
        switch (this.shadingType) {
            case ShadingType.FREE_FORM_MESH:
                this._decodeType4Shading(reader);
                break;
            case ShadingType.LATTICE_FORM_MESH:
                const verticesPerRow = dict.get("VerticesPerRow") | 0;
                if (verticesPerRow < 2) {
                    throw new FormatError("Invalid VerticesPerRow");
                }
                this._decodeType5Shading(reader, verticesPerRow);
                break;
            case ShadingType.COONS_PATCH_MESH:
                this._decodeType6Shading(reader);
                patchMesh = true;
                break;
            case ShadingType.TENSOR_PATCH_MESH:
                this._decodeType7Shading(reader);
                patchMesh = true;
                break;
            default:
                assert(0, "Unsupported mesh type.");
                break;
        }
        if (patchMesh) {
            // dirty bounds calculation for determining, how dense shall be triangles
            this._updateBounds();
            for (let i = 0, ii = this.figures.length; i < ii; i++) {
                this._buildFigureFromPatch(i);
            }
        }
        // calculate bounds
        this._updateBounds();
        this._packData();
    }
    _decodeType4Shading(reader) {
        const coords = this.coords;
        const colors = this.colors;
        const operators = [];
        const ps = []; // not maintaining cs since that will match ps
        let verticesLeft = 0; // assuming we have all data to start a new triangle
        while (reader.hasData) {
            const f = reader.readFlag();
            const coord = reader.readCoordinate();
            const color = reader.readComponents();
            if (verticesLeft === 0) {
                // ignoring flags if we started a triangle
                if (!(0 <= f && f <= 2)) {
                    throw new FormatError("Unknown type4 flag");
                }
                switch (f) {
                    case 0:
                        verticesLeft = 3;
                        break;
                    case 1:
                        ps.push(ps.at(-2), ps.at(-1));
                        verticesLeft = 1;
                        break;
                    case 2:
                        ps.push(ps.at(-3), ps.at(-1));
                        verticesLeft = 1;
                        break;
                }
                operators.push(f);
            }
            ps.push(coords.length);
            coords.push(coord);
            colors.push(color);
            verticesLeft--;
            reader.align();
        }
        this.figures.push({
            type: "triangles",
            coords: new Int32Array(ps),
            colors: new Int32Array(ps),
        });
    }
    _decodeType5Shading(reader, verticesPerRow) {
        const coords = this.coords;
        const colors = this.colors;
        const ps = []; // not maintaining cs since that will match ps
        while (reader.hasData) {
            const coord = reader.readCoordinate();
            const color = reader.readComponents();
            ps.push(coords.length);
            coords.push(coord);
            colors.push(color);
        }
        this.figures.push({
            type: "lattice",
            coords: new Int32Array(ps),
            colors: new Int32Array(ps),
            verticesPerRow,
        });
    }
    _decodeType6Shading(reader) {
        // A special case of Type 7. The p11, p12, p21, p22 automatically filled
        const coords = this.coords;
        const colors = this.colors;
        const ps = new Int32Array(16); // p00, p10, ..., p30, p01, ..., p33
        const cs = new Int32Array(4); // c00, c30, c03, c33
        while (reader.hasData) {
            const f = reader.readFlag();
            if (!(0 <= f && f <= 3)) {
                throw new FormatError("Unknown type6 flag");
            }
            const pi = coords.length;
            for (let i = 0, ii = f !== 0 ? 8 : 12; i < ii; i++) {
                coords.push(reader.readCoordinate());
            }
            const ci = colors.length;
            for (let i = 0, ii = f !== 0 ? 2 : 4; i < ii; i++) {
                colors.push(reader.readComponents());
            }
            let tmp1, tmp2, tmp3, tmp4;
            switch (f) {
                // deno-fmt-ignore
                case 0:
                    ps[12] = pi + 3;
                    ps[13] = pi + 4;
                    ps[14] = pi + 5;
                    ps[15] = pi + 6;
                    ps[8] = pi + 2; /* values for 5, 6, 9, 10 are    */
                    ps[11] = pi + 7;
                    ps[4] = pi + 1; /* calculated below              */
                    ps[7] = pi + 8;
                    ps[0] = pi;
                    ps[1] = pi + 11;
                    ps[2] = pi + 10;
                    ps[3] = pi + 9;
                    cs[2] = ci + 1;
                    cs[3] = ci + 2;
                    cs[0] = ci;
                    cs[1] = ci + 3;
                    break;
                // deno-fmt-ignore
                case 1:
                    tmp1 = ps[12];
                    tmp2 = ps[13];
                    tmp3 = ps[14];
                    tmp4 = ps[15];
                    ps[12] = tmp4;
                    ps[13] = pi + 0;
                    ps[14] = pi + 1;
                    ps[15] = pi + 2;
                    ps[8] = tmp3; /* values for 5, 6, 9, 10 are    */
                    ps[11] = pi + 3;
                    ps[4] = tmp2; /* calculated below              */
                    ps[7] = pi + 4;
                    ps[0] = tmp1;
                    ps[1] = pi + 7;
                    ps[2] = pi + 6;
                    ps[3] = pi + 5;
                    tmp1 = cs[2];
                    tmp2 = cs[3];
                    cs[2] = tmp2;
                    cs[3] = ci;
                    cs[0] = tmp1;
                    cs[1] = ci + 1;
                    break;
                // deno-fmt-ignore
                case 2:
                    tmp1 = ps[15];
                    tmp2 = ps[11];
                    ps[12] = ps[3];
                    ps[13] = pi + 0;
                    ps[14] = pi + 1;
                    ps[15] = pi + 2;
                    ps[8] = ps[7]; /* values for 5, 6, 9, 10 are    */
                    ps[11] = pi + 3;
                    ps[4] = tmp2; /* calculated below              */
                    ps[7] = pi + 4;
                    ps[0] = tmp1;
                    ps[1] = pi + 7;
                    ps[2] = pi + 6;
                    ps[3] = pi + 5;
                    tmp1 = cs[3];
                    cs[2] = cs[1];
                    cs[3] = ci;
                    cs[0] = tmp1;
                    cs[1] = ci + 1;
                    break;
                // deno-fmt-ignore
                case 3:
                    ps[12] = ps[0];
                    ps[13] = pi + 0;
                    ps[14] = pi + 1;
                    ps[15] = pi + 2;
                    ps[8] = ps[1]; /* values for 5, 6, 9, 10 are    */
                    ps[11] = pi + 3;
                    ps[4] = ps[2]; /* calculated below              */
                    ps[7] = pi + 4;
                    ps[0] = ps[3];
                    ps[1] = pi + 7;
                    ps[2] = pi + 6;
                    ps[3] = pi + 5;
                    cs[2] = cs[0];
                    cs[3] = ci;
                    cs[0] = cs[1];
                    cs[1] = ci + 1;
                    break;
            }
            // set p11, p12, p21, p22
            ps[5] = coords.length;
            coords.push([
                (-4 * coords[ps[0]][0] -
                    coords[ps[15]][0] +
                    6 * (coords[ps[4]][0] + coords[ps[1]][0]) -
                    2 * (coords[ps[12]][0] + coords[ps[3]][0]) +
                    3 * (coords[ps[13]][0] + coords[ps[7]][0])) /
                    9,
                (-4 * coords[ps[0]][1] -
                    coords[ps[15]][1] +
                    6 * (coords[ps[4]][1] + coords[ps[1]][1]) -
                    2 * (coords[ps[12]][1] + coords[ps[3]][1]) +
                    3 * (coords[ps[13]][1] + coords[ps[7]][1])) /
                    9,
            ]);
            ps[6] = coords.length;
            coords.push([
                (-4 * coords[ps[3]][0] -
                    coords[ps[12]][0] +
                    6 * (coords[ps[2]][0] + coords[ps[7]][0]) -
                    2 * (coords[ps[0]][0] + coords[ps[15]][0]) +
                    3 * (coords[ps[4]][0] + coords[ps[14]][0])) /
                    9,
                (-4 * coords[ps[3]][1] -
                    coords[ps[12]][1] +
                    6 * (coords[ps[2]][1] + coords[ps[7]][1]) -
                    2 * (coords[ps[0]][1] + coords[ps[15]][1]) +
                    3 * (coords[ps[4]][1] + coords[ps[14]][1])) /
                    9,
            ]);
            ps[9] = coords.length;
            coords.push([
                (-4 * coords[ps[12]][0] -
                    coords[ps[3]][0] +
                    6 * (coords[ps[8]][0] + coords[ps[13]][0]) -
                    2 * (coords[ps[0]][0] + coords[ps[15]][0]) +
                    3 * (coords[ps[11]][0] + coords[ps[1]][0])) /
                    9,
                (-4 * coords[ps[12]][1] -
                    coords[ps[3]][1] +
                    6 * (coords[ps[8]][1] + coords[ps[13]][1]) -
                    2 * (coords[ps[0]][1] + coords[ps[15]][1]) +
                    3 * (coords[ps[11]][1] + coords[ps[1]][1])) /
                    9,
            ]);
            ps[10] = coords.length;
            coords.push([
                (-4 * coords[ps[15]][0] -
                    coords[ps[0]][0] +
                    6 * (coords[ps[11]][0] + coords[ps[14]][0]) -
                    2 * (coords[ps[12]][0] + coords[ps[3]][0]) +
                    3 * (coords[ps[2]][0] + coords[ps[8]][0])) /
                    9,
                (-4 * coords[ps[15]][1] -
                    coords[ps[0]][1] +
                    6 * (coords[ps[11]][1] + coords[ps[14]][1]) -
                    2 * (coords[ps[12]][1] + coords[ps[3]][1]) +
                    3 * (coords[ps[2]][1] + coords[ps[8]][1])) /
                    9,
            ]);
            this.figures.push({
                type: "patch",
                coords: new Int32Array(ps),
                colors: new Int32Array(cs),
            });
        }
    }
    _decodeType7Shading(reader) {
        const coords = this.coords;
        const colors = this.colors;
        const ps = new Int32Array(16); // p00, p10, ..., p30, p01, ..., p33
        const cs = new Int32Array(4); // c00, c30, c03, c33
        while (reader.hasData) {
            const f = reader.readFlag();
            if (!(0 <= f && f <= 3)) {
                throw new FormatError("Unknown type7 flag");
            }
            const pi = coords.length;
            for (let i = 0, ii = f !== 0 ? 12 : 16; i < ii; i++) {
                coords.push(reader.readCoordinate());
            }
            const ci = colors.length;
            for (let i = 0, ii = f !== 0 ? 2 : 4; i < ii; i++) {
                colors.push(reader.readComponents());
            }
            let tmp1, tmp2, tmp3, tmp4;
            switch (f) {
                // deno-fmt-ignore
                case 0:
                    ps[12] = pi + 3;
                    ps[13] = pi + 4;
                    ps[14] = pi + 5;
                    ps[15] = pi + 6;
                    ps[8] = pi + 2;
                    ps[9] = pi + 13;
                    ps[10] = pi + 14;
                    ps[11] = pi + 7;
                    ps[4] = pi + 1;
                    ps[5] = pi + 12;
                    ps[6] = pi + 15;
                    ps[7] = pi + 8;
                    ps[0] = pi;
                    ps[1] = pi + 11;
                    ps[2] = pi + 10;
                    ps[3] = pi + 9;
                    cs[2] = ci + 1;
                    cs[3] = ci + 2;
                    cs[0] = ci;
                    cs[1] = ci + 3;
                    break;
                // deno-fmt-ignore
                case 1:
                    tmp1 = ps[12];
                    tmp2 = ps[13];
                    tmp3 = ps[14];
                    tmp4 = ps[15];
                    ps[12] = tmp4;
                    ps[13] = pi + 0;
                    ps[14] = pi + 1;
                    ps[15] = pi + 2;
                    ps[8] = tmp3;
                    ps[9] = pi + 9;
                    ps[10] = pi + 10;
                    ps[11] = pi + 3;
                    ps[4] = tmp2;
                    ps[5] = pi + 8;
                    ps[6] = pi + 11;
                    ps[7] = pi + 4;
                    ps[0] = tmp1;
                    ps[1] = pi + 7;
                    ps[2] = pi + 6;
                    ps[3] = pi + 5;
                    tmp1 = cs[2];
                    tmp2 = cs[3];
                    cs[2] = tmp2;
                    cs[3] = ci;
                    cs[0] = tmp1;
                    cs[1] = ci + 1;
                    break;
                // deno-fmt-ignore
                case 2:
                    tmp1 = ps[15];
                    tmp2 = ps[11];
                    ps[12] = ps[3];
                    ps[13] = pi + 0;
                    ps[14] = pi + 1;
                    ps[15] = pi + 2;
                    ps[8] = ps[7];
                    ps[9] = pi + 9;
                    ps[10] = pi + 10;
                    ps[11] = pi + 3;
                    ps[4] = tmp2;
                    ps[5] = pi + 8;
                    ps[6] = pi + 11;
                    ps[7] = pi + 4;
                    ps[0] = tmp1;
                    ps[1] = pi + 7;
                    ps[2] = pi + 6;
                    ps[3] = pi + 5;
                    tmp1 = cs[3];
                    cs[2] = cs[1];
                    cs[3] = ci;
                    cs[0] = tmp1;
                    cs[1] = ci + 1;
                    break;
                // deno-fmt-ignore
                case 3:
                    ps[12] = ps[0];
                    ps[13] = pi + 0;
                    ps[14] = pi + 1;
                    ps[15] = pi + 2;
                    ps[8] = ps[1];
                    ps[9] = pi + 9;
                    ps[10] = pi + 10;
                    ps[11] = pi + 3;
                    ps[4] = ps[2];
                    ps[5] = pi + 8;
                    ps[6] = pi + 11;
                    ps[7] = pi + 4;
                    ps[0] = ps[3];
                    ps[1] = pi + 7;
                    ps[2] = pi + 6;
                    ps[3] = pi + 5;
                    cs[2] = cs[0];
                    cs[3] = ci;
                    cs[0] = cs[1];
                    cs[1] = ci + 1;
                    break;
            }
            this.figures.push({
                type: "patch",
                coords: new Int32Array(ps),
                colors: new Int32Array(cs),
            });
        }
    }
    _buildFigureFromPatch(index) {
        const figure = this.figures[index];
        assert(figure.type === "patch", "Unexpected patch mesh figure");
        const coords = this.coords, colors = this.colors;
        const pi = figure.coords;
        const ci = figure.colors;
        const figureMinX = Math.min(coords[pi[0]][0], coords[pi[3]][0], coords[pi[12]][0], coords[pi[15]][0]);
        const figureMinY = Math.min(coords[pi[0]][1], coords[pi[3]][1], coords[pi[12]][1], coords[pi[15]][1]);
        const figureMaxX = Math.max(coords[pi[0]][0], coords[pi[3]][0], coords[pi[12]][0], coords[pi[15]][0]);
        const figureMaxY = Math.max(coords[pi[0]][1], coords[pi[3]][1], coords[pi[12]][1], coords[pi[15]][1]);
        let splitXBy = Math.ceil(((figureMaxX - figureMinX) * MeshShading.TRIANGLE_DENSITY) /
            (this.bounds[2] - this.bounds[0]));
        splitXBy = Math.max(MeshShading.MIN_SPLIT_PATCH_CHUNKS_AMOUNT, Math.min(MeshShading.MAX_SPLIT_PATCH_CHUNKS_AMOUNT, splitXBy));
        let splitYBy = Math.ceil(((figureMaxY - figureMinY) * MeshShading.TRIANGLE_DENSITY) /
            (this.bounds[3] - this.bounds[1]));
        splitYBy = Math.max(MeshShading.MIN_SPLIT_PATCH_CHUNKS_AMOUNT, Math.min(MeshShading.MAX_SPLIT_PATCH_CHUNKS_AMOUNT, splitYBy));
        const verticesPerRow = splitXBy + 1;
        const figureCoords = new Int32Array((splitYBy + 1) * verticesPerRow);
        const figureColors = new Int32Array((splitYBy + 1) * verticesPerRow);
        let k = 0;
        const cl = new Uint8Array(3);
        const cr = new Uint8Array(3);
        const c0 = colors[ci[0]];
        const c1 = colors[ci[1]];
        const c2 = colors[ci[2]];
        const c3 = colors[ci[3]];
        const bRow = getB(splitYBy), bCol = getB(splitXBy);
        for (let row = 0; row <= splitYBy; row++) {
            cl[0] = ((c0[0] * (splitYBy - row) + c2[0] * row) / splitYBy) | 0;
            cl[1] = ((c0[1] * (splitYBy - row) + c2[1] * row) / splitYBy) | 0;
            cl[2] = ((c0[2] * (splitYBy - row) + c2[2] * row) / splitYBy) | 0;
            cr[0] = ((c1[0] * (splitYBy - row) + c3[0] * row) / splitYBy) | 0;
            cr[1] = ((c1[1] * (splitYBy - row) + c3[1] * row) / splitYBy) | 0;
            cr[2] = ((c1[2] * (splitYBy - row) + c3[2] * row) / splitYBy) | 0;
            for (let col = 0; col <= splitXBy; col++, k++) {
                if ((row === 0 || row === splitYBy) &&
                    (col === 0 || col === splitXBy)) {
                    continue;
                }
                let x = 0, y = 0;
                let q = 0;
                for (let i = 0; i <= 3; i++) {
                    for (let j = 0; j <= 3; j++, q++) {
                        const m = bRow[row][i] * bCol[col][j];
                        x += coords[pi[q]][0] * m;
                        y += coords[pi[q]][1] * m;
                    }
                }
                figureCoords[k] = coords.length;
                coords.push([x, y]);
                figureColors[k] = colors.length;
                const newColor = new Uint8Array(3);
                newColor[0] = ((cl[0] * (splitXBy - col) + cr[0] * col) / splitXBy) | 0;
                newColor[1] = ((cl[1] * (splitXBy - col) + cr[1] * col) / splitXBy) | 0;
                newColor[2] = ((cl[2] * (splitXBy - col) + cr[2] * col) / splitXBy) | 0;
                colors.push(newColor);
            }
        }
        figureCoords[0] = pi[0];
        figureColors[0] = ci[0];
        figureCoords[splitXBy] = pi[3];
        figureColors[splitXBy] = ci[1];
        figureCoords[verticesPerRow * splitYBy] = pi[12];
        figureColors[verticesPerRow * splitYBy] = ci[2];
        figureCoords[verticesPerRow * splitYBy + splitXBy] = pi[15];
        figureColors[verticesPerRow * splitYBy + splitXBy] = ci[3];
        this.figures[index] = {
            type: "lattice",
            coords: figureCoords,
            colors: figureColors,
            verticesPerRow,
        };
    }
    _updateBounds() {
        let minX = this.coords[0][0], minY = this.coords[0][1], maxX = minX, maxY = minY;
        for (let i = 1, ii = this.coords.length; i < ii; i++) {
            const x = this.coords[i][0], y = this.coords[i][1];
            minX = minX > x ? x : minX;
            minY = minY > y ? y : minY;
            maxX = maxX < x ? x : maxX;
            maxY = maxY < y ? y : maxY;
        }
        this.bounds = [minX, minY, maxX, maxY];
    }
    _packData() {
        let i, ii, j, jj;
        const coords = this.coords;
        const coordsPacked = new Float32Array(coords.length * 2);
        for (i = 0, j = 0, ii = coords.length; i < ii; i++) {
            const xy = coords[i];
            coordsPacked[j++] = xy[0];
            coordsPacked[j++] = xy[1];
        }
        this.coords = coordsPacked;
        const colors = this.colors;
        const colorsPacked = new Uint8Array(colors.length * 3);
        for (i = 0, j = 0, ii = colors.length; i < ii; i++) {
            const c = colors[i];
            colorsPacked[j++] = c[0];
            colorsPacked[j++] = c[1];
            colorsPacked[j++] = c[2];
        }
        this.colors = colorsPacked;
        const figures = this.figures;
        for (i = 0, ii = figures.length; i < ii; i++) {
            const figure = figures[i];
            const ps = figure.coords;
            const cs = figure.colors;
            for (j = 0, jj = ps.length; j < jj; j++) {
                ps[j] *= 2;
                cs[j] *= 3;
            }
        }
    }
    /** @implement */
    getIR() {
        return [
            "Mesh",
            this.shadingType,
            this.coords,
            this.colors,
            this.figures,
            this.bounds,
            this.bbox,
            this.background,
        ];
    }
}
class DummyShading extends BaseShading {
    type = "Pattern";
    /** @implement */
    getIR() {
        return ["Dummy"];
    }
}
/**
 * Table 75
 */
export function getTilingPatternIR(operatorList, dict, color) {
    const matrix = dict.getArray("Matrix");
    const bbox = Util.normalizeRect(dict.getArray("BBox"));
    const xstep = dict.get("XStep");
    const ystep = dict.get("YStep");
    const paintType = dict.get("PaintType");
    const tilingType = dict.get("TilingType");
    // Ensure that the pattern has a non-zero width and height, to prevent errors
    // in `pattern_helper.js` (fixes issue8330.pdf).
    if (bbox[2] - bbox[0] === 0 || bbox[3] - bbox[1] === 0) {
        throw new FormatError(`Invalid getTilingPatternIR /BBox array: [${bbox}].`);
    }
    return [
        "TilingPattern",
        color,
        operatorList,
        matrix,
        bbox,
        xstep,
        ystep,
        paintType,
        tilingType,
    ];
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=pattern.js.map