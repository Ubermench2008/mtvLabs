"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunnyError = void 0;
exports.compileModule = compileModule;
const wasm_1 = require("../../wasm");
const { i32, varuint32, get_local, local_entry, set_local, call, if_, void_block, void_loop, br_if, br, nop, void: wasmVoid, module: wasmModule, str_ascii, export_entry, func_type_m, function_body, type_section, function_section, export_section, code_section, } = wasm_1.c;
async function compileModule(m, _name) {
    const functionInfos = m.functions.map((fn, index) => ({
        def: fn,
        index,
        funcType: func_type_m(fn.parameters.map((param) => toValueType(param.valueType)), fn.returns.map((ret) => toValueType(ret.valueType))),
        typeIndexRef: varuint32(index),
        funcIndexRef: varuint32(index),
    }));
    const moduleCtx = {
        functions: new Map(functionInfos.map((info) => [info.def.name, info])),
    };
    const bodies = functionInfos.map((info) => compileFunctionBody(info, moduleCtx));
    const moduleAst = wasmModule([
        type_section(functionInfos.map((info) => info.funcType)),
        function_section(functionInfos.map((info) => info.typeIndexRef)),
        export_section(functionInfos.map((info) => export_entry(str_ascii(info.def.name), wasm_1.c.external_kind.function, info.funcIndexRef))),
        code_section(bodies),
    ]);
    const emitter = new wasm_1.BufferedEmitter(new ArrayBuffer(moduleAst.z));
    moduleAst.emit(emitter);
    const { instance } = await WebAssembly.instantiate(emitter.buffer);
    return instance.exports;
}
function compileFunctionBody(info, moduleCtx) {
    const { localEntries, localIndices } = buildLocalEntries(info.def);
    const ctx = {
        module: moduleCtx,
        info,
        localIndices,
    };
    const bodyOps = compileStatement(info.def.body, ctx);
    const returnOps = info.def.returns.map((ret) => get_local(i32, expectLocalIndex(ctx, ret.name)));
    return function_body(localEntries, [...bodyOps, ...returnOps]);
}
function compileStatement(statement, ctx) {
    switch (statement.type) {
        case "block":
            return statement.statements.flatMap((stmt) => compileStatement(stmt, ctx));
        case "assign":
            return compileAssignment(statement, ctx);
        case "if":
            return compileConditional(statement, ctx);
        case "while":
            return compileWhile(statement, ctx);
        default:
            throw new Error(`Unsupported statement type: ${statement.type}`);
    }
}
function compileAssignment(statement, ctx) {
    if (statement.targets.length !== 1) {
        return compileMultiAssignment(statement, ctx);
    }
    const target = statement.targets[0];
    const index = expectLocalIndex(ctx, target);
    const value = compileExpression(statement.expression, ctx);
    return [set_local(index, value)];
}
function compileMultiAssignment(statement, ctx) {
    if (statement.expression.type !== "call") {
        throw new Error("Tuple assignments are only supported for function calls");
    }
    const targetFn = expectFunction(ctx.module, statement.expression.callee);
    if (targetFn.def.returns.length !== statement.targets.length) {
        throw new Error(`Function ${targetFn.def.name} returns ${targetFn.def.returns.length} values`);
    }
    if (statement.expression.args.length !== targetFn.def.parameters.length) {
        throw new Error(`Argument count mismatch when calling ${targetFn.def.name}`);
    }
    const args = statement.expression.args.map((arg) => compileExpression(arg, ctx));
    const callOp = call(i32, targetFn.funcIndexRef, args);
    const ops = [callOp];
    for (let i = statement.targets.length - 1; i >= 0; i--) {
        const target = statement.targets[i];
        ops.push(stackSetLocal(expectLocalIndex(ctx, target)));
    }
    return ops;
}
class StackLocalSet {
    constructor(index) {
        this.t = wasm_1.t.instr_imm1;
        this.v = 0x21;
        this.r = wasmVoid;
        this._Op = wasmVoid;
        this.imm = varuint32(index);
        this.z = 1 + this.imm.z;
    }
    emit(e) {
        return this.imm.emit(e.writeU8(this.v));
    }
}
function stackSetLocal(index) {
    return new StackLocalSet(index);
}
function compileConditional(statement, ctx) {
    const condition = compileCondition(statement.condition, ctx);
    const thenOps = ensureVoidOps(compileStatement(statement.thenBranch, ctx));
    const elseOps = statement.elseBranch ? ensureVoidOps(compileStatement(statement.elseBranch, ctx)) : undefined;
    return [if_(wasm_1.c.void, condition, thenOps, elseOps)];
}
function compileWhile(statement, ctx) {
    // while (cond) body => block { loop { if (!cond) break; body; continue; } }
    const loopBody = [];
    const guard = wasm_1.c.i32.eqz(compileCondition(statement.condition, ctx));
    loopBody.push(br_if(1, guard));
    loopBody.push(...compileStatement(statement.body, ctx));
    loopBody.push(br(0));
    return [void_block([void_loop(loopBody)])];
}
function compileExpression(expr, ctx) {
    switch (expr.type) {
        case "number":
            return i32.const(expr.value);
        case "variable":
            return get_local(i32, expectLocalIndex(ctx, expr.name));
        case "binary":
            return compileBinary(expr, ctx);
        case "negate":
            return i32.sub(i32.const(0), compileExpression(expr.operand, ctx));
        case "call":
            return compileCall(expr, ctx);
        default:
            throw new Error(`Unsupported expression type: ${expr.type}`);
    }
}
function compileBinary(expr, ctx) {
    const left = compileExpression(expr.left, ctx);
    const right = compileExpression(expr.right, ctx);
    switch (expr.op) {
        case "add":
            return i32.add(left, right);
        case "sub":
            return i32.sub(left, right);
        case "mul":
            return i32.mul(left, right);
        case "div":
            return i32.div_s(left, right);
        default:
            throw new Error(`Unsupported binary operator: ${expr.op}`);
    }
}
function compileCall(expr, ctx) {
    const target = expectFunction(ctx.module, expr.callee);
    if (target.def.returns.length !== 1) {
        throw new Error(`Function ${expr.callee} returns multiple values and cannot be used in expressions`);
    }
    if (expr.args.length !== target.def.parameters.length) {
        throw new Error(`Argument count mismatch when calling ${expr.callee}`);
    }
    const args = expr.args.map((arg) => compileExpression(arg, ctx));
    return call(i32, target.funcIndexRef, args);
}
function compileCondition(condition, ctx) {
    switch (condition.type) {
        case "bool":
            return i32.const(condition.value ? 1 : 0);
        case "compare":
            return compileComparison(condition, ctx);
        case "not":
            return i32.eqz(compileCondition(condition.operand, ctx));
        case "and":
            return if_(i32, compileCondition(condition.left, ctx), [compileCondition(condition.right, ctx)], [
                i32.const(0),
            ]);
        case "or":
            return if_(i32, compileCondition(condition.left, ctx), [i32.const(1)], [
                compileCondition(condition.right, ctx),
            ]);
        default:
            throw new Error(`Unsupported condition type: ${condition.type}`);
    }
}
function compileComparison(condition, ctx) {
    const left = compileExpression(condition.left, ctx);
    const right = compileExpression(condition.right, ctx);
    switch (condition.operator) {
        case "==":
            return i32.eq(left, right);
        case "!=":
            return i32.ne(left, right);
        case ">":
            return i32.gt_s(left, right);
        case "<":
            return i32.lt_s(left, right);
        case ">=":
            return i32.ge_s(left, right);
        case "<=":
            return i32.le_s(left, right);
        default:
            throw new Error(`Unsupported comparison operator: ${condition.operator}`);
    }
}
function ensureVoidOps(ops) {
    return ops.length > 0 ? ops : [nop];
}
function buildLocalEntries(fn) {
    const indices = new Map();
    let nextIndex = 0;
    for (const param of fn.parameters) {
        toValueType(param.valueType);
        indices.set(param.name, nextIndex++);
    }
    const extraTypes = [];
    for (const result of fn.returns) {
        extraTypes.push(toValueType(result.valueType));
        indices.set(result.name, nextIndex++);
    }
    for (const local of fn.locals) {
        extraTypes.push(toValueType(local.valueType));
        indices.set(local.name, nextIndex++);
    }
    return {
        localEntries: compressLocalTypes(extraTypes),
        localIndices: indices,
    };
}
function compressLocalTypes(types) {
    if (types.length === 0) {
        return [];
    }
    const entries = [];
    let currentType = types[0];
    let count = 1;
    for (let i = 1; i < types.length; i++) {
        const type = types[i];
        if (type === currentType) {
            count++;
        }
        else {
            entries.push(local_entry(varuint32(count), currentType));
            currentType = type;
            count = 1;
        }
    }
    entries.push(local_entry(varuint32(count), currentType));
    return entries;
}
function expectLocalIndex(ctx, name) {
    const index = ctx.localIndices.get(name);
    if (index === undefined) {
        throw new Error(`Unknown variable: ${name}`);
    }
    return index;
}
function expectFunction(moduleCtx, name) {
    const fn = moduleCtx.functions.get(name);
    if (!fn) {
        throw new Error(`Unknown function: ${name}`);
    }
    return fn;
}
function toValueType(type) {
    if (type === "int") {
        return i32;
    }
    throw new Error("Array types are not supported in this implementation");
}
var lab08_1 = require("../../lab08");
Object.defineProperty(exports, "FunnyError", { enumerable: true, get: function () { return lab08_1.FunnyError; } });
//# sourceMappingURL=compiler.js.map