import { MatchResult } from "ohm-js";
import { addMulSemantics } from "./calculate";
import grammar from "./addmul.ohm-bundle";

export function evaluate(content: string): number {
  return calculate(parse(content));
}

export class SyntaxError extends Error {}

function parse(content: string): MatchResult {
  const m = grammar.match(content, "Expr");
  if (m.failed()) {
    throw new SyntaxError("Syntax error");
  }
  return m;
}

function calculate(expression: MatchResult): number {
  return addMulSemantics(expression).calculate();
}
