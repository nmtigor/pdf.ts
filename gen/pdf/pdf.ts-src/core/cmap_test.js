/*81*****************************************************************************
 * cmap_test
** --------- */
import { css_1, css_2 } from "../../../test/alias.js";
import { StringStream } from "./stream.js";
import { CMAP_PARAMS } from "../../test_utils.js";
import { DOMCMapReaderFactory } from "../display/display_utils.js";
import { CMap, CMapFactory, IdentityCMap } from "./cmap.js";
import { Name } from "./primitives.js";
const strttime = performance.now();
/*81---------------------------------------------------------------------------*/
console.log("%c>>>>>>> test cmap >>>>>>>", `color:${css_1}`);
{
    // Allow CMap testing in Node.js, e.g. for Travis.
    const CMapReaderFactory = new DOMCMapReaderFactory({
        baseUrl: CMAP_PARAMS.cMapUrl,
        isCompressed: CMAP_PARAMS.cMapPacked,
    });
    let fetchBuiltInCMap = function (name) {
        return CMapReaderFactory.fetch({
            name,
        });
    };
    console.log("it parses beginbfchar...");
    {
        // prettier-ignore
        const str = "2 beginbfchar\n" +
            "<03> <00>\n" +
            "<04> <01>\n" +
            "endbfchar\n";
        const stream = new StringStream(str);
        const cmap = await CMapFactory.create({ encoding: stream });
        console.assert(cmap.lookup(0x03) === String.fromCharCode(0x00));
        console.assert(cmap.lookup(0x04) === String.fromCharCode(0x01));
        console.assert(cmap.lookup(0x05) === undefined);
    }
    console.log("it parses beginbfrange with range...");
    {
        // prettier-ignore
        const str = "1 beginbfrange\n" +
            "<06> <0B> 0\n" +
            "endbfrange\n";
        const stream = new StringStream(str);
        const cmap = await CMapFactory.create({ encoding: stream });
        console.assert(cmap.lookup(0x05) === undefined);
        console.assert(cmap.lookup(0x06) === String.fromCharCode(0x00));
        console.assert(cmap.lookup(0x0b) === String.fromCharCode(0x05));
        console.assert(cmap.lookup(0x0c) === undefined);
    }
    console.log("it parses beginbfrange with array...");
    {
        // prettier-ignore
        const str = "1 beginbfrange\n" +
            "<0D> <12> [ 0 1 2 3 4 5 ]\n" +
            "endbfrange\n";
        const stream = new StringStream(str);
        const cmap = await CMapFactory.create({ encoding: stream });
        console.assert(cmap.lookup(0x0c) == undefined);
        console.assert(cmap.lookup(0x0d) === 0x00);
        console.assert(cmap.lookup(0x12) === 0x05);
        console.assert(cmap.lookup(0x13) == undefined);
    }
    console.log("it parses begincidchar...");
    {
        // prettier-ignore
        const str = "1 begincidchar\n" +
            "<14> 0\n" +
            "endcidchar\n";
        const stream = new StringStream(str);
        const cmap = await CMapFactory.create({ encoding: stream });
        console.assert(cmap.lookup(0x14) === 0x00);
        console.assert(cmap.lookup(0x15) === undefined);
    }
    console.log("it parses begincidrange...");
    {
        // prettier-ignore
        const str = "1 begincidrange\n" +
            "<0016> <001B>   0\n" +
            "endcidrange\n";
        const stream = new StringStream(str);
        const cmap = await CMapFactory.create({ encoding: stream });
        console.assert(cmap.lookup(0x15) === undefined);
        console.assert(cmap.lookup(0x16) === 0x00);
        console.assert(cmap.lookup(0x1b) === 0x05);
        console.assert(cmap.lookup(0x1c) === undefined);
    }
    console.log("it decodes codespace ranges...");
    {
        // prettier-ignore
        const str = "1 begincodespacerange\n" +
            "<01> <02>\n" +
            "<00000003> <00000004>\n" +
            "endcodespacerange\n";
        const stream = new StringStream(str);
        const cmap = await CMapFactory.create({ encoding: stream });
        const c = {};
        cmap.readCharCode(String.fromCharCode(1), 0, c);
        console.assert(c.charcode === 1);
        console.assert(c.length === 1);
        cmap.readCharCode(String.fromCharCode(0, 0, 0, 3), 0, c);
        console.assert(c.charcode === 3);
        console.assert(c.length === 4);
    }
    console.log("it decodes 4 byte codespace ranges...");
    {
        // prettier-ignore
        const str = "1 begincodespacerange\n" +
            "<8EA1A1A1> <8EA1FEFE>\n" +
            "endcodespacerange\n";
        const stream = new StringStream(str);
        const cmap = await CMapFactory.create({ encoding: stream });
        const c = {};
        cmap.readCharCode(String.fromCharCode(0x8e, 0xa1, 0xa1, 0xa1), 0, c);
        console.assert(c.charcode === 0x8ea1a1a1);
        console.assert(c.length === 4);
    }
    console.log("it read usecmap...");
    {
        const str = "/Adobe-Japan1-1 usecmap\n";
        const stream = new StringStream(str);
        const cmap = await CMapFactory.create({
            encoding: stream,
            fetchBuiltInCMap,
        });
        console.assert(cmap instanceof CMap);
        console.assert(cmap.useCMap !== undefined);
        console.assert(cmap.builtInCMap === false);
        console.assert(cmap.length === 0x20a7);
        console.assert(cmap.isIdentityCMap === false);
    }
    console.log("it parses cmapname...");
    {
        const str = "/CMapName /Identity-H def\n";
        const stream = new StringStream(str);
        const cmap = await CMapFactory.create({ encoding: stream });
        console.assert(cmap.name === "Identity-H");
    }
    console.log("it parses wmode...");
    {
        const str = "/WMode 1 def\n";
        const stream = new StringStream(str);
        const cmap = await CMapFactory.create({ encoding: stream });
        console.assert(cmap.vertical);
    }
    console.log("it loads built in cmap...");
    {
        const cmap = await CMapFactory.create({
            encoding: Name.get("Adobe-Japan1-1"),
            fetchBuiltInCMap,
        });
        console.assert(cmap instanceof CMap);
        console.assert(cmap.useCMap === undefined);
        console.assert(cmap.builtInCMap);
        console.assert(cmap.length === 0x20a7);
        console.assert(cmap.isIdentityCMap === false);
    }
    console.log("it loads built in identity cmap...");
    {
        const cmap = await CMapFactory.create({
            encoding: Name.get("Identity-H"),
            fetchBuiltInCMap,
        });
        console.assert(cmap instanceof IdentityCMap);
        console.assert(cmap.vertical === false);
        console.assert(cmap.length === 0x10000);
        try {
            cmap.isIdentityCMap;
            console.assert(!!0, "should not access .isIdentityCMap");
        }
        catch { }
    }
    console.log("it attempts to load a non-existent built-in CMap...");
    {
        try {
            await CMapFactory.create({
                encoding: Name.get("null"),
                fetchBuiltInCMap,
            });
            console.assert(!!0, "Shouldn't get here.");
        }
        catch (reason) {
            console.assert(reason instanceof Error);
            console.assert(reason.message === "Unknown CMap name: null");
        }
    }
    console.log("it attempts to load a built-in CMap without the necessary API parameters...");
    {
        function tmpFetchBuiltInCMap(name) {
            const CMapReaderFactory = new DOMCMapReaderFactory({});
            return CMapReaderFactory.fetch({ name });
        }
        try {
            await CMapFactory.create({
                encoding: Name.get("Adobe-Japan1-1"),
                fetchBuiltInCMap: tmpFetchBuiltInCMap,
            });
            console.assert(!!0, "Shouldn't get here.");
        }
        catch (reason) {
            console.assert(reason instanceof Error);
            console.assert(reason.message ===
                'The CMap "baseUrl" parameter must be specified, ensure that ' +
                    'the "cMapUrl" and "cMapPacked" API parameters are provided.');
        }
    }
    console.log("it attempts to load a built-in CMap with inconsistent API parameters...");
    {
        function tmpFetchBuiltInCMap(name) {
            const CMapReaderFactory = new DOMCMapReaderFactory({
                baseUrl: CMAP_PARAMS.cMapUrl,
                isCompressed: false,
            });
            return CMapReaderFactory.fetch({ name });
        }
        try {
            await CMapFactory.create({
                encoding: Name.get("Adobe-Japan1-1"),
                fetchBuiltInCMap: tmpFetchBuiltInCMap,
            });
            console.assert(!!0, "Shouldn't get here.");
        }
        catch (reason) {
            console.assert(reason instanceof Error);
            const message = reason.message;
            console.assert(message.startsWith("Unable to load CMap at: "));
            console.assert(message.endsWith("/res/pdf/pdf.ts-external/bcmaps/Adobe-Japan1-1"));
        }
    }
    fetchBuiltInCMap = undefined;
}
/*81---------------------------------------------------------------------------*/
console.log(`%cpdf/pdf.ts-src/core/cmap_test: ${(performance.now() - strttime).toFixed(2)} ms`, `color:${css_2}`);
globalThis.ntestfile = globalThis.ntestfile ? globalThis.ntestfile + 1 : 1;
//# sourceMappingURL=cmap_test.js.map