import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { MatchResult, Semantics } from 'ohm-js';
import * as ohm from 'ohm-js';

import { arithGrammar } from '../../lab03';
import * as ast from './funny';
import { FunnyError } from './index';

type FunnyActionDict<T> = Record<string, (...args: any[]) => T>;

const funnyGrammarSource = loadFunnyGrammarSource();
const grammar = ohm.grammars(funnyGrammarSource, { Arithmetic: arithGrammar }).Funny;

function loadFunnyGrammarSource(): string {
    const primary = join(__dirname, 'funny.ohm.t');
    try {
        return readFileSync(primary, 'utf-8');
    } catch {
        return readFileSync(join(__dirname, '../src/funny.ohm.t'), 'utf-8');
    }
}

const optionalNode = <T>(node: any): T | undefined => {
    if (!node || node.children.length === 0) {
        return undefined;
    }
    return node.children[0].parse();
};

const withLocation = <T extends { location: ast.SourceLocation }>(
    node: any,
    value: Omit<T, 'location'>,
): T => ({
    ...(value as object),
    location: getLocation(node),
} as T);

const buildIdentifierExpr = (node: any): ast.VariableExpr =>
    withLocation<ast.VariableExpr>(node, { type: 'variable', name: node.parse() });

export const getFunnyAst = {
    Module(_before, functions, _after) {
        return {
            type: 'module',
            functions: functions.children.map((fn: any) => fn.parse()),
        } satisfies ast.Module;
    },
    FunctionDef(name, _gap1, _open, _gap2, paramsOpt, _gap3, _close, _gap4, _returns, _gap5, returnList, _gap6, localsOpt, body) {
        return withLocation<ast.FunctionDef>(this, {
            type: 'fun',
            name: name.parse(),
            parameters: optionalNode<ast.ParameterDef[]>(paramsOpt) ?? [],
            returns: returnList.parse(),
            locals: optionalNode<ast.ParameterDef[]>(localsOpt) ?? [],
            body: body.parse(),
        });
    },
    FunctionLocals(_uses, _gap, locals, _trail) {
        return locals.parse();
    },
    ParameterList_many(first, _gap1, _comma, _gap2, rest) {
        return [first.parse(), ...rest.parse()];
    },
    ParameterList_one(param) {
        return [param.parse()];
    },
    ParameterDef(name, _gap1, _colon, _gap2, type) {
        return withLocation<ast.ParameterDef>(this, {
            type: 'param',
            name: name.parse(),
            valueType: type.parse(),
        });
    },
    Type_int(_int) {
        return 'int' as ast.TypeName;
    },
    Type_array(_array) {
        return 'int[]' as ast.TypeName;
    },
    Statement_block(block) {
        return block.parse();
    },
    Statement_assign(assign) {
        return assign.parse();
    },
    Statement_if(branch) {
        return branch.parse();
    },
    Statement_while(loop) {
        return loop.parse();
    },
    Block(_open, _before, statements, _after, _close) {
        return withLocation<ast.BlockStatement>(this, {
            type: 'block',
            statements: statements.children.map((stmt: any) => stmt.parse()),
        });
    },
    Assignment(targets, _gap1, _eq, _gap2, expression, _gap3, _semi) {
        return withLocation<ast.AssignmentStatement>(this, {
            type: 'assign',
            targets: targets.parse(),
            expression: expression.parse(),
        });
    },
    AssignmentTargets_many(target, _gap1, _comma, _gap2, rest) {
        return [target.parse(), ...rest.parse()];
    },
    AssignmentTargets_one(target) {
        return [target.parse()];
    },
    AssignmentTarget_array(arr, _gap1, _open, _gap2, index, _gap3, _close) {
        return withLocation<ast.ArrayAccessTarget>(this, {
            type: 'arrayAccess',
            array: buildIdentifierExpr(arr),
            index: index.parse(),
        });
    },
    AssignmentTarget_identifier(id) {
        return withLocation<ast.VariableTarget>(this, {
            type: 'variable',
            name: id.parse(),
        });
    },
    Conditional(_if, _gap1, _open, _gap2, condition, _gap3, _close, _gap4, thenBranch, _gap5, elseOpt) {
        return withLocation<ast.ConditionalStatement>(this, {
            type: 'if',
            condition: condition.parse(),
            thenBranch: thenBranch.parse(),
            elseBranch: optionalNode<ast.Statement>(elseOpt),
        });
    },
    ElseClause(_else, _gap, statement) {
        return statement.parse();
    },
    While(_while, _gap1, _open, _gap2, condition, _gap3, _close, _gap4, body) {
        return withLocation<ast.WhileStatement>(this, {
            type: 'while',
            condition: condition.parse(),
            body: body.parse(),
        });
    },
    Condition_true(_true) {
        return withLocation<ast.BoolLiteralCondition>(this, { type: 'bool', value: true });
    },
    Condition_false(_false) {
        return withLocation<ast.BoolLiteralCondition>(this, { type: 'bool', value: false });
    },
    Condition_not(_not, _gap, operand) {
        return withLocation<ast.NotCondition>(this, { type: 'not', operand: operand.parse() });
    },
    Condition_and(left, _gap1, _and, _gap2, right) {
        return withLocation<ast.LogicalCondition>(this, { type: 'and', left: left.parse(), right: right.parse() });
    },
    Condition_or(left, _gap1, _or, _gap2, right) {
        return withLocation<ast.LogicalCondition>(this, { type: 'or', left: left.parse(), right: right.parse() });
    },
    Condition_paren(_open, _before, inner, _after, _close) {
        return inner.parse();
    },
    Condition_comparison(comparison) {
        return comparison.parse();
    },
    Comparison(left, _gap1, op, _gap2, right) {
        return withLocation<ast.ComparisonCondition>(this, {
            type: 'compare',
            operator: op.parse(),
            left: left.parse(),
            right: right.parse(),
        });
    },
    CompareOp_eq(_eq) {
        return '==' as ast.ComparisonOperator;
    },
    CompareOp_ne(_ne) {
        return '!=' as ast.ComparisonOperator;
    },
    CompareOp_ge(_ge) {
        return '>=' as ast.ComparisonOperator;
    },
    CompareOp_le(_le) {
        return '<=' as ast.ComparisonOperator;
    },
    CompareOp_gt(_gt) {
        return '>' as ast.ComparisonOperator;
    },
    CompareOp_lt(_lt) {
        return '<' as ast.ComparisonOperator;
    },
    Expression_call(call) {
        return call.parse();
    },
    Expression_arith(expr) {
        return expr.parse() as ast.Expression;
    },
    FunctionCall(name, _gap1, _open, _gap2, argsOpt, _gap3, _close) {
        return withLocation<ast.CallExpr>(this, {
            type: 'call',
            callee: name.parse(),
            args: optionalNode<ast.Expression[]>(argsOpt) ?? [],
        });
    },
    ArgumentList_many(expr, _gap1, _comma, _gap2, rest) {
        return [expr.parse(), ...rest.parse()];
    },
    ArgumentList_one(expr) {
        return [expr.parse()];
    },
    Primary_call(call) {
        return call.parse();
    },
    Primary_arrayAccess(target, _gap1, _open, _gap2, index, _gap3, _close) {
        return withLocation<ast.ArrayAccessExpr>(this, {
            type: 'arrayAccess',
            array: buildIdentifierExpr(target),
            index: index.parse(),
        });
    },
    Primary_number(num) {
        return num.parse();
    },
    Primary_variable(variable) {
        return variable.parse();
    },
    identifier(_first, _rest) {
        return this.sourceString;
    },
    number(_digits) {
        return withLocation<ast.NumberLiteralExpr>(this, { type: 'number', value: Number(this.sourceString) });
    },
    variable(_first, _rest) {
        return withLocation<ast.VariableExpr>(this, { type: 'variable', name: String(this.sourceString) });
    },
    Additive(first, rest) {
        let expr = first.parse();
        for (const chunk of rest.children) {
            const opToken = chunk.child(1).sourceString;
            const rhs = chunk.child(3).parse();
            expr = withLocation<ast.BinaryExpr>(chunk, {
                type: 'binary',
                op: opToken === '+' ? 'add' : 'sub',
                left: expr,
                right: rhs,
            });
        }
        return expr;
    },
    Multiplicative(first, rest) {
        let expr = first.parse();
        for (const chunk of rest.children) {
            const opToken = chunk.child(1).sourceString;
            const rhs = chunk.child(3).parse();
            expr = withLocation<ast.BinaryExpr>(chunk, {
                type: 'binary',
                op: opToken === '*' ? 'mul' : 'div',
                left: expr,
                right: rhs,
            });
        }
        return expr;
    },
    Unary_neg(_minus, _gap, value) {
        return withLocation<ast.NegateExpr>(this, { type: 'negate', operand: value.parse() });
    },
    Unary_base(value) {
        return value.parse();
    },
    Unary(value) {
        return value.parse();
    },
    Primary_paren(_open, _before, expr, _after, _close) {
        return expr.parse();
    },
    Primary(value) {
        return value.parse();
    },
} satisfies FunnyActionDict<any>;

