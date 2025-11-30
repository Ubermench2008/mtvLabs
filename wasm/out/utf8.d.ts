export interface UTF8 {
    encode(text: string): Uint8Array;
    decode(buf: ArrayBufferView | ArrayLike<number>): string;
}
export declare const utf8: UTF8;
