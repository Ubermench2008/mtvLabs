"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyntaxError = void 0;
exports.evaluate = evaluate;
exports.maxStackDepth = maxStackDepth;
const rpn_ohm_bundle_1 = __importDefault(require("./rpn.ohm-bundle"));
const semantics_1 = require("./semantics");
function evaluate(source) {
    const m = rpn_ohm_bundle_1.default.match(source);
    if (m.failed())
        throw new SyntaxError("Invalid RPN: parse failed");
    try {
        return (0, semantics_1.rpnSemantics)(m).calculate();
    }
    catch {
        throw new SyntaxError("Invalid RPN: evaluation failed");
    }
}
function maxStackDepth(source) {
    const m = rpn_ohm_bundle_1.default.match(source);
    if (m.failed())
        throw new SyntaxError("Invalid RPN: parse failed");
    const sd = (0, semantics_1.rpnSemantics)(m).stackDepth;
    if (sd.out !== 1 || sd.max < 1 || sd.need > 0) {
        throw new SyntaxError("Invalid RPN: stack shape");
    }
    return sd.max;
}
class SyntaxError extends Error {
}
exports.SyntaxError = SyntaxError;
//# sourceMappingURL=index.js.map