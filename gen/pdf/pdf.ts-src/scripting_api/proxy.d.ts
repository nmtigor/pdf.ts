import { PDFObject, SendData } from "./pdf_object.js";
declare type _Obj = PDFObject<SendData>;
export declare class ScriptingProxyHandler implements ProxyHandler<_Obj> {
    /**
     * Don't dispatch an event for those properties.
     *  - delay: allow to delay field redraw until delay is set to false.
     *    Likely it's useless to implement that stuff.
     */
    nosend: Set<string>;
    get(obj: _Obj, prop: keyof _Obj): any;
    set(obj: _Obj, prop: keyof _Obj, value: _Obj[keyof _Obj]): boolean;
    has(obj: _Obj, prop: keyof _Obj): boolean;
    getPrototypeOf(obj: _Obj): null;
    setPrototypeOf(obj: _Obj, proto: null): boolean;
    isExtensible(obj: _Obj): boolean;
    preventExtensions(obj: _Obj): boolean;
    getOwnPropertyDescriptor(obj: _Obj, prop: keyof _Obj): {
        configurable: boolean;
        enumerable: boolean;
        value: any;
    } | undefined;
    defineProperty(obj: _Obj, key: keyof _Obj, descriptor: PropertyDescriptor): boolean;
    deleteProperty(obj: _Obj, prop: keyof _Obj): boolean;
    ownKeys(obj: _Obj): (string | symbol)[];
}
export {};
//# sourceMappingURL=proxy.d.ts.map