export const semantics: FunnySemanticsExt = grammar.createSemantics() as FunnySemanticsExt;
semantics.addOperation('parse()', getFunnyAst);

export interface FunnySemanticsExt extends Semantics {
    (match: MatchResult): FunnyActionsExt;
}

interface FunnyActionsExt {
    parse(): ast.Module;
}
type VarKind = 'param' | 'return' | 'local';

interface VarInfo {
    type: ast.TypeName;
    kind: VarKind;
    location: ast.SourceLocation;
    used: boolean;
    writable: boolean;
}

type TypeScope = Map<string, VarInfo>;

interface FunctionSignature {
    params: ast.TypeName[];
    returns: ast.TypeName[];
}

type FunctionTable = Map<string, FunctionSignature>;

const builtinFunctions: ReadonlyArray<[string, FunctionSignature]> = [
    ['length', { params: ['int[]'], returns: ['int'] }],
];

export function parseFunny(source: string): ast.Module {
    const match = grammar.match(source, 'Module');
    if (match.failed()) {
        const idx = (match as any).getRightmostFailurePosition?.() ?? 0;
        const { line, column } = getLineAndColumn(source, idx);
        throw new FunnyError('Syntax error', 'SyntaxError', line, column);
    }

    const operations = (semantics(match) as unknown as FunnyActionsExt);
    const moduleAst = operations.parse();
    const warnings: FunnyError[] = [];
    validateModule(moduleAst, warnings);
    if (warnings.length > 0) {
        warnings.forEach((warning) => console.warn(warning));
        (moduleAst as any).warnings = warnings;
    }
    return moduleAst;
}

