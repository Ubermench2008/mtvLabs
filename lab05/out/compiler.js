"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVariables = getVariables;
exports.buildFunction = buildFunction;
const wasm_1 = require("../../wasm");
const emitHelper_1 = require("./emitHelper");
const { i32, get_local } = wasm_1.c;
function getVariables(e) {
    const names = [];
    const seen = new Set();
    const visit = (node) => {
        switch (node.type) {
            case "binary":
                visit(node.left);
                visit(node.right);
                return;
            case "negate":
                visit(node.operand);
                return;
            case "variable":
                if (!seen.has(node.name)) {
                    seen.add(node.name);
                    names.push(node.name);
                }
                return;
            case "number":
                return;
        }
    };
    visit(e);
    return names;
}
async function buildFunction(e, variables) {
    let expr = wasm(e, variables);
    return await (0, emitHelper_1.buildOneFunctionModule)("test", variables.length, [expr]);
}
function wasm(e, args) {
    switch (e.type) {
        case "number":
            return i32.const(e.value); //загружаем константу в стек
        case "variable": {
            const index = args.indexOf(e.name);
            if (index === -1) {
                throw new WebAssembly.RuntimeError(`Unknown variable: ${e.name}`);
            }
            return get_local(i32, index);
        }
        case "negate":
            return i32.sub(i32.const(0), wasm(e.operand, args));
        case "binary": {
            const left = wasm(e.left, args);
            const right = wasm(e.right, args);
            switch (e.op) {
                case "add":
                    return i32.add(left, right);
                case "sub":
                    return i32.sub(left, right);
                case "mul":
                    return i32.mul(left, right);
                case "div":
                    return i32.div_s(left, right);
                default:
                    throw new Error(`Unsupported binary operator: ${e.op}`);
            }
        }
    }
    throw new Error("Unsupported expression type");
}
//# sourceMappingURL=compiler.js.map