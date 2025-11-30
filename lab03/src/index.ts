import {  MatchResult } from "ohm-js";
import grammar  from "./arith.ohm-bundle";
import { arithSemantics } from "./calculate";

export const arithGrammar = grammar;
export {ArithmeticActionDict, ArithmeticSemantics} from './arith.ohm-bundle';

export function evaluate(content: string, params?: {[name:string]:number}): number{
    return calculate(parse(content), params ?? {});
}
export class SyntaxError extends Error {}

export function parse(content: string): MatchResult{
    const match = grammar.match(content.trim());
    if (match.failed())
    {
        throw new SyntaxError("Syntax error");
    }
    return match;
}

function calculate(expression: MatchResult, params: {[name:string]: number}): number{
    return arithSemantics(expression).calculate(params);
}