function validateModule(module: ast.Module, warnings: FunnyError[]): void {
    const functions = buildFunctionTable(module);
    module.functions.forEach((fn) => validateFunction(fn, functions, warnings));
}

function buildFunctionTable(module: ast.Module): FunctionTable {
    const table = new Map<string, FunctionSignature>(builtinFunctions);
    for (const func of module.functions) {
        if (table.has(func.name)) {
            throw createError(`Function '${func.name}' redeclared`, 'FunctionRedeclaration', func.location);
        }
        table.set(func.name, {
            params: func.parameters.map((p) => p.valueType),
            returns: func.returns.map((r) => r.valueType),
        });
    }
    return table;
}

function validateFunction(func: ast.FunctionDef, functions: FunctionTable, warnings: FunnyError[]): void {
    const scope: TypeScope = new Map();
    declareVariables(func.parameters, scope, 'param');
    declareVariables(func.returns, scope, 'return');
    declareVariables(func.locals, scope, 'local');
    validateStatement(func.body, scope, functions);
    collectUnused(scope, warnings);
}

function declareVariables(defs: ast.ParameterDef[], scope: TypeScope, kind: VarKind): void {
    const writable = kind !== 'param';
    for (const def of defs) {
        if (scope.has(def.name)) {
            throw createError(`Variable '${def.name}' redeclared`, 'VariableRedeclaration', def.location);
        }
        scope.set(def.name, { type: def.valueType, kind, location: def.location, used: false, writable });
    }
}

