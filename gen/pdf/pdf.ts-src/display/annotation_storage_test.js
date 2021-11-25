/*81*****************************************************************************
 * annotation_storage_test
** ----------------------- */
import { css_1, css_2 } from "../../../test/alias.js";
import "../../../lib/jslang.js";
import { AnnotationStorage } from "./annotation_storage.js";
const strttime = performance.now();
/*81---------------------------------------------------------------------------*/
console.log("%c>>>>>>> test get or default value >>>>>>>", `color:${css_1}`);
{
    console.log("it should get and set a new value in the annotation storage...");
    {
        const annotationStorage = new AnnotationStorage();
        let value = annotationStorage.getValue("123A", {
            value: "hello world",
        }).value;
        console.assert(value === "hello world");
        annotationStorage.setValue("123A", {
            value: "hello world",
        });
        // the second argument is the default value to use
        // if the key isn't in the storage
        value = annotationStorage.getValue("123A", {
            value: "an other string",
        }).value;
        console.assert(value === "hello world");
    }
    console.log("it should get set values and default ones in the annotation storage...");
    {
        const annotationStorage = new AnnotationStorage();
        annotationStorage.setValue("123A", {
            value: "hello world",
            hello: "world",
        });
        const result = annotationStorage.getValue("123A", {
            value: "an other string",
            world: "hello",
        });
        console.assert(result.eq({
            value: "hello world",
            hello: "world",
            world: "hello",
        }));
    }
}
console.log("%c>>>>>>> test set value >>>>>>>", `color:${css_1}`);
{
    console.log("it should set a new value in the annotation storage...");
    {
        const annotationStorage = new AnnotationStorage();
        annotationStorage.setValue("123A", { value: "an other string" });
        const value = annotationStorage.getAll()["123A"].value;
        console.assert(value === "an other string");
    }
    console.log("it should call onSetModified() if value is changed...");
    {
        const annotationStorage = new AnnotationStorage();
        let called = false;
        const callback = () => { called = true; };
        annotationStorage.onSetModified = callback;
        annotationStorage.setValue("asdf", { value: "original" });
        console.assert(called === true);
        // changing value
        annotationStorage.setValue("asdf", { value: "modified" });
        console.assert(called === true);
        // not changing value
        called = false;
        annotationStorage.setValue("asdf", { value: "modified" });
        console.assert(called === false);
    }
}
console.log("%c>>>>>>> test reset modified >>>>>>>", `color:${css_1}`);
{
    console.log("it should call onResetModified() if set...");
    {
        const annotationStorage = new AnnotationStorage();
        let called = false;
        const callback = () => { called = true; };
        annotationStorage.onResetModified = callback;
        annotationStorage.setValue("asdf", { value: "original" });
        annotationStorage.resetModified();
        console.assert(called === true);
        called = false;
        // not changing value
        annotationStorage.setValue("asdf", { value: "original" });
        annotationStorage.resetModified();
        console.assert(called === false);
        // changing value
        annotationStorage.setValue("asdf", { value: "modified" });
        annotationStorage.resetModified();
        console.assert(called === true);
    }
}
/*81---------------------------------------------------------------------------*/
console.log(`%c:pdf/pdf.ts-src/display/annotation_storage_test ${(performance.now() - strttime).toFixed(2)} ms`, `color:${css_2}`);
globalThis.ntestfile = globalThis.ntestfile ? globalThis.ntestfile + 1 : 1;
//# sourceMappingURL=annotation_storage_test.js.map