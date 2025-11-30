import type { IterationNode, NonterminalNode } from "ohm-js";
import { ReversePolishNotationActionDict } from "./rpn.ohm-bundle";

type ItemNode = NonterminalNode & { ctorName: string };

const asItems = (items: IterationNode): ItemNode[] =>
  items.children as unknown as ItemNode[];

const popOperand = (stack: number[]): number => {
  const value = stack.pop();
  if (value === undefined) {
    throw new Error("Operand stack underflow");
  }
  return value;
};

export const rpnCalc = {
  Start(_leading, items, _trailing) {
    const stack: number[] = [];
    for (const item of asItems(items)) {
      const token = item.sourceString.trim();
      if (token === "+") {
        const right = popOperand(stack);
        const left = popOperand(stack);
        stack.push(left + right);
        continue;
      }

      if (token === "*") {
        const right = popOperand(stack);
        const left = popOperand(stack);
        stack.push(left * right);
        continue;
      }

      const raw = Number.parseInt(token, 10);
      if (Number.isNaN(raw)) {
        throw new Error(`Invalid token: ${token}`);
      }
      stack.push(raw);
    }

    if (stack.length !== 1) {
      throw new Error("Operand stack did not resolve to a single value");
    }

    return stack[0];
  },

  number(_digits) {
    const value = Number.parseInt(this.sourceString, 10);
    if (Number.isNaN(value)) {
      throw new Error("Invalid number literal");
    }
    return value;
  },

  _(_spaces) {
    return 0;
  },
} satisfies ReversePolishNotationActionDict<number>;
