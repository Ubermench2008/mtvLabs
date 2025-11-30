import type { IterationNode, NonterminalNode } from "ohm-js";
export type StackDepth = {
    max: number;
    out: number;
    need: number;
};
export declare const rpnStackDepth: {
    Start(this: NonterminalNode, _leading: NonterminalNode, items: IterationNode, _trailing: NonterminalNode): StackDepth;
    number(this: NonterminalNode, _digits: IterationNode): StackDepth;
    _(this: NonterminalNode, _spaces: IterationNode): {
        max: number;
        out: number;
        need: number;
    };
};
