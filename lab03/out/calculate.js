"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.arithSemantics = void 0;
const arith_ohm_bundle_1 = __importDefault(require("./arith.ohm-bundle"));
exports.arithSemantics = arith_ohm_bundle_1.default.createSemantics();
function evaluateChain(first, rest, //AdditiveTail* или Multiplicative*
params, apply, //+ - * /
rhsIndex) {
    let acc = first.calculate(params);
    for (const chunk of rest.children) {
        const op = chunk.child(1).sourceString; //оператор
        const rhsNode = chunk.child(rhsIndex);
        const rhs = rhsNode.calculate(params);
        acc = apply(acc, op, rhs);
    }
    return acc;
}
const arithCalc = {
    Additive(first, rest) {
        const params = this.args.params;
        return evaluateChain(first, rest, params, (lhs, op, rhs) => (op === "+" ? lhs + rhs : lhs - rhs), 3);
    },
    Multiplicative(first, rest) {
        const params = this.args.params;
        return evaluateChain(first, rest, params, (lhs, op, rhs) => {
            if (op === "*") {
                return lhs * rhs;
            }
            if (rhs === 0) {
                throw new Error("Division by zero");
            }
            return lhs / rhs;
        }, 3);
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
        const params = this.args.params;
        const name = this.sourceString;
        if (params.hasOwnProperty(name)) {
            return params[name];
        }
        return Number.NaN;
    },
};
exports.arithSemantics.addOperation("calculate(params)", arithCalc);
//# sourceMappingURL=calculate.js.map