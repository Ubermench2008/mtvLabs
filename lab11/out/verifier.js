import { init } from "z3-solver";
import { FunnyError } from "@tvm/lab08";
let z3anchor;
let z3;
async function initZ3() {
    if (!z3anchor) {
        z3anchor = await init();
        const Ctx = z3anchor.Context;
        z3 = Ctx("main");
    }
}
export function flushZ3() {
    z3anchor = undefined;
}
export async function verifyModule(module) {
    await initZ3();
    const functions = new Map();
    module.functions.forEach((fn) => functions.set(fn.name, fn));
    for (const fn of module.functions) {
        await verifyFunction(fn, functions);
    }
}
async function verifyFunction(func, functions) {
    const varTypes = collectVariableTypes(func);
    const mutable = new Set();
    func.returns.forEach((ret) => mutable.add(ret.name));
    func.locals.forEach((local) => mutable.add(local.name));
    const ctx = {
        func,
        functions,
        varTypes,
        mutable,
        freshCounter: { value: 0 },
        precondition: z3.Bool.val(true),
        facts: [],
        obligations: [],
    };
    const state = {
        env: createInitialEnv(func, varTypes),
        pathCondition: z3.Bool.val(true),
    };
    ctx.precondition = convertPredicate(func.requires, state.env, ctx);
    executeStatement(func.body, state, ctx);
    const ensuresExpr = convertPredicate(func.ensures, state.env, ctx);
    addObligation(ctx, state, ensuresExpr);
    await proveObligations(ctx);
}
function collectVariableTypes(func) {
    const map = new Map();
    const register = (param) => map.set(param.name, param.valueType);
    func.parameters.forEach(register);
    func.returns.forEach(register);
    func.locals.forEach(register);
    return map;
}
function createInitialEnv(func, varTypes) {
    const env = new Map();
    const declare = (param) => {
        env.set(param.name, declareVariable(param.name, param.valueType));
    };
    func.parameters.forEach(declare);
    func.returns.forEach(declare);
    func.locals.forEach(declare);
    return env;
}
function declareVariable(name, type) {
    if (type === "int[]") {
        return z3.Array.const(name, getIntSort(), getIntSort());
    }
    return z3.Int.const(name);
}
function executeStatement(statement, state, ctx) {
    switch (statement.type) {
        case "block":
            for (const stmt of statement.statements) {
                executeStatement(stmt, state, ctx);
            }
            return;
        case "assign":
            executeAssignment(statement, state, ctx);
            return;
        case "if":
            executeConditional(statement, state, ctx);
            return;
        case "while":
            executeLoop(statement, state, ctx);
            return;
        default: {
            const exhaustive = statement;
            return exhaustive;
        }
    }
}
function executeAssignment(stmt, state, ctx) {
    if (stmt.targets.length > 1) {
        if (stmt.expression.type !== "call") {
            throw new FunnyError("Tuple assignment must call a function", "VerificationError");
        }
        const values = evaluateCallForAssignment(stmt.expression, state, ctx, stmt.targets.length);
        stmt.targets.forEach((name, index) => state.env.set(name, values[index]));
        return;
    }
    const value = evaluateRuntimeExpression(stmt.expression, state, ctx);
    state.env.set(stmt.targets[0], value);
}
function evaluateCallForAssignment(expr, state, ctx, expectedCount) {
    if (expr.callee === "length") {
        if (expectedCount !== 1) {
            throw new FunnyError("Length returns a single value", "VerificationError");
        }
        const arrayArg = evaluateRuntimeValue(expr.args[0], state, ctx);
        return [applyLength(arrayArg)];
    }
    const callee = ctx.functions.get(expr.callee);
    if (!callee) {
        throw new FunnyError(`Call to undeclared function '${expr.callee}'`, "VerificationError");
    }
    if (callee.returns.length !== expectedCount) {
        throw new FunnyError(`Function '${expr.callee}' returns ${callee.returns.length} value(s)`, "VerificationError");
    }
    const args = expr.args.map((arg) => evaluateRuntimeExpression(arg, state, ctx));
    const callEnv = new Map();
    callee.parameters.forEach((param, index) => callEnv.set(param.name, args[index]));
    const requiresExpr = convertPredicate(callee.requires, callEnv, ctx);
    addObligation(ctx, state, requiresExpr);
    const results = callee.returns.map((ret) => makeFreshConst(ctx, `${expr.callee}_${ret.name}`, ret.valueType));
    callee.returns.forEach((ret, index) => callEnv.set(ret.name, results[index]));
    const ensuresExpr = convertPredicate(callee.ensures, callEnv, ctx);
    addFact(ctx, state, ensuresExpr);
    return results;
}
function evaluateRuntimeExpression(expr, state, ctx) {
    const value = evaluateRuntimeValue(expr, state, ctx);
    if (!isArrayValue(value)) {
        return value;
    }
    throw new FunnyError("Array expressions are not supported in arithmetic context", "VerificationError");
}
function evaluateRuntimeValue(expr, state, ctx) {
    switch (expr.type) {
        case "number":
            return z3.Int.val(expr.value);
        case "variable":
            return state.env.get(expr.name);
        case "negate":
            return evaluateRuntimeExpression(expr.operand, state, ctx).neg();
        case "binary": {
            const left = evaluateRuntimeExpression(expr.left, state, ctx);
            const right = evaluateRuntimeExpression(expr.right, state, ctx);
            switch (expr.op) {
                case "add":
                    return left.add(right);
                case "sub":
                    return left.sub(right);
                case "mul":
                    return left.mul(right);
                case "div":
                    return left.div(right);
                default: {
                    const exhaustive = expr.op;
                    return exhaustive;
                }
            }
        }
        case "call":
            if (expr.callee === "length") {
                if (expr.args.length !== 1) {
                    throw new FunnyError("length expects one argument", "VerificationError");
                }
                const arrayArg = evaluateRuntimeValue(expr.args[0], state, ctx);
                return applyLength(arrayArg);
            }
            return evaluateCallForExpression(expr, state, ctx);
        default: {
            const exhaustive = expr;
            return exhaustive;
        }
    }
}
function evaluateCallForExpression(expr, state, ctx) {
    const callee = ctx.functions.get(expr.callee);
    if (!callee) {
        throw new FunnyError(`Call to undeclared function '${expr.callee}'`, "VerificationError");
    }
    if (callee.returns.length !== 1) {
        throw new FunnyError("Only single-value functions can be used in expressions", "VerificationError");
    }
    const [result] = evaluateCallForAssignment(expr, state, ctx, 1);
    if (isArrayValue(result)) {
        throw new FunnyError("Array-returning functions cannot be used in expressions", "VerificationError");
    }
    return result;
}
function executeConditional(statement, state, ctx) {
    var _a;
    const condition = convertCondition(statement.condition, state.env, ctx);
    const parentPath = state.pathCondition;
    const thenState = {
        env: new Map(state.env),
        pathCondition: andAll(parentPath, condition),
    };
    executeStatement(statement.thenBranch, thenState, ctx);
    const elseBranch = (_a = statement.elseBranch) !== null && _a !== void 0 ? _a : { type: "block", statements: [] };
    const elseState = {
        env: new Map(state.env),
        pathCondition: andAll(parentPath, z3.Not(condition)),
    };
    executeStatement(elseBranch, elseState, ctx);
    for (const [name] of state.env) {
        const thenValue = thenState.env.get(name);
        const elseValue = elseState.env.get(name);
        state.env.set(name, z3.If(condition, thenValue, elseValue));
    }
    state.pathCondition = parentPath;
}
function executeLoop(loop, state, ctx) {
    const entryInvariant = convertPredicate(loop.invariant, state.env, ctx);
    addObligation(ctx, state, entryInvariant);
    const loopEnv = cloneEnvWithFreshMutableValues(state.env, ctx);
    const loopInvariant = convertPredicate(loop.invariant, loopEnv, ctx);
    const loopCondition = convertCondition(loop.condition, loopEnv, ctx);
    const loopState = { env: loopEnv, pathCondition: z3.Bool.val(true) };
    const localCtx = createLocalContext(ctx);
    executeStatement(loop.body, loopState, localCtx);
    const invariantAfter = convertPredicate(loop.invariant, loopState.env, ctx);
    const localFacts = combineFacts(localCtx);
    const preservationAssumption = andAll(ctx.precondition, loopInvariant, loopCondition, localFacts);
    ctx.obligations.push(z3.Implies(preservationAssumption, invariantAfter));
    for (const obligation of localCtx.obligations) {
        const guard = andAll(ctx.precondition, loopInvariant, loopCondition);
        ctx.obligations.push(z3.Implies(guard, obligation));
    }
    state.env = cloneEnvWithFreshMutableValues(state.env, ctx);
    const invariantAtExit = convertPredicate(loop.invariant, state.env, ctx);
    addFact(ctx, state, invariantAtExit);
    const negatedCondition = z3.Not(convertCondition(loop.condition, state.env, ctx));
    addFact(ctx, state, negatedCondition);
}
function evaluateSpecExpression(expr, env, ctx) {
    switch (expr.type) {
        case "number":
            return z3.Int.val(expr.value);
        case "variable":
            return env.get(expr.name);
        case "negate":
            return evaluateSpecExpression(expr.operand, env, ctx).neg();
        case "binary": {
            const left = evaluateSpecExpression(expr.left, env, ctx);
            const right = evaluateSpecExpression(expr.right, env, ctx);
            switch (expr.op) {
                case "add":
                    return left.add(right);
                case "sub":
                    return left.sub(right);
                case "mul":
                    return left.mul(right);
                case "div":
                    return left.div(right);
                default: {
                    const exhaustive = expr.op;
                    return exhaustive;
                }
            }
        }
        case "call":
            if (expr.callee === "length") {
                return applyLength(evaluateSpecExpression(expr.args[0], env, ctx));
            }
            return instantiateSpecCall(expr, env, ctx);
        default: {
            const exhaustive = expr;
            return exhaustive;
        }
    }
}
function instantiateSpecCall(expr, env, ctx) {
    const callee = ctx.functions.get(expr.callee);
    if (!callee) {
        throw new FunnyError(`Call to undeclared function '${expr.callee}'`, "VerificationError");
    }
    if (callee.returns.length !== 1) {
        throw new FunnyError("Function returning multiple values cannot be used in predicate expression", "VerificationError");
    }
    const argSorts = callee.parameters.map((p) => getSortForType(p.valueType));
    const decl = getUninterpretedFunction(expr.callee, argSorts);
    const args = expr.args.map((arg) => evaluateSpecExpression(arg, env, ctx));
    return decl.call(...args);
}
function convertPredicate(predicate, env, ctx) {
    switch (predicate.type) {
        case "bool":
            return z3.Bool.val(predicate.value);
        case "compare":
            return convertComparison(predicate, env, ctx);
        case "not":
            return z3.Not(convertPredicate(predicate.operand, env, ctx));
        case "and":
            return z3.And(convertPredicate(predicate.left, env, ctx), convertPredicate(predicate.right, env, ctx));
        case "or":
            return z3.Or(convertPredicate(predicate.left, env, ctx), convertPredicate(predicate.right, env, ctx));
        case "implies":
            return z3.Implies(convertPredicate(predicate.left, env, ctx), convertPredicate(predicate.right, env, ctx));
        case "forall": {
            const qVar = makeFreshConst(ctx, predicate.variable.name, predicate.variable.valueType);
            const innerEnv = new Map(env);
            innerEnv.set(predicate.variable.name, qVar);
            const body = convertPredicate(predicate.predicate, innerEnv, ctx);
            return z3.ForAll([qVar], body);
        }
        case "exists": {
            const qVar = makeFreshConst(ctx, predicate.variable.name, predicate.variable.valueType);
            const innerEnv = new Map(env);
            innerEnv.set(predicate.variable.name, qVar);
            const body = convertPredicate(predicate.predicate, innerEnv, ctx);
            return z3.Exists([qVar], body);
        }
        default: {
            const exhaustive = predicate;
            return exhaustive;
        }
    }
}
function convertCondition(condition, env, ctx) {
    switch (condition.type) {
        case "bool":
            return z3.Bool.val(condition.value);
        case "compare":
            return convertComparison(condition, env, ctx);
        case "not":
            return z3.Not(convertCondition(condition.operand, env, ctx));
        case "and":
            return z3.And(convertCondition(condition.left, env, ctx), convertCondition(condition.right, env, ctx));
        case "or":
            return z3.Or(convertCondition(condition.left, env, ctx), convertCondition(condition.right, env, ctx));
        default:
            return convertPredicate(condition, env, ctx);
    }
}
function convertComparison(comparison, env, ctx) {
    const left = evaluateSpecExpression(comparison.left, env, ctx);
    const right = evaluateSpecExpression(comparison.right, env, ctx);
    switch (comparison.operator) {
        case "==":
            return left.eq(right);
        case "!=":
            return left.eq(right).not();
        case ">":
            return left.gt(right);
        case ">=":
            return left.ge(right);
        case "<":
            return left.lt(right);
        case "<=":
            return left.le(right);
        default: {
            const exhaustive = comparison.operator;
            return exhaustive;
        }
    }
}
function addFact(ctx, state, fact) {
    if (isTrivialTrue(fact)) {
        return;
    }
    const guarded = isTrivialTrue(state.pathCondition) ? fact : z3.Implies(state.pathCondition, fact);
    ctx.facts.push(guarded);
}
function addObligation(ctx, state, conclusion) {
    const assumption = combineAssumptions(ctx, state.pathCondition);
    ctx.obligations.push(z3.Implies(assumption, conclusion));
}
function combineAssumptions(ctx, extra) {
    const parts = [];
    if (!isTrivialTrue(ctx.precondition)) {
        parts.push(ctx.precondition);
    }
    parts.push(...ctx.facts.filter((fact) => !isTrivialTrue(fact)));
    if (extra && !isTrivialTrue(extra)) {
        parts.push(extra);
    }
    return andAll(...parts);
}
function combineFacts(ctx) {
    return andAll(ctx.precondition, ...ctx.facts);
}
function createLocalContext(ctx) {
    return {
        func: ctx.func,
        functions: ctx.functions,
        varTypes: ctx.varTypes,
        mutable: ctx.mutable,
        freshCounter: ctx.freshCounter,
        precondition: z3.Bool.val(true),
        facts: [],
        obligations: [],
    };
}
function cloneEnvWithFreshMutableValues(source, ctx) {
    const env = new Map();
    for (const [name, value] of source) {
        if (ctx.mutable.has(name)) {
            env.set(name, makeFreshConst(ctx, `${name}_state`, ctx.varTypes.get(name)));
        }
        else {
            env.set(name, value);
        }
    }
    return env;
}
function makeFreshConst(ctx, base, type) {
    const id = ctx.freshCounter.value++;
    const name = `__${base}_${id}`;
    if (type === "int[]") {
        return z3.Array.const(name, getIntSort(), getIntSort());
    }
    return z3.Int.const(name);
}
function applyLength(arg) {
    if (!isArrayValue(arg)) {
        throw new FunnyError("length expects an array argument", "VerificationError");
    }
    if (!lengthDecl) {
        lengthDecl = z3.Function.declare("__funny_length", getArraySort(), getIntSort());
    }
    return lengthDecl.call(arg);
}
function getSortForType(type) {
    return type === "int[]" ? getArraySort() : getIntSort();
}
function getIntSort() {
    return z3.Int.sort();
}
function getArraySort() {
    return z3.Array.sort(getIntSort(), getIntSort());
}
function andAll(...parts) {
    const filtered = parts.filter((part) => part && !isTrivialTrue(part));
    if (filtered.length === 0) {
        return z3.Bool.val(true);
    }
    if (filtered.length === 1) {
        return filtered[0];
    }
    return z3.And(...filtered);
}
function isTrivialTrue(expr) {
    return expr.eqIdentity(z3.Bool.val(true));
}
function isArrayValue(value) {
    return z3.isArray(value);
}
async function proveObligations(ctx) {
    for (const obligation of ctx.obligations) {
        const solver = new z3.Solver();
        solver.add(z3.Not(obligation));
        const result = await solver.check();
        if (result === "unsat") {
            continue;
        }
        if (result === "unknown") {
            throw new FunnyError(`Verification failed for function '${ctx.func.name}'`, "VerificationError");
        }
        const model = await solver.model();
        throw new FunnyError(`Verification failed for function '${ctx.func.name}'. Model:\n${model.toString()}`, "VerificationError");
    }
}
let lengthDecl;
const uninterpretedFunctions = new Map();
function getUninterpretedFunction(name, signature) {
    if (!uninterpretedFunctions.has(name)) {
        const args = [...signature, getIntSort()];
        uninterpretedFunctions.set(name, z3.Function.declare(`__funny_fun_${name}`, ...args));
    }
    return uninterpretedFunctions.get(name);
}
//# sourceMappingURL=verifier.js.map