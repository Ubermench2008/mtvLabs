import {
    AssignmentStatement,
    Condition,
    Expression,
    FunnyError,
    ParameterDef,
    Statement,
    TypeName,
} from "@tvm/lab08";

import {
    AnnotatedFunctionDef,
    AnnotatedModule,
    AnnotatedWhileStatement,
    Predicate,
} from "./funnier";

type TypeScope = Map<string, TypeName>;

interface FunctionSignature {
    params: TypeName[];
    returns: TypeName[];
}

type FunctionTable = Map<string, FunctionSignature>;

const builtinFunctions: ReadonlyArray<[string, FunctionSignature]> = [
    ["length", { params: ["int[]"], returns: ["int"] }],
];

export function resolveModule(module: AnnotatedModule): AnnotatedModule {
    const functions = buildFunctionTable(module);
    module.functions.forEach((fn) => validateFunction(fn, functions));
    return module;
}

function buildFunctionTable(module: AnnotatedModule): FunctionTable {
    const table = new Map<string, FunctionSignature>(builtinFunctions);
    for (const func of module.functions) {
        if (table.has(func.name)) {
            throw new FunnyError(`Function '${func.name}' redeclared`, "FunctionRedeclaration");
        }
        table.set(func.name, {
            params: func.parameters.map((p) => p.valueType),
            returns: func.returns.map((r) => r.valueType),
        });
    }
    return table;
}

function validateFunction(func: AnnotatedFunctionDef, functions: FunctionTable): void {
    const parameterScope: TypeScope = new Map();
    declareVariables(func.parameters, parameterScope);
    validatePredicate(func.requires, parameterScope, functions);

    const postScope: TypeScope = new Map(parameterScope);
    declareVariables(func.returns, postScope);
    validatePredicate(func.ensures, postScope, functions);

    const fullScope: TypeScope = new Map(postScope);
    declareVariables(func.locals, fullScope);

    validateStatement(func.body, fullScope, functions);
}

function declareVariables(defs: ParameterDef[], scope: TypeScope): void {
    for (const def of defs) {
        if (scope.has(def.name)) {
            throw new FunnyError(`Variable '${def.name}' redeclared`, "VariableRedeclaration");
        }
        scope.set(def.name, def.valueType);
    }
}

function validateStatement(statement: Statement, scope: TypeScope, functions: FunctionTable): void {
    switch (statement.type) {
        case "block":
            statement.statements.forEach((stmt) => validateStatement(stmt, scope, functions));
            break;
        case "assign":
            validateAssignment(statement, scope, functions);
            break;
        case "if":
            validateCondition(statement.condition, scope, functions);
            validateStatement(statement.thenBranch, scope, functions);
            if (statement.elseBranch) {
                validateStatement(statement.elseBranch, scope, functions);
            }
            break;
        case "while": {
            const loop = statement as AnnotatedWhileStatement;
            validateCondition(loop.condition, scope, functions);
            validatePredicate(loop.invariant, scope, functions);
            validateStatement(loop.body, scope, functions);
            break;
        }
        default: {
            const exhaustive: never = statement;
            return exhaustive;
        }
    }
}

function validateAssignment(statement: AssignmentStatement, scope: TypeScope, functions: FunctionTable): void {
    const valueTypes = inferExpression(statement.expression, scope, functions);
    if (statement.targets.length !== valueTypes.length) {
        throw new FunnyError("Assignment target count does not match expression", "TypeMismatch");
    }

    statement.targets.forEach((name: string, index: number) => {
        const targetType = scope.get(name);
        if (!targetType) {
            throw new FunnyError(`Undeclared identifier '${name}'`, "UndeclaredIdentifier");
        }
        const sourceType = valueTypes[index];
        if (targetType !== sourceType) {
            throw new FunnyError(`Type mismatch in assignment to '${name}'`, "TypeMismatch");
        }
    });
}

