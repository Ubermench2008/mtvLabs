"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.semantics = exports.getFunnyAst = void 0;
exports.parseFunny = parseFunny;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const ohm = __importStar(require("ohm-js"));
const lab03_1 = require("../../lab03");
const lab04_1 = require("../../lab04");
const index_1 = require("./index");
const funnyGrammarSource = loadFunnyGrammarSource();
const grammar = ohm.grammars(funnyGrammarSource, { Arithmetic: lab03_1.arithGrammar }).Funny;
function loadFunnyGrammarSource() {
    const primary = (0, node_path_1.join)(__dirname, 'funny.ohm.t');
    try {
        return (0, node_fs_1.readFileSync)(primary, 'utf-8');
    }
    catch (_a) {
        return (0, node_fs_1.readFileSync)((0, node_path_1.join)(__dirname, '../src/funny.ohm.t'), 'utf-8');
    }
}
const optionalNode = (node) => {
    if (!node || node.children.length === 0) {
        return undefined;
    }
    return node.children[0].parse();
};
exports.getFunnyAst = {
    ...lab04_1.getExprAst,
    Module(_before, functions, _after) {
        return {
            type: 'module',
            functions: functions.children.map((fn) => fn.parse()),
        };
    },
    FunctionDef(name, _gap1, _open, _gap2, paramsOpt, _gap3, _close, _gap4, _returns, _gap5, returnList, _gap6, localsOpt, body) {
        var _a, _b;
        return {
            type: 'fun',
            name: name.parse(),
            parameters: (_a = optionalNode(paramsOpt)) !== null && _a !== void 0 ? _a : [],
            returns: returnList.parse(),
            locals: (_b = optionalNode(localsOpt)) !== null && _b !== void 0 ? _b : [],
            body: body.parse(),
        };
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
        };
    },
    Type_int(_int) {
        return 'int';
    },
    Type_array(_array) {
        return 'int[]';
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
            statements: statements.children.map((stmt) => stmt.parse()),
        };
    },
    Assignment(targets, _gap1, _eq, _gap2, expression, _gap3, _semi) {
        return {
            type: 'assign',
            targets: targets.parse(),
            expression: expression.parse(),
        };
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
            elseBranch: optionalNode(elseOpt),
        };
    },
    ElseClause(_else, _gap, statement) {
        return statement.parse();
    },
    While(_while, _gap1, _open, _gap2, condition, _gap3, _close, _gap4, body) {
        return {
            type: 'while',
            condition: condition.parse(),
            body: body.parse(),
        };
    },
    Condition_true(_true) {
        return { type: 'bool', value: true };
    },
    Condition_false(_false) {
        return { type: 'bool', value: false };
    },
    Condition_not(_not, _gap, operand) {
        return { type: 'not', operand: operand.parse() };
    },
    Condition_and(left, _gap1, _and, _gap2, right) {
        return { type: 'and', left: left.parse(), right: right.parse() };
    },
    Condition_or(left, _gap1, _or, _gap2, right) {
        return { type: 'or', left: left.parse(), right: right.parse() };
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
        };
    },
    CompareOp_eq(_eq) {
        return '==';
    },
    CompareOp_ne(_ne) {
        return '!=';
    },
    CompareOp_ge(_ge) {
        return '>=';
    },
    CompareOp_le(_le) {
        return '<=';
    },
    CompareOp_gt(_gt) {
        return '>';
    },
    CompareOp_lt(_lt) {
        return '<';
    },
    Expression_call(call) {
        return call.parse();
    },
    Expression_arith(expr) {
        return expr.parse();
    },
    FunctionCall(name, _gap1, _open, _gap2, argsOpt, _gap3, _close) {
        var _a;
        return {
            type: 'call',
            callee: name.parse(),
            args: (_a = optionalNode(argsOpt)) !== null && _a !== void 0 ? _a : [],
        };
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
};
exports.semantics = grammar.createSemantics();
exports.semantics.addOperation('parse()', exports.getFunnyAst);
const builtinFunctions = [
    ['length', { params: ['int[]'], returns: ['int'] }],
];
function parseFunny(source) {
    var _a, _b, _c;
    const match = grammar.match(source, 'Module');
    if (match.failed()) {
        const idx = (_c = (_b = (_a = match).getRightmostFailurePosition) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : 0;
        const { line, column } = getLineAndColumn(source, idx);
        throw new index_1.FunnyError('Syntax error', 'SyntaxError', line, column);
    }
    const operations = (0, exports.semantics)(match);
    const moduleAst = operations.parse();
    validateModule(moduleAst);
    return moduleAst;
}
function validateModule(module) {
    const functions = buildFunctionTable(module);
    module.functions.forEach((fn) => validateFunction(fn, functions));
}
function buildFunctionTable(module) {
    const table = new Map(builtinFunctions);
    for (const func of module.functions) {
        if (table.has(func.name)) {
            throw new index_1.FunnyError(`Function '${func.name}' redeclared`, 'FunctionRedeclaration');
        }
        table.set(func.name, {
            params: func.parameters.map((p) => p.valueType),
            returns: func.returns.map((r) => r.valueType),
        });
    }
    return table;
}
function validateFunction(func, functions) {
    const scope = new Map();
    declareVariables(func.parameters, scope);
    declareVariables(func.returns, scope);
    declareVariables(func.locals, scope);
    validateStatement(func.body, scope, functions);
}
function declareVariables(defs, scope) {
    for (const def of defs) {
        if (scope.has(def.name)) {
            throw new index_1.FunnyError(`Variable '${def.name}' redeclared`, 'VariableRedeclaration');
        }
        scope.set(def.name, def.valueType);
    }
}
function validateStatement(statement, scope, functions) {
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
            const exhaustive = statement;
            return exhaustive;
        }
    }
}
function validateAssignment(statement, scope, functions) {
    const valueTypes = inferExpression(statement.expression, scope, functions);
    if (statement.targets.length !== valueTypes.length) {
        throw new index_1.FunnyError('Assignment target count does not match expression', 'TypeMismatch');
    }
    statement.targets.forEach((name, index) => {
        const targetType = scope.get(name);
        if (!targetType) {
            throw new index_1.FunnyError(`Undeclared identifier '${name}'`, 'UndeclaredIdentifier');
        }
        const sourceType = valueTypes[index];
        if (targetType !== sourceType) {
            throw new index_1.FunnyError(`Type mismatch in assignment to '${name}'`, 'TypeMismatch');
        }
    });
}
function inferExpression(expression, scope, functions) {
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
                throw new index_1.FunnyError(`Call to undeclared function '${expression.callee}'`, 'UndeclaredFunction');
            }
            if (signature.params.length !== expression.args.length) {
                throw new index_1.FunnyError(`Function '${expression.callee}' expects ${signature.params.length} argument(s)`, 'ArgumentMismatch');
            }
            expression.args.forEach((arg, index) => {
                const expected = signature.params[index];
                const actual = expectSingleValue(inferExpression(arg, scope, functions), 'Function arguments must be single values');
                if (actual !== expected) {
                    throw new index_1.FunnyError(`Argument ${index + 1} of '${expression.callee}' must be of type ${expected}`, 'ArgumentMismatch');
                }
            });
            return [...signature.returns];
        }
        default: {
            const exhaustive = expression;
            return exhaustive;
        }
    }
}
function validateCondition(condition, scope, functions) {
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
            const exhaustive = condition;
            return exhaustive;
        }
    }
}
function requireVariable(name, scope) {
    const type = scope.get(name);
    if (!type) {
        throw new index_1.FunnyError(`Undeclared identifier '${name}'`, 'UndeclaredIdentifier');
    }
    return type;
}
function ensureInt(types, message) {
    if (expectSingleValue(types, message) !== 'int') {
        throw new index_1.FunnyError(message, 'TypeMismatch');
    }
}
function expectSingleValue(types, message) {
    if (types.length !== 1) {
        throw new index_1.FunnyError(message, 'TypeMismatch');
    }
    return types[0];
}
function getLineAndColumn(source, index) {
    const limit = Math.max(0, Math.min(index, source.length));
    let line = 1;
    let column = 1;
    for (let i = 0; i < limit; i += 1) {
        if (source[i] === '\n') {
            line += 1;
            column = 1;
        }
        else {
            column += 1;
        }
    }
    return { line, column };
}
//# sourceMappingURL=parser.js.map