function validateStatement(statement: ast.Statement, scope: TypeScope, functions: FunctionTable): void {
    switch (statement.type) {
        case 'block':
            statement.statements.forEach((stmt) => validateStatement(stmt, scope, functions));
            break;
        case 'assign':
            validateAssignment(statement, scope, functions);
            break;
        case 'if':
            validateCondition(statement.condition, scope, functions);
            validateStatement(statement.thenBranch, scope, functions);
            if (statement.elseBranch) {
                validateStatement(statement.elseBranch, scope, functions);
            }
            break;
        case 'while':
            validateCondition(statement.condition, scope, functions);
            validateStatement(statement.body, scope, functions);
            break;
        default: {
            const exhaustive: never = statement;
            return exhaustive;
        }
    }
}

function validateAssignment(statement: ast.AssignmentStatement, scope: TypeScope, functions: FunctionTable): void {
    if (statement.targets.length > 1 && statement.expression.type !== 'call') {
        throw createError('Tuple assignment must use a function call', 'TypeMismatch', statement.location);
    }

    const valueTypes = inferExpression(statement.expression, scope, functions);
    if (statement.targets.length !== valueTypes.length) {
        throw createError('Assignment target count does not match expression', 'TypeMismatch', statement.location);
    }

    statement.targets.forEach((target, index) => {
        const sourceType = valueTypes[index];
        switch (target.type) {
            case 'variable': {
                const info = requireVariableInfo(target.name, scope, target.location);
                if (!info.writable) {
                    throw createError(`Cannot assign to parameter '${target.name}'`, 'TypeMismatch', target.location);
                }
                if (info.type !== sourceType) {
                    throw createError(`Type mismatch in assignment to '${target.name}'`, 'TypeMismatch', target.location);
                }
                break;
            }
            case 'arrayAccess': {
                const baseTypes = inferExpression(target.array, scope, functions);
                const baseType = expectSingleValue(baseTypes, 'Array access target must be single value', target.location);
                if (baseType !== 'int[]') {
                    throw createError('Array element assignment requires an array target', 'TypeMismatch', target.location);
                }
                if (target.array.type === 'variable') {
                    const info = requireVariableInfo(target.array.name, scope, target.location);
                    if (!info.writable) {
                        throw createError(`Cannot modify parameter '${target.array.name}'`, 'TypeMismatch', target.location);
                    }
                }
                ensureInt(inferExpression(target.index, scope, functions), 'Array index must be int', target.index.location);
                if (sourceType !== 'int') {
                    throw createError('Array elements must be assigned with int values', 'TypeMismatch', target.location);
                }
                break;
            }
            default: {
                const exhaustive: never = target;
                return exhaustive;
            }
        }
    });
}

