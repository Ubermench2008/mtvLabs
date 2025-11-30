import type { IterationNode, NonterminalNode } from "ohm-js";
export declare const rpnCalc: {
    Start(this: NonterminalNode, _leading: NonterminalNode, items: IterationNode, _trailing: NonterminalNode): number;
    number(this: NonterminalNode, _digits: IterationNode): number;
    _(this: NonterminalNode, _spaces: IterationNode): number;
};
