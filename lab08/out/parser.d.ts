import { MatchResult, Semantics } from 'ohm-js';
import * as ohm from 'ohm-js';
import * as ast from './funny';
export declare const getFunnyAst: {
    Module(_before: any, functions: any, _after: any): {
        type: "module";
        functions: any;
    };
    FunctionDef(name: any, _gap1: any, _open: any, _gap2: any, paramsOpt: any, _gap3: any, _close: any, _gap4: any, _returns: any, _gap5: any, returnList: any, _gap6: any, localsOpt: any, body: any): {
        type: "fun";
        name: any;
        parameters: ast.ParameterDef[];
        returns: any;
        locals: ast.ParameterDef[];
        body: any;
    };
    FunctionLocals(_uses: any, _gap: any, locals: any, _trail: any): any;
    ParameterList_many(first: any, _gap1: any, _comma: any, _gap2: any, rest: any): any[];
    ParameterList_one(param: any): any[];
    ParameterDef(name: any, _gap1: any, _colon: any, _gap2: any, type: any): {
        type: "param";
        name: any;
        valueType: any;
    };
    Type_int(_int: any): ast.TypeName;
    Type_array(_array: any): ast.TypeName;
    Statement_block(block: any): any;
    Statement_assign(assign: any): any;
    Statement_if(branch: any): any;
    Statement_while(loop: any): any;
    Block(_open: any, _before: any, statements: any, _after: any, _close: any): {
        type: "block";
        statements: any;
    };
    Assignment(targets: any, _gap1: any, _eq: any, _gap2: any, expression: any, _gap3: any, _semi: any): {
        type: "assign";
        targets: any;
        expression: any;
    };
    AssignmentTargets_many(identifier: any, _gap1: any, _comma: any, _gap2: any, rest: any): any[];
    AssignmentTargets_one(identifier: any): any[];
    Conditional(_if: any, _gap1: any, _open: any, _gap2: any, condition: any, _gap3: any, _close: any, _gap4: any, thenBranch: any, _gap5: any, elseOpt: any): {
        type: "if";
        condition: any;
        thenBranch: any;
        elseBranch: ast.Statement | undefined;
    };
    ElseClause(_else: any, _gap: any, statement: any): any;
    While(_while: any, _gap1: any, _open: any, _gap2: any, condition: any, _gap3: any, _close: any, _gap4: any, body: any): {
        type: "while";
        condition: any;
        body: any;
    };
    Condition_true(_true: any): {
        type: "bool";
        value: true;
    };
    Condition_false(_false: any): {
        type: "bool";
        value: false;
    };
    Condition_not(_not: any, _gap: any, operand: any): {
        type: "not";
        operand: any;
    };
    Condition_and(left: any, _gap1: any, _and: any, _gap2: any, right: any): {
        type: "and";
        left: any;
        right: any;
    };
    Condition_or(left: any, _gap1: any, _or: any, _gap2: any, right: any): {
        type: "or";
        left: any;
        right: any;
    };
    Condition_paren(_open: any, _before: any, inner: any, _after: any, _close: any): any;
    Condition_comparison(comparison: any): any;
    Comparison(left: any, _gap1: any, op: any, _gap2: any, right: any): {
        type: "compare";
        operator: any;
        left: any;
        right: any;
    };
    CompareOp_eq(_eq: any): ast.ComparisonOperator;
    CompareOp_ne(_ne: any): ast.ComparisonOperator;
    CompareOp_ge(_ge: any): ast.ComparisonOperator;
    CompareOp_le(_le: any): ast.ComparisonOperator;
    CompareOp_gt(_gt: any): ast.ComparisonOperator;
    CompareOp_lt(_lt: any): ast.ComparisonOperator;
    Expression_call(call: any): any;
    Expression_arith(expr: any): ast.Expression;
    FunctionCall(name: any, _gap1: any, _open: any, _gap2: any, argsOpt: any, _gap3: any, _close: any): {
        type: "call";
        callee: any;
        args: ast.Expression[];
    };
    ArgumentList_many(expr: any, _gap1: any, _comma: any, _gap2: any, rest: any): any[];
    ArgumentList_one(expr: any): any[];
    Primary_call(call: any): any;
    identifier(_first: any, _rest: any): (...args: any[]) => any;
    Additive_op?: ((this: ohm.NonterminalNode, arg0: ohm.NonterminalNode, arg1: ohm.NonterminalNode, arg2: ohm.NonterminalNode, arg3: ohm.NonterminalNode, arg4: ohm.NonterminalNode) => import("lab04/out/ast").Expr) | undefined;
    Additive_base?: ((this: ohm.NonterminalNode, arg0: ohm.NonterminalNode) => import("lab04/out/ast").Expr) | undefined;
    Additive?: ((this: ohm.NonterminalNode, arg0: ohm.NonterminalNode) => import("lab04/out/ast").Expr) | undefined;
    addOp_plus?: ((this: ohm.NonterminalNode, arg0: ohm.TerminalNode) => import("lab04/out/ast").Expr) | undefined;
    addOp_minus?: ((this: ohm.NonterminalNode, arg0: ohm.TerminalNode) => import("lab04/out/ast").Expr) | undefined;
    addOp?: ((this: ohm.NonterminalNode, arg0: ohm.NonterminalNode) => import("lab04/out/ast").Expr) | undefined;
    Multiplicative_op?: ((this: ohm.NonterminalNode, arg0: ohm.NonterminalNode, arg1: ohm.NonterminalNode, arg2: ohm.NonterminalNode, arg3: ohm.NonterminalNode, arg4: ohm.NonterminalNode) => import("lab04/out/ast").Expr) | undefined;
    Multiplicative_base?: ((this: ohm.NonterminalNode, arg0: ohm.NonterminalNode) => import("lab04/out/ast").Expr) | undefined;
    Multiplicative?: ((this: ohm.NonterminalNode, arg0: ohm.NonterminalNode) => import("lab04/out/ast").Expr) | undefined;
    mulOp_times?: ((this: ohm.NonterminalNode, arg0: ohm.TerminalNode) => import("lab04/out/ast").Expr) | undefined;
    mulOp_div?: ((this: ohm.NonterminalNode, arg0: ohm.TerminalNode) => import("lab04/out/ast").Expr) | undefined;
    mulOp?: ((this: ohm.NonterminalNode, arg0: ohm.NonterminalNode) => import("lab04/out/ast").Expr) | undefined;
    Unary_neg?: ((this: ohm.NonterminalNode, arg0: ohm.TerminalNode, arg1: ohm.NonterminalNode, arg2: ohm.NonterminalNode) => import("lab04/out/ast").Expr) | undefined;
    Unary_base?: ((this: ohm.NonterminalNode, arg0: ohm.NonterminalNode) => import("lab04/out/ast").Expr) | undefined;
    Unary?: ((this: ohm.NonterminalNode, arg0: ohm.NonterminalNode) => import("lab04/out/ast").Expr) | undefined;
    Primary_number?: ((this: ohm.NonterminalNode, arg0: ohm.NonterminalNode) => import("lab04/out/ast").Expr) | undefined;
    Primary_variable?: ((this: ohm.NonterminalNode, arg0: ohm.NonterminalNode) => import("lab04/out/ast").Expr) | undefined;
    Primary_paren?: ((this: ohm.NonterminalNode, arg0: ohm.TerminalNode, arg1: ohm.NonterminalNode, arg2: ohm.NonterminalNode, arg3: ohm.NonterminalNode, arg4: ohm.TerminalNode) => import("lab04/out/ast").Expr) | undefined;
    Primary?: ((this: ohm.NonterminalNode, arg0: ohm.NonterminalNode) => import("lab04/out/ast").Expr) | undefined;
    number?: ((this: ohm.NonterminalNode, arg0: ohm.IterationNode) => import("lab04/out/ast").Expr) | undefined;
    variable?: ((this: ohm.NonterminalNode, arg0: ohm.NonterminalNode, arg1: ohm.IterationNode) => import("lab04/out/ast").Expr) | undefined;
    _?: ((this: ohm.NonterminalNode, arg0: ohm.IterationNode) => import("lab04/out/ast").Expr) | undefined;
    spacing?: ((this: ohm.NonterminalNode, arg0: ohm.TerminalNode) => import("lab04/out/ast").Expr) | undefined;
    _iter?: ((this: ohm.IterationNode, ...children: ohm.Node[]) => import("lab04/out/ast").Expr) | undefined;
    _nonterminal?: ((this: ohm.NonterminalNode, ...children: ohm.Node[]) => import("lab04/out/ast").Expr) | undefined;
    _terminal?: ((this: ohm.TerminalNode) => import("lab04/out/ast").Expr) | undefined;
    alnum?: ((this: ohm.NonterminalNode, arg0: ohm.NonterminalNode) => import("lab04/out/ast").Expr) | undefined;
    letter?: ((this: ohm.NonterminalNode, arg0: ohm.NonterminalNode) => import("lab04/out/ast").Expr) | undefined;
    digit?: ((this: ohm.NonterminalNode, arg0: ohm.TerminalNode) => import("lab04/out/ast").Expr) | undefined;
    hexDigit?: ((this: ohm.NonterminalNode, arg0: ohm.NonterminalNode | ohm.TerminalNode) => import("lab04/out/ast").Expr) | undefined;
    ListOf?: ((this: ohm.NonterminalNode, arg0: ohm.NonterminalNode) => import("lab04/out/ast").Expr) | undefined;
    NonemptyListOf?: ((this: ohm.NonterminalNode, arg0: ohm.Node, arg1: ohm.IterationNode, arg2: ohm.IterationNode) => import("lab04/out/ast").Expr) | undefined;
    EmptyListOf?: ((this: ohm.NonterminalNode) => import("lab04/out/ast").Expr) | undefined;
    listOf?: ((this: ohm.NonterminalNode, arg0: ohm.NonterminalNode) => import("lab04/out/ast").Expr) | undefined;
    nonemptyListOf?: ((this: ohm.NonterminalNode, arg0: ohm.Node, arg1: ohm.IterationNode, arg2: ohm.IterationNode) => import("lab04/out/ast").Expr) | undefined;
    emptyListOf?: ((this: ohm.NonterminalNode) => import("lab04/out/ast").Expr) | undefined;
    applySyntactic?: ((this: ohm.NonterminalNode, arg0: ohm.Node) => import("lab04/out/ast").Expr) | undefined;
};
export declare const semantics: FunnySemanticsExt;
export interface FunnySemanticsExt extends Semantics {
    (match: MatchResult): FunnyActionsExt;
}
interface FunnyActionsExt {
    parse(): ast.Module;
}
export declare function parseFunny(source: string): ast.Module;
export {};
