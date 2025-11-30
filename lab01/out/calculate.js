"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMulSemantics = void 0;
const addmul_ohm_bundle_1 = __importDefault(require("./addmul.ohm-bundle"));
exports.addMulSemantics = addmul_ohm_bundle_1.default.createSemantics();
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
};
exports.addMulSemantics.addOperation("calculate()", addMulCalc);
//# sourceMappingURL=calculate.js.map