function inferExpression(expression: Expression, scope: TypeScope, functions: FunctionTable): TypeName[] {
    switch (expression.type) {
        case "number":
            return ["int"];
        case "variable":
            return [requireVariable(expression.name, scope)];
        case "negate":
            ensureInt(inferExpression(expression.operand, scope, functions), "Unary minus operand must be int");
            return ["int"];
        case "binary":
            ensureInt(inferExpression(expression.left, scope, functions), "Arithmetic operands must be int");
            ensureInt(inferExpression(expression.right, scope, functions), "Arithmetic operands must be int");
            return ["int"];
        case "call": {
            const signature = functions.get(expression.callee);
            if (!signature) {
                throw new FunnyError(`Call to undeclared function '${expression.callee}'`, "UndeclaredFunction");
            }
            if (signature.params.length !== expression.args.length) {
                throw new FunnyError(
                    `Function '${expression.callee}' expects ${signature.params.length} argument(s)`,
                    "ArgumentMismatch",
                );
            }
            expression.args.forEach((arg, index) => {
                const expected = signature.params[index];
                const actual = expectSingleValue(
                    inferExpression(arg, scope, functions),
                    "Function arguments must be single values",
                );
                if (actual !== expected) {
                    throw new FunnyError(
                        `Argument ${index + 1} of '${expression.callee}' must be of type ${expected}`,
                        "ArgumentMismatch",
                    );
                }
            });
            return [...signature.returns];
        }
        default: {
            const exhaustive: never = expression;
            return exhaustive;
        }
    }
}

function validateCondition(condition: Condition, scope: TypeScope, functions: FunctionTable): void {
    switch (condition.type) {
        case "bool":
            return;
        case "compare":
            ensureInt(inferExpression(condition.left, scope, functions), "Left side of comparison must be int");
            ensureInt(inferExpression(condition.right, scope, functions), "Right side of comparison must be int");
            return;
        case "not":
            validateCondition(condition.operand, scope, functions);
            return;
        case "and":
        case "or":
            validateCondition(condition.left, scope, functions);
            validateCondition(condition.right, scope, functions);
            return;
        default: {
            const exhaustive: never = condition;
            return exhaustive;
        }
    }
}

function validatePredicate(predicate: Predicate, scope: TypeScope, functions: FunctionTable): void {
    switch (predicate.type) {
        case "bool":
            return;
        case "compare":
            ensureInt(inferExpression(predicate.left, scope, functions), "Left side of comparison must be int");
            ensureInt(inferExpression(predicate.right, scope, functions), "Right side of comparison must be int");
            return;
        case "not":
            validatePredicate(predicate.operand, scope, functions);
            return;
        case "and":
        case "or":
        case "implies":
            validatePredicate(predicate.left, scope, functions);
            validatePredicate(predicate.right, scope, functions);
            return;
        case "forall":
        case "exists": {
            if (scope.has(predicate.variable.name)) {
                throw new FunnyError(`Variable '${predicate.variable.name}' redeclared`, "VariableRedeclaration");
            }
            const innerScope = new Map(scope);
            innerScope.set(predicate.variable.name, predicate.variable.valueType);
            validatePredicate(predicate.predicate, innerScope, functions);
            return;
        }
        default: {
            const exhaustive: never = predicate;
            return exhaustive;
        }
    }
}

function requireVariable(name: string, scope: TypeScope): TypeName {
    const type = scope.get(name);
    if (!type) {
        throw new FunnyError(`Undeclared identifier '${name}'`, "UndeclaredIdentifier");
    }
    return type;
}

function ensureInt(types: TypeName[], message: string): void {
    if (types.some((type) => type !== "int")) {
        throw new FunnyError(message, "TypeMismatch");
    }
}

function expectSingleValue(types: TypeName[], message: string): TypeName {
    if (types.length !== 1) {
        throw new FunnyError(message, "TypeMismatch");
    }
    return types[0];
}
