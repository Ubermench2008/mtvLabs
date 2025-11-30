"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVariables = exports.buildFunction = exports.checked = exports.compile = void 0;
exports.parseCompileAndExecute = parseCompileAndExecute;
exports.compileAndExecute = compileAndExecute;
const lab04_1 = require("../../lab04");
const compiler_1 = require("./compiler");
async function parseCompileAndExecute(expression, ...args) {
    let expr = (0, lab04_1.parseExpr)(expression);
    let variables = (0, compiler_1.getVariables)(expr);
    return await compileAndExecute(expr, variables, ...args);
}
async function compileAndExecute(expr, variables, ...args) {
    let wasmFunc = await (0, exports.compile)(expr, variables);
    return wasmFunc(...args);
}
const compile = async (expr, variables) => (0, exports.checked)(await (0, compiler_1.buildFunction)(expr, variables));
exports.compile = compile;
const checked = (func) => function (...args) {
    if (args.length != func.length)
        throw new WebAssembly.RuntimeError(`Signature mismatch: passed ${args.length}, expected ${func.length}.`);
    return func(...args);
};
exports.checked = checked;
var compiler_2 = require("./compiler");
Object.defineProperty(exports, "buildFunction", { enumerable: true, get: function () { return compiler_2.buildFunction; } });
Object.defineProperty(exports, "getVariables", { enumerable: true, get: function () { return compiler_2.getVariables; } });
//# sourceMappingURL=index.js.map