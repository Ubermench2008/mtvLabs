import { BinaryOperator } from '../../lab04';

export interface SourceLocation {
    startLine: number;
    startCol: number;
    endLine: number;
    endCol: number;
}

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
    location: SourceLocation;
}

export interface ParameterDef {
    type: 'param';
    name: string;
    valueType: TypeName;
    location: SourceLocation;
}

export type Statement =
    | BlockStatement
    | AssignmentStatement
    | ConditionalStatement
    | WhileStatement;

export interface BlockStatement {
    type: 'block';
    statements: Statement[];
    location: SourceLocation;
}

export interface AssignmentStatement {
    type: 'assign';
    targets: AssignmentTarget[];
    expression: Expression;
    location: SourceLocation;
}

export type AssignmentTarget = VariableTarget | ArrayAccessTarget;

export interface VariableTarget {
    type: 'variable';
    name: string;
    location: SourceLocation;
}

export interface ArrayAccessTarget {
    type: 'arrayAccess';
    array: Expression;
    index: Expression;
    location: SourceLocation;
}

export interface ConditionalStatement {
    type: 'if';
    condition: Condition;
    thenBranch: Statement;
    elseBranch?: Statement;
    location: SourceLocation;
}

export interface WhileStatement {
    type: 'while';
    condition: Condition;
    body: Statement;
    location: SourceLocation;
}

export type Expression =
    | BinaryExpr
    | NumberLiteralExpr
    | VariableExpr
    | NegateExpr
    | CallExpr
    | ArrayAccessExpr;

export interface BinaryExpr {
    type: 'binary';
    op: BinaryOperator;
    left: Expression;
    right: Expression;
    location: SourceLocation;
}

export interface NumberLiteralExpr {
    type: 'number';
    value: number;
    location: SourceLocation;
}

export interface VariableExpr {
    type: 'variable';
    name: string;
    location: SourceLocation;
}

export interface NegateExpr {
    type: 'negate';
    operand: Expression;
    location: SourceLocation;
}

export interface CallExpr {
    type: 'call';
    callee: string;
    args: Expression[];
    location: SourceLocation;
}

export interface ArrayAccessExpr {
    type: 'arrayAccess';
    array: Expression;
    index: Expression;
    location: SourceLocation;
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
    location: SourceLocation;
}

export interface ComparisonCondition {
    type: 'compare';
    operator: ComparisonOperator;
    left: Expression;
    right: Expression;
    location: SourceLocation;
}

export interface NotCondition {
    type: 'not';
    operand: Condition;
    location: SourceLocation;
}

export interface LogicalCondition {
    type: 'and' | 'or';
    left: Condition;
    right: Condition;
    location: SourceLocation;
}
