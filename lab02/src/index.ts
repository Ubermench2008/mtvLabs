import grammar from "./rpn.ohm-bundle";
import { rpnSemantics } from "./semantics";

export function evaluate(source: string): number {
  const m = grammar.match(source);
  if (m.failed()) throw new SyntaxError("Invalid RPN: parse failed");
  try {
    return rpnSemantics(m).calculate();
  } catch {
    throw new SyntaxError("Invalid RPN: evaluation failed");
  }
}

export function maxStackDepth(source: string): number {
  const m = grammar.match(source);
  if (m.failed()) throw new SyntaxError("Invalid RPN: parse failed");
  const sd = rpnSemantics(m).stackDepth;
  if (sd.out !== 1 || sd.max < 1 || sd.need > 0) {
    throw new SyntaxError("Invalid RPN: stack shape");
  }
  return sd.max;
}

export class SyntaxError extends Error {}
