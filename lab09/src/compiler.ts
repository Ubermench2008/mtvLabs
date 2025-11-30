import { Op, I32, c, t, BufferedEmitter, LocalEntry } from "../../wasm";
import type { AnyOp, ValueType } from "../../wasm";
import type { Module, FunctionDef, Statement, Expression, Condition, TypeName, CallExpr } from "../../lab08";

const {
    i32,
    varuint32,
    get_local,
    local_entry,
    set_local,
    call,
    if_,
    void_block,
    void_loop,
    br_if,
    br,
    nop,
    void: wasmVoid,
    module: wasmModule,
    str_ascii,
    export_entry,
    func_type_m,
    function_body,
    type_section,
    function_section,
    export_section,
    code_section,
} = c;

interface CompiledFunctionInfo {
    def: FunctionDef;
    index: number;
    funcType: ReturnType<typeof func_type_m>; //wasm тип функции 
    typeIndexRef: ReturnType<typeof varuint32>; //индекс функции в секции Type
    funcIndexRef: ReturnType<typeof varuint32>; //индекс функции в секции Functions
}

interface ModuleContext {
    functions: Map<string, CompiledFunctionInfo>;
}

interface FunctionContext {
    module: ModuleContext;
    info: CompiledFunctionInfo;
    localIndices: Map<string, number>;
}

export async function compileModule(m: Module, _name?: string): Promise<WebAssembly.Exports> {
    const functionInfos = m.functions.map((fn, index) => ({
        def: fn,
        index,
        funcType: func_type_m(
            fn.parameters.map((param) => toValueType(param.valueType)),
            fn.returns.map((ret) => toValueType(ret.valueType)),
        ),
        typeIndexRef: varuint32(index),
        funcIndexRef: varuint32(index),
    }));

    const moduleCtx: ModuleContext = {
        functions: new Map(functionInfos.map((info) => [info.def.name, info])),
    };

    const bodies = functionInfos.map((info) => compileFunctionBody(info, moduleCtx));

    const moduleAst = wasmModule([
        type_section(functionInfos.map((info) => info.funcType)),
        function_section(functionInfos.map((info) => info.typeIndexRef)),
        export_section(
            functionInfos.map((info) =>
                export_entry(str_ascii(info.def.name), c.external_kind.function, info.funcIndexRef),
            ),
        ),
        code_section(bodies),
    ]);

    const emitter = new BufferedEmitter(new ArrayBuffer(moduleAst.z));
    moduleAst.emit(emitter);

    const { instance } = await WebAssembly.instantiate(emitter.buffer);
    return instance.exports;
}

function compileFunctionBody(info: CompiledFunctionInfo, moduleCtx: ModuleContext) {
    const { localEntries, localIndices } = buildLocalEntries(info.def);
    const ctx: FunctionContext = {
        module: moduleCtx,
        info,
        localIndices,
    };

    const bodyOps = compileStatement(info.def.body, ctx);
    const returnOps = info.def.returns.map((ret) => get_local(i32, expectLocalIndex(ctx, ret.name)));

    return function_body(localEntries, [...bodyOps, ...returnOps]);
}

function compileStatement(statement: Statement, ctx: FunctionContext): AnyOp[] {
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
            throw new Error(`Unsupported statement type: ${(statement as Statement).type}`);
    }
}

function compileAssignment(statement: Extract<Statement, { type: "assign" }>, ctx: FunctionContext): AnyOp[] {
    if (statement.targets.length !== 1) {
        return compileMultiAssignment(statement, ctx);
    }

    const target = statement.targets[0];
    const index = expectLocalIndex(ctx, target);
    const value = compileExpression(statement.expression, ctx);

    return [set_local(index, value)];
}

function compileMultiAssignment(statement: Extract<Statement, { type: "assign" }>, ctx: FunctionContext): AnyOp[] {
    if (statement.expression.type !== "call") {
        throw new Error("Tuple assignments are only supported for function calls");
    }

    const targetFn = expectFunction(ctx.module, statement.expression.callee);
    if (targetFn.def.returns.length !== statement.targets.length) { //проверка что функция возвращает столько сколько нам надо
        throw new Error(`Function ${targetFn.def.name} returns ${targetFn.def.returns.length} values`);
    }
    if (statement.expression.args.length !== targetFn.def.parameters.length) { //проверяем что аргументов достаточно
        throw new Error(`Argument count mismatch when calling ${targetFn.def.name}`);
    }

    const args = statement.expression.args.map((arg) => compileExpression(arg, ctx));
    const callOp = call(i32, targetFn.funcIndexRef, args) as AnyOp; //генер. инстр вызова функции в WASM i32 - тип возвр, targetFn.funcIndexRef - индекс ф-и в таблице ф-й WASM

    const ops: AnyOp[] = [callOp];
    for (let i = statement.targets.length - 1; i >= 0; i--) {
        const target = statement.targets[i];
        ops.push(stackSetLocal(expectLocalIndex(ctx, target)));
    }

    return ops;
}

