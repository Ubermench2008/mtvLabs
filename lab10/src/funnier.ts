import {
    Module,
    FunctionDef,
    WhileStatement,
    ParameterDef,
    BoolLiteralCondition,
    ComparisonCondition,
} from 'lab08/src';

export type Predicate =
    | BoolLiteralCondition
    | ComparisonCondition
    | PredicateNot
    | PredicateLogical
    | QuantifierPredicate;

export interface PredicateNot {
    type: 'not';
    operand: Predicate;
}

export interface PredicateLogical {
    type: 'and' | 'or' | 'implies';
    left: Predicate;
    right: Predicate;
}

export interface QuantifierPredicate {
    type: 'forall' | 'exists';
    variable: ParameterDef;
    predicate: Predicate;
}

export interface AnnotatedFunctionDef extends FunctionDef {
    requires: Predicate;
    ensures: Predicate;
}

export interface AnnotatedWhileStatement extends WhileStatement {
    invariant: Predicate;
}

export interface AnnotatedModule extends Module {
    functions: AnnotatedFunctionDef[];
}

export function createBoolPredicate(value: boolean): BoolLiteralCondition {
    return { type: 'bool', value };
}
