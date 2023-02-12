import { PDFObject, SendData } from "./pdf_object.js";
type Obj_ = PDFObject<SendData>;
export declare class ScriptingProxyHandler implements ProxyHandler<Obj_> {
    /**
     * Don't dispatch an event for those properties.
     *  - delay: allow to delay field redraw until delay is set to false.
     *    Likely it's useless to implement that stuff.
     */
    nosend: Set<string>;
    get(obj: Obj_, prop: keyof Obj_): any;
    set(obj: Obj_, prop: keyof Obj_, value: Obj_[keyof Obj_]): boolean;
    has(obj: Obj_, prop: keyof Obj_): boolean;
    getPrototypeOf(obj: Obj_): null;
    setPrototypeOf(obj: Obj_, proto: null): boolean;
    isExtensible(obj: Obj_): boolean;
    preventExtensions(obj: Obj_): boolean;
    getOwnPropertyDescriptor(obj: Obj_, prop: keyof Obj_): {
        configurable: boolean;
        enumerable: boolean;
        value: any;
    } | undefined;
    defineProperty(obj: Obj_, key: keyof Obj_, descriptor: PropertyDescriptor): boolean;
    deleteProperty(obj: Obj_, prop: keyof Obj_): boolean;
    ownKeys(obj: Obj_): (string | symbol)[];
}
export {};
//# sourceMappingURL=proxy.d.ts.map