class StackLocalSet implements AnyOp {
    readonly t = t.instr_imm1;
    readonly v = 0x21;
    readonly r = wasmVoid;
    readonly _Op = wasmVoid;
    readonly z: number;
    readonly imm: ReturnType<typeof varuint32>;

    constructor(index: number) {
        this.imm = varuint32(index);
        this.z = 1 + this.imm.z;
    }

    emit(e: any) {
        return this.imm.emit(e.writeU8(this.v));
    }
}

function stackSetLocal(index: number): AnyOp {
    return new StackLocalSet(index);
}

function compileConditional(statement: Extract<Statement, { type: "if" }>, ctx: FunctionContext): AnyOp[] {
    const condition = compileCondition(statement.condition, ctx);
    const thenOps = ensureVoidOps(compileStatement(statement.thenBranch, ctx));
    const elseOps = statement.elseBranch ? ensureVoidOps(compileStatement(statement.elseBranch, ctx)) : undefined;

    return [if_(c.void, condition, thenOps, elseOps)];
}

function compileWhile(statement: Extract<Statement, { type: "while" }>, ctx: FunctionContext): AnyOp[] {
    const loopBody: AnyOp[] = [];
    const guard = c.i32.eqz(compileCondition(statement.condition, ctx)); //кладет 1 если условие цикла false и 0 если true
    loopBody.push(br_if(1, guard)); //guard 1 - br 1
    loopBody.push(...compileStatement(statement.body, ctx));
    loopBody.push(br(0));

    return [void_block([void_loop(loopBody)])];
}

function compileExpression(expr: Expression, ctx: FunctionContext): Op<I32> {
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
            throw new Error(`Unsupported expression type: ${(expr as Expression).type}`);
    }
}

function compileBinary(expr: Extract<Expression, { type: "binary" }>, ctx: FunctionContext): Op<I32> {
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

function compileCall(expr: CallExpr, ctx: FunctionContext): Op<I32> {
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

function compileCondition(condition: Condition, ctx: FunctionContext): Op<I32> {
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
            throw new Error(`Unsupported condition type: ${(condition as Condition).type}`);
    }
}

function compileComparison(condition: Extract<Condition, { type: "compare" }>, ctx: FunctionContext): Op<I32> {
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

function ensureVoidOps(ops: AnyOp[]): AnyOp[] {
    return ops.length > 0 ? ops : [nop];
}

function buildLocalEntries(fn: FunctionDef): { localEntries: LocalEntry[]; localIndices: Map<string, number> } {
    const indices = new Map<string, number>();
    let nextIndex = 0;
    for (const param of fn.parameters) {
        toValueType(param.valueType);
        indices.set(param.name, nextIndex++);
    }

    const extraTypes: ValueType[] = [];
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

function compressLocalTypes(types: ValueType[]): LocalEntry[] { //пройдется по всем типам всех локальных переменных и запишет в сжатом формате (count : type)
    if (types.length === 0) {
        return [];
    }

    const entries: LocalEntry[] = [];
    let currentType = types[0];
    let count = 1;
    for (let i = 1; i < types.length; i++) {
        const type = types[i];
        if (type === currentType) {
            count++;
        } else {
            entries.push(local_entry(varuint32(count), currentType));
            currentType = type;
            count = 1;
        }
    }
    entries.push(local_entry(varuint32(count), currentType));

    return entries;
}

function expectLocalIndex(ctx: FunctionContext, name: string): number {
    const index = ctx.localIndices.get(name);
    if (index === undefined) {
        throw new Error(`Unknown variable: ${name}`);
    }
    return index;
}

function expectFunction(moduleCtx: ModuleContext, name: string): CompiledFunctionInfo {
    const fn = moduleCtx.functions.get(name);
    if (!fn) {
        throw new Error(`Unknown function: ${name}`);
    }
    return fn;
}

function toValueType(type: TypeName): ValueType {
    if (type === "int") {
        return i32;
    }

    throw new Error("Array types are not supported in this implementation");
}

export { FunnyError } from "../../lab08";
