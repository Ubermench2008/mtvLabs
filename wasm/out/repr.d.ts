import { N } from './ast';
export type Writer = (s: string) => void;
export interface Options {
    readonly colors: boolean;
    readonly immSeparator: string;
    readonly detailedTypes?: boolean;
}
export declare function reprBuffer(buffer: ArrayBuffer, w: Writer, limit?: number, highlightRange?: number[], options?: Options): void;
export declare function repr(n: N, w: Writer, options?: Options): void;
export declare function BufferedWriter(): Writer;
export declare function strRepr(n: N, options?: Options): string;
export declare function strReprBuffer(buffer: ArrayBuffer, limit?: number, highlightRange?: number[], options?: Options): string;
