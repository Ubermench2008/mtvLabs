import { N } from "../../wasm";
export type Fn<R> = (...args: any[]) => R;
export declare function buildOneFunctionModule<R = number>(name: string, argCount: number, body: N[]): Promise<Fn<R>>;
