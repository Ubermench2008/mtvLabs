import { IterationNode, NonterminalNode } from "ohm-js";
import grammar, { ArithmeticActionDict, ArithmeticSemantics } from "./arith.ohm-bundle";

export const arithSemantics: ArithSemantics = grammar.createSemantics() as ArithSemantics;

type Params = Record<string, number>;

function evaluateChain(
    first: NonterminalNode,
    rest: IterationNode, //AdditiveTail* или Multiplicative*
    params: Params,
    apply: (lhs: number, op: string, rhs: number) => number, //+ - * /
    rhsIndex: number
): number {
    let acc = first.calculate(params);
    for (const chunk of rest.children as NonterminalNode[]) {
        const op = chunk.child(1).sourceString; //оператор
        const rhsNode = chunk.child(rhsIndex) as NonterminalNode;
        const rhs = rhsNode.calculate(params);
        acc = apply(acc, op, rhs);
    }
    return acc;
}

const arithCalc = {

    Additive(first, rest) {
        const params = this.args.params as Params;
        return evaluateChain(
            first,
            rest,
            params,
            (lhs, op, rhs) => (op === "+" ? lhs + rhs : lhs - rhs),
            3
        );
    },

    Multiplicative(first, rest) {
        const params = this.args.params as Params;
        return evaluateChain(
            first,
            rest,
            params,
            (lhs, op, rhs) => {
                if (op === "*") {
                    return lhs * rhs;
                }
                if (rhs === 0) {
                    throw new Error("Division by zero");
                }
                return lhs / rhs;
            },
            3
        );
    },

    Unary_neg(_minus, _gap, value) {
        return -value.calculate(this.args.params);
    },
    Unary_base(value) {
        return value.calculate(this.args.params);
    },

    Primary_number(num) {
        return num.calculate(this.args.params);
    },
    Primary_variable(variable) {
        return variable.calculate(this.args.params);
    },
    Primary_paren(_open, _before, expr, _after, _close) {
        return expr.calculate(this.args.params);
    },

    number(_digits) {
        return Number(this.sourceString);
    },

    variable(_first, _rest) {
        const params = this.args.params as Record<string, number>;
        const name = this.sourceString;
        if (params.hasOwnProperty(name)) {
            return params[name];
        }
        return Number.NaN;
    },
} satisfies ArithmeticActionDict<number>;


arithSemantics.addOperation<number>("calculate(params)", arithCalc);


export interface ArithActions {
    calculate(params: {[name:string]:number}): number;
}

export interface ArithSemantics extends ArithmeticSemantics
{
    (match: import("ohm-js").MatchResult): ArithActions;
}
