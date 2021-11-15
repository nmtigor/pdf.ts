/*81*****************************************************************************
 * cff_parser_test
** --------------- */
import { eq } from "../../../lib/jslang.js";
import { css_1, css_2 } from "../../../test/alias.js";
import { Stream } from "./stream.js";
import { CFFCharset, CFFCompiler, CFFFDSelect, CFFParser, CFFStrings } from "./cff_parser.js";
import { SEAC_ANALYSIS_ENABLED } from "./fonts_utils.js";
const strttime = performance.now();
/*81---------------------------------------------------------------------------*/
console.log("%c>>>>>>> test CFFParser >>>>>>>", `color:${css_1}`);
{
    function createWithNullProto(obj) {
        const result = Object.create(null);
        for (const i in obj) {
            result[+i] = obj[i];
        }
        return result;
    }
    // Stub that returns `0` for any privateDict key.
    const privateDictStub = {
        getByName(name) { return 0; },
    };
    let parser, cff;
    // This example font comes from the CFF spec:
    // http://www.adobe.com/content/dam/Adobe/en/devnet/font/pdfs/5176.CFF.pdf
    const exampleFont = "0100040100010101134142434445462b" +
        "54696d65732d526f6d616e000101011f" +
        "f81b00f81c02f81d03f819041c6f000d" +
        "fb3cfb6efa7cfa1605e911b8f1120003" +
        "01010813183030312e30303754696d65" +
        "7320526f6d616e54696d657300000002" +
        "010102030e0e7d99f92a99fb7695f773" +
        "8b06f79a93fc7c8c077d99f85695f75e" +
        "9908fb6e8cf87393f7108b09a70adf0b" +
        "f78e14";
    const fontArr = [];
    for (let i = 0, ii = exampleFont.length; i < ii; i += 2) {
        const hex = exampleFont.substring(i, i + 2);
        fontArr.push(parseInt(hex, 16));
    }
    let fontData = new Stream(fontArr);
    function beforeEach() {
        parser = new CFFParser(fontData, {}, SEAC_ANALYSIS_ENABLED);
        cff = parser.parse();
    }
    function afterEach() {
        parser = cff = undefined;
    }
    console.log("it parses header...");
    beforeEach();
    {
        const header = cff.header;
        console.assert(header.major === 1);
        console.assert(header.minor === 0);
        console.assert(header.hdrSize === 4);
        console.assert(header.offSize === 1);
    }
    afterEach();
    console.log("it parses name index...");
    beforeEach();
    {
        const names = cff.names;
        console.assert(names.length === 1);
        console.assert(names[0] === "ABCDEF+Times-Roman");
    }
    afterEach();
    console.log("it parses top dict...");
    beforeEach();
    {
        const topDict = cff.topDict;
        // 391 version 392 FullName 393 FamilyName 389 Weight 28416 UniqueID
        // -168 -218 1000 898 FontBBox 94 CharStrings 45 102 Private
        console.assert(topDict.getByName("version") === 391);
        console.assert(topDict.getByName("FullName") === 392);
        console.assert(topDict.getByName("FamilyName") === 393);
        console.assert(topDict.getByName("Weight") === 389);
        console.assert(topDict.getByName("UniqueID") === 28416);
        console.assert(topDict.getByName("FontBBox").eq([-168, -218, 1000, 898]));
        console.assert(topDict.getByName("CharStrings") === 94);
        console.assert(topDict.getByName("Private").eq([45, 102]));
    }
    afterEach();
    console.log("it refuses to add topDict key with invalid value (bug 1068432)...");
    beforeEach();
    {
        const topDict = cff.topDict;
        const defaultValue = topDict.getByName("UnderlinePosition");
        topDict.setByKey(/* [12, 3] = */ 3075, [NaN]);
        console.assert(topDict.getByName("UnderlinePosition") === defaultValue);
    }
    afterEach();
    console.log("it ignores reserved commands in parseDict, and refuses to add privateDict keys with invalid values (bug 1308536)...");
    beforeEach();
    {
        const bytes = new Uint8Array([
            64, 39, 31, 30, 252, 114, 137, 115, 79, 30, 197, 119, 2, 99, 127, 6,
        ]);
        parser.bytes = bytes;
        const topDict = cff.topDict;
        topDict.setByName("Private", [bytes.length, 0]);
        const parsePrivateDict = function () {
            parser.parsePrivateDict(topDict);
        };
        try {
            parsePrivateDict();
        }
        catch {
            console.assert(!!0);
        }
        const privateDict = topDict.privateDict;
        console.assert(privateDict.getByName("BlueValues") === null);
    }
    afterEach();
    console.log("it parses a CharString having cntrmask...");
    beforeEach();
    {
        // prettier-ignore
        const bytes = new Uint8Array([
            0, 1,
            1,
            0,
            38,
            149, 149, 149, 149, 149, 149, 149, 149,
            149, 149, 149, 149, 149, 149, 149, 149,
            1,
            149, 149, 149, 149, 149, 149, 149, 149,
            149, 149, 149, 149, 149, 149, 149, 149,
            3,
            20,
            22, 22,
            14 // endchar
        ]);
        parser.bytes = bytes;
        const charStringsIndex = parser.parseIndex(0).obj;
        const charStrings = parser.parseCharStrings({
            charStrings: charStringsIndex,
            privateDict: privateDictStub,
        }).charStrings;
        console.assert(charStrings.count === 1);
        // shouldn't be sanitized
        console.assert(charStrings.get(0).length === 38);
    }
    afterEach();
    console.log("it parses a CharString endchar with 4 args w/seac enabled...");
    beforeEach();
    {
        const cffParser = new CFFParser(fontData, {}, 
        /* seacAnalysisEnabled = */ true);
        cffParser.parse(); // cff
        // prettier-ignore
        const bytes = new Uint8Array([
            0, 1,
            1,
            0,
            237, 247, 22, 247, 72, 204, 247, 86, 14
        ]);
        cffParser.bytes = bytes;
        const charStringsIndex = cffParser.parseIndex(0).obj;
        const result = cffParser.parseCharStrings({
            charStrings: charStringsIndex,
            privateDict: privateDictStub,
        });
        console.assert(result.charStrings.count === 1);
        console.assert(result.charStrings.get(0).length === 1);
        console.assert(result.seacs.length === 1);
        console.assert(result.seacs[0].length === 4);
        console.assert(result.seacs[0][0] === 130);
        console.assert(result.seacs[0][1] === 180);
        console.assert(result.seacs[0][2] === 65);
        console.assert(result.seacs[0][3] === 194);
    }
    afterEach();
    console.log("it parses a CharString endchar with 4 args w/seac disabled...");
    beforeEach();
    {
        const cffParser = new CFFParser(fontData, {}, 
        /* seacAnalysisEnabled = */ false);
        cffParser.parse(); // cff
        // prettier-ignore
        const bytes = new Uint8Array([
            0, 1,
            1,
            0,
            237, 247, 22, 247, 72, 204, 247, 86, 14
        ]);
        cffParser.bytes = bytes;
        const charStringsIndex = cffParser.parseIndex(0).obj;
        const result = cffParser.parseCharStrings({
            charStrings: charStringsIndex,
            privateDict: privateDictStub,
        });
        console.assert(result.charStrings.count === 1);
        console.assert(result.charStrings.get(0).length === 9);
        console.assert(result.seacs.length === 0);
    }
    afterEach();
    console.log("it parses a CharString endchar no args...");
    beforeEach();
    {
        // prettier-ignore
        const bytes = new Uint8Array([
            0, 1,
            1,
            0,
            14
        ]);
        parser.bytes = bytes;
        const charStringsIndex = parser.parseIndex(0).obj;
        const result = parser.parseCharStrings({
            charStrings: charStringsIndex,
            privateDict: privateDictStub,
        });
        console.assert(result.charStrings.count === 1);
        console.assert(result.charStrings.get(0)[0] === 14);
        console.assert(result.seacs.length === 0);
    }
    afterEach();
    console.log("it parses predefined charsets...");
    beforeEach();
    {
        const charset = parser.parseCharsets(0, 0, null, true);
        console.assert(charset.predefined);
    }
    afterEach();
    console.log("it parses charset format 0...");
    beforeEach();
    {
        // The first three bytes make the offset large enough to skip predefined.
        // prettier-ignore
        const bytes = new Uint8Array([
            0x00, 0x00, 0x00,
            0x00,
            0x00, 0x02 // sid/cid
        ]);
        parser.bytes = bytes;
        let charset = parser.parseCharsets(3, 2, new CFFStrings(), false);
        console.assert(charset.charset[1] === "exclam");
        // CID font
        charset = parser.parseCharsets(3, 2, new CFFStrings(), true);
        console.assert(+charset.charset[1] === 2);
    }
    afterEach();
    console.log("it parses charset format 1...");
    beforeEach();
    {
        // The first three bytes make the offset large enough to skip predefined.
        // prettier-ignore
        const bytes = new Uint8Array([
            0x00, 0x00, 0x00,
            0x01,
            0x00, 0x08,
            0x01 // sid/cid left
        ]);
        parser.bytes = bytes;
        let charset = parser.parseCharsets(3, 2, new CFFStrings(), false);
        console.assert(charset.charset.eq([".notdef", "quoteright", "parenleft"]));
        // CID font
        charset = parser.parseCharsets(3, 2, new CFFStrings(), true);
        console.assert(charset.charset.eq([0, 8, 9]));
    }
    afterEach();
    console.log("it parses charset format 2...");
    beforeEach();
    {
        // format 2 is the same as format 1 but the left is card16
        // The first three bytes make the offset large enough to skip predefined.
        // prettier-ignore
        const bytes = new Uint8Array([
            0x00, 0x00, 0x00,
            0x02,
            0x00, 0x08,
            0x00, 0x01 // sid/cid left
        ]);
        parser.bytes = bytes;
        let charset = parser.parseCharsets(3, 2, new CFFStrings(), false);
        console.assert(charset.charset.eq([".notdef", "quoteright", "parenleft"]));
        // CID font
        charset = parser.parseCharsets(3, 2, new CFFStrings(), true);
        console.assert(charset.charset.eq([0, 8, 9]));
    }
    afterEach();
    console.log("it parses encoding format 0...");
    beforeEach();
    {
        // The first two bytes make the offset large enough to skip predefined.
        // prettier-ignore
        const bytes = new Uint8Array([
            0x00, 0x00,
            0x00,
            0x01,
            0x08 // start
        ]);
        parser.bytes = bytes;
        const encoding = parser.parseEncoding(2, {}, new CFFStrings(), null);
        console.assert(eq(encoding.encoding, createWithNullProto({ 0x8: 1 })));
    }
    afterEach();
    console.log("it parses encoding format 1...");
    beforeEach();
    {
        // The first two bytes make the offset large enough to skip predefined.
        // prettier-ignore
        const bytes = new Uint8Array([
            0x00, 0x00,
            0x01,
            0x01,
            0x07,
            0x01 // range2 left
        ]);
        parser.bytes = bytes;
        const encoding = parser.parseEncoding(2, {}, new CFFStrings(), null);
        console.assert(eq(encoding.encoding, createWithNullProto({ 0x7: 0x01, 0x08: 0x02 })));
    }
    afterEach();
    console.log("it parses fdselect format 0...");
    beforeEach();
    {
        // prettier-ignore
        const bytes = new Uint8Array([
            0x00,
            0x00,
            0x01 // gid: 1 fd: 1
        ]);
        parser.bytes = bytes.slice();
        const fdSelect = parser.parseFDSelect(0, 2);
        console.assert(fdSelect.fdSelect.eq([0, 1]));
        console.assert(fdSelect.format === 0);
    }
    afterEach();
    console.log("it parses fdselect format 3...");
    beforeEach();
    {
        // prettier-ignore
        const bytes = new Uint8Array([
            0x03,
            0x00, 0x02,
            0x00, 0x00,
            0x09,
            0x00, 0x02,
            0x0a,
            0x00, 0x04 // sentinel (last gid)
        ]);
        parser.bytes = bytes.slice();
        const fdSelect = parser.parseFDSelect(0, 4);
        console.assert(fdSelect.fdSelect.eq([9, 9, 0xa, 0xa]));
        console.assert(fdSelect.format === 3);
    }
    afterEach();
    console.log("it parses invalid fdselect format 3 (bug 1146106)...");
    beforeEach();
    {
        // prettier-ignore
        const bytes = new Uint8Array([
            0x03,
            0x00, 0x02,
            0x00, 0x01,
            0x09,
            0x00, 0x02,
            0x0a,
            0x00, 0x04 // sentinel (last gid)
        ]);
        parser.bytes = bytes.slice();
        const fdSelect = parser.parseFDSelect(0, 4);
        console.assert(fdSelect.fdSelect.eq([9, 9, 0xa, 0xa]));
        console.assert(fdSelect.format === 3);
    }
    afterEach();
    // TODO fdArray
    fontData = undefined;
}
console.log("%c>>>>>>> test CFFCompiler >>>>>>>", `color:${css_1}`);
{
    function testParser(bytes) {
        const bytes_1 = new Uint8Array(bytes);
        return new CFFParser({
            getBytes: () => {
                return bytes_1;
            },
        }, {}, SEAC_ANALYSIS_ENABLED);
    }
    console.log("it encodes integers...");
    {
        const c = new CFFCompiler(0);
        // all the examples from the spec
        console.assert(c.encodeInteger(0).eq([0x8b]));
        console.assert(c.encodeInteger(100).eq([0xef]));
        console.assert(c.encodeInteger(-100).eq([0x27]));
        console.assert(c.encodeInteger(1000).eq([0xfa, 0x7c]));
        console.assert(c.encodeInteger(-1000).eq([0xfe, 0x7c]));
        console.assert(c.encodeInteger(10000).eq([0x1c, 0x27, 0x10]));
        console.assert(c.encodeInteger(-10000).eq([0x1c, 0xd8, 0xf0]));
        console.assert(c.encodeInteger(100000).eq([0x1d, 0x00, 0x01, 0x86, 0xa0]));
        console.assert(c.encodeInteger(-100000).eq([0x1d, 0xff, 0xfe, 0x79, 0x60]));
    }
    console.log("it encodes floats...");
    {
        const c = new CFFCompiler(0);
        console.assert(c.encodeFloat(-2.25).eq([0x1e, 0xe2, 0xa2, 0x5f]));
        console.assert(c.encodeFloat(5e-11).eq([0x1e, 0x5c, 0x11, 0xff]));
    }
    console.log("it sanitizes name index...");
    {
        const c = new CFFCompiler(0);
        let nameIndexCompiled = c.compileNameIndex(["[a"]);
        let parser = testParser(nameIndexCompiled);
        let nameIndex = parser.parseIndex(0);
        let names = parser.parseNameIndex(nameIndex.obj);
        console.assert(names.eq(["_a"]));
        let longName = "";
        for (let i = 0; i < 129; i++) {
            longName += "_";
        }
        nameIndexCompiled = c.compileNameIndex([longName]);
        parser = testParser(nameIndexCompiled);
        nameIndex = parser.parseIndex(0);
        names = parser.parseNameIndex(nameIndex.obj);
        console.assert(names[0].length === 127);
    }
    console.log("it compiles fdselect format 0...");
    {
        const fdSelect = new CFFFDSelect(0, [3, 2, 1]);
        const c = new CFFCompiler(0);
        const out = c.compileFDSelect(fdSelect);
        console.assert(out.eq([
            0,
            3,
            2,
            1, // gid: 2 fd 3
        ]));
    }
    console.log("it compiles fdselect format 3...");
    {
        const fdSelect = new CFFFDSelect(3, [0, 0, 1, 1]);
        const c = new CFFCompiler(0);
        const out = c.compileFDSelect(fdSelect);
        console.assert(out.eq([
            3,
            0,
            2,
            0,
            0,
            0,
            0,
            2,
            1,
            0,
            4, // sentinel (low)
        ]));
    }
    console.log("it compiles fdselect format 3, single range...");
    {
        const fdSelect = new CFFFDSelect(3, [0, 0]);
        const c = new CFFCompiler(0);
        const out = c.compileFDSelect(fdSelect);
        console.assert(out.eq([
            3,
            0,
            1,
            0,
            0,
            0,
            0,
            2, // sentinel (low)
        ]));
    }
    console.log("it compiles charset of CID font...");
    {
        const charset = new CFFCharset(0, 1, 2);
        const c = new CFFCompiler(0);
        const numGlyphs = 7;
        const out = c.compileCharset(charset, numGlyphs, new CFFStrings(), true);
        // All CID charsets get turned into a simple format 2.
        console.assert(out.eq([
            2,
            0,
            0,
            0,
            numGlyphs - 1, // nLeft (low)
        ]));
    }
    console.log("it compiles charset of non CID font...");
    {
        const charset = new CFFCharset(false, 0, ["space", "exclam"]);
        const c = new CFFCompiler(0);
        const numGlyphs = 3;
        const out = c.compileCharset(charset, numGlyphs, new CFFStrings(), false);
        // All non-CID fonts use a format 0 charset.
        console.assert(out.eq([
            0,
            0,
            1,
            0,
            2, // sid of 'exclam' (low)
        ]));
    }
    // TODO a lot more compiler tests
}
/*81---------------------------------------------------------------------------*/
console.log(`%cpdf/pdf.ts-src/core/cff_parser_test: ${(performance.now() - strttime).toFixed(2)} ms`, `color:${css_2}`);
globalThis.ntestfile = globalThis.ntestfile ? globalThis.ntestfile + 1 : 1;
//# sourceMappingURL=cff_parser_test.js.map