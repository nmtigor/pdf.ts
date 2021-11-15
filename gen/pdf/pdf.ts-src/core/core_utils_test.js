/*81*****************************************************************************
 * core_utils_test
** --------------- */
import "../../../lib/jslang.js";
import { css_1, css_2 } from "../../../test/alias.js";
import { encodeToXmlString, escapePDFName, getInheritableProperty, isWhiteSpace, log2, parseXFAPath, toRomanNumerals, validateCSSFont } from "./core_utils.js";
import { Dict, Ref } from "./primitives.js";
import { XRefMock } from "../../test_utils.js";
const strttime = performance.now();
/*81---------------------------------------------------------------------------*/
console.log("%c>>>>>>> test getInheritableProperty() >>>>>>>", `color:${css_1}`);
{
    console.log("it handles non-dictionary arguments...");
    {
        console.assert(getInheritableProperty({ dict: null, key: "foo" }) === undefined);
        console.assert(getInheritableProperty({ dict: undefined, key: "foo" }) === undefined);
    }
    console.log("it handles dictionaries that do not contain the property...");
    {
        // Empty dictionary.
        const emptyDict = new Dict();
        console.assert(getInheritableProperty({ dict: emptyDict, key: "foo" }) === undefined);
        // Filled dictionary with a different property.
        const filledDict = new Dict();
        filledDict.set("bar", "baz");
        console.assert(getInheritableProperty({ dict: filledDict, key: "foo" }) === undefined);
    }
    console.log("it fetches the property if it is not inherited...");
    {
        const ref = Ref.get(10, 0);
        const xref = new XRefMock([{ ref, data: "quux" }]);
        const dict = new Dict(xref);
        // Regular values should be fetched.
        dict.set("foo", "bar");
        console.assert(getInheritableProperty({ dict, key: "foo" }) === "bar");
        // Array value should be fetched (with references resolved).
        dict.set("baz", ["qux", ref]);
        console.assert(getInheritableProperty({ dict, key: "baz", getArray: true })
            .eq(["qux", "quux"]));
    }
    console.log("it fetches the property if it is inherited and present on one level...");
    {
        const ref = Ref.get(10, 0);
        const xref = new XRefMock([{ ref, data: "quux" }]);
        const firstDict = new Dict(xref);
        const secondDict = new Dict(xref);
        firstDict.set("Parent", secondDict);
        // Regular values should be fetched.
        secondDict.set("foo", "bar");
        console.assert(getInheritableProperty({ dict: firstDict, key: "foo" }) === "bar");
        // Array value should be fetched (with references resolved).
        secondDict.set("baz", ["qux", ref]);
        console.assert(getInheritableProperty({ dict: firstDict, key: "baz", getArray: true })
            .eq(["qux", "quux"]));
    }
    console.log("it fetches the property if it is inherited and present on multiple levels...");
    {
        const ref = Ref.get(10, 0);
        const xref = new XRefMock([{ ref, data: "quux" }]);
        const firstDict = new Dict(xref);
        const secondDict = new Dict(xref);
        firstDict.set("Parent", secondDict);
        // Regular values should be fetched.
        firstDict.set("foo", "bar1");
        secondDict.set("foo", "bar2");
        console.assert(getInheritableProperty({ dict: firstDict, key: "foo" }) === "bar1");
        console.assert(getInheritableProperty({
            dict: firstDict,
            key: "foo",
            getArray: false,
            stopWhenFound: false,
        }).eq(["bar1", "bar2"]));
        // Array value should be fetched (with references resolved).
        firstDict.set("baz", ["qux1", ref]);
        secondDict.set("baz", ["qux2", ref]);
        console.assert(getInheritableProperty({
            dict: firstDict,
            key: "baz",
            getArray: true,
            stopWhenFound: false,
        }).eq([
            ["qux1", "quux"],
            ["qux2", "quux"],
        ]));
    }
}
console.log("%c>>>>>>> test toRomanNumerals() >>>>>>>", `color:${css_1}`);
{
    console.log("it handles invalid arguments...");
    {
        for (const input of ["foo", -1, 0]) {
            try {
                toRomanNumerals(input);
                console.assert(!!0, "Should throw but not.");
            }
            catch (e) {
                console.assert(e.toString() ===
                    "Error: The number should be a positive integer. (core_utils.js)");
            }
        }
    }
    console.log("it converts numbers to uppercase Roman numerals...");
    {
        console.assert(toRomanNumerals(1) === "I");
        console.assert(toRomanNumerals(6) === "VI");
        console.assert(toRomanNumerals(7) === "VII");
        console.assert(toRomanNumerals(8) === "VIII");
        console.assert(toRomanNumerals(10) === "X");
        console.assert(toRomanNumerals(40) === "XL");
        console.assert(toRomanNumerals(100) === "C");
        console.assert(toRomanNumerals(500) === "D");
        console.assert(toRomanNumerals(1000) === "M");
        console.assert(toRomanNumerals(2019) === "MMXIX");
    }
    console.log("it converts numbers to lowercase Roman numerals...");
    {
        console.assert(toRomanNumerals(1, /* lowercase = */ true) === "i");
        console.assert(toRomanNumerals(6, /* lowercase = */ true) === "vi");
        console.assert(toRomanNumerals(7, /* lowercase = */ true) === "vii");
        console.assert(toRomanNumerals(8, /* lowercase = */ true) === "viii");
        console.assert(toRomanNumerals(10, /* lowercase = */ true) === "x");
        console.assert(toRomanNumerals(40, /* lowercase = */ true) === "xl");
        console.assert(toRomanNumerals(100, /* lowercase = */ true) === "c");
        console.assert(toRomanNumerals(500, /* lowercase = */ true) === "d");
        console.assert(toRomanNumerals(1000, /* lowercase = */ true) === "m");
        console.assert(toRomanNumerals(2019, /* lowercase = */ true) === "mmxix");
    }
}
console.log("%c>>>>>>> test log2() >>>>>>>", `color:${css_1}`);
{
    console.log("it handles values smaller than/equal to zero...");
    {
        console.assert(log2(0) === 0);
        console.assert(log2(-1) === 0);
    }
    console.log(("it handles values larger than zero..."));
    {
        console.assert(log2(1) === 0);
        console.assert(log2(2) === 1);
        console.assert(log2(3) === 2);
        console.assert(log2(3.14) === 2);
    }
}
console.log("%c>>>>>>> test isWhiteSpace() >>>>>>>", `color:${css_1}`);
{
    console.log("it handles space characters...");
    {
        console.assert(isWhiteSpace(0x20));
        console.assert(isWhiteSpace(0x09));
        console.assert(isWhiteSpace(0x0d));
        console.assert(isWhiteSpace(0x0a));
    }
    console.log("it handles non-space characters...");
    {
        console.assert(isWhiteSpace(0x0b) === false);
        console.assert(isWhiteSpace(null) === false);
        console.assert(isWhiteSpace(undefined) === false);
    }
}
console.log("%c>>>>>>> test parseXFAPath() >>>>>>>", `color:${css_1}`);
{
    console.log("it should get a correctly parsed path...");
    {
        const path = "foo.bar[12].oof[3].rab.FOO[123].BAR[456]";
        console.assert(parseXFAPath(path).eq([
            { name: "foo", pos: 0 },
            { name: "bar", pos: 12 },
            { name: "oof", pos: 3 },
            { name: "rab", pos: 0 },
            { name: "FOO", pos: 123 },
            { name: "BAR", pos: 456 },
        ]));
    }
}
console.log("%c>>>>>>> test escapePDFName() >>>>>>>", `color:${css_1}`);
{
    console.log("it should escape PDF name...");
    {
        console.assert(escapePDFName("hello") === "hello");
        console.assert(escapePDFName("\xfehello") === "#fehello");
        console.assert(escapePDFName("he\xfell\xffo") === "he#fell#ffo");
        console.assert(escapePDFName("\xfehe\xfell\xffo\xff") === "#fehe#fell#ffo#ff");
        console.assert(escapePDFName("#h#e#l#l#o") === "#23h#23e#23l#23l#23o");
        console.assert(escapePDFName("#()<>[]{}/%") === "#23#28#29#3c#3e#5b#5d#7b#7d#2f#25");
    }
}
console.log("%c>>>>>>> test encodeToXmlString() >>>>>>>", `color:${css_1}`);
{
    console.log("it should get a correctly encoded string with some entities...");
    {
        const str = "\"\u0397ell😂' & <W😂rld>";
        console.assert(encodeToXmlString(str) ===
            "&quot;&#x397;ell&#x1F602;&apos; &amp; &lt;W&#x1F602;rld&gt;");
    }
    console.log("it should get a correctly encoded basic ascii string...");
    {
        const str = "hello world";
        console.assert(encodeToXmlString(str) == str);
    }
}
console.log("%c>>>>>>> test validateCSSFont() >>>>>>>", `color:${css_1}`);
{
    console.log("it check font family...");
    {
        const cssFontInfo = {
            fontFamily: `"blah blah " blah blah"`,
            fontWeight: 0,
            italicAngle: 0,
        };
        console.assert(validateCSSFont(cssFontInfo) === false);
        cssFontInfo.fontFamily = `"blah blah \\" blah blah"`;
        console.assert(validateCSSFont(cssFontInfo) === true);
        cssFontInfo.fontFamily = `'blah blah ' blah blah'`;
        console.assert(validateCSSFont(cssFontInfo) === false);
        cssFontInfo.fontFamily = `'blah blah \\' blah blah'`;
        console.assert(validateCSSFont(cssFontInfo) === true);
        cssFontInfo.fontFamily = `"blah blah `;
        console.assert(validateCSSFont(cssFontInfo) === false);
        cssFontInfo.fontFamily = `blah blah"`;
        console.assert(validateCSSFont(cssFontInfo) === false);
        cssFontInfo.fontFamily = `'blah blah `;
        console.assert(validateCSSFont(cssFontInfo) === false);
        cssFontInfo.fontFamily = `blah blah'`;
        console.assert(validateCSSFont(cssFontInfo) === false);
        cssFontInfo.fontFamily = "blah blah blah";
        console.assert(validateCSSFont(cssFontInfo) === true);
        cssFontInfo.fontFamily = "blah 0blah blah";
        console.assert(validateCSSFont(cssFontInfo) === false);
        cssFontInfo.fontFamily = "blah blah -0blah";
        console.assert(validateCSSFont(cssFontInfo) === false);
        cssFontInfo.fontFamily = "blah blah --blah";
        console.assert(validateCSSFont(cssFontInfo) === false);
        cssFontInfo.fontFamily = "blah blah -blah";
        console.assert(validateCSSFont(cssFontInfo) === true);
        cssFontInfo.fontFamily = "blah fdqAJqjHJK23kl23__--Kj blah";
        console.assert(validateCSSFont(cssFontInfo) === true);
        cssFontInfo.fontFamily = "blah fdqAJqjH$JK23kl23__--Kj blah";
        console.assert(validateCSSFont(cssFontInfo) === false);
    }
    console.log("it check font weight...");
    {
        const cssFontInfo = {
            fontFamily: "blah",
            fontWeight: 100,
            italicAngle: 0,
        };
        validateCSSFont(cssFontInfo);
        console.assert(cssFontInfo.fontWeight === "100");
        cssFontInfo.fontWeight = "700";
        validateCSSFont(cssFontInfo);
        console.assert(cssFontInfo.fontWeight === "700");
        cssFontInfo.fontWeight = "normal";
        validateCSSFont(cssFontInfo);
        console.assert(cssFontInfo.fontWeight === "normal");
        cssFontInfo.fontWeight = 314;
        validateCSSFont(cssFontInfo);
        console.assert(cssFontInfo.fontWeight === "400");
    }
    console.log("it check italic angle...");
    {
        const cssFontInfo = {
            fontFamily: "blah",
            fontWeight: 100,
            italicAngle: 10,
        };
        validateCSSFont(cssFontInfo);
        console.assert(cssFontInfo.italicAngle == "10");
        cssFontInfo.italicAngle = -123;
        validateCSSFont(cssFontInfo);
        console.assert(cssFontInfo.italicAngle == "14");
        cssFontInfo.italicAngle = "91";
        validateCSSFont(cssFontInfo);
        console.assert(cssFontInfo.italicAngle == "14");
        cssFontInfo.italicAngle = 2.718;
        validateCSSFont(cssFontInfo);
        console.assert(cssFontInfo.italicAngle == "2.718");
    }
}
/*81---------------------------------------------------------------------------*/
console.log(`%cpdf/pdf.ts-src/core/core_utils_test: ${(performance.now() - strttime).toFixed(2)} ms`, `color:${css_2}`);
globalThis.ntestfile = globalThis.ntestfile ? globalThis.ntestfile + 1 : 1;
//# sourceMappingURL=core_utils_test.js.map