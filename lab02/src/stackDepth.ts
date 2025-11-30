import type { IterationNode, NonterminalNode } from "ohm-js";
import { ReversePolishNotationActionDict } from "./rpn.ohm-bundle";

export type StackDepth = { max: number; out: number; need: number };

type ItemNode = NonterminalNode & { ctorName: string };

const asItems = (items: IterationNode): ItemNode[] =>
  items.children as unknown as ItemNode[];

const combineDepth = (left: StackDepth, right: StackDepth): StackDepth => ({
  need: Math.max(left.need, right.need - left.out),
  out: left.out + right.out,
  max: Math.max(left.max, left.out + right.max),
});

const numberEffect: StackDepth = { max: 1, out: 1, need: 0 };
const operatorEffect: StackDepth = { max: 0, out: -1, need: 2 };

const numberEffectFor = (token: string): StackDepth => {
  if (!/^\d+$/u.test(token)) {
    throw new Error(`Invalid token: ${token}`);
  }
  return numberEffect;
};

export const rpnStackDepth = {
  Start(_leading, items, _trailing) {
    let total: StackDepth | undefined;

    for (const item of asItems(items)) {
      const token = item.sourceString.trim();
      const effect =
        token === "+" || token === "*" ? operatorEffect : numberEffectFor(token);

      total = total ? combineDepth(total, effect) : effect;
    }

    if (!total) {
      throw new Error("Empty expression has no stack depth");
    }

    return total;
  },

  number(_digits) {
    return numberEffect;
  },

  _(_spaces) {
    return { max: 0, out: 0, need: 0 };
  },
} satisfies ReversePolishNotationActionDict<StackDepth>;
