"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyntaxError = exports.arithGrammar = void 0;
exports.evaluate = evaluate;
exports.parse = parse;
const arith_ohm_bundle_1 = __importDefault(require("./arith.ohm-bundle"));
const calculate_1 = require("./calculate");
exports.arithGrammar = arith_ohm_bundle_1.default;
function evaluate(content, params) {
    return calculate(parse(content), params ?? {});
}
class SyntaxError extends Error {
}
exports.SyntaxError = SyntaxError;
function parse(content) {
    const match = arith_ohm_bundle_1.default.match(content.trim());
    if (match.failed()) {
        throw new SyntaxError("Syntax error");
    }
    return match;
}
function calculate(expression, params) {
    return (0, calculate_1.arithSemantics)(expression).calculate(params);
}
//# sourceMappingURL=index.js.map