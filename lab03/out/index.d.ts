import { MatchResult } from "ohm-js";
export declare const arithGrammar: import("./arith.ohm-bundle").ArithmeticGrammar;
export { ArithmeticActionDict, ArithmeticSemantics } from './arith.ohm-bundle';
export declare function evaluate(content: string, params?: {
    [name: string]: number;
}): number;
export declare class SyntaxError extends Error {
}
export declare function parse(content: string): MatchResult;
