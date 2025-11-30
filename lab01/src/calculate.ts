import { Dict, MatchResult, Semantics } from "ohm-js";
import grammar, { AddMulActionDict } from "./addmul.ohm-bundle";

export const addMulSemantics: AddMulSemantics = grammar.createSemantics() as AddMulSemantics;

const addMulCalc = {
  Expr(e) {
    return e.calculate();
  },

  Add_plus(l, _plus, r) {
    return l.calculate() + r.calculate();
  },
  Add(e) {
    return e.calculate();
  },

  Mul_times(l, _star, r) {
    return l.calculate() * r.calculate();
  },
  Mul(e) {
    return e.calculate();
  },

  Pri(e) {
    return e.calculate();
  },
  Pri_paren(_l, e, _r) {
    return e.calculate();
  },

  number(_digits) {
    return parseInt(this.sourceString, 10);
  },
} satisfies AddMulActionDict<number>;

addMulSemantics.addOperation<number>("calculate()", addMulCalc);

interface AddMulDict extends Dict {
  calculate(): number;
}

interface AddMulSemantics extends Semantics {
  (match: MatchResult): AddMulDict;
}
