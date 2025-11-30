"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyntaxError = void 0;
exports.evaluate = evaluate;
const calculate_1 = require("./calculate");
const addmul_ohm_bundle_1 = __importDefault(require("./addmul.ohm-bundle"));
function evaluate(content) {
    return calculate(parse(content));
}
class SyntaxError extends Error {
}
exports.SyntaxError = SyntaxError;
function parse(content) {
    const m = addmul_ohm_bundle_1.default.match(content, "Expr");
    if (m.failed()) {
        throw new SyntaxError("Syntax error");
    }
    return m;
}
function calculate(expression) {
    return (0, calculate_1.addMulSemantics)(expression).calculate();
}
//# sourceMappingURL=index.js.map