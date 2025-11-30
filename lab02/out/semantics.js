"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rpnSemantics = void 0;
const rpn_ohm_bundle_1 = __importDefault(require("./rpn.ohm-bundle"));
const stackDepth_1 = require("./stackDepth");
const calculate_1 = require("./calculate");
exports.rpnSemantics = rpn_ohm_bundle_1.default.createSemantics();
exports.rpnSemantics.addOperation("calculate()", calculate_1.rpnCalc);
exports.rpnSemantics.addAttribute("stackDepth", stackDepth_1.rpnStackDepth);
//# sourceMappingURL=semantics.js.map