import { BinaryOperator } from "../../lab04";

export type TypeName = 'int' | 'int[]';

export interface Module {
    type: 'module';
    functions: FunctionDef[];
}

export interface FunctionDef {
    type: 'fun';
    name: string;
    parameters: ParameterDef[];
    returns: ParameterDef[];
    locals: ParameterDef[];
    body: Statement;
}

export interface ParameterDef {
    type: 'param';
    name: string;
    valueType: TypeName;
}

export type Statement =
    | BlockStatement
    | AssignmentStatement
    | ConditionalStatement
    | WhileStatement;

export interface BlockStatement {
    type: 'block';
    statements: Statement[];
}

export interface AssignmentStatement {
    type: 'assign';
    targets: string[];
    expression: Expression;
}

export interface ConditionalStatement {
    type: 'if';
    condition: Condition;
    thenBranch: Statement;
    elseBranch?: Statement;
}

export interface WhileStatement {
    type: 'while';
    condition: Condition;
    body: Statement;
}

export type Expression =
    | BinaryExpr
    | NumberLiteralExpr
    | VariableExpr
    | NegateExpr
    | CallExpr;

export interface BinaryExpr {
    type: 'binary';
    op: BinaryOperator;
    left: Expression;
    right: Expression;
}

export interface NumberLiteralExpr {
    type: 'number';
    value: number;
}

export interface VariableExpr {
    type: 'variable';
    name: string;
}

export interface NegateExpr {
    type: 'negate';
    operand: Expression;
}

export interface CallExpr {
    type: 'call';
    callee: string;
    args: Expression[];
}

export type ComparisonOperator = '==' | '!=' | '>=' | '<=' | '>' | '<';

export type Condition =
    | BoolLiteralCondition
    | ComparisonCondition
    | NotCondition
    | LogicalCondition;

export interface BoolLiteralCondition {
    type: 'bool';
    value: boolean;
}

export interface ComparisonCondition {
    type: 'compare';
    operator: ComparisonOperator;
    left: Expression;
    right: Expression;
}

export interface NotCondition {
    type: 'not';
    operand: Condition;
}

export interface LogicalCondition {
    type: 'and' | 'or';
    left: Condition;
    right: Condition;
}
