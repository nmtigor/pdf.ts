import { Dict, Name } from "./primitives.js";
import { DecryptStream } from "./decrypt_stream.js";
import { BaseStream } from "./base_stream.js";
export declare class ARCFourCipher {
    a: number;
    b: number;
    s: Uint8Array;
    constructor(key: Uint8Array);
    encryptBlock(data: Uint8Array | Uint8ClampedArray): Uint8Array;
}
export interface ARCFourCipher {
    decryptBlock(data: Uint8Array | Uint8ClampedArray): Uint8Array;
    encrypt(data: Uint8Array): Uint8Array;
}
declare namespace Ns_calculateMD5 {
    function hash(data: Uint8Array, offset?: number, length?: number): Uint8Array;
}
export import calculateMD5 = Ns_calculateMD5.hash;
declare namespace Ns_calculateSHA256 {
    function hash(data: Uint8Array, offset: number, length: number): Uint8Array;
}
export import calculateSHA256 = Ns_calculateSHA256.hash;
declare namespace Ns_calculateSHA512 {
    function hash(data: Uint8Array, offset: number, length: number, mode384?: boolean): Uint8Array;
}
export import calculateSHA512 = Ns_calculateSHA512.hash;
export declare function calculateSHA384(data: Uint8Array, offset: number, length: number): Uint8Array;
declare class NullCipher {
    decryptBlock(data: Uint8Array | Uint8ClampedArray): Uint8Array | Uint8ClampedArray;
    encrypt(data: Uint8Array): Uint8Array;
}
declare abstract class AESBaseCipher {
    #private;
    protected _s: Uint8Array;
    buffer: Uint8Array;
    bufferLength?: number;
    bufferPosition: number;
    protected _keySize: number;
    protected _cyclesOfRepetition: number;
    protected _key: Uint8Array;
    constructor();
    protected abstract _expandKey(cipherKey: ArrayLike<number>): Uint8Array;
    decryptBlock: (data: Uint8Array | Uint8ClampedArray, finalize: boolean, iv?: Uint8Array | null) => Uint8Array | Uint8ClampedArray;
    encrypt(data: Uint8Array, iv?: Uint8Array): Uint8Array;
}
export declare class AES128Cipher extends AESBaseCipher {
    _rcon: Uint8Array;
    constructor(key: ArrayLike<number>);
    /** @override */
    protected _expandKey(cipherKey: ArrayLike<number>): Uint8Array;
}
export declare class AES256Cipher extends AESBaseCipher {
    constructor(key: ArrayLike<number>);
    /** @override */
    protected _expandKey(cipherKey: ArrayLike<number>): Uint8Array;
}
/** @final */
export declare class PDF17 {
    checkOwnerPassword(password: Uint8Array, ownerValidationSalt: Uint8Array, userBytes: Uint8Array, ownerPassword: Uint8Array): boolean;
    checkUserPassword(password: Uint8Array, userValidationSalt: Uint8Array, userPassword: Uint8Array): boolean;
    getOwnerKey(password: Uint8Array, ownerKeySalt: Uint8Array, userBytes: Uint8Array, ownerEncryption: Uint8Array): Uint8Array | Uint8ClampedArray;
    getUserKey(password: Uint8Array, userKeySalt: Uint8Array, userEncryption: Uint8Array): Uint8Array | Uint8ClampedArray;
}
declare namespace NsPDF20 {
    /** @final */
    class PDF20 {
        hash(password: Uint8Array, concatBytes: Uint8Array, userBytes: Uint8Array): Uint8Array;
        checkOwnerPassword(password: Uint8Array, ownerValidationSalt: Uint8Array, userBytes: Uint8Array, ownerPassword: Uint8Array): boolean;
        checkUserPassword(password: Uint8Array, userValidationSalt: Uint8Array, userPassword: Uint8Array): boolean;
        getOwnerKey(password: Uint8Array, ownerKeySalt: Uint8Array, userBytes: Uint8Array, ownerEncryption: Uint8Array): Uint8Array | Uint8ClampedArray;
        getUserKey(password: Uint8Array, userKeySalt: Uint8Array, userEncryption: Uint8Array): Uint8Array | Uint8ClampedArray;
    }
}
export import PDF20 = NsPDF20.PDF20;
export declare class CipherTransform {
    StringCipherConstructor: (() => NullCipher) | (() => AES128Cipher) | (() => AES256Cipher);
    StreamCipherConstructor: (() => NullCipher) | (() => AES128Cipher) | (() => AES256Cipher);
    constructor(StringCipherConstructor: (() => NullCipher) | (() => AES128Cipher) | (() => AES256Cipher), StreamCipherConstructor: (() => NullCipher) | (() => AES128Cipher) | (() => AES256Cipher));
    createStream(stream: BaseStream, length: number): DecryptStream;
    decryptString(s: string): string;
    encryptString(s: string): string;
}
declare namespace NsCipherTransformFactory {
    /** @final */
    class CipherTransformFactory {
        filterName: string;
        dict: Dict;
        algorithm: number;
        encryptMetadata: boolean;
        encryptionKey: Uint8Array | Uint8ClampedArray;
        cf: any;
        stmf: Name;
        strf: Name;
        eff: Name;
        constructor(dict: Dict, fileId: string, password?: string);
        createCipherTransform(num: number, gen: number): CipherTransform;
    }
}
export import CipherTransformFactory = NsCipherTransformFactory.CipherTransformFactory;
export {};
//# sourceMappingURL=crypto.d.ts.map