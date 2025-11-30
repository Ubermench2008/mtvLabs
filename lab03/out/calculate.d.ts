import { ArithmeticSemantics } from "./arith.ohm-bundle";
export declare const arithSemantics: ArithSemantics;
export interface ArithActions {
    calculate(params: {
        [name: string]: number;
    }): number;
}
export interface ArithSemantics extends ArithmeticSemantics {
    (match: import("ohm-js").MatchResult): ArithActions;
}
