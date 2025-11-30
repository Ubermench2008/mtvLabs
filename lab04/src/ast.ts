export type BinaryOperator = 'add' | 'sub' | 'mul' | 'div';

export interface BinaryExpr {
    type: 'binary';
    op: BinaryOperator;
    left: Expr;
    right: Expr;
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
    operand: Expr;
}

export type Expr = BinaryExpr | NumberLiteralExpr | VariableExpr | NegateExpr;
