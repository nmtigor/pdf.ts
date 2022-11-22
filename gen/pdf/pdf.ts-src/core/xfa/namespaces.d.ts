export declare const $buildXFAObject: unique symbol;
type NsIds = typeof NamespaceIds;
export type XFANsName = keyof NsIds;
export type XFANsId = NsIds[XFANsName]["id"] | -1;
export declare const NamespaceIds: {
    readonly config: {
        readonly id: 0;
        readonly check: (ns: string) => boolean;
    };
    readonly connectionSet: {
        readonly id: 1;
        readonly check: (ns: string) => boolean;
    };
    readonly datasets: {
        readonly id: 2;
        readonly check: (ns: string) => boolean;
    };
    readonly form: {
        readonly id: 3;
        readonly check: (ns: string) => boolean;
    };
    readonly localeSet: {
        readonly id: 4;
        readonly check: (ns: string) => boolean;
    };
    readonly pdf: {
        readonly id: 5;
        readonly check: (ns: string) => boolean;
    };
    readonly signature: {
        readonly id: 6;
        readonly check: (ns: string) => boolean;
    };
    readonly sourceSet: {
        readonly id: 7;
        readonly check: (ns: string) => boolean;
    };
    readonly stylesheet: {
        readonly id: 8;
        readonly check: (ns: string) => boolean;
    };
    readonly template: {
        readonly id: 9;
        readonly check: (ns: string) => boolean;
    };
    readonly xdc: {
        readonly id: 10;
        readonly check: (ns: string) => boolean;
    };
    readonly xdp: {
        readonly id: 11;
        readonly check: (ns: string) => boolean;
    };
    readonly xfdf: {
        readonly id: 12;
        readonly check: (ns: string) => boolean;
    };
    readonly xhtml: {
        readonly id: 13;
        readonly check: (ns: string) => boolean;
    };
    readonly xmpmeta: {
        readonly id: 14;
        readonly check: (ns: string) => boolean;
    };
};
export {};
//# sourceMappingURL=namespaces.d.ts.map