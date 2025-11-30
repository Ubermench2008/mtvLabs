import { Expr } from "../../lab04";
import { Fn } from "./emitHelper";
export declare function parseCompileAndExecute(expression: string, ...args: number[]): Promise<number>;
export declare function compileAndExecute(expr: Expr, variables: string[], ...args: number[]): Promise<number>;
export declare const compile: (expr: Expr, variables: string[]) => Promise<Fn<number>>;
export declare const checked: <R>(func: Fn<R>) => Fn<R>;
export { buildFunction, getVariables } from "./compiler";
