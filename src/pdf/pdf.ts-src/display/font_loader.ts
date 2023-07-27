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

import { CHROME, MOZCENTRAL, PDFJSDev, TESTING } from "../../../global.ts";
import type { C2D } from "../../../lib/alias.ts";
import { html } from "../../../lib/dom.ts";
import { assert } from "../../../lib/util/trace.ts";
import { FontExpotDataEx } from "../core/fonts.ts";
import type { CmdArgs } from "../core/font_renderer.ts";
import {
  bytesToString,
  FeatureTest,
  shadow,
  string32,
  warn,
} from "../shared/util.ts";
import type { PDFObjects } from "./api.ts";
/*80--------------------------------------------------------------------------*/

interface _BaseFontLoaderCtorP {
  ownerDocument: Document | undefined;
  styleElement?: HTMLStyleElement | undefined;
}

export interface Request {
  done: boolean;
  complete: () => void;
  callback: (request: Request) => void;
}

export class FontLoader {
  _document: Document;

  nativeFontFaces: FontFace[] = [];
  styleElement: HTMLStyleElement | undefined;

  loadingRequests: Request[] | undefined;
  loadTestFontId!: number;

  constructor({
    ownerDocument = globalThis.document,
    styleElement = undefined, // For testing only
  }: _BaseFontLoaderCtorP) {
    this._document = ownerDocument;

    this.styleElement = /*#static*/ PDFJSDev || TESTING
      ? styleElement
      : undefined;

    /*#static*/ if (PDFJSDev || !MOZCENTRAL) {
      this.loadingRequests = [];
      this.loadTestFontId = 0;
    }
  }

  addNativeFontFace(nativeFontFace: FontFace) {
    this.nativeFontFaces.push(nativeFontFace);
    this._document.fonts.add(nativeFontFace);
  }

