export declare class ExportWrapper implements Record<string, Function> {
    #private;
    constructor(exports: WebAssembly.Exports);
    [x: string]: Function;
}
export declare function parseAndCompile(name: string, source: string): Promise<Record<string, Function>>;
export * from './compiler';