function inferExpression(expression: ast.Expression, scope: TypeScope, functions: FunctionTable): ast.TypeName[] {
    switch (expression.type) {
        case 'number':
            return ['int'];
        case 'variable':
            return [markUsed(requireVariableInfo(expression.name, scope, expression.location))];
        case 'negate':
            ensureInt(
                inferExpression(expression.operand, scope, functions),
                'Unary minus operand must be int',
                expression.location,
            );
            return ['int'];
        case 'binary':
            ensureInt(
                inferExpression(expression.left, scope, functions),
                'Arithmetic operands must be int',
                expression.left.location,
            );
            ensureInt(
                inferExpression(expression.right, scope, functions),
                'Arithmetic operands must be int',
                expression.right.location,
            );
            return ['int'];
        case 'call': {
            const signature = functions.get(expression.callee);
            if (!signature) {
                throw createError(
                    `Call to undeclared function '${expression.callee}'`,
                    'UndeclaredFunction',
                    expression.location,
                );
            }
            if (signature.params.length !== expression.args.length) {
                throw createError(
                    `Function '${expression.callee}' expects ${signature.params.length} argument(s)`,
                    'ArgumentMismatch',
                    expression.location,
                );
            }
            expression.args.forEach((arg, index) => {
                const expected = signature.params[index];
                const actual = expectSingleValue(
                    inferExpression(arg, scope, functions),
                    'Function arguments must be single values',
                    arg.location,
                );
                if (actual !== expected) {
                    throw createError(
                        `Argument ${index + 1} of '${expression.callee}' must be of type ${expected}`,
                        'ArgumentMismatch',
                        arg.location,
                    );
                }
            });
            return [...signature.returns];
        }
        case 'arrayAccess': {
            const base = expectSingleValue(
                inferExpression(expression.array, scope, functions),
                'Array access target must be single value',
                expression.array.location,
            );
            if (base !== 'int[]') {
                throw createError('Array access is only valid for arrays', 'TypeMismatch', expression.location);
            }
            ensureInt(
                inferExpression(expression.index, scope, functions),
                'Array index must be int',
                expression.index.location,
            );
            return ['int'];
        }
        default: {
            const exhaustive: never = expression;
            return exhaustive;
        }
    }
}

function validateCondition(condition: ast.Condition, scope: TypeScope, functions: FunctionTable): void {
    switch (condition.type) {
        case 'bool':
            return;
        case 'compare':
            ensureInt(
                inferExpression(condition.left, scope, functions),
                'Left side of comparison must be int',
                condition.left.location,
            );
            ensureInt(
                inferExpression(condition.right, scope, functions),
                'Right side of comparison must be int',
                condition.right.location,
            );
            return;
        case 'not':
            validateCondition(condition.operand, scope, functions);
            return;
        case 'and':
        case 'or':
            validateCondition(condition.left, scope, functions);
            validateCondition(condition.right, scope, functions);
            return;
        default: {
            const exhaustive: never = condition;
            return exhaustive;
        }
    }
}

function requireVariableInfo(name: string, scope: TypeScope, location: ast.SourceLocation): VarInfo {
    const info = scope.get(name);
    if (!info) {
        throw createError(`Undeclared identifier '${name}'`, 'UndeclaredIdentifier', location);
    }
    return info;
}

function markUsed(info: VarInfo): ast.TypeName {
    info.used = true;
    return info.type;
}

function ensureInt(types: ast.TypeName[], message: string, location?: ast.SourceLocation): void {
    if (expectSingleValue(types, message, location) !== 'int') {
        throw createError(message, 'TypeMismatch', location);
    }
}

function expectSingleValue(types: ast.TypeName[], message: string, location?: ast.SourceLocation): ast.TypeName {
    if (types.length !== 1) {
        throw createError(message, 'TypeMismatch', location);
    }
    return types[0];
}

function collectUnused(scope: TypeScope, warnings: FunnyError[]): void {
    for (const [name, info] of scope.entries()) {
        if ((info.kind === 'param' || info.kind === 'local') && !info.used) {
            const label = info.kind === 'param' ? 'parameter' : 'variable';
            warnings.push(createError(`Unused ${label} '${name}'`, 'UnusedVariable', info.location));
        }
    }
}

function createError(message: string, code: string, location?: ast.SourceLocation): FunnyError {
    return new FunnyError(message, code, location?.startLine, location?.startCol, location?.endCol, location?.endLine);
}

function getLocation(node: any): ast.SourceLocation {
    const src = node.source;
    const { line: startLine, column: startCol } = getLineAndColumn(src.sourceString, src.startIdx);
    const { line: endLine, column: endCol } = getLineAndColumn(src.sourceString, Math.max(0, src.endIdx - 1));
    return { startLine, startCol, endLine, endCol };
}

function getLineAndColumn(source: string, index: number): { line: number; column: number } {
    const limit = Math.max(0, Math.min(index, source.length));
    let line = 1;
    let column = 1;
    for (let i = 0; i < limit; i += 1) {
        if (source[i] === '\n') {
            line += 1;
            column = 1;
        } else {
            column += 1;
        }
    }
    return { line, column };
}
