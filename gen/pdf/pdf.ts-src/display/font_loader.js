/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
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
import { html } from "../../../lib/dom.js";
import { assert } from "../../../lib/util/trace.js";
import { bytesToString, IsEvalSupportedCached, shadow, string32, UNSUPPORTED_FEATURES, warn, } from "../shared/util.js";
import { FontExpotDataEx } from "../core/fonts.js";
class BaseFontLoader {
    docId;
    _onUnsupportedFeature;
    _document;
    nativeFontFaces = [];
    styleElement;
    constructor({ docId, onUnsupportedFeature, ownerDocument = globalThis.document, styleElement = undefined, // For testing only.
     }) {
        this.docId = docId;
        this._onUnsupportedFeature = onUnsupportedFeature;
        this._document = ownerDocument;
        this.styleElement =
            styleElement;
    }
    addNativeFontFace(nativeFontFace) {
        this.nativeFontFaces.push(nativeFontFace);
        this._document.fonts.add(nativeFontFace);
    }
    insertRule(rule) {
        let styleElement = this.styleElement;
        if (!styleElement) {
            styleElement = this.styleElement = html("style", "", this._document);
            styleElement.id = `PDFJS_FONT_STYLE_TAG_${this.docId}`;
            this._document.documentElement
                .getElementsByTagName("head")[0]
                .appendChild(styleElement);
        }
        const styleSheet = styleElement.sheet;
        styleSheet.insertRule(rule, styleSheet.cssRules.length);
    }
    clear() {
        for (const nativeFontFace of this.nativeFontFaces) {
            this._document.fonts.delete(nativeFontFace);
        }
        this.nativeFontFaces.length = 0;
        if (this.styleElement) {
            // Note: ChildNode.remove doesn't throw if the parentNode is undefined.
            this.styleElement.remove();
            this.styleElement = undefined;
        }
    }
    async bind(font) {
        // Add the font to the DOM only once; skip if the font is already loaded.
        if (font.attached || font.missingFile)
            return;
        font.attached = true;
        if (this.isFontLoadingAPISupported) {
            const nativeFontFace = font.createNativeFontFace();
            if (nativeFontFace) {
                this.addNativeFontFace(nativeFontFace);
                try {
                    await nativeFontFace.loaded;
                }
                catch (ex) {
                    this._onUnsupportedFeature({
                        featureId: UNSUPPORTED_FEATURES.errorFontLoadNative,
                    });
                    warn(`Failed to load font '${nativeFontFace.family}': '${ex}'.`);
                    // When font loading failed, fall back to the built-in font renderer.
                    font.disableFontFace = true;
                    throw ex;
                }
            }
            return; // The font was, asynchronously, loaded.
        }
        //. !this.isFontLoadingAPISupported
        const rule = font.createFontFaceRule();
        if (rule) {
            this.insertRule(rule);
            if (this.isSyncFontLoadingSupported) {
                return; // The font was, synchronously, loaded.
            }
            await new Promise(resolve => {
                const request = this.queueLoadingCallback$(resolve);
                this.prepareFontLoadEvent$([rule], [font], request);
            });
            // The font was, asynchronously, loaded.
        }
    }
    queueLoadingCallback$(callback) {
        assert(0, "Abstract method `queueLoadingCallback$`.");
        return 0;
    }
    get isFontLoadingAPISupported() {
        const hasFonts = !!this._document?.fonts;
        return shadow(this, "isFontLoadingAPISupported", hasFonts && !this.styleElement);
        return shadow(this, "isFontLoadingAPISupported", hasFonts);
    }
    // eslint-disable-next-line getter-return
    get _loadTestFont() {
        assert(0, "Abstract method `_loadTestFont`.");
        return "";
    }
    prepareFontLoadEvent$(rules, fontsToLoad, request) {
        assert(0, "Abstract method `prepareFontLoadEvent$`.");
    }
}
export class FontLoader extends BaseFontLoader {
    loadingContext = {
        requests: [],
        nextRequestId: 0,
    };
    loadTestFontId = 0;
    /** @implements */
    get isSyncFontLoadingSupported() {
        let supported = false;
        if (typeof navigator === "undefined") {
            // Node.js - we can pretend that sync font loading is supported.
            supported = true;
        }
        else {
            // User agent string sniffing is bad, but there is no reliable way to
            // tell if the font is fully loaded and ready to be used with canvas.
            const m = /Mozilla\/5.0.*?rv:(\d+).*? Gecko/.exec(navigator.userAgent);
            if (m?.[1] >= 14) {
                supported = true;
            }
            // TODO - other browsers...
        }
        return shadow(this, "isSyncFontLoadingSupported", supported);
    }
    queueLoadingCallback$(callback) {
        function completeRequest() {
            assert(!request.done, "completeRequest() cannot be called twice.");
            request.done = true;
            // Sending all completed requests in order of how they were queued.
            while (context.requests.length > 0 && context.requests[0].done) {
                const otherRequest = context.requests.shift();
                setTimeout(otherRequest.callback, 0);
            }
        }
        const context = this.loadingContext;
        const request = {
            id: `pdfjs-font-loading-${context.nextRequestId++}`,
            done: false,
            complete: completeRequest,
            callback,
        };
        context.requests.push(request);
        return request;
    }
    get _loadTestFont() {
        const getLoadTestFont = function () {
            // This is a CFF font with 1 glyph for '.' that fills its entire width
            // and height.
            return atob("T1RUTwALAIAAAwAwQ0ZGIDHtZg4AAAOYAAAAgUZGVE1lkzZwAAAEHAAAABxHREVGABQA" +
                "FQAABDgAAAAeT1MvMlYNYwkAAAEgAAAAYGNtYXABDQLUAAACNAAAAUJoZWFk/xVFDQAA" +
                "ALwAAAA2aGhlYQdkA+oAAAD0AAAAJGhtdHgD6AAAAAAEWAAAAAZtYXhwAAJQAAAAARgA" +
                "AAAGbmFtZVjmdH4AAAGAAAAAsXBvc3T/hgAzAAADeAAAACAAAQAAAAEAALZRFsRfDzz1" +
                "AAsD6AAAAADOBOTLAAAAAM4KHDwAAAAAA+gDIQAAAAgAAgAAAAAAAAABAAADIQAAAFoD" +
                "6AAAAAAD6AABAAAAAAAAAAAAAAAAAAAAAQAAUAAAAgAAAAQD6AH0AAUAAAKKArwAAACM" +
                "AooCvAAAAeAAMQECAAACAAYJAAAAAAAAAAAAAQAAAAAAAAAAAAAAAFBmRWQAwAAuAC4D" +
                "IP84AFoDIQAAAAAAAQAAAAAAAAAAACAAIAABAAAADgCuAAEAAAAAAAAAAQAAAAEAAAAA" +
                "AAEAAQAAAAEAAAAAAAIAAQAAAAEAAAAAAAMAAQAAAAEAAAAAAAQAAQAAAAEAAAAAAAUA" +
                "AQAAAAEAAAAAAAYAAQAAAAMAAQQJAAAAAgABAAMAAQQJAAEAAgABAAMAAQQJAAIAAgAB" +
                "AAMAAQQJAAMAAgABAAMAAQQJAAQAAgABAAMAAQQJAAUAAgABAAMAAQQJAAYAAgABWABY" +
                "AAAAAAAAAwAAAAMAAAAcAAEAAAAAADwAAwABAAAAHAAEACAAAAAEAAQAAQAAAC7//wAA" +
                "AC7////TAAEAAAAAAAABBgAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
                "AAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
                "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
                "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
                "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
                "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAD/gwAyAAAAAQAAAAAAAAAAAAAAAAAA" +
                "AAABAAQEAAEBAQJYAAEBASH4DwD4GwHEAvgcA/gXBIwMAYuL+nz5tQXkD5j3CBLnEQAC" +
                "AQEBIVhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYAAABAQAADwACAQEEE/t3" +
                "Dov6fAH6fAT+fPp8+nwHDosMCvm1Cvm1DAz6fBQAAAAAAAABAAAAAMmJbzEAAAAAzgTj" +
                "FQAAAADOBOQpAAEAAAAAAAAADAAUAAQAAAABAAAAAgABAAAAAAAAAAAD6AAAAAAAAA==");
        };
        return shadow(this, "_loadTestFont", getLoadTestFont());
    }
    prepareFontLoadEvent$(rules, fonts, request) {
        /** Hack begin */
        // There's currently no event when a font has finished downloading so the
        // following code is a dirty hack to 'guess' when a font is ready.
        // It's assumed fonts are loaded in order, so add a known test font after
        // the desired fonts and then test for the loading of that test font.
        function int32(data, offset) {
            return ((data.charCodeAt(offset) << 24) |
                (data.charCodeAt(offset + 1) << 16) |
                (data.charCodeAt(offset + 2) << 8) |
                (data.charCodeAt(offset + 3) & 0xff));
        }
        function spliceString(s, offset, remove, insert) {
            const chunk1 = s.substring(0, offset);
            const chunk2 = s.substring(offset + remove);
            return chunk1 + insert + chunk2;
        }
        let i, ii;
        // The temporary canvas is used to determine if fonts are loaded.
        const canvas = html("canvas", undefined, this._document);
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d");
        let called = 0;
        function isFontReady(name, callback) {
            called++;
            // With setTimeout clamping this gives the font ~100ms to load.
            if (called > 30) {
                warn("Load test font never loaded.");
                callback();
                return;
            }
            ctx.font = "30px " + name;
            ctx.fillText(".", 0, 20);
            const imageData = ctx.getImageData(0, 0, 1, 1);
            if (imageData.data[3] > 0) {
                callback();
                return;
            }
            setTimeout(isFontReady.bind(null, name, callback));
        }
        const loadTestFontId = `lt${Date.now()}${this.loadTestFontId++}`;
        // Chromium seems to cache fonts based on a hash of the actual font data,
        // so the font must be modified for each load test else it will appear to
        // be loaded already.
        // TODO: This could maybe be made faster by avoiding the btoa of the full
        // font by splitting it in chunks before hand and padding the font id.
        let data = this._loadTestFont;
        const COMMENT_OFFSET = 976; // has to be on 4 byte boundary (for checksum)
        data = spliceString(data, COMMENT_OFFSET, loadTestFontId.length, loadTestFontId);
        // CFF checksum is important for IE, adjusting it
        const CFF_CHECKSUM_OFFSET = 16;
        const XXXX_VALUE = 0x58585858; // the "comment" filled with 'X'
        let checksum = int32(data, CFF_CHECKSUM_OFFSET);
        for (i = 0, ii = loadTestFontId.length - 3; i < ii; i += 4) {
            checksum = (checksum - XXXX_VALUE + int32(loadTestFontId, i)) | 0;
        }
        if (i < loadTestFontId.length) {
            // align to 4 bytes boundary
            checksum =
                (checksum - XXXX_VALUE + int32(loadTestFontId + "XXX", i)) | 0;
        }
        data = spliceString(data, CFF_CHECKSUM_OFFSET, 4, string32(checksum));
        const url = `url(data:font/opentype;base64,${btoa(data)});`;
        const rule = `@font-face {font-family:"${loadTestFontId}";src:${url}}`;
        this.insertRule(rule);
        const names = [];
        for (const font of fonts) {
            names.push(font.loadedName);
        }
        names.push(loadTestFontId);
        const div = html("div", undefined, this._document);
        div.style.visibility = "hidden";
        div.style.width = div.style.height = "10px";
        div.style.position = "absolute";
        div.style.top = div.style.left = "0px";
        for (const name of names) {
            const span = html("span", undefined, this._document);
            span.textContent = "Hi";
            span.style.fontFamily = name;
            div.appendChild(span);
        }
        this._document.body.appendChild(div);
        isFontReady(loadTestFontId, () => {
            this._document.body.removeChild(div);
            request.complete();
        });
        /** Hack end */
    }
}
export class FontFaceObject extends FontExpotDataEx {
    compiledGlyphs = Object.create(null);
    isEvalSupported;
    disableFontFace;
    ignoreErrors;
    _onUnsupportedFeature;
    fontRegistry;
    attached;
    constructor(translatedData, { isEvalSupported = true, disableFontFace = false, ignoreErrors = false, onUnsupportedFeature, fontRegistry, }) {
        super();
        // importing translated data
        for (const i in translatedData) {
            this[i] = translatedData[i];
        }
        this.isEvalSupported = isEvalSupported !== false;
        this.disableFontFace = disableFontFace === true;
        this.ignoreErrors = ignoreErrors === true;
        this._onUnsupportedFeature = onUnsupportedFeature;
        this.fontRegistry = fontRegistry;
    }
    createNativeFontFace() {
        if (!this.data || this.disableFontFace)
            return null;
        let nativeFontFace;
        if (!this.cssFontInfo) {
            nativeFontFace = new FontFace(this.loadedName, this.data, {});
        }
        else {
            const css = {
                weight: this.cssFontInfo.fontWeight + "",
            };
            if (this.cssFontInfo.italicAngle) {
                css.style = `oblique ${this.cssFontInfo.italicAngle}deg`;
            }
            nativeFontFace = new FontFace(this.cssFontInfo.fontFamily, this.data, css);
        }
        this.fontRegistry?.registerFont(this);
        return nativeFontFace;
    }
    createFontFaceRule() {
        if (!this.data || this.disableFontFace)
            return null;
        const data = bytesToString(this.data);
        // Add the @font-face rule to the document.
        const url = `url(data:${this.mimetype};base64,${btoa(data)});`;
        let rule;
        if (!this.cssFontInfo) {
            rule = `@font-face {font-family:"${this.loadedName}";src:${url}}`;
        }
        else {
            let css = `font-weight: ${this.cssFontInfo.fontWeight};`;
            if (this.cssFontInfo.italicAngle) {
                css += `font-style: oblique ${this.cssFontInfo.italicAngle}deg;`;
            }
            rule = `@font-face {font-family:"${this.cssFontInfo.fontFamily}";${css}src:${url}}`;
        }
        this.fontRegistry?.registerFont(this, url);
        return rule;
    }
    getPathGenerator(objs, character) {
        if (this.compiledGlyphs[character] !== undefined) {
            return this.compiledGlyphs[character];
        }
        let cmds;
        try {
            cmds = objs.get(this.loadedName + "_path_" + character);
        }
        catch (ex) {
            if (!this.ignoreErrors) {
                throw ex;
            }
            this._onUnsupportedFeature({
                featureId: UNSUPPORTED_FEATURES.errorFontGetPath,
            });
            warn(`getPathGenerator - ignoring character: "${ex}".`);
            return (this.compiledGlyphs[character] = function (c, size) {
                // No-op function, to allow rendering to continue.
            });
        }
        // If we can, compile cmds into JS for MAXIMUM SPEED...
        if (this.isEvalSupported && IsEvalSupportedCached.value) {
            const jsBuf = [];
            for (const current of cmds) {
                const args = current.args !== undefined ? current.args.join(",") : "";
                jsBuf.push("c.", current.cmd, "(", args, ");\n");
            }
            // eslint-disable-next-line no-new-func
            return (this.compiledGlyphs[character] = new Function("c", "size", jsBuf.join("")));
        }
        // ... but fall back on using Function.prototype.apply() if we're
        // blocked from using eval() for whatever reason (like CSP policies).
        return (this.compiledGlyphs[character] = function (c, size) {
            for (const current of cmds) {
                if (current.cmd === "scale") {
                    current.args = [size, -size];
                }
                c[current.cmd].apply(c, current.args);
            }
        });
    }
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=font_loader.js.map