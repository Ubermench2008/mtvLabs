import { MatchResult } from 'ohm-js';
import { ArithmeticActionDict, ArithmeticSemantics } from '../../lab03';
import { Expr } from './ast';
export declare const getExprAst: ArithmeticActionDict<Expr>;
export declare const semantics: ArithmeticSemantics;
export interface ArithSemanticsExt extends ArithmeticSemantics {
    (match: MatchResult): ArithActionsExt;
}
export interface ArithActionsExt {
    parse(): Expr;
}
export declare function parseExpr(source: string): Expr;
