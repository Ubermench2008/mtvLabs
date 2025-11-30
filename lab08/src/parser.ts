import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { MatchResult, Semantics } from 'ohm-js';
import * as ohm from 'ohm-js';

import { arithGrammar } from '../../lab03';
import { getExprAst } from '../../lab04';
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

export const getFunnyAst = {
    ...getExprAst,
    Module(_before, functions, _after) {
        return {
            type: 'module',
            functions: functions.children.map((fn: any) => fn.parse()),
        } satisfies ast.Module;
    },
    FunctionDef(name, _gap1, _open, _gap2, paramsOpt, _gap3, _close, _gap4, _returns, _gap5, returnList, _gap6, localsOpt, body) {
        return {
            type: 'fun',
            name: name.parse(),
            parameters: optionalNode<ast.ParameterDef[]>(paramsOpt) ?? [],
            returns: returnList.parse(),
            locals: optionalNode<ast.ParameterDef[]>(localsOpt) ?? [],
            body: body.parse(),
        } satisfies ast.FunctionDef;
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
        return {
            type: 'param',
            name: name.parse(),
            valueType: type.parse(),
        } satisfies ast.ParameterDef;
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
        return {
            type: 'block',
            statements: statements.children.map((stmt: any) => stmt.parse()),
        } satisfies ast.BlockStatement;
    },
    Assignment(targets, _gap1, _eq, _gap2, expression, _gap3, _semi) {
        return {
            type: 'assign',
            targets: targets.parse(),
            expression: expression.parse(),
        } satisfies ast.AssignmentStatement;
    },
    AssignmentTargets_many(identifier, _gap1, _comma, _gap2, rest) {
        return [identifier.parse(), ...rest.parse()];
    },
    AssignmentTargets_one(identifier) {
        return [identifier.parse()];
    },
    Conditional(_if, _gap1, _open, _gap2, condition, _gap3, _close, _gap4, thenBranch, _gap5, elseOpt) {
        return {
            type: 'if',
            condition: condition.parse(),
            thenBranch: thenBranch.parse(),
            elseBranch: optionalNode<ast.Statement>(elseOpt),
        } satisfies ast.ConditionalStatement;
    },
    ElseClause(_else, _gap, statement) {
        return statement.parse();
    },
    While(_while, _gap1, _open, _gap2, condition, _gap3, _close, _gap4, body) {
        return {
            type: 'while',
            condition: condition.parse(),
            body: body.parse(),
        } satisfies ast.WhileStatement;
    },
    Condition_true(_true) {
        return { type: 'bool', value: true } satisfies ast.BoolLiteralCondition;
    },
    Condition_false(_false) {
        return { type: 'bool', value: false } satisfies ast.BoolLiteralCondition;
    },
    Condition_not(_not, _gap, operand) {
        return { type: 'not', operand: operand.parse() } satisfies ast.NotCondition;
    },
    Condition_and(left, _gap1, _and, _gap2, right) {
        return { type: 'and', left: left.parse(), right: right.parse() } satisfies ast.LogicalCondition;
    },
    Condition_or(left, _gap1, _or, _gap2, right) {
        return { type: 'or', left: left.parse(), right: right.parse() } satisfies ast.LogicalCondition;
    },
    Condition_paren(_open, _before, inner, _after, _close) {
        return inner.parse();
    },
    Condition_comparison(comparison) {
        return comparison.parse();
    },
    Comparison(left, _gap1, op, _gap2, right) {
        return {
            type: 'compare',
            operator: op.parse(),
            left: left.parse(),
            right: right.parse(),
        } satisfies ast.ComparisonCondition;
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
        return {
            type: 'call',
            callee: name.parse(),
            args: optionalNode<ast.Expression[]>(argsOpt) ?? [],
        } satisfies ast.CallExpr;
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
    identifier(_first, _rest) {
        return this.sourceString;
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

type TypeScope = Map<string, ast.TypeName>;

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
    validateModule(moduleAst);
    return moduleAst;
}

function validateModule(module: ast.Module): void {
    const functions = buildFunctionTable(module);
    module.functions.forEach((fn) => validateFunction(fn, functions));
}

function buildFunctionTable(module: ast.Module): FunctionTable {
    const table = new Map<string, FunctionSignature>(builtinFunctions);
    for (const func of module.functions) {
        if (table.has(func.name)) {
            throw new FunnyError(`Function '${func.name}' redeclared`, 'FunctionRedeclaration');
        }
        table.set(func.name, {
            params: func.parameters.map((p) => p.valueType),
            returns: func.returns.map((r) => r.valueType),
        });
    }
    return table;
}

function validateFunction(func: ast.FunctionDef, functions: FunctionTable): void {
    const scope: TypeScope = new Map();
    declareVariables(func.parameters, scope);
    declareVariables(func.returns, scope);
    declareVariables(func.locals, scope);
    validateStatement(func.body, scope, functions);
}

function declareVariables(defs: ast.ParameterDef[], scope: TypeScope): void {
    for (const def of defs) {
        if (scope.has(def.name)) {
            throw new FunnyError(`Variable '${def.name}' redeclared`, 'VariableRedeclaration');
        }
        scope.set(def.name, def.valueType);
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
    const valueTypes = inferExpression(statement.expression, scope, functions);
    if (statement.targets.length !== valueTypes.length) {
        throw new FunnyError('Assignment target count does not match expression', 'TypeMismatch');
    }

    statement.targets.forEach((name, index) => {
        const targetType = scope.get(name);
        if (!targetType) {
            throw new FunnyError(`Undeclared identifier '${name}'`, 'UndeclaredIdentifier');
        }
        const sourceType = valueTypes[index];
        if (targetType !== sourceType) {
            throw new FunnyError(`Type mismatch in assignment to '${name}'`, 'TypeMismatch');
        }
    });
}

function inferExpression(expression: ast.Expression, scope: TypeScope, functions: FunctionTable): ast.TypeName[] {
    switch (expression.type) {
        case 'number':
            return ['int'];
        case 'variable':
            return [requireVariable(expression.name, scope)];
        case 'negate':
            ensureInt(inferExpression(expression.operand, scope, functions), 'Unary minus operand must be int');
            return ['int'];
        case 'binary':
            ensureInt(inferExpression(expression.left, scope, functions), 'Arithmetic operands must be int');
            ensureInt(inferExpression(expression.right, scope, functions), 'Arithmetic operands must be int');
            return ['int'];
        case 'call': {
            const signature = functions.get(expression.callee);
            if (!signature) {
                throw new FunnyError(`Call to undeclared function '${expression.callee}'`, 'UndeclaredFunction');
            }
            if (signature.params.length !== expression.args.length) {
                throw new FunnyError(
                    `Function '${expression.callee}' expects ${signature.params.length} argument(s)`,
                    'ArgumentMismatch',
                );
            }
            expression.args.forEach((arg, index) => {
                const expected = signature.params[index];
                const actual = expectSingleValue(inferExpression(arg, scope, functions), 'Function arguments must be single values');
                if (actual !== expected) {
                    throw new FunnyError(
                        `Argument ${index + 1} of '${expression.callee}' must be of type ${expected}`,
                        'ArgumentMismatch',
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

function validateCondition(condition: ast.Condition, scope: TypeScope, functions: FunctionTable): void {
    switch (condition.type) {
        case 'bool':
            return;
        case 'compare':
            ensureInt(inferExpression(condition.left, scope, functions), 'Left side of comparison must be int');
            ensureInt(inferExpression(condition.right, scope, functions), 'Right side of comparison must be int');
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

function requireVariable(name: string, scope: TypeScope): ast.TypeName {
    const type = scope.get(name);
    if (!type) {
        throw new FunnyError(`Undeclared identifier '${name}'`, 'UndeclaredIdentifier');
    }
    return type;
}

function ensureInt(types: ast.TypeName[], message: string): void {
    if (expectSingleValue(types, message) !== 'int') {
        throw new FunnyError(message, 'TypeMismatch');
    }
}

function expectSingleValue(types: ast.TypeName[], message: string): ast.TypeName {
    if (types.length !== 1) {
        throw new FunnyError(message, 'TypeMismatch');
    }
    return types[0];
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