  insertRule(rule: string) {
    if (!this.styleElement) {
      this.styleElement = this._document.createElement("style");
      this._document.documentElement
        .getElementsByTagName("head")[0]
        .append(this.styleElement);
    }
    const styleSheet = this.styleElement.sheet!;
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

  async bind(font: FontFaceObject) {
    // Add the font to the DOM only once; skip if the font is already loaded.
    if (font.attached || font.missingFile) {
      return;
    }
    font.attached = true;

    if (this.isFontLoadingAPISupported) {
      const nativeFontFace = font.createNativeFontFace();
      if (nativeFontFace) {
        this.addNativeFontFace(nativeFontFace);
        try {
          await nativeFontFace.loaded;
        } catch (ex) {
          warn(`Failed to load font '${nativeFontFace.family}': '${ex}'.`);

          // When font loading failed, fall back to the built-in font renderer.
          font.disableFontFace = true;
          throw ex;
        }
      }
      return; // The font was, asynchronously, loaded.
    }

    // !this.isFontLoadingAPISupported
    const rule = font.createFontFaceRule();
    if (rule) {
      this.insertRule(rule);

      if (this.isSyncFontLoadingSupported) {
        return; // The font was, synchronously, loaded.
      }
      /*#static*/ if (MOZCENTRAL) {
        throw new Error("Not implemented: async font loading");
      }
      await new Promise<Request>((resolve) => {
        const request = this._queueLoadingCallback(resolve);
        this._prepareFontLoadEvent(font, request);
      });
      // The font was, asynchronously, loaded.
    }
  }

  get isFontLoadingAPISupported() {
    const hasFonts = !!this._document?.fonts;
    /*#static*/ if (PDFJSDev || TESTING) {
      return shadow(
        this,
        "isFontLoadingAPISupported",
        hasFonts && !this.styleElement,
      );
    } else {
      return shadow(this, "isFontLoadingAPISupported", hasFonts);
    }
  }

  get isSyncFontLoadingSupported() {
    /*#static*/ if (MOZCENTRAL) {
      return shadow(this, "isSyncFontLoadingSupported", true);
    }

    let supported = false;
    /*#static*/ if (PDFJSDev || !CHROME) {
      if (
        globalThis.navigator &&
        // User agent string sniffing is bad, but there is no reliable way to
        // tell if the font is fully loaded and ready to be used with canvas.
        /Mozilla\/5.0.*?rv:\d+.*? Gecko/.test(navigator.userAgent)
      ) {
        // Firefox, from version 14, supports synchronous font loading.
        supported = true;
      }
    }
    return shadow(this, "isSyncFontLoadingSupported", supported);
  }

  _queueLoadingCallback(callback: (request: Request) => void) {
    /*#static*/ if (MOZCENTRAL) {
      throw new Error("Not implemented: _queueLoadingCallback");
    }

    function completeRequest() {
      assert(!request.done, "completeRequest() cannot be called twice.");
      request.done = true;

      // Sending all completed requests in order of how they were queued.
      while (loadingRequests!.length > 0 && loadingRequests![0].done) {
        const otherRequest = loadingRequests!.shift();
        setTimeout(otherRequest!.callback, 0);
      }
    }

    const { loadingRequests } = this;
    const request: Request = {
      done: false,
      complete: completeRequest,
      callback,
    };
    loadingRequests!.push(request);
    return request;
  }

  get _loadTestFont() {
    /*#static*/ if (MOZCENTRAL) {
      throw new Error("Not implemented: _loadTestFont");
    }

    // This is a CFF font with 1 glyph for '.' that fills its entire width
    // and height.
    const testFont = atob(
      "T1RUTwALAIAAAwAwQ0ZGIDHtZg4AAAOYAAAAgUZGVE1lkzZwAAAEHAAAABxHREVGABQA" +
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
        "FQAAAADOBOQpAAEAAAAAAAAADAAUAAQAAAABAAAAAgABAAAAAAAAAAAD6AAAAAAAAA==",
    );
    return shadow(this, "_loadTestFont", testFont);
  }

  _prepareFontLoadEvent(font: FontFaceObject, request: Request) {
    /*#static*/ if (MOZCENTRAL) {
      throw new Error("Not implemented: _prepareFontLoadEvent");
    }

    /** Hack begin */
    // There's currently no event when a font has finished downloading so the
    // following code is a dirty hack to 'guess' when a font is ready.
    // It's assumed fonts are loaded in order, so add a known test font after
    // the desired fonts and then test for the loading of that test font.

    function int32(data: string, offset: number) {
      return (
        (data.charCodeAt(offset) << 24) |
        (data.charCodeAt(offset + 1) << 16) |
        (data.charCodeAt(offset + 2) << 8) |
        (data.charCodeAt(offset + 3) & 0xff)
      );
    }
    function spliceString(
      s: string,
      offset: number,
      remove: number,
      insert: string,
    ) {
      const chunk1 = s.substring(0, offset);
      const chunk2 = s.substring(offset + remove);
      return chunk1 + insert + chunk2;
    }
    let i, ii;

    // The temporary canvas is used to determine if fonts are loaded.
    const canvas = html("canvas", undefined, this._document);
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d")!;

    let called = 0;
    function isFontReady(name: string, callback: () => void) {
      // With setTimeout clamping this gives the font ~100ms to load.
      if (++called > 30) {
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
    data = spliceString(
      data,
      COMMENT_OFFSET,
      loadTestFontId.length,
      loadTestFontId,
    );
    // CFF checksum is important for IE, adjusting it
    const CFF_CHECKSUM_OFFSET = 16;
    const XXXX_VALUE = 0x58585858; // the "comment" filled with 'X'
    let checksum = int32(data, CFF_CHECKSUM_OFFSET);
    for (i = 0, ii = loadTestFontId.length - 3; i < ii; i += 4) {
      checksum = (checksum - XXXX_VALUE + int32(loadTestFontId, i)) | 0;
    }
    if (i < loadTestFontId.length) {
      // align to 4 bytes boundary
      checksum = (checksum - XXXX_VALUE + int32(loadTestFontId + "XXX", i)) | 0;
    }
    data = spliceString(data, CFF_CHECKSUM_OFFSET, 4, string32(checksum));

    const url = `url(data:font/opentype;base64,${btoa(data)});`;
    const rule = `@font-face {font-family:"${loadTestFontId}";src:${url}}`;
    this.insertRule(rule);

    const div = html("div", undefined, this._document);
    div.style.visibility = "hidden";
    div.style.width = div.style.height = "10px";
    div.style.position = "absolute";
    div.style.top = div.style.left = "0px";

    for (const name of [font.loadedName, loadTestFontId]) {
      const span = html("span", undefined, this._document);
      span.textContent = "Hi";
      span.style.fontFamily = name!;
      div.append(span);
    }
    this._document.body.append(div);

    isFontReady(loadTestFontId, () => {
      div.remove();
      request.complete();
    });
    /** Hack end */
  }
}

interface FFOCtorP_ {
  isEvalSupported: boolean | undefined;
  disableFontFace: boolean | undefined;
  ignoreErrors: boolean | undefined;
  inspectFont: ((font: FontFaceObject, url?: string) => void) | undefined;
}

export type AddToPath = (c: C2D, size: number) => void;

export class FontFaceObject extends FontExpotDataEx {
  compiledGlyphs: Record<string, AddToPath> = Object.create(null);
  isEvalSupported: boolean;
  disableFontFace: boolean;
  ignoreErrors: boolean;
  _inspectFont;

  attached?: boolean;

  constructor(
    translatedData: FontExpotDataEx,
    {
      isEvalSupported = true,
      disableFontFace = false,
      ignoreErrors = false,
      inspectFont = undefined,
    }: FFOCtorP_,
  ) {
    super();

    // importing translated data
    for (const i in translatedData) {
      (this as any)[i] = translatedData[<keyof FontExpotDataEx> i];
    }
    this.isEvalSupported = isEvalSupported !== false;
    this.disableFontFace = disableFontFace === true;
    this.ignoreErrors = ignoreErrors === true;
    this._inspectFont = inspectFont;
  }

  createNativeFontFace() {
    if (!this.data || this.disableFontFace) return null;

    let nativeFontFace;
    if (!this.cssFontInfo) {
      nativeFontFace = new FontFace(this.loadedName!, this.data, {});
    } else {
      const css: FontFaceDescriptors = {
        weight: <any> this.cssFontInfo.fontWeight,
      };
      if (this.cssFontInfo.italicAngle) {
        css.style = `oblique ${this.cssFontInfo.italicAngle}deg`;
      }
      nativeFontFace = new FontFace(
        this.cssFontInfo.fontFamily,
        this.data,
        css,
      );
    }

    this._inspectFont?.(this);
    return nativeFontFace;
  }

  createFontFaceRule() {
    if (!this.data || this.disableFontFace) return null;

    const data = bytesToString(this.data);
    // Add the @font-face rule to the document.
    const url = `url(data:${this.mimetype};base64,${btoa(data)});`;
    let rule;
    if (!this.cssFontInfo) {
      rule = `@font-face {font-family:"${this.loadedName}";src:${url}}`;
    } else {
      let css = `font-weight: ${this.cssFontInfo.fontWeight};`;
      if (this.cssFontInfo.italicAngle) {
        css += `font-style: oblique ${this.cssFontInfo.italicAngle}deg;`;
      }
      rule =
        `@font-face {font-family:"${this.cssFontInfo.fontFamily}";${css}src:${url}}`;
    }

    this._inspectFont?.(this, url);
    return rule;
  }

  getPathGenerator(
    objs: PDFObjects<CmdArgs[] | FontFaceObject>,
    character: string,
  ) {
    if (this.compiledGlyphs[character] !== undefined) {
      return this.compiledGlyphs[character];
    }

    let cmds: CmdArgs[];
    try {
      cmds = <CmdArgs[]> objs.get(this.loadedName + "_path_" + character)!;
    } catch (ex) {
      if (!this.ignoreErrors) {
        throw ex;
      }
      warn(`getPathGenerator - ignoring character: "${ex}".`);

      return (this.compiledGlyphs[character] = (c: C2D, size: number) => {
        // No-op function, to allow rendering to continue.
      });
    }

    // If we can, compile cmds into JS for MAXIMUM SPEED...
    if (this.isEvalSupported && FeatureTest.isEvalSupported) {
      const jsBuf: string[] = [];
      for (const current of cmds) {
        const args = current.args !== undefined ? current.args.join(",") : "";
        jsBuf.push("c.", current.cmd, "(", args, ");\n");
      }
      // eslint-disable-next-line no-new-func
      return (this.compiledGlyphs[character] = <AddToPath> new Function(
        "c",
        "size",
        jsBuf.join(""),
      ));
    }
    // ... but fall back on using Function.prototype.apply() if we're
    // blocked from using eval() for whatever reason (like CSP policies).
    return (this.compiledGlyphs[character] = (c: C2D, size: number) => {
      for (const current of cmds) {
        if (current.cmd === "scale") {
          current.args = [size, -size];
        }
        // eslint-disable-next-line prefer-spread
        c[current.cmd].apply<C2D, number[], void>(c, current.args as number[]);
      }
    });
  }
}
/*80--------------------------------------------------------------------------*/
