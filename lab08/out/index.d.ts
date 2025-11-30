export declare class FunnyError extends Error {
    readonly code: string;
    readonly startLine?: number | undefined;
    readonly startCol?: number | undefined;
    readonly endCol?: number | undefined;
    readonly endLine?: number | undefined;
    constructor(message: string, code: string, startLine?: number | undefined, startCol?: number | undefined, endCol?: number | undefined, endLine?: number | undefined);
}
export * from './parser';
export * from './funny';
